import requests
import sys

# The logs showed the server running on port 5005
BASE_URL = "http://127.0.0.1:5005"
COMPANY_ID = "fd096b45-45ba-4aea-a3a4-9adcad8a2679" # Test Team Chat Company

def check_endpoint():
    url = f"{BASE_URL}/api/company/team/members"
    params = {'company_id': COMPANY_ID}
    
    print(f"Testing URL: {url}")
    print(f"Params: {params}")
    
    try:
        # We need a token? The endpoint has @jwt_required()
        # But maybe we can check if it returns 401 instead of 404.
        # 404 = Not Registered / Wrong URL
        # 401 = Registered but needs auth
        # 200 = Working (if we mock auth or if I can login first)
        
        # Let's try 404 check first (without auth)
        response = requests.get(url, params=params)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("❌ FAILED: Endpoint not found (404)")
            return False
        elif response.status_code == 401:
            print("✅ PASSED: Endpoint exists (401 Unauthorized mean route is registered)")
            return True
        elif response.status_code == 200:
             print("✅ PASSED: Endpoint working and public?!")
             print(response.json())
             return True
        else:
             print(f"⚠️ Unexpected status: {response.status_code}")
             return True # Not 404, so route likely exists

    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return False

if __name__ == "__main__":
    check_endpoint()
