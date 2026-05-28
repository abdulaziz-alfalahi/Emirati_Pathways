import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': os.getenv('DB_PORT', '5432')
}

def list_columns():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hr_profiles'
        """)
        columns = cur.fetchall()
        print("Columns in hr_profiles:")
        for col in columns:
            print(f"- {col[0]} ({col[1]})")
            
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'company_team_members'
        """)
        columns = cur.fetchall()
        print("\nColumns in company_team_members:")
        for col in columns:
            print(f"- {col[0]} ({col[1]})")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_columns()
