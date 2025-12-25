
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def drop_table():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print(f"Connected to {DB_CONFIG['database']}...")
        
        cur.execute("DROP TABLE IF EXISTS job_applications CASCADE;")
        conn.commit()
        print("✅ Dropped table 'job_applications'.")
        conn.close()
    except Exception as e:
        print(f"❌ Failed to drop table: {e}")

if __name__ == "__main__":
    drop_table()
