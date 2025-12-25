
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "emirati_secure_password")
DB_PORT = os.getenv("DB_PORT", "5432")

def inspect_shortlist():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        jd_id = "c8209c95-3c10-416a-afc9-15a38c374d33" # Correct ID from screenshot
        
        print(f"--- Checking Shortlist for JD {jd_id} ---")
        cur.execute("SELECT * FROM candidate_shortlist WHERE jd_id = %s", (jd_id,))
        rows = cur.fetchall()
        print(f"Rows for this JD: {len(rows)}")
        
        for row in rows:
            print(row)
            
        cur.execute("SELECT * FROM candidate_shortlist LIMIT 5")
        print("\n--- Any Shortlist Entries? ---")
        rows = cur.fetchall()
        for row in rows:
            print(f"JD: {row[2]}, Candidate: {row[3]}, Status: {row[7]}")

        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_shortlist()
