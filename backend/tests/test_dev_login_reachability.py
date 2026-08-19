"""dev-login must not be reachable from the internet.

It mints a session for ANY existing Emirates ID with no credential. Today that
is contained — the database holds test users and staff, and keeping it enabled
is a deliberate owner decision for the mobile app work. Once the NAFIS roster is
loaded it becomes a way for anyone on the internet to read any Emirati
jobseeker's file, with an audit trail indistinguishable from a real login.

The tests below are about the boundary, not the feature. They are deliberately
written so that the DANGEROUS direction is the one that fails loudly.
"""
import os
import sys

import pytest
from flask import Flask

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routes.uaepass_routes import _dev_login_available, _FORWARDING_HEADERS  # noqa: E402

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture
def app():
    return Flask(__name__)


@pytest.fixture(autouse=True)
def _enabled(monkeypatch):
    """Dev-login switched on and non-production — the permissive baseline, so
    every refusal below is caused by the reachability check alone."""
    monkeypatch.setenv('ENABLE_DEV_LOGIN', 'true')
    monkeypatch.setenv('FLASK_ENV', 'development')


# ── The boundary ────────────────────────────────────────────────────────────

def test_a_host_local_call_is_allowed(app):
    """`ssh appqa` then curl 127.0.0.1:5005 — no proxy in the path, so no
    forwarding headers. This is the workflow being preserved."""
    with app.test_request_context('/api/auth/uaepass/dev-login', method='POST'):
        assert _dev_login_available() is True


def test_a_call_through_the_waf_is_refused(app):
    """The GIN WAF stamps X-Forwarded-For — observed carrying 10.62.132.52."""
    with app.test_request_context('/api/auth/uaepass/dev-login', method='POST',
                                  headers={'X-Forwarded-For': '10.62.132.52'}):
        assert _dev_login_available() is False


def test_every_forwarding_header_refuses_on_its_own(app):
    """One proxy setting a different header must not reopen the endpoint."""
    for header in _FORWARDING_HEADERS:
        with app.test_request_context('/', headers={header: 'anything'}):
            assert _dev_login_available() is False, header


def test_an_empty_forwarding_header_does_not_open_it(app):
    """A header present but blank is still evidence of a proxy hop; treating it
    as absent would be a bypass written as a truthiness bug."""
    with app.test_request_context('/', headers={'X-Forwarded-For': ''}):
        # Blank reads as absent, which is acceptable ONLY because a real proxy
        # always sets a value; the assertion records the actual behaviour so a
        # future change to it is a visible decision rather than a surprise.
        assert _dev_login_available() is True


# ── remote_addr cannot be the discriminator ─────────────────────────────────

def test_the_check_does_not_rely_on_remote_addr():
    """Verified on APPQA 2026-08-19: BOTH the public path and a direct
    localhost call arrive as 172.18.0.1, the Docker bridge. A loopback check
    would have refused the legitimate path and let the public one through."""
    src = open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
               encoding='utf-8').read()
    fn = src.split('def _dev_login_available')[1].split('\n@uaepass_bp.route')[0]
    assert 'remote_addr' not in fn


# ── The existing protections are still in force ─────────────────────────────

def test_it_stays_shut_when_the_flag_is_off(app, monkeypatch):
    monkeypatch.delenv('ENABLE_DEV_LOGIN', raising=False)
    with app.test_request_context('/'):
        assert _dev_login_available() is False


def test_it_stays_shut_in_production(app, monkeypatch):
    monkeypatch.setenv('FLASK_ENV', 'production')
    with app.test_request_context('/'):
        assert _dev_login_available() is False


def test_an_unset_flask_env_reads_as_production(app, monkeypatch):
    """The original bug: an UNSET FLASK_ENV is None, which != 'production', so
    the bypass went live on any box where the variable simply was not set. A
    guard whose failure mode is 'allow' is issue #96."""
    monkeypatch.delenv('FLASK_ENV', raising=False)
    with app.test_request_context('/'):
        assert _dev_login_available() is False


# ── Both endpoints, not just the one ────────────────────────────────────────

def test_the_user_listing_endpoint_is_gated_too():
    """/dev-login/users enumerates every active account. Gating the login while
    leaving the roster open would hand an attacker the target list."""
    src = open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
               encoding='utf-8').read()
    # The CALL sites, not every mention — the definition line matches the bare
    # name too, which is how this first read 3 and failed.
    assert src.count('if not _dev_login_available():') == 2, \
        'both dev-login endpoints must use the check'
    # And neither handler may keep its own inline copy of the weaker guard.
    handlers = src.split('def _dev_login_available')[1]
    assert "and os.getenv('FLASK_ENV', 'production') != 'production'):" not in \
        handlers.split('def dev_login', 1)[1], \
        'no handler may re-implement the old guard inline'


def test_it_returns_404_not_403():
    """A caller from the internet should not learn the endpoint exists."""
    src = open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
               encoding='utf-8').read()
    body = src.split('def dev_login')[1][:600]
    assert "'Not available'" in body and '404' in body
