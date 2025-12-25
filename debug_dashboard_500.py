import sys
import os
import traceback

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from backend.auth.auth_manager import AuthenticationManager
from backend.administrator_system import AdministratorSystem

def debug_dashboard():
    try:
        auth_mgr = AuthenticationManager()
        # Initialize admin system
        admin_sys = AdministratorSystem(auth_mgr.db_config)
        print("Admin System Initialized.")
        
        print("\n--- Testing get_system_health ---")
        try:
            health = admin_sys.get_system_health()
            print("Success:", health.get('status'))
            if health.get('status') != 'healthy':
                print("Health Check Error:", health)
        except Exception:
            traceback.print_exc()

        print("\n--- Testing get_system_metrics ---")
        try:
            metrics = admin_sys.get_system_metrics(hours_back=24)
            print(f"Success. Count: {len(metrics)}")
        except Exception:
            traceback.print_exc()

        print("\n--- Testing get_notifications ---")
        try:
            # Need a user ID that exists. Use 1? Or fetch one.
            # Fetch admin user id
            conn = auth_mgr._get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE email='admin@emiratijourney.ae'")
            row = cur.fetchone()
            if row:
                uid = row[0]
                nots = admin_sys.get_notifications(target_user_id=uid)
                print(f"Success. Count: {len(nots)}")
            else:
                print("Admin user not found for notif test.")
        except Exception:
            traceback.print_exc()

    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    debug_dashboard()
