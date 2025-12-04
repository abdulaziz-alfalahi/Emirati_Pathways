
import os
import psycopg2
import json

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Find JD by title
    cur.execute("SELECT jd_id FROM job_postings WHERE title LIKE '%Chiefe%' OR title LIKE '%Chief%' LIMIT 1")
    row = cur.fetchone()
    if row:
        print(f"JD_ID_FOUND: {row[0]}")
    else:
        print("JD_ID_NOT_FOUND")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
