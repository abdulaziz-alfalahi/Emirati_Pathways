"""
Internship Engagement — the 3-way handshake between recruiter, internship
coordinator, and student (+ parent consent when the student is a minor).

Blueprint prefix: /api/internship-engagement

Design (owner session 2026-07-24, feedback fb_1784892515):
  * Recruiters LIST internships (table `internships`).
  * The coordinator (university rep) browses the list and PROPOSES an
    opportunity to a student based on their major (candidate_education_entries
    .field_of_study). Students may also SELF-APPLY, but see only internships
    relevant to their major.
  * Whoever initiates has implicitly consented. The engagement CONFIRMS when
    recruiter approved + student accepted + coordinator approved — and, only
    when the student is a minor (<18), parent consent granted.
  * On confirm an internship_placements row is created (the placement is the
    spine for Phase 2 assessment/reporting via internship_evaluations).

One engagement per (internship, student): UNIQUE index from migration 027.
A declined engagement row is reused (re-propose resets the handshake).
"""

import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

try:
    from backend.db_utils import execute_query
    from backend.auth.access_control import (
        require_roles, resolve_roles, ADMIN_ROLES, RECRUITER_ROLES,
    )
except ImportError:  # pragma: no cover
    from db_utils import execute_query
    from auth.access_control import (
        require_roles, resolve_roles, ADMIN_ROLES, RECRUITER_ROLES,
    )

logger = logging.getLogger(__name__)

internship_engagement_bp = Blueprint(
    'internship_engagement', __name__, url_prefix='/api/internship-engagement')

_COORDINATOR_ROLES = tuple(ADMIN_ROLES | {'internship_coordinator', 'education_operator'})
_RECRUITER_ROLES = tuple(RECRUITER_ROLES)
_STUDENT_ROLES = tuple(ADMIN_ROLES | {'candidate', 'job_seeker', 'student'})
_PARENT_ROLES = tuple(ADMIN_ROLES | {'parent'})

# Age below which parent consent is required (owner decision 2026-07-24).
MINOR_AGE_YEARS = 18


# ── helpers ──────────────────────────────────────────────────────────────────

def _me():
    return str(get_jwt_identity()).strip()


def _student_field_of_study(user_id):
    """The student's most recent declared major, or None."""
    row = execute_query(
        """SELECT field_of_study FROM candidate_education_entries
           WHERE user_id = %s AND field_of_study IS NOT NULL AND field_of_study <> ''
           ORDER BY end_date DESC NULLS FIRST, id DESC LIMIT 1""",
        (user_id,), fetch_one=True)
    return row['field_of_study'] if row else None


def _is_minor(user_id):
    """True if the student's recorded age is under MINOR_AGE_YEARS.
    Unknown DOB => treated as adult (consent not_required)."""
    row = execute_query(
        "SELECT EXTRACT(YEAR FROM age(dob))::int AS years FROM candidate_profiles "
        "WHERE user_id = %s AND dob IS NOT NULL",
        (user_id,), fetch_one=True)
    return bool(row) and row['years'] is not None and row['years'] < MINOR_AGE_YEARS


def _get_engagement(engagement_id):
    return execute_query(
        """SELECT ia.*, i.title AS internship_title, i.company AS internship_company,
                  i.posted_by AS internship_posted_by,
                  COALESCE(u.full_name, ia.user_id) AS student_name
           FROM internship_applications ia
           JOIN internships i ON i.id = ia.internship_id
           LEFT JOIN users u ON u.id = ia.user_id
           WHERE ia.id = %s""",
        (engagement_id,), fetch_one=True)


