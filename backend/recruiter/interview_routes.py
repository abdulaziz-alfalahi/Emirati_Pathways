"""
Interview Scheduling Routes
API endpoints for managing candidate interviews
"""

from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import logging
import os
from datetime import datetime
import json

from .interview_engine import (
    InterviewSchedulingEngine,
    InterviewType,
    InterviewStatus,
    ConfirmationStatus,
    Recommendation
)

logger = logging.getLogger(__name__)

# Create blueprint
interview_bp = Blueprint('recruiter_interviews', __name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

# Initialize interview engine
interview_engine = InterviewSchedulingEngine()


def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)


def serialize_interview(interview: dict) -> dict:
    """Serialize interview data for JSON response"""
    serialized = {}
    for key, value in interview.items():
        if value is None:
            serialized[key] = None
        elif isinstance(value, (datetime,)):
            serialized[key] = value.isoformat()
        elif hasattr(value, 'isoformat'):  # date, time objects
            serialized[key] = value.isoformat()
        elif isinstance(value, (bytes, memoryview)):
            # Skip binary data
            serialized[key] = None
        elif isinstance(value, (list, dict)):
            serialized[key] = value
        else:
            serialized[key] = str(value) if value is not None else None
    return serialized


@interview_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for interview routes"""
    return jsonify({
        'status': 'healthy',
        'service': 'Recruiter Interview Scheduling API'
    }), 200


@interview_bp.route('/create', methods=['POST'])
def create_interview():
    """
    Create a new interview
    
    Request body:
    {
        "shortlist_id": "sl_...",
        "recruiter_id": "recruiter_123",
        "interview_type": "video",
        "interview_round": 1,
        "interview_title": "Technical Interview",
        "scheduled_date": "2025-11-10",
        "scheduled_time": "14:00:00",
        "duration_minutes": 60,
        "meeting_link": "https://zoom.us/j/123456",
        "meeting_platform": "zoom",
        "location": "",
        "interviewers": [{"id": "int_001", "name": "John Doe"}],
        "notes": "Focus on Python skills",
        "internal_notes": "Candidate seems promising"
    }
    """
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        success, result, message = interview_engine.create_interview(conn, data)
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'interview_id': result,
                'message': message
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result
            }), 400
            
    except Exception as e:
        logger.error(f"Error creating interview: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/jd/<jd_id>', methods=['GET'])
def get_interviews_by_jd(jd_id):
    """
    Get all interviews for a job description
    
    Query parameters:
    - status: Filter by status (scheduled, confirmed, completed, etc.)
    - date_from: Filter by start date (YYYY-MM-DD)
    - date_to: Filter by end date (YYYY-MM-DD)
    - interview_type: Filter by interview type
    """
    try:
        filters = {'jd_id': jd_id}
        
        # Add optional filters
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('date_from'):
            filters['date_from'] = request.args.get('date_from')
        if request.args.get('date_to'):
            filters['date_to'] = request.args.get('date_to')
        if request.args.get('interview_type'):
            filters['interview_type'] = request.args.get('interview_type')
        
        conn = get_db_connection()
        interviews = interview_engine.get_interviews(conn, filters)
        conn.close()
        
        # Serialize interviews
        serialized_interviews = [serialize_interview(i) for i in interviews]
        
        return jsonify({
            'success': True,
            'interviews': serialized_interviews,
            'count': len(serialized_interviews)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interviews: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/<interview_id>', methods=['GET'])
def get_interview_details(interview_id):
    """Get detailed information about a specific interview"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT 
                i.*,
                cs.match_score as shortlist_match_score
            FROM interview_schedules i
            LEFT JOIN candidate_shortlist cs ON i.shortlist_id = cs.shortlist_id
            WHERE i.interview_id = %s
        """, (interview_id,))
        
        interview = cur.fetchone()
        conn.close()
        
        if not interview:
            return jsonify({
                'success': False,
                'error': 'Interview not found'
            }), 404
        
        return jsonify({
            'success': True,
            'interview': serialize_interview(dict(interview))
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interview details: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/<interview_id>', methods=['PUT'])
def update_interview(interview_id):
    """
    Update interview details
    
    Request body: Any fields from the interview schema
    """
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        success, message = interview_engine.update_interview(conn, interview_id, data)
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
    except Exception as e:
        logger.error(f"Error updating interview: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/<interview_id>/cancel', methods=['POST'])
def cancel_interview(interview_id):
    """
    Cancel an interview
    
    Request body:
    {
        "cancellation_reason": "Candidate withdrew application"
    }
    """
    try:
        data = request.get_json()
        reason = data.get('cancellation_reason', 'No reason provided')
        
        conn = get_db_connection()
        success, message = interview_engine.cancel_interview(conn, interview_id, reason)
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
    except Exception as e:
        logger.error(f"Error cancelling interview: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/<interview_id>/reschedule', methods=['POST'])
def reschedule_interview(interview_id):
    """
    Reschedule an interview
    
    Request body:
    {
        "scheduled_date": "2025-11-12",
        "scheduled_time": "15:00:00",
        "reason": "Recruiter unavailable"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('scheduled_date') or not data.get('scheduled_time'):
            return jsonify({
                'success': False,
                'error': 'New date and time are required'
            }), 400
        
        # Update the interview with new date/time
        updates = {
            'scheduled_date': data['scheduled_date'],
            'scheduled_time': data['scheduled_time'],
            'status': 'rescheduled'
        }
        
        if data.get('duration_minutes'):
            updates['duration_minutes'] = data['duration_minutes']
        
        conn = get_db_connection()
        success, message = interview_engine.update_interview(conn, interview_id, updates)
        
        # Log the reschedule reason
        if success and data.get('reason'):
            cur = conn.cursor()
            cur.execute("""
                UPDATE interview_schedules
                SET metadata = jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{reschedule_history}',
                    COALESCE(metadata->'reschedule_history', '[]'::jsonb) || 
                    jsonb_build_object(
                        'timestamp', %s,
                        'reason', %s,
                        'new_date', %s,
                        'new_time', %s
                    )::jsonb
                )
                WHERE interview_id = %s
            """, (
                datetime.now().isoformat(),
                data['reason'],
                data['scheduled_date'],
                data['scheduled_time'],
                interview_id
            ))
            conn.commit()
        
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Interview rescheduled successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
    except Exception as e:
        logger.error(f"Error rescheduling interview: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/<interview_id>/complete', methods=['POST'])
def complete_interview(interview_id):
    """
    Mark interview as completed and add feedback
    
    Request body:
    {
        "feedback": "Strong technical skills, good communication",
        "rating": 4,
        "recommendation": "next_round",
        "internal_notes": "Consider for senior role"
    }
    """
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        success, message = interview_engine.complete_interview(conn, interview_id, data)
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
    except Exception as e:
        logger.error(f"Error completing interview: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/<interview_id>/confirm', methods=['POST'])
def confirm_interview(interview_id):
    """
    Update interview confirmation status
    
    Request body:
    {
        "confirmation_status": "confirmed"  // or "declined"
    }
    """
    try:
        data = request.get_json()
        confirmation_status = data.get('confirmation_status')
        
        if confirmation_status not in ['confirmed', 'declined', 'pending']:
            return jsonify({
                'success': False,
                'error': 'Invalid confirmation status'
            }), 400
        
        conn = get_db_connection()
        success, message = interview_engine.update_interview(
            conn, 
            interview_id, 
            {'confirmation_status': confirmation_status}
        )
        
        # If confirmed, update status to confirmed
        if success and confirmation_status == 'confirmed':
            interview_engine.update_interview(conn, interview_id, {'status': 'confirmed'})
        
        conn.close()
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Interview {confirmation_status}'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
    except Exception as e:
        logger.error(f"Error confirming interview: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/<interview_id>/remind', methods=['POST'])
def send_interview_reminder(interview_id):
    """
    Send interview reminder to candidate
    
    This endpoint will integrate with the Communication Module
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get interview details
        cur.execute("""
            SELECT i.*
            FROM interview_schedules i
            WHERE i.interview_id = %s
        """, (interview_id,))
        
        interview = cur.fetchone()
        
        if not interview:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Interview not found'
            }), 404
        
        # TODO: Integrate with Communication Module to send reminder
        # For now, just mark as reminder sent
        cur.execute("""
            UPDATE interview_schedules
            SET reminder_sent = TRUE,
                reminder_sent_at = CURRENT_TIMESTAMP
            WHERE interview_id = %s
        """, (interview_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Reminder sent successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending reminder: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/stats/<jd_id>', methods=['GET'])
def get_interview_statistics(jd_id):
    """Get interview statistics for a job description"""
    try:
        conn = get_db_connection()
        stats = interview_engine.get_statistics(conn, jd_id)
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/shortlist/<shortlist_id>', methods=['GET'])
def get_interviews_by_shortlist(shortlist_id):
    """Get all interviews for a specific shortlisted candidate"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT * FROM interview_schedules
            WHERE shortlist_id = %s
            ORDER BY scheduled_date DESC, scheduled_time DESC
        """, (shortlist_id,))
        
        interviews = cur.fetchall()
        conn.close()
        
        serialized_interviews = [serialize_interview(dict(i)) for i in interviews]
        
        return jsonify({
            'success': True,
            'interviews': serialized_interviews,
            'count': len(serialized_interviews)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interviews for shortlist: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

