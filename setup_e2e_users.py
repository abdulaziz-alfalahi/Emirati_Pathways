import os
import psycopg2
import bcrypt
from dotenv import load_dotenv

# Load env from backend/.env if possible, or assume defaults
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASS = os.getenv("DB_PASSWORD", "emirati_secure_password")

USERS = [
    {
        "email": "e2e_candidate@example.com",
        "password": "Test@123",
        "first_name": "E2E",
        "last_name": "Candidate",
        "role": "candidate",
        "phone": "+971500000001"
    },
    {
        "email": "e2e_recruiter@example.com",
        "password": "Test@123",
        "first_name": "E2E",
        "last_name": "Recruiter",
        "role": "recruiter",
        "phone": "+971500000002"
    },
    {
        "email": "e2e_hr@example.com",
        "password": "Test@123",
        "first_name": "E2E",
        "last_name": "HR",
        "role": "hr_manager",
        "phone": "+971500000003"
    }
]

def setup_users():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        
        print(f"Connected to DB: {DB_NAME}")

        for user in USERS:
            email = user['email']
            # Check if exists
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()
            
            pw_hash = bcrypt.hashpw(user['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            if existing:
                print(f"Updating existing user: {email}")
                cur.execute("""
                    UPDATE users 
                    SET password_hash = %s, first_name = %s, last_name = %s, role = %s, is_active = true, is_verified = true
                    WHERE email = %s
                """, (pw_hash, user['first_name'], user['last_name'], user['role'], email))
            else:
                print(f"Creating new user: {email}")
                cur.execute("""
                    INSERT INTO users (email, password_hash, first_name, last_name, role, phone, nationality, is_active, is_verified)
                    VALUES (%s, %s, %s, %s, %s, %s, 'UAE', true, true)
                """, (email, pw_hash, user['first_name'], user['last_name'], user['role'], user['phone']))
        
        conn.commit()
        print("Success! All users setup.")
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_users()
