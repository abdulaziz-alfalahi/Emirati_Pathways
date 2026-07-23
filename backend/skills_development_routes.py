"""
Skills & Development — Backend API
Serves training programs, digital skills courses, assessments, certifications,
and user skills for the 4 Skills & Development pages.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import logging
from psycopg2.extras import RealDictCursor
import json
from backend.db import get_db_connection

logger = logging.getLogger(__name__)

skills_dev_bp = Blueprint('skills_development', __name__, url_prefix='/api/skills-development')


def get_db():
    return get_db_connection()


def safe_int(val):
    return int(val) if val is not None else 0


def safe_str(val, default=''):
    return str(val) if val is not None else default


def parse_json_field(val):
    """Parse a JSON string field into a list, or return [] if not valid."""
    if val is None:
        return []
    if isinstance(val, list):
        return val
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TABLE BOOTSTRAP (idempotent; runs once per process)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_tables_ready = False


def ensure_tables():
    """Create the skills-development tables if they are missing.

    Prevents 500s such as `relation "training_programs" does not exist` on
    environments where the schema has drifted. (Proper fix is a migration; this
    mirrors the runtime-DDL pattern used elsewhere in the codebase.)
    """
    global _tables_ready
    if _tables_ready:
        return
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS training_programs (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                title_ar VARCHAR(255) DEFAULT '',
                provider VARCHAR(255) DEFAULT '',
                category VARCHAR(100) DEFAULT '',
                duration VARCHAR(100) DEFAULT '',
                level VARCHAR(50) DEFAULT '',
                url VARCHAR(500) DEFAULT '',
                skills_covered JSONB DEFAULT '[]',
                relevance_score INTEGER DEFAULT 0,
                certification_offered BOOLEAN DEFAULT false,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS lms_courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                title_ar VARCHAR(255) DEFAULT '',
                provider VARCHAR(255) DEFAULT '',
                category VARCHAR(100) DEFAULT '',
                description TEXT DEFAULT '',
                description_ar TEXT DEFAULT '',
                duration_hours INTEGER DEFAULT 0,
                level VARCHAR(50) DEFAULT '',
                skills_covered JSONB DEFAULT '[]',
                rating NUMERIC(3,2) DEFAULT 0,
                enrollments INTEGER DEFAULT 0,
                certification_offered BOOLEAN DEFAULT false,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        conn.commit()
        cur.close()
        conn.close()
        _tables_ready = True
    except Exception as e:
        logger.warning(f"skills_development ensure_tables failed: {e}")


@skills_dev_bp.before_request
def _init_skills_tables():
    ensure_tables()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. TRAINING PROGRAMS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@skills_dev_bp.route('/training-programs', methods=['GET'])
@jwt_required()
def get_training_programs():
    """Returns training programs from training_programs + lms_courses."""
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Get training programs
        cur.execute("""
            SELECT id, title, title_ar, provider, category, duration, level,
                   url, skills_covered, relevance_score, active, certification_offered,
                   created_at
            FROM training_programs
            WHERE active = true
            ORDER BY relevance_score DESC
        """)
        programs = []
        for row in cur.fetchall():
            programs.append({
                'id': str(row['id']),
                'source': 'program',  # enrolable via /training-programs/<id>/enrol
                'title': safe_str(row['title']),
                'title_ar': safe_str(row['title_ar']),
                'provider': safe_str(row['provider']),
                'category': safe_str(row['category']),
                'duration': safe_str(row['duration']),
                'level': safe_str(row['level']),
                'url': safe_str(row['url']),
                'skills': parse_json_field(row.get('skills_covered')),
                'relevance_score': safe_int(row.get('relevance_score')),
                'certification_offered': bool(row.get('certification_offered')),
            })

        # Also get LMS courses as supplementary
        cur.execute("""
            SELECT id, title, title_ar, provider, category, description, description_ar,
                   duration_hours, level, skills_covered, rating, enrollments,
                   certification_offered, active
            FROM lms_courses
            WHERE active = true
            ORDER BY rating DESC
        """)
        lms_courses = []
        for row in cur.fetchall():
            lms_courses.append({
                'id': str(row['id']),
                'source': 'lms',  # NOT enrolable via the training-programs enrol endpoint
                'title': safe_str(row['title']),
                'title_ar': safe_str(row['title_ar']),
                'provider': safe_str(row['provider']),
                'category': safe_str(row['category']),
                'description': safe_str(row.get('description')),
                'description_ar': safe_str(row.get('description_ar')),
                'duration': f"{safe_int(row.get('duration_hours'))} hours",
                'level': safe_str(row['level']),
                'skills': parse_json_field(row.get('skills_covered')),
                'rating': float(row['rating']) if row.get('rating') else 0,
                'enrollments': safe_int(row.get('enrollments')),
                'certification_offered': bool(row.get('certification_offered')),
            })

        # Stats
        total_programs = len(programs) + len(lms_courses)

        conn.close()
        return jsonify({
            'success': True,
            'data': {
                'training_programs': programs,
                'lms_courses': lms_courses,
                'total_count': total_programs,
            }
        }), 200

    except Exception as e:
        logger.error(f"Training programs error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. DIGITAL SKILLS COURSES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@skills_dev_bp.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    """Returns digital skills courses from the courses table."""
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT id, course_code, course_name, course_description,
                   course_level, course_type, subject_area, duration_weeks,
                   credit_hours, max_students, current_enrollment,
                   delivery_mode, is_active, is_published
            FROM courses
            WHERE is_active = true AND is_published = true
            ORDER BY current_enrollment DESC
        """)
        courses = []
        for row in cur.fetchall():
            courses.append({
                'id': str(row['id']),
                'code': safe_str(row['course_code']),
                'title': safe_str(row['course_name']),
                'description': safe_str(row['course_description']),
                'level': safe_str(row['course_level']),
                'type': safe_str(row['course_type']),
                'category': safe_str(row['subject_area']),
                'duration_weeks': safe_int(row['duration_weeks']),
                'duration': f"{safe_int(row['duration_weeks'])} weeks",
                'credit_hours': safe_int(row['credit_hours']),
                'max_students': safe_int(row['max_students']),
                'enrolled': safe_int(row['current_enrollment']),
                'delivery_mode': safe_str(row['delivery_mode']),
            })

        # Also return LMS courses
        cur.execute("""
            SELECT id, title, title_ar, provider, category, description,
                   duration_hours, level, rating, enrollments
            FROM lms_courses WHERE active = true
            ORDER BY rating DESC
        """)
        lms = []
        for row in cur.fetchall():
            lms.append({
                'id': str(row['id']),
                'title': safe_str(row['title']),
                'title_ar': safe_str(row['title_ar']),
                'provider': safe_str(row['provider']),
                'category': safe_str(row['category']),
                'description': safe_str(row.get('description')),
                'duration': f"{safe_int(row.get('duration_hours'))} hours",
                'level': safe_str(row['level']),
                'rating': float(row['rating']) if row.get('rating') else 0,
                'enrolled': safe_int(row.get('enrollments')),
            })

        conn.close()
        return jsonify({
            'success': True,
            'data': {
                'courses': courses,
                'lms_courses': lms,
                'total_count': len(courses) + len(lms),
            }
        }), 200

    except Exception as e:
        logger.error(f"Courses error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. ASSESSMENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@skills_dev_bp.route('/assessments', methods=['GET'])
@jwt_required()
def get_assessments():
    """Returns assessment catalog and skill taxonomy for discovery."""
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Skill taxonomy — grouped by domain
        cur.execute("""
            SELECT skill_id, name, name_ar, domain, category,
                   description, description_ar, demand_level, demand_score
            FROM skill_taxonomy
            ORDER BY demand_score DESC NULLS LAST, name
        """)
        taxonomy = []
        for row in cur.fetchall():
            taxonomy.append({
                'id': safe_str(row['skill_id']),
                'name': safe_str(row['name']),
                'name_ar': safe_str(row['name_ar']),
                'domain': safe_str(row['domain']),
                'category': safe_str(row['category']),
                'description': safe_str(row.get('description')),
                'description_ar': safe_str(row.get('description_ar')),
                'demand_level': safe_str(row.get('demand_level')),
                'demand_score': safe_int(row.get('demand_score')),
            })

        # Available assessment types from candidate_assessments
        cur.execute("""
            SELECT DISTINCT assessment_type, d33_sector,
                   COUNT(*) as count, AVG(score) as avg_score
            FROM candidate_assessments
            GROUP BY assessment_type, d33_sector
            ORDER BY assessment_type
        """)
        assessment_types = []
        for row in cur.fetchall():
            assessment_types.append({
                'type': safe_str(row['assessment_type']),
                'sector': safe_str(row['d33_sector']),
                'completed_count': safe_int(row['count']),
                'avg_score': round(float(row['avg_score'] or 0), 1),
            })

        # Domain summary
        domains = {}
        for s in taxonomy:
            d = s['domain'] or 'Other'
            if d not in domains:
                domains[d] = {'name': d, 'skill_count': 0, 'skills': []}
            domains[d]['skill_count'] += 1
            if len(domains[d]['skills']) < 5:
                domains[d]['skills'].append(s['name'])

        conn.close()
        return jsonify({
            'success': True,
            'data': {
                'skill_taxonomy': taxonomy,
                'assessment_types': assessment_types,
                'domains': list(domains.values()),
                'total_skills': len(taxonomy),
            }
        }), 200

    except Exception as e:
        logger.error(f"Assessments error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. CERTIFICATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@skills_dev_bp.route('/certifications', methods=['GET'])
@jwt_required()
def get_certifications():
    """Returns certification programs (from training_programs that offer certs)
       and the logged-in user's earned certs."""
    try:
        user_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Certification programs available
        cur.execute("""
            SELECT id, title, title_ar, provider, category, duration, level
            FROM training_programs
            WHERE certification_offered = true AND active = true
            ORDER BY relevance_score DESC
        """)
        cert_programs = []
        for row in cur.fetchall():
            cert_programs.append({
                'id': str(row['id']),
                'title': safe_str(row['title']),
                'title_ar': safe_str(row['title_ar']),
                'provider': safe_str(row['provider']),
                'category': safe_str(row['category']),
                'duration': safe_str(row['duration']),
                'level': safe_str(row['level']),
            })

        # The authenticated user's earned certifications only.
        cur.execute("""
            SELECT cc.id, cc.name, cc.issuing_organization, cc.issue_date,
                   cc.expiry_date, cc.credential_id, cc.credential_url,
                   cc.user_id
            FROM candidate_certifications cc
            WHERE cc.user_id = %s
            ORDER BY cc.issue_date DESC
        """, (user_id,))
        earned_certs = []
        for row in cur.fetchall():
            issue_date = row['issue_date']
            expiry_date = row.get('expiry_date')
            earned_certs.append({
                'id': str(row['id']),
                'name': safe_str(row['name']),
                'issuer': safe_str(row['issuing_organization']),
                'issue_date': issue_date.isoformat() if issue_date else '',
                'expiry_date': expiry_date.isoformat() if expiry_date else '',
                'credential_id': safe_str(row['credential_id']),
                'credential_url': safe_str(row['credential_url']),
                'status': 'Active' if (not expiry_date or str(expiry_date) > str(datetime.now().date())) else 'Expired',
            })

        conn.close()
        return jsonify({
            'success': True,
            'data': {
                'certification_programs': cert_programs,
                'earned_certifications': earned_certs,
                'total_programs': len(cert_programs),
                'total_earned': len(earned_certs),
            }
        }), 200

    except Exception as e:
        logger.error(f"Certifications error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. USER SKILLS & PROGRESS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@skills_dev_bp.route('/user-progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    """Returns the current user's skills, assessments, and certifications."""
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Always the authenticated caller — no demo fallback to another user.
        user_id = get_jwt_identity()

        skills = []
        assessments = []
        certs = []

        if user_id:
            # Skills
            cur.execute("""
                SELECT name, category, level, is_verified, assessment_score
                FROM candidate_skills
                WHERE user_id = %s
                ORDER BY assessment_score DESC NULLS LAST, name
            """, (user_id,))
            for row in cur.fetchall():
                skills.append({
                    'name': safe_str(row['name']),
                    'category': safe_str(row['category']),
                    'level': safe_str(row['level']),
                    'verified': bool(row.get('is_verified')),
                    'score': safe_int(row.get('assessment_score')),
                })

            # Assessments
            cur.execute("""
                SELECT title, assessment_type, score, max_score, status, d33_sector, completed_at
                FROM candidate_assessments
                WHERE user_id = %s
                ORDER BY completed_at DESC NULLS LAST
            """, (user_id,))
            for row in cur.fetchall():
                assessments.append({
                    'title': safe_str(row['title']),
                    'type': safe_str(row['assessment_type']),
                    'score': safe_int(row['score']),
                    'max_score': safe_int(row['max_score']),
                    'status': safe_str(row['status']),
                    'sector': safe_str(row['d33_sector']),
                    'completed_at': row['completed_at'].isoformat() if row.get('completed_at') else '',
                })

            # Certifications
            cur.execute("""
                SELECT name, issuing_organization, issue_date, expiry_date, credential_id
                FROM candidate_certifications
                WHERE user_id = %s
                ORDER BY issue_date DESC
            """, (user_id,))
            for row in cur.fetchall():
                certs.append({
                    'name': safe_str(row['name']),
                    'issuer': safe_str(row['issuing_organization']),
                    'issue_date': row['issue_date'].isoformat() if row.get('issue_date') else '',
                    'expiry_date': row['expiry_date'].isoformat() if row.get('expiry_date') else '',
                    'credential_id': safe_str(row['credential_id']),
                    'status': 'Active',
                })

        conn.close()
        return jsonify({
            'success': True,
            'data': {
                'skills': skills,
                'assessments': assessments,
                'certifications': certs,
                'total_skills': len(skills),
                'total_assessments': len(assessments),
                'total_certs': len(certs),
            }
        }), 200

    except Exception as e:
        logger.error(f"User progress error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ════════════════════════════════════════════════════════════════════
# Enrolment + assessment booking (2026-07 catalog audit: the Apply and
# Take Assessment actions had no backend — TD-01 / EN-02).
# training_program_enrollments: migration 018. Assessment requests are
# rows in the live `assessments` table (status 'pending'); the assessor
# dashboard picks them up, schedules and completes them.
# ════════════════════════════════════════════════════════════════════

@skills_dev_bp.route('/training-programs/<int:program_id>/enrol', methods=['POST'])
@jwt_required()
def enrol_training_program(program_id):
    """Enrol the authenticated user in a training program."""
    try:
        user_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, title FROM training_programs WHERE id = %s AND active", (program_id,))
        prog = cur.fetchone()
        if not prog:
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'Training program not found'}), 404
        cur.execute(
            """INSERT INTO training_program_enrollments (program_id, user_id)
               VALUES (%s, %s)
               ON CONFLICT (program_id, user_id)
               DO UPDATE SET status = 'enrolled', enrolled_at = NOW()
               RETURNING id""",
            (program_id, user_id))
        enr = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return jsonify({'success': True, 'message': 'Enrolled successfully',
                        'data': {'enrollment_id': enr['id'], 'program_id': program_id,
                                 'title': prog['title'], 'status': 'enrolled'}}), 201
    except Exception as e:
        logger.error(f"Enrolment error: {e}")
        return jsonify({'success': False, 'message': 'Failed to enrol'}), 500


@skills_dev_bp.route('/training-programs/my-enrolments', methods=['GET'])
@jwt_required()
def my_training_enrolments():
    try:
        user_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """SELECT e.id, e.program_id, e.status, e.enrolled_at, p.title, p.provider
               FROM training_program_enrollments e
               JOIN training_programs p ON p.id = e.program_id
               WHERE e.user_id = %s ORDER BY e.enrolled_at DESC""", (user_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({'success': True, 'data': [{
            'enrollment_id': r['id'], 'program_id': r['program_id'], 'status': r['status'],
            'title': r['title'], 'provider': r['provider'],
            'enrolled_at': r['enrolled_at'].isoformat() if r['enrolled_at'] else None,
        } for r in rows]})
    except Exception as e:
        logger.error(f"My enrolments error: {e}")
        return jsonify({'success': False, 'message': 'Failed to load enrolments'}), 500


@skills_dev_bp.route('/assessments/request', methods=['POST'])
@jwt_required()
def request_assessment():
    """Candidate requests an assessment; it lands in the assessor pending pool."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        title = (str(data.get('title') or '').strip())[:250]
        if not title:
            return jsonify({'success': False, 'message': 'title is required'}), 400
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """SELECT id FROM assessments
               WHERE candidate_id = %s AND assessment_title = %s
                 AND status IN ('pending', 'scheduled', 'in_progress')""",
            (user_id, title))
        if cur.fetchone():
            cur.close(); conn.close()
            return jsonify({'success': False, 'message': 'You already have an open request for this assessment'}), 409
        cur.execute(
            """INSERT INTO assessments (assessment_code, candidate_id, assessment_title,
                                        assessment_purpose, status, created_at, updated_at)
               VALUES ('REQ-' || to_char(NOW(), 'YYYYMMDDHH24MISS'), %s, %s,
                       'Candidate-requested skill assessment', 'pending', NOW(), NOW())
               RETURNING id""",
            (user_id, title))
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return jsonify({'success': True, 'message': 'Assessment requested — an assessor will schedule it',
                        'data': {'id': row['id'], 'title': title, 'status': 'pending'}}), 201
    except Exception as e:
        logger.error(f"Assessment request error: {e}")
        return jsonify({'success': False, 'message': 'Failed to request assessment'}), 500


@skills_dev_bp.route('/assessments/my-requests', methods=['GET'])
@jwt_required()
def my_assessment_requests():
    try:
        user_id = get_jwt_identity()
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """SELECT id, assessment_title, status, scheduled_date, percentage_score, pass_fail_status
               FROM assessments WHERE candidate_id = %s ORDER BY created_at DESC""", (user_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({'success': True, 'data': [{
            'id': r['id'], 'title': r['assessment_title'], 'status': r['status'],
            'scheduled_at': r['scheduled_date'].isoformat() if r['scheduled_date'] else None,
            'score': float(r['percentage_score']) if r['percentage_score'] is not None else None,
            'result': r['pass_fail_status'],
        } for r in rows]})
    except Exception as e:
        logger.error(f"My assessment requests error: {e}")
        return jsonify({'success': False, 'message': 'Failed to load requests'}), 500
