
import sys
import os
import requests
import json
import traceback

# Simulate the request locally
# Need to setup path to import backend modules directly or use requests against localhost
# Since server is running, let's use requests first.

BASE_URL = "http://localhost:5003"
# We need a valid token. 
# Mock login to get token
try:
    print("Logging in...", flush=True)
    # The backend doesn't have a real /auth/login that returns a JWT for 'admin' easily without knowing the password hash logic 
    # or if we can use the MockAuthService equivalent on backend?
    # Actually, verify_roles_backend.py used AdministratorSystem directly. 
    # Let's try to call the ROUTE function directly by importing app context.
    
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from unified_server import app
    from administrator_system import AdministratorSystem
    
    # We need to bypass @admin_required decorator or mock the context
    # Easier to just invoke the system method directly first to see if THAT crashes
    
    print("Checking AdministratorSystem methods...", flush=True)
    DB_CONFIG = {
        'host': 'localhost',
        'port': 5432,
        'database': 'emirati_journey',
        'user': 'emirati_user',
        'password': 'emirati_secure_password'
    }
    
    admin_system = AdministratorSystem(DB_CONFIG)
    
    print("Calling get_system_health...", flush=True)
    print(admin_system.get_system_health())
    
    print("Calling get_system_metrics...", flush=True)
    print(admin_system.get_system_metrics(hours_back=24))
    
    print("Calling get_recent_audit_logs...", flush=True)
    logs = admin_system.get_recent_audit_logs(limit=10)
    print(f"Logs found: {len(logs)}")
    print(logs)
    
    print("Calling get_dashboard_analytics...", flush=True)
    print(admin_system.get_dashboard_analytics())

    print("ALL SYSTEM METHODS PASSED. Issue must be in ROUTE composition.", flush=True)

except Exception as e:
    print("CRASHED:", e)
    traceback.print_exc()
