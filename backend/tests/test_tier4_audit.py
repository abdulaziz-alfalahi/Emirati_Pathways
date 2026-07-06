import os
import pytest
import psycopg2
from dotenv import load_dotenv
load_dotenv('backend/.env')

from backend.db import get_db_connection
from backend.admin_api_endpoints import log_admin_action, app as admin_app

def test_audit_log_append_only_trigger():
    """Verify that UPDATE and DELETE on admin_audit_log are rejected by the database trigger."""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Try to UPDATE
    try:
        cur.execute("UPDATE admin_audit_log SET action = 'tamper' WHERE id = 1;")
        conn.commit()
        pytest.fail("UPDATE on admin_audit_log should have been rejected!")
    except Exception as e:
        conn.rollback()
        assert "append-only" in str(e) or "insufficient_privilege" in str(e)

    # Try to DELETE
    try:
        cur.execute("DELETE FROM admin_audit_log WHERE id = 1;")
        conn.commit()
        pytest.fail("DELETE on admin_audit_log should have been rejected!")
    except Exception as e:
        conn.rollback()
        assert "append-only" in str(e) or "insufficient_privilege" in str(e)
        
    conn.close()

def test_log_admin_action_db_write():
    """Verify that log_admin_action successfully inserts exactly one row in the DB."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM admin_audit_log;")
    before_count = cur.fetchone()[0]
    
    # We need a request context since log_admin_action accesses request.remote_addr and headers
    with admin_app.test_request_context(
        environ_base={'REMOTE_ADDR': '127.0.0.1'},
        headers={'User-Agent': 'pytest-agent'}
    ):
        # Mock admin_user attribute on request
        from flask import request
        request.admin_user = {'email': 'test-admin@emirati.gov.ae', 'roles': ['platform_administrator']}
        log_admin_action('Pytest Action', 'groq-llama4', 'Verification details')
        
    cur.execute("SELECT COUNT(*) FROM admin_audit_log;")
    after_count = cur.fetchone()[0]
    
    assert after_count == before_count + 1
    
    # Check the written values
    cur.execute("""
        SELECT action, resource_id, details, ip_address, user_agent 
        FROM admin_audit_log 
        ORDER BY id DESC LIMIT 1;
    """)
    row = cur.fetchone()
    assert row[0] == 'Pytest Action'
    assert row[1] == 'groq-llama4'
    assert row[2]['details_message'] == 'Verification details'
    assert row[3] == '127.0.0.1'
    assert row[4] == 'pytest-agent'
    
    conn.close()
