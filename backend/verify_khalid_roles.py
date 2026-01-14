
import sys
import os
import logging
from pprint import pprint

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from administrator_system import AdministratorSystem

# Mock DB Config (matching unified_server.py defaults)
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def verify_khalid():
    try:
        logging.basicConfig(level=logging.INFO)
        print("Initializing Admin System...")
        admin_system = AdministratorSystem(db_config)
        
        print("\n--- Searching for Khalid ---")
        # Search specifically for Khalid
        res = admin_system.get_all_users(page=1, per_page=10, search='Khalid')
        
        users = res.get('users', [])
        print(f"Found {len(users)} users matching 'Khalid'")
        
        for user in users:
            print(f"\nUser: {user.get('full_name')} (ID: {user.get('id')})")
            print(f"Primary Role: {user.get('primary_role')}")
            print(f"Secondary Roles: {user.get('secondary_roles')}")
            print(f"Assigned Roles (Join): {user.get('assigned_roles')}")
            print(f"Final Merged Roles: {user.get('roles')}")
            
            if len(user.get('roles', [])) > 1:
                print("SUCCESS: Multiple roles found.")
            else:
                print("WARNING: Only one role found. Check if secondary roles exist.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_khalid()
