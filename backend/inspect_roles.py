
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

def list_roles():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔍 Listing Admin Roles:")
        cursor.execute("SELECT id, name, display_name, is_system_role FROM admin_roles ORDER BY id")
        rows = cursor.fetchall()
        
        print(f"{'ID':<5} | {'Name':<20} | {'Display Name':<25} | {'System Role'}")
        print("-" * 70)
        for row in rows:
            print(f"{row[0]:<5} | {row[1]:<20} | {row[2]:<25} | {row[3]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    list_roles()
