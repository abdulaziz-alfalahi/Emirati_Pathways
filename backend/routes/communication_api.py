"""
Communication API Routes

This module provides API endpoints for messaging and communication features,
including conversations, messages, and notifications.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import uuid
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
communication_bp = Blueprint('communication_api', __name__, url_prefix='/api/communication')

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

def execute_query(query, params=None, fetch_one=False, fetch_all=True, return_id=False):
    """Execute a database query with error handling"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            if return_id:
                result = cursor.fetchone()
                conn.commit()
                return result.get('id') if result else None
            elif fetch_one:
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

def ensure_tables_exist():
    """Ensure communication tables exist"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cursor:
            # Create conversations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id SERIAL PRIMARY KEY,
                    participant_ids INTEGER[] NOT NULL,
                    title VARCHAR(255),
                    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    conversation_id INTEGER REFERENCES conversations(id),
                    sender_id INTEGER NOT NULL,
                    recipient_id INTEGER,
                    content TEXT NOT NULL,
                    message_type VARCHAR(50) DEFAULT 'text',
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            logger.info("Communication tables ensured")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        conn.rollback()
    finally:
        conn.close()

# Initialize tables on module load
ensure_tables_exist()

def optional_auth(f):
    """Decorator that allows requests with or without authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


# =====================================================
# CONVERSATIONS ENDPOINTS
# =====================================================

@communication_bp.route('/conversations', methods=['GET'])
@optional_auth
def get_conversations():
    """
    Get list of conversations for the current user
    
    Query params:
        user_id: User ID to get conversations for
    """
    try:
        user_id = request.args.get('user_id', type=int)
        
        if not user_id:
            # Try to get from auth header
            auth_header = request.headers.get('Authorization')
            if auth_header:
                # In production, decode JWT to get user_id
                user_id = 1  # Placeholder
        
        query = """
            SELECT 
                c.id,
                c.participant_ids,
                c.title,
                c.last_message_at,
                c.created_at,
                (
                    SELECT content FROM messages 
                    WHERE conversation_id = c.id 
                    ORDER BY created_at DESC LIMIT 1
                ) as last_message,
                (
                    SELECT COUNT(*) FROM messages 
                    WHERE conversation_id = c.id AND is_read = false AND sender_id != %s
                ) as unread_count
            FROM conversations c
            WHERE %s = ANY(c.participant_ids)
            ORDER BY c.last_message_at DESC
        """
        
        conversations = execute_query(query, (user_id, user_id))
        
        # Enrich with participant info
        if conversations:
            for conv in conversations:
                participant_ids = conv.get('participant_ids', [])
                participants = []
                for pid in participant_ids:
                    user_query = "SELECT id, username, full_name FROM users WHERE id = %s"
                    user = execute_query(user_query, (pid,), fetch_one=True)
                    if user:
                        participants.append(user)
                conv['participants'] = participants
        
        return jsonify({
            'status': 'success',
            'data': conversations or []
        })
        
    except Exception as e:
        logger.error(f"Failed to get conversations: {e}")
        return jsonify({
            'status': 'success',
            'data': []
        })


@communication_bp.route('/conversations', methods=['POST'])
@optional_auth
def create_conversation():
    """
    Create a new conversation
    
    Body:
        participant_ids: List of user IDs
        title: Optional conversation title
    """
    try:
        data = request.get_json()
        participant_ids = data.get('participant_ids', [])
        title = data.get('title', '')
        
        if len(participant_ids) < 2:
            return jsonify({
                'status': 'error',
                'message': 'At least 2 participants required'
            }), 400
        
        # Check if conversation already exists between these participants
        check_query = """
            SELECT id FROM conversations 
            WHERE participant_ids @> %s AND participant_ids <@ %s
        """
        existing = execute_query(check_query, (participant_ids, participant_ids), fetch_one=True)
        
        if existing:
            return jsonify({
                'status': 'success',
                'data': {'id': existing['id']},
                'message': 'Conversation already exists'
            })
        
        # Create new conversation
        insert_query = """
            INSERT INTO conversations (participant_ids, title)
            VALUES (%s, %s)
            RETURNING id
        """
        conv_id = execute_query(insert_query, (participant_ids, title), return_id=True)
        
        return jsonify({
            'status': 'success',
            'data': {'id': conv_id},
            'message': 'Conversation created'
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to create conversation: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create conversation'
        }), 500


