#!/usr/bin/env python3
"""
Update JD Status to Published
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def publish_latest_jd():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Get latest JD
        cur.execute("SELECT jd_id, title FROM job_postings ORDER BY created_at DESC LIMIT 1")
        latest = cur.fetchone()
        
        if not latest:
            print("No JDs found to update.")
            return

        jd_id, title = latest
        print(f"Updating JD: {jd_id} ({title})")
        
        # Update status
        cur.execute(
            "UPDATE job_postings SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE jd_id = %s",
            (jd_id,)
        )
        conn.commit()
        
        print("✅ Successfully updated status to 'published'")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    publish_latest_jd()

