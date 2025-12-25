
import psycopg2
import psycopg2.extras
import os
import datetime

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def check_shortlist():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("Checking contents of job_shortlists table...")
        
        # Check if table exists first
        cursor.execute("SELECT to_regclass('public.job_shortlists') as exists")
        if not cursor.fetchone()['exists']:
            print("❌ Table job_shortlists does not exist.")
            return

        cursor.execute("SELECT * FROM job_shortlists ORDER BY created_at DESC")
        rows = cursor.fetchall()
        
        if not rows:
            print("⚠️ Table is empty.")
        else:
            print(f"✅ Found {len(rows)} entries:")
            for r in rows:
                print(f" - Job {r.get('job_posting_id')} | Candidate {r.get('candidate_id')} | Note: {r.get('notes')} | Created: {r.get('created_at')}")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    check_shortlist()
