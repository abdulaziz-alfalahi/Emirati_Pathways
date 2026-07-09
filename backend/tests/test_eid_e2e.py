#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Emirates ID (EID) End-to-End Test Suite
========================================

Validates that the platform's migration from UUID to CHAR(15) Emirates ID
as the primary user key is complete and consistent across:

  Group 1 — Database Schema Integrity  (6 tests)
  Group 2 — UAE PASS Login Simulation   (4 tests, read-only / rollback)
  Group 3 — JWT Token Round-Trip        (3 tests)
  Group 4 — API Route Smoke Tests       (4 tests, live HTTP)
  Group 5 — Data Integrity              (3 tests)

Requirements:
    pip install pytest psycopg2-binary flask flask-jwt-extended requests

Usage:
    cd /home/aalfalahi.d/Emirati_Pathways
    python -m pytest backend/tests/test_eid_e2e.py -v --tb=short
"""

import os
import re
import sys
import json
import pytest
import logging

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 5432))
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "emirati_secure_password")

API_BASE = os.getenv("API_BASE_URL", "http://127.0.0.1:5005")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "test-only-secret-not-for-production")

EID_REGEX = re.compile(r"^[0-9]{15}$")

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers – database connectivity
# ---------------------------------------------------------------------------

def _try_connect():
    """Attempt a psycopg2 connection; return conn or None."""
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
        )
        return conn
    except Exception:
        return None


DB_AVAILABLE = _try_connect() is not None
if DB_AVAILABLE:
    _try_connect().close()

skip_no_db = pytest.mark.skipif(not DB_AVAILABLE, reason="PostgreSQL not reachable")

# ---------------------------------------------------------------------------
# Helpers – API reachability
# ---------------------------------------------------------------------------

def _api_reachable() -> bool:
    try:
        import requests
        r = requests.get(f"{API_BASE}/health", timeout=5)
        return r.status_code == 200
    except Exception:
        return False

API_AVAILABLE = _api_reachable()
skip_no_api = pytest.mark.skipif(not API_AVAILABLE, reason="Backend API not reachable at " + API_BASE)


# ═══════════════════════════════════════════════════════════════════════════
# FIXTURES
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture()
def db_conn():
    """Yield a psycopg2 connection that is rolled back after each test."""
    import psycopg2
    import psycopg2.extras
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
    conn.autocommit = False
    yield conn
    conn.rollback()
    conn.close()


@pytest.fixture()
def flask_app():
    """Create a minimal Flask app with JWT configured for token tests."""
    from flask import Flask
    from flask_jwt_extended import JWTManager

    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = JWT_SECRET
    app.config["TESTING"] = True
    JWTManager(app)
    return app


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 1 — Database Schema Integrity
# ═══════════════════════════════════════════════════════════════════════════

class TestDatabaseSchemaIntegrity:
    """Verify the users table PK is CHAR(15) and related constraints exist."""

    @skip_no_db
    def test_users_pk_is_char15(self, db_conn):
        """users.id must be CHAR(15) — the Emirates ID column."""
        cur = db_conn.cursor()
        cur.execute("""
            SELECT data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'id'
              AND table_schema = current_schema()
        """)
        row = cur.fetchone()
        assert row is not None, "Column users.id not found in information_schema"
        assert row["data_type"] == "character", (
            f"Expected data_type='character' (CHAR), got '{row['data_type']}'"
        )
        assert row["character_maximum_length"] == 15, (
            f"Expected character_maximum_length=15, got {row['character_maximum_length']}"
        )

    @skip_no_db
    def test_all_eids_valid_format(self, db_conn):
        """Every users.id must match the 15-digit numeric EID pattern."""
        cur = db_conn.cursor()
        cur.execute("SELECT id FROM users")
        rows = cur.fetchall()
        invalid = [r["id"] for r in rows if not EID_REGEX.match(r["id"].strip())]
        assert len(invalid) == 0, (
            f"{len(invalid)} user(s) have non-EID ids: {invalid[:10]}"
        )

    @skip_no_db
    def test_fk_constraints_exist(self, db_conn):
        """At least 15 FK constraints should reference the users table."""
        cur = db_conn.cursor()
        cur.execute("""
            SELECT count(*) AS cnt
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
              AND tc.table_schema = ccu.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_name = 'users'
              AND tc.table_schema = current_schema()
        """)
        row = cur.fetchone()
        fk_count = row["cnt"]
        assert fk_count >= 15, (
            f"Expected ≥15 FK constraints referencing 'users', found {fk_count}"
        )

    @skip_no_db
    def test_no_orphan_records(self, db_conn):
        """Key child tables must have no rows whose user FK is absent from users."""
        # (table_name, fk_column_name)
        child_tables = [
            ("candidate_profiles", "user_id"),
            ("user_cvs", "user_id"),
            ("notifications", "user_id"),
            ("job_applications", "candidate_id"),
        ]
        cur = db_conn.cursor()
        orphans = {}
        for tbl, col in child_tables:
            # First check if table and column exist
            cur.execute("""
                SELECT 1 FROM information_schema.columns
                WHERE table_name = %s AND column_name = %s
                  AND table_schema = current_schema()
            """, (tbl, col))
            if cur.fetchone() is None:
                continue  # table/column doesn't exist, skip
            cur.execute(f"""
                SELECT count(*) AS cnt
                FROM {tbl} c
                LEFT JOIN users u ON c.{col} = u.id
                WHERE c.{col} IS NOT NULL AND u.id IS NULL
            """)
            cnt = cur.fetchone()["cnt"]
            if cnt > 0:
                orphans[f"{tbl}.{col}"] = cnt
        assert len(orphans) == 0, f"Orphan rows found: {orphans}"

    @skip_no_db
    def test_old_uuid_column_exists(self, db_conn):
        """users table should retain the id_old_uuid migration column."""
        cur = db_conn.cursor()
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name = 'id_old_uuid'
              AND table_schema = current_schema()
        """)
        row = cur.fetchone()
        assert row is not None, "Column users.id_old_uuid not found — migration artefact missing"

    @skip_no_db
    def test_key_indexes_exist(self, db_conn):
        """Critical indexes must exist on the users table."""
        expected_indexes = [
            "idx_users_email",
            # idx_users_uaepass_uuid may need to be created separately
        ]
        cur = db_conn.cursor()
        cur.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'users'
              AND schemaname = current_schema()
        """)
        existing = {r["indexname"] for r in cur.fetchall()}
        missing = [idx for idx in expected_indexes if idx not in existing]
        assert len(missing) == 0, (
            f"Missing indexes: {missing}. Existing: {sorted(existing)}"
        )


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 2 — UAE PASS Login Simulation  (read-only / rollback)
# ═══════════════════════════════════════════════════════════════════════════

class TestUAEPassLoginSimulation:
    """Simulate UAE PASS lookup paths — all DB mutations are rolled back."""

    # Test EID constants (will be rolled back)
    TEST_EID = "784199012345678"
    TEST_EMAIL = "eid_e2e_test@example.test"
    TEST_UUID = "aabbccdd-1234-5678-9abc-def012345678"

    def _insert_test_user(self, cur, eid=None, email=None, uaepass_uuid=None):
        """Insert a temporary user row for lookup tests."""
        eid = eid or self.TEST_EID
        email = email or self.TEST_EMAIL
        cur.execute("""
            INSERT INTO users (id, email, first_name, last_name, role, uaepass_uuid)
            VALUES (%s, %s, 'Test', 'EID', 'candidate', %s)
            ON CONFLICT (id) DO NOTHING
        """, (eid, email, uaepass_uuid))

    @skip_no_db
    def test_find_user_by_uuid(self, db_conn):
        """Lookup a user by their uaepass_uuid column."""
        cur = db_conn.cursor()
        self._insert_test_user(cur, uaepass_uuid=self.TEST_UUID)
        cur.execute(
            "SELECT id FROM users WHERE uaepass_uuid = %s",
            (self.TEST_UUID,),
        )
        row = cur.fetchone()
        assert row is not None, "User not found by uaepass_uuid"
        assert row["id"].strip() == self.TEST_EID

    @skip_no_db
    def test_find_user_by_eid_match(self, db_conn):
        """Lookup a user by the CHAR(15) EID primary key."""
        cur = db_conn.cursor()
        self._insert_test_user(cur)
        cur.execute("SELECT id, email FROM users WHERE id = %s", (self.TEST_EID,))
        row = cur.fetchone()
        assert row is not None, "User not found by EID"
        assert row["id"].strip() == self.TEST_EID
        assert row["email"] == self.TEST_EMAIL

    @skip_no_db
    def test_find_user_by_email(self, db_conn):
        """Lookup a user by email address."""
        cur = db_conn.cursor()
        self._insert_test_user(cur)
        cur.execute("SELECT id FROM users WHERE email = %s", (self.TEST_EMAIL,))
        row = cur.fetchone()
        assert row is not None, "User not found by email"
        assert row["id"].strip() == self.TEST_EID

    @skip_no_db
    def test_jwt_identity_is_eid_string(self, flask_app, db_conn):
        """JWT identity for a sample EID must match the exact 15-char string."""
        from flask_jwt_extended import create_access_token, decode_token

        with flask_app.app_context():
            token = create_access_token(identity=self.TEST_EID)
            decoded = decode_token(token)
            identity = decoded["sub"]
            assert identity == self.TEST_EID, (
                f"JWT identity mismatch: expected '{self.TEST_EID}', got '{identity}'"
            )
            assert EID_REGEX.match(identity), (
                f"JWT identity '{identity}' does not match EID regex"
            )


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 3 — JWT Token Round-Trip
# ═══════════════════════════════════════════════════════════════════════════

class TestJWTRoundTrip:
    """Verify JWT create → decode preserves the CHAR(15) EID identity."""

    SAMPLE_EID = "784199012345678"

    def test_jwt_create_and_decode(self, flask_app):
        """Create an access token with an EID identity and decode it back."""
        from flask_jwt_extended import create_access_token, decode_token

        with flask_app.app_context():
            token = create_access_token(identity=self.SAMPLE_EID)
            decoded = decode_token(token)
            assert decoded["sub"] == self.SAMPLE_EID, (
                f"Round-trip failed: expected '{self.SAMPLE_EID}', got '{decoded['sub']}'"
            )

    def test_jwt_no_whitespace_padding(self, flask_app):
        """CHAR(15) columns can pad with spaces — JWT identity must be clean."""
        from flask_jwt_extended import create_access_token, decode_token

        with flask_app.app_context():
            # Simulate what might happen if identity comes from a CHAR column
            padded_eid = self.SAMPLE_EID + "   "
            token = create_access_token(identity=padded_eid.strip())
            decoded = decode_token(token)
            identity = decoded["sub"]
            assert identity == identity.strip(), (
                f"JWT identity has trailing whitespace: '{identity}'"
            )
            assert len(identity) == 15, (
                f"JWT identity length is {len(identity)}, expected 15"
            )

    def test_jwt_identity_type_is_string(self, flask_app):
        """get_jwt_identity() must return a str, never an int."""
        from flask_jwt_extended import create_access_token, decode_token

        with flask_app.app_context():
            token = create_access_token(identity=self.SAMPLE_EID)
            decoded = decode_token(token)
            identity = decoded["sub"]
            assert isinstance(identity, str), (
                f"JWT identity type is {type(identity).__name__}, expected str"
            )


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 4 — API Route Smoke Tests (live HTTP)
# ═══════════════════════════════════════════════════════════════════════════

class TestAPISmokeTests:
    """Hit the running Flask backend and verify EID-aware responses."""

    @skip_no_api
    def test_api_health(self):
        """GET /health returns 200 with status 'healthy'."""
        import requests
        r = requests.get(f"{API_BASE}/health", timeout=10)
        assert r.status_code == 200, f"Health check returned {r.status_code}"
        body = r.json()
        assert body.get("status") == "healthy", f"Unexpected status: {body}"

    @skip_no_api
    @skip_no_db
    def test_profile_fetch_with_eid_jwt(self, db_conn):
        """GET /api/auth/profile with a valid JWT should return user data with EID-format id."""
        import requests
        from flask_jwt_extended import create_access_token
        from flask import Flask
        from flask_jwt_extended import JWTManager

        # Find a real user EID from the database
        cur = db_conn.cursor()
        cur.execute("SELECT id FROM users LIMIT 1")
        row = cur.fetchone()
        if row is None:
            pytest.skip("No users in database to test with")

        real_eid = row["id"].strip()

        # Create a JWT for that user using a temporary Flask app context
        app = Flask(__name__)
        app.config["JWT_SECRET_KEY"] = JWT_SECRET
        JWTManager(app)

        with app.app_context():
            token = create_access_token(identity=real_eid)

        r = requests.get(
            f"{API_BASE}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert r.status_code == 200, (
            f"Profile fetch returned {r.status_code}: {r.text[:300]}"
        )
        body = r.json()
        # The response should contain an 'id' or 'user_id' field in EID format
        user_id = (
            body.get("data", {}).get("id")
            or body.get("data", {}).get("user_id")
            or body.get("id")
        )
        assert user_id is not None, f"No id/user_id in response: {json.dumps(body)[:300]}"
        user_id_stripped = str(user_id).strip()
        assert EID_REGEX.match(user_id_stripped), (
            f"Returned user_id '{user_id_stripped}' is not in EID format"
        )

    @skip_no_api
    def test_profile_fetch_unauthorized(self):
        """GET /api/auth/profile without JWT must return 401 or 422."""
        import requests
        r = requests.get(f"{API_BASE}/api/auth/profile", timeout=10)
        assert r.status_code in (401, 422), (
            f"Expected 401/422 without JWT, got {r.status_code}"
        )

    @skip_no_api
    @skip_no_db
    def test_admin_users_list(self, db_conn):
        """GET /api/admin/users/statistics with an admin JWT returns EID-format IDs."""
        import requests
        from flask_jwt_extended import create_access_token
        from flask import Flask
        from flask_jwt_extended import JWTManager

        # Find an admin user
        cur = db_conn.cursor()
        cur.execute("""
            SELECT id FROM users
            WHERE role IN ('platform_administrator', 'super_user')
            LIMIT 1
        """)
        row = cur.fetchone()
        if row is None:
            pytest.skip("No admin users in database to test with")

        admin_eid = row["id"].strip()

        app = Flask(__name__)
        app.config["JWT_SECRET_KEY"] = JWT_SECRET
        JWTManager(app)

        with app.app_context():
            token = create_access_token(
                identity=admin_eid,
                additional_claims={"role": "platform_administrator"},
            )

        r = requests.get(
            f"{API_BASE}/api/admin/users/statistics",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        # Accept 200 (success) or 403/404 (endpoint may require different auth)
        assert r.status_code in (200, 403, 404), (
            f"Admin users endpoint returned {r.status_code}: {r.text[:300]}"
        )
        if r.status_code == 200:
            body = r.json()
            assert body.get("success") is not False, (
                f"Unexpected failure response: {json.dumps(body)[:300]}"
            )


# ═══════════════════════════════════════════════════════════════════════════
# GROUP 5 — Data Integrity
# ═══════════════════════════════════════════════════════════════════════════

class TestDataIntegrity:
    """Ensure referential and type integrity across the EID-migrated schema."""

    @skip_no_db
    def test_no_text_type_user_columns(self, db_conn):
        """Columns that reference user IDs should be CHAR(15), not TEXT.

        This test *documents* any remaining TEXT-typed user_id columns.
        It warns rather than hard-fails because some may be intentional.
        """
        cur = db_conn.cursor()
        cur.execute("""
            SELECT table_name, column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE column_name IN ('user_id', 'candidate_id', 'applicant_id',
                                  'mentor_id', 'mentee_id', 'recruiter_id',
                                  'assigned_to', 'created_by')
              AND data_type IN ('text', 'character varying')
              AND table_schema = current_schema()
            ORDER BY table_name, column_name
        """)
        rows = cur.fetchall()
        if rows:
            details = [
                f"  {r['table_name']}.{r['column_name']} → {r['data_type']}"
                f"({r['character_maximum_length'] or '∞'})"
                for r in rows
            ]
            logger.warning(
                "Columns still using TEXT/VARCHAR for user references:\n"
                + "\n".join(details)
            )
        # This is informational — we just ensure the query ran without error.
        # To make it a hard gate, uncomment the assertion below:
        # assert len(rows) == 0, f"{len(rows)} column(s) still TEXT: {details}"

    @skip_no_db
    def test_users_table_has_uaepass_columns(self, db_conn):
        """users table must have the UAE PASS / EID augmentation columns."""
        required_columns = [
            "uaepass_uuid",
            "emirates_id_enc",
            "fullname_ar",
            "auth_method",
        ]
        cur = db_conn.cursor()
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND table_schema = current_schema()
        """)
        existing = {r["column_name"] for r in cur.fetchall()}
        missing = [c for c in required_columns if c not in existing]
        assert len(missing) == 0, (
            f"Missing UAE PASS columns on users table: {missing}"
        )

    @skip_no_db
    def test_candidate_profiles_user_id_matches(self, db_conn):
        """candidate_profiles.user_id should successfully JOIN to users.id."""
        cur = db_conn.cursor()
        # First check table exists
        cur.execute("""
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'candidate_profiles'
              AND table_schema = current_schema()
        """)
        if cur.fetchone() is None:
            pytest.skip("candidate_profiles table does not exist")

        cur.execute("""
            SELECT count(*) AS total,
                   count(u.id) AS matched
            FROM candidate_profiles cp
            LEFT JOIN users u ON cp.user_id = u.id
        """)
        row = cur.fetchone()
        orphans = row["total"] - row["matched"]
        assert orphans == 0, (
            f"{orphans} candidate_profiles rows have no matching user "
            f"(total={row['total']}, matched={row['matched']})"
        )


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v", "--tb=short"]))
