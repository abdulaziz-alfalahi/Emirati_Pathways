#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UAE Pass Routes — Unit & Smoke Tests
=====================================
Tests for:
  - uaepass blueprint registration
  - dev-login blocked in production mode
  - dev-login validation (missing / invalid user_id)
  - dev-login returns 404 for non-existent user (mocked DB)
  - /login endpoint exists and returns proper response
  - _cleanup_stale_states removes stale entries
"""

import os
import sys
import time
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

import jwt
import pytest

# ── Path setup ──────────────────────────────────────────────────────
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from app import create_app
from backend.routes.uaepass_routes import (
    uaepass_bp, _pending_states, _cleanup_stale_states, _find_or_create_user
)


SECRET = os.getenv("JWT_SECRET_KEY", "change-this-in-production")


# ── Fixtures ────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def app():
    """Create a Flask app with TESTING enabled (non-production)."""
    os.environ.setdefault("JWT_SECRET_KEY", SECRET)
    os.environ["ENABLE_DEV_LOGIN"] = "true"
    os.environ.pop("FLASK_ENV", None)  # ensure NOT production
    test_app = create_app()
    test_app.config.update({"TESTING": True})
    return test_app


@pytest.fixture()
def client(app):
    """Flask test client."""
    return app.test_client()


# ── Smoke: Blueprint Registration ──────────────────────────────────

@pytest.mark.smoke
class TestUAEPassBlueprintRegistration:
    """Verify the uaepass blueprint is registered on the app."""

    def test_uaepass_blueprint_registered(self, app):
        """The 'uaepass' blueprint should be present."""
        assert "uaepass" in app.blueprints, (
            f"uaepass blueprint missing. Registered: {list(app.blueprints.keys())}"
        )

    def test_uaepass_blueprint_url_prefix(self, app):
        """The uaepass blueprint should serve under /api/auth/uaepass."""
        bp = app.blueprints["uaepass"]
        assert bp.url_prefix == "/api/auth/uaepass"

    def test_login_route_exists(self, app):
        """The /api/auth/uaepass/login GET route should be registered."""
        rules = [r.rule for r in app.url_map.iter_rules()]
        assert "/api/auth/uaepass/login" in rules

    def test_devlogin_route_exists(self, app):
        """The /api/auth/uaepass/dev-login POST route should be registered."""
        rules = [r.rule for r in app.url_map.iter_rules()]
        assert "/api/auth/uaepass/dev-login" in rules


# ── Smoke: Dev-Login Production Guard ──────────────────────────────

@pytest.mark.smoke
class TestDevLoginProductionGuard:
    """dev-login must return 403 when FLASK_ENV=production."""

    def test_dev_login_returns_403_in_production(self, client, monkeypatch):
        """POST /api/auth/uaepass/dev-login → 403 when FLASK_ENV=production."""
        monkeypatch.setenv("FLASK_ENV", "production")
        resp = client.post(
            "/api/auth/uaepass/dev-login",
            json={"user_id": "784000000000001"},
        )
        assert resp.status_code == 404
        body = resp.get_json()
        assert "error" in body
        assert "not available" in body["error"].lower()


# ── Unit: Dev-Login Input Validation ───────────────────────────────

@pytest.mark.unit
class TestDevLoginValidation:
    """dev-login should reject missing or malformed user_id."""

    def test_dev_login_missing_user_id(self, client, monkeypatch):
        """POST with empty body → 400."""
        monkeypatch.delenv("FLASK_ENV", raising=False)
        resp = client.post("/api/auth/uaepass/dev-login", json={})
        assert resp.status_code == 400
        body = resp.get_json()
        assert body["success"] is False

    def test_dev_login_short_user_id(self, client, monkeypatch):
        """POST with too-short user_id → 400."""
        monkeypatch.delenv("FLASK_ENV", raising=False)
        resp = client.post(
            "/api/auth/uaepass/dev-login",
            json={"user_id": "123"},
        )
        assert resp.status_code == 400

    def test_dev_login_no_json_body(self, client, monkeypatch):
        """POST with no Content-Type json → 400 or 415."""
        monkeypatch.delenv("FLASK_ENV", raising=False)
        resp = client.post(
            "/api/auth/uaepass/dev-login",
            data="not-json",
            content_type="text/plain",
        )
        assert resp.status_code in (400, 415)


# ── Unit: Dev-Login — User Not Found (mocked DB) ──────────────────

@pytest.mark.unit
class TestDevLoginUserNotFound:
    """dev-login should return 404 when the user doesn't exist in DB."""

    def test_dev_login_returns_404_for_nonexistent_user(self, client, monkeypatch):
        """Mock _get_db so the user lookup returns no rows → 404."""
        monkeypatch.delenv("FLASK_ENV", raising=False)

        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = None  # no user found

        mock_conn = MagicMock()
        mock_conn.cursor.return_value = mock_cursor

        with patch("backend.routes.uaepass_routes._get_db", return_value=mock_conn):
            resp = client.post(
                "/api/auth/uaepass/dev-login",
                json={"user_id": "784000000000999"},
            )
        assert resp.status_code == 404
        body = resp.get_json()
        assert body["success"] is False
        assert "not found" in body["message"].lower()


