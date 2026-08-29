"""Knowledge Camps — providers submit, an operator publishes, people register.

WHY THIS MODULE EXISTS

Owner, 2026-08-29: "Which operator should have control over what gets posted?
Does the operator post, or do the different stakeholders post, and does the
operator review and approve? I want it to be a one-stop shop where listing and
registration take place."

None of it existed. The page listed six seed rows written on 2026-05-04 with
invented ratings and enrolment counts, its register button ran a Google search
for the camp's name, and there was no endpoint that could create a camp at all.

Design and the decisions behind it: docs/knowledge_camps_design.md

THE SHAPE, AND WHY IT IS NOT A NEW ONE

`training_programs` already does this: status submitted -> published,
created_by, approved_by, provider_id, with enrolments beside it. Providers
submit, the Professional Development Operator vets, candidates enrol. This is
the education-sector twin of that model and deliberately borrows its vocabulary.
The week this was written was spent deleting a parallel role family, seven
competing label registries and two stores for one fact — a differently-shaped
approval workflow beside an existing one would have been the same mistake again.

WHO MAY DO WHAT

  submit   provider staff, bound to the organisation they submit for
           (institution_staff / training_center_staff), or an operator
  review   education_operator (+ admin) — publish or reject with a reason
  register any signed-in user, on a published camp
"""
import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

try:
    from backend.auth.access_control import (
        require_roles, ADMIN_ROLES, INSTITUTION_ROLES, resolve_roles)
    from backend.db_utils import execute_query, get_db
    from backend.admin_audit import record_admin_action
except ImportError:                          # pragma: no cover — dual root
    from auth.access_control import (
        require_roles, ADMIN_ROLES, INSTITUTION_ROLES, resolve_roles)
    from db_utils import execute_query, get_db
    from admin_audit import record_admin_action

logger = logging.getLogger(__name__)

camps_bp = Blueprint('knowledge_camps', __name__)

#: Who reviews. The Education Operator already partners with schools and
#: institutes and already provisions institutions; reviewing a camp is the same
#: act as Scout Review on a scholarship. Adult training stays with the
#: Professional Development Operator — the split is by AUDIENCE, not mechanism.
REVIEW_ROLES = ADMIN_ROLES | {'education_operator'}

#: Fields a provider owns. `status`, `reviewed_by` and the rest are the
#: workflow's, never the submitter's — a payload that could set its own status
#: would let a provider publish straight past the review this exists for.
SUBMITTABLE = (
    'title', 'title_ar', 'description', 'description_ar', 'category',
    'age_group', 'location', 'location_ar', 'organizer', 'duration', 'price',
    'capacity', 'start_date', 'end_date', 'registration_closes_on',
    'contact_email',
)

PUBLIC_FIELDS = """
    c.id, c.title, c.title_ar, c.description, c.description_ar, c.category,
    c.age_group, c.location, c.location_ar, c.organizer, c.duration, c.price,
    c.capacity, c.start_date, c.end_date, c.registration_closes_on,
    c.contact_email, c.featured, c.status, c.created_at
"""


def _registered_count_sql(alias='c'):
    """Enrolment is a COUNT, not a stored number.

    The column it replaces held values nobody counted — 45 of 60, 52 of 60 —
    and the page summed them into a public total.
    """
    return (f"(SELECT count(*) FROM camp_registrations r "
            f" WHERE r.camp_id = {alias}.id AND r.status = 'registered')")


def _provider_bindings(user_id):
    """The organisations this person may submit on behalf of.

    Reuses the binding tables the access-control layer already checks, so
    "stakeholders post" cannot quietly mean "anybody posts".
    """
    inst = execute_query(
        "SELECT institution_id AS id FROM institution_staff WHERE user_id::text = %s",
        (str(user_id),)) or []
    centre = execute_query(
        "SELECT training_center_id AS id FROM training_center_staff WHERE user_id::text = %s",
        (str(user_id),)) or []
    return ({r['id'] for r in inst if r.get('id')},
            {r['id'] for r in centre if r.get('id')})


