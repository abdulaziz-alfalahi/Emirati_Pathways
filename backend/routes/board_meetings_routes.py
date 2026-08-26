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

# What time it is here — see backend/platform_time.py. A naive timestamp in this
# database is Gulf wall-clock time; comparing it against datetime.now() (UTC in
# the container) refused sessions that had already started.
try:
    from backend import platform_time
except ImportError:  # pragma: no cover — the app runs under both roots
    import platform_time


try:
    from backend.auth.access_control import (require_roles, require_auth, resolve_roles,
                                              ADMIN_ROLES, BOARD_ROLES, OPERATOR_ROLES,
                                              CHAIRMAN_ROLES)
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import (require_roles, require_auth, resolve_roles,
                                     ADMIN_ROLES, BOARD_ROLES, OPERATOR_ROLES,
                                     CHAIRMAN_ROLES)
    from db_utils import execute_query

logger = logging.getLogger(__name__)

try:
    from backend import outbound_mail
    from backend.brand import COUNCIL_NAME_EN, COUNCIL_NAME_AR, BILINGUAL_RULE
except ImportError:  # pragma: no cover — the app runs under both roots
    import outbound_mail
    from brand import COUNCIL_NAME_EN, COUNCIL_NAME_AR, BILINGUAL_RULE

from html import escape as html_escape

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
        'is_historical': bool(m.get('is_historical')),
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
    when = platform_time.aware(when)
    now = platform_time.now()
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

        # THE ORGANISER, as an observer.
        #
        # Joining requires a row in board_meeting_attendees (or an admin role),
        # and creating a meeting did not add one — so the board secretary
        # scheduled meetings they were then structurally unable to enter
        # (feedback fb_1787129359, fb_1787135104: 403 "You are not on the
        # attendee list for this meeting"). board_operator is not in
        # ADMIN_ROLES, so nothing else let them in.
        #
        # 'observer' and NOT 'attended'/'invited', because the secretary is the
        # RAPPORTEUR (owner, 2026-08-20): present to record the meeting, not to
        # be counted in it. Quorum counts invite_status='attended' only
        # (migration 053), so this admits them to the room without inflating
        # the number that decides whether the board could lawfully sit.
        #
        # DO NOTHING on conflict: a secretary who is also a board member keeps
        # their real invitation rather than being demoted to observer.
        organiser = str(get_jwt_identity())[:15]
        execute_query("""
            INSERT INTO board_meeting_attendees (meeting_id, user_id, invite_status)
            VALUES (%s, %s, 'observer') ON CONFLICT (meeting_id, user_id) DO NOTHING
        """, (meeting_id, organiser), fetch_all=False)

        _notify_invitees(meeting_id, title, when, invitees)
        queued = _queue_office_notifications(row, 'scheduled', invitees)
        payload = _row(row)
        payload['office_notifications_queued'] = queued
        return jsonify({'success': True, 'data': payload}), 201
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


def _notify_organisers_of_waiting(meeting_id, meeting, waiter_id):
    """Tell the organisers somebody is at the door. Best-effort.

    Without this the waiting room is a trap: the guest sits on a polite screen
    and nobody knows to let them in. The organiser's panel also polls, but the
    notification is what reaches an organiser who is not looking at that panel.
    """
    try:
        try:
            from backend.notification_helper import create_notification
        except ImportError:  # pragma: no cover
            from notification_helper import create_notification

        who = execute_query("SELECT full_name, email FROM users WHERE id = %s",
                            (str(waiter_id),), fetch_one=True) or {}
        name = who.get('full_name') or who.get('email') or str(waiter_id)

        organisers = execute_query("""
            SELECT DISTINCT a.user_id
              FROM board_meeting_attendees a
             WHERE a.meeting_id::text = %s
               AND a.invite_status <> 'observer'
               AND COALESCE(a.requires_admission, FALSE) IS FALSE
        """, (str(meeting_id),)) or []
        targets = {str(r['user_id']) for r in organisers}
        if meeting.get('created_by'):
            targets.add(str(meeting['created_by']))

        for uid in targets:
            try:
                create_notification(
                    user_id=uid, notification_type='board_meeting_waiting',
                    title='Someone is waiting to be admitted',
                    message=f"{name} is waiting to join {meeting.get('title') or 'the board meeting'}.",
                    metadata={'meeting_id': str(meeting_id),
                              'link': f"/board-meeting/{meeting_id}"})
            except Exception as _e:
                logger.warning(f"waiting-room notification failed for {uid}: {_e}")
    except Exception as e:  # pragma: no cover
        logger.warning(f"waiting-room notifications skipped: {e}")


# ── Board members' offices ──────────────────────────────────────────────
# The offices are EXTERNAL email addresses, not platform users, so they cannot
# be reached by in-app notifications.
#
# This used to write to board_office_notifications, a queue of its own, because
# outbound SMTP was blocked at the firewall and nothing could be delivered. That
# premise no longer holds: the platform sends through Microsoft Graph over
# HTTPS, which never needed the SMTP port.
#
# It now goes through outbound_mail like every other outbound message, so board
# notices get the same template approval, the same per-operator cap and the same
# audit as candidate and employer mail. A second queue with its own rules would
# be a blind spot in exactly the view the owner uses to check what left the
# platform — and it was one: migration 086 found 46 rows sitting here, 42 of
# them announcing test meetings that had already been deleted.
#
# board_office_notifications is kept as history and is no longer written to.

