"""
Caseload assignment (P1 / C3).

The advisor, coach, and career-services subsystems were non-functional
end to end because *nothing* populated their assignment stores:
`advisor_student_assignments`, `coach_client_assignments`, and
`candidate_profiles.assigned_to` (the CRM "Assigned To"). So every
caseload, at-risk list, and analytics view was permanently empty, and
session/plan writes 403'd ("not your client").

This blueprint is the missing primitive: an operator/admin can list the
staff who hold a given role and assign/unassign candidates to them across
all three stores through one consistent API.

Prefix: /api/caseload
"""

import logging

import psycopg2.extras
from flask import Blueprint, request, jsonify

try:
    from backend.db import get_db_connection
    from backend.auth.access_control import require_roles, OPERATOR_ROLES
except ImportError:  # pragma: no cover
    from db import get_db_connection
    from auth.access_control import require_roles, OPERATOR_ROLES

logger = logging.getLogger(__name__)

caseload_bp = Blueprint('caseload_assignment', __name__, url_prefix='/api/caseload')

# The role each caseload type is staffed by, and where an assignment lands.
_CASELOAD_TYPES = {
    'advisor': {
        'role': 'advisor',
        'table': 'advisor_student_assignments',
        'staff_col': 'advisor_id',
        'member_col': 'student_id',
    },
    'coach': {
        'role': 'coach',
        'table': 'coach_client_assignments',
        'staff_col': 'coach_id',
        'member_col': 'client_id',
    },
}


def _resolve_type(kind):
    return _CASELOAD_TYPES.get((kind or '').strip().lower())


@caseload_bp.route('/operators', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def list_operators():
    """List staff who hold a role — for the "assign to" pickers.

    ?role=advisor|coach|career_services_operator (any role string). Matches
    the role as PRIMARY or in secondary_roles, so staff granted via the
    request loop are found.
    """
    role = (request.args.get('role') or '').strip()
    if not role:
        return jsonify({'success': False, 'error': 'role query param is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, COALESCE(full_name, NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), email) AS name,
                   email, role
            FROM users
            WHERE is_active = TRUE
              AND (role = %s OR jsonb_exists(secondary_roles, %s))
            ORDER BY name
        """, (role, role))
        operators = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({'success': True, 'operators': operators, 'total': len(operators)}), 200
    except Exception as e:
        conn.close()
        logger.error(f"list_operators failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@caseload_bp.route('/<kind>/assign', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def assign(kind):
    """Assign a candidate to a staff member's caseload.

    Body: {"staff_id": "...", "member_id": "..."}. Idempotent —
    re-assigning reactivates a previously-removed row.
    """
    cfg = _resolve_type(kind)
    if not cfg:
        return jsonify({'success': False, 'error': f"Unknown caseload type '{kind}'"}), 404
    data = request.get_json(silent=True) or {}
    staff_id, member_id = data.get('staff_id'), data.get('member_id')
    if not staff_id or not member_id:
        return jsonify({'success': False, 'error': 'staff_id and member_id are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    try:
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {cfg['table']} ({cfg['staff_col']}, {cfg['member_col']}, status, assigned_at)
            VALUES (%s, %s, 'active', NOW())
            ON CONFLICT ({cfg['staff_col']}, {cfg['member_col']})
            DO UPDATE SET status = 'active', assigned_at = NOW()
        """, (str(staff_id), str(member_id)))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'success': True, 'status': 'assigned'}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"assign {kind} failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@caseload_bp.route('/<kind>/unassign', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def unassign(kind):
    """Soft-remove a caseload assignment (status='removed'). Body:
    {"staff_id","member_id"}."""
    cfg = _resolve_type(kind)
    if not cfg:
        return jsonify({'success': False, 'error': f"Unknown caseload type '{kind}'"}), 404
    data = request.get_json(silent=True) or {}
    staff_id, member_id = data.get('staff_id'), data.get('member_id')
    if not staff_id or not member_id:
        return jsonify({'success': False, 'error': 'staff_id and member_id are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    try:
        cur = conn.cursor()
        cur.execute(f"""
            UPDATE {cfg['table']} SET status = 'removed'
            WHERE {cfg['staff_col']} = %s AND {cfg['member_col']} = %s
        """, (str(staff_id), str(member_id)))
        removed = cur.rowcount
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'success': True, 'status': 'unassigned', 'affected': removed}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"unassign {kind} failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@caseload_bp.route('/<kind>', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def list_assignments(kind):
    """List active assignments for a caseload type, optionally ?staff_id=."""
    cfg = _resolve_type(kind)
    if not cfg:
        return jsonify({'success': False, 'error': f"Unknown caseload type '{kind}'"}), 404
    staff_id = request.args.get('staff_id')

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = f"""
            SELECT a.{cfg['staff_col']} AS staff_id, a.{cfg['member_col']} AS member_id,
                   a.assigned_at,
                   COALESCE(u.full_name, u.email) AS member_name
            FROM {cfg['table']} a
            LEFT JOIN users u ON u.id = a.{cfg['member_col']}
            WHERE a.status = 'active'
        """
        params = []
        if staff_id:
            sql += f" AND a.{cfg['staff_col']} = %s"
            params.append(str(staff_id))
        sql += " ORDER BY a.assigned_at DESC"
        cur.execute(sql, tuple(params))
        rows = []
        for r in cur.fetchall():
            d = dict(r)
            if d.get('assigned_at'):
                d['assigned_at'] = d['assigned_at'].isoformat()
            rows.append(d)
        cur.close(); conn.close()
        return jsonify({'success': True, 'assignments': rows, 'total': len(rows)}), 200
    except Exception as e:
        conn.close()
        logger.error(f"list_assignments {kind} failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
