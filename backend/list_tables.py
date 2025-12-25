
import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv(r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\.env')

def list_tables():
    host = os.getenv('DB_HOST')
    port = os.getenv('DB_PORT')
    user = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    dbname = 'emirati_journey' 

    print(f"--- Listing tables in {dbname} ---")
    try:
        conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"Tables: {sorted(tables)}")
        
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_tables()
