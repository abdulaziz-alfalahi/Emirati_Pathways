
import requests
import sys

BASE_URL = "http://localhost:5003/api/admin"
AUTH_URL = "http://localhost:5003/api/auth"

DEFAULT_ADMIN = {
    "email": "temp_admin@test.com",
    "password": "TestPassword123!" 
}

def test_export():
    session = requests.Session()
    
    # 1. Login
    print("Logging in...")
    try:
        resp = session.post(f"{AUTH_URL}/login", json=DEFAULT_ADMIN)
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        
        token = resp.json()['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        print("Login successful.")

        # 2. Export Users
        print("\nRequesting CSV Export...")
        resp = session.get(f"{BASE_URL}/users/export", headers=headers)
        
        if resp.status_code == 200:
            print("Export successful!")
            print(f"Content-Type: {resp.headers.get('Content-Type')}")
            print(f"Content-Disposition: {resp.headers.get('Content-Disposition')}")
            
            content = resp.text
            lines = content.strip().split('\n')
            print(f"Lines received: {len(lines)}")
            if len(lines) > 0:
                print(f"Header: {lines[0]}")
                if len(lines) > 1:
                    print(f"First Row: {lines[1]}")
            
            if "ID,Full Name" in lines[0] or "ID" in lines[0]:
                print("✅ CSV Format Verified")
            else:
                print("❌ CSV Format Check Failed")

        else:
            print(f"Export failed: {resp.status_code}")
            print(resp.text)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_export()
