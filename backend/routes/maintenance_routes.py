"""Maintenance-mode status + admin toggle (migration 046)."""
import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

try:
    from backend.auth.access_control import require_roles, ADMIN_ROLES
    from backend.db import get_db_connection
    from backend import maintenance_mode
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import require_roles, ADMIN_ROLES
    from db import get_db_connection
    import maintenance_mode

logger = logging.getLogger(__name__)

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')
maintenance_admin_bp = Blueprint('maintenance_admin', __name__, url_prefix='/api/admin/maintenance')


@maintenance_bp.route('', methods=['GET'])
def status():
    """Public: the SPA reads this on boot to show the maintenance screen.
    Exposes only the banner text — never who enabled it."""
    s = maintenance_mode.get_state()
    return jsonify({'success': True, 'data': {
        'is_enabled': s.get('is_enabled', False),
        'message_en': s.get('message_en'),
        'message_ar': s.get('message_ar'),
        'expected_end': s.get('expected_end'),
    }})


@maintenance_admin_bp.route('', methods=['GET'])
@require_roles(*ADMIN_ROLES)
def admin_status():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT is_enabled, message_en, message_ar, expected_end,
                       started_at, started_by, ended_at, updated_at
                FROM platform_maintenance WHERE id = 1
            """)
            r = cur.fetchone()
    finally:
        conn.close()
    if not r:
        return jsonify({'success': True, 'data': {'is_enabled': False}})
    iso = lambda d: d.isoformat() if d else None
    return jsonify({'success': True, 'data': {
        'is_enabled': bool(r[0]), 'message_en': r[1], 'message_ar': r[2],
        'expected_end': iso(r[3]), 'started_at': iso(r[4]), 'started_by': r[5],
        'ended_at': iso(r[6]), 'updated_at': iso(r[7]),
    }})


@maintenance_admin_bp.route('', methods=['PUT'])
@require_roles(*ADMIN_ROLES)
def set_maintenance():
    """Enable/disable maintenance. Admin-only; the gate lets admins through so
    this endpoint stays reachable while maintenance is active."""
    data = request.get_json() or {}
    if 'is_enabled' not in data:
        return jsonify({'success': False, 'message': 'is_enabled is required'}), 400
    enabled = bool(data['is_enabled'])
    me = str(get_jwt_identity() or '')[:15]

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if enabled:
                cur.execute("""
                    UPDATE platform_maintenance
                    SET is_enabled = true,
                        message_en = %s, message_ar = %s, expected_end = %s,
                        started_at = COALESCE(started_at, NOW()), started_by = %s,
                        ended_at = NULL, updated_at = NOW()
                    WHERE id = 1
                """, (data.get('message_en'), data.get('message_ar'),
                      data.get('expected_end') or None, me))
            else:
                cur.execute("""
                    UPDATE platform_maintenance
                    SET is_enabled = false, ended_at = NOW(), ended_by = %s,
                        started_at = NULL, updated_at = NOW()
                    WHERE id = 1
                """, (me,))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to set maintenance mode: {e}")
        return jsonify({'success': False, 'message': 'Failed to update maintenance mode'}), 500
    finally:
        conn.close()

    maintenance_mode.invalidate_cache()
    logger.warning(f"MAINTENANCE MODE {'ENABLED' if enabled else 'DISABLED'} by {me}")
    return jsonify({'success': True, 'data': maintenance_mode.get_state(force=True)})
