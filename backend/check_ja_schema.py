
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "emirati_secure_password")
DB_PORT = os.getenv("DB_PORT", "5432")

def check_schema():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        print("Checking 'job_applications' table schema...")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_applications';
        """)
        
        rows = cur.fetchall()
        for row in rows:
            print(f"Column: {row[0]}, Type: {row[1]}")
            
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
