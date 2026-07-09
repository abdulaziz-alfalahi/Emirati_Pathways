import os
import json
import pytest
from dotenv import load_dotenv
load_dotenv('backend/.env')

from backend.db import get_db_connection
from app import create_app

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

def test_registration_records_consents(client):
    """Test that registration succeeds and writes consents when provided."""
    # Let's clean up user if exists
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM consents WHERE user_id IN (SELECT id FROM users WHERE email = 'consent_test_ok@emirati.gov.ae');")
    cur.execute("DELETE FROM users WHERE email = 'consent_test_ok@emirati.gov.ae';")
    conn.commit()
    
    reg_payload = {
        "email": "consent_test_ok@emirati.gov.ae",
        "first_name": "Consent",
        "last_name": "Success",
        "phone": "971507654321",
        "emirate": "Abu Dhabi",
        "password": "StrongPassword123!",
        "consents": {
            "terms": True,
            "privacy": True,
            "data_processing": True
        }
    }
    
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 201
    
    # Check database
    cur.execute("SELECT id FROM users WHERE email = 'consent_test_ok@emirati.gov.ae';")
    user_row = cur.fetchone()
    assert user_row is not None
    user_id = user_row[0]
    
    cur.execute("SELECT consent_type, granted, withdrawn_at FROM consents WHERE user_id = %s;", (user_id,))
    consent_rows = cur.fetchall()
    assert len(consent_rows) == 3
    for ct, granted, withdrawn_at in consent_rows:
        assert granted is True
        assert withdrawn_at is None
        
    conn.close()
