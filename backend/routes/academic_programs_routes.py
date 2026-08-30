"""Graduate programmes — a curated directory, and what a candidate does with it.

WHY THIS MODULE EXISTS

Owner, 2026-08-30: "take graduate programs next. I need you to cover the full
workflow and the involved personas."

What was there: six rows written in one instant on 2026-06-17, attributing
invented tuition, invented enrolment and a rating from a non-existent rating
system to six NAMED REAL UNIVERSITIES — AED 95,000 for the MBRSG MBA, "Fully
Funded" for a Masdar PhD. Removed by migration 096. The page's button ran a
Google search for "<university> <programme> graduate admissions".

Design and the personas: docs/academic_programs_design.md

THE CONSTRAINT THAT SHAPES THIS

The platform CANNOT accept an application on a university's behalf. Graduate
admissions run through each institution's own system. Anything resembling
"apply here" would be a lie, and a worse one than the invented tuition, because
somebody would act on it.

So this does the two things it honestly can: point accurately (every published
programme carries a source link and a date its details were checked), and
remember the journey (what a person is considering, that they applied, how it
ended) — which is the part no university system will ever tell the Council, and
what Article 4(10) reporting needs.

WHY IT MIRRORS SCHOLARSHIPS AND NOT KNOWLEDGE CAMPS

Camps are submitted by schools and centres who will actually log in. Nobody at
Khalifa University is going to log in and post an MSc, so a submission queue
would sit empty. `scholarships` already is a curated directory with verified
links, checked nightly by emirati-link-check; graduate programmes take the same
columns and the same checker. Institutional submission still exists, as the
secondary path.
"""
import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

try:
    from backend.auth.access_control import (
        require_roles, ADMIN_ROLES, INSTITUTION_ROLES, CAREER_SERVICES_ROLES,
        ADVISOR_ROLES, resolve_roles)
    from backend.db_utils import execute_query
    from backend.admin_audit import record_admin_action
except ImportError:                          # pragma: no cover — dual root
    from auth.access_control import (
        require_roles, ADMIN_ROLES, INSTITUTION_ROLES, CAREER_SERVICES_ROLES,
        ADVISOR_ROLES, resolve_roles)
    from db_utils import execute_query
    from admin_audit import record_admin_action

logger = logging.getLogger(__name__)

academic_bp = Blueprint('academic_programs', __name__)

#: The Education Operator curates the directory — the same persona that owns
#: institutions, scholarships and Scout Review.
CURATOR_ROLES = ADMIN_ROLES | {'education_operator'}

#: Who may record their own graduate-study journey.
CANDIDATE_ROLES = ('candidate', 'student', 'seeker', 'employee', 'entrepreneur')

#: Who may READ somebody's journey to advise them: career services, coaches and
#: the academic advisor. Read-only — the candidate owns their own record, and a
#: guidance role that could edit it would make the record untrustworthy to the
#: person it describes.
GUIDANCE_ROLES = CAREER_SERVICES_ROLES | ADVISOR_ROLES | {'coach'} | ADMIN_ROLES

#: Fields a curator or an institution may set. `status`, the review fields and
#: everything the link checker owns are the workflow's.
EDITABLE = (
    'level', 'title', 'title_ar', 'university', 'university_ar', 'location', 'location_ar',
    'duration', 'duration_ar', 'program_type', 'type_label', 'type_label_ar',
    'tuition', 'tuition_ar', 'specializations', 'specializations_ar',
    'highlights', 'highlights_ar', 'featured', 'application_link',
    'details_checked_on', 'application_deadline', 'source_note',
)

PUBLIC_FIELDS = """
    p.id, p.level, p.title, p.title_ar, p.university, p.university_ar, p.location,
    p.location_ar, p.duration, p.duration_ar, p.program_type, p.type_label,
    p.type_label_ar, p.tuition, p.tuition_ar, p.specializations,
    p.specializations_ar, p.highlights, p.highlights_ar, p.featured, p.status,
    p.application_link, p.details_checked_on, p.application_deadline,
    p.link_status, p.link_checked_at, p.created_at
"""

