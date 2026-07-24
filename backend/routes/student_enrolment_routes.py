"""
Student enrolment — Phase B of the identity-model rework.

A `student` is an enrolment-verified role: an education_operator/admin, or an
internship coordinator, verifies a person's enrolment at an institution, which
(a) writes a `students` record, (b) grants the `student` secondary role, and
(c) links the coordinator↔student in `advisor_student_assignments` so the
coordinator's internship-assignment pool is *their* enrolled students.

Blueprint prefix: /api/students
"""

import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

try:
    from backend.db_utils import execute_query
    from backend.auth.access_control import require_roles, resolve_roles, ADMIN_ROLES, ENROLMENT_ROLES
except ImportError:  # pragma: no cover
    from db_utils import execute_query
    from auth.access_control import require_roles, resolve_roles, ADMIN_ROLES, ENROLMENT_ROLES

logger = logging.getLogger(__name__)

student_enrolment_bp = Blueprint('student_enrolment', __name__, url_prefix='/api/students')


def _me():
    return str(get_jwt_identity()).strip()


def _grant_student_role(user_id):
    execute_query(
        "UPDATE users SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) "
        "|| jsonb_build_array('student') WHERE id = %s "
        "AND NOT (COALESCE(secondary_roles, '[]'::jsonb) ? 'student')",
        (str(user_id),), fetch_all=False)


def _is_enrolled_student(user_id):
    """True if the user has a students record — used by the internship flow."""
    row = execute_query(
        "SELECT 1 FROM students WHERE user_id = %s AND COALESCE(status,'') <> 'withdrawn' LIMIT 1",
        (str(user_id),), fetch_one=True)
    return bool(row)


@student_enrolment_bp.route('/enrol', methods=['POST'])
@require_roles(*ENROLMENT_ROLES)
def enrol_student():
    """Verify a person's enrolment → students record + grant `student` role +
    (optionally) link a coordinator."""
    data = request.get_json() or {}
    user_id = (data.get('user_id') or '').strip()
    institution = (data.get('institution') or '').strip()
    if not user_id or not institution:
        return jsonify({'success': False, 'message': 'user_id and institution are required'}), 400
    if not execute_query("SELECT id FROM users WHERE id = %s", (user_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'User not found'}), 404

    existing = execute_query("SELECT id FROM students WHERE user_id = %s", (user_id,), fetch_one=True)
    if existing:
        execute_query(
            """UPDATE students SET institution=%s, program=%s, graduation_date=%s,
                   status='enrolled', enrolled_by=%s, verified_at=NOW(), updated_at=NOW()
               WHERE user_id=%s""",
            (institution, data.get('program'), data.get('graduation_date'), _me(), user_id),
            fetch_all=False)
    else:
        execute_query(
            """INSERT INTO students (user_id, student_id, institution, program, graduation_date,
                   status, enrolled_by, verified_at, created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, 'enrolled', %s, NOW(), NOW(), NOW())""",
            (user_id, data.get('student_id') or user_id, institution, data.get('program'),
             data.get('graduation_date'), _me()), fetch_all=False)

    _grant_student_role(user_id)

    # Link a coordinator (the enroller if they are a coordinator, or an explicit
    # coordinator_id) so their internship assignment pool includes this student.
    coordinator_id = (data.get('coordinator_id') or '').strip()
    if not coordinator_id and (resolve_roles() & {'internship_coordinator'}):
        coordinator_id = _me()
    if coordinator_id:
        link = execute_query(
            "SELECT id FROM advisor_student_assignments WHERE advisor_id=%s AND student_id=%s",
            (coordinator_id, user_id), fetch_one=True)
        if not link:
            execute_query(
                "INSERT INTO advisor_student_assignments (advisor_id, student_id, status, assigned_at) "
                "VALUES (%s, %s, 'active', NOW())", (coordinator_id, user_id), fetch_all=False)

    return jsonify({'success': True, 'message': 'Student enrolled',
                    'data': {'user_id': user_id, 'institution': institution,
                             'coordinator_id': coordinator_id or None}}), 201


@student_enrolment_bp.route('/my-students', methods=['GET'])
@require_roles(*ENROLMENT_ROLES)
def my_students():
    """A coordinator's enrolled students (for the internship assignment pool);
    education_operator/admin see all enrolled students."""
    roles = resolve_roles()
    if roles & (ADMIN_ROLES | {'education_operator'}):
        rows = execute_query(
            """SELECT s.user_id, COALESCE(u.full_name, s.user_id) AS full_name,
                      s.institution, s.program, s.graduation_date::text AS graduation_date,
                      s.status, s.verified_at::text AS verified_at
               FROM students s LEFT JOIN users u ON u.id = s.user_id
               WHERE COALESCE(s.status,'') <> 'withdrawn'
               ORDER BY s.verified_at DESC NULLS LAST""") or []
    else:
        rows = execute_query(
            """SELECT s.user_id, COALESCE(u.full_name, s.user_id) AS full_name,
                      s.institution, s.program, s.graduation_date::text AS graduation_date,
                      s.status, s.verified_at::text AS verified_at
               FROM advisor_student_assignments a
               JOIN students s ON s.user_id = a.student_id
               LEFT JOIN users u ON u.id = s.user_id
               WHERE a.advisor_id = %s AND COALESCE(a.status,'') <> 'inactive'
               ORDER BY s.verified_at DESC NULLS LAST""", (_me(),)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@student_enrolment_bp.route('/<user_id>', methods=['GET'])
@require_roles(*ENROLMENT_ROLES)
def student_record(user_id):
    row = execute_query(
        """SELECT s.user_id, COALESCE(u.full_name, s.user_id) AS full_name, s.institution,
                  s.program, s.graduation_date::text AS graduation_date, s.status,
                  s.enrolled_by, s.verified_at::text AS verified_at
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
