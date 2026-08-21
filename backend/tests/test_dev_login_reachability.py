"""Who can reach dev-login.

dev-login mints a session with no credential. It must be reachable from the
host (and from an SSH tunnel, which is how the platform is driven in a browser
for verification) and from nowhere else.

The first version refused on the mere PRESENCE of a forwarding header. That was
correct for the internet but also locked out the tunnel — Vite stamps
X-Forwarded-For: 127.0.0.1 when it proxies /api (PR #430). The result was that
UI fixes could not be verified in a browser at all, which is the limitation
these tests exist to keep fixed without reopening the door.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask  # noqa: E402

from routes.uaepass_routes import _dev_login_available  # noqa: E402


@pytest.fixture()
def app(monkeypatch):
    monkeypatch.setenv('ENABLE_DEV_LOGIN', 'true')
    monkeypatch.setenv('FLASK_ENV', 'development')
    return Flask(__name__)


def reachable(app, **headers):
    with app.test_request_context('/', headers=headers):
        return _dev_login_available()


# ── Allowed ────────────────────────────────────────────────────────────────

def test_direct_from_the_host(app):
    assert reachable(app) is True


def test_through_an_ssh_tunnel(app):
    """The case that regressed: `ssh -L 8089:127.0.0.1:8089 appqa`, browse
    localhost:8089, Vite proxies /api and stamps loopback forwarding headers."""
    assert reachable(
        app,
        **{'X-Forwarded-For': '127.0.0.1',
           'X-Forwarded-Host': 'localhost:8089',
           'X-Forwarded-Proto': 'http'},
    ) is True


def test_a_scheme_is_not_an_address(app):
    """X-Forwarded-Proto: https must not be read as a non-loopback hop."""
    assert reachable(app, **{'X-Forwarded-For': '::1',
                             'X-Forwarded-Proto': 'https'}) is True


# ── Refused ────────────────────────────────────────────────────────────────

def test_through_the_waf(app):
    """Real internet traffic: client address plus the GIN WAF node."""
    assert reachable(app, **{'X-Forwarded-For': '94.207.1.10, 10.62.132.52'}) is False


def test_a_spoofed_loopback_hop_does_not_help(app):
    """nginx APPENDS the real peer, so a forged 127.0.0.1 arrives with the
    truth behind it. Checking every hop is what makes the header trustworthy
    for this decision."""
    assert reachable(app, **{'X-Forwarded-For': '127.0.0.1, 94.207.1.10, 10.62.132.52'}) is False


def test_x_real_ip_alone_is_enough_to_refuse(app):
    assert reachable(app, **{'X-Real-IP': '10.62.132.52'}) is False


def test_rfc7239_forwarded_header(app):
    assert reachable(app, **{'Forwarded': 'for=94.207.1.10;proto=https'}) is False
    assert reachable(app, **{'Forwarded': 'for=127.0.0.1;proto=http'}) is True


def test_a_public_hostname_is_refused(app):
    """Loopback addresses but the public host — i.e. someone reaching the box
    through the real name rather than the tunnel."""
    assert reachable(app, **{'X-Forwarded-For': '127.0.0.1',
                             'X-Forwarded-Host': 'stg-emirati.ehrdc.gov.ae'}) is False


# ── The other two gates still hold ─────────────────────────────────────────

def test_disabled_by_flag(app, monkeypatch):
    monkeypatch.setenv('ENABLE_DEV_LOGIN', 'false')
    assert reachable(app) is False


def test_never_in_production(app, monkeypatch):
    monkeypatch.setenv('FLASK_ENV', 'production')
    assert reachable(app) is False


def test_the_endpoint_still_sets_a_session_cookie():
    """A body-only response left the SPA signed out after a 'successful'
    login — the reason a browser could not be driven even when dev-login
    worked."""
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, '..', 'routes', 'uaepass_routes.py'), encoding='utf-8') as fh:
        src = fh.read()
    body = src.split('def dev_login')[1].split('\n@uaepass_bp.route')[0]
    assert 'set_access_cookies(resp, access_token)' in body
    assert 'set_refresh_cookies(resp, refresh_token)' in body


def test_still_restricted_to_test_accounts():
    """Reachability was relaxed; WHO may be signed in as was not."""
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, '..', 'routes', 'uaepass_routes.py'), encoding='utf-8') as fh:
        src = fh.read()
    body = src.split('def dev_login')[1].split('\n@uaepass_bp.route')[0]
    assert "if not user.get('is_test_account')" in body