_DATE_FIELDS = ('details_checked_on', 'application_deadline', 'created_at',
                'link_checked_at', 'noted_at', 'updated_at', 'reviewed_at',
                'submitted_at')


def _stringify(rows):
    for r in rows:
        for k in _DATE_FIELDS:
            if r.get(k):
                r[k] = str(r[k])
    return rows


def _may_curate(roles):
    return any((r or '').strip().lower() in CURATOR_ROLES for r in (roles or []))


def _institution_ids(user_id):
    rows = execute_query(
        "SELECT institution_id AS id FROM institution_staff WHERE user_id::text = %s",
        (str(user_id),)) or []
    return {r['id'] for r in rows if r.get('id')}


# ── The directory ───────────────────────────────────────────────────────────

@academic_bp.route('', methods=['GET'])
def list_programs():
    """Published programmes only.

    Every row carries `application_link` and `details_checked_on`, because the
    published-status constraint refuses anything else. The page shows tuition as
    "as published by <institution>, checked <date>" — attribution, never the
    platform asserting a fee it cannot know.
    """
    program_type = (request.args.get('program_type') or '').strip()
    # `level` is what makes ONE directory serve both pages: University Programs
    # asks for undergraduate, Graduate Programs for the rest. An undergraduate
    # degree and a master's are the same object — a programme, at an
    # institution, with a link and a checked date — and two tables for that is
    # how `university_programs` came to sit beside `graduate_programs`.
    level = (request.args.get('level') or '').strip()
    where, params = ["p.status = 'published'", "p.is_active = TRUE"], []
    if program_type and program_type != 'All':
        where.append("p.program_type = %s")
        params.append(program_type)
    if level and level != 'All':
        levels = [x.strip() for x in level.split(',') if x.strip()]
        where.append("p.level = ANY(%s)")
        params.append(levels)

    rows = execute_query(f"""
        SELECT {PUBLIC_FIELDS}
          FROM academic_programs p
         WHERE {' AND '.join(where)}
         ORDER BY p.featured DESC, p.university, p.title
    """, tuple(params)) or []
    return jsonify({'success': True, 'programs': _stringify(rows),
                    'total': len(rows)})


@academic_bp.route('/institutions', methods=['GET'])
def listed_institutions():
    """The institutions that actually have a published programme here.

    DERIVED, not a second directory. The page used to read a `universities`
    table that existed only for it, carrying an invented ranking of real UAE
    universities (1st, 2nd, 3rd), invented student counts and invented graduate
    employment rates of 96-98%. Migration 098 dropped it.

    What can be said honestly is this: these institutions have programmes listed
    here, this many, and here is the link they gave us. Anything more — a
    ranking, an employment rate, a student count — is a claim the platform has
    no way to know and no business publishing about a named university.
    """
    rows = execute_query("""
        SELECT p.university, p.university_ar,
               count(*) AS program_count,
               min(p.location) AS location,
               max(p.application_link) AS a_link,
               max(p.details_checked_on) AS last_checked
          FROM academic_programs p
         WHERE p.status = 'published' AND p.is_active = TRUE
           AND COALESCE(p.university, '') <> ''
         GROUP BY p.university, p.university_ar
         ORDER BY count(*) DESC, p.university
    """) or []
    for r in rows:
        if r.get('last_checked'):
            r['last_checked'] = str(r['last_checked'])
    return jsonify({'success': True, 'institutions': rows, 'total': len(rows)})


# ── Curating: what the Education Operator does ──────────────────────────────

