
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

def check_schema():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print(f"Connected to {DB_CONFIG['database']}...")
        
        # Check columns of job_postings
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_postings';
        """)
        columns = cur.fetchall()
        print("\nColumns in 'job_postings':")
        for col in columns:
            print(f" - {col[0]} ({col[1]})")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_schema()
