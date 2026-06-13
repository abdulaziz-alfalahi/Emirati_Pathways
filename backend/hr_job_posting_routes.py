"""
HR/Recruiter Job Posting Routes
Emirati Journey Platform - Job Posting Functionality with UAE Compliance
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime, timedelta
import uuid
import os
import json
from backend.db import get_db_connection
from backend.user_helpers import user_display_name
import re
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
hr_job_posting_bp = Blueprint('hr_job_posting', __name__, url_prefix='/api/hr/jobs')



class UAEComplianceChecker:
    """UAE Labor Law and Emiratization Compliance Checker"""
    
    @staticmethod
    def check_job_posting_compliance(job_data):
        """Check job posting for UAE compliance"""
        compliance_issues = []
        compliance_score = 100
        
        # Check for discriminatory language
        discriminatory_terms = [
            'male only', 'female only', 'men only', 'women only',
            'young', 'old', 'age limit', 'specific nationality',
            'religion', 'marital status'
        ]
        
        description = job_data.get('description', '').lower()
        title = job_data.get('title', '').lower()
        requirements = str(job_data.get('requirements', {})).lower()
        
        full_text = f"{title} {description} {requirements}"
        
        for term in discriminatory_terms:
            if term in full_text:
                compliance_issues.append({
                    'type': 'discrimination',
                    'severity': 'high',
                    'message': f"Potentially discriminatory language detected: '{term}'",
                    'suggestion': 'Remove discriminatory language and focus on job-related qualifications'
                })
                compliance_score -= 20
        
        # Check Emiratization requirements
        emiratization_target = job_data.get('emiratization_target', 0)
        if emiratization_target < 2:
            compliance_issues.append({
                'type': 'emiratization',
                'severity': 'medium',
                'message': 'Low Emiratization target. Consider UAE national preference.',
                'suggestion': 'Set appropriate Emiratization target (minimum 2% for private sector)'
            })
            compliance_score -= 10
        
        # Check salary disclosure
        salary_min = job_data.get('salary_range_min')
        salary_max = job_data.get('salary_range_max')
        
        if not salary_min or not salary_max:
            compliance_issues.append({
                'type': 'salary_transparency',
                'severity': 'medium',
                'message': 'Salary range not specified',
                'suggestion': 'Include salary range for transparency (UAE Labor Law recommendation)'
            })
            compliance_score -= 15
        
        # Check visa sponsorship
        visa_sponsorship = job_data.get('visa_sponsorship_available', False)
        if not visa_sponsorship and 'uae' not in full_text:
            compliance_issues.append({
                'type': 'visa_sponsorship',
                'severity': 'low',
                'message': 'Visa sponsorship availability not specified',
                'suggestion': 'Clarify visa sponsorship availability for international candidates'
            })
            compliance_score -= 5
        
        # Check Arabic language requirement disclosure
        if 'arabic' in requirements and 'required' in requirements:
            # This is actually good for UAE compliance
            pass
        elif 'customer service' in full_text or 'client facing' in full_text:
            compliance_issues.append({
                'type': 'language_requirement',
                'severity': 'low',
                'message': 'Arabic language requirement not specified for customer-facing role',
                'suggestion': 'Consider specifying Arabic language requirements for customer-facing positions'
            })
            compliance_score -= 5
        
        return {
            'is_compliant': len([issue for issue in compliance_issues if issue['severity'] == 'high']) == 0,
            'compliance_score': max(0, compliance_score),
            'issues': compliance_issues,
            'recommendations': UAEComplianceChecker._get_compliance_recommendations(job_data)
        }
    
    @staticmethod
    def _get_compliance_recommendations(job_data):
        """Get UAE-specific compliance recommendations"""
        recommendations = []
        
        # Emiratization recommendations
        recommendations.append({
            'category': 'emiratization',
            'title': 'Emiratization Compliance',
            'description': 'Ensure compliance with UAE Emiratization requirements',
            'actions': [
                'Set appropriate Emiratization targets',
                'Highlight opportunities for UAE nationals',
                'Consider mentorship programs for Emirati employees'
            ]
        })
        
        # Language recommendations
        recommendations.append({
            'category': 'language',
            'title': 'Language Requirements',
            'description': 'Specify language requirements clearly',
            'actions': [
                'Specify Arabic language proficiency if required',
                'Indicate if bilingual capabilities are preferred',
                'Clarify communication requirements'
            ]
        })
        
        # Benefits recommendations
        recommendations.append({
            'category': 'benefits',
            'title': 'UAE Standard Benefits',
            'description': 'Include standard UAE employment benefits',
            'actions': [
                'Health insurance coverage',
                'Annual leave (minimum 30 days)',
                'End of service benefits',
                'Professional development opportunities'
            ]
        })
        
        return recommendations

def _get_company_id_for_user(cursor, user_id: str):
    cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    return row['company_id'] if row and row.get('company_id') else None

def ensure_job_postings_table_exists():
    """Ensure job_postings and related tables exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # job_postings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_postings (
                id SERIAL PRIMARY KEY,
                jd_id VARCHAR(100) UNIQUE NOT NULL,
                recruiter_id VARCHAR(100) NOT NULL,
                company_id UUID,
                created_by VARCHAR(100),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                requirements JSONB,
                responsibilities JSONB,
                benefits JSONB,
                salary_range_min DECIMAL,
                salary_range_max DECIMAL,
                currency VARCHAR(10) DEFAULT 'AED',
                location VARCHAR(255),
                remote_option BOOLEAN DEFAULT FALSE,
                employment_type VARCHAR(50),
                experience_level VARCHAR(50),
                status VARCHAR(50) DEFAULT 'draft',
                priority_level VARCHAR(20) DEFAULT 'normal',
                application_deadline DATE,
                expires_at DATE,
                uae_compliance_checked BOOLEAN DEFAULT FALSE,
                emiratization_target INTEGER DEFAULT 0,
                visa_sponsorship_available BOOLEAN DEFAULT FALSE,
                tags JSONB,
                seo_keywords JSONB,
                latitude DECIMAL,
                longitude DECIMAL,
                views_count INTEGER DEFAULT 0,
                applications_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                published_at TIMESTAMP
            )
        """)
        
        # job_shortlists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_shortlists (
                job_posting_id INTEGER REFERENCES job_postings(id) ON DELETE CASCADE,
                candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
                added_by UUID REFERENCES users(id) ON DELETE SET NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (job_posting_id, candidate_id)
            )
        """)
        
        conn.commit()
        logger.info("✅ Job Posting tables initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Job Posting tables: {e}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

def _uploads_dir() -> str:
    base_dir = os.getenv('JOB_DOCS_UPLOAD_DIR')
    if not base_dir:
        base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'job_documents')
    os.makedirs(base_dir, exist_ok=True)
    return base_dir