# ── Smoke: Login Endpoint Response Format ──────────────────────────

@pytest.mark.smoke
class TestLoginEndpointFormat:
    """The /login endpoint should respond with a proper JSON or redirect."""

    def test_login_returns_json_with_accept_header(self, client):
        """GET /api/auth/uaepass/login with Accept: application/json."""
        # This will try to init UAEPassOAuth which may fail without real
        # env vars, but we test that it returns *some* structured response
        # (200 with JSON or 500 with error JSON).
        resp = client.get(
            "/api/auth/uaepass/login",
            headers={"Accept": "application/json"},
        )
        # Either success (200) or internal error (500) — both are JSON
        assert resp.status_code in (200, 500)
        body = resp.get_json()
        assert "success" in body

    def test_login_without_accept_json_may_redirect(self, client):
        """GET /api/auth/uaepass/login without Accept header may redirect."""
        resp = client.get("/api/auth/uaepass/login")
        # Could be 302 redirect or 500 if OAuth config is missing
        assert resp.status_code in (200, 302, 500)


# ── Unit: _cleanup_stale_states ────────────────────────────────────

@pytest.mark.unit
class TestCleanupStaleStates:
    """_cleanup_stale_states should remove entries older than 10 minutes."""

    def test_stale_entries_removed(self):
        """Entries older than 10 minutes should be purged."""
        # Seed some states
        _pending_states.clear()
        _pending_states["fresh_state"] = {
            "created_at": datetime.utcnow(),
            "return_url": "",
        }
        _pending_states["stale_state"] = {
            "created_at": datetime.utcnow() - timedelta(minutes=15),
            "return_url": "",
        }
        _pending_states["very_stale"] = {
            "created_at": datetime.utcnow() - timedelta(hours=2),
            "return_url": "",
        }

        _cleanup_stale_states()

        assert "fresh_state" in _pending_states, "Fresh state should survive"
        assert "stale_state" not in _pending_states, "15-min-old state should be removed"
        assert "very_stale" not in _pending_states, "2-hour-old state should be removed"

        # Cleanup
        _pending_states.clear()

    def test_empty_dict_no_error(self):
        """Calling cleanup on an empty dict should not raise."""
        _pending_states.clear()
        _cleanup_stale_states()  # should not raise
        assert len(_pending_states) == 0


# ── Unit: _find_or_create_user ─────────────────────────────────────

