"""
Mentor Session Scheduling API Routes
Flask routes for session scheduling functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
from datetime import datetime, timedelta
from mentor_session_scheduler import (
    MentorSessionScheduler, SessionRequest, SessionType, 
    MeetingPlatform, SessionStatus
)
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
mentor_session_bp = Blueprint('mentor_session', __name__, url_prefix='/api/mentor/sessions')

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def get_database_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

def get_user_role(user_id):
    """Get user role from database"""
    try:
        with get_database_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                result = cursor.fetchone()
                return result[0] if result else None
    except Exception as e:
        logger.error(f"Error getting user role: {e}")
        return None

def get_mentor_profile_id(user_id):
    """Get mentor profile ID from user ID"""
    try:
        with get_database_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM mentor_profiles WHERE user_id = %s", (user_id,))
                result = cursor.fetchone()
                return str(result[0]) if result else None
    except Exception as e:
        logger.error(f"Error getting mentor profile ID: {e}")
        return None

@mentor_session_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Mentor Session Scheduling Service',
        'timestamp': datetime.now().isoformat()
    })

@mentor_session_bp.route('/availability', methods=['POST'])
@jwt_required()
def set_availability():
    """Set mentor availability schedule"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user is a mentor
        user_role = get_user_role(current_user_id)
        if user_role != 'mentor':
            return jsonify({
                'error': 'Only mentors can set availability',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get mentor profile ID
        mentor_id = get_mentor_profile_id(current_user_id)
        if not mentor_id:
            return jsonify({
                'error': 'Mentor profile not found',
                'code': 'MENTOR_PROFILE_NOT_FOUND'
            }), 404
        
        data = request.get_json()
        if not data or 'availability_slots' not in data:
            return jsonify({
                'error': 'Availability slots are required',
                'code': 'MISSING_AVAILABILITY_SLOTS'
            }), 400
        
        availability_slots = data['availability_slots']
        
        # Validate availability slots
        for slot in availability_slots:
            required_fields = ['day_of_week', 'start_time', 'end_time']
            if not all(field in slot for field in required_fields):
                return jsonify({
                    'error': f'Missing required fields in availability slot: {required_fields}',
                    'code': 'INVALID_AVAILABILITY_SLOT'
                }), 400
        
        # Initialize scheduler and set availability
        scheduler = MentorSessionScheduler(DB_CONFIG)
        success = scheduler.set_mentor_availability(mentor_id, availability_slots)
        
        if success:
            return jsonify({
                'message': 'Availability set successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to set availability',
                'code': 'AVAILABILITY_SET_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error setting availability: {e}")
        return jsonify({
            'error': 'Failed to set availability',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    """Get mentor availability schedule"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if requesting own availability or someone else's
        mentor_user_id = request.args.get('mentor_id', current_user_id)
        
        # Get mentor profile ID
        mentor_id = get_mentor_profile_id(mentor_user_id)
        if not mentor_id:
            return jsonify({
                'error': 'Mentor profile not found',
                'code': 'MENTOR_PROFILE_NOT_FOUND'
            }), 404
        
        # Initialize scheduler and get availability
        scheduler = MentorSessionScheduler(DB_CONFIG)
        availability_slots = scheduler.get_mentor_availability(mentor_id)
        
        # Format response
        formatted_slots = []
        for slot in availability_slots:
            formatted_slot = {
                'id': slot.id,
                'day_of_week': slot.day_of_week,
                'start_time': slot.start_time,
                'end_time': slot.end_time,
                'timezone': slot.timezone,
                'is_active': slot.is_active
            }
            formatted_slots.append(formatted_slot)
        
        return jsonify({
            'message': 'Availability retrieved successfully',
            'availability_slots': formatted_slots,
            'total': len(formatted_slots),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting availability: {e}")
        return jsonify({
            'error': 'Failed to get availability',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/available-slots', methods=['GET'])
@jwt_required()
def get_available_slots():
    """Get available time slots for a mentor"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        mentor_user_id = request.args.get('mentor_id')
        if not mentor_user_id:
            return jsonify({
                'error': 'Mentor ID is required',
                'code': 'MISSING_MENTOR_ID'
            }), 400
        
        # Get date range (default to next 7 days)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        else:
            start_date = datetime.now()
        
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        else:
            end_date = start_date + timedelta(days=7)
        
        duration_minutes = int(request.args.get('duration', 45))
        
        # Get mentor profile ID
        mentor_id = get_mentor_profile_id(mentor_user_id)
        if not mentor_id:
            return jsonify({
                'error': 'Mentor profile not found',
                'code': 'MENTOR_PROFILE_NOT_FOUND'
            }), 404
        
        # Initialize scheduler and get available slots
        scheduler = MentorSessionScheduler(DB_CONFIG)
        available_slots = scheduler.get_available_time_slots(
            mentor_id, (start_date, end_date), duration_minutes
        )
        
        # Format response
        formatted_slots = []
        for slot in available_slots:
            if slot.is_available:  # Only return available slots
                formatted_slot = {
                    'start_time': slot.start_time.isoformat(),
                    'end_time': slot.end_time.isoformat(),
                    'timezone': slot.timezone,
                    'duration_minutes': duration_minutes
                }
                formatted_slots.append(formatted_slot)
        
        return jsonify({
            'message': 'Available slots retrieved successfully',
            'available_slots': formatted_slots,
            'total': len(formatted_slots),
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting available slots: {e}")
        return jsonify({
            'error': 'Failed to get available slots',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/schedule', methods=['POST'])
@jwt_required()
def schedule_session():
    """Schedule a new mentorship session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Validate required fields
        required_fields = ['mentor_id', 'session_type', 'preferred_date', 'meeting_platform']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}',
                'code': 'MISSING_REQUIRED_FIELDS'
            }), 400
        
        # Get mentor profile ID
        mentor_id = get_mentor_profile_id(data['mentor_id'])
        if not mentor_id:
            return jsonify({
                'error': 'Mentor profile not found',
                'code': 'MENTOR_PROFILE_NOT_FOUND'
            }), 404
        
        # Parse session request
        try:
            session_type = SessionType(data['session_type'])
            meeting_platform = MeetingPlatform(data['meeting_platform'])
            preferred_date = datetime.fromisoformat(data['preferred_date'].replace('Z', '+00:00'))
        except (ValueError, KeyError) as e:
            return jsonify({
                'error': f'Invalid session data: {str(e)}',
                'code': 'INVALID_SESSION_DATA'
            }), 400
        
        # Create session request
        session_request = SessionRequest(
            mentor_id=mentor_id,
            mentee_id=current_user_id,
            session_type=session_type,
            preferred_date=preferred_date,
            duration_minutes=data.get('duration_minutes', 45),
            meeting_platform=meeting_platform,
            agenda=data.get('agenda', ''),
            notes=data.get('notes', ''),
            is_recurring=data.get('is_recurring', False),
            recurrence_pattern=data.get('recurrence_pattern')
        )
        
        # Initialize scheduler and schedule session
        scheduler = MentorSessionScheduler(DB_CONFIG)
        session_id = scheduler.schedule_session(session_request)
        
        if session_id:
            # Get session details to return
            session_details = scheduler.get_session_details(session_id)
            
            return jsonify({
                'message': 'Session scheduled successfully',
                'session_id': session_id,
                'session_details': {
                    'id': session_details.id,
                    'session_type': session_details.session_type.value,
                    'scheduled_date': session_details.scheduled_date.isoformat(),
                    'duration_minutes': session_details.duration_minutes,
                    'meeting_platform': session_details.meeting_platform.value,
                    'meeting_link': session_details.meeting_link,
                    'agenda': session_details.agenda,
                    'status': session_details.status.value
                },
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to schedule session. Time slot may not be available.',
                'code': 'SCHEDULING_FAILED'
            }), 409
        
    except Exception as e:
        logger.error(f"Error scheduling session: {e}")
        return jsonify({
            'error': 'Failed to schedule session',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get sessions for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        # Get query parameters
        status_filter = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        
        # Initialize scheduler and get sessions
        scheduler = MentorSessionScheduler(DB_CONFIG)
        sessions = scheduler.get_user_sessions(current_user_id, user_role, status_filter)
        
        # Limit results
        sessions = sessions[:limit]
        
        # Format response
        formatted_sessions = []
        for session in sessions:
            formatted_session = {
                'id': session.id,
                'mentor_id': session.mentor_id,
                'mentee_user_id': session.mentee_user_id,
                'session_type': session.session_type.value,
                'scheduled_date': session.scheduled_date.isoformat(),
                'duration_minutes': session.duration_minutes,
                'meeting_platform': session.meeting_platform.value,
                'meeting_link': session.meeting_link,
                'meeting_id': session.meeting_id,
                'agenda': session.agenda,
                'status': session.status.value,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat()
            }
            formatted_sessions.append(formatted_session)
        
        return jsonify({
            'message': 'Sessions retrieved successfully',
            'sessions': formatted_sessions,
            'total': len(formatted_sessions),
            'user_role': user_role,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting sessions: {e}")
        return jsonify({
            'error': 'Failed to get sessions',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/<session_id>', methods=['GET'])
@jwt_required()
def get_session_details(session_id):
    """Get detailed session information"""
    try:
        current_user_id = get_jwt_identity()
        
        # Initialize scheduler and get session details
        scheduler = MentorSessionScheduler(DB_CONFIG)
        session = scheduler.get_session_details(session_id)
        
        if not session:
            return jsonify({
                'error': 'Session not found',
                'code': 'SESSION_NOT_FOUND'
            }), 404
        
        # Check if user has access to this session
        user_role = get_user_role(current_user_id)
        mentor_id = get_mentor_profile_id(current_user_id) if user_role == 'mentor' else None
        
        has_access = (
            (user_role == 'mentor' and session.mentor_id == mentor_id) or
            (user_role == 'job_seeker' and session.mentee_user_id == current_user_id)
        )
        
        if not has_access:
            return jsonify({
                'error': 'Access denied to this session',
                'code': 'ACCESS_DENIED'
            }), 403
        
        # Format response
        session_details = {
            'id': session.id,
            'mentor_id': session.mentor_id,
            'mentee_user_id': session.mentee_user_id,
            'session_type': session.session_type.value,
            'scheduled_date': session.scheduled_date.isoformat(),
            'duration_minutes': session.duration_minutes,
            'meeting_platform': session.meeting_platform.value,
            'meeting_link': session.meeting_link,
            'meeting_id': session.meeting_id,
            'agenda': session.agenda,
            'session_notes': session.session_notes,
            'mentor_notes': session.mentor_notes,
            'mentee_notes': session.mentee_notes,
            'status': session.status.value,
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
            'reminder_sent': session.reminder_sent,
            'feedback_collected': session.feedback_collected
        }
        
        return jsonify({
            'message': 'Session details retrieved successfully',
            'session': session_details,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting session details: {e}")
        return jsonify({
            'error': 'Failed to get session details',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/<session_id>/reschedule', methods=['PUT'])
@jwt_required()
def reschedule_session(session_id):
    """Reschedule an existing session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'new_date' not in data:
            return jsonify({
                'error': 'New date is required',
                'code': 'MISSING_NEW_DATE'
            }), 400
        
        try:
            new_date = datetime.fromisoformat(data['new_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'error': 'Invalid date format',
                'code': 'INVALID_DATE_FORMAT'
            }), 400
        
        reason = data.get('reason', '')
        
        # Initialize scheduler and reschedule session
        scheduler = MentorSessionScheduler(DB_CONFIG)
        success = scheduler.reschedule_session(session_id, new_date, reason)
        
        if success:
            return jsonify({
                'message': 'Session rescheduled successfully',
                'new_date': new_date.isoformat(),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to reschedule session. New time slot may not be available.',
                'code': 'RESCHEDULE_FAILED'
            }), 409
        
    except Exception as e:
        logger.error(f"Error rescheduling session: {e}")
        return jsonify({
            'error': 'Failed to reschedule session',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/<session_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_session(session_id):
    """Cancel a session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        reason = data.get('reason', '')
        
        # Initialize scheduler and cancel session
        scheduler = MentorSessionScheduler(DB_CONFIG)
        success = scheduler.cancel_session(session_id, reason, current_user_id)
        
        if success:
            return jsonify({
                'message': 'Session cancelled successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to cancel session',
                'code': 'CANCEL_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error cancelling session: {e}")
        return jsonify({
            'error': 'Failed to cancel session',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/<session_id>/complete', methods=['PUT'])
@jwt_required()
def complete_session(session_id):
    """Mark session as completed and add notes"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        mentor_notes = data.get('mentor_notes', '')
        mentee_notes = data.get('mentee_notes', '')
        session_summary = data.get('session_summary', '')
        
        # Initialize scheduler and complete session
        scheduler = MentorSessionScheduler(DB_CONFIG)
        success = scheduler.complete_session(session_id, mentor_notes, mentee_notes, session_summary)
        
        if success:
            return jsonify({
                'message': 'Session completed successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to complete session',
                'code': 'COMPLETE_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error completing session: {e}")
        return jsonify({
            'error': 'Failed to complete session',
            'details': str(e)
        }), 500

@mentor_session_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_session_analytics():
    """Get session analytics for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        # Initialize scheduler
        scheduler = MentorSessionScheduler(DB_CONFIG)
        
        if user_role == 'mentor':
            # Get mentor analytics
            mentor_id = get_mentor_profile_id(current_user_id)
            if mentor_id:
                analytics = scheduler.get_session_analytics(mentor_id=mentor_id)
            else:
                analytics = {}
        elif user_role == 'job_seeker':
            # Get mentee analytics
            analytics = scheduler.get_session_analytics(mentee_id=current_user_id)
        else:
            return jsonify({
                'error': 'Analytics not available for this user role',
                'code': 'INVALID_ROLE'
            }), 403
        
        return jsonify({
            'message': 'Analytics retrieved successfully',
            'analytics': analytics,
            'user_role': user_role,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        return jsonify({
            'error': 'Failed to get analytics',
            'details': str(e)
        }), 500
