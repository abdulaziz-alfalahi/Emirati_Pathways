
import psycopg2
import psycopg2.extras
import os
import json

# DB Config (matching unified_server.py defaults)
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def check_jobs():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("🔍 Checking Users (Zara Saeed)...")
        cursor.execute("SELECT id, email, role FROM users WHERE email LIKE '%zara%'")
        users = cursor.fetchall()
        for u in users:
            print(f"User: {u['email']} (ID: {u['id']}, Role: {u['role']})")
            
            # Check Company Profile
            cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (u['id'],))
            profile = cursor.fetchone()
            company_id = profile['company_id'] if profile else None
            print(f"  -> Company ID: {company_id}")
            
            # Check Jobs by Company OR Created By
            print("  -> Jobs Query Result:")
            query = """
                SELECT id, title, company_id, created_by, status 
                FROM job_postings 
                WHERE created_by = %s
            """
            params = [u['id']]
            
            if company_id:
                query += " OR company_id = %s"
                params.append(company_id)
                
            cursor.execute(query, params)
            jobs = cursor.fetchall()
            
            if not jobs:
                print("     ❌ NO JOBS FOUND")
            else:
                for j in jobs:
                    print(f"     ✅ Job: {j['title']} (ID: {j['id']}, Status: {j['status']})")

    except Exception as e:
        print(f"❌ Database Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    check_jobs()
