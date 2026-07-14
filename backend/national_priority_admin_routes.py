"""National Development Priority — weights admin API (#12 / #33).

Lets EHRDC admins view and edit the governed weights in the
`national_priority_weights` table WITHOUT a code change (the matching engine
reads them live). All writes are admin-gated, bump the row version, and are
audited to admin_audit_log.

Blueprint prefix: /api/admin/national-priority-weights
"""
import json
import logging

import psycopg2.extras
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from backend.db import get_db_connection
from backend.national_priority_engine import ensure_weights_table

logger = logging.getLogger(__name__)

national_priority_admin_bp = Blueprint(
    'national_priority_admin', __name__, url_prefix='/api/admin/national-priority-weights'
)

_ADMIN_ROLES = {'admin', 'super_user', 'super_admin', 'platform_administrator'}


def _require_admin():
    """Return a (response, 403) if the caller isn't an EHRDC admin, else None."""
    try:
        role = (get_jwt() or {}).get('role', '')
    except Exception:
        role = ''
    if role not in _ADMIN_ROLES:
        return jsonify({"error": "Forbidden - admin access required"}), 403
    return None


@national_priority_admin_bp.route('', methods=['GET'])
@jwt_required()
def list_weights():
    """List all National Development Priority weights (active + inactive)."""
    guard = _require_admin()
    if guard:
        return guard
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        ensure_weights_table(conn)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT code, label, points, category, active, version, updated_at
            FROM national_priority_weights
            ORDER BY category, points DESC
        """)
        rows = []
        for r in cur.fetchall():
            d = dict(r)
            if d.get('updated_at'):
                d['updated_at'] = d['updated_at'].isoformat()
            rows.append(d)
        cur.close()
        conn.close()
        return jsonify({"weights": rows, "total": len(rows)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@national_priority_admin_bp.route('', methods=['PUT'])
@jwt_required()
def update_weights():
    """Update points / active flag for one or more weights.

    Body: {"weights": [{"code": "emp_entry_stage", "points": 40, "active": true}, ...]}
    Each change bumps the row version and is audited. Unknown codes are ignored.
    """
    guard = _require_admin()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    updates = data.get('weights')
    if not isinstance(updates, list) or not updates:
        return jsonify({"error": 'Body must be {"weights": [{"code", "points", "active"}]}'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        ensure_weights_table(conn)
        cur = conn.cursor()
        changed = []
        for u in updates:
            if not isinstance(u, dict):
                continue
            code = u.get('code')
            if not code:
                continue
            fields, params = [], []
            if 'points' in u:
                pts = u.get('points')
                if not isinstance(pts, int) or isinstance(pts, bool) or pts < 0:
                    conn.rollback()
                    conn.close()
                    return jsonify({"error": f"points for '{code}' must be a non-negative integer"}), 400
                fields.append("points = %s")
                params.append(pts)
            if 'active' in u:
                fields.append("active = %s")
                params.append(bool(u.get('active')))
            if not fields:
                continue
            fields.append("version = version + 1")
            fields.append("updated_at = NOW()")
            params.append(code)
            cur.execute(f"UPDATE national_priority_weights SET {', '.join(fields)} WHERE code = %s", params)
            if cur.rowcount:
                changed.append(code)

        # Persist the weight changes FIRST — the audit must never affect them.
        conn.commit()

        # Audit the change (best-effort, isolated: a failure here — e.g. an FK on
        # the actor id — must not roll back the already-committed weight update).
        try:
            cur.execute("""
                INSERT INTO admin_audit_log (user_id, action, details, created_at)
                VALUES (%s, 'national_priority_weights_update', %s, NOW())
            """, (get_jwt_identity(), json.dumps({"changed": changed, "payload": updates})))
            conn.commit()
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass

        cur.close()
        conn.close()
        return jsonify({"status": "updated", "changed": changed}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500
