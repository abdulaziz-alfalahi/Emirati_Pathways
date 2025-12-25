
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "emirati_secure_password")
DB_PORT = os.getenv("DB_PORT", "5432")

def find_recruiter():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        print("Searching for recruiter users...")
        cur.execute("""
            SELECT id, email, role, first_name, last_name, password_hash
            FROM users 
            WHERE role IN ('recruiter', 'hr_recruiter', 'hr')
            LIMIT 5;
        """)
        
        rows = cur.fetchall()
        for row in rows:
            print(f"ID: {row[0]}, Email: {row[1]}, Role: {row[2]}, Name: {row[3]} {row[4]}")
            
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_recruiter()
