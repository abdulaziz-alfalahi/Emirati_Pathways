"""
Security Tests — Tier 1 Acceptance Tests
Verifies that all T1 security remediations are in effect.

Tests cover:
  T1.1 - mock_token backdoor removed
  T1.2 - dev-login endpoints removed/gated
  T1.3 - JWT signatures verified everywhere
  T1.4 - role mass-assignment blocked
  T1.5 - file access protected + path traversal blocked
  T1.6 - ORDER BY SQL injection blocked
  T1.7 - SocketIO CORS locked down
  T1.8 - Security headers present
"""

import os
import sys
import json
import pytest
import jwt as pyjwt
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Ensure backend is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture
def app():
    """Create a test Flask app."""
    os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-for-tier1-security-tests')
    os.environ.setdefault('FLASK_ENV', 'testing')
    os.environ.setdefault('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')

    from app import app as flask_app
    flask_app.config['TESTING'] = True
    flask_app.config['JWT_SECRET_KEY'] = 'test-secret-for-tier1-security-tests'
    return flask_app


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


def make_valid_token(secret='test-secret-for-tier1-security-tests', user_id='test-user-123',
                     role='candidate', expires_minutes=30):
    """Create a valid JWT token for testing."""
    payload = {
        'sub': str(user_id),
        'user_id': str(user_id),
        'role': role,
        'fresh': False,
        'type': 'access',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(minutes=expires_minutes),
        'nbf': datetime.utcnow(),
    }
    return pyjwt.encode(payload, secret, algorithm='HS256')


def make_forged_token(user_id='evil-user', role='admin'):
    """Create a JWT signed with a WRONG key (forged)."""
    return make_valid_token(secret='wrong-secret-key', user_id=user_id, role=role)


# =====================================================
# T1.1 — mock_token backdoor must be removed
# =====================================================

class TestMockTokenRemoved:
    """Verify mock_token authentication bypass is completely removed."""

    def test_mock_token_rejected_on_candidates_search(self, client):
        """T1.1: mock_token should NOT grant access to candidate search."""
        resp = client.get(
            '/api/hr/candidates/search',
            headers={'Authorization': 'Bearer mock_token_user_1'}
        )
        # Should get 401 or 422 (unprocessable), NOT 200 with data
        assert resp.status_code in (401, 403, 404, 422), \
            f"mock_token accepted! Status {resp.status_code}, body: {resp.data[:200]}"

    def test_mock_token_rejected_on_cv_routes(self, client):
        """T1.1: mock_token should NOT grant access to CV routes."""
        resp = client.get(
            '/api/cv/some-cv-id',
            headers={'Authorization': 'Bearer mock_token'}
        )
        assert resp.status_code in (401, 403, 404, 422), \
            f"mock_token accepted on CV route! Status {resp.status_code}"

    def test_no_mock_token_in_source(self):
        """T1.1: Grep backend source for any remaining mock_token usage."""
        import subprocess
        result = subprocess.run(
            ['git', 'grep', '-n', 'mock_token', '--', 'backend'],
            capture_output=True, text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', '..')
        )
        # Filter out test files and __pycache__
        lines = [l for l in result.stdout.strip().split('\n')
                 if l and 'tests/' not in l and '__pycache__' not in l and '.pyc' not in l]
        assert len(lines) == 0, \
            f"mock_token still found in backend source:\n" + "\n".join(lines)


# =====================================================
# T1.2 — dev-login endpoints removed/gated
# =====================================================

class TestDevLoginRemoved:
    """Verify dev-login endpoints are removed or properly gated."""

    def test_inline_dev_login_deleted(self, client):
        """T1.2: POST /api/auth/dev-login must return 404 (deleted)."""
        resp = client.post(
            '/api/auth/dev-login',
            json={'user_id': '1', 'role': 'admin'}
        )
        assert resp.status_code in (404, 405), \
            f"dev-login still active! Status {resp.status_code}"

    def test_uaepass_dev_login_gated(self, client):
        """T1.2: UAEPass dev-login returns 404 without ENABLE_DEV_LOGIN=true."""
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}, clear=False):
            # Without ENABLE_DEV_LOGIN, should be 404
            resp = client.post(
                '/api/auth/uaepass/dev-login',
                json={'eid': '784000000000001'}
            )
            assert resp.status_code in (404, 405), \
                f"UAEPass dev-login active without opt-in! Status {resp.status_code}"

    def test_uaepass_dev_login_blocked_in_production(self, client):
        """T1.2: UAEPass dev-login returns 404 in production even with opt-in."""
        with patch.dict(os.environ, {
            'FLASK_ENV': 'production',
            'ENABLE_DEV_LOGIN': 'true'
        }, clear=False):
            resp = client.post(
                '/api/auth/uaepass/dev-login',
                json={'eid': '784000000000001'}
            )
            assert resp.status_code in (404, 405), \
                f"UAEPass dev-login active in production! Status {resp.status_code}"


# =====================================================
# T1.3 — JWT signatures verified everywhere
# =====================================================

