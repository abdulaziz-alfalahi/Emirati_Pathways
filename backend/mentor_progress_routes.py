"""
Mentor Progress Tracking API Routes
Flask routes for progress tracking and goal management functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
from datetime import datetime, timedelta
from mentor_progress_tracker import (
    MentorProgressTracker, GoalStatus, GoalPriority, GoalCategory,
    MilestoneStatus, ProgressMetric
)
import psycopg2
from psycopg2.extras import RealDictCursor
from backend.db import get_db_connection, DB_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
mentor_progress_bp = Blueprint('mentor_progress', __name__, url_prefix='/api/mentor/progress')

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

def get_mentorship_id(mentor_user_id, mentee_user_id):
    """Get mentorship ID from mentor and mentee user IDs"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT mm.id FROM mentorship_matching mm
                    JOIN mentor_profiles mp ON mm.mentor_id = mp.id
                    WHERE mp.user_id = %s AND mm.mentee_user_id = %s
                    AND mm.match_status = 'active'
                """, (mentor_user_id, mentee_user_id))
                
                result = cursor.fetchone()
                return str(result[0]) if result else None
    except Exception as e:
        logger.error(f"Error getting mentorship ID: {e}")
        return None

def get_user_mentorships(user_id, user_role):
    """Get mentorships for a user"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                if user_role == 'mentor':
                    cursor.execute("""
                        SELECT mm.id, mm.mentee_user_id, u.full_name as mentee_name
                        FROM mentorship_matching mm
                        JOIN mentor_profiles mp ON mm.mentor_id = mp.id
                        JOIN users u ON mm.mentee_user_id = u.id
                        WHERE mp.user_id = %s AND mm.match_status = 'active'
                    """, (user_id,))
                else:  # mentee
                    cursor.execute("""
                        SELECT mm.id, mp.user_id as mentor_user_id, u.full_name as mentor_name
                        FROM mentorship_matching mm
                        JOIN mentor_profiles mp ON mm.mentor_id = mp.id
                        JOIN users u ON mp.user_id = u.id
                        WHERE mm.mentee_user_id = %s AND mm.match_status = 'active'
                    """, (user_id,))
                
                return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error getting user mentorships: {e}")
        return []

@mentor_progress_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Mentor Progress Tracking Service',
        'timestamp': datetime.now().isoformat()
    })

