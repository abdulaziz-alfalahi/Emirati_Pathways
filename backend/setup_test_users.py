#!/usr/bin/env python3
"""
Database Setup Script for Emirati Journey Platform
Creates test user accounts for local development
"""

import sqlite3
import hashlib
import json
from datetime import datetime
import os

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def setup_database():
    """Create database tables and insert test users"""
    
    # Create database directory if it doesn't exist
    db_dir = os.path.join(os.path.dirname(__file__), 'database')
    os.makedirs(db_dir, exist_ok=True)
    
    # Database file path
    db_path = os.path.join(db_dir, 'emirati_platform.db')
    
    print(f"🗄️  Setting up database at: {db_path}")
    
    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            nationality TEXT DEFAULT 'UAE',
            user_type TEXT DEFAULT 'candidate',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            profile_data TEXT
        )
    ''')
    
    # Create CVs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cvs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            analysis_data TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    print("✅ Database tables created successfully")
    
    # Test users data
    test_users = [
        {
            'email': 'ahmed.almansouri@gmail.com',
            'password': 'TestPassword123!',
            'first_name': 'Ahmed',
            'last_name': 'Al Mansouri',
            'phone': '+971501234567',
            'user_type': 'candidate',
            'profile_data': {
                'bio': 'Experienced software engineer passionate about UAE digital transformation',
                'skills': ['Python', 'React', 'AI/ML', 'Cloud Computing'],
                'experience_years': 5,
                'education': 'Bachelor in Computer Science - UAE University',
                'location': 'Dubai, UAE'
            }
        },
        {
            'email': 'aisha.alnuaimi@hotmail.com',
            'password': 'TestPassword123!',
            'first_name': 'Aisha',
            'last_name': 'Al Nuaimi',
            'phone': '+971507654321',
            'user_type': 'candidate',
            'profile_data': {
                'bio': 'Digital marketing specialist focused on UAE market growth',
                'skills': ['Digital Marketing', 'Social Media', 'Analytics', 'Content Strategy'],
                'experience_years': 3,
                'education': 'Master in Business Administration - American University of Sharjah',
                'location': 'Abu Dhabi, UAE'
            }
        },
        {
            'email': 'admin@emiratijourney.ae',
            'password': 'TestPassword123!',
            'first_name': 'Admin',
            'last_name': 'User',
            'phone': '+971509876543',
            'user_type': 'admin',
            'profile_data': {
                'bio': 'Platform administrator for Emirati Journey Platform',
                'skills': ['Platform Management', 'User Support', 'Analytics'],
                'experience_years': 10,
                'education': 'Master in Public Administration',
                'location': 'Dubai, UAE'
            }
        }
    ]
    
    # Insert test users
    for user in test_users:
        try:
            # Check if user already exists
            cursor.execute('SELECT id FROM users WHERE email = ?', (user['email'],))
            existing_user = cursor.fetchone()
            
            if existing_user:
                print(f"⚠️  User {user['email']} already exists, skipping...")
                continue
            
            # Hash the password
            password_hash = hash_password(user['password'])
            
            # Insert user
            cursor.execute('''
                INSERT INTO users (
                    email, password_hash, first_name, last_name, phone, 
                    nationality, user_type, profile_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user['email'],
                password_hash,
                user['first_name'],
                user['last_name'],
                user['phone'],
                'UAE',
                user['user_type'],
                json.dumps(user['profile_data'])
            ))
            
            print(f"✅ Created user: {user['email']} ({user['user_type']})")
            
        except sqlite3.IntegrityError as e:
            print(f"⚠️  User {user['email']} already exists: {e}")
        except Exception as e:
            print(f"❌ Error creating user {user['email']}: {e}")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print("\n🎉 Database setup completed successfully!")
    print("\n📋 Test User Accounts Created:")
    print("=" * 50)
    for user in test_users:
        print(f"Email: {user['email']}")
        print(f"Password: {user['password']}")
        print(f"Type: {user['user_type']}")
        print("-" * 30)
    
    print("\n🚀 You can now log in to the platform using any of these accounts!")

if __name__ == "__main__":
    print("🇦🇪 EMIRATI JOURNEY PLATFORM - DATABASE SETUP")
    print("=" * 50)
    setup_database()
