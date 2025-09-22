#!/usr/bin/env python3
"""
EHRDC Theme Implementation Test Suite
Tests the complete implementation of EHRDC teal theme and dual government logos
across all pages of the Emirati Journey Platform.
"""

import requests
import json
import time
from typing import Dict, List, Any

class EHRDCThemeTestSuite:
    def __init__(self):
        self.base_url = "http://localhost:8080"
        self.api_base_url = "http://localhost:5003"
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        self.total_tests += 1
        if status == "PASS":
            self.passed_tests += 1
            
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        print(f"[{status}] {test_name}: {details}")

    def test_frontend_server_availability(self):
        """Test if the frontend server is running"""
        try:
            response = requests.get(f"{self.base_url}", timeout=5)
            if response.status_code == 200:
                self.log_test("Frontend Server", "PASS", "Server is running and accessible")
                return True
            else:
                self.log_test("Frontend Server", "FAIL", f"Server returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_test("Frontend Server", "FAIL", f"Server not accessible: {str(e)}")
            return False

    def test_backend_server_availability(self):
        """Test if the backend server is running"""
        try:
            response = requests.get(f"{self.api_base_url}/health", timeout=5)
            if response.status_code == 200:
                self.log_test("Backend Server", "PASS", "API server is running and accessible")
                return True
            else:
                self.log_test("Backend Server", "FAIL", f"API server returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_test("Backend Server", "FAIL", f"API server not accessible: {str(e)}")
            return False

    def test_government_header_component(self):
        """Test if the GovernmentHeader component exists"""
        import os
        header_path = "/home/ubuntu/emirati-platform/frontend/src/components/layout/GovernmentHeader.tsx"
        
        if os.path.exists(header_path):
            with open(header_path, 'r') as f:
                content = f.read()
                
            # Check for dual logo implementation
            if "dubai-gov-logo.jpg" in content and "ehrdc-logo.png" in content:
                self.log_test("Government Header Component", "PASS", "Dual government logos implemented")
            else:
                self.log_test("Government Header Component", "FAIL", "Missing dual government logos")
        else:
            self.log_test("Government Header Component", "FAIL", "GovernmentHeader component not found")

    def test_ehrdc_logo_assets(self):
        """Test if EHRDC and Dubai Government logo assets exist"""
        import os
        
        ehrdc_logo = "/home/ubuntu/emirati-platform/frontend/public/ehrdc-logo.png"
        dubai_logo = "/home/ubuntu/emirati-platform/frontend/public/dubai-gov-logo.jpg"
        
        if os.path.exists(ehrdc_logo):
            self.log_test("EHRDC Logo Asset", "PASS", "EHRDC logo file exists")
        else:
            self.log_test("EHRDC Logo Asset", "FAIL", "EHRDC logo file missing")
            
        if os.path.exists(dubai_logo):
            self.log_test("Dubai Government Logo Asset", "PASS", "Dubai Government logo file exists")
        else:
            self.log_test("Dubai Government Logo Asset", "FAIL", "Dubai Government logo file missing")

    def test_home_page_theme_implementation(self):
        """Test if the home page uses EHRDC teal theme"""
        import os
        home_page_path = "/home/ubuntu/emirati-platform/frontend/src/pages/HomePage.tsx"
        
        if os.path.exists(home_page_path):
            with open(home_page_path, 'r') as f:
                content = f.read()
                
            # Check for EHRDC teal theme usage
            teal_indicators = [
                "teal-600", "teal-700", "teal-50", "teal-100", "teal-500",
                "from-teal", "to-teal", "bg-teal"
            ]
            
            teal_count = sum(1 for indicator in teal_indicators if indicator in content)
            
            if teal_count >= 5:
                self.log_test("Home Page EHRDC Theme", "PASS", f"Found {teal_count} teal theme implementations")
            else:
                self.log_test("Home Page EHRDC Theme", "FAIL", f"Only found {teal_count} teal theme implementations")
        else:
            self.log_test("Home Page EHRDC Theme", "FAIL", "HomePage component not found")

    def test_auth_page_theme_implementation(self):
        """Test if the authentication page uses EHRDC teal theme and government header"""
        import os
        auth_page_path = "/home/ubuntu/emirati-platform/frontend/src/pages/auth/EnhancedAuth.tsx"
        
        if os.path.exists(auth_page_path):
            with open(auth_page_path, 'r') as f:
                content = f.read()
                
            # Check for government header import and usage
            if "GovernmentHeader" in content:
                self.log_test("Auth Page Government Header", "PASS", "GovernmentHeader imported and used")
            else:
                self.log_test("Auth Page Government Header", "FAIL", "GovernmentHeader not implemented")
                
            # Check for EHRDC teal theme
            if "teal-600" in content and "from-teal" in content:
                self.log_test("Auth Page EHRDC Theme", "PASS", "EHRDC teal theme implemented")
            else:
                self.log_test("Auth Page EHRDC Theme", "FAIL", "EHRDC teal theme not implemented")
        else:
            self.log_test("Auth Page Theme", "FAIL", "EnhancedAuth component not found")

    def test_dashboard_theme_implementation(self):
        """Test if the dashboard pages use EHRDC teal theme and government header"""
        import os
        dashboard_path = "/home/ubuntu/emirati-platform/frontend/src/pages/CandidateDashboard.tsx"
        
        if os.path.exists(dashboard_path):
            with open(dashboard_path, 'r') as f:
                content = f.read()
                
            # Check for government header
            if "GovernmentHeader" in content:
                self.log_test("Dashboard Government Header", "PASS", "GovernmentHeader implemented")
            else:
                self.log_test("Dashboard Government Header", "FAIL", "GovernmentHeader not implemented")
                
            # Check for EHRDC teal theme
            if "teal-600" in content and "from-slate-50 to-teal-50" in content:
                self.log_test("Dashboard EHRDC Theme", "PASS", "EHRDC teal theme implemented")
            else:
                self.log_test("Dashboard EHRDC Theme", "FAIL", "EHRDC teal theme not implemented")
        else:
            self.log_test("Dashboard Theme", "FAIL", "CandidateDashboard component not found")

    def test_profile_management_theme_implementation(self):
        """Test if the profile management page uses EHRDC teal theme and government header"""
        import os
        profile_path = "/home/ubuntu/emirati-platform/frontend/src/pages/profile/ProfileManagement.tsx"
        
        if os.path.exists(profile_path):
            with open(profile_path, 'r') as f:
                content = f.read()
                
            # Check for government header
            if "GovernmentHeader" in content:
                self.log_test("Profile Management Government Header", "PASS", "GovernmentHeader implemented")
            else:
                self.log_test("Profile Management Government Header", "FAIL", "GovernmentHeader not implemented")
                
            # Check for EHRDC teal theme
            if "teal-600" in content and "from-slate-50 to-teal-50" in content:
                self.log_test("Profile Management EHRDC Theme", "PASS", "EHRDC teal theme implemented")
            else:
                self.log_test("Profile Management EHRDC Theme", "FAIL", "EHRDC teal theme not implemented")
        else:
            self.log_test("Profile Management Theme", "FAIL", "ProfileManagement component not found")

    def test_persona_specific_components(self):
        """Test if persona-specific components exist with proper theming"""
        import os
        
        components_to_test = [
            ("/home/ubuntu/emirati-platform/frontend/src/components/recruiter/HRProfileForm.tsx", "HR Profile Form"),
            ("/home/ubuntu/emirati-platform/frontend/src/components/recruiter/CompanyProfileSetup.tsx", "Company Profile Setup"),
            ("/home/ubuntu/emirati-platform/frontend/src/components/educator/EducatorProfileForm.tsx", "Educator Profile Form"),
            ("/home/ubuntu/emirati-platform/frontend/src/components/educator/InstitutionProfileSetup.tsx", "Institution Profile Setup"),
            ("/home/ubuntu/emirati-platform/frontend/src/components/assessor/AssessorProfileForm.tsx", "Assessor Profile Form"),
            ("/home/ubuntu/emirati-platform/frontend/src/components/assessor/CertificationTracking.tsx", "Certification Tracking")
        ]
        
        for component_path, component_name in components_to_test:
            if os.path.exists(component_path):
                with open(component_path, 'r') as f:
                    content = f.read()
                    
                # Check for teal theme usage
                if "teal-" in content or "emerald-" in content:
                    self.log_test(f"{component_name} Component", "PASS", "Component exists with teal theme")
                else:
                    self.log_test(f"{component_name} Component", "PARTIAL", "Component exists but may need theme updates")
            else:
                self.log_test(f"{component_name} Component", "FAIL", "Component not found")

    def test_color_palette_documentation(self):
        """Test if the color palette documentation exists"""
        import os
        palette_path = "/home/ubuntu/emirati-platform/frontend/public/color-palette.html"
        
        if os.path.exists(palette_path):
            with open(palette_path, 'r') as f:
                content = f.read()
                
            if "#0d9488" in content and "EHRDC" in content:
                self.log_test("Color Palette Documentation", "PASS", "EHRDC color palette documented")
            else:
                self.log_test("Color Palette Documentation", "PARTIAL", "Documentation exists but may be incomplete")
        else:
            self.log_test("Color Palette Documentation", "FAIL", "Color palette documentation not found")

    def test_backend_profile_routes(self):
        """Test if the backend profile management routes are working"""
        try:
            # Test profile health endpoint
            response = requests.get(f"{self.api_base_url}/api/profile/health", timeout=5)
            if response.status_code == 200:
                self.log_test("Backend Profile Routes", "PASS", "Profile management routes are working")
            else:
                self.log_test("Backend Profile Routes", "FAIL", f"Profile routes returned status {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log_test("Backend Profile Routes", "FAIL", f"Profile routes not accessible: {str(e)}")

    def run_all_tests(self):
        """Run the complete test suite"""
        print("🧪 EHRDC THEME IMPLEMENTATION TEST SUITE")
        print("=" * 60)
        
        # Infrastructure tests
        print("\n📡 INFRASTRUCTURE TESTS")
        print("-" * 30)
        frontend_ok = self.test_frontend_server_availability()
        backend_ok = self.test_backend_server_availability()
        
        # Asset tests
        print("\n🎨 ASSET TESTS")
        print("-" * 30)
        self.test_ehrdc_logo_assets()
        self.test_color_palette_documentation()
        
        # Component tests
        print("\n🧩 COMPONENT TESTS")
        print("-" * 30)
        self.test_government_header_component()
        self.test_persona_specific_components()
        
        # Page implementation tests
        print("\n📄 PAGE IMPLEMENTATION TESTS")
        print("-" * 30)
        self.test_home_page_theme_implementation()
        self.test_auth_page_theme_implementation()
        self.test_dashboard_theme_implementation()
        self.test_profile_management_theme_implementation()
        
        # Backend tests
        print("\n🔧 BACKEND TESTS")
        print("-" * 30)
        self.test_backend_profile_routes()
        
        # Generate summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary and save results"""
        print("\n" + "=" * 60)
        print("🎯 TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (self.passed_tests / self.total_tests) * 100 if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.total_tests - self.passed_tests}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        # Categorize results
        passed = [r for r in self.test_results if r["status"] == "PASS"]
        failed = [r for r in self.test_results if r["status"] == "FAIL"]
        partial = [r for r in self.test_results if r["status"] == "PARTIAL"]
        
        if passed:
            print(f"\n✅ PASSED TESTS ({len(passed)}):")
            for test in passed:
                print(f"   • {test['test']}")
        
        if partial:
            print(f"\n⚠️  PARTIAL TESTS ({len(partial)}):")
            for test in partial:
                print(f"   • {test['test']}: {test['details']}")
        
        if failed:
            print(f"\n❌ FAILED TESTS ({len(failed)}):")
            for test in failed:
                print(f"   • {test['test']}: {test['details']}")
        
        # Save detailed results
        results_file = "/home/ubuntu/emirati-platform/ehrdc_theme_test_results.json"
        with open(results_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_tests": self.total_tests,
                    "passed_tests": self.passed_tests,
                    "failed_tests": self.total_tests - self.passed_tests,
                    "success_rate": success_rate,
                    "test_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                },
                "detailed_results": self.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {results_file}")
        
        # Overall assessment
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: EHRDC theme implementation is highly successful!")
        elif success_rate >= 75:
            print("\n👍 GOOD: EHRDC theme implementation is mostly successful with minor issues.")
        elif success_rate >= 50:
            print("\n⚠️  MODERATE: EHRDC theme implementation needs significant improvements.")
        else:
            print("\n❌ POOR: EHRDC theme implementation requires major fixes.")

if __name__ == "__main__":
    test_suite = EHRDCThemeTestSuite()
    test_suite.run_all_tests()
