"""
Communication API Routes for Emirati Journey Platform
Messaging, notifications, and communication workflow endpoints
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.communication_service import communication_service, MessageType, NotificationType
import logging
from datetime import datetime

# Create blueprint
communication_bp = Blueprint('communication', __name__, url_prefix='/api/communication')

# Initialize logger
logger = logging.getLogger(__name__)

@communication_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_user_conversations():
    """
    Get all conversations for the current user
    """
    try:
        current_user_id = get_jwt_identity()
        
        conversations = communication_service.get_user_conversations(current_user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'conversations': [conv.to_dict() for conv in conversations],
                'total_count': len(conversations)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user conversations: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve conversations'
        }), 500

@communication_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """
    Create a new conversation
    Body: {
        "participants": ["user_id_1", "user_id_2"],
        "application_id": "optional",
        "job_id": "optional",
        "title": "Conversation title"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        participants = data.get('participants', [])
        if current_user_id not in participants:
            participants.append(current_user_id)
        
        application_id = data.get('application_id')
        job_id = data.get('job_id')
        title = data.get('title', 'Conversation')
        
        conversation = communication_service.create_conversation(
            participants=participants,
            application_id=application_id,
            job_id=job_id,
            title=title
        )
        
        return jsonify({
            'success': True,
            'data': conversation.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create conversation'
        }), 500

@communication_bp.route('/conversations/<conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_conversation_messages(conversation_id):
    """
    Get messages from a conversation
    Query parameters:
    - limit: Number of messages to retrieve (default: 50)
    - offset: Offset for pagination (default: 0)
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is participant in conversation
        conversation = communication_service.get_conversation(conversation_id)
        if not conversation or current_user_id not in conversation.participants:
            return jsonify({
                'success': False,
                'message': 'Conversation not found or access denied'
            }), 404
        
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        messages = communication_service.get_conversation_messages(
            conversation_id, limit, offset
        )
        
        return jsonify({
            'success': True,
            'data': {
                'messages': [msg.to_dict() for msg in messages],
                'conversation_id': conversation_id,
                'total_count': len(messages)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting conversation messages: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve messages'
        }), 500

@communication_bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    """
    Send a message
    Body: {
        "recipient_id": "user_id",
        "content": "Message content",
        "message_type": "text|system|interview_invite|offer_letter",
        "conversation_id": "optional",
        "metadata": {}
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        recipient_id = data.get('recipient_id')
        content = data.get('content')
        message_type_str = data.get('message_type', 'text')
        conversation_id = data.get('conversation_id')
        metadata = data.get('metadata', {})
        
        if not recipient_id or not content:
            return jsonify({
                'success': False,
                'message': 'Recipient ID and content are required'
            }), 400
        
        # Convert message type string to enum
        try:
            message_type = MessageType(message_type_str)
        except ValueError:
            message_type = MessageType.TEXT
        
        message = communication_service.send_message(
            sender_id=current_user_id,
            recipient_id=recipient_id,
            content=content,
            message_type=message_type,
            conversation_id=conversation_id,
            metadata=metadata
        )
        
        return jsonify({
            'success': True,
            'data': message.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to send message'
        }), 500

@communication_bp.route('/messages/<message_id>/read', methods=['POST'])
@jwt_required()
def mark_message_as_read(message_id):
    """
    Mark a message as read
    """
    try:
        current_user_id = get_jwt_identity()
        
        success = communication_service.mark_message_as_read(message_id, current_user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Message marked as read'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Message not found or access denied'
            }), 404
        
    except Exception as e:
        logger.error(f"Error marking message as read: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark message as read'
        }), 500

@communication_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """
    Get notifications for the current user
    Query parameters:
    - limit: Number of notifications to retrieve (default: 20)
    - unread_only: Get only unread notifications (default: false)
    """
    try:
        current_user_id = get_jwt_identity()
        
        limit = int(request.args.get('limit', 20))
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        notifications = communication_service.get_user_notifications(
            current_user_id, limit, unread_only
        )
        
        return jsonify({
            'success': True,
            'data': {
                'notifications': [notif.to_dict() for notif in notifications],
                'total_count': len(notifications),
                'unread_count': len([n for n in notifications if not n.read_at])
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user notifications: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve notifications'
        }), 500

@communication_bp.route('/notifications', methods=['POST'])
@jwt_required()
def create_notification():
    """
    Create a notification (admin only)
    Body: {
        "user_id": "target_user_id",
        "notification_type": "application_submitted|interview_scheduled|etc",
        "metadata": {}
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # TODO: Add admin permission check
        
        user_id = data.get('user_id')
        notification_type_str = data.get('notification_type')
        metadata = data.get('metadata', {})
        
        if not user_id or not notification_type_str:
            return jsonify({
                'success': False,
                'message': 'User ID and notification type are required'
            }), 400
        
        try:
            notification_type = NotificationType(notification_type_str)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid notification type'
            }), 400
        
        notification = communication_service.create_notification(
            user_id=user_id,
            notification_type=notification_type,
            metadata=metadata
        )
        
        return jsonify({
            'success': True,
            'data': notification.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create notification'
        }), 500

@communication_bp.route('/notifications/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """
    Mark a notification as read
    """
    try:
        current_user_id = get_jwt_identity()
        
        success = communication_service.mark_notification_as_read(notification_id, current_user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Notification marked as read'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Notification not found or access denied'
            }), 404
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark notification as read'
        }), 500

@communication_bp.route('/notifications/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_notifications_as_read():
    """
    Mark all notifications as read for the current user
    """
    try:
        current_user_id = get_jwt_identity()
        
        notifications = communication_service.get_user_notifications(current_user_id, unread_only=True)
        marked_count = 0
        
        for notification in notifications:
            if communication_service.mark_notification_as_read(notification.id, current_user_id):
                marked_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Marked {marked_count} notifications as read'
        }), 200
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark notifications as read'
        }), 500

@communication_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_communication_stats():
    """
    Get communication statistics for the current user
    """
    try:
        current_user_id = get_jwt_identity()
        
        stats = communication_service.get_communication_stats(current_user_id)
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting communication stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve communication statistics'
        }), 500

@communication_bp.route('/admin/stats', methods=['GET'])
@jwt_required()
def get_platform_communication_stats():
    """
    Get platform-wide communication statistics (admin only)
    """
    try:
        current_user_id = get_jwt_identity()
        
        # TODO: Add admin permission check
        
        stats = communication_service.get_communication_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting platform communication stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve platform communication statistics'
        }), 500

@communication_bp.route('/workflows/application-status', methods=['POST'])
@jwt_required()
def trigger_application_status_workflow():
    """
    Trigger application status update workflow
    Body: {
        "application_id": "app_id",
        "candidate_id": "candidate_id",
        "recruiter_id": "recruiter_id",
        "new_status": "submitted|under_review|interview_scheduled|offer_made|etc",
        "job_title": "Job Title",
        "company_name": "Company Name"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # TODO: Add permission check (only recruiter or admin can trigger)
        
        application_id = data.get('application_id')
        candidate_id = data.get('candidate_id')
        recruiter_id = data.get('recruiter_id')
        new_status = data.get('new_status')
        job_title = data.get('job_title')
        company_name = data.get('company_name')
        
        if not all([application_id, candidate_id, recruiter_id, new_status, job_title, company_name]):
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400
        
        communication_service.send_application_status_update(
            application_id=application_id,
            candidate_id=candidate_id,
            recruiter_id=recruiter_id,
            new_status=new_status,
            job_title=job_title,
            company_name=company_name
        )
        
        return jsonify({
            'success': True,
            'message': 'Application status workflow triggered successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error triggering application status workflow: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to trigger application status workflow'
        }), 500

@communication_bp.route('/workflows/interview-reminder', methods=['POST'])
@jwt_required()
def schedule_interview_reminder():
    """
    Schedule interview reminder
    Body: {
        "application_id": "app_id",
        "candidate_id": "candidate_id",
        "interview_date": "2024-01-15T10:00:00Z",
        "job_title": "Job Title"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # TODO: Add permission check
        
        application_id = data.get('application_id')
        candidate_id = data.get('candidate_id')
        interview_date_str = data.get('interview_date')
        job_title = data.get('job_title')
        
        if not all([application_id, candidate_id, interview_date_str, job_title]):
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400
        
        try:
            interview_date = datetime.fromisoformat(interview_date_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid interview date format'
            }), 400
        
        communication_service.schedule_interview_reminder(
            application_id=application_id,
            candidate_id=candidate_id,
            interview_date=interview_date,
            job_title=job_title
        )
        
        return jsonify({
            'success': True,
            'message': 'Interview reminder scheduled successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error scheduling interview reminder: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to schedule interview reminder'
        }), 500

@communication_bp.route('/test/email', methods=['POST'])
@jwt_required()
def test_email_notification():
    """
    Test email notification system (admin only)
    Body: {
        "notification_type": "application_submitted",
        "metadata": {}
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # TODO: Add admin permission check
        
        notification_type_str = data.get('notification_type', 'application_submitted')
        metadata = data.get('metadata', {
            'job_title': 'Software Engineer',
            'company_name': 'Test Company'
        })
        
        try:
            notification_type = NotificationType(notification_type_str)
        except ValueError:
            notification_type = NotificationType.APPLICATION_SUBMITTED
        
        notification = communication_service.create_notification(
            user_id=current_user_id,
            notification_type=notification_type,
            metadata=metadata
        )
        
        return jsonify({
            'success': True,
            'message': 'Test notification sent successfully',
            'data': notification.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to send test email'
        }), 500

