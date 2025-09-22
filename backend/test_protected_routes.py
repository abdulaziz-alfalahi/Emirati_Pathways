#!/usr/bin/env python3
"""
Test Protected Routes Access After Login
This script verifies the complete authentication flow and protected route access
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5001"
TEST_USER = {
    "email": "showcase@test.com",
    "password": "Test123!"
}

def test_authentication_flow():
    """Test complete authentication flow and protected routes access"""
    
    print("🔍 Testing Complete Authentication Flow")
    print("=" * 50)
    
    # Step 1: Test login and get JWT tokens
    print("\n1️⃣ Testing Login...")
    login_url = f"{BASE_URL}/api/auth/login"
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    try:
        login_response = requests.post(
            login_url,
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status Code: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            print("   ✅ Login successful!")
            
            # Extract JWT token
            if 'data' in login_result and 'access_token' in login_result['data']:
                access_token = login_result['data']['access_token']
                print(f"   🔑 Access Token: {access_token[:50]}...")
                
                # Step 2: Test protected routes with JWT token
                print("\n2️⃣ Testing Protected Routes Access...")
                test_protected_routes(access_token)
                
            else:
                print("   ❌ No access token in response")
                print(f"   Response: {login_result}")
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")

def test_protected_routes(access_token):
    """Test access to protected routes with JWT token"""
    
    # Headers with JWT token
    auth_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # List of protected routes to test
    protected_routes = [
        {
            "name": "List CVs",
            "method": "GET",
            "url": f"{BASE_URL}/api/data/cvs",
            "expected_fields": ["success", "cvs", "total_count"]
        },
        {
            "name": "List JDs", 
            "method": "GET",
            "url": f"{BASE_URL}/api/data/jds",
            "expected_fields": ["success", "jds", "total_count"]
        },
        {
            "name": "Parse CV Text",
            "method": "POST", 
            "url": f"{BASE_URL}/api/cv/parse-text",
            "data": {"text": "John Doe\nSoftware Engineer\nExperience: 5 years\nSkills: Python, JavaScript"},
            "expected_fields": ["success", "cv_id", "data"]
        },
        {
            "name": "Parse JD Text",
            "method": "POST",
            "url": f"{BASE_URL}/api/jd/parse-text", 
            "data": {"text": "Software Engineer Position\nRequirements: 3+ years experience\nSkills: Python, React"},
            "expected_fields": ["success", "jd_id", "data"]
        }
    ]
    
    results = []
    
    for route in protected_routes:
        print(f"\n   🧪 Testing: {route['name']}")
        
        try:
            if route['method'] == 'GET':
                response = requests.get(route['url'], headers=auth_headers)
            elif route['method'] == 'POST':
                response = requests.post(route['url'], json=route.get('data', {}), headers=auth_headers)
            
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # Check expected fields
                missing_fields = []
                for field in route['expected_fields']:
                    if field not in result:
                        missing_fields.append(field)
                
                if not missing_fields:
                    print(f"      ✅ Success - All expected fields present")
                    results.append({"route": route['name'], "status": "✅ PASS"})
                else:
                    print(f"      ⚠️ Missing fields: {missing_fields}")
                    results.append({"route": route['name'], "status": "⚠️ PARTIAL"})
                
                # Show some response data
                if 'success' in result:
                    print(f"      Success: {result['success']}")
                if 'total_count' in result:
                    print(f"      Total Count: {result['total_count']}")
                if 'cv_id' in result:
                    print(f"      CV ID: {result['cv_id']}")
                if 'jd_id' in result:
                    print(f"      JD ID: {result['jd_id']}")
                    
            elif response.status_code == 401:
                print(f"      ❌ Unauthorized - JWT token issue")
                results.append({"route": route['name'], "status": "❌ UNAUTHORIZED"})
            else:
                print(f"      ❌ Failed: {response.text}")
                results.append({"route": route['name'], "status": f"❌ ERROR ({response.status_code})"})
                
        except Exception as e:
            print(f"      ❌ Exception: {e}")
            results.append({"route": route['name'], "status": f"❌ EXCEPTION"})
    
    # Step 3: Test without JWT token (should fail)
    print("\n3️⃣ Testing Routes WITHOUT JWT Token (Should Fail)...")
    test_unauthorized_access()
    
    # Step 4: Summary
    print("\n4️⃣ Test Results Summary")
    print("=" * 30)
    for result in results:
        print(f"   {result['route']}: {result['status']}")
    
    # Overall assessment
    passed = len([r for r in results if "✅" in r['status']])
    total = len(results)
    
    print(f"\n🎯 Overall Result: {passed}/{total} protected routes working")
    
    if passed == total:
        print("🎉 ALL PROTECTED ROUTES WORKING PERFECTLY!")
        print("✅ Frontend can access all protected routes after login")
    elif passed > 0:
        print("⚠️ Some protected routes working, some issues detected")
    else:
        print("❌ Protected routes not accessible - authentication issue")

def test_unauthorized_access():
    """Test that routes are properly protected (should fail without token)"""
    
    # Test without any token
    test_url = f"{BASE_URL}/api/data/cvs"
    
    try:
        response = requests.get(test_url)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Properly protected - Unauthorized without token")
        else:
            print(f"   ❌ Route not properly protected: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error testing unauthorized access: {e}")

def test_token_refresh():
    """Test JWT token refresh functionality"""
    print("\n5️⃣ Testing Token Refresh...")
    
    # First login to get refresh token
    login_url = f"{BASE_URL}/api/auth/login"
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    try:
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            
            if 'data' in login_result and 'refresh_token' in login_result['data']:
                refresh_token = login_result['data']['refresh_token']
                
                # Test refresh endpoint
                refresh_url = f"{BASE_URL}/api/auth/refresh"
                refresh_headers = {"Authorization": f"Bearer {refresh_token}"}
                
                refresh_response = requests.post(refresh_url, headers=refresh_headers)
                print(f"   Refresh Status: {refresh_response.status_code}")
                
                if refresh_response.status_code == 200:
                    print("   ✅ Token refresh working")
                else:
                    print(f"   ❌ Token refresh failed: {refresh_response.text}")
            else:
                print("   ⚠️ No refresh token in login response")
        else:
            print(f"   ❌ Cannot test refresh - login failed")
            
    except Exception as e:
        print(f"   ❌ Token refresh test error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Protected Routes Verification")
    print(f"🌐 Backend URL: {BASE_URL}")
    print(f"👤 Test User: {TEST_USER['email']}")
    
    # Run the complete test
    test_authentication_flow()
    
    # Test token refresh
    test_token_refresh()
    
    print("\n" + "=" * 50)
    print("🏁 Protected Routes Verification Complete")

