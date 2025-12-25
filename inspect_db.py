
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

def inspect():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'admin'),
            password=os.getenv('DB_PASSWORD', 'admin'),
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432)
        )
        with conn.cursor() as cur:
            print("--- HR PROFILES Table Columns ---")
            cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'hr_profiles'")
            for col in cur.fetchall():
                print(col)
        conn.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    inspect()
