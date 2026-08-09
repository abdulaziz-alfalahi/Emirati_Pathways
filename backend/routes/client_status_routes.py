"""GET /api/v1/client-status — the forced-upgrade escape hatch.

WHY THIS MUST SHIP IN v1
    Without a way to retire old clients you accumulate them forever: every
    published version is supported until something can tell a phone to stop.
    This endpoint is that something — the app calls it on launch and blocks
    below `min_supported_version`.

    It CANNOT be retrofitted. The phones that would need it are running the
    version that lacks it, so a client shipped without this can never be
    force-upgraded — only abandoned. That is why it is in v1 rather than "later".

    It is also how /api/v1 eventually gets deleted: raise the floor, wait for the
    old clients to drop off, then retire the version.

DELIBERATELY PUBLIC AND CHEAP
    No auth: a client that cannot authenticate (because its token format or auth
    flow changed) still needs to be told to upgrade. No DB access, so it answers
    during an outage — which is exactly when a client most needs to know whether
    it is the problem.

    Values come from the environment so a release can raise the floor without a
    code deploy.
"""
import os
import logging
from flask import Blueprint, jsonify

logger = logging.getLogger(__name__)

client_status_bp = Blueprint('client_status', __name__, url_prefix='/api/v1')

# Defaults are deliberately permissive: with nothing configured, no client is
# ever blocked. Blocking users is an explicit operational act, never a side
# effect of a missing environment variable.
_DEFAULT_MIN = '0.0.0'
_DEFAULT_LATEST = '0.0.0'


@client_status_bp.route('/client-status', methods=['GET'])
def client_status():
    """Report the supported client range. Public, unauthenticated, no DB."""
    min_supported = os.getenv('CLIENT_MIN_SUPPORTED_VERSION', _DEFAULT_MIN)
    latest = os.getenv('CLIENT_LATEST_VERSION', _DEFAULT_LATEST)
    return jsonify({
        'success': True,
        'min_supported_version': min_supported,
        'latest_version': latest,
        # Shown by the client on a blocking screen. Bilingual because the app is.
        'message': {
            'en': os.getenv(
                'CLIENT_UPGRADE_MESSAGE_EN',
                'A newer version of the app is required to continue.'),
            'ar': os.getenv(
                'CLIENT_UPGRADE_MESSAGE_AR',
                'مطلوب إصدار أحدث من التطبيق للمتابعة.'),
        },
        # Store links, so the blocking screen can send the user somewhere useful.
        'store_urls': {
            'ios': os.getenv('CLIENT_STORE_URL_IOS', ''),
            'android': os.getenv('CLIENT_STORE_URL_ANDROID', ''),
        },
    })
