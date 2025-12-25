
import requests
import json
import os

def test_add_shortlist():
    base_url = "http://localhost:5003/api/recruiter/shortlist"
    
    # Payload matching the frontend
    payload = {
        "jd_id": "e8209c95-3c10-416a-afc9-15a38c374d33",
        "candidate_id": "21", # Khalid (INT as string)
        "recruiter_id": "omar.alrashid@recruitment.ae",
        "match_score": 95,
        "match_details": {"notes": "Test add via script"},
        "notes": "Added by verification script"
    }
    
    print(f"Sending POST to {base_url}/add")
    try:
        resp = requests.post(f"{base_url}/add", json=payload)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_add_shortlist()
