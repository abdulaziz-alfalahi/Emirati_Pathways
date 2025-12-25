
import os
import psycopg2
from dotenv import load_dotenv
import json

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'emirati_user'),
    password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=int(os.getenv('DB_PORT', 5432))
)

cur = conn.cursor()
cur.execute("SELECT id, first_name, last_name, email FROM users WHERE role = 'candidate' LIMIT 5")
candidates = cur.fetchall()
print("Available Candidates:")
for c in candidates:
    print(f"ID: {c[0]}, Name: {c[1]} {c[2]}, Email: {c[3]}")
cur.close()
conn.close()
