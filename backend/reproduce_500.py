
import requests
import json
import sys

# Configuration
BASE_URL = 'http://localhost:5000'
LOGIN_URL = f'{BASE_URL}/api/auth/login'
ADMIN_REQUESTS_URL = f'{BASE_URL}/api/roles/admin/requests'

# Test User Credentials (Admin)
EMAIL = 'admin@emirati.ae' # Assumed admin email, might need to adjust
PASSWORD = 'admin_password' # Assumed

def test_admin_requests():
    session = requests.Session()
    
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    try:
        resp = session.post(LOGIN_URL, json={'email': EMAIL, 'password': PASSWORD})
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} - {resp.text}")
            return
        
        token = resp.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        print("Login successful.")
        
    except Exception as e:
        print(f"Login exception: {str(e)}")
        return

    # 2. Fetch Admin Requests
    print(f"Fetching admin requests from {ADMIN_REQUESTS_URL}...")
    try:
        resp = session.get(ADMIN_REQUESTS_URL, headers=headers)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
        
    except Exception as e:
        print(f"Request exception: {str(e)}")

if __name__ == '__main__':
    test_admin_requests()
