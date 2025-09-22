"""
HR/Recruiter Interview Scheduling Routes
Emirati Journey Platform - Interview Scheduling System with Calendar Integration
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime, timedelta, time
import uuid
import os
import json
from typing import Dict, List, Any, Optional
import calendar

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
hr_interview_bp = Blueprint('hr_interview', __name__, url_prefix='/api/hr/interviews')

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

class InterviewScheduler:
    """Interview scheduling and calendar management system"""
    
    @staticmethod
    def find_available_slots(interviewer_id: str, start_date: datetime, end_date: datetime, 
                           duration_minutes: int = 60, working_hours: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Find available interview slots for an interviewer"""
        
        if working_hours is None:
            working_hours = {
                'start_time': '09:00',
                'end_time': '17:00',
                'working_days': [0, 1, 2, 3, 4]  # Monday to Friday
            }
        
        available_slots = []
        current_date = start_date.date()
        end_date_only = end_date.date()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            while current_date <= end_date_only:
                # Check if it's a working day
                if current_date.weekday() in working_hours['working_days']:
                    # Get existing interviews for this day
                    cursor.execute("""
                        SELECT scheduled_date, duration_minutes
                        FROM interviews
                        WHERE interviewer_id = %s 
                        AND DATE(scheduled_date) = %s
                        AND status NOT IN ('cancelled', 'rescheduled')
                        ORDER BY scheduled_date
                    """, (interviewer_id, current_date))
                    
                    existing_interviews = cursor.fetchall()
                    
                    # Generate time slots for the day
                    day_slots = InterviewScheduler._generate_day_slots(
                        current_date, working_hours, duration_minutes, existing_interviews
                    )
                    
                    available_slots.extend(day_slots)
                
                current_date += timedelta(days=1)
            
            return available_slots
            
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def _generate_day_slots(date: datetime.date, working_hours: Dict[str, Any], 
                          duration_minutes: int, existing_interviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate available time slots for a specific day"""
        
        slots = []
        
        # Parse working hours
        start_time = datetime.strptime(working_hours['start_time'], '%H:%M').time()
        end_time = datetime.strptime(working_hours['end_time'], '%H:%M').time()
        
        # Create datetime objects for the day
        current_slot = datetime.combine(date, start_time)
        day_end = datetime.combine(date, end_time)
        
        # Convert existing interviews to datetime objects for comparison
        busy_periods = []
        for interview in existing_interviews:
            interview_start = interview['scheduled_date']
            interview_end = interview_start + timedelta(minutes=interview['duration_minutes'])
            busy_periods.append((interview_start, interview_end))
        
        # Generate slots
        while current_slot + timedelta(minutes=duration_minutes) <= day_end:
            slot_end = current_slot + timedelta(minutes=duration_minutes)
            
            # Check if this slot conflicts with existing interviews
            is_available = True
            for busy_start, busy_end in busy_periods:
                if (current_slot < busy_end and slot_end > busy_start):
                    is_available = False
                    break
            
            if is_available:
                slots.append({
                    'start_time': current_slot.isoformat(),
                    'end_time': slot_end.isoformat(),
                    'duration_minutes': duration_minutes,
                    'date': date.isoformat(),
                    'day_of_week': calendar.day_name[date.weekday()],
                    'is_available': True
                })
            
            # Move to next slot (30-minute intervals)
            current_slot += timedelta(minutes=30)
        
        return slots
    
    @staticmethod
    def send_interview_notification(interview_data: Dict[str, Any], notification_type: str) -> bool:
        """Send interview notification (placeholder for email/SMS integration)"""
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Log notification in database
            cursor.execute("""
                INSERT INTO interview_notifications (
                    interview_id, notification_type, recipient_type, recipient_id,
                    message_content, delivery_status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                interview_data['id'],
                notification_type,
                'candidate',
                interview_data['candidate_id'],
                json.dumps({
                    'subject': f"Interview {notification_type.title()}",
                    'message': f"Your interview for {interview_data.get('job_title', 'position')} has been {notification_type}",
                    'interview_date': interview_data['scheduled_date'],
                    'interview_type': interview_data.get('interview_type', 'in-person')
                }),
                'pending',
                datetime.now()
            ))
            
            # Also notify interviewer
            cursor.execute("""
                INSERT INTO interview_notifications (
                    interview_id, notification_type, recipient_type, recipient_id,
                    message_content, delivery_status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                interview_data['id'],
                notification_type,
                'interviewer',
                interview_data['interviewer_id'],
                json.dumps({
                    'subject': f"Interview {notification_type.title()}",
                    'message': f"Interview with candidate has been {notification_type}",
                    'interview_date': interview_data['scheduled_date'],
                    'candidate_name': interview_data.get('candidate_name', 'Candidate')
                }),
                'pending',
                datetime.now()
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            # TODO: Integrate with actual email/SMS service
            logger.info(f"Interview notification ({notification_type}) logged for interview {interview_data['id']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send interview notification: {str(e)}")
            return False

@hr_interview_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for interview scheduling functionality"""
    return jsonify({
        'success': True,
        'message': 'HR Interview Scheduling API is operational',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Interview scheduling',
            'Calendar integration',
            'Availability management',
            'Automated notifications',
            'Interview feedback collection',
            'Rescheduling support',
            'Multi-interviewer coordination'
        ]
    })