@academic_bp.route('', methods=['POST'])
@require_roles(*(CURATOR_ROLES | INSTITUTION_ROLES))
def create_program():
    """Add a programme as a draft, or submit one as an institution.

    Never published here. Publishing requires the source link and the checked
    date, and is a separate act with a name against it.
    """
    payload = request.get_json(silent=True) or {}
    user_id = get_jwt_identity()
    roles = resolve_roles() or []

    title = (payload.get('title') or '').strip()
    university = (payload.get('university') or '').strip()
    if not title or not university:
        return jsonify({'success': False,
                        'error': 'a title and the institution are required'}), 400

    institution = payload.get('provider_institution_id')
    if not _may_curate(roles):
        # An institution may propose its OWN programmes and no others.
        mine = _institution_ids(user_id)
        if not institution or int(institution) not in mine:
            return jsonify({'success': False,
                            'error': 'you may only submit programmes for your own institution'}), 403

    fields = {k: payload.get(k) for k in EDITABLE if payload.get(k) not in (None, '')}
    fields['title'] = title
    fields['university'] = university
    fields['status'] = 'submitted' if payload.get('submit') else 'draft'
    fields['created_by'] = str(user_id)[:15] if user_id else None
    fields['provider_institution_id'] = institution or None

    cols = list(fields)
    row = execute_query(
        f"""INSERT INTO academic_programs ({', '.join(cols)}
            {', submitted_at' if payload.get('submit') else ''})
            VALUES ({', '.join(['%s'] * len(cols))}
            {', now()' if payload.get('submit') else ''})
            RETURNING id, status""",
        tuple(fields[c] for c in cols), fetch_one=True)
    return jsonify({'success': True, 'id': row['id'], 'status': row['status']}), 201


@academic_bp.route('/<int:program_id>', methods=['PATCH'])
@require_roles(*(CURATOR_ROLES | INSTITUTION_ROLES))
def update_program(program_id):
    """Edit a programme. An institution may only touch its own."""
    payload = request.get_json(silent=True) or {}
    user_id = get_jwt_identity()
    roles = resolve_roles() or []

    prog = execute_query("SELECT * FROM academic_programs WHERE id = %s",
                         (program_id,), fetch_one=True)
    if not prog:
        return jsonify({'success': False, 'error': 'no such programme'}), 404
    if not _may_curate(roles):
        if prog.get('provider_institution_id') not in _institution_ids(user_id):
            return jsonify({'success': False, 'error': 'not your institution'}), 403

    updates = {k: payload.get(k) for k in EDITABLE if k in payload}
    if not updates:
        return jsonify({'success': False, 'error': 'nothing to change'}), 400

    sets = [f"{k} = %s" for k in updates] + ["updated_at = now()"]
    execute_query(f"UPDATE academic_programs SET {', '.join(sets)} WHERE id = %s",
                  tuple(list(updates.values()) + [program_id]), fetch_all=False)
    return jsonify({'success': True})


@academic_bp.route('/manage', methods=['GET'])
@require_roles(*(CURATOR_ROLES | INSTITUTION_ROLES))
def manage_list():
    """Everything in every state, for whoever may act on it.

    Includes what the link checker last found, because a published programme
    whose link has died is the thing a curator most needs to see and the public
    listing deliberately will not show it as a problem.
    """
    user_id = get_jwt_identity()
    roles = resolve_roles() or []
    if _may_curate(roles):
        rows = execute_query(f"""
            SELECT {PUBLIC_FIELDS}, p.review_note, p.submitted_at, p.reviewed_at,
                   p.source_note, p.provider_institution_id, p.link_status_detail,
                   i.name AS institution_name,
                   (SELECT count(*) FROM academic_program_interest g
                     WHERE g.program_id = p.id AND g.status <> 'withdrawn') AS interested
              FROM academic_programs p
              LEFT JOIN institutions i ON i.id = p.provider_institution_id
             ORDER BY CASE p.status WHEN 'submitted' THEN 0 WHEN 'draft' THEN 1
                                    WHEN 'published' THEN 2 ELSE 3 END,
                      p.updated_at DESC NULLS LAST, p.id
        """) or []
    else:
        mine = _institution_ids(user_id)
        rows = execute_query(f"""
            SELECT {PUBLIC_FIELDS}, p.review_note, p.submitted_at, p.reviewed_at,
                   p.source_note, p.provider_institution_id, p.link_status_detail,
                   NULL AS institution_name, 0 AS interested
              FROM academic_programs p
             WHERE p.provider_institution_id = ANY(%s)
             ORDER BY p.updated_at DESC NULLS LAST, p.id
        """, (list(mine) or [-1],)) or []
    return jsonify({'success': True, 'programs': _stringify(rows), 'total': len(rows)})


