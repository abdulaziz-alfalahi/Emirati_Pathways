
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "emirati_journey")
DB_USER = os.getenv("DB_USER", "emirati_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "emirati_secure_password")
DB_PORT = os.getenv("DB_PORT", "5432")

def fix_vis_owner():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        target_recruiter_id = 45 # Omar
        
        # We don't have a reliable WHERE clause other than "all existing", 
        # or maybe we can check if interviewer_id is null or weird.
        # Let's just update all for now since it's a dev env for this user.
        # Or better, check current values first.
        
        print("Current interviewer_ids:")
        cur.execute("SELECT id, interviewer_id FROM video_interview_sessions")
        rows = cur.fetchall()
        for row in rows:
            print(f"ID: {row[0]}, Interviewer: {row[1]}")
            
        print(f"Updating all video_interview_sessions to interviewer_id = {target_recruiter_id}...")
        cur.execute("UPDATE video_interview_sessions SET interviewer_id = %s", (target_recruiter_id,))
        rows = cur.rowcount
        conn.commit()
        print(f"Updated {rows} sessions.")
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_vis_owner()
