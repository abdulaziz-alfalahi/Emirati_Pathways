
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_users():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'emirati_user'),
            password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            port=int(os.getenv('DB_PORT', 5432))
        )
        cur = conn.cursor()
        
        users_to_check = ['zara.saeed@company.ae', 'omar.alrashid@company.ae', 'omar.alrashid@'] # varied emails just in case
        
        print("--- Checking Users ---")
        for email in users_to_check:
            # Check users table
            cur.execute("SELECT id, email, first_name, last_name FROM users WHERE email LIKE %s", (f"%{email.split('@')[0]}%",))
            users = cur.fetchall()
            for u in users:
                print(f"User: {u}")
                
                # Check hr_profiles schema
                cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'hr_profiles'")
                columns = [c[0] for c in cur.fetchall()]
                print(f"  -> hr_profiles columns: {columns}")

                # Select all from hr_profiles
                cur.execute("SELECT * FROM hr_profiles WHERE user_id = %s", (u[0],))
                profile = cur.fetchone()
                if profile:
                    # Create a dict from columns and profile
                    profile_dict = dict(zip(columns, profile))
                    print(f"  -> HR Profile: {profile_dict}")
                else:
                    print("  -> No HR Profile")

        print("\n--- Checking Job Postings for Omar (ID: 45) ---")
        cur.execute("SELECT id, title, company_id, recruiter_id, created_by FROM job_postings WHERE recruiter_id = '45' OR created_by = 45")
        jobs = cur.fetchall()
        for j in jobs:
            print(f"Job: {j}")

        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
