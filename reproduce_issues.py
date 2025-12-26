
import requests
import json

BASE_URL = "http://127.0.0.1:5005"

def get_auth_token():
    url = f"{BASE_URL}/api/auth/dev-login"
    payload = {
        'email': 'omar.alrashid@recruitment.ae',
        'role': 'hr_recruiter',
        'user_id': '3'
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        data = response.json()
        if 'data' in data and 'access_token' in data['data']:
            return data['data']['access_token']
        return data.get('access_token')
    except Exception as e:
        print(f"Login failed: {e}")
        if 'response' in locals():
            print(f"Response content: {response.text}")
        return None

def test_endpoint(token, method, endpoint, params=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {'Authorization': f'Bearer {token}'}
    print(f"\n--- Testing {method} {endpoint} ---")
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=params, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print("Response (first 1000 chars):")
            print(response.text[:1000])
        else:
            print("Success")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    token = get_auth_token()
    if token:
        print("Logged in successfully.")
        
        # 1. Test HR Jobs (500 Error)
        test_endpoint(token, 'GET', '/api/hr/jobs', {'limit': 100, 'status': 'active'})
        
        # 2. Test Video Sessions (500 Error)
        test_endpoint(token, 'GET', '/api/video-interview/sessions', {'role': 'recruiter'})
        
        # 3. Test Messages (500 Error)
        test_endpoint(token, 'GET', '/api/communication/conversations')
        
        # 4. Test Recruiter JD List (404 Error)
        test_endpoint(token, 'GET', '/api/recruiter/jd/list')

    else:
        print("Cannot proceed without token.")
