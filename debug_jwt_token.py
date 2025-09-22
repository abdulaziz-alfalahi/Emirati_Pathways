#!/usr/bin/env python3
"""
Debug JWT Token Issue
"""

import requests
import json

# Test registration and login to debug JWT token
base_url = "http://localhost:5003"

# Register a test user
registration_data = {
    "first_name": "Test",
    "last_name": "User",
    "email": "debug_test@example.com",
    "password": "SecurePass123!",
    "role": "recruiter",
    "phone": "+971501234567",
    "emirate": "Dubai",
    "nationality": "UAE"
}

print("🔧 Debugging JWT Token Issue")
print("=" * 40)

# Register user
print("1. Registering test user...")
try:
    response = requests.post(f"{base_url}/api/auth/register", json=registration_data)
    print(f"Registration Status: {response.status_code}")
    print(f"Registration Response: {response.text}")
    
    if response.status_code == 201:
        print("✅ Registration successful")
    elif "already exists" in response.text:
        print("ℹ️ User already exists, proceeding to login")
    else:
        print("❌ Registration failed")
        exit(1)
except Exception as e:
    print(f"❌ Registration error: {e}")
    exit(1)

# Login user
print("\n2. Logging in test user...")
login_data = {
    "email": "debug_test@example.com",
    "password": "SecurePass123!"
}

try:
    response = requests.post(f"{base_url}/api/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
    print(f"Login Response: {response.text}")
    
    if response.status_code == 200:
        login_result = response.json()
        token = login_result.get('data', {}).get('access_token')
        print(f"✅ Login successful")
        print(f"Token: {token}")
        print(f"Token length: {len(token) if token else 'None'}")
        
        if token:
            # Count segments
            segments = token.split('.')
            print(f"Token segments: {len(segments)}")
            for i, segment in enumerate(segments):
                print(f"  Segment {i+1}: {segment[:20]}... (length: {len(segment)})")
        
    else:
        print("❌ Login failed")
        exit(1)
except Exception as e:
    print(f"❌ Login error: {e}")
    exit(1)

# Test protected endpoint
print("\n3. Testing protected endpoint...")
if token:
    headers = {'Authorization': f'Bearer {token}'}
    try:
        response = requests.get(f"{base_url}/api/hr/profile", headers=headers)
        print(f"Protected endpoint status: {response.status_code}")
        print(f"Protected endpoint response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Protected endpoint access successful")
        else:
            print("❌ Protected endpoint access failed")
    except Exception as e:
        print(f"❌ Protected endpoint error: {e}")

print("\n🔧 JWT Debug Complete")
