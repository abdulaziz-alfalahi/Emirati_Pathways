
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

def set_all_candidates_geolocation():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Set location to somewhere in Dubai (e.g., Downtown Dubai) for ALL users
        # Lat: 25.1972, Long: 55.2744
        USER_LAT = 25.1972
        USER_LONG = 55.2744

        print("Updating location for ALL users in user_cvs...")

        cur.execute("""
            UPDATE user_cvs 
            SET latitude = %s, longitude = %s 
            WHERE latitude IS NULL OR longitude IS NULL
        """, (USER_LAT, USER_LONG))
        
        count = cur.rowcount
        print(f"Updated {count} users with default Dubai location.")
        
        # Also force update just to be sure
        cur.execute("""
            UPDATE user_cvs 
            SET latitude = %s, longitude = %s
        """, (USER_LAT, USER_LONG))
        
        total_count = cur.rowcount
        print(f"Ensured all {total_count} users have location ({USER_LAT}, {USER_LONG})")

        conn.commit()
        conn.close()
        print("Done.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    set_all_candidates_geolocation()