def _maybe_confirm(engagement_id):
    """Confirm the engagement when every required approval is in, and create
    the placement row. Idempotent: does nothing unless stage='proposed'."""
    e = execute_query(
        "SELECT * FROM internship_applications WHERE id = %s",
        (engagement_id,), fetch_one=True)
    if not e or e['stage'] != 'proposed':
        return e
    ready = (
        e['recruiter_status'] == 'approved'
        and e['student_status'] == 'accepted'
        and e['coordinator_status'] == 'approved'
        and e['parent_consent_status'] in ('not_required', 'granted')
    )
    if not ready:
        return e
    execute_query(
        "UPDATE internship_applications SET stage='confirmed', confirmed_at=NOW(), "
        "updated_at=NOW() WHERE id = %s AND stage='proposed'",
        (engagement_id,), fetch_all=False)
    # Placement = the spine for Phase 2 evaluations/reporting.
    existing = execute_query(
        "SELECT id FROM internship_placements WHERE application_id = %s",
        (engagement_id,), fetch_one=True)
    if not existing:
        intern = execute_query(
            "SELECT title FROM internships WHERE id = %s",
            (e['internship_id'],), fetch_one=True)
        execute_query(
            """INSERT INTO internship_placements
                   (student_id, opportunity_id, application_id, coordinator_id,
                    position_title, status)
               VALUES (%s, %s, %s, %s, %s, 'confirmed')""",
            (e['user_id'], e['internship_id'], engagement_id, e['coordinator_id'],
             (intern or {}).get('title', ''),), fetch_all=False)
    return execute_query(
        "SELECT * FROM internship_applications WHERE id = %s",
        (engagement_id,), fetch_one=True)


def _serialize(e):
    out = dict(e)
    for k in ('applied_at', 'updated_at', 'proposed_at', 'confirmed_at',
              'started_at', 'completed_at'):
        if out.get(k) is not None:
            out[k] = str(out[k])
    return out


def _upsert_engagement(internship_id, student_id, initiated_by, coordinator_id=None):
    """Create — or reset a previously-declined — engagement for (internship, student).
    Returns (engagement, error_response)."""
    intern = execute_query(
        "SELECT id, posted_by, is_active, deadline FROM internships WHERE id = %s",
        (internship_id,), fetch_one=True)
    if not intern:
        return None, (jsonify({'success': False, 'message': 'Internship not found'}), 404)
    if intern.get('is_active') is False:
        return None, (jsonify({'success': False, 'message': 'Internship is not active'}), 409)

    existing = execute_query(
        "SELECT * FROM internship_applications WHERE internship_id = %s AND user_id = %s",
        (internship_id, student_id), fetch_one=True)
    if existing and existing['stage'] not in ('declined', 'withdrawn'):
        return None, (jsonify({'success': False,
                               'message': 'An engagement for this internship and student already exists',
                               'engagement_id': existing['id']}), 409)

    consent = 'pending' if _is_minor(student_id) else 'not_required'
    student_status = 'accepted' if initiated_by == 'student' else 'pending'
    coordinator_status = 'approved' if initiated_by == 'coordinator' else 'pending'
    recruiter_id = (intern.get('posted_by') or '').strip() or None

    if existing:
        execute_query(
            """UPDATE internship_applications SET
                   initiated_by=%s, stage='proposed', recruiter_status='pending',
                   recruiter_id=%s, student_status=%s, coordinator_status=%s,
                   coordinator_id=%s, parent_consent_status=%s, decline_reason=NULL,
                   proposed_at=NOW(), confirmed_at=NULL, started_at=NULL,
                   completed_at=NULL, updated_at=NOW()
               WHERE id = %s""",
            (initiated_by, recruiter_id, student_status, coordinator_status,
             coordinator_id, consent, existing['id']), fetch_all=False)
        eng_id = existing['id']
    else:
        row = execute_query(
            """INSERT INTO internship_applications
                   (internship_id, user_id, status, initiated_by, stage,
                    recruiter_status, recruiter_id, student_status,
                    coordinator_status, coordinator_id, parent_consent_status)
               VALUES (%s, %s, 'pending', %s, 'proposed', 'pending', %s, %s, %s, %s, %s)
               RETURNING id""",
            (internship_id, student_id, initiated_by, recruiter_id, student_status,
             coordinator_status, coordinator_id, consent), fetch_one=True)
        eng_id = row['id']
    return _get_engagement(eng_id), None


# ── Coordinator ──────────────────────────────────────────────────────────────

