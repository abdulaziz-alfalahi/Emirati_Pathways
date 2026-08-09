"""
Jobs and Applications API Routes

This module provides API endpoints for job listings and applications,
supporting both candidate and public-facing job search features.
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from functools import wraps

from backend.db import get_db_connection
try:
    from backend.auth.access_control import require_auth, resolve_roles, RECRUITER_ROLES, ADMIN_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_auth, resolve_roles, RECRUITER_ROLES, ADMIN_ROLES
try:
    from backend.match_scoring import calculate_match_score
except ImportError:  # pragma: no cover
    from match_scoring import calculate_match_score

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
jobs_bp = Blueprint('jobs_api', __name__, url_prefix='/api/jobs')


def _retired(replacement):
    """410 for a handler superseded during the /api/v1 canonicalization.

    The route stays registered on purpose (matching the OTP retirement in
    nafis_talent_routes): a forgotten caller gets an actionable message naming
    the endpoint that replaced this one, rather than an ambiguous 404.
    See docs/api_v1_canonicalization.md.
    """
    return jsonify({
        'success': False,
        'message': f'This endpoint has been retired. Use {replacement} instead.',
        'replacement': replacement,
    }), 410


def execute_query(query, params=None, fetch_one=False, fetch_all=True, return_id=False):
    """Execute a database query with error handling"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            if return_id:
                result = cursor.fetchone()
                conn.commit()
                return result.get('id') if result else None
            elif fetch_one:
                result = cursor.fetchone()
                return dict(result) if result else None
            elif fetch_all:
                return [dict(row) for row in cursor.fetchall()]
            else:
                conn.commit()
                return True
    except Exception as e:
        logger.error(f"Query execution failed: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def ensure_tables_exist():
    """Ensure required tables exist"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cursor:
            # Create saved_jobs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS saved_jobs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    job_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, job_id)
                )
            """)
            
            # Create job_applications table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS job_applications (
                    id SERIAL PRIMARY KEY,
                    job_id INTEGER NOT NULL,
                    candidate_id INTEGER NOT NULL,
                    cv_id INTEGER,
                    cover_letter TEXT,
                    status VARCHAR(50) DEFAULT 'submitted',
                    notes TEXT,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(job_id, candidate_id)
                )
            """)
            
            conn.commit()
            logger.info("Jobs tables ensured")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        conn.rollback()
    finally:
        conn.close()

# Initialize tables
ensure_tables_exist()

def optional_auth(f):
    """Decorator that allows requests with or without authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


# =====================================================
# JOB LISTINGS ENDPOINTS
# =====================================================

