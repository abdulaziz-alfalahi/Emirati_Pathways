"""
Student enrolment — institution-scoped enrolment authority.

A `student` is an enrolment-verified role. The Academic Advisor (institution-side,
present from the start of the journey) is the primary enroller, alongside the
Education Operator and Admin. Enrolment:
  (a) pre-creates the person's account by their real Emirates ID when they have
      not yet logged in via UAE Pass (the proven EID binds on first login —
      identity model #90; never bind by phone/email),
  (b) writes/updates a `students` record scoped to a canonical institution,
  (c) grants the `student` secondary role, and
  (d) links the enrolling advisor↔student in `advisor_student_assignments`
      (the advisor's caseload).

Advisors are bound to institutions via `institution_staff` and may only enrol /
manage students of an institution they are active staff of; admin and
education_operator are unscoped. The internship coordinator no longer enrols —
it lists/assigns from an already-enrolled, institution-scoped pool.

Blueprint prefix: /api/students
"""

import csv
import io
import logging
import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

try:
    from backend.db_utils import execute_query
    from backend.auth.access_control import (
        require_roles, resolve_roles, ADMIN_ROLES, ENROLMENT_ROLES, INSTITUTION_ROLES,
    )
except ImportError:  # pragma: no cover
    from db_utils import execute_query
    from auth.access_control import (
        require_roles, resolve_roles, ADMIN_ROLES, ENROLMENT_ROLES, INSTITUTION_ROLES,
    )

logger = logging.getLogger(__name__)

student_enrolment_bp = Blueprint('student_enrolment', __name__, url_prefix='/api/students')

# Operators who may enrol into / manage any institution (unscoped).
_UNSCOPED = ADMIN_ROLES | {'education_operator'}
# Who may create institutions and bind staff to them.
_INSTITUTION_ADMIN = ADMIN_ROLES | {'education_operator'}
# A real UAE Emirates ID: 15 digits, 784 prefix (synthetic 7840000… also match).
_EID_RE = re.compile(r'^784\d{12}$')


def _me():
    return str(get_jwt_identity()).strip()


def _valid_eid(s):
    return bool(_EID_RE.match(str(s or '').strip()))


def _grant_role(user_id, role):
    """Idempotently add a secondary role (keeps user_type/role untouched)."""
    execute_query(
        "UPDATE users SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) "
        "|| jsonb_build_array(%s) WHERE id = %s "
        "AND NOT (COALESCE(secondary_roles, '[]'::jsonb) ? %s)",
        (role, str(user_id), role), fetch_all=False)


def _caller_institution_ids(staff_role=None):
    """Institution ids the caller is active staff of (optionally by staff_role)."""
    q = ("SELECT institution_id FROM institution_staff "
         "WHERE user_id = %s AND status = 'active'")
    params = [_me()]
    if staff_role:
        q += " AND staff_role = %s"
        params.append(staff_role)
    rows = execute_query(q, tuple(params)) or []
    return {r['institution_id'] for r in rows}


def _is_enrolled_student(user_id):
    """True if the user has a students record — used by the internship flow."""
    row = execute_query(
        "SELECT 1 FROM students WHERE user_id = %s AND COALESCE(status,'') <> 'withdrawn' LIMIT 1",
        (str(user_id),), fetch_one=True)
    return bool(row)


def _resolve_institution(data, allow_create):
    """Return (institution_id, institution_name, error_response_or_None).

    Accepts an explicit institution_id, or an institution name that is
    found-or-(optionally)-created. Name matching is case-insensitive so the
    same institution never forks into two rows.
    """
    iid = data.get('institution_id')
    if iid:
        row = execute_query("SELECT id, name FROM institutions WHERE id = %s",
                            (iid,), fetch_one=True)
        if not row:
            return None, None, (jsonify({'success': False, 'message': 'Institution not found'}), 404)
        return row['id'], row['name'], None

    name = (data.get('institution') or '').strip()
    if not name:
        return None, None, (jsonify({'success': False,
                                     'message': 'institution_id or institution is required'}), 400)
    row = execute_query("SELECT id, name FROM institutions WHERE LOWER(name) = LOWER(%s)",
                        (name,), fetch_one=True)
    if row:
        return row['id'], row['name'], None
    if not allow_create:
        return None, None, (jsonify(
            {'success': False,
             'message': f'Institution "{name}" is not registered — ask an operator to add it '
                        'or select one of your institutions.'}), 404)
    row = execute_query(
        "INSERT INTO institutions (name, name_ar, type, emirate, created_by, created_at) "
        "VALUES (%s, %s, %s, %s, %s, NOW()) RETURNING id, name",
        (name, data.get('institution_ar'), data.get('institution_type') or 'university',
         data.get('emirate'), _me()), fetch_one=True)
    return row['id'], row['name'], None


