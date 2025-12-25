
import sys
import os
import psutil

sys.path.append(os.path.join(os.getcwd(), 'backend'))
# Mock DB config
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

try:
    from administrator_system import AdministratorSystem
    print("Testing get_system_health...")
    admin = AdministratorSystem(DB_CONFIG)
    health = admin.get_system_health()
    print("System Resources:", health.get('system_resources'))
    
    res = health.get('system_resources', {})
    if res.get('cpu_percent') is not None:
        print("SUCCESS: Real Data Found")
    else:
        print("FAILURE: No CPU Data")
        
except Exception as e:
    print(f"Error: {e}")
