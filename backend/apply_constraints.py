
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def apply_sql_file(filename):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        with open(filename, 'r') as f:
            sql = f.read()
            cursor.execute(sql)
            conn.commit()
            print(f"Successfully applied {filename}")
            
    except Exception as e:
        conn.rollback()
        print(f"Error applying {filename}: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    apply_sql_file('backend/update_constraints.sql')
