"""
Communication API Routes for Emirati Journey Platform
Messaging, notifications, and communication workflow endpoints
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.services.communication_service import communication_service, MessageType, NotificationType
import logging
import os
import uuid
import mimetypes
from datetime import datetime
from werkzeug.utils import secure_filename

try:
    import bleach
except ImportError:
    bleach = None  # graceful fallback

try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address, default_limits=[])
except ImportError:
    limiter = None

# Create blueprint
communication_bp = Blueprint('communication', __name__, url_prefix='/api/communication')

# Initialize logger
logger = logging.getLogger(__name__)


def _sanitize(text: str) -> str:
    """Strip all HTML tags from text to prevent XSS."""
    if bleach and text:
        return bleach.clean(text, tags=[], strip=True)
    return text or ''

@communication_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_user_conversations():
    """
    Get all conversations for the current user
    """
    try:
        current_user_id = str(get_jwt_identity())
        # FIX: Read role param from request
        role = request.args.get('role')
        
        # FIX: Pass role to service for strict filtering
        conversations = communication_service.get_user_conversations(current_user_id, role=role)
        
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

# =====================================================
# MESSAGING STATS (unread count)
# =====================================================

@communication_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_messaging_stats():
    """Return unread message count for the current user."""
    try:
        current_user_id = str(get_jwt_identity())
        # Count all unread messages across conversations where user is a participant
        conversations = communication_service.get_user_conversations(current_user_id)
        total_unread = sum(getattr(c, 'unread_count', 0) for c in conversations)
        return jsonify({
            'success': True,
            'data': {
                'unread_messages': total_unread,
            }
        }), 200
    except Exception as e:
        logger.error(f"Error getting messaging stats: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500



@communication_bp.route('/conversations/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    """
    Get a single conversation by ID
    """
    try:
        current_user_id = str(get_jwt_identity())
        
        conversation = communication_service.get_conversation(conversation_id)
        
        if not conversation:
             return jsonify({
                'success': False,
                'message': 'Conversation not found'
            }), 404

        if current_user_id not in conversation.participants:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        return jsonify({
            'success': True,
            'data': conversation.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting conversation: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve conversation'
        }), 500

@communication_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    """
    Delete (archive) a conversation for the current user
    """
    try:
        current_user_id = str(get_jwt_identity())
        
        success = communication_service.archive_conversation_for_user(conversation_id, current_user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Conversation deleted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to delete conversation or it was not found'
            }), 404
        
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete conversation'
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
        current_user_id = str(get_jwt_identity())
        data = request.get_json()
        
        # Normalize all participant IDs to strings to avoid type mismatches
        participants = [str(p) for p in data.get('participants', [])]
        if current_user_id not in participants:
            participants.append(current_user_id)
        
        application_id = data.get('application_id')
        job_id = data.get('job_id')
        title = data.get('title', 'Conversation')
        
        # FIX: Extract roles for strict separation
        participant_roles = {}
        sender_role = data.get('sender_role')
        if sender_role:
             participant_roles[current_user_id] = sender_role
             # Infer other participant's role
             if len(participants) == 2:
                  # Note: participants list includes current_user_id (added above)
                  other_ids = [p for p in participants if p != current_user_id]
                  if other_ids:
                      other_id = other_ids[0]
                      if sender_role == 'recruiter': participant_roles[other_id] = 'job_seeker'
                      elif sender_role == 'job_seeker': participant_roles[other_id] = 'recruiter'

        conversation = communication_service.create_conversation(
            participants=participants,
            application_id=application_id,
            job_id=job_id,
            title=title,
            participant_roles=participant_roles
        )
        
        return jsonify({
            'success': True,
            'data': conversation.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Failed to create conversation: {str(e)}'
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
        before = request.args.get('before', None)
        
        result = communication_service.get_conversation_messages(
            conversation_id, limit, offset, before=before
        )
        
        return jsonify({
            'success': True,
            'data': {
                'messages': [msg.to_dict() for msg in result['messages']],
                'conversation_id': conversation_id,
                'total_count': len(result['messages']),
                'has_more': result['has_more']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting conversation messages: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve messages'
        }), 500

@communication_bp.route('/conversations/<conversation_id>/messages/search', methods=['GET'])
@jwt_required()
def search_conversation_messages(conversation_id):
    """Search messages within a conversation by keyword."""
    try:
        current_user_id = str(get_jwt_identity())

        # Verify access
        conversation = communication_service.get_conversation(conversation_id)
        if not conversation or current_user_id not in conversation.participants:
            return jsonify({'success': False, 'message': 'Conversation not found or access denied'}), 404

        q = _sanitize(request.args.get('q', '')).strip()
        if not q or len(q) < 2:
            return jsonify({'success': True, 'data': {'messages': [], 'query': q}}), 200

        limit = min(int(request.args.get('limit', 50)), 100)

        conn = communication_service._get_db_connection()
        try:
            with conn.cursor(cursor_factory=__import__('psycopg2.extras', fromlist=['RealDictCursor']).RealDictCursor) as cur:
                cur.execute("""
                    SELECT m.id, m.conversation_id, m.sender_id, m.content,
                           m.message_type, m.metadata, m.status, m.created_at, m.read_at,
                           COALESCE(u.full_name, u.name, 'User') as sender_name
                    FROM messages m
                    LEFT JOIN users u ON CAST(m.sender_id AS TEXT) = CAST(u.id AS TEXT)
                    WHERE m.conversation_id = %s
                      AND m.content ILIKE %s
                    ORDER BY m.created_at DESC
                    LIMIT %s
                """, (conversation_id, f'%{q}%', limit))
                rows = cur.fetchall()
        finally:
            conn.close()

        results = []
        for row in rows:
            results.append({
                'id': str(row['id']),
                'conversation_id': row['conversation_id'],
                'sender_id': str(row['sender_id']),
                'sender_name': row.get('sender_name', 'User'),
                'content': row['content'],
                'message_type': row.get('message_type', 'text'),
                'metadata': row.get('metadata') or {},
                'status': row.get('status', 'sent'),
                'created_at': row['created_at'].isoformat() if row.get('created_at') else None,
                'read_at': row['read_at'].isoformat() if row.get('read_at') else None,
            })

        return jsonify({
            'success': True,
            'data': {'messages': results, 'query': q, 'count': len(results)}
        }), 200

    except Exception as e:
        logger.error(f"Error searching messages: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to search messages'}), 500

@communication_bp.route('/conversations/<conversation_id>/read', methods=['POST'])
@jwt_required()
def mark_conversation_as_read(conversation_id):
    """
    Mark all messages in a conversation as read
    """
    try:
        current_user_id = get_jwt_identity()
        
        success = communication_service.mark_conversation_as_read(conversation_id, current_user_id)
        
        if success:
            # Emit socket event so the sender sees ✓✓ in real-time
            try:
                from flask import current_app
                socketio = current_app.extensions.get('socketio')
                if socketio:
                    socketio.emit('message_read', {
                        'conversation_id': conversation_id,
                        'reader_id': current_user_id,
                        'all': True,
                        'read_at': datetime.utcnow().isoformat()
                    })
            except Exception as emit_err:
                logger.warning(f"Failed to emit message_read socket event: {emit_err}")

            return jsonify({
                'success': True,
                'message': 'Conversation marked as read'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to mark conversation as read'
            }), 500
        
    except Exception as e:
        logger.error(f"Error marking conversation as read: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark conversation as read'
        }), 500

@communication_bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    # Rate limiting check (10 messages/minute per user)
    try:
        current_user = str(get_jwt_identity())
        _rate_key = f"msg_send:{current_user}"
        _rate_store = getattr(communication_bp, '_rate_store', {})
        import time as _time
        now = _time.time()
        # Clean old entries
        _rate_store[_rate_key] = [t for t in _rate_store.get(_rate_key, []) if now - t < 60]
        if len(_rate_store.get(_rate_key, [])) >= 10:
            return jsonify({
                'success': False,
                'message': 'Too many messages. Please wait a moment before sending again.'
            }), 429
        _rate_store.setdefault(_rate_key, []).append(now)
        communication_bp._rate_store = _rate_store
    except Exception:
        pass  # Don't block messages if rate limiting fails
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
        current_user_id = str(get_jwt_identity())
        data = request.get_json()
        
        recipient_id = data.get('recipient_id')
        content = _sanitize(data.get('content', ''))
        message_type_str = data.get('message_type', 'text')
        conversation_id = data.get('conversation_id')
        metadata = data.get('metadata', {})
        
        # FIX: Map top-level sender_role to metadata for service inference
        if 'sender_role' in data:
            metadata['sender_role'] = data['sender_role']
        
        if not content:
            return jsonify({
                'success': False,
                'message': 'Content is required'
            }), 400

        # Create/Get conversation and determine recipient if not provided
        if not recipient_id and conversation_id:
             conversation = communication_service.get_conversation(conversation_id)
             if conversation:
                 # Find first participant that is not the sender
                 recipients = [p for p in conversation.participants if str(p) != str(current_user_id)]
                 if recipients:
                     recipient_id = recipients[0]
        
        if not recipient_id:
             return jsonify({
                'success': False,
                'message': 'Recipient ID is required (or valid Conversation ID)'
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
        
        # Create Notification for the recipient
        try:
            # Look up recipient's role for cross-role notification routing
            recipient_role = 'candidate'  # default
            try:
                conn_role = communication_service._get_db_connection()
                with conn_role.cursor() as cur:
                    cur.execute("SELECT role FROM users WHERE CAST(id AS TEXT) = %s", (str(recipient_id),))
                    row = cur.fetchone()
                    if row:
                        recipient_role = row[0] or 'candidate'
                conn_role.close()
            except Exception:
                pass

            notification = communication_service.create_notification(
                user_id=recipient_id,
                notification_type=NotificationType.NEW_MESSAGE,
                metadata={
                    'sender_name': message.sender_name or 'User',
                    'content_preview': (content[:50] + '...') if len(content) > 50 else content,
                    'conversation_id': message.conversation_id,
                    'message_id': message.id,
                    'recipient_role': recipient_role,
                }
            )
        except Exception as e:
            logger.error(f"Failed to create notification for message: {e}")
            notification = None

        # Real-time WebSocket Emission
        try:
            socketio = current_app.extensions.get('socketio')
            if socketio:
                # 1. Emit NEW MESSAGE (for chat window)
                socketio.emit('new_message', {
                    'message': message.to_dict(),
                    'conversation_id': message.conversation_id,
                    'unread_count': 1 # approximate logic
                }, room=recipient_id)
                # Emit to sender's device (for syncing multiple tabs)
                socketio.emit('new_message', {
                    'message': message.to_dict(),
                    'conversation_id': message.conversation_id
                }, room=current_user_id)
                
                # 2. Emit NOTIFICATION (for bell icon)
                if notification:
                    socketio.emit('new_notification', {
                        'notification': notification.to_dict(),
                        'unread_count': 1 # Should ideally fetch actual unread count
                    }, room=recipient_id)
                    
        except Exception as e:
            logger.warning(f"Failed to emit socket event: {e}")

        # ─── Offline notification fallback ─────────────────────
        try:
            sio = current_app.extensions.get('socketio')
            presence = getattr(sio, 'online_users', {}) if sio else {}
            recipient_online = str(recipient_id) in presence

            if not recipient_online and notification:
                # Queue for email delivery — privacy-safe: no content, no personal info
                try:
                    communication_service.create_notification(
                        user_id=recipient_id,
                        notification_type=NotificationType.NEW_MESSAGE,
                        metadata={
                            'channel': 'email',
                            'subject': 'New message on Emirati Journey',
                            'body': f'You have a new message from {message.sender_name or "a team member"} on Emirati Journey. Log in to view it.',
                            'conversation_id': message.conversation_id,
                            'offline_fallback': True,
                        }
                    )
                    logger.info(f"Queued offline email notification for user {recipient_id}")
                except Exception as email_err:
                    logger.warning(f"Failed to queue offline email notification: {email_err}")
        except Exception as e:
            logger.warning(f"Offline notification check failed: {e}")

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


# =====================================================
# NOTIFICATIONS PREFERENCES ENDPOINTS
# =====================================================

@communication_bp.route('/notifications/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Get user's notification preferences"""
    try:
        user_id = get_jwt_identity()
        
        # In a real implementation, we would fetch from DB
        # For now, return default preferences
        preferences = {
            'email_notifications': True,
            'push_notifications': True,
            'sms_notifications': False,
            'job_alerts': True,
            'application_updates': True,
            'message_notifications': True,
            'marketing_emails': False,
            'quiet_hours': {
                'enabled': False,
                'start_time': '22:00',
                'end_time': '08:00'
            }
        }
        
        return jsonify({
            'success': True,
            'status': 'success',
            'data': preferences
        })
        
    except Exception as e:
        logger.error(f"Failed to get notification preferences: {e}")
        return jsonify({
            'success': False,
            'status': 'error',
            'message': 'Failed to retrieve preferences'
        }), 500


