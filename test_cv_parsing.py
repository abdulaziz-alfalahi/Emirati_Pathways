#!/usr/bin/env python3
"""
Test CV Parsing Functionality
Emirati Journey Platform - End-to-End Test
"""

import os
import sys
import json
from datetime import datetime

# Add backend to path
sys.path.insert(0, '/home/ubuntu/emirati-platform/backend')

# Set environment variables
os.environ['GEMINI_API_KEY'] = 'AIzaSyAquLWzSBTEzzIAnFL6h6LUs_Ngso-2NoY'
os.environ['DATABASE_URL'] = 'postgresql://emirati_user:emirati_secure_password@localhost/emirati_journey'

def test_cv_parser():
    """Test CV Parser functionality"""
    print("🔄 Testing CV Parser...")
    
    try:
        from cv_parser import CVParser
        
        # Initialize parser
        parser = CVParser()
        print("✅ CV Parser initialized successfully")
        
        # Sample CV text
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
• Reduced system response time by 40% through optimization
• Technologies: React, Node.js, AWS, Docker, PostgreSQL

Software Engineer | ADNOC Digital | 2018 - 2020
• Developed web applications for oil & gas operations
• Collaborated with international teams on digital transformation projects
• Built RESTful APIs serving 10,000+ daily users
• Technologies: Angular, Python, MongoDB, Azure

EDUCATION

Bachelor of Computer Science | American University of Sharjah | 2016
• Graduated Magna Cum Laude (GPA: 3.8/4.0)
• Relevant Coursework: Software Engineering, Database Systems, Web Development

TECHNICAL SKILLS

Programming Languages: JavaScript, Python, Java, TypeScript, C++
Frontend: React, Angular, Vue.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express.js, Django, Flask, Spring Boot
Databases: PostgreSQL, MongoDB, MySQL, Redis
Cloud & DevOps: AWS, Azure, Docker, Kubernetes, Jenkins

LANGUAGES
• Arabic (Native)
• English (Fluent)
• Hindi (Conversational)

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2022)
• Google Cloud Professional Developer (2021)
• Scrum Master Certification (2020)"""

        print(f"📝 Testing with CV text ({len(sample_cv)} characters)")
        
        # Parse CV
        result = parser.parse_cv_text(sample_cv, user_id='test-user-123')
        
        if result['success']:
            print("✅ CV parsing successful!")
            print(f"📋 CV ID: {result['cv_id']}")
            
            # Display parsed data
            data = result['data']
            print(f"👤 Name: {data.get('personal_info', {}).get('full_name', 'N/A')}")
            print(f"📧 Email: {data.get('personal_info', {}).get('email', 'N/A')}")
            print(f"📱 Phone: {data.get('personal_info', {}).get('phone', 'N/A')}")
            print(f"📍 Location: {data.get('personal_info', {}).get('city', 'N/A')}")
            print(f"💼 Experience: {len(data.get('experience', []))} positions")
            print(f"🎓 Education: {len(data.get('education', []))} entries")
            print(f"🛠️ Skills: {len(data.get('skills', []))} skills")
            print(f"🗣️ Languages: {len(data.get('languages', []))} languages")
            
            # Display analysis
            analysis = result.get('analysis', {})
            scores = analysis.get('scores', {})
            print(f"📊 Overall Score: {scores.get('overall', 0)}/100")
            print(f"📊 Completeness: {scores.get('completeness', 0)}/100")
            print(f"📊 UAE Relevance: {scores.get('uae_relevance', 0)}/100")
            
            # UAE Analysis
            uae_analysis = data.get('uae_analysis', {})
            print(f"🇦🇪 UAE Experience: {uae_analysis.get('uae_experience_years', 0)} years")
            print(f"🇦🇪 UAE National: {uae_analysis.get('is_uae_national', False)}")
            print(f"🇦🇪 Emiratization Eligible: {uae_analysis.get('emiratization_eligible', False)}")
            
            return True
        else:
            print(f"❌ CV parsing failed: {result['message']}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing CV parser: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_gemini_connection():
    """Test Gemini API connection"""
    print("🔄 Testing Gemini API connection...")
    
    try:
        import google.generativeai as genai
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("❌ GEMINI_API_KEY not found")
            return False
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        response = model.generate_content("Say 'Hello from Gemini 2.5 Pro for Emirati Journey Platform!'")
        
        if response and response.text:
            print("✅ Gemini API connection successful!")
            print(f"🤖 Response: {response.text}")
            return True
        else:
            print("❌ No response from Gemini API")
            return False
            
    except Exception as e:
        print(f"❌ Gemini API test failed: {str(e)}")
        return False

def test_database_connection():
    """Test PostgreSQL database connection"""
    print("🔄 Testing PostgreSQL database connection...")
    
    try:
        import psycopg2
        
        conn = psycopg2.connect(
            host="localhost",
            database="emirati_journey",
            user="emirati_user",
            password="emirati_secure_password"
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        print("✅ PostgreSQL connection successful!")
        print(f"🗄️ Database version: {version[0]}")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🚀 Emirati Journey Platform - CV Parsing Test Suite")
    print("=" * 60)
    print(f"⏰ Test started at: {datetime.now().isoformat()}")
    print()
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Gemini API Connection", test_gemini_connection),
        ("CV Parser Functionality", test_cv_parser)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"🧪 Running: {test_name}")
        print("-" * 40)
        
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            results.append((test_name, False))
        
        print()
    
    # Summary
    print("=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
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
        print("🎉 All tests passed! CV parsing functionality is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
