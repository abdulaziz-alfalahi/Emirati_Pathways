"""
Mentor Matching API Routes
Flask routes for mentor-mentee matching functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
from datetime import datetime
from mentor_matching_engine import MentorMatchingEngine
import psycopg2
from psycopg2.extras import RealDictCursor
from backend.db import get_db_connection, DB_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
mentor_matching_bp = Blueprint('mentor_matching', __name__, url_prefix='/api/mentor/matching')

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

@mentor_matching_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Mentor Matching Service',
        'timestamp': datetime.now().isoformat()
    })

@mentor_matching_bp.route('/find-mentors', methods=['POST'])
@jwt_required()
def find_mentors():
    """Find mentor matches for a mentee"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user is a candidate/mentee
        user_role = get_user_role(current_user_id)
        if user_role != 'job_seeker':
            return jsonify({
                'error': 'Only candidates can search for mentors',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get request parameters
        data = request.get_json() or {}
        limit = data.get('limit', 10)
        
        # Initialize matching engine
        matching_engine = MentorMatchingEngine(DB_CONFIG)
        
        # Find mentor matches
        matches = matching_engine.find_mentor_matches(current_user_id, limit)
        
        if not matches:
            return jsonify({
                'message': 'No mentor matches found',
                'matches': [],
                'total': 0
            })
        
        # Format response
        formatted_matches = []
        for match in matches:
            # Get mentor details
            mentor_details = get_mentor_details(match.mentor_id)
            
            formatted_match = {
                'mentor_id': match.mentor_id,
                'mentor_details': mentor_details,
                'match_score': round(match.overall_score, 3),
                'confidence_level': match.confidence_level,
                'match_breakdown': {
                    'industry_alignment': round(match.industry_score, 3),
                    'skill_compatibility': round(match.skill_score, 3),
                    'experience_gap': round(match.experience_score, 3),
                    'location_proximity': round(match.location_score, 3),
                    'language_compatibility': round(match.language_score, 3),
                    'availability_alignment': round(match.availability_score, 3),
                    'personality_compatibility': round(match.personality_score, 3),
                    'goals_alignment': round(match.goals_score, 3)
                },
                'match_reasons': match.match_reasons
            }
            formatted_matches.append(formatted_match)
            
            # Save match result to database
            matching_engine.save_match_result(match)
        
        return jsonify({
            'message': 'Mentor matches found successfully',
            'matches': formatted_matches,
            'total': len(formatted_matches),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error finding mentors: {e}")
        return jsonify({
            'error': 'Failed to find mentor matches',
            'details': str(e)
        }), 500

@mentor_matching_bp.route('/find-mentees', methods=['POST'])
@jwt_required()
def find_mentees():
    """Find potential mentees for a mentor"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user is a mentor
        user_role = get_user_role(current_user_id)
        if user_role != 'mentor':
            return jsonify({
                'error': 'Only mentors can search for mentees',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get request parameters
        data = request.get_json() or {}
        limit = data.get('limit', 10)
        
        # Get potential mentees from database
        mentees = get_potential_mentees(current_user_id, limit)
        
        return jsonify({
            'message': 'Potential mentees found successfully',
            'mentees': mentees,
            'total': len(mentees),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error finding mentees: {e}")
        return jsonify({
            'error': 'Failed to find potential mentees',
            'details': str(e)
        }), 500

@mentor_matching_bp.route('/send-request', methods=['POST'])
@jwt_required()
def send_mentoring_request():
    """Send a mentoring request"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'target_user_id' not in data:
            return jsonify({
                'error': 'Target user ID is required',
                'code': 'MISSING_TARGET_USER'
            }), 400
        
        target_user_id = data['target_user_id']
        message = data.get('message', '')
        request_type = data.get('type', 'mentoring')  # 'mentoring' or 'mentee'
        
        # Validate request type and user roles
        current_user_role = get_user_role(current_user_id)
        target_user_role = get_user_role(target_user_id)
        
        if request_type == 'mentoring':
            # Candidate requesting mentoring from mentor
            if current_user_role != 'job_seeker' or target_user_role != 'mentor':
                return jsonify({
                    'error': 'Invalid request: candidate can only request mentoring from mentors',
                    'code': 'INVALID_REQUEST_TYPE'
                }), 400
        elif request_type == 'mentee':
            # Mentor requesting to mentor a candidate
            if current_user_role != 'mentor' or target_user_role != 'job_seeker':
                return jsonify({
                    'error': 'Invalid request: mentor can only request to mentor candidates',
                    'code': 'INVALID_REQUEST_TYPE'
                }), 400
        
        # Check if request already exists
        existing_request = check_existing_request(current_user_id, target_user_id)
        if existing_request:
            return jsonify({
                'error': 'Request already exists',
                'code': 'REQUEST_EXISTS',
                'existing_request': existing_request
            }), 409
        
        # Create mentoring request
        request_id = create_mentoring_request(current_user_id, target_user_id, message, request_type)
        
        if request_id:
            return jsonify({
                'message': 'Mentoring request sent successfully',
                'request_id': request_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to send mentoring request',
                'code': 'REQUEST_CREATION_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error sending mentoring request: {e}")
        return jsonify({
            'error': 'Failed to send mentoring request',
            'details': str(e)
        }), 500

@mentor_matching_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_mentoring_requests():
    """Get mentoring requests for current user"""
    try:
        current_user_id = get_jwt_identity()
        request_type = request.args.get('type', 'all')  # 'sent', 'received', 'all'
        status = request.args.get('status', 'all')  # 'pending', 'accepted', 'rejected', 'all'
        
        requests = get_user_mentoring_requests(current_user_id, request_type, status)
        
        return jsonify({
            'message': 'Mentoring requests retrieved successfully',
            'requests': requests,
            'total': len(requests),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting mentoring requests: {e}")
        return jsonify({
            'error': 'Failed to get mentoring requests',
            'details': str(e)
        }), 500

@mentor_matching_bp.route('/requests/<request_id>/respond', methods=['PUT'])
@jwt_required()
def respond_to_request(request_id):
    """Respond to a mentoring request"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'response' not in data:
            return jsonify({
                'error': 'Response is required',
                'code': 'MISSING_RESPONSE'
            }), 400
        
        response = data['response']  # 'accept' or 'reject'
        message = data.get('message', '')
        
        if response not in ['accept', 'reject']:
            return jsonify({
                'error': 'Invalid response. Must be "accept" or "reject"',
                'code': 'INVALID_RESPONSE'
            }), 400
        
        # Update request status
        success = update_request_status(request_id, current_user_id, response, message)
        
        if success:
            # If accepted, create mentorship relationship
            if response == 'accept':
                create_mentorship_relationship(request_id)
            
            return jsonify({
                'message': f'Request {response}ed successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to respond to request',
                'code': 'RESPONSE_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error responding to request: {e}")
        return jsonify({
            'error': 'Failed to respond to request',
            'details': str(e)
        }), 500

@mentor_matching_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_matching_analytics():
    """Get matching analytics for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        # Initialize matching engine
        matching_engine = MentorMatchingEngine(DB_CONFIG)
        
        if user_role == 'mentor':
            # Get mentor analytics
            mentor_profile = get_mentor_profile_by_user_id(current_user_id)
            if mentor_profile:
                analytics = matching_engine.get_match_analytics(mentor_id=mentor_profile['id'])
            else:
                analytics = {}
        elif user_role == 'job_seeker':
            # Get mentee analytics
            analytics = matching_engine.get_match_analytics(mentee_id=current_user_id)
        else:
            return jsonify({
                'error': 'Analytics not available for this user role',
                'code': 'INVALID_ROLE'
            }), 403
        
        return jsonify({
            'message': 'Analytics retrieved successfully',
            'analytics': analytics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        return jsonify({
            'error': 'Failed to get analytics',
            'details': str(e)
        }), 500

# Helper functions

def get_mentor_details(mentor_id):
    """Get mentor details from database"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT mp.*, u.full_name, u.email, u.emirate
                    FROM mentor_profiles mp
                    JOIN users u ON mp.user_id = u.id
                    WHERE mp.id = %s
                """, (mentor_id,))
                
                result = cursor.fetchone()
                if result:
                    return {
                        'id': str(result['id']),
                        'name': result['full_name'],
                        'industry': result.get('industry', ''),
                        'expertise_areas': result.get('expertise_areas', []),
                        'years_of_experience': result.get('years_of_experience', 0),
                        'rating': float(result.get('rating', 0)),
                        'hourly_rate': float(result.get('hourly_rate', 0)),
                        'location': result.get('emirate', ''),
                        'bio': result.get('bio', ''),
                        'is_verified': result.get('is_verified', False)
                    }
                return None
                
    except Exception as e:
        logger.error(f"Error getting mentor details: {e}")
        return None

def get_potential_mentees(mentor_user_id, limit):
    """Get potential mentees for a mentor"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT cp.*, u.full_name, u.email, u.emirate
                    FROM candidate_profiles cp
                    JOIN users u ON cp.user_id = u.id
                    WHERE u.role = 'job_seeker'
                    AND cp.user_id NOT IN (
                        SELECT mentee_user_id FROM mentorship_matching 
                        WHERE mentor_id = (
                            SELECT id FROM mentor_profiles WHERE user_id = %s
                        ) AND match_status = 'active'
                    )
                    ORDER BY cp.created_at DESC
                    LIMIT %s
                """, (mentor_user_id, limit))
                
                mentees = []
                for row in cursor.fetchall():
                    mentee = {
                        'id': str(row['id']),
                        'user_id': str(row['user_id']),
                        'name': row['full_name'],
                        'current_role': row.get('current_role', ''),
                        'target_role': row.get('preferred_job_title', ''),
                        'experience_years': row.get('experience_years', 0),
                        'skills': row.get('skills', []),
                        'location': row.get('emirate', ''),
                        'career_goals': row.get('career_goals', [])
                    }
                    mentees.append(mentee)
                
                return mentees
                
    except Exception as e:
        logger.error(f"Error getting potential mentees: {e}")
        return []

def check_existing_request(sender_id, receiver_id):
    """Check if mentoring request already exists"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT * FROM mentorship_requests 
                    WHERE sender_user_id = %s AND receiver_user_id = %s
                    AND status IN ('pending', 'accepted')
                """, (sender_id, receiver_id))
                
                result = cursor.fetchone()
                return dict(result) if result else None
                
    except Exception as e:
        logger.error(f"Error checking existing request: {e}")
        return None

def create_mentoring_request(sender_id, receiver_id, message, request_type):
    """Create a new mentoring request"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO mentorship_requests 
                    (sender_user_id, receiver_user_id, message, request_type, status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (sender_id, receiver_id, message, request_type, 'pending', datetime.now()))
                
                result = cursor.fetchone()
                conn.commit()
                return str(result[0]) if result else None
                
    except Exception as e:
        logger.error(f"Error creating mentoring request: {e}")
        return None

def get_user_mentoring_requests(user_id, request_type, status):
    """Get mentoring requests for a user"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Build query based on request type
                if request_type == 'sent':
                    where_clause = "WHERE mr.sender_user_id = %s"
                elif request_type == 'received':
                    where_clause = "WHERE mr.receiver_user_id = %s"
                else:  # 'all'
                    where_clause = "WHERE (mr.sender_user_id = %s OR mr.receiver_user_id = %s)"
                
                # Add status filter
                if status != 'all':
                    where_clause += f" AND mr.status = '{status}'"
                
                query = f"""
                    SELECT mr.*, 
                           sender.full_name as sender_name,
                           receiver.full_name as receiver_name
                    FROM mentorship_requests mr
                    JOIN users sender ON mr.sender_user_id = sender.id
                    JOIN users receiver ON mr.receiver_user_id = receiver.id
                    {where_clause}
                    ORDER BY mr.created_at DESC
                """
                
                if request_type == 'all':
                    cursor.execute(query, (user_id, user_id))
                else:
                    cursor.execute(query, (user_id,))
                
                requests = []
                for row in cursor.fetchall():
                    request_data = {
                        'id': str(row['id']),
                        'sender_id': str(row['sender_user_id']),
                        'sender_name': row['sender_name'],
                        'receiver_id': str(row['receiver_user_id']),
                        'receiver_name': row['receiver_name'],
                        'message': row.get('message', ''),
                        'request_type': row.get('request_type', ''),
                        'status': row.get('status', ''),
                        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                        'updated_at': row['updated_at'].isoformat() if row.get('updated_at') else None
                    }
                    requests.append(request_data)
                
                return requests
                
    except Exception as e:
        logger.error(f"Error getting user mentoring requests: {e}")
        return []

def update_request_status(request_id, user_id, response, message):
    """Update mentoring request status"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                status = 'accepted' if response == 'accept' else 'rejected'
                
                cursor.execute("""
                    UPDATE mentorship_requests 
                    SET status = %s, response_message = %s, updated_at = %s
                    WHERE id = %s AND receiver_user_id = %s
                """, (status, message, datetime.now(), request_id, user_id))
                
                conn.commit()
                return cursor.rowcount > 0
                
    except Exception as e:
        logger.error(f"Error updating request status: {e}")
        return False

def create_mentorship_relationship(request_id):
    """Create mentorship relationship after request acceptance"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                # Get request details
                cursor.execute("""
                    SELECT sender_user_id, receiver_user_id, request_type
                    FROM mentorship_requests 
                    WHERE id = %s
                """, (request_id,))
                
                request_data = cursor.fetchone()
                if not request_data:
                    return False
                
                sender_id, receiver_id, request_type = request_data
                
                # Determine mentor and mentee based on request type
                if request_type == 'mentoring':
                    # Candidate requested mentoring from mentor
                    mentee_user_id = sender_id
                    mentor_user_id = receiver_id
                else:  # 'mentee'
                    # Mentor requested to mentor candidate
                    mentor_user_id = sender_id
                    mentee_user_id = receiver_id
                
                # Get mentor profile ID
                cursor.execute("""
                    SELECT id FROM mentor_profiles WHERE user_id = %s
                """, (mentor_user_id,))
                
                mentor_profile = cursor.fetchone()
                if not mentor_profile:
                    return False
                
                mentor_id = mentor_profile[0]
                
                # Create mentorship matching record
                cursor.execute("""
                    INSERT INTO mentorship_matching 
                    (mentor_id, mentee_user_id, match_status, match_score, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (mentor_id, mentee_user_id) 
                    DO UPDATE SET match_status = 'active', updated_at = CURRENT_TIMESTAMP
                """, (mentor_id, mentee_user_id, 'active', 1.0, datetime.now()))
                
                # Update mentor's current mentee count
                cursor.execute("""
                    UPDATE mentor_profiles 
                    SET current_mentees = current_mentees + 1
                    WHERE id = %s
                """, (mentor_id,))
                
                conn.commit()
                return True
                
    except Exception as e:
        logger.error(f"Error creating mentorship relationship: {e}")
        return False

def get_mentor_profile_by_user_id(user_id):
    """Get mentor profile by user ID"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT * FROM mentor_profiles WHERE user_id = %s
                """, (user_id,))
                
                result = cursor.fetchone()
                return dict(result) if result else None
                
    except Exception as e:
        logger.error(f"Error getting mentor profile: {e}")
        return None
