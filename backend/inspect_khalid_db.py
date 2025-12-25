
import os
import sys
import psycopg2
import json
from dotenv import load_dotenv

load_dotenv(r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\.env')

def search_cv_by_name():
    host = os.getenv('DB_HOST')
    port = os.getenv('DB_PORT')
    user = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    dbname = 'emirati_journey'

    print(f"--- Searching user_cvs in {dbname} ---")
    try:
        conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)
        cur = conn.cursor()
        
        # Search inside JSONB personal_info
        cur.execute("""
            SELECT id, user_id, personal_info, technical_skills 
            FROM user_cvs 
            WHERE personal_info->>'name' ILIKE '%Khalid%' 
               OR personal_info->>'full_name' ILIKE '%Khalid%'
               OR title ILIKE '%Khalid%'
        """)
        cvs = cur.fetchall()
        
        if not cvs:
            print("No CVs found matching 'Khalid' in personal_info.")
        
        for cv in cvs:
            print(f"\n*** Found CV! ***")
            print(f"CV ID: {cv[0]}")
            print(f"User ID (UUID): {cv[1]}")
            print(f"Name in CV: {cv[2].get('name') or cv[2].get('full_name')}")
            print(f"Technical Skills Keys: {cv[3].keys() if cv[3] else 'None'}")
            
            # Check if this User ID exists in users (as string? casted?)
            # Usually strict type check will fail, so we won't try join here.
            
            # But let's check if there is ANY user with this UUID in some other column?
            # Or if it matches an auth user? (Can't check auth schema easily if restricted).

        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_cv_by_name()
