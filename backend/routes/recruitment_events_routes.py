"""Recruitment open days — events, registration QR, check-in and queue.

EHRDC runs recruitment open days at community malls with vacancy-posting
companies. CRM agents phone targeted candidates to invite them; on the day
candidates scan a QR at the venue, sign in, and receive a queue token; employers
interview on site; afterwards EHRDC records the outcome from each employer.

Scope and owner decisions: docs/scope_recruitment_open_days.md. Schema: migration
061 (ran live 2026-08-13).

Decisions that shape this module:
  • ONE queue per event, first-come-first-served. No priority for invitees.
  • No capacity cap.
  • No check-in code. Identity at the door is UAE Pass, or a staff check-in.
    Staff check-in is therefore load-bearing, not a convenience: it is the only
    remaining path when a phone or the mall's signal fails.
  • The calendar is for signed-in platform users, not public.
"""
import io
import logging
import os
from urllib.parse import urlparse

from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import get_jwt_identity, jwt_required

try:
    from backend.auth.access_control import require_roles, resolve_roles, \
        CAREER_SERVICES_ROLES, ADMIN_ROLES
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import require_roles, resolve_roles, \
        CAREER_SERVICES_ROLES, ADMIN_ROLES
    from db_utils import execute_query

logger = logging.getLogger(__name__)

recruitment_events_bp = Blueprint('recruitment_events', __name__, url_prefix='/api/events')

# Who may create and run an event: the CRM team.
EVENT_ORGANISER_ROLES = CAREER_SERVICES_ROLES

PUBLISHED_VACANCY_STATUSES = ('published', 'active', 'open', 'Active', 'Open', 'Published')


def _iso(v):
    return v.isoformat() if v else None


def _event_row(r):
    return {
        'id': str(r['id']),
        'title': r.get('title'),
        'title_ar': r.get('title_ar'),
        'venue': r.get('venue'),
        'venue_ar': r.get('venue_ar'),
        'description': r.get('description'),
        'description_ar': r.get('description_ar'),
        'starts_at': _iso(r.get('starts_at')),
        'ends_at': _iso(r.get('ends_at')),
        'status': r.get('status'),
        'created_at': _iso(r.get('created_at')),
        'employer_count': r.get('employer_count'),
        'invited_count': r.get('invited_count'),
        'attended_count': r.get('attended_count'),
    }


def _is_organiser():
    return bool(resolve_roles() & EVENT_ORGANISER_ROLES)


# ── Calendar and management ────────────────────────────────────────────────

