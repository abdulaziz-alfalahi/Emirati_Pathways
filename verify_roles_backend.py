import requests
import json

BASE_URL = "http://localhost:5003/api/admin"

# 1. Login to get token
login_url = f"{BASE_URL}/auth/login"
# We need a way to get a token. Using the mock user approach or if there's a login endpoint.
# Actually, the unified_server.py has a mock login helper or we can simulate the header if we bypass auth, 
# but better to use the mock auth mechanism or just check the public endpoints if any.
# Wait, the admin endpoints are protected.

# Let's try to simulate a request using python directly calling the flask app if possible, 
# OR just use the 'admin_system' directly via python script, bypassing the HTTP layer to narrow down.

# Step 1: Check admin_system.get_all_users output
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from administrator_system import AdministratorSystem
from auth.auth_manager import AuthenticationManager

def check_system_output():
    print("Checking AdministratorSystem output...")
    try:
        # Need to init with DB connection capability
        # AuthManager usually handles connection, AdminSystem takes it or inits it?
        # AdminSystem __init__ takes db_config. 
        # Let's see how it's init in unified_server.py
        
        from unified_server import db_config
        admin_sys = AdministratorSystem(db_config)
        
        # Method: get_all_users
        users_data = admin_sys.get_all_users(page=1, per_page=100)
        users = users_data['users']
        
        print(f"Found {len(users)} users.")
        for u in users:
            print(f"User: {u.get('username')} | Roles (Raw): {u.get('roles')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_system_output()
