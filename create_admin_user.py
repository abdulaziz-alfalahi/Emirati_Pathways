import sys
import os
import logging
import bcrypt
import traceback

# Add the current directory to sys.path so we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.auth.auth_manager import AuthenticationManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_admin_user():
    auth_manager = AuthenticationManager()
    
    email = "admin@emiratijourney.ae"
    password = "TestPassword123!"
    first_name = "System"
    last_name = "Administrator"
    full_name = "System Administrator"
    phone = "+971507890123"
    
    print(f"Attempting to create user {email}...")

    try:
        # Check if user exists (double check)
        if auth_manager._user_exists(email):
            print(f"User {email} already exists. Attempting to reset password...")
            # Ideally we would update password here, but let's see if we can just skip if exists
            # Actually if it exists but login failed, we likely have a wrong password in DB.
            # Let's delete and recreate to be sure, or update.
            conn = auth_manager._get_db_connection()
            cursor = conn.cursor()
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (hashed, email))
            conn.commit()
            print("Password updated successfully.")
            return

        # Create user manually using auth_manager's connection to ensure same DB
        conn = auth_manager._get_db_connection()
        cursor = conn.cursor()
        
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Determine table structure by trying to insert. 
        # Assuming table is 'users' based on auth_manager code.
        # columns: id, email, password, first_name, last_name, full_name, user_type, role, phone, emirate, is_verified/email_verified, created_at, updated_at
        
        # Schema based on auth_manager._get_user_by_email
        query = """
        INSERT INTO users (
            email, password_hash, first_name, last_name, 
            role, phone, emirate, 
            is_verified, is_active, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, 
            'admin', %s, 'Dubai', 
            true, true, NOW(), NOW()
        )
        """
        
        cursor.execute(query, (
            email, hashed, first_name, last_name, phone
        ))
        
        conn.commit()
        print(f"User {email} created successfully!")
        
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error creating user: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()