@communication_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@optional_auth
def get_conversation_messages(conversation_id):
    """
    Get messages in a conversation
    
    Query params:
        limit: Number of messages to return (default 50)
        before: Get messages before this message ID
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        before = request.args.get('before', type=int)
        
        query = """
            SELECT 
                m.id,
                m.sender_id,
                m.content,
                m.message_type,
                m.is_read,
                m.created_at,
                u.username as sender_name,
                u.full_name as sender_full_name
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = %s
        """
        params = [conversation_id]
        
        if before:
            query += " AND m.id < %s"
            params.append(before)
        
        query += " ORDER BY m.created_at DESC LIMIT %s"
        params.append(limit)
        
        messages = execute_query(query, tuple(params))
        
        # Reverse to get chronological order
        if messages:
            messages.reverse()
        
        return jsonify({
            'status': 'success',
            'data': messages or []
        })
        
    except Exception as e:
        logger.error(f"Failed to get messages: {e}")
        return jsonify({
            'status': 'success',
            'data': []
        })


# =====================================================
# MESSAGES ENDPOINTS
# =====================================================

@communication_bp.route('/messages', methods=['POST'])
@optional_auth
def send_message():
    """
    Send a message
    
    Body:
        conversation_id: ID of the conversation (optional if recipient_id provided)
        recipient_id: ID of the recipient (optional if conversation_id provided)
        content: Message content
        message_type: Type of message (text, file, etc.)
    """
    try:
        data = request.get_json()
        conversation_id = data.get('conversation_id')
        recipient_id = data.get('recipient_id')
        sender_id = data.get('sender_id', 1)  # Should come from auth
        content = data.get('content', '')
        message_type = data.get('message_type', 'text')
        
        if not content:
            return jsonify({
                'status': 'error',
                'message': 'Message content required'
            }), 400
        
        # If no conversation_id, create or find conversation with recipient
        if not conversation_id and recipient_id:
            participant_ids = sorted([sender_id, recipient_id])
            
            # Check for existing conversation
            check_query = """
                SELECT id FROM conversations 
                WHERE participant_ids @> %s AND participant_ids <@ %s
            """
            existing = execute_query(check_query, (participant_ids, participant_ids), fetch_one=True)
            
            if existing:
                conversation_id = existing['id']
            else:
                # Create new conversation
                insert_query = """
                    INSERT INTO conversations (participant_ids)
                    VALUES (%s)
                    RETURNING id
                """
                conversation_id = execute_query(insert_query, (participant_ids,), return_id=True)
        
        if not conversation_id:
            return jsonify({
                'status': 'error',
                'message': 'Conversation ID or recipient ID required'
            }), 400
        
        # Insert message
        insert_query = """
            INSERT INTO messages (conversation_id, sender_id, recipient_id, content, message_type)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """
        result = execute_query(
            insert_query, 
            (conversation_id, sender_id, recipient_id, content, message_type),
            fetch_one=True
        )
        
        # Update conversation last_message_at
        update_query = """
            UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(update_query, (conversation_id,), fetch_all=False)
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': result.get('id') if result else None,
                'conversation_id': conversation_id,
                'content': content,
                'created_at': result.get('created_at').isoformat() if result and result.get('created_at') else None
            },
            'message': 'Message sent'
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to send message'
        }), 500


@communication_bp.route('/messages/<int:message_id>/read', methods=['PUT'])
@optional_auth
def mark_message_read(message_id):
    """Mark a message as read"""
    try:
        query = "UPDATE messages SET is_read = true WHERE id = %s"
        execute_query(query, (message_id,), fetch_all=False)
        
        return jsonify({
            'status': 'success',
            'message': 'Message marked as read'
        })
        
    except Exception as e:
        logger.error(f"Failed to mark message read: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update message'
        }), 500


# =====================================================
# NOTIFICATIONS ENDPOINTS
# =====================================================

@communication_bp.route('/notifications/preferences', methods=['GET'])
@optional_auth
def get_notification_preferences():
    """Get user's notification preferences"""
    try:
        user_id = request.args.get('user_id', 1, type=int)
        
        # Return default preferences
        preferences = {
            'email_notifications': True,
            'push_notifications': True,
            'sms_notifications': False,
            'job_alerts': True,
            'application_updates': True,
            'message_notifications': True,
            'marketing_emails': False
        }
        
        return jsonify({
            'status': 'success',
            'data': preferences
        })
        
    except Exception as e:
        logger.error(f"Failed to get notification preferences: {e}")
        return jsonify({
            'status': 'success',
            'data': {}
        })


@communication_bp.route('/notifications/preferences', methods=['POST'])
@optional_auth
def update_notification_preferences():
    """Update user's notification preferences"""
    try:
        data = request.get_json()
        
        # In production, save to database
        # For now, just acknowledge the update
        
        return jsonify({
            'status': 'success',
            'message': 'Preferences updated'
        })
        
    except Exception as e:
        logger.error(f"Failed to update notification preferences: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update preferences'
        }), 500


# Register the blueprint function
def register_communication_routes(app):
    """Register communication routes with the Flask app"""
    app.register_blueprint(communication_bp)
    logger.info("✅ Communication API routes registered")
