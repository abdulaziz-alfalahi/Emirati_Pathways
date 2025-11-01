"""
Recruiter Communication Routes
API endpoints for sending messages to candidates
"""

from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import logging
import os
from datetime import datetime
import json
import uuid

from .communication_engine import (
    CommunicationEngine,
    MessageType,
    MessageStatus,
    TemplateCategory
)

logger = logging.getLogger(__name__)

# Create blueprint
communication_routes = Blueprint('recruiter_communication', __name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

# Initialize communication engine
comm_engine = CommunicationEngine()


def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)


@communication_routes.route('/health', methods=['GET'])
def health_check():
    """Health check for communication routes"""
    return jsonify({
        'status': 'healthy',
        'service': 'Recruiter Communication API'
    }), 200


@communication_routes.route('/api/recruiter/communication/send', methods=['POST'])
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
        
        if not shortlist_ids or not body or not recruiter_id:
            return jsonify({
                'error': 'Missing required fields: shortlist_ids, body, recruiter_id'
            }), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Create communication_logs table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS communication_logs (
                id SERIAL PRIMARY KEY,
                log_id VARCHAR(100) UNIQUE NOT NULL,
                shortlist_id VARCHAR(100),
                candidate_id VARCHAR(100) NOT NULL,
                recruiter_id VARCHAR(100) NOT NULL,
                message_type VARCHAR(20) NOT NULL,
                subject TEXT,
                body TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                sent_at TIMESTAMP,
                delivered_at TIMESTAMP,
                error_message TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
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
            
            # Try to get user details (may not exist for test data)
            cur.execute("""
                SELECT 
                    u.first_name,
                    u.last_name,
                    u.email
                FROM users u
                WHERE u.id::text = %s
            """, (shortlist_entry['candidate_id'],))
            
            user_data = cur.fetchone()
            
            # Build candidate dict with available data
            candidate = dict(shortlist_entry)
            if user_data:
                candidate.update({
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'email': user_data['email']
                })
            else:
                # Use placeholder data for test candidates
                candidate.update({
                    'first_name': 'Test',
                    'last_name': 'Candidate',
                    'email': f"{shortlist_entry['candidate_id']}@test.com"
                })
            
            # Send message
            send_result = comm_engine.send_message(
                candidate=dict(candidate),
                message_type=message_type,
                subject=subject,
                body=body,
                recruiter_id=recruiter_id,
                shortlist_id=shortlist_id
            )
            
            # Log communication
            log_id = f"log_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
            
            status = 'sent' if send_result['success'] else 'failed'
            error_msg = ', '.join(send_result.get('errors', [])) if not send_result['success'] else None
            
            cur.execute("""
                INSERT INTO communication_logs (
                    log_id, shortlist_id, candidate_id, recruiter_id,
                    message_type, subject, body, status, sent_at, error_message, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                log_id,
                shortlist_id,
                candidate['candidate_id'],
                recruiter_id,
                message_type_str,
                subject,
                body,
                status,
                datetime.now() if send_result['success'] else None,
                error_msg,
                json.dumps(send_result)
            ))
            
            conn.commit()
            
            results.append({
                'shortlist_id': shortlist_id,
                'candidate_id': candidate['candidate_id'],
                'candidate_name': f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}".strip(),
                'success': send_result['success'],
                'log_id': log_id,
                'email_sent': send_result.get('email_result', {}).get('success', False),
                'sms_sent': send_result.get('sms_result', {}).get('success', False),
                'errors': send_result.get('errors', [])
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
        logger.error(f"Error sending messages: {e}")
        return jsonify({'error': str(e)}), 500


@communication_routes.route('/api/recruiter/communication/history/<candidate_id>', methods=['GET'])
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


@communication_routes.route('/api/recruiter/communication/templates', methods=['GET'])
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


@communication_routes.route('/api/recruiter/communication/templates/render', methods=['POST'])
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


@communication_routes.route('/api/recruiter/communication/stats/<jd_id>', methods=['GET'])
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

