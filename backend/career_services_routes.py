"""
Career Services API Routes — Unified endpoints for internships, gig marketplace,
career planning, financial planning, portfolio, and startup launchpad.
Blueprint prefix: /api/career-services
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import os
import json
import logging
try:
    from backend.auth.access_control import resolve_roles
except ImportError:  # pragma: no cover
    from auth.access_control import resolve_roles

logger = logging.getLogger(__name__)

career_services_bp = Blueprint('career_services', __name__, url_prefix='/api/career-services')

# Roles permitted to manage operator/recruiter-owned content (BOLA hardening).
# internships/gigs/salary_benchmarks/startup_programs have no per-row owner column,
# so these are gated by role rather than ownership.
_MANAGER_ROLES = {'recruiter', 'employer_admin', 'hr_manager', 'career_services_operator',
                  'internship_coordinator', 'talent_operator', 'education_operator',
                  'training_provider', 'coach', 'advisor', 'admin', 'super_admin'}


def _require_manager():
    """Return a (response, 403) tuple if the caller lacks a manager role, else None.
    Resolves secondary_roles (C1) so an operator holding the role as a secondary
    role is not locked out."""
    try:
        if not (resolve_roles() & _MANAGER_ROLES):
            return jsonify({'success': False, 'message': 'Forbidden - manager access required'}), 403
    except Exception:
        return jsonify({'success': False, 'message': 'Forbidden - manager access required'}), 403
    return None

def get_db():
    try:
        conn = psycopg2.connect(
            os.getenv('DATABASE_URL',
                       'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey')
        )
        return conn
    except Exception as e:
        logger.error(f"DB connection error: {e}")
        return None


# ═══════════════════════════════════════════════════════════
# INTERNSHIPS
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/internships', methods=['GET'])
def list_internships():
    """List/filter internships."""
    sector = request.args.get('sector')
    location = request.args.get('location')
    search = request.args.get('search', '')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = "SELECT * FROM internships WHERE is_active = true"
        params = []
        if sector:
            sql += " AND sector ILIKE %s"
            params.append(f"%{sector}%")
        if location:
            sql += " AND location ILIKE %s"
            params.append(f"%{location}%")
        if search:
            sql += " AND (title ILIKE %s OR company ILIKE %s OR description ILIKE %s)"
            params.extend([f"%{search}%"] * 3)
        sql += " ORDER BY created_at DESC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"internships": [dict(r) for r in rows], "total": len(rows)}), 200
    except Exception as e:
        conn.close()
        logger.error(f"List internships error: {e}")
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/internships/<int:internship_id>', methods=['GET'])
def get_internship(internship_id):
    """Get single internship."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM internships WHERE id = %s", (internship_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return jsonify({"error": "Internship not found"}), 404
        return jsonify(dict(row)), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/internships/<int:internship_id>/apply', methods=['POST'])
@jwt_required()
def apply_internship(internship_id):
    """Apply for internship."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    if not user_id:
        data = request.get_json(silent=True) or {}
        user_id = data.get('user_id', 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO internship_applications (internship_id, user_id, status) VALUES (%s, %s, 'pending') RETURNING id",
            (internship_id, user_id)
        )
        app_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"application_id": app_id, "status": "pending"}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

# ═══════════════════════════════════════════════════════════
# INTERNSHIP APPLICANTS
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/internships/<int:internship_id>/applicants', methods=['GET'])
@jwt_required()
def list_internship_applicants(internship_id):
    """List applicants for a specific internship."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT ia.id as application_id, ia.user_id, ia.status, ia.applied_at,
                   u.full_name, u.email, u.phone
            FROM internship_applications ia
            LEFT JOIN users u ON u.id = ia.user_id
            WHERE ia.internship_id = %s
            ORDER BY ia.applied_at DESC
        """, (internship_id,))
        applicants = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"applicants": [dict(a) for a in applicants]}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/internship-applications/<int:application_id>/status', methods=['PUT'])
@jwt_required()
def update_internship_application_status(application_id):
    """Update internship application status (accept/reject/shortlist)."""
    guard = _require_manager()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    new_status = data.get('status', 'pending')
    if new_status not in ('pending', 'accepted', 'rejected', 'shortlisted', 'withdrawn'):
        return jsonify({"error": f"Invalid status: {new_status}"}), 400
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE internship_applications SET status = %s WHERE id = %s RETURNING id, status, user_id, internship_id",
            (new_status, application_id)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "Application not found"}), 404
        # Create notification for the candidate
        try:
            app_user_id = str(row[2])
            internship_id = row[3]
            # Get internship title
            cur.execute("SELECT title FROM internships WHERE id = %s", (internship_id,))
            title_row = cur.fetchone()
            posting_title = title_row[0] if title_row else 'Internship'
            status_labels = {'accepted': 'Accepted', 'rejected': 'Not Selected', 'shortlisted': 'Shortlisted'}
            notif_title = f'Application {status_labels.get(new_status, new_status.title())}: {posting_title}'
            notif_content = {
                'accepted': f'Congratulations! Your application for "{posting_title}" has been accepted.',
                'rejected': f'We appreciate your interest in "{posting_title}". Unfortunately, we have decided to move forward with other candidates.',
                'shortlisted': f'Great news! You have been shortlisted for "{posting_title}". The recruiter may schedule an interview soon.',
            }.get(new_status, f'Your application status for "{posting_title}" has been updated to {new_status}.')
            import json as _json
            cur.execute("""
                INSERT INTO notifications (user_id, type, title, content, metadata)
                VALUES (%s, %s, %s, %s, %s)
            """, (app_user_id, 'application_update', notif_title, notif_content,
                  _json.dumps({'internship_id': internship_id, 'application_id': application_id, 'status': new_status})))
        except Exception as notif_err:
            import logging
            logging.getLogger(__name__).warning(f'Failed to create notification: {notif_err}')
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"application_id": row[0], "status": row[1]}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500

# ═══════════════════════════════════════════════════════════
# GIG APPLICANTS
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/gigs/<int:gig_id>/applicants', methods=['GET'])
@jwt_required()
def list_gig_applicants(gig_id):
    """List applicants for a specific gig."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT ga.id as application_id, ga.user_id, ga.status, ga.applied_at,
                   u.full_name, u.email, u.phone
            FROM gig_applications ga
            LEFT JOIN users u ON u.id = ga.user_id
            WHERE ga.gig_id = %s
            ORDER BY ga.applied_at DESC
        """, (gig_id,))
        applicants = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"applicants": [dict(a) for a in applicants]}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/gig-applications/<int:application_id>/status', methods=['PUT'])
@jwt_required()
def update_gig_application_status(application_id):
    """Update gig application status (accept/reject/shortlist)."""
    guard = _require_manager()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    new_status = data.get('status', 'pending')
    if new_status not in ('pending', 'accepted', 'rejected', 'shortlisted', 'withdrawn'):
        return jsonify({"error": f"Invalid status: {new_status}"}), 400
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE gig_applications SET status = %s WHERE id = %s RETURNING id, status, user_id, gig_id",
            (new_status, application_id)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "Application not found"}), 404
        # Create notification for the candidate
        try:
            app_user_id = str(row[2])
            gig_id = row[3]
            cur.execute("SELECT title FROM gigs WHERE id = %s", (gig_id,))
            title_row = cur.fetchone()
            posting_title = title_row[0] if title_row else 'Gig'
            status_labels = {'accepted': 'Accepted', 'rejected': 'Not Selected', 'shortlisted': 'Shortlisted'}
            notif_title = f'Application {status_labels.get(new_status, new_status.title())}: {posting_title}'
            notif_content = {
                'accepted': f'Congratulations! Your application for "{posting_title}" has been accepted.',
                'rejected': f'We appreciate your interest in "{posting_title}". Unfortunately, we have decided to move forward with other candidates.',
                'shortlisted': f'Great news! You have been shortlisted for "{posting_title}". The recruiter may schedule an interview soon.',
            }.get(new_status, f'Your application status for "{posting_title}" has been updated to {new_status}.')
            import json as _json
            cur.execute("""
                INSERT INTO notifications (user_id, type, title, content, metadata)
                VALUES (%s, %s, %s, %s, %s)
            """, (app_user_id, 'application_update', notif_title, notif_content,
                  _json.dumps({'gig_id': gig_id, 'application_id': application_id, 'status': new_status})))
        except Exception as notif_err:
            import logging
            logging.getLogger(__name__).warning(f'Failed to create notification: {notif_err}')
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"application_id": row[0], "status": row[1]}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# MY APPLICATIONS (candidate view)
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/my-applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    """Return the current user's internship + gig applications."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except Exception:
        pass
    if not user_id:
        user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Internship applications — with full posting details
        cur.execute("""
            SELECT ia.id as application_id, ia.status, ia.applied_at,
                   i.title as job_title, i.company, i.location,
                   i.description, i.duration, i.deadline, i.sector,
                   i.stipend, i.type as internship_type, i.skills,
                   'internship' as application_type
            FROM internship_applications ia
            LEFT JOIN internships i ON i.id = ia.internship_id
            WHERE ia.user_id = %s
            ORDER BY ia.applied_at DESC
        """, (user_id,))
        internship_apps = cur.fetchall()

        # Gig applications — with full posting details
        cur.execute("""
            SELECT ga.id as application_id, ga.status, ga.applied_at,
                   g.title as job_title, g.company, g.location,
                   g.description, g.duration, g.budget, g.category,
                   g.skills, g.posted_at,
                   'gig' as application_type
            FROM gig_applications ga
            LEFT JOIN gigs g ON g.id = ga.gig_id
            WHERE ga.user_id = %s
            ORDER BY ga.applied_at DESC
        """, (user_id,))
        gig_apps = cur.fetchall()

        cur.close()
        conn.close()

        # Merge and format
        all_apps = []
        for a in list(internship_apps) + list(gig_apps):
            d = dict(a)
            # Parse skills (could be JSONB array or string)
            skills_raw = d.get('skills', [])
            if isinstance(skills_raw, str):
                import json as _json2
                try:
                    skills_raw = _json2.loads(skills_raw)
                except Exception:
                    skills_raw = []

            app_data = {
                'application_id': d['application_id'],
                'jobTitle': d.get('job_title', 'Unknown'),
                'company': d.get('company', 'Unknown'),
                'location': d.get('location', 'UAE'),
                'appliedDate': d['applied_at'].isoformat() if d.get('applied_at') else None,
                'status': _map_status(d.get('status', 'pending')),
                'lastUpdate': d['applied_at'].isoformat() if d.get('applied_at') else None,
                'application_type': d.get('application_type'),
                'description': d.get('description', ''),
                'duration': d.get('duration', ''),
                'skills': skills_raw if isinstance(skills_raw, list) else [],
            }

            # Type-specific fields
            if d.get('application_type') == 'internship':
                app_data['deadline'] = d['deadline'].isoformat() if d.get('deadline') else None
                app_data['sector'] = d.get('sector', '')
                app_data['stipend'] = d.get('stipend', '')
                app_data['internship_type'] = d.get('internship_type', '')
            else:
                app_data['budget'] = d.get('budget', '')
                app_data['category'] = d.get('category', '')
                app_data['posted_at'] = d['posted_at'].isoformat() if d.get('posted_at') else None

            all_apps.append(app_data)

        # Sort by applied date desc
        all_apps.sort(key=lambda x: x.get('appliedDate') or '', reverse=True)
        return jsonify({"success": True, "data": {"applications": all_apps}}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


def _map_status(status):
    """Map internship/gig statuses to Application Tracker statuses."""
    mapping = {
        'pending': 'pending',
        'shortlisted': 'reviewed',
        'accepted': 'offer',
        'rejected': 'rejected',
        'withdrawn': 'withdrawn',
    }
    return mapping.get(status, 'pending')


# ═══════════════════════════════════════════════════════════
# GIG MARKETPLACE
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/gigs', methods=['GET'])
def list_gigs():
    """List/filter gigs."""
    category = request.args.get('category')
    search = request.args.get('search', '')
    featured = request.args.get('featured')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = "SELECT * FROM gigs WHERE is_active = true"
        params = []
        if category:
            sql += " AND category ILIKE %s"
            params.append(f"%{category}%")
        if search:
            sql += " AND (title ILIKE %s OR company ILIKE %s OR description ILIKE %s)"
            params.extend([f"%{search}%"] * 3)
        if featured and featured.lower() == 'true':
            sql += " AND is_featured = true"
        sql += " ORDER BY is_featured DESC, posted_at DESC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"gigs": [dict(r) for r in rows], "total": len(rows)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/gigs/<int:gig_id>', methods=['GET'])
def get_gig(gig_id):
    """Get single gig."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM gigs WHERE id = %s", (gig_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return jsonify({"error": "Gig not found"}), 404
        return jsonify(dict(row)), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/gigs/<int:gig_id>/apply', methods=['POST'])
@jwt_required()
def apply_gig(gig_id):
    """Apply for gig."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    if not user_id:
        data = request.get_json(silent=True) or {}
        user_id = data.get('user_id', 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO gig_applications (gig_id, user_id, status) VALUES (%s, %s, 'pending') RETURNING id",
            (gig_id, user_id)
        )
        app_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"application_id": app_id, "status": "pending"}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# CAREER PLANNING
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/career-plans', methods=['GET'])
@jwt_required()
def get_career_plans():
    """Get user's career plans."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    if not user_id:
        user_id = request.args.get('user_id', 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM career_plans WHERE user_id = %s ORDER BY updated_at DESC", (user_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"plans": [dict(r) for r in rows], "total": len(rows)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/career-plans', methods=['POST'])
@jwt_required()
def create_career_plan():
    """Create or update a career plan."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    data = request.get_json(silent=True) or {}
    if not user_id:
        user_id = data.get('user_id', 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO career_plans (user_id, target_role, target_role_ar, current_stage,
                                      target_industry, timeline_months, skill_gaps, action_items, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            user_id,
            data.get('target_role', ''),
            data.get('target_role_ar', ''),
            data.get('current_stage', 'discovery'),
            data.get('target_industry', ''),
            data.get('timeline_months', 12),
            json.dumps(data.get('skill_gaps', [])),
            json.dumps(data.get('action_items', [])),
            data.get('notes', '')
        ))
        plan_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"plan_id": plan_id, "status": "created"}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# MARKET OVERVIEW (Career Hub real data)
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/market-overview', methods=['GET'])
def get_market_overview():
    """Aggregate real platform stats for the Career Hub page."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ── Total jobs & vacancies ──
        total_jobs = 0
        active_jobs = 0
        total_vacancies = 0
        avg_salary_min = 0
        avg_salary_max = 0
        try:
            cur.execute("SELECT COUNT(*) as c FROM job_postings")
            total_jobs = cur.fetchone()['c'] or 0
            cur.execute("SELECT COUNT(*) as c FROM job_postings WHERE LOWER(status) = 'published' OR status IS NULL")
            active_jobs = cur.fetchone()['c'] or 0
            cur.execute("SELECT COALESCE(SUM(number_of_vacancies), 0) as v FROM job_postings")
            total_vacancies = cur.fetchone()['v'] or 0
            cur.execute("""
                SELECT COALESCE(AVG(salary_range_min), 0) as avg_min,
                       COALESCE(AVG(salary_range_max), 0) as avg_max
                FROM job_postings WHERE salary_range_min > 0
            """)
            sal = cur.fetchone()
            avg_salary_min = int(sal['avg_min'] or 0)
            avg_salary_max = int(sal['avg_max'] or 0)
        except Exception as e:
            logger.warning(f"market-overview jobs query: {e}")
            try:
                conn.rollback()
            except:
                pass

        # ── Companies count + by industry ──
        total_companies = 0
        companies_by_industry = []
        try:
            cur.execute("SELECT COUNT(*) as c FROM companies")
            total_companies = cur.fetchone()['c'] or 0
            cur.execute("""
                SELECT COALESCE(industry, 'Other') as industry, COUNT(*) as count
                FROM companies GROUP BY industry ORDER BY count DESC
            """)
            companies_by_industry = [dict(r) for r in cur.fetchall()]
        except Exception as e:
            logger.warning(f"market-overview companies query: {e}")
            try:
                conn.rollback()
            except:
                pass

        # ── Jobs by department/emirate ──
        jobs_by_department = []
        jobs_by_emirate = []
        try:
            cur.execute("""
                SELECT COALESCE(department, 'General') as department,
                       COUNT(*) as count,
                       COALESCE(SUM(number_of_vacancies), 0) as vacancies
                FROM job_postings GROUP BY department ORDER BY count DESC
            """)
            jobs_by_department = [dict(r) for r in cur.fetchall()]
            cur.execute("""
                SELECT COALESCE(emirate, 'UAE') as emirate, COUNT(*) as count
                FROM job_postings GROUP BY emirate ORDER BY count DESC
            """)
            jobs_by_emirate = [dict(r) for r in cur.fetchall()]
        except Exception as e:
            logger.warning(f"market-overview dept query: {e}")
            try:
                conn.rollback()
            except:
                pass

        # ── Registered users ──
        total_users = 0
        try:
            cur.execute("SELECT COUNT(*) as c FROM users")
            total_users = cur.fetchone()['c'] or 0
        except Exception as e:
            logger.warning(f"market-overview users query: {e}")
            try:
                conn.rollback()
            except:
                pass

        # ── Training programs ──
        training_count = 0
        try:
            cur.execute("SELECT COUNT(*) as c FROM training_courses")
            training_count = cur.fetchone()['c'] or 0
        except Exception:
            try:
                conn.rollback()
            except:
                pass

        # ── Recent job titles ──
        recent_jobs = []
        try:
            cur.execute("""
                SELECT jp.title, jp.emirate, jp.department, jp.created_at,
                       c.name as company_name
                FROM job_postings jp
                LEFT JOIN companies c ON jp.company_id = c.id
                ORDER BY jp.created_at DESC LIMIT 10
            """)
            for r in cur.fetchall():
                d = dict(r)
                if d.get('created_at'):
                    d['created_at'] = str(d['created_at'])
                recent_jobs.append(d)
        except Exception as e:
            logger.warning(f"market-overview recent jobs: {e}")
            try:
                conn.rollback()
            except:
                pass

        # ── Salary benchmarks summary ──
        salary_benchmarks = []
        try:
            cur.execute("""
                SELECT industry,
                       COUNT(*) as roles,
                       COALESCE(AVG(median_salary), 0) as avg_median,
                       COALESCE(MIN(min_salary), 0) as lowest,
                       COALESCE(MAX(max_salary), 0) as highest
                FROM salary_benchmarks GROUP BY industry ORDER BY avg_median DESC
            """)
            salary_benchmarks = [dict(r) for r in cur.fetchall()]
        except Exception:
            try:
                conn.rollback()
            except:
                pass

        cur.close()
        conn.close()

        return jsonify({
            "stats": {
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "total_vacancies": total_vacancies,
                "total_companies": total_companies,
                "registered_users": total_users,
                "training_programs": training_count,
                "avg_salary_min": avg_salary_min,
                "avg_salary_max": avg_salary_max,
            },
            "jobs_by_department": jobs_by_department,
            "jobs_by_emirate": jobs_by_emirate,
            "companies_by_industry": companies_by_industry,
            "salary_benchmarks": salary_benchmarks,
            "recent_jobs": recent_jobs,
        }), 200

    except Exception as e:
        logger.error(f"Market overview error: {e}")
        try:
            conn.close()
        except:
            pass
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# FINANCIAL PLANNING / SALARY BENCHMARKS
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/salary-benchmarks', methods=['GET'])
def get_salary_benchmarks():
    """Get salary benchmark data."""
    role = request.args.get('role')
    industry = request.args.get('industry')
    experience = request.args.get('experience')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = "SELECT * FROM salary_benchmarks WHERE 1=1"
        params = []
        if role:
            sql += " AND role_title ILIKE %s"
            params.append(f"%{role}%")
        if industry:
            sql += " AND industry ILIKE %s"
            params.append(f"%{industry}%")
        if experience:
            sql += " AND experience_level = %s"
            params.append(experience)
        sql += " ORDER BY median_salary DESC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"benchmarks": [dict(r) for r in rows], "total": len(rows)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/financial-projections', methods=['POST'])
def get_financial_projections():
    """Generate salary projection for a career path."""
    data = request.get_json(silent=True) or {}
    target_role = data.get('target_role', '')
    current_salary = data.get('current_salary', 0)
    years = data.get('years', 5)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT * FROM salary_benchmarks WHERE role_title ILIKE %s ORDER BY experience_level",
            (f"%{target_role}%",)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        if not rows:
            return jsonify({"projections": [], "message": "No benchmark data for this role"}), 200

        # Build yearly projection
        benchmarks = [dict(r) for r in rows]
        base = current_salary or benchmarks[0].get('min_salary', 10000)
        projections = []
        for y in range(1, years + 1):
            growth_rate = 0.08 if y <= 2 else 0.06 if y <= 4 else 0.04
            projected = int(base * (1 + growth_rate) ** y)
            projections.append({"year": y, "projected_salary": projected})

        return jsonify({
            "projections": projections,
            "benchmarks": benchmarks,
            "target_role": target_role,
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# PORTFOLIO
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/portfolio/<user_id>', methods=['GET'])
def get_portfolio(user_id):
    """Get user's portfolio projects."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM portfolio_projects WHERE user_id = %s AND is_public = true ORDER BY completion_date DESC", (user_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"projects": [dict(r) for r in rows], "total": len(rows)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/portfolio/projects', methods=['POST'])
