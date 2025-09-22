#!/usr/bin/env python3
"""
Comprehensive Bilingual Functionality Testing Script
Tests Arabic/English localization across all personas and pages
"""

import requests
import json
import time
from datetime import datetime

class BilingualTester:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": []
        }
        
    def log_test(self, test_name, status, details=""):
        """Log test result"""
        self.test_results["total_tests"] += 1
        if status == "PASS":
            self.test_results["passed_tests"] += 1
        else:
            self.test_results["failed_tests"] += 1
            
        self.test_results["test_details"].append({
            "test_name": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        print(f"{'✅' if status == 'PASS' else '❌'} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def test_home_page_bilingual(self):
        """Test home page bilingual functionality"""
        print("\n🏠 Testing Home Page Bilingual Functionality...")
        
        try:
            # Test English version
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                content = response.text
                
                # Check for English content
                english_indicators = [
                    "Emirati Journey Platform",
                    "UAE Nationals Career Development",
                    "Empowering UAE Nationals",
                    "Start Your Journey"
                ]
                
                english_found = sum(1 for indicator in english_indicators if indicator in content)
                
                if english_found >= 3:
                    self.log_test("Home Page English Content", "PASS", f"Found {english_found}/4 English indicators")
                else:
                    self.log_test("Home Page English Content", "FAIL", f"Only found {english_found}/4 English indicators")
                
                # Check for Arabic support elements
                arabic_support_indicators = [
                    'dir="rtl"',
                    'lang="ar"',
                    'font-arabic',
                    'rtl'
                ]
                
                arabic_support_found = sum(1 for indicator in arabic_support_indicators if indicator in content)
                
                if arabic_support_found >= 2:
                    self.log_test("Home Page Arabic Support", "PASS", f"Found {arabic_support_found}/4 Arabic support indicators")
                else:
                    self.log_test("Home Page Arabic Support", "FAIL", f"Only found {arabic_support_found}/4 Arabic support indicators")
                    
            else:
                self.log_test("Home Page Accessibility", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Home Page Bilingual Test", "FAIL", str(e))
    
    def test_navigation_bilingual(self):
        """Test navigation menu bilingual functionality"""
        print("\n🧭 Testing Navigation Bilingual Functionality...")
        
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                content = response.text
                
                # Check for navigation elements
                nav_elements = [
                    "Education Pathway",
                    "Career Entry", 
                    "Professional Growth",
                    "Lifelong Engagement"
                ]
                
                nav_found = sum(1 for element in nav_elements if element in content)
                
                if nav_found >= 3:
                    self.log_test("Navigation English Labels", "PASS", f"Found {nav_found}/4 navigation elements")
                else:
                    self.log_test("Navigation English Labels", "FAIL", f"Only found {nav_found}/4 navigation elements")
                
                # Check for language toggle
                language_toggle_indicators = [
                    "language-toggle",
                    "toggleLanguage",
                    "العربية",
                    "English"
                ]
                
                toggle_found = sum(1 for indicator in language_toggle_indicators if indicator in content)
                
                if toggle_found >= 1:
                    self.log_test("Language Toggle Presence", "PASS", f"Found {toggle_found}/4 toggle indicators")
                else:
                    self.log_test("Language Toggle Presence", "FAIL", "No language toggle indicators found")
                    
        except Exception as e:
            self.log_test("Navigation Bilingual Test", "FAIL", str(e))
    
    def test_persona_pages_bilingual(self):
        """Test persona pages bilingual functionality"""
        print("\n👥 Testing Persona Pages Bilingual Functionality...")
        
        persona_pages = [
            "/career-planning-hub",
            "/industry-exploration", 
            "/cv-builder",
            "/job-matching",
            "/analytics",
            "/mentorship"
        ]
        
        for page in persona_pages:
            try:
                response = requests.get(f"{self.base_url}{page}")
                
                if response.status_code == 200:
                    content = response.text
                    
                    # Check for RTL support
                    rtl_indicators = [
                        'dir="rtl"',
                        'rtl',
                        'font-arabic',
                        'text-right'
                    ]
                    
                    rtl_found = sum(1 for indicator in rtl_indicators if indicator in content)
                    
                    if rtl_found >= 2:
                        self.log_test(f"RTL Support - {page}", "PASS", f"Found {rtl_found}/4 RTL indicators")
                    else:
                        self.log_test(f"RTL Support - {page}", "FAIL", f"Only found {rtl_found}/4 RTL indicators")
                        
                elif response.status_code == 404:
                    self.log_test(f"Page Accessibility - {page}", "SKIP", "Page not found (expected for some pages)")
                else:
                    self.log_test(f"Page Accessibility - {page}", "FAIL", f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Persona Page Test - {page}", "FAIL", str(e))
    
    def test_css_rtl_support(self):
        """Test CSS RTL support"""
        print("\n🎨 Testing CSS RTL Support...")
        
        try:
            # Test for RTL CSS files
            css_files = [
                "/src/styles/rtl.css",
                "/src/styles/enhanced-rtl.css"
            ]
            
            for css_file in css_files:
                try:
                    response = requests.get(f"{self.base_url}{css_file}")
                    if response.status_code == 200:
                        content = response.text
                        
                        # Check for RTL CSS rules
                        rtl_rules = [
                            "direction: rtl",
                            "text-align: right",
                            "font-arabic",
                            "flex-direction: row-reverse"
                        ]
                        
                        rules_found = sum(1 for rule in rtl_rules if rule in content)
                        
                        if rules_found >= 3:
                            self.log_test(f"RTL CSS Rules - {css_file}", "PASS", f"Found {rules_found}/4 RTL rules")
                        else:
                            self.log_test(f"RTL CSS Rules - {css_file}", "FAIL", f"Only found {rules_found}/4 RTL rules")
                            
                except:
                    self.log_test(f"RTL CSS File - {css_file}", "SKIP", "CSS file not directly accessible")
                    
        except Exception as e:
            self.log_test("CSS RTL Support Test", "FAIL", str(e))
    
    def test_translation_files(self):
        """Test translation files"""
        print("\n🌐 Testing Translation Files...")
        
        translation_files = [
            "/src/locales/en.json",
            "/src/locales/ar.json"
        ]
        
        for file_path in translation_files:
            try:
                response = requests.get(f"{self.base_url}{file_path}")
                if response.status_code == 200:
                    try:
                        translations = response.json()
                        
                        # Check for key translation keys
                        key_translations = [
                            "platform_title",
                            "hero_title", 
                            "nav_career_entry",
                            "persona_job_seeker"
                        ]
                        
                        keys_found = sum(1 for key in key_translations if key in translations)
                        
                        if keys_found >= 3:
                            self.log_test(f"Translation Keys - {file_path}", "PASS", f"Found {keys_found}/4 key translations")
                        else:
                            self.log_test(f"Translation Keys - {file_path}", "FAIL", f"Only found {keys_found}/4 key translations")
                            
                    except json.JSONDecodeError:
                        self.log_test(f"Translation File Format - {file_path}", "FAIL", "Invalid JSON format")
                        
                else:
                    self.log_test(f"Translation File Access - {file_path}", "SKIP", "Translation file not directly accessible")
                    
            except Exception as e:
                self.log_test(f"Translation File Test - {file_path}", "FAIL", str(e))
    
    def test_responsive_design(self):
        """Test responsive design for both languages"""
        print("\n📱 Testing Responsive Design...")
        
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                content = response.text
                
                # Check for responsive design indicators
                responsive_indicators = [
                    "md:grid-cols",
                    "lg:text-",
                    "sm:flex-",
                    "@media",
                    "responsive"
                ]
                
                responsive_found = sum(1 for indicator in responsive_indicators if indicator in content)
                
                if responsive_found >= 3:
                    self.log_test("Responsive Design Support", "PASS", f"Found {responsive_found}/5 responsive indicators")
                else:
                    self.log_test("Responsive Design Support", "FAIL", f"Only found {responsive_found}/5 responsive indicators")
                    
                # Check for mobile RTL support
                mobile_rtl_indicators = [
                    "rtl .mobile",
                    "sm:text-right",
                    "md:flex-row-reverse"
                ]
                
                mobile_rtl_found = sum(1 for indicator in mobile_rtl_indicators if indicator in content)
                
                if mobile_rtl_found >= 1:
                    self.log_test("Mobile RTL Support", "PASS", f"Found {mobile_rtl_found}/3 mobile RTL indicators")
                else:
                    self.log_test("Mobile RTL Support", "SKIP", "Mobile RTL indicators not found in main page")
                    
        except Exception as e:
            self.log_test("Responsive Design Test", "FAIL", str(e))
    
    def test_accessibility_features(self):
        """Test accessibility features for bilingual support"""
        print("\n♿ Testing Accessibility Features...")
        
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                content = response.text
                
                # Check for accessibility features
                accessibility_features = [
                    'lang="',
                    'dir="',
                    'aria-label',
                    'alt="',
                    'role="'
                ]
                
                features_found = sum(1 for feature in accessibility_features if feature in content)
                
                if features_found >= 4:
                    self.log_test("Accessibility Features", "PASS", f"Found {features_found}/5 accessibility features")
                else:
                    self.log_test("Accessibility Features", "FAIL", f"Only found {features_found}/5 accessibility features")
                    
                # Check for semantic HTML
                semantic_elements = [
                    "<header",
                    "<nav",
                    "<main",
                    "<section",
                    "<footer"
                ]
                
                semantic_found = sum(1 for element in semantic_elements if element in content)
                
                if semantic_found >= 4:
                    self.log_test("Semantic HTML", "PASS", f"Found {semantic_found}/5 semantic elements")
                else:
                    self.log_test("Semantic HTML", "FAIL", f"Only found {semantic_found}/5 semantic elements")
                    
        except Exception as e:
            self.log_test("Accessibility Test", "FAIL", str(e))
    
    def run_all_tests(self):
        """Run all bilingual functionality tests"""
        print("🚀 Starting Comprehensive Bilingual Functionality Testing...")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_home_page_bilingual()
        self.test_navigation_bilingual()
        self.test_persona_pages_bilingual()
        self.test_css_rtl_support()
        self.test_translation_files()
        self.test_responsive_design()
        self.test_accessibility_features()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Calculate success rate
        success_rate = (self.test_results["passed_tests"] / self.test_results["total_tests"]) * 100 if self.test_results["total_tests"] > 0 else 0
        
        print("\n" + "=" * 60)
        print("📊 BILINGUAL FUNCTIONALITY TEST RESULTS")
        print("=" * 60)
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed_tests']} ✅")
        print(f"Failed: {self.test_results['failed_tests']} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Test Duration: {duration:.2f} seconds")
        
        # Status indicator
        if success_rate >= 90:
            print("🎉 EXCELLENT: Bilingual functionality is working excellently!")
        elif success_rate >= 75:
            print("✅ GOOD: Bilingual functionality is working well with minor issues")
        elif success_rate >= 50:
            print("⚠️  FAIR: Bilingual functionality needs improvement")
        else:
            print("❌ POOR: Bilingual functionality requires significant fixes")
        
        # Save detailed results
        with open('/home/ubuntu/emirati-platform/bilingual_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(self.test_results, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed results saved to: bilingual_test_results.json")
        
        return self.test_results

def main():
    """Main function to run bilingual tests"""
    tester = BilingualTester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    if results["failed_tests"] == 0:
        exit(0)  # Success
    else:
        exit(1)  # Some tests failed

if __name__ == "__main__":
    main()
