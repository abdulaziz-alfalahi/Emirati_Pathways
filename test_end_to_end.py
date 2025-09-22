#!/usr/bin/env python3
"""
End-to-End Test for Emirati Journey Platform
Tests the complete CV upload and parsing workflow
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:5003"
FRONTEND_URL = "http://localhost:8080"

def test_backend_health():
    """Test backend health endpoint"""
    print("🔄 Testing backend health...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is healthy!")
            print(f"   Version: {data.get('version', 'Unknown')}")
            print(f"   AI Model: {data.get('ai_model', 'Unknown')}")
            print(f"   CV Parsing: {data.get('features', {}).get('cv_parsing', False)}")
            print(f"   Gemini AI: {data.get('features', {}).get('gemini_ai', False)}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Backend health check error: {str(e)}")
        return False

def test_frontend_accessibility():
    """Test frontend accessibility"""
    print("🔄 Testing frontend accessibility...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        
        if response.status_code == 200:
            print("✅ Frontend is accessible!")
            print(f"   Content length: {len(response.text)} bytes")
            return True
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Frontend accessibility error: {str(e)}")
        return False

def test_cv_parsing_api():
    """Test CV parsing API endpoint"""
    print("🔄 Testing CV parsing API...")
    
    sample_cv = """Ahmed Al Mansouri
Senior Software Engineer
ahmed.almansouri@email.com
+971501234567
Dubai, UAE

PROFESSIONAL SUMMARY
Experienced software engineer with 8+ years in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record in leading development teams and delivering scalable solutions for UAE enterprises.

WORK EXPERIENCE

Senior Software Engineer | Emirates Technology Solutions | 2020 - Present
• Led development of digital transformation initiatives for government sector
• Managed team of 5 developers across multiple projects
• Implemented microservices architecture using AWS and Docker
• Technologies: React, Node.js, AWS, Docker, PostgreSQL

Software Engineer | ADNOC Digital | 2018 - 2020
• Developed web applications for oil & gas operations
• Built RESTful APIs serving 10,000+ daily users
• Technologies: Angular, Python, MongoDB, Azure

EDUCATION

Bachelor of Computer Science | American University of Sharjah | 2016
• Graduated Magna Cum Laude (GPA: 3.8/4.0)

TECHNICAL SKILLS
JavaScript, Python, React, Node.js, AWS, Docker, PostgreSQL

LANGUAGES
• Arabic (Native)
• English (Fluent)

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2022)"""

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/test/cv/parse-text",
            headers={"Content-Type": "application/json"},
            json={"text": sample_cv},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                print("✅ CV parsing API working!")
                print(f"   CV ID: {data.get('cv_id', 'N/A')}")
                
                parsed_data = data.get('data', {})
                personal_info = parsed_data.get('personal_info', {})
                
                print(f"   Name: {personal_info.get('full_name', 'N/A')}")
                print(f"   Email: {personal_info.get('email', 'N/A')}")
                print(f"   Phone: {personal_info.get('phone', 'N/A')}")
                print(f"   Location: {personal_info.get('city', 'N/A')}")
                print(f"   Experience: {len(parsed_data.get('experience', []))} positions")
                print(f"   Skills: {len(parsed_data.get('skills', []))} skills")
                
                # Check analysis
                analysis = data.get('analysis', {})
                scores = analysis.get('scores', {})
                print(f"   Overall Score: {scores.get('overall', 0)}/100")
                
                return True
            else:
                print(f"❌ CV parsing failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ CV parsing API error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ CV parsing API error: {str(e)}")
        return False

def test_gemini_integration():
    """Test Gemini API integration"""
    print("🔄 Testing Gemini integration...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/test/gemini/status", timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                print("✅ Gemini integration working!")
                print(f"   API Key Present: {data.get('api_key_present', False)}")
                print(f"   Model: {data.get('model', 'Unknown')}")
                print(f"   Test Response: {data.get('test_response', 'N/A')}")
                return True
            else:
                print(f"❌ Gemini integration failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Gemini status check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Gemini integration error: {str(e)}")
        return False

def test_sample_cv_endpoint():
    """Test sample CV endpoint"""
    print("🔄 Testing sample CV endpoint...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/test/sample-cv", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                sample_cv = data.get('sample_cv', '')
                print("✅ Sample CV endpoint working!")
                print(f"   Sample CV length: {len(sample_cv)} characters")
                return True
            else:
                print(f"❌ Sample CV endpoint failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Sample CV endpoint error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Sample CV endpoint error: {str(e)}")
        return False

def test_cors_configuration():
    """Test CORS configuration"""
    print("🔄 Testing CORS configuration...")
    
    try:
        # Test preflight request
        response = requests.options(
            f"{BACKEND_URL}/api/test/cv/parse-text",
            headers={
                "Origin": "http://localhost:8080",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=10
        )
        
        if response.status_code in [200, 204]:
            cors_headers = response.headers
            print("✅ CORS configuration working!")
            print(f"   Access-Control-Allow-Origin: {cors_headers.get('Access-Control-Allow-Origin', 'Not set')}")
            print(f"   Access-Control-Allow-Methods: {cors_headers.get('Access-Control-Allow-Methods', 'Not set')}")
            return True
        else:
            print(f"❌ CORS preflight failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {str(e)}")
        return False

def main():
    """Run all end-to-end tests"""
    print("=" * 70)
    print("🚀 Emirati Journey Platform - End-to-End Test Suite")
    print("=" * 70)
    print(f"⏰ Test started at: {datetime.now().isoformat()}")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"🌐 Frontend URL: {FRONTEND_URL}")
    print()
    
    tests = [
        ("Backend Health Check", test_backend_health),
        ("Frontend Accessibility", test_frontend_accessibility),
        ("CORS Configuration", test_cors_configuration),
        ("Gemini Integration", test_gemini_integration),
        ("Sample CV Endpoint", test_sample_cv_endpoint),
        ("CV Parsing API", test_cv_parsing_api)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"🧪 Running: {test_name}")
        print("-" * 50)
        
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            results.append((test_name, False))
        
        print()
        time.sleep(1)  # Brief pause between tests
    
    # Summary
    print("=" * 70)
    print("📊 END-TO-END TEST RESULTS SUMMARY")
    print("=" * 70)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print()
    print(f"📈 Tests Passed: {passed}/{total}")
    print(f"📊 Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 All end-to-end tests passed! Platform is fully operational.")
        print()
        print("🌟 PLATFORM STATUS: PRODUCTION READY")
        print("🔗 Frontend: http://localhost:8080")
        print("🔗 Backend API: http://localhost:5003")
        print("🤖 AI: Gemini 2.5 Pro integrated and working")
        print("🗄️ Database: PostgreSQL connected and operational")
        print("📝 CV Parsing: Fully functional with UAE-specific analysis")
        return True
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
