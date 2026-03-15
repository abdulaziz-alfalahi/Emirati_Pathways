#!/usr/bin/env python3
"""
PostgreSQL Database Setup Script for Emirati Journey Platform
Creates test user accounts for local development with PostgreSQL
"""

import psycopg2
import psycopg2.extras
import bcrypt
import json
from datetime import datetime
import os
import uuid

from backend.db import get_db_connection

def hash_password(password):
    """Hash password using bcrypt (matching the auth manager)"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def setup_database():
    """Create database tables and insert test users"""
    
    print(f"🗄️  Setting up PostgreSQL database...")
    
    # Connect to PostgreSQL database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table with proper schema
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            emirate VARCHAR(50),
            nationality VARCHAR(50) DEFAULT 'UAE',
            role VARCHAR(50) DEFAULT 'candidate',
            is_active BOOLEAN DEFAULT true,
            is_verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            profile_data JSONB
        )
    ''')
    
    # Create CVs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cvs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            filename VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INTEGER,
            analysis_data JSONB,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id)')
    
    print("✅ Database tables created successfully")
    
    # Test users data
    test_users = [
        {
            'email': 'ahmed.almansouri@gmail.com',
            'password': 'TestPassword123!',
            'first_name': 'Ahmed',
            'last_name': 'Al Mansouri',
            'phone': '+971501234567',
            'emirate': 'Dubai',
            'role': 'candidate',
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
            'emirate': 'Abu Dhabi',
            'role': 'candidate',
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
            'emirate': 'Dubai',
            'role': 'admin',
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
            cursor.execute('SELECT id FROM users WHERE email = %s', (user['email'],))
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
                    emirate, nationality, role, profile_data
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                user['email'],
                password_hash,
                user['first_name'],
                user['last_name'],
                user['phone'],
                user['emirate'],
                'UAE',
                user['role'],
                json.dumps(user['profile_data'])
            ))
            
            print(f"✅ Created user: {user['email']} ({user['role']})")
            
        except psycopg2.IntegrityError as e:
            print(f"⚠️  User {user['email']} already exists: {e}")
            conn.rollback()
        except Exception as e:
            print(f"❌ Error creating user {user['email']}: {e}")
            conn.rollback()
    
    # Commit changes and close connection
    conn.commit()
    cursor.close()
    conn.close()
    
    print("\n🎉 PostgreSQL database setup completed successfully!")
    print("\n📋 Test User Accounts Created:")
    print("=" * 50)
    for user in test_users:
        print(f"Email: {user['email']}")
        print(f"Password: {user['password']}")
        print(f"Role: {user['role']}")
        print("-" * 30)
    
    print("\n🚀 You can now log in to the platform using any of these accounts!")

def check_database_connection():
    """Check if we can connect to PostgreSQL"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT version()')
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL: {version[0]}")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Cannot connect to PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    print("🇦🇪 EMIRATI JOURNEY PLATFORM - POSTGRESQL SETUP")
    print("=" * 55)
    
    # Check database connection first
    if check_database_connection():
        setup_database()
    else:
        print("\n💡 Please ensure PostgreSQL is running and accessible.")
        print("   You may need to:")
        print("   1. Start PostgreSQL service")
        print("   2. Create the database: CREATE DATABASE emirati_platform;")
        print("   3. Set correct environment variables for connection")
