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

def test_dsr_export_and_erase(client):
    """Test the DSR export and erasure flow for a candidate."""
    # 1. Create a dummy user
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM consents WHERE user_id IN (SELECT id FROM users WHERE email = 'dsr_test@emirati.gov.ae');")
    cur.execute("DELETE FROM users WHERE email = 'dsr_test@emirati.gov.ae';")
    conn.commit()
    
    reg_payload = {
        "email": "dsr_test@emirati.gov.ae",
        "first_name": "DSR",
        "last_name": "Test",
        "phone": "971501112223",
        "emirate": "Fujairah",
        "password": "StrongPassword123!",
        "consents": {
            "terms": True,
            "privacy": True,
            "data_processing": True
        }
    }
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 201
    
    # 2. Log in to get access token
    login_payload = {
        "email": "dsr_test@emirati.gov.ae",
        "password": "StrongPassword123!"
    }
    resp = client.post("/api/auth/login", json=login_payload)
    assert resp.status_code == 200
    login_data = resp.get_json()
    token = login_data["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Test DSR Export
    resp = client.get("/api/auth/dsr/export", headers=headers)
    assert resp.status_code == 200
    export_data = resp.get_json()
    assert export_data["success"] is True
    assert export_data["data"]["user"]["email"] == "dsr_test@emirati.gov.ae"
    assert len(export_data["data"]["consents"]) == 3
    
    # 4. Test DSR Erase
    resp = client.post("/api/auth/dsr/erase", headers=headers)
    assert resp.status_code == 200
    erase_data = resp.get_json()
    assert erase_data["success"] is True
    
    # 5. Verify database state post-erasure
    cur.execute("SELECT first_name, email, is_active FROM users WHERE email = 'dsr_test@emirati.gov.ae';")
    assert cur.fetchone() is None  # email was anonymized so it shouldn't match
    
    # Verify consents were deleted
    cur.execute("SELECT id FROM users WHERE email LIKE 'deleted_user_%';")
    anonymized_users = cur.fetchall()
    assert len(anonymized_users) > 0
    anonymized_user_id = anonymized_users[-1][0]
    
    cur.execute("SELECT COUNT(*) FROM consents WHERE user_id = %s;", (anonymized_user_id,))
    assert cur.fetchone()[0] == 0
    
    # Verify audit log was created (assert at least 1, since the table is append-only and entries accumulate across test runs)
    cur.execute("SELECT COUNT(*) FROM admin_audit_log WHERE action = 'DSR Erase' AND resource_id = %s;", (anonymized_user_id,))
    assert cur.fetchone()[0] >= 1
    
    # Clean up the anonymized user only (do NOT delete from admin_audit_log as it is append-only)
    cur.execute("DELETE FROM users WHERE id = %s;", (anonymized_user_id,))
    conn.commit()
    conn.close()