@communication_bp.route('/notifications/preferences', methods=['POST'])
@jwt_required()
def update_notification_preferences():
    """Update user's notification preferences"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # In production, save to database
        # For now, just acknowledge the update
        
        return jsonify({
            'success': True,
            'status': 'success',
            'message': 'Preferences updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Failed to update notification preferences: {e}")
        return jsonify({
            'success': False,
            'status': 'error',
            'message': 'Failed to update preferences'
        }), 500


# =====================================================
# CANDIDATE DISCUSSION THREAD ENDPOINTS
# =====================================================

@communication_bp.route('/candidate-discussion', methods=['POST'])
@jwt_required()
def create_candidate_discussion():
    """
    Create or get existing discussion thread for a candidate.
    This allows recruiters to share and discuss candidates with team members.
    Body: {
        "candidate_id": "123",
        "job_id": "456",
        "participant_ids": ["1", "2", "3"],
        "candidate_name": "John Doe",
        "job_title": "Software Engineer"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        candidate_id = data.get('candidate_id')
        job_id = data.get('job_id')
        participant_ids = data.get('participant_ids', [])
        candidate_name = data.get('candidate_name', 'Candidate')
        job_title = data.get('job_title', 'Position')
        
        if not candidate_id or not job_id:
            return jsonify({
                'success': False,
                'error': 'candidate_id and job_id are required'
            }), 400
        
        from services.communication_service import CommunicationService
        comm_service = CommunicationService()
        
        result = comm_service.create_candidate_discussion(
            creator_id=current_user_id,
            candidate_id=candidate_id,
            job_id=job_id,
            participant_ids=participant_ids,
            candidate_name=candidate_name,
            job_title=job_title
        )
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error creating candidate discussion: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@communication_bp.route('/candidate-discussion/<conversation_id>/participants', methods=['POST'])
@jwt_required()
def add_discussion_participant(conversation_id):
    """
    Add a participant to an existing candidate discussion.
    Body: {
        "user_id": "123"
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        from services.communication_service import CommunicationService
        comm_service = CommunicationService()
        
        result = comm_service.add_participant_to_discussion(conversation_id, user_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error adding participant to discussion: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# =====================================================
# FILE UPLOAD ENDPOINT
# =====================================================

ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'zip', 'rar',
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@communication_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """
    Upload a file attachment for a message.
    Returns: { success, data: { url, filename, size, mimeType } }
    """
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'}), 400

        file = request.files['file']
        if not file.filename:
            return jsonify({'success': False, 'message': 'Empty filename'}), 400

        # Check extension
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({'success': False, 'message': f'File type .{ext} not allowed'}), 400

        # Read and check size
        file_data = file.read()
        if len(file_data) > MAX_FILE_SIZE:
            return jsonify({'success': False, 'message': 'File exceeds 10 MB limit'}), 400
        file.seek(0)

        # Save file
        upload_dir = os.path.join(current_app.root_path, '..', 'uploads', 'messages')
        os.makedirs(upload_dir, exist_ok=True)

        safe_name = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex[:12]}_{safe_name}"
        file_path = os.path.join(upload_dir, unique_name)
        file.save(file_path)

        # Determine MIME type
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'

        # Build URL (relative to the app — frontend will prefix base URL)
        file_url = f"/uploads/messages/{unique_name}"

        return jsonify({
            'success': True,
            'data': {
                'url': file_url,
                'filename': safe_name,
                'size': len(file_data),
                'mimeType': mime_type,
            }
        }), 200

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'success': False, 'message': 'File upload failed'}), 500

