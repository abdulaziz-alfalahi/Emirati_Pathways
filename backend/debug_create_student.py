
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
load_dotenv(env_path)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': os.getenv('DB_PORT', 5432)
}

def debug_create():
    print("🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🛠️  Attempting to create students table...")
        cursor.execute("""
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE TABLE IF NOT EXISTS students (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id VARCHAR(50) UNIQUE NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        conn.commit()
        print("✅ Table created successfully!")
        
        print("🛠️  Attempting to insert test student...")
        cursor.execute("""
            INSERT INTO students (student_id, first_name, last_name) 
            VALUES ('TEST001', 'Test', 'Student')
            ON CONFLICT (student_id) DO NOTHING;
        """)
        conn.commit()
        print("✅ Insert successful!")
        
        # Cleanup
        print("🧹 Cleaning up...")
        cursor.execute("DROP TABLE students CASCADE")
        conn.commit()
        print("✅ Cleanup successful!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    debug_create()
