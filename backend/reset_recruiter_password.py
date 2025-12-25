
import os
import psycopg2
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "emirati_secure_password")
DB_PORT = os.getenv("DB_PORT", "5432")

def reset_password():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        email = "omar.alrashid@recruitment.ae"
        password = "password123"
        pw_hash = generate_password_hash(password)
        
        print(f"Resetting password for {email}...")
        cur.execute("UPDATE users SET password_hash = %s WHERE email = %s", (pw_hash, email))
        conn.commit()
        
        print(f"Password reset successfully. Rows affected: {cur.rowcount}")
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_password()
