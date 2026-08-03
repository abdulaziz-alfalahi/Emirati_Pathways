"""Platform maintenance mode (migration 046).

An admin holds all traffic with one toggle instead of hand-editing files inside
the nginx containers on every app node (owner feedback fb_1785729286).

Design constraints, in order of importance:
  1. **You must always be able to switch it off.** Admins bypass the gate, and
     the auth + maintenance endpoints stay open, so an admin can sign in and
     lift maintenance while it is active. A maintenance mode you can lock
     yourself out of is worse than no maintenance mode.
  2. **It must not break health checks.** The WAF and Docker health probes hit
     /health; if those fail the container is marked unhealthy and recreated
     mid-maintenance.
  3. **It must be cheap.** The state is read on every request, so it is cached
     in-process for a few seconds rather than hitting the DB each time. A
     toggle therefore takes effect within CACHE_TTL_S across all workers
     (staging runs 1 gunicorn worker; production runs more).
"""
import logging
import os
import time

from flask import jsonify, request

try:
    from backend.db import get_db_connection
except ImportError:  # pragma: no cover — the app runs under both roots
    from db import get_db_connection

logger = logging.getLogger(__name__)

CACHE_TTL_S = float(os.getenv('MAINTENANCE_CACHE_TTL', '5'))

# Paths that must keep working while maintenance is on. Prefix-matched.
#   health/metrics  — probes (constraint 2)
#   auth            — an admin must be able to sign in to turn it off
#   maintenance     — reading the banner + the admin's off switch
#   socket.io       — long-poll transport; blocking it spams client errors
_ALWAYS_ALLOWED = (
    '/health',
    '/api/health',
    '/metrics',
    '/api/auth/',
    '/api/maintenance',
    '/api/admin/maintenance',
    '/socket.io',
)

_cache = {'value': None, 'at': 0.0}


def _fetch_state():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT is_enabled, message_en, message_ar, expected_end, started_at
                FROM platform_maintenance WHERE id = 1
            """)
            row = cur.fetchone()
        if not row:
            return {'is_enabled': False}
        return {
            'is_enabled': bool(row[0]),
            'message_en': row[1],
            'message_ar': row[2],
            'expected_end': row[3].isoformat() if row[3] else None,
            'started_at': row[4].isoformat() if row[4] else None,
        }
    except Exception as e:
        # Fail OPEN: a DB blip must not take the platform down by accident.
        logger.warning(f"maintenance state lookup failed: {e}")
        return {'is_enabled': False}
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def get_state(force=False):
    now = time.time()
    if force or _cache['value'] is None or (now - _cache['at']) > CACHE_TTL_S:
        _cache['value'] = _fetch_state()
        _cache['at'] = now
    return _cache['value']


def invalidate_cache():
    """Called by the admin toggle so the change is instant in this worker."""
    _cache['value'] = None
    _cache['at'] = 0.0


def _is_admin_request():
    """True if the caller holds an admin role. Never raises — an unreadable or
    absent token simply means 'not an admin'."""
    try:
        from flask_jwt_extended import verify_jwt_in_request
        try:
            from backend.auth.access_control import resolve_roles, ADMIN_ROLES
        except ImportError:  # pragma: no cover
            from auth.access_control import resolve_roles, ADMIN_ROLES
        try:
            verify_jwt_in_request(optional=True)
        except Exception:
            try:
                verify_jwt_in_request(locations=['cookies'], optional=True)
            except Exception:
                return False
        return bool(resolve_roles() & ADMIN_ROLES)
    except Exception:
        return False


def maintenance_gate():
    """``before_request`` hook: hold API traffic while maintenance is on.

    Returns a 503 with Retry-After for API calls; non-API requests fall through
    untouched so the SPA can still load and render its maintenance screen.
    """
    if request.method == 'OPTIONS':
        return None
    path = request.path or ''
    if not path.startswith('/api/'):
        return None
    if any(path.startswith(p) for p in _ALWAYS_ALLOWED):
        return None

    state = get_state()
    if not state.get('is_enabled'):
        return None
    if _is_admin_request():
        return None

    resp = jsonify({
        'success': False,
        'maintenance': True,
        'message': state.get('message_en') or 'The platform is temporarily unavailable for maintenance.',
        'message_ar': state.get('message_ar') or 'المنصة غير متاحة مؤقتاً لأعمال الصيانة.',
        'expected_end': state.get('expected_end'),
    })
    resp.status_code = 503
    resp.headers['Retry-After'] = '600'
    return resp
