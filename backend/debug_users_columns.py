
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Check columns
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users';
    """)
    columns = [row[0] for row in cursor.fetchall()]
    print("Columns in users table:", columns)
    
    # Check sample data
    cursor.execute("SELECT * FROM users LIMIT 1")
    row = cursor.fetchone()
    print("Sample row:", row)
    
    # Check if first_name/last_name have data for anyone
    if 'first_name' in columns:
        cursor.execute("SELECT count(*) FROM users WHERE first_name IS NOT NULL")
        print("Users with first_name:", cursor.fetchone()[0])
        
    if 'full_name' in columns:
        cursor.execute("SELECT count(*) FROM users WHERE full_name IS NOT NULL")
        print("Users with full_name:", cursor.fetchone()[0])

    conn.close()
except Exception as e:
    print(f"Error: {e}")
