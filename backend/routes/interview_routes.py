
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.interview_service import interview_service
import logging
from datetime import datetime

interview_bp = Blueprint('interview', __name__, url_prefix='/api/interviews')
logger = logging.getLogger(__name__)

@interview_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    try:
        data = request.get_json()
        recruiter_id = get_jwt_identity() # Assuming creator is recruiter
        candidate_id = data.get('candidate_id')
        application_id = data.get('application_id')
        scheduled_at_str = data.get('scheduled_at') # ISO string
        title = data.get('title')
        attendees = data.get('attendees') # List of user IDs
        
        if not all([candidate_id, scheduled_at_str]):
            return jsonify({'success': False, 'message': 'Missing fields'}), 400
            
        scheduled_at = datetime.fromisoformat(scheduled_at_str.replace('Z', '+00:00'))
        
        session = interview_service.create_session(application_id, recruiter_id, candidate_id, scheduled_at, title, attendees)
        return jsonify({'success': True, 'data': session}), 201
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/my', methods=['GET'])
@jwt_required()
def get_my_sessions():
    try:
        user_id = str(get_jwt_identity()) # Cast to string for TEXT column
        role = request.args.get('role', 'candidate') # recruiter or candidate
        sessions = interview_service.get_user_sessions(user_id, role)
        print(f"DEBUG: get_user_sessions for {user_id} ({role}) returned {len(sessions)} items", flush=True)
        return jsonify({'success': True, 'data': sessions}), 200
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/admin/all', methods=['GET'])
@jwt_required()
def get_all_sessions_admin():
    try:
        # Ideally check admin role here
        sessions = interview_service.get_all_sessions()
        return jsonify({'success': True, 'data': sessions}), 200
    except Exception as e:
        logger.error(f"Error listing admin sessions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    try:
        session = interview_service.get_session(session_id)
        if not session:
            return jsonify({'success': False, 'message': 'Not found'}), 404
        return jsonify({'success': True, 'data': session}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/<session_id>/record/chunk', methods=['POST'])
@jwt_required()
def upload_chunk(session_id):
    try:
        user_id = get_jwt_identity()
        file = request.files['chunk']
        chunk_index = int(request.form.get('index', 0))
        is_final = request.form.get('is_final') == 'true'
        
        chunk_data = file.read()
        file_path = interview_service.save_recording_chunk(session_id, user_id, chunk_data, chunk_index, is_final)
        
        return jsonify({'success': True, 'file_path': file_path if is_final else None}), 200
    except Exception as e:
        logger.error(f"Chunk upload failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/<session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    try:
        data = request.get_json()
        result = interview_service.update_session(session_id, data)
        if result:
            return jsonify({'success': True, 'data': result}), 200
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/<session_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_session(session_id):
    try:
        data = request.get_json() or {}
        reason = data.get('reason', 'Cancelled by user')
        result = interview_service.cancel_session(session_id, reason)
        if result:
            return jsonify({'success': True, 'message': 'Session cancelled'}), 200
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    except Exception as e:
        logger.error(f"Error cancelling session: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/<session_id>/analyze', methods=['POST'])
@jwt_required()
def trigger_analysis(session_id):
    try:
        # Manually trigger AI analysis
        interview_service.analyze_interview(session_id)
        return jsonify({'success': True, 'message': 'Analysis started'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Admin Monitoring Route
@interview_bp.route('/monitor/active', methods=['GET'])
@jwt_required()
def get_active_sessions():
    # TODO: Verify admin role
    # For now, return active status from DB
    # Note: Real-time "Currently in call" usually comes from SocketIO room state, 
    # but we can filter DB by status='active' if we update it correctly.
    # We will implement logic in the service if needed, or query directly.
    return jsonify({'success': True, 'data': []}), 200 # Stub
