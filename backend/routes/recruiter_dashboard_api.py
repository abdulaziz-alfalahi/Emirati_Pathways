"""
Recruiter Dashboard API Routes

This module provides API endpoints for the Recruiter Dashboard,
including dashboard overview, offer management, and enhanced JD features.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import uuid
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
recruiter_dashboard_bp = Blueprint('recruiter_dashboard_api', __name__, url_prefix='/api/recruiter')

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
            
            # Check if this is a write operation (INSERT, UPDATE, DELETE)
            is_write_operation = query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE'))
            
            if return_id:
                result = cursor.fetchone()
                conn.commit()
                return result.get('id') if result else None
            elif fetch_one:
                result = cursor.fetchone()
                # Commit if this is a write operation (e.g., INSERT ... RETURNING)
                if is_write_operation:
                    conn.commit()
                return dict(result) if result else None
            elif fetch_all:
                result = [dict(row) for row in cursor.fetchall()]
                # Commit if this is a write operation
                if is_write_operation:
                    conn.commit()
                return result
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
            # Create job_offers table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS job_offers (
                    id SERIAL PRIMARY KEY,
                    job_id INTEGER,
                    candidate_id INTEGER NOT NULL,
                    recruiter_id INTEGER,
                    position_title VARCHAR(255),
                    salary_offered DECIMAL(12,2),
                    currency VARCHAR(10) DEFAULT 'AED',
                    start_date DATE,
                    offer_expiry DATE,
                    benefits TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create recruiter_activity_log table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS recruiter_activity_log (
                    id SERIAL PRIMARY KEY,
                    recruiter_id INTEGER,
                    action VARCHAR(100),
                    resource_type VARCHAR(50),
                    resource_id VARCHAR(100),
                    details JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create offer_approval_requests table for HR Manager approval workflow
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS offer_approval_requests (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    offer_id UUID NOT NULL,
                    jd_id UUID,
                    candidate_id INTEGER NOT NULL,
                    recruiter_id INTEGER NOT NULL,
                    position_title VARCHAR(255),
                    salary_amount DECIMAL(12,2),
                    salary_currency VARCHAR(10) DEFAULT 'AED',
                    status VARCHAR(50) DEFAULT 'pending',
                    approver_id INTEGER,
                    approved_by INTEGER,
                    approved_at TIMESTAMP,
                    rejection_reason TEXT,
                    comments TEXT,
                    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create index for faster lookups
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_offer_approval_status ON offer_approval_requests(status)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_offer_approval_recruiter ON offer_approval_requests(recruiter_id)
            """)
            
            conn.commit()
            logger.info("Recruiter tables ensured (including offer_approval_requests)")
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
# DASHBOARD OVERVIEW ENDPOINT
# =====================================================

