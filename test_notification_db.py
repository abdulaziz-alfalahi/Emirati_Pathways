
import logging
import os
import sys
import uuid
import json
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from recruiter.interview_engine import InterviewSchedulingEngine, InterviewType
from services.communication_service import communication_service, NotificationType

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', 5432)
    )

def test_interview_notification():
    conn = get_db_connection()
    engine = InterviewSchedulingEngine()
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Create a dummy candidate
        candidate_id = str(uuid.uuid4())
        cur.execute("INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES (123456, 'test_cand@example.com', 'hash', 'candidate', 'Test', 'Candidate') ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email RETURNING id")
        # Note: Users table usually has integer ID or UUID? Communication service used string. 
        # Let's check users table schema briefly or assume string for now based on previous files.
        # Actually logic used str(user_id) in communication service.
        # BUT `interview_engine.py` line 305 says `candidate_id = shortlist_entry[0]`.
        
        # Le'ts simplify: Check if we can create a notification directly first.
        
        print(f"Testing direct notification creation...")
        notif = communication_service.create_notification(
            user_id="test_user_123",
            notification_type=NotificationType.INTERVIEW_SCHEDULED,
            metadata={'test': 'true'}
        )
        print(f"Direct notification result: {notif}")
        
        # Verify it exists in DB
        cur.execute("SELECT * FROM notifications WHERE id = %s", (notif.id,))
        row = cur.fetchone()
        if row:
            print("SUCCESS: Notification found in DB")
        else:
            print("FAILURE: Notification NOT found in DB")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_interview_notification()
