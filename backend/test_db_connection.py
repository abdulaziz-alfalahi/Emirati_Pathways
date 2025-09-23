#!/usr/bin/env python3
"""
Test PostgreSQL Database Connection
"""

import os
import psycopg2
import psycopg2.extras

def test_connection():
    """Test PostgreSQL connection and query users table"""
    
    # Database configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'emirati_platform'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '')
    }
    
    print("🔍 Testing PostgreSQL Connection...")
    print(f"Host: {db_config['host']}")
    print(f"Port: {db_config['port']}")
    print(f"Database: {db_config['database']}")
    print(f"User: {db_config['user']}")
    print(f"Password: {'***' if db_config['password'] else '(empty)'}")
    print("-" * 50)
    
    try:
        # Test connection
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("✅ Database connection successful!")
        
        # Test table structure
        cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;")
        columns = cursor.fetchall()
        
        print(f"\n📋 Users table structure:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']}")
        
        # Test user query
        cursor.execute("""
            SELECT id, email, password_hash, first_name, last_name, role, phone, 
                   emirate, nationality, is_active, is_verified, created_at, updated_at
            FROM users WHERE email = %s
        """, ('ahmed.almansouri@gmail.com',))
        
        user = cursor.fetchone()
        
        if user:
            print(f"\n✅ User found:")
            print(f"  - Name: {user['first_name']} {user['last_name']}")
            print(f"  - Email: {user['email']}")
            print(f"  - Role: {user['role']}")
            print(f"  - Active: {user['is_active']}")
            print(f"  - Password hash: {user['password_hash'][:20]}...")
        else:
            print(f"\n❌ User not found: ahmed.almansouri@gmail.com")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()