def _may_review(roles):
    return any((r or '').strip().lower() in REVIEW_ROLES for r in (roles or []))


# ── Listing: the public page ────────────────────────────────────────────────

@camps_bp.route('', methods=['GET'])
def list_camps():
    """Published camps only.

    The status filter is applied HERE rather than by the caller: a listing that
    can be talked into returning drafts makes the review step decorative.
    """
    category = (request.args.get('category') or '').strip()
    age_group = (request.args.get('age_group') or '').strip()

    where = ["c.status = 'published'", "c.is_active = TRUE"]
    params = []
    if category and category != 'All':
        where.append("c.category = %s")
        params.append(category)
    if age_group:
        where.append("c.age_group = %s")
        params.append(age_group)

    rows = execute_query(f"""
        SELECT {PUBLIC_FIELDS},
               {_registered_count_sql()} AS registered
          FROM knowledge_camps c
         WHERE {' AND '.join(where)}
         ORDER BY c.featured DESC, c.start_date NULLS LAST, c.id
    """, tuple(params)) or []

    for r in rows:
        for k in ('start_date', 'end_date', 'registration_closes_on', 'created_at'):
            if r.get(k):
                r[k] = str(r[k])
    return jsonify({'success': True, 'camps': rows, 'total': len(rows)})


# ── Submission: what a provider does ────────────────────────────────────────

@camps_bp.route('', methods=['POST'])
@require_roles(*(INSTITUTION_ROLES | REVIEW_ROLES | {'training_provider', 'training_center_rep'}))
def create_camp():
    """Create a camp as a draft, or submit it for review.

    Never published by this endpoint whoever calls it, including an operator.
    Publishing is a reviewed act with a name attached to it.
    """
    payload = request.get_json(silent=True) or {}
    user_id = get_jwt_identity()
    roles = resolve_roles() or []

    title = (payload.get('title') or '').strip()
    if not title:
        return jsonify({'success': False, 'error': 'a title is required'}), 400

    inst_ids, centre_ids = _provider_bindings(user_id)
    inst = payload.get('provider_institution_id')
    centre = payload.get('provider_training_center_id')

    if inst and centre:
        return jsonify({'success': False,
                        'error': 'a camp belongs to one organisation, not two'}), 400

    # An operator may enter a camp with no organisation attached (a legacy or
    # phoned-in listing). A provider may only submit for somewhere they work.
    if not _may_review(roles):
        if not (inst or centre):
            return jsonify({'success': False,
                            'error': 'choose the organisation running this camp'}), 400
        if inst and int(inst) not in inst_ids:
            return jsonify({'success': False,
                            'error': 'you are not staff of that institution'}), 403
        if centre and int(centre) not in centre_ids:
            return jsonify({'success': False,
                            'error': 'you are not staff of that training centre'}), 403

    submit_now = bool(payload.get('submit'))
    fields = {k: payload.get(k) for k in SUBMITTABLE if payload.get(k) not in (None, '')}
    fields['title'] = title
    fields['status'] = 'submitted' if submit_now else 'draft'
    fields['created_by'] = str(user_id)[:15] if user_id else None
    fields['provider_institution_id'] = inst or None
    fields['provider_training_center_id'] = centre or None
    if submit_now:
        fields['submitted_at'] = 'now()'

    cols = [k for k in fields if k != 'submitted_at']
    values = [fields[k] for k in cols]
    extra_col = ', submitted_at' if submit_now else ''
    extra_val = ', now()' if submit_now else ''
    row = execute_query(
        f"""INSERT INTO knowledge_camps ({', '.join(cols)}{extra_col})
            VALUES ({', '.join(['%s'] * len(cols))}{extra_val})
            RETURNING id, status""",
        tuple(values), fetch_one=True)

    return jsonify({'success': True, 'id': row['id'], 'status': row['status']}), 201


