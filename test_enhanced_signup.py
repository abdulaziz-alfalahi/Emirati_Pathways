#!/usr/bin/env python3
"""
Test script for the enhanced sign-up process and role selection system
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:5003/api"
TEST_USERS = [
    {
        "first_name": "Ahmed",
        "last_name": "Al Emirati",
        "email": "ahmed.job@example.com",
        "password": "SecurePass123",
        "phone": "0501234567",
        "emirate": "Dubai",
        "user_type": "job_seeker"
    },
    {
        "first_name": "Fatima",
        "last_name": "Al Mansouri",
        "email": "fatima.hr@example.com",
        "password": "SecurePass123",
        "phone": "0507654321",
        "emirate": "Abu Dhabi",
        "user_type": "hr_recruiter"
    },
    {
        "first_name": "Mohammed",
        "last_name": "Al Zaabi",
        "email": "mohammed.edu@example.com",
        "password": "SecurePass123",
        "phone": "0509876543",
        "emirate": "Sharjah",
        "user_type": "educator"
    },
    {
        "first_name": "Aisha",
        "last_name": "Al Nuaimi",
        "email": "aisha.mentor@example.com",
        "password": "SecurePass123",
        "phone": "0502468135",
        "emirate": "Ajman",
        "user_type": "mentor"
    },
    {
        "first_name": "Omar",
        "last_name": "Al Rashid",
        "email": "omar.assess@example.com",
        "password": "SecurePass123",
        "phone": "0503691470",
        "emirate": "Ras Al Khaimah",
        "user_type": "assessor"
    }
]

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_test_result(test_name, success, message="", data=None):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if message:
        print(f"    Message: {message}")
    if data and isinstance(data, dict):
        for key, value in data.items():
            print(f"    {key}: {value}")
    print()

def test_available_roles():
    """Test getting available roles"""
    print_header("Testing Available Roles Endpoint")
    
    try:
        response = requests.get(f"{API_BASE_URL}/auth/roles")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'roles' in data.get('data', {}):
                roles = data['data']['roles']
                print_test_result(
                    "Get Available Roles",
                    True,
                    f"Retrieved {len(roles)} roles",
                    {"roles": [role['name'] for role in roles]}
                )
                return roles
            else:
                print_test_result("Get Available Roles", False, "Invalid response format")
                return []
        else:
            print_test_result("Get Available Roles", False, f"HTTP {response.status_code}")
            return []
            
    except Exception as e:
        print_test_result("Get Available Roles", False, f"Exception: {str(e)}")
        return []

def test_user_registration(user_data):
    """Test user registration with role selection"""
    print(f"Testing Registration for {user_data['user_type']}: {user_data['email']}")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/register",
            json=user_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            data = response.json()
            if data.get('success'):
                print_test_result(
                    f"Register {user_data['user_type']}",
                    True,
                    data.get('message', ''),
                    {
                        "user_id": data.get('data', {}).get('user_id', 'N/A'),
                        "role": data.get('data', {}).get('role', 'N/A'),
                        "dashboard": data.get('data', {}).get('dashboard_route', 'N/A')
                    }
                )
                return True
            else:
                print_test_result(
                    f"Register {user_data['user_type']}",
                    False,
                    data.get('message', 'Registration failed')
                )
                return False
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            print_test_result(
                f"Register {user_data['user_type']}",
                False,
                f"HTTP {response.status_code}: {error_data.get('message', 'Unknown error')}"
            )
            return False
            
    except Exception as e:
        print_test_result(f"Register {user_data['user_type']}", False, f"Exception: {str(e)}")
        return False

def test_user_login(email, password, expected_role):
    """Test user login and role-based routing"""
    print(f"Testing Login for: {email}")
    
    try:
        login_data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                user_data = data.get('data', {}).get('user', {})
                dashboard_route = data.get('data', {}).get('dashboard_route', '')
                
                print_test_result(
                    f"Login {email}",
                    True,
                    data.get('message', ''),
                    {
                        "user_type": user_data.get('user_type', 'N/A'),
                        "primary_role": user_data.get('primary_role', 'N/A'),
                        "dashboard": dashboard_route,
                        "token_present": bool(data.get('data', {}).get('access_token'))
                    }
                )
                return data.get('data', {}).get('access_token')
            else:
                print_test_result(
                    f"Login {email}",
                    False,
                    data.get('message', 'Login failed')
                )
                return None
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            print_test_result(
                f"Login {email}",
                False,
                f"HTTP {response.status_code}: {error_data.get('message', 'Unknown error')}"
            )
            return None
            
    except Exception as e:
        print_test_result(f"Login {email}", False, f"Exception: {str(e)}")
        return None

def test_role_update(access_token, primary_role, secondary_roles=None):
    """Test updating user roles"""
    if secondary_roles is None:
        secondary_roles = []
        
    print(f"Testing Role Update: Primary={primary_role}, Secondary={secondary_roles}")
    
    try:
        update_data = {
            "primary_role": primary_role,
            "secondary_roles": secondary_roles
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        response = requests.put(
            f"{API_BASE_URL}/auth/update-roles",
            json=update_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                user_data = data.get('data', {}).get('user', {})
                print_test_result(
                    "Update Roles",
                    True,
                    data.get('message', ''),
                    {
                        "primary_role": user_data.get('primary_role', 'N/A'),
                        "secondary_roles": user_data.get('secondary_roles', [])
                    }
                )
                return True
            else:
                print_test_result(
                    "Update Roles",
                    False,
                    data.get('message', 'Role update failed')
                )
                return False
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            print_test_result(
                "Update Roles",
                False,
                f"HTTP {response.status_code}: {error_data.get('message', 'Unknown error')}"
            )
            return False
            
    except Exception as e:
        print_test_result("Update Roles", False, f"Exception: {str(e)}")
        return False

def test_validation_errors():
    """Test input validation"""
    print_header("Testing Input Validation")
    
    # Test invalid email
    invalid_email_user = {
        "first_name": "Test",
        "last_name": "User",
        "email": "invalid-email",
        "password": "SecurePass123",
        "phone": "0501234567",
        "emirate": "Dubai",
        "user_type": "job_seeker"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/register",
            json=invalid_email_user,
            headers={'Content-Type': 'application/json'}
        )
        
        success = response.status_code == 400
        message = response.json().get('message', '') if response.headers.get('content-type') == 'application/json' else ''
        print_test_result("Invalid Email Validation", success, message)
        
    except Exception as e:
        print_test_result("Invalid Email Validation", False, f"Exception: {str(e)}")
    
    # Test invalid phone
    invalid_phone_user = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "password": "SecurePass123",
        "phone": "123456789",
        "emirate": "Dubai",
        "user_type": "job_seeker"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/register",
            json=invalid_phone_user,
            headers={'Content-Type': 'application/json'}
        )
        
        success = response.status_code == 400
        message = response.json().get('message', '') if response.headers.get('content-type') == 'application/json' else ''
        print_test_result("Invalid Phone Validation", success, message)
        
    except Exception as e:
        print_test_result("Invalid Phone Validation", False, f"Exception: {str(e)}")
    
    # Test weak password
    weak_password_user = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "password": "123",
        "phone": "0501234567",
        "emirate": "Dubai",
        "user_type": "job_seeker"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/register",
            json=weak_password_user,
            headers={'Content-Type': 'application/json'}
        )
        
        success = response.status_code == 400
        message = response.json().get('message', '') if response.headers.get('content-type') == 'application/json' else ''
        print_test_result("Weak Password Validation", success, message)
        
    except Exception as e:
        print_test_result("Weak Password Validation", False, f"Exception: {str(e)}")

def main():
    """Run all tests"""
    print_header("Enhanced Sign-Up Process Testing")
    print(f"Testing against: {API_BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Available Roles
    available_roles = test_available_roles()
    
    # Test 2: Input Validation
    test_validation_errors()
    
    # Test 3: User Registration for All Roles
    print_header("Testing User Registration for All Roles")
    registered_users = []
    
    for user in TEST_USERS:
        if test_user_registration(user):
            registered_users.append(user)
        time.sleep(1)  # Small delay between requests
    
    # Test 4: User Login and Role-based Routing
    print_header("Testing User Login and Role-based Routing")
    access_tokens = {}
    
    for user in registered_users:
        token = test_user_login(user['email'], user['password'], user['user_type'])
        if token:
            access_tokens[user['email']] = token
        time.sleep(1)  # Small delay between requests
    
    # Test 5: Role Updates (Multi-role Support)
    if access_tokens:
        print_header("Testing Role Updates")
        first_user_email = list(access_tokens.keys())[0]
        first_token = access_tokens[first_user_email]
        
        # Test adding secondary role
        test_role_update(first_token, "job_seeker", ["mentor"])
        time.sleep(1)
        
        # Test changing primary role
        test_role_update(first_token, "mentor", ["job_seeker"])
    
    # Summary
    print_header("Test Summary")
    print(f"✅ Available roles endpoint tested")
    print(f"✅ Input validation tested")
    print(f"✅ {len(registered_users)}/{len(TEST_USERS)} users registered successfully")
    print(f"✅ {len(access_tokens)}/{len(registered_users)} users logged in successfully")
    print(f"✅ Role update functionality tested")
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
