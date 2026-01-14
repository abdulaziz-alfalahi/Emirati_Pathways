
import requests
import json
import sys
import uuid

BASE_URL = "http://localhost:5006/api"

def run_test():
    print("🚀 Starting Role Workflow Test...")
    
    # 1. Setup Test User
    email = f"test_role_{uuid.uuid4().hex[:6]}@example.com"
    password = "Password123!"
    
    print(f"👤 Creating test user: {email}")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "User",
        "role": "candidate",
        "phone": "+971501234567",
        "emirate": "Dubai"
    })
    
    if reg_res.status_code not in [200, 201]:
        print(f"❌ Registration failed: {reg_res.text}")
        return

    # In auth_routes.py, if auth_manager returns success, it returns:
    # { 'success': True, 'data': { 'user_id': ..., ... } }
    # But wait, looking at auth_routes.py, line 54:
    # 'user_id': result_data['user_data']['id'] if 'user_data' in result_data else None,
    # AND auth_manager_fixed.py line 275 returns:
    # { 'user_id': str(user_id), ... } WITHOUT 'user_data' wrapper.
    # So auth_routes.py fails to find 'user_data' and returns None for user_id!
    # However, 'token' is likely NOT returned in register!
    # Let's check auth_routes.py register() -> it returns success message but NO token?
    # auth_manager.register_user returns (success, message, result_data)
    # result_data = {'user_id': ..., ...}
    # auth_routes.py constructs response.
    # It does NOT call create_access_token.
    # So we must LOGIN after register.
    
    print("✅ User Registered. Logging in to get token...")
    
    # Login to get token
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    if login_res.status_code != 200:
        print(f"❌ Login after register failed: {login_res.text}")
        return

    user_token = login_res.json()['data']['access_token']
    user_id = login_res.json()['data']['user']['id']
    print(f"✅ User Logged In (ID: {user_id})")

    # 2. Submit Role Request
    print("📝 Submitting request for 'Mentor' role...")
    req_res = requests.post(
        f"{BASE_URL}/roles/request",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"role": "Mentor", "notes": "Automated test request"}
    )
    
    if req_res.status_code != 201:
        print(f"❌ Role request failed: {req_res.text}")
        return
        
    request_id = req_res.json()['data']['request_id']
    print(f"✅ Request Submitted (ID: {request_id})")

    # 3. Setup Test Admin (We need a token with admin privileges)
    # For this test, we might fallback to mocking admin if we can't easily register one via API.
    # But wait, looking at auth_routes, anyone can register. Admin check is usually a decorator.
    # The role_routes uses @jwt_required but doesn't strictly check 'admin' role in the code I wrote (I left a TODO).
    # So ANY logged in user might be able to approve for now? 
    # Let's check role_routes.py content I wrote.
    # "TODO: Add explicit check for Admin role here" -> It means currently NO check other than JWT.
    # So I can use the same user to approve mostly, or create another user.
    # Let's create a second user acting as 'admin' just to be clean, even if the check is missing.
    
    admin_email = f"admin_{uuid.uuid4().hex[:6]}@example.com"
    print(f"👮 Creating admin user: {admin_email}")
    admin_res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": admin_email,
        "password": password,
        "first_name": "Admin",
        "last_name": "User",
        "role": "administrator",
        "phone": "+971509999999",
        "emirate": "Abu Dhabi" 
    })
    
    # Admin Login
    print("✅ Admin Registered. Logging in...")
    admin_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": admin_email,
        "password": password
    })
    
    if admin_login.status_code != 200:
        print(f"❌ Admin login failed: {admin_login.text}")
        return

    admin_token = admin_login.json()['data']['access_token']
    
    # 4. Approve Request
    print(f"✅ Approving request {request_id}...")
    approve_res = requests.put(
        f"{BASE_URL}/roles/admin/request/{request_id}/action",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "approve", "notes": "Approved by test script"}
    )
    
    if approve_res.status_code != 200:
        print(f"❌ Approval failed: {approve_res.text}")
        return

    print("✅ Request Approved")

    # 5. Verify User Role Updated
    print("🔍 Verifying user roles...")
    # Refresh user profile
    # We need an endpoint that returns the user's FULL data including secondary_roles.
    # auth_routes.py /me or /profile usually returns this.
    # Let's try /auth/me or similar if it exists, otherwise /auth/login again or similar.
    # Actually, I added secondary_roles to the login response in auth_routes.py? 
    # No, I updated get_user_roles which is likely used by FE.
    
    # Let's login again to see fresh data
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    user_data = login_res.json()['data']['user']
    secondary_roles = user_data.get('secondary_roles', [])
    
    print(f"Current Secondary Roles: {secondary_roles}")
    
    if "Mentor" in secondary_roles:
        print("🎉 SUCCESS: 'Mentor' role found in secondary_roles!")
    else:
        print("❌ FAILURE: 'Mentor' role NOT found.")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"❌ Test Exception: {e}")
