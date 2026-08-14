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
from datetime import datetime
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

# Generous box around the UAE, used to reject a transposed lat/lng pair — see
# _venue_point. Deliberately loose: it exists to catch a swap or a typo, not to
# police which emirate an event is in.
UAE_BOUNDS = {'lat': (22.0, 26.6), 'lng': (51.0, 56.6)}

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
        # numeric() comes back as Decimal, which json cannot serialise.
        'venue_lat': float(r['venue_lat']) if r.get('venue_lat') is not None else None,
        'venue_lng': float(r['venue_lng']) if r.get('venue_lng') is not None else None,
        'description': r.get('description'),
        'description_ar': r.get('description_ar'),
        'starts_at': _iso(r.get('starts_at')),
        'ends_at': _iso(r.get('ends_at')),
        'status': r.get('status'),
        'cancellation_reason': r.get('cancellation_reason'),
        'cancelled_at': _iso(r.get('cancelled_at')),
        'created_at': _iso(r.get('created_at')),
        'employer_count': r.get('employer_count'),
        'invited_count': r.get('invited_count'),
        'attended_count': r.get('attended_count'),
        # The caller's own place on the list. `my_source` decides whether the UI
        # may offer to withdraw: an agent's phone call is not the candidate's to
        # delete from the app.
        'my_response': r.get('my_response'),
        'my_source': r.get('my_source'),
    }


def _venue_point(d):
    """Validate an optional venue pin. Returns (lat, lng) or raises ValueError.

    Both or neither: half a pin is not a location, and a lone latitude would put
    the venue in the Gulf of Guinea. The DB enforces this too — this exists so
    the organiser gets a sentence rather than a constraint violation.
    """
    lat, lng = d.get('venue_lat'), d.get('venue_lng')
    if lat is None and lng is None:
        return None, None
    if lat is None or lng is None:
        raise ValueError('Pin the venue on the map, or leave it unpinned — '
                         'a latitude without a longitude is not a location')
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        raise ValueError('The venue coordinates are not numbers')
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        raise ValueError('Those coordinates are not on Earth.')
    # A RANGE CHECK DOES NOT CATCH TRANSPOSITION, which is the realistic mistake
    # here: Dubai is roughly (25.2, 55.3), and the swapped pair (55.2, 25.1) is a
    # perfectly valid latitude and longitude — in Kazakhstan. Accepting it would
    # send attendees directions to the wrong continent, so the venue is bounded
    # to the UAE instead. EHRDC open days are held at UAE community malls; if
    # that ever stops being true this is the line to revisit.
    if not (UAE_BOUNDS['lat'][0] <= lat <= UAE_BOUNDS['lat'][1]
            and UAE_BOUNDS['lng'][0] <= lng <= UAE_BOUNDS['lng'][1]):
        raise ValueError('That pin is outside the UAE. Dubai is around latitude 25, '
                         'longitude 55 — if you entered them by hand, they may be '
                         'the wrong way round.')
    return lat, lng


def _is_organiser():
    return bool(resolve_roles() & EVENT_ORGANISER_ROLES)


# ── Calendar and management ────────────────────────────────────────────────

