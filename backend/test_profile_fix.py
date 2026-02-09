
import sys
import os
import logging
from unittest.mock import MagicMock, patch

# Configure path: Add 'backend' to sys.path so we can import 'app' and 'extensions' like the server does
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)
# Also add root for other potential imports if needed, but backend is priority to match app.py
root_dir = os.path.abspath(os.path.join(backend_dir, '..'))
sys.path.append(root_dir)

try:
    from app import app
    from extensions import db
    # We still need to import route functions. 
    # Since we are in 'backend' root, 'routes.profile...' works if 'routes' is a package in backend.
    from routes.profile.profile_routes_v2 import get_my_profile
    from flask_jwt_extended import create_access_token
    
    print("✅ App and DB successfully imported (backend context)")
except ImportError as e:
    print(f"❌ Failed to import setup: {e}")
    sys.exit(1)

def test_profile_fetch():
    print("\n--- Testing Profile Fetch Logic ---")
    
    with app.app_context():
        # Setup Logger
        logging.basicConfig(level=logging.ERROR)
        
        # Test Case 1: Simulate the exact error condition (String ID)
        user_id_raw = "999999" 
        
        # Create a real token
        access_token = create_access_token(identity=user_id_raw)
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        print(f"Testing with User ID: {user_id_raw} using valid JWT")
        
        # Use request context with headers
        with app.test_request_context('/api/v2/profile/', headers=headers):
            try:
                # Call the function directly
                response, status_code = get_my_profile()
                print(f"\n✅ Result Status Code: {status_code}")
                try:
                    print(f"✅ Result Data: {response.get_json()}")
                except:
                    print(f"✅ Result Data (Raw): {response}")
                
                if status_code == 200:
                    print("\nSUCCESS: The 500 error is RESOLVED. Profile created/returned.")
                else:
                    print(f"\nFAILURE: Still returning {status_code}")
                    
            except Exception as e:
                print(f"\n❌ CRITICAL FAILURE (Uncaught Exception): {e}")
                import traceback
                traceback.print_exc()

if __name__ == "__main__":
    test_profile_fetch()
