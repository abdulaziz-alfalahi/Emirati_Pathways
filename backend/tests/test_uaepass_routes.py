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

from recruiter_server import create_app
from backend.routes.uaepass_routes import uaepass_bp, _pending_states, _cleanup_stale_states


SECRET = os.getenv("JWT_SECRET_KEY", "change-this-in-production")


# ── Fixtures ────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def app():
    """Create a Flask app with TESTING enabled (non-production)."""
    os.environ.setdefault("JWT_SECRET_KEY", SECRET)
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
        assert resp.status_code == 403
        body = resp.get_json()
        assert body["success"] is False
        assert "production" in body["message"].lower()


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