@jobs_bp.route('', methods=['GET'])
@optional_auth
def list_jobs():
    """
    Get list of available jobs
    
    Query params:
        q: Search query
        location: Filter by location
        type: Filter by job type (full_time, part_time, contract)
        company: Filter by company
        page: Page number
        per_page: Items per page
    """
    try:
        search_query = request.args.get('q', '')
        location = request.args.get('location', '')
        job_type = request.args.get('type', '')
        company = request.args.get('company', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        offset = (page - 1) * per_page
        
        query = """
            SELECT 
                jp.id,
                jp.title,
                c.name as company,
                jp.location,
                jp.department,
                jp.employment_type as job_type,
                jp.description,
                jp.requirements,
                jp.benefits,
                jp.salary_range_min,
                jp.salary_range_max,
                jp.currency,
                jp.status,
                jp.created_at,
                jp.application_deadline,
                (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id::text) as application_count
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id::text = c.id::text
            WHERE jp.status IN ('active', 'published')
        """
        params = []
        
        if search_query:
            query += """
                AND (
                    jp.title ILIKE %s 
                    OR c.name ILIKE %s 
                    OR jp.description ILIKE %s
                )
            """
            search_term = f"%{search_query}%"
            params.extend([search_term, search_term, search_term])
            
        if location:
            query += " AND jp.location ILIKE %s"
            params.append(f"%{location}%")
            
        if job_type:
            query += " AND jp.employment_type ILIKE %s"
            params.append(f"%{job_type}%")
            
        if company:
            query += " AND c.name ILIKE %s"
            params.append(f"%{company}%")
            
        # Add sorting and pagination
        query += " ORDER BY jp.created_at DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        jobs = execute_query(query, tuple(params))
        
        # Format results (salary range, skills)
        formatted_jobs = []
        for job in (jobs or []):
            # Format salary
            salary = "Not specified"
            if job.get('salary_range_min'):
                curr = job.get('currency', 'AED')
                salary = f"{curr} {job['salary_range_min']}"
                if job.get('salary_range_max'):
                    salary += f" - {job['salary_range_max']}"
            
            job['salary_range'] = salary
            formatted_jobs.append(job)

        # Get total count for pagination
        count_query = """
            SELECT COUNT(jp.id) as total
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id::text = c.id::text
            WHERE jp.status IN ('active', 'published')
        """
        count_params = []
        if search_query:
            count_query += """
                AND (
                    jp.title ILIKE %s 
                    OR c.name ILIKE %s 
                    OR jp.description ILIKE %s
                )
            """
            search_term = f"%{search_query}%"
            count_params.extend([search_term, search_term, search_term])
        if location:
            count_query += " AND jp.location ILIKE %s"
            count_params.append(f"%{location}%")
        if job_type:
            count_query += " AND jp.employment_type ILIKE %s"
            count_params.append(f"%{job_type}%")
        if company:
            count_query += " AND c.name ILIKE %s"
            count_params.append(f"%{company}%")

        total_result = execute_query(count_query, tuple(count_params), fetch_one=True)
        total = total_result.get('total', 0) if total_result else 0
        
        return jsonify({
            'success': True,
            'data': {
                'jobs': formatted_jobs,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to list jobs: {e}")
        return jsonify({
            'success': True,
            'data': {
                'jobs': [],
                'total': 0,
                'page': 1,
                'per_page': 20,
                'total_pages': 0
            }
        })


@jobs_bp.route('/search', methods=['GET'])
@optional_auth
def search_jobs():
    """Search jobs with query"""
    try:
        query = request.args.get('query', request.args.get('q', ''))
        location = request.args.get('location', '')
        
        sql = """
            SELECT 
                jp.id,
                jp.title,
                c.name as company,
                jp.location,
                jp.employment_type as job_type,
                jp.description,
                jp.salary_range_min,
                jp.salary_range_max,
                jp.currency,
                jp.status,
                jp.created_at
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id::text = c.id::text
            WHERE jp.status IN ('active', 'published')
        """
        params = []
        
        if query:
            sql += " AND (jp.title ILIKE %s OR jp.description ILIKE %s OR c.name ILIKE %s)"
            search_term = f"%{query}%"
            params.extend([search_term, search_term, search_term])
            
        if location:
            sql += " AND jp.location ILIKE %s"
            params.append(f"%{location}%")
            
        sql += " ORDER BY jp.created_at DESC LIMIT 50"
        
        jobs = execute_query(sql, tuple(params))
        
        # Format results
        formatted_jobs = []
        for job in (jobs or []):
            salary = "Not specified"
            if job.get('salary_range_min'):
                curr = job.get('currency', 'AED')
                salary = f"{curr} {job['salary_range_min']}"
                if job.get('salary_range_max'):
                    salary += f" - {job['salary_range_max']}"
            job['salary_range'] = salary

            # This is a browse/search list, not a scored match — don't stamp a
            # fabricated match % (was a flat 75 on every job). Null = "not scored".
            job['match_score'] = None

            if job.get('created_at') and hasattr(job['created_at'], 'isoformat'):
                job['created_at'] = job['created_at'].isoformat()
                
            formatted_jobs.append(job)
            
        return jsonify({
            'success': True,
            'data': formatted_jobs,
            'query': query,
            'total': len(formatted_jobs)
        })
    except Exception as e:
        logger.error(f"Failed to search jobs: {e}")
        return jsonify({'success': False, 'data': [], 'query': query, 'total': 0, 'error': str(e)})


@jobs_bp.route('/<int:job_id>', methods=['GET'])
@optional_auth
def get_job(job_id):
    """Get details of a specific job"""
    try:
        # NOTE: Using job_postings for candidate-facing job details
        # See JOB_TABLES_CONVENTIONS.md for table usage guidelines
        query = """
            SELECT 
                j.*,
                COALESCE(c.company_name, c.name, 'Unknown') as company,
                COUNT(DISTINCT a.id) as application_count
            FROM job_postings j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN job_applications a ON j.id = a.job_id
            WHERE j.id = %s
            GROUP BY j.id, c.company_name, c.name
        """
        
        job = execute_query(query, (job_id,), fetch_one=True)
        
        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': job
        })
        
    except Exception as e:
        logger.error(f"Failed to get job: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job'
        }), 500


# =====================================================
# SAVED JOBS ENDPOINTS
# =====================================================

@jobs_bp.route('/saved', methods=['GET'])
@optional_auth
def get_saved_jobs():
    """RETIRED — superseded by GET /api/candidate/saved-jobs (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('GET /api/candidate/saved-jobs')


@jobs_bp.route('/<int:job_id>/save', methods=['POST'])
@optional_auth
def save_job(job_id):
    """RETIRED — superseded by POST /api/candidate/saved-jobs/<job_id> (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('POST /api/candidate/saved-jobs/<job_id>')


@jobs_bp.route('/<int:job_id>/unsave', methods=['POST', 'DELETE'])
@optional_auth
def unsave_job(job_id):
    """RETIRED — superseded by DELETE /api/candidate/saved-jobs/<job_id> (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('DELETE /api/candidate/saved-jobs/<job_id>')


# =====================================================
# JOB APPLICATIONS ENDPOINTS
# =====================================================

# REMOVED: get_applications was dead code — shadowed by
# REMOVED: job_application.get_user_applications (registered first via blueprint).



from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

# REMOVED: apply_to_job was dead code — shadowed by
# REMOVED: job_application.apply_for_job (registered first via blueprint).



@jobs_bp.route('/<int:job_id>/apply', methods=['POST'])
@optional_auth
def apply_to_specific_job(job_id):
    """RETIRED — superseded by POST /api/applications/apply (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('POST /api/applications/apply')


@jobs_bp.route('/applications/<application_id>', methods=['GET'])
@require_auth
def get_application(application_id):
    """Get details of a specific application. Owner (candidate) or recruiter/admin only
    — was @optional_auth (no-op), an IDOR exposing any applicant's data."""
    try:
        # NOTE: Using job_postings for application details (candidates apply to published jobs)
        # See JOB_TABLES_CONVENTIONS.md for table usage guidelines
        query = """
            SELECT 
                a.*,
                j.title as job_title,
                COALESCE(c.company_name, c.name, 'Unknown') as company,
                j.location,
                j.description as job_description
            FROM job_applications a
            JOIN job_postings j ON a.job_id = j.id
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE a.id = %s
        """
        
        application = execute_query(query, (application_id,), fetch_one=True)
        
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404

        # Ownership: only the application's own candidate — or a recruiter/admin — may view it.
        caller = getattr(g, 'user_id', None)
        if str(application.get('candidate_id')) != str(caller):
            if not (resolve_roles() & (RECRUITER_ROLES | ADMIN_ROLES)):
                return jsonify({'success': False, 'message': 'Forbidden'}), 403

        return jsonify({
            'success': True,
            'data': application
        })
        
    except Exception as e:
        logger.error(f"Failed to get application: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve application'
        }), 500


@jobs_bp.route('/applications/<application_id>/withdraw', methods=['POST'])
@require_auth
def withdraw_application(application_id):
    """RETIRED — superseded by POST /api/applications/<application_id>/withdraw (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('POST /api/applications/<application_id>/withdraw')


# =====================================================
# CANDIDATE JOB MATCHES ENDPOINT
# =====================================================

@jobs_bp.route('/matches', methods=['GET'])
@optional_auth
def get_job_matches():
    """RETIRED — superseded by GET /api/candidate/job-matches (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('GET /api/candidate/job-matches')


# Also create an alias endpoint for candidate job matches
candidate_jobs_bp = Blueprint('candidate_jobs_api', __name__, url_prefix='/api/candidate')

# REMOVED: get_candidate_job_matches was dead code — shadowed by
# REMOVED: candidate_job_bp.get_job_matches (registered first via blueprint).



# REMOVED: a duplicate GET /api/candidate/saved-jobs lived here and read the
# LEGACY `saved_jobs` table, shadowing the canonical handler in
# candidate_job_routes.py which reads migration 037's `candidate_saved_jobs`.
# Two blueprints registering the same rule means routing order decides which
# store a candidate sees — so this one is deleted outright rather than 410'd
# (a 410 on a shadowed path is either meaningless or, if it won, an outage).
# See docs/api_v1_canonicalization.md.

@candidate_jobs_bp.route('/applications', methods=['GET'])
@optional_auth
def get_candidate_applications():
    """RETIRED — superseded by GET /api/applications/my-applications (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('GET /api/applications/my-applications')


@candidate_jobs_bp.route('/applications', methods=['POST'])
@optional_auth
def submit_application():
    """RETIRED — superseded by POST /api/applications/apply (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('POST /api/applications/apply')


@candidate_jobs_bp.route('/applications/<application_id>/withdraw', methods=['POST'])
@require_auth
def withdraw_candidate_application(application_id):
    """RETIRED — superseded by POST /api/applications/<application_id>/withdraw (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('POST /api/applications/<application_id>/withdraw')


# Register the blueprints function
def register_jobs_routes(app):
    """Register jobs routes with the Flask app"""
    app.register_blueprint(jobs_bp)
    app.register_blueprint(candidate_jobs_bp)
    logger.info("✅ Jobs API routes registered")
    logger.info("✅ Candidate Jobs API routes registered")
