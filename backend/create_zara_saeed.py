
import psycopg2
import os
import hashlib
from dotenv import load_dotenv

load_dotenv()

# Database connection details
DB_NAME = os.getenv("DB_NAME", "emirati_pathways_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cursor = conn.cursor()

    email = "zara.saeed@demo.com"
    phone = "+971502345678"
    full_name = "Zara Saeed"
    role = "hr_manager"
    user_type = "admin" # Using admin to satisfy CHECK constraint and ensure access
    # Generate dummy password hash
    password_hash = hashlib.sha256("password123".encode()).hexdigest()

    # Split full name
    last_name = "Saeed" 
    first_name = "Zara"

    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE phone = %s OR email = %s", (phone, email))
    existing_user = cursor.fetchone()

    if existing_user:
        print(f"User already exists with ID {existing_user[0]}. Updating role and details...")
        cursor.execute("""
            UPDATE users 
            SET role = %s, user_type = %s, full_name = %s, first_name = %s, last_name = %s, 
                phone = %s, email = %s, is_verified = TRUE, secondary_roles = '{}'
            WHERE id = %s
        """, (role, user_type, full_name, first_name, last_name, phone, email, existing_user[0]))
    else:
        print("Creating new user Zara Saeed...")
        cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, first_name, last_name, user_type, role, phone, is_verified, is_active, secondary_roles)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, TRUE, '{}')
            RETURNING id
        """, (email, password_hash, full_name, first_name, last_name, user_type, role, phone))
        new_id = cursor.fetchone()[0]
        print(f"User created with ID {new_id}")

    conn.commit()
    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
