
import os
import psycopg2
from dotenv import load_dotenv

# Load env from .env file in the same directory
load_dotenv('.env')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def check_table():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print(f"Connected to {DB_CONFIG['database']} on {DB_CONFIG['host']}")
        
        # Check if table exists
        cur.execute("SELECT to_regclass('public.job_applications');")
        exists = cur.fetchone()[0]
        
        if not exists:
            print("❌ Table 'job_applications' DOES NOT EXIST!")
            return
            
        print("✅ Table 'job_applications' exists.")
        
        # Check columns
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_applications';
        """)
        columns = cur.fetchall()
        print("\nColumns:")
        for col in columns:
            print(f" - {col[0]} ({col[1]})")

        # Try Mock Insert
        print("\nAttempting Mock Insert...")
        try:
            import uuid
            app_id = f"TEST-{uuid.uuid4().hex[:8]}"
            cur.execute("""
                INSERT INTO job_applications (
                    id, job_id, candidate_id, cover_letter, status, submitted_at, last_updated
                ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """, (app_id, 'JOB-TEST', 'USER-TEST', 'Test letter', 'submitted'))
            # conn.commit() # Don't commit, just check if it runs without error
            conn.rollback()
            print("✅ Mock Insert Succeeded (Rolled back)")
        except Exception as insert_err:
            print(f"❌ Mock Insert FAILED: {insert_err}")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    check_table()
