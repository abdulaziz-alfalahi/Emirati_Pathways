"""
Comprehensive Backend API Testing Script for Emirati Pathways

This script tests all major API endpoints across all personas:
- Candidate workflows
- Recruiter workflows
- HR Manager workflows
- Growth Operator workflows
- Administrator workflows
"""

import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Tuple

# Configuration
BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5005')
RESULTS = []

def log_result(category: str, test_name: str, passed: bool, details: str = "", response_data: Any = None):
    """Log test result"""
    result = {
        'category': category,
        'test': test_name,
        'passed': passed,
        'details': details,
        'timestamp': datetime.now().isoformat()
    }
    RESULTS.append(result)
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {category} | {test_name}")
    if not passed and details:
        print(f"       Details: {details}")

def test_endpoint(method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> Tuple[bool, Any]:
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method.upper() == 'GET':
            response = requests.get(url, params=data, timeout=10)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, timeout=10)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, timeout=10)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, timeout=10)
        else:
            return False, f"Unknown method: {method}"
        
        passed = response.status_code == expected_status
        try:
            response_data = response.json()
        except:
            response_data = response.text
        
        return passed, response_data
    except requests.exceptions.ConnectionError:
        return False, "Connection refused - server not running"
    except requests.exceptions.Timeout:
        return False, "Request timed out"
    except Exception as e:
        return False, str(e)


# =====================================================
# CANDIDATE PERSONA TESTS
# =====================================================

def test_candidate_workflows():
    """Test Candidate persona API endpoints"""
    print("\n" + "="*60)
    print("CANDIDATE PERSONA TESTS")
    print("="*60)
    
    # Test CV Builder endpoints
    passed, data = test_endpoint('GET', '/api/cv/templates')
    log_result('Candidate', 'GET /api/cv/templates', passed, 
               "" if passed else str(data))
    
    # Test CV data retrieval
    passed, data = test_endpoint('GET', '/api/cv/data/1')
    log_result('Candidate', 'GET /api/cv/data/{id}', passed,
               "" if passed else str(data))
    
    # Test CV save
    cv_data = {
        'personalInfo': {
            'fullName': 'Test Candidate',
            'email': 'test@example.com',
            'phone': '+971501234567'
        },
        'experience': [],
        'education': [],
        'skills': []
    }
    passed, data = test_endpoint('POST', '/api/cv/save', cv_data)
    log_result('Candidate', 'POST /api/cv/save', passed,
               "" if passed else str(data))
    
    # Test Jobs listing
    passed, data = test_endpoint('GET', '/api/jobs')
    log_result('Candidate', 'GET /api/jobs', passed,
               "" if passed else str(data))
    
    # Test Job search
    passed, data = test_endpoint('GET', '/api/jobs/search', {'query': 'developer'})
    log_result('Candidate', 'GET /api/jobs/search', passed,
               "" if passed else str(data))
    
    # Test Saved jobs
    passed, data = test_endpoint('GET', '/api/candidate/saved-jobs')
    log_result('Candidate', 'GET /api/candidate/saved-jobs', passed,
               "" if passed else str(data))
    
    # Test Applications
    passed, data = test_endpoint('GET', '/api/candidate/applications')
    log_result('Candidate', 'GET /api/candidate/applications', passed,
               "" if passed else str(data))
    
    # Test Job matches
    passed, data = test_endpoint('GET', '/api/candidate/job-matches')
    log_result('Candidate', 'GET /api/candidate/job-matches', passed,
               "" if passed else str(data))


# =====================================================
# RECRUITER PERSONA TESTS
# =====================================================