@internship_engagement_bp.route('/opportunities', methods=['GET'])
@require_roles(*_COORDINATOR_ROLES)
def coordinator_opportunities():
    """Browse active recruiter-listed internships. Optional ?student_id= adds a
    relevance flag against that student's major."""
    student_id = (request.args.get('student_id') or '').strip()
    field = _student_field_of_study(student_id) if student_id else None
    rows = execute_query(
        """SELECT id, title, title_ar, company, sector, location, duration, stipend,
                  skills, deadline::text AS deadline, is_active, posted_by,
                  created_at::text AS created_at
           FROM internships
           WHERE is_active IS DISTINCT FROM FALSE
           ORDER BY created_at DESC""") or []
    if field:
        pat = field.lower()
        for r in rows:
            hay = ' '.join(str(r.get(k) or '') for k in ('title', 'sector', 'skills')).lower()
            r['relevant_to_student'] = pat in hay or any(
                w in hay for w in pat.split() if len(w) > 3)
    return jsonify({'success': True, 'data': rows,
                    'student_field_of_study': field, 'total': len(rows)})


@internship_engagement_bp.route('/propose', methods=['POST'])
@require_roles(*_COORDINATOR_ROLES)
def coordinator_propose():
    """Coordinator nominates a student for an internship (their approval is implicit)."""
    data = request.get_json() or {}
    internship_id, student_id = data.get('internship_id'), (data.get('student_id') or '').strip()
    if not internship_id or not student_id:
        return jsonify({'success': False, 'message': 'internship_id and student_id are required'}), 400
    student = execute_query("SELECT id FROM users WHERE id = %s", (student_id,), fetch_one=True)
    if not student:
        return jsonify({'success': False, 'message': 'Student not found'}), 404
    eng, err = _upsert_engagement(internship_id, student_id, 'coordinator', coordinator_id=_me())
    if err:
        return err
    return jsonify({'success': True, 'data': _serialize(eng),
                    'message': 'Proposal sent — awaiting recruiter approval and student acceptance'}), 201


@internship_engagement_bp.route('/coordinator', methods=['GET'])
@require_roles(*_COORDINATOR_ROLES)
def coordinator_engagements():
    """All engagements this coordinator initiated or reviews (admin: all)."""
    if resolve_roles() & ADMIN_ROLES:
        where, params = "TRUE", ()
    else:
        where, params = "ia.coordinator_id = %s OR ia.coordinator_id IS NULL", (_me(),)
    rows = execute_query(
        f"""SELECT ia.*, i.title AS internship_title, i.company AS internship_company,
                   COALESCE(u.full_name, ia.user_id) AS student_name
            FROM internship_applications ia
            JOIN internships i ON i.id = ia.internship_id
            LEFT JOIN users u ON u.id = ia.user_id
            WHERE {where}
            ORDER BY ia.updated_at DESC NULLS LAST, ia.id DESC""", params) or []
    return jsonify({'success': True, 'data': [_serialize(r) for r in rows], 'total': len(rows)})


@internship_engagement_bp.route('/<int:eng_id>/coordinator-decision', methods=['POST'])
@require_roles(*_COORDINATOR_ROLES)
def coordinator_decision(eng_id):
    """Coordinator reviews a STUDENT-initiated application (approve/decline)."""
    data = request.get_json() or {}
    decision = data.get('decision')
    if decision not in ('approve', 'decline'):
        return jsonify({'success': False, 'message': "decision must be 'approve' or 'decline'"}), 400
    e = _get_engagement(eng_id)
    if not e:
        return jsonify({'success': False, 'message': 'Engagement not found'}), 404
    if e['stage'] != 'proposed':
        return jsonify({'success': False, 'message': f"Engagement is already {e['stage']}"}), 409
    if decision == 'approve':
        execute_query(
            "UPDATE internship_applications SET coordinator_status='approved', "
            "coordinator_id=%s, updated_at=NOW() WHERE id=%s",
            (_me(), eng_id), fetch_all=False)
        e = _maybe_confirm(eng_id)
    else:
        execute_query(
            "UPDATE internship_applications SET coordinator_status='declined', coordinator_id=%s, "
            "stage='declined', decline_reason=%s, updated_at=NOW() WHERE id=%s",
            (_me(), data.get('reason'), eng_id), fetch_all=False)
        e = _get_engagement(eng_id)
    return jsonify({'success': True, 'data': _serialize(e)})


