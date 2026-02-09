import psycopg2
import os

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'job_id'")
result = cur.fetchone()
print(f"job_applications.job_id type: {result[0] if result else 'UNKNOWN'}")

cur.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'id'")
result = cur.fetchone()
print(f"job_postings.id type: {result[0] if result else 'UNKNOWN'}")

cur.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'jd_id'")
result = cur.fetchone()
print(f"job_postings.jd_id type: {result[0] if result else 'UNKNOWN'}")

conn.close()