@recruitment_events_bp.route('', methods=['GET'])
@jwt_required()
def list_events():
    """Events visible to the caller.

    Organisers see everything including drafts; every other signed-in user sees
    published events only. The calendar is deliberately NOT public (owner
    decision): social media announcements drive people to register on the
    platform first, so by the time they attend they are already onboarded.
    """
    try:
        organiser = _is_organiser()
        where = "" if organiser else " WHERE e.status = 'published'"
        rows = execute_query(f"""
            SELECT e.*,
                   (SELECT COUNT(*) FROM event_employers   x WHERE x.event_id = e.id) AS employer_count,
                   (SELECT COUNT(*) FROM event_invitations i WHERE i.event_id = e.id) AS invited_count,
                   (SELECT COUNT(*) FROM event_attendance  a WHERE a.event_id = e.id) AS attended_count
              FROM recruitment_events e{where}
             ORDER BY e.starts_at DESC
             LIMIT 200
        """) or []
        return jsonify({'success': True, 'data': [_event_row(r) for r in rows],
                        'can_manage': organiser})
    except Exception as e:
        logger.error(f"list events failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load events'}), 500


@recruitment_events_bp.route('/<event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    """One event, with participating employers and their LIVE vacancies.

    Vacancies are read from job_postings at request time rather than copied onto
    the event, so the calendar can never advertise a post that has since been
    filled or withdrawn.
    """
    try:
        organiser = _is_organiser()
        ev = execute_query("SELECT * FROM recruitment_events WHERE id = %s",
                           (event_id,), fetch_one=True)
        if not ev or (ev['status'] != 'published' and not organiser):
            return jsonify({'success': False, 'message': 'Event not found'}), 404

        employers = execute_query("""
            SELECT c.id, c.company_name, c.industry, ee.note
              FROM event_employers ee
              JOIN companies c ON c.id = ee.company_id
             WHERE ee.event_id = %s
             ORDER BY c.company_name
        """, (event_id,)) or []

        out = []
        for c in employers:
            vacancies = execute_query(f"""
                SELECT id, title, location, employment_type
                  FROM job_postings
                 WHERE company_id = %s
                   AND status IN ({','.join(['%s'] * len(PUBLISHED_VACANCY_STATUSES))})
                 ORDER BY created_at DESC LIMIT 25
            """, (c['id'],) + PUBLISHED_VACANCY_STATUSES) or []
            out.append({
                'company_id': str(c['id']),
                'company_name': c.get('company_name'),
                'industry': c.get('industry'),
                'note': c.get('note'),
                'vacancies': [{'id': v['id'], 'title': v.get('title'),
                               'location': v.get('location'),
                               'employment_type': v.get('employment_type')} for v in vacancies],
            })

        data = _event_row(ev)
        data['employers'] = out
        return jsonify({'success': True, 'data': data, 'can_manage': organiser})
    except Exception as e:
        logger.error(f"get event failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load the event'}), 500


@recruitment_events_bp.route('', methods=['POST'])
@require_roles(*EVENT_ORGANISER_ROLES)
def create_event():
    d = request.get_json(silent=True) or {}
    title = (d.get('title') or '').strip()
    starts_at = (d.get('starts_at') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'A title is required'}), 400
    if not starts_at:
        return jsonify({'success': False, 'message': 'A start date and time are required'}), 400
    try:
        row = execute_query("""
            INSERT INTO recruitment_events
                (title, title_ar, venue, venue_ar, description, description_ar,
                 starts_at, ends_at, created_by)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *
        """, (title, d.get('title_ar'), d.get('venue'), d.get('venue_ar'),
              d.get('description'), d.get('description_ar'), starts_at,
              d.get('ends_at') or None, str(get_jwt_identity())), fetch_one=True)
        logger.info("recruitment event created: %s by %s", row['id'], get_jwt_identity())
        return jsonify({'success': True, 'data': _event_row(row)}), 201
    except Exception as e:
        logger.error(f"create event failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to create the event'}), 500


@recruitment_events_bp.route('/<event_id>', methods=['PUT'])
@require_roles(*EVENT_ORGANISER_ROLES)
def update_event(event_id):
    d = request.get_json(silent=True) or {}
    fields, vals = [], []
    for k in ('title', 'title_ar', 'venue', 'venue_ar', 'description',
              'description_ar', 'starts_at', 'ends_at', 'status'):
        if k in d:
            if k == 'status' and d[k] not in ('draft', 'published', 'completed', 'cancelled'):
                return jsonify({'success': False,
                                'message': 'status must be draft, published, completed or cancelled'}), 400
            fields.append(f"{k} = %s")
            vals.append(d[k] or None)
    if not fields:
        return jsonify({'success': False, 'message': 'Nothing to update'}), 400
    try:
        row = execute_query(
            f"UPDATE recruitment_events SET {', '.join(fields)}, updated_at = now() "
            f"WHERE id = %s RETURNING *", tuple(vals) + (event_id,), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Event not found'}), 404
        return jsonify({'success': True, 'data': _event_row(row)})
    except Exception as e:
        logger.error(f"update event failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to update the event'}), 500


@recruitment_events_bp.route('/<event_id>/employers', methods=['POST'])
@require_roles(*EVENT_ORGANISER_ROLES)
def add_employer(event_id):
    d = request.get_json(silent=True) or {}
    company_id = (d.get('company_id') or '').strip()
    if not company_id:
        return jsonify({'success': False, 'message': 'company_id is required'}), 400
    try:
        if not execute_query("SELECT id FROM companies WHERE id = %s", (company_id,), fetch_one=True):
            return jsonify({'success': False, 'message': 'That company does not exist'}), 400
        execute_query("""
            INSERT INTO event_employers (event_id, company_id, note, added_by)
            VALUES (%s,%s,%s,%s)
            ON CONFLICT (event_id, company_id) DO UPDATE SET note = EXCLUDED.note
        """, (event_id, company_id, d.get('note'), str(get_jwt_identity())), fetch_all=False)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"add employer failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to add the employer'}), 500


@recruitment_events_bp.route('/<event_id>/employers/<company_id>', methods=['DELETE'])
@require_roles(*EVENT_ORGANISER_ROLES)
def remove_employer(event_id, company_id):
    try:
        execute_query("DELETE FROM event_employers WHERE event_id = %s AND company_id = %s",
                      (event_id, company_id), fetch_all=False)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"remove employer failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to remove the employer'}), 500


# ── The registration QR ────────────────────────────────────────────────────

@recruitment_events_bp.route('/<event_id>/qr', methods=['GET'])
@require_roles(*EVENT_ORGANISER_ROLES)
def event_qr(event_id):
    """The poster QR for an event, as SVG.

    SVG rather than PNG because this is printed and displayed at a mall: it
    scales to any poster size without going soft, and it is a fraction of the
    bytes.

    It encodes the check-in URL for THIS event and nothing else — no candidate
    identity, no secret. There is no check-in code (owner decision), so a
    photographed poster gives an attacker nothing they could not get by walking
    in: the page itself requires a UAE Pass sign-in.
    """
    ev = execute_query("SELECT id, title, status FROM recruitment_events WHERE id = %s",
                       (event_id,), fetch_one=True)
    if not ev:
        return jsonify({'success': False, 'message': 'Event not found'}), 404

    # THIS URL GETS PRINTED ON A POSTER AND HUNG IN A MALL. If it is wrong,
    # every scan fails and nobody finds out until the event.
    #
    # request.host_url alone is NOT safe here: behind the WAF, Flask sees the
    # proxy's target, so it produced http://127.0.0.1:5005/... — measured, not
    # theorised. Prefer an explicit base, then the configured public URL, then
    # the forwarded headers, and only then the request host.
    fwd_host = request.headers.get('X-Forwarded-Host')
    fwd_proto = request.headers.get('X-Forwarded-Proto', 'https')
    base = (request.args.get('base')
            or os.getenv('PUBLIC_BASE_URL')
            or (f"{fwd_proto}://{fwd_host}" if fwd_host else None)
            or request.host_url).rstrip('/')

    host = (urlparse(base).hostname or '').lower()
    if host in ('localhost', '127.0.0.1', '::1') or host.startswith('10.') or not host:
        # Refuse rather than hand back a poster that cannot work. The organiser
        # can override with ?base=, but the real fix is PUBLIC_BASE_URL.
        logger.error("event QR would encode a non-public host (%s) — refusing", base)
        return jsonify({
            'success': False,
            'message': 'This server does not know its public address, so the QR would '
                       'point somewhere unreachable. Set PUBLIC_BASE_URL on the backend '
                       '(or pass ?base=https://…) and try again.',
            'resolved_base': base,
        }), 500

    url = f"{base}/events/{event_id}/check-in"

    try:
        import segno
    except ImportError:
        logger.error("segno is not installed — cannot render the event QR")
        return jsonify({'success': False,
                        'message': 'QR generation is unavailable on this server'}), 503

    # segno writes BYTES even for SVG, so this must be BytesIO — a StringIO here
    # raises "string argument expected, got 'bytes'".
    buf = io.BytesIO()
    try:
        # Error correction 'h' (~30%): a poster in a mall gets scuffed, taped over
        # a corner, and photographed at an angle.
        segno.make(url, error='h').save(buf, kind='svg', scale=8, border=2, dark='#0f3b4d')
    except Exception as e:
        # Say the QR could not be produced rather than returning a bare 500 with
        # nothing an organiser could act on.
        logger.error(f"QR render failed for event {event_id}: {e}")
        return jsonify({'success': False,
                        'message': 'The QR code could not be generated. '
                                   'The event is unaffected; please try again.'}), 500
    return Response(buf.getvalue(), mimetype='image/svg+xml', headers={
        'Content-Disposition': f'inline; filename="event-{event_id}-qr.svg"',
        'X-Checkin-Url': url,
    })


# ── Check-in and the queue ─────────────────────────────────────────────────

def _allocate_token(event_id, user_id, method, by=None):
    """Insert an attendance row, allocating the next queue number atomically.

    The token is chosen inside the INSERT rather than read-then-written, so two
    people scanning at the same moment cannot receive the same position. If they
    race, UNIQUE(event_id, queue_token) rejects the loser and we retry — which is
    why that constraint exists rather than trusting application ordering.
    """
    last_err = None
    for _ in range(5):
        try:
            row = execute_query("""
                INSERT INTO event_attendance (event_id, user_id, method, queue_token, checked_in_by)
                SELECT %s, %s, %s,
                       COALESCE((SELECT MAX(queue_token) FROM event_attendance WHERE event_id = %s), 0) + 1,
                       %s
                RETURNING queue_token, checked_in_at
            """, (event_id, user_id, method, event_id, by), fetch_one=True)
            if row:
                return row, None
        except Exception as e:
            last_err = e
            if 'event_attendance_once' in str(e):
                return None, 'already'
            continue
    logger.error(f"token allocation failed for {user_id} at {event_id}: {last_err}")
    return None, 'failed'


@recruitment_events_bp.route('/<event_id>/check-in', methods=['POST'])
@jwt_required()
def self_check_in(event_id):
    """Register the signed-in user's attendance and issue their queue token.

    This is what the poster QR leads to. The caller has already proved who they
    are with UAE Pass, so nothing further is asked of them at the door.

    A walk-in reaches here moments after creating their account, which is
    exactly the intent: the event is a recruitment channel as well as a hiring
    one.
    """
    me = str(get_jwt_identity())
    ev = execute_query("SELECT id, status, title FROM recruitment_events WHERE id = %s",
                       (event_id,), fetch_one=True)
    if not ev:
        return jsonify({'success': False, 'message': 'Event not found'}), 404
    if ev['status'] != 'published':
        return jsonify({'success': False,
                        'message': 'This event is not open for registration'}), 409

    existing = execute_query(
        "SELECT queue_token, checked_in_at FROM event_attendance WHERE event_id = %s AND user_id = %s",
        (event_id, me), fetch_one=True)
    if existing:
        # Re-scanning must show the same number, not fail and not issue a second.
        return jsonify({'success': True, 'data': {
            'queue_token': existing['queue_token'],
            'already_registered': True,
            'checked_in_at': _iso(existing['checked_in_at']),
            'event_title': ev['title'],
        }})

    row, err = _allocate_token(event_id, me, 'self')
    if err == 'already':
        again = execute_query(
            "SELECT queue_token FROM event_attendance WHERE event_id = %s AND user_id = %s",
            (event_id, me), fetch_one=True)
        return jsonify({'success': True, 'data': {'queue_token': again['queue_token'],
                                                  'already_registered': True,
                                                  'event_title': ev['title']}})
    if not row:
        return jsonify({'success': False,
                        'message': 'Could not register you. Please see a member of staff.'}), 500

    logger.info("event check-in: %s at %s token=%s", me, event_id, row['queue_token'])
    return jsonify({'success': True, 'data': {
        'queue_token': row['queue_token'],
        'already_registered': False,
        'checked_in_at': _iso(row['checked_in_at']),
        'event_title': ev['title'],
    }}), 201


@recruitment_events_bp.route('/<event_id>/check-in/staff', methods=['POST'])
@require_roles(*EVENT_ORGANISER_ROLES)
def staff_check_in(event_id):
    """Check someone in from the desk.

    Load-bearing, not a convenience: with no check-in code and UAE Pass needing
    a working connection in a mall, this is the ONLY remaining path when a
    candidate's phone or the signal fails. It must keep working when the
    self-service route does not.
    """
    d = request.get_json(silent=True) or {}
    user_id = (d.get('user_id') or '').strip()
    if not user_id:
        return jsonify({'success': False, 'message': 'user_id is required'}), 400
    if not execute_query("SELECT id FROM users WHERE id = %s", (user_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'No account with that Emirates ID'}), 404

    existing = execute_query(
        "SELECT queue_token FROM event_attendance WHERE event_id = %s AND user_id = %s",
        (event_id, user_id), fetch_one=True)
    if existing:
        return jsonify({'success': True, 'data': {'queue_token': existing['queue_token'],
                                                  'already_registered': True}})

    row, err = _allocate_token(event_id, user_id, 'staff', by=str(get_jwt_identity()))
    if not row:
        return jsonify({'success': False, 'message': 'Could not check that person in'}), 500
    return jsonify({'success': True, 'data': {'queue_token': row['queue_token'],
                                              'already_registered': False}}), 201


@recruitment_events_bp.route('/<event_id>/queue', methods=['GET'])
@require_roles(*EVENT_ORGANISER_ROLES)
def event_queue(event_id):
    """The live queue for staff: who is here, in the order they arrived."""
    try:
        rows = execute_query("""
            SELECT a.queue_token, a.checked_in_at, a.method, a.user_id,
                   COALESCE(u.full_name, CONCAT_WS(' ', u.first_name, u.last_name)) AS full_name,
                   u.phone,
                   (i.id IS NOT NULL) AS was_invited
              FROM event_attendance a
              JOIN users u ON u.id = a.user_id
              LEFT JOIN event_invitations i
                     ON i.event_id = a.event_id AND i.candidate_id = a.user_id
             WHERE a.event_id = %s
             ORDER BY a.queue_token
        """, (event_id,)) or []
        return jsonify({'success': True, 'data': [{
            'queue_token': r['queue_token'],
            'user_id': r['user_id'],
            'full_name': r.get('full_name'),
            'phone': r.get('phone'),
            'method': r.get('method'),
            'was_invited': bool(r.get('was_invited')),
            'checked_in_at': _iso(r.get('checked_in_at')),
        } for r in rows], 'total': len(rows)})
    except Exception as e:
        logger.error(f"event queue failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load the queue'}), 500
