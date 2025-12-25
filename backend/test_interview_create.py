
import requests
import json
from datetime import datetime, timedelta

def test_create_interview():
    base_url = "http://localhost:5003/api/recruiter/interviews"
    
    # 1. Get Shortlist ID first (we need a valid one)
    # We'll use the one we created in previous step or inspect DB
    
    # Payload matching frontend
    payload = {
        "shortlist_id": "sl_20251224_182359_f6c23309", # From previous log
        "recruiter_id": "omar.alrashid@recruitment.ae",
        "interview_type": "video", # CORRECTED: lowercase enum value
        "interview_round": 1,
        "interview_title": "Testing interview with Khalid",
        "scheduled_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
        "scheduled_time": "14:00",
        "duration_minutes": 60,
        "notes": "Automated test interview"
    }
    
    print(f"Sending POST to {base_url}/create")
    try:
        resp = requests.post(f"{base_url}/create", json=payload)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_create_interview()
