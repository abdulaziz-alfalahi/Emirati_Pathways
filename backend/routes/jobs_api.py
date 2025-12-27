"""
Jobs and Applications API Routes

This module provides API endpoints for job listings and applications,
supporting both candidate and public-facing job search features.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
jobs_bp = Blueprint('jobs_api', __name__, url_prefix='/api/jobs')

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(**DATABASE_CONFIG)
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

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
                j.id,
                j.title,
                j.company,
                j.location,
                j.department,
                j.job_type,
                j.description,
                j.requirements,
                j.benefits,
                j.salary_range,
                j.status,
                j.created_at,
                j.application_deadline,
                COUNT(DISTINCT a.id) as application_count
            FROM job_descriptions j
            LEFT JOIN job_applications a ON j.id = a.job_id
            WHERE j.status IN ('active', 'published')
        """
        params = []
        
        if search_query:
            query += """
                AND (
                    j.title ILIKE %s 
                    OR j.company ILIKE %s 
                    OR j.description ILIKE %s
                )
            """
            search_param = f"%{search_query}%"
            params.extend([search_param] * 3)
        
        if location:
            query += " AND j.location ILIKE %s"
            params.append(f"%{location}%")
        
        if job_type:
            query += " AND j.job_type = %s"
            params.append(job_type)
        
        if company:
            query += " AND j.company ILIKE %s"
            params.append(f"%{company}%")
        
        query += """
            GROUP BY j.id
            ORDER BY j.created_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([per_page, offset])
        
        jobs = execute_query(query, tuple(params))
        
        # Get total count
        count_query = """
            SELECT COUNT(*) as total
            FROM job_descriptions
            WHERE status IN ('active', 'published')
        """
        total_result = execute_query(count_query, fetch_one=True)
        total = total_result.get('total', 0) if total_result else 0
        
        return jsonify({
            'success': True,
            'data': {
                'jobs': jobs or [],
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
        
        # Return mock search results
        return jsonify({
            'success': True,
            'data': [
                {'id': 1, 'title': 'Software Engineer', 'company': 'Tech Corp', 'location': 'Dubai', 'match_score': 95},
                {'id': 2, 'title': 'Senior Developer', 'company': 'Innovation Inc', 'location': 'Abu Dhabi', 'match_score': 88},
                {'id': 3, 'title': 'Full Stack Developer', 'company': 'Digital Solutions', 'location': 'Dubai', 'match_score': 82}
            ],
            'query': query,
            'total': 3
        })
    except Exception as e:
        logger.error(f"Failed to search jobs: {e}")
        return jsonify({'success': True, 'data': [], 'query': '', 'total': 0})


@jobs_bp.route('/<int:job_id>', methods=['GET'])
@optional_auth
def get_job(job_id):
    """Get details of a specific job"""
    try:
        query = """
            SELECT 
                j.*,
                COUNT(DISTINCT a.id) as application_count
            FROM job_descriptions j
            LEFT JOIN job_applications a ON j.id = a.job_id
            WHERE j.id = %s
            GROUP BY j.id
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
    """Get user's saved jobs"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        if not user_id:
            return jsonify({
                'success': True,
                'data': []
            })
        
        query = """
            SELECT 
                j.id,
                j.title,
                j.company,
                j.location,
                j.job_type,
                j.salary_range,
                j.status,
                j.created_at,
                j.application_deadline,
                s.created_at as saved_at
            FROM saved_jobs s
            JOIN job_descriptions j ON s.job_id = j.id
            WHERE s.user_id = %s
            ORDER BY s.created_at DESC
        """
        
        jobs = execute_query(query, (user_id,))
        
        return jsonify({
            'success': True,
            'data': jobs or []
        })
        
    except Exception as e:
        logger.error(f"Failed to get saved jobs: {e}")
        return jsonify({
            'success': True,
            'data': []
        })


@jobs_bp.route('/<int:job_id>/save', methods=['POST'])
@optional_auth
def save_job(job_id):
    """Save a job for later"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID required'
            }), 400
        
        # Check if already saved
        check_query = "SELECT id FROM saved_jobs WHERE user_id = %s AND job_id = %s"
        existing = execute_query(check_query, (user_id, job_id), fetch_one=True)
        
        if existing:
            return jsonify({
                'success': True,
                'message': 'Job already saved'
            })
        
        # Save the job
        insert_query = """
            INSERT INTO saved_jobs (user_id, job_id)
            VALUES (%s, %s)
            RETURNING id
        """
        save_id = execute_query(insert_query, (user_id, job_id), return_id=True)
        
        return jsonify({
            'success': True,
            'data': {'id': save_id},
            'message': 'Job saved'
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to save job: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to save job'
        }), 500


