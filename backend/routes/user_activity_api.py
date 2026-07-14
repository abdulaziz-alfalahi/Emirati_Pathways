"""
User Activity and Session Management API

This module provides endpoints for:
- User activity logging and retrieval
- Session management (list, terminate)
- Email availability checking
- User statistics

Author: Emirati Pathways Platform
Version: 1.0.0
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import random
import string
import psycopg2.extras
from backend.db import get_db_connection

user_activity_bp = Blueprint('user_activity', __name__)


def generate_mock_activity(user_id, count: int = 20):
    """Generate mock activity logs for a user."""
    actions = [
        ('login', 'User logged in successfully'),
        ('logout', 'User logged out'),
        ('profile_update', 'User updated their profile information'),
        ('password_change', 'User changed their password'),
        ('role_change', 'User roles were updated by admin'),
        ('document_upload', 'User uploaded a document'),
        ('job_application', 'User applied for a job'),
        ('cv_update', 'User updated their CV'),
        ('settings_change', 'User changed account settings'),
        ('email_verified', 'User verified their email address')
    ]
    
    activities = []
    for i in range(count):
        action, details = random.choice(actions)
        activities.append({
            'id': i + 1,
            'user_id': user_id,
            'action': action,
            'details': details,
            'ip_address': f'192.168.{random.randint(1, 255)}.{random.randint(1, 255)}',
            'user_agent': random.choice([
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148',
                'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile'
            ]),
            'created_at': (datetime.utcnow() - timedelta(hours=i * 2)).isoformat()
        })
    
    return activities


def generate_mock_sessions(user_id):
    """Generate mock active sessions for a user."""
    sessions = [
        {
            'id': f'session-{user_id}-1',
            'user_id': user_id,
            'ip_address': '192.168.1.100',
            'user_agent': 'Chrome on Windows',
            'device_type': 'Desktop',
            'location': 'Dubai, UAE',
            'created_at': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            'last_activity': datetime.utcnow().isoformat(),
            'is_current': True
        },
        {
            'id': f'session-{user_id}-2',
            'user_id': user_id,
            'ip_address': '192.168.1.150',
            'user_agent': 'Safari on macOS',
            'device_type': 'Desktop',
            'location': 'Abu Dhabi, UAE',
            'created_at': (datetime.utcnow() - timedelta(days=1)).isoformat(),
            'last_activity': (datetime.utcnow() - timedelta(hours=5)).isoformat(),
            'is_current': False
        },
        {
            'id': f'session-{user_id}-3',
            'user_id': user_id,
            'ip_address': '10.0.0.50',
            'user_agent': 'Emirati Pathways Mobile App',
            'device_type': 'Mobile',
            'location': 'Sharjah, UAE',
            'created_at': (datetime.utcnow() - timedelta(days=3)).isoformat(),
            'last_activity': (datetime.utcnow() - timedelta(days=1)).isoformat(),
            'is_current': False
        }
    ]
    return sessions


@user_activity_bp.route('/api/admin/users/<user_id>/activity', methods=['GET'])
def get_user_activity(user_id):
    """
    Get activity logs and sessions for a specific user.
    
    Returns:
        - activities: List of recent activity logs
        - sessions: List of active sessions
    """
    try:
        limit = request.args.get('limit', 20, type=int)
        
        # Activity/session logging is not wired to a real store — return empty
        # rather than randomly-generated fake login history / sessions. (#26)
        return jsonify({
            'success': True,
            'activity_logging_enabled': False,
            'data': {
                'activities': [],
                'sessions': [],
                'total_activities': 0,
                'active_sessions': 0
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@user_activity_bp.route('/api/admin/users/check-email', methods=['GET'])
def check_email_availability():
    """
    Check if an email address is available for registration.
    
    Query params:
        - email: Email address to check
    
    Returns:
        - available: Boolean indicating if email is available
    """
    try:
        email = request.args.get('email', '').strip().lower()
        
        if not email:
            return jsonify({
                'success': False,
                'message': 'Email is required'
            }), 400
        
        # In a real implementation, check against database
        # For now, simulate some emails being taken
        taken_emails = [
            'admin@emiratipathways.ae',
            'support@emiratipathways.ae',
            'test@test.com'
        ]
        
        available = email not in taken_emails
        
        return jsonify({
            'success': True,
            'available': available,
            'email': email
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@user_activity_bp.route('/api/admin/sessions/<session_id>', methods=['DELETE'])
def terminate_session(session_id):
    """
    Terminate a specific user session.
    
    Args:
        session_id: The session ID to terminate
    
    Returns:
        - success: Boolean indicating if session was terminated
    """
    try:
        # Session tracking is not implemented — do not claim to have terminated a
        # session that isn't tracked. (#26)
        return jsonify({
            'success': False,
            'message': 'Session termination is not available (session tracking not enabled).'
        }), 501
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@user_activity_bp.route('/api/admin/users/<user_id>/sessions', methods=['GET'])
def get_user_sessions(user_id):
    """
    Get all active sessions for a specific user.
    """
    try:
        # No real session store — return empty, not fabricated sessions. (#26)
        return jsonify({
            'success': True,
            'activity_logging_enabled': False,
            'data': []
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@user_activity_bp.route('/api/admin/users/<user_id>/sessions/terminate-all', methods=['POST'])
def terminate_all_sessions(user_id):
    """
    Terminate all sessions for a specific user except the current one.
    """
    try:
        # Session tracking is not implemented — do not claim to have terminated
        # sessions that aren't tracked. (#26)
        return jsonify({
            'success': False,
            'message': 'Session termination is not available (session tracking not enabled).'
        }), 501
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@user_activity_bp.route('/api/admin/activity/recent', methods=['GET'])
def get_recent_platform_activity():
    """
    Get recent activity across the entire platform.
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        
        # No real platform activity log is wired — return empty rather than random
        # fabricated activity with invented user names. (#26)
        return jsonify({
            'success': True,
            'activity_logging_enabled': False,
            'data': []
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@user_activity_bp.route('/api/admin/users/statistics', methods=['GET'])
def get_user_statistics():
    """
    Get comprehensive user statistics for the admin dashboard.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 1. Total and status-based user counts
        cursor.execute("""
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE is_active = true) as active_users,
                COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_users_today,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_this_week,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_this_month
            FROM users
        """)
        counts = cursor.fetchone()
        
        # 2. Users by role
        cursor.execute("""
            SELECT role, COUNT(*) as count
            FROM users
            WHERE role IS NOT NULL AND role != ''
            GROUP BY role
        """)
        role_rows = cursor.fetchall()
        users_by_role = {row['role']: row['count'] for row in role_rows}
        
        # 3. Users by status
        cursor.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE is_active = true) as active,
                COUNT(*) FILTER (WHERE is_active = false) as inactive
            FROM users
        """)
        status_row = cursor.fetchone()
        users_by_status = {
            'active': status_row['active'] or 0,
            'inactive': status_row['inactive'] or 0,
            'suspended': 0,
            'pending_verification': 0
        }
        
        # 4. Users by department (using company as department)
        cursor.execute("""
            SELECT company, COUNT(*) as count
            FROM users
            WHERE company IS NOT NULL AND company != ''
            GROUP BY company
            LIMIT 10
        """)
        company_rows = cursor.fetchall()
        users_by_department = {row['company']: row['count'] for row in company_rows}
        
        cursor.close()
        conn.close()
        
        total = counts['total_users'] or 0
        active = counts['active_users'] or 0
        inactive = counts['inactive_users'] or 0
        today = counts['new_users_today'] or 0
        week = counts['new_users_this_week'] or 0
        month = counts['new_users_this_month'] or 0
        
        stats = {
            'total_users': total,
            'active_users': active,
            'inactive_users': inactive,
            'new_users_today': today,
            'new_users_this_week': week,
            'new_users_this_month': month,
            'users_by_role': users_by_role,
            'users_by_status': users_by_status,
            'users_by_department': users_by_department,
            'login_activity': {
                'today': today,
                'this_week': week,
                'this_month': month
            },
            'growth_rate': {
                'daily': round((today / max(total, 1)) * 100, 1),
                'weekly': round((week / max(total, 1)) * 100, 1),
                'monthly': round((month / max(total, 1)) * 100, 1)
            }
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        # No fabricated fallback — surface an honest error instead of fake stats. (#26)
        logger.error(f"Failed to get user statistics: {e}")
        return jsonify({'success': False, 'message': 'User statistics are temporarily unavailable.'}), 503