@hr_job_posting_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for job posting functionality"""
    return jsonify({
        'success': True,
        'message': 'HR Job Posting API is operational',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Job creation and management',
            'UAE compliance checking',
            'Job templates',
            'Application tracking',
            'Emiratization compliance'
        ]
    })

@hr_job_posting_bp.route('', methods=['GET'])
@jwt_required()
def get_job_postings():
    """Get job postings for the HR user's company"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        
        # Get query parameters
        status = request.args.get('status', 'all')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        offset = int(request.args.get('offset', 0))
        search = request.args.get('search', '')

        logger.info(f"DEBUG: Fetching jobs for user {current_user_id}, status={status}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Try to get company ID, but don't hard fail if missing
            company_id = None
            try:
                cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (current_user_id,))
                hr_profile = cursor.fetchone()
                company_id = hr_profile['company_id'] if hr_profile else None
            except Exception as e:
                # Rollback the failed transaction and continue without company filter
                conn.rollback()
                logger.warning(f"Could not fetch hr_profile (table may not exist): {e}")
            
            # Get user role from JWT claims
            user_role = claims.get('role', '') if claims else ''
            
            # Build query
            where_conditions = []
            params = []
            
            if company_id:
                # If user has a company, show company jobs and their own jobs
                where_conditions.append("(jp.company_id::text = %s OR jp.recruiter_id::text = %s)")
                params.extend([company_id, current_user_id])
            elif user_role == 'admin':
                # Admins can see all job postings
                logger.info(f"Admin {current_user_id} viewing all job postings")
                # No filter needed - show all jobs
                pass
            else:
                # Regular recruiters AND HR Managers without company only see their own jobs
                where_conditions.append("jp.recruiter_id::text = %s")
                params.append(current_user_id)
            
            if status != 'all':
                where_conditions.append("jp.status = %s")
                params.append(status)
            
            if search:
                where_conditions.append("(jp.title ILIKE %s OR jp.description ILIKE %s)")
                search_term = f"%{search}%"
                params.extend([search_term, search_term])
            
            # Build WHERE clause - handle empty conditions
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            else:
                where_clause = ""  # No filter for HR Managers/Admins
            
            # Get job postings with application counts
            # Note: job_postings table uses jd_id as primary key and recruiter_id for creator
            # Use subquery to avoid GROUP BY issues with PostgreSQL
            # Column names based on actual table structure from /api/recruiter/jd/list
            cursor.execute(f"""
                SELECT 
                    jp.jd_id,
                    jp.id,
                    jp.title,
                    jp.description,
                    jp.company_id,
                    jp.city,
                    jp.emirate,
                    jp.location,
                    jp.department,
                    jp.compensation,
                    jp.currency,
                    jp.salary_range_min,
                    jp.salary_range_max,
                    jp.employment_type,
                    jp.job_type,
                    jp.job_level,
                    jp.experience_level,
                    jp.education_level,
                    jp.status,
                    jp.requirements,
                    jp.responsibilities,
                    jp.benefits,
                    jp.tags,
                    jp.seo_keywords,
                    jp.recruiter_id,
                    jp.created_at,
                    jp.updated_at,
                    jp.published_at,
                    jp.expires_at,
                    jp.application_deadline,
                    jp.emiratization_target,
                    jp.number_of_vacancies,
                    jp.remote_option,
                    jp.applications_count,
                    jp.views_count,
                    COALESCE(c.name, jp.company_id, 'Unknown Company') as company_name,
                    {user_display_name('created_by_name')},
                    COALESCE(app_counts.application_count, 0) as application_count,
                    COALESCE(app_counts.new_applications, 0) as new_applications
                FROM job_postings jp
                LEFT JOIN users u ON jp.recruiter_id::text = u.id::text
                LEFT JOIN companies c ON jp.company_id::uuid = c.id
                LEFT JOIN (
                    SELECT 
                        job_id,
                        COUNT(*) as application_count,
                        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as new_applications
                    FROM job_applications
                    GROUP BY job_id
                ) app_counts ON (jp.jd_id::text = app_counts.job_id::text OR jp.id::text = app_counts.job_id::text)
                {where_clause}
                ORDER BY jp.created_at DESC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            
            job_postings = cursor.fetchall()
            
            # Get total count
            count_where = where_clause if where_clause else ""
            cursor.execute(f"""
                SELECT COUNT(DISTINCT jp.jd_id)
                FROM job_postings jp
                {count_where}
            """, params)
            
            total_count = cursor.fetchone()['count']
            
            # Convert to list of dicts and parse JSONB fields
            jobs_data = []
            for job in job_postings:
                job_data = dict(job)
                
                # Parse JSONB fields
                jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
                for field in jsonb_fields:
                    if job_data.get(field):
                        try:
                            if isinstance(job_data[field], str):
                                job_data[field] = json.loads(job_data[field])
                        except (json.JSONDecodeError, TypeError):
                            job_data[field] = {}
                
                jobs_data.append(job_data)
            
            # Convert datetime/date objects to strings
            # Convert datetime/date, Decimal, UUID objects to strings
            from datetime import date, datetime
            from decimal import Decimal
            from uuid import UUID
            
            for job in jobs_data:
                for key, value in job.items():
                    if isinstance(value, (datetime, date, Decimal, UUID)):
                        # logger.info(f"DEBUG: Converting {key} {type(value)} to string")
                        job[key] = str(value)
                        if isinstance(value, (datetime, date)):
                            job[key] = value.isoformat()
            
            logger.info("DEBUG: Serialization complete, returning JSON")
            
            return jsonify({
                'success': True,
                'data': {
                    'job_postings': jobs_data,
                    'total_count': total_count,
                    'current_page': offset // limit + 1,
                    'total_pages': (total_count + limit - 1) // limit
                },
                'jobs': jobs_data
            })
            
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"CRITICAL ERROR in get_job_postings: {str(e)}\n{error_details}")
        return jsonify({
            'success': False,
            'error': str(e),
            'details': error_details
        }), 500
            


@hr_job_posting_bp.route('/batch', methods=['POST'])
@jwt_required()
def create_job_postings_batch():
    """Create a batch of job postings in one request"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        data = request.get_json() or {}
        jobs = data.get('jobs', [])
        if not isinstance(jobs, list) or not jobs:
            return jsonify({'success': False, 'message': 'jobs array is required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        created = []
        try:
            company_id = _get_company_id_for_user(cursor, current_user_id)
            if not company_id:
                return jsonify({'success': False, 'message': 'No company associated with your profile'}), 400

            for job in jobs:
                if not job.get('title') or not job.get('description'):
                    return jsonify({'success': False, 'message': 'Each job requires title and description'}), 400

                compliance_result = UAEComplianceChecker.check_job_posting_compliance(job)
                
                # Generate a jd_id (used as public ID) instead of primary key id
                jd_id = str(uuid.uuid4())

                application_deadline = None
                expires_at = None
                if job.get('application_deadline'):
                    try:
                        application_deadline = datetime.strptime(job['application_deadline'], '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({'success': False, 'message': 'Invalid application_deadline format. Use YYYY-MM-DD'}), 400
                if job.get('expires_at'):
                    try:
                        expires_at = datetime.strptime(job['expires_at'], '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({'success': False, 'message': 'Invalid expires_at format. Use YYYY-MM-DD'}), 400
                
                cursor.execute(
                    """
                    INSERT INTO job_postings (
                        jd_id, recruiter_id, company_id, created_by, title, description, requirements,
                        responsibilities, benefits, salary_range_min, salary_range_max,
                        currency, location, remote_option, employment_type,
                        experience_level, status, priority_level, application_deadline,
                        expires_at, uae_compliance_checked, emiratization_target,
                        visa_sponsorship_available, tags, seo_keywords,
                        latitude, longitude
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) RETURNING *
                    """,
                    (
                        jd_id,
                        current_user_id, # recruiter_id
                        company_id, 
                        current_user_id, # created_by matches recruiter_id
                        job['title'], 
                        job['description'],
                        json.dumps(job.get('requirements', {})),
                        json.dumps(job.get('responsibilities', [])),
                        json.dumps(job.get('benefits', [])),
                        job.get('salary_range_min'),
                        job.get('salary_range_max'),
                        job.get('currency', 'AED'),
                        job.get('location'),
                        job.get('remote_work_allowed', False),
                        job.get('employment_type', 'full-time'),
                        job.get('experience_level', 'mid'),
                        job.get('status', 'draft'),
                        job.get('priority_level', 'normal'),
                        application_deadline,
                        expires_at,
                        compliance_result['is_compliant'],
                        job.get('emiratization_target', 0),
                        job.get('visa_sponsorship_available', False),
                        json.dumps(job.get('tags', [])),
                        json.dumps(job.get('seo_keywords', [])),
                        job.get('latitude'),
                        job.get('longitude')
                    )
                )
                created.append(dict(cursor.fetchone()))

            conn.commit()
            return jsonify({'success': True, 'message': 'Batch created successfully', 'data': created}), 201
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error creating job postings batch: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create batch'}), 500

@hr_job_posting_bp.route('/', methods=['POST'])
@jwt_required()
def create_job_posting():
    """Create a new job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get company ID from HR profile
            cursor.execute("""
                SELECT company_id FROM hr_profiles WHERE user_id = %s
            """, (current_user_id,))
            
            hr_profile = cursor.fetchone()
            if not hr_profile or not hr_profile['company_id']:
                return jsonify({
                    'success': False,
                    'message': 'No company associated with your profile'
                }), 400
            
            company_id = hr_profile['company_id']
            
            # Run UAE compliance check
            compliance_result = UAEComplianceChecker.check_job_posting_compliance(data)
            
            # Prepare job posting data
            # Generate jd_id for the job posting (required field)
            jd_id = f"jd_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
            
            # Parse dates
            application_deadline = None
            expires_at = None
            
            if data.get('application_deadline'):
                try:
                    application_deadline = datetime.strptime(data['application_deadline'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid application_deadline format. Use YYYY-MM-DD'
                    }), 400
            
            if data.get('expires_at'):
                try:
                    expires_at = datetime.strptime(data['expires_at'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid expires_at format. Use YYYY-MM-DD'
                    }), 400
            
            # Insert job posting - using actual table schema
            # Table has: id (auto-increment INTEGER), jd_id, recruiter_id, company_id, title, etc.
            # Note: remote_option instead of remote_work_allowed
            cursor.execute("""
                INSERT INTO job_postings (
                    jd_id, recruiter_id, company_id, created_by, title, description, requirements,
                    responsibilities, benefits, salary_range_min, salary_range_max,
                    currency, location, remote_option, employment_type,
                    experience_level, status, priority_level, application_deadline,
                    expires_at, uae_compliance_checked, emiratization_target,
                    visa_sponsorship_available, tags, seo_keywords,
                    latitude, longitude
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING *
            """, (
                jd_id,
                str(current_user_id),  # recruiter_id as varchar
                str(company_id),  # company_id as varchar
                current_user_id,  # created_by as integer
                data['title'], 
                data['description'],
                json.dumps(data.get('requirements', {})),
                json.dumps(data.get('responsibilities', [])),
                json.dumps(data.get('benefits', [])),
                data.get('salary_range_min'),
                data.get('salary_range_max'),
                data.get('currency', 'AED'),
                data.get('location'),
                data.get('remote_option', data.get('remote_work_allowed', False)),  # Support both field names
                data.get('employment_type', 'full-time'),
                data.get('experience_level', 'mid'),
                data.get('status', 'draft'),
                data.get('priority_level', 'normal'),
                application_deadline,
                expires_at,
                compliance_result['is_compliant'],
                data.get('emiratization_target', 0),
                data.get('visa_sponsorship_available', False),
                json.dumps(data.get('tags', [])),
                json.dumps(data.get('seo_keywords', [])),
                data.get('latitude'),
                data.get('longitude')
            ))
            
            new_job = cursor.fetchone()
            
            # Insert detailed requirements if provided
            if data.get('detailed_requirements'):
                for req in data['detailed_requirements']:
                    cursor.execute("""
                        INSERT INTO job_requirements (
                            job_posting_id, requirement_type, requirement_name,
                            requirement_level, proficiency_level, years_required,
                            description, weight
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        job_id, req.get('type'), req.get('name'),
                        req.get('level', 'required'), req.get('proficiency'),
                        req.get('years_required'), req.get('description'),
                        req.get('weight', 1.0)
                    ))
            
            # Insert detailed benefits if provided
            if data.get('detailed_benefits'):
                for benefit in data['detailed_benefits']:
                    cursor.execute("""
                        INSERT INTO job_benefits (
                            job_posting_id, benefit_category, benefit_name,
                            benefit_description, benefit_value, is_highlighted
                        ) VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        job_id, benefit.get('category'), benefit.get('name'),
                        benefit.get('description'), benefit.get('value'),
                        benefit.get('is_highlighted', False)
                    ))
            
            conn.commit()
            
            # Prepare response
            job_result = dict(new_job)
            
            # Parse JSONB fields for response
            jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
            for field in jsonb_fields:
                if job_result.get(field):
                    try:
                        if isinstance(job_result[field], str):
                            job_result[field] = json.loads(job_result[field])
                    except (json.JSONDecodeError, TypeError):
                        job_result[field] = {}
            
            return jsonify({
                'success': True,
                'message': 'Job posting created successfully',
                'data': {
                    'job_posting': job_result,
                    'compliance_check': compliance_result
                }
            }), 201
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error creating job posting: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create job posting'
        }), 500

@hr_job_posting_bp.route('/<job_id>/documents', methods=['POST'])
@jwt_required()
def upload_job_document(job_id):
    """Upload a required document for a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403

        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify ownership
            cursor.execute(
                """
                SELECT jp.id
                FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
                """,
                (job_id, current_user_id),
            )
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Job posting not found or access denied'}), 404

            filename = secure_filename(file.filename)
            stored_name = f"{uuid.uuid4().hex}_{filename}"

            # Save via storage service
            try:
                from backend.services.storage import storage as _file_storage
            except ImportError:
                try:
                    from services.storage import storage as _file_storage
                except ImportError:
                    _file_storage = None

            if _file_storage:
                storage_key = _file_storage.save_upload(file, 'job_documents', stored_name)
                storage_path = storage_key
            else:
                uploads_dir = _uploads_dir()
                storage_path = os.path.join(uploads_dir, stored_name)
                file.save(storage_path)

            cursor.execute(
                """
                INSERT INTO job_documents (
                    job_posting_id, uploaded_by, document_type, original_filename,
                    stored_filename, content_type, size_bytes, storage_path
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    job_id,
                    current_user_id,
                    request.form.get('document_type'),
                    filename,
                    stored_name,
                    file.mimetype,
                    request.content_length or 0,
                    storage_path,
                ),
            )
            doc = dict(cursor.fetchone())
            conn.commit()
            # Do not expose full storage path
            doc['storage_path'] = None
            return jsonify({'success': True, 'data': doc}), 201
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error uploading job document: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to upload document'}), 500

@hr_job_posting_bp.route('/<job_id>/documents', methods=['GET'])
@jwt_required()
def list_job_documents(job_id):
    """List uploaded documents for a job posting"""
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(
                """
                SELECT jd.id, jd.document_type, jd.original_filename, jd.content_type, jd.size_bytes, jd.created_at
                FROM job_documents jd
                INNER JOIN job_postings jp ON jd.job_posting_id = jp.id
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jd.job_posting_id = %s AND hp.user_id = %s
                ORDER BY jd.created_at DESC
                """,
                (job_id, current_user_id),
            )
            docs = [dict(r) for r in cursor.fetchall()]
            return jsonify({'success': True, 'data': docs})
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error listing job documents: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to list documents'}), 500

@hr_job_posting_bp.route('/<job_id>/documents/<doc_id>', methods=['DELETE'])
@jwt_required()
def delete_job_document(job_id, doc_id):
    """Delete an uploaded document (removes DB record and file)"""
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(
                """
                SELECT jd.*
                FROM job_documents jd
                INNER JOIN job_postings jp ON jd.job_posting_id = jp.id
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jd.id = %s AND jd.job_posting_id = %s AND hp.user_id = %s
                """,
                (doc_id, job_id, current_user_id),
            )
            doc = cursor.fetchone()
            if not doc:
                return jsonify({'success': False, 'message': 'Document not found or access denied'}), 404
            # Delete DB record first
            cursor.execute("DELETE FROM job_documents WHERE id = %s", (doc_id,))
            conn.commit()
            # Attempt to remove file
            try:
                if doc.get('storage_path') and os.path.exists(doc['storage_path']):
                    os.remove(doc['storage_path'])
            except Exception:
                pass
            return jsonify({'success': True, 'message': 'Document deleted'})
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error deleting job document: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete document'}), 500

@hr_job_posting_bp.route('/<job_id>', methods=['GET'])
@jwt_required()
def get_job_posting(job_id):
    """Get a specific job posting"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get job posting with company verification
            cursor.execute(f"""
                SELECT 
                    jp.*,
                    c.name as company_name,
                    {user_display_name('created_by_name')},
                    COUNT(ja.id) as application_count
                FROM job_postings jp
                LEFT JOIN companies c ON jp.company_id::text = c.id::text
                LEFT JOIN users u ON jp.created_by = u.id
                LEFT JOIN hr_profiles hp ON jp.company_id::text = hp.company_id::text
                LEFT JOIN job_applications ja ON jp.id::text = ja.job_id::text
                WHERE jp.id = %s AND hp.user_id = %s
                GROUP BY jp.id, c.name, u.full_name, u.first_name, u.last_name, u.email
            """, (job_id, current_user_id))
            
            job = cursor.fetchone()
            
            if not job:
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            job_data = dict(job)
            
            # Parse JSONB fields
            jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
            for field in jsonb_fields:
                if job_data.get(field):
                    try:
                        if isinstance(job_data[field], str):
                            job_data[field] = json.loads(job_data[field])
                    except (json.JSONDecodeError, TypeError):
                        job_data[field] = {}
            
            # Get detailed requirements
            cursor.execute("""
                SELECT * FROM job_requirements WHERE job_posting_id = %s ORDER BY requirement_type, requirement_name
            """, (job_id,))
            detailed_requirements = [dict(req) for req in cursor.fetchall()]
            
            # Get detailed benefits
            cursor.execute("""
                SELECT * FROM job_benefits WHERE job_posting_id = %s ORDER BY benefit_category, benefit_name
            """, (job_id,))
            detailed_benefits = [dict(benefit) for benefit in cursor.fetchall()]
            
            job_data['detailed_requirements'] = detailed_requirements
            job_data['detailed_benefits'] = detailed_benefits
            
            return jsonify({
                'success': True,
                'data': job_data
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting job posting: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job posting'
        }), 500

@hr_job_posting_bp.route('/<job_id>', methods=['PUT'])
@jwt_required()
def update_job_posting(job_id):
    """Update a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify ownership
            cursor.execute("""
                SELECT jp.id FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            # Run compliance check if content changed
            compliance_result = None
            if any(field in data for field in ['title', 'description', 'requirements']):
                compliance_result = UAEComplianceChecker.check_job_posting_compliance(data)
            
            # Prepare update data
            update_fields = []
            update_values = []
            
            updatable_fields = [
                'title', 'description', 'salary_range_min', 'salary_range_max',
                'currency', 'location', 'remote_work_allowed', 'employment_type',
                'experience_level', 'status', 'priority_level', 'emiratization_target',
                'visa_sponsorship_available', 'latitude', 'longitude'
            ]
            
            for field in updatable_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    update_values.append(data[field])
            
            # Handle JSONB fields
            jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
            for field in jsonb_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    update_values.append(json.dumps(data[field]))
            
            # Handle date fields
            date_fields = ['application_deadline', 'expires_at']
            for field in date_fields:
                if field in data and data[field]:
                    try:
                        date_value = datetime.strptime(data[field], '%Y-%m-%d').date()
                        update_fields.append(f"{field} = %s")
                        update_values.append(date_value)
                    except ValueError:
                        return jsonify({
                            'success': False,
                            'message': f'Invalid {field} format. Use YYYY-MM-DD'
                        }), 400
            
            if compliance_result:
                update_fields.append("uae_compliance_checked = %s")
                update_values.append(compliance_result['is_compliant'])
            
            if update_fields:
                update_values.append(job_id)
                
                cursor.execute(f"""
                    UPDATE job_postings 
                    SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING *
                """, update_values)
                
                updated_job = cursor.fetchone()
                conn.commit()
                
                # Parse JSONB fields for response
                job_result = dict(updated_job)
                jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
                for field in jsonb_fields:
                    if job_result.get(field):
                        try:
                            if isinstance(job_result[field], str):
                                job_result[field] = json.loads(job_result[field])
                        except (json.JSONDecodeError, TypeError):
                            job_result[field] = {}
                
                response_data = {'job_posting': job_result}
                if compliance_result:
                    response_data['compliance_check'] = compliance_result
                
                return jsonify({
                    'success': True,
                    'message': 'Job posting updated successfully',
                    'data': response_data
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'No valid fields to update'
                }), 400
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error updating job posting: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update job posting'
        }), 500

@hr_job_posting_bp.route('/<job_id>/publish', methods=['POST'])
@jwt_required()
def publish_job_posting(job_id):
    """Publish a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify ownership and get job details
            cursor.execute("""
                SELECT jp.* FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            
            job = cursor.fetchone()
            if not job:
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            # Check if already published
            if job['status'] == 'published':
                return jsonify({
                    'success': False,
                    'message': 'Job posting is already published'
                }), 400
            
            # Run final compliance check
            job_data = dict(job)
            compliance_result = UAEComplianceChecker.check_job_posting_compliance(job_data)
            
            if not compliance_result['is_compliant']:
                return jsonify({
                    'success': False,
                    'message': 'Job posting cannot be published due to compliance issues',
                    'compliance_check': compliance_result
                }), 400
            
            # Set default expiry if not set (30 days from now)
            expires_at = job['expires_at']
            if not expires_at:
                expires_at = datetime.now().date() + timedelta(days=30)
            
            # Publish the job
            cursor.execute("""
                UPDATE job_postings 
                SET status = 'published', 
                    published_at = CURRENT_TIMESTAMP,
                    expires_at = %s,
                    uae_compliance_checked = true,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (expires_at, job_id))
            
            published_job = cursor.fetchone()
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Job posting published successfully',
                'data': {
                    'job_posting': dict(published_job),
                    'compliance_check': compliance_result,
                    'published_at': published_job['published_at'].isoformat(),
                    'expires_at': published_job['expires_at'].isoformat() if published_job['expires_at'] else None
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error publishing job posting: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to publish job posting'
        }), 500

@hr_job_posting_bp.route('/<job_id>/publish-and-match', methods=['POST'])
@jwt_required()
def publish_and_match(job_id):
    """Publish a job and return initial top-10 matching candidates"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify ownership and get job details
            cursor.execute("""
                SELECT jp.* FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            job = cursor.fetchone()
            if not job:
                return jsonify({'success': False, 'message': 'Job posting not found or access denied'}), 404

            # Publish if needed
            if job['status'] != 'published':
                expires_at = job['expires_at'] or (datetime.now().date() + timedelta(days=30))
                cursor.execute("""
                    UPDATE job_postings 
                    SET status = 'published', published_at = CURRENT_TIMESTAMP, expires_at = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s RETURNING *
                """, (expires_at, job_id))
                job = cursor.fetchone()
                conn.commit()

            # Build requirements for matching
            requirements = {}
            if job.get('requirements'):
                try:
                    requirements = json.loads(job['requirements']) if isinstance(job['requirements'], str) else job['requirements']
                except (json.JSONDecodeError, TypeError):
                    requirements = {}
            job_requirements = {
                'min_experience': (requirements or {}).get('min_experience', 0),
                'education_level': (requirements or {}).get('education_level', ''),
                'skills': (requirements or {}).get('skills', []),
                'location': job.get('location', ''),
                'salary_max': job.get('salary_range_max', 0)
            }

            # Fetch active candidates
            cursor.execute("""
                SELECT 
                    u.id, u.first_name, u.last_name, u.email, u.emirate, u.education_level,
                    u.experience_years, u.preferred_salary_min, u.preferred_salary_max,
                    u.preferred_location, u.is_uae_national, u.skills, u.last_login
                FROM users u
                WHERE u.role = 'candidate' AND u.is_active = true
                LIMIT 500
            """)
            candidates = [dict(r) for r in cursor.fetchall()]

            from hr_candidate_search_routes import CandidateSearchEngine
            matched = []
            for c in candidates:
                # Parse skills from Postgres array text if needed
                if c.get('skills') and isinstance(c['skills'], str):
                    skills_str = c['skills'].strip('{}')
                    c['skills'] = [s.strip('"') for s in skills_str.split(',') if s.strip()]
                # Calculate match score using existing engine
                score = CandidateSearchEngine.calculate_match_score(c, job_requirements)
                matched.append({
                    'candidate_id': c['id'],
                    'first_name': c.get('first_name'),
                    'last_name': c.get('last_name'),
                    'match_score': score
                })
            # Sort and take top 10
            matched.sort(key=lambda m: m['match_score']['match_percentage'], reverse=True)
            top10 = matched[:10]

            return jsonify({'success': True, 'data': {'job_posting': {'id': job['id'], 'title': job['title']}, 'top_matches': top10}})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error publish-and-match: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to publish and match'}), 500

@hr_job_posting_bp.route('/<job_id>/shortlist', methods=['GET'])
@jwt_required()
def get_job_shortlist(job_id):
    """Retrieve shortlisted candidates for a job posting"""
    try:
        current_user_id = get_jwt_identity()

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify HR ownership of the job
            cursor.execute(
                """
                SELECT 1
                FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
                """,
                (job_id, current_user_id),
            )
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Job posting not found or access denied'}), 404

            # Fetch shortlist with basic candidate info
            cursor.execute(
                """
                SELECT 
                    js.candidate_id,
                    js.notes,
                    js.created_at,
                    u.first_name,
                    u.last_name,
                    u.emirate,
                    u.education_level,
                    u.experience_years,
                    u.skills
                FROM job_shortlists js
                LEFT JOIN users u ON u.id = js.candidate_id
                WHERE js.job_posting_id = %s
                ORDER BY js.created_at DESC
                """,
                (job_id,),
            )
            rows = [dict(r) for r in cursor.fetchall()]

            # Normalize skills array text -> list
            for r in rows:
                if r.get('skills') and isinstance(r['skills'], str):
                    skills_str = r['skills'].strip('{}')
                    r['skills'] = [s.strip('"') for s in skills_str.split(',') if s.strip()]

            return jsonify({'success': True, 'data': rows})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error getting shortlist: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get shortlist'}), 500

@hr_job_posting_bp.route('/<job_id>/shortlist', methods=['POST'])
@jwt_required()
def add_to_shortlist(job_id):
    """Add a candidate to the shortlist for a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403

        payload = request.get_json() or {}
        candidate_id = payload.get('candidate_id')
        notes = payload.get('notes')
        if not candidate_id:
            return jsonify({'success': False, 'message': 'candidate_id is required'}), 400

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Self-healing: Ensure table exists
            cursor.execute("SELECT to_regclass('public.job_shortlists') as exists")
            if not cursor.fetchone()['exists']:
                # Get ID type of job_postings
                cursor.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'id'")
                row = cursor.fetchone()
                id_type = row['data_type'] if row else 'UUID' # Default to UUID if not found
                
                # Create table
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS job_shortlists (
                        job_posting_id {id_type} REFERENCES job_postings(id) ON DELETE CASCADE,
                        candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
                        added_by UUID REFERENCES users(id) ON DELETE SET NULL,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (job_posting_id, candidate_id)
                    )
                """)
                conn.commit()

            # Verify HR ownership of the job
            cursor.execute(
                """
                SELECT 1
                FROM job_postings jp
                LEFT JOIN hr_profiles hp ON jp.company_id::text = hp.company_id::text AND hp.user_id = %s
                WHERE jp.id = %s AND (hp.user_id IS NOT NULL OR jp.recruiter_id = %s)
                """,
                (current_user_id, job_id, str(current_user_id)),
            )
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Job posting not found or access denied'}), 404

            # Ensure candidate exists and is a candidate
            cursor.execute("SELECT 1 FROM users WHERE id = %s AND role = 'candidate'", (candidate_id,))
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Candidate not found'}), 404

            # Upsert into shortlist (update notes if already present)
            cursor.execute(
                """
                INSERT INTO job_shortlists (job_posting_id, candidate_id, added_by, notes)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (job_posting_id, candidate_id)
                DO UPDATE SET notes = EXCLUDED.notes
                RETURNING job_posting_id, candidate_id, added_by, notes, created_at
                """,
                (job_id, candidate_id, current_user_id, notes),
            )
            row = dict(cursor.fetchone())
            conn.commit()
            return jsonify({'success': True, 'message': 'Candidate shortlisted', 'data': row}), 201
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error adding to shortlist: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to add to shortlist'}), 500

@hr_job_posting_bp.route('/<job_id>/shortlist/<int:candidate_id>', methods=['DELETE'])
@jwt_required()
def remove_from_shortlist(job_id, candidate_id):
    """Remove a candidate from the shortlist for a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify HR ownership
            cursor.execute(
                """
                SELECT 1
                FROM job_postings jp
                LEFT JOIN hr_profiles hp ON jp.company_id::text = hp.company_id::text AND hp.user_id = %s
                WHERE jp.id = %s AND (hp.user_id IS NOT NULL OR jp.recruiter_id = %s)
                """,
                (current_user_id, job_id, str(current_user_id)),
            )
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Job posting not found or access denied'}), 404

            cursor.execute(
                "DELETE FROM shortlisted_candidates WHERE job_id = %s AND candidate_id = %s",
                (job_id, candidate_id),
            )
            if cursor.rowcount == 0:
                return jsonify({'success': False, 'message': 'Candidate not in shortlist'}), 404
            conn.commit()
            return jsonify({'success': True, 'message': 'Candidate removed from shortlist'})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        error_msg = f"Error removing candidate {candidate_id} from job {job_id} shortlist: {str(e)}"
        logger.error(error_msg)
        return jsonify({'success': False, 'message': error_msg}), 500

@hr_job_posting_bp.route('/<job_id>/compliance-check', methods=['POST'])
@jwt_required()
def check_compliance(job_id):
    """Run UAE compliance check on a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get job posting
            cursor.execute("""
                SELECT jp.* FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id::text = hp.company_id::text
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            
            job = cursor.fetchone()
            if not job:
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            # Run compliance check
            job_data = dict(job)
            compliance_result = UAEComplianceChecker.check_job_posting_compliance(job_data)
            
            # Update compliance status in database
            cursor.execute("""
                UPDATE job_postings 
                SET uae_compliance_checked = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (compliance_result['is_compliant'], job_id))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Compliance check completed',
                'data': compliance_result
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error checking compliance: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to check compliance'
        }), 500

@hr_job_posting_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_job_templates():
    """Get job templates for the company"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get company templates and public templates
            cursor.execute(f"""
                SELECT 
                    jt.*,
                    {user_display_name('created_by_name')},
                    CASE WHEN jt.company_id = hp.company_id THEN 'company' ELSE 'public' END as template_source
                FROM job_templates jt
                LEFT JOIN users u ON jt.created_by = u.id
                LEFT JOIN hr_profiles hp ON jt.company_id = hp.company_id OR jt.is_public = true
                WHERE hp.user_id = %s
                ORDER BY template_source, jt.usage_count DESC, jt.created_at DESC
            """, (current_user_id,))
            
            templates = cursor.fetchall()
            
            # Parse JSONB fields
            templates_data = []
            for template in templates:
                template_data = dict(template)
                
                jsonb_fields = ['requirements_template', 'responsibilities_template', 'benefits_template']
                for field in jsonb_fields:
                    if template_data.get(field):
                        try:
                            if isinstance(template_data[field], str):
                                template_data[field] = json.loads(template_data[field])
                        except (json.JSONDecodeError, TypeError):
                            template_data[field] = {}
                
                templates_data.append(template_data)
            
            return jsonify({
                'success': True,
                'data': {
                    'templates': templates_data,
                    'total_count': len(templates_data)
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting job templates: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job templates'
        }), 500

@hr_job_posting_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_job_template():
    """Create a job template from provided fields"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403

        data = request.get_json() or {}
        title = (data.get('title') or '').strip()
        requirements_template = data.get('requirements_template') or {}
        responsibilities_template = data.get('responsibilities_template') or []
        benefits_template = data.get('benefits_template') or []
        is_public = bool(data.get('is_public', False))

        if not title:
            return jsonify({'success': False, 'message': 'title is required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Determine company id
            cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (current_user_id,))
            row = cursor.fetchone()
            if not row or not row.get('company_id'):
                return jsonify({'success': False, 'message': 'No company associated with your profile'}), 400
            company_id = row['company_id']

            # Insert template
            template_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO job_templates (
                    id, company_id, created_by, title,
                    requirements_template, responsibilities_template, benefits_template,
                    is_public, created_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,CURRENT_TIMESTAMP)
                RETURNING *
                """,
                (
                    template_id, company_id, current_user_id, title,
                    json.dumps(requirements_template), json.dumps(responsibilities_template), json.dumps(benefits_template),
                    is_public,
                ),
            )
            tpl = dict(cursor.fetchone())
            conn.commit()
            # Parse JSON fields for response
            for f in ('requirements_template', 'responsibilities_template', 'benefits_template'):
                if tpl.get(f) and isinstance(tpl[f], str):
                    try:
                        tpl[f] = json.loads(tpl[f])
                    except Exception:
                        pass
            return jsonify({'success': True, 'message': 'Template created', 'data': tpl}), 201
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error creating job template: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create job template'}), 500

# REMOVED: get_my_shortlisted_candidates was dead code — shadowed by
# REMOVED: hr_dashboard_api.get_all_shortlisted_candidates (registered first via blueprint).


