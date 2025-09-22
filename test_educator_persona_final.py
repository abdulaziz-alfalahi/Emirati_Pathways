#!/usr/bin/env python3
"""
Comprehensive Test Suite for Educator Persona - Emirati Journey Platform
Tests all educator-related functionality including student tracking, curriculum planning,
performance analytics, and resource management.
"""

import requests
import json
import time
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class EducatorPersonaTestSuite:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.educator_id = None
        self.test_results = {
            'timestamp': datetime.now().isoformat(),
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': [],
            'performance_metrics': {},
            'coverage_analysis': {}
        }
        
    def log_test_result(self, test_name: str, success: bool, details: str = "", 
                       response_time: float = 0, status_code: int = 0):
        """Log individual test results"""
        self.test_results['total_tests'] += 1
        if success:
            self.test_results['passed_tests'] += 1
            status = "PASS"
        else:
            self.test_results['failed_tests'] += 1
            status = "FAIL"
            
        test_detail = {
            'test_name': test_name,
            'status': status,
            'details': details,
            'response_time_ms': round(response_time * 1000, 2),
            'status_code': status_code,
            'timestamp': datetime.now().isoformat()
        }
        
        self.test_results['test_details'].append(test_detail)
        print(f"[{status}] {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    headers: Dict = None) -> tuple:
        """Make HTTP request and measure response time"""
        url = f"{self.base_url}{endpoint}"
        
        # Add auth token if available
        if self.auth_token and headers is None:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
        elif self.auth_token and headers:
            headers['Authorization'] = f'Bearer {self.auth_token}'
            
        start_time = time.time()
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers, params=data)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            response_time = time.time() - start_time
            return response, response_time
            
        except Exception as e:
            response_time = time.time() - start_time
            return None, response_time

    def test_health_endpoints(self):
        """Test all educator-related health endpoints"""
        print("\n=== Testing Health Endpoints ===")
        
        health_endpoints = [
            '/api/educator/health',
            '/api/student-tracking/health',
            '/api/curriculum-planning/health',
            '/api/performance-analytics/health',
            '/api/resource-management/health'
        ]
        
        for endpoint in health_endpoints:
            response, response_time = self.make_request('GET', endpoint)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('status') == 'healthy':
                        self.log_test_result(
                            f"Health Check - {endpoint}",
                            True,
                            f"Service healthy, response time: {response_time:.3f}s",
                            response_time,
                            response.status_code
                        )
                    else:
                        self.log_test_result(
                            f"Health Check - {endpoint}",
                            False,
                            f"Service unhealthy: {data}",
                            response_time,
                            response.status_code
                        )
                except json.JSONDecodeError:
                    self.log_test_result(
                        f"Health Check - {endpoint}",
                        False,
                        "Invalid JSON response",
                        response_time,
                        response.status_code
                    )
            else:
                status_code = response.status_code if response else 0
                self.log_test_result(
                    f"Health Check - {endpoint}",
                    False,
                    f"Request failed with status {status_code}",
                    response_time,
                    status_code
                )

    def test_authentication(self):
        """Test educator authentication and profile creation"""
        print("\n=== Testing Authentication ===")
        
        # Test educator registration
        educator_data = {
            "email": "test.educator@example.com",
            "password": "SecurePass123!",
            "full_name": "Dr. Amina Al-Zahra",
            "phone": "+971501234567",
            "user_type": "educator",
            "institution": "UAE University",
            "department": "Computer Science",
            "specialization": "Software Engineering",
            "years_experience": 10,
            "education_level": "PhD",
            "certifications": ["AWS Certified", "Google Educator"],
            "languages": ["English", "Arabic"],
            "preferred_language": "en"
        }
        
        response, response_time = self.make_request('POST', '/api/auth/register', educator_data)
        
        if response and response.status_code in [200, 201]:
            try:
                data = response.json()
                if 'token' in data:
                    self.auth_token = data['token']
                    self.educator_id = data.get('user_id')
                    self.log_test_result(
                        "Educator Registration",
                        True,
                        f"Successfully registered educator with ID: {self.educator_id}",
                        response_time,
                        response.status_code
                    )
                else:
                    self.log_test_result(
                        "Educator Registration",
                        False,
                        "No token in response",
                        response_time,
                        response.status_code
                    )
            except json.JSONDecodeError:
                self.log_test_result(
                    "Educator Registration",
                    False,
                    "Invalid JSON response",
                    response_time,
                    response.status_code
                )
        else:
            # Try login if registration fails (user might already exist)
            login_data = {
                "email": educator_data["email"],
                "password": educator_data["password"]
            }
            
            response, response_time = self.make_request('POST', '/api/auth/login', login_data)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    if 'token' in data:
                        self.auth_token = data['token']
                        self.educator_id = data.get('user_id')
                        self.log_test_result(
                            "Educator Login",
                            True,
                            f"Successfully logged in educator with ID: {self.educator_id}",
                            response_time,
                            response.status_code
                        )
                    else:
                        self.log_test_result(
                            "Educator Login",
                            False,
                            "No token in login response",
                            response_time,
                            response.status_code
                        )
                except json.JSONDecodeError:
                    self.log_test_result(
                        "Educator Login",
                        False,
                        "Invalid JSON response",
                        response_time,
                        response.status_code
                    )
            else:
                status_code = response.status_code if response else 0
                self.log_test_result(
                    "Educator Authentication",
                    False,
                    f"Both registration and login failed with status {status_code}",
                    response_time,
                    status_code
                )

    def test_student_tracking_system(self):
        """Test student tracking functionality"""
        print("\n=== Testing Student Tracking System ===")
        
        if not self.auth_token:
            self.log_test_result("Student Tracking", False, "No auth token available")
            return
            
        # Test adding a student
        student_data = {
            "student_id": "STU001",
            "name": "Ahmed Al-Mansoori",
            "email": "ahmed.almansoori@student.edu",
            "phone": "+971501234568",
            "nationality": "UAE",
            "emirates_id": "784-1990-1234567-8",
            "date_of_birth": "1995-03-15",
            "gender": "male",
            "enrollment_date": datetime.now().isoformat(),
            "program": "Computer Science",
            "year_level": 2,
            "gpa": 3.75,
            "status": "active",
            "emergency_contact": {
                "name": "Mohammed Al-Mansoori",
                "relationship": "Father",
                "phone": "+971501234569"
            }
        }
        
        response, response_time = self.make_request('POST', '/api/student-tracking/students', student_data)
        
        if response and response.status_code in [200, 201]:
            try:
                data = response.json()
                student_id = data.get('student_id') or data.get('id')
                self.log_test_result(
                    "Add Student",
                    True,
                    f"Successfully added student with ID: {student_id}",
                    response_time,
                    response.status_code
                )
                
                # Test retrieving student
                response, response_time = self.make_request('GET', f'/api/student-tracking/students/{student_id}')
                
                if response and response.status_code == 200:
                    self.log_test_result(
                        "Retrieve Student",
                        True,
                        f"Successfully retrieved student data",
                        response_time,
                        response.status_code
                    )
                else:
                    status_code = response.status_code if response else 0
                    self.log_test_result(
                        "Retrieve Student",
                        False,
                        f"Failed to retrieve student with status {status_code}",
                        response_time,
                        status_code
                    )
                    
            except json.JSONDecodeError:
                self.log_test_result(
                    "Add Student",
                    False,
                    "Invalid JSON response",
                    response_time,
                    response.status_code
                )
        else:
            status_code = response.status_code if response else 0
            self.log_test_result(
                "Add Student",
                False,
                f"Failed to add student with status {status_code}",
                response_time,
                status_code
            )
            
        # Test listing students
        response, response_time = self.make_request('GET', '/api/student-tracking/students')
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                student_count = len(data.get('students', []))
                self.log_test_result(
                    "List Students",
                    True,
                    f"Successfully retrieved {student_count} students",
                    response_time,
                    response.status_code
                )
            except json.JSONDecodeError:
                self.log_test_result(
                    "List Students",
                    False,
                    "Invalid JSON response",
                    response_time,
                    response.status_code
                )
        else:
            status_code = response.status_code if response else 0
            self.log_test_result(
                "List Students",
                False,
                f"Failed to list students with status {status_code}",
                response_time,
                status_code
            )

    def test_curriculum_planning_system(self):
        """Test curriculum planning functionality"""
        print("\n=== Testing Curriculum Planning System ===")
        
        if not self.auth_token:
            self.log_test_result("Curriculum Planning", False, "No auth token available")
            return
            
        # Test creating a curriculum
        curriculum_data = {
            "title": "Introduction to UAE Digital Transformation",
            "description": "Comprehensive course covering UAE's digital transformation initiatives and their impact on society",
            "subject": "Digital Studies",
            "level": "undergraduate",
            "duration_weeks": 16,
            "credits": 3,
            "learning_objectives": [
                "Understand UAE's Vision 2071 digital goals",
                "Analyze smart city initiatives in UAE",
                "Evaluate digital government services"
            ],
            "modules": [
                {
                    "title": "UAE Vision 2071 Overview",
                    "description": "Introduction to UAE's long-term vision",
                    "week": 1,
                    "duration_hours": 3,
                    "learning_outcomes": ["Understand national digital strategy"],
                    "resources": ["UAE Vision 2071 document", "Government presentations"]
                },
                {
                    "title": "Smart Cities in UAE",
                    "description": "Exploring Dubai and Abu Dhabi smart city projects",
                    "week": 2,
                    "duration_hours": 3,
                    "learning_outcomes": ["Analyze smart city components"],
                    "resources": ["Smart Dubai reports", "Case studies"]
                }
            ],
            "assessment_methods": [
                {
                    "type": "assignment",
                    "title": "Digital Initiative Analysis",
                    "weight": 30,
                    "description": "Analyze a UAE digital initiative"
                },
                {
                    "type": "exam",
                    "title": "Final Examination",
                    "weight": 50,
                    "description": "Comprehensive exam covering all topics"
                }
            ],
            "prerequisites": ["Basic Computer Skills"],
            "language": "en",
            "status": "draft"
        }
        
        response, response_time = self.make_request('POST', '/api/curriculum-planning/curricula', curriculum_data)
        
        if response and response.status_code in [200, 201]:
            try:
                data = response.json()
                curriculum_id = data.get('curriculum_id') or data.get('id')
                self.log_test_result(
                    "Create Curriculum",
                    True,
                    f"Successfully created curriculum with ID: {curriculum_id}",
                    response_time,
                    response.status_code
                )
                
                # Test retrieving curriculum
                response, response_time = self.make_request('GET', f'/api/curriculum-planning/curricula/{curriculum_id}')
                
                if response and response.status_code == 200:
                    self.log_test_result(
                        "Retrieve Curriculum",
                        True,
                        f"Successfully retrieved curriculum data",
                        response_time,
                        response.status_code
                    )
                else:
                    status_code = response.status_code if response else 0
                    self.log_test_result(
                        "Retrieve Curriculum",
                        False,
                        f"Failed to retrieve curriculum with status {status_code}",
                        response_time,
                        status_code
                    )
                    
            except json.JSONDecodeError:
                self.log_test_result(
                    "Create Curriculum",
                    False,
                    "Invalid JSON response",
                    response_time,
                    response.status_code
                )
        else:
            status_code = response.status_code if response else 0
            self.log_test_result(
                "Create Curriculum",
                False,
                f"Failed to create curriculum with status {status_code}",
                response_time,
                status_code
            )

    def test_performance_analytics_system(self):
        """Test performance analytics functionality"""
        print("\n=== Testing Performance Analytics System ===")
        
        if not self.auth_token:
            self.log_test_result("Performance Analytics", False, "No auth token available")
            return
            
        # Test creating performance data
        performance_data = {
            "student_id": "STU001",
            "assessment_type": "assignment",
            "assessment_title": "UAE Digital Strategy Analysis",
            "score": 85,
            "max_score": 100,
            "submission_date": datetime.now().isoformat(),
            "feedback": "Excellent analysis of UAE's digital transformation initiatives. Good use of examples.",
            "rubric_scores": {
                "content_knowledge": 90,
                "critical_thinking": 85,
                "communication": 80,
                "research_skills": 85
            },
            "improvement_areas": ["Citation format", "Conclusion strength"],
            "strengths": ["Clear analysis", "Good examples", "Well-structured"]
        }
        
        response, response_time = self.make_request('POST', '/api/performance-analytics/assessments', performance_data)
        
        if response and response.status_code in [200, 201]:
            try:
                data = response.json()
                assessment_id = data.get('assessment_id') or data.get('id')
                self.log_test_result(
                    "Record Performance Data",
                    True,
                    f"Successfully recorded assessment with ID: {assessment_id}",
                    response_time,
                    response.status_code
                )
                
                # Test retrieving analytics
                response, response_time = self.make_request('GET', '/api/performance-analytics/students/STU001/analytics')
                
                if response and response.status_code == 200:
                    try:
                        analytics_data = response.json()
                        self.log_test_result(
                            "Retrieve Student Analytics",
                            True,
                            f"Successfully retrieved analytics data",
                            response_time,
                            response.status_code
                        )
                    except json.JSONDecodeError:
                        self.log_test_result(
                            "Retrieve Student Analytics",
                            False,
                            "Invalid JSON response",
                            response_time,
                            response.status_code
                        )
                else:
                    status_code = response.status_code if response else 0
                    self.log_test_result(
                        "Retrieve Student Analytics",
                        False,
                        f"Failed to retrieve analytics with status {status_code}",
                        response_time,
                        status_code
                    )
                    
            except json.JSONDecodeError:
                self.log_test_result(
                    "Record Performance Data",
                    False,
                    "Invalid JSON response",
                    response_time,
                    response.status_code
                )
        else:
            status_code = response.status_code if response else 0
            self.log_test_result(
                "Record Performance Data",
                False,
                f"Failed to record performance data with status {status_code}",
                response_time,
                status_code
            )

    def test_resource_management_system(self):
        """Test resource management functionality"""
        print("\n=== Testing Resource Management System ===")
        
        if not self.auth_token:
            self.log_test_result("Resource Management", False, "No auth token available")
            return
            
        # Test creating a resource
        resource_data = {
            "title": "UAE History and Culture Module",
            "description": "Comprehensive module covering UAE's rich history, traditions, and cultural values",
            "type": "document",
            "category": "Cultural Studies",
            "language": "both",
            "file_url": "/resources/uae-history-culture.pdf",
            "file_size": 2048000,
            "tags": ["UAE", "History", "Culture", "Heritage"],
            "is_public": True,
            "metadata": {
                "author": "Dr. Amina Al-Zahra",
                "version": "1.0",
                "last_updated": datetime.now().isoformat()
            }
        }
        
        response, response_time = self.make_request('POST', '/api/resource-management/resources', resource_data)
        
        if response and response.status_code in [200, 201]:
            try:
                data = response.json()
                resource_id = data.get('resource_id') or data.get('id')
                self.log_test_result(
                    "Create Resource",
                    True,
                    f"Successfully created resource with ID: {resource_id}",
                    response_time,
                    response.status_code
                )
                
                # Test retrieving resource
                response, response_time = self.make_request('GET', f'/api/resource-management/resources/{resource_id}')
                
                if response and response.status_code == 200:
                    self.log_test_result(
                        "Retrieve Resource",
                        True,
                        f"Successfully retrieved resource data",
                        response_time,
                        response.status_code
                    )
                else:
                    status_code = response.status_code if response else 0
                    self.log_test_result(
                        "Retrieve Resource",
                        False,
                        f"Failed to retrieve resource with status {status_code}",
                        response_time,
                        status_code
                    )
                    
            except json.JSONDecodeError:
                self.log_test_result(
                    "Create Resource",
                    False,
                    "Invalid JSON response",
                    response_time,
                    response.status_code
                )
        else:
            status_code = response.status_code if response else 0
            self.log_test_result(
                "Create Resource",
                False,
                f"Failed to create resource with status {status_code}",
                response_time,
                status_code
            )
            
        # Test listing resources
        response, response_time = self.make_request('GET', '/api/resource-management/resources')
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                resource_count = len(data.get('resources', []))
                self.log_test_result(
                    "List Resources",
                    True,
                    f"Successfully retrieved {resource_count} resources",
                    response_time,
                    response.status_code
                )
            except json.JSONDecodeError:
                self.log_test_result(
                    "List Resources",
                    False,
                    "Invalid JSON response",
                    response_time,
                    response.status_code
                )
        else:
            status_code = response.status_code if response else 0
            self.log_test_result(
                "List Resources",
                False,
                f"Failed to list resources with status {status_code}",
                response_time,
                status_code
            )

    def test_integration_scenarios(self):
        """Test integration between different educator systems"""
        print("\n=== Testing Integration Scenarios ===")
        
        if not self.auth_token:
            self.log_test_result("Integration Tests", False, "No auth token available")
            return
            
        # Test curriculum-student assignment
        assignment_data = {
            "curriculum_id": 1,  # Assuming curriculum was created
            "student_ids": ["STU001"],
            "start_date": datetime.now().isoformat(),
            "end_date": (datetime.now() + timedelta(weeks=16)).isoformat(),
            "instructor_notes": "Standard enrollment for Computer Science program"
        }
        
        response, response_time = self.make_request('POST', '/api/curriculum-planning/assignments', assignment_data)
        
        if response and response.status_code in [200, 201]:
            self.log_test_result(
                "Curriculum-Student Assignment",
                True,
                "Successfully assigned curriculum to student",
                response_time,
                response.status_code
            )
        else:
            status_code = response.status_code if response else 0
            self.log_test_result(
                "Curriculum-Student Assignment",
                False,
                f"Failed to assign curriculum with status {status_code}",
                response_time,
                status_code
            )

    def calculate_performance_metrics(self):
        """Calculate overall performance metrics"""
        total_tests = self.test_results['total_tests']
        passed_tests = self.test_results['passed_tests']
        failed_tests = self.test_results['failed_tests']
        
        if total_tests > 0:
            success_rate = (passed_tests / total_tests) * 100
            failure_rate = (failed_tests / total_tests) * 100
        else:
            success_rate = 0
            failure_rate = 0
            
        # Calculate average response time
        response_times = [test['response_time_ms'] for test in self.test_results['test_details']]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        self.test_results['performance_metrics'] = {
            'success_rate_percentage': round(success_rate, 2),
            'failure_rate_percentage': round(failure_rate, 2),
            'average_response_time_ms': round(avg_response_time, 2),
            'total_execution_time_seconds': sum([test['response_time_ms'] for test in self.test_results['test_details']]) / 1000
        }
        
        # Coverage analysis
        tested_components = set()
        for test in self.test_results['test_details']:
            if 'Student Tracking' in test['test_name']:
                tested_components.add('student_tracking')
            elif 'Curriculum' in test['test_name']:
                tested_components.add('curriculum_planning')
            elif 'Performance Analytics' in test['test_name'] or 'Analytics' in test['test_name']:
                tested_components.add('performance_analytics')
            elif 'Resource' in test['test_name']:
                tested_components.add('resource_management')
            elif 'Health' in test['test_name']:
                tested_components.add('health_checks')
            elif 'Auth' in test['test_name'] or 'Login' in test['test_name'] or 'Registration' in test['test_name']:
                tested_components.add('authentication')
                
        total_components = 6  # student_tracking, curriculum_planning, performance_analytics, resource_management, health_checks, authentication
        coverage_percentage = (len(tested_components) / total_components) * 100
        
        self.test_results['coverage_analysis'] = {
            'tested_components': list(tested_components),
            'total_components': total_components,
            'coverage_percentage': round(coverage_percentage, 2)
        }

    def run_all_tests(self):
        """Run the complete test suite"""
        print("Starting Educator Persona Comprehensive Test Suite")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test categories
        self.test_health_endpoints()
        self.test_authentication()
        self.test_student_tracking_system()
        self.test_curriculum_planning_system()
        self.test_performance_analytics_system()
        self.test_resource_management_system()
        self.test_integration_scenarios()
        
        # Calculate metrics
        self.calculate_performance_metrics()
        
        total_time = time.time() - start_time
        
        # Print summary
        print("\n" + "=" * 60)
        print("TEST SUITE SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed_tests']}")
        print(f"Failed: {self.test_results['failed_tests']}")
        print(f"Success Rate: {self.test_results['performance_metrics']['success_rate_percentage']}%")
        print(f"Average Response Time: {self.test_results['performance_metrics']['average_response_time_ms']}ms")
        print(f"Total Execution Time: {total_time:.2f}s")
        print(f"Component Coverage: {self.test_results['coverage_analysis']['coverage_percentage']}%")
        
        return self.test_results

    def save_results(self, filename: str = "educator_persona_final_test_results.json"):
        """Save test results to JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        print(f"\nTest results saved to {filename}")

def main():
    """Main execution function"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:5000"
        
    print(f"Testing Educator Persona at: {base_url}")
    
    # Initialize and run test suite
    test_suite = EducatorPersonaTestSuite(base_url)
    results = test_suite.run_all_tests()
    
    # Save results
    test_suite.save_results()
    
    # Exit with appropriate code
    if results['failed_tests'] == 0:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print(f"\n❌ {results['failed_tests']} tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