@hr_interview_bp.route('/', methods=['GET'])
@jwt_required()
def get_interviews():
    """Get interviews for the HR user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        status = request.args.get('status', 'all')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify HR access
            cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (current_user_id,))
            hr_profile = cursor.fetchone()
            if not hr_profile:
                return jsonify({
                    'success': False,
                    'message': 'Access denied. HR profile required.'
                }), 403
            
            company_id = hr_profile['company_id']
            
            # Build query conditions
            where_conditions = ["jp.company_id = %s"]
            params = [company_id]
            
            if status != 'all':
                where_conditions.append("i.status = %s")
                params.append(status)
            
            if start_date:
                where_conditions.append("DATE(i.scheduled_date) >= %s")
                params.append(start_date)
            
            if end_date:
                where_conditions.append("DATE(i.scheduled_date) <= %s")
                params.append(end_date)
            
            where_clause = " AND ".join(where_conditions)
            
            # Get interviews
            cursor.execute(f"""
                SELECT 
                    i.*,
                    jp.title as job_title,
                    c.name as company_name,
                    u_candidate.first_name || ' ' || u_candidate.last_name as candidate_name,
                    u_candidate.email as candidate_email,
                    u_candidate.phone as candidate_phone,
                    u_interviewer.first_name || ' ' || u_interviewer.last_name as interviewer_name,
                    ja.application_status
                FROM interviews i
                LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
                LEFT JOIN companies c ON jp.company_id = c.id
                LEFT JOIN users u_candidate ON i.candidate_id = u_candidate.id
                LEFT JOIN users u_interviewer ON i.interviewer_id = u_interviewer.id
                LEFT JOIN job_applications ja ON i.application_id = ja.id
                WHERE {where_clause}
                ORDER BY i.scheduled_date ASC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            
            interviews = cursor.fetchall()
            
            # Get total count
            cursor.execute(f"""
                SELECT COUNT(DISTINCT i.id)
                FROM interviews i
                LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
                WHERE {where_clause}
            """, params)
            
            total_count = cursor.fetchone()['count']
            
            # Format interviews data
            interviews_data = []
            for interview in interviews:
                interview_data = dict(interview)
                
                # Format dates
                if interview_data.get('scheduled_date'):
                    interview_data['scheduled_date'] = interview_data['scheduled_date'].isoformat()
                if interview_data.get('created_at'):
                    interview_data['created_at'] = interview_data['created_at'].isoformat()
                
                # Parse JSONB fields
                if interview_data.get('interview_details'):
                    try:
                        if isinstance(interview_data['interview_details'], str):
                            interview_data['interview_details'] = json.loads(interview_data['interview_details'])
                    except (json.JSONDecodeError, TypeError):
                        interview_data['interview_details'] = {}
                
                interviews_data.append(interview_data)
            
            return jsonify({
                'success': True,
                'data': {
                    'interviews': interviews_data,
                    'total_count': total_count,
                    'current_page': offset // limit + 1,
                    'total_pages': (total_count + limit - 1) // limit
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting interviews: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve interviews'
        }), 500

@hr_interview_bp.route('/', methods=['POST'])
@jwt_required()
def schedule_interview():
    """Schedule a new interview"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['application_id', 'scheduled_date', 'interviewer_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify HR access and application ownership
            cursor.execute("""
                SELECT 
                    ja.*,
                    jp.title as job_title,
                    jp.company_id,
                    u.first_name || ' ' || u.last_name as candidate_name,
                    u.email as candidate_email
                FROM job_applications ja
                INNER JOIN job_postings jp ON ja.job_id = jp.id::text
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                INNER JOIN users u ON ja.user_id = u.id
                WHERE ja.id = %s AND hp.user_id = %s
            """, (data['application_id'], current_user_id))
            
            application = cursor.fetchone()
            if not application:
                return jsonify({
                    'success': False,
                    'message': 'Application not found or access denied'
                }), 404
            
            # Verify interviewer belongs to the same company
            cursor.execute("""
                SELECT id FROM hr_profiles 
                WHERE user_id = %s AND company_id = %s
            """, (data['interviewer_id'], application['company_id']))
            
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Interviewer not found in your company'
                }), 400
            
            # Parse scheduled date
            try:
                scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid scheduled_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'
                }), 400
            
            # Check if the time slot is available
            cursor.execute("""
                SELECT id FROM interviews
                WHERE interviewer_id = %s 
                AND scheduled_date = %s
                AND status NOT IN ('cancelled', 'rescheduled')
            """, (data['interviewer_id'], scheduled_date))
            
            if cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Time slot is not available for this interviewer'
                }), 409
            
            # Create interview
            interview_id = str(uuid.uuid4())
            
            interview_details = {
                'interview_type': data.get('interview_type', 'in-person'),
                'location': data.get('location', ''),
                'meeting_link': data.get('meeting_link', ''),
                'notes': data.get('notes', ''),
                'preparation_materials': data.get('preparation_materials', [])
            }
            
            cursor.execute("""
                INSERT INTO interviews (
                    id, application_id, job_posting_id, candidate_id, interviewer_id,
                    scheduled_date, duration_minutes, interview_type, status,
                    interview_details, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                interview_id,
                data['application_id'],
                application['job_id'],
                application['user_id'],
                data['interviewer_id'],
                scheduled_date,
                data.get('duration_minutes', 60),
                data.get('interview_type', 'in-person'),
                'scheduled',
                json.dumps(interview_details),
                current_user_id
            ))
            
            new_interview = cursor.fetchone()
            
            # Update application status
            cursor.execute("""
                UPDATE job_applications 
                SET application_status = 'interview_scheduled'
                WHERE id = %s
            """, (data['application_id'],))
            
            conn.commit()
            
            # Prepare notification data
            notification_data = dict(new_interview)
            notification_data.update({
                'job_title': application['job_title'],
                'candidate_name': application['candidate_name'],
                'candidate_email': application['candidate_email']
            })
            
            # Send notifications
            InterviewScheduler.send_interview_notification(notification_data, 'scheduled')
            
            # Format response
            interview_result = dict(new_interview)
            if interview_result.get('scheduled_date'):
                interview_result['scheduled_date'] = interview_result['scheduled_date'].isoformat()
            if interview_result.get('created_at'):
                interview_result['created_at'] = interview_result['created_at'].isoformat()
            
            # Parse interview details
            if interview_result.get('interview_details'):
                try:
                    if isinstance(interview_result['interview_details'], str):
                        interview_result['interview_details'] = json.loads(interview_result['interview_details'])
                except (json.JSONDecodeError, TypeError):
                    interview_result['interview_details'] = {}
            
            return jsonify({
                'success': True,
                'message': 'Interview scheduled successfully',
                'data': interview_result
            }), 201
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error scheduling interview: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to schedule interview'
        }), 500

