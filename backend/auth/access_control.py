"""
Shared access-control decorators (server-side authorization).

Centralises the CORRECT auth pattern for this platform, replacing the family of no-op
``optional_auth`` decorators that let privileged endpoints run fully unauthenticated:

- Verify a JWT from EITHER the ``Authorization: Bearer`` header OR the httpOnly
  ``access_token`` cookie (UAE Pass sessions authenticate via cookies).
- Resolve the caller's FULL role set. The JWT carries only the primary ``role`` claim,
  but users commonly hold their privileged role (admin/recruiter/hr/assessor/…) as a
  SECONDARY role in ``users.secondary_roles``. We therefore merge: the primary claim,
  any ``secondary_roles`` claim, and a DB lookup of ``users.role`` + ``users.secondary_roles``.

Usage:
    from backend.auth.access_control import require_auth, require_roles, ADMIN_ROLES
    @bp.route(...) ; @require_auth                       # any authenticated user
    @bp.route(...) ; @require_roles(*ADMIN_ROLES)        # role-gated
Handlers can read ``flask.g.user_id`` for the verified identity instead of trusting a
client-supplied id.
"""
import json
import logging
from functools import wraps

from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

logger = logging.getLogger(__name__)

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query

ADMIN_ROLES = {'admin', 'administrator', 'super_user', 'super_admin', 'platform_administrator'}


def _verify_any_jwt():
    """Verify a JWT from the Authorization header or the access_token cookie.
    Returns the identity (user id) string, or None if unauthenticated."""
    try:
        verify_jwt_in_request()
        uid = get_jwt_identity()
        if uid is not None:
            return uid
    except Exception:
        pass
    try:
        verify_jwt_in_request(locations=['cookies'])
        return get_jwt_identity()
    except Exception:
        return None


def resolve_roles():
    """Full role set for the current identity: primary ``role`` claim + any
    ``secondary_roles`` claim + DB (``users.role`` + ``users.secondary_roles``)."""
    roles = set()
    try:
        claims = get_jwt() or {}
        if claims.get('role'):
            roles.add(claims['role'])
        sec = claims.get('secondary_roles')
        if isinstance(sec, (list, tuple)):
            roles.update(sec)
    except Exception:
        pass
    try:
        uid = get_jwt_identity()
        if uid is not None:
            row = execute_query(
                "SELECT role, secondary_roles FROM users WHERE id::text = %s",
                (str(uid),), fetch_one=True
            )
            if row:
                if row.get('role'):
                    roles.add(row['role'])
                s = row.get('secondary_roles') or []
                if isinstance(s, str):
                    try:
                        s = json.loads(s)
                    except Exception:
                        s = [s]
                roles.update(s or [])
    except Exception as e:
        logger.warning(f"resolve_roles DB lookup failed: {e}")
    return roles


def require_auth(f):
    """Require ANY authenticated user (header or cookie JWT). Sets ``g.user_id``."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        uid = _verify_any_jwt()
        if not uid:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        g.user_id = str(uid)
        return f(*args, **kwargs)
    return wrapper


def require_roles(*allowed):
    """Require an authenticated caller holding at least one of ``allowed`` roles
    (resolved across primary claim + secondary_roles). Sets ``g.user_id``."""
    allowed_set = set(allowed)

    def deco(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            uid = _verify_any_jwt()
            if not uid:
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            if not (resolve_roles() & allowed_set):
                return jsonify({'success': False, 'message': 'Forbidden - insufficient role'}), 403
            g.user_id = str(uid)
            return f(*args, **kwargs)
        return wrapper
    return deco
