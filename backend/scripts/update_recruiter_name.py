"""
Update the name for the test recruiter user in the database.
Run this script to set the user's name to 'Test Recruiter 1'.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Database connection settings (from .env: DATABASE_URL=postgresql://emirati_user:emirati_secure_password@127.0.0.1/emirati_journey)
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

# Test Recruiter 1 phone number
PHONE_NUMBER = '+971500001002'
NEW_FULL_NAME = 'Test Recruiter 1'
NEW_FIRST_NAME = 'Test Recruiter'
NEW_LAST_NAME = '1'

def update_user_name():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Find the user
        cur.execute("""
            SELECT id, phone, full_name, first_name, last_name, email, user_type, role 
            FROM users 
            WHERE phone LIKE %s OR phone LIKE %s
        """, (f'%{PHONE_NUMBER[-10:]}%', PHONE_NUMBER))
        
        user = cur.fetchone()
        
        if not user:
            print(f"❌ No user found with phone {PHONE_NUMBER}")
            return False
            
        print(f"Found user: ID={user['id']}, Phone={user['phone']}, Current Name={user['full_name']}")
        
        # Update the user's name
        cur.execute("""
            UPDATE users 
            SET full_name = %s, first_name = %s, last_name = %s
            WHERE id = %s
        """, (NEW_FULL_NAME, NEW_FIRST_NAME, NEW_LAST_NAME, user['id']))
        
        conn.commit()
        print(f"✅ Updated user name to: {NEW_FULL_NAME} ({NEW_FIRST_NAME} {NEW_LAST_NAME})")
        
        # Verify the update
        cur.execute("SELECT id, full_name, first_name, last_name FROM users WHERE id = %s", (user['id'],))
        updated = cur.fetchone()
        print(f"Verified: full_name={updated['full_name']}, first_name={updated['first_name']}, last_name={updated['last_name']}")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    update_user_name()
