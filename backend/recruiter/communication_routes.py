"""
Recruiter Communication Routes
API endpoints for sending messages to candidates
"""

from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import logging
from backend.db import get_db_connection
from datetime import datetime
import json
import uuid

from .communication_engine import (
    CommunicationEngine,
    MessageType,
    MessageStatus,
    TemplateCategory
)
from services.communication_service import communication_service, MessageType as ServiceMessageType

logger = logging.getLogger(__name__)

# Create blueprint
communication_bp = Blueprint('recruiter_communication', __name__)

# Initialize communication engine
comm_engine = CommunicationEngine()



@communication_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for communication routes"""
    return jsonify({
        'status': 'healthy',
        'service': 'Recruiter Communication API'
    }), 200


@communication_bp.route('/send', methods=['POST'])
def send_message():
    """
    Send message to candidate(s)
    
    Request body:
    {
        "shortlist_ids": ["sl_..."],  // or single shortlist_id
        "message_type": "email",  // email, sms, or both
        "subject": "Interview Invitation",
        "body": "Dear candidate...",
        "recruiter_id": "recruiter_123",
        "template_id": "template_..." (optional)
    }
    """
    try:
        data = request.get_json()
        
        shortlist_ids = data.get('shortlist_ids', [])
        if isinstance(shortlist_ids, str):
            shortlist_ids = [shortlist_ids]
        
        message_type_str = data.get('message_type', 'email')
        message_type = MessageType(message_type_str)
        
        subject = data.get('subject', '')
        body = data.get('body', '')
        recruiter_id = data.get('recruiter_id')
        
        # Validate inputs
        if not shortlist_ids or not body or not recruiter_id:
            return jsonify({
                'error': 'Missing required fields: shortlist_ids, body, recruiter_id'
            }), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        results = []
        
        # Send message to each candidate
        for shortlist_id in shortlist_ids:
            # Get candidate details from shortlist
            cur.execute("""
                SELECT * FROM candidate_shortlist
                WHERE shortlist_id = %s
            """, (shortlist_id,))
            
            shortlist_entry = cur.fetchone()
            
            if not shortlist_entry:
                results.append({
                    'shortlist_id': shortlist_id,
                    'success': False,
                    'error': 'Shortlist entry not found'
                })
                continue
            
            candidate_id = shortlist_entry['candidate_id']
            # Optional: Get candidate name for logging/results
            
            # Combine Subject and Body for Chat
            chat_content = body
            if subject:
                chat_content = f"**{subject}**\n\n{body}"

            try:
                # 1. Send Chat Message (auto-creates conversation)
                # Note: We use ServiceMessageType.TEXT for standard chat
                message = communication_service.send_message(
                    sender_id=recruiter_id,
                    recipient_id=candidate_id,
                    content=chat_content,
                    message_type=ServiceMessageType.TEXT,
                    metadata={'subject': subject, 'source': 'bulk_recruiter_message'}
                )
                
                # 2. Trigger Notification (Email/SMS via Notification System)
                # create_notification handles looking up templates and sending emails
                # For now, we simulate "New Message" notification
                
                # If message_type in request was 'sms' or 'both', we might want to ensure SMS is sent.
                # The current communication_service might rely on 'NEW_MESSAGE' notification.
                
                from services.communication_service import NotificationType
                
                communication_service.create_notification(
                    user_id=candidate_id,
                    notification_type=NotificationType.NEW_MESSAGE,
                    metadata={
                        'sender_name': 'Recruiter', # Could fetch real name if needed
                        'content_preview': body[:100] + '...',
                        'conversation_id': message.conversation_id
                    }
                )

                results.append({
                    'shortlist_id': shortlist_id,
                    'candidate_id': candidate_id,
                    'success': True,
                    'conversation_id': message.conversation_id,
                    'message_id': message.id
                })
                
            except Exception as e:
                logger.error(f"Error sending message to {candidate_id}: {e}")
                results.append({
                    'shortlist_id': shortlist_id,
                    'candidate_id': candidate_id,
                    'success': False,
                    'error': str(e)
                })
        
        cur.close()
        conn.close()
        
        success_count = sum(1 for r in results if r['success'])
        
        return jsonify({
            'success': True,
            'message': f'Messages sent to {success_count}/{len(results)} candidates',
            'results': results,
            'total': len(results),
            'successful': success_count,
            'failed': len(results) - success_count
        }), 200
        
    except Exception as e:
        import traceback
        logger.error(f"Error sending messages: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/api/recruiter/communication/history/<candidate_id>', methods=['GET'])
def get_communication_history(candidate_id):
    """
    Get communication history for a candidate
    
    Query parameters:
    - limit: Number of results (default: 50)
    - offset: Pagination offset (default: 0)
    """
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT * FROM communication_logs
            WHERE candidate_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (candidate_id, limit, offset))
        
        history = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'history': [dict(h) for h in history],
            'count': len(history)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting communication history: {e}")
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/api/recruiter/communication/templates', methods=['GET'])
def get_templates():
    """Get message templates"""
    try:
        templates = comm_engine.get_default_templates()
        
        return jsonify({
            'success': True,
            'templates': templates,
            'count': len(templates)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting templates: {e}")
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/api/recruiter/communication/templates/render', methods=['POST'])
def render_template():
    """
    Render a template with variables
    
    Request body:
    {
        "template_id": "template_...",
        "variables": {
            "candidate_name": "John Doe",
            "company_name": "Acme Corp",
            ...
        }
    }
    """
    try:
        data = request.get_json()
        
        template_id = data.get('template_id')
        variables = data.get('variables', {})
        
        if not template_id:
            return jsonify({'error': 'template_id is required'}), 400
        
        # Get template (for now, use default templates)
        templates = comm_engine.get_default_templates()
        template = next((t for t in templates if t.get('name') == template_id), None)
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Simple template rendering
        subject = template['subject']
        body = template['body']
        
        for var_name, var_value in variables.items():
            placeholder = f"{{{{{var_name}}}}}"
            subject = subject.replace(placeholder, str(var_value))
            body = body.replace(placeholder, str(var_value))
        
        return jsonify({
            'success': True,
            'subject': subject,
            'body': body
        }), 200
        
    except Exception as e:
        logger.error(f"Error rendering template: {e}")
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/api/recruiter/communication/stats/<jd_id>', methods=['GET'])
def get_communication_stats(jd_id):
    """Get communication statistics for a job description"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                COUNT(CASE WHEN message_type = 'email' THEN 1 END) as emails,
                COUNT(CASE WHEN message_type = 'sms' THEN 1 END) as sms_messages
            FROM communication_logs cl
            JOIN candidate_shortlist cs ON cl.shortlist_id = cs.shortlist_id
            WHERE cs.jd_id = %s
        """, (jd_id,))
        
        stats = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': dict(stats) if stats else {}
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting communication stats: {e}")
        return jsonify({'error': str(e)}), 500

