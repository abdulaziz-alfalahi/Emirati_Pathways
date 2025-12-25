
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "emirati_secure_password")
DB_PORT = os.getenv("DB_PORT", "5432")

def fix_interview_data():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        # Determine target recruiter ID (Omar)
        target_recruiter_id = '45' 
        
        print(f"Updating interview_schedules to use recruiter_id = {target_recruiter_id}...")
        cur.execute("UPDATE interview_schedules SET recruiter_id = %s WHERE recruiter_id = 'recruiter_001'", (target_recruiter_id,))
        rows = cur.rowcount
        conn.commit()
        
        print(f"Updated {rows} interviews.")
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_interview_data()
