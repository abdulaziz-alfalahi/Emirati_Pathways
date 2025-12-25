
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))

BASE_URL = "http://localhost:5005"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
ADD_SHORTLIST_URL = f"{BASE_URL}/api/recruiter/shortlist/add"

def test_add_shortlist():
    try:
        # 1. Login
        session = requests.Session()
        login_payload = {
            "email": "omar.alrashid@recruitment.ae",
            "password": "password123"
        }
        print(f"Logging in as {login_payload['email']}...")
        response = session.post(LOGIN_URL, json=login_payload)
        
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.text}")
            return

        token = response.json().get('token')
        print("Login successful.")

        # 2. Add to Shortlist
        # JD c8209c95-3c10-416a-afc9-15a38c374d33
        # Candidate 21 (Khalid)
        # Recruiter 45
        
        headers = {'Authorization': f'Bearer {token}'}
        payload = {
            "jd_id": "c8209c95-3c10-416a-afc9-15a38c374d33",
            "candidate_id": "21",
            "recruiter_id": "45",
            "match_score": 95.0,
            "match_details": {"notes": "Test re-add via script"},
            "notes": "Re-adding via script debug"
        }
        
        print(f"Adding candidate 21 to shortlist for JD c8209c95...")
        response = session.post(ADD_SHORTLIST_URL, json=payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_add_shortlist()
