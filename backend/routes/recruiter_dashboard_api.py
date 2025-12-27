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
            
            conn.commit()
            logger.info("Recruiter tables ensured")
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


# =====================================================
# OFFERS MANAGEMENT ENDPOINTS
# =====================================================

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
def create_offer():
    """
    Create a new job offer
    
    Body:
        candidate_id: ID of the candidate
        job_id: ID of the job (optional)
        position_title: Title of the position
        salary_offered: Salary amount
        currency: Currency code (default: AED)
        start_date: Proposed start date
        offer_expiry: Offer expiration date
        benefits: Benefits description
        notes: Additional notes
    """
    try:
        data = request.get_json()
        
        candidate_id = data.get('candidate_id')
        job_id = data.get('job_id')
        position_title = data.get('position_title', data.get('positionTitle', ''))
        salary_offered = data.get('salary_offered', data.get('salaryOffered'))
        currency = data.get('currency', 'AED')
        start_date = data.get('start_date', data.get('startDate'))
        offer_expiry = data.get('offer_expiry', data.get('offerExpiry'))
        benefits = data.get('benefits', '')
        notes = data.get('notes', '')
        recruiter_id = data.get('recruiter_id', 1)
        
        if not candidate_id:
            return jsonify({
                'success': False,
                'message': 'Candidate ID required'
            }), 400
        
        query = """
            INSERT INTO job_offers 
            (job_id, candidate_id, recruiter_id, position_title, salary_offered, 
             currency, start_date, offer_expiry, benefits, notes, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id
        """
        
        offer_id = execute_query(
            query,
            (job_id, candidate_id, recruiter_id, position_title, salary_offered,
             currency, start_date, offer_expiry, benefits, notes),
            return_id=True
        )
        
        # Log activity
        log_activity(recruiter_id, 'create_offer', 'offer', str(offer_id), {
            'candidate_id': candidate_id,
            'position': position_title
        })
        
        return jsonify({
            'success': True,
            'data': {'id': offer_id},
            'message': 'Offer created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to create offer: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to create offer'
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
# HELPER FUNCTIONS
# =====================================================

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
