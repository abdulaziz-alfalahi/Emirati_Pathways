#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auth Routes — Unit & Smoke Tests
=================================
Tests for:
  - auth blueprint registration on the Flask app
  - /api/auth/profile returns 401 without a JWT
  - get_role_permissions() returns correct permissions per role
"""

import os
import sys
import time

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
from backend.routes.auth_routes import auth_bp, get_role_permissions


# ── Fixtures ────────────────────────────────────────────────────────

SECRET = os.getenv("JWT_SECRET_KEY", "change-this-in-production")


@pytest.fixture(scope="module")
def app():
    """Create a Flask app with TESTING enabled."""
    os.environ.setdefault("JWT_SECRET_KEY", SECRET)
    test_app = create_app()
    test_app.config.update({"TESTING": True})
    return test_app


@pytest.fixture()
def client(app):
    """Flask test client (no real DB needed)."""
    return app.test_client()


def _make_token(user_id="784000000000001", role="job_seeker"):
    """Issue a short-lived JWT for test requests."""
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


# ── Smoke: Blueprint Registration ──────────────────────────────────

@pytest.mark.smoke
class TestAuthBlueprintRegistration:
    """Verify the auth blueprint is properly registered."""

    def test_auth_blueprint_registered(self, app):
        """The 'auth' blueprint should be present in the app."""
        assert "auth" in app.blueprints, (
            f"auth blueprint missing. Registered blueprints: {list(app.blueprints.keys())}"
        )

    def test_auth_blueprint_url_prefix(self, app):
        """The auth blueprint should serve under /api/auth."""
        bp = app.blueprints["auth"]
        assert bp.url_prefix == "/api/auth"

    def test_profile_route_exists(self, app):
        """The /api/auth/profile GET route should be registered."""
        rules = [r.rule for r in app.url_map.iter_rules()]
        assert "/api/auth/profile" in rules, (
            "/api/auth/profile not found in url_map"
        )


# ── Smoke: Profile Endpoint Without JWT ────────────────────────────

@pytest.mark.smoke
class TestProfileEndpointNoAuth:
    """Calling /api/auth/profile without a JWT should be rejected."""

    def test_profile_returns_401_without_token(self, client):
        """GET /api/auth/profile with no Authorization header → 401."""
        resp = client.get("/api/auth/profile")
        assert resp.status_code in (401, 422), (
            f"Expected 401/422, got {resp.status_code}"
        )

    def test_profile_returns_401_with_bad_token(self, client):
        """GET /api/auth/profile with an invalid token → 401/422."""
        headers = {"Authorization": "Bearer this-is-not-a-valid-jwt"}
        resp = client.get("/api/auth/profile", headers=headers)
        assert resp.status_code in (401, 422), (
            f"Expected 401/422, got {resp.status_code}"
        )


# ── Unit: get_role_permissions() ───────────────────────────────────

@pytest.mark.unit
class TestGetRolePermissions:
    """Validate that get_role_permissions returns the right permission lists."""

    def test_job_seeker_permissions(self):
        """job_seeker should have basic candidate permissions."""
        perms = get_role_permissions("job_seeker")
        assert isinstance(perms, list)
        assert "view_dashboard" in perms
        assert "upload_cv" in perms
        assert "apply_jobs" in perms
        assert "view_profile" in perms
        assert "edit_profile" in perms

    def test_admin_permissions(self):
        """admin should have system-level permissions."""
        perms = get_role_permissions("admin")
        assert isinstance(perms, list)
        assert "manage_users" in perms
        assert "manage_system" in perms
        assert "system_configuration" in perms
        assert "view_all_analytics" in perms

    def test_recruiter_permissions(self):
        """recruiter should be able to post jobs and view candidates."""
        perms = get_role_permissions("recruiter")
        assert isinstance(perms, list)
        assert "post_jobs" in perms
        assert "view_candidates" in perms
        assert "manage_applications" in perms
        assert "conduct_interviews" in perms

    def test_educator_permissions(self):
        """educator should have curriculum and student tracking permissions."""
        perms = get_role_permissions("educator")
        assert isinstance(perms, list)
        assert "manage_curriculum" in perms
        assert "track_students" in perms
        assert "create_programs" in perms

    def test_mentor_permissions(self):
        """mentor should have mentoring and guidance permissions."""
        perms = get_role_permissions("mentor")
        assert isinstance(perms, list)
        assert "mentor_candidates" in perms
        assert "track_progress" in perms
        assert "provide_guidance" in perms

    def test_unknown_role_falls_back_to_job_seeker(self):
        """An unrecognized role should get the job_seeker defaults."""
        perms = get_role_permissions("nonexistent_role_xyz")
        expected = get_role_permissions("job_seeker")
        assert perms == expected, (
            "Unknown role should fall back to job_seeker permissions"
        )

    def test_all_roles_include_view_dashboard(self):
        """Every known role should have the 'view_dashboard' permission."""
        known_roles = [
            "job_seeker", "admin", "recruiter", "educator", "mentor",
            "assessor", "hr_manager", "hr_recruiter", "growth_operator",
        ]
        for role in known_roles:
            perms = get_role_permissions(role)
            assert "view_dashboard" in perms, (
                f"Role '{role}' is missing 'view_dashboard'"
            )

    def test_permissions_are_lists_of_strings(self):
        """Every role's permissions should be a list of non-empty strings."""
        for role in ("job_seeker", "admin", "recruiter", "educator", "mentor"):
            perms = get_role_permissions(role)
            assert isinstance(perms, list)
            assert all(isinstance(p, str) and len(p) > 0 for p in perms), (
                f"Role '{role}' has invalid permission entries"
            )