# ── Recruiter ────────────────────────────────────────────────────────────────

@internship_engagement_bp.route('/recruiter', methods=['GET'])
@require_roles(*_RECRUITER_ROLES)
def recruiter_engagements():
    """Engagements against internships this recruiter posted (admin: all)."""
    if resolve_roles() & ADMIN_ROLES:
        where, params = "TRUE", ()
    else:
        where, params = "TRIM(i.posted_by) = %s OR ia.recruiter_id = %s", (_me(), _me())
    rows = execute_query(
        f"""SELECT ia.*, i.title AS internship_title, i.company AS internship_company,
                   COALESCE(u.full_name, ia.user_id) AS student_name
            FROM internship_applications ia
            JOIN internships i ON i.id = ia.internship_id
            LEFT JOIN users u ON u.id = ia.user_id
            WHERE {where}
            ORDER BY ia.updated_at DESC NULLS LAST, ia.id DESC""", params) or []
    return jsonify({'success': True, 'data': [_serialize(r) for r in rows], 'total': len(rows)})


@internship_engagement_bp.route('/<int:eng_id>/recruiter-decision', methods=['POST'])
@require_roles(*_RECRUITER_ROLES)
def recruiter_decision(eng_id):
    data = request.get_json() or {}
    decision = data.get('decision')
    if decision not in ('approve', 'decline'):
        return jsonify({'success': False, 'message': "decision must be 'approve' or 'decline'"}), 400
    e = _get_engagement(eng_id)
    if not e:
        return jsonify({'success': False, 'message': 'Engagement not found'}), 404
    # Ownership: the recruiter who posted the internship (or an admin).
    me = _me()
    owner = (e.get('internship_posted_by') or '').strip()
    if owner != me and (e.get('recruiter_id') or '').strip() != me \
            and not (resolve_roles() & ADMIN_ROLES):
        return jsonify({'success': False, 'message': 'Not your internship listing'}), 403
    if e['stage'] != 'proposed':
        return jsonify({'success': False, 'message': f"Engagement is already {e['stage']}"}), 409
    if decision == 'approve':
        execute_query(
            "UPDATE internship_applications SET recruiter_status='approved', recruiter_id=%s, "
            "updated_at=NOW() WHERE id=%s", (me, eng_id), fetch_all=False)
        e = _maybe_confirm(eng_id)
    else:
        execute_query(
            "UPDATE internship_applications SET recruiter_status='declined', recruiter_id=%s, "
            "stage='declined', decline_reason=%s, updated_at=NOW() WHERE id=%s",
            (me, data.get('reason'), eng_id), fetch_all=False)
        e = _get_engagement(eng_id)
    return jsonify({'success': True, 'data': _serialize(e)})


# ── Student ──────────────────────────────────────────────────────────────────

@internship_engagement_bp.route('/relevant', methods=['GET'])
@require_roles(*_STUDENT_ROLES)
def student_relevant_internships():
    """Active internships relevant to the student's major. A student with no
    declared major sees all active internships (nothing to filter on)."""
    me = _me()
    field = _student_field_of_study(me)
    rows = execute_query(
        """SELECT id, title, title_ar, company, sector, location, duration, stipend,
                  skills, deadline::text AS deadline, created_at::text AS created_at
           FROM internships WHERE is_active IS DISTINCT FROM FALSE
           ORDER BY created_at DESC""") or []
    if field:
        pat = field.lower()
        words = [w for w in pat.split() if len(w) > 3]
        def rel(r):
            hay = ' '.join(str(r.get(k) or '') for k in ('title', 'sector', 'skills')).lower()
            return pat in hay or any(w in hay for w in words)
        rows = [r for r in rows if rel(r)]
    return jsonify({'success': True, 'data': rows,
                    'field_of_study': field, 'total': len(rows)})


