import os
import json
import pytest
from dotenv import load_dotenv
load_dotenv('backend/.env')

from backend.db import get_db_connection
from app import create_app

# Built from the shared list rather than a literal: when a consent is added,
# this payload must follow, and a test that hardcoded three would instead fail
# in a way that looks like a registration bug.
try:
    from backend.consent_policy import REQUIRED_CONSENTS
except ImportError:
    from consent_policy import REQUIRED_CONSENTS


@pytest.fixture(scope="module")
def app():
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
    test_app = create_app()
    test_app.config.update({
        "TESTING": True,
    })
    return test_app

@pytest.fixture()
def client(app):
    return app.test_client()

def test_registration_requires_consents(client):
    """Test that registration fails if consents are missing."""
    reg_payload = {
        "email": "consent_test_fail@emirati.gov.ae",
        "first_name": "Consent",
        "last_name": "Fail",
        "phone": "971501234567",
        "emirate": "Dubai",
        "password": "StrongPassword123!"
    }
    
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "consent" in data["message"].lower()

TEST_CONSENT_EMAIL = 'consent_test_ok@emirati.gov.ae'


def _purge_consent_test_user(cur):
    """Remove the test user and everything that references it.

    candidate_profiles must go too. Registration provisions a profile row, and
    leaving it makes the users DELETE fail on fk_candidate_profiles_user — which
    stranded 784000000000570 in the LIVE database from 2026-08-12 until it was
    cleared by hand, and broke this test on every run in between.
    """
    for stmt in (
        "DELETE FROM consents WHERE user_id IN (SELECT id FROM users WHERE email = %s)",
        "DELETE FROM candidate_profiles WHERE user_id IN (SELECT id FROM users WHERE email = %s)",
        "DELETE FROM users WHERE email = %s",
    ):
        cur.execute(stmt, (TEST_CONSENT_EMAIL,))


def test_registration_records_consents(client):
    """Test that registration succeeds and writes consents when provided."""
    conn = get_db_connection()
    cur = conn.cursor()

    # Clear anything an earlier run left behind before registering.
    _purge_consent_test_user(cur)
    conn.commit()

    reg_payload = {
        "email": TEST_CONSENT_EMAIL,
        "first_name": "Consent",
        "last_name": "Success",
        "phone": "971507654321",
        "emirate": "Abu Dhabi",
        "password": "StrongPassword123!",
        "consents": {c: True for c in REQUIRED_CONSENTS}
    }
    
    try:
        resp = client.post("/api/auth/register", json=reg_payload)
        assert resp.status_code == 201

        # Check database
        cur.execute("SELECT id FROM users WHERE email = %s;", (TEST_CONSENT_EMAIL,))
        user_row = cur.fetchone()
        assert user_row is not None
        user_id = user_row[0]

        cur.execute("SELECT consent_type, granted, withdrawn_at FROM consents WHERE user_id = %s;", (user_id,))
        consent_rows = cur.fetchall()
        assert len(consent_rows) == len(REQUIRED_CONSENTS)
        for ct, granted, withdrawn_at in consent_rows:
            assert granted is True
            assert withdrawn_at is None
    finally:
        # Clean up after ourselves, pass or fail. This database holds
        # production data: cleaning only at the start meant every run left a
        # fresh synthetic Emirates ID behind in `users` for good.
        _purge_consent_test_user(cur)
        conn.commit()
        conn.close()