@jwt_required()
def add_portfolio_project():
    """Add portfolio project."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    data = request.get_json(silent=True) or {}
    if not user_id:
        user_id = data.get('user_id', 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO portfolio_projects (user_id, title, title_ar, description, description_ar,
                                            project_url, image_url, skills_demonstrated, category, completion_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            user_id,
            data.get('title', ''),
            data.get('title_ar', ''),
            data.get('description', ''),
            data.get('description_ar', ''),
            data.get('project_url', ''),
            data.get('image_url', ''),
            json.dumps(data.get('skills_demonstrated', [])),
            data.get('category', ''),
            data.get('completion_date'),
        ))
        project_id = cur.fetchone()[0]
        conn.commit()

        # Auto-update skill graph: mark skills as "proven" in active profile (candidate_skills) and legacy user_skills
        skills = data.get('skills_demonstrated', [])
        if skills:
            for skill_name in skills:
                # 1. Sync to active profile candidate_skills table
                try:
                    cur.execute("""
                        SELECT id, level FROM candidate_skills 
                        WHERE user_id = %s AND LOWER(name) = LOWER(%s)
                    """, (str(user_id), skill_name.strip()))
                    existing = cur.fetchone()
                    if existing:
                        # Progressive Validation: Upgrade to intermediate if beginner, keep unverified for mentor dashboard
                        if str(existing[1]).lower() == 'beginner':
                            cur.execute("""
                                UPDATE candidate_skills SET level = 'intermediate', is_verified = false
                                WHERE id = %s
                            """, (existing[0],))
                    else:
                        # Get category from taxonomy if possible
                        cur.execute("SELECT category FROM skill_taxonomy WHERE LOWER(name) = LOWER(%s) LIMIT 1", (skill_name.strip(),))
                        tax_row = cur.fetchone()
                        category = tax_row[0] if tax_row else 'Portfolio'
                        
                        cur.execute("""
                            INSERT INTO candidate_skills (user_id, name, level, category, is_verified)
                            VALUES (%s, %s, 'intermediate', %s, false)
                        """, (str(user_id), skill_name.strip(), category))
                except Exception as inner_e:
                    logger.warning(f"Failed to sync portfolio skill '{skill_name}' to candidate_skills: {inner_e}")

                # 2. Legacy user_skills table sync (fails silently if table is not migrated)
                try:
                    cur.execute("""
                        INSERT INTO user_skills (user_id, skill_id, proficiency_level, source)
                        SELECT %s, st.id, 'intermediate', 'portfolio'
                        FROM skill_taxonomy st WHERE LOWER(st.name) = LOWER(%s)
                        ON CONFLICT DO NOTHING
                    """, (user_id, skill_name))
                except:
                    pass
            conn.commit()

        cur.close()
        conn.close()
        return jsonify({"project_id": project_id, "status": "created", "skills_validated": skills}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/portfolio/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_portfolio_project(project_id):
    """Update portfolio project."""
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        fields = []
        params = []
        for field in ['title', 'title_ar', 'description', 'description_ar', 'project_url', 'image_url', 'category']:
            if field in data:
                fields.append(f"{field} = %s")
                params.append(data[field])
        if 'skills_demonstrated' in data:
            fields.append("skills_demonstrated = %s")
            params.append(json.dumps(data['skills_demonstrated']))
        if not fields:
            return jsonify({"error": "No fields to update"}), 400
        fields.append("updated_at = NOW()")
        params.append(project_id)
        params.append(get_jwt_identity())
        # Ownership check — only the owner may update their portfolio project
        cur.execute(f"UPDATE portfolio_projects SET {', '.join(fields)} WHERE id = %s AND user_id = %s", params)
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500



# ═══════════════════════════════════════════════════════════
# STARTUP LAUNCHPAD (now from DB)
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/startups', methods=['GET'])
def list_startup_resources():
    """List startup programs from DB."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM startup_programs WHERE is_active = true ORDER BY name")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        programs = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get('focus'), str):
                d['focus'] = json.loads(d['focus'])
            programs.append(d)
        return jsonify({"programs": programs, "total": len(programs)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/startups/register', methods=['POST'])
@jwt_required()
def register_startup():
    """Register a startup idea."""
    data = request.get_json(silent=True) or {}
    return jsonify({
        "status": "registered",
        "message": "Your startup idea has been registered. A mentor will contact you soon.",
        "idea": data.get('idea', ''),
    }), 201


# ═══════════════════════════════════════════════════════════
# RECRUITER CRUD — Internships
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/internships', methods=['POST'])
@jwt_required()
def create_internship():
    """Create a new internship (Recruiter)."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    data = request.get_json(silent=True) or {}
    if not user_id:
        user_id = data.get('posted_by', 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO internships (title, title_ar, company, company_ar, location, location_ar,
                sector, sector_ar, duration, duration_ar, type, stipend, stipend_ar,
                description, description_ar, skills, deadline, company_logo, is_active, posted_by)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true,%s) RETURNING id
        """, (
            data.get('title', ''), data.get('title_ar', ''),
            data.get('company', ''), data.get('company_ar', ''),
            data.get('location', ''), data.get('location_ar', ''),
            data.get('sector', ''), data.get('sector_ar', ''),
            data.get('duration', ''), data.get('duration_ar', ''),
            data.get('type', 'Full-time'),
            data.get('stipend', ''), data.get('stipend_ar', ''),
            data.get('description', ''), data.get('description_ar', ''),
            json.dumps(data.get('skills', [])),
            data.get('deadline'),
            data.get('company_logo', ''),
            user_id,
        ))
        iid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"id": iid, "status": "created"}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/internships/<int:internship_id>', methods=['PUT'])
