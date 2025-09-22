"""
Mentorship Program Management Routes for Emirati Journey Platform
API endpoints for comprehensive program management and session tracking
"""

from flask import Blueprint, request, jsonify
import logging
from datetime import datetime, timedelta
from mentorship_program_management import program_manager, ProgramStatus, SessionStatus, SessionType

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
program_bp = Blueprint('mentorship_program', __name__, url_prefix='/api/mentorship-program')

@program_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with system statistics"""
    try:
        analytics = program_manager.get_system_analytics()
        
        return jsonify({
            'status': 'healthy',
            'service': 'Mentorship Program Management',
            'timestamp': datetime.utcnow().isoformat(),
            'analytics': analytics,
            'features': [
                'Program Creation and Management',
                'Session Scheduling and Tracking',
                'Goal Setting and Progress Monitoring',
                'AI-Powered Progress Reports',
                'Comprehensive Analytics Dashboard',
                'UAE Cultural Intelligence Integration'
            ]
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/programs', methods=['POST'])
def create_program():
    """Create a new mentorship program"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['mentor_id', 'mentee_id', 'program_name', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create program
        program = program_manager.create_program(
            mentor_id=data['mentor_id'],
            mentee_id=data['mentee_id'],
            program_data=data
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Mentorship program created successfully',
            'program': program.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"❌ Error creating program: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/programs/<program_id>', methods=['GET'])
def get_program(program_id):
    """Get program details by ID"""
    try:
        program = program_manager.get_program_by_id(program_id)
        
        if not program:
            return jsonify({
                'status': 'error',
                'message': 'Program not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'program': program.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting program: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/programs/mentor/<mentor_id>', methods=['GET'])
def get_programs_by_mentor(mentor_id):
    """Get all programs for a mentor"""
    try:
        programs = program_manager.get_programs_by_mentor(mentor_id)
        
        return jsonify({
            'status': 'success',
            'count': len(programs),
            'programs': [p.to_dict() for p in programs]
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting mentor programs: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/programs/mentee/<mentee_id>', methods=['GET'])
def get_programs_by_mentee(mentee_id):
    """Get all programs for a mentee"""
    try:
        programs = program_manager.get_programs_by_mentee(mentee_id)
        
        return jsonify({
            'status': 'success',
            'count': len(programs),
            'programs': [p.to_dict() for p in programs]
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting mentee programs: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/sessions', methods=['POST'])
def schedule_session():
    """Schedule a new mentorship session"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['program_id', 'title', 'scheduled_date']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Schedule session
        session = program_manager.schedule_session(
            program_id=data['program_id'],
            session_data=data
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Session scheduled successfully',
            'session': session.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"❌ Error scheduling session: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/sessions/<session_id>', methods=['PUT'])
def update_session(session_id):
    """Update a mentorship session"""
    try:
        data = request.get_json()
        
        # Update session
        session = program_manager.update_session(session_id, data)
        
        return jsonify({
            'status': 'success',
            'message': 'Session updated successfully',
            'session': session.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error updating session: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/goals/<goal_id>/progress', methods=['PUT'])
def update_goal_progress(goal_id):
    """Update goal progress"""
    try:
        data = request.get_json()
        
        # Update goal progress
        goal = program_manager.update_goal_progress(goal_id, data)
        
        return jsonify({
            'status': 'success',
            'message': 'Goal progress updated successfully',
            'goal': goal.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error updating goal progress: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/programs/<program_id>/progress-report', methods=['POST'])
def generate_progress_report(program_id):
    """Generate comprehensive progress report"""
    try:
        data = request.get_json() or {}
        period = data.get('period', 'monthly')
        
        # Generate report
        report = program_manager.generate_progress_report(program_id, period)
        
        return jsonify({
            'status': 'success',
            'message': 'Progress report generated successfully',
            'report': report.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error generating progress report: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/sessions/upcoming/<user_id>', methods=['GET'])
def get_upcoming_sessions(user_id):
    """Get upcoming sessions for a user"""
    try:
        days_ahead = request.args.get('days', 7, type=int)
        
        sessions = program_manager.get_upcoming_sessions(user_id, days_ahead)
        
        return jsonify({
            'status': 'success',
            'count': len(sessions),
            'sessions': [s.to_dict() for s in sessions]
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting upcoming sessions: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/analytics/system', methods=['GET'])
def get_system_analytics():
    """Get comprehensive system analytics"""
    try:
        analytics = program_manager.get_system_analytics()
        
        return jsonify({
            'status': 'success',
            'analytics': analytics,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting system analytics: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/session-types', methods=['GET'])
def get_session_types():
    """Get available session types"""
    try:
        session_types = [
            {
                'value': session_type.value,
                'label': session_type.value.replace('_', ' ').title(),
                'description': _get_session_type_description(session_type)
            }
            for session_type in SessionType
        ]
        
        return jsonify({
            'status': 'success',
            'session_types': session_types
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting session types: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/program-statuses', methods=['GET'])
def get_program_statuses():
    """Get available program statuses"""
    try:
        statuses = [
            {
                'value': status.value,
                'label': status.value.replace('_', ' ').title(),
                'description': _get_status_description(status)
            }
            for status in ProgramStatus
        ]
        
        return jsonify({
            'status': 'success',
            'statuses': statuses
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting program statuses: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@program_bp.route('/demo/sample-program', methods=['GET'])
def get_sample_program():
    """Get sample program for demonstration"""
    try:
        # Get the first program (sample program)
        if program_manager.programs:
            sample_program = list(program_manager.programs.values())[0]
            
            return jsonify({
                'status': 'success',
                'message': 'Sample program retrieved successfully',
                'program': sample_program.to_dict(),
                'demo_note': 'This is a sample mentorship program showing the comprehensive features available'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'No sample programs available'
            }), 404
        
    except Exception as e:
        logger.error(f"❌ Error getting sample program: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def _get_session_type_description(session_type: SessionType) -> str:
    """Get description for session type"""
    descriptions = {
        SessionType.INITIAL_MEETING: "First meeting to establish goals and expectations",
        SessionType.GOAL_SETTING: "Define and refine mentorship goals and objectives",
        SessionType.SKILL_DEVELOPMENT: "Focus on developing specific skills and competencies",
        SessionType.CAREER_GUIDANCE: "Career planning and professional development advice",
        SessionType.PROGRESS_REVIEW: "Review progress and adjust goals as needed",
        SessionType.NETWORKING: "Networking strategies and relationship building",
        SessionType.INTERVIEW_PREP: "Interview preparation and practice sessions",
        SessionType.LEADERSHIP_COACHING: "Leadership skills development and coaching",
        SessionType.CULTURAL_INTEGRATION: "UAE cultural integration and workplace adaptation",
        SessionType.FINAL_EVALUATION: "Program completion and final assessment"
    }
    return descriptions.get(session_type, "Mentorship session")

def _get_status_description(status: ProgramStatus) -> str:
    """Get description for program status"""
    descriptions = {
        ProgramStatus.PENDING: "Program created but not yet started",
        ProgramStatus.ACTIVE: "Program currently in progress",
        ProgramStatus.PAUSED: "Program temporarily paused",
        ProgramStatus.COMPLETED: "Program successfully completed",
        ProgramStatus.CANCELLED: "Program cancelled before completion"
    }
    return descriptions.get(status, "Program status")

logger.info("✅ Mentorship Program Management routes loaded successfully")
