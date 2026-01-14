
import psycopg2
import os
from tabulate import tabulate

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def check_data():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, job_id, candidate_id FROM job_applications LIMIT 5")
        rows = cur.fetchall()
        print(tabulate(rows, headers=['ID', 'Job ID', 'Cand ID']))
    except Exception as e:
        print(e)
    conn.close()

if __name__ == "__main__":
    check_data()
