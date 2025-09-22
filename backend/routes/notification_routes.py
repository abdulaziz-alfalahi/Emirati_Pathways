#!/usr/bin/env python3
"""
Notification API Routes for Emirati Journey Platform
Provides REST endpoints for notification management
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import logging
from datetime import datetime
from typing import Dict, List, Optional

# Import notification system components
from backend.notification_system import NotificationType, NotificationPriority

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint
notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

def get_notification_system():
    """Get notification system from app context"""
    return current_app.notification_system

def get_notification_helpers():
    """Get notification helpers from app context"""
    return current_app.notification_helpers

@notification_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for notification service"""
    try:
        notification_system = get_notification_system()
        
        # Test Redis connection if available
        if notification_system.redis_client:
            notification_system.redis_client.ping()
            redis_status = "connected"
        else:
            redis_status = "not_available"
        
        return jsonify({
            'status': 'healthy',
            'service': 'notification_system',
            'redis_status': redis_status,
            'websocket_status': 'active',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for the authenticated user"""
    try:
        user_id = str(get_jwt_identity())
        
        # Get query parameters
        limit = request.args.get('limit', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Validate limit
        if limit > 100:
            limit = 100
        
        notification_system = get_notification_system()
        
        # Get notifications
        notifications = notification_system.notification_manager.get_user_notifications(
            user_id, limit, unread_only
        )
        
        # Get unread count
        unread_count = notification_system.notification_manager.get_unread_count(user_id)
        
        return jsonify({
            'notifications': notifications,
            'unread_count': unread_count,
            'total_returned': len(notifications),
            'limit': limit,
            'unread_only': unread_only
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        return jsonify({'error': 'Failed to retrieve notifications'}), 500

@notification_bp.route('/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a specific notification as read"""
    try:
        user_id = str(get_jwt_identity())
        notification_system = get_notification_system()
        
        success = notification_system.notification_manager.mark_notification_read(
            user_id, notification_id
        )
        
        if success:
            unread_count = notification_system.notification_manager.get_unread_count(user_id)
            return jsonify({
                'success': True,
                'notification_id': notification_id,
                'unread_count': unread_count
            }), 200
        else:
            return jsonify({'error': 'Notification not found'}), 404
            
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return jsonify({'error': 'Failed to mark notification as read'}), 500

@notification_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the authenticated user"""
    try:
        user_id = str(get_jwt_identity())
        notification_system = get_notification_system()
        
        count = notification_system.notification_manager.mark_all_read(user_id)
        
        return jsonify({
            'success': True,
            'marked_read_count': count,
            'unread_count': 0
        }), 200
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        return jsonify({'error': 'Failed to mark all notifications as read'}), 500

@notification_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a specific notification"""
    try:
        user_id = str(get_jwt_identity())
        notification_system = get_notification_system()
        
        success = notification_system.notification_manager.delete_notification(
            user_id, notification_id
        )
        
        if success:
            unread_count = notification_system.notification_manager.get_unread_count(user_id)
            return jsonify({
                'success': True,
                'notification_id': notification_id,
                'unread_count': unread_count
            }), 200
        else:
            return jsonify({'error': 'Notification not found'}), 404
            
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        return jsonify({'error': 'Failed to delete notification'}), 500

@notification_bp.route('/send', methods=['POST'])
@jwt_required()
def send_notification():
    """Send a notification (admin/system use)"""
    try:
        # Check if user has admin privileges
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        if user_type not in ['admin', 'hr_recruiter', 'educator']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'type', 'title', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate notification type
        try:
            notification_type = NotificationType(data['type'])
        except ValueError:
            return jsonify({'error': 'Invalid notification type'}), 400
        
        # Validate priority
        priority = NotificationPriority.MEDIUM
        if 'priority' in data:
            try:
                priority = NotificationPriority(data['priority'])
            except ValueError:
                return jsonify({'error': 'Invalid priority level'}), 400
        
        notification_system = get_notification_system()
        
        notification_id = notification_system.send_notification(
            user_id=data['user_id'],
            notification_type=notification_type,
            title=data['title'],
            message=data['message'],
            data=data.get('data', {}),
            priority=priority
        )
        
        if notification_id:
            return jsonify({
                'success': True,
                'notification_id': notification_id,
                'message': 'Notification sent successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to send notification'}), 500
            
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        return jsonify({'error': 'Failed to send notification'}), 500

@notification_bp.route('/broadcast', methods=['POST'])
@jwt_required()
def broadcast_notification():
    """Broadcast notification to persona groups (admin only)"""
    try:
        # Check if user has admin privileges
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        if user_type != 'admin':
            return jsonify({'error': 'Admin privileges required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'title', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate notification type
        try:
            notification_type = NotificationType(data['type'])
        except ValueError:
            return jsonify({'error': 'Invalid notification type'}), 400
        
        notification_system = get_notification_system()
        persona_types = data.get('persona_types', ['job_seeker', 'hr_recruiter', 'mentor', 'educator'])
        
        # Broadcast to specified personas
        for persona_type in persona_types:
            notification_system.broadcast_to_persona(
                persona_type=persona_type,
                notification_type=notification_type,
                title=data['title'],
                message=data['message'],
                data=data.get('data', {})
            )
        
        return jsonify({
            'success': True,
            'message': f'Notification broadcasted to {len(persona_types)} persona types',
            'persona_types': persona_types
        }), 200
        
    except Exception as e:
        logger.error(f"Error broadcasting notification: {e}")
        return jsonify({'error': 'Failed to broadcast notification'}), 500

@notification_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Get notification preferences for the authenticated user"""
    try:
        user_id = str(get_jwt_identity())
        notification_system = get_notification_system()
        
        # Get preferences from Redis (with defaults)
        preferences_key = f"preferences:{user_id}"
        preferences_data = notification_system.redis_client.get(preferences_key) if notification_system.redis_client else None
        
        if preferences_data:
            import json
            preferences = json.loads(preferences_data)
        else:
            # Default preferences
            preferences = {
                'job_alerts': True,
                'application_updates': True,
                'interview_notifications': True,
                'mentoring_reminders': True,
                'educational_updates': True,
                'system_announcements': True,
                'email_notifications': True,
                'push_notifications': True,
                'quiet_hours': {
                    'enabled': False,
                    'start_time': '22:00',
                    'end_time': '08:00'
                }
            }
        
        return jsonify({
            'preferences': preferences,
            'user_id': user_id
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting notification preferences: {e}")
        return jsonify({'error': 'Failed to retrieve preferences'}), 500

@notification_bp.route('/preferences', methods=['POST'])
@jwt_required()
def update_notification_preferences():
    """Update notification preferences for the authenticated user"""
    try:
        user_id = str(get_jwt_identity())
        data = request.get_json()
        
        notification_system = get_notification_system()
        
        # Store preferences in Redis
        if notification_system.redis_client:
            import json
            preferences_key = f"preferences:{user_id}"
            notification_system.redis_client.set(
                preferences_key, 
                json.dumps(data),
                ex=365 * 24 * 60 * 60  # Expire in 1 year
            )
        
        return jsonify({
            'success': True,
            'message': 'Notification preferences updated successfully',
            'preferences': data
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating notification preferences: {e}")
        return jsonify({'error': 'Failed to update preferences'}), 500

@notification_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_notification_stats():
    """Get notification statistics for the authenticated user"""
    try:
        user_id = str(get_jwt_identity())
        notification_system = get_notification_system()
        
        # Get basic stats
        unread_count = notification_system.notification_manager.get_unread_count(user_id)
        all_notifications = notification_system.notification_manager.get_user_notifications(user_id, limit=1000)
        
        # Calculate stats
        total_notifications = len(all_notifications)
        read_count = total_notifications - unread_count
        
        # Count by type
        type_counts = {}
        for notification in all_notifications:
            notification_type = notification.get('type', 'unknown')
            type_counts[notification_type] = type_counts.get(notification_type, 0) + 1
        
        # Recent activity (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.now() - timedelta(days=7)
        recent_notifications = [
            n for n in all_notifications 
            if datetime.fromisoformat(n['created_at'].replace('Z', '+00:00')) > week_ago
        ]
        
        return jsonify({
            'total_notifications': total_notifications,
            'unread_count': unread_count,
            'read_count': read_count,
            'recent_count': len(recent_notifications),
            'type_breakdown': type_counts,
            'user_id': user_id
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting notification stats: {e}")
        return jsonify({'error': 'Failed to retrieve statistics'}), 500

# Helper endpoints for specific notification types
@notification_bp.route('/job-application-update', methods=['POST'])
@jwt_required()
def send_job_application_update():
    """Send job application status update notification"""
    try:
        claims = get_jwt()
        sender_type = claims.get('user_type', '')
        
        if sender_type not in ['hr_recruiter', 'admin']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        data = request.get_json()
        required_fields = ['user_id', 'job_title', 'company', 'status']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        notification_helpers = get_notification_helpers()
        
        notification_helpers.job_application_status_update(
            user_id=data['user_id'],
            job_title=data['job_title'],
            company=data['company'],
            status=data['status']
        )
        
        return jsonify({
            'success': True,
            'message': 'Job application update notification sent'
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending job application update: {e}")
        return jsonify({'error': 'Failed to send notification'}), 500

@notification_bp.route('/job-alert', methods=['POST'])
@jwt_required()
def send_job_alert():
    """Send new job alert notification"""
    try:
        claims = get_jwt()
        sender_type = claims.get('user_type', '')
        
        if sender_type not in ['hr_recruiter', 'admin']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        data = request.get_json()
        required_fields = ['user_id', 'job_title', 'company', 'location', 'job_id']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        notification_helpers = get_notification_helpers()
        
        notification_helpers.new_job_alert(
            user_id=data['user_id'],
            job_title=data['job_title'],
            company=data['company'],
            location=data['location'],
            job_id=data['job_id']
        )
        
        return jsonify({
            'success': True,
            'message': 'Job alert notification sent'
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending job alert: {e}")
        return jsonify({'error': 'Failed to send notification'}), 500

# Error handlers
@notification_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@notification_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@notification_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@notification_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@notification_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
