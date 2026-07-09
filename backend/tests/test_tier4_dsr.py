import os
import json
import pytest
import psycopg2
from unittest.mock import patch
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

def test_dsr_erase_atomicity(client):
    """Test that DSR erasure is fully atomic and rolls back on failure."""
    # 1. Create a dummy user
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM consents WHERE user_id IN (SELECT id FROM users WHERE email = 'dsr_atom_test@emirati.gov.ae');")
    cur.execute("DELETE FROM users WHERE email = 'dsr_atom_test@emirati.gov.ae';")
    conn.commit()
    
    reg_payload = {
        "email": "dsr_atom_test@emirati.gov.ae",
        "first_name": "DSRAtom",
        "last_name": "Test",
        "phone": "971501112224",
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
        "email": "dsr_atom_test@emirati.gov.ae",
        "password": "StrongPassword123!"
    }
    resp = client.post("/api/auth/login", json=login_payload)
    assert resp.status_code == 200
    login_data = resp.get_json()
    token = login_data["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get user's ID
    cur.execute("SELECT id FROM users WHERE email = 'dsr_atom_test@emirati.gov.ae';")
    user_id = cur.fetchone()[0]
    
    # 3. Trigger DSR erase but mock get_db_connection to return a wrapper connection
    # whose cursor execute raises error on a middle query (e.g. notifications delete)
    original_get_db = get_db_connection
    
    def mock_get_db():
        real_conn = original_get_db()
        class MockConnection:
            def __init__(self, real):
                self.real = real
            @property
            def autocommit(self):
                return self.real.autocommit
            @autocommit.setter
            def autocommit(self, val):
                self.real.autocommit = val
            def cursor(self, *args, **kwargs):
                real_cursor = self.real.cursor(*args, **kwargs)
                class MockCursor:
                    def __init__(self, c):
                        self.c = c
                    def execute(self, query, vars=None):
                        if isinstance(query, str) and "notifications" in query:
                            raise psycopg2.DatabaseError("Simulated database failure during DSR Erase")
                        return self.c.execute(query, vars)
                    def fetchall(self):
                        return self.c.fetchall()
                    def fetchone(self):
                        return self.c.fetchone()
                    def close(self):
                        return self.c.close()
                    def __enter__(self):
                        return self
                    def __exit__(self, exc_type, exc_val, exc_tb):
                        self.close()
                return MockCursor(real_cursor)
            def commit(self):
                return self.real.commit()
            def rollback(self):
                return self.real.rollback()
            def close(self):
                return self.real.close()
        return MockConnection(real_conn)
        
    with patch("backend.db.get_db_connection", mock_get_db):
        resp = client.post("/api/auth/dsr/erase", headers=headers)
        
    # Erasure must fail (500)
    assert resp.status_code == 500
    
    # 4. Verify that NOTHING was deleted or anonymized (full rollback)
    cur.execute("SELECT first_name, email, is_active FROM users WHERE id = %s;", (user_id,))
    user_row = cur.fetchone()
    assert user_row is not None
    assert user_row[0] == "DSRAtom"
    assert user_row[1] == "dsr_atom_test@emirati.gov.ae"
    assert user_row[2] is True
    
    # Verify consents still exist
    cur.execute("SELECT COUNT(*) FROM consents WHERE user_id = %s;", (user_id,))
    assert cur.fetchone()[0] == 3
    
    # Clean up
    cur.execute("DELETE FROM consents WHERE user_id = %s;", (user_id,))
    cur.execute("DELETE FROM users WHERE id = %s;", (user_id,))
    conn.commit()
    conn.close()
