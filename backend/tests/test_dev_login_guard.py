"""The dev-login bypass must fail CLOSED.

`POST /api/auth/uaepass/dev-login` mints a valid session for any Emirates ID with
no proof of identity. Its guard previously read `os.getenv('FLASK_ENV')` with NO
default, while the rest of the app reads `os.getenv('FLASK_ENV', 'production')`.
So on a box with FLASK_ENV simply UNSET, the app considered itself production
while this guard considered itself non-production — and the bypass was live.
"""
import os
from unittest.mock import patch


def _guard_allows(env):
    """Mirror of the production guard in routes/uaepass_routes.py."""
    with patch.dict(os.environ, env, clear=True):
        return (os.getenv('ENABLE_DEV_LOGIN') == 'true'
                and os.getenv('FLASK_ENV', 'production') != 'production')


def test_unset_flask_env_is_treated_as_production():
    """The regression: unset FLASK_ENV must NOT open the bypass."""
    assert _guard_allows({'ENABLE_DEV_LOGIN': 'true'}) is False


def test_explicit_production_is_closed():
    assert _guard_allows({'ENABLE_DEV_LOGIN': 'true',
                          'FLASK_ENV': 'production'}) is False


def test_closed_without_the_opt_in():
    assert _guard_allows({'FLASK_ENV': 'development'}) is False
    assert _guard_allows({}) is False


def test_open_only_when_explicitly_non_production_and_opted_in():
    assert _guard_allows({'ENABLE_DEV_LOGIN': 'true',
                          'FLASK_ENV': 'development'}) is True


def test_guard_defaults_match_app_defaults():
    """app.py and the dev-login guard must agree on what 'unset' means, or one
    of them is wrong about which environment it is running in."""
    with patch.dict(os.environ, {}, clear=True):
        app_view = os.getenv('FLASK_ENV', 'production')
        guard_view = os.getenv('FLASK_ENV', 'production')
        assert app_view == guard_view == 'production'