@camps_bp.route('/<int:camp_id>', methods=['PATCH'])
@require_roles(*(INSTITUTION_ROLES | REVIEW_ROLES | {'training_provider', 'training_center_rep'}))
def update_camp(camp_id):
    """Edit a camp, and re-enter review if it was already published.

    An approval describes what was reviewed, not the row for ever. Editing a
    published camp returns it to `submitted` — the same principle as the
    outbound-mail template fingerprint, where changed wording drops the
    approval it no longer describes.
    """
    payload = request.get_json(silent=True) or {}
    user_id = get_jwt_identity()
    roles = resolve_roles() or []

    camp = execute_query(
        "SELECT * FROM knowledge_camps WHERE id = %s", (camp_id,), fetch_one=True)
    if not camp:
        return jsonify({'success': False, 'error': 'no such camp'}), 404

    if not _may_review(roles):
        inst_ids, centre_ids = _provider_bindings(user_id)
        owns = ((camp.get('provider_institution_id') in inst_ids)
                or (camp.get('provider_training_center_id') in centre_ids))
        if not owns:
            return jsonify({'success': False, 'error': 'this camp is not yours'}), 403

    updates = {k: payload.get(k) for k in SUBMITTABLE if k in payload}
    if not updates and not payload.get('submit'):
        return jsonify({'success': False, 'error': 'nothing to change'}), 400

    sets = [f"{k} = %s" for k in updates]
    params = list(updates.values())

    was_live = camp['status'] == 'published'
    if payload.get('submit') or was_live:
        sets += ["status = 'submitted'", "submitted_at = now()",
                 "reviewed_by = NULL", "reviewed_at = NULL"]
    sets.append("updated_at = now()")
    params.append(camp_id)

    execute_query(f"UPDATE knowledge_camps SET {', '.join(sets)} WHERE id = %s",
                  tuple(params), fetch_all=False)
    return jsonify({'success': True,
                    'returned_to_review': bool(was_live),
                    'message': ('This camp was live, so the edit has returned it '
                                'to review.' if was_live else 'Saved.')})


@camps_bp.route('/mine', methods=['GET'])
@require_roles(*(INSTITUTION_ROLES | REVIEW_ROLES | {'training_provider', 'training_center_rep'}))
def my_camps():
    """What this provider has submitted, in every state — including the
    rejections and the reason, which is the half a provider actually needs."""
    user_id = get_jwt_identity()
    inst_ids, centre_ids = _provider_bindings(user_id)
    rows = execute_query(f"""
        SELECT {PUBLIC_FIELDS}, c.review_note, c.reviewed_at,
               {_registered_count_sql()} AS registered
          FROM knowledge_camps c
         WHERE c.created_by::text = %s
            OR c.provider_institution_id = ANY(%s)
            OR c.provider_training_center_id = ANY(%s)
         ORDER BY c.created_at DESC
    """, (str(user_id), list(inst_ids) or [-1], list(centre_ids) or [-1])) or []
    for r in rows:
        for k in ('start_date', 'end_date', 'registration_closes_on',
                  'created_at', 'reviewed_at'):
            if r.get(k):
                r[k] = str(r[k])
    return jsonify({'success': True, 'camps': rows, 'total': len(rows)})


# ── Review: what the Education Operator does ────────────────────────────────

@camps_bp.route('/review-queue', methods=['GET'])
@require_roles(*REVIEW_ROLES)
def review_queue():
    """Everything awaiting a decision, oldest first — a queue that shows the
    newest first buries whatever nobody dealt with."""
    rows = execute_query(f"""
        SELECT {PUBLIC_FIELDS}, c.created_by, c.submitted_at, c.review_note,
               i.name AS institution_name, t.name AS training_center_name,
               COALESCE(u.full_name, c.created_by) AS submitted_by_name,
               {_registered_count_sql()} AS registered
          FROM knowledge_camps c
          LEFT JOIN institutions i ON i.id = c.provider_institution_id
          LEFT JOIN training_centers t ON t.id = c.provider_training_center_id
          LEFT JOIN users u ON u.id = c.created_by
         WHERE c.status = 'submitted'
         ORDER BY c.submitted_at NULLS LAST, c.id
    """) or []
    for r in rows:
        for k in ('start_date', 'end_date', 'registration_closes_on',
                  'created_at', 'submitted_at'):
            if r.get(k):
                r[k] = str(r[k])
    return jsonify({'success': True, 'camps': rows, 'total': len(rows)})


