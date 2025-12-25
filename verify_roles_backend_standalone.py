import sys
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.ERROR)

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from administrator_system import AdministratorSystem

DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def check_system_output():
    print("--- START DEBUG ---")
    try:
        admin_sys = AdministratorSystem(DB_CONFIG)
        print("Admin System Initialized")
        
        users_data = admin_sys.get_all_users(page=1, per_page=50)
        users = users_data.get('users', [])
        
        print(f"Total Users Found: {len(users)}")
        target_emails = ['aisha.alsuwaidi@email.ae', 'ahmed.almansouri@email.ae', 'omar.alrashid@moe.gov.ae', 'admin@emiratijourney.ae']
        for u in users:
            if u.get('email') in target_emails:
                roles = u.get('roles')
                print(f"User: {u.get('username')} [{u.get('email')}] - Roles: {roles} (Type: {type(roles)})")
            
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    print("--- END DEBUG ---")

if __name__ == "__main__":
    check_system_output()