def test_recruiter_workflows():
    """Test Recruiter persona API endpoints"""
    print("\n" + "="*60)
    print("RECRUITER PERSONA TESTS")
    print("="*60)
    
    # Test JD templates
    passed, data = test_endpoint('GET', '/api/jd/templates')
    log_result('Recruiter', 'GET /api/jd/templates', passed,
               "" if passed else str(data))
    
    # Test JD listing
    passed, data = test_endpoint('GET', '/api/recruiter/jd')
    log_result('Recruiter', 'GET /api/recruiter/jd', passed,
               "" if passed else str(data))
    
    # Test JD creation
    jd_data = {
        'title': 'Software Engineer',
        'company': 'Test Company',
        'description': 'Looking for a skilled software engineer',
        'requirements': ['Python', 'JavaScript', 'SQL'],
        'location': 'Dubai'
    }
    passed, data = test_endpoint('POST', '/api/recruiter/jd', jd_data)
    log_result('Recruiter', 'POST /api/recruiter/jd', passed,
               "" if passed else str(data))
    
    # Test AI Matching
    passed, data = test_endpoint('POST', '/api/recruiter/jd/1/match', {'limit': 10})
    log_result('Recruiter', 'POST /api/recruiter/jd/{id}/match', passed,
               "" if passed else str(data))
    
    # Test Shortlist
    passed, data = test_endpoint('GET', '/api/recruiter/shortlist')
    log_result('Recruiter', 'GET /api/recruiter/shortlist', passed,
               "" if passed else str(data))
    
    # Test Dashboard overview
    passed, data = test_endpoint('GET', '/api/recruiter/dashboard/overview')
    log_result('Recruiter', 'GET /api/recruiter/dashboard/overview', passed,
               "" if passed else str(data))
    
    # Test Active vacancies
    passed, data = test_endpoint('GET', '/api/recruiter/dashboard/vacancies')
    log_result('Recruiter', 'GET /api/recruiter/dashboard/vacancies', passed,
               "" if passed else str(data))
    
    # Test Offers
    passed, data = test_endpoint('GET', '/api/recruiter/dashboard/offers')
    log_result('Recruiter', 'GET /api/recruiter/dashboard/offers', passed,
               "" if passed else str(data))


# =====================================================
# HR MANAGER PERSONA TESTS
# =====================================================

def test_hr_manager_workflows():
    """Test HR Manager persona API endpoints"""
    print("\n" + "="*60)
    print("HR MANAGER PERSONA TESTS")
    print("="*60)
    
    # Test HR Dashboard
    passed, data = test_endpoint('GET', '/api/hr/dashboard')
    log_result('HR Manager', 'GET /api/hr/dashboard', passed,
               "" if passed else str(data))
    
    # Test Jobs listing
    passed, data = test_endpoint('GET', '/api/hr/jobs')
    log_result('HR Manager', 'GET /api/hr/jobs', passed,
               "" if passed else str(data))
    
    # Test Shortlisted candidates
    passed, data = test_endpoint('GET', '/api/hr/dashboard/shortlisted')
    log_result('HR Manager', 'GET /api/hr/dashboard/shortlisted', passed,
               "" if passed else str(data))
    
    # Test Team members
    passed, data = test_endpoint('GET', '/api/hr/dashboard/team')
    log_result('HR Manager', 'GET /api/hr/dashboard/team', passed,
               "" if passed else str(data))
    
    # Test Candidate search
    passed, data = test_endpoint('GET', '/api/hr/dashboard/candidates/search', {'query': 'developer'})
    log_result('HR Manager', 'GET /api/hr/dashboard/candidates/search', passed,
               "" if passed else str(data))
    
    # Test Metrics
    passed, data = test_endpoint('GET', '/api/hr/dashboard/metrics')
    log_result('HR Manager', 'GET /api/hr/dashboard/metrics', passed,
               "" if passed else str(data))
    
    # Test Approval workflows
    passed, data = test_endpoint('GET', '/api/hr/approval-workflows')
    log_result('HR Manager', 'GET /api/hr/approval-workflows', passed,
               "" if passed else str(data))
    
    # Test Delegation
    delegation_data = {
        'workflow_id': 1,
        'delegate_to': 2,
        'reason': 'Out of office'
    }
    passed, data = test_endpoint('POST', '/api/hr/approval-workflows/delegate', delegation_data)
    log_result('HR Manager', 'POST /api/hr/approval-workflows/delegate', passed,
               "" if passed else str(data))


# =====================================================
# GROWTH OPERATOR PERSONA TESTS
# =====================================================

