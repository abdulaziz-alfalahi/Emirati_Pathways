
import logging
import json
from datetime import datetime
import psycopg2
import os
from recruiter.interview_engine import InterviewSchedulingEngine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def reproduce_issue():
    conn = psycopg2.connect(**DB_CONFIG)
    engine = InterviewSchedulingEngine()
    
    # Mock data mimicking the frontend payload causing 500
    data = {
        "shortlist_id": "sl_20251128_075114_b6fe83d8", # Real ID from database
        "recruiter_id": "recruiter_test_1",
        "interview_type": "video",
        "interview_title": "Test Interview",
        "scheduled_date": datetime.now().strftime("%Y-%m-%d"),
        "scheduled_time": "14:00:00",
        "duration_minutes": 60,
        "meeting_platform": "zoom"
    }
    
    try:
        print("\n--- Attempting create_interview ---")
        success, result, msg = engine.create_interview(conn, data)
        print(f"Result: success={success}, id={result}, msg={msg}")
    except Exception as e:
        print(f"\nCRASH DETECTED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    reproduce_issue()