@camps_bp.route('/<int:camp_id>/publish', methods=['POST'])
@require_roles(*REVIEW_ROLES)
def publish_camp(camp_id):
    """Publish one camp. This is the act that makes it public."""
    reviewer = get_jwt_identity()
    row = execute_query("""
        UPDATE knowledge_camps
           SET status = 'published', reviewed_by = %s, reviewed_at = now(),
               review_note = COALESCE(%s, review_note), updated_at = now()
         WHERE id = %s AND status IN ('submitted', 'rejected')
        RETURNING id, title""",
        (str(reviewer)[:15] if reviewer else None,
         (request.get_json(silent=True) or {}).get('note'), camp_id),
        fetch_one=True)
    if not row:
        return jsonify({'success': False,
                        'error': 'this camp is not awaiting review'}), 409

    record_admin_action('knowledge_camp_published', reviewer,
                        resource_type='knowledge_camp', resource_id=camp_id,
                        details={'title': row['title']})
    return jsonify({'success': True, 'message': f"\"{row['title']}\" is now listed."})


@camps_bp.route('/<int:camp_id>/reject', methods=['POST'])
@require_roles(*REVIEW_ROLES)
def reject_camp(camp_id):
    """Decline one camp, with a reason the provider can read.

    The reason is required. A rejection nobody can read is a rejection the
    provider will simply repeat.
    """
    payload = request.get_json(silent=True) or {}
    note = (payload.get('note') or '').strip()
    if not note:
        return jsonify({'success': False,
                        'error': 'a reason is required — the provider sees it'}), 400

    reviewer = get_jwt_identity()
    row = execute_query("""
        UPDATE knowledge_camps
           SET status = 'rejected', reviewed_by = %s, reviewed_at = now(),
               review_note = %s, updated_at = now()
         WHERE id = %s AND status IN ('submitted', 'published')
        RETURNING id, title""",
        (str(reviewer)[:15] if reviewer else None, note, camp_id), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'error': 'this camp cannot be rejected'}), 409

    record_admin_action('knowledge_camp_rejected', reviewer,
                        resource_type='knowledge_camp', resource_id=camp_id,
                        details={'title': row['title'], 'reason': note})
    return jsonify({'success': True, 'message': 'Returned to the provider with your reason.'})


# ── Registration: what a candidate does ─────────────────────────────────────

@camps_bp.route('/<int:camp_id>/register', methods=['POST'])
@require_roles('candidate', 'student', 'parent', 'seeker', 'employee',
               'entrepreneur', *ADMIN_ROLES)
