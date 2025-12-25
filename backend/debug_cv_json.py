
import psycopg2
import psycopg2.extras
import os
import json
from datetime import datetime
import uuid

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def inspect_cv_json():
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Get the most recently updated CV
        cur.execute("""
            SELECT id, title, personal_info, work_experience, education 
            FROM user_cvs 
            ORDER BY updated_at DESC 
            LIMIT 1
        """)
        cv = cur.fetchone()
        
        if cv:
            print(f"CV ID: {cv['id']}")
            print(f"Title: {cv['title']}")
            print("\n--- Personal Info JSON ---")
            print(json.dumps(cv['personal_info'], indent=2))
            print("\n--- Work Experience JSON ---")
            print(json.dumps(cv['work_experience'], indent=2))
        else:
            print("No CVs found.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_cv_json()
