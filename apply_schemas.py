
import psycopg2
import os
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv('backend/.env')

def apply_sql(filename):
    print(f"Applying {filename}...")
    try:
        dbname = os.getenv('DB_NAME', 'emirati_journey')
        user = os.getenv('DB_USER', 'admin')
        print(f"Connecting to DB: {dbname} as {user}")
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=os.getenv('DB_PASSWORD', 'admin'),
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432)
        )
        conn.autocommit = True
        with conn.cursor() as cur:
            with open(filename, 'r') as f:
                sql = f.read()
                cur.execute(sql)
        print("Success!")
        conn.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    apply_sql('backend/create_hr_recruiter_tables.sql')
    apply_sql('backend/create_growth_schema.sql')
