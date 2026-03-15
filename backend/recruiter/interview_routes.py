"""
Interview Scheduling Routes
API endpoints for managing candidate interviews
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import logging
from backend.db import get_db_connection
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

# Initialize interview engine
interview_engine = InterviewSchedulingEngine()



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


@interview_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_recruiter_interviews():
    """
    Get all interviews for the current recruiter.
    Returns interviews across all JDs with candidate names.
    """
    try:
        recruiter_id = get_jwt_identity()

        conn = get_db_connection()
        cur = conn.cursor()

        # Get all interviews where this user is the recruiter OR is listed as an interviewer/attendee
        # interviewers JSONB can store IDs as integers [121] or strings ["121"], so check both
        cur.execute("""
            SELECT i.*,
                   u.first_name as candidate_first_name,
                   u.last_name as candidate_last_name,
                   u.email as candidate_email
            FROM interview_schedules i
            LEFT JOIN users u ON CAST(i.candidate_id AS INTEGER) = u.id
            WHERE i.recruiter_id = %s
               OR (i.interviewers IS NOT NULL AND (
                   i.interviewers @> %s::jsonb 
                   OR i.interviewers @> %s::jsonb
               ))
            ORDER BY i.scheduled_date DESC, i.scheduled_time DESC
        """, (str(recruiter_id), json.dumps([int(recruiter_id)]), json.dumps([str(recruiter_id)])))

        columns = [desc[0] for desc in cur.description]
        interviews = [dict(zip(columns, row)) for row in cur.fetchall()]
        conn.close()

        serialized_interviews = [serialize_interview(i) for i in interviews]

        return jsonify({
            'success': True,
            'interviews': serialized_interviews
        }), 200

    except Exception as e:
        logger.error(f"Error fetching recruiter interviews: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@interview_bp.route('/create', methods=['POST'])
@jwt_required()
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
        
        # Override recruiter_id with authenticated user
        current_user_id = get_jwt_identity()
        if current_user_id:
            logger.info(f"Creating interview for authenticated user: {current_user_id}")
            data['recruiter_id'] = current_user_id
        
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
            logger.error(f"Create Interview Failed: {result}") # Added logging
            print(f"DEBUG: Create Interview Failed: {result}", flush=True) # Added console print
            return jsonify({
                'success': False,
                'error': result
            }), 400
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error creating interview: {str(e)}\n{error_trace}")
        
        # Write to file for debugging
        with open('error_log.txt', 'w') as f:
            f.write(error_trace)
            
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': error_trace
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
            WHERE i.interview_id = %s OR i.id::text = %s
        """, (interview_id, str(interview_id)))
        
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
            # --- Send Notification ---
            try:
                from services.communication_service import communication_service, NotificationType
                
                # Fetch interview context (New connection as previous one is closed)
                ctx_conn = get_db_connection()
                try:
                    cur = ctx_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                    # Simplified query: Get candidate_id directly from interview_schedules
                    # Use LEFT JOIN for job details to ensure we get partial data if job is missing
                    cur.execute("""
                        SELECT 
                            i.interview_title,
                            i.candidate_id,
                            COALESCE(jp.title, 'Job Opportunity') as job_title
                        FROM interview_schedules i
                        LEFT JOIN job_postings jp ON i.jd_id = jp.jd_id::text
                        WHERE i.interview_id = %s OR i.id::text = %s
                    """, (interview_id, str(interview_id)))
                    context = cur.fetchone()
                finally:
                    ctx_conn.close()

                if context:
                    communication_service.create_notification(
                        user_id=str(context['candidate_id']),
                        notification_type=NotificationType.INTERVIEW_CANCELLED,
                        metadata={
                            'interview_title': context.get('interview_title', 'Interview'),
                            'job_title': context.get('job_title', 'Job Opportunity'),
                            'reason': reason
                        }
                    )
                    logger.info(f"Cancellation notification sent for interview {interview_id}")
                else:
                    logger.warning(f"No context found for interview {interview_id} - cannot send notification")

            except Exception as notif_err:
                logger.error(f"Failed to send cancellation notification: {notif_err}")
                # Don't fail the request if notification fails
            # -------------------------

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
                WHERE interview_id = %s OR id::text = %s
            """, (
                datetime.now().isoformat(),
                data['reason'],
                data['scheduled_date'],
                data['scheduled_time'],
                interview_id,
                str(interview_id)
            ))
            conn.commit()
        
        conn.close()
        
        if success:
            # Send reschedule notification to the candidate
            try:
                from services.communication_service import communication_service, NotificationType
                
                ctx_conn = get_db_connection()
                try:
                    cur = ctx_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                    cur.execute("""
                        SELECT i.candidate_id, i.interview_title,
                               COALESCE(jp.title, 'Job Opportunity') as job_title
                        FROM interview_schedules i
                        LEFT JOIN job_postings jp ON i.jd_id = jp.jd_id::text
                        WHERE i.interview_id = %s OR i.id::text = %s
                    """, (interview_id, str(interview_id)))
                    context = cur.fetchone()
                finally:
                    ctx_conn.close()
                
                if context:
                    communication_service.create_notification(
                        user_id=str(context['candidate_id']),
                        notification_type=NotificationType.INTERVIEW_RESCHEDULED,
                        metadata={
                            'interview_title': context.get('interview_title', 'Interview'),
                            'job_title': context.get('job_title', 'Job Opportunity'),
                            'new_date': data.get('scheduled_date', ''),
                            'new_time': data.get('scheduled_time', ''),
                        }
                    )
                    logger.info("Reschedule notification sent to candidate %s" % context['candidate_id'])
            except Exception as notif_err:
                logger.error("Failed to send reschedule notification: %s" % notif_err)
            
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
            WHERE i.interview_id = %s OR i.id::text = %s
        """, (interview_id, str(interview_id)))
        
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
            WHERE interview_id = %s OR id::text = %s
        """, (interview_id, str(interview_id)))
        
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

