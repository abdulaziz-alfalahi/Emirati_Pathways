
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.interview_service import interview_service
import json
import logging
from datetime import datetime

try:
    from backend.auth.access_control import resolve_roles, ADMIN_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import resolve_roles, ADMIN_ROLES

interview_bp = Blueprint('interview', __name__, url_prefix='/api/interviews')
logger = logging.getLogger(__name__)


def _is_participant(session, user_id):
    """True if user_id is the candidate, the recruiter, or a listed attendee of the session."""
    if not session or user_id is None:
        return False
    uid = str(user_id)
    for key in ('candidate_id', 'recruiter_id'):
        val = session.get(key)
        if val is not None and str(val) == uid:
            return True
    attendees = session.get('attendees')
    if isinstance(attendees, str):
        try:
            attendees = json.loads(attendees)
        except Exception:
            attendees = []
    if isinstance(attendees, (list, tuple)) and uid in [str(a) for a in attendees]:
        return True
    return False


def _authorize_session(session_id):
    """Fetch a session and authorize the current caller (BOLA guard).

    Access is limited to session participants (candidate / recruiter / attendee) and
    admins — any other authenticated user must not read or mutate another user's
    interview session. (audit BAC/BOLA — session endpoints were auth-only, not owner-checked)

    Returns (session, None) when allowed, or (None, (response, status)) to return.
    """
    session = interview_service.get_session(session_id)
    if not session:
        return None, (jsonify({'success': False, 'message': 'Not found'}), 404)
    user_id = get_jwt_identity()
    if _is_participant(session, user_id) or (resolve_roles() & ADMIN_ROLES):
        return session, None
    logger.warning("Blocked non-participant access to interview session %s by user %s", session_id, user_id)
    return None, (jsonify({'success': False, 'message': 'Forbidden'}), 403)

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
        # Admin-only: this dumps EVERY session's PII, so gate it to admins rather than
        # any authenticated user. (audit BAC — was auth-only despite the "all sessions" scope)
        if not (resolve_roles() & ADMIN_ROLES):
            return jsonify({'success': False, 'message': 'Forbidden'}), 403
        sessions = interview_service.get_all_sessions()
        return jsonify({'success': True, 'data': sessions}), 200
    except Exception as e:
        logger.error(f"Error listing admin sessions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    try:
        session, err = _authorize_session(session_id)
        if err:
            return err
        return jsonify({'success': True, 'data': session}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/sessions/<session_id>/record/chunk', methods=['POST'])
@jwt_required()
def upload_chunk(session_id):
    try:
        _, err = _authorize_session(session_id)
        if err:
            return err
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
        _, err = _authorize_session(session_id)
        if err:
            return err
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
        _, err = _authorize_session(session_id)
        if err:
            return err
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
        _, err = _authorize_session(session_id)
        if err:
            return err
        # Manually trigger AI analysis
        interview_service.analyze_interview(session_id)
        return jsonify({'success': True, 'message': 'Analysis started'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@interview_bp.route('/assessors', methods=['GET'])
@jwt_required()
def get_assessors_for_panel():
    try:
        from backend.db import get_db_connection
        from psycopg2.extras import RealDictCursor
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT u.id, u.full_name, u.email, u.role, ap.specialization, ap.certification_level
            FROM users u
            LEFT JOIN assessor_profiles ap ON u.id = ap.user_id::varchar
            WHERE u.role = 'assessor' OR ap.id IS NOT NULL OR u.email LIKE '%recruiter%' OR u.role = 'recruiter'
        """)
        assessors = [dict(row) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({'success': True, 'data': assessors}), 200
    except Exception as e:
        logger.error(f"Error listing assessors for panel: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Admin Monitoring Route
@interview_bp.route('/monitor/active', methods=['GET'])
@jwt_required()
def get_active_sessions():
    # Admin-only monitoring surface. Real-time "Currently in call" usually comes from
    # SocketIO room state; this DB-backed view is gated to admins. (audit BAC)
    if not (resolve_roles() & ADMIN_ROLES):
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
    return jsonify({'success': True, 'data': []}), 200 # Stub
