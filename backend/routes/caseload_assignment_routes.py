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
from flask_jwt_extended import get_jwt_identity

try:
    from backend.db import get_db_connection
    from backend.auth.access_control import require_roles, OPERATOR_ROLES, resolve_roles
    from backend import caseload_states as cs
except ImportError:  # pragma: no cover
    from db import get_db_connection
    from auth.access_control import require_roles, OPERATOR_ROLES, resolve_roles
    import caseload_states as cs

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


def _may_assign(kind):
    """None if the caller may allocate this caseload kind, else a 403 response.

    The blueprint-level @require_roles(*OPERATOR_ROLES) is deliberately kept as
    the outer gate and this narrows it PER KIND, because the two caseloads have
    different answers: any operator may allocate an advisor caseload (unchanged),
    but only career-services operators may allocate a coach — call-centre agents
    read the CRM without being able to allocate coaching (owner, 2026-08-17).

    resolve_roles, not a raw claim: a multi-role user holding
    career_services_operator as a SECONDARY role must pass. Hand-rolled
    `role in ...` checks have failed open here twelve times (issue #96).
    """
    allowed = cs.ASSIGN_ROLES_BY_KIND.get((kind or '').strip().lower())
    if not allowed:
        return None  # unknown kind — _resolve_type already 404s it
    held = set(resolve_roles() or [])
    if held & set(allowed):
        return None
    return jsonify({'success': False,
                    'error': 'Your role may not assign this caseload type'}), 403


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
    # Narrower than the blueprint gate: only career-services operators may
    # allocate a coach, though any operator may allocate an advisor caseload.
    refused = _may_assign(kind)
    if refused:
        return refused
    data = request.get_json(silent=True) or {}
    staff_id, member_id = data.get('staff_id'), data.get('member_id')
    if not staff_id or not member_id:
        return jsonify({'success': False, 'error': 'staff_id and member_id are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    try:
        cur = conn.cursor()
        # ACTIVE, not pending: an operator allocation does not wait for the staff
        # member to accept (owner, 2026-08-17). Their agency is the hand-back,
        # after the fact — see backend/caseload_states.py.
        #
        # origin/assigned_by (migration 072) are what let the coach dashboard say
        # "allocated by X" instead of presenting an allocated client identically
        # to one who chose them.
        actor = str(get_jwt_identity())
        cur.execute(f"""
            INSERT INTO {cfg['table']}
                ({cfg['staff_col']}, {cfg['member_col']}, status, assigned_at,
                 origin, assigned_by)
            VALUES (%s, %s, %s, NOW(), %s, %s)
            ON CONFLICT ({cfg['staff_col']}, {cfg['member_col']})
            DO UPDATE SET status = %s, assigned_at = NOW(),
                          origin = %s, assigned_by = %s
        """, (str(staff_id), str(member_id), cs.ACTIVE, cs.ORIGIN_ASSIGNED, actor,
              cs.ACTIVE, cs.ORIGIN_ASSIGNED, actor))
        conn.commit()
        cur.close(); conn.close()
        # The caseload changed hands with zero signal to the assignee.
        try:
            try:
                from backend.notification_helper import create_notification as _notify
            except ImportError:
                from notification_helper import create_notification as _notify
            _notify(user_id=str(staff_id), notification_type='caseload_assigned',
                    title='New caseload assignment',
                    message='A person has been assigned to your caseload.',
                    metadata={'kind': kind, 'member_id': str(member_id),
                              'origin': cs.ORIGIN_ASSIGNED})
            # The CANDIDATE is told too (owner, 2026-08-17). Assignment gives a
            # staff member access to their skill gaps and development plans, and
            # lets them schedule sessions that are transcribed and retained under
            # consent policy 1.1. Finding that out when a coach calls is the
            # wrong way to find out.
            if kind == 'coach':
                _notify(user_id=str(member_id), notification_type='coach_assigned',
                        title='A career coach has been assigned to you',
                        message=('EHRDC has assigned you a career coach. You can see '
                                 'them under Professional Growth → Mentorship → '
                                 'Career Coaching.'),
                        metadata={'coach_id': str(staff_id)})
        except Exception as notify_err:
            logger.warning(f"caseload assign notify failed: {notify_err}")
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
    # Whoever may assign a kind may also withdraw it. Gating one without the
    # other would let a role create a relationship it could not undo.
    refused = _may_assign(kind)
    if refused:
        return refused
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
    """List active assignments for a caseload type.

    ?staff_id= narrows to one staff member's caseload; ?member_id= answers "who
    is this person assigned to", which is what the CRM asks when an operator
    opens a single candidate. Without the second filter that screen would have to
    fetch every active assignment and search it client-side — fine at pilot
    volumes, quietly O(caseload) once the full seeker roster is loaded.
    """
    cfg = _resolve_type(kind)
    if not cfg:
        return jsonify({'success': False, 'error': f"Unknown caseload type '{kind}'"}), 404
    staff_id = request.args.get('staff_id')
    member_id = request.args.get('member_id')

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = f"""
            SELECT a.{cfg['staff_col']} AS staff_id, a.{cfg['member_col']} AS member_id,
                   a.assigned_at, a.origin, a.assigned_by,
                   COALESCE(u.full_name, u.email) AS member_name,
                   COALESCE(s.full_name, s.email) AS staff_name
            FROM {cfg['table']} a
            LEFT JOIN users u ON u.id = a.{cfg['member_col']}
            LEFT JOIN users s ON s.id = a.{cfg['staff_col']}
            WHERE a.status = 'active'
        """
        params = []
        if staff_id:
            sql += f" AND a.{cfg['staff_col']} = %s"
            params.append(str(staff_id))
        if member_id:
            sql += f" AND a.{cfg['member_col']} = %s"
            params.append(str(member_id))
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
