#!/usr/bin/env python3
"""
Test script for AI JD Generation
"""
import os
import sys
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from recruiter.jd_builder_engine import get_jd_builder_engine
    import google.generativeai as genai
except ImportError as e:
    print(f"[FAIL] Import error: {e}")
    sys.exit(1)

def test_ai_generation():
    print("="*60)
    print("TESTING AI JD GENERATION")
    print("="*60)
    
    # Check API Key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("[WARN] GEMINI_API_KEY not set. Test will use placeholder.")
    else:
        print("[INFO] GEMINI_API_KEY found.")

    engine = get_jd_builder_engine()
    
    # Mock JD Data
    jd_data = {
        'metadata': {'jd_id': 'test_ai_jd'},
        'basic_info': {
            'title': 'Senior Python Developer',
            'department': 'Engineering',
            'job_level': 'Senior',
            'city': 'Dubai',
            'emirate': 'Dubai'
        },
        'requirements': [
            {'description': '5+ years of Python experience'},
            {'description': 'Experience with Flask and React'}
        ],
        'responsibilities': [
            {'description': 'Lead backend development'},
            {'description': 'Mentor junior developers'}
        ]
    }
    
    print("[INFO] Generating description...")
    try:
        description = engine.generate_description_ai(jd_data, industry="Technology")
        
        print("\n[SUCCESS] Description generated:")
        print("-" * 40)
        print(description[:500] + "..." if len(description) > 500 else description)
        print("-" * 40)
        
        if "We are seeking a talented Senior Python Developer" in description and not api_key:
             print("[INFO] Verified: Placeholder content returned (expected without API key)")
        elif api_key and len(description) > 100:
             print("[INFO] Verified: AI content returned")
             
        return True
    except Exception as e:
        print(f"[FAIL] Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if test_ai_generation():
        print("\n[PASS] AI Generation Test Passed")
        sys.exit(0)
    else:
        print("\n[FAIL] AI Generation Test Failed")
        sys.exit(1)

