import psycopg2
import psycopg2.extras
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def check_alignment():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("--- USERS & COMPANIES ---")
        cursor.execute("""
            SELECT u.id, u.email, u.role, p.company_id
            FROM users u
            LEFT JOIN hr_profiles p ON u.id = p.user_id
            WHERE u.role IN ('hr_manager', 'recruiter')
            ORDER BY u.id
        """)
        users = cursor.fetchall()
        for u in users:
            print(f"User: {u['id']} ({u['role']}) - {u['email']}")
            print(f"  Company: {u['company_id']}")
            
        print("\n--- JOB POSTINGS ---")
        cursor.execute("""
            SELECT j.id, j.title, j.created_by, j.company_id, u.email as creator_email
            FROM job_postings j
            LEFT JOIN users u ON j.created_by = u.id
            ORDER BY j.created_at DESC
            LIMIT 10
        """)
        jobs = cursor.fetchall()
        for j in jobs:
            print(f"Job: {j['id']} - {j['title']}")
            print(f"  Creator: {j['created_by']} ({j['creator_email']})")
            print(f"  Company: {j['company_id']}")

        # specific check for user 47 matches
        hr_user = next((u for u in users if u['id'] == 47), None)
        if hr_user:
            hr_company = hr_user['company_id']
            print(f"\nHR Manager (47) Company: {hr_company}")
            matching_jobs = [j for j in jobs if str(j['company_id']) == str(hr_company)]
            print(f"Matching Jobs Count (in top 10): {len(matching_jobs)}")
        else:
            print("\n❌ User 47 not found in query results!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    check_alignment()