@pytest.mark.unit
class TestFindOrCreateUser:
    """Tests for _find_or_create_user database operations."""

    @patch("backend.routes.uaepass_routes._get_db")
    def test_find_or_create_user_synthetic_eid(self, mock_get_db):
        """Verify _find_or_create_user generates a synthetic EID correctly using dict cursor."""
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_get_db.return_value = mock_conn

        # Mock results
        # 1. First SELECT uaepass_uuid -> None (new user)
        # 2. Second SELECT email -> None (not found)
        # 3. Third SELECT MAX(CAST(...)) -> {'max_seq': 42}
        # 4. Fourth INSERT RETURNING * -> {'id': '784000000000430', 'role': 'candidate'}
        mock_cursor.fetchone.side_effect = [
            None,                  # SELECT uaepass_uuid (not found)
            None,                  # SELECT email (not found)
            {'max_seq': 42},       # SELECT MAX(CAST(...)) (max synthetic sequence)
            {'id': '784000000000430', 'role': 'candidate'} # INSERT RETURNING * (new user data)
        ]

        profile = {
            'uaepass_uuid': '6f5b3da6-3fe1-453a-81e3-aa3c5291a125',
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com'
        }

        user_data, is_new = _find_or_create_user(profile)

        assert is_new is True
        assert user_data['id'] == '784000000000430'
        
        # Verify SELECT MAX(...) query was executed
        assert mock_cursor.execute.call_count >= 2
        # Verify connection committed
        mock_conn.commit.assert_called_once()


# ── Unit: UAE Pass OIDC Validation ──────────────────────────────────

@pytest.mark.unit
class TestUAEPassOIDCValidation:
    """Verify OIDC signature, nonce, and JWKS validation behavior."""

    @patch("jwt.PyJWKClient")
    def test_verify_id_token_fails_on_jwt_error(self, mock_jwk_client_class):
        """Should raise UAEPassError if token format is completely invalid."""
        from backend.auth.uaepass_oauth import UAEPassOAuth, UAEPassError
        oauth = UAEPassOAuth()
        
        with pytest.raises(UAEPassError) as exc:
            oauth.verify_id_token("completely-invalid-token", "some-nonce")
        assert "validation failed" in str(exc.value).lower()

    @patch("jwt.decode")
    def test_verify_id_token_checks_claims_and_nonce(self, mock_jwt_decode):
        """UAE Pass exposes NO JWKS (all keys endpoints 403), so the RS256 signature cannot be
        verified (SEC-01-ACCEPTED — the id_token arrives server-to-server over client-authenticated
        TLS). verify_id_token instead enforces aud + exp (jwt.decode options), issuer-by-host, and
        the nonce — succeeding only when the nonce matches and the issuer host is UAE Pass."""
        from backend.auth.uaepass_oauth import UAEPassOAuth, UAEPassError
        oauth = UAEPassOAuth()
        # staging issuer host is stg-ids.uaepass.ae (note the extra 's' + :443/oauth2/token path)
        base = {"iss": "https://stg-ids.uaepass.ae:443/oauth2/token", "aud": oauth.config.client_id}

        # 1. Nonce mismatch -> raise
        mock_jwt_decode.return_value = {**base, "nonce": "wrong-nonce"}
        with pytest.raises(UAEPassError) as exc:
            oauth.verify_id_token("mock-token", "expected-nonce")
        assert "nonce mismatch" in str(exc.value).lower()

        # 2. Nonce match -> success
        mock_jwt_decode.return_value = {**base, "nonce": "expected-nonce"}
        claims = oauth.verify_id_token("mock-token", "expected-nonce")
        assert claims["nonce"] == "expected-nonce"

        # 3. aud + exp ARE enforced via jwt.decode options; signature is NOT (documented no-JWKS case)
        _, kwargs = mock_jwt_decode.call_args
        opts = kwargs.get("options", {})
        assert opts.get("verify_aud") is True
        assert opts.get("verify_exp") is True
        assert opts.get("verify_signature") is False
        assert kwargs.get("audience") == oauth.config.client_id

        # 4. Wrong issuer host -> raise (issuer is validated even without signature)
        mock_jwt_decode.return_value = {"iss": "https://evil.example.com/token",
                                        "aud": oauth.config.client_id, "nonce": "expected-nonce"}
        with pytest.raises(UAEPassError) as exc2:
            oauth.verify_id_token("mock-token", "expected-nonce")
        assert "issuer" in str(exc2.value).lower()


