#!/usr/bin/env python3
"""
Update JD Status to Published
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def publish_jd():
    print("="*50)
    print("UPDATING JD STATUS")
    print("="*50)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        target_id = 'jd_20251120_001338_2bd9127c'
        
        cur.execute("""
            UPDATE job_postings 
            SET status = 'published', published_at = CURRENT_TIMESTAMP 
            WHERE jd_id = %s
        """, (target_id,))
        
        if cur.rowcount > 0:
            print(f"[SUCCESS] Updated {target_id} to 'published'")
            conn.commit()
        else:
            print(f"[ERROR] JD {target_id} not found")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] Database update failed: {e}")

if __name__ == "__main__":
    publish_jd()