@mentor_progress_bp.route('/mentorships', methods=['GET'])
@jwt_required()
def get_mentorships():
    """Get mentorships for current user"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can access mentorships',
                'code': 'INVALID_ROLE'
            }), 403
        
        mentorships = get_user_mentorships(current_user_id, user_role)
        
        return jsonify({
            'message': 'Mentorships retrieved successfully',
            'mentorships': mentorships,
            'total': len(mentorships),
            'user_role': user_role,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting mentorships: {e}")
        return jsonify({
            'error': 'Failed to get mentorships',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/plans', methods=['POST'])
@jwt_required()
def create_mentorship_plan():
    """Create a mentorship plan"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role != 'mentor':
            return jsonify({
                'error': 'Only mentors can create mentorship plans',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Validate required fields
        required_fields = ['mentee_user_id', 'plan_title', 'description', 'duration_months']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}',
                'code': 'MISSING_REQUIRED_FIELDS'
            }), 400
        
        # Get mentor profile ID
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM mentor_profiles WHERE user_id = %s", (current_user_id,))
                mentor_result = cursor.fetchone()
                
                if not mentor_result:
                    return jsonify({
                        'error': 'Mentor profile not found',
                        'code': 'MENTOR_PROFILE_NOT_FOUND'
                    }), 404
                
                mentor_id = str(mentor_result[0])
        
        # Set dates
        start_date = datetime.fromisoformat(data.get('start_date', datetime.now().isoformat()))
        end_date = start_date + timedelta(days=data['duration_months'] * 30)
        
        plan_data = {
            'plan_title': data['plan_title'],
            'description': data['description'],
            'duration_months': data['duration_months'],
            'start_date': start_date,
            'end_date': end_date,
            'overall_objectives': data.get('overall_objectives', []),
            'success_metrics': data.get('success_metrics', []),
            'meeting_frequency': data.get('meeting_frequency', 'weekly')
        }
        
        # Initialize tracker and create plan
        tracker = MentorProgressTracker(DB_CONFIG)
        plan_id = tracker.create_mentorship_plan(mentor_id, data['mentee_user_id'], plan_data)
        
        if plan_id:
            return jsonify({
                'message': 'Mentorship plan created successfully',
                'plan_id': plan_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to create mentorship plan',
                'code': 'PLAN_CREATION_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error creating mentorship plan: {e}")
        return jsonify({
            'error': 'Failed to create mentorship plan',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/goals', methods=['POST'])
@jwt_required()
def create_goal():
    """Create a new goal"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can create goals',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Validate required fields
        required_fields = ['mentorship_id', 'title', 'description', 'category', 'target_date']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}',
                'code': 'MISSING_REQUIRED_FIELDS'
            }), 400
        
        # Validate category
        try:
            GoalCategory(data['category'])
        except ValueError:
            return jsonify({
                'error': f'Invalid goal category: {data["category"]}',
                'code': 'INVALID_GOAL_CATEGORY'
            }), 400
        
        # Parse target date
        try:
            target_date = datetime.fromisoformat(data['target_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'error': 'Invalid target date format',
                'code': 'INVALID_DATE_FORMAT'
            }), 400
        
        goal_data = {
            'mentorship_id': data['mentorship_id'],
            'title': data['title'],
            'description': data['description'],
            'category': data['category'],
            'priority': data.get('priority', GoalPriority.MEDIUM.value),
            'target_date': target_date,
            'success_criteria': data.get('success_criteria', []),
            'resources_needed': data.get('resources_needed', []),
            'mentor_notes': data.get('mentor_notes', ''),
            'mentee_notes': data.get('mentee_notes', ''),
            'tags': data.get('tags', [])
        }
        
        # Initialize tracker and create goal
        tracker = MentorProgressTracker(DB_CONFIG)
        goal_id = tracker.create_goal(goal_data)
        
        if goal_id:
            return jsonify({
                'message': 'Goal created successfully',
                'goal_id': goal_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to create goal',
                'code': 'GOAL_CREATION_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error creating goal: {e}")
        return jsonify({
            'error': 'Failed to create goal',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/goals/<mentorship_id>', methods=['GET'])
@jwt_required()
def get_goals(mentorship_id):
    """Get goals for a mentorship"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view goals',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get query parameters
        status_filter = request.args.get('status')
        
        # Initialize tracker and get goals
        tracker = MentorProgressTracker(DB_CONFIG)
        goals = tracker.get_mentorship_goals(mentorship_id, status_filter)
        
        # Format response
        formatted_goals = []
        for goal in goals:
            formatted_goal = {
                'id': goal.id,
                'title': goal.title,
                'description': goal.description,
                'category': goal.category.value,
                'priority': goal.priority.value,
                'status': goal.status.value,
                'target_date': goal.target_date.isoformat(),
                'completion_percentage': goal.completion_percentage,
                'success_criteria': goal.success_criteria,
                'resources_needed': goal.resources_needed,
                'mentor_notes': goal.mentor_notes,
                'mentee_notes': goal.mentee_notes,
                'is_smart_goal': goal.is_smart_goal,
                'tags': goal.tags,
                'created_date': goal.created_date.isoformat(),
                'updated_date': goal.updated_date.isoformat(),
                'is_overdue': goal.target_date < datetime.now() and goal.status != GoalStatus.COMPLETED
            }
            formatted_goals.append(formatted_goal)
        
        return jsonify({
            'message': 'Goals retrieved successfully',
            'goals': formatted_goals,
            'total': len(formatted_goals),
            'mentorship_id': mentorship_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting goals: {e}")
        return jsonify({
            'error': 'Failed to get goals',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/milestones', methods=['POST'])
@jwt_required()
def create_milestone():
    """Create a milestone for a goal"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can create milestones',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Validate required fields
        required_fields = ['goal_id', 'title', 'description', 'target_date']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}',
                'code': 'MISSING_REQUIRED_FIELDS'
            }), 400
        
        # Parse target date
        try:
            target_date = datetime.fromisoformat(data['target_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'error': 'Invalid target date format',
                'code': 'INVALID_DATE_FORMAT'
            }), 400
        
        milestone_data = {
            'goal_id': data['goal_id'],
            'title': data['title'],
            'description': data['description'],
            'target_date': target_date,
            'notes': data.get('notes', '')
        }
        
        # Initialize tracker and create milestone
        tracker = MentorProgressTracker(DB_CONFIG)
        milestone_id = tracker.create_milestone(milestone_data)
        
        if milestone_id:
            return jsonify({
                'message': 'Milestone created successfully',
                'milestone_id': milestone_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to create milestone',
                'code': 'MILESTONE_CREATION_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error creating milestone: {e}")
        return jsonify({
            'error': 'Failed to create milestone',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/milestones/<goal_id>', methods=['GET'])
@jwt_required()
def get_milestones(goal_id):
    """Get milestones for a goal"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view milestones',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize tracker and get milestones
        tracker = MentorProgressTracker(DB_CONFIG)
        milestones = tracker.get_goal_milestones(goal_id)
        
        # Format response
        formatted_milestones = []
        for milestone in milestones:
            formatted_milestone = {
                'id': milestone.id,
                'goal_id': milestone.goal_id,
                'title': milestone.title,
                'description': milestone.description,
                'target_date': milestone.target_date.isoformat(),
                'status': milestone.status.value,
                'completion_percentage': milestone.completion_percentage,
                'notes': milestone.notes,
                'created_date': milestone.created_date.isoformat(),
                'updated_date': milestone.updated_date.isoformat(),
                'is_overdue': milestone.target_date < datetime.now() and milestone.status != MilestoneStatus.COMPLETED
            }
            formatted_milestones.append(formatted_milestone)
        
        return jsonify({
            'message': 'Milestones retrieved successfully',
            'milestones': formatted_milestones,
            'total': len(formatted_milestones),
            'goal_id': goal_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting milestones: {e}")
        return jsonify({
            'error': 'Failed to get milestones',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/progress', methods=['POST'])
@jwt_required()
def record_progress():
    """Record progress entry"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can record progress',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Validate required fields
        required_fields = ['goal_id', 'progress_value']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}',
                'code': 'MISSING_REQUIRED_FIELDS'
            }), 400
        
        progress_data = {
            'goal_id': data['goal_id'],
            'milestone_id': data.get('milestone_id'),
            'progress_value': float(data['progress_value']),
            'metric_type': data.get('metric_type', ProgressMetric.PERCENTAGE.value),
            'notes': data.get('notes', ''),
            'evidence_links': data.get('evidence_links', []),
            'mentor_feedback': data.get('mentor_feedback', ''),
            'mentee_reflection': data.get('mentee_reflection', ''),
            'created_by': current_user_id
        }
        
        # Initialize tracker and record progress
        tracker = MentorProgressTracker(DB_CONFIG)
        progress_id = tracker.record_progress(progress_data)
        
        if progress_id:
            return jsonify({
                'message': 'Progress recorded successfully',
                'progress_id': progress_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to record progress',
                'code': 'PROGRESS_RECORDING_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error recording progress: {e}")
        return jsonify({
            'error': 'Failed to record progress',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/progress/<goal_id>', methods=['GET'])
@jwt_required()
def get_progress(goal_id):
    """Get progress entries for a goal"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view progress',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Get query parameters
        limit = int(request.args.get('limit', 50))
        
        # Initialize tracker and get progress entries
        tracker = MentorProgressTracker(DB_CONFIG)
        progress_entries = tracker.get_progress_entries(goal_id, limit)
        
        # Format response
        formatted_entries = []
        for entry in progress_entries:
            formatted_entry = {
                'id': entry.id,
                'goal_id': entry.goal_id,
                'milestone_id': entry.milestone_id,
                'entry_date': entry.entry_date.isoformat(),
                'progress_value': entry.progress_value,
                'metric_type': entry.metric_type.value,
                'notes': entry.notes,
                'evidence_links': entry.evidence_links,
                'mentor_feedback': entry.mentor_feedback,
                'mentee_reflection': entry.mentee_reflection,
                'created_by': entry.created_by
            }
            formatted_entries.append(formatted_entry)
        
        return jsonify({
            'message': 'Progress entries retrieved successfully',
            'progress_entries': formatted_entries,
            'total': len(formatted_entries),
            'goal_id': goal_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting progress: {e}")
        return jsonify({
            'error': 'Failed to get progress',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/skills/assess', methods=['POST'])
@jwt_required()
def conduct_skill_assessment():
    """Conduct skill assessment"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can conduct skill assessments',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request data is required',
                'code': 'MISSING_REQUEST_DATA'
            }), 400
        
        # Validate required fields
        required_fields = ['mentorship_id', 'skill_name', 'current_level', 'target_level']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}',
                'code': 'MISSING_REQUIRED_FIELDS'
            }), 400
        
        # Validate skill levels (1-10 scale)
        for level_field in ['current_level', 'target_level']:
            if level_field in data:
                level = data[level_field]
                if not isinstance(level, int) or level < 1 or level > 10:
                    return jsonify({
                        'error': f'{level_field} must be an integer between 1 and 10',
                        'code': 'INVALID_SKILL_LEVEL'
                    }), 400
        
        assessment_data = {
            'mentorship_id': data['mentorship_id'],
            'skill_name': data['skill_name'],
            'current_level': data['current_level'],
            'target_level': data['target_level'],
            'assessor': user_role,
            'notes': data.get('notes', ''),
            'improvement_plan': data.get('improvement_plan', '')
        }
        
        # Initialize tracker and conduct assessment
        tracker = MentorProgressTracker(DB_CONFIG)
        assessment_id = tracker.conduct_skill_assessment(assessment_data)
        
        if assessment_id:
            return jsonify({
                'message': 'Skill assessment conducted successfully',
                'assessment_id': assessment_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to conduct skill assessment',
                'code': 'ASSESSMENT_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error conducting skill assessment: {e}")
        return jsonify({
            'error': 'Failed to conduct skill assessment',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/skills/<mentorship_id>', methods=['GET'])
@jwt_required()
def get_skill_assessments(mentorship_id):
    """Get skill assessments for a mentorship"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view skill assessments',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize tracker and get skill assessments
        tracker = MentorProgressTracker(DB_CONFIG)
        assessments = tracker.get_skill_assessments(mentorship_id)
        
        # Format response
        formatted_assessments = []
        for assessment in assessments:
            formatted_assessment = {
                'id': assessment.id,
                'mentorship_id': assessment.mentorship_id,
                'skill_name': assessment.skill_name,
                'initial_level': assessment.initial_level,
                'current_level': assessment.current_level,
                'target_level': assessment.target_level,
                'improvement': assessment.current_level - assessment.initial_level,
                'progress_to_target': ((assessment.current_level - assessment.initial_level) / 
                                     (assessment.target_level - assessment.initial_level)) * 100 
                                     if assessment.target_level > assessment.initial_level else 100,
                'assessment_date': assessment.assessment_date.isoformat(),
                'assessor': assessment.assessor,
                'notes': assessment.notes,
                'improvement_plan': assessment.improvement_plan
            }
            formatted_assessments.append(formatted_assessment)
        
        return jsonify({
            'message': 'Skill assessments retrieved successfully',
            'skill_assessments': formatted_assessments,
            'total': len(formatted_assessments),
            'mentorship_id': mentorship_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting skill assessments: {e}")
        return jsonify({
            'error': 'Failed to get skill assessments',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/reports/<mentorship_id>', methods=['GET'])
@jwt_required()
def generate_progress_report(mentorship_id):
    """Generate comprehensive progress report"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can generate progress reports',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize tracker and generate report
        tracker = MentorProgressTracker(DB_CONFIG)
        report = tracker.generate_progress_report(mentorship_id)
        
        if report:
            return jsonify({
                'message': 'Progress report generated successfully',
                'report': report,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to generate progress report',
                'code': 'REPORT_GENERATION_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error generating progress report: {e}")
        return jsonify({
            'error': 'Failed to generate progress report',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/analytics/<mentorship_id>', methods=['GET'])
@jwt_required()
def get_mentorship_analytics(mentorship_id):
    """Get comprehensive mentorship analytics"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can view analytics',
                'code': 'INVALID_ROLE'
            }), 403
        
        # Initialize tracker and get analytics
        tracker = MentorProgressTracker(DB_CONFIG)
        analytics = tracker.get_mentorship_analytics(mentorship_id)
        
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

@mentor_progress_bp.route('/goals/<goal_id>/status', methods=['PUT'])
@jwt_required()
def update_goal_status(goal_id):
    """Update goal status"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can update goal status',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({
                'error': 'Status is required',
                'code': 'MISSING_STATUS'
            }), 400
        
        try:
            new_status = GoalStatus(data['status'])
        except ValueError:
            return jsonify({
                'error': f'Invalid goal status: {data["status"]}',
                'code': 'INVALID_GOAL_STATUS'
            }), 400
        
        notes = data.get('notes', '')
        
        # Initialize tracker and update status
        tracker = MentorProgressTracker(DB_CONFIG)
        success = tracker.update_goal_status(goal_id, new_status, notes)
        
        if success:
            return jsonify({
                'message': 'Goal status updated successfully',
                'new_status': new_status.value,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to update goal status',
                'code': 'STATUS_UPDATE_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error updating goal status: {e}")
        return jsonify({
            'error': 'Failed to update goal status',
            'details': str(e)
        }), 500

@mentor_progress_bp.route('/milestones/<milestone_id>/status', methods=['PUT'])
@jwt_required()
def update_milestone_status(milestone_id):
    """Update milestone status"""
    try:
        current_user_id = get_jwt_identity()
        user_role = get_user_role(current_user_id)
        
        if user_role not in ['mentor', 'candidate']:
            return jsonify({
                'error': 'Only mentors and candidates can update milestone status',
                'code': 'INVALID_ROLE'
            }), 403
        
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({
                'error': 'Status is required',
                'code': 'MISSING_STATUS'
            }), 400
        
        try:
            new_status = MilestoneStatus(data['status'])
        except ValueError:
            return jsonify({
                'error': f'Invalid milestone status: {data["status"]}',
                'code': 'INVALID_MILESTONE_STATUS'
            }), 400
        
        completion_percentage = data.get('completion_percentage')
        
        # Initialize tracker and update status
        tracker = MentorProgressTracker(DB_CONFIG)
        success = tracker.update_milestone_status(milestone_id, new_status, completion_percentage)
        
        if success:
            return jsonify({
                'message': 'Milestone status updated successfully',
                'new_status': new_status.value,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to update milestone status',
                'code': 'STATUS_UPDATE_FAILED'
            }), 500
        
    except Exception as e:
        logger.error(f"Error updating milestone status: {e}")
        return jsonify({
            'error': 'Failed to update milestone status',
            'details': str(e)
        }), 500
