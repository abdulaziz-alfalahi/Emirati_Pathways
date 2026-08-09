"""Push delivery — the single point where a notification becomes a phone alert.

DELIVERY IS NOT CONFIGURED YET, AND THIS MODULE SAYS SO RATHER THAN PRETENDING.
The APNs key ships with the Apple developer account (in procurement) and FCM
needs a Firebase project. Until those exist there is nothing to send with.

The honest shape matters here. The failure mode to avoid is a helper that
silently returns success, because then the platform believes it notified 150,000
people when it notified none — the same class of problem as the board-office
notification queue (migration 056), which was built to make "pending" visible
rather than imply delivery.

So: every call returns an explicit status, never a bare True/False, and
`configured()` is the single check that decides whether anything can be sent.
When credentials arrive, fill in _send_apns/_send_fcm — no call site changes.
"""
import os
import logging

logger = logging.getLogger(__name__)

_warned_unconfigured = False


def configured():
    """True only when real push credentials are present."""
    return bool(os.getenv('APNS_KEY_ID') or os.getenv('FCM_SERVER_KEY')
                or os.getenv('FIREBASE_CREDENTIALS_JSON'))


def active_devices(user_id):
    """The user's active device tokens. Empty list on any failure — never raises."""
    try:
        try:
            from backend.db_utils import execute_query
        except ImportError:  # pragma: no cover
            from db_utils import execute_query
        return execute_query(
            """SELECT token, platform, locale, app_version
                 FROM device_tokens
                WHERE user_id = %s AND is_active
                ORDER BY last_seen_at DESC""",
            (str(user_id),)) or []
    except Exception as e:  # pragma: no cover - defensive
        logger.warning("device lookup failed for %s: %s", user_id, e)
        return []


def dispatch_push(user_id, title, message='', metadata=None):
    """Attempt to deliver a push. Returns a status dict, never a bare boolean.

    status: 'not_configured' | 'no_devices' | 'sent' | 'failed'

    Callers MUST NOT treat a returned dict as proof of delivery — check
    `status == 'sent'`. Never raises: a push problem must not break the in-app
    notification that has already been written.
    """
    global _warned_unconfigured
    try:
        if not configured():
            if not _warned_unconfigured:
                # Once per process, not per notification — visible without spam.
                logger.warning(
                    "Push delivery is NOT CONFIGURED (no APNS_KEY_ID / FCM_SERVER_KEY). "
                    "Device tokens are being collected; nothing is being sent.")
                _warned_unconfigured = True
            return {'status': 'not_configured', 'delivered': 0}

        devices = active_devices(user_id)
        if not devices:
            return {'status': 'no_devices', 'delivered': 0}

        # pragma: no cover - unreachable until credentials exist
        raise NotImplementedError(
            "Push credentials are present but no sender is implemented yet. "
            "Implement _send_apns/_send_fcm before setting APNS_KEY_ID/FCM_SERVER_KEY.")
    except Exception as e:
        logger.error("push dispatch failed for %s: %s", user_id, e)
        return {'status': 'failed', 'delivered': 0, 'error': str(e)}
