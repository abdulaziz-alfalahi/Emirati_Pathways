"""Board meetings — schedule, calendar and the join button (migration 050).

Board members previously had no way into a board video meeting, and no meeting
record existed at all. This provides the spine: the secretary schedules a
meeting, invitees see it on their calendar, and each joins through a button
that mints a LiveKit token for that meeting's room.

Access model:
  - Reading meetings and joining is open to BOARD_ROLES (board members + admin).
  - Creating, editing and cancelling is restricted to the meeting organiser
    role set — admin and platform operators today, the Board Operator
    (secretary) once that role exists.
  - Joining is refused to anyone not on the invitee list, so a board meeting
    room cannot be entered by a non-attendee who guesses the meeting id.
"""
import logging
import os
import re
import uuid
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

try:
    from backend.auth.access_control import require_roles, resolve_roles, ADMIN_ROLES, BOARD_ROLES
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import require_roles, resolve_roles, ADMIN_ROLES, BOARD_ROLES
    from db_utils import execute_query

logger = logging.getLogger(__name__)

board_meetings_bp = Blueprint('board_meetings', __name__, url_prefix='/api/board/meetings')

# Who may schedule/edit. The Board Operator (secretary) role does not exist yet;
# when it does, add it here and nothing else needs to change.
ORGANISER_ROLES = ADMIN_ROLES | {'platform_operator', 'board_operator'}

# A meeting is joinable from this long before its start until this long after
# the scheduled end — so nobody is locked out by a slightly late start.
JOIN_WINDOW_BEFORE = timedelta(minutes=15)
JOIN_GRACE_AFTER = timedelta(minutes=60)


def _row(m):
    """Serialise a meeting row for the API."""
    iso = lambda d: d.isoformat() if d else None
    return {
        'id': str(m['id']),
        'title': m.get('title'),
        'title_ar': m.get('title_ar'),
        'agenda': m.get('agenda'),
        'agenda_ar': m.get('agenda_ar'),
        'scheduled_at': iso(m.get('scheduled_at')),
        'duration_minutes': m.get('duration_minutes'),
        'location': m.get('location'),
        'is_virtual': m.get('is_virtual'),
        'status': m.get('status'),
        'quorum_required': m.get('quorum_required'),
        'started_at': iso(m.get('started_at')),
        'ended_at': iso(m.get('ended_at')),
        'attendee_count': m.get('attendee_count'),
        'attended_count': m.get('attended_count'),
        'my_invite_status': m.get('my_invite_status'),
    }


