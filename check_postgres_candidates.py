import psycopg2
import os
import sys

def check_postgres_candidates():
    # Config from jd_routes.py
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'database': os.getenv('DB_NAME', 'emirati_journey'),
        'user': os.getenv('DB_USER', 'emirati_user'),
        'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
    }
    
    print(f"Attempting to connect to Postgres with: {DB_CONFIG['user']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("SELECT count(*) FROM users WHERE role = 'candidate'")
        count = cursor.fetchone()[0]
        print(f"Total candidates found: {count}")
        
        if count > 0:
            cursor.execute("SELECT id, first_name, last_name, email FROM users WHERE role = 'candidate' LIMIT 5")
            candidates = cursor.fetchall()
            print("\nSample Candidates:")
            for c in candidates:
                print(f"ID: {c[0]}, Name: {c[1]} {c[2]}, Email: {c[3]}")
        
        # Check job_postings table
        cursor.execute("SELECT count(*) FROM job_postings")
        job_count = cursor.fetchone()[0]
        print(f"\nTotal job postings found: {job_count}")
        
        if job_count > 0:
            cursor.execute("SELECT jd_id, title, status FROM job_postings LIMIT 5")
            jobs = cursor.fetchall()
            print("\nSample Jobs:")
            for j in jobs:
                print(f"JD ID: {j[0]}, Title: {j[1]}, Status: {j[2]}")
        
        conn.close()
        print("Connection successful.")
    except Exception as e:
        print(f"Error connecting/querying Postgres: {e}")

if __name__ == "__main__":
    check_postgres_candidates()