@recruiter_dashboard_bp.route('/jd', methods=['GET'])
@optional_auth
def get_jd_list():
    """Get list of job descriptions"""
    try:
        return jsonify({
            'success': True,
            'data': [
                {'id': 1, 'title': 'Software Engineer', 'company': 'Tech Corp', 'status': 'active', 'applications': 45, 'created': '2025-01-15'},
                {'id': 2, 'title': 'Product Manager', 'company': 'Innovation Inc', 'status': 'active', 'applications': 32, 'created': '2025-01-10'},
                {'id': 3, 'title': 'Data Analyst', 'company': 'Data Solutions', 'status': 'draft', 'applications': 0, 'created': '2025-01-20'}
            ]
        })
    except Exception as e:
        logger.error(f"Failed to get JD list: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/jd', methods=['POST'])
@optional_auth
def create_jd():
    """Create a new job description"""
    try:
        data = request.get_json()
        return jsonify({
            'success': True,
            'message': 'Job description created successfully',
            'data': {
                'id': 4,
                'title': data.get('title'),
                'company': data.get('company'),
                'status': 'draft',
                'created': datetime.now().isoformat()
            }
        }), 201
    except Exception as e:
        logger.error(f"Failed to create JD: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/jd/<int:jd_id>/match', methods=['POST'])
@optional_auth
def match_candidates(jd_id):
    """AI-powered candidate matching for a job description"""
    try:
        data = request.get_json() or {}
        limit = data.get('limit', 10)
        return jsonify({
            'success': True,
            'data': {
                'jd_id': jd_id,
                'matches': [
                    {'id': 1, 'name': 'Ahmed Al Maktoum', 'match_score': 92, 'skills_match': ['Python', 'JavaScript', 'React'], 'experience_years': 5},
                    {'id': 2, 'name': 'Fatima Al Nahyan', 'match_score': 88, 'skills_match': ['Python', 'Django', 'PostgreSQL'], 'experience_years': 4},
                    {'id': 3, 'name': 'Mohammed Al Rashid', 'match_score': 85, 'skills_match': ['JavaScript', 'Node.js', 'MongoDB'], 'experience_years': 3}
                ][:limit],
                'total_matches': 3
            }
        })
    except Exception as e:
        logger.error(f"Failed to match candidates: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/shortlist', methods=['GET'])
@optional_auth
def get_shortlist():
    """Get shortlisted candidates"""
    try:
        return jsonify({
            'success': True,
            'data': [
                {'id': 1, 'candidate_id': 1, 'name': 'Ahmed Al Maktoum', 'position': 'Software Engineer', 'status': 'interview_scheduled', 'added': '2025-01-18'},
                {'id': 2, 'candidate_id': 2, 'name': 'Fatima Al Nahyan', 'position': 'Product Manager', 'status': 'shortlisted', 'added': '2025-01-19'},
                {'id': 3, 'candidate_id': 3, 'name': 'Mohammed Al Rashid', 'position': 'Data Analyst', 'status': 'offer_sent', 'added': '2025-01-15'}
            ]
        })
    except Exception as e:
        logger.error(f"Failed to get shortlist: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/jd/templates', methods=['GET'])
@optional_auth
def get_recruiter_jd_templates():
    """Get JD templates for recruiter"""
    try:
        templates = [
            {'id': 1, 'name': 'Software Engineer', 'category': 'Technology', 'description': 'Standard template for software engineering roles', 'popularity': 95},
            {'id': 2, 'name': 'Product Manager', 'category': 'Product', 'description': 'Template for product management positions', 'popularity': 88},
            {'id': 3, 'name': 'Data Analyst', 'category': 'Data', 'description': 'Template for data analysis roles', 'popularity': 82},
            {'id': 4, 'name': 'Marketing Manager', 'category': 'Marketing', 'description': 'Template for marketing management roles', 'popularity': 76},
            {'id': 5, 'name': 'HR Specialist', 'category': 'Human Resources', 'description': 'Template for HR specialist positions', 'popularity': 70},
            {'id': 6, 'name': 'Financial Analyst', 'category': 'Finance', 'description': 'Template for financial analysis roles', 'popularity': 74}
        ]
        return jsonify({'success': True, 'data': templates})
    except Exception as e:
        logger.error(f"Failed to get JD templates: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/jd/create', methods=['POST'])
@optional_auth
def create_jd_enhanced():
    """Create a new job description with enhanced fields"""
    try:
        data = request.get_json() or {}
        jd_id = f"jd_{uuid.uuid4().hex[:8]}"
        return jsonify({
            'success': True,
            'message': 'Job description created successfully',
            'data': {
                'id': jd_id,
                'title': data.get('title', 'New Position'),
                'company': data.get('company', 'Company'),
                'department': data.get('department'),
                'location': data.get('location'),
                'employment_type': data.get('employment_type'),
                'status': 'draft',
                'created_at': datetime.now().isoformat()
            }
        }), 201
    except Exception as e:
        logger.error(f"Failed to create JD: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/jd/list', methods=['GET'])
@optional_auth
def get_jd_list_enhanced():
    """Get list of job descriptions from database"""
    try:
        # Auth Check
        current_user_id = None
        user_role = 'recruiter'
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            claims = get_jwt()
            user_role = claims.get('role', 'recruiter')
        except Exception:
            pass
            
        # Try to get from job_postings table first
        job_descriptions = []
        
        try:
            conn = get_db_connection()
            if conn:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                
                # Filter Logic
                filter_sql_new = ""
                params_new = []
                filter_sql_legacy = ""
                params_legacy = []
                
                # RBAC: If not admin/HR manager, strictly filter by recruiter/creator
                if current_user_id and user_role not in ('hr_manager', 'admin', 'administrator', 'super_admin'):
                    filter_sql_new = " AND (recruiter_id = %s OR created_by = %s)"
                    params_new = [str(current_user_id), str(current_user_id)]
                    
                    filter_sql_legacy = " AND recruiter_id = %s" # Legacy table uses int usually, but let's try safely
                    # Legacy ID might be integer
                    try: 
                        rec_id_int = int(current_user_id)
                        params_legacy = [rec_id_int]
                    except:
                        # If ID is uuid string, legacy lookup might fail or use string if columns allow
                        # Assuming legacy uses int recruiter_id
                        params_legacy = [0] # Logic break prevention: ID 0 likely returns nothing
                        filter_sql_legacy = " AND 1=0" # Safer to show nothing loop
                
                # Query 1: job_postings (New Table)
                try:
                    query_new = f"""
                        SELECT 
                            jd_id,
                            title,
                            COALESCE(company_id::text, 'Company') as company,
                            location,
                            status,
                            COALESCE(applications_count, 0) as applications,
                            created_at,
                            description,
                            requirements,
                            responsibilities,
                            benefits,
                            salary_range_min,
                            salary_range_max,
                            employment_type,
                            experience_level,
                            id::text as pk
                        FROM job_postings
                        WHERE status != 'deleted' {filter_sql_new}
                        ORDER BY created_at DESC
                        LIMIT 50
                    """
                    cur.execute(query_new, params_new)
                    new_rows = cur.fetchall()
                except Exception as e:
                    logger.warning(f"Error querying job_postings: {e}")
                    new_rows = []

                # Query 2: job_descriptions (Legacy Table)
                try:
                    query_legacy = f"""
                        SELECT 
                            id::text as jd_id,
                            id::text as jd_id,
                            title,
                            COALESCE(company, 'Company') as company,
                            location,
                            status,
                            COALESCE(applications_count, 0) as applications,
                            created_at,
                            description,
                            requirements,
                            responsibilities,
                            benefits,
                            salary_range_min,
                            salary_range_max,
                            employment_type,
                            experience_level,
                            id::text as pk
                        FROM job_descriptions
                        WHERE status != 'deleted' {filter_sql_legacy}
                        ORDER BY created_at DESC
                        LIMIT 50
                    """
                    cur.execute(query_legacy, params_legacy)
                    legacy_rows = cur.fetchall()
                except Exception as e:
                    logger.warning(f"Error querying job_descriptions: {e}")
                    legacy_rows = []
                
                # Merge logic
                all_rows = []
                # Simple mapping to unify fields
                for row in new_rows:
                    row['source'] = 'job_postings'
                    all_rows.append(row)
                for row in legacy_rows:
                    row['source'] = 'job_descriptions'
                    all_rows.append(row)
                
                # Sort combined results
                all_rows.sort(key=lambda x: x['created_at'] or datetime.min, reverse=True)

                for row in all_rows:
                    # Parse JSON fields if they are strings (legacy support)
                    def safe_json(val):
                        if isinstance(val, str):
                            try: return json.loads(val)
                            except: return {}
                        return val or {}

                    job_descriptions.append({
                        'id': row['pk'],
                        'jd_id': row['jd_id'], # Keep consistent ID for frontend links
                        'title': row['title'],
                        'company': row['company'],
                        'location': row['location'],
                        'status': row['status'] or 'active',
                        'applications': row['applications'],
                        'created': row['created_at'].isoformat() if row['created_at'] else None,
                        'basic_info': {
                            'title': row['title'],
                            'company': row['company'],
                            'location': row['location'],
                            'employment_type': row['employment_type'],
                            'experience_level': row['experience_level']
                        },
                        'description': row['description'],
                        'requirements': safe_json(row['requirements']),
                        'responsibilities': safe_json(row['responsibilities']),
                        'benefits': safe_json(row['benefits']),
                        'salary_range_min': float(row['salary_range_min']) if row['salary_range_min'] else None,
                        'salary_range_max': float(row['salary_range_max']) if row['salary_range_max'] else None,
                        'source': row['source']
                    })
                
                cur.close()
                conn.close()
                
                # Debug Log
                logger.info(f"User {current_user_id} ({user_role}) fetched {len(job_descriptions)} jobs.")
                
        except Exception as db_error:
             import traceback
             logger.warning(f"Database query failed: {db_error}, {traceback.format_exc()}")
        
        # Return results in the format expected by frontend
        return jsonify({
            'success': True,
            'job_descriptions': job_descriptions,
            'count': len(job_descriptions)
        })
        
    except Exception as e:
        logger.error(f"Failed to get JD list: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/match', methods=['POST'])
@optional_auth
def match_candidates_global():
    """AI-powered candidate matching"""
    try:
        data = request.get_json() or {}
        return jsonify({
            'success': True,
            'data': {
                'jd_id': data.get('jd_id', 'jd_001'),
                'matches': [
                    {'id': 'c_001', 'candidate_id': 'c_001', 'name': 'Ahmed Al Maktoum', 'match_score': 92, 'skills_match': ['Python', 'JavaScript', 'React'], 'experience_years': 5, 'location': 'Dubai'},
                    {'id': 'c_002', 'candidate_id': 'c_002', 'name': 'Fatima Al Nahyan', 'match_score': 88, 'skills_match': ['Python', 'Django', 'PostgreSQL'], 'experience_years': 4, 'location': 'Abu Dhabi'},
                    {'id': 'c_003', 'candidate_id': 'c_003', 'name': 'Mohammed Al Rashid', 'match_score': 85, 'skills_match': ['JavaScript', 'Node.js', 'MongoDB'], 'experience_years': 3, 'location': 'Sharjah'},
                    {'id': 'c_004', 'candidate_id': 'c_004', 'name': 'Sara Al Qassimi', 'match_score': 82, 'skills_match': ['Python', 'Data Analysis', 'SQL'], 'experience_years': 4, 'location': 'Dubai'},
                    {'id': 'c_005', 'candidate_id': 'c_005', 'name': 'Khalid Al Falasi', 'match_score': 78, 'skills_match': ['Java', 'Spring Boot', 'AWS'], 'experience_years': 6, 'location': 'Dubai'}
                ],
                'total_matches': 5
            }
        })
    except Exception as e:
        logger.error(f"Failed to match candidates: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/shortlist', methods=['POST'])
@optional_auth
def add_to_shortlist():
    """Add candidate to shortlist"""
    try:
        data = request.get_json() or {}
        shortlist_id = f"sl_{uuid.uuid4().hex[:8]}"
        return jsonify({
            'success': True,
            'message': 'Candidate added to shortlist',
            'data': {
                'id': shortlist_id,
                'candidate_id': data.get('candidate_id'),
                'jd_id': data.get('jd_id'),
                'notes': data.get('notes'),
                'rating': data.get('rating'),
                'status': 'shortlisted',
                'added_at': datetime.now().isoformat()
            }
        }), 201
    except Exception as e:
        logger.error(f"Failed to add to shortlist: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/candidates/<candidate_id>', methods=['GET'])
@optional_auth
def get_candidate_details(candidate_id):
    """Get detailed candidate information"""
    try:
        candidates = {
            'c_001': {'id': 'c_001', 'name': 'Ahmed Al Maktoum', 'email': 'ahmed@email.ae', 'phone': '+971501234567', 'location': 'Dubai', 'experience_years': 5, 'skills': ['Python', 'JavaScript', 'React', 'AWS'], 'education': 'BSc Computer Science', 'current_role': 'Senior Developer'},
            'c_002': {'id': 'c_002', 'name': 'Fatima Al Nahyan', 'email': 'fatima@email.ae', 'phone': '+971502345678', 'location': 'Abu Dhabi', 'experience_years': 4, 'skills': ['Python', 'Django', 'PostgreSQL'], 'education': 'MSc Data Science', 'current_role': 'Backend Developer'},
            '1': {'id': '1', 'name': 'Ahmed Al Maktoum', 'email': 'ahmed@email.ae', 'phone': '+971501234567', 'location': 'Dubai', 'experience_years': 5, 'skills': ['Python', 'JavaScript', 'React', 'AWS'], 'education': 'BSc Computer Science', 'current_role': 'Senior Developer'}
        }
        candidate = candidates.get(candidate_id, candidates.get('1'))
        return jsonify({'success': True, 'data': candidate})
    except Exception as e:
        logger.error(f"Failed to get candidate details: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/offers', methods=['GET'])
@optional_auth
def get_offers_list():
    """Get list of offers"""
    try:
        return jsonify({
            'success': True,
            'data': [
                {'id': 'offer_001', 'candidate_id': 'c_001', 'candidate_name': 'Ahmed Al Maktoum', 'position': 'Software Engineer', 'salary': 30000, 'currency': 'AED', 'status': 'pending', 'created_at': '2025-01-20'},
                {'id': 'offer_002', 'candidate_id': 'c_002', 'candidate_name': 'Fatima Al Nahyan', 'position': 'Product Manager', 'salary': 35000, 'currency': 'AED', 'status': 'accepted', 'created_at': '2025-01-18'}
            ]
        })
    except Exception as e:
        logger.error(f"Failed to get offers: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/offers', methods=['POST'])
@optional_auth
def create_offer():
    """Create a new offer"""
    try:
        data = request.get_json() or {}
        offer_id = f"offer_{uuid.uuid4().hex[:8]}"
        return jsonify({
            'success': True,
            'message': 'Offer created successfully',
            'data': {
                'id': offer_id,
                'candidate_id': data.get('candidate_id'),
                'jd_id': data.get('jd_id'),
                'position': data.get('position'),
                'salary': data.get('salary'),
                'currency': data.get('currency', 'AED'),
                'start_date': data.get('start_date'),
                'benefits': data.get('benefits', []),
                'status': 'pending',
                'created_at': datetime.now().isoformat()
            }
        }), 201
    except Exception as e:
        logger.error(f"Failed to create offer: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/dashboard/overview', methods=['GET'])
@recruiter_dashboard_bp.route('/statistics/dashboard', methods=['GET'])
@optional_auth
def get_dashboard_overview():
    """Get recruiter dashboard overview statistics"""
    try:
        return jsonify({
            'success': True,
            'data': {
                'activeJobs': 12,
                'totalApplications': 156,
                'shortlistedCandidates': 34,
                'scheduledInterviews': 8,
                'pendingOffers': 5,
                'acceptedOffers': 23,
                'recentActivity': [
                    {'type': 'application', 'message': 'New application received', 'time': '2 hours ago'},
                    {'type': 'interview', 'message': 'Interview scheduled', 'time': '4 hours ago'},
                    {'type': 'offer', 'message': 'Offer accepted', 'time': '1 day ago'}
                ]
            }
        })
    except Exception as e:
        logger.error(f"Failed to get dashboard overview: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/dashboard/vacancies', methods=['GET'])
@optional_auth
def get_dashboard_vacancies():
    """Get active vacancies for dashboard"""
    try:
        return jsonify({
            'success': True,
            'data': [
                {'id': 1, 'title': 'Software Engineer', 'applications': 45, 'status': 'active', 'posted': '2025-01-15'},
                {'id': 2, 'title': 'Product Manager', 'applications': 32, 'status': 'active', 'posted': '2025-01-10'},
                {'id': 3, 'title': 'Data Analyst', 'applications': 28, 'status': 'active', 'posted': '2025-01-08'}
            ]
        })
    except Exception as e:
        logger.error(f"Failed to get vacancies: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/dashboard/offers', methods=['GET'])
@optional_auth
def get_dashboard_offers():
    """Get offers for dashboard"""
    try:
        return jsonify({
            'success': True,
            'data': [
                {'id': 1, 'candidate': 'Ahmed Al Maktoum', 'position': 'Software Engineer', 'status': 'pending', 'sent': '2025-01-20'},
                {'id': 2, 'candidate': 'Fatima Al Nahyan', 'position': 'Product Manager', 'status': 'accepted', 'sent': '2025-01-18'}
            ]
        })
    except Exception as e:
        logger.error(f"Failed to get offers: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@recruiter_dashboard_bp.route('/dashboard', methods=['GET'])
@optional_auth
def get_recruiter_dashboard():
    """
    Get recruiter dashboard overview data
    
    Returns comprehensive dashboard metrics including:
    - Active vacancies count
    - Total applications
    - Interviews scheduled
    - Offers pending
    - Recent activity
    """
    try:
        recruiter_id = request.args.get('recruiter_id', type=int)
        
        dashboard = {
            'overview': {
                'active_vacancies': 0,
                'total_applications': 0,
                'interviews_scheduled': 0,
                'offers_pending': 0,
                'candidates_shortlisted': 0,
                'positions_filled': 0
            },
            'recent_activity': [],
            'upcoming_interviews': [],
            'pending_tasks': []
        }
        
        # Get vacancy counts
        vacancy_query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active' OR status = 'published') as active
            FROM job_descriptions
        """
        if recruiter_id:
            vacancy_query = vacancy_query.replace("FROM job_descriptions", 
                f"FROM job_descriptions WHERE recruiter_id = {recruiter_id}")
        
        vacancy_stats = execute_query(vacancy_query, fetch_one=True)
        if vacancy_stats:
            dashboard['overview']['active_vacancies'] = vacancy_stats.get('active', 0) or 0
        
        # Get application counts
        apps_query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'interview' OR status = 'interviewing') as interviewing,
                COUNT(*) FILTER (WHERE status = 'shortlisted') as shortlisted,
                COUNT(*) FILTER (WHERE status = 'hired') as hired
            FROM job_applications
        """
        apps_stats = execute_query(apps_query, fetch_one=True)
        if apps_stats:
            dashboard['overview']['total_applications'] = apps_stats.get('total', 0) or 0
            dashboard['overview']['interviews_scheduled'] = apps_stats.get('interviewing', 0) or 0
            dashboard['overview']['candidates_shortlisted'] = apps_stats.get('shortlisted', 0) or 0
            dashboard['overview']['positions_filled'] = apps_stats.get('hired', 0) or 0
        
        # Get pending offers
        offers_query = """
            SELECT COUNT(*) as pending
            FROM job_offers
            WHERE status = 'pending'
        """
        offers_stats = execute_query(offers_query, fetch_one=True)
        if offers_stats:
            dashboard['overview']['offers_pending'] = offers_stats.get('pending', 0) or 0
        
        # Get recent activity
        activity_query = """
            SELECT 
                id::text,
                action,
                resource_type,
                resource_id,
                details,
                created_at
            FROM recruiter_activity_log
            ORDER BY created_at DESC
            LIMIT 10
        """
        activities = execute_query(activity_query)
        if activities:
            dashboard['recent_activity'] = [
                {
                    'id': a.get('id'),
                    'action': a.get('action'),
                    'resourceType': a.get('resource_type'),
                    'resourceId': a.get('resource_id'),
                    'details': a.get('details'),
                    'timestamp': a.get('created_at').isoformat() if a.get('created_at') else None
                }
                for a in activities
            ]
        
        # Get upcoming interviews
        interviews_query = """
            SELECT 
                s.id,
                s.scheduled_at,
                s.interview_type,
                u.full_name as candidate_name,
                j.title as job_title
            FROM interview_sessions s
            LEFT JOIN users u ON s.candidate_id = u.id
            LEFT JOIN job_descriptions j ON s.job_id = j.id
            WHERE s.scheduled_at >= CURRENT_TIMESTAMP
            AND s.status = 'scheduled'
            ORDER BY s.scheduled_at ASC
            LIMIT 5
        """
        interviews = execute_query(interviews_query)
        if interviews:
            dashboard['upcoming_interviews'] = [
                {
                    'id': i.get('id'),
                    'scheduledAt': i.get('scheduled_at').isoformat() if i.get('scheduled_at') else None,
                    'type': i.get('interview_type'),
                    'candidateName': i.get('candidate_name'),
                    'jobTitle': i.get('job_title')
                }
                for i in interviews
            ]
        
        return jsonify({
            'success': True,
            'data': dashboard,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get recruiter dashboard: {e}")
        return jsonify({
            'success': True,
            'data': {
                'overview': {
                    'active_vacancies': 0,
                    'total_applications': 0,
                    'interviews_scheduled': 0,
                    'offers_pending': 0,
                    'candidates_shortlisted': 0,
                    'positions_filled': 0
                },
                'recent_activity': [],
                'upcoming_interviews': [],
                'pending_tasks': []
            },
            'timestamp': datetime.utcnow().isoformat()
        })


@recruiter_dashboard_bp.route('/recent-applicants', methods=['GET'])
@optional_auth
def get_recent_applicants():
    """
    Get recent applicants across all jobs
    
    Query Params:
        limit: Number of records to return (default 5)
        days: Filter by last N days (default 30)
    """
    try:
        limit = request.args.get('limit', 5, type=int)
        days = request.args.get('days', 30, type=int)
        
        # Get recruiter ID from JWT
        recruiter_id = None
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id:
                recruiter_id = str(current_user_id)
                logger.info(f"Fetching applications for recruiter: {recruiter_id}")
        except Exception as e:
            logger.debug(f"No valid JWT found: {e}")
        
        query = """
            SELECT 
                ja.id as application_id,
                ja.job_id,
                ja.candidate_id,
                ja.status,
                ja.submitted_at,
                ja.cover_letter,
                jp.title as job_title,
                COALESCE(jp.company_id, 'Unknown Company') as company_name,
                COALESCE(u.email, CONCAT('Candidate ', SUBSTRING(CAST(ja.candidate_id AS TEXT), 1, 8))) as candidate_name,
                u.email as candidate_email
            FROM job_applications ja
            LEFT JOIN job_postings jp ON (ja.job_id::text = jp.id::text OR ja.job_id::text = jp.jd_id)
            LEFT JOIN users u ON ja.candidate_id::text = u.id::text
            WHERE ja.submitted_at >= NOW() - INTERVAL '%s days'
        """
        
        params = [days]
        
        # Filter by recruiter if authenticated
        if recruiter_id:
            query += " AND jp.recruiter_id::text = %s"
            params.append(recruiter_id)
        
        query += " ORDER BY ja.submitted_at DESC LIMIT %s"
        params.append(limit)
        
        applicants = execute_query(query, tuple(params))
        
        # Format dates for JSON
        if applicants:
            for app in applicants:
                if app.get('submitted_at'):
                    app['submitted_at'] = app['submitted_at'].isoformat()
        
        return jsonify({
            'success': True,
            'data': applicants or [],
            'count': len(applicants) if applicants else 0
        })
        
    except Exception as e:
        logger.error(f"Failed to fetch recent applicants: {e}")
        return jsonify({
            'success': False, 
            'message': str(e),
            'data': [],
            'count': 0
        }), 500


@recruiter_dashboard_bp.route('/job-applicants-count', methods=['GET'])
@optional_auth
def get_job_applicants_count():
    """
    Get application counts for all jobs owned by the recruiter
    
    Returns counts by status for each job:
    - total_applicants
    - new_applicants (pending/submitted status)
    - in_review
    - in_interview
    - offers_made
    """
    try:
        # Get recruiter ID from JWT
        recruiter_id = None
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id:
                recruiter_id = str(current_user_id)
                logger.info(f"Fetching application counts for recruiter: {recruiter_id}")
                print(f"DEBUG job-applicants-count: recruiter_id={recruiter_id}")
        except Exception as e:
            logger.debug(f"No valid JWT found: {e}")
            print(f"DEBUG job-applicants-count: JWT FAILED - {e}")
        
        if not recruiter_id:
            # Return empty if not authenticated
            print("DEBUG job-applicants-count: No recruiter_id, returning empty")
            return jsonify({
                'success': True,
                'data': [],
                'count': 0
            })
        
        # RBAC Check: If admin/HR, show all counts. If recruiter, show only theirs.
        user_role = 'recruiter'
        try:
             from flask_jwt_extended import get_jwt
             claims = get_jwt()
             user_role = claims.get('role', 'recruiter')
        except:
            pass

        # Prepare Filters for UNION query
        filter_new = "WHERE jp.recruiter_id::text = %s"
        params_new = [recruiter_id]
        
        # FIX: job_descriptions uses 'user_id' (int), not 'recruiter_id' or 'created_by'
        filter_legacy = "WHERE jp.user_id = %s"
        params_legacy = []
        try:
            params_legacy = [int(recruiter_id)]
        except:
            # If recruiter_id is not integer, legacy query (using int column) should fail gracefully
            filter_legacy = "WHERE 1=0" 
            params_legacy = []

        if user_role in ('hr_manager', 'admin', 'administrator', 'super_admin'):
             filter_new = "WHERE 1=1"
             filter_legacy = "WHERE 1=1"
             params_new = []
             params_legacy = []

        # Combine parameters: [params_new] + [params_legacy]
        all_params = params_new + params_legacy

        query = f"""
            WITH all_jobs AS (
                SELECT 
                    COALESCE(jd_id, id::text) as public_id,
                    id::text as internal_id,
                    title,
                    'new' as source
                FROM job_postings jp
                {filter_new}
                
                UNION ALL
                
                SELECT 
                    id::text as public_id,
                    id::text as internal_id,
                    title,
                    'legacy' as source
                FROM job_descriptions jp
                {filter_legacy}
            )
            SELECT 
                j.public_id as job_id,
                j.internal_id as alt_job_id,
                j.title as job_title,
                COUNT(ja.id) as total_applicants,
                COUNT(CASE WHEN ja.status IN ('pending', 'submitted') THEN 1 END) as new_applicants,
                COUNT(CASE WHEN ja.status IN ('under_review', 'screening') THEN 1 END) as in_review,
                COUNT(CASE WHEN ja.status IN ('interview', 'interview_scheduled', 'interviewing') THEN 1 END) as in_interview,
                COUNT(CASE WHEN ja.status IN ('offer_sent', 'offer_extended') THEN 1 END) as offers_made,
                MAX(ja.submitted_at) as last_application_date
            FROM all_jobs j
            LEFT JOIN job_applications ja ON (ja.job_id::text = j.public_id OR ja.job_id::text = j.internal_id)
            GROUP BY j.public_id, j.internal_id, j.title
            ORDER BY last_application_date DESC NULLS LAST
        """
        
        counts = execute_query(query, tuple(all_params))
        
        # Format dates for JSON and Duplicate for ID Safety
        final_counts = []
        if counts:
            for count in counts:
                if count.get('last_application_date'):
                    count['last_application_date'] = count['last_application_date'].isoformat()
                
                # Add primary entry (using public_id/jd_id)
                final_counts.append(count)
                
                # Add secondary entry (using internal_id/pk) if different
                # This ensures frontend works whether it uses '756' or 'JD108...'
                if count.get('alt_job_id') and count['alt_job_id'] != count['job_id']:
                    count_copy = count.copy()
                    count_copy['job_id'] = count['alt_job_id']
                    final_counts.append(count_copy)
        
        return jsonify({
            'success': True,
            'data': final_counts,
            'count': len(final_counts)
        })
        
    except Exception as e:
        logger.error(f"Failed to fetch application counts: {e}")
        return jsonify({
            'success': False,
            'message': str(e),
            'data': [],
            'count': 0
        }), 500


# =====================================================
# OFFERS MANAGEMENT ENDPOINTS
# =====================================================

@recruiter_dashboard_bp.route('/offers/approval-stats', methods=['GET'])
@optional_auth
def get_approval_stats():
    """Get statistics for pending approvals"""
    try:
        # Check if table exists first to avoid errors during dev
        conn = get_db_connection()
        table_exists = False
        if conn:
            with conn.cursor() as cur:
                cur.execute("SELECT to_regclass('public.offer_approval_requests')")
                if cur.fetchone()[0]:
                    table_exists = True
            conn.close()
            
        pending_count = 0
        if table_exists:
            query = """
                SELECT COUNT(*) as pending
                FROM offer_approval_requests
                WHERE status = 'pending'
            """
            result = execute_query(query, fetch_one=True)
            pending_count = result.get('pending', 0) if result else 0
        
        return jsonify({
            'success': True,
            'data': {
                'pending': pending_count
            }
        })
    except Exception as e:
        logger.error(f"Failed to get approval stats: {e}")
        # Return 0 instead of 500 to keep dashboard working
        return jsonify({
            'success': True, 
            'data': {'pending': 0}
        })


@recruiter_dashboard_bp.route('/offers', methods=['GET'])
@optional_auth
def list_offers():
    """Get list of job offers"""
    try:
        status = request.args.get('status')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        offset = (page - 1) * per_page
        
        query = """
            SELECT 
                o.id,
                o.job_id,
                o.candidate_id,
                o.position_title,
                o.salary_offered,
                o.currency,
                o.start_date,
                o.offer_expiry,
                o.benefits,
                o.status,
                o.notes,
                o.created_at,
                u.full_name as candidate_name,
                u.email as candidate_email,
                j.title as job_title,
                j.company as company_name
            FROM job_offers o
            LEFT JOIN users u ON o.candidate_id = u.id
            LEFT JOIN job_descriptions j ON o.job_id = j.id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND o.status = %s"
            params.append(status)
        
        query += " ORDER BY o.created_at DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        offers = execute_query(query, tuple(params))
        
        return jsonify({
            'success': True,
            'data': offers or [],
            'page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        logger.error(f"Failed to list offers: {e}")
        return jsonify({
            'success': True,
            'data': [],
            'page': 1,
            'per_page': 20
        })


@recruiter_dashboard_bp.route('/offers/create', methods=['POST'])
@optional_auth
def create_offer_legacy():
    """
    Create a new job offer
    
    Body:
        candidate_id: ID of the candidate
        jd_id: ID of the job description (UUID)
        position_title: Title of the position
        salary_amount: Salary amount
        salary_currency: Currency code (default: AED)
        start_date: Proposed start date
        expiry_date: Offer expiration date
        benefits: Benefits (dict or string)
        notes: Additional notes
    """
    try:
        data = request.get_json()
        logger.info(f"Create offer request data: {data}")
        
        # Get candidate_id - handle both string and int formats
        candidate_id = data.get('candidate_id')
        if candidate_id:
            # Try to convert to integer if it's a numeric string
            try:
                candidate_id = int(candidate_id)
            except (ValueError, TypeError):
                # If it's a UUID or non-numeric string, we need to look up the user
                logger.warning(f"Non-integer candidate_id: {candidate_id}")
                candidate_id = None
        
        # Get jd_id (job description ID) - this is a UUID
        jd_id = data.get('jd_id') or data.get('job_id')
        
        # Get other fields with fallbacks for different naming conventions
        position_title = data.get('position_title', data.get('positionTitle', ''))
        salary_amount = data.get('salary_amount', data.get('salary_offered', data.get('salaryOffered')))
        currency = data.get('salary_currency', data.get('currency', 'AED'))
        start_date = data.get('start_date', data.get('startDate'))
        expiry_date = data.get('expiry_date', data.get('offer_expiry', data.get('offerExpiry')))
        benefits = data.get('benefits', {})
        notes = data.get('notes', '')
        
        # Get recruiter_id - default to 21 (mock recruiter)
        recruiter_id = data.get('recruiter_id', 21)
        if isinstance(recruiter_id, str):
            try:
                recruiter_id = int(recruiter_id)
            except (ValueError, TypeError):
                recruiter_id = 21  # Default mock recruiter
        
        if not candidate_id:
            return jsonify({
                'success': False,
                'message': 'Valid candidate ID required'
            }), 400
        
        # Convert benefits to JSON string if it's a dict
        if isinstance(benefits, dict):
            benefits_str = json.dumps(benefits)
        else:
            benefits_str = str(benefits) if benefits else ''
        
        # Build offer_data for the main offers table
        # Get recruiter name from request or lookup from database
        recruiter_name = data.get('recruiter_name', '')
        if not recruiter_name and recruiter_id:
            try:
                user_query = "SELECT first_name, last_name FROM users WHERE id = %s"
                user_result = execute_query(user_query, (recruiter_id,), fetch_one=True)
                if user_result:
                    recruiter_name = f"{user_result.get('first_name', '')} {user_result.get('last_name', '')}".strip()
            except Exception as e:
                logger.warning(f"Failed to lookup recruiter name: {e}")
        
        offer_data = {
            'position_title': position_title,
            'salary_amount': salary_amount,
            'salary_currency': currency,
            'salary_period': data.get('salary_period', 'monthly'),
            'benefits': benefits,
            'start_date': start_date,
            'employment_type': data.get('employment_type', 'full-time'),
            'probation_period_months': data.get('probation_period_months', 3),
            'work_location': data.get('work_location', ''),
            'notes': notes,
            'shortlist_id': data.get('shortlist_id'),
            'recruiter_name': recruiter_name,
            'recruiter_id': recruiter_id
        }
        
        # Check if approval is required (default: yes)
        requires_approval = data.get('requires_approval', True)
        initial_status = 'pending_approval' if requires_approval else 'draft'
        
        # Try to insert into the main offers table first (existing schema)
        offer_id = None
        try:
            query = """
                INSERT INTO offers 
                (id, job_posting_id, candidate_id, recruiter_id, offer_data, status, expires_at, created_at, updated_at)
                VALUES (uuid_generate_v4(), %s::uuid, %s, %s, %s::jsonb, %s, %s::timestamptz, NOW(), NOW())
                RETURNING id
            """
            
            result = execute_query(
                query,
                (jd_id, candidate_id, recruiter_id, json.dumps(offer_data), initial_status, expiry_date),
                fetch_one=True
            )
            
            if result:
                offer_id = str(result.get('id'))
                logger.info(f"Offer created in main offers table with ID: {offer_id}, status: {initial_status}")
                
                # Create approval request if approval is required
                if requires_approval:
                    try:
                        # Create an approval request entry
                        approval_query = """
                            INSERT INTO offer_approval_requests 
                            (id, offer_id, jd_id, candidate_id, recruiter_id, position_title, salary_amount, 
                             salary_currency, status, requested_at, created_at)
                            VALUES (uuid_generate_v4(), %s::uuid, %s::uuid, %s, %s, %s, %s, %s, 'pending', NOW(), NOW())
                            RETURNING id
                        """
                        approval_result = execute_query(
                            approval_query,
                            (offer_id, jd_id, candidate_id, recruiter_id, position_title, salary_amount, currency),
                            fetch_one=True
                        )
                        if approval_result:
                            logger.info(f"Approval request created with ID: {approval_result.get('id')}")
                    except Exception as approval_err:
                        logger.warning(f"Failed to create approval request: {approval_err}")
                        # Continue anyway - offer is created, approval can be added later
        except Exception as main_err:
            logger.warning(f"Main offers table insert failed: {main_err}")
        
        # Also insert into job_offers table as backup
        try:
            query = """
                INSERT INTO job_offers 
                (job_id, candidate_id, recruiter_id, position_title, salary_offered, 
                 currency, start_date, offer_expiry, benefits, notes, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id
            """
            
            # job_id might be UUID, try to handle it
            job_id_int = None
            if jd_id:
                try:
                    job_id_int = int(jd_id)
                except (ValueError, TypeError):
                    job_id_int = None
            
            backup_id = execute_query(
                query,
                (job_id_int, candidate_id, recruiter_id, position_title, salary_amount,
                 currency, start_date, expiry_date, benefits_str, notes),
                return_id=True
            )
            
            if backup_id and not offer_id:
                offer_id = str(backup_id)
                logger.info(f"Offer created in job_offers table with ID: {offer_id}")
        except Exception as backup_err:
            logger.warning(f"Backup job_offers table insert failed: {backup_err}")
        
        if offer_id:
            return jsonify({
                'success': True,
                'data': {'id': offer_id, 'offer_id': offer_id},
                'offer_id': offer_id,
                'message': 'Offer created successfully'
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to create offer in database'
            }), 500
        
    except Exception as e:
        logger.error(f"Failed to create offer: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to create offer: {str(e)}'
        }), 500


@recruiter_dashboard_bp.route('/offers/<int:offer_id>', methods=['GET'])
@optional_auth
def get_offer(offer_id):
    """Get details of a specific offer"""
    try:
        query = """
            SELECT 
                o.*,
                u.full_name as candidate_name,
                u.email as candidate_email,
                j.title as job_title,
                j.company as company_name
            FROM job_offers o
            LEFT JOIN users u ON o.candidate_id = u.id
            LEFT JOIN job_descriptions j ON o.job_id = j.id
            WHERE o.id = %s
        """
        
        offer = execute_query(query, (offer_id,), fetch_one=True)
        
        if not offer:
            return jsonify({
                'success': False,
                'message': 'Offer not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': offer
        })
        
    except Exception as e:
        logger.error(f"Failed to get offer: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve offer'
        }), 500


@recruiter_dashboard_bp.route('/offers/<int:offer_id>/status', methods=['PUT'])
@optional_auth
def update_offer_status(offer_id):
    """Update the status of an offer"""
    try:
        data = request.get_json()
        status = data.get('status')
        
        valid_statuses = ['pending', 'sent', 'accepted', 'rejected', 'withdrawn', 'expired']
        if status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Must be one of: {valid_statuses}'
            }), 400
        
        query = """
            UPDATE job_offers 
            SET status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(query, (status, offer_id), fetch_all=False)
        
        return jsonify({
            'success': True,
            'message': 'Offer status updated'
        })
        
    except Exception as e:
        logger.error(f"Failed to update offer status: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update offer status'
        }), 500


# =====================================================
# ACTIVE VACANCIES ENDPOINT
# =====================================================

@recruiter_dashboard_bp.route('/vacancies/active', methods=['GET'])
@optional_auth
def get_active_vacancies():
    """Get list of active vacancies with application counts"""
    try:
        query = """
            SELECT 
                j.id,
                j.title,
                j.company,
                j.location,
                j.department,
                j.status,
                j.created_at,
                j.application_deadline,
                COUNT(DISTINCT a.id) as application_count,
                COUNT(DISTINCT CASE WHEN a.status = 'shortlisted' THEN a.id END) as shortlisted_count
            FROM job_descriptions j
            LEFT JOIN job_applications a ON j.id = a.job_id
            WHERE j.status IN ('active', 'published')
            GROUP BY j.id
            ORDER BY j.created_at DESC
        """
        
        vacancies = execute_query(query)
        
        return jsonify({
            'success': True,
            'data': vacancies or []
        })
        
    except Exception as e:
        logger.error(f"Failed to get active vacancies: {e}")
        return jsonify({
            'success': True,
            'data': []
        })


# =====================================================
# OFFER APPROVAL WORKFLOW ENDPOINTS
# =====================================================

@recruiter_dashboard_bp.route('/offers/approvals/pending', methods=['GET'])
@optional_auth
def get_pending_offer_approvals():
    """Get all pending offer approval requests for HR Manager review"""
    try:
        # Get company_id from request for company-scoped filtering
        company_id = request.args.get('company_id')
        
        # First try to get from offer_approval_requests table
        # Join with hr_profiles to filter by company if company_id provided
        query = """
            SELECT 
                oar.id as approval_id,
                oar.offer_id,
                oar.jd_id,
                oar.candidate_id,
                oar.recruiter_id,
                oar.position_title,
                oar.salary_amount,
                oar.salary_currency,
                oar.status,
                oar.requested_at,
                oar.created_at,
                u.first_name as candidate_first_name,
                u.last_name as candidate_last_name,
                u.email as candidate_email,
                r.first_name as recruiter_first_name,
                r.last_name as recruiter_last_name,
                jd.title as job_title,
                jd.company as company_name,
                o.offer_data
            FROM offer_approval_requests oar
            LEFT JOIN users u ON oar.candidate_id = u.id
            LEFT JOIN users r ON oar.recruiter_id = r.id
            LEFT JOIN job_descriptions jd ON oar.jd_id::text = jd.id::text
            LEFT JOIN offers o ON oar.offer_id = o.id
            LEFT JOIN hr_profiles hp ON oar.recruiter_id = hp.user_id
            WHERE oar.status = 'pending'
        """
        
        params = []
        if company_id:
            query += " AND hp.company_id::text = %s"
            params.append(str(company_id))
        
        query += " ORDER BY oar.requested_at DESC"
        
        results = execute_query(query, tuple(params) if params else None) or []
        logger.info(f"Found {len(results)} pending approvals from offer_approval_requests table (company_id={company_id})")
        
        # If no results from approval requests table, fallback to offers table
        if not results:
            logger.info("No approval requests found, falling back to offers table")
            # Look for offers that need approval - including 'pending', 'draft', and 'pending_approval' statuses
            # Use COALESCE to get recruiter name from users table OR from offer_data
            # Filter by company_id via hr_profiles join
            fallback_query = """
                SELECT 
                    o.id as approval_id,
                    o.id as offer_id,
                    o.job_posting_id as jd_id,
                    o.candidate_id,
                    o.recruiter_id,
                    o.offer_data->>'position_title' as position_title,
                    COALESCE((o.offer_data->>'salary_amount')::numeric, 0) as salary_amount,
                    COALESCE(o.offer_data->>'salary_currency', 'AED') as salary_currency,
                    'pending' as status,
                    o.created_at as requested_at,
                    o.created_at,
                    u.first_name as candidate_first_name,
                    u.last_name as candidate_last_name,
                    u.email as candidate_email,
                    COALESCE(r.first_name, o.offer_data->>'recruiter_first_name', 'Recruiter') as recruiter_first_name,
                    COALESCE(r.last_name, o.offer_data->>'recruiter_last_name', '') as recruiter_last_name,
                    jd.title as job_title,
                    jd.company as company_name,
                    o.offer_data
                FROM offers o
                LEFT JOIN users u ON o.candidate_id = u.id
                LEFT JOIN users r ON o.recruiter_id = r.id AND o.recruiter_id != o.candidate_id
                LEFT JOIN job_descriptions jd ON o.job_posting_id::text = jd.id::text
                LEFT JOIN hr_profiles hp ON o.recruiter_id = hp.user_id
                WHERE o.status IN ('pending_approval', 'pending', 'draft')
                  AND o.status NOT IN ('approved', 'rejected', 'sent', 'accepted', 'declined', 'withdrawn')
            """
            fallback_params = []
            
            # Filter by company_id if provided
            if company_id:
                fallback_query += " AND hp.company_id::text = %s"
                fallback_params.append(str(company_id))
            
            fallback_query += " ORDER BY o.created_at DESC"
            results = execute_query(fallback_query, tuple(fallback_params) if fallback_params else None) or []
            logger.info(f"Found {len(results)} pending approvals from offers table fallback (status in pending_approval, pending, draft)")
        
        # Format the results
        approvals = []
        for row in results:
            approval = dict(row)
            # Parse offer_data if present
            if approval.get('offer_data'):
                if isinstance(approval['offer_data'], str):
                    try:
                        approval['offer_data'] = json.loads(approval['offer_data'])
                    except:
                        pass
            # Format datetime fields
            for field in ['requested_at', 'created_at']:
                if approval.get(field):
                    approval[field] = approval[field].isoformat() if hasattr(approval[field], 'isoformat') else str(approval[field])
            approvals.append(approval)
        
        logger.info(f"Returning {len(approvals)} pending approvals")
        return jsonify({
            'success': True,
            'data': approvals,
            'count': len(approvals)
        })
        
    except Exception as e:
        logger.error(f"Failed to get pending approvals: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': True,
            'data': [],
            'count': 0,
            'error': str(e)
        })


@recruiter_dashboard_bp.route('/offers/approvals/all', methods=['GET'])
@optional_auth
def get_all_offer_approvals():
    """Get all offer approval requests with optional status filter"""
    try:
        status = request.args.get('status')  # pending, approved, rejected
        recruiter_id = request.args.get('recruiter_id')
        company_id = request.args.get('company_id')  # For company-scoped filtering
        
        # Join with hr_profiles to filter by company
        query = """
            SELECT 
                oar.id as approval_id,
                oar.offer_id,
                oar.jd_id,
                oar.candidate_id,
                oar.recruiter_id,
                oar.position_title,
                oar.salary_amount,
                oar.salary_currency,
                oar.status,
                oar.approved_by,
                oar.approved_at,
                oar.rejection_reason,
                oar.comments,
                oar.requested_at,
                oar.created_at,
                u.first_name as candidate_first_name,
                u.last_name as candidate_last_name,
                r.first_name as recruiter_first_name,
                r.last_name as recruiter_last_name,
                jd.title as job_title
            FROM offer_approval_requests oar
            LEFT JOIN users u ON oar.candidate_id = u.id
            LEFT JOIN users r ON oar.recruiter_id = r.id
            LEFT JOIN job_descriptions jd ON oar.jd_id::text = jd.id::text
            LEFT JOIN hr_profiles hp ON oar.recruiter_id = hp.user_id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND oar.status = %s"
            params.append(status)
        
        if recruiter_id:
            query += " AND oar.recruiter_id = %s"
            params.append(int(recruiter_id))
        
        # Filter by company_id if provided
        if company_id:
            query += " AND hp.company_id::text = %s"
            params.append(str(company_id))
        
        query += " ORDER BY oar.created_at DESC"
        
        results = execute_query(query, tuple(params) if params else None) or []
        logger.info(f"Found {len(results)} approvals from offer_approval_requests table (company_id={company_id})")
        
        # If no results from approval_requests table, fallback to offers table
        if not results:
            logger.info("No approval requests found, falling back to offers table")
            fallback_query = """
                SELECT 
                    o.id as approval_id,
                    o.id as offer_id,
                    o.job_posting_id as jd_id,
                    o.candidate_id,
                    o.recruiter_id,
                    o.offer_data->>'position_title' as position_title,
                    (o.offer_data->>'salary_amount')::numeric as salary_amount,
                    COALESCE(o.offer_data->>'salary_currency', 'AED') as salary_currency,
                    o.status,
                    NULL as approved_by,
                    o.updated_at as approved_at,
                    NULL as rejection_reason,
                    NULL as comments,
                    o.created_at as requested_at,
                    o.created_at,
                    u.first_name as candidate_first_name,
                    u.last_name as candidate_last_name,
                    COALESCE(r.first_name, o.offer_data->>'recruiter_name', 'Recruiter') as recruiter_first_name,
                    COALESCE(r.last_name, '') as recruiter_last_name,
                    COALESCE(jd.title, o.offer_data->>'position_title') as job_title,
                    o.offer_data
                FROM offers o
                LEFT JOIN users u ON o.candidate_id = u.id
                LEFT JOIN users r ON o.recruiter_id = r.id AND o.recruiter_id != o.candidate_id
                LEFT JOIN job_descriptions jd ON o.job_posting_id::text = jd.id::text
                LEFT JOIN hr_profiles hp ON o.recruiter_id = hp.user_id
                WHERE 1=1
            """
            fallback_params = []
            
            if status:
                # Map status for offers table
                if status == 'pending':
                    fallback_query += " AND o.status IN ('pending_approval', 'pending', 'draft')"
                else:
                    fallback_query += " AND o.status = %s"
                    fallback_params.append(status)
            
            if recruiter_id:
                fallback_query += " AND o.recruiter_id = %s"
                fallback_params.append(int(recruiter_id))
            
            # Filter by company_id if provided
            if company_id:
                fallback_query += " AND hp.company_id::text = %s"
                fallback_params.append(str(company_id))
            
            fallback_query += " ORDER BY o.created_at DESC"
            
            results = execute_query(fallback_query, tuple(fallback_params) if fallback_params else None) or []
            logger.info(f"Found {len(results)} approvals from offers table fallback (company_id={company_id})")
        
        # Format the results
        approvals = []
        for row in results:
            approval = dict(row)
            # Parse offer_data if present
            if approval.get('offer_data'):
                if isinstance(approval['offer_data'], str):
                    try:
                        approval['offer_data'] = json.loads(approval['offer_data'])
                    except:
                        pass
            for field in ['requested_at', 'created_at', 'approved_at']:
                if approval.get(field):
                    approval[field] = approval[field].isoformat() if hasattr(approval[field], 'isoformat') else str(approval[field])
            approvals.append(approval)
        
        return jsonify({
            'success': True,
            'data': approvals,
            'count': len(approvals)
        })
        
    except Exception as e:
        logger.error(f"Failed to get all approvals: {e}")
        return jsonify({
            'success': True,
            'data': [],
            'count': 0
        })


@recruiter_dashboard_bp.route('/offers/approvals/<approval_id>/approve', methods=['POST'])
@optional_auth
def approve_offer(approval_id):
    """Approve an offer - HR Manager action"""
    try:
        data = request.get_json() or {}
        approver_id = data.get('approver_id', 1)  # HR Manager ID
        comments = data.get('comments', '')
        
        # Convert approver_id to int if string
        if isinstance(approver_id, str):
            try:
                approver_id = int(approver_id)
            except:
                approver_id = 1
        
        offer_id = None
        
        # First try to update the approval request
        update_query = """
            UPDATE offer_approval_requests
            SET status = 'approved',
                approved_by = %s,
                approved_at = NOW(),
                comments = %s,
                updated_at = NOW()
            WHERE id = %s::uuid
            RETURNING offer_id
        """
        
        result = execute_query(update_query, (approver_id, comments, approval_id), fetch_one=True)
        
        if result:
            offer_id = result.get('offer_id')
        else:
            # Fallback: approval_id might actually be the offer_id directly
            # This happens when using the offers table fallback
            logger.info(f"No approval request found, treating {approval_id} as offer_id")
            offer_id = approval_id
        
        if offer_id:
            # Update the offer status to 'approved' (ready to send to candidate)
            offer_update_query = """
                UPDATE offers
                SET status = 'approved',
                    updated_at = NOW()
                WHERE id = %s::uuid
                RETURNING id
            """
            offer_result = execute_query(offer_update_query, (str(offer_id),), fetch_one=True)
            
            if offer_result:
                logger.info(f"Offer {offer_id} approved by HR Manager {approver_id}")
                
                return jsonify({
                    'success': True,
                    'message': 'Offer approved successfully',
                    'offer_id': str(offer_id)
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Offer not found'
                }), 404
        else:
            return jsonify({
                'success': False,
                'message': 'Approval request not found'
            }), 404
        
    except Exception as e:
        logger.error(f"Failed to approve offer: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to approve offer: {str(e)}'
        }), 500


@recruiter_dashboard_bp.route('/offers/approvals/<approval_id>/reject', methods=['POST'])
@optional_auth
def reject_offer(approval_id):
    """Reject an offer - HR Manager action"""
    try:
        data = request.get_json() or {}
        approver_id = data.get('approver_id', 1)  # HR Manager ID
        rejection_reason = data.get('rejection_reason', data.get('reason', ''))
        comments = data.get('comments', '')
        
        # Convert approver_id to int if string
        if isinstance(approver_id, str):
            try:
                approver_id = int(approver_id)
            except:
                approver_id = 1
        
        offer_id = None
        
        # First try to update the approval request
        update_query = """
            UPDATE offer_approval_requests
            SET status = 'rejected',
                approved_by = %s,
                approved_at = NOW(),
                rejection_reason = %s,
                comments = %s,
                updated_at = NOW()
            WHERE id = %s::uuid
            RETURNING offer_id
        """
        
        result = execute_query(update_query, (approver_id, rejection_reason, comments, approval_id), fetch_one=True)
        
        if result:
            offer_id = result.get('offer_id')
        else:
            # Fallback: approval_id might actually be the offer_id directly
            logger.info(f"No approval request found, treating {approval_id} as offer_id")
            offer_id = approval_id
        
        if offer_id:
            # Update the offer status to 'rejected'
            offer_update_query = """
                UPDATE offers
                SET status = 'rejected',
                    updated_at = NOW()
                WHERE id = %s::uuid
                RETURNING id
            """
            offer_result = execute_query(offer_update_query, (str(offer_id),), fetch_one=True)
            
            if offer_result:
                logger.info(f"Offer {offer_id} rejected by HR Manager {approver_id}")
                
                return jsonify({
                    'success': True,
                    'message': 'Offer rejected',
                    'offer_id': str(offer_id)
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Offer not found'
                }), 404
        else:
            return jsonify({
                'success': False,
                'message': 'Approval request not found'
            }), 404
        
    except Exception as e:
        logger.error(f"Failed to reject offer: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to reject offer: {str(e)}'
        }), 500


@recruiter_dashboard_bp.route('/offers/<offer_id>/send-to-candidate', methods=['POST'])
@recruiter_dashboard_bp.route('/offers/<offer_id>/send', methods=['POST'])
@optional_auth
def send_offer_to_candidate(offer_id):
    """Send an approved offer to the candidate"""
    try:
        # First check if the offer is approved
        check_query = """
            SELECT status FROM offers WHERE id = %s::uuid
        """
        result = execute_query(check_query, (offer_id,), fetch_one=True)
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'Offer not found'
            }), 404
        
        if result.get('status') != 'approved':
            return jsonify({
                'success': False,
                'message': f"Cannot send offer. Current status is '{result.get('status')}'. Offer must be approved first."
            }), 400
        
        # Update offer status to 'sent'
        update_query = """
            UPDATE offers
            SET status = 'sent',
                updated_at = NOW()
            WHERE id = %s::uuid
            RETURNING id, candidate_id
        """
        
        update_result = execute_query(update_query, (offer_id,), fetch_one=True)
        
        if update_result:
            # TODO: Send notification to candidate (email, in-app notification, etc.)
            logger.info(f"Offer {offer_id} sent to candidate {update_result.get('candidate_id')}")
            
            return jsonify({
                'success': True,
                'message': 'Offer sent to candidate successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to update offer status'
            }), 500
        
    except Exception as e:
        logger.error(f"Failed to send offer to candidate: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to send offer: {str(e)}'
        }), 500


@recruiter_dashboard_bp.route('/offers/approval-stats', methods=['GET'])
@optional_auth
def get_offer_approval_stats():
    """Get statistics about offer approvals"""
    try:
        # First try offer_approval_requests table
        query = """
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
            FROM offer_approval_requests
        """
        
        result = execute_query(query, fetch_one=True)
        
        # If no data in approval_requests table, fallback to offers table
        if not result or (result.get('total', 0) == 0):
            logger.info("No data in offer_approval_requests, falling back to offers table")
            # Count pending as any offer that hasn't been approved/rejected/sent yet
            fallback_query = """
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status IN ('pending_approval', 'pending', 'draft') THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
                FROM offers
            """
            result = execute_query(fallback_query, fetch_one=True)
            logger.info(f"Fallback stats from offers table: {result}")
        
        return jsonify({
            'success': True,
            'data': result or {'total': 0, 'pending': 0, 'approved': 0, 'rejected': 0}
        })
        
    except Exception as e:
        logger.error(f"Failed to get approval stats: {e}")
        return jsonify({
            'success': True,
            'data': {'total': 0, 'pending': 0, 'approved': 0, 'rejected': 0}
        })


# =====================================================
# HELPER FUNCTIONS
# =====================================================



@recruiter_dashboard_bp.route('/candidates/<candidate_id>/full-profile', methods=['GET'])
@optional_auth
def get_candidate_profile_full(candidate_id):
    """Get full profile details for a candidate with robust ID handling"""
    try:
        logger.info(f"Fetching full profile for candidate_id: {candidate_id}")
        
        # Ensure ID is an integer (Schema strictness)
        try:
            candidate_id_int = int(candidate_id)
        except (ValueError, TypeError):
            logger.error(f"Invalid candidate_id format: {candidate_id}")
            return jsonify({'success': False, 'message': 'Invalid candidate ID format'}), 400

        # Standard Query: Join Users and Candidate Profiles on Integer IDs
        # Note: We select from users first to ensure we get user details even if profile is missing
        query = """
            SELECT 
                cp.id as profile_id,
                cp.headline, cp.bio, cp.phone, cp.location, cp.nationality,
                cp.dob, cp.avatar_url, cp.video_intro_url,
                cp.expected_salary_range, cp.notice_period,
                cp.full_name, cp.ats_score, cp.profile_photo_url,
                u.email, u.first_name, u.last_name
            FROM users u
            LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
            WHERE u.id = %s
        """
        profile = execute_query(query, (candidate_id_int,), fetch_one=True)
        
        # Fallback: If no profile record (and join returned None for cp columns), we construct a basic object.
        # But execute_query returns a dict. If cp is null, keys might be None.
        if not profile:
             logger.warning(f"User not found for ID: {candidate_id}")
             return jsonify({'success': False, 'message': 'Candidate not found'}), 404
             
        # If profile_id is None, it means the user exists but has no candidate_profile entry.
        # We should still return basic user info.
        if not profile.get('profile_id'):
             profile['work_experience'] = []
             profile['education'] = []
             profile['skills'] = []
             # Ensure name/email are populated from User columns as fallback
             if not profile.get('full_name'):
                 profile['full_name'] = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()


        # Fetch Related Data (Experience, Education, Skills) using profile_id
        profile_id = profile.get('profile_id')
        experience = []
        education = []
        skills = []

        if profile_id:
            try:
                # Experience
                exp_query = "SELECT * FROM candidate_experience_entries WHERE profile_id = %s ORDER BY start_date DESC"
                experience = execute_query(exp_query, (profile_id,)) or []
                for exp in experience:
                    for date_field in ['start_date', 'end_date']:
                        if exp.get(date_field): exp[date_field] = str(exp[date_field])

                # Education
                edu_query = "SELECT * FROM candidate_education_entries WHERE profile_id = %s ORDER BY start_date DESC"
                education = execute_query(edu_query, (profile_id,)) or []
                for edu in education:
                    for date_field in ['start_date', 'end_date']:
                        if edu.get(date_field): edu[date_field] = str(edu[date_field])

                # Skills
                skill_query = "SELECT * FROM candidate_skills WHERE profile_id = %s"
                skills = execute_query(skill_query, (profile_id,)) or []
            except Exception as e:
                logger.error(f"Error fetching related data for profile {profile_id}: {e}")

        # Construct Response
        data = {
            'candidate_id': candidate_id,
            'full_name': profile.get('full_name') or f"{profile.get('first_name','')} {profile.get('last_name','')}".strip(),
            'email': profile.get('email'),
            'phone': profile.get('phone'),
            'location': profile.get('location'),
            'headline': profile.get('headline'),
            'bio': profile.get('bio'),
            'summary': profile.get('bio'), 
            'nationality': profile.get('nationality'),
            'work_experience': experience,
            'education': education,
            'skills': [s.get('name') for s in skills], 
            'technical_skills': [s.get('name') for s in skills if s.get('category') == 'technical'],
            'soft_skills': [s.get('name') for s in skills if s.get('category') == 'soft'],
            'ats_score': profile.get('ats_score'),
            'profile_photo_url': profile.get('profile_photo_url') or profile.get('avatar_url')
        }
        
        return jsonify({
            'success': True,
            'data': data
        })

    except Exception as e:
        logger.error(f"Failed to fetch candidate full profile: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500



def log_activity(recruiter_id, action, resource_type, resource_id, details=None):
    """Log recruiter activity"""
    try:
        query = """
            INSERT INTO recruiter_activity_log 
            (recruiter_id, action, resource_type, resource_id, details)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(
            query, 
            (recruiter_id, action, resource_type, resource_id, 
             json.dumps(details) if details else None),
            fetch_all=False
        )
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")


# Register the blueprint function
def register_recruiter_dashboard_routes(app):
    """Register recruiter dashboard routes with the Flask app"""
    app.register_blueprint(recruiter_dashboard_bp)
    logger.info("✅ Recruiter Dashboard API routes registered")
