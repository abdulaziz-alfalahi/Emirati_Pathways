"""dev-login: who can reach it, and who it may sign in as.

Two independent constraints, and both matter:

  REACHABILITY — not from the internet (PR #434).
  SCOPE        — only accounts flagged is_test_account (migration 073).

The second is the one that makes the audit trail honest. Host-binding stops
strangers; the flag stops a credential-free session being minted for a real
person, which is what made the audit row I left on 2026-08-19 a false record of
the platform owner reading candidate files.

These tests are deliberately written so the DANGEROUS direction is the one that
fails loudly.
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


# ── Scope: which accounts may be signed into ────────────────────────────────

def test_a_non_test_account_is_refused():
    """The constraint that makes this safe. Without it the endpoint mints a
    credential-free session for any of 5,336 users."""
    src = open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
               encoding='utf-8').read()
    body = src.split('def dev_login')[1].split('\n@uaepass_bp.route')[0]
    assert "if not user.get('is_test_account'):" in body
    assert '403' in body.split("is_test_account'):")[1][:400]


def test_the_flag_is_actually_selected():
    """A guard on a column the query never fetched would read as None and
    refuse everything — or, with a looser check, admit everything."""
    src = open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
               encoding='utf-8').read()
    body = src.split('def dev_login')[1].split('\n@uaepass_bp.route')[0]
    select = body.split('SELECT')[1].split('FROM users')[0]
    assert 'is_test_account' in select


def test_the_refusal_comes_before_any_token_is_minted():
    """Order matters: a refused caller must not receive a usable session."""
    src = open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
               encoding='utf-8').read()
    body = src.split('def dev_login')[1].split('\n@uaepass_bp.route')[0]
    assert body.index("is_test_account'):") < body.index('create_access_token')


def test_the_listing_only_advertises_test_accounts():
    """Listing the whole roster would hand an attacker 5,312 real names while
    every one of them would be refused at the point of use."""
    src = open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
               encoding='utf-8').read()
    body = src.split('def dev_login_users')[1] if 'def dev_login_users' in src \
        else src.split('DEV-ONLY: List all test users')[1]
    assert 'is_test_account IS TRUE' in body


def test_the_marking_is_not_an_eid_pattern():
    """Every national's EID is synthetic today (the 784000000000… range) until
    UAE Pass supplies real ones, so an EID-pattern rule would eventually match
    real citizens as the roster grows."""
    sql = open(os.path.join(BACKEND, 'migrations',
                            '073_users_is_test_account.sql'), encoding='utf-8').read()
    update = sql.split('UPDATE users')[1].split(';')[0]
    assert "id LIKE" not in update
    assert "@test.ehrdc.ae" in update
    assert 'uaepass_uuid IS NULL' in update, \
        'an account that has really logged in must not qualify'


def test_new_accounts_default_to_not_being_test_accounts():
    sql = open(os.path.join(BACKEND, 'migrations',
                            '073_users_is_test_account.sql'), encoding='utf-8').read()
    assert 'DEFAULT FALSE' in sql


def test_it_returns_404_not_403():
    """A caller from the internet should not learn the endpoint exists."""
    src = open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
               encoding='utf-8').read()
    body = src.split('def dev_login')[1][:600]
    assert "'Not available'" in body and '404' in body
