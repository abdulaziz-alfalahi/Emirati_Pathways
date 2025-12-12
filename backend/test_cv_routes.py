
import requests
import json

BASE_URL = "http://localhost:5006/api/cv"
TOKEN = "mock_token_1"

def test_save_cv():
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "title": "Test CV via Script",
        "templateId": "professional",
        "cvData": {
            "personalInfo": {
                "firstName": "Test",
                "lastName": "Script",
                "email": "test@script.com"
            },
            "professionalSummary": "Summary from script",
            "experience": [],
            "education": [],
            "technicalSkills": ["Python", "Flask"],
            "softSkills": ["Communication"]
        }
    }
    
    try:
        print(f"Sending POST request to {BASE_URL}/save...")
        response = requests.post(f"{BASE_URL}/save", headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("Save successful!")
            return response.json()['data']['cv_id']
        else:
            print("Save failed.")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_list_cvs():
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }
    
    try:
        print(f"Sending GET request to {BASE_URL}/list...")
        response = requests.get(f"{BASE_URL}/list", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    cv_id = test_save_cv()
    if cv_id:
        test_list_cvs()
