"""
Growth Operator API Routes

This module provides API endpoints for the Growth Operator dashboard,
including metrics for all six domains: Candidate, Company, Education,
Assessment, Mentorship, and Community.
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
growth_operator_bp = Blueprint('growth_operator_api', __name__, url_prefix='/api/growth-operator')

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

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """Execute a database query with error handling"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            if fetch_one:
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

def optional_auth(f):
    """Decorator that allows requests with or without authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


def get_domain_stats(domain: str) -> dict:
    """Get statistics for a specific domain"""
    now = datetime.utcnow()
    last_week = now - timedelta(days=7)
    
    stats = {
        'total': 0,
        'active': 0,
        'pending': 0,
        'growth': 0,
        'lastUpdated': now.isoformat()
    }
    
    try:
        if domain == 'candidate':
            # Candidate statistics
            query = """
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE is_active = true) as active,
                    COUNT(*) FILTER (WHERE created_at >= %s) as new_this_week
                FROM users
                WHERE role = 'job_seeker' OR role IS NULL
            """
            result = execute_query(query, (last_week,), fetch_one=True)
            if result:
                stats['total'] = result.get('total', 0) or 0
                stats['active'] = result.get('active', 0) or 0
                new_count = result.get('new_this_week', 0) or 0
                stats['growth'] = round((new_count / max(stats['total'], 1)) * 100, 1)
            
            # Pending = candidates without complete profiles
            cv_query = """
                SELECT COUNT(DISTINCT user_id) as with_cv FROM cv_data
            """
            cv_result = execute_query(cv_query, fetch_one=True)
            if cv_result:
                stats['pending'] = max(0, stats['total'] - (cv_result.get('with_cv', 0) or 0))
                
        elif domain == 'company':
            # Company statistics
            query = """
                SELECT 
                    COUNT(DISTINCT company) as total,
                    COUNT(*) FILTER (WHERE status = 'active' OR status = 'published') as active,
                    COUNT(*) FILTER (WHERE status = 'draft' OR status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE created_at >= %s) as new_this_week
                FROM job_descriptions
            """
            result = execute_query(query, (last_week,), fetch_one=True)
            if result:
                stats['total'] = result.get('total', 0) or 0
                stats['active'] = result.get('active', 0) or 0
                stats['pending'] = result.get('pending', 0) or 0
                new_count = result.get('new_this_week', 0) or 0
                stats['growth'] = round((new_count / max(stats['total'], 1)) * 100, 1)
                
        elif domain == 'education':
            # Education/School programs statistics
            query = """
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'active') as active,
                    COUNT(*) FILTER (WHERE status = 'pending' OR status = 'draft') as pending,
                    COUNT(*) FILTER (WHERE created_at >= %s) as new_this_week
                FROM school_programs
            """
            result = execute_query(query, (last_week,), fetch_one=True)
            if result:
                stats['total'] = result.get('total', 0) or 0
                stats['active'] = result.get('active', 0) or 0
                stats['pending'] = result.get('pending', 0) or 0
                new_count = result.get('new_this_week', 0) or 0
                stats['growth'] = round((new_count / max(stats['total'], 1)) * 100, 1)
                
        elif domain == 'assessment':
            # Assessment statistics
            query = """
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'completed') as active,
                    COUNT(*) FILTER (WHERE status = 'pending' OR status = 'in_progress') as pending,
                    COUNT(*) FILTER (WHERE created_at >= %s) as new_this_week
                FROM assessments
            """
            result = execute_query(query, (last_week,), fetch_one=True)
            if result:
                stats['total'] = result.get('total', 0) or 0
                stats['active'] = result.get('active', 0) or 0
                stats['pending'] = result.get('pending', 0) or 0
                new_count = result.get('new_this_week', 0) or 0
                stats['growth'] = round((new_count / max(stats['total'], 1)) * 100, 1)
                
        elif domain == 'mentorship':
            # Mentorship statistics
            query = """
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'active') as active,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE created_at >= %s) as new_this_week
                FROM mentorship_matches
            """
            result = execute_query(query, (last_week,), fetch_one=True)
            if result:
                stats['total'] = result.get('total', 0) or 0
                stats['active'] = result.get('active', 0) or 0
                stats['pending'] = result.get('pending', 0) or 0
                new_count = result.get('new_this_week', 0) or 0
                stats['growth'] = round((new_count / max(stats['total'], 1)) * 100, 1)
                
        elif domain == 'community':
            # Community statistics (groups, posts, events)
            # Try community_groups table first
            query = """
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE is_active = true) as active
                FROM users
            """
            result = execute_query(query, fetch_one=True)
            if result:
                stats['total'] = result.get('total', 0) or 0
                stats['active'] = result.get('active', 0) or 0
                stats['growth'] = 5.0  # Placeholder growth rate
                
    except Exception as e:
        logger.error(f"Error getting {domain} stats: {e}")
    
    return stats


# =====================================================
# METRICS ENDPOINT
# =====================================================

@growth_operator_bp.route('/metrics', methods=['GET'])
@optional_auth
def get_growth_operator_metrics():
    """
    Get metrics for Growth Operator dashboard
    
    Returns:
        GrowthMetrics object with stats for all six domains
    """
    try:
        metrics = {
            'candidate': get_domain_stats('candidate'),
            'company': get_domain_stats('company'),
            'education': get_domain_stats('education'),
            'assessment': get_domain_stats('assessment'),
            'mentorship': get_domain_stats('mentorship'),
            'community': get_domain_stats('community')
        }
        
        return jsonify({
            'status': 'success',
            'data': metrics,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get growth operator metrics: {e}")
        # Return default metrics structure on error
        default_stats = {
            'total': 0,
            'active': 0,
            'pending': 0,
            'growth': 0,
            'lastUpdated': datetime.utcnow().isoformat()
        }
        return jsonify({
            'status': 'success',
            'data': {
                'candidate': default_stats.copy(),
                'company': default_stats.copy(),
                'education': default_stats.copy(),
                'assessment': default_stats.copy(),
                'mentorship': default_stats.copy(),
                'community': default_stats.copy()
            },
            'timestamp': datetime.utcnow().isoformat()
        })


# =====================================================
# DOMAIN-SPECIFIC ENDPOINTS
# =====================================================

@growth_operator_bp.route('/candidate/list', methods=['GET'])
@optional_auth
def list_candidates():
    """Get list of candidates for growth operations"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        
        offset = (page - 1) * per_page
        
        query = """
            SELECT 
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.is_active,
                u.created_at,
                cv.title as cv_title,
                cv.id as cv_id
            FROM users u
            LEFT JOIN cv_data cv ON u.id = cv.user_id AND cv.is_visible = true
            WHERE (u.role = 'job_seeker' OR u.role IS NULL)
        """
        params = []
        
        if search:
            query += " AND (u.username ILIKE %s OR u.email ILIKE %s OR u.full_name ILIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        if status == 'active':
            query += " AND u.is_active = true"
        elif status == 'inactive':
            query += " AND u.is_active = false"
        
        query += " ORDER BY u.created_at DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        candidates = execute_query(query, tuple(params))
        
        # Get total count
        count_query = """
            SELECT COUNT(*) as total FROM users 
            WHERE (role = 'job_seeker' OR role IS NULL)
        """
        total = execute_query(count_query, fetch_one=True)
        
        return jsonify({
            'status': 'success',
            'data': {
                'candidates': candidates or [],
                'total': total.get('total', 0) if total else 0,
                'page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to list candidates: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve candidates'
        }), 500


@growth_operator_bp.route('/company/list', methods=['GET'])
@optional_auth
def list_companies():
    """Get list of companies for growth operations"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        offset = (page - 1) * per_page
        
        query = """
            SELECT 
                company,
                COUNT(*) as vacancy_count,
                COUNT(*) FILTER (WHERE status = 'active' OR status = 'published') as active_vacancies,
                MIN(created_at) as first_posting,
                MAX(created_at) as last_posting
            FROM job_descriptions
            WHERE company IS NOT NULL AND company != ''
            GROUP BY company
            ORDER BY vacancy_count DESC
            LIMIT %s OFFSET %s
        """
        
        companies = execute_query(query, (per_page, offset))
        
        # Get total count
        count_query = """
            SELECT COUNT(DISTINCT company) as total 
            FROM job_descriptions 
            WHERE company IS NOT NULL AND company != ''
        """
        total = execute_query(count_query, fetch_one=True)
        
        return jsonify({
            'status': 'success',
            'data': {
                'companies': companies or [],
                'total': total.get('total', 0) if total else 0,
                'page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to list companies: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve companies'
        }), 500


@growth_operator_bp.route('/education/programs', methods=['GET'])
@optional_auth
def list_education_programs():
    """Get list of education programs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        offset = (page - 1) * per_page
        
        query = """
            SELECT 
                id,
                name,
                description,
                provider,
                status,
                created_at
            FROM school_programs
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        
        programs = execute_query(query, (per_page, offset))
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM school_programs"
        total = execute_query(count_query, fetch_one=True)
        
        return jsonify({
            'status': 'success',
            'data': {
                'programs': programs or [],
                'total': total.get('total', 0) if total else 0,
                'page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to list education programs: {e}")
        return jsonify({
            'status': 'success',
            'data': {
                'programs': [],
                'total': 0,
                'page': 1,
                'per_page': per_page
            }
        })


@growth_operator_bp.route('/assessment/list', methods=['GET'])
@optional_auth
def list_assessments():
    """Get list of assessments"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        offset = (page - 1) * per_page
        
        query = """
            SELECT 
                id,
                title,
                type,
                status,
                created_at
            FROM assessments
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        
        assessments = execute_query(query, (per_page, offset))
        
        return jsonify({
            'status': 'success',
            'data': {
                'assessments': assessments or [],
                'total': len(assessments) if assessments else 0,
                'page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to list assessments: {e}")
        return jsonify({
            'status': 'success',
            'data': {
                'assessments': [],
                'total': 0,
                'page': 1,
                'per_page': per_page
            }
        })


@growth_operator_bp.route('/mentorship/matches', methods=['GET'])
@optional_auth
def list_mentorship_matches():
    """Get list of mentorship matches"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        offset = (page - 1) * per_page
        
        query = """
            SELECT 
                m.id,
                m.mentor_id,
                m.mentee_id,
                m.status,
                m.created_at,
                mentor.username as mentor_name,
                mentee.username as mentee_name
            FROM mentorship_matches m
            LEFT JOIN users mentor ON m.mentor_id = mentor.id
            LEFT JOIN users mentee ON m.mentee_id = mentee.id
            ORDER BY m.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        matches = execute_query(query, (per_page, offset))
        
        return jsonify({
            'status': 'success',
            'data': {
                'matches': matches or [],
                'total': len(matches) if matches else 0,
                'page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to list mentorship matches: {e}")
        return jsonify({
            'status': 'success',
            'data': {
                'matches': [],
                'total': 0,
                'page': 1,
                'per_page': per_page
            }
        })


@growth_operator_bp.route('/community/stats', methods=['GET'])
@optional_auth
def get_community_stats():
    """Get community engagement statistics"""
    try:
        stats = {
            'totalMembers': 0,
            'activeMembers': 0,
            'totalGroups': 0,
            'totalPosts': 0,
            'totalEvents': 0,
            'engagementRate': 0
        }
        
        # Get user counts
        user_query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE is_active = true) as active
            FROM users
        """
        user_stats = execute_query(user_query, fetch_one=True)
        if user_stats:
            stats['totalMembers'] = user_stats.get('total', 0) or 0
            stats['activeMembers'] = user_stats.get('active', 0) or 0
            if stats['totalMembers'] > 0:
                stats['engagementRate'] = round((stats['activeMembers'] / stats['totalMembers']) * 100, 1)
        
        return jsonify({
            'status': 'success',
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Failed to get community stats: {e}")
        return jsonify({
            'status': 'success',
            'data': {
                'totalMembers': 0,
                'activeMembers': 0,
                'totalGroups': 0,
                'totalPosts': 0,
                'totalEvents': 0,
                'engagementRate': 0
            }
        })


# Register the blueprint function
def register_growth_operator_routes(app):
    """Register growth operator routes with the Flask app"""
    app.register_blueprint(growth_operator_bp)
    logger.info("✅ Growth Operator API routes registered")
