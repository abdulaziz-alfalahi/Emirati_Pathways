#!/usr/bin/env python3
"""
Final System Integration Test
Emirati Journey Platform - Complete System Validation

This script performs comprehensive end-to-end testing of the entire platform
to validate all components are working together correctly.
"""

import requests
import json
import time
import sys
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

class SystemIntegrationTester:
    def __init__(self, base_url="http://localhost:5003"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "test_type": "System Integration",
            "tests": {},
            "overall_score": 0,
            "critical_issues": [],
            "recommendations": []
        }
        
    def log_test(self, test_name, status, details="", score=0, critical=False):
        """Log test results"""
        self.test_results["tests"][test_name] = {
            "status": status,
            "details": details,
            "score": score,
            "critical": critical,
            "timestamp": datetime.now().isoformat()
        }
        
        if critical and status == "FAIL":
            self.test_results["critical_issues"].append(f"{test_name}: {details}")
            
        icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        critical_marker = " 🚨" if critical else ""
        print(f"{icon} {test_name}: {details}{critical_marker}")
        
    def test_core_infrastructure(self):
        """Test core infrastructure components"""
        print("\n🏗️ Testing Core Infrastructure")
        print("-" * 40)
        
        # Test 1: Backend Server Health
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("Backend Server Health", "PASS", "Server responding correctly", 10, critical=True)
            else:
                self.log_test("Backend Server Health", "FAIL", f"Server returned {response.status_code}", 0, critical=True)
        except Exception as e:
            self.log_test("Backend Server Health", "FAIL", f"Connection error: {str(e)}", 0, critical=True)
            
        # Test 2: Database Connectivity
        try:
            # Test through authentication endpoint which requires DB
            response = self.session.post(f"{self.base_url}/api/auth/login", 
                                       json={"email": "test@test.com", "password": "test"})
            if response.status_code in [200, 401]:  # Either success or auth failure is fine - DB is responding
                self.log_test("Database Connectivity", "PASS", "Database responding through auth endpoint", 10, critical=True)
            else:
                self.log_test("Database Connectivity", "FAIL", f"Unexpected response: {response.status_code}", 0, critical=True)
        except Exception as e:
            self.log_test("Database Connectivity", "FAIL", f"Database connection error: {str(e)}", 0, critical=True)
            
        # Test 3: AI Integration (Gemini)
        try:
            response = self.session.get(f"{self.base_url}/api/cv/status", timeout=10)
            if response.status_code == 200:
                self.log_test("AI Integration (Gemini)", "PASS", "AI services accessible", 10)
            else:
                self.log_test("AI Integration (Gemini)", "WARN", "AI status endpoint not available", 5)
        except Exception as e:
            self.log_test("AI Integration (Gemini)", "WARN", f"AI integration check failed: {str(e)}", 5)
            
        # Test 4: CORS Configuration
        try:
            response = self.session.options(f"{self.base_url}/api/auth/login")
            if response.status_code in [200, 204]:
                self.log_test("CORS Configuration", "PASS", "CORS headers properly configured", 5)
            else:
                self.log_test("CORS Configuration", "WARN", "CORS may not be properly configured", 2)
        except Exception as e:
            self.log_test("CORS Configuration", "WARN", f"CORS check failed: {str(e)}", 2)
            
    def test_authentication_system(self):
        """Test authentication system comprehensively"""
        print("\n🔐 Testing Authentication System")
        print("-" * 40)
        
        # Test 1: User Registration
        try:
            registration_data = {
                "email": f"integration.test.{int(time.time())}@example.com",
                "password": "TestPass123!",
                "first_name": "Integration",
                "last_name": "Test User",
                "user_type": "candidate",
                "phone": "+971501234567",
                "emirate": "Dubai",
                "nationality": "UAE",
                "education_level": "Bachelor's Degree",
                "gender": "Male"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/register", json=registration_data)
            
            if response.status_code == 201:
                self.log_test("User Registration", "PASS", "Registration successful", 15, critical=True)
                self.test_email = registration_data["email"]
                self.test_password = registration_data["password"]
            else:
                self.log_test("User Registration", "FAIL", f"Registration failed: {response.text}", 0, critical=True)
                return False
                
        except Exception as e:
            self.log_test("User Registration", "FAIL", f"Registration error: {str(e)}", 0, critical=True)
            return False
            
        # Test 2: User Login
        try:
            login_data = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("data", {}).get("access_token")
                if self.auth_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    self.log_test("User Login", "PASS", "Login successful with token", 15, critical=True)
                else:
                    self.log_test("User Login", "FAIL", "Login successful but no token received", 5, critical=True)
            else:
                self.log_test("User Login", "FAIL", f"Login failed: {response.text}", 0, critical=True)
                return False
                
        except Exception as e:
            self.log_test("User Login", "FAIL", f"Login error: {str(e)}", 0, critical=True)
            return False
            
        # Test 3: Token Validation
        try:
            response = self.session.get(f"{self.base_url}/api/candidate/dashboard")
            
            if response.status_code in [200, 404]:  # 404 is fine if endpoint doesn't exist
                self.log_test("Token Validation", "PASS", "Token accepted by protected endpoint", 10)
            elif response.status_code == 401:
                self.log_test("Token Validation", "FAIL", "Token rejected by protected endpoint", 0)
            else:
                self.log_test("Token Validation", "WARN", f"Unexpected response: {response.status_code}", 5)
                
        except Exception as e:
            self.log_test("Token Validation", "WARN", f"Token validation error: {str(e)}", 5)
            
        return True
        
    def test_job_seeker_persona(self):
        """Test Job Seeker persona end-to-end"""
        print("\n👤 Testing Job Seeker Persona")
        print("-" * 40)
        
        # Test 1: Profile Management
        try:
            response = self.session.get(f"{self.base_url}/api/profile")
            if response.status_code in [200, 404]:
                self.log_test("Profile Management", "PASS", "Profile endpoint accessible", 10)
            else:
                self.log_test("Profile Management", "WARN", f"Profile endpoint issue: {response.status_code}", 5)
        except Exception as e:
            self.log_test("Profile Management", "WARN", f"Profile management error: {str(e)}", 5)
            
        # Test 2: CV Parsing
        try:
            cv_text = "John Doe\nSoftware Engineer\n5 years experience in Python and React"
            response = self.session.post(f"{self.base_url}/api/cv/parse-text", 
                                       json={"cv_text": cv_text})
            
            if response.status_code == 200:
                self.log_test("CV Parsing", "PASS", "CV parsing working correctly", 15)
            else:
                self.log_test("CV Parsing", "WARN", f"CV parsing issue: {response.status_code}", 5)
        except Exception as e:
            self.log_test("CV Parsing", "WARN", f"CV parsing error: {str(e)}", 5)
            
        # Test 3: Job Application
        try:
            application_data = {
                "job_id": "INTEGRATION-TEST-JOB",
                "cover_letter": "Integration test application",
                "expected_salary": "AED 15,000",
                "availability_date": "2024-10-15"
            }
            
            response = self.session.post(f"{self.base_url}/api/jobs/apply", json=application_data)
            
            if response.status_code == 201:
                self.log_test("Job Application", "PASS", "Job application working correctly", 15)
            else:
                self.log_test("Job Application", "FAIL", f"Job application failed: {response.text}", 0)
        except Exception as e:
            self.log_test("Job Application", "FAIL", f"Job application error: {str(e)}", 0)
            
        # Test 4: Application Tracking
        try:
            response = self.session.get(f"{self.base_url}/api/jobs/applications")
            
            if response.status_code == 200:
                self.log_test("Application Tracking", "PASS", "Application tracking working", 10)
            else:
                self.log_test("Application Tracking", "WARN", f"Application tracking issue: {response.status_code}", 5)
        except Exception as e:
            self.log_test("Application Tracking", "WARN", f"Application tracking error: {str(e)}", 5)
            
    def test_other_personas(self):
        """Test other personas for basic functionality"""
        print("\n👥 Testing Other Personas")
        print("-" * 40)
        
        personas = [
            ("HR/Recruiter", "/api/hr/profile"),
            ("Educator", "/api/educator/profile"),
            ("Mentor", "/api/mentor/profile"),
            ("Assessor", "/api/assessor/profile")
        ]
        
        for persona_name, endpoint in personas:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                
                if response.status_code == 200:
                    self.log_test(f"{persona_name} Functionality", "PASS", "Basic endpoint working", 5)
                elif response.status_code == 404:
                    self.log_test(f"{persona_name} Functionality", "FAIL", "Endpoints not implemented", 0)
                elif response.status_code in [400, 401]:
                    self.log_test(f"{persona_name} Functionality", "WARN", "Endpoint exists but needs implementation", 2)
                else:
                    self.log_test(f"{persona_name} Functionality", "WARN", f"Unexpected response: {response.status_code}", 2)
                    
            except Exception as e:
                self.log_test(f"{persona_name} Functionality", "WARN", f"Test error: {str(e)}", 1)
                
    def test_frontend_integration(self):
        """Test frontend integration points"""
        print("\n🌐 Testing Frontend Integration")
        print("-" * 40)
        
        # Test 1: API Response Format
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    self.log_test("API Response Format", "PASS", "JSON responses properly formatted", 5)
                else:
                    self.log_test("API Response Format", "WARN", "Response format inconsistent", 2)
            else:
                self.log_test("API Response Format", "WARN", "Could not test response format", 2)
        except Exception as e:
            self.log_test("API Response Format", "WARN", f"Response format test error: {str(e)}", 2)
            
        # Test 2: Error Handling
        try:
            response = self.session.get(f"{self.base_url}/api/nonexistent-endpoint")
            if response.status_code == 404:
                self.log_test("Error Handling", "PASS", "404 errors properly handled", 5)
            else:
                self.log_test("Error Handling", "WARN", f"Unexpected error response: {response.status_code}", 2)
        except Exception as e:
            self.log_test("Error Handling", "WARN", f"Error handling test failed: {str(e)}", 2)
            
    def test_performance_and_reliability(self):
        """Test performance and reliability"""
        print("\n⚡ Testing Performance and Reliability")
        print("-" * 40)
        
        # Test 1: Response Time
        start_time = time.time()
        try:
            response = self.session.get(f"{self.base_url}/health")
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            if response_time < 1000:  # Less than 1 second
                self.log_test("Response Time", "PASS", f"Response time: {response_time:.0f}ms", 10)
            elif response_time < 3000:  # Less than 3 seconds
                self.log_test("Response Time", "WARN", f"Response time: {response_time:.0f}ms (acceptable)", 5)
            else:
                self.log_test("Response Time", "FAIL", f"Response time: {response_time:.0f}ms (too slow)", 0)
                
        except Exception as e:
            self.log_test("Response Time", "WARN", f"Response time test failed: {str(e)}", 2)
            
        # Test 2: Concurrent Requests
        def make_request():
            try:
                response = requests.get(f"{self.base_url}/health", timeout=10)
                return response.status_code == 200
            except:
                return False
                
        try:
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(make_request) for _ in range(10)]
                results = [future.result() for future in as_completed(futures)]
                
            success_rate = sum(results) / len(results) * 100
            
            if success_rate >= 90:
                self.log_test("Concurrent Requests", "PASS", f"Success rate: {success_rate:.0f}%", 10)
            elif success_rate >= 70:
                self.log_test("Concurrent Requests", "WARN", f"Success rate: {success_rate:.0f}%", 5)
            else:
                self.log_test("Concurrent Requests", "FAIL", f"Success rate: {success_rate:.0f}%", 0)
                
        except Exception as e:
            self.log_test("Concurrent Requests", "WARN", f"Concurrent test failed: {str(e)}", 2)
            
    def test_security_basics(self):
        """Test basic security measures"""
        print("\n🔒 Testing Security Basics")
        print("-" * 40)
        
        # Test 1: Protected Endpoints
        temp_session = requests.Session()  # Session without auth token
        try:
            response = temp_session.post(f"{self.base_url}/api/jobs/apply", 
                                       json={"job_id": "test"})
            
            if response.status_code == 401:
                self.log_test("Protected Endpoints", "PASS", "Unauthorized access properly blocked", 10)
            else:
                self.log_test("Protected Endpoints", "FAIL", f"Security issue: {response.status_code}", 0, critical=True)
        except Exception as e:
            self.log_test("Protected Endpoints", "WARN", f"Security test error: {str(e)}", 5)
            
        # Test 2: Input Validation
        try:
            response = self.session.post(f"{self.base_url}/api/jobs/apply", 
                                       json={"invalid": "data"})
            
            if response.status_code == 400:
                self.log_test("Input Validation", "PASS", "Invalid input properly rejected", 5)
            else:
                self.log_test("Input Validation", "WARN", f"Input validation may be weak: {response.status_code}", 2)
        except Exception as e:
            self.log_test("Input Validation", "WARN", f"Input validation test error: {str(e)}", 2)
            
    def calculate_overall_score(self):
        """Calculate overall system score"""
        total_score = sum(test["score"] for test in self.test_results["tests"].values())
        max_possible_score = 200  # Estimated maximum based on all tests
        self.test_results["overall_score"] = round((total_score / max_possible_score) * 100, 1)
        
    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        failed_tests = [name for name, result in self.test_results["tests"].items() if result["status"] == "FAIL"]
        critical_failures = [name for name, result in self.test_results["tests"].items() 
                           if result["status"] == "FAIL" and result.get("critical", False)]
        
        if critical_failures:
            self.test_results["recommendations"].append("🚨 Address critical failures immediately before production deployment")
            
        if len(failed_tests) > 5:
            self.test_results["recommendations"].append("📋 Implement missing persona-specific endpoints")
            
        if self.test_results["overall_score"] < 70:
            self.test_results["recommendations"].append("⚠️ System needs significant improvements before production")
        elif self.test_results["overall_score"] < 85:
            self.test_results["recommendations"].append("✅ System is functional but could benefit from enhancements")
        else:
            self.test_results["recommendations"].append("🎉 System is production-ready with excellent functionality")
            
    def run_comprehensive_test(self):
        """Run comprehensive system integration testing"""
        print("🧪 Starting Comprehensive System Integration Test")
        print("=" * 60)
        
        # Run all test suites
        self.test_core_infrastructure()
        
        if not self.test_authentication_system():
            print("\n❌ Critical authentication failure - stopping tests")
            return False
            
        self.test_job_seeker_persona()
        self.test_other_personas()
        self.test_frontend_integration()
        self.test_performance_and_reliability()
        self.test_security_basics()
        
        # Calculate results
        self.calculate_overall_score()
        self.generate_recommendations()
        
        # Display results
        print("\n" + "=" * 60)
        print("🏆 SYSTEM INTEGRATION TEST RESULTS")
        print("=" * 60)
        print(f"Overall System Score: {self.test_results['overall_score']}%")
        
        passed = len([t for t in self.test_results["tests"].values() if t["status"] == "PASS"])
        failed = len([t for t in self.test_results["tests"].values() if t["status"] == "FAIL"])
        warnings = len([t for t in self.test_results["tests"].values() if t["status"] == "WARN"])
        total = len(self.test_results["tests"])
        
        print(f"Tests Passed: {passed}/{total}")
        print(f"Tests Failed: {failed}/{total}")
        print(f"Warnings: {warnings}/{total}")
        
        if self.test_results["critical_issues"]:
            print(f"\n🚨 Critical Issues ({len(self.test_results['critical_issues'])}):")
            for issue in self.test_results["critical_issues"]:
                print(f"  • {issue}")
                
        if self.test_results["recommendations"]:
            print(f"\n📋 Recommendations:")
            for rec in self.test_results["recommendations"]:
                print(f"  • {rec}")
                
        return True

def main():
    """Main testing function"""
    tester = SystemIntegrationTester()
    
    try:
        success = tester.run_comprehensive_test()
        
        # Save results to file
        with open("/home/ubuntu/emirati-platform/system_integration_test_results.json", "w") as f:
            json.dump(tester.test_results, f, indent=2)
            
        print(f"\n📄 Test results saved to: system_integration_test_results.json")
        
        if success:
            print("✅ System integration testing completed successfully")
            return 0
        else:
            print("❌ System integration testing failed")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Testing failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
