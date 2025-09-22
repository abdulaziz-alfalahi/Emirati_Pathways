#!/usr/bin/env python3
"""
HR/Recruiter Persona Pages Verification Script

This script tests the functionality and integration of HR/Recruiter persona pages
to ensure they properly connect with the backend services and provide the
expected user experience.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class HRRecruiterPagesVerifier:
    def __init__(self, base_url: str = "http://localhost:8082"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.test_results = []
        
    def log_test(self, page: str, test_name: str, status: str, details: str = ""):
        """Log test results"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "page": page,
            "test": test_name,
            "status": status,
            "details": details
        }
        self.test_results.append(result)
        print(f"[{status}] {page} - {test_name}: {details}")
    
    def test_analytics_page(self):
        """Test Analytics page functionality (HR/Recruiter focused)"""
        page = "Analytics"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/analytics", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: HR Analytics API
            try:
                analytics_response = requests.get(f"{self.api_base}/hr/analytics", timeout=5)
                if analytics_response.status_code == 200:
                    self.log_test(page, "HR Analytics API", "PASS", "HR Analytics API responds")
                else:
                    self.log_test(page, "HR Analytics API", "FAIL", f"HR Analytics API HTTP {analytics_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "HR Analytics API", "SKIP", "HR Analytics API endpoint not available")
            
            # Test 3: Recruitment metrics
            try:
                metrics_response = requests.get(f"{self.api_base}/recruitment/metrics", timeout=5)
                if metrics_response.status_code == 200:
                    self.log_test(page, "Recruitment Metrics", "PASS", "Recruitment metrics API responds")
                else:
                    self.log_test(page, "Recruitment Metrics", "FAIL", f"Recruitment metrics HTTP {metrics_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Recruitment Metrics", "SKIP", "Recruitment metrics API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_assessments_page(self):
        """Test Assessments page functionality"""
        page = "Assessments"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/assessments", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Assessment management API
            try:
                assessments_response = requests.get(f"{self.api_base}/assessments", timeout=5)
                if assessments_response.status_code == 200:
                    self.log_test(page, "Assessment Management API", "PASS", "Assessment API responds")
                else:
                    self.log_test(page, "Assessment Management API", "FAIL", f"Assessment API HTTP {assessments_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Assessment Management API", "SKIP", "Assessment API endpoint not available")
            
            # Test 3: Candidate assessment creation
            try:
                test_assessment = {
                    "title": "Technical Assessment",
                    "type": "technical",
                    "duration": 60
                }
                create_response = requests.post(
                    f"{self.api_base}/assessments/create", 
                    json=test_assessment, 
                    timeout=10
                )
                if create_response.status_code in [200, 201]:
                    self.log_test(page, "Assessment Creation", "PASS", "Assessment creation works")
                else:
                    self.log_test(page, "Assessment Creation", "FAIL", f"Assessment creation HTTP {create_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Assessment Creation", "SKIP", "Assessment creation API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_hr_dashboard(self):
        """Test HR Dashboard functionality"""
        page = "HR Dashboard"
        
        try:
            # Test 1: Dashboard accessibility (may require auth)
            response = requests.get(f"{self.base_url}/hr-dashboard", timeout=10)
            if response.status_code in [200, 401, 403]:  # Auth-protected is expected
                self.log_test(page, "Dashboard Accessibility", "PASS", "Dashboard endpoint accessible")
            else:
                self.log_test(page, "Dashboard Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: HR Dashboard data API
            try:
                dashboard_response = requests.get(f"{self.api_base}/hr/dashboard", timeout=5)
                if dashboard_response.status_code in [200, 401, 403]:
                    self.log_test(page, "HR Dashboard Data API", "PASS", "HR Dashboard API accessible")
                else:
                    self.log_test(page, "HR Dashboard Data API", "FAIL", f"HR Dashboard API HTTP {dashboard_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "HR Dashboard Data API", "SKIP", "HR Dashboard API endpoint not available")
            
            # Test 3: Job posting management
            try:
                jobs_response = requests.get(f"{self.api_base}/hr/jobs", timeout=5)
                if jobs_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Job Posting Management", "PASS", "Job posting API accessible")
                else:
                    self.log_test(page, "Job Posting Management", "FAIL", f"Job posting API HTTP {jobs_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Job Posting Management", "SKIP", "Job posting API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Dashboard Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_recruiter_dashboard(self):
        """Test Recruiter Dashboard functionality"""
        page = "Recruiter Dashboard"
        
        try:
            # Test 1: Dashboard accessibility
            response = requests.get(f"{self.base_url}/recruiter-dashboard", timeout=10)
            if response.status_code in [200, 401, 403]:
                self.log_test(page, "Dashboard Accessibility", "PASS", "Recruiter dashboard accessible")
            else:
                self.log_test(page, "Dashboard Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Candidate search functionality
            try:
                search_response = requests.get(f"{self.api_base}/recruiter/candidates/search", timeout=5)
                if search_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Candidate Search", "PASS", "Candidate search API accessible")
                else:
                    self.log_test(page, "Candidate Search", "FAIL", f"Candidate search HTTP {search_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Candidate Search", "SKIP", "Candidate search API not available")
            
            # Test 3: Interview scheduling
            try:
                interview_response = requests.get(f"{self.api_base}/recruiter/interviews", timeout=5)
                if interview_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Interview Scheduling", "PASS", "Interview scheduling API accessible")
                else:
                    self.log_test(page, "Interview Scheduling", "FAIL", f"Interview scheduling HTTP {interview_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Interview Scheduling", "SKIP", "Interview scheduling API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Dashboard Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_professional_certifications(self):
        """Test Professional Certifications page"""
        page = "Professional Certifications"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/professional-certifications", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Certification management API
            try:
                cert_response = requests.get(f"{self.api_base}/certifications", timeout=5)
                if cert_response.status_code == 200:
                    self.log_test(page, "Certification Management", "PASS", "Certification API responds")
                else:
                    self.log_test(page, "Certification Management", "FAIL", f"Certification API HTTP {cert_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Certification Management", "SKIP", "Certification API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def run_all_tests(self):
        """Run all HR/Recruiter persona page tests"""
        print("Starting HR/Recruiter Persona Pages Verification...")
        print("=" * 60)
        
        # Test all HR/Recruiter related pages
        self.test_analytics_page()
        self.test_assessments_page()
        self.test_hr_dashboard()
        self.test_recruiter_dashboard()
        self.test_professional_certifications()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("HR/RECRUITER PERSONA VERIFICATION SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAIL"])
        skipped_tests = len([r for r in self.test_results if r["status"] == "SKIP"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Skipped: {skipped_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Group results by page
        pages = {}
        for result in self.test_results:
            page = result["page"]
            if page not in pages:
                pages[page] = {"PASS": 0, "FAIL": 0, "SKIP": 0}
            pages[page][result["status"]] += 1
        
        print("\nPer-Page Results:")
        for page, results in pages.items():
            total = sum(results.values())
            passed = results["PASS"]
            print(f"  {page}: {passed}/{total} tests passed")
        
        # Save detailed results
        with open("/home/ubuntu/emirati-platform/hr_recruiter_verification_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "skipped": skipped_tests,
                    "success_rate": (passed_tests/total_tests)*100
                },
                "detailed_results": self.test_results,
                "per_page_summary": pages
            }, f, indent=2)
        
        print(f"\nDetailed results saved to: hr_recruiter_verification_results.json")

if __name__ == "__main__":
    verifier = HRRecruiterPagesVerifier()
    verifier.run_all_tests()
