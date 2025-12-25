
import requests
import json
import time

BASE_URL = "http://localhost:5003"

def test_cv_flow():
    print(f"Testing CV endpoints on {BASE_URL}...")
    
    # Header with mock token
    headers = {
        "Authorization": "Bearer mock_token_1",
        "Content-Type": "application/json"
    }
    
    # 1. List CVs (Expect 200, maybe empty list)
    try:
        print("\n1. Listing CVs...")
        res = requests.get(f"{BASE_URL}/api/cv/list", headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"Success: {data.get('success')}")
            cvs = data.get('data', [])
            print(f"Count: {len(cvs)}")
            if cvs:
                print(f"First CV: {cvs[0]['title']}")
        else:
            print(f"Error: {res.text}")
            
    except Exception as e:
        print(f"List failed: {e}")

    # 2. Save a new CV
    try:
        print("\n2. Saving a new Test CV...")
        payload = {
            "title": "Test CV from Script",
            "templateId": "professional",
            "cvData": {
                "personalInfo": {"firstName": "Test", "lastName": "User"},
                "professionalSummary": "Summary...",
                "technicalSkills": ["Python", "Flask"],
                "softSkills": ["Communication"],
                "experience": [],
                "education": []
            }
        }
        res = requests.post(f"{BASE_URL}/api/cv/save", json=payload, headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 201:
            data = res.json()
            print(f"Success: {data.get('success')}")
            new_id = data.get('data', {}).get('cv_id')
            print(f"Created ID: {new_id}")
            
            # 3. List again to verify
            print("\n3. Listing CVs again...")
            res = requests.get(f"{BASE_URL}/api/cv/list", headers=headers)
            cvs = res.json().get('data', [])
            print(f"Count: {len(cvs)}")
            found = any(cv['id'] == new_id for cv in cvs)
            print(f"Found new CV in list: {found}")
            
        else:
            print(f"Save Error: {res.text}")

    except Exception as e:
        print(f"Save failed: {e}")

if __name__ == "__main__":
    test_cv_flow()
