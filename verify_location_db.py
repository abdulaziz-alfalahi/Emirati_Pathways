
import psycopg2
import psycopg2.extras
import os
import json

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def check_lat_long():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get the most recent job posting
        cur.execute("""
            SELECT jd_id, title, city, latitude, longitude 
            FROM job_postings 
            WHERE title = 'Location Test Job'
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        
        job = cur.fetchone()
        
        if job:
            print("Most Recent Job:")
            print(f"ID: {job['jd_id']}")
            print(f"Title: {job['title']}")
            print(f"City: {job['city']}")
            print(f"Latitude: {job['latitude']}")
            print(f"Longitude: {job['longitude']}")
            
            if job['latitude'] is not None and job['longitude'] is not None:
                print("\nSUCCESS: Coordinates saved.")
            else:
                print("\nFAILURE: Coordinates are NULL.")
        else:
            print("No jobs found.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_lat_long()
