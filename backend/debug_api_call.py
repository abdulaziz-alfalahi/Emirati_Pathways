import requests
import json

BASE_URL = "http://localhost:5003/api"

def debug_api():
    print("--- Debugging API via HTTP ---")
    
    # 1. Login
    login_url = f"{BASE_URL}/auth/dev-login"
    payload = {"user_id": "3", "role": "recruiter", "email": "omar@test.com"}
    
    try:
        print(f"Logging in to {login_url}...")
        resp = requests.post(login_url, json=payload)
        print(f"Login Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print("Login Failed")
            return

        data = resp.json()
        token = data['data']['access_token']
        print("Token acquired.")
        
        # 2. Get Conversations
        conv_url = f"{BASE_URL}/communication/conversations"
        headers = {"Authorization": f"Bearer {token}"}
        
        print(f"Fetching conversations from {conv_url}...")
        resp = requests.get(conv_url, headers=headers)
        print(f"Conversations Status: {resp.status_code}")
        print(f"Response Body: {resp.text}")
        
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    debug_api()
