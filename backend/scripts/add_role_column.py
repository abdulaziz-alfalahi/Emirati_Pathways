import os
import psycopg2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def migrate():
    """Add role column to conversation_participants table"""
    conn = None
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        conn.autocommit = False # Transactional
        
        with conn.cursor() as cur:
            # Check if column exists
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='conversation_participants' AND column_name='role';
            """)
            
            if cur.fetchone():
                logger.info("Column 'role' already exists in conversation_participants.")
            else:
                logger.info("Adding 'role' column to conversation_participants...")
                cur.execute("""
                    ALTER TABLE conversation_participants 
                    ADD COLUMN role VARCHAR(50);
                """)
                logger.info("Column added successfully.")
            
            conn.commit()
            logger.info("Migration completed successfully.")
            
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Migration failed: {e}")
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
