
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "emirati_secure_password")
DB_PORT = os.getenv("DB_PORT", "5432")

def inspect_interviews():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        print("Checking interview_schedules...")
        cur.execute("""
            SELECT interview_id, recruiter_id, candidate_id, scheduled_date, status, interview_type 
            FROM interview_schedules
        """)
        rows = cur.fetchall()
        for row in rows:
            print(f"ID: {row[0]}, Recruiter: {row[1]}, Candidate: {row[2]}, Date: {row[3]}, Status: {row[4]}, Type: {row[5]}")

        print("\nChecking video_interview_sessions...")
        cur.execute("""
            SELECT session_id, host_id, candidate_id, scheduled_at, status 
            FROM video_interview_sessions
        """)
        rows = cur.fetchall()
        for row in rows:
            print(f"Session: {row[0]}, Host: {row[1]}, Candidate: {row[2]}, Date: {row[3]}, Status: {row[4]}")

        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_interviews()
