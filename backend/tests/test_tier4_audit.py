import os
import pytest
import psycopg2
import hmac
import hashlib
import json
import glob
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv('backend/.env')

from backend.db import get_db_connection
from backend.admin_api_endpoints import log_admin_action, app as admin_app
from backend.scripts.retention_purge import run_purge

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

def test_retention_purge_fail_closed_on_missing_env(monkeypatch):
    """Verify that retention purge aborts and raises KeyError if any required maintenance credentials or key are missing (H1)."""
    # 1. Missing DB_MAINT_USER
    monkeypatch.delenv("DB_MAINT_USER", raising=False)
    monkeypatch.setenv("DB_MAINT_PASSWORD", "some-password")
    monkeypatch.setenv("AUDIT_ARCHIVE_SIGNING_KEY", "some-key")
    with pytest.raises(KeyError) as excinfo:
        run_purge(dry_run=True)
    assert "DB_MAINT_USER" in str(excinfo.value)

    # 2. Missing DB_MAINT_PASSWORD
    monkeypatch.setenv("DB_MAINT_USER", "some-user")
    monkeypatch.delenv("DB_MAINT_PASSWORD", raising=False)
    monkeypatch.setenv("AUDIT_ARCHIVE_SIGNING_KEY", "some-key")
    with pytest.raises(KeyError) as excinfo:
        run_purge(dry_run=True)
    assert "DB_MAINT_PASSWORD" in str(excinfo.value)

    # 3. Missing AUDIT_ARCHIVE_SIGNING_KEY
    monkeypatch.setenv("DB_MAINT_USER", "some-user")
    monkeypatch.setenv("DB_MAINT_PASSWORD", "some-password")
    monkeypatch.delenv("AUDIT_ARCHIVE_SIGNING_KEY", raising=False)
    with pytest.raises(KeyError) as excinfo:
        run_purge(dry_run=True)
    assert "AUDIT_ARCHIVE_SIGNING_KEY" in str(excinfo.value)

def test_retention_purge_e2e(monkeypatch):
    """Verify the archive-then-delete purge path (H3)."""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Create a dummy user first to ensure foreign key constraint is satisfied
    user_id = '784000000000099'
    cur.execute("DELETE FROM admin_audit_log WHERE user_id = %s;", (user_id,))
    cur.execute("DELETE FROM users WHERE id = %s;", (user_id,))
    conn.commit()
    
    cur.execute("""
        INSERT INTO users (id, email, first_name, last_name, phone, emirate, password_hash, role)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
    """, (user_id, 'maint_test@emirati.gov.ae', 'Maint', 'Test', '971501112229', 'Dubai', 'pbkdf2:sha256:dummy_hash', 'candidate'))
    conn.commit()
    
    # 2. Seed an expired audit log row
    expired_date = datetime.utcnow() - timedelta(days=2560)
    cur.execute("""
        INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
    """, (
        user_id, 'Expired Action Test', 'system', 'sys-001', 
        json.dumps({'message': 'This should be archived and deleted'}), 
        '10.10.10.10', 'Expired Agent', expired_date
    ))
    seeded_id = cur.fetchone()[0]
    conn.commit()
    
    # Configure test env vars to run purge (mock maint user to be current test user who has trigger rights)
    test_signing_key = "pytest-maint-signing-key-1234"
    monkeypatch.setenv("DB_MAINT_USER", os.getenv("DB_USER"))
    monkeypatch.setenv("DB_MAINT_PASSWORD", os.getenv("DB_PASSWORD"))
    monkeypatch.setenv("AUDIT_ARCHIVE_SIGNING_KEY", test_signing_key)
    
    # Keep track of archive dir files before run
    archive_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'archives'))
    pre_files = set(glob.glob(os.path.join(archive_dir, "audit_archive_*.jsonl*")))
    
    try:
        # 3. Run the purge (non-dry-run)
        run_purge(dry_run=False)
        
        # 4. Verify the row is deleted
        cur.execute("SELECT COUNT(*) FROM admin_audit_log WHERE id = %s;", (seeded_id,))
        assert cur.fetchone()[0] == 0
        
        # 5. Find the newly created archive and signature files
        post_files = set(glob.glob(os.path.join(archive_dir, "audit_archive_*.jsonl*")))
        new_files = post_files - pre_files
        assert len(new_files) >= 2  # one .jsonl, one .jsonl.sig
        
        jsonl_path = [f for f in new_files if f.endswith('.jsonl')][0]
        sig_path = jsonl_path + '.sig'
        
        # Verify JSONL content contains our seeded data
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        found = False
        for line in lines:
            if not line.strip():
                continue
            data = json.loads(line)
            if data.get('action') == 'Expired Action Test':
                found = True
                assert data.get('ip_address') == '10.10.10.10'
                assert data.get('user_agent') == 'Expired Agent'
        assert found is True
        
        # 6. Verify the HMAC signature validates correctly using the signing key
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            archive_content = f.read()
        with open(sig_path, 'r', encoding='utf-8') as f:
            sig_content = f.read().strip()
            
        expected_sig = hmac.new(
            test_signing_key.encode('utf-8'), 
            archive_content.encode('utf-8'), 
            hashlib.sha256
        ).hexdigest()
        assert sig_content == expected_sig
        
        # 7. Verify that triggers are back on (UPDATE / DELETE still raises Exception)
        # Seed another fresh row (not expired)
        cur.execute("""
            INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
        """, (
            user_id, 'Fresh Action Test', 'system', 'sys-002', 
            json.dumps({'message': 'This is fresh'}), '127.0.0.1', 'Agent'
        ))
        fresh_id = cur.fetchone()[0]
        conn.commit()
        
        try:
            cur.execute("DELETE FROM admin_audit_log WHERE id = %s;", (fresh_id,))
            conn.commit()
            pytest.fail("DELETE should have failed because triggers should be re-enabled!")
        except Exception as e:
            conn.rollback()
            assert "append-only" in str(e)
            
        # Clean up fresh_id safely by using manual trigger bypass (mimicking purge script logic)
        cur.execute("ALTER TABLE admin_audit_log DISABLE TRIGGER trg_admin_audit_log_no_delete;")
        cur.execute("DELETE FROM admin_audit_log WHERE id = %s;", (fresh_id,))
        cur.execute("ALTER TABLE admin_audit_log ENABLE TRIGGER trg_admin_audit_log_no_delete;")
        conn.commit()
        
    finally:
        # Clean up seeded row and dummy user safely
        try:
            cur.execute("ALTER TABLE admin_audit_log DISABLE TRIGGER trg_admin_audit_log_no_delete;")
            cur.execute("DELETE FROM admin_audit_log WHERE user_id = %s;", (user_id,))
            cur.execute("ALTER TABLE admin_audit_log ENABLE TRIGGER trg_admin_audit_log_no_delete;")
            cur.execute("DELETE FROM users WHERE id = %s;", (user_id,))
            conn.commit()
        except Exception:
            conn.rollback()
            
        conn.close()
        
        # Clean up created files
        for f in new_files:
            try:
                os.remove(f)
            except Exception:
                pass
