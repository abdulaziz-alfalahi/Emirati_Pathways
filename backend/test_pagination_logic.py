
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

def test_pagination():
    try:
        logging.basicConfig(level=logging.INFO)
        print("Initializing Admin System...")
        admin_system = AdministratorSystem(db_config)
        
        print("\n--- Testing Page 1 (Limit 20) ---")
        res1 = admin_system.get_all_users(page=1, per_page=20, status_filter='all')
        print(f"Total Users: {res1['total']}")
        print(f"Page 1 Users Count: {len(res1['users'])}")
        print(f"First User ID: {res1['users'][0]['id'] if res1['users'] else 'None'}")
        
        if res1['total'] > 20:
            print("\n--- Testing Page 2 (Limit 20) ---")
            res2 = admin_system.get_all_users(page=2, per_page=20, status_filter='all')
            print(f"Page 2 Users Count: {len(res2['users'])}")
            if res2['users']:
                print(f"First User on Page 2 ID: {res2['users'][0]['id']}")
                
                # Verify distinctness
                ids_page1 = {u['id'] for u in res1['users']}
                ids_page2 = {u['id'] for u in res2['users']}
                overlap = ids_page1.intersection(ids_page2)
                print(f"Overlap between P1 and P2: {overlap}")
                
                if not overlap:
                    print("SUCCESS: Pagination distinct.")
                else:
                    print("FAILURE: Pagination overlaps!")
            else:
                print("Page 2 is empty.")
        else:
            print("Not enough users to test page 2.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_pagination()
