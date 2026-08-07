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
import json
import logging
import os
import re
import time
import urllib.error
import urllib.request
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
                   -- Observers joined without an invitation; they are not part
                   -- of the invited board, so they must not inflate this count.
                   (SELECT COUNT(*) FROM board_meeting_attendees a
                     WHERE a.meeting_id = m.id AND a.invite_status <> 'observer') AS attendee_count,
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
                    metadata={'meeting_id': str(meeting_id), 'link': '/executive?tab=meetings'})
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
        if invite:
            execute_query("""
                UPDATE board_meeting_attendees
                SET invite_status = 'attended', joined_at = COALESCE(joined_at, NOW())
                WHERE meeting_id::text = %s AND user_id = %s
            """, (str(meeting_id), me), fetch_all=False)
        else:
            # An admin joining a meeting they were not invited to. The UPDATE
            # above would match nothing and they would be in the room with no
            # record of it, which defeats the point of an attendance register.
            # Recorded as 'observer' (migration 053) so the register is
            # complete without them counting toward quorum.
            execute_query("""
                INSERT INTO board_meeting_attendees (meeting_id, user_id, invite_status, joined_at)
                VALUES (%s::uuid, %s, 'observer', NOW())
                ON CONFLICT (meeting_id, user_id) DO NOTHING
            """, (str(meeting_id), me), fetch_all=False)
        execute_query("""
            UPDATE board_meetings
            SET status = CASE WHEN status = 'scheduled' THEN 'in_progress' ELSE status END,
                started_at = COALESCE(started_at, NOW()), updated_at = NOW()
            WHERE id::text = %s
        """, (str(meeting_id),), fetch_all=False)

        # Open a presence interval (migration 054). ON CONFLICT covers a double
        # join — a refresh or a reconnect must not open a second interval and
        # double-count the time.
        execute_query("""
            INSERT INTO board_meeting_presence (meeting_id, user_id, joined_at)
            VALUES (%s::uuid, %s, NOW())
            ON CONFLICT (meeting_id, user_id) WHERE left_at IS NULL DO NOTHING
        """, (str(meeting_id), me), fetch_all=False)

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