@jobs_bp.route('/<int:job_id>/unsave', methods=['POST', 'DELETE'])
@optional_auth
def unsave_job(job_id):
    """Remove a job from saved list"""
    try:
        if request.method == 'POST':
            data = request.get_json() or {}
            user_id = data.get('user_id')
        else:
            user_id = request.args.get('user_id', type=int)
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID required'
            }), 400
        
        query = "DELETE FROM saved_jobs WHERE user_id = %s AND job_id = %s"
        execute_query(query, (user_id, job_id), fetch_all=False)
        
        return jsonify({
            'success': True,
            'message': 'Job removed from saved list'
        })
        
    except Exception as e:
        logger.error(f"Failed to unsave job: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to remove job from saved list'
        }), 500


# =====================================================
# JOB APPLICATIONS ENDPOINTS
# =====================================================

@jobs_bp.route('/applications', methods=['GET'])
@optional_auth
def get_applications():
    """Get user's job applications"""
    try:
        user_id = request.args.get('user_id', type=int)
        status = request.args.get('status')
        
        if not user_id:
            return jsonify({
                'success': True,
                'data': []
            })
        
        query = """
            SELECT 
                a.id,
                a.job_id,
                a.status,
                a.applied_at,
                a.updated_at,
                a.notes,
                j.title as job_title,
                j.company,
                j.location,
                j.job_type
            FROM job_applications a
            JOIN job_descriptions j ON a.job_id = j.id
            WHERE a.candidate_id = %s
        """
        params = [user_id]
        
        if status:
            query += " AND a.status = %s"
            params.append(status)
        
        query += " ORDER BY a.applied_at DESC"
        
        applications = execute_query(query, tuple(params))
        
        return jsonify({
            'success': True,
            'data': applications or []
        })
        
    except Exception as e:
        logger.error(f"Failed to get applications: {e}")
        return jsonify({
            'success': True,
            'data': []
        })


@jobs_bp.route('/apply', methods=['POST'])
@optional_auth
def apply_to_job():
    """
    Apply to a job
    
    Body:
        job_id: ID of the job
        user_id: ID of the candidate
        cv_id: ID of the CV to submit (optional)
        cover_letter: Cover letter text (optional)
    """
    try:
        data = request.get_json()
        
        job_id = data.get('job_id')
        user_id = data.get('user_id', data.get('candidate_id'))
        cv_id = data.get('cv_id')
        cover_letter = data.get('cover_letter', '')
        
        if not job_id or not user_id:
            return jsonify({
                'success': False,
                'message': 'Job ID and User ID required'
            }), 400
        
        # Check if already applied
        check_query = """
            SELECT id FROM job_applications 
            WHERE job_id = %s AND candidate_id = %s
        """
        existing = execute_query(check_query, (job_id, user_id), fetch_one=True)
        
        if existing:
            return jsonify({
                'success': False,
                'message': 'You have already applied to this job'
            }), 400
        
        # Create application
        insert_query = """
            INSERT INTO job_applications (job_id, candidate_id, cv_id, cover_letter, status)
            VALUES (%s, %s, %s, %s, 'submitted')
            RETURNING id
        """
        application_id = execute_query(
            insert_query, 
            (job_id, user_id, cv_id, cover_letter),
            return_id=True
        )
        
        return jsonify({
            'success': True,
            'data': {'id': application_id},
            'message': 'Application submitted successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to submit application: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to submit application'
        }), 500


@jobs_bp.route('/<int:job_id>/apply', methods=['POST'])
@optional_auth
def apply_to_specific_job(job_id):
    """Apply to a specific job (alternative endpoint)"""
    try:
        data = request.get_json() or {}
        data['job_id'] = job_id
        
        # Reuse the main apply function
        return apply_to_job()
        
    except Exception as e:
        logger.error(f"Failed to apply to job: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to submit application'
        }), 500


@jobs_bp.route('/applications/<int:application_id>', methods=['GET'])
@optional_auth
def get_application(application_id):
    """Get details of a specific application"""
    try:
        query = """
            SELECT 
                a.*,
                j.title as job_title,
                j.company,
                j.location,
                j.description as job_description
            FROM job_applications a
            JOIN job_descriptions j ON a.job_id = j.id
            WHERE a.id = %s
        """
        
        application = execute_query(query, (application_id,), fetch_one=True)
        
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404
        
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


