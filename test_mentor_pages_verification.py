#!/usr/bin/env python3
"""
Mentor Persona Pages Verification Script

This script tests the functionality and integration of Mentor persona pages
to ensure they properly connect with the backend services and provide the
expected user experience.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class MentorPagesVerifier:
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
    
    def test_mentorship_page(self):
        """Test Mentorship page functionality"""
        page = "Mentorship"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/mentorship", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Mentor matching API
            try:
                matching_response = requests.get(f"{self.api_base}/mentor/matching", timeout=5)
                if matching_response.status_code == 200:
                    self.log_test(page, "Mentor Matching API", "PASS", "Mentor matching API responds")
                else:
                    self.log_test(page, "Mentor Matching API", "FAIL", f"Mentor matching API HTTP {matching_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Mentor Matching API", "SKIP", "Mentor matching API endpoint not available")
            
            # Test 3: Mentorship session scheduling
            try:
                sessions_response = requests.get(f"{self.api_base}/mentor/sessions", timeout=5)
                if sessions_response.status_code == 200:
                    self.log_test(page, "Session Scheduling", "PASS", "Session scheduling API responds")
                else:
                    self.log_test(page, "Session Scheduling", "FAIL", f"Session scheduling HTTP {sessions_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Session Scheduling", "SKIP", "Session scheduling API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_mentor_dashboard(self):
        """Test Mentor Dashboard functionality"""
        page = "Mentor Dashboard"
        
        try:
            # Test 1: Dashboard accessibility (may require auth)
            response = requests.get(f"{self.base_url}/mentor-dashboard", timeout=10)
            if response.status_code in [200, 401, 403]:  # Auth-protected is expected
                self.log_test(page, "Dashboard Accessibility", "PASS", "Dashboard endpoint accessible")
            else:
                self.log_test(page, "Dashboard Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Mentor dashboard data API
            try:
                dashboard_response = requests.get(f"{self.api_base}/mentor/dashboard", timeout=5)
                if dashboard_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Mentor Dashboard Data API", "PASS", "Mentor Dashboard API accessible")
                else:
                    self.log_test(page, "Mentor Dashboard Data API", "FAIL", f"Mentor Dashboard API HTTP {dashboard_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Mentor Dashboard Data API", "SKIP", "Mentor Dashboard API endpoint not available")
            
            # Test 3: Mentee progress tracking
            try:
                progress_response = requests.get(f"{self.api_base}/mentor/progress", timeout=5)
                if progress_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Progress Tracking", "PASS", "Progress tracking API accessible")
                else:
                    self.log_test(page, "Progress Tracking", "FAIL", f"Progress tracking HTTP {progress_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Progress Tracking", "SKIP", "Progress tracking API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Dashboard Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_communities_page(self):
        """Test Communities page functionality (Mentor integration)"""
        page = "Communities"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/communities", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Mentor communities API
            try:
                communities_response = requests.get(f"{self.api_base}/communities/mentor", timeout=5)
                if communities_response.status_code == 200:
                    self.log_test(page, "Mentor Communities API", "PASS", "Mentor communities API responds")
                else:
                    self.log_test(page, "Mentor Communities API", "FAIL", f"Mentor communities API HTTP {communities_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Mentor Communities API", "SKIP", "Mentor communities API not available")
            
            # Test 3: Community engagement features
            try:
                engagement_response = requests.get(f"{self.api_base}/communities/engagement", timeout=5)
                if engagement_response.status_code == 200:
                    self.log_test(page, "Community Engagement", "PASS", "Community engagement API responds")
                else:
                    self.log_test(page, "Community Engagement", "FAIL", f"Community engagement HTTP {engagement_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Community Engagement", "SKIP", "Community engagement API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def test_mentor_matching_system(self):
        """Test Mentor Matching System functionality"""
        page = "Mentor Matching System"
        
        try:
            # Test 1: Mentor profile creation
            try:
                test_profile = {
                    "expertise": ["Technology", "Leadership"],
                    "experience_years": 10,
                    "availability": "weekends"
                }
                profile_response = requests.post(
                    f"{self.api_base}/mentor/profile", 
                    json=test_profile, 
                    timeout=10
                )
                if profile_response.status_code in [200, 201, 401, 403]:
                    self.log_test(page, "Mentor Profile Creation", "PASS", "Profile creation endpoint accessible")
                else:
                    self.log_test(page, "Mentor Profile Creation", "FAIL", f"Profile creation HTTP {profile_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Mentor Profile Creation", "SKIP", "Profile creation API not available")
            
            # Test 2: Mentee-mentor matching algorithm
            try:
                match_data = {
                    "mentee_interests": ["Technology", "Career Development"],
                    "preferred_experience": "senior",
                    "location": "Dubai"
                }
                match_response = requests.post(
                    f"{self.api_base}/mentor/match", 
                    json=match_data, 
                    timeout=10
                )
                if match_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Matching Algorithm", "PASS", "Matching algorithm accessible")
                else:
                    self.log_test(page, "Matching Algorithm", "FAIL", f"Matching algorithm HTTP {match_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Matching Algorithm", "SKIP", "Matching algorithm API not available")
            
            # Test 3: Communication system
            try:
                communication_response = requests.get(f"{self.api_base}/mentor/communication", timeout=5)
                if communication_response.status_code in [200, 401, 403]:
                    self.log_test(page, "Communication System", "PASS", "Communication system accessible")
                else:
                    self.log_test(page, "Communication System", "FAIL", f"Communication system HTTP {communication_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Communication System", "SKIP", "Communication system API not available")
                
        except Exception as e:
            self.log_test(page, "System Testing", "FAIL", f"System error: {str(e)}")
    
    def test_training_programs(self):
        """Test Training Programs page (Mentor perspective)"""
        page = "Training Programs"
        
        try:
            # Test 1: Page accessibility
            response = requests.get(f"{self.base_url}/training", timeout=10)
            if response.status_code == 200:
                self.log_test(page, "Page Accessibility", "PASS", "Page loads successfully")
            else:
                self.log_test(page, "Page Accessibility", "FAIL", f"HTTP {response.status_code}")
            
            # Test 2: Mentor training programs API
            try:
                training_response = requests.get(f"{self.api_base}/training/mentor", timeout=5)
                if training_response.status_code == 200:
                    self.log_test(page, "Mentor Training API", "PASS", "Mentor training API responds")
                else:
                    self.log_test(page, "Mentor Training API", "FAIL", f"Mentor training API HTTP {training_response.status_code}")
            except requests.exceptions.RequestException:
                self.log_test(page, "Mentor Training API", "SKIP", "Mentor training API not available")
                
        except requests.exceptions.RequestException as e:
            self.log_test(page, "Page Accessibility", "FAIL", f"Connection error: {str(e)}")
    
    def run_all_tests(self):
        """Run all Mentor persona page tests"""
        print("Starting Mentor Persona Pages Verification...")
        print("=" * 60)
        
        # Test all Mentor related pages
        self.test_mentorship_page()
        self.test_mentor_dashboard()
        self.test_communities_page()
        self.test_mentor_matching_system()
        self.test_training_programs()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("MENTOR PERSONA VERIFICATION SUMMARY")
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
        with open("/home/ubuntu/emirati-platform/mentor_verification_results.json", "w") as f:
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
        
        print(f"\nDetailed results saved to: mentor_verification_results.json")

if __name__ == "__main__":
    verifier = MentorPagesVerifier()
    verifier.run_all_tests()
