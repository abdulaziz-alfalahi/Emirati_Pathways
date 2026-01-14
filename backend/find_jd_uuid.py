
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "emirati_journey"),
    "user": os.getenv("DB_USER", "emirati_user"),
    "password": os.getenv("DB_PASSWORD", "emirati_secure_password"),
}

def find_jd_uuid():
    target_uuid = "e8209c95-3c10-416a-afc9-15a38c374d33"
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        print(f"--- Searching for JD UUID: {target_uuid} ---")
        
        # Check jd_id column
        cur.execute("SELECT * FROM job_postings WHERE jd_id = %s", (target_uuid,))
        match = cur.fetchone()
        if match:
             print("Found in jd_id:", dict(match))
        else:
             print("NOT Found in jd_id")

        # Check if any id (int) somehow matches? Unlikely.
        
        # Check if it exists in recruiter_vacancies?
        try:
            cur.execute("SELECT * FROM recruiter_vacancies WHERE id = %s", (target_uuid,))
            match_vac = cur.fetchone()
            if match_vac:
                print("Found in recruiter_vacancies:", dict(match_vac))
            else:
                print("NOT Found in recruiter_vacancies")
        except Exception as e:
            print("recruiter_vacancies check failed:", e)

    except Exception as e:
        print("Error:", e)
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    find_jd_uuid()
