#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Security Configuration — Unit Tests
=====================================
Tests for:
  - SecurityConfig importability
  - CSP header directives
  - CORS configuration structure
  - Rate limit values (not too permissive)
  - Password policy settings
  - File upload restrictions
  - Helper methods (is_allowed_file, validate_password)
"""

import os
import sys
import re

import pytest

# ── Path setup ──────────────────────────────────────────────────────
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.security_config import SecurityConfig


# ── Fixtures ────────────────────────────────────────────────────────

@pytest.fixture()
def config():
    """Provide a SecurityConfig instance for tests."""
    return SecurityConfig()


# ── Smoke: Module Importability ────────────────────────────────────

@pytest.mark.smoke
class TestSecurityConfigImport:
    """Verify the security config module loads without errors."""

    def test_security_config_importable(self):
        """backend.security_config should be importable."""
        import backend.security_config  # noqa: F401
        assert hasattr(backend.security_config, "SecurityConfig")

    def test_security_config_is_a_class(self):
        """SecurityConfig should be a class, not a function."""
        assert isinstance(SecurityConfig, type)


# ── Unit: CSP Directives ──────────────────────────────────────────

@pytest.mark.unit
class TestCSPDirectives:
    """Content Security Policy headers must be present and restrictive."""

    def test_csp_directives_is_dict(self, config):
        """CSP_DIRECTIVES should be a dict."""
        assert isinstance(config.CSP_DIRECTIVES, dict)

    def test_csp_has_default_src(self, config):
        """CSP must contain a default-src directive."""
        assert "default-src" in config.CSP_DIRECTIVES

    def test_csp_default_src_contains_self(self, config):
        """default-src should include 'self'."""
        assert "'self'" in config.CSP_DIRECTIVES["default-src"]

    def test_csp_has_script_src(self, config):
        """CSP must contain a script-src directive."""
        assert "script-src" in config.CSP_DIRECTIVES

    def test_csp_has_frame_ancestors_none(self, config):
        """frame-ancestors should be 'none' to prevent clickjacking."""
        assert config.CSP_DIRECTIVES.get("frame-ancestors") == "'none'"

    def test_csp_has_connect_src(self, config):
        """CSP should define allowed connect-src origins."""
        assert "connect-src" in config.CSP_DIRECTIVES

    def test_csp_has_style_src(self, config):
        """CSP should define style-src for font/CSS loading."""
        assert "style-src" in config.CSP_DIRECTIVES

    def test_csp_does_not_use_unsafe_eval_in_scripts(self, config):
        """script-src should NOT contain 'unsafe-eval' (XSS risk)."""
        script_src = config.CSP_DIRECTIVES.get("script-src", "")
        assert "'unsafe-eval'" not in script_src, (
            "CSP script-src should not allow unsafe-eval"
        )


# ── Unit: CORS Configuration ─────────────────────────────────────

@pytest.mark.unit
class TestCORSConfiguration:
    """CORS settings should be properly structured."""

    def test_cors_origins_is_list(self, config):
        """CORS_ORIGINS should be a list."""
        assert isinstance(config.CORS_ORIGINS, list)

    def test_cors_allow_headers_includes_authorization(self, config):
        """CORS_ALLOW_HEADERS must include 'Authorization' for JWT flow."""
        assert "Authorization" in config.CORS_ALLOW_HEADERS

    def test_cors_allow_headers_includes_content_type(self, config):
        """CORS_ALLOW_HEADERS must include 'Content-Type'."""
        assert "Content-Type" in config.CORS_ALLOW_HEADERS

    def test_cors_methods_include_standard_verbs(self, config):
        """CORS_METHODS should include GET, POST, PUT, DELETE."""
        for method in ("GET", "POST", "PUT", "DELETE"):
            assert method in config.CORS_METHODS, (
                f"{method} missing from CORS_METHODS"
            )

    def test_cors_supports_credentials(self, config):
        """CORS_SUPPORTS_CREDENTIALS should be True for cookie/token auth."""
        assert config.CORS_SUPPORTS_CREDENTIALS is True


# ── Unit: Rate Limiting ──────────────────────────────────────────

@pytest.mark.unit
class TestRateLimiting:
    """Rate limit values should be reasonable (not too permissive)."""

    def _parse_rate(self, rate_str: str) -> int:
        """Extract the numeric portion from a rate string like '100 per hour'."""
        match = re.match(r"(\d+)", rate_str)
        assert match, f"Cannot parse rate from '{rate_str}'"
        return int(match.group(1))

    def test_default_rate_limit_is_set(self, config):
        """RATELIMIT_DEFAULT must be defined."""
        assert config.RATELIMIT_DEFAULT is not None
        assert len(config.RATELIMIT_DEFAULT) > 0

    def test_default_rate_limit_not_too_high(self, config):
        """Default rate limit should be ≤ 1000 per unit to prevent abuse."""
        num = self._parse_rate(config.RATELIMIT_DEFAULT)
        assert num <= 1000, (
            f"Default rate limit ({num}) is too permissive"
        )

    def test_api_rate_limit_not_too_high(self, config):
        """API_RATE_LIMIT should be ≤ 5000 per unit."""
        num = self._parse_rate(config.API_RATE_LIMIT)
        assert num <= 5000, (
            f"API rate limit ({num}) is too permissive"
        )

    def test_rate_limit_headers_enabled(self, config):
        """Rate limit response headers should be enabled for client awareness."""
        assert config.RATELIMIT_HEADERS_ENABLED is True


# ── Unit: Password Policy ────────────────────────────────────────

@pytest.mark.unit
class TestPasswordPolicy:
    """Password policy should enforce strong passwords."""

    def test_min_length_at_least_8(self, config):
        """Minimum password length should be at least 8."""
        assert config.PASSWORD_MIN_LENGTH >= 8

    def test_requires_uppercase(self, config):
        """Password policy should require uppercase letters."""
        assert config.PASSWORD_REQUIRE_UPPERCASE is True

    def test_requires_lowercase(self, config):
        """Password policy should require lowercase letters."""
        assert config.PASSWORD_REQUIRE_LOWERCASE is True

    def test_requires_numbers(self, config):
        """Password policy should require digits."""
        assert config.PASSWORD_REQUIRE_NUMBERS is True

    def test_requires_special_chars(self, config):
        """Password policy should require special characters."""
        assert config.PASSWORD_REQUIRE_SPECIAL is True


# ── Unit: File Upload Restrictions ───────────────────────────────

@pytest.mark.unit
class TestFileUploadRestrictions:
    """File upload settings should be restrictive."""

    def test_max_content_length_is_set(self, config):
        """MAX_CONTENT_LENGTH should be a positive integer."""
        assert isinstance(config.MAX_CONTENT_LENGTH, int)
        assert config.MAX_CONTENT_LENGTH > 0

    def test_max_content_length_not_too_large(self, config):
        """MAX_CONTENT_LENGTH should not exceed 100 MB."""
        assert config.MAX_CONTENT_LENGTH <= 100 * 1024 * 1024

    def test_allowed_extensions_is_set(self, config):
        """ALLOWED_EXTENSIONS should be a non-empty set."""
        assert isinstance(config.ALLOWED_EXTENSIONS, set)
        assert len(config.ALLOWED_EXTENSIONS) > 0

    def test_exe_not_allowed(self, config):
        """Executable files should not be in allowed extensions."""
        dangerous = {"exe", "bat", "sh", "cmd", "msi", "ps1"}
        overlap = config.ALLOWED_EXTENSIONS & dangerous
        assert len(overlap) == 0, (
            f"Dangerous extensions allowed: {overlap}"
        )


# ── Unit: Session Cookie Security ────────────────────────────────

@pytest.mark.unit
class TestSessionCookieSecurity:
    """Session cookies should have secure flags."""

    def test_cookie_secure_flag(self, config):
        """SESSION_COOKIE_SECURE should be True (HTTPS only)."""
        assert config.SESSION_COOKIE_SECURE is True

    def test_cookie_httponly_flag(self, config):
        """SESSION_COOKIE_HTTPONLY should be True (no JS access)."""
        assert config.SESSION_COOKIE_HTTPONLY is True

    def test_cookie_samesite_strict(self, config):
        """SESSION_COOKIE_SAMESITE should be 'Strict' or 'Lax'."""
        assert config.SESSION_COOKIE_SAMESITE in ("Strict", "Lax")


# ── Unit: Helper Methods ─────────────────────────────────────────

@pytest.mark.unit
class TestHelperMethods:
    """Test SecurityConfig static helper methods."""

    def test_is_allowed_file_accepts_pdf(self):
        """is_allowed_file should accept .pdf files."""
        assert SecurityConfig.is_allowed_file("resume.pdf") is True

    def test_is_allowed_file_rejects_exe(self):
        """is_allowed_file should reject .exe files."""
        assert SecurityConfig.is_allowed_file("malware.exe") is False

    def test_is_allowed_file_rejects_no_extension(self):
        """is_allowed_file should reject files without extensions."""
        assert SecurityConfig.is_allowed_file("noextension") is False

    def test_validate_password_accepts_strong(self):
        """A strong password should pass validation."""
        ok, msg = SecurityConfig.validate_password("Str0ng!Pass")
        assert ok is True

    def test_validate_password_rejects_short(self):
        """A password shorter than MIN_LENGTH should fail."""
        ok, msg = SecurityConfig.validate_password("Ab1!")
        assert ok is False

    def test_validate_password_rejects_no_uppercase(self):
        """A password without uppercase should fail."""
        ok, msg = SecurityConfig.validate_password("nouppercas3!")
        assert ok is False

    def test_validate_password_rejects_no_digit(self):
        """A password without digits should fail."""
        ok, msg = SecurityConfig.validate_password("NoDigits!!")
        assert ok is False

    def test_validate_password_rejects_no_special(self):
        """A password without special chars should fail."""
        ok, msg = SecurityConfig.validate_password("NoSpecial1A")
        assert ok is False