def _enrol_one(row, institution_id, institution_name, link_advisor):
    """Enrol a single person. Returns a per-row result dict.

    `row` keys: user_id/emirates_id (required), full_name/name, program,
    graduation_date, date_of_birth/dob, student_id.
    Raises ValueError(message) on a bad row so the caller can record it.
    """
    eid = str(row.get('user_id') or row.get('emirates_id') or '').strip()
    if not _valid_eid(eid):
        raise ValueError(f'Invalid Emirates ID "{eid}" (expected 15 digits, 784-prefixed)')

    full_name = (row.get('full_name') or row.get('name') or '').strip()
    if not full_name:
        fn, ln = (row.get('first_name') or '').strip(), (row.get('last_name') or '').strip()
        full_name = (fn + ' ' + ln).strip()

    program = (row.get('program') or '').strip() or None
    graduation_date = (row.get('graduation_date') or '').strip() or None
    dob = (row.get('date_of_birth') or row.get('dob') or '').strip() or None
    student_id = (row.get('student_id') or '').strip() or eid

    existing_user = execute_query("SELECT id FROM users WHERE id = %s", (eid,), fetch_one=True)
    account_state = 'existing'
    if not existing_user:
        # Pre-create by real Emirates ID. The account is inert until the person
        # authenticates via UAE Pass, at which point the proven EID binds here.
        execute_query(
            "INSERT INTO users (id, full_name, role, user_type, secondary_roles, "
            "is_active, auth_method, created_at) "
            "VALUES (%s, %s, 'candidate', 'candidate', '[\"student\"]'::jsonb, TRUE, "
            "'pre_enrolled', NOW())",
            (eid, full_name or eid), fetch_all=False)
        account_state = 'pre_created'
    else:
        _grant_role(eid, 'student')
        if full_name:
            execute_query("UPDATE users SET full_name = COALESCE(NULLIF(full_name,''), %s) WHERE id = %s",
                          (full_name, eid), fetch_all=False)

    existing_student = execute_query("SELECT id FROM students WHERE user_id = %s", (eid,), fetch_one=True)
    if existing_student:
        execute_query(
            """UPDATE students SET institution=%s, institution_id=%s, program=%s,
                   graduation_date=%s, date_of_birth=COALESCE(%s, date_of_birth),
                   student_id=COALESCE(NULLIF(%s,''), student_id),
                   status='enrolled', enrolled_by=%s, verified_at=NOW(), updated_at=NOW()
               WHERE user_id=%s""",
            (institution_name, institution_id, program, graduation_date, dob, student_id,
             _me(), eid), fetch_all=False)
        row_state = 'updated'
    else:
        execute_query(
            """INSERT INTO students (user_id, student_id, institution, institution_id, program,
                   graduation_date, date_of_birth, status, enrolled_by, verified_at,
                   created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'enrolled', %s, NOW(), NOW(), NOW())""",
            (eid, student_id, institution_name, institution_id, program, graduation_date,
             dob, _me()), fetch_all=False)
        row_state = 'created'

    # advisor caseload link (only when the enroller acts as an advisor)
    if link_advisor:
        link = execute_query(
            "SELECT id FROM advisor_student_assignments WHERE advisor_id=%s AND student_id=%s",
            (_me(), eid), fetch_one=True)
        if not link:
            execute_query(
                "INSERT INTO advisor_student_assignments (advisor_id, student_id, status, assigned_at) "
                "VALUES (%s, %s, 'active', NOW())", (_me(), eid), fetch_all=False)

    return {'user_id': eid, 'full_name': full_name or None,
            'student': row_state, 'account': account_state}


def _authorize_institution(institution_id):
    """None if the caller may enrol into this institution, else a 403 response."""
    if resolve_roles() & _UNSCOPED:
        return None
    if institution_id in _caller_institution_ids('advisor'):
        return None
    return (jsonify({'success': False,
                     'message': 'You are not an advisor at this institution.'}), 403)


@student_enrolment_bp.route('/enrol', methods=['POST'])
@require_roles(*ENROLMENT_ROLES)
def enrol_student():
    """Enrol one person → students record + `student` role (+ advisor caseload)."""
    data = request.get_json() or {}
    institution_id, institution_name, err = _resolve_institution(
        data, allow_create=bool(resolve_roles() & _INSTITUTION_ADMIN))
    if err:
        return err
    denied = _authorize_institution(institution_id)
    if denied:
        return denied
    link_advisor = bool(resolve_roles() & {'advisor'})
    try:
        result = _enrol_one(data, institution_id, institution_name, link_advisor)
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    return jsonify({'success': True, 'message': 'Student enrolled',
                    'data': {**result, 'institution_id': institution_id,
                             'institution': institution_name}}), 201


