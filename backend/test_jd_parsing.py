#!/usr/bin/env python3
"""
Test script for JD parsing API
"""

import json
import requests
import time

def test_jd_parsing():
    """Test JD parsing API endpoints."""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing JD Parsing API")
    print("=" * 50)
    
    # Test 1: Health check
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"📋 Features: {data['features']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
        return False
    
    # Test 2: JD text parsing
    print("\n🔍 Testing JD text parsing...")
    jd_text = """
    Software Engineer - Full Stack Developer
    
    Company: TechCorp UAE
    Location: Dubai, United Arab Emirates
    Employment Type: Full-time
    
    Job Description:
    We are seeking a talented Full Stack Developer to join our growing team in Dubai. 
    You will be responsible for developing and maintaining web applications using modern technologies.
    
    Requirements:
    - Bachelor's degree in Computer Science or related field
    - 3+ years of experience in software development
    - Proficiency in JavaScript, React, Node.js
    - Experience with databases (SQL, MongoDB)
    - Strong problem-solving skills
    - Excellent communication skills in English and Arabic
    
    Responsibilities:
    - Develop and maintain web applications
    - Collaborate with cross-functional teams
    - Write clean, maintainable code
    - Participate in code reviews
    - Troubleshoot and debug applications
    - Stay up-to-date with latest technologies
    
    Benefits:
    - Competitive salary package
    - Health insurance
    - Annual leave and sick leave
    - Professional development opportunities
    - Flexible working hours
    """
    
    try:
        response = requests.post(
            f"{base_url}/api/jd/parse-text",
            json={"text": jd_text},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ JD text parsing successful!")
            print(f"📊 Confidence: {data.get('completeness_score', 0):.1f}%")
            print(f"🌐 Language: {data['data']['parsing_metadata']['language_detected']}")
            print(f"⏱️ Processing time: {data['processing_time']:.2f}s")
            
            # Display extracted data summary
            jd_data = data['data']
            print(f"\n📋 Extracted JD Summary:")
            print(f"  Title: {jd_data.get('title', 'N/A')}")
            print(f"  Company: {jd_data.get('company', 'N/A')}")
            print(f"  Location: {jd_data.get('location', 'N/A')}")
            print(f"  Type: {jd_data.get('employment_type', 'N/A')}")
            print(f"  Skills: {len(jd_data.get('requirements', {}).get('skills', []))} skills")
            print(f"  Responsibilities: {len(jd_data.get('responsibilities', []))} items")
            
            return True
        else:
            print(f"❌ JD text parsing failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ JD text parsing failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_jd_parsing()
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n❌ Some tests failed!")