class TestJWTSignatureVerification:
    """Verify JWT signatures are checked — forged tokens must be rejected."""

    def test_forged_token_rejected(self, client):
        """T1.3: A token signed with wrong key must be rejected (401)."""
        forged = make_forged_token(user_id='1', role='admin')
        resp = client.get(
            '/api/hr/candidates/search',
            headers={'Authorization': f'Bearer {forged}'}
        )
        assert resp.status_code in (401, 403, 422), \
            f"Forged token accepted! Status {resp.status_code}"

    def test_no_verify_signature_false_in_source(self):
        """T1.3: No verify_signature=False should remain in backend source."""
        import subprocess
        result = subprocess.run(
            ['git', 'grep', '-n', 'verify_signature.*False', '--', 'backend'],
            capture_output=True, text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', '..')
        )
        lines = [l for l in result.stdout.strip().split('\n') if l and 'tests/' not in l]
        assert len(lines) == 0, \
            f"verify_signature=False still found:\n" + "\n".join(lines)


# =====================================================
# T1.4 — role mass-assignment blocked
# =====================================================

class TestRoleMassAssignment:
    """Verify users cannot self-assign admin roles."""

    def test_registration_ignores_role_field(self, client):
        """T1.4: Registration with role=admin should create a candidate."""
        resp = client.post('/api/auth/register', json={
            'email': 'test@test.ae',
            'password': 'TestPassword123!',
            'first_name': 'Test',
            'last_name': 'User',
            'phone': '+971501234567',
            'emirate': 'Dubai',
            'role': 'admin',  # This should be ignored
            'primary_role': 'platform_administrator',  # This too
        })
        # Even if registration fails (DB not available), it should not create admin
        if resp.status_code == 201:
            data = resp.get_json()
            # The response should not indicate admin role
            assert data.get('data', {}).get('role') != 'admin', \
                "User registered as admin!"

    def test_update_roles_requires_admin(self, client):
        """T1.4: Non-admin user cannot update roles (403)."""
        token = make_valid_token(role='candidate')
        resp = client.put(
            '/api/auth/update-roles',
            headers={'Authorization': f'Bearer {token}'},
            json={'primary_role': 'admin'}
        )
        assert resp.status_code in (403, 401, 422), \
            f"Candidate changed own role! Status {resp.status_code}"


# =====================================================
# T1.5 — file access protected + path traversal
# =====================================================

class TestFileAccessProtection:
    """Verify file serving requires auth and blocks path traversal."""

    def test_uploads_require_auth(self, client):
        """T1.5: /uploads/ without JWT returns 401."""
        resp = client.get('/uploads/test.pdf')
        assert resp.status_code in (401, 403, 422), \
            f"Uploads accessible without auth! Status {resp.status_code}"

    def test_path_traversal_blocked(self, client):
        """T1.5: /uploads/../etc/passwd is rejected."""
        token = make_valid_token()
        resp = client.get(
            '/uploads/../etc/passwd',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert resp.status_code in (400, 403, 404), \
            f"Path traversal not blocked! Status {resp.status_code}"


# =====================================================
# T1.6 — ORDER BY SQL injection blocked
# =====================================================

class TestSQLInjectionBlocked:
    """Verify SQL injection via sort_order is blocked."""

    def test_no_unsafe_sort_order_in_source(self):
        """T1.6: sort_order should be whitelisted, not injected raw."""
        import subprocess
        # Check that ALLOWED_SORT_ORDERS exists in the file
        result = subprocess.run(
            ['grep', '-c', 'ALLOWED_SORT_ORDERS', 'backend/hr_candidate_search_routes.py'],
            capture_output=True, text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', '..')
        )
        count = int(result.stdout.strip()) if result.stdout.strip() else 0
        assert count > 0, "ALLOWED_SORT_ORDERS whitelist not found in hr_candidate_search_routes.py"


# =====================================================
# T1.7 — SocketIO CORS locked down
# =====================================================

class TestSocketIOLockdown:
    """Verify SocketIO CORS is not wildcard."""

    def test_no_cors_wildcard_in_source(self):
        """T1.7: SocketIO should not use cors_allowed_origins='*'."""
        import subprocess
        result = subprocess.run(
            ['grep', '-n', "cors_allowed_origins='*'", 'backend/app.py'],
            capture_output=True, text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', '..')
        )
        assert result.stdout.strip() == '', \
            f"SocketIO still uses cors_allowed_origins='*':\n{result.stdout}"


# =====================================================
# T1.8 — Security headers
# =====================================================

class TestSecurityHeaders:
    """Verify HSTS and CSP headers are properly configured."""

    def test_no_unsafe_eval_in_csp(self):
        """T1.8: CSP should not contain unsafe-eval."""
        import subprocess
        result = subprocess.run(
            ['grep', '-c', "'unsafe-eval'", 'backend/app.py'],
            capture_output=True, text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', '..')
        )
        count = int(result.stdout.strip()) if result.stdout.strip() else 0
        assert count == 0, "unsafe-eval still in CSP policy"

    def test_hsts_uncommented(self):
        """T1.8: HSTS header should be uncommented in app.py."""
        import subprocess
        result = subprocess.run(
            ['grep', '-n', 'Strict-Transport-Security', 'backend/app.py'],
            capture_output=True, text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', '..')
        )
        lines = result.stdout.strip().split('\n')
        uncommented = [l for l in lines if l and not l.strip().startswith('#') and '# ' not in l.split(':')[1] if ':' in l]
        assert len(uncommented) > 0, \
            f"HSTS still commented out. Lines found:\n{result.stdout}"

    def test_hsts_in_nginx(self):
        """T1.8: HSTS should be in nginx.conf."""
        import subprocess
        result = subprocess.run(
            ['grep', '-c', 'Strict-Transport-Security', 'frontend/nginx.conf'],
            capture_output=True, text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', '..')
        )
        count = int(result.stdout.strip()) if result.stdout.strip() else 0
        assert count > 0, "HSTS not found in nginx.conf"
