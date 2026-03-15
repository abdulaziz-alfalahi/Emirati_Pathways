
import os
import secrets
import bcrypt
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from backend.db import get_db_connection

def create_educator_user():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    phone = '+971550000011'
    email = 'educator.test@emirati-pathway.temp'
    first_name = 'Dr. Test'
    last_name = 'Educator'
    
    try:
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"User with phone {phone} already exists. Updating role to educator...")
            cursor.execute("""
                UPDATE users 
                SET role = 'educator', 
                    user_type = 'educator',
                    first_name = %s,
                    last_name = %s,
                    email = %s
                WHERE phone = %s
            """, (first_name, last_name, email, phone))
        else:
            print(f"Creating new educator user {phone}...")
            # Generate password hash
            password = 'TestPassword123!'
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Insert new user
            cursor.execute("""
                INSERT INTO users (
                    email, password_hash, first_name, last_name, full_name,
                    phone, role, user_type, emirate, nationality, 
                    is_active, is_verified
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, 'educator', 'educator', 'Dubai', 'UAE',
                    TRUE, TRUE
                )
            """, (
                email, password_hash, first_name, last_name, f"{first_name} {last_name}",
                phone, 
            ))
            
        conn.commit()
        print("Educator user setup successful!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error setting up educator user: {e}")
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_educator_user()
