#!/usr/bin/env python3
"""
Apply CV storage database schema
"""
import psycopg2
import os
import sys
from dotenv import load_dotenv

def apply_cv_schema():
    try:
        # Load environment variables
        load_dotenv('backend/.env')
        
        # Database connection
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            port=os.getenv('DB_PORT', '5432')
        )
        
        print("📊 Connected to database")
        
        # Read schema file
        with open('database/cv_storage_schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        print("📄 Schema file loaded")
        
        # Execute schema
        cursor = conn.cursor()
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✅ CV storage schema applied successfully")
        
        # Verify tables created
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE 'cv_%'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"📋 Created {len(tables)} CV-related tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying schema: {e}")
        return False

if __name__ == "__main__":
    success = apply_cv_schema()
    sys.exit(0 if success else 1)