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

user_activity_bp = Blueprint('user_activity', __name__)


def generate_mock_activity(user_id: int, count: int = 20):
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


def generate_mock_sessions(user_id: int):
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


@user_activity_bp.route('/api/admin/users/<int:user_id>/activity', methods=['GET'])
def get_user_activity(user_id):
    """
    Get activity logs and sessions for a specific user.
    
    Returns:
        - activities: List of recent activity logs
        - sessions: List of active sessions
    """
    try:
        limit = request.args.get('limit', 20, type=int)
        
        activities = generate_mock_activity(user_id, limit)
        sessions = generate_mock_sessions(user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'activities': activities,
                'sessions': sessions,
                'total_activities': len(activities),
                'active_sessions': len(sessions)
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
        # In a real implementation, invalidate the session in the database/cache
        return jsonify({
            'success': True,
            'message': f'Session {session_id} terminated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@user_activity_bp.route('/api/admin/users/<int:user_id>/sessions', methods=['GET'])
def get_user_sessions(user_id):
    """
    Get all active sessions for a specific user.
    """
    try:
        sessions = generate_mock_sessions(user_id)
        
        return jsonify({
            'success': True,
            'data': sessions
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@user_activity_bp.route('/api/admin/users/<int:user_id>/sessions/terminate-all', methods=['POST'])
def terminate_all_sessions(user_id):
    """
    Terminate all sessions for a specific user except the current one.
    """
    try:
        current_session_id = request.json.get('except_session_id') if request.json else None
        
        return jsonify({
            'success': True,
            'message': f'All sessions for user {user_id} terminated',
            'sessions_terminated': 2  # Mock count
        })
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
        
        # Generate platform-wide activity
        activities = []
        user_names = [
            'Ahmed Al Maktoum', 'Fatima Al Nahyan', 'Mohammed Al Qasimi',
            'Sara Al Falasi', 'Khalid Al Mazrouei', 'Noura Al Shamsi'
        ]
        
        actions = [
            ('user_registered', 'New user registered'),
            ('job_posted', 'New job posted'),
            ('application_submitted', 'Job application submitted'),
            ('cv_uploaded', 'CV uploaded'),
            ('interview_scheduled', 'Interview scheduled'),
            ('offer_extended', 'Job offer extended'),
            ('profile_completed', 'Profile completed')
        ]
        
        for i in range(limit):
            action, details = random.choice(actions)
            user = random.choice(user_names)
            activities.append({
                'id': i + 1,
                'user_name': user,
                'action': action,
                'details': f'{user} - {details}',
                'created_at': (datetime.utcnow() - timedelta(minutes=i * 15)).isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': activities
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
        stats = {
            'total_users': 1247,
            'active_users': 1089,
            'inactive_users': 158,
            'new_users_today': 12,
            'new_users_this_week': 67,
            'new_users_this_month': 234,
            'users_by_role': {
                'candidate': 850,
                'recruiter': 120,
                'employer_admin': 45,
                'growth_operator': 15,
                'platform_administrator': 5,
                'mentor': 42,
                'assessor': 25,
                'other': 145
            },
            'users_by_status': {
                'active': 1089,
                'inactive': 98,
                'suspended': 35,
                'pending_verification': 25
            },
            'users_by_department': {
                'Engineering': 234,
                'Human Resources': 156,
                'Marketing': 98,
                'Sales': 187,
                'Finance': 112,
                'Operations': 145,
                'Other': 315
            },
            'login_activity': {
                'today': 456,
                'this_week': 2134,
                'this_month': 8567
            },
            'growth_rate': {
                'daily': 2.3,
                'weekly': 5.8,
                'monthly': 18.7
            }
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
