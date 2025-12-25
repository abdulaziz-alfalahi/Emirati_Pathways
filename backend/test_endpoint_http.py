
import requests
import json
import os

BASE_URL = 'http://localhost:5003'

def test_shortlist_http():
    try:
        # 1. Login to get token
        print("Logging in as Zara Saeed...")
        login_payload = {
            'username': 'zara.saeed', # Assuming username from seed or known format. 
            # Wait, dev_login uses params or body? check routes/auth_routes.py
            # dev_login is usually POST /api/auth/dev-login with {user_id: ...} or just creates one?
            # Let's use the standard login if possible, or dev-login if I recall it.
            # I saw dev_login takes user_id via query param or body. 
            # View file showed: request.args.get('user_id') or body.
        }
        
        # User ID 47 is Zara
        login_resp = requests.post(f"{BASE_URL}/api/auth/dev-login", json={'user_id': 47, 'role': 'hr_manager'})
        if login_resp.status_code != 200:
            print(f"❌ Login failed: {login_resp.text}")
            return
            
        token = login_resp.json()['access_token']
        print(f"✅ Got Token. Accessing Shortlist Endpoint...")
        
        # 2. Call Shortlist Endpoint
        headers = {'Authorization': f'Bearer {token}'}
        resp = requests.get(f"{BASE_URL}/api/hr/jobs/shortlisted-candidates", headers=headers)
        
        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()['data']
            print(f"✅ Success! Found {len(data)} candidates.")
            print(json.dumps(data[:1], indent=2))
        else:
            print(f"❌ Failed: {resp.text}")

    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_shortlist_http()