def test_growth_operator_workflows():
    """Test Growth Operator persona API endpoints"""
    print("\n" + "="*60)
    print("GROWTH OPERATOR PERSONA TESTS")
    print("="*60)
    
    # Test Metrics endpoint
    passed, data = test_endpoint('GET', '/api/growth-operator/metrics')
    log_result('Growth Operator', 'GET /api/growth-operator/metrics', passed,
               "" if passed else str(data))
    
    # Test Candidate domain
    passed, data = test_endpoint('GET', '/api/growth-operator/candidate/list')
    log_result('Growth Operator', 'GET /api/growth-operator/candidate/list', passed,
               "" if passed else str(data))
    
    # Test Company domain
    passed, data = test_endpoint('GET', '/api/growth-operator/company/list')
    log_result('Growth Operator', 'GET /api/growth-operator/company/list', passed,
               "" if passed else str(data))
    
    # Test Education domain
    passed, data = test_endpoint('GET', '/api/growth-operator/education/programs')
    log_result('Growth Operator', 'GET /api/growth-operator/education/programs', passed,
               "" if passed else str(data))
    
    # Test Assessment domain
    passed, data = test_endpoint('GET', '/api/growth-operator/assessment/list')
    log_result('Growth Operator', 'GET /api/growth-operator/assessment/list', passed,
               "" if passed else str(data))
    
    # Test Mentorship domain
    passed, data = test_endpoint('GET', '/api/growth-operator/mentorship/matches')
    log_result('Growth Operator', 'GET /api/growth-operator/mentorship/matches', passed,
               "" if passed else str(data))
    
    # Test Community domain
    passed, data = test_endpoint('GET', '/api/growth-operator/community/stats')
    log_result('Growth Operator', 'GET /api/growth-operator/community/stats', passed,
               "" if passed else str(data))


# =====================================================
# ADMINISTRATOR PERSONA TESTS
# =====================================================

def test_administrator_workflows():
    """Test Administrator persona API endpoints"""
    print("\n" + "="*60)
    print("ADMINISTRATOR PERSONA TESTS")
    print("="*60)
    
    # Test Dashboard stats
    passed, data = test_endpoint('GET', '/api/admin/dashboard/stats')
    log_result('Administrator', 'GET /api/admin/dashboard/stats', passed,
               "" if passed else str(data))
    
    # Test Alerts
    passed, data = test_endpoint('GET', '/api/admin/alerts')
    log_result('Administrator', 'GET /api/admin/alerts', passed,
               "" if passed else str(data))
    
    # Test Activity
    passed, data = test_endpoint('GET', '/api/admin/activity/recent')
    log_result('Administrator', 'GET /api/admin/activity/recent', passed,
               "" if passed else str(data))
    
    # Test User management - List users
    passed, data = test_endpoint('GET', '/api/admin/users')
    log_result('Administrator', 'GET /api/admin/users', passed,
               "" if passed else str(data))
    
    # Test User management - Get user
    passed, data = test_endpoint('GET', '/api/admin/users/1')
    log_result('Administrator', 'GET /api/admin/users/{id}', passed,
               "" if passed else str(data))
    
    # Test User statistics
    passed, data = test_endpoint('GET', '/api/admin/users/statistics')
    log_result('Administrator', 'GET /api/admin/users/statistics', passed,
               "" if passed else str(data))
    
    # Test Roles listing
    passed, data = test_endpoint('GET', '/api/admin/roles')
    log_result('Administrator', 'GET /api/admin/roles', passed,
               "" if passed else str(data))
    
    # Test Growth Operator domains
    passed, data = test_endpoint('GET', '/api/admin/growth-operators/domains')
    log_result('Administrator', 'GET /api/admin/growth-operators/domains', passed,
               "" if passed else str(data))
    
    # Test Growth Operators listing
    passed, data = test_endpoint('GET', '/api/admin/growth-operators')
    log_result('Administrator', 'GET /api/admin/growth-operators', passed,
               "" if passed else str(data))
    
    # Test Domain statistics
    passed, data = test_endpoint('GET', '/api/admin/growth-operators/statistics')
    log_result('Administrator', 'GET /api/admin/growth-operators/statistics', passed,
               "" if passed else str(data))


# =====================================================
# COMMUNICATION & INTERVIEW TESTS
# =====================================================

