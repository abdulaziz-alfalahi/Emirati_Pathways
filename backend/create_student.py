
import os
import psycopg2
import psycopg2.extras
import bcrypt
from datetime import datetime, timedelta

def create_test_student():
    # Database configuration - mirroring setup_database.py and typical env
    DB_CONFIG = {
        'host': 'localhost',
        'port': 5432,
        'database': 'emirati_journey',
        'user': 'emirati_user',
        'password': 'emirati_secure_password'
    }

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        print("✅ Connected to database")

        # 1. Update User Type Constraint
        # We need to allow 'student' in user_type
        print("🔄 Updating user_type constraint...")
        try:
            # Check if 'student' is already in the check constraint?
            # Easiest way is to drop and recreate.
            # First, find the constraint name if it's not standard
            cursor.execute("""
                SELECT conname FROM pg_constraint 
                WHERE conrelid = 'users'::regclass AND contype = 'c' AND conname LIKE '%user_type%'
            """)
            constraint = cursor.fetchone()
            constraint_name = constraint['conname'] if constraint else 'users_user_type_check'
            
            print(f"   Found constraint: {constraint_name}")
            
            # Drop existing constraint
            cursor.execute(f"ALTER TABLE users DROP CONSTRAINT IF EXISTS {constraint_name}")
            
            # Add new constraint with 'student'
            cursor.execute("""
                ALTER TABLE users ADD CONSTRAINT users_user_type_check 
                CHECK (user_type IN ('candidate', 'recruiter', 'admin', 'student'))
            """)
            print("✅ Constraint updated to include 'student'")
            
        except Exception as e:
            print(f"⚠️ Error updating constraint (might already exist or be different): {e}")

        # 2. Check/Create User
        phone = '+971550000010'
        email = 'student.test@emirati.ae'
        password = 'StudentPass123!'
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
        existing_user = cursor.fetchone()
        
        user_id = None
        
        if existing_user:
            print(f"🔄 User with phone {phone} exists. Updating role to 'student'...")
            cursor.execute("""
                UPDATE users 
                SET user_type = 'student', 
                    email = %s,
                    full_name = 'Test Student',
                    is_verified = TRUE,
                    is_active = TRUE
                WHERE phone = %s
                RETURNING id
            """, (email, phone))
            user_id = cursor.fetchone()['id']
            print(f"✅ User updated (ID: {user_id})")
        else:
            print(f"🆕 Creating new student user...")
            cursor.execute("""
                INSERT INTO users (
                    email, password_hash, full_name, user_type, phone, 
                    is_verified, is_active, location, emirate
                ) VALUES (
                    %s, %s, 'Test Student', 'student', %s, 
                    TRUE, TRUE, 'Dubai', 'Dubai'
                )
                RETURNING id
            """, (email, password_hash, phone))
            user_id = cursor.fetchone()['id']
            print(f"✅ User created (ID: {user_id})")

        # 3. Insert Mock OTP
        print("🔐 Setting mock OTP...")
        otp_code = '123456'
        expires_at = datetime.now() + timedelta(days=365) # Valid for a year
        
        cursor.execute("""
            INSERT INTO otp_interactions (phone, otp_code, expires_at, attempts, created_at)
            VALUES (%s, %s, %s, 0, NOW())
            ON CONFLICT (phone) 
            DO UPDATE SET 
                otp_code = EXCLUDED.otp_code, 
                expires_at = EXCLUDED.expires_at, 
                attempts = 0
        """, (phone, otp_code, expires_at))
        print(f"✅ OTP set for {phone} (code redacted from logs)")

        cursor.close()
        conn.close()
        print("🎉 Done!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_student()
