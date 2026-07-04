"""
Inline Routes - Extracted from the monolithic app.py
=====================================================
This module contains all route handlers and utility functions
that were previously defined inline in app.py.
"""

import os
import sys
import json
import re
import time
import secrets
import logging
import traceback
import uuid as uuidlib
import psycopg2
import psycopg2.extras
from pathlib import Path
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, g, send_file
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, verify_jwt_in_request,
    create_access_token, create_refresh_token
)

logger = logging.getLogger(__name__)

from backend.db_utils import get_db, execute_query, DATABASE_CONFIG

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
except ImportError:
    pass

try:
    from werkzeug.utils import secure_filename
except ImportError:
    def secure_filename(fn):
        return fn


def register_inline_routes(_app, execute_query, safe_json_load, require_admin_auth, UPLOAD_FOLDER, ALLOWED_EXTENSIONS, allowed_file, MAX_FILE_SIZE):
    """Register all inline route handlers on the Flask app.
    
    This function is called from app.py after the Flask app is created.
    It attaches all the @app.route handlers that were previously defined
    inline in app.py before the modularization.
    """

    # LEGACY / DIRECT ENDPOINTS (Ported from unified_server)
    # =====================================================

    @_app.route('/api/recruiter/vacancies', methods=['GET'])
    def list_vacancies():
        """List recruiter-uploaded vacancies (Using job_postings source of truth)."""
        try:
            print("DEBUG: list_vacancies called")
            # Query job_postings instead of legacy recruiter_vacancies
            # Schema adaptation: company -> company_id
            rows = execute_query("SELECT id, title, company_id as employer, location, description, requirements, status, created_at, applications_count FROM job_postings ORDER BY created_at DESC")
            print(f"DEBUG: list_vacancies found {len(rows) if rows else 0} rows")

            result = []
            for r in rows or []:
                d = dict(r)
                # ensure json serializable
                if isinstance(d.get('created_at'), datetime):
                    d['created_at'] = d['created_at'].isoformat()

                # Add legacy fields for compatibility
                d['tags'] = []
                result.append(d)

            print(f"DEBUG: Returning {len(result)} vacancies")
            return jsonify({'success': True, 'data': result}), 200
        except Exception as e:
            logger.error(f"List vacancies error: {str(e)}")
            # Fallback to empty list rather than error if migration issue
            return jsonify({'success': True, 'data': []}), 200

    @_app.route('/api/recruiter/jobs/<job_id>/applicants', methods=['GET'])
    def get_job_applicants(job_id):
        """Get applicants for a specific job (Robust ID handling)"""
        try:
            print(f"DEBUG: get_job_applicants CALLED for job_id={job_id}")
            # Use args for GET request
            employment_status_filter = request.args.get('employment_status_filter')

            # Get the job description details (Verify job exists)
            # We need to map numeric ID 756 -> UUID JD_ID
            jd_id_param = job_id

            # Dual-lookup for job_id (Support both Numeric ID and JD_ID string)
            # This fixes the issue where Frontend sends '756' but DB apps are linked to 'JD...'
            # Duplicate query definition removed

            # Note: Previous query in unified_server joined job_applications implicitly via WHERE ja.job_id.
            # But here I need to JOIN it explicitly to filter bye job_id.
            # Wait, unified_server query structure in Step 2382 was:
            # FROM user_cvs uc ... WHERE ...
            # AND ja.job_id = ...
            # It missed the JOIN table `job_applications` in the FROM clause!
            # Step 2382 Line 3100 shows `FROM user_cvs uc`.
            # Line 3130 shows `candidate_query += " AND ja.job_id..."`.
            # Unless `unified_server` had `FROM job_applications ja ...` higher up?
            # Step 2382 view started at `candidate_query = """ SELECT ... FROM user_cvs uc ...`
            # It did NOT have `FROM job_applications`.
            # This means the original `unified_server` query WAS BROKEN (Missing Table Reference).
            # My clean-up here MUST fix it.
            # Logic: We want Applicants. So start from `job_applications`.


            candidate_query = """
                SELECT DISTINCT ON (ja.id)
                    ja.id as application_id,
                    ja.candidate_id,
                    ja.applied_at as submitted_at,
                    ja.status as application_status,
                    uc.id as cv_id,
                    uc.user_id,
                    uc.personal_info,
                    uc.professional_summary,
                    uc.technical_skills,
                    uc.soft_skills,
                    uc.work_experience,
                    uc.education,
                    uc.certifications,
                    u.first_name,
                    u.last_name,
                    CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
                    u.email
                FROM job_applications ja
                LEFT JOIN users u ON ja.candidate_id = u.id
                LEFT JOIN user_cvs uc ON u.id = uc.user_id
                WHERE 1=1
            """

            params = []

            # job_applications.job_id is TEXT after migration; cast both sides
            candidate_query += " AND ja.job_id = %s"
            params.append(str(job_id))

            # if employment_status_filter:
            #     candidate_query += " AND (u.employment_status = %s OR u.employment_status IS NULL)"
            #     params.append(employment_status_filter)

            # DISTINCT ON requires the first ORDER BY columns to match the DISTINCT columns
            # We want unique applications (ja.id), picking the latest CV (uc.created_at DESC)
            candidate_query += " ORDER BY ja.id, uc.created_at DESC"

            print(f"DEBUG: Executing Query. Params: {params}")
            candidates = execute_query(candidate_query, tuple(params)) or []
            print(f"DEBUG: Query returned {len(candidates)} unique candidates.")

            # Fetch job requirements to calculate match scores
            job_query = """
                SELECT title, required_skills, preferred_skills, experience_level, education_requirements
                FROM job_postings WHERE id = %s
            """
            job_data = execute_query(job_query, (job_id,), fetch_one=True)

            # Calculate match scores for each candidate
            def calculate_match_score(candidate, job):
                if not job:
                    return 50.0  # Default score if job data unavailable

                score = 0.0
                max_score = 0.0

                # Parse job required skills (handle JSON or comma-separated)
                required_skills = job.get('required_skills') or []
                if isinstance(required_skills, str):
                    try:
                        import json
                        required_skills = json.loads(required_skills)
                    except:
                        required_skills = [s.strip().lower() for s in required_skills.split(',') if s.strip()]
                if isinstance(required_skills, list):
                    required_skills = [s.lower() if isinstance(s, str) else str(s).lower() for s in required_skills]

                # Get candidate skills
                candidate_tech_skills = candidate.get('technical_skills') or []
                candidate_soft_skills = candidate.get('soft_skills') or []
                if isinstance(candidate_tech_skills, str):
                    try:
                        import json
                        candidate_tech_skills = json.loads(candidate_tech_skills)
                    except:
                        candidate_tech_skills = [s.strip().lower() for s in candidate_tech_skills.split(',') if s.strip()]
                if isinstance(candidate_soft_skills, str):
                    try:
                        import json
                        candidate_soft_skills = json.loads(candidate_soft_skills)
                    except:
                        candidate_soft_skills = [s.strip().lower() for s in candidate_soft_skills.split(',') if s.strip()]

                all_candidate_skills = set()
                for s in (candidate_tech_skills or []):
                    if isinstance(s, str):
                        all_candidate_skills.add(s.lower())
                    elif isinstance(s, dict):
                        all_candidate_skills.add(str(s.get('name', s.get('skill', ''))).lower())
                for s in (candidate_soft_skills or []):
                    if isinstance(s, str):
                        all_candidate_skills.add(s.lower())
                    elif isinstance(s, dict):
                        all_candidate_skills.add(str(s.get('name', s.get('skill', ''))).lower())

                # Calculate skill match (60% of total score)
                if required_skills:
                    max_score += 60
                    matched_skills = 0
                    for req_skill in required_skills:
                        req_lower = req_skill.lower() if isinstance(req_skill, str) else str(req_skill).lower()
                        # Check if any candidate skill contains or matches the required skill
                        for cand_skill in all_candidate_skills:
                            if req_lower in cand_skill or cand_skill in req_lower:
                                matched_skills += 1
                                break
                    if len(required_skills) > 0:
                        score += (matched_skills / len(required_skills)) * 60
                else:
                    # No required skills specified, give baseline score
                    score += 40
                    max_score += 60

                # Experience bonus (20% of total score)
                max_score += 20
                work_experience = candidate.get('work_experience') or []
                if work_experience:
                    # More experience = higher score (max 5 positions)
                    exp_count = len(work_experience) if isinstance(work_experience, list) else 0
                    score += min(exp_count / 5, 1.0) * 20

                # Education bonus (20% of total score)
                max_score += 20
                education = candidate.get('education') or []
                if education:
                    # Having education = bonus
                    score += 15
                    # Check for advanced degrees
                    for edu in (education if isinstance(education, list) else []):
                        degree = str(edu.get('degree', '')).lower() if isinstance(edu, dict) else ''
                        if 'master' in degree or 'phd' in degree or 'mba' in degree:
                            score += 5
                            break

                # Normalize to percentage
                if max_score > 0:
                    final_score = min((score / max_score) * 100, 100)
                else:
                    final_score = 50.0

                return round(final_score, 1)

            # Add match scores and sort by score DESC
            for candidate in candidates:
                candidate['match_score'] = calculate_match_score(candidate, job_data)

            # Sort by match score (highest first), then by submitted_at
            candidates.sort(key=lambda x: (x.get('match_score', 0), x.get('submitted_at') or ''), reverse=True)

            # Mark 'new' applicants as viewed (clears the "New" badge)
            # Update status from 'pending'/'submitted' to 'under_review' when recruiter views them
            try:
                update_query = """
                    UPDATE job_applications
                    SET status = 'under_review'
                    WHERE job_id = %s
                    AND status IN ('pending', 'submitted')
                """
                execute_query(update_query, (job_id,), fetch_all=False)
                print(f"DEBUG: Updated new applicants to 'under_review' for job_id={job_id}")
            except Exception as update_err:
                logger.warning(f"Failed to update applicant status to viewed: {update_err}")
                print(f"DEBUG: Status update FAILED: {update_err}")
                # Don't fail the request if status update fails

            return jsonify({
                'success': True,
                'top_matches': [dict(c) for c in candidates],
                'candidates': [dict(c) for c in candidates],
                'count': len(candidates)
            }), 200

        except Exception as e:
            logger.error(f"Get job applicants error: {str(e)}")
            traceback.print_exc()
            return jsonify({'success': False, 'message': 'Failed to get applicants'}), 500







    # =====================================================
    # UTILITY FUNCTIONS
    # =====================================================

    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    def require_admin_auth(f):
        """Decorator to require admin authentication via JWT verification."""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 1. Extract Bearer token
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return jsonify({
                    'success': False,
                    'error': 'Authentication required. Provide a valid Bearer token.'
                }), 401

            token = auth_header.replace('Bearer ', '', 1)

            # 2. Decode and verify JWT (checks signature + expiry)
            try:
                from flask_jwt_extended import decode_token
                decoded = decode_token(token)
                user_id = decoded.get('sub')
                if not user_id:
                    return jsonify({
                        'success': False,
                        'error': 'Invalid token: missing identity.'
                    }), 401
            except Exception as e:
                logger.warning(f"Admin auth token verification failed: {e}")
                return jsonify({
                    'success': False,
                    'error': 'Invalid or expired token.'
                }), 401

            # 3. Look up the user's REAL role from the database ΓÇö never trust client headers
            try:
                user_row = execute_query(
                    "SELECT id, email, role FROM users WHERE id = %s",
                    (user_id,), fetch_one=True
                )
                if not user_row:
                    return jsonify({
                        'success': False,
                        'error': 'User not found.'
                    }), 401

                user_role = (user_row.get('role') or '').strip()
                if user_role not in ADMIN_ROLES:
                    return jsonify({
                        'success': False,
                        'error': 'Insufficient privileges. Admin access required.'
                    }), 403
            except Exception as e:
                logger.error(f"Admin auth DB lookup failed: {e}")
                return jsonify({
                    'success': False,
                    'error': 'Authentication service error.'
                }), 500

            # 4. Attach verified admin user info to the request context
            request.admin_user = {
                'email': user_row.get('email', 'unknown'),
                'roles': [user_role],
                'user_id': user_id
            }

            return f(*args, **kwargs)
        return decorated_function

    def log_admin_action(action: str, provider_id: str, details: str, status: str = 'success'):
        """Log administrative actions for audit trail."""
        log_entry = {
            'id': f"log_{int(time.time())}_{secrets.token_hex(4)}",
            'timestamp': datetime.now().isoformat(),
            'user': getattr(request, 'admin_user', {}).get('email', 'unknown'),
            'action': action,
            'provider_id': provider_id,
            'details': details,
            'status': status,
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'unknown')
        }

        admin_audit_logs.append(log_entry)

        # Keep only last 1000 logs in memory
        if len(admin_audit_logs) > 1000:
            admin_audit_logs.pop(0)

        logger.info(f"Admin action logged: {action} on {provider_id}")

    def ensure_fallback_schools_exist():
        """Ensure fallback schools exist in database for form functionality"""
        try:
            fallback_schools = [
                {
                    'id': '550e8400-e29b-41d4-a716-446655440001',
                    'name_en': 'Dubai International Academy',
                    'name_ar': '╪ú┘â╪º╪»┘è┘à┘è╪⌐ ╪»╪¿┘è ╪º┘ä╪»┘ê┘ä┘è╪⌐',
                    'code': 'DIA001',
                    'location': 'Dubai'
                },
                {
                    'id': '550e8400-e29b-41d4-a716-446655440002',
                    'name_en': 'GEMS Wellington Academy',
                    'name_ar': '╪ú┘â╪º╪»┘è┘à┘è╪⌐ ╪¼┘è┘à╪│ ┘ê┘è┘ä┘è┘å╪║╪¬┘ê┘å',
                    'code': 'GWA002',
                    'location': 'Dubai'
                },
                {
                    'id': '550e8400-e29b-41d4-a716-446655440003',
                    'name_en': 'American School of Dubai',
                    'name_ar': '╪º┘ä┘à╪»╪▒╪│╪⌐ ╪º┘ä╪ú┘à╪▒┘è┘â┘è╪⌐ ┘ü┘è ╪»╪¿┘è',
                    'code': 'ASD003',
                    'location': 'Dubai'
                }
            ]

            for school in fallback_schools:
                # Check if school exists
                check_query = "SELECT id FROM schools WHERE id = %s"
                existing = execute_query(check_query, (school['id'],), fetch_one=True)

                if not existing:
                    # Insert school if it doesn't exist
                    insert_query = """
                        INSERT INTO schools (id, name_en, name_ar, code, location, district, is_active)
                        VALUES (%s::uuid, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO NOTHING
                    """
                    execute_query(insert_query, (
                        school['id'], school['name_en'], school['name_ar'],
                        school['code'], school['location'], school['location'], True
                    ), fetch_all=False)
                    logger.info(f"Inserted fallback school: {school['name_en']}")

        except Exception as e:
            logger.error(f"Error ensuring fallback schools: {e}")

    # =====================================================
    # CV TABLE INITIALIZATION
    # =====================================================

    def ensure_cv_tables_exist():
        """Create required tables/indexes for CV persistence if they don't exist"""
        try:
            # user_cvs table
            execute_query(
                """
                CREATE TABLE IF NOT EXISTS user_cvs (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL,
                    title TEXT NOT NULL,
                    template_name TEXT,
                    personal_info JSONB,
                    professional_summary TEXT,
                    technical_skills JSONB,
                    soft_skills JSONB,
                    work_experience JSONB,
                    education JSONB,
                    cv_score INTEGER DEFAULT 0,
                    ats_score INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'draft',
                    is_visible BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    last_accessed_at TIMESTAMPTZ
                )
                """,
            )

            # Migration: Ensure is_visible column exists
            execute_query(
                "ALTER TABLE user_cvs ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT FALSE",
                fetch_all=False
            )

            # cv_versions table
            execute_query(
                """
                CREATE TABLE IF NOT EXISTS cv_versions (
                    id UUID PRIMARY KEY,
                    cv_id UUID REFERENCES user_cvs(id) ON DELETE CASCADE,
                    version_number INTEGER,
                    cv_data JSONB,
                    change_summary TEXT,
                    created_by UUID,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """,
                fetch_all=False
            )

            # cv_analytics table
            execute_query(
                """
                CREATE TABLE IF NOT EXISTS cv_analytics (
                    analytics_id UUID PRIMARY KEY,
                    cv_id UUID REFERENCES user_cvs(id) ON DELETE CASCADE,
                    user_id UUID,
                    event_type TEXT,
                    event_data JSONB,
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """,
                fetch_all=False
            )

            # indexes
            execute_query(
                """
                CREATE INDEX IF NOT EXISTS idx_user_cvs_user_id ON user_cvs (user_id);
                """,
                fetch_all=False
            )
            # unique visible per user (partial index)
            execute_query(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS idx_user_visible_cv_unique ON user_cvs (user_id) WHERE is_visible = TRUE;
                """,
                fetch_all=False
            )
            logger.info("Γ£à CV tables ensured")
        except Exception as e:
            logger.error(f"Error ensuring CV tables: {e}")



    # =====================================================
    # VACANCY TABLE INITIALIZATION
    # =====================================================

    def ensure_vacancy_tables_exist():
        """Create recruiter vacancies table for matching."""
        try:
            execute_query(
                """
                CREATE TABLE IF NOT EXISTS recruiter_vacancies (
                    id UUID PRIMARY KEY,
                    title TEXT NOT NULL,
                    employer TEXT,
                    location TEXT,
                    description TEXT,
                    requirements JSONB,
                    tags JSONB,
                    posted_by UUID,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
                """,
                fetch_all=False
            )
            execute_query(
                """
                CREATE INDEX IF NOT EXISTS idx_vacancies_created ON recruiter_vacancies (created_at DESC);
                """,
                fetch_all=False
            )
            # Seed mock vacancies if table is empty
            count = execute_query("SELECT COUNT(*) AS cnt FROM recruiter_vacancies", fetch_one=True)
            if not count or int(count.get('cnt', 0)) == 0:
                import random
                samples = [
                    {
                        'title': 'Software Engineer',
                        'employer_admin': 'Emirates Tech',
                        'location': 'Dubai, UAE',
                        'description': 'Build and maintain web applications in React and Node.js.',
                        'requirements': ['react', 'node', 'typescript', 'api'],
                        'tags': ['tech', 'web']
                    },
                    {
                        'title': 'Data Analyst',
                        'employer_admin': 'Dubai Analytics Lab',
                        'location': 'Dubai, UAE',
                        'description': 'Analyze datasets and build BI dashboards.',
                        'requirements': ['sql', 'python', 'excel'],
                        'tags': ['analytics']
                    },
                    {
                        'title': 'IT Security Specialist',
                        'employer_admin': 'Zayed University',
                        'location': 'Abu Dhabi, UAE',
                        'description': 'Implement security policies and monitor incidents.',
                        'requirements': ['security', 'siem', 'network'],
                        'tags': ['security']
                    },
                    {
                        'title': 'Project Manager',
                        'employer_admin': 'ADNOC',
                        'location': 'Abu Dhabi, UAE',
                        'description': 'Lead cross-functional projects and deliver on time.',
                        'requirements': ['project management', 'communications'],
                        'tags': ['management']
                    },
                    {
                        'title': 'Mobile App Developer',
                        'employer_admin': 'Careem',
                        'location': 'Dubai, UAE',
                        'description': 'Develop and maintain mobile applications.',
                        'requirements': ['flutter', 'kotlin', 'swift'],
                        'tags': ['mobile']
                    },
                    {
                        'title': 'Cloud Engineer',
                        'employer_admin': 'Etisalat',
                        'location': 'Abu Dhabi, UAE',
                        'description': 'Manage cloud infrastructure and CI/CD.',
                        'requirements': ['aws', 'docker', 'kubernetes'],
                        'tags': ['cloud']
                    },
                    {
                        'title': 'Business Analyst',
                        'employer_admin': 'Dubai Tourism',
                        'location': 'Dubai, UAE',
                        'description': 'Gather requirements and document business processes.',
                        'requirements': ['requirements', 'process mapping'],
                        'tags': ['business']
                    },
                    {
                        'title': 'AI Researcher',
                        'employer_admin': 'Mohammed bin Zayed University of AI',
                        'location': 'Abu Dhabi, UAE',
                        'description': 'Research AI models and publish results.',
                        'requirements': ['python', 'ml', 'deep learning'],
                        'tags': ['ai']
                    },
                    {
                        'title': 'Frontend Developer',
                        'employer_admin': 'Noon',
                        'location': 'Dubai, UAE',
                        'description': 'Build responsive UIs in React/Vue.',
                        'requirements': ['react', 'html', 'css'],
                        'tags': ['frontend']
                    },
                    {
                        'title': 'Backend Developer',
                        'employer_admin': 'Talabat',
                        'location': 'Dubai, UAE',
                        'description': 'Design REST APIs and microservices.',
                        'requirements': ['node', 'java', 'rest'],
                        'tags': ['backend']
                    }
                ]
                # generate 20 by repeating with slight variations
                to_insert = []
                for i in range(20):
                    base = samples[i % len(samples)].copy()
                    base['title'] = f"{base['title']} ({i+1})"
                    base['id'] = str(uuidlib.uuid4())
                    to_insert.append(base)
                for v in to_insert:
                    execute_query(
                        """
                        INSERT INTO recruiter_vacancies (id, title, employer, location, description, requirements, tags)
                        VALUES (%s::uuid, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
                        """,
                        (
                            v['id'], v['title'], v.get('employer_admin'), v.get('location'), v.get('description'),
                            json.dumps(v.get('requirements', [])), json.dumps(v.get('tags', []))
                        ),
                        fetch_all=False
                    )
                logger.info("Γ£à Seeded 20 mock vacancies")

            logger.info("Γ£à Vacancy tables ensured")
        except Exception as e:
            logger.error(f"Error ensuring vacancy tables: {e}")


    # =====================================================
    # APPLICATION TABLE INITIALIZATION
    # =====================================================

    def ensure_application_tables_exist():
        """Create job applications table if it doesn't exist."""
        try:
            execute_query(
                """
                CREATE TABLE IF NOT EXISTS job_applications (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    candidate_id TEXT NOT NULL,
                    cover_letter TEXT,
                    additional_documents JSONB,
                    expected_salary TEXT,
                    availability_date TEXT,
                    status TEXT DEFAULT 'submitted',
                    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    interview_date TIMESTAMPTZ,
                    interview_type TEXT
                )
                """,
                fetch_all=False
            )
            execute_query(
                """
                CREATE INDEX IF NOT EXISTS idx_applications_candidate ON job_applications (candidate_id);
                """,
                fetch_all=False
            )
            # Unique application per candidate per job
            execute_query(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS idx_app_unique_candidate_job ON job_applications (candidate_id, job_id);
                """,
                fetch_all=False
            )
            logger.info("Γ£à Job Application tables ensured")
        except Exception as e:
            logger.error(f"Error ensuring application tables: {e}")

    # =====================================================
    # CV PARSING UTILITIES
    # =====================================================

    def extract_text_from_pdf(file_stream):
        """Extract text from PDF file using pdfplumber for superior layout handling"""
        try:
            # Reset stream position
            file_stream.seek(0)

            if not pdfplumber:
                logger.error("pdfplumber not available")
                return ""

            with pdfplumber.open(file_stream) as pdf:
                if len(pdf.pages) == 0:
                    logger.error("PDF has no pages")
                    return ""

                text = ""
                for i, page in enumerate(pdf.pages):
                    try:
                        page_text = page.extract_text()

                        if page_text:
                            page_text = fix_encoding_issues(page_text)
                            text += page_text + "\n"
                            logger.debug(f"Page {i+1}: extracted {len(page_text)} characters")

                        # Also extract table data
                        tables = page.extract_tables()
                        for table in tables:
                            for row in table:
                                if row:
                                    row_text = ' | '.join([cell or '' for cell in row])
                                    if row_text.strip():
                                        text += row_text + "\n"

                    except Exception as page_error:
                        logger.warning(f"Error extracting page {i+1}: {page_error}")
                        continue

                extracted_text = text.strip()
                logger.info(f"PDF extraction complete: {len(extracted_text)} total characters from {len(pdf.pages)} pages")
                return extracted_text

        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            import traceback
            logger.error(f"PDF extraction traceback: {traceback.format_exc()}")
            return ""

    def fix_encoding_issues(text):
        """Fix common PDF encoding issues and strange characters"""
        if not text:
            return text

        # Common encoding fixes
        encoding_fixes = {
            # Fix common PDF encoding issues
            '├ÿ=├£├º': '',  # Remove these strange character sequences
            '├ÿ=├£├▒': '',
            '├ÿ=├£├ì': '',
            '├ÿ=├£': '',
            '├£├º': '',
            '├£├▒': '',
            '├£├ì': '',
            # Fix bullet points and symbols
            'ΓÇó': 'ΓÇó',
            'ΓÇô': '-',
            'ΓÇö': '-',
            # Fix quotes
            '"': '"',
            '"': '"',
            ''': "'",
            ''': "'",
            # Fix common Arabic/English mixed encoding issues
            '├ÿ': '',
            '├£': '',
            '├º': '',
            '├▒': '',
            '├ì': '',
        }

        # Apply fixes
        for old_char, new_char in encoding_fixes.items():
            text = text.replace(old_char, new_char)

        # Clean up multiple spaces and newlines
        import re
        text = re.sub(r'\s+', ' ', text)  # Replace multiple whitespace with single space
        text = re.sub(r'\n\s*\n', '\n', text)  # Remove empty lines

        return text.strip()

    def extract_text_from_docx(file_stream):
        """Extract text from DOCX file"""
        try:
            doc = Document(file_stream)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            return ""

    def extract_text_from_file(file):
        """Extract text from uploaded file based on type"""
        try:
            # Read file content into memory
            file_content = file.read()
            file.seek(0)  # Reset file pointer for saving

            if not file_content:
                logger.error("File is empty or could not be read")
                return ""

            file_stream = io.BytesIO(file_content)

            if file.content_type == 'application/pdf':
                return extract_text_from_pdf(file_stream)
            elif file.content_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
                return extract_text_from_docx(file_stream)
            elif file.content_type == 'text/plain':
                return file_content.decode('utf-8')
            else:
                logger.warning(f"Unsupported file type: {file.content_type}")
                return ""
        except Exception as e:
            logger.error(f"Error in extract_text_from_file: {e}")
            return ""

    def parse_cv_with_gemini(cv_text: str) -> dict:
        """Parse CV text using Qwen / DashScope (migrated from Gemini)"""
        try:
            from backend.services.qwen_client import chat_completion
            from backend.config.qwen_config import DASHSCOPE_API_KEY

            if not DASHSCOPE_API_KEY:
                logger.warning("DASHSCOPE_API_KEY not found, using mock data")
                return None

            # Enhanced prompt for UAE job market
            prompt = f"""Analyze this CV/Resume text and extract structured information for the UAE job market.
Focus on UAE-specific context, Arabic names, local companies, and regional experience.

CV Text:
{cv_text[:15000]}

Please extract and return a JSON object with the following structure:
{{
  "personal_info": {{
    "name": "Full name (preserve Arabic if present)",
    "email": "email address",
    "phone": "phone number (UAE format preferred)",
    "location": "city, country",
    "nationality": "nationality if mentioned",
    "visa_status": "visa status if mentioned"
  }},
  "professional_summary": "Brief professional summary",
  "experience_years": "total years of experience (number)",
  "skills": {{
    "technical": ["list of technical skills"],
    "soft": ["list of soft skills"],
    "languages": ["list of languages with proficiency"]
  }},
  "experience": [
    {{
      "job_title": "position title",
      "company": "company name",
      "location": "work location",
      "start_date": "start date",
      "end_date": "end date or current",
      "duration": "duration in months",
      "responsibilities": "key responsibilities"
    }}
  ],
  "education": [
    {{
      "degree": "degree name",
      "institution": "institution name",
      "location": "education location",
      "graduation_year": "year",
      "field": "field of study"
    }}
  ],
  "certifications": ["list of certifications"],
  "job_matches": [
    {{
      "title": "suggested job title",
      "company_type": "type of company (government/private/startup)",
      "match_score": "match percentage (0-100)",
      "alignment": "D33/Talent33 alignment",
      "salary_range": "AED salary range",
      "location": "UAE location"
    }}
  ],
  "recommendations": [
    "specific recommendations for UAE job market",
    "suggestions for skill enhancement",
    "cultural fit improvements"
  ],
  "uae_context": {{
    "local_experience": "years of UAE experience",
    "arabic_proficiency": "Arabic language level",
    "cultural_alignment": "cultural fit score (0-100)",
    "government_sector_fit": "fit for government roles (0-100)",
    "private_sector_fit": "fit for private sector (0-100)"
  }}
}}

Return only the JSON object, no additional text."""

            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are an expert CV/Resume parser for the UAE job market. "
                        "Extract structured information and return ONLY raw, valid JSON. "
                        "No markdown, no code fences, no explanatory text."
                    ),
                },
                {"role": "user", "content": prompt},
            ]

            parsed_data = chat_completion(
                task_type="parse",
                messages=messages,
                response_format={"type": "json_object"},
            )

            logger.info("✅ Qwen CV parsing successful")
            return parsed_data

        except Exception as e:
            logger.error(f"Gemini CV parsing fatal error: {e}")
            raise e

    # =====================================================
    # MATCHING UTILITIES
    # =====================================================

    def _tokenize(text: str) -> set:
        try:
            import re
            words = re.findall(r"[A-Za-z0-9_\-\+]+", (text or '').lower())
            return set(words)
        except Exception:
            return set()

    STOPWORDS = {
        'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
        'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'that', 'this', 'these', 'those',
        'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
        'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
        'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
        'can', 'will', 'just', 'don', 'should', 'now',
        'work', 'team', 'role', 'job', 'position', 'experience', 'skills', 'responsibilities',
        'requirements', 'qualifications', 'duties', 'company', 'business', 'organization'
    }

    def _collect_cv_keywords(cv_row: dict) -> dict:
        personal_info = safe_json_load(cv_row.get('personal_info'), {})
        prof = cv_row.get('professional_summary') or ''
        tech = safe_json_load(cv_row.get('technical_skills'), [])
        soft = safe_json_load(cv_row.get('soft_skills'), [])
        experience = safe_json_load(cv_row.get('work_experience'), [])
        edu = safe_json_load(cv_row.get('education'), [])

        skill_words = set([s.lower() for s in tech + soft if isinstance(s, str)])
        summary_words = _tokenize(prof) - STOPWORDS
        exp_words = set()
        for e in experience:
            exp_words |= (_tokenize((e.get('responsibilities') or '') + ' ' + (e.get('jobTitle') or e.get('job_title') or '')) - STOPWORDS)
        edu_words = set()
        for e in edu:
            edu_words |= (_tokenize((e.get('degree') or '') + ' ' + (e.get('field') or e.get('field_of_study') or '')) - STOPWORDS)

        return {
            'skills': skill_words,
            'text': summary_words | exp_words | edu_words,
            'location': (personal_info.get('location') or '').lower()
        }

    def _vacancy_keywords(v: dict) -> dict:
        desc = (v.get('description') or '')
        title = (v.get('title') or '')
        tags = safe_json_load(v.get('tags'), [])
        req = safe_json_load(v.get('requirements'), [])

        # Extract distinct skills from requirements (which might be strings or dicts)
        skills = set()
        for r in req:
            if isinstance(r, str):
                skills.add(r.lower())
            elif isinstance(r, dict):
                # Extract from 'description' or 'name' field
                val = r.get('description') or r.get('name') or ''
                if val:
                    skills.add(val.lower())

        # Also process tags
        for t in tags:
            if isinstance(t, str):
                 skills.add(t.lower())

        return {
            'text': (_tokenize(desc + ' ' + title) | skills) - STOPWORDS, # Include skills in text for broader match
            'skills': skills,
            'location': (v.get('location') or '').lower()
        }

    def _compute_match_score(cvk: dict, vk: dict) -> int:
        # Updated heuristic: skills 60 (more weight), text 30 (less weight), location 10
        skill_overlap = len(cvk['skills'] & vk['skills'])
        skill_total = max(1, len(vk['skills']))
        skill_score = 60 * (skill_overlap / skill_total)

        text_overlap = len(cvk['text'] & vk['text'])
        text_total = max(1, len(vk['text']))
        text_score = 30 * (text_overlap / text_total)

        loc_score = 10 if (cvk['location'] and cvk['location'] in vk['location']) else 0

        return int(round(min(100, skill_score + text_score + loc_score)))

    # =====================================================
    # PDF GENERATION UTILITIES
    # =====================================================

    def get_template_styles(template_style: str):
        """Get template-specific styles and colors"""
        templates = {
            'government-executive': {
                'primary_color': '#1e40af',  # Blue
                'secondary_color': '#374151',  # Gray
                'accent_color': '#059669',  # Green
                'font_size_title': 26,
                'font_size_heading': 18,
                'layout': 'traditional'
            },
            'tech-innovator': {
                'primary_color': '#7c3aed',  # Purple
                'secondary_color': '#1f2937',  # Dark gray
                'accent_color': '#0891b2',  # Cyan
                'font_size_title': 24,
                'font_size_heading': 16,
                'layout': 'modern'
            },
            'business-leader': {
                'primary_color': '#059669',  # Green
                'secondary_color': '#374151',  # Gray
                'accent_color': '#dc2626',  # Red
                'font_size_title': 25,
                'font_size_heading': 17,
                'layout': 'executive'
            },
            'professional': {
                'primary_color': '#1e40af',  # Blue
                'secondary_color': '#374151',  # Gray
                'accent_color': '#059669',  # Green
                'font_size_title': 24,
                'font_size_heading': 16,
                'layout': 'standard'
            }
        }

        return templates.get(template_style, templates['professional'])

    def generate_cv_pdf(cv_data: dict, template_style: str = 'professional') -> str:
        """Generate PDF from CV data using ReportLab"""
        try:
            # Create PDF file path
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pdf_filename = f"cv_{timestamp}.pdf"
            pdf_path = UPLOAD_FOLDER / pdf_filename

            # Create PDF document
            doc = SimpleDocTemplate(str(pdf_path), pagesize=A4,
                                   rightMargin=72, leftMargin=72,
                                   topMargin=72, bottomMargin=18)

            # Get template-specific styles
            template_config = get_template_styles(template_style)
            logger.info(f"≡ƒÄ¿ Generating PDF with template: {template_style}")
            logger.info(f"≡ƒÄ¿ Template config: {template_config}")
            styles = getSampleStyleSheet()

            # Custom styles based on template
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=template_config['font_size_title'],
                spaceAfter=12,
                alignment=TA_CENTER,
                textColor=colors.HexColor(template_config['primary_color']),
                fontName='Helvetica-Bold'
            )

            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=template_config['font_size_heading'],
                spaceAfter=6,
                spaceBefore=12,
                textColor=colors.HexColor(template_config['secondary_color']),
                fontName='Helvetica-Bold'
            )

            # Add accent style for highlights
            accent_style = ParagraphStyle(
                'AccentStyle',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor(template_config['accent_color']),
                fontName='Helvetica-Bold'
            )

            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontSize=11,
                spaceAfter=6,
                alignment=TA_LEFT
            )

            # Build PDF content
            content = []

            # Header - Personal Information
            personal_info = cv_data.get('personalInfo', {})
            name = f"{personal_info.get('firstName', '')} {personal_info.get('lastName', '')}"
            content.append(Paragraph(name, title_style))

            # Contact information with template-specific styling
            contact_info = []
            if personal_info.get('email'):
                contact_info.append(f"≡ƒôº {personal_info['email']}")
            if personal_info.get('phone'):
                contact_info.append(f"≡ƒô▒ {personal_info['phone']}")
            if personal_info.get('location'):
                contact_info.append(f"≡ƒôì {personal_info['location']}")

            if contact_info:
                contact_style = ParagraphStyle(
                    'ContactStyle',
                    parent=body_style,
                    alignment=TA_CENTER,
                    textColor=colors.HexColor(template_config['secondary_color'])
                )
                content.append(Paragraph(" ΓÇó ".join(contact_info), contact_style))

            content.append(Spacer(1, 12))

            # Professional Summary
            if cv_data.get('professionalSummary'):
                content.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
                content.append(Paragraph(cv_data['professionalSummary'], body_style))
                content.append(Spacer(1, 12))

            # Technical Skills
            if cv_data.get('technicalSkills'):
                content.append(Paragraph("TECHNICAL SKILLS", heading_style))
                skills_text = " ΓÇó ".join(cv_data['technicalSkills'])
                content.append(Paragraph(skills_text, body_style))
                content.append(Spacer(1, 12))

            # Soft Skills
            if cv_data.get('softSkills'):
                content.append(Paragraph("SOFT SKILLS", heading_style))
                skills_text = " ΓÇó ".join(cv_data['softSkills'])
                content.append(Paragraph(skills_text, body_style))
                content.append(Spacer(1, 12))

            # Work Experience with template-specific styling
            if cv_data.get('experience'):
                content.append(Paragraph("WORK EXPERIENCE", heading_style))
                for exp in cv_data['experience']:
                    # Job title and company with accent color
                    job_title_style = ParagraphStyle(
                        'JobTitleStyle',
                        parent=body_style,
                        fontSize=12,
                        textColor=colors.HexColor(template_config['primary_color']),
                        fontName='Helvetica-Bold'
                    )
                    job_header = f"<b>{exp.get('jobTitle', '')}</b>"
                    content.append(Paragraph(job_header, job_title_style))

                    # Company with secondary color
                    company_style = ParagraphStyle(
                        'CompanyStyle',
                        parent=body_style,
                        fontSize=11,
                        textColor=colors.HexColor(template_config['secondary_color']),
                        fontName='Helvetica-Bold'
                    )
                    content.append(Paragraph(exp.get('company', ''), company_style))

                    # Dates and location with accent color
                    date_location = f"{exp.get('startDate', '')} - {exp.get('endDate', '')} ΓÇó {exp.get('location', '')}"
                    content.append(Paragraph(date_location, accent_style))

                    # Responsibilities
                    if exp.get('responsibilities'):
                        content.append(Paragraph(exp['responsibilities'], body_style))

                    content.append(Spacer(1, 8))

            # Education with template-specific styling
            if cv_data.get('education'):
                content.append(Paragraph("EDUCATION", heading_style))
                for edu in cv_data['education']:
                    # Degree with primary color
                    degree_style = ParagraphStyle(
                        'DegreeStyle',
                        parent=body_style,
                        fontSize=12,
                        textColor=colors.HexColor(template_config['primary_color']),
                        fontName='Helvetica-Bold'
                    )
                    content.append(Paragraph(f"<b>{edu.get('degree', '')}</b>", degree_style))

                    # Institution with secondary color
                    institution_style = ParagraphStyle(
                        'InstitutionStyle',
                        parent=body_style,
                        fontSize=11,
                        textColor=colors.HexColor(template_config['secondary_color']),
                        fontName='Helvetica-Bold'
                    )
                    content.append(Paragraph(edu.get('institution', ''), institution_style))

                    # Field and year with accent color
                    field_year = f"{edu.get('field', '')} ΓÇó Graduated: {edu.get('graduationYear', '')}"
                    content.append(Paragraph(field_year, accent_style))
                    content.append(Spacer(1, 8))

            # Build PDF
            doc.build(content)

            logger.info(f"Γ£à PDF generated successfully: {pdf_path}")
            return pdf_filename

        except Exception as e:
            logger.error(f"PDF generation error: {e}")
            import traceback
            logger.error(f"PDF generation traceback: {traceback.format_exc()}")
            return None

    # ----- Admin Provider Management Data -----
    admin_providers = {}
    admin_configurations = {}

    PROVIDER_TEMPLATES = {
        'dashscope-qwen': {
            'id': 'dashscope-qwen',
            'name': 'Alibaba DashScope (Qwen)',
            'category': 'LLM',
            'description': 'High-performance Qwen LLM via DashScope OpenAI-compatible API',
            'endpoint': 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
            'models': ['qwen-turbo', 'qwen-plus', 'qwen-max'],
            'default_model': 'qwen-plus',
            'config_schema': {
                'api_key': {'type': 'string', 'required': True, 'sensitive': True},
                'endpoint': {'type': 'string', 'required': True},
                'model': {'type': 'string', 'required': True},
                'temperature': {'type': 'float', 'default': 0.3, 'min': 0.0, 'max': 2.0},
                'max_tokens': {'type': 'integer', 'default': 4096, 'min': 1, 'max': 32768},
            }
        },
        'groq-llama4': {
            'id': 'groq-llama4',
            'name': 'Groq (Llama 4 Scout)',
            'category': 'LLM',
            'description': 'High-performance LLM inference with Llama 4 Scout model',
            'endpoint': 'https://api.groq.com/openai/v1',
            'models': ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
            'default_model': 'llama-3.1-70b-versatile',
            'config_schema': {
                'api_key': {'type': 'string', 'required': True, 'sensitive': True},
                'endpoint': {'type': 'string', 'required': True},
                'model': {'type': 'string', 'required': True},
                'temperature': {'type': 'float', 'default': 0.7, 'min': 0.0, 'max': 2.0},
                'max_tokens': {'type': 'integer', 'default': 4096, 'min': 1, 'max': 32768},
            }
        },
        'openai-gpt4': {
            'id': 'openai-gpt4',
            'name': 'OpenAI GPT-4',
            'category': 'LLM',
            'description': 'Industry-leading language model for complex reasoning tasks',
            'endpoint': 'https://api.openai.com/v1',
            'models': ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
            'default_model': 'gpt-4-turbo-preview',
            'config_schema': {
                'api_key': {'type': 'string', 'required': True, 'sensitive': True},
                'endpoint': {'type': 'string', 'required': True},
                'model': {'type': 'string', 'required': True},
                'temperature': {'type': 'float', 'default': 0.7, 'min': 0.0, 'max': 2.0},
                'max_tokens': {'type': 'integer', 'default': 4096, 'min': 1, 'max': 32768},
            }
        },
        'azure-speech': {
            'id': 'azure-speech',
            'name': 'Azure Speech Services',
            'category': 'Speech Processing',
            'description': 'Enterprise-grade speech-to-text and text-to-speech',
            'endpoint': 'https://eastus.api.cognitive.microsoft.com',
            'models': ['speech-v1'],
            'default_model': 'speech-v1',
            'config_schema': {
                'api_key': {'type': 'string', 'required': True, 'sensitive': True},
                'endpoint': {'type': 'string', 'required': True},
                'region': {'type': 'string', 'default': 'eastus'},
                'language': {'type': 'string', 'default': 'en-US'},
            }
        },
    }

    # Initialize default providers
    def initialize_default_providers():
        """Initialize default provider configurations."""
        for provider_id, template in PROVIDER_TEMPLATES.items():
            if provider_id not in admin_providers:
                admin_providers[provider_id] = {
                    'id': provider_id,
                    'name': template['name'],
                    'category': template['category'],
                    'description': template['description'],
                    'status': 'inactive',
                    'is_default': provider_id == 'dashscope-qwen',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }

                # Initialize empty configuration
                admin_configurations[provider_id] = {
                    'provider_id': provider_id,
                    'config': {},
                    'is_active': False,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }

    # =====================================================
    # HEALTH CHECK ENDPOINT
    # =====================================================

    @_app.route('/health', methods=['GET'])
    def health_check():
        """Unified health check endpoint"""
        try:
            db = get_db()
            db_status = 'connected' if db else 'disconnected'

            return jsonify({
                'status': 'healthy',
                'service': 'emirati-journey-unified',
                'version': '1.0.0',
                'database': db_status,
                'features': {
                    'authentication': True,
                    'cv_upload': True,
                    'school_programs': True,
                    'admin_management': True
                },
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 500

    # =====================================================
    # AUTHENTICATION ROUTES
    # =====================================================

    @_app.route('/api/auth/login', methods=['POST'])
    def login():
        """Authenticate user login"""
        try:
            data = request.get_json()

            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return jsonify({
                    'success': False,
                    'message': 'Email and password are required'
                }), 400

            # Import and use authentication manager
            from auth.auth_manager_fixed import AuthenticationManager
            auth_manager = AuthenticationManager()

            # Authenticate user
            success, message, result_data = auth_manager.authenticate_user(email, password)

            if success:
                return jsonify({
                    'success': True,
                    'message': message,
                    'data': result_data
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': message
                }), 401

        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Authentication failed due to system error'
            }), 500

    @_app.route('/api/auth/dev-login', methods=['POST'])
    def dev_login():
        """
        Development Login Endpoint
        Creates a valid JWT token for testing purposes without requiring password.
        This endpoint should be disabled in production.
        """
        try:
            data = request.get_json()

            user_id = data.get('user_id')
            email = data.get('email')
            role = data.get('role', 'candidate')

            if not user_id:
                return jsonify({
                    'success': False,
                    'message': 'user_id is required'
                }), 400

            # Create access token with additional claims
            from flask_jwt_extended import create_access_token, create_refresh_token

            additional_claims = {
                'role': role,
                'email': email or f'user_{user_id}@dev.local'
            }

            access_token = create_access_token(
                identity=str(user_id),
                additional_claims=additional_claims
            )
            refresh_token = create_refresh_token(
                identity=str(user_id),
                additional_claims=additional_claims
            )

            logger.info(f"Dev login successful for user_id={user_id}, role={role}")

            return jsonify({
                'success': True,
                'message': 'Development login successful',
                'data': {
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': {
                        'id': user_id,
                        'email': email,
                        'role': role,
                        'user_type': role
                    }
                }
            }), 200

        except Exception as e:
            logger.error(f"Dev login error: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Dev login failed: {str(e)}'
            }), 500

    @_app.route('/api/auth/register', methods=['POST'])
    def register():
        """Register a new UAE National user"""
        try:
            data = request.get_json()

            # Validate required fields
            required_fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'emirate']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({
                        'success': False,
                        'message': f'Missing required field: {field}'
                    }), 400

            # Import and use authentication manager
            from auth.auth_manager_fixed import AuthenticationManager
            auth_manager = AuthenticationManager()

            # Set UAE nationality by default
            data['nationality'] = 'UAE'

            # Register user
            success, message, result_data = auth_manager.register_user(data)

            if success:
                return jsonify({
                    'success': True,
                    'message': message,
                    'data': {
                        'user_id': result_data['user_data']['id'] if 'user_data' in result_data else None,
                        'email_verification_required': True,
                        'phone_verification_required': True
                    }
                }), 201
            else:
                return jsonify({
                    'success': False,
                    'message': message
                }), 400

        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Registration failed due to system error'
            }), 500

    # @_app.route('/api/auth/profile', methods=['GET'])
    # @jwt_required()
    # def get_profile():
    #     """Get user profile information (DEPRECATED - Moved to auth_routes.py)"""
    #     return jsonify({'message': 'Please use auth_routes implementation'}), 404

        # try:
        #     user_id = get_jwt_identity()
        #
        #     # Import user profile
        #     from models.user_profile import UserProfile
        #     profile = UserProfile(user_id)
        #     profile_data = profile.to_dict()
        #
        #     # Add UAE-specific configuration
        #     profile_data.update({
        #         'working_days': os.getenv('UAE_WORKING_DAYS', 'Monday,Tuesday,Wednesday,Thursday,Friday').split(','),
        #         'weekend_days': os.getenv('UAE_WEEKEND_DAYS', 'Saturday,Sunday').split(','),
        #         'timezone': os.getenv('TIMEZONE', 'Asia/Dubai'),
        #         'locale': os.getenv('LOCALE', 'en_AE'),
        #         'currency': os.getenv('CURRENCY', 'AED'),
        #         'nationality': 'UAE'
        #     })
        #
        #     return jsonify({
        #         'success': True,
        #         'message': 'Profile retrieved successfully',
        #         'data': profile_data
        #     }), 200
        #
        # except Exception as e:
        #     logger.error(f"Profile retrieval error: {str(e)}")
        #     return jsonify({
        #         'success': False,
        #         'message': 'Profile retrieval failed'
        #     }), 500

    # =====================================================
    # DASHBOARD ROUTES (moved to candidate_job_routes blueprint)
    # =====================================================
    # REMOVED: get_candidate_dashboard_stats was dead code ΓÇö shadowed by
    # candidate_job_bp.get_dashboard_stats (registered first).
    # The blueprint handler in candidate_job_routes.py is the active one.
    # =====================================================
    # CV UPLOAD ROUTES
    # =====================================================

    # @_app.route('/api/cv/upload', methods=['POST', 'OPTIONS'])
    # @_app.route('/api/candidate/cv/upload', methods=['POST', 'OPTIONS'])
    def upload_cv_deprecated():
        """Upload and process CV file"""
        try:
            # CORS preflight support
            if request.method == 'OPTIONS':
                return ('', 204)

            # For development: accept mock tokens or use fallback user_id
            auth_header = request.headers.get('Authorization', '')
            if 'mock_token' in auth_header:
                user_eid = '784000000000010'
                user_id = 'mock_user_candidate'
            else:
                try:
                    verify_jwt_in_request(optional=True)
                    user_id = get_jwt_identity() or 'anonymous_user'
                    # Post-EID migration: identity is CHAR(15) EID, use as-is
                    user_eid = str(user_id).strip()
                except Exception:
                    user_eid = '784000000000010'
                    user_id = 'anonymous_user'
            logger.debug(f"CV upload request from user_eid: {user_eid}")

            # Check if file is present (handle both 'file' and 'cv_file')
            if 'cv_file' not in request.files and 'file' not in request.files:
                logger.debug("No file provided in CV upload request")
                return jsonify({
                    'success': False,
                    'message': 'No file provided'
                }), 400

            file = request.files.get('cv_file') or request.files.get('file')

            # Check if file is selected
            if file.filename == '':
                logger.debug("No file selected in CV upload request")
                return jsonify({
                    'success': False,
                    'message': 'No file selected'
                }), 400

            # Validate file
            if not allowed_file(file.filename):
                logger.debug(f"Invalid file type: {file.filename}")
                return jsonify({
                    'success': False,
                    'message': 'File type not allowed. Please upload PDF, DOCX, DOC, or TXT files.'
                }), 400

            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)

            if file_size > MAX_FILE_SIZE:
                return jsonify({
                    'success': False,
                    'message': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'
                }), 400

            # Extract text from file BEFORE saving (to avoid file pointer issues)
            logger.debug(f"Extracting text from {file.filename}")
            cv_text = extract_text_from_file(file)

            # Save file after text extraction
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_filename = f"{user_eid}_{timestamp}_{filename}"
            file_path = UPLOAD_FOLDER / safe_filename

            file.save(str(file_path))
            logger.info(f"File saved locally for parsing: {file_path}")

            # Also persist via storage service (S3-compatible)
            try:
                from backend.services.storage import storage as _storage
                file.seek(0)
                _storage.save_upload(file, 'cv_uploads', safe_filename)
                logger.info(f"File also saved to storage service")
            except Exception as storage_err:
                logger.warning(f"Storage service save skipped: {storage_err}")

            # Debug: log first 200 characters if extraction worked
            if cv_text:
                logger.info(f"CV text preview: {cv_text[:200]}...")
            else:
                logger.warning("No text extracted from CV file")

            # Check if text extraction worked
            if not cv_text:
                logger.error("Text extraction failed (empty result)")
                return jsonify({
                    'success': False,
                    'message': 'Could not extract text from file. Please ensure the file is not empty or password protected.'
                }), 400

            # Parse CV with Gemini AI (using robust CVParser)
            try:
                 # Lazy import to avoid circular dependency
                from cv_parser import CVParser
                parser = CVParser()

                # Use raw file stream if possible or text
                parse_result = parser.parse_cv_text(cv_text, user_id=user_eid, filename=file.filename)

                if not parse_result.get('success'):
                    logger.warning(f"AI parsing failed, using fallback: {parse_result.get('message')}")
                    # We can still proceed with what we have or empty data
                    analysis_result = parse_result.get('data', {})
                    # Ensure minimal keys exist
                    analysis_result.setdefault('personal_info', {})
                else:
                    analysis_result = parse_result.get('data', {})
                    logger.info("Γ£à Using CVParser analysis result")

            except Exception as ai_error:
                logger.error(f"Gemini AI Serious Failure: {str(ai_error)}")
                # Fallback to empty structure so we at least save the file
                analysis_result = {'personal_info': {}}

            # Persist to database immediately so ID is valid for Share/Match
            import uuid
            new_cv_id = str(uuid.uuid4())

            insert_query = """
                INSERT INTO user_cvs (
                    id, user_id, title,
                    personal_info, professional_summary,
                    technical_skills, soft_skills,
                    work_experience, education,
                    status, is_visible, created_at, updated_at,
                    cv_score, ats_score
                ) VALUES (
                    %s::uuid, %s, %s,
                    %s::jsonb, %s,
                    %s::jsonb, %s::jsonb,
                    %s::jsonb, %s::jsonb,
                    'draft', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                    %s, %s
                )
            """

            # Extract skills for separate storage
            tech_skills = analysis_result.get('skills', [])
            # If skills is dict (old format), handle it
            if isinstance(tech_skills, dict):
                 tech_skills = tech_skills.get('technical', [])

            soft_skills = analysis_result.get('soft_skills', [])

            # Get scores
            analysis_meta = parse_result.get('analysis', {}) if 'parse_result' in locals() else {}
            scores = analysis_meta.get('scores', {})
            cv_score = scores.get('overall', 0)
            ats_score = scores.get('completeness', 0)

            # Determine user ID for DB insert — use user_eid set earlier
            db_user_id = user_eid

            try:
                 execute_query(insert_query, (
                    new_cv_id, db_user_id, f"Uploaded CV {timestamp}",
                    json.dumps(analysis_result.get('personal_info', {})),
                    analysis_result.get('professional_summary', ''),
                    json.dumps(tech_skills),
                    json.dumps(soft_skills),
                    json.dumps(analysis_result.get('experience', [])),
                    json.dumps(analysis_result.get('education', [])),
                    cv_score, ats_score
                ), fetch_all=False)
                 logger.info(f"Γ£à Auto-persisted uploaded CV as {new_cv_id}")
            except Exception as db_err:
                logger.error(f"Failed to auto-persist CV: {db_err}")
                pass

            return jsonify({
                'success': True,
                'message': 'CV uploaded and analyzed successfully',
                'data': {
                    'file_id': new_cv_id,
                    'original_filename': safe_filename,
                    'file_size': file_size,
                    'analysis': analysis_result,
                    'upload_time': datetime.now().isoformat()
                }
            }), 200

        except Exception as e:
            logger.error(f"CV upload error: {str(e)}")
            # Debug: Return detailed error to frontend
            return jsonify({
                'success': False,
                'message': f'Upload failed: {str(e)}',
                'details': traceback.format_exc()
            }), 500

    # Debug endpoint - only available in development mode
    if os.getenv('FLASK_ENV', 'production') != 'production':
        @_app.route('/debug/save_pdf', methods=['POST'])
        def debug_save_pdf():
            """Debug endpoint to inspect generated PDFs (dev only)"""
            try:
                if 'file' not in request.files:
                    return jsonify({'success': False, 'message': 'No file part'}), 400

                file = request.files['file']
                if file.filename == '':
                    return jsonify({'success': False, 'message': 'No selected file'}), 400

                debug_dir = Path(__file__).parent / 'debug_output'
                debug_dir.mkdir(exist_ok=True)

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"DEBUG_PDF_{timestamp}.pdf"
                file_path = debug_dir / filename

                file.save(str(file_path))
                logger.info(f"DEBUG: Saved PDF to {file_path}")

                return jsonify({
                    'success': True,
                    'message': 'PDF Saved to Server Debug Folder',
                    'path': str(file_path)
                })
            except Exception as e:
                logger.error(f"Debug Save Error: {e}")
                return jsonify({'success': False, 'message': str(e)}), 500

    @_app.route('/api/cv/list-mock', methods=['GET'])
    @jwt_required()
    def list_cvs_mock():
        """List user's uploaded CVs"""
        try:
            user_id = get_jwt_identity()

            # Mock CV list
            cvs = [
                {
                    'id': 'cv_001',
                    'filename': 'Ahmed_Al_Mansouri_CV.pdf',
                    'upload_date': '2025-09-22T15:20:00Z',
                    'status': 'analyzed',
                    'match_score': 95
                }
            ]

            return jsonify({
                'success': True,
                'data': cvs
            }), 200

        except Exception as e:
            logger.error(f"List CVs error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Failed to retrieve CVs'
            }), 500




    # @_app.route('/api/cv/list', methods=['GET'])
    def list_cvs_fixed_deprecated():
        """List user's saved CVs (Fixed Implementation)"""
        try:
            # Auth check
            auth_header = request.headers.get('Authorization', '')
            if 'mock_token' in auth_header:
                user_eid = '784000000000010'
            else:
                try:
                    verify_jwt_in_request(optional=True)
                    user_id = get_jwt_identity()
                    if not user_id:
                         user_eid = '784000000000010'
                    else:
                        user_eid = str(user_id).strip()
                except Exception:
                    user_eid = '784000000000010'

            query = """
                SELECT
                    id, title, status, cv_score, ats_score, updated_at, template_name, is_visible
                FROM user_cvs
                WHERE user_id = %s AND COALESCE(status, 'draft') <> 'archived'
                ORDER BY updated_at DESC
            """
            cvs = execute_query(query, (user_eid,))

            result = []
            if cvs:
                for cv in cvs:
                    d = dict(cv)
                    if d.get('updated_at'):
                        d['updated_at'] = d['updated_at'].isoformat()
                    result.append(d)

            return jsonify({'success': True, 'data': result}), 200
        except Exception as e:
            logger.error(f"List CVs error: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500

    # @_app.route('/api/cv/save', methods=['POST'])
    def save_cv_fixed_deprecated():
        """Save/Create CV (Fixed Implementation)"""
        try:
            # Auth check
            auth_header = request.headers.get('Authorization', '')
            if 'mock_token' in auth_header:
                user_eid = '784000000000010'
            else:
                try:
                    verify_jwt_in_request(optional=True)
                    user_id = get_jwt_identity()
                    if not user_id:
                         user_eid = '784000000000010'
                    else:
                        user_eid = str(user_id).strip()
                except Exception:
                    user_eid = '784000000000010'

            data = request.get_json()
            cv_data = data.get('cvData', {})

            # Prepare fields
            cv_id = str(uuidlib.uuid4())
            title = data.get('title', 'My CV')
            template_id = data.get('templateId', 'professional')
            cv_score = data.get('cvScore', 0)
            ats_score = data.get('atsScore', 0)

            insert_query = """
                INSERT INTO user_cvs (
                    id, user_id, title, template_name,
                    personal_info, professional_summary,
                    technical_skills, soft_skills,
                    work_experience, education,
                    cv_score, ats_score, status,
                    created_at, updated_at, is_visible
                ) VALUES (
                    %s::uuid, %s, %s, %s,
                    %s::jsonb, %s,
                    %s::jsonb, %s::jsonb,
                    %s::jsonb, %s::jsonb,
                    %s, %s, 'draft',
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE
                ) RETURNING id
            """

            params = (
                cv_id, user_eid, title, template_id,
                json.dumps(cv_data.get('personalInfo', {})),
                cv_data.get('professionalSummary', ''),
                json.dumps(cv_data.get('technicalSkills', [])),
                json.dumps(cv_data.get('softSkills', [])),
                json.dumps(cv_data.get('experience', [])),
                json.dumps(cv_data.get('education', [])),
                cv_score, ats_score
            )

            execute_query(insert_query, params, fetch_one=True)

            return jsonify({
                'success': True,
                'message': 'CV saved successfully',
                'data': {'cv_id': cv_id}
            }), 201

        except Exception as e:
            logger.error(f"Save CV error: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500

    def get_current_user_eid_inline():
        """Helper to get user EID from JWT. Returns CHAR(15) EID string."""
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            return '784000000000010'

        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if not user_id:
                 return '784000000000010'
            return str(user_id).strip()

        except Exception:
            return '784000000000010'

    # @_app.route('/api/cv/<cv_id>', methods=['GET'])
    def get_cv_fixed_deprecated(cv_id):
        try:
            user_eid = get_current_user_eid_inline()

            query = "SELECT * FROM user_cvs WHERE id = %s::uuid"

            cv = execute_query(query, (cv_id,), fetch_one=True)

            if not cv:
                return jsonify({'success': False, 'message': 'CV not found'}), 404

            cv_data = {
                'personal_info': safe_json_load(cv['personal_info'], {}),
                'professional_summary': cv['professional_summary'],
                'technical_skills': safe_json_load(cv['technical_skills'], []),
                'soft_skills': safe_json_load(cv['soft_skills'], []),
                'work_experience': safe_json_load(cv['work_experience'], []),
                'education': safe_json_load(cv['education'], []),
                'title': cv['title'],
                'template_name': cv['template_name'],
                'cv_score': cv['cv_score'],
                'ats_score': cv['ats_score']
            }

            return jsonify({
                'success': True,
                'data': cv_data,
                'metadata': {
                    'id': cv['id'],
                    'title': cv['title'],
                    'template_name': cv['template_name'],
                    'cv_score': cv['cv_score'],
                    'ats_score': cv['ats_score']
                }
            })
        except Exception as e:
            logger.error(f"Get CV error: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500

    # @_app.route('/api/cv/<cv_id>', methods=['PUT'])
    def update_cv_fixed_deprecated(cv_id):
        try:
            user_eid = get_current_user_eid_inline()
            data = request.get_json()

            cv_data = data.get('cvData', {})
            title = data.get('title')
            template_id = data.get('templateId')
            cv_score = data.get('cvScore')
            ats_score = data.get('atsScore')

            # Build update query
            update_fields = []
            params = []

            if title:
                update_fields.append("title = %s")
                params.append(title)
            if template_id:
                update_fields.append("template_name = %s")
                params.append(template_id)
            if cv_score is not None:
                update_fields.append("cv_score = %s")
                params.append(cv_score)
            if ats_score is not None:
                update_fields.append("ats_score = %s")
                params.append(ats_score)

            if cv_data:
                if 'personalInfo' in cv_data:
                    update_fields.append("personal_info = %s::jsonb")
                    params.append(json.dumps(cv_data['personalInfo']))
                if 'professionalSummary' in cv_data:
                    update_fields.append("professional_summary = %s")
                    params.append(cv_data['professionalSummary'])
                if 'technicalSkills' in cv_data:
                    update_fields.append("technical_skills = %s::jsonb")
                    params.append(json.dumps(cv_data['technicalSkills']))
                if 'softSkills' in cv_data:
                    update_fields.append("soft_skills = %s::jsonb")
                    params.append(json.dumps(cv_data['softSkills']))
                if 'experience' in cv_data:
                    update_fields.append("work_experience = %s::jsonb")
                    params.append(json.dumps(cv_data['experience']))
                if 'education' in cv_data:
                    update_fields.append("education = %s::jsonb")
                    params.append(json.dumps(cv_data['education']))

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            params.append(cv_id)

            query = f"UPDATE user_cvs SET {', '.join(update_fields)} WHERE id = %s::uuid"

            execute_query(query, tuple(params), fetch_all=False)

            return jsonify({'success': True, 'message': 'CV updated successfully'})
        except Exception as e:
            logger.error(f"Update CV error: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500

    # REMOVED: delete_cv_fixed was dead code ΓÇö shadowed by
    # enhanced_cv.delete_cv (registered first via enhanced_cv_routes blueprint).

    @_app.route('/api/cv/<cv_id>/duplicate', methods=['POST'])
    def duplicate_cv_fixed(cv_id):
        try:
            user_eid = get_current_user_eid_inline()

            # Get original
            original = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
            if not original:
                 return jsonify({'success': False, 'message': 'CV not found'}), 404

            new_cv_id = str(uuidlib.uuid4())
            new_title = f"{original['title']} (Copy)"

            # Ensure we don't double encode if they are already strings
            tech_skills = safe_json_load(original['technical_skills'], [])
            soft_skills = safe_json_load(original['soft_skills'], [])
            work_exp = safe_json_load(original['work_experience'], [])
            education = safe_json_load(original['education'], [])
            personal_info = safe_json_load(original['personal_info'], {})

            insert_query = """
                INSERT INTO user_cvs (
                    id, user_id, title, personal_info, professional_summary,
                    technical_skills, soft_skills, work_experience, education,
                    cv_score, ats_score
                ) VALUES (
                    %s::uuid, %s, %s, %s::jsonb, %s,
                    %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb,
                    %s, %s
                )
            """
            params = (
                new_cv_id, user_eid, new_title, json.dumps(personal_info), original['professional_summary'],
                json.dumps(tech_skills), json.dumps(soft_skills),
                json.dumps(work_exp), json.dumps(education),
                original['cv_score'], original['ats_score']
            )

            execute_query(insert_query, params, fetch_all=False)

            return jsonify({'success': True, 'message': 'CV duplicated', 'data': {'cv_id': new_cv_id}})
        except Exception as e:
            logger.error(f"Duplicate CV error: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500

    # REMOVED: set_visible_fixed was dead code ΓÇö shadowed by
    # enhanced_cv.update_cv_visibility (registered first via enhanced_cv_routes blueprint).

    @_app.route('/api/cv/<cv_id>/export/<format>', methods=['GET'])
    def export_cv_fixed(cv_id, format):
        try:
            user_eid = get_current_user_eid_inline()

            cv = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
            if not cv:
                return jsonify({'error': 'CV not found'}), 404

            # Load parsed_data if available
            parsed_data = cv.get('parsed_data')
            if parsed_data:
                import json as _json
                if isinstance(parsed_data, str):
                    try: parsed_data = _json.loads(parsed_data)
                    except: parsed_data = {}
            else:
                parsed_data = {}

            experience = safe_json_load(cv.get('work_experience'), [])
            if not experience and parsed_data:
                experience = parsed_data.get('work_experience') or parsed_data.get('experience') or []

            education = safe_json_load(cv.get('education'), [])
            if not education and parsed_data:
                education = parsed_data.get('education') or []

            tech_skills = safe_json_load(cv.get('technical_skills'), [])
            if not tech_skills and parsed_data:
                tech_skills = parsed_data.get('technical_skills') or parsed_data.get('skills', []) or []

            soft_skills = safe_json_load(cv.get('soft_skills'), [])
            if not soft_skills and parsed_data:
                soft_skills = parsed_data.get('soft_skills') or []

            summary = cv.get('professional_summary')
            if not summary and parsed_data:
                summary = parsed_data.get('professional_summary') or parsed_data.get('summary') or ''

            skills = (tech_skills or []) + (soft_skills or [])

            cv_data = {
                'metadata': {'title': cv['title'], 'cv_id': cv['id']},
                'data': {
                    'personal_info': safe_json_load(cv.get('personal_info'), {}),
                    'professional_summary': summary,
                    'experience': experience,
                    'education': education,
                    'skills': skills
                }
            }

            if format == 'json':
                return jsonify({'success': True, 'cv_data': cv_data})

            # PDF/DOCX Handling
            from cv_builder.cv_export import CVExporter
            exporter = CVExporter()

            file_path = exporter.export_cv(cv_data, format)

            if not file_path or not os.path.exists(file_path):
                 return jsonify({'error': 'Export failed: File not created'}), 500

            mime_types = {
                'pdf': 'application/pdf',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }

            return send_file(
                file_path,
                mimetype=mime_types.get(format, 'application/octet-stream'),
                as_attachment=True,
                download_name=f"cv_{cv_id}.{format}"
            )

        except Exception as e:
            logger.error(f"Export error: {e}")
            traceback.print_exc()
            return jsonify({'error': f"Export failed: {str(e)}"}), 500

    @_app.route('/api/cv/user/<user_id>/export/<format>', methods=['GET'])
    def export_user_cv_fixed(user_id, format):
        try:
            if format not in ['pdf', 'docx', 'json']:
                return jsonify({'error': 'Invalid export format. Supported: pdf, docx, json'}), 400
                
            verify_jwt_in_request()

            # Find the most recently updated CV for this user
            cv = execute_query(
                "SELECT * FROM user_cvs WHERE user_id::text = %s ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 1",
                (user_id,),
                fetch_one=True
            )
            if not cv:
                return jsonify({'error': 'No CV found for this user'}), 404

            cv_id = cv['id']
            # Load parsed_data if available
            parsed_data = cv.get('parsed_data')
            if parsed_data:
                import json as _json
                if isinstance(parsed_data, str):
                    try: parsed_data = _json.loads(parsed_data)
                    except: parsed_data = {}
            else:
                parsed_data = {}

            experience = safe_json_load(cv.get('work_experience'), [])
            if not experience and parsed_data:
                experience = parsed_data.get('work_experience') or parsed_data.get('experience') or []

            education = safe_json_load(cv.get('education'), [])
            if not education and parsed_data:
                education = parsed_data.get('education') or []

            tech_skills = safe_json_load(cv.get('technical_skills'), [])
            if not tech_skills and parsed_data:
                tech_skills = parsed_data.get('technical_skills') or parsed_data.get('skills', []) or []

            soft_skills = safe_json_load(cv.get('soft_skills'), [])
            if not soft_skills and parsed_data:
                soft_skills = parsed_data.get('soft_skills') or []

            summary = cv.get('professional_summary')
            if not summary and parsed_data:
                summary = parsed_data.get('professional_summary') or parsed_data.get('summary') or ''

            skills = (tech_skills or []) + (soft_skills or [])

            cv_data = {
                'metadata': {'title': cv['title'], 'cv_id': cv['id']},
                'data': {
                    'personal_info': safe_json_load(cv.get('personal_info'), {}),
                    'professional_summary': summary,
                    'experience': experience,
                    'education': education,
                    'skills': skills
                }
            }

            if format == 'json':
                return jsonify({'success': True, 'cv_data': cv_data})

            # PDF/DOCX Handling
            from cv_builder.cv_export import CVExporter
            exporter = CVExporter()

            file_path = exporter.export_cv(cv_data, format)

            if not file_path or not os.path.exists(file_path):
                 return jsonify({'error': 'Export failed: File not created'}), 500

            mime_types = {
                'pdf': 'application/pdf',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }

            return send_file(
                file_path,
                mimetype=mime_types.get(format, 'application/octet-stream'),
                as_attachment=True,
                download_name=f"cv_{cv_id}.{format}"
            )

        except Exception as e:
            logger.error(f"User CV export error: {e}")
            traceback.print_exc()
            return jsonify({'error': f"Export failed: {str(e)}"}), 500

    # =====================================================
    # PUBLIC SHARING ROUTES
    # =====================================================

    # =====================================================
    # PUBLIC SHARING ROUTES
    # =====================================================

    @_app.route('/api/cv/public/<cv_id>', methods=['GET'])
    def get_public_cv(cv_id):
        """Get public CV data (No Auth Required)"""
        try:
            # Check if visible
            query = """
                SELECT
                    id, user_id, title, template_name,
                    personal_info, professional_summary,
                    technical_skills, soft_skills,
                    work_experience, education,
                    status, is_visible,
                    created_at
                FROM user_cvs
                WHERE id = %s::uuid
            """
            cv = execute_query(query, (cv_id,), fetch_one=True)

            if not cv:
                return jsonify({'success': False, 'message': 'CV not found'}), 404

            if not cv.get('is_visible'):
                return jsonify({'success': False, 'message': 'This CV is private'}), 403

            # Return data similar to list_cvs but detailed
            cv_dict = dict(cv)

            # Mask personal info contacts for external viewers (closed platform security)
            pi = cv_dict.get('personal_info')
            if pi:
                import json
                if isinstance(pi, str):
                    try:
                        pi = json.loads(pi)
                    except Exception:
                        pass
                if isinstance(pi, dict):
                    # Mask standard variations
                    for key in ['email', 'phone', 'emailAddress', 'phoneNumber', 'email_address', 'phone_number']:
                        if key in pi and pi[key]:
                            pi[key] = '[Hidden - Closed Platform]'
                    cv_dict['personal_info'] = pi

            return jsonify({
                'success': True,
                'data': cv_dict
            })

        except Exception as e:
            logger.error(f"Public CV fetch error: {e}")
            return jsonify({'success': False, 'message': 'System error'}), 500

    @_app.route('/api/cv/public/<cv_id>/contact', methods=['POST'])
    def contact_public_cv(cv_id):
        """Send message/notification to CV owner (No Auth Required)"""
        try:
            data = request.get_json() or {}
            sender_name = data.get('sender_name', '').strip()
            sender_company = data.get('sender_company', '').strip()
            sender_email = data.get('sender_email', '').strip()
            subject = data.get('subject', '').strip()
            message = data.get('message', '').strip()

            if not sender_name or not sender_email or not subject or not message:
                return jsonify({'success': False, 'message': 'Missing required fields'}), 400

            # Get CV owner
            query = "SELECT user_id, is_visible FROM user_cvs WHERE id = %s::uuid"
            cv = execute_query(query, (cv_id,), fetch_one=True)

            if not cv:
                return jsonify({'success': False, 'message': 'CV not found'}), 404

            if not cv.get('is_visible'):
                return jsonify({'success': False, 'message': 'This CV is private'}), 403

            candidate_id = cv.get('user_id')
            if not candidate_id:
                return jsonify({'success': False, 'message': 'Candidate not found'}), 404

            # Create platform notification
            from backend.notification_helper import create_notification
            
            notif_title = f"New inquiry: {subject}"
            notif_message = f"You received an inquiry from {sender_name} at {sender_company} ({sender_email}): {message}"
            metadata = {
                'sender_name': sender_name,
                'sender_company': sender_company,
                'sender_email': sender_email,
                'subject': subject,
                'message': message,
                'cv_id': cv_id
            }

            notif_id = create_notification(
                user_id=candidate_id,
                notification_type='cv_inquiry',
                title=notif_title,
                message=notif_message,
                metadata=metadata
            )

            if notif_id:
                return jsonify({'success': True, 'message': 'Message sent successfully'})
            else:
                return jsonify({'success': False, 'message': 'Failed to send message'}), 500

        except Exception as e:
            logger.error(f"Public CV contact error: {e}")
            return jsonify({'success': False, 'message': 'System error'}), 500

    @_app.route('/api/public/settings/mission-video', methods=['GET'])
    def get_public_mission_video():
        """Retrieve the configured mission video URL (No Auth Required)"""
        try:
            query = "SELECT setting_value FROM admin_settings WHERE setting_key = 'mission_video_url'"
            row = execute_query(query, fetch_one=True)
            
            video_url = "https://www.youtube.com/embed/zTct6QW-V28"
            if row and row.get('setting_value') is not None:
                import json
                try:
                    setting_val = row['setting_value']
                    if isinstance(setting_val, str):
                        video_url = json.loads(setting_val)
                    else:
                        video_url = setting_val
                except Exception as val_err:
                    logger.warning(f"Error parsing mission_video_url setting: {val_err}")
                    if isinstance(row['setting_value'], str):
                        video_url = row['setting_value']
            
            return jsonify({
                'success': True,
                'video_url': video_url
            })
        except Exception as e:
            logger.error(f"Public settings fetch error: {e}")
            return jsonify({'success': False, 'message': 'System error'}), 500




    # Legacy list_vacancies removed (replaced by newer version at end of file)

    @_app.route('/api/matching/cv/<cv_id>/top-vacancies', methods=['GET'])
    @jwt_required()
    def match_cv_top_vacancies(cv_id: str):
        """Return top-N matching vacancies for a specific CV using real job_postings."""
        try:
            limit = int(request.args.get('limit', 20))
            search = request.args.get('search', '').strip()
            location_filter = request.args.get('location', '').strip()
            type_filter = request.args.get('type', '').strip()
            experience_filter = request.args.get('experience', '').strip()

            user_id = get_jwt_identity()

            cv = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
            if not cv:
                return jsonify({'success': False, 'message': 'CV not found'}), 404

            # Verify that the CV belongs to the logged-in candidate
            if str(cv.get('user_id')).strip() != str(user_id).strip():
                logger.warning(f"Unauthorized access attempt to CV {cv_id} by user {user_id}")
                return jsonify({'success': False, 'message': 'Forbidden'}), 403

            cvk = _collect_cv_keywords(dict(cv))
            return _match_and_return(cvk, limit, search, location_filter, type_filter, experience_filter)
        except Exception as e:
            logger.error(f"Match CV error: {str(e)}")
            return jsonify({'success': False, 'message': 'Matching failed'}), 500

    def _match_and_return(cvk, limit, search, location_filter, type_filter, experience_filter):
        """Shared matching: score real job_postings against candidate keywords."""
        # Build SQL filters
        where_clauses = ["jp.status IN ('active', 'published', 'open')"]
        params = []
        if search:
            where_clauses.append("(jp.title ILIKE %s OR jp.description ILIKE %s OR jp.department ILIKE %s)")
            s = f"%{search}%"
            params.extend([s, s, s])
        if location_filter:
            where_clauses.append("jp.location ILIKE %s")
            params.append(f"%{location_filter}%")
        if type_filter:
            where_clauses.append("jp.employment_type ILIKE %s")
            params.append(f"%{type_filter}%")
        if experience_filter:
            where_clauses.append("jp.experience_level ILIKE %s")
            params.append(f"%{experience_filter}%")

        where_sql = " AND ".join(where_clauses)
        query = f"""
            SELECT jp.id, jp.jd_id, jp.title, jp.description, jp.requirements,
                   jp.tags, jp.location, jp.department, jp.employment_type,
                   jp.experience_level, jp.salary_range_min, jp.salary_range_max,
                   jp.currency, jp.remote_option, jp.emiratization_target,
                   jp.created_at, jp.company_id,
                   COALESCE(c.name, 'N/A') as company_name
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id::text = c.id::text
            WHERE {where_sql}
            ORDER BY jp.created_at DESC
            LIMIT 200
        """
        jobs = execute_query(query, params) or []

        scored = []
        for j in jobs:
            jd = dict(j)
            vk = _vacancy_keywords(jd)
            score = _compute_match_score(cvk, vk)

            # Build salary range string
            sal_min = jd.get('salary_range_min')
            sal_max = jd.get('salary_range_max')
            currency = jd.get('currency') or 'AED'
            salary_range = ''
            if sal_min and sal_max:
                salary_range = f"{currency} {int(float(sal_min)):,} - {int(float(sal_max)):,}"
            elif sal_min:
                salary_range = f"{currency} {int(float(sal_min)):,}+"

            # Extract required skills list from requirements JSON
            req_raw = jd.get('requirements')
            required_skills = []
            if req_raw:
                parsed = safe_json_load(req_raw, []) if isinstance(req_raw, str) else req_raw
                if isinstance(parsed, list):
                    for r in parsed[:5]:
                        if isinstance(r, str):
                            required_skills.append(r)
                        elif isinstance(r, dict):
                            required_skills.append(r.get('description') or r.get('name') or '')
                elif isinstance(parsed, dict):
                    for k, v in list(parsed.items())[:5]:
                        required_skills.append(f"{k}: {v}" if not isinstance(v, (list, dict)) else k)

            scored.append({
                'id': str(jd.get('jd_id') or jd.get('id')),
                'title': jd.get('title') or 'Untitled',
                'company_name': jd.get('company_name') or 'N/A',
                'location': jd.get('location') or 'UAE',
                'salary_range': salary_range,
                'employment_type': jd.get('employment_type') or 'Full-time',
                'experience_level': jd.get('experience_level') or '',
                'department': jd.get('department') or '',
                'match_score': score,
                'description': (jd.get('description') or '')[:300],
                'snippet': (jd.get('description') or '')[:200],
                'required_skills': json.dumps(required_skills),
                'emiratization_target': jd.get('emiratization_target') or 0,
                'remote_option': jd.get('remote_option') or False,
                'created_at': jd['created_at'].isoformat() if hasattr(jd.get('created_at', ''), 'isoformat') else str(jd.get('created_at', '')),
            })

        scored.sort(key=lambda x: x['match_score'], reverse=True)
        return jsonify({'success': True, 'matches': scored[:limit]}), 200

    @_app.route('/api/matching/visible/top-vacancies', methods=['GET'])
    @jwt_required(optional=True)
    def match_visible_cv_top_vacancies():
        """Return top-N matches for the user's visible CV, or use candidate_skills as fallback."""
        try:
            auth_header = request.headers.get('Authorization', '')
            if 'mock_token' in auth_header:
                user_id = 'mock_user_candidate'
            else:
                try:
                    user_id = get_jwt_identity()
                except Exception:
                    user_id = None
                if not user_id:
                    user_id = 'anonymous_user'

            logger.info(f"Job matching request from user_id={user_id}")

            if user_id == 'mock_user_candidate':
                user_eid = '784000000000010'
            else:
                # Post-EID migration: identity is CHAR(15) EID, use as-is
                user_eid = str(user_id).strip()

            limit = int(request.args.get('limit', 20))
            search = request.args.get('search', '').strip()
            location_filter = request.args.get('location', '').strip()
            type_filter = request.args.get('type', '').strip()
            experience_filter = request.args.get('experience', '').strip()

            # Try to get visible CV first
            cv = None
            try:
                cv = execute_query(
                    "SELECT * FROM user_cvs WHERE user_id = %s AND is_visible = TRUE ORDER BY updated_at DESC, id DESC LIMIT 1",
                    (user_eid,), fetch_one=True
                )
            except Exception as cv_err:
                logger.warning(f"CV lookup failed for user_eid={user_eid}: {cv_err}")

            if cv:
                cvk = _collect_cv_keywords(dict(cv))
                logger.info(f"Using visible CV for matching, skills={len(cvk.get('skills', []))}")
            else:
                # Fallback: build keywords from candidate_skills + user profile
                cvk = {'skills': set(), 'text': set(), 'location': ''}
                try:
                    skills_rows = execute_query(
                        "SELECT name FROM candidate_skills WHERE user_id = %s",
                        (str(user_id),)
                    ) or []
                    for s in skills_rows:
                        cvk['skills'].add(s['name'].lower())
                    logger.info(f"Fallback skills from candidate_skills: {len(cvk['skills'])}")
                except Exception as sk_err:
                    logger.warning(f"candidate_skills lookup failed: {sk_err}")
                try:
                    user_row = execute_query(
                        "SELECT full_name, preferred_location FROM users WHERE id = %s",
                        (str(user_id),), fetch_one=True
                    )
                    if user_row:
                        cvk['location'] = (user_row.get('preferred_location') or '').lower()
                except Exception:
                    pass

            return _match_and_return(cvk, limit, search, location_filter, type_filter, experience_filter)
        except Exception as e:
            logger.error(f"Match visible CV error: {str(e)}")
            traceback.print_exc()
            return jsonify({'success': False, 'message': 'Matching failed'}), 500









    # Duplicate matching route removed to ensure _match_visible_cv_top_vacancies is used

    # =====================================================
    # SCHOOL PROGRAMS ROUTES
    # =====================================================

    @_app.route('/api/school-programs', methods=['GET'])
    def get_school_programs():
        """Get all school programs with filtering and search"""
        try:
            # Get query parameters
            search = request.args.get('search', '')
            category = request.args.get('category', '')
            status = request.args.get('status', 'published')
            featured = request.args.get('featured', '')

            # Build query
            query = """
                SELECT
                    sp.*,
                    s.name_en as school_name_en,
                    s.name_ar as school_name_ar,
                    s.location as school_location,
                    s.khda_rating,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'name', pt.tag_name,
                                'type', pt.tag_type
                            )
                        ) FILTER (WHERE pt.tag_name IS NOT NULL),
                        '[]'::json
                    ) as tags
                FROM school_programs sp
                JOIN schools s ON sp.school_id = s.id
                LEFT JOIN program_tags pt ON sp.id = pt.program_id
                WHERE 1=1
            """

            params = []

            if search:
                query += " AND (sp.title_en ILIKE %s OR sp.description_en ILIKE %s)"
                params.extend([f'%{search}%', f'%{search}%'])

            if category:
                query += " AND sp.category = %s"
                params.append(category)

            if status:
                query += " AND sp.status = %s"
                params.append(status)

            if featured:
                query += " AND sp.featured = %s"
                params.append(featured.lower() == 'true')

            query += " GROUP BY sp.id, s.name_en, s.name_ar, s.location, s.khda_rating ORDER BY sp.created_at DESC"

            programs = execute_query(query, params)

            if programs is None:
                return jsonify({'error': 'Database error'}), 500

            # Convert to JSON-serializable format
            result = []
            for program in programs:
                program_dict = dict(program)
                # Convert dates to ISO format
                for date_field in ['created_at', 'updated_at', 'start_date', 'end_date', 'application_deadline']:
                    if program_dict.get(date_field):
                        if isinstance(program_dict[date_field], datetime):
                            program_dict[date_field] = program_dict[date_field].isoformat()

                # Ensure arrays are properly formatted
                for array_field in ['requirements', 'learning_outcomes', 'assessment_methods', 'language_of_instruction', 'schedule_days', 'equipment_provided', 'prerequisites', 'image_urls', 'video_urls']:
                    if program_dict.get(array_field) is None:
                        program_dict[array_field] = []

                result.append(program_dict)

            return jsonify(result)

        except Exception as e:
            logger.error(f"Error in get_school_programs: {e}")
            return jsonify({'error': 'Internal server error'}), 500

    @_app.route('/api/school-programs', methods=['POST'])
    def create_school_program():
        """Create a new school program"""
        try:
            data = request.get_json()

            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields
            required_fields = ['title_en', 'school_id', 'category', 'description_en']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'Missing required field: {field}'}), 400

            # Ensure fallback schools exist in database
            ensure_fallback_schools_exist()

            # Insert new program
            insert_query = """
                INSERT INTO school_programs (
                    title_en, title_ar, school_id, category, status,
                    description_en, description_ar, target_age_min, target_age_max,
                    capacity_total, capacity_available, fees_amount, fees_currency,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                ) RETURNING id
            """

            params = (
                data['title_en'],
                data.get('title_ar', data['title_en']),
                data['school_id'],
                data['category'],
                data.get('status', 'draft'),
                data['description_en'],
                data.get('description_ar', data['description_en']),
                data.get('target_age_min', 5),
                data.get('target_age_max', 18),
                data.get('capacity_total', 50),
                data.get('capacity_available', data.get('capacity_total', 50)),
                data.get('fees_amount', 0),
                data.get('fees_currency', 'AED')
            )

            result = execute_query(insert_query, params, fetch_one=True)

            if not result:
                logger.error("Failed to insert program - no result returned")
                return jsonify({'error': 'Failed to create program'}), 500

            program_id = result['id']
            logger.info(f"Program created successfully with ID: {program_id}")

            return jsonify({
                'message': 'Program created successfully',
                'program_id': str(program_id),
                'id': str(program_id),
                'success': True
            }), 201

        except Exception as e:
            logger.error(f"Error in create_school_program: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return jsonify({
                'error': 'Internal server error',
                'details': str(e),
                'success': False
            }), 500

    @_app.route('/api/schools', methods=['GET'])
    def get_schools():
        """Get all schools"""
        try:
            query = "SELECT * FROM schools WHERE is_active = true ORDER BY name_en"
            schools = execute_query(query)

            if schools is None:
                return jsonify({'error': 'Database error'}), 500

            result = []
            for school in schools:
                school_dict = dict(school)
                # Convert dates to ISO format
                for date_field in ['created_at', 'updated_at']:
                    if school_dict.get(date_field):
                        if isinstance(school_dict[date_field], datetime):
                            school_dict[date_field] = school_dict[date_field].isoformat()
                result.append(school_dict)

            return jsonify(result)

        except Exception as e:
            logger.error(f"Error in get_schools: {e}")
            return jsonify({'error': 'Internal server error'}), 500

    @_app.route('/api/admin/dashboard-stats', methods=['GET'])
    def get_dashboard_stats():
        """Get dashboard statistics for admin interface"""
        try:
            # Get total programs
            total_query = "SELECT COUNT(*) as total FROM school_programs"
            total_result = execute_query(total_query, fetch_one=True)
            total_programs = total_result['total'] if total_result else 0

            # Get published programs
            published_query = "SELECT COUNT(*) as published FROM school_programs WHERE status = 'published'"
            published_result = execute_query(published_query, fetch_one=True)
            published_programs = published_result['published'] if published_result else 0

            # Get pending reviews
            pending_query = "SELECT COUNT(*) as pending FROM school_programs WHERE status = 'under_review'"
            pending_result = execute_query(pending_query, fetch_one=True)
            pending_reviews = pending_result['pending'] if pending_result else 0

            # Calculate approval rate
            approval_rate = (published_programs / total_programs * 100) if total_programs > 0 else 0

            stats = {
                'totalPrograms': total_programs,
                'publishedPrograms': published_programs,
                'pendingReviews': pending_reviews,
                'approvalRate': round(approval_rate, 1),
                'averageApprovalTime': '18 days'
            }

            return jsonify(stats)

        except Exception as e:
            logger.error(f"Error in get_dashboard_stats: {e}")
            return jsonify({'error': 'Internal server error'}), 500

    # =====================================================
    # ADMIN PROVIDER MANAGEMENT ROUTES
    # =====================================================

    @_app.route('/api/admin/health', methods=['GET'])
    @require_admin_auth
    def admin_health_check():
        """Admin health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'admin_features': {
                'provider_management': True,
                'configuration_management': True,
                'health_monitoring': True,
                'audit_logging': True
            },
            'providers_count': len(admin_providers),
            'version': '1.0.0'
        })

    @_app.route('/api/admin/providers', methods=['GET'])
    @require_admin_auth
    def list_providers():
        """List all available providers"""
        try:
            providers_list = []

            for provider_id, provider in admin_providers.items():
                config = admin_configurations.get(provider_id, {}).get('config', {})
                template = PROVIDER_TEMPLATES.get(provider_id, {})

                provider_data = {
                    **provider,
                    'config': config,
                    'available_models': template.get('models', []),
                    'default_model': template.get('default_model'),
                    'config_schema': template.get('config_schema', {})
                }

                providers_list.append(provider_data)

            providers_list.sort(key=lambda x: (x['category'], x['name']))

            log_admin_action('List Providers', 'all', f"Retrieved {len(providers_list)} providers")

            return jsonify({
                'success': True,
                'providers': providers_list,
                'total_count': len(providers_list),
                'timestamp': datetime.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Error listing providers: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Failed to list providers: {str(e)}'
            }), 500

    # =====================================================
    # ERROR HANDLERS
    # =====================================================

    @_app.errorhandler(404)
    def not_found(error):
        logger.warning(f"404 NOT FOUND: {request.method} {request.path}")
        return jsonify({'error': 'Not found', 'path': request.path, 'method': request.method}), 404

    @_app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    @_app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized'}), 401

    # JWT error handlers — get the JWT manager from app extensions
    _jwt = _app.extensions.get('flask-jwt-extended')
    if _jwt:
        @_jwt.expired_token_loader
        def expired_token_callback(jwt_header, jwt_payload):
            return jsonify({'message': 'Token has expired'}), 401

        @_jwt.invalid_token_loader
        def invalid_token_callback(error):
            return jsonify({'message': 'Invalid token'}), 401

        @_jwt.unauthorized_loader
        def missing_token_callback(error):
            return jsonify({'message': 'Authorization token is required'}), 401

    # Run table initialization within the app context
    try:
        with _app.app_context():
            initialize_default_providers()
            ensure_cv_tables_exist()
            ensure_vacancy_tables_exist()
            ensure_application_tables_exist()
            ensure_fallback_schools_exist()
            logger.info("✅ Inline route initialization complete (tables + providers)")
    except Exception as e:
        logger.error(f"Inline route initialization error: {e}")

    # NOTE: This duplicate route has been REMOVED. The correct implementation
    # is in routes/recruiter_dashboard_api.py which includes:
    # REMOVED: get_recent_applicants was dead code ΓÇö shadowed by
    # recruiter_dashboard_api.get_recent_applicants (registered first via blueprint).
    @_app.route('/api/recruiter/job-shortlist-count', methods=['GET'])
    def get_job_shortlist_count():
        """Get shortlist counts for all jobs"""
        try:
            query = """
                SELECT
                    jp.jd_id as job_id,
                    jp.title as job_title,
                    COUNT(*) as total_shortlisted,
                    COUNT(CASE WHEN s.status = 'shortlisted' THEN 1 END) as shortlisted,
                    COUNT(CASE WHEN s.status = 'contacted' THEN 1 END) as contacted,
                    COUNT(CASE WHEN s.status = 'interview_scheduled' THEN 1 END) as interview_scheduled,
                    COUNT(CASE WHEN s.status = 'interviewed' THEN 1 END) as interviewed,
                    COUNT(CASE WHEN s.status = 'offer_sent' THEN 1 END) as offer_sent,
                    COUNT(CASE WHEN s.status = 'hired' THEN 1 END) as hired,
                    COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected,
                    MAX(s.created_at) as last_shortlist_date
                FROM shortlisted_candidates s
                JOIN job_postings jp ON s.job_id = jp.id
                GROUP BY jp.jd_id, jp.title
                ORDER BY last_shortlist_date DESC
            """

            results = execute_query(query) or []

            shortlist_counts = []
            for row in results:
                row_dict = dict(row)
                if row_dict.get('last_shortlist_date'):
                    row_dict['last_shortlist_date'] = row_dict['last_shortlist_date'].isoformat()
                shortlist_counts.append(row_dict)

            return jsonify({
                'success': True,
                'data': shortlist_counts
            }), 200

        except Exception as e:
            logger.error(f"Get job shortlist count error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'message': 'Failed to get shortlist counts'}), 500


    # REMOVED: match_candidates_for_jd was dead code ΓÇö its two route decorators
    # (/api/recruiter/jobs/<job_id>/applicants and /api/recruiter/jd/<jd_id>/match-candidates)
    # were both shadowed by handlers registered first:
    # - get_job_applicants (app.py line 337) for the /applicants route
    # - jd_routes_v2.match_candidates for the /match-candidates route
    # ============================================================================
    # RECRUITER OFFERS ENDPOINTS
    # ============================================================================

    @_app.route('/api/recruiter/offers/jd/<jd_id>', methods=['GET'])
    def get_offers_for_job(jd_id):
        """Get all offers for a specific job description"""
        try:
            # Query the offers table using job_posting_id (existing schema)
            # The existing schema uses: job_posting_id (UUID), candidate_id (INTEGER), offer_data (JSONB)
            query = """
                SELECT
                    o.id as offer_id,
                    o.job_posting_id,
                    o.candidate_id,
                    o.recruiter_id,
                    o.offer_data,
                    o.status,
                    o.expires_at,
                    o.signed_at,
                    o.accepted_at,
                    o.declined_at,
                    o.created_at,
                    o.updated_at
                FROM offers o
                WHERE o.job_posting_id = %s::uuid
                ORDER BY o.created_at DESC
            """

            results = execute_query(query, (jd_id,)) or []

            offers = []
            for row in results:
                row_dict = dict(row)

                # Extract offer_data JSONB fields into top-level fields
                offer_data = row_dict.get('offer_data', {})
                if isinstance(offer_data, str):
                    try:
                        offer_data = json.loads(offer_data)
                    except:
                        offer_data = {}

                # Map offer_data fields to expected frontend fields
                row_dict['jd_id'] = str(row_dict.get('job_posting_id', ''))
                row_dict['position_title'] = offer_data.get('position_title', '')
                row_dict['salary_amount'] = offer_data.get('salary_amount')
                row_dict['salary_currency'] = offer_data.get('salary_currency', 'AED')
                row_dict['salary_period'] = offer_data.get('salary_period', 'annual')
                row_dict['benefits'] = offer_data.get('benefits', {})
                row_dict['start_date'] = offer_data.get('start_date')
                row_dict['employment_type'] = offer_data.get('employment_type', 'full-time')
                row_dict['probation_period_months'] = offer_data.get('probation_period_months', 3)
                row_dict['work_location'] = offer_data.get('work_location', '')
                row_dict['notes'] = offer_data.get('notes', '')
                row_dict['shortlist_id'] = offer_data.get('shortlist_id')
                row_dict['expiry_date'] = row_dict.get('expires_at')

                # Convert datetime fields
                for field in ['created_at', 'updated_at', 'expires_at', 'signed_at', 'accepted_at', 'declined_at']:
                    if row_dict.get(field):
                        row_dict[field] = row_dict[field].isoformat() if hasattr(row_dict[field], 'isoformat') else str(row_dict[field])

                # Try to get candidate info
                candidate_id = row_dict.get('candidate_id')
                if candidate_id:
                    try:
                        # Try to get from users table first
                        user_query = "SELECT first_name, last_name, email FROM users WHERE id = %s LIMIT 1"
                        user_result = execute_query(user_query, (candidate_id,))
                        if user_result and len(user_result) > 0:
                            row_dict['first_name'] = user_result[0].get('first_name', '')
                            row_dict['last_name'] = user_result[0].get('last_name', '')
                            row_dict['email'] = user_result[0].get('email', '')
                        else:
                            # Try user_cvs
                            cv_query = "SELECT personal_info FROM user_cvs WHERE user_id = %s LIMIT 1"
                            cv_result = execute_query(cv_query, (candidate_id,))
                            if cv_result and len(cv_result) > 0:
                                personal_info = cv_result[0].get('personal_info', {})
                                if isinstance(personal_info, str):
                                    personal_info = json.loads(personal_info)
                                row_dict['first_name'] = personal_info.get('fullName', '').split(' ')[0] if personal_info.get('fullName') else ''
                                row_dict['last_name'] = ' '.join(personal_info.get('fullName', '').split(' ')[1:]) if personal_info.get('fullName') else ''
                                row_dict['email'] = personal_info.get('email', '')
                            else:
                                row_dict['first_name'] = ''
                                row_dict['last_name'] = ''
                                row_dict['email'] = ''
                    except Exception as e:
                        logger.warning(f"Could not get candidate info: {e}")
                        row_dict['first_name'] = ''
                        row_dict['last_name'] = ''
                        row_dict['email'] = ''

                offers.append(row_dict)

            # Also check job_offers table (fallback for legacy data)
            if len(offers) == 0:
                try:
                    # Try to convert jd_id to integer for job_offers table
                    job_id_int = None
                    try:
                        job_id_int = int(jd_id)
                    except (ValueError, TypeError):
                        pass

                    if job_id_int:
                        fallback_query = """
                            SELECT
                                o.id as offer_id,
                                o.job_id,
                                o.candidate_id,
                                o.recruiter_id,
                                o.position_title,
                                o.salary_offered as salary_amount,
                                o.currency as salary_currency,
                                o.start_date,
                                o.offer_expiry as expiry_date,
                                o.benefits,
                                o.status,
                                o.notes,
                                o.created_at,
                                o.updated_at
                            FROM job_offers o
                            WHERE o.job_id = %s
                            ORDER BY o.created_at DESC
                        """
                        fallback_results = execute_query(fallback_query, (job_id_int,)) or []
                        for row in fallback_results:
                            row_dict = dict(row)
                            row_dict['jd_id'] = str(jd_id)
                            row_dict['salary_period'] = 'monthly'
                            row_dict['employment_type'] = 'full-time'
                            for field in ['created_at', 'updated_at', 'start_date', 'expiry_date']:
                                if row_dict.get(field):
                                    row_dict[field] = row_dict[field].isoformat() if hasattr(row_dict[field], 'isoformat') else str(row_dict[field])
                            offers.append(row_dict)
                except Exception as fallback_err:
                    logger.warning(f"Fallback job_offers query failed: {fallback_err}")

            logger.info(f"Found {len(offers)} offers for job {jd_id}")

            return jsonify({
                'success': True,
                'offers': offers,
                'count': len(offers)
            }), 200

        except Exception as e:
            logger.error(f"Get offers for job error: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return empty array instead of error to prevent UI crash
            return jsonify({
                'success': True,
                'offers': [],
                'count': 0,
                'message': f'Error: {str(e)}'
            }), 200


    @_app.route('/api/recruiter/offers/statistics/<jd_id>', methods=['GET'])
    def get_offer_statistics(jd_id):
        """Get offer statistics for a specific job description"""
        try:
            # Use job_posting_id for existing schema
            query = """
                SELECT
                    COUNT(*) as total_offers,
                    COUNT(CASE WHEN status = 'draft' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
                    COUNT(CASE WHEN status = 'accepted' OR status = 'signed' THEN 1 END) as accepted,
                    COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined,
                    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
                    COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn
                FROM offers
                WHERE job_posting_id = %s::uuid
            """

            result = execute_query(query, (jd_id,))

            if result and len(result) > 0:
                stats = dict(result[0])
                return jsonify({
                    'success': True,
                    'statistics': stats
                }), 200

            return jsonify({
                'success': True,
                'statistics': {
                    'total_offers': 0,
                    'pending': 0,
                    'sent': 0,
                    'accepted': 0,
                    'declined': 0,
                    'expired': 0,
                    'withdrawn': 0
                }
            }), 200

        except Exception as e:
            logger.error(f"Get offer statistics error: {str(e)}")
            return jsonify({
                'success': True,
                'statistics': {
                    'total_offers': 0,
                    'pending': 0,
                    'sent': 0,
                    'accepted': 0,
                    'declined': 0,
                    'expired': 0,
                    'withdrawn': 0
                }
            }), 200


    # REMOVED: create_offer was dead code ΓÇö its two route decorators
    # (/api/recruiter/offers POST and /api/recruiter/offers/create POST)
    # were both shadowed by recruiter_dashboard_api handlers registered first:
    # - recruiter_dashboard_api.create_offer
    # - recruiter_dashboard_api.create_offer_legacy
    @_app.route('/api/recruiter/offers/<offer_id>', methods=['PUT'])
    def update_offer(offer_id):
        """Update an existing offer"""
        try:
            data = request.get_json()

            updates = []
            params = []

            if 'status' in data:
                updates.append("status = %s")
                params.append(data['status'])
            if 'salary_amount' in data:
                updates.append("salary_amount = %s")
                params.append(data['salary_amount'])
            if 'salary_offered' in data:  # Legacy support
                updates.append("salary_amount = %s")
                params.append(data['salary_offered'])
            if 'start_date' in data:
                updates.append("start_date = %s")
                params.append(data['start_date'])
            if 'expiry_date' in data:
                updates.append("expiry_date = %s")
                params.append(data['expiry_date'])
            if 'benefits' in data:
                updates.append("benefits = %s")
                params.append(json.dumps(data['benefits']))
            if 'notes' in data:
                updates.append("notes = %s")
                params.append(data['notes'])

            if not updates:
                return jsonify({'success': False, 'message': 'No fields to update'}), 400

            updates.append("updated_at = NOW()")
            params.append(offer_id)

            query = f"UPDATE offers SET {', '.join(updates)} WHERE id = %s"
            execute_query(query, tuple(params))

            return jsonify({
                'success': True,
                'message': 'Offer updated successfully'
            }), 200

        except Exception as e:
            logger.error(f"Update offer error: {str(e)}")
            return jsonify({'success': False, 'message': f'Failed to update offer: {str(e)}'}), 500


    # ============================================================================
    # RECRUITER COMMUNICATION TEMPLATES ENDPOINTS
    # ============================================================================

    @_app.route('/api/recruiter/communication/templates', methods=['GET'])
    def get_communication_templates():
        """Get communication templates for recruiters"""
        try:
            # Return default templates if no custom templates exist
            default_templates = [
                {
                    'id': 'interview_invitation',
                    'name': 'Interview Invitation',
                    'type': 'email',
                    'subject': 'Interview Invitation - {{job_title}} at {{company}}',
                    'body': '''Dear {{candidate_name}},

    We are pleased to invite you for an interview for the {{job_title}} position at {{company}}.

    Interview Details:
    - Date: {{interview_date}}
    - Time: {{interview_time}}
    - Location: {{interview_location}}

    Please confirm your availability by replying to this email.

    Best regards,
    {{recruiter_name}}
    {{company}}'''
                },
                {
                    'id': 'offer_letter',
                    'name': 'Offer Letter',
                    'type': 'email',
                    'subject': 'Job Offer - {{job_title}} at {{company}}',
                    'body': '''Dear {{candidate_name}},

    We are delighted to offer you the position of {{job_title}} at {{company}}.

    Offer Details:
    - Position: {{job_title}}
    - Salary: {{salary}} AED per month
    - Start Date: {{start_date}}
    - Benefits: {{benefits}}

    Please review the attached offer letter and confirm your acceptance by {{expiry_date}}.

    We look forward to welcoming you to our team!

    Best regards,
    {{recruiter_name}}
    {{company}}'''
                },
                {
                    'id': 'rejection',
                    'name': 'Application Update',
                    'type': 'email',
                    'subject': 'Application Update - {{job_title}} at {{company}}',
                    'body': '''Dear {{candidate_name}},

    Thank you for your interest in the {{job_title}} position at {{company}} and for taking the time to apply.

    After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

    We encourage you to apply for future opportunities that match your skills and experience.

    We wish you the best in your career journey.

    Best regards,
    {{recruiter_name}}
    {{company}}'''
                },
                {
                    'id': 'follow_up',
                    'name': 'Follow Up',
                    'type': 'email',
                    'subject': 'Following Up - {{job_title}} Application',
                    'body': '''Dear {{candidate_name}},

    I hope this message finds you well. I wanted to follow up regarding your application for the {{job_title}} position at {{company}}.

    {{custom_message}}

    Please feel free to reach out if you have any questions.

    Best regards,
    {{recruiter_name}}
    {{company}}'''
                }
            ]

            return jsonify({
                'success': True,
                'templates': default_templates,
                'count': len(default_templates)
            }), 200

        except Exception as e:
            logger.error(f"Get communication templates error: {str(e)}")
            return jsonify({
                'success': True,
                'templates': [],
                'count': 0
            }), 200


    @_app.route('/api/recruiter/analytics', methods=['GET', 'OPTIONS'])
    def recruiter_analytics():
        if request.method == 'OPTIONS':
            return jsonify({'success': True}), 200

        return jsonify({
            'success': True,
            'data': {
                'total_matches': 12,
                'average_score': 78.5,
                'qualification_rate': 65.0,
                'stored_data': {'cvs': 15},
                'score_distribution': {'excellent': 4, 'good': 5, 'fair': 2, 'poor': 1},
                'top_skills': [{'skill': 'Python', 'frequency': 8}, {'skill': 'React', 'frequency': 5}]
            }
        })

