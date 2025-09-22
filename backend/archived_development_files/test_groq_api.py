#!/usr/bin/env python3
"""
Test script to verify GROQ API functionality
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_groq_api():
    """Test GROQ API connection and functionality"""
    
    print("🔍 Testing GROQ API...")
    
    # Check if API key exists
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        print("❌ GROQ_API_KEY not found in environment variables")
        return False
    
    print(f"✅ GROQ_API_KEY found: {groq_api_key[:10]}...")
    
    try:
        # Import GROQ client
        from groq import Groq
        print("✅ GROQ library imported successfully")
        
        # Create client
        client = Groq(api_key=groq_api_key)
        print("✅ GROQ client created successfully")
        
        # Test simple API call
        print("🚀 Testing API call...")
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "user", "content": "Hello! Please respond with 'GROQ API is working correctly' if you can see this message."}
            ],
            max_tokens=50,
            temperature=0.1
        )
        
        result = response.choices[0].message.content
        print(f"✅ GROQ API Response: {result}")
        
        if "working" in result.lower():
            print("🎉 GROQ API is functioning correctly!")
            return True
        else:
            print("⚠️ GROQ API responded but with unexpected content")
            return False
            
    except ImportError as e:
        print(f"❌ GROQ library not installed: {e}")
        print("💡 Install with: pip install groq")
        return False
        
    except Exception as e:
        print(f"❌ GROQ API Error: {str(e)}")
        
        # Check for common error types
        if "401" in str(e) or "unauthorized" in str(e).lower():
            print("💡 This looks like an API key issue - key might be invalid or expired")
        elif "429" in str(e) or "rate limit" in str(e).lower():
            print("💡 This looks like a rate limiting issue - too many requests")
        elif "404" in str(e) or "not found" in str(e).lower():
            print("💡 This looks like a model availability issue - model might not exist")
        else:
            print("💡 This might be a network connectivity or other API issue")
            
        return False

def test_pdf_extraction():
    """Test PDF text extraction capabilities"""
    
    print("\n🔍 Testing PDF extraction libraries...")
    
    try:
        import PyMuPDF
        print("✅ PyMuPDF (fitz) library available")
        return True
    except ImportError:
        print("❌ PyMuPDF library not available")
        return False

if __name__ == "__main__":
    print("🧪 GROQ API and PDF Extraction Test")
    print("=" * 50)
    
    # Test GROQ API
    groq_working = test_groq_api()
    
    # Test PDF extraction
    pdf_working = test_pdf_extraction()
    
    print("\n📊 Test Results:")
    print("=" * 50)
    print(f"GROQ API: {'✅ Working' if groq_working else '❌ Failed'}")
    print(f"PDF Extraction: {'✅ Working' if pdf_working else '❌ Failed'}")
    
    if groq_working and pdf_working:
        print("\n🎉 All systems operational! The issue might be in the parser logic.")
    elif not groq_working:
        print("\n🔧 GROQ API issue identified - this is likely the root cause of empty data extraction.")
    elif not pdf_working:
        print("\n🔧 PDF extraction issue identified - parser can't read PDF content.")
    else:
        print("\n🔧 Multiple issues identified - need to fix both GROQ API and PDF extraction.")