def _board_notice_parts(meeting, kind):
    """(subject, text, html) for one board office notice, bilingual.

    The KIND changes the wording — scheduled, rescheduled, cancelled are three
    different messages to an office diary, and "has been updated" would be worse
    than any of them. All three are sampled for approval together.
    """
    when = meeting.get('scheduled_at')
    when_en = when.strftime('%d %B %Y at %H:%M') if when else 'a date to be confirmed'
    when_ar = when.strftime('%Y-%m-%d %H:%M') if when else 'موعد يُحدَّد لاحقاً'
    title = meeting.get('title') or 'Board meeting'
    where = meeting.get('location') or ('Online' if meeting.get('is_virtual') else 'To be confirmed')
    minutes = meeting.get('duration_minutes') or 60
    agenda = (meeting.get('agenda') or '').strip()

    verb_en = {'scheduled': 'has been scheduled',
               'rescheduled': 'has been rescheduled',
               'cancelled': 'has been cancelled'}.get(kind, 'has been updated')
    verb_ar = {'scheduled': 'تم تحديد موعد',
               'rescheduled': 'تم تغيير موعد',
               'cancelled': 'تم إلغاء'}.get(kind, 'تم تحديث')

    subject = (f'{COUNCIL_NAME_EN} — board meeting {verb_en}: {title} / '
               f'{verb_ar} اجتماع المجلس: {title}')

    text = (
        f'Dear Office,\n'
        f'\n'
        f'The {COUNCIL_NAME_EN} board meeting "{title}" {verb_en}.\n'
        f'\n'
        f'Date and time: {when_en}\n'
        f'Duration: {minutes} minutes\n'
        f'Location: {where}\n'
        + (f'\n{agenda}\n' if agenda else '')
        + f'\n'
        f'This notice is sent to the office of the board member so the meeting '
        f'can be coordinated in advance.\n'
        f'\n'
        f'— {COUNCIL_NAME_EN}\n'
        f'\n'
        f'{BILINGUAL_RULE}\n'
        f'\n'
        f'إلى مكتب سعادة عضو المجلس،\n'
        f'\n'
        f'{verb_ar} اجتماع {COUNCIL_NAME_AR} "{title}".\n'
        f'\n'
        f'التاريخ والوقت: {when_ar}\n'
        f'المدة: {minutes} دقيقة\n'
        f'المكان: {where}\n'
        + (f'\n{agenda}\n' if agenda else '')
        + f'\n'
        f'تُرسل هذه الإفادة إلى مكتب عضو المجلس لتنسيق الاجتماع مسبقاً.\n'
        f'\n'
        f'— {COUNCIL_NAME_AR}\n'
    )

    e = html_escape
    p = 'margin:0 0 12px'
    detail = (f'<p style="{p}">Date and time: <strong>{e(when_en)}</strong><br>'
              f'Duration: {minutes} minutes<br>Location: {e(where)}</p>')
    detail_ar = (f'<p style="{p}">التاريخ والوقت: <strong>{e(when_ar)}</strong><br>'
                 f'المدة: {minutes} دقيقة<br>المكان: {e(where)}</p>')
    agenda_html = f'<p style="{p};white-space:pre-wrap">{e(agenda)}</p>' if agenda else ''
    html = (
        '<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;'
        'font-size:15px;line-height:1.6;color:#1F2937">'
        f'<div dir="ltr" style="text-align:left">'
        f'<p style="{p}">Dear Office,</p>'
        f'<p style="{p}">The {COUNCIL_NAME_EN} board meeting '
        f'<strong>{e(title)}</strong> {verb_en}.</p>'
        + detail + agenda_html +
        f'<p style="{p}">This notice is sent to the office of the board member '
        'so the meeting can be coordinated in advance.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_EN}</p>'
        '</div>'
        '<hr style="border:none;border-top:1px solid #D1D5DB;margin:22px 0">'
        f'<div dir="rtl" style="text-align:right">'
        f'<p style="{p}">إلى مكتب سعادة عضو المجلس،</p>'
        f'<p style="{p}">{verb_ar} اجتماع {COUNCIL_NAME_AR} '
        f'<strong>{e(title)}</strong>.</p>'
        + detail_ar + agenda_html +
        f'<p style="{p}">تُرسل هذه الإفادة إلى مكتب عضو المجلس لتنسيق الاجتماع '
        'مسبقاً.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_AR}</p>'
        '</div>'
        '</div>'
    )
    return subject, text, html


def _queue_office_notifications(meeting, kind, invitees):
    """Queue an office notification per invited member. Never raises.

    A failure here must not break the meeting itself — the secretary scheduling
    a board meeting should not lose it because an office address was malformed.
    """
    try:
        if not invitees:
            return 0
        rows = execute_query("""
            SELECT o.user_id, o.email, o.office_name
            FROM board_member_offices o
            WHERE o.is_active AND o.user_id = ANY(%s)
        """, ([str(u)[:15] for u in invitees],)) or []
        if not rows:
            return 0

        subject, text, html = _board_notice_parts(meeting, kind)
        queued = 0
        for r in rows:
            if not (r.get('email') or '').strip():
                continue
            outbound_mail.queue(
                to_email=r['email'].strip(),
                to_name=r.get('office_name'),
                subject=subject,
                body_text=text,
                body_html=html,
                kind='board_office_notice',
                related_type='board_meeting',
                related_id=str(meeting['id']),
            )
            queued += 1
        return queued
    except Exception as e:
        # Never let an office notice failure break the meeting itself.
        logger.warning(f"queueing board office notifications failed: {e}")
        return 0


