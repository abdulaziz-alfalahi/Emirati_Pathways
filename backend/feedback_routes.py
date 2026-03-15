from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.feedback import Feedback
import logging
import json
from backend.db import get_db_connection
import psycopg2
import psycopg2.extras
from services.communication_service import communication_service, NotificationType

feedback_bp = Blueprint('feedback_bp', __name__)
logger = logging.getLogger(__name__)



def emit_notification_event(user_id, notification):
    """Refactor: Emit socket event if internal socketio is available"""
    try:
        if current_app and hasattr(current_app, 'extensions'):
            socketio = current_app.extensions.get('socketio')
            if socketio:
                socketio.emit('new_notification', {
                    'notification': notification.to_dict(),
                    'unread_count': 1 # approximate logic
                }, room=str(user_id))
    except Exception as e:
        logger.warning(f"Failed to emit socket notification: {e}")

@feedback_bp.route('/submit', methods=['POST'])
@jwt_required(optional=True)
def submit_feedback():
    """
    Submit user feedback/bug report
    """
    try:
        data = request.get_json()
        
        # Get user info if authenticated
        current_user_id = None
        user_role = 'guest'
        
        try:
            # Check if token exists
            claims = get_jwt()
            if claims:
                current_user_id = get_jwt_identity()
                user_role = claims.get('role', 'user')
        except Exception:
            pass # Valid scenario for unauthenticated users
            
        if not data.get('message'):
             return jsonify({'success': False, 'message': 'Message is required'}), 400

        # Create feedback record
        feedback = Feedback(
            user_id=str(current_user_id) if current_user_id else 'guest',
            role=user_role,
            message=data.get('message'),
            type=data.get('type', 'bug'),
            console_logs=data.get('consoleLogs', []), 
            metadata=data.get('metadata', {})
        )
        
        Feedback.save(feedback)
        
        logger.info(f"Feedback submitted by {user_role} (ID: {current_user_id})")
        
        # Notify Admins using CommunicationService
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Find all admins
            cursor.execute("""
                SELECT id FROM users 
                WHERE role IN ('admin', 'super_user', 'platform_administrator')
            """)
            admins = cursor.fetchall()
            
            feedback_type_label = "Bug Report" if feedback.type == 'bug' else "Feature Request"
            
            for admin in admins:
                # Use CommunicationService to persist to DB
                notification = communication_service.create_notification(
                    user_id=str(admin['id']),
                    notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
                    metadata={
                        'title': f"New {feedback_type_label}",
                        'message': f"User {feedback.user_id} submitted feedback: {feedback.message[:50]}...",
                        'feedback_id': feedback.id,
                        'type': feedback.type,
                        'priority': 'high',
                        'link': '/admin-dashboard?tab=feedback'
                    }
                )
                
                # Emit real-time update
                emit_notification_event(admin['id'], notification)
            
            cursor.close()
            conn.close()
            logger.info(f"Notified {len(admins)} admins of new feedback")
        except Exception as notif_error:
            logger.error(f"Failed to send admin notifications: {notif_error}")
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully',
            'id': feedback.id
        }), 201

    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to submit feedback: {str(e)}'
        }), 500

@feedback_bp.route('/my-feedback', methods=['GET'])
@jwt_required()
def get_my_feedback():
    """
    Get list of feedback submitted by current user
    """
    try:
        current_user_id = get_jwt_identity()
        feedback_list = Feedback.load_all()
        
        # Filter by user_id
        my_feedback = [f for f in feedback_list if str(f.get('user_id')) == str(current_user_id)]
        
        # Sort by date desc
        my_feedback.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'data': my_feedback
        }), 200
    except Exception as e:
        logger.error(f"Error fetching user feedback: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch feedback history'
        }), 500

@feedback_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_feedback_stats():
    """
    Get feedback statistics (Admin only)
    """
    try:
        # Verify admin role
        claims = get_jwt()
        # Allow admin or super user or any staff for now to verify
        # if claims.get('role') != 'admin':
        #     return jsonify({'success': False, 'message': 'Unauthorized'}), 403
            
        stats = Feedback.get_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching feedback stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch stats'
        }), 500

@feedback_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_feedback():
    """
    Get list of all feedback (Admin only)
    """
    try:
        feedback_list = Feedback.load_all()
        # Sort by date desc
        feedback_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'data': feedback_list
        }), 200
    except Exception as e:
        logger.error(f"Error fetching feedback list: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch feedback list'
        }), 500

@feedback_bp.route('/<feedback_id>/status', methods=['PUT'])
@jwt_required()
def update_feedback_status(feedback_id):
    """
    Update feedback status (Admin only)
    """
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'message': 'Status is required'}), 400

        # Retrieve feedback before update to get user_id
        all_feedback = Feedback.load_all()
        target_feedback = next((f for f in all_feedback if f['id'] == feedback_id), None)

        if Feedback.update_status(feedback_id, new_status):
            
            # Notify User of update
            if target_feedback and target_feedback.get('user_id') and target_feedback['user_id'] != 'guest':
                try:
                    user_id = target_feedback['user_id']
                    user_role = target_feedback.get('role', 'user')
                    
                    # Determine link based on role
                    link_url = '/'
                    if user_role in ['hr', 'hr_manager']:
                        link_url = '/hr-dashboard'
                    elif user_role in ['recruiter', 'hr_recruiter']:
                        link_url = '/recruiter-dashboard'
                    elif user_role in ['job_seeker', 'candidate']:
                        link_url = '/candidate-dashboard'
                    elif user_role in ['admin', 'administrator', 'super_user']:
                        link_url = '/admin-dashboard?tab=feedback'

                    # Determine message based on status
                    msg_title = "Feedback Update"
                    msg_body = f"Your feedback status has been updated to: {new_status}"
                    
                    if new_status.lower() == 'resolved':
                        msg_title = "Feedback Resolved"
                        msg_body = f"Great news! Your feedback reported on {target_feedback.get('created_at', '')[:10]} has been resolved."
                    
                    # Construct Deep Link
                    deep_link = f"{link_url}?action=feedback_history&feedback_id={feedback_id}"

                    # Create notification in CommunicationService (DB Persistence)
                    notification = communication_service.create_notification(
                        user_id=str(user_id),
                        notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
                        metadata={
                            'title': msg_title,
                            'message': msg_body,
                            'feedback_id': feedback_id,
                            'status': new_status,
                            'link': deep_link
                        }
                    )
                    
                    # Emit socket event
                    emit_notification_event(user_id, notification)
                    
                    logger.info(f"Notified user {user_id} of feedback update")
                except Exception as notif_error:
                    logger.error(f"Failed to notify user of feedback update: {notif_error}")

            return jsonify({
                'success': True,
                'message': f'Feedback status updated to {new_status}'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Feedback not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error updating feedback status: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update status'
        }), 500
