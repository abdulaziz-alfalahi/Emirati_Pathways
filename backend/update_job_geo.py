
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def update_job_geolocation():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Default Dubai coordinates
        DUBAI_LAT = 25.2048
        DUBAI_LONG = 55.2708

        # Abu Dhabi coordinates
        AD_LAT = 24.4539
        AD_LONG = 54.3773

        print("Updating jobs with Dubai coordinates...")
        # Note the %% for literal % in psycopg2 queries
        cur.execute("""
            UPDATE job_postings 
            SET latitude = %s, longitude = %s 
            WHERE (latitude IS NULL OR longitude IS NULL) 
              AND (location ILIKE '%%Dubai%%' OR location ILIKE '%%UAE%%')
        """, (DUBAI_LAT, DUBAI_LONG))
        
        dubai_count = cur.rowcount
        print(f"Updated {dubai_count} jobs with Dubai coordinates.")

        print("Updating jobs with Abu Dhabi coordinates...")
        cur.execute("""
            UPDATE job_postings 
            SET latitude = %s, longitude = %s 
            WHERE (latitude IS NULL OR longitude IS NULL) 
              AND location ILIKE '%%Abu Dhabi%%'
        """, (AD_LAT, AD_LONG))

        ad_count = cur.rowcount
        print(f"Updated {ad_count} jobs with Abu Dhabi coordinates.")
        
        # Update any remaining jobs with Dubai as default
        cur.execute("""
            UPDATE job_postings 
            SET latitude = %s, longitude = %s 
            WHERE latitude IS NULL OR longitude IS NULL
        """, (DUBAI_LAT, DUBAI_LONG))
        
        remaining_count = cur.rowcount
        print(f"Updated {remaining_count} remaining jobs with default Dubai coordinates.")

        conn.commit()
        conn.close()
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_job_geolocation()
