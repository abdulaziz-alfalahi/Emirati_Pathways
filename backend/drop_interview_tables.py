
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
    print("Dropping interview tables...")
    cur.execute("DROP TABLE IF EXISTS interview_recordings;")
    cur.execute("DROP TABLE IF EXISTS interview_sessions;")
    conn.commit()
    print("Tables dropped.")
except Exception as e:
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