@hr_interview_bp.route('/<interview_id>', methods=['GET'])
@jwt_required()
def get_interview_details(interview_id):
    """Get detailed interview information"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get interview with company verification
            cursor.execute("""
                SELECT 
                    i.*,
                    jp.title as job_title,
                    c.name as company_name,
                    u_candidate.first_name || ' ' || u_candidate.last_name as candidate_name,
                    u_candidate.email as candidate_email,
                    u_candidate.phone as candidate_phone,
                    u_interviewer.first_name || ' ' || u_interviewer.last_name as interviewer_name,
                    u_interviewer.email as interviewer_email,
                    ja.application_status,
                    u_created.first_name || ' ' || u_created.last_name as created_by_name
                FROM interviews i
                LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
                LEFT JOIN companies c ON jp.company_id = c.id
                LEFT JOIN hr_profiles hp ON jp.company_id = hp.company_id
                LEFT JOIN users u_candidate ON i.candidate_id = u_candidate.id
                LEFT JOIN users u_interviewer ON i.interviewer_id = u_interviewer.id
                LEFT JOIN users u_created ON i.created_by = u_created.id
                LEFT JOIN job_applications ja ON i.application_id = ja.id
                WHERE i.id = %s AND hp.user_id = %s
            """, (interview_id, current_user_id))
            
            interview = cursor.fetchone()
            
            if not interview:
                return jsonify({
                    'success': False,
                    'message': 'Interview not found or access denied'
                }), 404
            
            interview_data = dict(interview)
            
            # Format dates
            if interview_data.get('scheduled_date'):
                interview_data['scheduled_date'] = interview_data['scheduled_date'].isoformat()
            if interview_data.get('created_at'):
                interview_data['created_at'] = interview_data['created_at'].isoformat()
            
            # Parse JSONB fields
            if interview_data.get('interview_details'):
                try:
                    if isinstance(interview_data['interview_details'], str):
                        interview_data['interview_details'] = json.loads(interview_data['interview_details'])
                except (json.JSONDecodeError, TypeError):
                    interview_data['interview_details'] = {}
            
            # Get interview feedback
            cursor.execute("""
                SELECT 
                    if_.*,
                    u.first_name || ' ' || u.last_name as feedback_by_name
                FROM interview_feedback if_
                LEFT JOIN users u ON if_.feedback_by = u.id
                WHERE if_.interview_id = %s
                ORDER BY if_.created_at DESC
            """, (interview_id,))
            
            feedback_records = cursor.fetchall()
            feedback_data = []
            
            for feedback in feedback_records:
                feedback_item = dict(feedback)
                
                # Format dates
                if feedback_item.get('created_at'):
                    feedback_item['created_at'] = feedback_item['created_at'].isoformat()
                
                # Parse JSONB fields
                jsonb_fields = ['technical_assessment', 'soft_skills_assessment', 'overall_notes']
                for field in jsonb_fields:
                    if feedback_item.get(field):
                        try:
                            if isinstance(feedback_item[field], str):
                                feedback_item[field] = json.loads(feedback_item[field])
                        except (json.JSONDecodeError, TypeError):
                            feedback_item[field] = {}
                
                feedback_data.append(feedback_item)
            
            interview_data['feedback'] = feedback_data
            
            return jsonify({
                'success': True,
                'data': interview_data
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting interview details: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve interview details'
        }), 500

@hr_interview_bp.route('/<interview_id>/reschedule', methods=['POST'])
@jwt_required()
def reschedule_interview(interview_id):
    """Reschedule an existing interview"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('new_scheduled_date'):
            return jsonify({
                'success': False,
                'message': 'Missing required field: new_scheduled_date'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify interview ownership
            cursor.execute("""
                SELECT 
                    i.*,
                    jp.title as job_title,
                    u.first_name || ' ' || u.last_name as candidate_name
                FROM interviews i
                LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
                LEFT JOIN hr_profiles hp ON jp.company_id = hp.company_id
                LEFT JOIN users u ON i.candidate_id = u.id
                WHERE i.id = %s AND hp.user_id = %s
            """, (interview_id, current_user_id))
            
            interview = cursor.fetchone()
            if not interview:
                return jsonify({
                    'success': False,
                    'message': 'Interview not found or access denied'
                }), 404
            
            # Parse new scheduled date
            try:
                new_scheduled_date = datetime.fromisoformat(data['new_scheduled_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid new_scheduled_date format. Use ISO format'
                }), 400
            
            # Check if the new time slot is available
            cursor.execute("""
                SELECT id FROM interviews
                WHERE interviewer_id = %s 
                AND scheduled_date = %s
                AND id != %s
                AND status NOT IN ('cancelled', 'rescheduled')
            """, (interview['interviewer_id'], new_scheduled_date, interview_id))
            
            if cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'New time slot is not available for this interviewer'
                }), 409
            
            # Update interview
            cursor.execute("""
                UPDATE interviews 
                SET scheduled_date = %s,
                    status = 'rescheduled',
                    reschedule_reason = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (
                new_scheduled_date,
                data.get('reschedule_reason', 'Rescheduled by HR'),
                interview_id
            ))
            
            updated_interview = cursor.fetchone()
            conn.commit()
            
            # Send notifications
            notification_data = dict(updated_interview)
            notification_data.update({
                'job_title': interview['job_title'],
                'candidate_name': interview['candidate_name']
            })
            
            InterviewScheduler.send_interview_notification(notification_data, 'rescheduled')
            
            # Format response
            interview_result = dict(updated_interview)
            if interview_result.get('scheduled_date'):
                interview_result['scheduled_date'] = interview_result['scheduled_date'].isoformat()
            
            return jsonify({
                'success': True,
                'message': 'Interview rescheduled successfully',
                'data': interview_result
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error rescheduling interview: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to reschedule interview'
        }), 500

@hr_interview_bp.route('/<interview_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_interview(interview_id):
    """Cancel an interview"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify interview ownership
            cursor.execute("""
                SELECT 
                    i.*,
                    jp.title as job_title,
                    u.first_name || ' ' || u.last_name as candidate_name
                FROM interviews i
                LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
                LEFT JOIN hr_profiles hp ON jp.company_id = hp.company_id
                LEFT JOIN users u ON i.candidate_id = u.id
                WHERE i.id = %s AND hp.user_id = %s
            """, (interview_id, current_user_id))
            
            interview = cursor.fetchone()
            if not interview:
                return jsonify({
                    'success': False,
                    'message': 'Interview not found or access denied'
                }), 404
            
            # Update interview status
            cursor.execute("""
                UPDATE interviews 
                SET status = 'cancelled',
                    cancellation_reason = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (
                data.get('cancellation_reason', 'Cancelled by HR'),
                interview_id
            ))
            
            updated_interview = cursor.fetchone()
            
            # Update application status back to under review
            cursor.execute("""
                UPDATE job_applications 
                SET application_status = 'under_review'
                WHERE id = %s
            """, (interview['application_id'],))
            
            conn.commit()
            
            # Send notifications
            notification_data = dict(updated_interview)
            notification_data.update({
                'job_title': interview['job_title'],
                'candidate_name': interview['candidate_name']
            })
            
            InterviewScheduler.send_interview_notification(notification_data, 'cancelled')
            
            return jsonify({
                'success': True,
                'message': 'Interview cancelled successfully',
                'data': dict(updated_interview)
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error cancelling interview: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to cancel interview'
        }), 500

@hr_interview_bp.route('/availability/<interviewer_id>', methods=['GET'])
@jwt_required()
def get_interviewer_availability(interviewer_id):
    """Get available time slots for an interviewer"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        start_date_str = request.args.get('start_date', datetime.now().strftime('%Y-%m-%d'))
        end_date_str = request.args.get('end_date', (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'))
        duration_minutes = int(request.args.get('duration_minutes', 60))
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid date format. Use YYYY-MM-DD'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify HR access and interviewer belongs to company
            cursor.execute("""
                SELECT hp1.company_id
                FROM hr_profiles hp1
                INNER JOIN hr_profiles hp2 ON hp1.company_id = hp2.company_id
                WHERE hp1.user_id = %s AND hp2.user_id = %s
            """, (current_user_id, interviewer_id))
            
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Interviewer not found in your company'
                }), 404
            
            # Get interviewer's working hours (default if not set)
            working_hours = {
                'start_time': '09:00',
                'end_time': '17:00',
                'working_days': [0, 1, 2, 3, 4]  # Monday to Friday
            }
            
            # Find available slots
            available_slots = InterviewScheduler.find_available_slots(
                interviewer_id, start_date, end_date, duration_minutes, working_hours
            )
            
            return jsonify({
                'success': True,
                'data': {
                    'interviewer_id': interviewer_id,
                    'date_range': {
                        'start_date': start_date_str,
                        'end_date': end_date_str
                    },
                    'duration_minutes': duration_minutes,
                    'available_slots': available_slots,
                    'total_slots': len(available_slots),
                    'working_hours': working_hours
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting interviewer availability: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve interviewer availability'
        }), 500

@hr_interview_bp.route('/<interview_id>/feedback', methods=['POST'])
@jwt_required()
def submit_interview_feedback(interview_id):
    """Submit feedback for an interview"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify interview access
            cursor.execute("""
                SELECT i.id
                FROM interviews i
                LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
                LEFT JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE i.id = %s AND (hp.user_id = %s OR i.interviewer_id = %s)
            """, (interview_id, current_user_id, current_user_id))
            
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Interview not found or access denied'
                }), 404
            
            # Create feedback record
            feedback_id = str(uuid.uuid4())
            
            cursor.execute("""
                INSERT INTO interview_feedback (
                    id, interview_id, feedback_by, overall_rating, technical_assessment,
                    soft_skills_assessment, cultural_fit_rating, recommendation,
                    overall_notes, strengths, areas_for_improvement
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                feedback_id,
                interview_id,
                current_user_id,
                data.get('overall_rating'),
                json.dumps(data.get('technical_assessment', {})),
                json.dumps(data.get('soft_skills_assessment', {})),
                data.get('cultural_fit_rating'),
                data.get('recommendation'),
                data.get('overall_notes'),
                data.get('strengths'),
                data.get('areas_for_improvement')
            ))
            
            feedback_result = cursor.fetchone()
            
            # Update interview status
            cursor.execute("""
                UPDATE interviews 
                SET status = 'completed',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (interview_id,))
            
            conn.commit()
            
            # Format response
            feedback_data = dict(feedback_result)
            if feedback_data.get('created_at'):
                feedback_data['created_at'] = feedback_data['created_at'].isoformat()
            
            # Parse JSONB fields
            jsonb_fields = ['technical_assessment', 'soft_skills_assessment']
            for field in jsonb_fields:
                if feedback_data.get(field):
                    try:
                        if isinstance(feedback_data[field], str):
                            feedback_data[field] = json.loads(feedback_data[field])
                    except (json.JSONDecodeError, TypeError):
                        feedback_data[field] = {}
            
            return jsonify({
                'success': True,
                'message': 'Interview feedback submitted successfully',
                'data': feedback_data
            }), 201
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error submitting interview feedback: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to submit interview feedback'
        }), 500

@hr_interview_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_interview_calendar():
    """Get interview calendar view"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        start_date = request.args.get('start_date', datetime.now().strftime('%Y-%m-%d'))
        end_date = request.args.get('end_date', (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'))
        view_type = request.args.get('view', 'month')  # month, week, day
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get company interviews
            cursor.execute("""
                SELECT 
                    i.*,
                    jp.title as job_title,
                    u_candidate.first_name || ' ' || u_candidate.last_name as candidate_name,
                    u_interviewer.first_name || ' ' || u_interviewer.last_name as interviewer_name
                FROM interviews i
                LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
                LEFT JOIN hr_profiles hp ON jp.company_id = hp.company_id
                LEFT JOIN users u_candidate ON i.candidate_id = u_candidate.id
                LEFT JOIN users u_interviewer ON i.interviewer_id = u_interviewer.id
                WHERE hp.user_id = %s
                AND DATE(i.scheduled_date) BETWEEN %s AND %s
                AND i.status NOT IN ('cancelled')
                ORDER BY i.scheduled_date ASC
            """, (current_user_id, start_date, end_date))
            
            interviews = cursor.fetchall()
            
            # Format calendar events
            calendar_events = []
            for interview in interviews:
                event = {
                    'id': interview['id'],
                    'title': f"Interview: {interview['candidate_name']}",
                    'start': interview['scheduled_date'].isoformat(),
                    'end': (interview['scheduled_date'] + timedelta(minutes=interview['duration_minutes'])).isoformat(),
                    'job_title': interview['job_title'],
                    'candidate_name': interview['candidate_name'],
                    'interviewer_name': interview['interviewer_name'],
                    'status': interview['status'],
                    'interview_type': interview['interview_type'],
                    'duration_minutes': interview['duration_minutes']
                }
                calendar_events.append(event)
            
            return jsonify({
                'success': True,
                'data': {
                    'events': calendar_events,
                    'date_range': {
                        'start_date': start_date,
                        'end_date': end_date
                    },
                    'view_type': view_type,
                    'total_interviews': len(calendar_events)
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting interview calendar: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve interview calendar'
        }), 500