@board_meetings_bp.route('', methods=['GET'])
@require_roles(*BOARD_ROLES)
def list_meetings():
    """Meetings visible to the caller, newest first.

    `scope=upcoming` (default) returns meetings that have not finished;
    `scope=past` returns completed/cancelled ones for the archive view.
    """
    try:
        me = str(get_jwt_identity())
        scope = (request.args.get('scope') or 'upcoming').lower()
        where = ("m.status IN ('scheduled','in_progress')"
                 if scope == 'upcoming' else "m.status IN ('completed','cancelled')")
        order = 'ASC' if scope == 'upcoming' else 'DESC'
        rows = execute_query(f"""
            SELECT m.*,
                   (SELECT COUNT(*) FROM board_meeting_attendees a WHERE a.meeting_id = m.id) AS attendee_count,
                   (SELECT COUNT(*) FROM board_meeting_attendees a
                     WHERE a.meeting_id = m.id AND a.invite_status = 'attended') AS attended_count,
                   (SELECT a.invite_status FROM board_meeting_attendees a
                     WHERE a.meeting_id = m.id AND a.user_id = %s) AS my_invite_status
            FROM board_meetings m
            WHERE {where}
            ORDER BY m.scheduled_at {order}
            LIMIT 100
        """, (me,)) or []
        return jsonify({'success': True, 'data': [_row(r) for r in rows]})
    except Exception as e:
        logger.error(f"list board meetings failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load meetings'}), 500


@board_meetings_bp.route('', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def create_meeting():
    """Schedule a meeting and invite board members."""
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    scheduled_at = (data.get('scheduled_at') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400
    if not scheduled_at:
        return jsonify({'success': False, 'message': 'scheduled_at is required'}), 400
    try:
        when = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'success': False, 'message': 'scheduled_at must be an ISO datetime'}), 400
    # Same rule as interviews: do not let a meeting be booked in the past.
    now = datetime.now(when.tzinfo) if when.tzinfo else datetime.now()
    if when < now - timedelta(minutes=5):
        return jsonify({'success': False,
                        'message': 'That date and time have already passed. Choose a future slot.'}), 400

    # Stable, readable room name — safe characters only.
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', title).strip('-')[:40] or 'board'
    room_name = f"board-{slug}-{uuid.uuid4().hex[:8]}".lower()

    # Quorum is a FIXED board-wide rule (owner ruling 2026-08-05), not a
    # per-meeting choice. Snapshot it onto the meeting so that changing the
    # board rule later never rewrites whether a past meeting was quorate.
    _settings = execute_query("SELECT quorum_required FROM board_settings WHERE id = 1",
                              fetch_one=True) or {}
    quorum = _settings.get('quorum_required')

    try:
        row = execute_query("""
            INSERT INTO board_meetings
                (title, title_ar, agenda, agenda_ar, scheduled_at, duration_minutes,
                 location, is_virtual, room_name, quorum_required, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (title, data.get('title_ar'), data.get('agenda'), data.get('agenda_ar'),
              when, int(data.get('duration_minutes') or 60), data.get('location'),
              bool(data.get('is_virtual', True)), room_name,
              quorum, str(get_jwt_identity())[:15]), fetch_one=True)
        meeting_id = row['id']

        # Invitees: explicit list, or every board member by default.
        invitees = data.get('attendee_ids')
        if not invitees:
            members = execute_query("""
                SELECT id FROM users
                WHERE role = 'board_member' OR secondary_roles::text ILIKE '%%board_member%%'
            """) or []
            invitees = [m['id'] for m in members]
        for uid in invitees:
            execute_query("""
                INSERT INTO board_meeting_attendees (meeting_id, user_id)
                VALUES (%s, %s) ON CONFLICT (meeting_id, user_id) DO NOTHING
            """, (meeting_id, str(uid)[:15]), fetch_all=False)

        _notify_invitees(meeting_id, title, when, invitees)
        return jsonify({'success': True, 'data': _row(row)}), 201
    except Exception as e:
        logger.error(f"create board meeting failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to create meeting'}), 500


def _notify_invitees(meeting_id, title, when, invitees):
    """Tell invited members. Best-effort — never fails the scheduling."""
    try:
        try:
            from backend.notification_helper import create_notification
        except ImportError:  # pragma: no cover
            from notification_helper import create_notification
        for uid in invitees:
            try:
                create_notification(
                    user_id=str(uid), notification_type='board_meeting_scheduled',
                    title='Board meeting scheduled',
                    message=f"{title} — {when.strftime('%d %b %Y, %H:%M')}",
                    metadata={'meeting_id': str(meeting_id), 'link': '/board-portal?tab=meetings'})
            except Exception as _e:
                logger.warning(f"board meeting notification failed for {uid}: {_e}")
    except Exception as e:  # pragma: no cover
        logger.warning(f"board meeting notifications skipped: {e}")


@board_meetings_bp.route('/<meeting_id>/join', methods=['POST'])
@require_roles(*BOARD_ROLES)
def join_meeting(meeting_id):
    """Mint a LiveKit token for this meeting and record attendance.

    Refused when the caller is not an invitee, when the meeting is cancelled,
    or when it is outside the join window — a board room should not be open
    indefinitely.
    """
    try:
        me = str(get_jwt_identity())
        meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                                (str(meeting_id),), fetch_one=True)
        if not meeting:
            return jsonify({'success': False, 'message': 'Meeting not found'}), 404
        if meeting.get('status') == 'cancelled':
            return jsonify({'success': False, 'message': 'This meeting was cancelled'}), 410
        if not meeting.get('is_virtual'):
            return jsonify({'success': False,
                            'message': 'This meeting is being held in person'}), 400

        is_admin = bool(resolve_roles() & ADMIN_ROLES)
        invite = execute_query(
            "SELECT * FROM board_meeting_attendees WHERE meeting_id::text = %s AND user_id = %s",
            (str(meeting_id), me), fetch_one=True)
        if not invite and not is_admin:
            return jsonify({'success': False,
                            'message': 'You are not on the attendee list for this meeting'}), 403

        # Join window.
        start = meeting['scheduled_at']
        end = start + timedelta(minutes=int(meeting.get('duration_minutes') or 60))
        now = datetime.now(start.tzinfo) if start.tzinfo else datetime.now()
        if now < start - JOIN_WINDOW_BEFORE:
            return jsonify({'success': False, 'error_code': 'too_early',
                            'message': f"This meeting opens at {(start - JOIN_WINDOW_BEFORE).strftime('%H:%M')}."}), 409
        if now > end + JOIN_GRACE_AFTER:
            return jsonify({'success': False, 'error_code': 'closed',
                            'message': 'This meeting has ended.'}), 409

        # Reuse the proven interview token path rather than a second implementation.
        try:
            from backend.video_interview_system import video_interview_engine
        except ImportError:  # pragma: no cover
            from video_interview_system import video_interview_engine
        user = execute_query("SELECT full_name, email FROM users WHERE id = %s", (me,), fetch_one=True) or {}
        display = user.get('full_name') or user.get('email') or me
        token = video_interview_engine.generate_livekit_token(meeting['room_name'], me, display)

        # Record attendance + open the meeting on first join.
        execute_query("""
            UPDATE board_meeting_attendees
            SET invite_status = 'attended', joined_at = COALESCE(joined_at, NOW())
            WHERE meeting_id::text = %s AND user_id = %s
        """, (str(meeting_id), me), fetch_all=False)
        execute_query("""
            UPDATE board_meetings
            SET status = CASE WHEN status = 'scheduled' THEN 'in_progress' ELSE status END,
                started_at = COALESCE(started_at, NOW()), updated_at = NOW()
            WHERE id::text = %s
        """, (str(meeting_id),), fetch_all=False)

        return jsonify({'success': True, 'data': {
            'room_name': meeting['room_name'],
            'token': token,
            'livekit_url': os.getenv('LIVEKIT_URL_PUBLIC') or os.getenv('LIVEKIT_URL', 'wss://stg-emirati.ehrdc.gov.ae'),
            'meeting_title': meeting.get('title'),
        }})
    except Exception as e:
        logger.error(f"join board meeting failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to join meeting'}), 500


@board_meetings_bp.route('/<meeting_id>/rsvp', methods=['POST'])
@require_roles(*BOARD_ROLES)
def rsvp(meeting_id):
    """Accept or decline an invitation."""
    answer = ((request.get_json() or {}).get('response') or '').lower()
    if answer not in ('accepted', 'declined'):
        return jsonify({'success': False, 'message': "response must be 'accepted' or 'declined'"}), 400
    try:
        execute_query("""
            UPDATE board_meeting_attendees SET invite_status = %s
            WHERE meeting_id::text = %s AND user_id = %s AND invite_status IN ('invited','accepted','declined')
        """, (answer, str(meeting_id), str(get_jwt_identity())), fetch_all=False)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"board rsvp failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to record your response'}), 500


@board_meetings_bp.route('/<meeting_id>/end', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def end_meeting(meeting_id):
    """Close the meeting and settle attendance (invited-but-never-joined -> absent)."""
    try:
        execute_query("""
            UPDATE board_meetings SET status = 'completed', ended_at = NOW(), updated_at = NOW()
            WHERE id::text = %s
        """, (str(meeting_id),), fetch_all=False)
        execute_query("""
            UPDATE board_meeting_attendees SET invite_status = 'absent'
            WHERE meeting_id::text = %s AND invite_status IN ('invited','accepted')
        """, (str(meeting_id),), fetch_all=False)
        row = execute_query("""
            SELECT (SELECT COUNT(*) FROM board_meeting_attendees a
                     WHERE a.meeting_id = m.id AND a.invite_status = 'attended') AS attended,
                   m.quorum_required
            FROM board_meetings m WHERE m.id::text = %s
        """, (str(meeting_id),), fetch_one=True) or {}
        quorum = row.get('quorum_required')
        attended = row.get('attended') or 0
        return jsonify({'success': True, 'data': {
            'attended': attended,
            'quorum_required': quorum,
            # Explicit null when no quorum is configured — never guess.
            'quorum_met': (attended >= quorum) if quorum else None,
        }})
    except Exception as e:
        logger.error(f"end board meeting failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to end meeting'}), 500


@board_meetings_bp.route('/settings', methods=['GET'])
@require_roles(*BOARD_ROLES)
def get_board_settings():
    """The board-wide quorum rule. Readable by the board; only organisers set it."""
    row = execute_query("SELECT quorum_required, quorum_basis, updated_at FROM board_settings WHERE id = 1",
                        fetch_one=True) or {}
    return jsonify({'success': True, 'data': {
        'quorum_required': row.get('quorum_required'),
        'quorum_basis': row.get('quorum_basis'),
        'updated_at': row['updated_at'].isoformat() if row.get('updated_at') else None,
    }})


@board_meetings_bp.route('/settings', methods=['PUT'])
@require_roles(*ORGANISER_ROLES)
def set_board_settings():
    """Set the board-wide quorum. Applies to meetings created from now on —
    existing meetings keep the rule they were created under."""
    data = request.get_json() or {}
    raw = data.get('quorum_required')
    quorum = None
    if raw not in (None, ''):
        try:
            quorum = int(raw)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'quorum_required must be a whole number'}), 400
        if quorum < 1:
            return jsonify({'success': False, 'message': 'Quorum must be at least 1'}), 400
        seats = (execute_query("""
            SELECT COUNT(*) AS n FROM users
            WHERE role = 'board_member' OR secondary_roles::text ILIKE '%%board_member%%'
        """, fetch_one=True) or {}).get('n') or 0
        if seats and quorum > seats:
            return jsonify({'success': False,
                            'message': f'Quorum ({quorum}) cannot exceed the {seats} board members on the platform.'}), 400
    try:
        execute_query("""
            UPDATE board_settings
            SET quorum_required = %s, quorum_basis = %s, updated_by = %s, updated_at = NOW()
            WHERE id = 1
        """, (quorum, (data.get('quorum_basis') or '').strip() or None,
              str(get_jwt_identity())[:15]), fetch_all=False)
        return jsonify({'success': True, 'data': {'quorum_required': quorum}})
    except Exception as e:
        logger.error(f"set board settings failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to save the quorum rule'}), 500