def register(camp_id):
    """Take a place on a published camp.

    Capacity is checked and the row written in ONE transaction. Two people
    racing for the last place must not both get it, which a read-then-write
    cannot guarantee — so the count is taken with the camp row locked.

    A full camp waitlists rather than refuses: demand the operator cannot see
    is demand the platform has thrown away.
    """
    user_id = get_jwt_identity()
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, capacity, status, registration_closes_on "
                        "FROM knowledge_camps WHERE id = %s FOR UPDATE", (camp_id,))
            camp = cur.fetchone()
            if not camp:
                return jsonify({'success': False, 'error': 'no such camp'}), 404
            camp = dict(zip(('id', 'title', 'capacity', 'status', 'closes'), camp))

            if camp['status'] != 'published':
                return jsonify({'success': False,
                                'error': 'this camp is not open for registration'}), 409

            cur.execute("SELECT status FROM camp_registrations "
                        "WHERE camp_id = %s AND user_id = %s", (camp_id, str(user_id)))
            existing = cur.fetchone()
            if existing and existing[0] in ('registered', 'waitlisted'):
                return jsonify({'success': False,
                                'error': 'you are already registered for this camp',
                                'status': existing[0]}), 409

            cur.execute("SELECT count(*) FROM camp_registrations "
                        "WHERE camp_id = %s AND status = 'registered'", (camp_id,))
            taken = cur.fetchone()[0]
            capacity = camp['capacity'] or 0
            status = 'waitlisted' if capacity and taken >= capacity else 'registered'

            cur.execute("""
                INSERT INTO camp_registrations (camp_id, user_id, status)
                VALUES (%s, %s, %s)
                ON CONFLICT (camp_id, user_id) DO UPDATE
                    SET status = EXCLUDED.status, registered_at = now(),
                        cancelled_at = NULL
                RETURNING status""", (camp_id, str(user_id), status))
            final = cur.fetchone()[0]
        conn.commit()
    except Exception as exc:
        conn.rollback()
        logger.error(f'camp registration failed for {camp_id}: {exc}')
        return jsonify({'success': False, 'error': 'registration failed'}), 500

    return jsonify({'success': True, 'status': final,
                    'message': ('You are on the waiting list.' if final == 'waitlisted'
                                else 'You are registered.')})


@camps_bp.route('/<int:camp_id>/register', methods=['DELETE'])
@require_roles('candidate', 'student', 'parent', 'seeker', 'employee',
               'entrepreneur', *ADMIN_ROLES)
def cancel_registration(camp_id):
    """Give up a place. Kept as a cancelled row rather than deleted, so the
    operator can see that somebody registered and withdrew."""
    user_id = get_jwt_identity()
    row = execute_query("""
        UPDATE camp_registrations SET status = 'cancelled', cancelled_at = now()
         WHERE camp_id = %s AND user_id = %s AND status IN ('registered','waitlisted')
        RETURNING id""", (camp_id, str(user_id)), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'error': 'you are not registered'}), 404
    return jsonify({'success': True, 'message': 'Your place has been given up.'})


@camps_bp.route('/my-registrations', methods=['GET'])
@require_roles('candidate', 'student', 'parent', 'seeker', 'employee',
               'entrepreneur', *ADMIN_ROLES)
def my_registrations():
    """The tab that could never populate, because nothing was ever recorded."""
    user_id = get_jwt_identity()
    rows = execute_query(f"""
        SELECT r.status AS registration_status, r.registered_at, {PUBLIC_FIELDS}
          FROM camp_registrations r
          JOIN knowledge_camps c ON c.id = r.camp_id
         WHERE r.user_id = %s AND r.status <> 'cancelled'
         ORDER BY c.start_date NULLS LAST, c.id
    """, (str(user_id),)) or []
    for r in rows:
        for k in ('start_date', 'end_date', 'registration_closes_on',
                  'created_at', 'registered_at'):
            if r.get(k):
                r[k] = str(r[k])
    return jsonify({'success': True, 'registrations': rows, 'total': len(rows)})


@camps_bp.route('/<int:camp_id>/registrations', methods=['GET'])
@require_roles(*REVIEW_ROLES)
def camp_registrations(camp_id):
    """Who registered — for the operator and, later, the provider running it."""
    rows = execute_query("""
        SELECT r.id, r.status, r.registered_at,
               COALESCE(u.full_name, u.email, r.user_id) AS person, u.email
          FROM camp_registrations r
          LEFT JOIN users u ON u.id = r.user_id
         WHERE r.camp_id = %s
         ORDER BY r.registered_at""", (camp_id,)) or []
    for r in rows:
        if r.get('registered_at'):
            r['registered_at'] = str(r['registered_at'])
    return jsonify({'success': True, 'registrations': rows, 'total': len(rows)})


def register_knowledge_camps_routes(app):
    app.register_blueprint(camps_bp, url_prefix='/api/knowledge-camps')
