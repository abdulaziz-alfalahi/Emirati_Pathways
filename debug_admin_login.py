import sys
import os
import logging

# Add the current directory to sys.path so we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.auth.auth_manager import AuthenticationManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_admin_login():
    auth_manager = AuthenticationManager()
    
    email = "admin@emiratijourney.ae"
    password = "TestPassword123!"
    
    print(f"Testing login for {email} with password {password}...")
    
    # Check if user exists first
    success = auth_manager._user_exists(email)
    if success:
        print(f"User {email} EXISTS in the database.")
    else:
        print(f"User {email} DOES NOT EXIST in the database.")
        return

    # Try to authenticate
    success, message, data = auth_manager.authenticate_user(email, password)
    
    if success:
        print("Login SUCCESSFUL!")
        print(f"Token: {data.get('access_token')}")
    else:
        print(f"Login FAILED: {message}")

if __name__ == "__main__":
    test_admin_login()
