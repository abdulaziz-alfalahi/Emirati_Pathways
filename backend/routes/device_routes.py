"""Device registration for mobile push.

The registry only. Push CREDENTIALS do not exist yet — the APNs key ships with
the Apple developer account (in procurement) and FCM needs a Firebase project —
so nothing here sends anything, and nothing here implies a notification was
delivered. Registering early means the app can enrol devices from its first
build and no re-collection is needed once delivery is switched on.

THE RULE THIS MODULE EXISTS TO ENFORCE
    A device token belongs to a DEVICE, not a person. If one national signs out
    of the app and another signs in on the same phone, that token now belongs to
    the new user. Leaving the old row in place would deliver the previous user's
    notifications — their job offers, interview invitations, messages — to
    whoever holds the phone now. So registration REASSIGNS: UNIQUE(token) plus an
    upsert that overwrites user_id (migration 059).
"""
import logging
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover - dual-root import (see CLAUDE.md)
    from db_utils import execute_query

logger = logging.getLogger(__name__)

device_bp = Blueprint('devices', __name__, url_prefix='/api/devices')

_PLATFORMS = {'ios', 'android', 'web'}
_MAX_TOKEN = 4096


@device_bp.route('', methods=['POST'])
@jwt_required()
def register_device():
    """Register (or re-register) this device for the signed-in user.

    Idempotent: called on every launch and whenever the OS rotates the token.
    Re-registering an existing token REASSIGNS it to the caller — see module
    docstring. Reactivates a token previously retired as invalid, since a
    reinstall issues a working token that may match an old one.
    """
    user_id = str(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    token = (data.get('token') or '').strip()
    platform = (data.get('platform') or '').strip().lower()

    if not token or len(token) > _MAX_TOKEN:
        return jsonify({'success': False, 'message': 'A device token is required'}), 400
    if platform not in _PLATFORMS:
        return jsonify({'success': False,
                        'message': f'platform must be one of {sorted(_PLATFORMS)}'}), 400

    row = execute_query(
        """INSERT INTO device_tokens
               (user_id, token, platform, app_version, device_model, locale)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON CONFLICT (token) DO UPDATE SET
               -- Reassignment: the phone's current owner wins.
               user_id      = EXCLUDED.user_id,
               platform     = EXCLUDED.platform,
               app_version  = COALESCE(EXCLUDED.app_version, device_tokens.app_version),
               device_model = COALESCE(EXCLUDED.device_model, device_tokens.device_model),
               locale       = COALESCE(EXCLUDED.locale, device_tokens.locale),
               is_active    = true,
               last_seen_at = now(),
               updated_at   = now()
           RETURNING id, user_id, platform, is_active""",
        (user_id, token, platform,
         (data.get('app_version') or None),
         (data.get('device_model') or None),
         (data.get('locale') or None)),
        fetch_one=True)

    if not row:
        logger.error("device register failed for user %s", user_id)
        return jsonify({'success': False, 'message': 'Could not register device'}), 500

    logger.info("device registered: user=%s platform=%s", user_id, platform)
    return jsonify({
        'success': True,
        'data': {'id': str(row['id']), 'platform': row['platform']},
        # Say plainly that registering is not the same as being reachable.
        'push_delivery_configured': False,
        'message': 'Device registered. Push delivery is not yet configured.',
    }), 201


@device_bp.route('', methods=['DELETE'])
@jwt_required()
def unregister_device():
    """Retire this device's token — call on sign-out.

    Scoped to the caller's own token: a user may only unregister a token
    currently assigned to them, so one account cannot silence another's device.
    Retires (is_active=false) rather than deleting, so a reinstalling device is
    still recognisable.
    """
    user_id = str(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    token = (data.get('token') or request.args.get('token') or '').strip()
    if not token:
        return jsonify({'success': False, 'message': 'A device token is required'}), 400

    row = execute_query(
        """UPDATE device_tokens
              SET is_active = false, updated_at = now()
            WHERE token = %s AND user_id = %s
        RETURNING id""",
        (token, user_id), fetch_one=True)

    # Deliberately 200 either way: sign-out must never fail because the token was
    # already gone, and the response must not reveal whether a token exists for
    # someone else.
    return jsonify({'success': True, 'retired': bool(row)}), 200


@device_bp.route('', methods=['GET'])
@jwt_required()
def list_my_devices():
    """The caller's own registered devices — never anyone else's."""
    rows = execute_query(
        """SELECT id, platform, app_version, device_model, locale,
                  is_active, last_seen_at
             FROM device_tokens
            WHERE user_id = %s
            ORDER BY last_seen_at DESC""",
        (str(get_jwt_identity()),)) or []
    # The token itself is never returned — it is a send credential, and echoing
    # it back adds no value to a client that already has it.
    return jsonify({
        'success': True,
        'data': [{
            'id': str(r['id']),
            'platform': r['platform'],
            'app_version': r.get('app_version'),
            'device_model': r.get('device_model'),
            'locale': r.get('locale'),
            'is_active': r['is_active'],
            'last_seen_at': r['last_seen_at'].isoformat() if r.get('last_seen_at') else None,
        } for r in rows],
        'push_delivery_configured': False,
    })
