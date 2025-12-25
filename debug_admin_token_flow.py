import requests
import json
import sys

# API Base URL
BASE_URL = "http://127.0.0.1:5003"

def debug_flow():
    print("1. Attempting Login...")
    login_url = f"{BASE_URL}/api/auth/login"
    payload = {
        "email": "admin@emiratijourney.ae",
        "password": "TestPassword123!"
    }
    
    try:
        resp = requests.post(login_url, json=payload)
        print(f"Login Response Status: {resp.status_code}")
        if resp.status_code != 200:
            print("Login Failed:", resp.text)
            return

        data = resp.json()
        token = data.get('data', {}).get('access_token')
        if not token:
            print("No access_token in login response:", data)
            return
            
        print(f"Token Acquired: {token[:20]}...")
        
        print("\n2. Accessing Admin Dashboard...")
        dash_url = f"{BASE_URL}/api/admin/dashboard"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        resp2 = requests.get(dash_url, headers=headers)
        print(f"Dashboard Response Status: {resp2.status_code}")
        print("Dashboard Response Body:", resp2.text)
        
    except Exception as e:
        print(f"Exception during debug flow: {e}")

if __name__ == "__main__":
    debug_flow()
