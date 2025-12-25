
import urllib.request
import urllib.error
import json
import os

API_BASE_URL = "http://127.0.0.1:5003"

def verify_user_management():
    print(f"Testing User Management API at {API_BASE_URL}...")
    
    # Using mock token that should satisfy auth_manager verification if we are lucky,
    # or failing that, we assume the previous 401 was due to missing headers which we now provide.
    # Note: earlier 401 confirm auth IS required.
    # The `auth_manager.verify_token` checks database or JWT.
    # Since I cannot easily generate a valid JWT without logging in, and I typically avoid interacting with
    # login flows via script unless necessary, I will try to use the `dev_issue_token.py` script if it exists,
    # or just assume I need to login with the mock user I might have created.
    
    # Wait, `administrator_routes.py` lines 41-43 check for Bearer token.
    # If I don't provide a valid one, I won't get data.
    
    # Let's try to simulate a login first.
    # I see `verify_admin_flow.py` failed with 401. I need to fix that first.
    # To fix 401, I need to validly login as an admin.
    # User 'admin@emiratijourney.ae' / 'admin' might exist from seeds?
    
    login_url = f"{API_BASE_URL}/api/auth/login"
    login_data = {
        "email": "admin@emiratijourney.ae",
        "password": "TestPassword123!" # From setup_postgresql_users.py
    }
    
    # Actually, let's look for seed data in `setup_test_users.py` or similar.
    # But for now, I'll try to hitting the endpoint.
    
    try:
        # Try Login
        req = urllib.request.Request(login_url, data=json.dumps(login_data).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            token = data.get('data', {}).get('access_token')
            print("Login Successful!")
    except Exception:
        print("Standard Login Failed. Trying to proceed with Mock Token just in case specific debug bypass exists (unlikely given code).")
        token = "mock_token_admin_bypass" # This likely won't work based on code inspection.

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    try:
        # List Users
        req = urllib.request.Request(f"{API_BASE_URL}/api/admin/users?page=1&per_page=5", headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("Users List Received!")
            print(json.dumps(data, indent=2))
            
            users = data.get('data', {}).get('users', [])
            if users:
                user_id = users[0]['id']
                print(f"Fetching details for user {user_id}...")
                
                # DETAILS
                req_details = urllib.request.Request(f"{API_BASE_URL}/api/admin/users/{user_id}", headers=headers)
                with urllib.request.urlopen(req_details) as resp_details:
                    details = json.loads(resp_details.read().decode())
                    print("User Details Received!")

    except urllib.error.HTTPError as e:
        print(f"Request Failed: {e.code} - {e.reason}")
        print(e.read().decode())
    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    verify_user_management()
