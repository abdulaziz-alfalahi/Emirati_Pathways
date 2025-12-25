
import requests
import json

BASE_URL = "http://localhost:5005"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
SESSIONS_URL = f"{BASE_URL}/api/video-interview/sessions?role=recruiter"

def test_list_sessions():
    # Login as recruiter
    # Using the credentials that likely correspond to the user in the UI
    payload = {
        "email": "omar.alrashid@recruitment.ae", 
        "password": "password123"
    }
    
    try:
        print(f"Logging in as {payload['email']}...")
        session = requests.Session()
        resp = session.post(LOGIN_URL, json=payload)
        
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return

        token = resp.json().get('access_token')
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Fetching interviews...")
        resp = session.get(SESSIONS_URL, headers=headers)
        
        print(f"Status: {resp.status_code}")
        print(json.dumps(resp.json(), indent=2))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_list_sessions()