@board_meetings_bp.route('/offices', methods=['GET'])
@require_roles(*ORGANISER_ROLES)
def list_offices():
    """Every board member with the office contacts recorded for them."""
    try:
        members = execute_query("""
            SELECT id, COALESCE(full_name, email, id) AS name
            FROM users
            WHERE role = 'board_member' OR secondary_roles::text ILIKE '%%board_member%%'
            ORDER BY 2
        """) or []
        offices = execute_query("""
            SELECT id, user_id, office_name, email, phone, is_active
            FROM board_member_offices WHERE is_active ORDER BY office_name NULLS LAST, email
        """) or []
        by_member = {}
        for o in offices:
            by_member.setdefault(str(o['user_id']), []).append({
                'id': str(o['id']), 'office_name': o.get('office_name'),
                'email': o.get('email'), 'phone': o.get('phone'),
            })
        return jsonify({'success': True, 'data': [
            {'user_id': str(m['id']), 'name': m.get('name'),
             'offices': by_member.get(str(m['id']), [])} for m in members
        ]})
    except Exception as e:
        logger.error(f"list board offices failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load offices'}), 500


@board_meetings_bp.route('/offices', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def add_office():
    """Record an office contact for a board member."""
    data = request.get_json() or {}
    user_id = str(data.get('user_id') or '').strip()[:15]
    email = (data.get('email') or '').strip()
    if not user_id or not email:
        return jsonify({'success': False, 'message': 'A board member and an email address are required'}), 400
    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({'success': False, 'message': 'That does not look like an email address'}), 400
    try:
        row = execute_query("""
            INSERT INTO board_member_offices (user_id, office_name, email, phone, created_by)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id, lower(email))
            DO UPDATE SET office_name = EXCLUDED.office_name,
                          phone = EXCLUDED.phone,
                          is_active = true,
                          updated_at = now()
            RETURNING id
        """, (user_id, data.get('office_name'), email, data.get('phone'),
              str(get_jwt_identity())[:15]), fetch_one=True)
        return jsonify({'success': True, 'data': {'id': str(row['id'])}}), 201
    except Exception as e:
        logger.error(f"add board office failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to save the office contact'}), 500


@board_meetings_bp.route('/offices/<office_id>', methods=['PUT'])
@require_roles(*ORGANISER_ROLES)
def update_office(office_id):
    """Change an office contact in place (#393).

    Distinct from POST, which upserts on (user_id, lower(email)). That is right
    for "record this office", but it cannot express "this office's address has
    changed": a new email is a different conflict key, so POST would insert a
    SECOND row and leave the old address behind, still active and still due to
    be notified. The secretary would have no way to tell from the list which of
    the two is current.

    Updating by row id says what was meant. The member the office belongs to is
    deliberately NOT changeable — moving a contact between board members is two
    operations, not an edit.
    """
    data = request.get_json() or {}
    email = (data.get('email') or '').strip()
    if not email:
        return jsonify({'success': False, 'message': 'An email address is required'}), 400
    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({'success': False, 'message': 'That does not look like an email address'}), 400

    existing = execute_query(
        "SELECT id, user_id FROM board_member_offices WHERE id = %s", (office_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Office contact not found'}), 404

    # The unique index is (user_id, lower(email)); a collision means this member
    # already has that address recorded, which is a merge, not an edit.
    clash = execute_query(
        """SELECT id FROM board_member_offices
            WHERE user_id = %s AND lower(email) = lower(%s) AND id <> %s""",
        (existing['user_id'], email, office_id), fetch_one=True)
    if clash:
        return jsonify({'success': False,
                        'message': 'That email is already recorded for this board member'}), 409

    try:
        execute_query("""
            UPDATE board_member_offices
               SET office_name = %s, email = %s, phone = %s, updated_at = now()
             WHERE id = %s
        """, (data.get('office_name'), email, data.get('phone'), office_id), fetch_all=False)
        logger.info("board office %s updated by %s", office_id, str(get_jwt_identity()))
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"update board office failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to update the office contact'}), 500


@board_meetings_bp.route('/offices/<office_id>', methods=['DELETE'])
@require_roles(*ORGANISER_ROLES)
def remove_office(office_id):
    """Deactivate an office contact. The row stays: notifications already queued
    to it are part of the record of who was told what."""
    try:
        execute_query("""
            UPDATE board_member_offices SET is_active = false, updated_at = now()
            WHERE id::text = %s
        """, (str(office_id),), fetch_all=False)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"remove board office failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to remove the office contact'}), 500


@board_meetings_bp.route('/office-notifications', methods=['GET'])
@require_roles(*ORGANISER_ROLES)
def office_notifications():
    """What is queued for the offices, and whether it has actually gone out."""
    try:
        # Reads outbound_mail, not board_office_notifications. Board notices
        # moved onto the shared queue so they get the same approval, cap and
        # audit as everything else; the old table is history and is no longer
        # written to. Its 46 retired rows are deliberately NOT shown here —
        # 42 of them announced meetings that no longer exist, and surfacing
        # them as a backlog would invite someone to try to deliver them.
        rows = execute_query("""
            SELECT n.id, n.related_id AS meeting_id, n.to_email AS office_email,
                   n.to_name AS office_name, n.subject, n.status,
                   n.created_at AS queued_at, n.sent_at, n.last_error,
                   n.release_basis,
                   m.title AS meeting_title
            FROM outbound_mail n
            LEFT JOIN board_meetings m
                   ON n.related_type = 'board_meeting'
                  AND m.id::text = n.related_id
            WHERE n.kind = 'board_office_notice'
            ORDER BY n.created_at DESC
            LIMIT 100
        """) or []
        return jsonify({'success': True, 'data': [{
            'id': str(r['id']),
            'meeting_title': r.get('meeting_title'),
            # The queue view titles each row with this; selected but never
            # returned, so every notice rendered with a blank heading.
            'subject': r.get('subject'),
            'office_email': r.get('office_email'),
            'office_name': r.get('office_name'),
            # 'kind' was scheduled/rescheduled/cancelled. That now lives in
            # the subject line rather than a separate column, so it is not
            # invented here — an empty field would render as a blank label.
            'status': r.get('status'),
            'release_basis': r.get('release_basis'),
            'queued_at': r['queued_at'].isoformat() if r.get('queued_at') else None,
            'sent_at': r['sent_at'].isoformat() if r.get('sent_at') else None,
        } for r in rows]})
    except Exception as e:
        logger.error(f"office notifications failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load office notifications'}), 500


@board_meetings_bp.route('/historical', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def create_historical_meeting():
    """Record a board meeting that was held before the platform existed.

    Entered after the fact for the archive, so it gets no room and is never
    joinable. It is stored as completed because it has been held — but with
    is_historical set, so nothing presents its empty attendance record as
    evidence that nobody attended.
    """
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    held_on = (data.get('scheduled_at') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400
    if not held_on:
        return jsonify({'success': False, 'message': 'The date it was held is required'}), 400
    try:
        when = datetime.fromisoformat(held_on.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'success': False, 'message': 'Date must be an ISO datetime'}), 400

    when = platform_time.aware(when)
    now = platform_time.now()
    if when > now:
        return jsonify({'success': False,
                        'message': 'That date is in the future. Use Schedule meeting for a meeting still to come.'}), 400

    try:
        # duration_minutes is NOT NULL, but how long a 2022 meeting ran is often
        # simply not known. Rather than invent a figure, the column is left out
        # of the INSERT so the table default applies, and the archive view never
        # displays a duration for a historical record — an unknown must not be
        # dressed up as a measurement.
        try:
            duration = int(data.get('duration_minutes'))
            duration = duration if duration > 0 else None
        except (TypeError, ValueError):
            duration = None

        if duration is None:
            row = execute_query("""
                INSERT INTO board_meetings
                    (title, title_ar, agenda, agenda_ar, scheduled_at,
                     location, is_virtual, room_name, status, is_historical, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, false, NULL, 'completed', true, %s)
                RETURNING *
            """, (title, data.get('title_ar'), data.get('agenda'), data.get('agenda_ar'),
                  when, data.get('location'), str(get_jwt_identity())[:15]), fetch_one=True)
        else:
            row = execute_query("""
                INSERT INTO board_meetings
                    (title, title_ar, agenda, agenda_ar, scheduled_at, duration_minutes,
                     location, is_virtual, room_name, status, is_historical, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, false, NULL, 'completed', true, %s)
                RETURNING *
            """, (title, data.get('title_ar'), data.get('agenda'), data.get('agenda_ar'),
                  when, duration, data.get('location'), str(get_jwt_identity())[:15]), fetch_one=True)

        if not row:
            return jsonify({'success': False, 'message': 'Failed to record the meeting'}), 500
        return jsonify({'success': True, 'data': _row(row)}), 201
    except Exception as e:
        logger.error(f"create historical board meeting failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to record the meeting'}), 500


@board_meetings_bp.route('/<meeting_id>/join', methods=['POST'])
@require_auth
def join_meeting(meeting_id):
    """Mint a LiveKit token for this meeting and record attendance.

    Refused when the caller is not an invitee, when the meeting is cancelled,
    or when it is outside the join window — a board room should not be open
    indefinitely.

    THE ATTENDEE LIST IS THE AUTHORITY HERE, NOT A ROLE.

    This was @require_roles(*BOARD_ROLES), which meant the additional attendees
    feature (PR #469) could invite someone the platform then refused at the
    door: the whole point of that feature is the subject expert brought in for
    one agenda item, and a subject expert is not a board member. An operator
    added as a guest hit "Forbidden - insufficient role" and had no way in.

    The role check was also the WEAKER of the two tests. A board_member who was
    never invited to THIS meeting passed it; the attendee-list check below is
    what actually decides, and it is per-meeting. Being on the list for a
    specific meeting is precisely the right authorisation to join that meeting.
    Anyone not on it still gets 403 immediately, and only organisers can add
    people to it.
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
        start = platform_time.aware(start)
        end = platform_time.aware(end)
        now = platform_time.now()
        if now < start - JOIN_WINDOW_BEFORE:
            # Same fix as the coaching join (fb_1787560378): a bare wall-clock
            # time does not say whose clock, and a board member joining from
            # another country reads it as their own.
            opens = start - JOIN_WINDOW_BEFORE
            return jsonify({'success': False, 'error_code': 'too_early',
                            'opens_at': platform_time.iso(opens),
                            'message': f"This meeting opens at "
                                       f"{platform_time.clock(opens)}."}), 409
        if now > end + JOIN_GRACE_AFTER:
            return jsonify({'success': False, 'error_code': 'closed',
                            'message': 'This meeting has ended.'}), 409

        # THE WAITING ROOM (GH #466).
        #
        # A guest brought in for one agenda item should not be in the room for
        # the items before theirs — a board discusses things the subject expert
        # invited for item 4 has no business hearing during items 1 to 3.
        #
        # The hold happens HERE, before a token is minted, because the token IS
        # the admission: anything that issues one and then hides the video has
        # put the guest in the room. LiveKit has no notion of our board roles.
        #
        # Organisers are never held — they are the ones who admit.
        is_organiser = bool(resolve_roles() & ORGANISER_ROLES)
        if invite and invite.get('requires_admission') and not invite.get('admitted_at') \
                and not is_organiser:
            # Stamp the knock, so the organiser's list can show who is actually
            # waiting rather than everyone who was ever marked as a guest.
            execute_query("""
                UPDATE board_meeting_attendees
                SET waiting_since = COALESCE(waiting_since, NOW())
                WHERE meeting_id::text = %s AND user_id = %s
            """, (str(meeting_id), me), fetch_all=False)
            _notify_organisers_of_waiting(meeting_id, meeting, me)
            return jsonify({
                'success': False,
                'error_code': 'awaiting_admission',
                'message': 'The organiser has been told you are here. '
                           'You will join when they admit you.',
            }), 202

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
            # AN OBSERVER WHO JOINS STAYS AN OBSERVER.
            #
            # Flipping every joiner to 'attended' silently promoted guests into
            # the quorum count: quorum is COUNT(*) WHERE invite_status =
            # 'attended' (twice — the live meeting list and the figure computed
            # when a meeting ends), and migration 053 made observers not count
            # precisely so that admitting a visitor could not change whether the
            # board was quorate.
            #
            # Reachable since additional attendees shipped (PR #469), which is
            # what put non-member guests on the invite list in the first place.
            # Caught by admitting a real guest and reading the row back, not by
            # reading the code.
            #
            # joined_at is still recorded, so attendance duration is measured
            # for observers too — they are on the register, just not in the count.
            execute_query("""
                UPDATE board_meeting_attendees
                SET invite_status = CASE WHEN invite_status = 'observer'
                                         THEN 'observer' ELSE 'attended' END,
                    joined_at = COALESCE(joined_at, NOW())
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
    # A historical record is data entry about the past, not the record of a
    # meeting this platform ran, so a typo in it must stay correctable.
    if meeting.get('status') in ('completed', 'cancelled') and not meeting.get('is_historical'):
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
        when = platform_time.aware(when)
        now = platform_time.now()
        if when < now - timedelta(minutes=5):
            return jsonify({'success': False,
                            'message': 'That date and time have already passed. Choose a future slot.'}), 400
        # BOTH sides made aware. `when` is now timezone-aware while the stored
        # column is naive, and Python raises TypeError rather than guessing when
        # those are compared — so converting one without the other turns a
        # reschedule into a 500.
        if meeting.get('scheduled_at') and when != platform_time.aware(meeting['scheduled_at']):
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
            _queue_office_notifications(row, 'rescheduled', invitees)
        return jsonify({'success': True, 'data': _row(row)})
    except Exception as e:
        logger.error(f"update board meeting failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to update meeting'}), 500


@board_meetings_bp.route('/invitable', methods=['GET'])
@require_roles(*ORGANISER_ROLES)
def list_invitable():
    """People the organiser can add to a meeting, searched by name or email.

    Additional attendees are usually NOT board members — they are the subject
    expert brought in for one agenda item (fb_1787129152). So this cannot be a
    board-member list; it has to be a search.

    CANDIDATES ARE EXCLUDED. Searching the whole users table from the board
    page would turn a meeting-admin screen into a directory of ~5,300 job
    seekers, searchable by name, for a role that has no business reading it.
    Staff and board roles only — everyone who could legitimately be asked to
    attend a board meeting is one of them, and a candidate is not.

    A query is REQUIRED: without one this would enumerate staff wholesale.
    """
    q = (request.args.get('q') or '').strip()
    if len(q) < 2:
        return jsonify({'success': True, 'data': []})

    invitable = sorted(BOARD_ROLES | OPERATOR_ROLES)
    like = f"%{q}%"
    try:
        rows = execute_query("""
            SELECT id, full_name, first_name, last_name, email, role, secondary_roles
              FROM users
             WHERE is_active IS TRUE
               AND (role = ANY(%s) OR EXISTS (
                     SELECT 1 FROM jsonb_array_elements_text(
                         CASE WHEN jsonb_typeof(secondary_roles) = 'array'
                              THEN secondary_roles ELSE '[]'::jsonb END) sr
                      WHERE sr = ANY(%s)))
               AND (full_name ILIKE %s OR email ILIKE %s
                    OR (COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) ILIKE %s)
             ORDER BY COALESCE(NULLIF(full_name, ''), email)
             LIMIT 20
        """, (invitable, invitable, like, like, like)) or []
        # Show the role that makes them INVITABLE, not necessarily their
        # primary one. The board secretary's own account is role='candidate'
        # with board_operator in secondary_roles, so listing the primary role
        # labelled them "candidate" in a board-meeting picker — accurate about
        # the column, misleading about the person.
        invitable_set = set(invitable)

        def shown_role(r):
            if r.get('role') in invitable_set:
                return r['role']
            for sr in (r.get('secondary_roles') or []):
                if sr in invitable_set:
                    return sr
            return r.get('role')

        data = [{
            'id': r['id'],
            'name': (r.get('full_name')
                     or ' '.join(filter(None, [r.get('first_name'), r.get('last_name')])).strip()
                     or r.get('email')),
            'email': r.get('email'),
            'role': shown_role(r),
        } for r in rows]
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        logger.error(f"list invitable failed: {e}")
        return jsonify({'success': False, 'message': 'Search failed'}), 500


@board_meetings_bp.route('/<meeting_id>/attendees', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def add_attendees(meeting_id):
    """Invite additional people to a meeting that already exists.

    "I can't invite additional attendees" (fb_1787129152). attendee_ids was
    honoured only at creation; update_meeting had no attendee handling at all,
    so a subject expert needed for one agenda item could not be added without
    recreating the meeting.

    Body: {"user_ids": [...], "counts_toward_quorum": false}

    COUNTS TOWARD QUORUM IS EXPLICIT AND DEFAULTS TO FALSE. Someone brought in
    to speak to one item is a guest, not a member — adding them as a counted
    attendee would change the number that decides whether the board could
    lawfully sit. The caller must ask for that deliberately.

    A completed or cancelled meeting is refused, as everywhere else.
    """
    data = request.get_json() or {}
    user_ids = [str(u)[:15] for u in (data.get('user_ids') or []) if u]
    if not user_ids:
        return jsonify({'success': False, 'message': 'user_ids is required'}), 400

    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    if meeting.get('status') in ('completed', 'cancelled'):
        return jsonify({'success': False,
                        'message': 'This meeting is closed and can no longer be edited.'}), 409

    counts = bool(data.get('counts_toward_quorum'))
    status = 'invited' if counts else 'observer'

    # Guests wait by default; members do not.
    #
    # Someone added as a counted member is the board — making them queue for
    # admission would be absurd. Someone added as a guest is, by definition,
    # here for part of the meeting, which is exactly the case the waiting room
    # exists for (GH #466). The caller can still say otherwise explicitly, for
    # the guest who is meant to hear the whole session.
    requires_admission = data.get('requires_admission')
    if requires_admission is None:
        requires_admission = not counts
    requires_admission = bool(requires_admission)

    added = []
    for uid in user_ids:
        try:
            # DO NOTHING, never DO UPDATE: re-adding an existing member must not
            # silently demote a counted attendee to an observer.
            row = execute_query("""
                INSERT INTO board_meeting_attendees
                       (meeting_id, user_id, invite_status, requires_admission)
                VALUES (%s::uuid, %s, %s, %s)
                ON CONFLICT (meeting_id, user_id) DO NOTHING
                RETURNING user_id
            """, (str(meeting_id), uid, status, requires_admission), fetch_one=True)
            if row:
                added.append(uid)
        except Exception as e:
            logger.warning(f"add attendee {uid} to {meeting_id} failed: {e}")

    if added:
        _notify_invitees(meeting_id, meeting.get('title') or 'Board meeting',
                         meeting.get('scheduled_at'), added)

    # Reports what actually happened: ids already on the list are not "added",
    # and saying they were would overstate the change.
    return jsonify({'success': True, 'data': {
        'added': added,
        'already_invited': [u for u in user_ids if u not in added],
        'counts_toward_quorum': counts,
        'requires_admission': requires_admission,
    }})


@board_meetings_bp.route('/<meeting_id>/waiting', methods=['GET'])
@require_roles(*ORGANISER_ROLES)
def list_waiting(meeting_id):
    """Who is at the door, oldest knock first.

    Only people who have actually TRIED to join (waiting_since is set) appear.
    A guest marked requires_admission who has not turned up yet is not waiting,
    and listing them would have the organiser admitting an empty chair.
    """
    try:
        rows = execute_query(f"""
            SELECT a.user_id, a.waiting_since, a.invite_status,
                   COALESCE(NULLIF(u.full_name, ''),
                            NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''),
                            u.email) AS name
              FROM board_meeting_attendees a
              LEFT JOIN users u ON u.id = a.user_id
             WHERE a.meeting_id::text = %s
               AND a.requires_admission
               AND a.admitted_at IS NULL
               AND a.waiting_since IS NOT NULL
             ORDER BY a.waiting_since ASC
        """, (str(meeting_id),)) or []
        return jsonify({'success': True, 'data': [{
            'user_id': r['user_id'],
            'name': r['name'],
            'waiting_since': r['waiting_since'].isoformat() if r.get('waiting_since') else None,
        } for r in rows]})
    except Exception as e:
        logger.error(f"list waiting failed for {meeting_id}: {e}")
        return jsonify({'success': False, 'message': 'Failed to load the waiting list'}), 500


@board_meetings_bp.route('/<meeting_id>/admit', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def admit_attendees(meeting_id):
    """Let one or more waiting guests in.

    Body: {"user_ids": [...]}

    Admission is granted ONCE, not per attempt: admitted_at stays set for the
    rest of the meeting, so a guest whose connection drops can rejoin without
    knocking again. Being dropped back to the door by a flaky network, midway
    through the item you were invited to speak to, would be worse than the
    problem this feature solves.

    Recorded with WHO admitted them — letting someone into a board meeting is a
    decision, and this subsystem records decisions.
    """
    data = request.get_json() or {}
    user_ids = [str(u)[:15] for u in (data.get('user_ids') or []) if u]
    if not user_ids:
        return jsonify({'success': False, 'message': 'user_ids is required'}), 400

    me = str(get_jwt_identity())
    meeting = execute_query("SELECT id, status, title FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    if meeting.get('status') in ('completed', 'cancelled'):
        return jsonify({'success': False,
                        'message': 'This meeting is closed.'}), 409

    admitted = []
    for uid in user_ids:
        try:
            # Only ever flips a row that is genuinely held and not yet admitted,
            # so a replayed click cannot rewrite who admitted someone or when.
            row = execute_query("""
                UPDATE board_meeting_attendees
                   SET admitted_at = NOW(), admitted_by = %s
                 WHERE meeting_id::text = %s AND user_id = %s
                   AND requires_admission AND admitted_at IS NULL
             RETURNING user_id
            """, (me, str(meeting_id), uid), fetch_one=True)
            if row:
                admitted.append(uid)
        except Exception as e:
            logger.warning(f"admit {uid} to {meeting_id} failed: {e}")

    for uid in admitted:
        try:
            try:
                from backend.notification_helper import create_notification
            except ImportError:  # pragma: no cover
                from notification_helper import create_notification
            create_notification(
                user_id=uid, notification_type='board_meeting_admitted',
                title='You have been admitted',
                message=f"You can now join {meeting.get('title') or 'the board meeting'}.",
                metadata={'meeting_id': str(meeting_id),
                          'link': f"/board-meeting/{meeting_id}"})
        except Exception as e:
            logger.warning(f"admission notification failed for {uid}: {e}")

    return jsonify({'success': True, 'data': {
        'admitted': admitted,
        # Ids that were not held, or were already in. Saying they were "admitted"
        # would overstate what happened.
        'not_waiting': [u for u in user_ids if u not in admitted],
    }})


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
        _queue_office_notifications(row, 'cancelled', invitees)
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


class _RoomUnreadable(Exception):
    """LiveKit could not be asked who is in the room."""


def _compute_quorum(meeting):
    """Who counts, who is present, and whether that is quorate.

    Extracted so the chair's declaration of a meeting open uses EXACTLY this
    rule rather than a second copy of it — the number that gets written into
    the record must be the number the chair was shown.
    """
    required = meeting.get('quorum_required')
    try:
        data = _livekit_call('ListParticipants', meeting['room_name'],
                             {'room': meeting['room_name']})
        live = data.get('participants') or []
    except urllib.error.HTTPError as e:
        # An empty room does not exist yet as far as LiveKit is concerned.
        if e.code in (404, 500):
            live = []
        else:
            logger.error(f"quorum: livekit read failed: {e}")
            raise _RoomUnreadable() from e
    except Exception as e:
        logger.error(f"quorum: livekit read failed: {e}")
        raise _RoomUnreadable() from e

    counting = {str(r['user_id']) for r in (execute_query(
        """SELECT user_id FROM board_meeting_attendees
            WHERE meeting_id::text = %s AND COALESCE(invite_status,'') <> 'observer'""",
        (str(meeting['id']),)) or [])}

    present_ids = {str(p.get('identity') or '') for p in live}
    present = len(present_ids & counting)

    return {
        'required': required,
        'present': present,
        # None, never False, when no quorum is configured: "we do not know" and
        # "not enough people" are different answers, and a chair told False
        # would wait for a threshold nobody set.
        'met': (present >= required) if required else None,
        # So the chair can see why the room count and the quorum count differ
        # without being shown who is who.
        'in_room_not_counted': len(present_ids) - present,
    }


@board_meetings_bp.route('/<meeting_id>/quorum', methods=['GET'])
@require_roles(*BOARD_ROLES)
def meeting_quorum(meeting_id):
    """Is this meeting quorate RIGHT NOW.

    Requested as "Pop-up to show quorum met for the chairman to begin the
    meeting" (fb_1787129509). Until now quorum was only computed when a meeting
    ENDED, which is the one moment the chair does not need it.

    PRESENT MEANS IN THE ROOM NOW, not "has joined at some point". invite_status
    flips to 'attended' on first join and never reverts, so counting that would
    keep a member in the tally after they left — and the chair would open a
    meeting that had quietly lost quorum. Live state comes from LiveKit, which
    is the only thing that knows who is actually connected.

    OBSERVERS ARE EXCLUDED, and so is anyone not on the attendee list. The
    secretary attends as rapporteur to record the meeting, not to be counted in
    it (owner, 2026-08-20) — the same rule end_meeting already applies.

    COUNTS ONLY — no names, no per-person state. Quorum is a fact about the
    meeting rather than about individuals, so this is readable by any board
    member, whereas /participants stays organiser-only because it exposes who is
    muted and who is sharing.
    """
    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404

    try:
        return jsonify({'success': True, 'data': _compute_quorum(meeting)})
    except _RoomUnreadable:
        return jsonify({'success': False, 'message': 'Could not read the room'}), 502


@board_meetings_bp.route('/<meeting_id>/open', methods=['POST'])
@require_roles(*CHAIRMAN_ROLES)
def declare_meeting_open(meeting_id):
    """The chair declares the meeting open, with quorum present.

    A meeting becoming 'in_progress' because somebody opened a browser tab is
    not the same event as the board being declared open, and the minutes should
    be able to say which happened. This records the second (owner ruling
    2026-08-21); the join path still handles the first and is untouched.

    REFUSED WITHOUT QUORUM, and refused when no quorum rule is configured — a
    chair cannot declare a board quorate against a threshold nobody set.

    The count is SNAPSHOTTED. Quorum is computed live from who is in the room,
    so it can be true at 10:05 and false at 10:25; without storing it, "was the
    board quorate when it opened?" stops being answerable the moment someone
    leaves. The rule in force is stored beside it so a later change to the
    board-wide quorum cannot rewrite a past meeting.
    """
    me = str(get_jwt_identity())
    meeting = execute_query("SELECT * FROM board_meetings WHERE id::text = %s",
                            (str(meeting_id),), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    if meeting.get('status') in ('completed', 'cancelled'):
        return jsonify({'success': False,
                        'message': 'This meeting is closed.'}), 409

    if meeting.get('opened_at'):
        # Not an error worth losing work over, but never overwritten: the first
        # declaration is the one that happened.
        who = execute_query("SELECT full_name, email FROM users WHERE id = %s",
                            (meeting['opened_by'],), fetch_one=True) or {}
        return jsonify({'success': False, 'error_code': 'already_open',
                        'message': 'This meeting was already declared open by '
                                   f"{who.get('full_name') or who.get('email') or 'the chair'}."}), 409

    try:
        q = _compute_quorum(meeting)
    except _RoomUnreadable:
        return jsonify({'success': False, 'message': 'Could not read the room'}), 502

    if q['met'] is None:
        return jsonify({'success': False, 'error_code': 'no_quorum_rule',
                        'message': 'No quorum rule is set for this board, so the '
                                   'meeting cannot be declared quorate.'}), 409
    if not q['met']:
        return jsonify({'success': False, 'error_code': 'not_quorate',
                        'message': f"Quorum is not met: {q['present']} of "
                                   f"{q['required']} required members are present.",
                        'data': q}), 409

    execute_query("""
        UPDATE board_meetings
           SET opened_at = NOW(), opened_by = %s,
               opened_quorum_present = %s, opened_quorum_required = %s,
               status = CASE WHEN status = 'scheduled' THEN 'in_progress' ELSE status END,
               updated_at = NOW()
         WHERE id::text = %s AND opened_at IS NULL
    """, (me[:15], q['present'], q['required'], str(meeting_id)), fetch_all=False)

    logger.info("board meeting %s declared open by chair %s (%s/%s present)",
                meeting_id, me, q['present'], q['required'])
    return jsonify({'success': True, 'data': {
        'opened_by': me,
        'quorum_present': q['present'],
        'quorum_required': q['required'],
    }})


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


# ══════════════════════════════════════════════════════════════════
# MINUTES — official governance records (migration 060)
#
# Owner decisions 2026-08-11: readable by board members, the secretary and
# Administrators; retained INDEFINITELY with deletion an Administrator-only act;
# drafts visible to those same roles; PDF only, 50 MB.
#
# The core property: minutes are NEVER overwritten in place. A correction
# inserts a new version and supersedes the previous one, which stays
# retrievable. If a minute could be silently replaced, this archive could not
# answer "what did the Board approve on that date?" — the only question it
# exists to answer.
# ══════════════════════════════════════════════════════════════════

MINUTES_MAX_BYTES = 50 * 1024 * 1024        # 50 MB (owner decision)
# The 50 MB rule is about the FILE. A multipart body carries part headers and
# boundaries on top of it, so the transport allowance has to sit slightly above
# the file limit — otherwise a genuinely valid 50 MB PDF is rejected by the
# envelope rather than by the rule, and the caller is told the wrong thing.
MINUTES_ENVELOPE_ALLOWANCE = 1 * 1024 * 1024
MINUTES_ALLOWED_TYPES = {'application/pdf'}  # PDF only — must render identically in years


def _storage():
    try:
        from backend import object_storage
    except ImportError:  # pragma: no cover - dual-root import
        import object_storage
    return object_storage


@board_meetings_bp.route('/<meeting_id>/minutes', methods=['GET'])
@require_roles(*BOARD_ROLES)
def list_minutes(meeting_id):
    """Versions for a meeting, newest first. Drafts included (owner decision).

    Soft-deleted rows are omitted — the tombstone exists for the audit trail,
    not for the reader.
    """
    try:
        rows = execute_query(
            """SELECT id, filename, content_type, size_bytes, sha256, version,
                      status, uploaded_by, uploaded_at, approved_by, approved_at
                 FROM board_minutes
                WHERE meeting_id = %s AND deleted_at IS NULL
                ORDER BY version DESC""",
            (meeting_id,)) or []

        # Decide removability HERE rather than letting the UI infer it from
        # status and a client clock (#391). The same helper the DELETE handler
        # uses, so the button and the endpoint cannot disagree — a Remove button
        # that 403s is worse than no button at all.
        roles = resolve_roles()
        out = []
        for r in rows:
            can_delete, why_not = _may_delete_minutes(r, roles)
            expires = None
            if (r.get('status') == 'approved' and r.get('approved_at')
                    and not (roles & ADMIN_ROLES) and can_delete):
                expires = (r['approved_at'] + MINUTES_SELF_DELETE_GRACE).isoformat()
            out.append({
                'id': str(r['id']),
                'filename': r['filename'],
                'size_bytes': r['size_bytes'],
                'sha256': r['sha256'],
                'version': r['version'],
                'status': r['status'],
                'uploaded_at': r['uploaded_at'].isoformat() if r.get('uploaded_at') else None,
                'approved_at': r['approved_at'].isoformat() if r.get('approved_at') else None,
                'can_delete': can_delete,
                # Why not, in a sentence naming who can — shown as a tooltip
                # rather than leaving the absence of a button unexplained.
                'delete_blocked_reason': why_not,
                # When the self-service window closes, so the UI can say
                # "removable for another 42 minutes" instead of implying forever.
                'delete_window_expires_at': expires,
            })
        return jsonify({'success': True, 'data': out})
    except Exception as e:
        logger.error(f"list minutes failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load minutes'}), 500


@board_meetings_bp.route('/<meeting_id>/minutes', methods=['POST'])
@require_roles(*ORGANISER_ROLES)
def upload_minutes(meeting_id):
    """Upload minutes for a meeting. Secretary only.

    Uploading when a version already exists creates the NEXT version and marks
    the previous one superseded. Nothing is overwritten.
    """
    st = _storage()
    if not st.configured():
        # Never accept a file we cannot actually store — a "success" here would
        # lose a governance record.
        return jsonify({'success': False,
                        'message': 'Object storage is not configured; minutes cannot be accepted.'}), 503

    # Reject an oversized body BEFORE touching it. There is no Flask-level
    # MAX_CONTENT_LENGTH on this app (security_config declares one but only the
    # cookie settings are ever applied), and on staging /api reaches the backend
    # through Vite's proxy rather than nginx, so no edge limit applies either.
    # Without this, `f.read()` would pull an arbitrarily large body into memory
    # on a single-worker gevent server before the size check could fire.
    declared = request.content_length or 0
    if declared > MINUTES_MAX_BYTES + MINUTES_ENVELOPE_ALLOWANCE:
        return jsonify({'success': False,
                        'message': f'File exceeds the {MINUTES_MAX_BYTES // (1024*1024)} MB limit'}), 413

    f = request.files.get('file')
    if not f or not (f.filename or '').strip():
        return jsonify({'success': False, 'message': 'A PDF file is required'}), 400

    data = f.read()
    if not data:
        return jsonify({'success': False, 'message': 'The uploaded file is empty'}), 400
    if len(data) > MINUTES_MAX_BYTES:
        return jsonify({'success': False,
                        'message': f'File exceeds the {MINUTES_MAX_BYTES // (1024*1024)} MB limit'}), 400

    ctype = (f.mimetype or '').lower()
    # Check the magic bytes too: a content-type header is caller-supplied and a
    # renamed file would otherwise be archived as a PDF it is not.
    if ctype not in MINUTES_ALLOWED_TYPES or not data.startswith(b'%PDF-'):
        return jsonify({'success': False, 'message': 'Only PDF files are accepted'}), 400

    meeting = execute_query("SELECT id FROM board_meetings WHERE id = %s",
                            (meeting_id,), fetch_one=True)
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404

    user_id = str(get_jwt_identity())
    try:
        prev = execute_query(
            """SELECT id, version FROM board_minutes
                WHERE meeting_id = %s AND deleted_at IS NULL
                ORDER BY version DESC LIMIT 1""",
            (meeting_id,), fetch_one=True)
        version = (prev['version'] + 1) if prev else 1

        safe = re.sub(r'[^A-Za-z0-9._-]', '_', f.filename.strip())[:200]
        key = f"minutes/{meeting_id}/v{version}-{safe}"

        if not st.ensure_bucket():
            return jsonify({'success': False,
                            'message': 'Object storage is unavailable; minutes were not saved.'}), 503

        # Store FIRST, then record. A row without an object is a record that
        # cannot be served; an object without a row is merely unreferenced.
        digest = st.put_object(key, data, content_type='application/pdf')

        row = execute_query(
            """INSERT INTO board_minutes
                   (meeting_id, object_key, filename, content_type, size_bytes,
                    sha256, version, status, uploaded_by)
               VALUES (%s, %s, %s, 'application/pdf', %s, %s, %s, 'draft', %s)
            RETURNING id, version, status""",
            (meeting_id, key, safe, len(data), digest, version, user_id),
            fetch_one=True)

        if prev:
            execute_query(
                """UPDATE board_minutes
                      SET status = 'superseded', superseded_by = %s
                    WHERE id = %s""",
                (row['id'], prev['id']), fetch_all=False)

        logger.info("board minutes v%s uploaded for meeting %s by %s",
                    version, meeting_id, user_id)
        return jsonify({'success': True, 'data': {
            'id': str(row['id']), 'version': row['version'],
            'status': row['status'], 'sha256': digest,
            'superseded_version': prev['version'] if prev else None,
        }}), 201
    except Exception as e:
        logger.error(f"upload minutes failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to save the minutes'}), 500


@board_meetings_bp.route('/minutes/<minute_id>/download', methods=['GET'])
@require_roles(*BOARD_ROLES)
def download_minutes(minute_id):
    """Stream the document. Streamed through the backend rather than a presigned
    URL, so every read passes the role check and is attributable.

    The stored sha256 is re-verified before serving: if the bytes have changed,
    this is no longer the record and must not be presented as one.
    """
    from flask import Response
    row = execute_query(
        """SELECT object_key, filename, sha256, deleted_at
             FROM board_minutes WHERE id = %s""",
        (minute_id,), fetch_one=True)
    # 404 for deleted too — the tombstone is for the audit trail, not the reader.
    if not row or row.get('deleted_at'):
        return jsonify({'success': False, 'message': 'Not found'}), 404

    try:
        import hashlib
        data = _storage().get_object(row['object_key'])
        if hashlib.sha256(data).hexdigest() != row['sha256']:
            logger.error("INTEGRITY FAILURE for minutes %s — stored bytes do not "
                         "match the recorded hash", minute_id)
            return jsonify({'success': False,
                            'message': 'Integrity check failed; this document cannot be served.'}), 500
        return Response(data, mimetype='application/pdf', headers={
            'Content-Disposition': f'attachment; filename="{row["filename"]}"',
            'X-Content-SHA256': row['sha256'],
        })
    except Exception as e:
        logger.error(f"download minutes failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to retrieve the document'}), 500


@board_meetings_bp.route('/minutes/<minute_id>/approve', methods=['POST'])
@require_roles(*CHAIRMAN_ROLES)
def approve_minutes(minute_id):
    """Adopt the minutes. THE CHAIR, and nobody else.

    This was ORGANISER_ROLES, which meant the secretary approved the minutes
    they had written and uploaded themselves — one person authoring and
    adopting the same governance record. The board adopts its own record and
    the chair signs it (owner ruling 2026-08-21).

    ADMIN IS DELIBERATELY EXCLUDED, unlike almost every other guard in this
    file. Adopting minutes is a governance act, not an administrative one: an
    administrator who could sign on the board's behalf would be precisely the
    hole this closes. If no chair is assigned, the fix is for an admin to GRANT
    the role — visible, attributable, and a different act from signing.

    Uploading, superseding and deleting are unchanged and stay with the
    Secretariat: writing the record and adopting it are now separate hands.
    """
    user_id = str(get_jwt_identity())
    row = execute_query("SELECT status, deleted_at FROM board_minutes WHERE id = %s",
                        (minute_id,), fetch_one=True)
    if not row or row.get('deleted_at'):
        return jsonify({'success': False, 'message': 'Not found'}), 404
    if row['status'] == 'superseded':
        return jsonify({'success': False,
                        'message': 'This version has been superseded and cannot be approved'}), 409
    execute_query(
        """UPDATE board_minutes SET status = 'approved', approved_by = %s, approved_at = now()
            WHERE id = %s""", (user_id, minute_id), fetch_all=False)
    logger.info("board minutes %s approved by %s", minute_id, user_id)
    return jsonify({'success': True})


# How long after approval the Secretariat may still remove minutes themselves
# (#391, owner ruling 2026-08-14). Long enough to undo a mistake noticed shortly
# after approving; short enough that a settled governance record cannot be
# removed by the person who filed it.
MINUTES_SELF_DELETE_GRACE = timedelta(hours=1)


def _may_delete_minutes(row, roles):
    """Who may remove this version, and why not.

    Returns (allowed: bool, reason: str|None). Administrators may always remove.
    The Secretariat may remove a draft, or an approved version within the grace
    window — computed here from approved_at, NEVER from a clock the caller
    controls.

    A superseded version stays Administrator-only whatever its age: it is a link
    in the version chain that a later correction points back to, so removing it
    is an edit to the audit trail rather than a tidy-up.
    """
    if roles & ADMIN_ROLES:
        return True, None
    if not (roles & ORGANISER_ROLES):
        return False, 'Only the Board Secretariat can remove minutes'

    status = row.get('status')
    if status == 'draft':
        return True, None
    if status == 'superseded':
        return False, ('This version has been superseded and is part of the '
                       'record. An Administrator can remove it.')
    if status == 'approved':
        approved_at = row.get('approved_at')
        if not approved_at:
            # Approved with no timestamp should not happen; treat the window as
            # closed rather than open — the safe direction for a record that is
            # already approved.
            return False, ('This has been approved. An Administrator can '
                           'remove it.')
        if datetime.now(approved_at.tzinfo) - approved_at <= MINUTES_SELF_DELETE_GRACE:
            return True, None
        return False, ('These minutes were approved more than an hour ago. '
                       'An Administrator can remove them.')
    return False, 'These minutes cannot be removed'


@board_meetings_bp.route('/minutes/<minute_id>', methods=['DELETE'])
@require_roles(*ORGANISER_ROLES)
def delete_minutes(minute_id):
    """SOFT delete, with a one-hour self-service window (#391).

    Administrators may always remove. The Secretariat may remove a draft, or an
    approved version within an hour of approval — the case the Board Secretary
    reported, having approved a file and then needing it gone.

    Deletion stays SOFT in every case. The row is retained as a tombstone
    recording who removed it and when — "retained indefinitely" and a hard
    delete that erases the evidence cannot both be true. The object is left in
    the bucket, so a mistaken deletion is recoverable without going to backup. A
    true purge is deliberately not implemented.
    """
    user_id = str(get_jwt_identity())
    reason = ((request.get_json(silent=True) or {}).get('reason') or '').strip()[:2000]
    row = execute_query(
        "SELECT id, deleted_at, status, approved_at FROM board_minutes WHERE id = %s",
        (minute_id,), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'message': 'Not found'}), 404
    if row.get('deleted_at'):
        return jsonify({'success': True, 'already_deleted': True})

    roles = resolve_roles()
    allowed, why_not = _may_delete_minutes(row, roles)
    if not allowed:
        # Say who CAN do it, not just that this caller cannot.
        return jsonify({'success': False, 'message': why_not}), 403
    execute_query(
        """UPDATE board_minutes
              SET deleted_at = now(), deleted_by = %s, delete_reason = NULLIF(%s, '')
            WHERE id = %s""", (user_id, reason, minute_id), fetch_all=False)
    logger.warning("board minutes %s (%s) soft-deleted by %s [admin=%s] (reason: %s)",
                   minute_id, row.get('status'), user_id,
                   bool(roles & ADMIN_ROLES), reason or 'none given')
    return jsonify({'success': True})
