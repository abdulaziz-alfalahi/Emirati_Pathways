
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_all_jobs():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'emirati_user'),
            password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            port=int(os.getenv('DB_PORT', 5432))
        )
        cur = conn.cursor()
        
        print("--- Updating Jobs ---")
        
        # Target Company (Zara's): 7e5edea0-ea73-436c-b7ed-f47cfe57423a
        target_company = '7e5edea0-ea73-436c-b7ed-f47cfe57423a'
        target_recruiter = '45' # Omar

        # 1. Update Senior Python Developer
        cur.execute("SELECT id FROM job_postings WHERE title ILIKE '%Senior Python Developer%' LIMIT 1")
        row = cur.fetchone()
        if row:
            print(f"Updating Senior Python Developer (ID: {row[0]})")
            cur.execute("UPDATE job_postings SET company_id = %s, recruiter_id = %s WHERE id = %s", (target_company, target_recruiter, row[0]))
        
        # 2. Update Marketing Specialist
        cur.execute("SELECT id FROM job_postings WHERE title ILIKE '%Marketing Specialist%' LIMIT 1")
        row = cur.fetchone()
        if row:
            print(f"Updating Marketing Specialist (ID: {row[0]})")
            cur.execute("UPDATE job_postings SET company_id = %s, recruiter_id = %s WHERE id = %s", (target_company, target_recruiter, row[0]))

        # 3. Update HR Coordinator
        cur.execute("SELECT id FROM job_postings WHERE title ILIKE '%HR Coordinator%' LIMIT 1")
        row = cur.fetchone()
        if row:
            print(f"Updating HR Coordinator (ID: {row[0]})")
            cur.execute("UPDATE job_postings SET company_id = %s, recruiter_id = %s WHERE id = %s", (target_company, target_recruiter, row[0]))

        conn.commit()
        print("Update complete.")
            
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_all_jobs()