@jwt_required()
def update_internship(internship_id):
    """Update internship (Recruiter)."""
    guard = _require_manager()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        fields, params = [], []
        for f in ['title','title_ar','company','company_ar','location','location_ar',
                   'sector','sector_ar','duration','duration_ar','type','stipend','stipend_ar',
                   'description','description_ar','deadline','company_logo']:
            if f in data:
                fields.append(f"{f} = %s")
                params.append(data[f])
        if 'skills' in data:
            fields.append("skills = %s")
            params.append(json.dumps(data['skills']))
        if 'is_active' in data:
            fields.append("is_active = %s")
            params.append(data['is_active'])
        if not fields:
            return jsonify({"error": "No fields to update"}), 400
        params.append(internship_id)
        cur.execute(f"UPDATE internships SET {', '.join(fields)} WHERE id = %s", params)
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/internships/<int:internship_id>', methods=['DELETE'])
@jwt_required()
def delete_internship(internship_id):
    """Deactivate internship (soft delete)."""
    guard = _require_manager()
    if guard:
        return guard
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("UPDATE internships SET is_active = false WHERE id = %s", (internship_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "deactivated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/internships/<int:internship_id>/applications', methods=['GET'])
@jwt_required()
def list_internship_applications(internship_id):
    """List applications for an internship (Recruiter view)."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT ia.*, i.title AS internship_title, i.company
            FROM internship_applications ia
            JOIN internships i ON i.id = ia.internship_id
            WHERE ia.internship_id = %s
            ORDER BY ia.applied_at DESC
        """, (internship_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"applications": [dict(r) for r in rows], "total": len(rows)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# RECRUITER CRUD — Gigs
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/gigs', methods=['POST'])
@jwt_required()
def create_gig():
    """Create a new gig (Recruiter)."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    data = request.get_json(silent=True) or {}
    if not user_id:
        user_id = data.get('posted_by', 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO gigs (title, title_ar, company, company_ar, company_rating, company_reviews,
                location, location_ar, budget, budget_ar, duration, duration_ar,
                description, description_ar, category, category_ar, skills,
                is_featured, is_active, posted_by)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true,%s) RETURNING id
        """, (
            data.get('title', ''), data.get('title_ar', ''),
            data.get('company', ''), data.get('company_ar', ''),
            data.get('company_rating', 0), data.get('company_reviews', 0),
            data.get('location', ''), data.get('location_ar', ''),
            data.get('budget', ''), data.get('budget_ar', ''),
            data.get('duration', ''), data.get('duration_ar', ''),
            data.get('description', ''), data.get('description_ar', ''),
            data.get('category', ''), data.get('category_ar', ''),
            json.dumps(data.get('skills', [])),
            data.get('is_featured', False),
            user_id,
        ))
        gid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"id": gid, "status": "created"}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/gigs/<int:gig_id>', methods=['PUT'])
@jwt_required()
def update_gig(gig_id):
    """Update gig (Recruiter)."""
    guard = _require_manager()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        fields, params = [], []
        for f in ['title','title_ar','company','company_ar','location','location_ar',
                   'budget','budget_ar','duration','duration_ar','description','description_ar',
                   'category','category_ar','is_featured']:
            if f in data:
                fields.append(f"{f} = %s")
                params.append(data[f])
        if 'skills' in data:
            fields.append("skills = %s")
            params.append(json.dumps(data['skills']))
        if 'is_active' in data:
            fields.append("is_active = %s")
            params.append(data['is_active'])
        if not fields:
            return jsonify({"error": "No fields to update"}), 400
        params.append(gig_id)
        cur.execute(f"UPDATE gigs SET {', '.join(fields)} WHERE id = %s", params)
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/gigs/<int:gig_id>', methods=['DELETE'])
@jwt_required()
def delete_gig(gig_id):
    """Deactivate gig (soft delete)."""
    guard = _require_manager()
    if guard:
        return guard
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("UPDATE gigs SET is_active = false WHERE id = %s", (gig_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "deactivated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/gigs/<int:gig_id>/applications', methods=['GET'])
@jwt_required()
def list_gig_applications(gig_id):
    """List applications for a gig (Recruiter view)."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT ga.*, g.title AS gig_title, g.company
            FROM gig_applications ga
            JOIN gigs g ON g.id = ga.gig_id
            WHERE ga.gig_id = %s
            ORDER BY ga.applied_at DESC
        """, (gig_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"applications": [dict(r) for r in rows], "total": len(rows)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# EDUCATOR — Approval Workflow
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/applications/pending-approval', methods=['GET'])
@jwt_required()
def get_pending_approvals():
    """Get all pending student applications for educator review."""
    guard = _require_manager()
    if guard:
        return guard
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        results = []

        # Internship applications
        cur.execute("""
            SELECT ia.id, ia.user_id, ia.internship_id AS opportunity_id,
                   ia.status, ia.educator_status, ia.educator_notes,
                   ia.applied_at, ia.applicant_name, ia.applicant_email,
                   i.title, i.title_ar, i.company, i.company_ar, i.sector,
                   'internship' AS opportunity_type
            FROM internship_applications ia
            JOIN internships i ON i.id = ia.internship_id
            WHERE ia.educator_status = 'pending' OR ia.educator_status IS NULL
            ORDER BY ia.applied_at DESC
        """)
        for r in cur.fetchall():
            results.append(dict(r))

        # Gig applications
        cur.execute("""
            SELECT ga.id, ga.user_id, ga.gig_id AS opportunity_id,
                   ga.status, ga.educator_status, ga.educator_notes,
                   ga.applied_at, ga.applicant_name, ga.applicant_email,
                   g.title, g.title_ar, g.company, g.company_ar, g.category AS sector,
                   'gig' AS opportunity_type
            FROM gig_applications ga
            JOIN gigs g ON g.id = ga.gig_id
            WHERE ga.educator_status = 'pending' OR ga.educator_status IS NULL
            ORDER BY ga.applied_at DESC
        """)
        for r in cur.fetchall():
            results.append(dict(r))

        # Scholarship applications (if table exists)
        try:
            cur.execute("""
                SELECT sa.id, sa.student_id AS user_id, sa.scholarship_id AS opportunity_id,
                       sa.status, sa.educator_status, sa.educator_notes,
                       sa.submitted_at AS applied_at,
                       s.title, s.description, s.provider_name AS company,
                       'scholarship' AS opportunity_type
                FROM scholarship_applications sa
                JOIN scholarships s ON s.id = sa.scholarship_id
                WHERE sa.educator_status = 'pending' OR sa.educator_status IS NULL
                ORDER BY sa.submitted_at DESC
            """)
            for r in cur.fetchall():
                results.append(dict(r))
        except:
            conn.rollback()  # table might not exist

        cur.close()
        conn.close()
        return jsonify({"applications": results, "total": len(results)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/applications/<int:application_id>/approve', methods=['PUT'])
@jwt_required()
def approve_application(application_id):
    """Educator approves an application."""
    guard = _require_manager()
    if guard:
        return guard
    educator_id = None
    try:
        educator_id = get_jwt_identity()
    except:
        pass
    data = request.get_json(silent=True) or {}
    app_type = data.get('type', 'internship')  # internship, gig, scholarship
    notes = data.get('notes', '')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        table = 'internship_applications' if app_type == 'internship' \
            else 'gig_applications' if app_type == 'gig' \
            else 'scholarship_applications'

        cur.execute(f"""
            UPDATE {table}
            SET educator_status = 'approved', educator_id = %s, educator_notes = %s
            WHERE id = %s
        """, (educator_id, notes, application_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "approved", "application_id": application_id}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/applications/<int:application_id>/reject', methods=['PUT'])
@jwt_required()
def reject_application(application_id):
    """Educator rejects an application."""
    guard = _require_manager()
    if guard:
        return guard
    educator_id = None
    try:
        educator_id = get_jwt_identity()
    except:
        pass
    data = request.get_json(silent=True) or {}
    app_type = data.get('type', 'internship')
    notes = data.get('notes', '')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        table = 'internship_applications' if app_type == 'internship' \
            else 'gig_applications' if app_type == 'gig' \
            else 'scholarship_applications'

        cur.execute(f"""
            UPDATE {table}
            SET educator_status = 'rejected', educator_id = %s, educator_notes = %s
            WHERE id = %s
        """, (educator_id, notes, application_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "rejected", "application_id": application_id}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# OPERATOR CRUD — Salary Benchmarks
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/salary-benchmarks', methods=['POST'])
@jwt_required()
def create_salary_benchmark():
    """Create salary benchmark (Operator)."""
    guard = _require_manager()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO salary_benchmarks (role_title, role_title_ar, industry, industry_ar,
                experience_level, min_salary, median_salary, max_salary, currency)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (
            data.get('role_title', ''), data.get('role_title_ar', ''),
            data.get('industry', ''), data.get('industry_ar', ''),
            data.get('experience_level', 'mid'),
            data.get('min_salary', 0), data.get('median_salary', 0), data.get('max_salary', 0),
            data.get('currency', 'AED'),
        ))
        bid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"id": bid, "status": "created"}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/salary-benchmarks/<int:benchmark_id>', methods=['PUT'])
@jwt_required()
def update_salary_benchmark(benchmark_id):
    """Update salary benchmark (Operator)."""
    guard = _require_manager()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        fields, params = [], []
        for f in ['role_title','role_title_ar','industry','industry_ar','experience_level',
                   'min_salary','median_salary','max_salary','currency']:
            if f in data:
                fields.append(f"{f} = %s")
                params.append(data[f])
        if not fields:
            return jsonify({"error": "No fields to update"}), 400
        params.append(benchmark_id)
        cur.execute(f"UPDATE salary_benchmarks SET {', '.join(fields)} WHERE id = %s", params)
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/salary-benchmarks/<int:benchmark_id>', methods=['DELETE'])
@jwt_required()
def delete_salary_benchmark(benchmark_id):
    """Delete salary benchmark (Operator)."""
    guard = _require_manager()
    if guard:
        return guard
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM salary_benchmarks WHERE id = %s", (benchmark_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "deleted"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# OPERATOR CRUD — Startup Programs
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/startups', methods=['POST'])
@jwt_required()
def create_startup_program():
    """Create startup program (Operator)."""
    guard = _require_manager()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO startup_programs (name, name_ar, location, location_ar,
                description, description_ar, website, type, focus)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (
            data.get('name', ''), data.get('name_ar', ''),
            data.get('location', ''), data.get('location_ar', ''),
            data.get('description', ''), data.get('description_ar', ''),
            data.get('website', ''),
            data.get('type', 'accelerator'),
            json.dumps(data.get('focus', [])),
        ))
        pid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"id": pid, "status": "created"}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/startups/<int:program_id>', methods=['PUT'])
@jwt_required()
def update_startup_program(program_id):
    """Update startup program (Operator)."""
    guard = _require_manager()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        fields, params = [], []
        for f in ['name','name_ar','location','location_ar','description','description_ar',
                   'website','type','is_active']:
            if f in data:
                fields.append(f"{f} = %s")
                params.append(data[f])
        if 'focus' in data:
            fields.append("focus = %s")
            params.append(json.dumps(data['focus']))
        fields.append("updated_at = NOW()")
        if len(fields) <= 1:
            return jsonify({"error": "No fields to update"}), 400
        params.append(program_id)
        cur.execute(f"UPDATE startup_programs SET {', '.join(fields)} WHERE id = %s", params)
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@career_services_bp.route('/startups/<int:program_id>', methods=['DELETE'])
@jwt_required()
def delete_startup_program(program_id):
    """Deactivate startup program (soft delete)."""
    guard = _require_manager()
    if guard:
        return guard
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("UPDATE startup_programs SET is_active = false WHERE id = %s", (program_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "deactivated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# PARENT — Application Notifications
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/parent/child-applications', methods=['GET'])
@jwt_required()
def get_child_applications():
    """Get all applications for a parent's child(ren)."""
    parent_id = None
    try:
        parent_id = get_jwt_identity()
    except:
        pass
    child_user_id = request.args.get('child_id', None)
    if not child_user_id:
        return jsonify({"applications": [], "total": 0}), 200

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        results = []

        # Internship applications
        cur.execute("""
            SELECT ia.id, ia.user_id, ia.status, ia.educator_status,
                   ia.applied_at, i.title, i.company, 'internship' AS type
            FROM internship_applications ia
            JOIN internships i ON i.id = ia.internship_id
            WHERE ia.user_id = %s ORDER BY ia.applied_at DESC
        """, (child_user_id,))
        results.extend([dict(r) for r in cur.fetchall()])

        # Gig applications
        cur.execute("""
            SELECT ga.id, ga.user_id, ga.status, ga.educator_status,
                   ga.applied_at, g.title, g.company, 'gig' AS type
            FROM gig_applications ga
            JOIN gigs g ON g.id = ga.gig_id
            WHERE ga.user_id = %s ORDER BY ga.applied_at DESC
        """, (child_user_id,))
        results.extend([dict(r) for r in cur.fetchall()])

        # Scholarship applications (if table exists)
        try:
            cur.execute("""
                SELECT sa.id, sa.student_id AS user_id, sa.status, sa.educator_status,
                       sa.submitted_at AS applied_at, s.title, s.provider_name AS company,
                       'scholarship' AS type
                FROM scholarship_applications sa
                JOIN scholarships s ON s.id = sa.scholarship_id
                WHERE sa.student_id = %s ORDER BY sa.submitted_at DESC
            """, (child_user_id,))
            results.extend([dict(r) for r in cur.fetchall()])
        except:
            conn.rollback()

        cur.close()
        conn.close()
        return jsonify({"applications": results, "total": len(results)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# PARENT — Dashboard Data
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/parent/dashboard', methods=['GET'])
@jwt_required()
def get_parent_dashboard():
    """Get comprehensive parent dashboard with children data from real DB."""
    parent_user_id = None
    try:
        parent_user_id = get_jwt_identity()
    except:
        pass

    conn = get_db()
    if not conn:
        return jsonify({"success": True, "children": [], "camps": [], "events": []}), 200
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ── Find children linked to this parent via student_guardians ──
        children = []
        student_ids = []
        try:
            cur.execute("""
                SELECT s.id, s.student_id AS code, s.first_name, s.last_name,
                       s.arabic_name, s.date_of_birth, s.gender, s.status,
                       s.enrollment_date
                FROM students s
                JOIN student_guardians sg ON sg.student_id = s.id
                WHERE sg.user_id = %s
                ORDER BY s.date_of_birth ASC
            """, (parent_user_id,))
            rows = cur.fetchall()
            for r in rows:
                student_ids.append(r['id'])
        except:
            conn.rollback()
            # Fallback: try finding students by guardian email matching user
            try:
                cur.execute("""
                    SELECT s.id, s.student_id AS code, s.first_name, s.last_name,
                           s.arabic_name, s.date_of_birth, s.gender, s.status,
                           s.enrollment_date
                    FROM students s
                    ORDER BY s.date_of_birth ASC LIMIT 5
                """)
                rows = cur.fetchall()
                student_ids = [r['id'] for r in rows]
            except:
                conn.rollback()
                rows = []

        # ── For each child, fetch grades, attendance, activities ──
        for r in rows:
            child = dict(r)
            sid = r['id']

            # Calculate age from date_of_birth
            if child.get('date_of_birth'):
                from datetime import date
                today = date.today()
                dob = child['date_of_birth']
                if isinstance(dob, str):
                    from datetime import datetime as dt
                    dob = dt.strptime(dob, '%Y-%m-%d').date()
                child['age'] = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            else:
                child['age'] = 0

            # GPA
            try:
                cur.execute("""
                    SELECT ROUND(AVG(CASE WHEN max_score > 0
                        THEN (score / max_score * 4.0) ELSE 0 END)::numeric, 2) AS gpa
                    FROM student_progress WHERE student_id = %s
                """, (sid,))
                gpa_row = cur.fetchone()
                child['gpa'] = float(gpa_row['gpa']) if gpa_row and gpa_row.get('gpa') else 0
            except:
                child['gpa'] = 0
                conn.rollback()

            # Attendance
            try:
                cur.execute("""
                    SELECT ROUND(
                        COUNT(*) FILTER (WHERE status = 'present')::numeric /
                        NULLIF(COUNT(*)::numeric, 0) * 100, 0
                    ) AS rate FROM attendance WHERE student_id = %s
                """, (sid,))
                att_row = cur.fetchone()
                child['attendance'] = int(att_row['rate']) if att_row and att_row.get('rate') else 0
            except:
                child['attendance'] = 0
                conn.rollback()

            # Subjects + grades
            subjects = []
            try:
                cur.execute("""
                    SELECT subject AS name, grade,
                           ROUND((score / NULLIF(max_score, 0) * 100)::numeric) AS progress
                    FROM student_progress WHERE student_id = %s
                    ORDER BY assessment_date DESC
                """, (sid,))
                subjects = [dict(s) for s in cur.fetchall()]
            except:
                conn.rollback()
            child['subjects'] = subjects

            # Determine grade level from enrollments/classes
            try:
                cur.execute("""
                    SELECT c.grade_level FROM enrollments e
                    JOIN classes c ON c.id = e.class_id
                    WHERE e.student_id = %s AND e.status = 'active'
                    LIMIT 1
                """, (sid,))
                gl_row = cur.fetchone()
                child['grade'] = gl_row['grade_level'] if gl_row else ''
            except:
                child['grade'] = ''
                conn.rollback()

            # Activities (from achievements)
            activities = []
            try:
                cur.execute("""
                    SELECT title FROM student_achievements
                    WHERE student_id = %s ORDER BY achievement_date DESC LIMIT 3
                """, (sid,))
                activities = [a['title'] for a in cur.fetchall()]
            except:
                conn.rollback()
            child['activities'] = activities

            # No trend computation is wired — do not assert 'up' for every child. (#26)
            child['trend'] = None
            child['campsEnrolled'] = 0

            # Serialize dates
            for k, v in child.items():
                if hasattr(v, 'isoformat'):
                    child[k] = str(v)

            children.append(child)

        # ── Knowledge Camps (from knowledge_camps if table exists) ──
        camps = []
        try:
            cur.execute("""
                SELECT id, title, title_ar, category, start_date, end_date,
                       location, location_ar, age_range, spots_remaining
                FROM knowledge_camps WHERE is_active = true
                ORDER BY start_date ASC LIMIT 6
            """)
            for c in cur.fetchall():
                camp = dict(c)
                for k, v in camp.items():
                    if hasattr(v, 'isoformat'):
                        camp[k] = str(v)
                camps.append(camp)
        except:
            conn.rollback()

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "children": children,
            "camps": camps,
            "stats": {
                "totalChildren": len(children),
                "totalCampEnrolments": sum(c.get('campsEnrolled', 0) for c in children),
                "averageGPA": round(sum(c.get('gpa', 0) for c in children) / max(len(children), 1), 2),
                "averageAttendance": round(sum(c.get('attendance', 0) for c in children) / max(len(children), 1))
            }
        }), 200

    except Exception as e:
        logger.error(f"Parent dashboard error: {e}")
        try:
            conn.close()
        except:
            pass
        return jsonify({"success": True, "children": [], "camps": [], "stats": {}}), 200


# ═══════════════════════════════════════════════════════════
# RECRUITER — My Postings
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/my-postings', methods=['GET'])
@jwt_required()
def get_my_postings():
    """Get all internships and gigs posted by the current recruiter."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    if not user_id:
        user_id = request.args.get('user_id', 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Internships
        cur.execute("""
            SELECT i.*, 'internship' AS posting_type,
                   (SELECT COUNT(*) FROM internship_applications WHERE internship_id = i.id) AS application_count
            FROM internships i WHERE i.posted_by = %s
            ORDER BY i.created_at DESC
        """, (user_id,))
        internships = [dict(r) for r in cur.fetchall()]

        # Gigs
        cur.execute("""
            SELECT g.*, 'gig' AS posting_type,
                   (SELECT COUNT(*) FROM gig_applications WHERE gig_id = g.id) AS application_count
            FROM gigs g WHERE g.posted_by = %s
            ORDER BY g.posted_at DESC
        """, (user_id,))
        gigs = [dict(r) for r in cur.fetchall()]

        cur.close()
        conn.close()
        return jsonify({
            "internships": internships,
            "gigs": gigs,
            "total": len(internships) + len(gigs)
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/health', methods=['GET'])
def health_check():
    """Health check with table counts."""
    conn = get_db()
    if not conn:
        return jsonify({"status": "unhealthy", "error": "No DB connection"}), 503
    try:
        cur = conn.cursor()
        counts = {}
        for table in ['internships', 'gigs', 'salary_benchmarks', 'portfolio_projects', 'career_plans',
                       'internship_applications', 'gig_applications', 'startup_programs']:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                counts[table] = cur.fetchone()[0]
            except:
                counts[table] = 0
                conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"status": "healthy", "counts": counts}), 200
    except Exception as e:
        conn.close()
        return jsonify({"status": "unhealthy", "error": str(e)}), 503


# ═══════════════════════════════════════════════════════════
# CANDIDATE ANALYTICS
# ═══════════════════════════════════════════════════════════

@career_services_bp.route('/analytics/candidate', methods=['GET'])
@jwt_required()
def get_candidate_analytics():
    """Return aggregated analytics for the currently logged-in candidate.
    Pulls real data from: users, user_data, job_postings applications,
    internship/gig applications, portfolio_projects, career_plans.
    """
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    if not user_id:
        user_id = request.args.get('user_id')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503

    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ── 1. Profile basics ──
        profile = {}
        try:
            cur.execute("SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = %s", (user_id,))
            u = cur.fetchone()
            if u:
                profile = dict(u)
        except:
            conn.rollback()

        # ── 2. User data (skills, experience, education stored as JSON) ──
        user_data_json = {}
        try:
            cur.execute("SELECT data FROM user_data WHERE user_id = %s ORDER BY updated_at DESC LIMIT 1", (user_id,))
            row = cur.fetchone()
            if row and row.get('data'):
                raw = row['data']
                user_data_json = json.loads(raw) if isinstance(raw, str) else raw
        except:
            conn.rollback()

        skills_list = user_data_json.get('skills', [])
        certifications = user_data_json.get('certifications', [])
        experience = user_data_json.get('experience', [])

        # ── 3. Job applications count ──
        applications_sent = 0
        interview_count = 0
        app_statuses = {}
        recent_applications = []
        try:
            cur.execute("""
                SELECT a.status, a.applied_at, a.match_score,
                       jp.title AS job_title, jp.company
                FROM applications a
                JOIN job_postings jp ON jp.id = a.job_id
                WHERE a.user_id = %s
                ORDER BY a.applied_at DESC
            """, (user_id,))
            app_rows = cur.fetchall()
            applications_sent = len(app_rows)
            for a in app_rows:
                s = a.get('status', 'applied')
                app_statuses[s] = app_statuses.get(s, 0) + 1
                if s in ('interview', 'interviewed', 'interview_scheduled'):
                    interview_count += 1
            recent_applications = [dict(a) for a in app_rows[:5]]
        except:
            conn.rollback()

        # Also count internship + gig applications
        intern_apps = 0
        gig_apps = 0
        try:
            cur.execute("SELECT COUNT(*) AS c FROM internship_applications WHERE user_id = %s", (user_id,))
            intern_apps = (cur.fetchone() or {}).get('c', 0)
        except:
            conn.rollback()
        try:
            cur.execute("SELECT COUNT(*) AS c FROM gig_applications WHERE user_id = %s", (user_id,))
            gig_apps = (cur.fetchone() or {}).get('c', 0)
        except:
            conn.rollback()

        total_applications = applications_sent + intern_apps + gig_apps
        interview_rate = round((interview_count / applications_sent * 100)) if applications_sent > 0 else 0

        # ── 4. Portfolio projects ──
        portfolio_count = 0
        try:
            cur.execute("SELECT COUNT(*) AS c FROM portfolio_projects WHERE user_id = %s", (user_id,))
            portfolio_count = (cur.fetchone() or {}).get('c', 0)
        except:
            conn.rollback()

        # ── 5. Career plans ──
        goals = []
        try:
            cur.execute("""
                SELECT title, title_ar, progress, target, deadline, status
                FROM career_plans WHERE user_id = %s ORDER BY created_at DESC
            """, (user_id,))
            goals = [dict(r) for r in cur.fetchall()]
        except:
            conn.rollback()

        # ── 6. Profile completeness score ──
        completeness = 0
        checks = [
            bool(profile.get('full_name')),
            bool(profile.get('email')),
            bool(profile.get('phone')),
            len(skills_list) > 0,
            len(certifications) > 0,
            len(experience) > 0,
            portfolio_count > 0,
            total_applications > 0,
        ]
        completeness = round(sum(checks) / len(checks) * 100)

        # ── 7. Skills with market demand mapping ──
        demand_map = {
            'python': 'Very High', 'javascript': 'Very High', 'react': 'Very High',
            'data analysis': 'Very High', 'machine learning': 'High', 'ai': 'Very High',
            'cloud computing': 'High', 'aws': 'High', 'azure': 'High',
            'project management': 'High', 'leadership': 'Medium',
            'communication': 'High', 'cybersecurity': 'Very High',
            'sql': 'High', 'excel': 'Medium', 'powerbi': 'High',
            'devops': 'High', 'docker': 'High', 'kubernetes': 'High',
            'financial analysis': 'High', 'marketing': 'Medium',
        }
        skills_analytics = []
        for s in skills_list:
            name = s if isinstance(s, str) else s.get('name', '')
            level = s.get('level', 70) if isinstance(s, dict) else 70
            demand_key = demand_map.get(name.lower().strip(), 'Medium')
            skills_analytics.append({
                'name': name,
                'level': level,
                'demand': demand_key,
            })

        cur.close()
        conn.close()

        return jsonify({
            "profile": profile,
            "overview": {
                "profile_completeness": completeness,
                "total_applications": total_applications,
                "job_applications": applications_sent,
                "internship_applications": intern_apps,
                "gig_applications": gig_apps,
                "interview_count": interview_count,
                "interview_rate": interview_rate,
                "skills_count": len(skills_list),
                "certifications_count": len(certifications),
                "portfolio_projects": portfolio_count,
                "application_statuses": app_statuses,
            },
            "skills": skills_analytics,
            "certifications": certifications if isinstance(certifications, list) else [],
            "goals": goals,
            "recent_applications": recent_applications,
            "experience_years": len(experience),
        }), 200

    except Exception as e:
        logger.error(f"Candidate analytics error: {e}")
        try:
            conn.close()
        except:
            pass
        return jsonify({"error": str(e)}), 500


# ─── FINANCIAL PROFILE (Candidate) ───────────────────────────────────────────

@career_services_bp.route('/financial-profile', methods=['GET'])
@jwt_required()
def get_financial_profile():
    """Get candidate financial profile with salary estimate, budget, and savings."""
    user_id = None
    try:
        user_id = get_jwt_identity()
    except:
        pass
    if not user_id:
        user_id = 1

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. Get user skills to find matching salary benchmarks
        skills_list = []
        try:
            cur.execute("SELECT data FROM user_data WHERE user_id = %s AND data_type = 'skills'", (user_id,))
            row = cur.fetchone()
            if row and row.get('data'):
                raw = row['data']
                if isinstance(raw, str):
                    raw = json.loads(raw)
                if isinstance(raw, list):
                    skills_list = raw
        except:
            conn.rollback()

        # 2. Get best matching salary benchmark
        estimated_salary = 15000  # default AED
        matching_benchmark = None
        try:
            if skills_list:
                skill_names = [s if isinstance(s, str) else s.get('name', '') for s in skills_list]
                like_patterns = [f'%{s.lower()}%' for s in skill_names if s]
                if like_patterns:
                    or_clauses = ' OR '.join(['LOWER(role_title) LIKE %s'] * len(like_patterns))
                    cur.execute(f"SELECT * FROM salary_benchmarks WHERE {or_clauses} ORDER BY median_salary DESC LIMIT 1", like_patterns)
                    bench = cur.fetchone()
                    if bench:
                        matching_benchmark = dict(bench)
                        estimated_salary = bench.get('median_salary', 15000) or 15000

            if not matching_benchmark:
                cur.execute("SELECT * FROM salary_benchmarks ORDER BY median_salary DESC LIMIT 1")
                bench = cur.fetchone()
                if bench:
                    matching_benchmark = dict(bench)
                    estimated_salary = bench.get('median_salary', 15000) or 15000
        except:
            conn.rollback()

        # 3. Compute budget breakdown based on estimated salary
        budget = [
            {"category": "Housing", "category_ar": "\u0627\u0644\u0633\u0643\u0646", "pct": 30, "amount": round(estimated_salary * 0.30)},
            {"category": "Transportation", "category_ar": "\u0627\u0644\u0645\u0648\u0627\u0635\u0644\u0627\u062a", "pct": 15, "amount": round(estimated_salary * 0.15)},
            {"category": "Food & Groceries", "category_ar": "\u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u0627\u0644\u0628\u0642\u0627\u0644\u0629", "pct": 15, "amount": round(estimated_salary * 0.15)},
            {"category": "Savings & Investments", "category_ar": "\u0627\u0644\u0627\u062f\u062e\u0627\u0631 \u0648\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631", "pct": 20, "amount": round(estimated_salary * 0.20)},
            {"category": "Utilities & Bills", "category_ar": "\u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0648\u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631", "pct": 10, "amount": round(estimated_salary * 0.10)},
            {"category": "Personal & Leisure", "category_ar": "\u0627\u0644\u0634\u062e\u0635\u064a \u0648\u0627\u0644\u062a\u0631\u0641\u064a\u0647", "pct": 10, "amount": round(estimated_salary * 0.10)},
        ]

        # 4. Get career plans as savings goals
        goals = []
        try:
            cur.execute("""
                SELECT title, title_ar, description, target_date, status, progress_percentage
                FROM career_plans WHERE user_id = %s ORDER BY created_at DESC
            """, (user_id,))
            for p in cur.fetchall():
                goals.append({
                    "title": p.get('title', ''),
                    "title_ar": p.get('title_ar', ''),
                    "description": p.get('description', ''),
                    "target_date": str(p['target_date']) if p.get('target_date') else None,
                    "status": p.get('status', 'active'),
                    "progress": p.get('progress_percentage', 0) or 0,
                })
        except:
            conn.rollback()

        # 5. Get top salary benchmarks for reference
        benchmarks = []
        try:
            cur.execute("SELECT * FROM salary_benchmarks ORDER BY median_salary DESC LIMIT 10")
            benchmarks = [dict(r) for r in cur.fetchall()]
        except:
            conn.rollback()

        cur.close()
        conn.close()

        return jsonify({
            "estimated_salary": estimated_salary,
            "matching_benchmark": matching_benchmark,
            "budget": budget,
            "savings_goals": goals,
            "benchmarks": benchmarks,
            "skills_count": len(skills_list),
        }), 200

    except Exception as e:
        logger.error(f"Financial profile error: {e}")
        try:
            conn.close()
        except:
            pass
        return jsonify({"error": str(e)}), 500
