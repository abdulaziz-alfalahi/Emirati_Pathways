import psycopg2
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_ats_score_column():
    """Add ats_score column to candidate_profiles table"""
    conn = None
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='emirati_journey',
            user='emirati_user',
            password='emirati_secure_password'
        )
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='candidate_profiles' AND column_name='ats_score'
        """)
        
        if cursor.fetchone():
            logger.info("✅ 'ats_score' column already exists.")
        else:
            logger.info("➕ Adding 'ats_score' column...")
            cursor.execute("""
                ALTER TABLE candidate_profiles 
                ADD COLUMN ats_score INTEGER DEFAULT 0;
            """)
            conn.commit()
            logger.info("✅ 'ats_score' column added successfully.")
            
    except Exception as e:
        logger.error(f"❌ Database migration failed: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_ats_score_column()
