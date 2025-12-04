import psycopg2
import os

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def count_candidates():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute("SELECT count(*) FROM users WHERE role = 'candidate'")
        count = cur.fetchone()[0]
        print(f"Total candidates in DB: {count}")
        
        cur.execute("SELECT count(*) FROM users WHERE role = 'candidate' AND is_active = true")
        active_count = cur.fetchone()[0]
        print(f"Active candidates in DB: {active_count}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    count_candidates()
