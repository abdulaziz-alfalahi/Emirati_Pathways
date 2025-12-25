
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'emirati_user'),
    password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=int(os.getenv('DB_PORT', 5432))
)

cur = conn.cursor(cursor_factory=RealDictCursor)

print("--- Users (Candidates) ---")
cur.execute("SELECT id, first_name, last_name, email, role FROM users WHERE role = 'candidate' LIMIT 5")
for u in cur.fetchall():
    print(u)

print("\n--- Interview Sessions ---")
cur.execute("SELECT id, candidate_id, recruiter_id, scheduled_at, status FROM interview_sessions")
for s in cur.fetchall():
    print(s)

cur.close()
conn.close()
