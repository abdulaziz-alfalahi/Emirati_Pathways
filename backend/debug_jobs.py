
import os
import psycopg2
import psycopg2.extras

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def check_db():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("--- Checking User '3' (Omar) ---")
        cursor.execute("SELECT * FROM users WHERE id = '3'")
        user = cursor.fetchone()
        print(f"User found: {user}")

        print("\n--- Checking HR Profile for User '3' ---")
        cursor.execute("SELECT * FROM hr_profiles WHERE user_id = '3'")
        profile = cursor.fetchone()
        print(f"HR Profile found: {profile}")
        
        print("\n--- Checking Job Postings (Created by '3') ---")
        cursor.execute("SELECT id, title, status FROM job_postings WHERE created_by = '3'")
        jobs = cursor.fetchall()
        print(f"Jobs created by user: {len(jobs)}")
        for j in jobs:
            print(f" - {j['title']} ({j['status']})")
            
        print("\n--- Checking All Job Postings (Active) ---")
        cursor.execute("SELECT id, title, company_id, created_by FROM job_postings WHERE status = 'active' LIMIT 5")
        all_jobs = cursor.fetchall()
        print(f"Total Active Jobs (Sample): {len(all_jobs)}")
        for j in all_jobs:
            print(f" - {j['title']} (Company: {j['company_id']}, CreatedBy: {j['created_by']})")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
