
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'emirati_user'),
    password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=int(os.getenv('DB_PORT', 5432))
)

cur = conn.cursor()
try:
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_cvs'")
    columns = cur.fetchall()
    print("User CVs Columns:")
    for col in columns:
        print(f"{col[0]}: {col[1]}")
        
    cur.execute("SELECT id, first_name FROM users WHERE id = 17")
    user = cur.fetchone()
    print(f"\nUser 17: {user}")

except Exception as e:
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
