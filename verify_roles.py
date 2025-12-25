
import requests
import json
import sys

BASE_URL = "http://localhost:5003/api/admin"
# We need a valid token. The easiest way is to mock it or login.
# Since we are running outside the browser, we'll try to login as admin first if possible,
# or assume the server accepts a mock token if we configured it so (we haven't).
# Actually, the auth middleware checks `auth_manager.verify_token`.
# I'll rely on the fact that I can generate a token or I'll just check if the server responds at all.

# Better: use the mocked auth service in frontend logic? No, python script.
# I'll try to login with the script using the default admin credentials.

DEFAULT_ADMIN = {
    "email": "temp_admin@test.com",
    "password": "TestPassword123!" 
}

def test_roles():
    session = requests.Session()
    
    # 1. Login
    try:
        print("Logging in...")
        resp = session.post(f"http://localhost:5003/api/auth/login", json=DEFAULT_ADMIN)
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        
        token = resp.json()['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        print("Login successful.")

        # 2. Get Roles
        print("\nFetching Roles...")
        resp = session.get(f"{BASE_URL}/roles", headers=headers)
        if resp.status_code == 200:
            print("Roles fetched:")
            roles = resp.json()['data']
            for r in roles:
                print(f"- {r['name']} ({r['display_name']})")
        else:
            print(f"Failed to fetch roles: {resp.text}")
            return

        # 3. Create Role
        print("\nCreating Test Role...")
        new_role = {
            "name": "test_role_v1",
            "display_name": "Test Role",
            "description": "Created by verification script",
            "permissions": ["users.view"]
        }
        resp = session.post(f"{BASE_URL}/roles", json=new_role, headers=headers)
        if resp.status_code == 201:
            role_id = resp.json()['data']['id']
            print(f"Role created with ID: {role_id}")
        else:
            print(f"Failed to create role: {resp.text}")
            return

        # 4. Update Role
        print("\nUpdating Role...")
        update_data = {
            "display_name": "Test Role Updated",
            "permissions": ["users.view", "users.edit"]
        }
        resp = session.put(f"{BASE_URL}/roles/{role_id}", json=update_data, headers=headers)
        if resp.status_code == 200:
            print("Role updated.")
        else:
            print(f"Failed to update role: {resp.text}")

        # 5. Delete Role
        print("\nDeleting Role...")
        resp = session.delete(f"{BASE_URL}/roles/{role_id}", headers=headers)
        if resp.status_code == 200:
            print("Role deleted.")
        else:
            print(f"Failed to delete role: {resp.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_roles()
