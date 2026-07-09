"""
Education API Routes — Unified endpoints for university programs, scholarships, and LMS.
Blueprint prefix: /api/education
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import os
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

education_bp = Blueprint('education', __name__, url_prefix='/api/education')


def get_db():
    """Get database connection."""
    from flask import g
    if 'edu_db' not in g.__dict__:
        try:
            g.edu_db = psycopg2.connect(
                host=os.getenv('DB_HOST', '127.0.0.1'),
                port=os.getenv('DB_PORT', '5432'),
                dbname=os.getenv('DB_NAME', 'emirati_journey'),
                user=os.getenv('DB_USER', 'emirati_user'),
                password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            )
        except Exception as e:
            logger.error(f"Education DB connection failed: {e}")
            g.edu_db = None
    return g.edu_db


@education_bp.teardown_app_request
def close_edu_db(exception=None):
    from flask import g
    db = g.__dict__.pop('edu_db', None)
    if db is not None:
        try:
            if exception:
                db.rollback()
            db.close()
        except Exception:
            pass


def query_all(sql, params=None):
    """Execute query and return list of dicts."""
    db = get_db()
    if not db:
        return []
    try:
        cursor = db.cursor()
        cursor.execute(sql, params or ())
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Query failed: {e}")
        db.rollback()
        return []


def query_one(sql, params=None):
    """Execute query and return single dict or None."""
    db = get_db()
    if not db:
        return None
    try:
        cursor = db.cursor()
        cursor.execute(sql, params or ())
        row = cursor.fetchone()
        if not row:
            return None
        cols = [d[0] for d in cursor.description]
        return dict(zip(cols, row))
    except Exception as e:
        logger.error(f"Query failed: {e}")
        db.rollback()
        return None


# ═══════════════════════════════════════════
# UNIVERSITIES
# ═══════════════════════════════════════════

@education_bp.route('/universities', methods=['GET'])
def get_universities():
    """Get all universities with optional search."""
    search = request.args.get('search', '')
    sql = """
        SELECT id, name, name_ar, location, type, established, ranking,
               students_count, programs_count, website, description, description_ar,
               specialties, logo_url
        FROM universities WHERE active = TRUE
    """
    params = []
    if search:
        sql += " AND (name ILIKE %s OR name_ar ILIKE %s OR location ILIKE %s)"
        params = [f'%{search}%'] * 3
    sql += " ORDER BY ranking ASC NULLS LAST, name ASC"

    universities = query_all(sql, params)
    # Convert specialties from JSON
    for u in universities:
        if isinstance(u.get('specialties'), str):
            try:
                u['specialties'] = json.loads(u['specialties'])
            except:
                u['specialties'] = []
    return jsonify({"universities": universities, "total": len(universities)})


@education_bp.route('/universities/<int:university_id>', methods=['GET'])
def get_university(university_id):
    """Get single university with its programs."""
    uni = query_one("SELECT * FROM universities WHERE id = %s AND active = TRUE", (university_id,))
    if not uni:
        return jsonify({"error": "University not found"}), 404
    programs = query_all(
        "SELECT * FROM university_programs WHERE university_id = %s AND active = TRUE ORDER BY is_popular DESC, title ASC",
        (university_id,)
    )
    for p in programs:
        for field in ['career_outcomes', 'subjects', 'skills_taught', 'accreditation']:
            if isinstance(p.get(field), str):
                try:
                    p[field] = json.loads(p[field])
                except:
                    p[field] = []
    uni['programs'] = programs
    return jsonify(uni)


# ═══════════════════════════════════════════
# UNIVERSITY PROGRAMS
# ═══════════════════════════════════════════

@education_bp.route('/programs', methods=['GET'])
def get_programs():
    """Get university programs with filtering."""
    category = request.args.get('category', '')
    degree = request.args.get('degree', '')
    search = request.args.get('search', '')
    university_id = request.args.get('university_id', '')
    limit = request.args.get('limit', 50, type=int)

    sql = """
        SELECT p.*, u.name as university_name, u.name_ar as university_name_ar,
               u.location as university_location
        FROM university_programs p
        LEFT JOIN universities u ON p.university_id = u.id
        WHERE p.active = TRUE
    """
    params = []
    if category:
        sql += " AND p.category = %s"
        params.append(category)
    if degree:
        sql += " AND p.degree = %s"
        params.append(degree)
    if university_id:
        sql += " AND p.university_id = %s"
        params.append(int(university_id))
    if search:
        sql += " AND (p.title ILIKE %s OR p.title_ar ILIKE %s OR u.name ILIKE %s)"
        params.extend([f'%{search}%'] * 3)
    sql += " ORDER BY p.is_popular DESC, p.rating DESC LIMIT %s"
    params.append(limit)

    programs = query_all(sql, params)
    for p in programs:
        for field in ['career_outcomes', 'subjects', 'skills_taught', 'accreditation']:
            if isinstance(p.get(field), str):
                try:
                    p[field] = json.loads(p[field])
                except:
                    p[field] = []
    return jsonify({"programs": programs, "total": len(programs)})


@education_bp.route('/programs/<int:program_id>', methods=['GET'])
def get_program(program_id):
    """Get single program details."""
    p = query_one("""
        SELECT p.*, u.name as university_name, u.name_ar as university_name_ar,
               u.location as university_location, u.website as university_website
        FROM university_programs p
        LEFT JOIN universities u ON p.university_id = u.id
        WHERE p.id = %s AND p.active = TRUE
    """, (program_id,))
    if not p:
        return jsonify({"error": "Program not found"}), 404
    for field in ['career_outcomes', 'subjects', 'skills_taught', 'accreditation']:
        if isinstance(p.get(field), str):
            try:
                p[field] = json.loads(p[field])
            except:
                p[field] = []
    return jsonify(p)


@education_bp.route('/programs/<int:program_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_program(program_id):
    """Apply to a university program."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        cursor = db.cursor()
        # Check for existing application
        existing = query_one(
            "SELECT id FROM program_applications WHERE user_id = %s AND program_id = %s",
            (user_id, program_id)
        )
        if existing:
            return jsonify({"error": "Already applied", "application_id": existing['id']}), 409
        cursor.execute("""
            INSERT INTO program_applications (user_id, program_id, application_data)
            VALUES (%s, %s, %s) RETURNING id, status, submitted_at
        """, (user_id, program_id, json.dumps(data)))
        db.commit()
        row = cursor.fetchone()
        return jsonify({
            "application_id": row[0], "status": row[1],
            "submitted_at": str(row[2]), "message": "Application submitted successfully"
        }), 201
    except Exception as e:
        db.rollback()
        logger.error(f"Apply failed: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════
# SCHOLARSHIPS
# ═══════════════════════════════════════════

@education_bp.route('/scholarships', methods=['GET'])
def get_scholarships():
    """Get available scholarships with filtering."""
    category = request.args.get('category', '')
    provider_type = request.args.get('provider_type', '')
    search = request.args.get('search', '')

    sql = "SELECT * FROM scholarships WHERE is_active = TRUE"
    params = []
    if category:
        sql += " AND category = %s"
        params.append(category)
    if provider_type:
        sql += " AND provider_type = %s"
        params.append(provider_type)
    if search:
        sql += " AND (title ILIKE %s OR title_ar ILIKE %s OR provider_name ILIKE %s)"
        params.extend([f'%{search}%'] * 3)
    sql += " ORDER BY amount DESC"

    scholarships = query_all(sql, params)
    for s in scholarships:
        for field in ['eligibility', 'skills_required']:
            if isinstance(s.get(field), str):
                try:
                    s[field] = json.loads(s[field])
                except:
                    s[field] = []
        if s.get('deadline'):
            s['deadline'] = str(s['deadline'])
        if s.get('created_at'):
            s['created_at'] = str(s['created_at'])
    return jsonify({"scholarships": scholarships, "total": len(scholarships)})


@education_bp.route('/scholarships/<int:scholarship_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_scholarship(scholarship_id):
    """Apply to a scholarship with AI match scoring."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        cursor = db.cursor()
        # Check existing
        existing = query_one(
            "SELECT id FROM scholarship_applications WHERE user_id = %s AND scholarship_id = %s",
            (user_id, scholarship_id)
        )
        if existing:
            return jsonify({"error": "Already applied"}), 409

        # Calculate AI match score based on user skills vs required skills
        match_score = 0.0
        scholarship = query_one("SELECT skills_required FROM scholarships WHERE id = %s", (scholarship_id,))
        if scholarship and scholarship.get('skills_required'):
            user_skills = query_all(
                "SELECT skill_name FROM user_skills WHERE user_id = %s", (user_id,)
            )
            user_skill_names = {s['skill_name'].lower() for s in user_skills}
            required = scholarship['skills_required'] if isinstance(scholarship['skills_required'], list) else []
            if required:
                matching = sum(1 for s in required if s.lower() in user_skill_names)
                match_score = round(matching / len(required) * 100, 1)

        cursor.execute("""
            INSERT INTO scholarship_applications (user_id, scholarship_id, application_data, ai_match_score)
            VALUES (%s, %s, %s, %s) RETURNING id, status, ai_match_score, submitted_at
        """, (user_id, scholarship_id, json.dumps(data), match_score))
        db.commit()
        row = cursor.fetchone()
        return jsonify({
            "application_id": row[0], "status": row[1],
            "match_score": row[2], "submitted_at": str(row[3]),
            "message": "Scholarship application submitted"
        }), 201
    except Exception as e:
        db.rollback()
        logger.error(f"Scholarship apply failed: {e}")
        return jsonify({"error": str(e)}), 500


@education_bp.route('/scholarships', methods=['POST'])
@jwt_required()
def create_scholarship():
    """Create a new scholarship (educator / operator)."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500

    title = data.get('title', '').strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO scholarships (
                title, title_ar, description, description_ar,
                provider_name, provider_type, amount, coverage_type,
                deadline, min_gpa, academic_level, eligible_majors,
                eligibility, skills_required, application_link,
                is_active, created_by
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                TRUE, %s
            ) RETURNING id, created_at
        """, (
            title,
            data.get('title_ar', ''),
            data.get('description', ''),
            data.get('description_ar', ''),
            data.get('provider', data.get('provider_name', '')),
            data.get('provider_type', 'compliance_auditor'),
            data.get('amount'),
            data.get('currency', data.get('coverage_type', 'AED')),
            data.get('application_deadline', data.get('deadline')),
            data.get('min_gpa'),
            data.get('academic_level'),
            data.get('eligible_majors'),
            json.dumps(data.get('eligibility_criteria', {})),
            json.dumps(data.get('requirements', [])),
            data.get('website_url', data.get('application_link', '')),
            user_id,
        ))
        db.commit()
        row = cursor.fetchone()
        return jsonify({
            "id": row[0],
            "created_at": str(row[1]),
            "message": "Scholarship created successfully",
        }), 201
    except Exception as e:
        db.rollback()
        logger.error(f"Create scholarship failed: {e}")
        return jsonify({"error": str(e)}), 500


@education_bp.route('/scholarships/<int:scholarship_id>/applications', methods=['GET'])
@jwt_required(optional=True)
def get_scholarship_applications(scholarship_id):
    """Get applications for a specific scholarship (educator / operator view)."""
    applications = query_all("""
        SELECT sa.id, sa.user_id, sa.scholarship_id, sa.status,
               sa.ai_match_score, sa.submitted_at, sa.application_data,
               sa.educator_id, sa.educator_status, sa.educator_notes,
               sa.parent_notified_at,
               u.full_name AS applicant_name, u.email AS applicant_email
        FROM scholarship_applications sa
        LEFT JOIN users u ON u.id = sa.user_id
        WHERE sa.scholarship_id = %s
        ORDER BY sa.submitted_at DESC
    """, (scholarship_id,))

    for a in applications:
        if a.get('submitted_at'):
            a['submitted_at'] = str(a['submitted_at'])
        if a.get('parent_notified_at'):
            a['parent_notified_at'] = str(a['parent_notified_at'])
        if isinstance(a.get('application_data'), str):
            try:
                a['application_data'] = json.loads(a['application_data'])
            except:
                pass

    return jsonify({"applications": applications, "total": len(applications)})


@education_bp.route('/scholarships/applications/<int:application_id>/status', methods=['PUT'])
@jwt_required()
def update_scholarship_application_status(application_id):
    """Update a scholarship application status (approved / rejected)."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    new_status = data.get('status', '').strip().lower()

    if new_status not in ('approved', 'rejected'):
        return jsonify({"error": "Status must be 'approved' or 'rejected'"}), 400

    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500

    try:
        cursor = db.cursor()
        # Update status + educator columns if they exist
        try:
            cursor.execute("""
                UPDATE scholarship_applications
                SET status = %s,
                    educator_id = %s,
                    educator_status = %s,
                    educator_notes = %s
                WHERE id = %s
                RETURNING id, status
            """, (
                new_status,
                user_id,
                new_status,
                data.get('notes', ''),
                application_id,
            ))
        except Exception:
            db.rollback()
            # Fallback: table may not have educator columns yet
            cursor.execute("""
                UPDATE scholarship_applications
                SET status = %s
                WHERE id = %s
                RETURNING id, status
            """, (new_status, application_id))
        db.commit()
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Application not found"}), 404
        return jsonify({
            "id": row[0],
            "status": row[1],
            "message": f"Application {new_status}",
        })
    except Exception as e:
        db.rollback()
        logger.error(f"Update scholarship application status failed: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════
# LMS — COURSES & PROGRESS
# ═══════════════════════════════════════════

@education_bp.route('/courses', methods=['GET'])
def get_courses():
    """Get LMS courses."""
    category = request.args.get('category', '')
    level = request.args.get('level', '')
    search = request.args.get('search', '')

    sql = "SELECT * FROM lms_courses WHERE active = TRUE"
    params = []
    if category:
        sql += " AND category = %s"
        params.append(category)
    if level:
        sql += " AND level = %s"
        params.append(level)
    if search:
        sql += " AND (title ILIKE %s OR title_ar ILIKE %s)"
        params.extend([f'%{search}%'] * 2)
    sql += " ORDER BY enrollments DESC"

    courses = query_all(sql, params)
    for c in courses:
        if isinstance(c.get('skills_covered'), str):
            try:
                c['skills_covered'] = json.loads(c['skills_covered'])
            except:
                c['skills_covered'] = []
    return jsonify({"courses": courses, "total": len(courses)})


@education_bp.route('/courses/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_in_course(course_id):
    """Enroll in an LMS course."""
    user_id = get_jwt_identity()
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO lms_enrollments (user_id, course_id) VALUES (%s, %s)
            ON CONFLICT (user_id, course_id) DO NOTHING
            RETURNING id, status, enrolled_at
        """, (user_id, course_id))
        db.commit()
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "Already enrolled"}), 200
        # Increment enrollment count
        cursor.execute("UPDATE lms_courses SET enrollments = enrollments + 1 WHERE id = %s", (course_id,))
        db.commit()
        return jsonify({
            "enrollment_id": row[0], "status": row[1], "enrolled_at": str(row[2])
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500


@education_bp.route('/courses/<int:course_id>/complete', methods=['POST'])
@jwt_required()
def complete_course(course_id):
    """Mark course as completed and update user skills via intelligence API."""
    user_id = get_jwt_identity()
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        cursor = db.cursor()
        # Update enrollment
        cursor.execute("""
            UPDATE lms_enrollments SET status = 'completed', progress_pct = 100,
                   completed_at = NOW()
            WHERE user_id = %s AND course_id = %s RETURNING id
        """, (user_id, course_id))
        db.commit()
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Enrollment not found"}), 404

        # Get course skills and update user_skills
        course = query_one("SELECT skills_covered FROM lms_courses WHERE id = %s", (course_id,))
        skills_updated = []
        if course and course.get('skills_covered'):
            skills = course['skills_covered'] if isinstance(course['skills_covered'], list) else []
            for skill in skills:
                skill_id = skill if isinstance(skill, str) else skill.get('skill_id', '')
                if skill_id:
                    try:
                        cursor.execute("""
                            INSERT INTO user_skills (user_id, skill_id, skill_name, proficiency, source, verified, last_assessed, created_at)
                            VALUES (%s, %s, %s, 'beginner', 'course_completion', FALSE, NOW(), NOW())
                            ON CONFLICT (user_id, skill_id) DO UPDATE SET last_assessed = NOW()
                            RETURNING skill_id
                        """, (user_id, skill_id, skill_id))
                        db.commit()
                        skills_updated.append(skill_id)
                    except Exception:
                        db.rollback()

        return jsonify({
            "message": "Course completed",
            "skills_updated": skills_updated,
            "enrollment_id": row[0]
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500


@education_bp.route('/my-progress', methods=['GET'])
@jwt_required()
def get_my_progress():
    """Get current user's education progress across all domains."""
    user_id = get_jwt_identity()

    # LMS enrollments
    enrollments = query_all("""
        SELECT e.*, c.title, c.title_ar, c.category, c.skills_covered
        FROM lms_enrollments e
        JOIN lms_courses c ON e.course_id = c.id
        WHERE e.user_id = %s ORDER BY e.enrolled_at DESC
    """, (user_id,))

    # Program applications
    applications = query_all("""
        SELECT pa.*, p.title, p.title_ar, p.degree, u.name as university_name
        FROM program_applications pa
        JOIN university_programs p ON pa.program_id = p.id
        LEFT JOIN universities u ON p.university_id = u.id
        WHERE pa.user_id = %s ORDER BY pa.submitted_at DESC
    """, (user_id,))

    # Scholarship applications
    scholarships = query_all("""
        SELECT sa.*, s.title, s.title_ar, s.amount, s.provider
        FROM scholarship_applications sa
        JOIN scholarships s ON sa.scholarship_id = s.id
        WHERE sa.user_id = %s ORDER BY sa.submitted_at DESC
    """, (user_id,))

    stats = {
        "courses_enrolled": len(enrollments),
        "courses_completed": sum(1 for e in enrollments if e.get('status') == 'completed'),
        "avg_progress": round(sum(e.get('progress_pct', 0) for e in enrollments) / max(len(enrollments), 1)),
        "programs_applied": len(applications),
        "scholarships_applied": len(scholarships),
    }

    return jsonify({
        "stats": stats,
        "enrollments": enrollments,
        "applications": applications,
        "scholarships": scholarships,
    })


# ═══════════════════════════════════════════
# EDUCATION OPERATOR ENDPOINTS
# ═══════════════════════════════════════════

@education_bp.route('/operator/stats', methods=['GET'])
def education_operator_stats():
    """Aggregate statistics for the Education Operator Dashboard overview."""
    db = get_db()
    stats = {
        "institutions": 0, "active_programs": 0,
        "enrolled_students": 0, "pending_approvals": 0,
        "enrollment_by_type": []
    }
    if not db:
        return jsonify(stats)
    try:
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) FROM universities")
        stats["institutions"] = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM university_programs WHERE is_active = TRUE")
        stats["active_programs"] = cursor.fetchone()[0]
        cursor.execute("SELECT COALESCE(SUM(enrolled),0) FROM university_programs")
        stats["enrolled_students"] = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM university_programs WHERE is_active = FALSE")
        stats["pending_approvals"] = cursor.fetchone()[0]
        # Enrollment breakdown
        cursor.execute("""
            SELECT COALESCE(program_type,'Other') AS ptype, COUNT(*) AS cnt,
                   COALESCE(SUM(enrolled),0) AS total_enrolled
            FROM university_programs GROUP BY program_type ORDER BY total_enrolled DESC
        """)
        cols = [d[0] for d in cursor.description]
        stats["enrollment_by_type"] = [dict(zip(cols, r)) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"education_operator_stats: {e}")
    return jsonify(stats)


@education_bp.route('/operator/institutions', methods=['GET'])
def education_operator_institutions():
    """List institutions with program/student counts for the operator."""
    rows = query_all("""
        SELECT u.id, u.name, u.name_ar, u.location, u.type,
               COUNT(p.id) AS program_count,
               COALESCE(SUM(p.enrolled),0) AS student_count,
               u.is_active
        FROM universities u
        LEFT JOIN university_programs p ON p.university_id = u.id
        GROUP BY u.id, u.name, u.name_ar, u.location, u.type, u.is_active
        ORDER BY student_count DESC
    """)
    return jsonify({"institutions": rows, "total": len(rows)})


@education_bp.route('/operator/enrollments/recent', methods=['GET'])
def education_operator_recent_enrollments():
    """Recent enrollments across all programs (latest 20)."""
    rows = query_all("""
        SELECT p.name AS program, u.name AS institution,
               p.enrolled, p.capacity, p.program_type,
               p.created_at
        FROM university_programs p
        JOIN universities u ON u.id = p.university_id
        ORDER BY p.created_at DESC LIMIT 20
    """)
    for r in rows:
        if r.get('created_at'):
            r['created_at'] = str(r['created_at'])
    return jsonify({"enrollments": rows})


@education_bp.route('/operator/programs/pending', methods=['GET'])
def education_operator_pending_programs():
    """Programs pending approval."""
    rows = query_all("""
        SELECT p.id, p.name, p.name_ar, p.program_type, p.created_at,
               u.name AS institution
        FROM university_programs p
        JOIN universities u ON u.id = p.university_id
        WHERE p.is_active = FALSE
        ORDER BY p.created_at DESC
    """)
    for r in rows:
        if r.get('created_at'):
            r['created_at'] = str(r['created_at'])
    return jsonify({"programs": rows, "total": len(rows)})


# ═══════════════════════════════════════════
# KNOWLEDGE CAMPS
# ═══════════════════════════════════════════

def ensure_camps_table():
    """Create knowledge_camps table and seed if needed."""
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_camps (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                title_ar VARCHAR(255),
                description TEXT,
                description_ar TEXT,
                category VARCHAR(100),
                age_group VARCHAR(50),
                location VARCHAR(255),
                organizer VARCHAR(255),
                duration VARCHAR(100),
                price VARCHAR(100),
                rating NUMERIC(2,1) DEFAULT 0,
                enrolled INT DEFAULT 0,
                capacity INT DEFAULT 0,
                featured BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        db.commit()
        cursor.execute("SELECT COUNT(*) FROM knowledge_camps")
        if cursor.fetchone()[0] == 0:
            seeds = [
                ('Coding Bootcamp for Teens', 'معسكر البرمجة للمراهقين',
                 'Learn Python, JavaScript, and app development in this intensive knowledge camp.',
                 'تعلم بايثون وجافاسكريبت وتطوير التطبيقات في هذا المعسكر المعرفي المكثف.',
                 'Technology', '14-18', 'Dubai Internet City', None, '4 weeks', 'AED 2,500', 4.8, 45, 60, True),
                ('Robotics & AI Camp', 'معسكر الروبوتات والذكاء الاصطناعي',
                 'Build and program robots using the latest AI technologies.',
                 'ابنِ وبرمج الروبوتات باستخدام أحدث تقنيات الذكاء الاصطناعي.',
                 'Technology', '10-16', 'Dubai Silicon Oasis', None, '3 weeks', 'AED 2,200', 4.7, 38, 50, False),
                ('Creative Arts Workshop', 'ورشة الفنون الإبداعية',
                 'Explore painting, sculpture, digital art and creative expression.',
                 'استكشف الرسم والنحت والفن الرقمي والتعبير الإبداعي.',
                 'Arts', '8-14', 'Dubai Media City', None, '2 weeks', 'AED 1,800', 4.9, 28, 30, True),
                ('Young Scientists Academy', 'أكاديمية العلماء الصغار',
                 'Hands-on experiments in physics, chemistry, and biology.',
                 'تجارب عملية في الفيزياء والكيمياء والأحياء.',
                 'Science', '10-16', 'DIFC', None, '3 weeks', 'AED 2,000', 4.6, 32, 40, False),
                ('Leadership & Public Speaking', 'القيادة والخطابة',
                 'Develop leadership skills, public speaking, and confidence.',
                 'طوّر مهارات القيادة والخطابة والثقة بالنفس.',
                 'Leadership', '14-18', 'Business Bay', None, '2 weeks', 'AED 1,500', 4.5, 20, 25, False),
                ('Sports Excellence Program', 'برنامج التميز الرياضي',
                 'Multi-sport training including swimming, football, basketball, and athletics.',
                 'تدريب رياضات متعددة تشمل السباحة وكرة القدم والسلة وألعاب القوى.',
                 'Sports', '6-9', 'Dubai Marina', None, '4 weeks', 'AED 1,900', 4.7, 52, 60, True),
            ]
            for s in seeds:
                cursor.execute("""
                    INSERT INTO knowledge_camps (title, title_ar, description, description_ar,
                        category, age_group, location, organizer, duration, price,
                        rating, enrolled, capacity, featured)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, s)
            db.commit()
            logger.info("✅ Seeded 6 knowledge camps")
    except Exception as e:
        db.rollback()
        logger.error(f"ensure_camps_table: {e}")


@education_bp.route('/camps', methods=['GET'])
def list_camps():
    """List knowledge camps with optional category/age filter."""
    ensure_camps_table()
    category = request.args.get('category')
    age_group = request.args.get('age_group')

    where, params = ["is_active = TRUE"], []
    if category and category != 'All':
        where.append("category = %s")
        params.append(category)
    if age_group:
        where.append("age_group = %s")
        params.append(age_group)

    camps = query_all(f"""
        SELECT * FROM knowledge_camps
        WHERE {' AND '.join(where)}
        ORDER BY featured DESC, rating DESC
    """, tuple(params))

    for c in camps:
        if c.get('created_at'):
            c['created_at'] = str(c['created_at'])
    return jsonify({"camps": camps, "total": len(camps)})


# ═══════════════════════════════════════════
# GRADUATE PROGRAMS
# ═══════════════════════════════════════════

def ensure_grad_programs_table():
    """Create graduate_programs table and seed if needed."""
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS graduate_programs (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                title_ar VARCHAR(255),
                university VARCHAR(255),
                university_ar VARCHAR(255),
                location VARCHAR(255),
                location_ar VARCHAR(255),
                duration VARCHAR(100),
                duration_ar VARCHAR(100),
                program_type VARCHAR(100),
                type_label VARCHAR(100),
                type_label_ar VARCHAR(100),
                tuition VARCHAR(100),
                tuition_ar VARCHAR(100),
                rating NUMERIC(2,1) DEFAULT 0,
                enrolled INT DEFAULT 0,
                capacity INT DEFAULT 0,
                featured BOOLEAN DEFAULT FALSE,
                specializations JSONB DEFAULT '[]',
                specializations_ar JSONB DEFAULT '[]',
                highlights JSONB DEFAULT '[]',
                highlights_ar JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        db.commit()
        cursor.execute("SELECT COUNT(*) FROM graduate_programs")
        if cursor.fetchone()[0] == 0:
            seeds = [
                ('MBA – Executive Leadership', 'ماجستير إدارة أعمال – القيادة التنفيذية',
                 'Mohammed Bin Rashid School of Government', 'كلية محمد بن راشد للإدارة الحكومية',
                 'Dubai, UAE', 'دبي، الإمارات', '18 months', '18 شهراً',
                 'Full-Time', 'Full-Time', 'دوام كامل',
                 'AED 95,000', '95,000 د.إ', 4.9, 45, 50, True,
                 json.dumps(['Strategic Management','Digital Transformation','Government Innovation']),
                 json.dumps(['الإدارة الاستراتيجية','التحول الرقمي','الابتكار الحكومي']),
                 json.dumps(['AACSB Accredited','Industry Capstone','C-Suite Mentorship']),
                 json.dumps(['معتمد من AACSB','مشروع تطبيقي','إرشاد من القيادات العليا'])),
                ('MSc Data Science & AI', 'ماجستير علوم البيانات والذكاء الاصطناعي',
                 'Khalifa University', 'جامعة خليفة',
                 'Abu Dhabi, UAE', 'أبوظبي، الإمارات', '2 years', 'سنتان',
                 'Full-Time', 'Full-Time', 'دوام كامل',
                 'AED 78,000', '78,000 د.إ', 4.8, 60, 70, True,
                 json.dumps(['Machine Learning','Natural Language Processing','Computer Vision']),
                 json.dumps(['التعلم الآلي','معالجة اللغات الطبيعية','الرؤية الحاسوبية']),
                 json.dumps(['Research Lab Access','Industry Partnerships','Publication Support']),
                 json.dumps(['الوصول لمختبرات البحث','شراكات صناعية','دعم النشر العلمي'])),
                ('MSc Engineering Management', 'ماجستير إدارة الهندسة',
                 'American University of Sharjah', 'الجامعة الأمريكية في الشارقة',
                 'Sharjah, UAE', 'الشارقة، الإمارات', '2 years', 'سنتان',
                 'Part-Time', 'Part-Time', 'دوام جزئي',
                 'AED 72,000', '72,000 د.إ', 4.7, 35, 45, False,
                 json.dumps(['Systems Engineering','Project Management','Quality Engineering']),
                 json.dumps(['هندسة النظم','إدارة المشاريع','هندسة الجودة']),
                 json.dumps(['Flexible Schedule','Industry Projects','Professional Network']),
                 json.dumps(['جدول مرن','مشاريع صناعية','شبكة مهنية'])),
                ('Master of Public Administration', 'ماجستير الإدارة العامة',
                 'UAE University', 'جامعة الإمارات',
                 'Al Ain, UAE', 'العين، الإمارات', '2 years', 'سنتان',
                 'Full-Time', 'Full-Time', 'دوام كامل',
                 'AED 55,000', '55,000 د.إ', 4.6, 40, 60, False,
                 json.dumps(['Policy Analysis','Urban Governance','Public Finance']),
                 json.dumps(['تحليل السياسات','الحوكمة الحضرية','المالية العامة']),
                 json.dumps(['Government Placements','Policy Lab Access','International Exchange']),
                 json.dumps(['تعيينات حكومية','الوصول لمختبر السياسات','تبادل دولي'])),
                ('PhD in Sustainable Energy', 'دكتوراه في الطاقة المستدامة',
                 'Masdar Institute – Khalifa University', 'معهد مصدر – جامعة خليفة',
                 'Abu Dhabi, UAE', 'أبوظبي، الإمارات', '3-4 years', '3-4 سنوات',
                 'Full-Time Research', 'Full-Time Research', 'بحث بدوام كامل',
                 'Fully Funded', 'ممولة بالكامل', 4.9, 15, 20, True,
                 json.dumps(['Solar Energy','Energy Storage','Smart Grid Systems']),
                 json.dumps(['الطاقة الشمسية','تخزين الطاقة','أنظمة الشبكات الذكية']),
                 json.dumps(['Full Scholarship','Research Stipend','International Conference Travel']),
                 json.dumps(['منحة كاملة','بدل بحثي','سفر لمؤتمرات دولية'])),
                ('LLM – International Business Law', 'ماجستير القانون – قانون الأعمال الدولي',
                 'University of Sharjah', 'جامعة الشارقة',
                 'Sharjah, UAE', 'الشارقة، الإمارات', '18 months', '18 شهراً',
                 'Part-Time', 'Part-Time', 'دوام جزئي',
                 'AED 65,000', '65,000 د.إ', 4.5, 28, 35, False,
                 json.dumps(['Arbitration & Dispute Resolution','Corporate Governance','IP Law']),
                 json.dumps(['التحكيم وحل النزاعات','حوكمة الشركات','قانون الملكية الفكرية']),
                 json.dumps(['Moot Court Competitions','Dual Certification','Legal Clinic']),
                 json.dumps(['مسابقات المحاكم الصورية','شهادة مزدوجة','عيادة قانونية'])),
            ]
            for s in seeds:
                cursor.execute("""
                    INSERT INTO graduate_programs (title, title_ar, university, university_ar,
                        location, location_ar, duration, duration_ar,
                        program_type, type_label, type_label_ar,
                        tuition, tuition_ar, rating, enrolled, capacity, featured,
                        specializations, specializations_ar, highlights, highlights_ar)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, s)
            db.commit()
            logger.info("✅ Seeded 6 graduate programs")
    except Exception as e:
        db.rollback()
        logger.error(f"ensure_grad_programs_table: {e}")


@education_bp.route('/graduate-programs', methods=['GET'])
def list_graduate_programs():
    """List graduate programs with optional type filter."""
    ensure_grad_programs_table()
    program_type = request.args.get('type')

    where, params = ["is_active = TRUE"], []
    if program_type and program_type != 'All':
        where.append("program_type = %s")
        params.append(program_type)

    programs = query_all(f"""
        SELECT * FROM graduate_programs
        WHERE {' AND '.join(where)}
        ORDER BY featured DESC, rating DESC
    """, tuple(params))

    for p in programs:
        if p.get('created_at'):
            p['created_at'] = str(p['created_at'])
        # Parse JSONB fields
        for field in ('specializations', 'specializations_ar', 'highlights', 'highlights_ar'):
            if isinstance(p.get(field), str):
                try:
                    p[field] = json.loads(p[field])
                except:
                    pass
    return jsonify({"programs": programs, "total": len(programs)})


# ═══════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════

@education_bp.route('/health', methods=['GET'])
def education_health():
    db = get_db()
    tables = []
    if db:
        try:
            cursor = db.cursor()
            for t in ['universities', 'university_programs', 'scholarships', 'lms_courses']:
                cursor.execute(f"SELECT COUNT(*) FROM {t}")
                count = cursor.fetchone()[0]
                tables.append({"table": t, "rows": count})
        except:
            pass
    return jsonify({
        "status": "ok" if db else "no_db",
        "tables": tables,
    })


# ═══════════════════════════════════════════
# COMMUNITY OPERATOR ENDPOINTS
# ═══════════════════════════════════════════

def ensure_community_tables():
    """Create community tables and seed if needed."""
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_groups (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                name_ar TEXT,
                description TEXT,
                category TEXT DEFAULT 'General',
                member_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_content (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                title_ar TEXT,
                author_name TEXT,
                content_type TEXT DEFAULT 'article',
                status TEXT DEFAULT 'pending',
                likes INTEGER DEFAULT 0,
                flagged BOOLEAN DEFAULT FALSE,
                flag_reason TEXT,
                flag_severity TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_events (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                name_ar TEXT,
                event_date DATE,
                location TEXT,
                registrations INTEGER DEFAULT 0,
                status TEXT DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Seed if empty
        cursor.execute("SELECT COUNT(*) FROM community_groups")
        if cursor.fetchone()[0] == 0:
            for g in [
                ("Emirati Youth Network", "شبكة الشباب الإماراتي", "Career development community for young Emiratis", "Career", 2450),
                ("Women in Leadership", "المرأة في القيادة", "Community supporting women in leadership roles", "Leadership", 1800),
                ("Tech Innovators UAE", "مبتكرو التقنية الإمارات", "Technology and AI community", "Technology", 3200),
                ("National Service Alumni", "خريجو الخدمة الوطنية", "Alumni network for national service graduates", "Alumni", 1500),
                ("Retiree Knowledge Circle", "دائرة معرفة المتقاعدين", "Knowledge sharing for retirees", "Knowledge Sharing", 680),
            ]:
                cursor.execute("INSERT INTO community_groups (name, name_ar, description, category, member_count) VALUES (%s,%s,%s,%s,%s)", g)
            for c in [
                ("My Journey from Fresh Graduate to CTO", "رحلتي من خريج جديد إلى مدير تقنية", "Ahmed Al Falasi", "success_story", "pending", 45),
                ("Navigating Career Change in UAE", "التنقل المهني في الإمارات", "Fatima Al Hashmi", "article", "published", 32),
                ("Youth Innovation Summit Recap", "ملخص قمة الابتكار الشبابي", "Omar Al Suwaidi", "event_recap", "published", 28),
                ("Building Community Through Sports", "بناء المجتمع من خلال الرياضة", "Mariam Al Shamsi", "article", "pending", 19),
            ]:
                cursor.execute("INSERT INTO community_content (title, title_ar, author_name, content_type, status, likes) VALUES (%s,%s,%s,%s,%s,%s)", c)
            for e in [
                ("UAE Career Fair 2026", "معرض الوظائف الإماراتي 2026", "2026-03-15", "ADNEC, Abu Dhabi", 2400, "upcoming"),
                ("Youth Innovation Challenge", "تحدي الابتكار الشبابي", "2026-03-22", "Dubai Exhibition Centre", 850, "upcoming"),
                ("Retiree Networking Evening", "أمسية تواصل المتقاعدين", "2026-03-08", "Jumeirah Emirates Towers", 120, "upcoming"),
                ("National Service Alumni Meetup", "لقاء خريجي الخدمة الوطنية", "2026-02-25", "Sharjah Youth Center", 200, "completed"),
            ]:
                cursor.execute("INSERT INTO community_events (name, name_ar, event_date, location, registrations, status) VALUES (%s,%s,%s,%s,%s,%s)", e)
            db.commit()
            logger.info("Community tables seeded with sample data")
        db.commit()
    except Exception as e:
        logger.error(f"Error ensuring community tables: {e}")
        try:
            db.rollback()
        except:
            pass


@education_bp.route('/community/operator/stats', methods=['GET'])
def community_operator_stats():
    """Aggregate statistics for the Community Operator Dashboard."""
    ensure_community_tables()
    groups = query_all("SELECT * FROM community_groups ORDER BY member_count DESC")
    content = query_all("SELECT * FROM community_content ORDER BY created_at DESC")
    events = query_all("SELECT * FROM community_events ORDER BY event_date DESC")

    active_groups = sum(1 for g in groups if g.get('is_active'))
    published = sum(1 for c in content if c.get('status') == 'published')
    pending = [c for c in content if c.get('status') == 'pending']
    flagged = [c for c in content if c.get('flagged')]
    upcoming_events = [e for e in events if e.get('status') == 'upcoming']

    # Serialize dates
    for c in content:
        if c.get('created_at'):
            c['created_at'] = str(c['created_at'])
    for e in events:
        if e.get('event_date'):
            e['event_date'] = str(e['event_date'])
        if e.get('created_at'):
            e['created_at'] = str(e['created_at'])

    return jsonify({
        'stats': {
            'active_communities': active_groups,
            'published_stories': published,
            'flagged_content': len(flagged),
            'upcoming_events': len(upcoming_events),
            'total_members': sum(g.get('member_count', 0) for g in groups),
        },
        'groups': groups,
        'content_queue': pending,
        'flagged_content': flagged,
        'events': events,
    })


# ═══════════════════════════════════════════
# PROFESSIONAL DEVELOPMENT OPERATOR ENDPOINTS
# ═══════════════════════════════════════════

def ensure_profdev_tables():
    """Create professional development tables and seed if needed."""
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_courses (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                name_ar TEXT,
                provider TEXT,
                enrolled INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                course_type TEXT DEFAULT 'General',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS certification_bodies (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                certs_issued INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS profdev_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT NOT NULL,
                description TEXT
            )
        """)
        cursor.execute("SELECT COUNT(*) FROM profdev_settings")
        if cursor.fetchone()[0] == 0:
            for s in [
                ("training_accreditation", "Required", "Require KHDA/ACTVET accreditation for all courses"),
                ("blockchain_credential_issuing", "Beta", "Enable blockchain-based digital credential issuance")
            ]:
                cursor.execute("INSERT INTO profdev_settings (setting_key, setting_value, description) VALUES (%s, %s, %s)", s)
            db.commit()

        cursor.execute("SELECT COUNT(*) FROM training_courses")
        if cursor.fetchone()[0] == 0:
            for c in [
                ("UAE Leadership Excellence", "التميز القيادي الإماراتي", "INSEAD Abu Dhabi", 45, "published", "Leadership"),
                ("Agile Project Management", "إدارة المشاريع المرنة", "PwC Academy", 82, "published", "Management"),
                ("Cybersecurity Fundamentals", "أساسيات الأمن السيبراني", "Etisalat Academy", 120, "published", "Technology"),
                ("Financial Analysis", "التحليل المالي", "CFA Institute", 0, "pending", "Finance"),
                ("AI and Machine Learning", "الذكاء الاصطناعي والتعلم الآلي", "42 Abu Dhabi", 65, "published", "Technology"),
            ]:
                cursor.execute("INSERT INTO training_courses (name, name_ar, provider, enrolled, status, course_type) VALUES (%s,%s,%s,%s,%s,%s)", c)
            for b in [
                ("KHDA", 145, True), ("ACTVET", 89, True), ("ADEK", 67, True),
                ("ILM", 52, True), ("CIPD", 38, False),
            ]:
                cursor.execute("INSERT INTO certification_bodies (name, certs_issued, is_active) VALUES (%s,%s,%s)", b)
            db.commit()
            logger.info("Professional development tables seeded")
        db.commit()
    except Exception as e:
        logger.error(f"Error ensuring profdev tables: {e}")
        try:
            db.rollback()
        except:
            pass


@education_bp.route('/profdev/operator/stats', methods=['GET'])
def profdev_operator_stats():
    """Aggregate statistics for the Professional Development Operator Dashboard."""
    ensure_profdev_tables()
    courses = query_all("SELECT * FROM training_courses ORDER BY enrolled DESC")
    cert_bodies = query_all("SELECT * FROM certification_bodies ORDER BY certs_issued DESC")

    published = [c for c in courses if c.get('status') == 'published']
    pending = [c for c in courses if c.get('status') == 'pending']
    total_enrolled = sum(c.get('enrolled', 0) for c in courses)
    total_certs = sum(b.get('certs_issued', 0) for b in cert_bodies)

    return jsonify({
        'stats': {
            'training_courses': len(courses),
            'published_courses': len(published),
            'pending_courses': len(pending),
            'total_enrolled': total_enrolled,
            'total_certs_issued': total_certs,
            'cert_bodies': len(cert_bodies),
        },
        'courses': courses,
        'certification_bodies': cert_bodies,
    })


@education_bp.route('/profdev/courses', methods=['POST'])
def add_profdev_course():
    """Add a new training course to the Professional Development catalog."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        name_ar = data.get('name_ar', '').strip()
        provider = data.get('provider', '').strip()
        course_type = data.get('course_type', 'General').strip()

        if not name or not provider:
            return jsonify({'error': 'Name and provider are required'}), 400

        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO training_courses (name, name_ar, provider, enrolled, status, course_type) VALUES (%s, %s, %s, 0, 'pending', %s) RETURNING id",
            (name, name_ar if name_ar else None, provider, course_type)
        )
        course_id = cursor.fetchone()[0]
        db.commit()
        return jsonify({'success': True, 'course_id': course_id, 'message': 'Course added and pending review'}), 201
    except Exception as e:
        logger.error(f"Error adding profdev course: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to add course'}), 500


@education_bp.route('/profdev/courses/<int:course_id>/approve', methods=['PUT'])
def approve_profdev_course(course_id):
    """Approve a pending course and publish it."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cursor = db.cursor()
        cursor.execute("UPDATE training_courses SET status = 'published' WHERE id = %s", (course_id,))
        db.commit()
        return jsonify({'success': True, 'message': 'Course approved and published'}), 200
    except Exception as e:
        logger.error(f"Error approving course: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to approve course'}), 500


@education_bp.route('/profdev/courses/<int:course_id>/reject', methods=['PUT'])
def reject_profdev_course(course_id):
    """Reject or set a course to draft/pending status."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cursor = db.cursor()
        cursor.execute("UPDATE training_courses SET status = 'pending' WHERE id = %s", (course_id,))
        db.commit()
        return jsonify({'success': True, 'message': 'Course set to pending status'}), 200
    except Exception as e:
        logger.error(f"Error rejecting course: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to reject course'}), 500


@education_bp.route('/profdev/settings', methods=['GET'])
def get_profdev_settings():
    """Retrieve settings for Professional Development."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM profdev_settings")
        rows = cursor.fetchall()
        settings = {r['setting_key']: r['setting_value'] for r in rows}
        return jsonify({'success': True, 'settings': settings}), 200
    except Exception as e:
        logger.error(f"Error getting profdev settings: {e}")
        return jsonify({'error': 'Failed to load settings'}), 500


@education_bp.route('/profdev/settings', methods=['PUT'])
def update_profdev_settings():
    """Update settings for Professional Development."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        data = request.get_json() or {}
        cursor = db.cursor()
        for k, v in data.items():
            cursor.execute(
                "INSERT INTO profdev_settings (setting_key, setting_value) VALUES (%s, %s) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value",
                (k, v)
            )
        db.commit()
        return jsonify({'success': True, 'message': 'Settings updated successfully'}), 200
    except Exception as e:
        logger.error(f"Error updating profdev settings: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to save settings'}), 500


@education_bp.route('/profdev/certification-bodies', methods=['POST'])
def add_certification_body():
    """Register a new certification body."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        certs_issued = int(data.get('certs_issued', 0))

        if not name:
            return jsonify({'error': 'Name is required'}), 400

        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO certification_bodies (name, certs_issued, is_active) VALUES (%s, %s, TRUE) RETURNING id",
            (name, certs_issued)
        )
        body_id = cursor.fetchone()[0]
        db.commit()
        return jsonify({'success': True, 'body_id': body_id, 'message': 'Certification body registered successfully'}), 201
    except Exception as e:
        logger.error(f"Error adding certification body: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to add certification body'}), 500


@education_bp.route('/profdev/certification-bodies/<int:body_id>/toggle', methods=['PUT'])
def toggle_certification_body(body_id):
    """Toggle the active/inactive state of a certification body."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cursor = db.cursor()
        cursor.execute("UPDATE certification_bodies SET is_active = NOT is_active WHERE id = %s RETURNING is_active", (body_id,))
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Certification body not found'}), 404
        db.commit()
        return jsonify({'success': True, 'is_active': result[0], 'message': 'Status toggled successfully'}), 200
    except Exception as e:
        logger.error(f"Error toggling certification body: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to toggle status'}), 500


# ═══════════════════════════════════════════════════════════════════
# EMPLOYER DASHBOARD – aggregate jobs/applications from existing tables
# ═══════════════════════════════════════════════════════════════════

@education_bp.route('/employer/dashboard', methods=['GET'])
def employer_dashboard():
    """Aggregate employer dashboard data from job_postings and job_applications tables."""
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cursor = db.cursor()

        # Job counts
        cursor.execute("SELECT COUNT(*) FROM job_postings WHERE status = 'active'")
        active_jobs = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM job_postings")
        total_jobs = cursor.fetchone()[0] or 0

        # Application counts (table may not exist)
        total_apps = 0
        shortlisted = 0
        hired = 0
        pending_offers = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM job_applications")
            total_apps = cursor.fetchone()[0] or 0
            cursor.execute("SELECT COUNT(*) FROM job_applications WHERE status = 'shortlisted'")
            shortlisted = cursor.fetchone()[0] or 0
            cursor.execute("SELECT COUNT(*) FROM job_applications WHERE status = 'hired'")
            hired = cursor.fetchone()[0] or 0
            cursor.execute("SELECT COUNT(*) FROM job_applications WHERE status = 'offer_pending'")
            pending_offers = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Recent jobs for activity feed
        recent_jobs = query_all(
            "SELECT title, status, created_at FROM job_postings ORDER BY created_at DESC LIMIT 5"
        )

        activity = []
        for j in recent_jobs:
            created = j.get('created_at', '')
            activity.append({
                'type': 'job_post',
                'message': f"Job posted: {j.get('title', 'Untitled')}",
                'time': str(created)[:10] if created else 'recently',
            })

        return jsonify({
            'recruitment': {
                'activeJobs': active_jobs,
                'totalApplications': total_apps,
                'shortlistedCandidates': shortlisted,
                'interviewsScheduled': max(0, shortlisted // 2),
                'hiredCandidates': hired,
                'pendingOffers': pending_offers,
            },
            'analytics': {
                'applicationRate': round(total_apps / max(total_jobs, 1), 1),
                'responseRate': round(min(100, (shortlisted + hired) / max(total_apps, 1) * 100), 1),
                'hireRate': round(hired / max(total_apps, 1) * 100, 1),
                'timeToHire': 18,
            },
            'candidates': {
                'newApplications': max(0, total_apps - shortlisted - hired),
                'qualifiedCandidates': shortlisted,
                'emiratiCandidates': 85,
                'diversityScore': 80,
            },
            'activity': activity,
        })
    except Exception as e:
        logger.error(f"Employer dashboard error: {e}")
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════════
# GOVERNMENT DASHBOARD – aggregate platform-wide stats
# ═══════════════════════════════════════════════════════════════════

@education_bp.route('/government/dashboard', methods=['GET'])
def government_dashboard():
    """Aggregate government dashboard: emiratization tracker + platform stats."""
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cursor = db.cursor()

        # Total jobs / workforce proxy
        cursor.execute("SELECT COUNT(*) FROM job_postings")
        total_jobs = cursor.fetchone()[0] or 0

        # User count as workforce proxy
        total_users = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Training programs count
        training_count = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM training_courses")
            training_count = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Education programs
        edu_programs = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM education_programs")
            edu_programs = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        sector_breakdown = [
            {'sector': 'Banking & Finance', 'rate': 78.5},
            {'sector': 'Government', 'rate': 89.2},
            {'sector': 'Healthcare', 'rate': 45.7},
            {'sector': 'Technology', 'rate': 52.3},
            {'sector': 'Energy', 'rate': 68.1},
        ]

        return jsonify({
            'emiratization': {
                'totalEmiratiEmployees': total_users,
                'emiratizationRate': 67.3,
                'targetRate': 75.0,
                'monthlyGrowth': 2.1,
                'sectorBreakdown': sector_breakdown,
            },
            'workforce': {
                'totalWorkforce': total_users + total_jobs * 3,
                'unemploymentRate': 3.2,
                'skillsGapIndex': 23.4,
                'trainingPrograms': training_count + edu_programs,
            },
            'initiatives': {
                'activePrograms': training_count + edu_programs,
                'beneficiaries': total_users,
                'completionRate': 84.7,
                'successStories': min(total_users // 5, 200),
            },
            'activity': [
                {'type': 'policy', 'message': 'New Emiratization policy approved for tech sector', 'time': '2h ago'},
                {'type': 'program', 'message': f'{training_count} training programs active on platform', 'time': '1d ago'},
                {'type': 'milestone', 'message': f'{total_jobs} job postings tracked across sectors', 'time': '2d ago'},
                {'type': 'report', 'message': f'{total_users} registered users on the platform', 'time': '3d ago'},
            ],
        })
    except Exception as e:
        logger.error(f"Government dashboard error: {e}")
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════════
# CONTENT MANAGEMENT – Youth Programs
# ═══════════════════════════════════════════════════════════════════

def ensure_youth_programs_table():
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS youth_programs (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                title_ar TEXT,
                org TEXT,
                org_ar TEXT,
                duration TEXT,
                duration_ar TEXT,
                age_group TEXT,
                enrolled INT DEFAULT 0,
                capacity INT DEFAULT 100,
                status TEXT DEFAULT 'open',
                tags TEXT DEFAULT '[]',
                icon TEXT DEFAULT '🎓',
                description TEXT,
                description_ar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("SELECT COUNT(*) FROM youth_programs")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO youth_programs (title, title_ar, org, org_ar, duration, duration_ar, age_group, enrolled, capacity, status, tags, icon, description, description_ar) VALUES
                ('Future Leaders Initiative', 'مبادرة قادة المستقبل', 'Federal Youth Authority', 'الهيئة الاتحادية للشباب', '12 months', '12 شهراً', '18–25', 450, 500, 'open', '["Leadership","Mentorship","Policy"]', '🏅', 'Comprehensive program developing next-generation Emirati leaders.', 'برنامج شامل لتطوير الجيل القادم من القادة الإماراتيين.'),
                ('Youth Innovation Bootcamp', 'معسكر الابتكار الشبابي', 'Dubai Future Foundation', 'مؤسسة دبي للمستقبل', '6 weeks', '6 أسابيع', '16–22', 180, 200, 'open', '["AI","Startups","Innovation"]', '🚀', 'Intensive bootcamp teaching design thinking and entrepreneurship.', 'معسكر تدريبي مكثف يعلم التفكير التصميمي وريادة الأعمال.'),
                ('National Service Career Track', 'المسار المهني للخدمة الوطنية', 'Ministry of Defence', 'وزارة الدفاع', '18 months', '18 شهراً', '18–30', 1200, 1200, 'full', '["Military","Discipline","Fitness"]', '🎖️', 'Career-oriented national service combining military training with professional development.', 'خدمة وطنية موجهة مهنياً تجمع بين التدريب العسكري والتطوير المهني.'),
                ('STEM Excellence Academy', 'أكاديمية التميز في العلوم والتكنولوجيا', 'Ministry of Education', 'وزارة التربية والتعليم', '9 months', '9 أشهر', '15–18', 320, 400, 'open', '["Science","Technology","Research"]', '🔬', 'Advanced STEM program for high-achieving students.', 'برنامج متقدم في العلوم والتكنولوجيا للطلاب المتفوقين.'),
                ('Emirati Heritage & Culture Program', 'برنامج التراث والثقافة الإماراتية', 'Dubai Culture & Arts Authority', 'هيئة الثقافة والفنون في دبي', '4 months', '4 أشهر', '14–25', 280, 350, 'open', '["Heritage","Culture","Arabic"]', '🏛️', 'Deepening cultural identity through Emirati heritage studies.', 'تعميق الهوية الثقافية من خلال دراسات التراث الإماراتي.'),
                ('Youth Entrepreneurship Lab', 'مختبر ريادة الأعمال الشبابي', 'Khalifa Fund', 'صندوق خليفة', '6 months', '6 أشهر', '18–30', 150, 200, 'open', '["Business","Funding","Pitch"]', '💡', 'End-to-end startup program with up to AED 100K seed funding.', 'برنامج شامل للشركات الناشئة مع تمويل أولي يصل إلى 100 ألف درهم.');
            """)
        db.commit()
    except Exception as e:
        logger.error(f"ensure_youth_programs_table: {e}")
        db.rollback()


@education_bp.route('/content/youth-programs', methods=['GET'])
def get_youth_programs():
    ensure_youth_programs_table()
    programs = query_all("SELECT * FROM youth_programs ORDER BY enrolled DESC")
    return jsonify({'programs': programs})


# ═══════════════════════════════════════════════════════════════════
# CONTENT MANAGEMENT – Industry Sectors
# ═══════════════════════════════════════════════════════════════════

def ensure_industry_sectors_table():
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS industry_sectors (
                id SERIAL PRIMARY KEY,
                sector_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                name_ar TEXT,
                growth TEXT,
                jobs TEXT,
                avg_salary TEXT,
                avg_salary_ar TEXT,
                top_companies TEXT DEFAULT '[]',
                description TEXT,
                description_ar TEXT,
                skills TEXT DEFAULT '[]',
                locations TEXT DEFAULT '[]',
                trending BOOLEAN DEFAULT FALSE,
                sector_tag TEXT,
                icon TEXT DEFAULT 'Building2',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("SELECT COUNT(*) FROM industry_sectors")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO industry_sectors (sector_id, name, name_ar, growth, jobs, avg_salary, avg_salary_ar, top_companies, description, description_ar, skills, locations, trending, sector_tag, icon) VALUES
                ('technology', 'Technology & Innovation', 'التكنولوجيا والابتكار', '+18%', '2,500+', 'AED 120K–250K', '120–250 ألف د.إ', '["Microsoft","Google","Amazon (AWS)","SAP","Oracle","Cisco"]', 'Leading the digital transformation of the UAE with cutting-edge solutions in AI, cloud, and cybersecurity.', 'قيادة التحول الرقمي في الإمارات بحلول متطورة في الذكاء الاصطناعي والسحابة والأمن السيبراني.', '["Python / JS","AI & ML","Cloud Computing","DevOps","Cybersecurity"]', '["Dubai","Abu Dhabi","Sharjah"]', TRUE, 'Tech', 'Cpu'),
                ('finance', 'Banking & Finance', 'المصارف والتمويل', '+12%', '1,800+', 'AED 100K–200K', '100–200 ألف د.إ', '["HSBC","JPMorgan","Citibank","Goldman Sachs","Standard Chartered","Visa"]', 'Driving financial innovation and world-class banking across the region.', 'قيادة الابتكار المالي والخدمات المصرفية العالمية في المنطقة.', '["Financial Analysis","Risk Management","Fintech","Compliance","Wealth Mgmt"]', '["Dubai","Abu Dhabi"]', FALSE, 'Finance', 'Banknote'),
                ('energy', 'Energy & Sustainability', 'الطاقة والاستدامة', '+20%', '1,200+', 'AED 110K–220K', '110–220 ألف د.إ', '["Shell","Baker Hughes","TotalEnergies","Siemens Energy","Schneider Electric","BP"]', 'Pioneering renewable energy and sustainable development in one of the world''s leading energy hubs.', 'الريادة في الطاقة المتجددة والتنمية المستدامة في أحد أبرز مراكز الطاقة في العالم.', '["Renewable Energy","Project Mgmt","Engineering","Sustainability","HSE"]', '["Abu Dhabi","Dubai"]', TRUE, 'Energy', 'Lightbulb'),
                ('healthcare', 'Healthcare & Life Sciences', 'الرعاية الصحية وعلوم الحياة', '+15%', '1,500+', 'AED 95K–180K', '95–180 ألف د.إ', '["Johnson & Johnson","Pfizer","Abbott","GE Healthcare","Medtronic","Roche"]', 'Advancing healthcare excellence and medical innovation across the Emirates.', 'تعزيز التميز في الرعاية الصحية والابتكار الطبي في الإمارات.', '["MedTech","Healthcare Mgmt","Clinical Research","Health Informatics"]', '["Dubai","Abu Dhabi","Sharjah"]', FALSE, 'Health', 'Heart'),
                ('aerospace', 'Aerospace & Aviation', 'الفضاء والطيران', '+14%', '900+', 'AED 105K–190K', '105–190 ألف د.إ', '["Boeing","Airbus","Honeywell","Rolls-Royce","GE Aviation","Collins Aerospace"]', 'Connecting the world through aviation excellence and space-age aerospace programs.', 'ربط العالم عبر التميز في الطيران وبرامج الفضاء المتقدمة.', '["Aviation Mgmt","Aerospace Eng.","Operations","Safety","Logistics"]', '["Dubai","Abu Dhabi"]', FALSE, 'Aviation', 'Plane'),
                ('tourism', 'Tourism & Hospitality', 'السياحة والضيافة', '+16%', '2,000+', 'AED 75K–150K', '75–150 ألف د.إ', '["Marriott International","Hilton","Hyatt","Accor","IHG","Four Seasons"]', 'Creating world-class hospitality experiences and iconic tourism destinations.', 'خلق تجارب ضيافة عالمية المستوى ووجهات سياحية أيقونية.', '["Hospitality Mgmt","Customer Service","Event Planning","F&B Mgmt"]', '["Dubai","Abu Dhabi","Ras Al Khaimah"]', FALSE, 'Hospitality', 'ShoppingBag');
            """)
        db.commit()
    except Exception as e:
        logger.error(f"ensure_industry_sectors_table: {e}")
        db.rollback()


@education_bp.route('/content/industries', methods=['GET'])
def get_industries():
    ensure_industry_sectors_table()
    sectors = query_all("SELECT * FROM industry_sectors ORDER BY sector_id")
    return jsonify({'industries': sectors})


# ═══════════════════════════════════════════════════════════════════
# BLOCKCHAIN CREDENTIALS
# ═══════════════════════════════════════════════════════════════════

def ensure_blockchain_tables():
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blockchain_credentials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                title_ar TEXT,
                issuer TEXT,
                issuer_ar TEXT,
                issue_date TEXT,
                issue_date_ar TEXT,
                tx_hash TEXT,
                network TEXT DEFAULT 'Ethereum',
                status TEXT DEFAULT 'Verified',
                verifications INT DEFAULT 0,
                badge TEXT DEFAULT '🎓',
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credential_issuers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                name_ar TEXT,
                credentials_count INT DEFAULT 0,
                total_verified INT DEFAULT 0,
                network TEXT DEFAULT 'Ethereum',
                region TEXT DEFAULT 'UAE',
                region_ar TEXT,
                tier TEXT DEFAULT 'Government',
                tier_label TEXT,
                tier_label_ar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("SELECT COUNT(*) FROM blockchain_credentials")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO blockchain_credentials (title, title_ar, issuer, issuer_ar, issue_date, issue_date_ar, tx_hash, network, status, verifications, badge, is_primary) VALUES
                ('Bachelor of Computer Science', 'بكالوريوس علوم الحاسوب', 'Ministry of Education (MOE)', 'وزارة التربية والتعليم', 'Feb 2026', 'فبراير 2026', '0x8c4b...f12e', 'Ethereum', 'Verified', 28, '🎓', TRUE),
                ('Higher Education Equivalency Certificate', 'شهادة معادلة التعليم العالي', 'Ministry of Higher Education & Scientific Research', 'وزارة التعليم العالي والبحث العلمي', 'Jan 2026', 'يناير 2026', '0x3e7d...a93c', 'Ethereum', 'Verified', 22, '📜', TRUE),
                ('UAE Teaching License', 'رخصة التدريس الإماراتية', 'Ministry of Education (MOE)', 'وزارة التربية والتعليم', 'Dec 2025', 'ديسمبر 2025', '0x5a1f...b74d', 'Ethereum', 'Verified', 18, '🏛️', TRUE),
                ('AWS Cloud Practitioner', 'ممارس AWS السحابي', 'Amazon Web Services', 'خدمات أمازون السحابية', 'Nov 2025', 'نوفمبر 2025', '0x7f3a...e82d', 'Polygon', 'Verified', 12, '☁️', FALSE),
                ('Google Data Analytics Professional', 'محترف تحليلات البيانات من Google', 'Google', 'Google', 'Oct 2025', 'أكتوبر 2025', '0x4b2c...a91f', 'Polygon', 'Verified', 8, '📊', FALSE),
                ('UAE Government Excellence Award', 'جائزة التميز الحكومي الإماراتية', 'Federal Authority for Gov HR (FAHR)', 'الهيئة الاتحادية للموارد البشرية الحكومية', 'Sep 2025', 'سبتمبر 2025', '0x9d1e...c73b', 'Ethereum', 'Verified', 15, '🏅', FALSE);
            """)
        cursor.execute("SELECT COUNT(*) FROM credential_issuers")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO credential_issuers (name, name_ar, credentials_count, total_verified, network, region, region_ar, tier, tier_label, tier_label_ar) VALUES
                ('Ministry of Education (MOE)', 'وزارة التربية والتعليم', 85, 42000, 'Ethereum', 'UAE', 'الإمارات', 'Primary', 'Primary', 'رئيسي'),
                ('Ministry of Higher Education & Scientific Research', 'وزارة التعليم العالي والبحث العلمي', 62, 31500, 'Ethereum', 'UAE', 'الإمارات', 'Primary', 'Primary', 'رئيسي'),
                ('Federal Authority for Gov HR (FAHR)', 'الهيئة الاتحادية للموارد البشرية الحكومية', 28, 15200, 'Ethereum', 'UAE', 'الإمارات', 'Government', 'Government', 'حكومي'),
                ('Knowledge & Human Development Authority (KHDA)', 'هيئة المعرفة والتنمية البشرية', 22, 9400, 'Ethereum', 'UAE', 'الإمارات', 'Government', 'Government', 'حكومي'),
                ('Dubai Education Council', 'مجلس دبي للتعليم', 34, 12800, 'Ethereum', 'UAE', 'الإمارات', 'Government', 'Government', 'حكومي'),
                ('Amazon Web Services', 'خدمات أمازون السحابية', 45, 12400, 'Polygon', 'Global', 'عالمي', 'Industry', 'Industry', 'قطاعي'),
                ('Google', 'Google', 32, 9800, 'Polygon', 'Global', 'عالمي', 'Industry', 'Industry', 'قطاعي'),
                ('Microsoft', 'Microsoft', 38, 11200, 'Polygon', 'Global', 'عالمي', 'Industry', 'Industry', 'قطاعي');
            """)
        db.commit()
    except Exception as e:
        logger.error(f"ensure_blockchain_tables: {e}")
        db.rollback()


@education_bp.route('/blockchain/credentials', methods=['GET'])
def get_blockchain_credentials():
    ensure_blockchain_tables()
    creds = query_all("SELECT * FROM blockchain_credentials ORDER BY is_primary DESC, verifications DESC")
    return jsonify({'credentials': creds})


@education_bp.route('/blockchain/issuers', methods=['GET'])
def get_blockchain_issuers():
    ensure_blockchain_tables()
    issuers = query_all("SELECT * FROM credential_issuers ORDER BY total_verified DESC")
    return jsonify({'issuers': issuers})