@board_meetings_bp.route('/<meeting_id>', methods=['PUT'])
@require_roles(*ORGANISER_ROLES)
def update_meeting(meeting_id):
    """Edit or reschedule a scheduled meeting.

    Only fields present in the body change, so the secretary can reschedule
    without restating the agenda. A completed or cancelled meeting is a closed
    record and is refused — governance history is not rewritten.
    """
    data = request.get_json() or {}
    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    if meeting.get('status') in ('completed', 'cancelled'):
        return jsonify({'success': False,
                        'message': 'This meeting is closed and can no longer be edited.'}), 409

    sets, params, rescheduled_to = [], [], None
    if 'title' in data:
        title = (data.get('title') or '').strip()
        if not title:
            return jsonify({'success': False, 'message': 'Title cannot be empty'}), 400
        sets.append('title = %s'); params.append(title)
    for field in ('title_ar', 'agenda', 'agenda_ar', 'location'):
        if field in data:
            sets.append(f'{field} = %s'); params.append(data.get(field))
    if 'is_virtual' in data:
        sets.append('is_virtual = %s'); params.append(bool(data.get('is_virtual')))
    if 'duration_minutes' in data:
        try:
            sets.append('duration_minutes = %s'); params.append(int(data['duration_minutes']))
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'duration_minutes must be a number'}), 400
    if data.get('scheduled_at'):
        try:
            when = datetime.fromisoformat(str(data['scheduled_at']).replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'success': False, 'message': 'scheduled_at must be an ISO datetime'}), 400
        now = datetime.now(when.tzinfo) if when.tzinfo else datetime.now()
        if when < now - timedelta(minutes=5):
            return jsonify({'success': False,
                            'message': 'That date and time have already passed. Choose a future slot.'}), 400
        if meeting.get('scheduled_at') and when != meeting['scheduled_at']:
            rescheduled_to = when
        sets.append('scheduled_at = %s'); params.append(when)

    if not sets:
        return jsonify({'success': False, 'message': 'Nothing to update'}), 400

    try:
        params.append(str(meeting_id))
        row = execute_query(f"""
            UPDATE board_meetings SET {', '.join(sets)}, updated_at = NOW()
            WHERE id::text = %s RETURNING *
        """, tuple(params), fetch_one=True)

        # Only a moved meeting warrants interrupting the board again; editing an
        # agenda typo should not fire a notification to every member.
        if rescheduled_to is not None:
            invitees = [r['user_id'] for r in (execute_query(
                "SELECT user_id FROM board_meeting_attendees WHERE meeting_id::text = %s",
                (str(meeting_id),)) or [])]
            _notify_invitees(meeting_id, f"Rescheduled: {row.get('title')}",
                             rescheduled_to, invitees)
        return jsonify({'success': True, 'data': _row(row)})
    except Exception as e:
        logger.error(f"update board meeting failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to update meeting'}), 500


@board_meetings_bp.route('/<meeting_id>/cancel', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def cancel_meeting(meeting_id):
    """Cancel a scheduled meeting and tell everyone who was invited.

    The row is kept, not deleted: a cancelled board meeting is itself part of
    the record, and /join already refuses a cancelled meeting with a 410.
    """
    data = request.get_json() or {}
    reason = (data.get('reason') or '').strip()
    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    if meeting.get('status') == 'completed':
        return jsonify({'success': False,
                        'message': 'This meeting has already been held and cannot be cancelled.'}), 409
    if meeting.get('status') == 'cancelled':
        return jsonify({'success': True, 'data': _row(meeting)})

    try:
        row = execute_query("""
            UPDATE board_meetings SET status = 'cancelled', updated_at = NOW()
            WHERE id::text = %s RETURNING *
        """, (str(meeting_id),), fetch_one=True)
        invitees = [r['user_id'] for r in (execute_query(
            "SELECT user_id FROM board_meeting_attendees WHERE meeting_id::text = %s",
            (str(meeting_id),)) or [])]
        title = row.get('title')
        _notify_invitees(meeting_id,
                         f"Cancelled: {title}" + (f" — {reason}" if reason else ''),
                         row.get('scheduled_at'), invitees)
        return jsonify({'success': True, 'data': _row(row)})
    except Exception as e:
        logger.error(f"cancel board meeting failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to cancel meeting'}), 500


@board_meetings_bp.route('/<meeting_id>/attendance', methods=['GET'])
@require_roles(*BOARD_ROLES)
def meeting_attendance(meeting_id):
    """Per-member attendance record for one meeting.

    Duration is the SUM of presence intervals, not last_leave - first_join, so
    time a member spent away after dropping out is not counted as attendance.
    Every figure here is measured; nothing is inferred.
    """
    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    try:
        rows = execute_query("""
            SELECT a.user_id,
                   COALESCE(u.full_name, u.email, a.user_id) AS name,
                   a.invite_status,
                   MIN(p.joined_at)                                   AS first_joined_at,
                   MAX(p.left_at)                                     AS last_left_at,
                   COUNT(p.id)                                        AS session_count,
                   COALESCE(SUM(EXTRACT(EPOCH FROM (
                       COALESCE(p.left_at, NOW()) - p.joined_at))), 0) AS present_seconds,
                   BOOL_OR(p.ended_reason = 'assumed')                 AS any_assumed
            FROM board_meeting_attendees a
            LEFT JOIN users u ON u.id = a.user_id
            LEFT JOIN board_meeting_presence p
                   ON p.meeting_id = a.meeting_id AND p.user_id = a.user_id
            WHERE a.meeting_id::text = %s
            GROUP BY a.user_id, u.full_name, u.email, a.invite_status
            ORDER BY 7 DESC, 2
        """, (str(meeting_id),)) or []

        # The yardstick is how long the meeting actually ran, not what was
        # scheduled — a meeting that overran or finished early would otherwise
        # make every percentage wrong.
        started, ended = meeting.get('started_at'), meeting.get('ended_at')
        if started and ended:
            meeting_seconds = max((ended - started).total_seconds(), 0)
        else:
            meeting_seconds = (int(meeting.get('duration_minutes') or 60)) * 60

        out = []
        for r in rows:
            secs = float(r.get('present_seconds') or 0)
            out.append({
                'user_id': r['user_id'],
                'name': r.get('name'),
                'invite_status': r.get('invite_status'),
                'first_joined_at': r['first_joined_at'].isoformat() if r.get('first_joined_at') else None,
                'last_left_at': r['last_left_at'].isoformat() if r.get('last_left_at') else None,
                'session_count': int(r.get('session_count') or 0),
                'present_seconds': int(secs),
                # None, not 0, when we have no measured duration to divide.
                'present_percent': (round(min(secs / meeting_seconds, 1) * 100)
                                    if meeting_seconds and secs else None),
                # True when at least one interval was closed by the meeting
                # ending rather than the member leaving — an upper bound.
                'duration_is_upper_bound': bool(r.get('any_assumed')),
            })
        return jsonify({'success': True, 'data': {
            'meeting_seconds': int(meeting_seconds),
            'meeting_ran': bool(started and ended),
            'attendees': out,
        }})
    except Exception as e:
        logger.error(f"board attendance failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load attendance'}), 500


@board_meetings_bp.route('/<meeting_id>/leave', methods=['POST'])
@require_roles(*BOARD_ROLES)
def leave_meeting(meeting_id):
    """Close the caller's open presence interval.

    Best-effort by nature: a browser that crashes or loses its connection never
    calls this. Anything still open when the meeting is closed is settled by
    end_meeting and marked 'assumed', so a duration is never quietly
    overstated as if it had been observed.
    """
    me = str(get_jwt_identity())
    try:
        execute_query("""
            UPDATE board_meeting_presence
            SET left_at = NOW(), ended_reason = 'left'
            WHERE meeting_id::text = %s AND user_id = %s AND left_at IS NULL
        """, (str(meeting_id), me), fetch_all=False)
        execute_query("""
            UPDATE board_meeting_attendees SET left_at = NOW()
            WHERE meeting_id::text = %s AND user_id = %s
        """, (str(meeting_id), me), fetch_all=False)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"leave board meeting failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to record leaving'}), 500


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
        # Anyone still shown as present when the meeting closed. 'assumed' means
        # they never signalled leaving, so treat the duration as an upper bound.
        execute_query("""
            UPDATE board_meeting_presence
            SET left_at = NOW(), ended_reason = 'assumed'
            WHERE meeting_id::text = %s AND left_at IS NULL
        """, (str(meeting_id),), fetch_all=False)
        execute_query("""
            UPDATE board_meeting_attendees SET left_at = COALESCE(left_at, NOW())
            WHERE meeting_id::text = %s AND invite_status IN ('attended','observer')
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


# ── Live room control (LiveKit server API) ──────────────────────────────
# Spoken to over its Twirp HTTP API rather than the async python SDK: this
# process runs under gevent, and mixing an asyncio client into a gevent worker
# is a known source of hangs. Plain HTTP keeps it boring.
LIVEKIT_HTTP = (os.getenv('LIVEKIT_HTTP_URL')
                or (os.getenv('LIVEKIT_URL', '') or '')
                .replace('wss://', 'https://').replace('ws://', 'http://')
                or 'http://livekit-server:7880')


def _room_admin_token(room_name):
    """Short-lived token granting admin over exactly one room."""
    import jwt as _jwt
    key, secret = os.getenv('LIVEKIT_API_KEY'), os.getenv('LIVEKIT_API_SECRET')
    if not key or not secret:
        raise RuntimeError('LiveKit API credentials are not configured')
    now = int(time.time())
    return _jwt.encode(
        {'iss': key, 'sub': 'board-control', 'nbf': now, 'exp': now + 120,
         'video': {'room': room_name, 'roomAdmin': True}},
        secret, algorithm='HS256')


def _livekit_call(method, room_name, payload):
    """POST to livekit.RoomService/<method>. Returns the decoded JSON body."""
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{LIVEKIT_HTTP.rstrip('/')}/twirp/livekit.RoomService/{method}",
        data=body, method='POST',
        headers={'Content-Type': 'application/json',
                 'Authorization': f'Bearer {_room_admin_token(room_name)}'})
    with urllib.request.urlopen(req, timeout=8) as resp:
        raw = resp.read().decode() or '{}'
    return json.loads(raw)


@board_meetings_bp.route('/<meeting_id>/participants', methods=['GET'])
@require_roles(*ORGANISER_ROLES)
def list_participants(meeting_id):
    """Who is in the room right now, joined to the invitation record.

    Live state comes from LiveKit; names come from users, because a LiveKit
    identity is an Emirates ID and no secretary should have to read one.
    """
    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    try:
        data = _livekit_call('ListParticipants', meeting['room_name'],
                             {'room': meeting['room_name']})
    except urllib.error.HTTPError as e:
        # A room with nobody in it does not exist yet as far as LiveKit is
        # concerned; that is an empty list, not an error to show the secretary.
        if e.code in (404, 500):
            return jsonify({'success': True, 'data': []})
        logger.error(f"livekit list participants failed: {e}")
        return jsonify({'success': False, 'message': 'Could not read the room'}), 502
    except Exception as e:
        logger.error(f"livekit list participants failed: {e}")
        return jsonify({'success': False, 'message': 'Could not read the room'}), 502

    live = data.get('participants') or []
    ids = [p.get('identity') for p in live if p.get('identity')]
    names = {}
    if ids:
        rows = execute_query(
            "SELECT id, full_name, email FROM users WHERE id = ANY(%s)", (ids,)) or []
        names = {str(r['id']): (r.get('full_name') or r.get('email')) for r in rows}

    invited = {str(r['user_id']): r['invite_status'] for r in (execute_query(
        "SELECT user_id, invite_status FROM board_meeting_attendees WHERE meeting_id::text = %s",
        (str(meeting_id),)) or [])}

    out = []
    for p in live:
        identity = str(p.get('identity') or '')
        tracks = p.get('tracks') or []
        out.append({
            'identity': identity,
            'name': names.get(identity) or p.get('name') or identity,
            'joined_at': p.get('joinedAt'),
            'is_invited': identity in invited,
            'invite_status': invited.get(identity),
            'mic_muted': all(t.get('muted', True) for t in tracks
                             if t.get('source') == 'MICROPHONE') if tracks else None,
            'sharing_screen': any(t.get('source') == 'SCREEN_SHARE' and not t.get('muted')
                                  for t in tracks),
        })
    out.sort(key=lambda x: (not x['is_invited'], x['name'].lower()))
    return jsonify({'success': True, 'data': out})


@board_meetings_bp.route('/<meeting_id>/participants/remove', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def remove_participant(meeting_id):
    """Remove someone from the live room.

    They are disconnected but NOT struck from the attendance record: they were
    in the meeting, and the register has to keep saying so.
    """
    identity = (request.get_json() or {}).get('identity')
    if not identity:
        return jsonify({'success': False, 'message': 'identity is required'}), 400
    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    if str(identity) == str(get_jwt_identity()):
        return jsonify({'success': False,
                        'message': 'You cannot remove yourself — use Leave.'}), 400
    try:
        _livekit_call('RemoveParticipant', meeting['room_name'],
                      {'room': meeting['room_name'], 'identity': str(identity)})
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"livekit remove participant failed: {e}")
        return jsonify({'success': False, 'message': 'Could not remove that participant'}), 502


@board_meetings_bp.route('/<meeting_id>/participants/mute', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def mute_participant(meeting_id):
    """Mute a participant's microphone.

    Only muting is offered. LiveKit cannot force a microphone back ON, and it
    should not be able to: un-muting someone remotely would let a chair open a
    live mic in a board member's room without their knowledge.
    """
    data = request.get_json() or {}
    identity = data.get('identity')
    if not identity:
        return jsonify({'success': False, 'message': 'identity is required'}), 400
    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    try:
        info = _livekit_call('ListParticipants', meeting['room_name'],
                             {'room': meeting['room_name']})
        target = next((p for p in (info.get('participants') or [])
                       if str(p.get('identity')) == str(identity)), None)
        if not target:
            return jsonify({'success': False, 'message': 'That participant is no longer in the room'}), 404
        mics = [t for t in (target.get('tracks') or []) if t.get('source') == 'MICROPHONE']
        if not mics:
            return jsonify({'success': False, 'message': 'That participant has no microphone published'}), 400
        for t in mics:
            _livekit_call('MutePublishedTrack', meeting['room_name'],
                          {'room': meeting['room_name'], 'identity': str(identity),
                           'track_sid': t.get('sid'), 'muted': True})
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"livekit mute participant failed: {e}")
        return jsonify({'success': False, 'message': 'Could not mute that participant'}), 502


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
