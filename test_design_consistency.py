#!/usr/bin/env python3
"""
Comprehensive Design Consistency Testing Script
Tests all dropdown menu pages for consistent design and layout
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class DesignConsistencyTester:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.results = {
            "test_timestamp": datetime.now().isoformat(),
            "base_url": base_url,
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_results": [],
            "design_consistency_score": 0,
            "recommendations": []
        }
        
    def test_page_accessibility(self, url: str, page_name: str) -> Dict[str, Any]:
        """Test if a page is accessible and loads correctly"""
        try:
            response = requests.get(url, timeout=10)
            
            test_result = {
                "page": page_name,
                "url": url,
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds(),
                "content_length": len(response.content),
                "has_content": len(response.content) > 1000,  # Basic content check
                "passed": response.status_code == 200 and len(response.content) > 1000
            }
            
            # Check for common design elements
            content = response.text.lower()
            design_elements = {
                "has_navigation": "nav" in content or "navigation" in content,
                "has_header": "header" in content,
                "has_footer": "footer" in content,
                "has_modern_styling": "tailwind" in content or "modern" in content,
                "has_responsive_design": "responsive" in content or "mobile" in content,
                "has_uae_branding": "uae" in content or "emirates" in content or "dubai" in content,
                "has_arabic_support": "arabic" in content or "rtl" in content or "ar" in content
            }
            
            test_result["design_elements"] = design_elements
            test_result["design_score"] = sum(design_elements.values()) / len(design_elements) * 100
            
            return test_result
            
        except requests.exceptions.RequestException as e:
            return {
                "page": page_name,
                "url": url,
                "error": str(e),
                "passed": False,
                "design_score": 0
            }
    
    def test_dropdown_menu_pages(self) -> None:
        """Test all dropdown menu pages for design consistency"""
        
        # Define all dropdown menu pages to test
        pages_to_test = [
            # Career Entry Pages
            {"url": f"{self.base_url}/career-planning-hub", "name": "Career Planning Hub", "category": "Career Entry"},
            {"url": f"{self.base_url}/industry-exploration", "name": "Industry Exploration", "category": "Career Entry"},
            {"url": f"{self.base_url}/financial-planning", "name": "Financial Planning", "category": "Career Entry"},
            {"url": f"{self.base_url}/cv-builder", "name": "CV Builder", "category": "Career Entry"},
            {"url": f"{self.base_url}/portfolio", "name": "Portfolio", "category": "Career Entry"},
            {"url": f"{self.base_url}/interview-preparation", "name": "Interview Preparation", "category": "Career Entry"},
            {"url": f"{self.base_url}/internships", "name": "Internships", "category": "Career Entry"},
            {"url": f"{self.base_url}/job-matching", "name": "Job Matching", "category": "Career Entry"},
            
            # Education Pathway Pages
            {"url": f"{self.base_url}/school-programs", "name": "School Programs", "category": "Education Pathway"},
            {"url": f"{self.base_url}/summer-camps", "name": "Summer Camps", "category": "Education Pathway"},
            {"url": f"{self.base_url}/scholarships", "name": "Scholarships", "category": "Education Pathway"},
            {"url": f"{self.base_url}/university-programs", "name": "University Programs", "category": "Education Pathway"},
            {"url": f"{self.base_url}/graduate-programs", "name": "Graduate Programs", "category": "Education Pathway"},
            {"url": f"{self.base_url}/learning-management", "name": "Learning Management System", "category": "Education Pathway"},
            
            # Professional Growth Pages
            {"url": f"{self.base_url}/analytics", "name": "Analytics", "category": "Professional Growth"},
            {"url": f"{self.base_url}/training-programs", "name": "Training Programs", "category": "Professional Growth"},
            {"url": f"{self.base_url}/certifications", "name": "Certifications", "category": "Professional Growth"},
            {"url": f"{self.base_url}/skill-assessments", "name": "Skill Assessments", "category": "Professional Growth"},
            {"url": f"{self.base_url}/mentorship", "name": "Mentorship", "category": "Professional Growth"},
            {"url": f"{self.base_url}/leadership-development", "name": "Leadership Development", "category": "Professional Growth"},
            
            # Lifelong Engagement Pages
            {"url": f"{self.base_url}/communities", "name": "Communities", "category": "Lifelong Engagement"},
            {"url": f"{self.base_url}/networking", "name": "Networking", "category": "Lifelong Engagement"},
            {"url": f"{self.base_url}/alumni-network", "name": "Alumni Network", "category": "Lifelong Engagement"},
            {"url": f"{self.base_url}/events", "name": "Events", "category": "Lifelong Engagement"},
            {"url": f"{self.base_url}/volunteer-opportunities", "name": "Volunteer Opportunities", "category": "Lifelong Engagement"},
            {"url": f"{self.base_url}/retirement-planning", "name": "Retirement Planning", "category": "Lifelong Engagement"}
        ]
        
        print("🧪 Starting Design Consistency Testing...")
        print(f"📊 Testing {len(pages_to_test)} dropdown menu pages")
        print("=" * 60)
        
        category_scores = {}
        
        for page in pages_to_test:
            print(f"🔍 Testing: {page['name']} ({page['category']})")
            
            test_result = self.test_page_accessibility(page['url'], page['name'])
            test_result['category'] = page['category']
            
            self.results['test_results'].append(test_result)
            self.results['total_tests'] += 1
            
            if test_result.get('passed', False):
                self.results['passed_tests'] += 1
                status = "✅ PASS"
            else:
                self.results['failed_tests'] += 1
                status = "❌ FAIL"
            
            design_score = test_result.get('design_score', 0)
            
            # Track category scores
            if page['category'] not in category_scores:
                category_scores[page['category']] = []
            category_scores[page['category']].append(design_score)
            
            print(f"   Status: {status}")
            print(f"   Design Score: {design_score:.1f}%")
            print(f"   Response Time: {test_result.get('response_time', 0):.2f}s")
            
            if 'error' in test_result:
                print(f"   Error: {test_result['error']}")
            
            print()
            time.sleep(0.5)  # Brief pause between tests
        
        # Calculate overall scores
        self.calculate_overall_scores(category_scores)
        self.generate_recommendations()
        
    def calculate_overall_scores(self, category_scores: Dict[str, List[float]]) -> None:
        """Calculate overall design consistency scores"""
        
        # Overall success rate
        success_rate = (self.results['passed_tests'] / self.results['total_tests']) * 100 if self.results['total_tests'] > 0 else 0
        
        # Average design score
        all_scores = []
        for test in self.results['test_results']:
            if 'design_score' in test:
                all_scores.append(test['design_score'])
        
        avg_design_score = sum(all_scores) / len(all_scores) if all_scores else 0
        
        self.results['success_rate'] = success_rate
        self.results['average_design_score'] = avg_design_score
        self.results['design_consistency_score'] = (success_rate + avg_design_score) / 2
        
        # Category breakdown
        self.results['category_breakdown'] = {}
        for category, scores in category_scores.items():
            self.results['category_breakdown'][category] = {
                'average_score': sum(scores) / len(scores) if scores else 0,
                'pages_tested': len(scores),
                'min_score': min(scores) if scores else 0,
                'max_score': max(scores) if scores else 0
            }
    
    def generate_recommendations(self) -> None:
        """Generate recommendations based on test results"""
        
        recommendations = []
        
        # Check success rate
        if self.results['success_rate'] < 80:
            recommendations.append({
                "priority": "HIGH",
                "issue": "Low page accessibility",
                "description": f"Only {self.results['success_rate']:.1f}% of pages are accessible",
                "solution": "Fix broken pages and ensure all routes are properly configured"
            })
        
        # Check design consistency
        if self.results['average_design_score'] < 70:
            recommendations.append({
                "priority": "HIGH",
                "issue": "Inconsistent design elements",
                "description": f"Average design score is {self.results['average_design_score']:.1f}%",
                "solution": "Implement unified design system across all pages"
            })
        
        # Check category performance
        for category, data in self.results.get('category_breakdown', {}).items():
            if data['average_score'] < 60:
                recommendations.append({
                    "priority": "MEDIUM",
                    "issue": f"Poor design consistency in {category}",
                    "description": f"{category} pages have average score of {data['average_score']:.1f}%",
                    "solution": f"Update {category} pages to use modern design components"
                })
        
        # Check for missing features
        failed_tests = [test for test in self.results['test_results'] if not test.get('passed', False)]
        if len(failed_tests) > 5:
            recommendations.append({
                "priority": "HIGH",
                "issue": "Multiple page failures",
                "description": f"{len(failed_tests)} pages are not accessible",
                "solution": "Implement proper routing and error handling for all pages"
            })
        
        self.results['recommendations'] = recommendations
    
    def print_summary(self) -> None:
        """Print test summary"""
        
        print("\n" + "=" * 60)
        print("📊 DESIGN CONSISTENCY TEST SUMMARY")
        print("=" * 60)
        
        print(f"🎯 Overall Results:")
        print(f"   Total Tests: {self.results['total_tests']}")
        print(f"   Passed: {self.results['passed_tests']} ({self.results['success_rate']:.1f}%)")
        print(f"   Failed: {self.results['failed_tests']}")
        print(f"   Design Consistency Score: {self.results['design_consistency_score']:.1f}%")
        
        print(f"\n📈 Category Breakdown:")
        for category, data in self.results.get('category_breakdown', {}).items():
            print(f"   {category}: {data['average_score']:.1f}% ({data['pages_tested']} pages)")
        
        print(f"\n🔧 Recommendations ({len(self.results['recommendations'])}):")
        for i, rec in enumerate(self.results['recommendations'], 1):
            print(f"   {i}. [{rec['priority']}] {rec['issue']}")
            print(f"      Solution: {rec['solution']}")
        
        # Overall assessment
        score = self.results['design_consistency_score']
        if score >= 90:
            assessment = "🌟 EXCELLENT - Design is highly consistent"
        elif score >= 80:
            assessment = "✅ GOOD - Minor inconsistencies to address"
        elif score >= 70:
            assessment = "⚠️ FAIR - Moderate design improvements needed"
        elif score >= 60:
            assessment = "❌ POOR - Significant design inconsistencies"
        else:
            assessment = "🚨 CRITICAL - Major design overhaul required"
        
        print(f"\n🎯 Overall Assessment: {assessment}")
        print("=" * 60)
    
    def save_results(self, filename: str = "design_consistency_test_results.json") -> None:
        """Save test results to JSON file"""
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"💾 Results saved to: {filename}")

def main():
    """Main function to run design consistency tests"""
    
    print("🇦🇪 Emirati Journey Platform - Design Consistency Testing")
    print("=" * 60)
    
    # Initialize tester
    tester = DesignConsistencyTester()
    
    # Run tests
    tester.test_dropdown_menu_pages()
    
    # Print summary
    tester.print_summary()
    
    # Save results
    tester.save_results()
    
    print("\n✅ Design consistency testing completed!")

if __name__ == "__main__":
    main()