@recruitment_events_bp.route('', methods=['GET'])
@jwt_required()
def list_events():
    """Events visible to the caller.

    Organisers see everything including drafts; every other signed-in user sees
    published events AND cancelled ones. The calendar is deliberately NOT public
    (owner decision): social media announcements drive people to register on the
    platform first, so by the time they attend they are already onboarded.

    Cancelled events deliberately KEEP their place here. Filtering them out
    reads as tidier and is worse: candidates are phoned by a CRM agent and asked
    to attend, so an event that silently disappears from the calendar is
    indistinguishable from one they misremembered — and nothing then stops them
    travelling to the mall on the day. A cancelled row states the cancellation.
    Drafts stay hidden because they were never announced to anybody.
    """
    try:
        organiser = _is_organiser()
        me = str(get_jwt_identity())
        where = "" if organiser else " WHERE e.status IN ('published', 'cancelled')"
        rows = execute_query(f"""
            SELECT e.*,
                   (SELECT COUNT(*) FROM event_employers   x WHERE x.event_id = e.id) AS employer_count,
                   (SELECT COUNT(*) FROM event_invitations i WHERE i.event_id = e.id) AS invited_count,
                   (SELECT COUNT(*) FROM event_attendance  a WHERE a.event_id = e.id) AS attended_count,
                   -- Whether the CALLER is on the list, so the calendar can mark
                   -- the days they have already said yes to.
                   (SELECT i2.response FROM event_invitations i2
                     WHERE i2.event_id = e.id AND i2.candidate_id = %s) AS my_response,
                   (SELECT i2.source   FROM event_invitations i2
                     WHERE i2.event_id = e.id AND i2.candidate_id = %s) AS my_source
              FROM recruitment_events e{where}
             ORDER BY e.starts_at DESC
             LIMIT 200
        """, (me, me)) or []
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
        # Same reasoning as the calendar: a cancelled event stays readable to the
        # people who were invited to it. 404 here would turn a link they were
        # sent into a broken one, which tells them nothing about what happened.
        if not ev or (ev['status'] not in ('published', 'cancelled') and not organiser):
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

        mine = execute_query(
            "SELECT response, source FROM event_invitations "
            " WHERE event_id = %s AND candidate_id = %s",
            (event_id, str(get_jwt_identity())), fetch_one=True) or {}

        data = _event_row(ev)
        data['employers'] = out
        data['my_response'] = mine.get('response')
        data['my_source'] = mine.get('source')
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
        lat, lng = _venue_point(d)
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    try:
        row = execute_query("""
            INSERT INTO recruitment_events
                (title, title_ar, venue, venue_ar, description, description_ar,
                 starts_at, ends_at, venue_lat, venue_lng, created_by)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *
        """, (title, d.get('title_ar'), d.get('venue'), d.get('venue_ar'),
              d.get('description'), d.get('description_ar'), starts_at,
              d.get('ends_at') or None, lat, lng, str(get_jwt_identity())), fetch_one=True)
        logger.info("recruitment event created: %s by %s", row['id'], get_jwt_identity())
        return jsonify({'success': True, 'data': _event_row(row)}), 201
    except Exception as e:
        logger.error(f"create event failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to create the event'}), 500


@recruitment_events_bp.route('/<event_id>', methods=['PUT'])
@require_roles(*EVENT_ORGANISER_ROLES)
def update_event(event_id):
    """Edit an event, or move it between statuses.

    Editing stays available after publishing on purpose: venues move, times
    shift, and an event that cannot be corrected once announced forces the
    organiser to cancel and re-create it — which would strand the invitations,
    the employers and any attendance already recorded against the old row.

    Cancelling is a status change with obligations attached, so it is handled
    here rather than left as a bare UPDATE: it requires a reason, stamps the
    time, and tells the people who were asked to come.
    """
    d = request.get_json(silent=True) or {}
    fields, vals = [], []
    if 'venue_lat' in d or 'venue_lng' in d:
        try:
            lat, lng = _venue_point(d)
        except ValueError as e:
            return jsonify({'success': False, 'message': str(e)}), 400
        fields += ['venue_lat = %s', 'venue_lng = %s']
        vals += [lat, lng]

    prev = execute_query("SELECT status FROM recruitment_events WHERE id = %s",
                         (event_id,), fetch_one=True)
    if not prev:
        return jsonify({'success': False, 'message': 'Event not found'}), 404

    new_status = d.get('status')
    cancelling = new_status == 'cancelled' and prev['status'] != 'cancelled'
    if cancelling:
        reason = (d.get('cancellation_reason') or '').strip()
        if not reason:
            # The reason is shown to candidates who were phoned and asked to
            # attend. Cancelling without one leaves the calendar saying an event
            # is off with no indication of whether it will be rearranged.
            return jsonify({'success': False,
                            'message': 'Give a reason for the cancellation — '
                                       'candidates who were invited will see it'}), 400
        fields += ['cancellation_reason = %s', 'cancelled_at = now()']
        vals.append(reason)
    elif new_status and new_status != 'cancelled' and prev['status'] == 'cancelled':
        # Reinstating: the old reason would otherwise sit on a live event and be
        # shown to candidates as though it were still off.
        fields += ['cancellation_reason = NULL', 'cancelled_at = NULL']

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

        notified = _notify_event_cancelled(event_id) if cancelling else None
        if cancelling:
            # `reason`, not vals[0] — a cancellation sent together with a moved
            # venue pin puts the latitude first in the parameter list.
            logger.info("event %s cancelled by %s: %s", event_id, get_jwt_identity(), reason)
        out = _event_row(row)
        if notified is not None:
            out['notified'] = notified
        return jsonify({'success': True, 'data': out})
    except Exception as e:
        logger.error(f"update event failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to update the event'}), 500


def _notify_event_cancelled(event_id):
    """Tell everyone with a stake in a cancelled event that it is off.

    Two audiences, both of whom acted on the event existing: candidates a CRM
    agent phoned (every invitation, whatever they answered — someone recorded as
    'no_answer' may still have heard the message and be planning to come), and
    the accepted team members of participating employers, who blocked out staff
    for the day.

    Anyone who already checked in is included too: an event can be called off
    part-way through, and they are standing in the queue.

    Never raises. A cancellation that is recorded but not announced is bad; a
    cancellation that fails to save because a notification insert did is worse.
    """
    try:
        try:
            from backend.notification_helper import create_notification
        except ImportError:  # pragma: no cover
            from notification_helper import create_notification

        ev = execute_query(
            "SELECT title, venue, starts_at, cancellation_reason "
            "FROM recruitment_events WHERE id = %s", (event_id,), fetch_one=True) or {}
        when = ev.get('starts_at')
        when_s = when.strftime('%d %B %Y') if when else ''
        title = ev.get('title') or 'a recruitment open day'
        reason = ev.get('cancellation_reason') or ''

        people = execute_query("""
            SELECT candidate_id AS uid FROM event_invitations WHERE event_id = %s
            UNION
            SELECT user_id      AS uid FROM event_attendance  WHERE event_id = %s
            UNION
            SELECT ctm.user_id  AS uid
              FROM event_employers ee
              JOIN company_team_members ctm ON ctm.company_id = ee.company_id
             WHERE ee.event_id = %s AND ctm.invitation_status = 'accepted'
        """, (event_id, event_id, event_id)) or []

        if not people:
            logger.info("event %s cancelled: nobody to notify", event_id)
            return 0

        # Built in one place because `x + y if cond else z` binds the conditional
        # looser than the concatenation, which would silently reduce the whole
        # message to " has been cancelled." for a row with no reason recorded.
        body = (title
                + (f" at {ev['venue']}" if ev.get('venue') else '')
                + (f" on {when_s}" if when_s else '')
                + " has been cancelled."
                + (f" Reason: {reason}" if reason else ''))

        sent = 0
        for p in people:
            nid = create_notification(
                user_id=str(p['uid']).strip(),
                notification_type='event_cancelled',
                title=f"Cancelled: {title}",
                message=body,
                metadata={'event_id': str(event_id)},
            )
            if nid:
                sent += 1
        logger.info("event %s cancelled: notified %d of %d", event_id, sent, len(people))
        return sent
    except Exception as e:
        logger.error(f"could not announce cancellation of event {event_id}: {e}")
        return 0


def _notify_company_team(event_id, company_id):
    """Notify a company's accepted team members that they are on an event.

    Membership comes from company_team_members with invitation_status='accepted'
    — the ACL's only source of truth (CLAUDE.md). hr_profiles is legacy display
    data and notifying from it would reach people who are not actually on the
    team.

    Never raises: an employer who is not told is a problem worth logging, but
    failing the whole addition because a notification did not insert would be a
    worse one.
    """
    try:
        try:
            from backend.notification_helper import create_notification
        except ImportError:  # pragma: no cover
            from notification_helper import create_notification

        ev = execute_query(
            "SELECT title, venue, starts_at FROM recruitment_events WHERE id = %s",
            (event_id,), fetch_one=True) or {}
        members = execute_query("""
            SELECT user_id FROM company_team_members
             WHERE company_id = %s AND invitation_status = 'accepted'
        """, (company_id,)) or []

        if not members:
            # Common today: only 4 accepted memberships exist platform-wide, so
            # most companies have nobody to tell. Log it rather than pretending.
            logger.info("event %s: company %s has no accepted team members to notify",
                        event_id, company_id)
            return 0

        when = ev.get('starts_at')
        when_s = when.strftime('%d %B %Y') if when else ''
        sent = 0
        for m in members:
            nid = create_notification(
                user_id=str(m['user_id']).strip(),
                notification_type='event_employer_added',
                title=f"You are taking part in {ev.get('title') or 'a recruitment open day'}",
                message=(f"EHRDC has added your company to {ev.get('title') or 'an open day'}"
                         + (f" at {ev['venue']}" if ev.get('venue') else '')
                         + (f" on {when_s}" if when_s else '')
                         + ". Your published vacancies will be shown to candidates "
                           "attending, so please make sure they are up to date."),
                metadata={'event_id': str(event_id), 'company_id': str(company_id)},
            )
            if nid:
                sent += 1
        logger.info("event %s: notified %d of %d team members at company %s",
                    event_id, sent, len(members), company_id)
        return sent
    except Exception as e:
        logger.error(f"could not notify company {company_id} for event {event_id}: {e}")
        return 0


@recruitment_events_bp.route('/employer-search', methods=['GET'])
@require_roles(*EVENT_ORGANISER_ROLES)
def employer_search():
    """Search companies by name or trade licence, with their vacancy count.

    A 188-entry dropdown is unusable and gets worse with every company onboarded;
    an organiser knows the name they are looking for. The vacancy count is
    returned with each hit because it is the thing that decides whether inviting
    that employer to an open day is worth it — only 7 vacancies are published
    platform-wide today, so an employer with none is the common case and the
    organiser should see that before adding them, not after.
    """
    q = (request.args.get('q') or '').strip()
    try:
        params = []
        where = ""
        if q:
            where = ("WHERE (c.company_name ILIKE %s OR COALESCE(c.trade_license_no,'') ILIKE %s)")
            params = ['%' + q + '%', '%' + q + '%']
        rows = execute_query(f"""
            SELECT c.id, c.company_name, c.industry, c.is_verified,
                   (SELECT COUNT(*) FROM job_postings j
                     WHERE j.company_id = c.id
                       AND j.status IN ({','.join(['%s'] * len(PUBLISHED_VACANCY_STATUSES))})
                   ) AS vacancy_count
              FROM companies c
              {where}
             ORDER BY vacancy_count DESC, c.company_name
             LIMIT 30
        """, tuple(PUBLISHED_VACANCY_STATUSES) + tuple(params)) or []
        return jsonify({'success': True, 'data': [{
            'id': str(r['id']),
            'company_name': r.get('company_name'),
            'industry': r.get('industry'),
            'is_verified': bool(r.get('is_verified')),
            'vacancy_count': r.get('vacancy_count') or 0,
        } for r in rows]})
    except Exception as e:
        logger.error(f"employer search failed: {e}")
        return jsonify({'success': False, 'message': 'Search failed'}), 500


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
        existing = execute_query(
            "SELECT id FROM event_employers WHERE event_id = %s AND company_id = %s",
            (event_id, company_id), fetch_one=True)

        execute_query("""
            INSERT INTO event_employers (event_id, company_id, note, added_by)
            VALUES (%s,%s,%s,%s)
            ON CONFLICT (event_id, company_id) DO UPDATE SET note = EXCLUDED.note
        """, (event_id, company_id, d.get('note'), str(get_jwt_identity())), fetch_all=False)

        # Tell the employer they are on the bill — but only the first time, or
        # editing the note would notify them again for nothing.
        notified = 0
        if not existing:
            notified = _notify_company_team(event_id, company_id)

        return jsonify({'success': True, 'data': {'notified': notified,
                                                  'already_added': bool(existing)}})
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


# ── Invitations ────────────────────────────────────────────────────────────

# An invitation is recorded during a phone call, so a batch is one agent's call
# list for a session — not the whole roster. Capped for the same reason the bulk
# CRM actions are: a number an operator cannot review is a number they cannot
# check afterwards.
INVITE_MAX = 500

INVITE_RESPONSES = {'invited', 'confirmed', 'declined', 'no_answer'}


@recruitment_events_bp.route('/<event_id>/invitations', methods=['POST'])
@require_roles(*EVENT_ORGANISER_ROLES)
def invite_candidates(event_id):
    """Add candidates to an event's call list.

    Takes explicit candidate ids, which is what the CRM's filter-and-select
    produces: filter the roster, select, invite. Re-inviting someone already on
    the list is a no-op rather than an error — an agent working through a list
    should never be punished for overlapping selections.
    """
    d = request.get_json(silent=True) or {}
    ids = d.get('candidate_ids') or []
    if not isinstance(ids, list) or not ids:
        return jsonify({'success': False, 'message': 'Select at least one candidate'}), 400
    ids = [str(i).strip() for i in ids if str(i).strip()]
    if len(ids) > INVITE_MAX:
        return jsonify({'success': False,
                        'message': f'Invite at most {INVITE_MAX} candidates at a time'}), 400

    ev = execute_query("SELECT id, status FROM recruitment_events WHERE id = %s",
                       (event_id,), fetch_one=True)
    if not ev:
        return jsonify({'success': False, 'message': 'Event not found'}), 404

    me = str(get_jwt_identity())
    ph = ','.join(['%s'] * len(ids))
    known = execute_query(
        f"SELECT id FROM users WHERE id IN ({ph})", tuple(ids)) or []
    known_ids = [str(r['id']).strip() for r in known]
    unknown = len(ids) - len(known_ids)
    if not known_ids:
        return jsonify({'success': False, 'message': 'None of those candidates exist',
                        'data': {'invited': 0, 'unknown': unknown}}), 400

    before = execute_query(
        f"SELECT candidate_id FROM event_invitations WHERE event_id = %s "
        f"AND candidate_id IN ({','.join(['%s'] * len(known_ids))})",
        (event_id,) + tuple(known_ids)) or []
    already = len(before)

    try:
        for cid in known_ids:
            execute_query("""
                INSERT INTO event_invitations (event_id, candidate_id, invited_by)
                VALUES (%s, %s, %s)
                ON CONFLICT (event_id, candidate_id) DO NOTHING
            """, (event_id, cid, me), fetch_all=False)
    except Exception as e:
        logger.error(f"invite failed for event {event_id}: {e}")
        return jsonify({'success': False, 'message': 'The invitations could not be saved'}), 500

    added = len(known_ids) - already
    logger.info("event %s: %d invited by %s (%d already on the list, %d unknown)",
                event_id, added, me, already, unknown)
    return jsonify({'success': True, 'data': {
        'invited': added, 'already_invited': already, 'unknown': unknown,
    }}), 201


@recruitment_events_bp.route('/<event_id>/interest', methods=['POST', 'DELETE'])
@jwt_required()
def register_interest(event_id):
    """A candidate registering — or withdrawing — their own interest from the calendar.

    Recorded in event_invitations with source='self' and no invited_by: it is
    the same fact an agent records after a call ("this person intends to come"),
    and a separate table would mean two places to look before printing a door
    list. `source` is what stops it being counted as a call that worked.

    Deliberately NOT an attendance row. Interest is a statement made in advance
    from a phone at home; attendance is a queue token issued at the venue. The
    door still allocates the token on the day.
    """
    me = str(get_jwt_identity())
    ev = execute_query(
        "SELECT id, status, title, starts_at, ends_at FROM recruitment_events WHERE id = %s",
        (event_id,), fetch_one=True)
    if not ev:
        return jsonify({'success': False, 'message': 'Event not found'}), 404

    if request.method == 'DELETE':
        # Only ever removes a self-registration: an agent recorded a phone call,
        # and a candidate changing their mind in the app must not erase that
        # record. Their withdrawal is a fact the agent needs, not an undo.
        row = execute_query("""
            DELETE FROM event_invitations
             WHERE event_id = %s AND candidate_id = %s AND source = 'self'
            RETURNING id
        """, (event_id, me), fetch_one=True)
        if row:
            return jsonify({'success': True, 'data': {'interested': False}})
        existing = execute_query(
            "SELECT source FROM event_invitations WHERE event_id = %s AND candidate_id = %s",
            (event_id, me), fetch_one=True)
        if existing:
            return jsonify({'success': False,
                            'message': 'You were invited by phone. Please tell the '
                                       'EHRDC team if you can no longer attend.'}), 409
        return jsonify({'success': True, 'data': {'interested': False}})

    if ev['status'] != 'published':
        return jsonify({'success': False,
                        'message': 'This event is not open for registration'}), 409
    # An event that has already finished cannot be attended, and letting someone
    # register for it would put a name on a door list for a day that has passed.
    ended = ev.get('ends_at') or ev.get('starts_at')
    if ended and ended < datetime.now(ended.tzinfo):
        return jsonify({'success': False, 'message': 'This event has already taken place'}), 409

    try:
        # DO UPDATE, not DO NOTHING: a candidate an agent already phoned uses
        # this same button to confirm they are coming, which is the flow the
        # owner described. Only the response moves — source and invited_by are
        # left alone, so the row keeps saying which agent made the call.
        # A recorded 'declined' may be overwritten: the candidate saying today
        # that they will attend is newer than what they said on the phone.
        execute_query("""
            INSERT INTO event_invitations (event_id, candidate_id, invited_by, source,
                                           response, responded_at)
            VALUES (%s, %s, NULL, 'self', 'confirmed', now())
            ON CONFLICT (event_id, candidate_id) DO UPDATE
               SET response = 'confirmed', responded_at = now()
             WHERE event_invitations.response <> 'confirmed'
        """, (event_id, me), fetch_all=False)
    except Exception as e:
        logger.error(f"register interest failed for {me} at {event_id}: {e}")
        return jsonify({'success': False, 'message': 'Could not register your interest'}), 500

    row = execute_query(
        "SELECT response, source FROM event_invitations WHERE event_id = %s AND candidate_id = %s",
        (event_id, me), fetch_one=True) or {}
    logger.info("event %s: %s registered interest (source=%s)", event_id, me, row.get('source'))
    return jsonify({'success': True, 'data': {
        'interested': True,
        'response': row.get('response'),
        # The UI must not offer "withdraw" for a row an agent owns.
        'source': row.get('source'),
    }}), 201


@recruitment_events_bp.route('/<event_id>/invitations', methods=['GET'])
@require_roles(*EVENT_ORGANISER_ROLES)
def list_invitations(event_id):
    """The call list, with each candidate's response and whether they turned up."""
    try:
        rows = execute_query("""
            SELECT i.candidate_id, i.response, i.invited_at, i.responded_at, i.note,
                   i.source,
                   COALESCE(u.full_name, CONCAT_WS(' ', u.first_name, u.last_name)) AS full_name,
                   u.phone,
                   (a.id IS NOT NULL) AS attended,
                   a.queue_token
              FROM event_invitations i
              JOIN users u ON u.id = i.candidate_id
              LEFT JOIN event_attendance a
                     ON a.event_id = i.event_id AND a.user_id = i.candidate_id
             WHERE i.event_id = %s
             ORDER BY i.invited_at DESC
        """, (event_id,)) or []
        return jsonify({'success': True, 'data': [{
            'candidate_id': str(r['candidate_id']).strip(),
            'full_name': r.get('full_name'),
            'phone': r.get('phone'),
            'response': r.get('response'),
            # Agents need to see who they actually called: a self-registration
            # has no call behind it, so chasing it as a "no answer" would be
            # chasing a call that never happened.
            'source': r.get('source') or 'agent',
            'invited_at': _iso(r.get('invited_at')),
            'responded_at': _iso(r.get('responded_at')),
            'attended': bool(r.get('attended')),
            'queue_token': r.get('queue_token'),
            'note': r.get('note'),
        } for r in rows], 'total': len(rows)})
    except Exception as e:
        logger.error(f"list invitations failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load the call list'}), 500


@recruitment_events_bp.route('/<event_id>/invitations/<candidate_id>', methods=['PATCH'])
@require_roles(*EVENT_ORGANISER_ROLES)
def update_invitation(event_id, candidate_id):
    """Record what the candidate said on the call."""
    d = request.get_json(silent=True) or {}
    response = (d.get('response') or '').strip()
    if response not in INVITE_RESPONSES:
        return jsonify({'success': False,
                        'message': f'response must be one of: {", ".join(sorted(INVITE_RESPONSES))}'}), 400
    row = execute_query("""
        UPDATE event_invitations
           SET response = %s,
               responded_at = CASE WHEN %s = 'invited' THEN NULL ELSE now() END,
               note = COALESCE(%s, note)
         WHERE event_id = %s AND candidate_id = %s
        RETURNING candidate_id, response
    """, (response, response, d.get('note'), event_id, candidate_id), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'message': 'That candidate is not on this call list'}), 404
    return jsonify({'success': True, 'data': {'response': row['response']}})


# ── Outcomes ───────────────────────────────────────────────────────────────

OUTCOME_STAGES = {'interviewed', 'shortlisted', 'offered', 'placed', 'rejected'}


@recruitment_events_bp.route('/<event_id>/outcomes', methods=['POST'])
@require_roles(*EVENT_ORGANISER_ROLES)
def record_outcome(event_id):
    """What an employer decided about a candidate at this event.

    Recorded by EHRDC staff from what the employer reports (owner decision), so
    it needs no employer onboarding to be useful. The stage vocabulary is shared
    with the pipeline request so the two do not diverge.
    """
    d = request.get_json(silent=True) or {}
    candidate_id = (d.get('candidate_id') or '').strip()
    company_id = (d.get('company_id') or '').strip()
    stage = (d.get('stage') or '').strip()
    if not candidate_id or not company_id:
        return jsonify({'success': False, 'message': 'candidate_id and company_id are required'}), 400
    if stage not in OUTCOME_STAGES:
        return jsonify({'success': False,
                        'message': f'stage must be one of: {", ".join(sorted(OUTCOME_STAGES))}'}), 400
    try:
        execute_query("""
            INSERT INTO event_outcomes (event_id, candidate_id, company_id, stage, reason, recorded_by)
            VALUES (%s,%s,%s,%s,%s,%s)
            ON CONFLICT (event_id, candidate_id, company_id)
            DO UPDATE SET stage = EXCLUDED.stage, reason = EXCLUDED.reason,
                          recorded_by = EXCLUDED.recorded_by, recorded_at = now()
        """, (event_id, candidate_id, company_id, stage, d.get('reason'),
              str(get_jwt_identity())), fetch_all=False)
        return jsonify({'success': True}), 201
    except Exception as e:
        logger.error(f"record outcome failed: {e}")
        return jsonify({'success': False, 'message': 'The outcome could not be saved'}), 500


# ── The funnel ─────────────────────────────────────────────────────────────

@recruitment_events_bp.route('/<event_id>/funnel', methods=['GET'])
@require_roles(*EVENT_ORGANISER_ROLES)
def event_funnel(event_id):
    """Called → confirmed → attended → interviewed → offered → hired.

    This is the number EHRDC gets asked for: "of the 400 we called for Al Barsha,
    how many turned up and how many were hired?" Every stage is COUNTED from the
    recorded rows, never estimated — a funnel with an invented step in it is
    worse than no funnel, because it will be quoted.

    Walk-ins are reported separately rather than folded into the invited count.
    They did not come from a call, and mixing them would overstate how well the
    calling worked.
    """
    ev = execute_query("SELECT id, title, starts_at FROM recruitment_events WHERE id = %s",
                       (event_id,), fetch_one=True)
    if not ev:
        return jsonify({'success': False, 'message': 'Event not found'}), 404
    try:
        # Split by source. A self-registration from the calendar is NOT a call
        # that worked, and folding the two together would overstate how well the
        # calling converted — the same reason walk-ins are already kept out of
        # the invited attendance count.
        inv = execute_query("""
            SELECT response, source, COUNT(*) AS n FROM event_invitations
             WHERE event_id = %s GROUP BY response, source
        """, (event_id,)) or []
        by_response = {}
        self_registered = 0
        for r in inv:
            if r['source'] == 'self':
                self_registered += r['n']
            else:
                by_response[r['response']] = by_response.get(r['response'], 0) + r['n']
        invited_total = sum(by_response.values())

        att = execute_query("""
            SELECT COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE i.source = 'agent') AS invited_attended,
                   COUNT(*) FILTER (WHERE i.source = 'self')  AS self_attended,
                   COUNT(*) FILTER (WHERE i.id IS NULL)       AS walk_ins
              FROM event_attendance a
              LEFT JOIN event_invitations i
                     ON i.event_id = a.event_id AND i.candidate_id = a.user_id
             WHERE a.event_id = %s
        """, (event_id,), fetch_one=True) or {}

        out = execute_query("""
            SELECT stage, COUNT(DISTINCT candidate_id) AS n
              FROM event_outcomes WHERE event_id = %s GROUP BY stage
        """, (event_id,)) or []
        by_stage = {r['stage']: r['n'] for r in out}

        confirmed = by_response.get('confirmed', 0)
        attended_invited = att.get('invited_attended') or 0

        return jsonify({'success': True, 'data': {
            'event': {'id': str(ev['id']), 'title': ev['title'], 'starts_at': _iso(ev['starts_at'])},
            'invited': {
                'total': invited_total,
                'confirmed': confirmed,
                'declined': by_response.get('declined', 0),
                'no_answer': by_response.get('no_answer', 0),
                'awaiting_reply': by_response.get('invited', 0),
            },
            # People who found the event on the calendar and said they were
            # coming. Reported in its own right: it is the measure of whether
            # publishing the calendar is worth anything.
            'self_registered': {
                'total': self_registered,
                'attended': att.get('self_attended') or 0,
            },
            'attended': {
                'total': att.get('total') or 0,
                'from_invitations': attended_invited,
                'from_self_registered': att.get('self_attended') or 0,
                'walk_ins': att.get('walk_ins') or 0,
            },
            'outcomes': {s: by_stage.get(s, 0) for s in sorted(OUTCOME_STAGES)},
            # Stated as a fraction with its denominator, not a bare percentage:
            # "12 of 47 confirmed" cannot be quoted out of context the way "26%"
            # can, and the denominators here are small enough to matter.
            'rates': {
                'confirmed_of_invited': f"{confirmed} of {invited_total}" if invited_total else None,
                'attended_of_confirmed': f"{attended_invited} of {confirmed}" if confirmed else None,
                'placed_of_attended': (f"{by_stage.get('placed', 0)} of {att.get('total') or 0}"
                                       if (att.get('total') or 0) else None),
            },
        }})
    except Exception as e:
        logger.error(f"funnel failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to build the funnel'}), 500
