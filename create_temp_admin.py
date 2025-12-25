
import sys
import os
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor

sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def create_temp_admin():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        email = "temp_admin@test.com"
        password = "TestPassword123!"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # 1. Create User
        print(f"Creating user {email}...")
        cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, user_type, is_active, is_verified)
            VALUES (%s, %s, 'Temp Admin', 'admin', true, true)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING id
        """, (email, hashed))
        user_id = cursor.fetchone()['id']
        print(f"User ID: {user_id}")
        
        # 2. Assign super_admin role
        print("Assigning super_admin role...")
        cursor.execute("SELECT id FROM admin_roles WHERE name = 'super_admin'")
        role = cursor.fetchone()
        if not role:
            print("Error: super_admin role not found!")
            return
            
        role_id = role['id']
        cursor.execute("""
            INSERT INTO admin_user_roles (user_id, role_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, role_id) DO NOTHING
        """, (user_id, role_id))
        
        print("Success! Temp Admin created.")
        print(f"Email: {email}")
        print(f"Password: {password}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    create_temp_admin()