@academic_bp.route('/<int:program_id>/publish', methods=['POST'])
@require_roles(*CURATOR_ROLES)
def publish(program_id):
    """List a programme publicly.

    Refused without a source link and a checked date. That is the single rule
    the removed rows broke — they carried figures for named universities and no
    source at all — and it is enforced by a CHECK constraint as well as here, so
    a future writer cannot route around this endpoint.
    """
    prog = execute_query(
        "SELECT id, title, university, application_link, details_checked_on "
        "FROM academic_programs WHERE id = %s", (program_id,), fetch_one=True)
    if not prog:
        return jsonify({'success': False, 'error': 'no such programme'}), 404
    if not prog.get('application_link') or not prog.get('details_checked_on'):
        return jsonify({
            'success': False,
            'error': ('add the institution\'s own link for this programme and the '
                      'date you checked its details before publishing — the page '
                      'attributes tuition and dates to them, so it has to say '
                      'where they came from')}), 400

    reviewer = get_jwt_identity()
    execute_query("""
        UPDATE academic_programs
           SET status = 'published', reviewed_by = %s, reviewed_at = now(),
               updated_at = now()
         WHERE id = %s""",
        (str(reviewer)[:15] if reviewer else None, program_id), fetch_all=False)

    record_admin_action('academic_program_published', reviewer,
                        resource_type='academic_program', resource_id=program_id,
                        details={'title': prog['title'], 'university': prog['university']})
    return jsonify({'success': True,
                    'message': f"\"{prog['title']}\" is now listed."})


@academic_bp.route('/<int:program_id>/reject', methods=['POST'])
@require_roles(*CURATOR_ROLES)
def reject(program_id):
    """Decline an institution's submission, with a reason it can read."""
    note = ((request.get_json(silent=True) or {}).get('note') or '').strip()
    if not note:
        return jsonify({'success': False,
                        'error': 'a reason is required — the institution sees it'}), 400
    reviewer = get_jwt_identity()
    row = execute_query("""
        UPDATE academic_programs
           SET status = 'rejected', reviewed_by = %s, reviewed_at = now(),
               review_note = %s, updated_at = now()
         WHERE id = %s AND status IN ('submitted','published')
        RETURNING id, title""",
        (str(reviewer)[:15] if reviewer else None, note, program_id), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'error': 'this programme cannot be rejected'}), 409
    record_admin_action('academic_program_rejected', reviewer,
                        resource_type='academic_program', resource_id=program_id,
                        details={'title': row['title'], 'reason': note})
    return jsonify({'success': True, 'message': 'Returned with your reason.'})


@academic_bp.route('/link-health', methods=['GET'])
@require_roles(*CURATOR_ROLES)
def link_health():
    """Published programmes whose link the nightly checker could not confirm.

    Kept separate from the review queue: a dead link is not a submission to
    approve, it is a listing that has quietly stopped being true. Note that
    "could not verify" is not "dead" — KHDA, for one, discards paths and
    soft-404s to its homepage with HTTP 200, so the checker reports uncertainty
    rather than asserting a link is gone.
    """
    rows = execute_query(f"""
        SELECT {PUBLIC_FIELDS}, p.link_status_detail
          FROM academic_programs p
         WHERE p.status = 'published'
           AND (p.link_status IS DISTINCT FROM 'ok' OR p.link_checked_at IS NULL)
         ORDER BY p.link_checked_at NULLS FIRST, p.id
    """) or []
    return jsonify({'success': True, 'programs': _stringify(rows), 'total': len(rows)})


# ── The candidate's journey ─────────────────────────────────────────────────