@student_enrolment_bp.route('/enrol-batch', methods=['POST'])
@require_roles(*ENROLMENT_ROLES)
def enrol_batch():
    """Batch-enrol a roster for ONE institution. Accepts `students` (list of row
    dicts) and/or `csv` (raw CSV text with a header row). Returns per-row results;
    a bad row is recorded and skipped, it does not abort the batch."""
    data = request.get_json() or {}
    institution_id, institution_name, err = _resolve_institution(
        data, allow_create=bool(resolve_roles() & _INSTITUTION_ADMIN))
    if err:
        return err
    denied = _authorize_institution(institution_id)
    if denied:
        return denied

    rows = list(data.get('students') or [])
    csv_text = data.get('csv')
    if csv_text:
        for r in csv.DictReader(io.StringIO(csv_text)):
            rows.append({(k or '').strip().lower(): (v or '').strip() for k, v in r.items()})
    if not rows:
        return jsonify({'success': False, 'message': 'No students provided'}), 400
    if len(rows) > 1000:
        return jsonify({'success': False, 'message': 'Batch too large (max 1000 rows)'}), 400

    link_advisor = bool(resolve_roles() & {'advisor'})
    results, errors = [], []
    for i, row in enumerate(rows):
        try:
            results.append(_enrol_one(row, institution_id, institution_name, link_advisor))
        except ValueError as e:
            errors.append({'row': i + 1, 'user_id': row.get('user_id') or row.get('emirates_id'),
                           'error': str(e)})
        except Exception:  # pragma: no cover
            logger.exception("enrol-batch row %s failed", i + 1)
            errors.append({'row': i + 1, 'error': 'Unexpected error'})

    created = sum(1 for r in results if r['student'] == 'created')
    updated = sum(1 for r in results if r['student'] == 'updated')
    return jsonify({'success': True,
                    'message': f'{created} created, {updated} updated, {len(errors)} failed',
                    'data': {'institution_id': institution_id, 'institution': institution_name,
                             'created': created, 'updated': updated, 'failed': len(errors),
                             'results': results, 'errors': errors}}), 201


