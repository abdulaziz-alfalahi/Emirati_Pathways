"""
Setup Test Team Chat Accounts - Creates a company and 3 test users for team chat testing
"""

import psycopg2
import psycopg2.extras
import os
import uuid
import hashlib
from dotenv import load_dotenv

load_dotenv()

# DB Config
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def setup_test_team_chat_accounts():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("=" * 60)
        print("SETTING UP TEST TEAM CHAT ACCOUNTS")
        print("=" * 60)
        
        # 1. Create Company
        company_name = "Test Team Chat Company"
        cursor.execute("SELECT id FROM companies WHERE name = %s OR company_name = %s", (company_name, company_name))
        company_row = cursor.fetchone()
        
        if company_row:
            company_id = company_row['id']
            print(f"[OK] Company already exists: {company_id}")
        else:
            company_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO companies (id, name, company_name, industry, is_verified)
                VALUES (%s, %s, %s, 'Technology', TRUE)
            """, (company_id, company_name, company_name))
            print(f"[OK] Created Company: {company_name} (ID: {company_id})")
        
        # 2. Create Test Users
        password_hash = hashlib.sha256("password123".encode()).hexdigest()
        
        test_users = [
            {
                'phone': '+971500001001',
                'email': 'hr.manager1@testchat.com',
                'full_name': 'Test HR Manager 1',
                'first_name': 'Test HR Manager',
                'last_name': '1',
                'role': 'hr_manager',
                'user_type': 'admin',
                'position': 'HR Manager'
            },
            {
                'phone': '+971500001002',
                'email': 'recruiter1@testchat.com',
                'full_name': 'Test Recruiter 1',
                'first_name': 'Test Recruiter',
                'last_name': '1',
                'role': 'recruiter',
                'user_type': 'recruiter',
                'position': 'Recruiter'
            },
            {
                'phone': '+971500001003',
                'email': 'recruiter2@testchat.com',
                'full_name': 'Test Recruiter 2',
                'first_name': 'Test Recruiter',
                'last_name': '2',
                'role': 'recruiter',
                'user_type': 'recruiter',
                'position': 'Recruiter'
            }
        ]
        
        created_user_ids = []
        
        for user in test_users:
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE phone = %s OR email = %s", 
                          (user['phone'], user['email']))
            existing = cursor.fetchone()
            
            if existing:
                user_id = existing['id']
                print(f"[OK] User {user['full_name']} already exists (ID: {user_id})")
                # Update to ensure correct role
                cursor.execute("""
                    UPDATE users 
                    SET role = %s, user_type = %s, full_name = %s, first_name = %s, 
                        last_name = %s, is_verified = TRUE, is_active = TRUE
                    WHERE id = %s
                """, (user['role'], user['user_type'], user['full_name'], 
                      user['first_name'], user['last_name'], user_id))
            else:
                cursor.execute("""
                    INSERT INTO users (
                        email, password_hash, full_name, first_name, last_name, 
                        user_type, role, phone, is_verified, is_active
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, TRUE)
                    RETURNING id
                """, (
                    user['email'], password_hash, user['full_name'], 
                    user['first_name'], user['last_name'], user['user_type'], 
                    user['role'], user['phone']
                ))
                user_id = cursor.fetchone()['id']
                print(f"[OK] Created User: {user['full_name']} (ID: {user_id})")
            
            created_user_ids.append((user_id, user))
            
            # 3. Link User to Company via HR Profile
            cursor.execute("SELECT id FROM hr_profiles WHERE user_id = %s", (user_id,))
            if cursor.fetchone():
                cursor.execute("""
                    UPDATE hr_profiles 
                    SET company_id = %s, position_title = %s
                    WHERE user_id = %s
                """, (company_id, user['position'], user_id))
                print(f"   -> Updated HR Profile for {user['full_name']}")
            else:
                cursor.execute("""
                    INSERT INTO hr_profiles (user_id, company_id, department, position_title)
                    VALUES (%s, %s, 'HR', %s)
                """, (user_id, company_id, user['position']))
                print(f"   -> Created HR Profile for {user['full_name']}")
        
        # 4. Add users to company_team_members table if it exists
        try:
            for user_id, user in created_user_ids:
                cursor.execute("""
                    SELECT 1 FROM company_team_members 
                    WHERE company_id = %s AND user_id = %s
                """, (company_id, user_id))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO company_team_members (company_id, user_id, role, status)
                        VALUES (%s, %s, %s, 'active')
                        ON CONFLICT DO NOTHING
                    """, (company_id, user_id, user['role']))
                    print(f"   -> Added {user['full_name']} to company team")
        except Exception as e:
            print(f"   [WARN] company_team_members table may not exist: {e}")
        
        conn.commit()
        
        print("")
        print("=" * 60)
        print("TEST ACCOUNTS CREATED SUCCESSFULLY!")
        print("=" * 60)
        print("")
        print("Login Credentials (OTP: 123456 for all):")
        print("-" * 50)
        for user_id, user in created_user_ids:
            print(f"  {user['full_name']}")
            print(f"    Phone: {user['phone']}")
            print(f"    Role:  {user['role']}")
            print(f"    ID:    {user_id}")
            print()
        print(f"Company: {company_name}")
        print(f"Company ID: {company_id}")
        print("=" * 60)
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    setup_test_team_chat_accounts()