@academic_bp.route('/<int:program_id>/interest', methods=['POST'])
@require_roles(*(CANDIDATE_ROLES + tuple(ADMIN_ROLES)))
def set_interest(program_id):
    """Record where somebody is with a programme.

    interested -> applying -> admitted / declined / withdrawn.

    Deliberately NOT called an application. The platform is recording what a
    person told us; it does not submit anything to a university and must never
    look as though it does.
    """
    payload = request.get_json(silent=True) or {}
    status = (payload.get('status') or 'interested').strip().lower()
    allowed = ('interested', 'applying', 'admitted', 'declined', 'withdrawn')
    if status not in allowed:
        return jsonify({'success': False,
                        'error': f"status must be one of {', '.join(allowed)}"}), 400

    prog = execute_query("SELECT id, status FROM academic_programs WHERE id = %s",
                         (program_id,), fetch_one=True)
    if not prog:
        return jsonify({'success': False, 'error': 'no such programme'}), 404
    if prog['status'] != 'published':
        return jsonify({'success': False, 'error': 'this programme is not listed'}), 409

    user_id = get_jwt_identity()
    execute_query("""
        INSERT INTO academic_program_interest (program_id, user_id, status, note)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (program_id, user_id) DO UPDATE
            SET status = EXCLUDED.status,
                note = COALESCE(EXCLUDED.note, academic_program_interest.note),
                updated_at = now()""",
        (program_id, str(user_id), status, payload.get('note')), fetch_all=False)
    return jsonify({'success': True, 'status': status})


@academic_bp.route('/<int:program_id>/interest', methods=['DELETE'])
@require_roles(*(CANDIDATE_ROLES + tuple(ADMIN_ROLES)))
def clear_interest(program_id):
    user_id = get_jwt_identity()
    execute_query("DELETE FROM academic_program_interest "
                  "WHERE program_id = %s AND user_id = %s",
                  (program_id, str(user_id)), fetch_all=False)
    return jsonify({'success': True})


@academic_bp.route('/my-interest', methods=['GET'])
@require_roles(*(CANDIDATE_ROLES + tuple(ADMIN_ROLES)))
def my_interest():
    """What this person is considering, applying to, or has heard back about."""
    user_id = get_jwt_identity()
    rows = execute_query(f"""
        SELECT g.status AS interest_status, g.note, g.noted_at, g.updated_at,
               {PUBLIC_FIELDS}
          FROM academic_program_interest g
          JOIN academic_programs p ON p.id = g.program_id
         WHERE g.user_id = %s
         ORDER BY g.updated_at DESC
    """, (str(user_id),)) or []
    return jsonify({'success': True, 'interest': _stringify(rows), 'total': len(rows)})


@academic_bp.route('/interest/<user_id>', methods=['GET'])
@require_roles(*GUIDANCE_ROLES)
def interest_for_person(user_id):
    """What a candidate is considering, for whoever is advising them.

    READ ONLY, and that is the design. A career services operator or advisor who
    could edit this would make the record untrustworthy to the person it
    describes — and it is their record of their own plans.
    """
    rows = execute_query(f"""
        SELECT g.status AS interest_status, g.note, g.noted_at, g.updated_at,
               {PUBLIC_FIELDS}
          FROM academic_program_interest g
          JOIN academic_programs p ON p.id = g.program_id
         WHERE g.user_id = %s
         ORDER BY g.updated_at DESC
    """, (str(user_id),)) or []
    return jsonify({'success': True, 'interest': _stringify(rows), 'total': len(rows)})


@academic_bp.route('/outcomes', methods=['GET'])
@require_roles(*(CURATOR_ROLES | CAREER_SERVICES_ROLES))
def outcomes():
    """How many nationals progressed to graduate study.

    The reason the journey is recorded at all: no university admissions system
    will tell the Council this, and Article 4(10) requires it to be measurable.
    Counts only — no names on this endpoint.
    """
    rows = execute_query("""
        SELECT status, count(*) AS n, count(DISTINCT user_id) AS people
          FROM academic_program_interest GROUP BY status ORDER BY status""") or []
    return jsonify({'success': True, 'by_status': rows,
                    'note': ('Self-reported by candidates. The platform does not '
                             'submit applications, so an outcome is only known '
                             'when the person records it.')})


def register_academic_programs_routes(app):
    app.register_blueprint(academic_bp, url_prefix='/api/academic-programs')
