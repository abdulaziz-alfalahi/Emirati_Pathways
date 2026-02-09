
import psycopg2
import os

DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def peek_data():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cur = conn.cursor()
    
    print("--- DATA PEEK ---")
    cur.execute("SELECT id, candidate_id, job_id FROM job_applications LIMIT 5")
    rows = cur.fetchall()
    for row in rows:
        print(f"Row: {row}")
        
    cur.execute("SELECT user_id FROM candidate_profiles LIMIT 5")
    rows = cur.fetchall()
    for row in rows:
        print(f"Profile UserID: {row}")

    conn.close()

if __name__ == "__main__":
    peek_data()