@internship_engagement_bp.route('/apply', methods=['POST'])
@require_roles(*_STUDENT_ROLES)
def student_apply():
    """Self-apply (student's acceptance is implicit)."""
    data = request.get_json() or {}
    internship_id = data.get('internship_id')
    if not internship_id:
        return jsonify({'success': False, 'message': 'internship_id is required'}), 400
    eng, err = _upsert_engagement(internship_id, _me(), 'student')
    if err:
        return err
    return jsonify({'success': True, 'data': _serialize(eng),
                    'message': 'Application submitted — awaiting recruiter and coordinator review'}), 201


@internship_engagement_bp.route('/mine', methods=['GET'])
@require_roles(*_STUDENT_ROLES)
def student_engagements():
    rows = execute_query(
        """SELECT ia.*, i.title AS internship_title, i.company AS internship_company
           FROM internship_applications ia
           JOIN internships i ON i.id = ia.internship_id
           WHERE ia.user_id = %s
           ORDER BY ia.updated_at DESC NULLS LAST, ia.id DESC""", (_me(),)) or []
    return jsonify({'success': True, 'data': [_serialize(r) for r in rows], 'total': len(rows)})


@internship_engagement_bp.route('/<int:eng_id>/student-decision', methods=['POST'])
@require_roles(*_STUDENT_ROLES)
def student_decision(eng_id):
    data = request.get_json() or {}
    decision = data.get('decision')
    if decision not in ('accept', 'decline'):
        return jsonify({'success': False, 'message': "decision must be 'accept' or 'decline'"}), 400
    e = _get_engagement(eng_id)
    if not e:
        return jsonify({'success': False, 'message': 'Engagement not found'}), 404
    if (e['user_id'] or '').strip() != _me():
        return jsonify({'success': False, 'message': 'Not your engagement'}), 403
    if e['stage'] != 'proposed':
        return jsonify({'success': False, 'message': f"Engagement is already {e['stage']}"}), 409
    if decision == 'accept':
        execute_query(
            "UPDATE internship_applications SET student_status='accepted', updated_at=NOW() "
            "WHERE id=%s", (eng_id,), fetch_all=False)
        e = _maybe_confirm(eng_id)
    else:
        execute_query(
            "UPDATE internship_applications SET student_status='declined', stage='declined', "
            "decline_reason=%s, updated_at=NOW() WHERE id=%s",
            (data.get('reason'), eng_id), fetch_all=False)
        e = _get_engagement(eng_id)
    return jsonify({'success': True, 'data': _serialize(e)})


# ── Parent ───────────────────────────────────────────────────────────────────

def _parent_children(parent_id):
    rows = execute_query(
        "SELECT child_user_id FROM parent_child_links "
        "WHERE parent_user_id = %s AND verified IS DISTINCT FROM FALSE",
        (parent_id,)) or []
    return [r['child_user_id'].strip() for r in rows]


@internship_engagement_bp.route('/children', methods=['GET'])
@require_roles(*_PARENT_ROLES)
def parent_children_engagements():
    """Read-only tracking of the parent's (verified) children's engagements."""
    children = _parent_children(_me())
    if not children:
        return jsonify({'success': True, 'data': [], 'total': 0})
    rows = execute_query(
        """SELECT ia.*, i.title AS internship_title, i.company AS internship_company,
                  COALESCE(u.full_name, ia.user_id) AS student_name
           FROM internship_applications ia
           JOIN internships i ON i.id = ia.internship_id
           LEFT JOIN users u ON u.id = ia.user_id
           WHERE TRIM(ia.user_id) = ANY(%s)
           ORDER BY ia.updated_at DESC NULLS LAST, ia.id DESC""", (children,)) or []
    return jsonify({'success': True, 'data': [_serialize(r) for r in rows], 'total': len(rows)})


