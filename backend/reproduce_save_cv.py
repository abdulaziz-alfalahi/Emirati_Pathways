
import requests
import json

BASE_URL = "http://localhost:5003"
HEADERS = {
    "Authorization": "Bearer mock_token_1",
    "Content-Type": "application/json"
}

def reproduce():
    # 1. List CVs (Verification only)
    print("Listing CVs...")
    try:
        res = requests.get(f"{BASE_URL}/api/cv/list", headers=HEADERS)
        if res.status_code == 200:
            cvs = res.json().get('data', [])
            print(f"Found {len(cvs)} CVs.")
            # Do NOT delete for this test
    except Exception as e:
        print(f"List failed: {e}")

    payload = {
        "title": "Crash Test CV",
        "templateId": "professional",
        "cvScore": 85,
        "atsScore": 30,
        "cvData": {
            "personalInfo": {
                "firstName": "Test",
                "lastName": "User",
                "email": "test@example.com",
                "phone": "+971501234567",
                "location": "Dubai",
                "nationality": "UAE"
            },
            "professionalSummary": "Summary",
            "technicalSkills": ["Python", "SQL"],
            "softSkills": ["Comm"],
            "experience": [],
            "education": []
        }
    }
    
    print("Sending Save Request...")
    try:
        res = requests.post(f"{BASE_URL}/api/cv/save", json=payload, headers=HEADERS)
        print(f"Status Code: {res.status_code}")
        print("Response Text:")
        print(res.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    reproduce()
