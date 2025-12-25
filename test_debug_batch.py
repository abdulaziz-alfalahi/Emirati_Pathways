import requests
import json
import os
from dotenv import load_dotenv

script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, '.env'))

BASE_URL = 'http://localhost:5003'

def test_batch_upload():
    # 1. Login to get token
    print("Logging in...")
    login_payload = {
        "user_id": "2", # Zara Saeed
        "role": "hr_manager",
        "email": "zara.saeed@company.ae"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/dev-login", json=login_payload)
        resp.raise_for_status()
        token = resp.json()['data']['access_token']
        print("Login successful, token acquired.")
    except Exception as e:
        print(f"Login Failed: {e}")
        try:
           print(resp.text)
        except:
           pass
        return

    # 2. Prepare Batch Data
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    batch_data = {
        "jobs": [
            {
                "title": "Debug Job 1",
                "description": "Debug Description",
                "salary_range_min": 5000,
                "salary_range_max": 10000,
                "location": "Dubai",
                "application_deadline": "2024-12-31" 
            }
        ]
    }
    
    print("\nSending Batch Upload Request...")
    try:
        resp = requests.post(f"{BASE_URL}/api/hr/jobs/batch", json=batch_data, headers=headers)
        print(f"Status Code: {resp.status_code}")
        print("Response:", resp.text)
    except Exception as e:
        print(f"Request Failed: {e}")

if __name__ == "__main__":
    test_batch_upload()
