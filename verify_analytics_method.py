import sys
import os
import logging

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

def verify_analytics():
    print("--- CHECK ANALYTICS ---")
    try:
        admin_sys = AdministratorSystem(DB_CONFIG)
        analytics = admin_sys.get_dashboard_analytics()
        
        print("Keys:", analytics.keys())
        print("Visitor Trends (First 2):", analytics.get('visitorTrends', [])[:2])
        print("User Activity:", analytics.get('userActivity', []))
        
        # Validation
        if not analytics.get('visitorTrends'):
            print("FAILED: No visitor trends")
        if not analytics.get('userActivity'):
            print("FAILED: No user activity")
            
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    print("--- END CHECK ---")

if __name__ == "__main__":
    verify_analytics()
