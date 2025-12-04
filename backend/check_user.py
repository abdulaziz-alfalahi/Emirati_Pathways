import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    cur = conn.cursor()
    
    cur.execute("SELECT user_id, company_id FROM hr_profiles WHERE user_id = '3'")
    print(cur.fetchall())
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