def test_communication_workflows():
    """Test Communication and Interview API endpoints"""
    print("\n" + "="*60)
    print("COMMUNICATION & INTERVIEW TESTS")
    print("="*60)
    
    # Test Conversations
    passed, data = test_endpoint('GET', '/api/communication/conversations')
    log_result('Communication', 'GET /api/communication/conversations', passed,
               "" if passed else str(data))
    
    # Test Messages
    passed, data = test_endpoint('GET', '/api/communication/messages', {'conversation_id': 1})
    log_result('Communication', 'GET /api/communication/messages', passed,
               "" if passed else str(data))
    
    # Test Notification preferences
    passed, data = test_endpoint('GET', '/api/communication/notifications/preferences')
    log_result('Communication', 'GET /api/communication/notifications/preferences', passed,
               "" if passed else str(data))
    
    # Test Interview sessions
    passed, data = test_endpoint('GET', '/api/interviews/sessions')
    log_result('Interviews', 'GET /api/interviews/sessions', passed,
               "" if passed else str(data))
    
    # Test My sessions
    passed, data = test_endpoint('GET', '/api/interviews/sessions/my')
    log_result('Interviews', 'GET /api/interviews/sessions/my', passed,
               "" if passed else str(data))
    
    # Test Upcoming interviews
    passed, data = test_endpoint('GET', '/api/interviews/upcoming')
    log_result('Interviews', 'GET /api/interviews/upcoming', passed,
               "" if passed else str(data))
    
    # Test Create interview session
    session_data = {
        'candidate_id': 1,
        'job_id': 1,
        'interviewer_id': 2,
        'scheduled_at': '2025-01-15T10:00:00',
        'duration_minutes': 60,
        'interview_type': 'video'
    }
    passed, data = test_endpoint('POST', '/api/interviews/sessions', session_data)
    log_result('Interviews', 'POST /api/interviews/sessions', passed,
               "" if passed else str(data))


# =====================================================
# MAIN TEST RUNNER
# =====================================================

def generate_report():
    """Generate test report"""
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r['passed'])
    failed = total - passed
    
    print("\n" + "="*60)
    print("TEST SUMMARY REPORT")
    print("="*60)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed} ({(passed/total*100):.1f}%)")
    print(f"Failed: {failed} ({(failed/total*100):.1f}%)")
    
    # Group by category
    categories = {}
    for r in RESULTS:
        cat = r['category']
        if cat not in categories:
            categories[cat] = {'passed': 0, 'failed': 0}
        if r['passed']:
            categories[cat]['passed'] += 1
        else:
            categories[cat]['failed'] += 1
    
    print("\nResults by Category:")
    print("-"*40)
    for cat, stats in categories.items():
        total_cat = stats['passed'] + stats['failed']
        print(f"{cat}: {stats['passed']}/{total_cat} passed")
    
    # List failed tests
    failed_tests = [r for r in RESULTS if not r['passed']]
    if failed_tests:
        print("\nFailed Tests:")
        print("-"*40)
        for r in failed_tests:
            print(f"  - {r['category']}: {r['test']}")
            if r['details']:
                print(f"    Error: {r['details'][:100]}")
    
    # Save report to file
    report = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total': total,
            'passed': passed,
            'failed': failed,
            'pass_rate': f"{(passed/total*100):.1f}%"
        },
        'by_category': categories,
        'results': RESULTS
    }
    
    with open('test_results.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed results saved to: test_results.json")
    
    return passed, failed


def main():
    """Run all tests"""
    print("="*60)
    print("EMIRATI PATHWAYS - COMPREHENSIVE API TESTING")
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*60)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Server Status: {'Online' if response.status_code == 200 else 'Unknown'}")
    except:
        print("⚠️  Warning: Server may not be running")
        print("   Start the server with: python backend/unified_server.py")
    
    # Run all test suites
    test_candidate_workflows()
    test_recruiter_workflows()
    test_hr_manager_workflows()
    test_growth_operator_workflows()
    test_administrator_workflows()
    test_communication_workflows()
    
    # Generate report
    passed, failed = generate_report()
    
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    exit(main())
