#!/usr/bin/env python3
"""
Check Job Descriptions in Database
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def check_db():
    print("="*50)
    print("CHECKING JOB_POSTINGS TABLE")
    print("="*50)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'job_postings'
            );
        """)
        exists = cur.fetchone()['exists']
        
        if not exists:
            print("[ERROR] Table 'job_postings' does NOT exist!")
            return

        # Get all rows
        cur.execute("SELECT id, jd_id, title, status, created_at FROM job_postings")
        rows = cur.fetchall()
        
        if not rows:
            print("[INFO] Table 'job_postings' is empty.")
        else:
            print(f"[INFO] Found {len(rows)} records:\n")
            print(f"{'ID':<5} {'JD_ID':<30} {'STATUS':<15} {'TITLE'}")
            print("-" * 80)
            for row in rows:
                print(f"{row['id']:<5} {row['jd_id']:<30} {row['status']:<15} {row['title']}")
                
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")

if __name__ == "__main__":
    check_db()

