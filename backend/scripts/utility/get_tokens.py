
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

def get_tokens():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'admin'),
            password=os.getenv('DB_PASSWORD', 'admin'),
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432)
        )
        with conn.cursor() as cur:
            cur.execute("""
                SELECT email, token, expires_at 
                FROM job_verification_tokens 
                ORDER BY created_at DESC 
                LIMIT 5
            """)
            print("\n--- Recent Tokens ---")
            for row in cur.fetchall():
                email, token, expires = row
                print(f"Email: {email}")
                print(f"Link: http://localhost:8089/verify-job/{token}")
                print("-" * 50)
                
        conn.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    get_tokens()
