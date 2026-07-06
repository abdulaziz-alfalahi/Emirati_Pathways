#!/usr/bin/env python3
"""
Scheduled retention purge script.
Purges or anonymizes audit logs and records past AUDIT_RETENTION_DAYS = 2555 days.
"""

import os
import sys
import logging
from datetime import datetime, timedelta
import psycopg2
from dotenv import load_dotenv

# Ensure parent directory is on path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('retention_purge')

# Load environment variables
load_dotenv('backend/.env')

AUDIT_RETENTION_DAYS = 2555

def get_db_connection():
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'emirati_journey'),
        'user': os.getenv('DB_USER', 'emirati_user'),
        'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
    }
    return psycopg2.connect(**db_config)

def run_purge():
    logger.info("Starting retention purge process...")
    cutoff_date = datetime.utcnow() - timedelta(days=AUDIT_RETENTION_DAYS)
    logger.info(f"Retention threshold date: {cutoff_date.isoformat()}")
    
    conn = get_db_connection()
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            # 1. Purge user_activity_log
            try:
                cur.execute("DELETE FROM user_activity_log WHERE created_at < %s;", (cutoff_date,))
                logger.info(f"Purged {cur.rowcount} rows from user_activity_log")
            except Exception as e:
                conn.rollback()
                logger.warning(f"Skipped purging user_activity_log: {e}")
                
            # 2. Purge user_sessions
            try:
                cur.execute("DELETE FROM user_sessions WHERE created_at < %s;", (cutoff_date,))
                logger.info(f"Purged {cur.rowcount} rows from user_sessions")
            except Exception as e:
                conn.rollback()
                logger.warning(f"Skipped purging user_sessions: {e}")
                
            # 3. Purge notifications
            try:
                cur.execute("DELETE FROM notifications WHERE created_at < %s;", (cutoff_date,))
                logger.info(f"Purged {cur.rowcount} rows from notifications")
            except Exception as e:
                conn.rollback()
                logger.warning(f"Skipped purging notifications: {e}")
                
            # 4. Purge messages
            try:
                cur.execute("DELETE FROM messages WHERE created_at < %s;", (cutoff_date,))
                logger.info(f"Purged {cur.rowcount} rows from messages")
            except Exception as e:
                conn.rollback()
                logger.warning(f"Skipped purging messages: {e}")

            # 5. Purge user_journey_analytics
            try:
                cur.execute("DELETE FROM user_journey_analytics WHERE created_at < %s;", (cutoff_date,))
                logger.info(f"Purged {cur.rowcount} rows from user_journey_analytics")
            except Exception as e:
                conn.rollback()
                logger.warning(f"Skipped purging user_journey_analytics: {e}")
                
            # 6. Purge admin_audit_log (Requires disabling triggers)
            try:
                logger.info("Disabling update/delete triggers on admin_audit_log...")
                cur.execute("ALTER TABLE admin_audit_log DISABLE TRIGGER trg_admin_audit_log_no_delete;")
                cur.execute("ALTER TABLE admin_audit_log DISABLE TRIGGER trg_admin_audit_log_no_update;")
                
                cur.execute("DELETE FROM admin_audit_log WHERE created_at < %s;", (cutoff_date,))
                deleted_audit_count = cur.rowcount
                logger.info(f"Purged {deleted_audit_count} rows from admin_audit_log")
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Error purging admin_audit_log: {e}")
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
            
        conn.commit()
        logger.info("Retention purge process completed successfully.")
        
    except Exception as err:
        conn.rollback()
        logger.error(f"Retention purge failed: {err}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    run_purge()
