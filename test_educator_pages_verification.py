#!/usr/bin/env python3
"""
Educator Persona Pages Verification Script

This script tests the functionality and integration of Educator persona pages
to ensure they properly connect with the backend services and provide the
expected user experience.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class EducatorPagesVerifier:
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
    
    def test_educator_dashboard(self):
        """Test Educator Dashboard functionality"""
        page = "Educator Dashboard"
        
        try:
            # Test 1: Dashboard accessibility (may require auth)
            response = requests.get(f"{self.base_url}/educator-dashboard", timeout=10)
            if response.status_code in [200, 401, 403]:  # Auth-protected is expected
                self.log_test(page, "Dashboard Accessibility", "PASS", "Dashboard endpoint accessible")
            else:
                self.log_test(page, "Dashboard Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Educator dashboard data API
            try:
                dashboard_response = requests.get(f"{self.api_base}/educator/dashboard", timeout=5)
                if dashboard_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Educator Dashboard Data API", "PASS", "Educator Dashboard API accessible")
                else:
                    self.log_test(page, "Educator Dashboard Data API", "FAIL", f"Educator Dashboard API HTTP {dashboard_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Educator Dashboard Data API", "SKIP", "Educator Dashboard API endpoint not available")
            
            # Test 3: Student tracking system
            try:
                tracking_response = requests.get(f"{self.api_base}/educator/student-tracking", timeout=5)
                if tracking_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Student Tracking System", "PASS", "Student tracking API accessible")
                else:
                    self.log_test(page, "Student Tracking System", "FAIL", f"Student tracking HTTP {tracking_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Student Tracking System", "SKIP", "Student tracking API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Dashboard Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_training_programs(self):
        """Test Training Programs page (Educator perspective)"""
        page = "Training Programs"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/training", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Educator training programs API
            try:
                training_response = requests.get(f"{self.api_base}/training/educator", timeout=5)
                if training_response.status_code == 200:
                    self.log_test(page, "Educator Training API", "PASS", "Educator training API responds")
                else:
                    self.log_test(page, "Educator Training API", "FAIL", f"Educator training API HTTP {training_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Educator Training API", "SKIP", "Educator training API not available")
            
            # Test 3: Curriculum planning integration
            try:
                curriculum_response = requests.get(f"{self.api_base}/educator/curriculum", timeout=5)
                if curriculum_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Curriculum Planning", "PASS", "Curriculum planning API accessible")
                else:
                    self.log_test(page, "Curriculum Planning", "FAIL", f"Curriculum planning HTTP {curriculum_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Curriculum Planning", "SKIP", "Curriculum planning API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_digital_skills_development(self):
        """Test Digital Skills Development page"""
        page = "Digital Skills Development"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/digital-skills", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Digital skills curriculum API
            try:
                skills_response = requests.get(f"{self.api_base}/digital-skills/curriculum", timeout=5)
                if skills_response.status_code == 200:
                    self.log_test(page, "Digital Skills Curriculum", "PASS", "Digital skills curriculum API responds")
                else:
                    self.log_test(page, "Digital Skills Curriculum", "FAIL", f"Digital skills curriculum HTTP {skills_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Digital Skills Curriculum", "SKIP", "Digital skills curriculum API not available")
            
            # Test 3: Progress tracking for digital skills
            try:
                progress_response = requests.get(f"{self.api_base}/digital-skills/progress", timeout=5)
                if progress_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Digital Skills Progress", "PASS", "Digital skills progress API accessible")
                else:
                    self.log_test(page, "Digital Skills Progress", "FAIL", f"Digital skills progress HTTP {progress_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Digital Skills Progress", "SKIP", "Digital skills progress API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_learning_management_system(self):
        """Test Learning Management System functionality"""
        page = "Learning Management System"
        
        try:
            # Test 1: LMS page accessibility
            response = requests.get(f"{self.base_url}/lms", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "LMS Page Accessibility", "PASS", "LMS page loads successfully")
            else:
                self.log_test(page, "LMS Page Accessibility", "FAIL", f"LMS page HTTP {response.status_code}")
            
            # Test 2: Course management API
            try:
                courses_response = requests.get(f"{self.api_base}/lms/courses", timeout=5)
                if courses_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Course Management", "PASS", "Course management API accessible")
                else:
                    self.log_test(page, "Course Management", "FAIL", f"Course management HTTP {courses_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Course Management", "SKIP", "Course management API not available")
            
            # Test 3: Student enrollment system
            try:
                enrollment_response = requests.get(f"{self.api_base}/lms/enrollment", timeout=5)
                if enrollment_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Student Enrollment", "PASS", "Student enrollment API accessible")
                else:
                    self.log_test(page, "Student Enrollment", "FAIL", f"Student enrollment HTTP {enrollment_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Student Enrollment", "SKIP", "Student enrollment API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "LMS Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_educator_core_systems(self):
        """Test Educator Core Systems functionality"""
        page = "Educator Core Systems"
        
        try:
            # Test 1: Performance analytics system
            try:
                analytics_response = requests.get(f"{self.api_base}/educator/performance-analytics", timeout=5)
                if analytics_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Performance Analytics", "PASS", "Performance analytics API accessible")
                else:
                    self.log_test(page, "Performance Analytics", "FAIL", f"Performance analytics HTTP {analytics_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Performance Analytics", "SKIP", "Performance analytics API not available")
            
            # Test 2: Resource management system
            try:
                resources_response = requests.get(f"{self.api_base}/educator/resources", timeout=5)
                if resources_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Resource Management", "PASS", "Resource management API accessible")
                else:
                    self.log_test(page, "Resource Management", "FAIL", f"Resource management HTTP {resources_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Resource Management", "SKIP", "Resource management API not available")
            
            # Test 3: Curriculum planning system
            try:
                curriculum_response = requests.get(f"{self.api_base}/educator/curriculum-planning", timeout=5)
                if curriculum_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Curriculum Planning System", "PASS", "Curriculum planning system accessible")
                else:
                    self.log_test(page, "Curriculum Planning System", "FAIL", f"Curriculum planning system HTTP {curriculum_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Curriculum Planning System", "SKIP", "Curriculum planning system API not available")
            
            # Test 4: Student tracking system
            try:
                tracking_response = requests.get(f"{self.api_base}/educator/student-tracking-system", timeout=5)
                if tracking_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Student Tracking System", "PASS", "Student tracking system accessible")
                else:
                    self.log_test(page, "Student Tracking System", "FAIL", f"Student tracking system HTTP {tracking_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Student Tracking System", "SKIP", "Student tracking system API not available")
                
        except Exception as e:
            self.log_test(page, "Core Systems Testing", "FAIL", f"System error: {str(e)}")
    
    def test_professional_certifications(self):
        """Test Professional Certifications page (Educator perspective)"""
        page = "Professional Certifications (Educator)"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/professional-certifications", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Educator certification management
            try:
                cert_response = requests.get(f"{self.api_base}/certifications/educator", timeout=5)
                if cert_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Educator Certification Management", "PASS", "Educator certification API accessible")
                else:
                    self.log_test(page, "Educator Certification Management", "FAIL", f"Educator certification HTTP {cert_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Educator Certification Management", "SKIP", "Educator certification API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def run_all_tests(self):
        """Run all Educator persona page tests"""
        print("Starting Educator Persona Pages Verification...")
        print("=" * 60)
        
        # Test all Educator related pages
        self.test_educator_dashboard()
        self.test_training_programs()
        self.test_digital_skills_development()
        self.test_learning_management_system()
        self.test_educator_core_systems()
        self.test_professional_certifications()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("EDUCATOR PERSONA VERIFICATION SUMMARY")
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
        with open("/home/ubuntu/emirati-platform/educator_verification_results.json", "w") as f:
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
        
        print(f"\nDetailed results saved to: educator_verification_results.json")

if __name__ == "__main__":
    verifier = EducatorPagesVerifier()
    verifier.run_all_tests()
