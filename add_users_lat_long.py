
import psycopg2
import os
import random
from dotenv import load_dotenv

load_dotenv(r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\.env')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

# Emirate rough coordinates for testing
EMIRATE_COORDS = {
    'Dubai': (25.2048, 55.2708),
    'Abu Dhabi': (24.4539, 54.3773),
    'Sharjah': (25.3463, 55.4209),
    'Ajman': (25.4052, 55.5136),
    'Umm Al Quwain': (25.5325, 55.5708),
    'Ras Al Khaimah': (25.8007, 55.9762),
    'Fujairah': (25.1288, 56.3265)
}

def migrate_users_table():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("Adding lat/long to users table...")
        
        # Add latitude
        try:
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION")
            print("Added latitude column.")
        except Exception as e:
            print(f"Error adding latitude: {e}")
            conn.rollback()
            
        # Add longitude
        try:
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION")
            print("Added longitude column.")
        except Exception as e:
            print(f"Error adding longitude: {e}")
            conn.rollback()
        
        conn.commit()
        
        # Update existing candidates with random offsets from their emirate
        print("Populating test data...")
        cur.execute("SELECT id, emirate FROM users WHERE role = 'candidate'")
        candidates = cur.fetchall()
        
        count = 0
        for cand_id, emirate in candidates:
            # Normalize emirate name
            base_coords = EMIRATE_COORDS.get('Dubai') # Default
            if emirate:
                for k, v in EMIRATE_COORDS.items():
                    if k.lower() in emirate.lower():
                        base_coords = v
                        break
            
            # Add small random offset (approx 0-10km)
            # 0.01 deg is approx 1.1km
            lat_offset = random.uniform(-0.1, 0.1)
            lon_offset = random.uniform(-0.1, 0.1)
            
            new_lat = base_coords[0] + lat_offset
            new_lon = base_coords[1] + lon_offset
            
            cur.execute("UPDATE users SET latitude = %s, longitude = %s WHERE id = %s", 
                        (new_lat, new_lon, cand_id))
            count += 1
            
        conn.commit()
        cur.close()
        conn.close()
        print(f"Migration complete. Updated {count} candidates.")
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate_users_table()
