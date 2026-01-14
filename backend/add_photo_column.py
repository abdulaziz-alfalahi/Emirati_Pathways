import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def add_column():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        try:
            print("Attempting to add profile_photo_url column...")
            cur.execute("""
                ALTER TABLE candidate_profiles 
                ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
            """)
            print("✅ Column profile_photo_url added (or already exists).")
        except Exception as e:
            print(f"❌ Error adding column: {e}")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    add_column()
