
import psycopg2
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def migrate_db():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("Checking for latitude/longitude columns...")
        
        # Add latitude
        try:
            cur.execute("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION")
            print("Added latitude column.")
        except Exception as e:
            print(f"Error adding latitude: {e}")
            conn.rollback()
            
        # Add longitude
        try:
            cur.execute("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION")
            print("Added longitude column.")
        except Exception as e:
            print(f"Error adding longitude: {e}")
            conn.rollback()

        conn.commit()
        cur.close()
        conn.close()
        print("Migration complete.")
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate_db()