@internship_engagement_bp.route('/<int:eng_id>/parent-consent', methods=['POST'])
@require_roles(*_PARENT_ROLES)
def parent_consent(eng_id):
    """Grant/deny consent — only exists as a gate when the student is a minor."""
    data = request.get_json() or {}
    decision = data.get('decision')
    if decision not in ('grant', 'deny'):
        return jsonify({'success': False, 'message': "decision must be 'grant' or 'deny'"}), 400
    e = _get_engagement(eng_id)
    if not e:
        return jsonify({'success': False, 'message': 'Engagement not found'}), 404
    if (e['user_id'] or '').strip() not in _parent_children(_me()) \
            and not (resolve_roles() & ADMIN_ROLES):
        return jsonify({'success': False, 'message': 'Not your child'}), 403
    if e['parent_consent_status'] != 'pending':
        return jsonify({'success': False,
                        'message': f"Consent is {e['parent_consent_status']} — nothing to decide"}), 409
    if decision == 'grant':
        execute_query(
            "UPDATE internship_applications SET parent_consent_status='granted', updated_at=NOW() "
            "WHERE id=%s", (eng_id,), fetch_all=False)
        e = _maybe_confirm(eng_id)
    else:
        execute_query(
            "UPDATE internship_applications SET parent_consent_status='denied', stage='declined', "
            "decline_reason=%s, updated_at=NOW() WHERE id=%s",
            (data.get('reason'), eng_id), fetch_all=False)
        e = _get_engagement(eng_id)
    return jsonify({'success': True, 'data': _serialize(e)})


# ── Lifecycle: begin / complete (coordinator or recruiter or admin) ─────────

def _may_run_lifecycle(e):
    me = _me()
    if resolve_roles() & ADMIN_ROLES:
        return True
    if resolve_roles() & set(_COORDINATOR_ROLES) and (e.get('coordinator_id') or '').strip() in ('', me):
        return True
    owner = (e.get('internship_posted_by') or '').strip()
    return bool(resolve_roles() & set(_RECRUITER_ROLES)) and owner == me


@internship_engagement_bp.route('/<int:eng_id>/begin', methods=['POST'])
@require_roles(*(set(_COORDINATOR_ROLES) | set(_RECRUITER_ROLES)))
def begin_engagement(eng_id):
    e = _get_engagement(eng_id)
    if not e:
        return jsonify({'success': False, 'message': 'Engagement not found'}), 404
    if not _may_run_lifecycle(e):
        return jsonify({'success': False, 'message': 'Not a party to this engagement'}), 403
    if e['stage'] != 'confirmed':
        return jsonify({'success': False, 'message': f"Engagement is {e['stage']}, not confirmed"}), 409
    execute_query(
        "UPDATE internship_applications SET stage='active', started_at=NOW(), updated_at=NOW() "
        "WHERE id=%s", (eng_id,), fetch_all=False)
    execute_query(
        "UPDATE internship_placements SET status='active', start_date=COALESCE(start_date, NOW()) "
        "WHERE application_id=%s", (eng_id,), fetch_all=False)
    return jsonify({'success': True, 'data': _serialize(_get_engagement(eng_id))})


@internship_engagement_bp.route('/<int:eng_id>/complete', methods=['POST'])
@require_roles(*(set(_COORDINATOR_ROLES) | set(_RECRUITER_ROLES)))
def complete_engagement(eng_id):
    e = _get_engagement(eng_id)
    if not e:
        return jsonify({'success': False, 'message': 'Engagement not found'}), 404
    if not _may_run_lifecycle(e):
        return jsonify({'success': False, 'message': 'Not a party to this engagement'}), 403
    if e['stage'] != 'active':
        return jsonify({'success': False, 'message': f"Engagement is {e['stage']}, not active"}), 409
    execute_query(
        "UPDATE internship_applications SET stage='completed', completed_at=NOW(), updated_at=NOW() "
        "WHERE id=%s", (eng_id,), fetch_all=False)
    execute_query(
        "UPDATE internship_placements SET status='completed', end_date=COALESCE(end_date, NOW()) "
        "WHERE application_id=%s", (eng_id,), fetch_all=False)
    return jsonify({'success': True, 'data': _serialize(_get_engagement(eng_id))})
