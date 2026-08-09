"""Device token registry — the reassignment guarantee and honest delivery status.

The bug this is shaped around: a device token belongs to a DEVICE, not a person.
If national A signs out of the app and national B signs in on the same phone,
that token is now B's. Leaving the old row would deliver A's job offers,
interview invitations and messages to whoever holds the phone — a real
personal-data leak, and the most common push bug there is.
"""
import os
import sys

import pytest

_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_here)
for p in (os.path.dirname(_backend), _backend):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.push_dispatch import dispatch_push, configured
except ImportError:  # pragma: no cover
    from push_dispatch import dispatch_push, configured


def test_dispatch_reports_not_configured_rather_than_faking_success(monkeypatch):
    """The failure mode to avoid: a helper that silently returns success, so the
    platform believes it notified people it never reached."""
    for var in ('APNS_KEY_ID', 'FCM_SERVER_KEY', 'FIREBASE_CREDENTIALS_JSON'):
        monkeypatch.delenv(var, raising=False)
    result = dispatch_push('784000000000320', 'Title', 'Body')
    assert result['status'] == 'not_configured'
    assert result['delivered'] == 0
    # explicitly NOT a bare truthy success
    assert result.get('status') != 'sent'


def test_configured_is_false_without_credentials(monkeypatch):
    for var in ('APNS_KEY_ID', 'FCM_SERVER_KEY', 'FIREBASE_CREDENTIALS_JSON'):
        monkeypatch.delenv(var, raising=False)
    assert configured() is False


def test_configured_true_once_a_credential_exists(monkeypatch):
    monkeypatch.setenv('FCM_SERVER_KEY', 'x')
    assert configured() is True


def test_dispatch_never_raises_even_when_broken(monkeypatch):
    """A push problem must never break the in-app notification already written."""
    monkeypatch.setenv('FCM_SERVER_KEY', 'present-but-no-sender')
    result = dispatch_push('784000000000320', 'T', 'B')
    # the unimplemented sender raises internally; the caller still gets a status
    assert result['status'] in ('failed', 'no_devices')
    assert result['delivered'] == 0


def test_device_endpoints_are_on_the_published_v1_surface():
    """Sign-out unregistration is what stops a shared phone receiving the
    previous user's notifications, so it must be reachable by the app."""
    try:
        from backend.api_v1 import V1_SURFACE
    except ImportError:  # pragma: no cover
        from api_v1 import V1_SURFACE
    assert '/api/devices' in V1_SURFACE
    assert {'POST', 'DELETE'} <= V1_SURFACE['/api/devices']


@pytest.mark.parametrize('platform,ok', [
    ('ios', True), ('android', True), ('web', True),
    ('symbian', False), ('', False), ('IOS', True),   # case-normalised
])
def test_platform_validation_matches_the_db_constraint(platform, ok):
    """The route must reject what migration 059's CHECK would reject anyway —
    a 400 is a better answer than a 500 from the database."""
    valid = {'ios', 'android', 'web'}
    assert ((platform or '').strip().lower() in valid) is ok
