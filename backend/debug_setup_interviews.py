
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load env matches unified_server.py logic
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
load_dotenv(env_path)

def test_setup():
    print(f"Connecting to {os.getenv('DB_HOST')} as {os.getenv('DB_USER')}...")
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'emirati_user'),
            password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', 5432))
        )
        print("✅ Connection Successful!")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    try:
        cur = conn.cursor()
        print("Creating tables...")
        # Interview Sessions Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id UUID PRIMARY KEY,
                application_id UUID,
                recruiter_id UUID,
                candidate_id UUID,
                scheduled_at TIMESTAMPTZ,
                status TEXT DEFAULT 'scheduled',
                ai_analysis JSONB,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Recordings Metadata 
        cur.execute("""
            CREATE TABLE IF NOT EXISTS interview_recordings (
                id UUID PRIMARY KEY,
                session_id UUID REFERENCES interview_sessions(id),
                user_id UUID, 
                file_path TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        print("✅ Tables Created/Verified!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Table Creation Failed: {e}")

if __name__ == "__main__":
    test_setup()
