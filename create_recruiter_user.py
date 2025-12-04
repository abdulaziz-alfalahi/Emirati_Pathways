
import sqlite3
import hashlib
import json
import os

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_recruiter():
    db_path = os.path.join('backend', 'database', 'emirati_platform.db')
    print(f"Connecting to database at: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    recruiter = {
        'email': 'recruiter@company.com',
        'password': 'TestPassword123!',
        'first_name': 'Recruiter',
        'last_name': 'Demo',
        'phone': '+971500000000',
        'user_type': 'recruiter',
        'profile_data': {
            'company': 'Tech Corp',
            'position': 'Senior Recruiter'
        }
    }
    
    try:
        cursor.execute('SELECT id FROM users WHERE email = ?', (recruiter['email'],))
        if cursor.fetchone():
            print("Recruiter user already exists.")
            return

        password_hash = hash_password(recruiter['password'])
        
        cursor.execute('''
            INSERT INTO users (
                email, password_hash, first_name, last_name, phone, 
                nationality, user_type, profile_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            recruiter['email'],
            password_hash,
            recruiter['first_name'],
            recruiter['last_name'],
            recruiter['phone'],
            'UAE',
            recruiter['user_type'],
            json.dumps(recruiter['profile_data'])
        ))
        
        conn.commit()
        print("✅ Created recruiter user: recruiter@company.com / TestPassword123!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_recruiter()
