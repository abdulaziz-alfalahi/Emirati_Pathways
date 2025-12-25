
import urllib.request
import urllib.error
import urllib.parse
import json
import ssl

API_BASE_URL = "http://127.0.0.1:5003"
# The backend checks for "Bearer mock_token_admin_..." to bypass standard auth in debug mode
# Based on my checks of similar files. If not, I'll need to use a real login flow.
# administrator_routes.py uses `auth_manager.verify_token(token)`.
# Let's hope the auth manager supports mock tokens or I'll need to patch it or login.
# Wait, let's try a standard login first if possible, or just the mock token if I see it supported in auth_manager.

# Checking auth_manager.py logic would take time. Let's try to assume mock support or fail fast.
# In `hr_candidate_search_routes.py` I saw explicit mock token support.
# In `administrator_routes.py`, `admin_required` calls `auth_manager.verify_token(token)`.

# I will try to login as an admin first.
# If that fails, I'll inspect auth_manager.

def verify_admin_dashboard():
    print(f"Testing Admin Dashboard API at {API_BASE_URL}...")
    
    # 1. Login (assuming we have an admin user, or create one if needed)
    # Since I don't know an admin credential, I might need to Create one via the script if I can side-load it,
    # OR rely on a mock token bypass.
    # Let's try the mock token first, as `test_endpoints.py` often uses them.
    # Pattern seen in `hr_candidate_search`: "Bearer mock_token_..."
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer mock_token_admin_123" 
    }
    
    # However, `administrator_routes.py` line 48 calls `auth_manager.verify_token`.
    # I suspect I might get a 401. 
    # Let's try hitting the health check first.
    
    try:
        req = urllib.request.Request(f"{API_BASE_URL}/api/admin/health", headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"Health Check: {data}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

    # Now Dashboard
    try:
        req = urllib.request.Request(f"{API_BASE_URL}/api/admin/dashboard", headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("Dashboard Data Received!")
            print(json.dumps(data, indent=2))
            return True
    except urllib.error.HTTPError as e:
        print(f"Dashboard Request Failed: {e.code} - {e.reason}")
        error_body = e.read().decode()
        print(f"Error Body: {error_body}")
        
        # If 401/403, we need to handle auth.
        return False
    except Exception as e:
        print(f"General Error: {e}")
        return False

if __name__ == "__main__":
    verify_admin_dashboard()
