import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def check_table():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT to_regclass('public.company_team_members');")
        exists = cur.fetchone()[0]
        print(f"Table 'company_team_members' exists: {exists is not None}")
        
        if exists:
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'company_team_members';
            """)
            columns = cur.fetchall()
            print("\nColumns:")
            for col in columns:
                print(f"- {col[0]}: {col[1]}")
                
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_table()
