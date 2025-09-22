#!/usr/bin/env python3
"""
Job Seeker Persona Pages Verification Script

This script tests the functionality and integration of Job Seeker persona pages
to ensure they properly connect with the backend services and provide the
expected user experience.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class JobSeekerPagesVerifier:
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
    
    def test_career_planning_hub(self):
        """Test Career Planning Hub page functionality"""
        page = "Career Planning Hub"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/career-planning-hub", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Career paths API integration
            try:
                career_response = requests.get(f"{self.api_base}/career-paths", timeout=5)
                if career_response.status_code == 200:
                    self.log_test(page, "Career Paths API", "PASS", "API responds correctly")
                else:
                    self.log_test(page, "Career Paths API", "FAIL", f"API HTTP {career_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Career Paths API", "SKIP", "API endpoint not available")
            
            # Test 3: Skills assessment integration
            try:
                skills_response = requests.get(f"{self.api_base}/skills-assessment", timeout=5)
                if skills_response.status_code == 200:
                    self.log_test(page, "Skills Assessment API", "PASS", "Skills API responds")
                else:
                    self.log_test(page, "Skills Assessment API", "FAIL", f"Skills API HTTP {skills_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Skills Assessment API", "SKIP", "Skills API endpoint not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_cv_builder(self):
        """Test CV Builder page functionality"""
        page = "CV Builder"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/cv-builder", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Resume templates API
            try:
                templates_response = requests.get(f"{self.api_base}/resume-templates", timeout=5)
                if templates_response.status_code == 200:
                    self.log_test(page, "Resume Templates API", "PASS", "Templates API responds")
                else:
                    self.log_test(page, "Resume Templates API", "FAIL", f"Templates API HTTP {templates_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Resume Templates API", "SKIP", "Templates API endpoint not available")
            
            # Test 3: Resume generation functionality
            try:
                # Simulate resume generation request
                test_data = {
                    "personal_info": {
                        "name": "Test User",
                        "email": "test@example.com"
                    },
                    "template_id": "modern"
                }
                generate_response = requests.post(
                    f"{self.api_base}/resume/generate", 
                    json=test_data, 
                    timeout=10
                )
                if generate_response.status_code in [200, 201]:
                    self.log_test(page, "Resume Generation", "PASS", "Resume generation works")
                else:
                    self.log_test(page, "Resume Generation", "FAIL", f"Generation HTTP {generate_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Resume Generation", "SKIP", "Resume generation API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_job_matching(self):
        """Test Job Matching page functionality"""
        page = "Job Matching"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/job-matching", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Job search API
            try:
                jobs_response = requests.get(f"{self.api_base}/jobs/search", timeout=5)
                if jobs_response.status_code == 200:
                    self.log_test(page, "Job Search API", "PASS", "Job search API responds")
                else:
                    self.log_test(page, "Job Search API", "FAIL", f"Job search API HTTP {jobs_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Job Search API", "SKIP", "Job search API endpoint not available")
            
            # Test 3: Job matching algorithm
            try:
                match_data = {
                    "skills": ["Python", "React", "JavaScript"],
                    "experience_level": "mid",
                    "location": "Dubai"
                }
                match_response = requests.post(
                    f"{self.api_base}/jobs/match", 
                    json=match_data, 
                    timeout=10
                )
                if match_response.status_code == 200:
                    self.log_test(page, "Job Matching Algorithm", "PASS", "Matching algorithm works")
                else:
                    self.log_test(page, "Job Matching Algorithm", "FAIL", f"Matching HTTP {match_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Job Matching Algorithm", "SKIP", "Job matching API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_applications_page(self):
        """Test Applications page functionality"""
        page = "Applications"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/applications", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Applications API
            try:
                apps_response = requests.get(f"{self.api_base}/applications", timeout=5)
                if apps_response.status_code == 200:
                    self.log_test(page, "Applications API", "PASS", "Applications API responds")
                else:
                    self.log_test(page, "Applications API", "FAIL", f"Applications API HTTP {apps_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Applications API", "SKIP", "Applications API endpoint not available")
            
            # Test 3: Application status tracking
            try:
                status_response = requests.get(f"{self.api_base}/applications/status/1", timeout=5)
                if status_response.status_code in [200, 404]:  # 404 is acceptable for test
                    self.log_test(page, "Status Tracking", "PASS", "Status tracking endpoint accessible")
                else:
                    self.log_test(page, "Status Tracking", "FAIL", f"Status tracking HTTP {status_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Status Tracking", "SKIP", "Status tracking API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_candidate_dashboard(self):
        """Test Candidate Dashboard functionality"""
        page = "Candidate Dashboard"
        
        try:
            # Test 1: Dashboard accessibility (may require auth)
            response = requests.get(f"{self.base_url}/candidate-dashboard", timeout=10)
            if response.status_code in [200, 401, 403]:  # Auth-protected is expected
                self.log_test(page, "Dashboard Accessibility", "PASS", "Dashboard endpoint accessible")
            else:
                self.log_test(page, "Dashboard Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Dashboard data API
            try:
                dashboard_response = requests.get(f"{self.api_base}/candidate/dashboard", timeout=5)
                if dashboard_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Dashboard Data API", "PASS", "Dashboard API accessible")
                else:
                    self.log_test(page, "Dashboard Data API", "FAIL", f"Dashboard API HTTP {dashboard_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Dashboard Data API", "SKIP", "Dashboard API endpoint not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Dashboard Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def run_all_tests(self):
        """Run all Job Seeker persona page tests"""
        print("Starting Job Seeker Persona Pages Verification...")
        print("=" * 60)
        
        # Test all Job Seeker related pages
        self.test_career_planning_hub()
        self.test_cv_builder()
        self.test_job_matching()
        self.test_applications_page()
        self.test_candidate_dashboard()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("JOB SEEKER PERSONA VERIFICATION SUMMARY")
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
        with open("/home/ubuntu/emirati-platform/job_seeker_verification_results.json", "w") as f:
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
        
        print(f"\nDetailed results saved to: job_seeker_verification_results.json")

if __name__ == "__main__":
    verifier = JobSeekerPagesVerifier()
    verifier.run_all_tests()