@student_enrolment_bp.route('/my-students', methods=['GET'])
@require_roles(*ENROLMENT_ROLES)
def my_students():
    """An advisor's caseload (advisor_student_assignments); admin/education_operator
    see all enrolled students."""
    roles = resolve_roles()
    if roles & _UNSCOPED:
        rows = execute_query(
            """SELECT s.user_id, COALESCE(u.full_name, s.user_id) AS full_name,
                      s.institution, s.institution_id, s.program,
                      s.graduation_date::text AS graduation_date,
                      s.status, s.verified_at::text AS verified_at
               FROM students s LEFT JOIN users u ON u.id = s.user_id
               WHERE COALESCE(s.status,'') <> 'withdrawn'
               ORDER BY s.verified_at DESC NULLS LAST""") or []
    else:
        rows = execute_query(
            """SELECT s.user_id, COALESCE(u.full_name, s.user_id) AS full_name,
                      s.institution, s.institution_id, s.program,
                      s.graduation_date::text AS graduation_date,
                      s.status, s.verified_at::text AS verified_at
               FROM advisor_student_assignments a
               JOIN students s ON s.user_id = a.student_id
               LEFT JOIN users u ON u.id = s.user_id
               WHERE a.advisor_id = %s AND COALESCE(a.status,'') <> 'inactive'
               ORDER BY s.verified_at DESC NULLS LAST""", (_me(),)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@student_enrolment_bp.route('/at-my-institution', methods=['GET'])
@require_roles(*INSTITUTION_ROLES)
def students_at_my_institution():
    """Students enrolled at an institution the caller is staff of (advisor OR
    coordinator). admin/education_operator see all. This is the coordinator's
    assignable internship pool."""
    roles = resolve_roles()
    if roles & _UNSCOPED:
        rows = execute_query(
            """SELECT s.user_id, COALESCE(u.full_name, s.user_id) AS full_name,
                      s.institution, s.institution_id, s.program,
                      s.graduation_date::text AS graduation_date, s.status
               FROM students s LEFT JOIN users u ON u.id = s.user_id
               WHERE COALESCE(s.status,'') <> 'withdrawn'
               ORDER BY s.verified_at DESC NULLS LAST""") or []
    else:
        inst = _caller_institution_ids()
        if not inst:
            return jsonify({'success': True, 'data': [], 'total': 0})
        rows = execute_query(
            """SELECT s.user_id, COALESCE(u.full_name, s.user_id) AS full_name,
                      s.institution, s.institution_id, s.program,
                      s.graduation_date::text AS graduation_date, s.status
               FROM students s LEFT JOIN users u ON u.id = s.user_id
               WHERE s.institution_id = ANY(%s) AND COALESCE(s.status,'') <> 'withdrawn'
               ORDER BY s.verified_at DESC NULLS LAST""", (list(inst),)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


# ---------------------------------------------------------------------------
# Institutions & staff
# ---------------------------------------------------------------------------

@student_enrolment_bp.route('/institutions', methods=['GET'])
@require_roles(*INSTITUTION_ROLES)
def list_institutions():
    """admin/education_operator see all institutions; advisor/coordinator see the
    ones they are staff of (for the enrol/assign pickers)."""
    if resolve_roles() & _UNSCOPED:
        rows = execute_query(
            "SELECT id, name, name_ar, type, emirate FROM institutions ORDER BY name") or []
    else:
        rows = execute_query(
            """SELECT DISTINCT i.id, i.name, i.name_ar, i.type, i.emirate
               FROM institutions i JOIN institution_staff st ON st.institution_id = i.id
               WHERE st.user_id = %s AND st.status = 'active' ORDER BY i.name""",
            (_me(),)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@student_enrolment_bp.route('/my-institutions', methods=['GET'])
@require_roles(*INSTITUTION_ROLES)
def my_institutions():
    """The caller's own institutional affiliations (with staff_role)."""
    rows = execute_query(
        """SELECT i.id, i.name, i.name_ar, i.type, i.emirate, st.staff_role
           FROM institution_staff st JOIN institutions i ON i.id = st.institution_id
           WHERE st.user_id = %s AND st.status = 'active' ORDER BY i.name""",
        (_me(),)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@student_enrolment_bp.route('/institutions', methods=['POST'])
@require_roles(*_INSTITUTION_ADMIN)
def create_institution():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'name is required'}), 400
    existing = execute_query("SELECT id, name FROM institutions WHERE LOWER(name) = LOWER(%s)",
                             (name,), fetch_one=True)
    if existing:
        return jsonify({'success': True, 'data': existing, 'message': 'Already exists'}), 200
    row = execute_query(
        "INSERT INTO institutions (name, name_ar, type, emirate, created_by, created_at) "
        "VALUES (%s, %s, %s, %s, %s, NOW()) RETURNING id, name, name_ar, type, emirate",
        (name, data.get('name_ar'), data.get('type') or 'university', data.get('emirate'), _me()),
        fetch_one=True)
    return jsonify({'success': True, 'data': row, 'message': 'Institution created'}), 201


@student_enrolment_bp.route('/institutions/<int:institution_id>/staff', methods=['POST'])
@require_roles(*_INSTITUTION_ADMIN)
def add_institution_staff(institution_id):
    """Bind a user as advisor/coordinator at an institution AND grant the matching
    secondary role, so the affiliation and the role never drift apart."""
    data = request.get_json() or {}
    user_id = (data.get('user_id') or '').strip()
    staff_role = (data.get('staff_role') or 'advisor').strip()
    if staff_role not in ('advisor', 'coordinator'):
        return jsonify({'success': False, 'message': "staff_role must be 'advisor' or 'coordinator'"}), 400
    if not execute_query("SELECT id FROM institutions WHERE id = %s", (institution_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'Institution not found'}), 404
    if not execute_query("SELECT id FROM users WHERE id = %s", (user_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'User not found'}), 404
    execute_query(
        "INSERT INTO institution_staff (user_id, institution_id, staff_role, status, created_by, created_at) "
        "VALUES (%s, %s, %s, 'active', %s, NOW()) "
        "ON CONFLICT (user_id, institution_id, staff_role) DO UPDATE SET status='active'",
        (user_id, institution_id, staff_role, _me()), fetch_all=False)
    _grant_role(user_id, 'advisor' if staff_role == 'advisor' else 'internship_coordinator')
    return jsonify({'success': True, 'message': f'{user_id} bound as {staff_role}',
                    'data': {'user_id': user_id, 'institution_id': institution_id,
                             'staff_role': staff_role}}), 201


@student_enrolment_bp.route('/<user_id>', methods=['GET'])
@require_roles(*INSTITUTION_ROLES)
def student_record(user_id):
    row = execute_query(
        """SELECT s.user_id, COALESCE(u.full_name, s.user_id) AS full_name, s.institution,
                  s.institution_id, s.program, s.graduation_date::text AS graduation_date,
                  s.status, s.enrolled_by, s.verified_at::text AS verified_at
           FROM students s LEFT JOIN users u ON u.id = s.user_id
           WHERE s.user_id = %s""", (str(user_id).strip(),), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'message': 'Not enrolled'}), 404
    return jsonify({'success': True, 'data': row})


@student_enrolment_bp.route('/<user_id>/graduate', methods=['POST'])
@require_roles(*ENROLMENT_ROLES)
def graduate_student(user_id):
    execute_query("UPDATE students SET status='graduated', updated_at=NOW() WHERE user_id=%s",
                  (str(user_id).strip(),), fetch_all=False)
    return jsonify({'success': True, 'data': {'user_id': str(user_id).strip(), 'status': 'graduated'}})
