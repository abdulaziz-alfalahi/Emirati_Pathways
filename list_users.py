import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# DB Config
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASS = os.getenv("DB_PASSWORD", "emirati_secure_password")

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    cur = conn.cursor()
    
    print("--- User Counts by Role ---")
    cur.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
    for row in cur.fetchall():
        print(f"{row[0]}: {row[1]}")
        
    print("\n--- Sample Users (Email) ---")
    roles = ['candidate', 'recruiter', 'admin', 'hr_manager']
    for role in roles:
        cur.execute("SELECT id, email, first_name, last_name FROM users WHERE role = %s LIMIT 1", (role,))
        user = cur.fetchone()
        if user:
            print(f"Role: {role} -> Email: {user[1]} (ID: {user[0]})")
        else:
            print(f"Role: {role} -> [NO USER FOUND]")

    conn.close()

except Exception as e:
    print(f"Error: {e}")