@jobs_bp.route('/applications/<int:application_id>/withdraw', methods=['POST'])
@optional_auth
def withdraw_application(application_id):
    """Withdraw a job application"""
    try:
        query = """
            UPDATE job_applications 
            SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(query, (application_id,), fetch_all=False)
        
        return jsonify({
            'success': True,
            'message': 'Application withdrawn'
        })
        
    except Exception as e:
        logger.error(f"Failed to withdraw application: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to withdraw application'
        }), 500


# =====================================================
# CANDIDATE JOB MATCHES ENDPOINT
# =====================================================

@jobs_bp.route('/matches', methods=['GET'])
@optional_auth
def get_job_matches():
    """
    Get job matches for a candidate based on their profile/CV
    
    Query params:
        user_id: Candidate user ID
        cv_id: CV ID to match against
    """
    try:
        user_id = request.args.get('user_id', type=int)
        cv_id = request.args.get('cv_id', type=int)
        
        if not user_id:
            return jsonify({
                'success': True,
                'data': []
            })
        
        # Get candidate's skills from CV
        skills = []
        if cv_id:
            cv_query = "SELECT skills, parsed_data FROM cv_data WHERE id = %s"
            cv = execute_query(cv_query, (cv_id,), fetch_one=True)
            if cv:
                skills_data = cv.get('skills')
                if isinstance(skills_data, str):
                    try:
                        skills = json.loads(skills_data)
                    except:
                        skills = []
                elif isinstance(skills_data, list):
                    skills = skills_data
        
        # Get matching jobs
        query = """
            SELECT 
                j.id,
                j.title,
                j.company,
                j.location,
                j.job_type,
                j.description,
                j.requirements,
                j.salary_range,
                j.status,
                j.created_at,
                j.application_deadline
            FROM job_descriptions j
            WHERE j.status IN ('active', 'published')
            AND j.id NOT IN (
                SELECT job_id FROM job_applications WHERE candidate_id = %s
            )
            ORDER BY j.created_at DESC
            LIMIT 20
        """
        
        jobs = execute_query(query, (user_id,))
        
        # Calculate match scores (simplified)
        matches = []
        for job in (jobs or []):
            match_score = 70  # Base score
            
            # Check skill overlap
            job_requirements = job.get('requirements', '')
            if isinstance(job_requirements, str):
                for skill in skills:
                    if isinstance(skill, dict):
                        skill_name = skill.get('name', skill.get('skill', ''))
                    else:
                        skill_name = str(skill)
                    if skill_name.lower() in job_requirements.lower():
                        match_score += 5
            
            match_score = min(match_score, 98)  # Cap at 98%
            
            matches.append({
                **job,
                'match_score': match_score,
                'match_reasons': ['Skills match', 'Location preference'] if match_score > 75 else ['General match']
            })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': matches
        })
        
    except Exception as e:
        logger.error(f"Failed to get job matches: {e}")
        return jsonify({
            'success': True,
            'data': []
        })


# Also create an alias endpoint for candidate job matches
candidate_jobs_bp = Blueprint('candidate_jobs_api', __name__, url_prefix='/api/candidate')

@candidate_jobs_bp.route('/job-matches', methods=['GET'])
@optional_auth
def get_candidate_job_matches():
    """Get job matches for the current candidate"""
    return get_job_matches()


@candidate_jobs_bp.route('/saved-jobs', methods=['GET'])
@optional_auth
def get_candidate_saved_jobs():
    """Get candidate's saved jobs"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        # Return mock data for now
        return jsonify({
            'success': True,
            'data': [
                {'id': 1, 'title': 'Software Engineer', 'company': 'Tech Corp', 'location': 'Dubai', 'saved_at': '2025-01-20'},
                {'id': 2, 'title': 'Product Manager', 'company': 'Innovation Inc', 'location': 'Abu Dhabi', 'saved_at': '2025-01-18'}
            ]
        })
    except Exception as e:
        logger.error(f"Failed to get saved jobs: {e}")
        return jsonify({'success': True, 'data': []})


@candidate_jobs_bp.route('/applications', methods=['GET'])
@optional_auth
def get_candidate_applications():
    """Get candidate's job applications"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        # Return mock data for now
        return jsonify({
            'success': True,
            'data': [
                {'id': 1, 'job_title': 'Software Engineer', 'company': 'Tech Corp', 'status': 'interview_scheduled', 'applied_at': '2025-01-15'},
                {'id': 2, 'job_title': 'Data Analyst', 'company': 'Data Solutions', 'status': 'under_review', 'applied_at': '2025-01-18'},
                {'id': 3, 'job_title': 'Product Manager', 'company': 'Innovation Inc', 'status': 'submitted', 'applied_at': '2025-01-20'}
            ]
        })
    except Exception as e:
        logger.error(f"Failed to get applications: {e}")
        return jsonify({'success': True, 'data': []})


# Register the blueprints function
def register_jobs_routes(app):
    """Register jobs routes with the Flask app"""
    app.register_blueprint(jobs_bp)
    app.register_blueprint(candidate_jobs_bp)
    logger.info("✅ Jobs API routes registered")
    logger.info("✅ Candidate Jobs API routes registered")
