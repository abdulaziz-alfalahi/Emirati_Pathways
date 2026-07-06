#!/usr/bin/env python3
"""
Scheduled retention purge script.
Purges or anonymizes audit logs and records past AUDIT_RETENTION_DAYS = 2555 days (7 years).
Requirements (F3):
- Runs under a dedicated maintenance DB role (DB_MAINT_USER) to protect append-only constraints.
- Exports/archives expired admin_audit_log rows to signed NDJSON before deletion.
- Supports a --dry-run flag that reports per-table counts and the archive location.
"""

import os
import sys
import argparse
import logging
import json
import hmac
import hashlib
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Ensure parent directory is on path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('retention_purge')

# Load environment variables
load_dotenv('backend/.env')

AUDIT_RETENTION_DAYS = 2555

# ==============================================================================
# H2 SECURITY NOTE & OPERATIONAL REQUIREMENT:
# This script uses the DELETE path to remove expired rows from the append-only
# table 'admin_audit_log'.
# To bypass the append-only triggers, it temporarily disables them via:
#   ALTER TABLE admin_audit_log DISABLE TRIGGER ...
#
# Because disabling triggers requires table ownership or superuser privileges
# in PostgreSQL, the configured DB_MAINT_USER MUST be granted ownership of the
# 'admin_audit_log' table:
#   ALTER TABLE admin_audit_log OWNER TO <DB_MAINT_USER>;
#
# RESTRICTION: This script must ONLY be executed as a controlled automation
# task (e.g. system cron job) running under this dedicated maintenance role,
# and NOT by the regular web application connection pool (emirati_app).
# ==============================================================================

def get_maint_connection():
    """Establish connection using dedicated maintenance DB credentials."""
    # Explicitly require maintenance environment variables; no default app fallbacks.
    maint_user = os.environ.get('DB_MAINT_USER')
    maint_password = os.environ.get('DB_MAINT_PASSWORD')
    
    if not maint_user or not maint_password:
        logger.error("Database maintenance credentials (DB_MAINT_USER / DB_MAINT_PASSWORD) are not set in the environment.")
        raise KeyError("Missing required DB_MAINT_USER or DB_MAINT_PASSWORD environment variables.")
        
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'emirati_journey'),
        'user': maint_user,
        'password': maint_password
    }
    logger.info(f"Connecting to database as maintenance role: {db_config['user']}")
    return psycopg2.connect(**db_config)

def sign_data(data_str: str) -> str:
    """Compute HMAC-SHA256 signature for the archived data string using dedicated signing key."""
    secret_key = os.environ.get('AUDIT_ARCHIVE_SIGNING_KEY')
    if not secret_key:
        logger.error("Audit archive signing key (AUDIT_ARCHIVE_SIGNING_KEY) is not set in the environment.")
        raise KeyError("Missing required AUDIT_ARCHIVE_SIGNING_KEY environment variable.")
    return hmac.new(secret_key.encode('utf-8'), data_str.encode('utf-8'), hashlib.sha256).hexdigest()

