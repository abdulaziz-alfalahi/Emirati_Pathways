
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

print("--- Updating Interview Sessions ---")
# Update interviews assigned to '17' (or any other) to be assigned to '1' (Current Logged In User)
cur.execute("UPDATE interview_sessions SET candidate_id = '1' WHERE candidate_id != '1'")
print(f"Updated {cur.rowcount} interviews to belong to Candidate ID '1'.")

conn.commit()
cur.close()
conn.close()
