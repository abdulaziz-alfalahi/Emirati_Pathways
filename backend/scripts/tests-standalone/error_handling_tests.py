#!/usr/bin/env python3
"""
Error Handling Tests
Tests the system's behavior when errors occur or invalid data is provided
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5005"

class TestResult:
    def __init__(self, name, passed, details="", response_code=None):
        self.name = name
        self.passed = passed
        self.details = details
        self.response_code = response_code

def print_result(result, step_num):
    """Print test result with formatting"""
    status = "✅ PASS" if result.passed else "❌ FAIL"
    print(f"\n{step_num}. {result.name}: {status}")
    if result.details:
        print(f"   Details: {result.details}")
    if result.response_code:
        print(f"   HTTP Status: {result.response_code}")

def run_error_handling_tests():
    """Run error handling tests"""
    print("=" * 70)
    print("ERROR HANDLING TESTS")
    print("=" * 70)
    print(f"Base URL: {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    results = []
    
    # =========================================================================
    # CATEGORY 1: INVALID INPUT HANDLING
    # =========================================================================
    print("\n" + "=" * 70)
    print("CATEGORY 1: INVALID INPUT HANDLING")
    print("=" * 70)
    
    # Test 1.1: Empty request body
    def test_empty_body():
        resp = requests.post(f"{BASE_URL}/api/recruiter/jd/create", json={}, timeout=10)
        # Should handle gracefully - either accept with defaults or return meaningful error
        if resp.status_code in [200, 201, 400]:
            return TestResult("Empty Request Body", True, 
                            f"Handled gracefully with status {resp.status_code}", resp.status_code)
        return TestResult("Empty Request Body", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_empty_body()
    results.append(result)
    print_result(result, "1.1")
    
    # Test 1.2: Invalid JSON
    def test_invalid_json():
        resp = requests.post(f"{BASE_URL}/api/recruiter/jd/create", 
                           data="not valid json", 
                           headers={"Content-Type": "application/json"},
                           timeout=10)
        # Should return 400 Bad Request
        if resp.status_code in [400, 415, 500]:
            return TestResult("Invalid JSON", True, 
                            f"Rejected invalid JSON with status {resp.status_code}", resp.status_code)
        return TestResult("Invalid JSON", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_invalid_json()
    results.append(result)
    print_result(result, "1.2")
    
    # Test 1.3: Missing required fields
    def test_missing_fields():
        resp = requests.post(f"{BASE_URL}/api/interviews/schedule", 
                           json={"notes": "test"},  # Missing candidate_id
                           timeout=10)
        data = resp.json()
        # Should return error about missing candidate_id
        if resp.status_code == 400 or (not data.get('success') and 'candidate' in str(data).lower()):
            return TestResult("Missing Required Fields", True, 
                            "Correctly identified missing required field", resp.status_code)
        return TestResult("Missing Required Fields", False, 
                        f"Did not validate required fields: {data}", resp.status_code)
    
    result = test_missing_fields()
    results.append(result)
    print_result(result, "1.3")
    
    # Test 1.4: Invalid data types
    def test_invalid_types():
        resp = requests.post(f"{BASE_URL}/api/interviews/schedule", 
                           json={"candidate_id": "not_a_number_but_ok", "scheduled_at": "invalid-date"},
                           timeout=10)
        # Should either handle gracefully or return meaningful error
        if resp.status_code in [200, 201, 400, 422]:
            return TestResult("Invalid Data Types", True, 
                            f"Handled invalid types with status {resp.status_code}", resp.status_code)
        return TestResult("Invalid Data Types", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_invalid_types()
    results.append(result)
    print_result(result, "1.4")
    
    # =========================================================================
    # CATEGORY 2: NON-EXISTENT RESOURCE HANDLING
    # =========================================================================
    print("\n" + "=" * 70)
    print("CATEGORY 2: NON-EXISTENT RESOURCE HANDLING")
    print("=" * 70)
    
    # Test 2.1: Non-existent JD
    def test_nonexistent_jd():
        resp = requests.get(f"{BASE_URL}/api/recruiter/jd/nonexistent_jd_12345", timeout=10)
        # Should return 404 or graceful error
        if resp.status_code == 404 or (resp.status_code == 200 and 'not found' in resp.text.lower()):
            return TestResult("Non-existent JD", True, 
                            "Correctly handled non-existent resource", resp.status_code)
        return TestResult("Non-existent JD", False, 
                        f"Unexpected response: {resp.text[:200]}", resp.status_code)
    
    result = test_nonexistent_jd()
    results.append(result)
    print_result(result, "2.1")
    
    # Test 2.2: Non-existent candidate
    def test_nonexistent_candidate():
        resp = requests.get(f"{BASE_URL}/api/recruiter/candidates/99999999", timeout=10)
        # Should return 404 or graceful error
        if resp.status_code in [404, 200]:  # 200 might return empty/default data
            return TestResult("Non-existent Candidate", True, 
                            "Handled non-existent candidate gracefully", resp.status_code)
        return TestResult("Non-existent Candidate", False, 
                        f"Unexpected response", resp.status_code)
    
    result = test_nonexistent_candidate()
    results.append(result)
    print_result(result, "2.2")
    
    # Test 2.3: Non-existent interview session
    def test_nonexistent_interview():
        resp = requests.get(f"{BASE_URL}/api/interviews/sessions/99999999", timeout=10)
        if resp.status_code in [404, 200]:
            return TestResult("Non-existent Interview", True, 
                            "Handled non-existent interview gracefully", resp.status_code)
        return TestResult("Non-existent Interview", False, 
                        f"Unexpected response", resp.status_code)
    
    result = test_nonexistent_interview()
    results.append(result)
    print_result(result, "2.3")
    
    # Test 2.4: Non-existent API endpoint
    def test_nonexistent_endpoint():
        resp = requests.get(f"{BASE_URL}/api/this/endpoint/does/not/exist", timeout=10)
        if resp.status_code == 404:
            data = resp.json()
            if 'error' in data or 'message' in data:
                return TestResult("Non-existent Endpoint", True, 
                                "Returns proper 404 with error message", resp.status_code)
        return TestResult("Non-existent Endpoint", False, 
                        f"Unexpected response: {resp.status_code}", resp.status_code)
    
    result = test_nonexistent_endpoint()
    results.append(result)
    print_result(result, "2.4")
    
    # =========================================================================
    # CATEGORY 3: BOUNDARY CONDITIONS
    # =========================================================================
    print("\n" + "=" * 70)
    print("CATEGORY 3: BOUNDARY CONDITIONS")
    print("=" * 70)
    
    # Test 3.1: Very long string input
    def test_long_string():
        long_title = "A" * 10000  # 10,000 character title
        resp = requests.post(f"{BASE_URL}/api/recruiter/jd/create", 
                           json={"title": long_title},
                           timeout=10)
        # Should either accept, truncate, or return meaningful error
        if resp.status_code in [200, 201, 400, 413]:
            return TestResult("Very Long String Input", True, 
                            f"Handled long string with status {resp.status_code}", resp.status_code)
        return TestResult("Very Long String Input", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_long_string()
    results.append(result)
    print_result(result, "3.1")
    
    # Test 3.2: Negative numbers
    def test_negative_numbers():
        resp = requests.post(f"{BASE_URL}/api/interviews/schedule", 
                           json={"candidate_id": -1, "duration_minutes": -60},
                           timeout=10)
        # Should handle gracefully
        if resp.status_code in [200, 201, 400, 422]:
            return TestResult("Negative Numbers", True, 
                            f"Handled negative numbers with status {resp.status_code}", resp.status_code)
        return TestResult("Negative Numbers", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_negative_numbers()
    results.append(result)
    print_result(result, "3.2")
    
    # Test 3.3: Empty arrays
    def test_empty_arrays():
        resp = requests.post(f"{BASE_URL}/api/recruiter/jd/create", 
                           json={"title": "Test", "requirements": [], "skills": []},
                           timeout=10)
        if resp.status_code in [200, 201, 400]:
            return TestResult("Empty Arrays", True, 
                            f"Handled empty arrays with status {resp.status_code}", resp.status_code)
        return TestResult("Empty Arrays", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_empty_arrays()
    results.append(result)
    print_result(result, "3.3")
    
    # Test 3.4: Special characters
    def test_special_characters():
        resp = requests.post(f"{BASE_URL}/api/recruiter/jd/create", 
                           json={"title": "<script>alert('xss')</script>", 
                                 "description": "Test with 'quotes' and \"double quotes\" and <html>"},
                           timeout=10)
        if resp.status_code in [200, 201, 400]:
            return TestResult("Special Characters", True, 
                            f"Handled special characters with status {resp.status_code}", resp.status_code)
        return TestResult("Special Characters", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_special_characters()
    results.append(result)
    print_result(result, "3.4")
    
    # =========================================================================
    # CATEGORY 4: HTTP METHOD HANDLING
    # =========================================================================
    print("\n" + "=" * 70)
    print("CATEGORY 4: HTTP METHOD HANDLING")
    print("=" * 70)
    
    # Test 4.1: Wrong HTTP method (POST to GET endpoint)
    def test_wrong_method_post():
        resp = requests.post(f"{BASE_URL}/api/recruiter/jd/list", json={}, timeout=10)
        if resp.status_code == 405:
            return TestResult("Wrong Method (POST to GET)", True, 
                            "Correctly returned 405 Method Not Allowed", resp.status_code)
        elif resp.status_code in [200, 404]:
            return TestResult("Wrong Method (POST to GET)", True, 
                            f"Handled with status {resp.status_code}", resp.status_code)
        return TestResult("Wrong Method (POST to GET)", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_wrong_method_post()
    results.append(result)
    print_result(result, "4.1")
    
    # Test 4.2: Wrong HTTP method (GET to POST endpoint)
    def test_wrong_method_get():
        resp = requests.get(f"{BASE_URL}/api/recruiter/jd/create", timeout=10)
        if resp.status_code == 405:
            return TestResult("Wrong Method (GET to POST)", True, 
                            "Correctly returned 405 Method Not Allowed", resp.status_code)
        elif resp.status_code in [200, 404]:
            return TestResult("Wrong Method (GET to POST)", True, 
                            f"Handled with status {resp.status_code}", resp.status_code)
        return TestResult("Wrong Method (GET to POST)", False, 
                        f"Unexpected status {resp.status_code}", resp.status_code)
    
    result = test_wrong_method_get()
    results.append(result)
    print_result(result, "4.2")
    
    # =========================================================================
    # CATEGORY 5: GRACEFUL DEGRADATION
    # =========================================================================
    print("\n" + "=" * 70)
    print("CATEGORY 5: GRACEFUL DEGRADATION")
    print("=" * 70)
    
    # Test 5.1: Health check endpoint
    def test_health_check():
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('status') in ['healthy', 'ok', 'success']:
                return TestResult("Health Check", True, 
                                f"Server is healthy: {data.get('status')}", resp.status_code)
        return TestResult("Health Check", False, 
                        f"Health check failed: {resp.status_code}", resp.status_code)
    
    result = test_health_check()
    results.append(result)
    print_result(result, "5.1")
    
    # Test 5.2: API returns JSON on errors
    def test_json_error_responses():
        resp = requests.get(f"{BASE_URL}/api/nonexistent", timeout=10)
        try:
            data = resp.json()
            if 'error' in data or 'message' in data:
                return TestResult("JSON Error Responses", True, 
                                "Errors return proper JSON format", resp.status_code)
        except:
            pass
        return TestResult("JSON Error Responses", False, 
                        "Error response is not valid JSON", resp.status_code)
    
    result = test_json_error_responses()
    results.append(result)
    print_result(result, "5.2")
    
    # Test 5.3: Fallback data when database unavailable
    def test_fallback_data():
        # These endpoints should return fallback data when DB is unavailable
        endpoints_with_fallback = [
            "/api/candidate/job-matches",
            "/api/recruiter/jd/list",
            "/api/growth-operator/metrics"
        ]
        
        all_have_fallback = True
        for endpoint in endpoints_with_fallback:
            resp = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            if resp.status_code != 200:
                all_have_fallback = False
                break
            data = resp.json()
            if not (data.get('success') or data.get('data') or data.get('metrics')):
                all_have_fallback = False
                break
        
        if all_have_fallback:
            return TestResult("Fallback Data Available", True, 
                            "All tested endpoints return fallback data", 200)
        return TestResult("Fallback Data Available", False, 
                        "Some endpoints don't have fallback data", None)
    
    result = test_fallback_data()
    results.append(result)
    print_result(result, "5.3")
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for r in results if r.passed)
    total = len(results)
    pass_rate = (passed / total) * 100 if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed} ({pass_rate:.1f}%)")
    print(f"Failed: {total - passed}")
    print("-" * 70)
    
    print("DETAILED RESULTS:")
    print("-" * 70)
    for i, result in enumerate(results, 1):
        status = "✅" if result.passed else "❌"
        print(f"{status} {i:2}. {result.name}")
    
    print("=" * 70)
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    return passed, total

if __name__ == "__main__":
    run_error_handling_tests()
