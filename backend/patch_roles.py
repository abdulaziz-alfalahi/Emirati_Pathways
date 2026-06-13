
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

def patch_roles():
    print("🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        sql_file_path = os.path.join(script_dir, 'add_missing_roles.sql')
        if not os.path.exists(sql_file_path):
            print(f"❌ Error: {sql_file_path} not found.")
            return

        with open(sql_file_path, 'r') as f:
            sql_content = f.read()
            
        print("🚀 Executing SQL patch...")
        cursor.execute(sql_content)
        conn.commit()
        
        print("✅ Roles patched successfully!")
        
        # Verify
        cursor.execute("SELECT name FROM admin_roles WHERE name IN ('employer_admin', 'parent', 'recruiter')")
        found = [row[0] for row in cursor.fetchall()]
        print(f"🔎 Found roles in DB: {found}")
        
    except Exception as e:
        print(f"❌ Failed to patch roles: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    patch_roles()