def run_purge(dry_run=False):
    # Validate environment variables first to fail closed immediately (H1)
    if not os.environ.get('AUDIT_ARCHIVE_SIGNING_KEY'):
        logger.error("Audit archive signing key (AUDIT_ARCHIVE_SIGNING_KEY) is not set in the environment.")
        raise KeyError("Missing required AUDIT_ARCHIVE_SIGNING_KEY environment variable.")

    logger.info(f"Starting retention purge process (dry_run={dry_run})...")
    cutoff_date = datetime.utcnow() - timedelta(days=AUDIT_RETENTION_DAYS)
    logger.info(f"Retention threshold date (7 years): {cutoff_date.isoformat()}")
    
    conn = get_maint_connection()
    conn.autocommit = False
    try:
        # Use RealDictCursor to safely read rows as dicts for archiving
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            
            # List of tables to purge with standard datetime check
            tables_to_purge = [
                'user_activity_log',
                'user_sessions',
                'notifications',
                'messages',
                'user_journey_analytics'
            ]
            
            # 1. Count/Purge standard logs
            for table in tables_to_purge:
                try:
                    cur.execute(f"SELECT COUNT(*) as count FROM {table} WHERE created_at < %s;", (cutoff_date,))
                    row = cur.fetchone()
                    count = row['count'] if row else 0
                    
                    if dry_run:
                        logger.info(f"[DRY-RUN] Table {table}: {count} expired rows would be deleted.")
                    else:
                        if count > 0:
                            cur.execute(f"DELETE FROM {table} WHERE created_at < %s;", (cutoff_date,))
                            logger.info(f"Purged {count} rows from {table}")
                        else:
                            logger.info(f"No expired rows to purge in {table}")
                except Exception as e:
                    conn.rollback()
                    logger.warning(f"Error checking/purging {table}: {e}")
            
            # 2. Count expired admin_audit_log rows
            cur.execute("SELECT COUNT(*) as count FROM admin_audit_log WHERE created_at < %s;", (cutoff_date,))
            audit_row = cur.fetchone()
            expired_audit_count = audit_row['count'] if audit_row else 0
            
            if expired_audit_count > 0:
                # Retrieve expired rows for archiving
                cur.execute("SELECT * FROM admin_audit_log WHERE created_at < %s ORDER BY created_at ASC;", (cutoff_date,))
                expired_rows = cur.fetchall()
                
                # Format to NDJSON (JSON lines)
                # Handle datetime serialization cleanly
                def default_serializer(obj):
                    if isinstance(obj, datetime):
                        return obj.isoformat()
                    return str(obj)
                    
                ndjson_lines = [json.dumps(dict(row), default=default_serializer) for row in expired_rows]
                ndjson_content = "\n".join(ndjson_lines) + "\n"
                
                # Establish archive directory and paths
                archive_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'archives'))
                os.makedirs(archive_dir, exist_ok=True)
                
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                archive_filename = f"audit_archive_{timestamp}.jsonl"
                archive_path = os.path.join(archive_dir, archive_filename)
                signature_path = archive_path + ".sig"
                
                if dry_run:
                    logger.info(f"[DRY-RUN] admin_audit_log: {expired_audit_count} expired rows would be archived to: {archive_path}")
                    logger.info(f"[DRY-RUN] Signature file would be written to: {signature_path}")
                else:
                    # Write NDJSON archive
                    with open(archive_path, 'w', encoding='utf-8') as f:
                        f.write(ndjson_content)
                    
                    # Compute and write HMAC signature
                    sig = sign_data(ndjson_content)
                    with open(signature_path, 'w', encoding='utf-8') as f:
                        f.write(sig)
                        
                    logger.info(f"Successfully archived {expired_audit_count} admin_audit_log rows to: {archive_path}")
                    logger.info(f"Signed archive with HMAC-SHA256 signature stored at: {signature_path}")
                    
                    # Now physically delete them (requires disabling triggers)
                    try:
                        logger.info("Disabling update/delete triggers on admin_audit_log...")
                        cur.execute("ALTER TABLE admin_audit_log DISABLE TRIGGER trg_admin_audit_log_no_delete;")
                        cur.execute("ALTER TABLE admin_audit_log DISABLE TRIGGER trg_admin_audit_log_no_update;")
                        
                        cur.execute("DELETE FROM admin_audit_log WHERE created_at < %s;", (cutoff_date,))
                        logger.info(f"Purged {cur.rowcount} rows from admin_audit_log")
                        
                    except Exception as e:
                        conn.rollback()
                        logger.error(f"Error deleting from admin_audit_log: {e}")
                        raise e
                    finally:
                        # Always ensure triggers are re-enabled
                        logger.info("Re-enabling update/delete triggers on admin_audit_log...")
                        try:
                            cur.execute("ALTER TABLE admin_audit_log ENABLE TRIGGER trg_admin_audit_log_no_delete;")
                            cur.execute("ALTER TABLE admin_audit_log ENABLE TRIGGER trg_admin_audit_log_no_update;")
                        except Exception as trigger_err:
                            logger.critical(f"FATAL: Failed to re-enable triggers on admin_audit_log: {trigger_err}")
                            conn.rollback()
                            raise trigger_err
            else:
                logger.info("No expired rows to purge in admin_audit_log.")
                
        if not dry_run:
            conn.commit()
            logger.info("Retention purge process completed successfully.")
        else:
            logger.info("Dry-run completed successfully. No changes were written to the database.")
            
    except Exception as err:
        conn.rollback()
        logger.error(f"Retention purge failed: {err}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Emirati Pathways Database Retention Purging Utility")
    parser.add_argument('--dry-run', action='store_true', help="Count and report expired rows without deleting them")
    args = parser.parse_args()
    run_purge(dry_run=args.dry_run)
