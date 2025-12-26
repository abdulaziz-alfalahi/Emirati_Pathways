
import sys
import os
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Add backend directory to path
sys.path.append(os.path.abspath('backend'))

try:
    print("Importing app...")
    from app import app
    print("App imported successfully.")
    
    # Try to initialize matching engine which seemed to trigger something
    # from matching.job_matching_engine_optimized import get_enhanced_matching_engine
    # get_enhanced_matching_engine()

    print("Creating test client...")
    client = app.test_client()

    print("Attempting dev-login request...")
    response = client.post('/api/auth/dev-login', json={
        'email': 'omar.alrashid@recruitment.ae',
        'role': 'hr_recruiter',
        'user_id': '3'
    })
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.get_data(as_text=True)}")

except Exception as e:
    with open('error.log', 'w') as f:
        f.write(f"CRITICAL ERROR: {e}\n")
        traceback.print_exc(file=f)
    print("Error written to error.log")
