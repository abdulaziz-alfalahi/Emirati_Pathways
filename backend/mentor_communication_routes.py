"""
Mentor Communication API Routes
Flask routes for communication and messaging functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
from datetime import datetime, timedelta
from mentor_communication_system import (
    MentorCommunicationSystem, MessageType, MessageStatus, ConversationType,
    NotificationType, NotificationPriority
)
import psycopg2
from psycopg2.extras import RealDictCursor
from backend.db import get_db_connection, DB_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
mentor_communication_bp = Blueprint('mentor_communication', __name__, url_prefix='/api/mentor/communication')

def get_user_role(user_id):
    """Get user role from database"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                result = cursor.fetchone()
                return result[0] if result else None
    except Exception as e:
        logger.error(f"Error getting user role: {e}")
        return None

@mentor_communication_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Mentor Communication Service',
        'timestamp': datetime.now().isoformat()
    })

@mentor_communication_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get conversations for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can access conversations',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get query parameters
        conversation_type = request.args.get('type')
        
        # Initialize communication system and get conversations
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        conversations = comm_system.get_conversations(current_user_id, conversation_type)
        
        # Format response
        formatted_conversations = []
        for conv in conversations:
            formatted_conv = {
                'id': conv.id,
                'conversation_type': conv.conversation_type.value,
                'participants': conv.participants,
                'title': conv.title,
                'description': conv.description,
                'created_by': conv.created_by,
                'created_at': conv.created_at.isoformat(),
                'updated_at': conv.updated_at.isoformat(),
                'last_message_at': conv.last_message_at.isoformat() if conv.last_message_at else None,
                'is_active': conv.is_active,
                'metadata': conv.metadata
            }
            formatted_conversations.append(formatted_conv)
        
        return jsonify({
            'message': 'Conversations retrieved successfully',
            'conversations': formatted_conversations,
            'total': len(formatted_conversations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        return jsonify({
            'error': 'Failed to get conversations',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """Create a new conversation"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can create conversations',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Validate required fields
        required_fields = ['participants', 'conversation_type']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}',
                'code': 'MISSING_REQUIRED_FIELDS'
            }), 400
        
        # Validate conversation type
        try:
            ConversationType(data['conversation_type'])
        except ValueError:
            return jsonify({
                'error': f'Invalid conversation type: {data["conversation_type"]}',
                'code': 'INVALID_CONVERSATION_TYPE'
            }), 400
        
        # Ensure current user is in participants
        participants = data['participants']
        if current_user_id not in participants:
            participants.append(current_user_id)
        
        conversation_data = {
            'conversation_type': data['conversation_type'],
            'participants': participants,
            'title': data.get('title', ''),
            'description': data.get('description', ''),
            'created_by': current_user_id,
            'metadata': data.get('metadata', {})
        }
        
        # Initialize communication system and create conversation
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        conversation_id = comm_system.create_conversation(conversation_data)
        
        if conversation_id:
            return jsonify({
                'message': 'Conversation created successfully',
                'conversation_id': conversation_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to create conversation',
                'code': 'CONVERSATION_CREATION_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        return jsonify({
            'error': 'Failed to create conversation',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can send messages',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Validate required fields
        required_fields = ['conversation_id', 'recipient_id', 'content']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}',
                'code': 'MISSING_REQUIRED_FIELDS'
            }), 400
        
        # Validate message type
        message_type = data.get('message_type', MessageType.TEXT.value)
        try:
            MessageType(message_type)
        except ValueError:
            return jsonify({
                'error': f'Invalid message type: {message_type}',
                'code': 'INVALID_MESSAGE_TYPE'
            }), 400
        
        message_data = {
            'conversation_id': data['conversation_id'],
            'sender_id': current_user_id,
            'recipient_id': data['recipient_id'],
            'message_type': message_type,
            'content': data['content'],
            'attachments': data.get('attachments', []),
            'metadata': data.get('metadata', {}),
            'reply_to_id': data.get('reply_to_id')
        }
        
        # Initialize communication system and send message
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        message_id = comm_system.send_message(message_data)
        
        if message_id:
            return jsonify({
                'message': 'Message sent successfully',
                'message_id': message_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to send message',
                'code': 'MESSAGE_SEND_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        return jsonify({
            'error': 'Failed to send message',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/messages/<conversation_id>', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    """Get messages for a conversation"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view messages',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get query parameters
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        # Initialize communication system and get messages
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        messages = comm_system.get_messages(conversation_id, limit, offset)
        
        # Format response
        formatted_messages = []
        for msg in messages:
            formatted_msg = {
                'id': msg.id,
                'conversation_id': msg.conversation_id,
                'sender_id': msg.sender_id,
                'recipient_id': msg.recipient_id,
                'message_type': msg.message_type.value,
                'content': msg.content,
                'attachments': msg.attachments,
                'metadata': msg.metadata,
                'status': msg.status.value,
                'sent_at': msg.sent_at.isoformat(),
                'delivered_at': msg.delivered_at.isoformat() if msg.delivered_at else None,
                'read_at': msg.read_at.isoformat() if msg.read_at else None,
                'reply_to_id': msg.reply_to_id,
                'is_edited': msg.is_edited,
                'edited_at': msg.edited_at.isoformat() if msg.edited_at else None
            }
            formatted_messages.append(formatted_msg)
        
        return jsonify({
            'message': 'Messages retrieved successfully',
            'messages': formatted_messages,
            'total': len(formatted_messages),
            'conversation_id': conversation_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting messages: {e}")
        return jsonify({
            'error': 'Failed to get messages',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/messages/<message_id>/read', methods=['PUT'])
@jwt_required()
def mark_message_as_read(message_id):
    """Mark a message as read"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can mark messages as read',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize communication system and mark message as read
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        success = comm_system.mark_message_as_read(message_id, current_user_id)
        
        if success:
            return jsonify({
                'message': 'Message marked as read successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to mark message as read',
                'code': 'MARK_READ_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error marking message as read: {e}")
        return jsonify({
            'error': 'Failed to mark message as read',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/conversations/<conversation_id>/read', methods=['PUT'])
@jwt_required()
def mark_conversation_as_read(conversation_id):
    """Mark all messages in a conversation as read"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can mark conversations as read',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize communication system and mark conversation as read
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        success = comm_system.mark_conversation_as_read(conversation_id, current_user_id)
        
        if success:
            return jsonify({
                'message': 'Conversation marked as read successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to mark conversation as read',
                'code': 'MARK_READ_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error marking conversation as read: {e}")
        return jsonify({
            'error': 'Failed to mark conversation as read',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view notifications',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get query parameters
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        
        # Initialize communication system and get notifications
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        notifications = comm_system.get_notifications(current_user_id, unread_only, limit)
        
        # Format response
        formatted_notifications = []
        for notif in notifications:
            formatted_notif = {
                'id': notif.id,
                'user_id': notif.user_id,
                'notification_type': notif.notification_type.value,
                'priority': notif.priority.value,
                'title': notif.title,
                'message': notif.message,
                'data': notif.data,
                'is_read': notif.is_read,
                'created_at': notif.created_at.isoformat(),
                'read_at': notif.read_at.isoformat() if notif.read_at else None,
                'expires_at': notif.expires_at.isoformat() if notif.expires_at else None
            }
            formatted_notifications.append(formatted_notif)
        
        return jsonify({
            'message': 'Notifications retrieved successfully',
            'notifications': formatted_notifications,
            'total': len(formatted_notifications),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        return jsonify({
            'error': 'Failed to get notifications',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """Mark a notification as read"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can mark notifications as read',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize communication system and mark notification as read
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        success = comm_system.mark_notification_as_read(notification_id, current_user_id)
        
        if success:
            return jsonify({
                'message': 'Notification marked as read successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to mark notification as read',
                'code': 'MARK_READ_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return jsonify({
            'error': 'Failed to mark notification as read',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_communication_preferences():
    """Get communication preferences for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view communication preferences',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize communication system and get preferences
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        preferences = comm_system.get_communication_preferences(current_user_id)
        
        if preferences:
            formatted_preferences = {
                'user_id': preferences.user_id,
                'email_notifications': preferences.email_notifications,
                'push_notifications': preferences.push_notifications,
                'sms_notifications': preferences.sms_notifications,
                'in_app_notifications': preferences.in_app_notifications,
                'notification_frequency': preferences.notification_frequency,
                'quiet_hours_start': preferences.quiet_hours_start,
                'quiet_hours_end': preferences.quiet_hours_end,
                'preferred_language': preferences.preferred_language,
                'timezone': preferences.timezone
            }
            
            return jsonify({
                'message': 'Communication preferences retrieved successfully',
                'preferences': formatted_preferences,
                'timestamp': datetime.now().isoformat()
            })
        else:
            # Return default preferences
            return jsonify({
                'message': 'No preferences found, returning defaults',
                'preferences': {
                    'user_id': current_user_id,
                    'email_notifications': True,
                    'push_notifications': True,
                    'sms_notifications': False,
                    'in_app_notifications': True,
                    'notification_frequency': 'immediate',
                    'quiet_hours_start': '22:00',
                    'quiet_hours_end': '08:00',
                    'preferred_language': 'en',
                    'timezone': 'Asia/Dubai'
                },
                'timestamp': datetime.now().isoformat()
            })
        
    except Exception as e:
        logger.error(f"Error getting communication preferences: {e}")
        return jsonify({
            'error': 'Failed to get communication preferences',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_communication_preferences():
    """Update communication preferences for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can update communication preferences',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Initialize communication system and update preferences
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        success = comm_system.update_communication_preferences(current_user_id, data)
        
        if success:
            return jsonify({
                'message': 'Communication preferences updated successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to update communication preferences',
                'code': 'PREFERENCES_UPDATE_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error updating communication preferences: {e}")
        return jsonify({
            'error': 'Failed to update communication preferences',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/unread-counts', methods=['GET'])
@jwt_required()
def get_unread_counts():
    """Get unread message and notification counts"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view unread counts',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize communication system and get counts
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        unread_messages = comm_system.get_unread_message_count(current_user_id)
        unread_notifications = comm_system.get_unread_notification_count(current_user_id)
        
        return jsonify({
            'message': 'Unread counts retrieved successfully',
            'unread_messages': unread_messages,
            'unread_notifications': unread_notifications,
            'total_unread': unread_messages + unread_notifications,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting unread counts: {e}")
        return jsonify({
            'error': 'Failed to get unread counts',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/search', methods=['GET'])
@jwt_required()
def search_messages():
    """Search messages for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can search messages',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get query parameters
        query = request.args.get('q', '').strip()
        conversation_id = request.args.get('conversation_id')
        
        if not query:
            return jsonify({
                'error': 'Search query is required',
                'code': 'MISSING_SEARCH_QUERY'
            }), 400
        
        # Initialize communication system and search messages
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        messages = comm_system.search_messages(current_user_id, query, conversation_id)
        
        # Format response
        formatted_messages = []
        for msg in messages:
            formatted_msg = {
                'id': msg.id,
                'conversation_id': msg.conversation_id,
                'sender_id': msg.sender_id,
                'recipient_id': msg.recipient_id,
                'message_type': msg.message_type.value,
                'content': msg.content,
                'sent_at': msg.sent_at.isoformat(),
                'status': msg.status.value
            }
            formatted_messages.append(formatted_msg)
        
        return jsonify({
            'message': 'Message search completed successfully',
            'messages': formatted_messages,
            'total': len(formatted_messages),
            'query': query,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error searching messages: {e}")
        return jsonify({
            'error': 'Failed to search messages',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete a message"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can delete messages',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize communication system and delete message
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        success = comm_system.delete_message(message_id, current_user_id)
        
        if success:
            return jsonify({
                'message': 'Message deleted successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to delete message',
                'code': 'MESSAGE_DELETE_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        return jsonify({
            'error': 'Failed to delete message',
            'details': str(e)
        }), 500

@mentor_communication_bp.route('/messages/<message_id>', methods=['PUT'])
@jwt_required()
def edit_message(message_id):
    """Edit a message"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can edit messages',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({
                'error': 'New content is required',
                'code': 'MISSING_CONTENT'
            }), 400
        
        # Initialize communication system and edit message
        comm_system = MentorCommunicationSystem(DB_CONFIG)
        success = comm_system.edit_message(message_id, current_user_id, data['content'])
        
        if success:
            return jsonify({
                'message': 'Message edited successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to edit message',
                'code': 'MESSAGE_EDIT_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error editing message: {e}")
        return jsonify({
            'error': 'Failed to edit message',
            'details': str(e)
        }), 500
