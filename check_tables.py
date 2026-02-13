
import psycopg2
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cursor.fetchall()
    print("Tables:", [t[0] for t in tables])
    
    # Check columns in candidate_experience if it exists
    if ('candidate_experience',) in tables:
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'candidate_experience'")
        print("candidate_experience columns:", [c[0] for c in cursor.fetchall()])
        
    cursor.close()
    conn.close()
except Exception as e:
    print(e)
