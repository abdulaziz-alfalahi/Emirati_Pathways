#!/usr/bin/env python3
"""
Test script to verify specific GROQ API key functionality
"""

def test_specific_groq_key():
    """Test the specific GROQ API key provided by user"""
    
    print("🔍 Testing Specific GROQ API Key...")
    
    # Use the specific API key provided by user
    groq_api_key = "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"
    
    print(f"✅ Testing API Key: {groq_api_key[:10]}...{groq_api_key[-10:]}")
    
    try:
        # Import GROQ client
        from groq import Groq
        print("✅ GROQ library imported successfully")
        
        # Create client with specific key
        client = Groq(api_key=groq_api_key)
        print("✅ GROQ client created successfully")
        
        # Test simple API call
        print("🚀 Testing API call...")
        response = client.chat.completions.create(
            model="llama3-8b-8192",  # Using a more reliable model
            messages=[
                {"role": "user", "content": "Hello! Please respond with 'API KEY IS WORKING' if you can see this message."}
            ],
            max_tokens=50,
            temperature=0.1
        )
        
        result = response.choices[0].message.content
        print(f"✅ GROQ API Response: {result}")
        
        if "working" in result.lower() or "api" in result.lower():
            print("🎉 GROQ API Key is VALID and working!")
            return True
        else:
            print("⚠️ GROQ API responded but with unexpected content")
            print(f"Full response: {result}")
            return True  # Still working, just unexpected response
            
    except ImportError as e:
        print(f"❌ GROQ library not installed: {e}")
        print("💡 Install with: pip install groq")
        return False
        
    except Exception as e:
        print(f"❌ GROQ API Error: {str(e)}")
        
        # Check for common error types
        if "401" in str(e) or "unauthorized" in str(e).lower():
            print("💡 API key is INVALID or EXPIRED")
            print("🔧 Solution: Get a new API key from https://console.groq.com/keys")
        elif "429" in str(e) or "rate limit" in str(e).lower():
            print("💡 Rate limiting - too many requests")
            print("🔧 Solution: Wait a few minutes and try again")
        elif "404" in str(e) or "not found" in str(e).lower():
            print("💡 Model not available")
            print("🔧 Solution: Try a different model")
        else:
            print("💡 Network or other API issue")
            
        return False

def check_env_file():
    """Check what's in the .env file"""
    
    print("\n🔍 Checking .env file...")
    
    try:
        with open('.env', 'r') as f:
            content = f.read()
            
        lines = content.strip().split('\n')
        for line in lines:
            if 'GROQ_API_KEY' in line:
                print(f"📄 Found in .env: {line}")
                
                # Extract the key from the line
                if '=' in line:
                    key_part = line.split('=', 1)[1].strip().strip('"').strip("'")
                    print(f"🔑 Extracted key: {key_part[:10]}...{key_part[-10:] if len(key_part) > 20 else key_part}")
                    
                    # Compare with expected key
                    expected_key = "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"
                    if key_part == expected_key:
                        print("✅ .env file has the CORRECT API key")
                    else:
                        print("❌ .env file has a DIFFERENT API key")
                        print("🔧 Need to update .env file with correct key")
                        
    except FileNotFoundError:
        print("❌ .env file not found")
        print("🔧 Need to create .env file with GROQ_API_KEY")
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")

def fix_env_file():
    """Create/update .env file with correct API key"""
    
    print("\n🔧 Fixing .env file...")
    
    correct_key = "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"
    
    env_content = f"""GROQ_API_KEY={correct_key}
FLASK_ENV=development
FLASK_DEBUG=true
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ .env file updated with correct GROQ_API_KEY")
        print("🔄 Please restart your Flask server for changes to take effect")
        return True
    except Exception as e:
        print(f"❌ Error updating .env file: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Specific GROQ API Key Test")
    print("=" * 50)
    
    # Test the specific API key
    key_working = test_specific_groq_key()
    
    # Check current .env file
    check_env_file()
    
    print("\n📊 Results:")
    print("=" * 50)
    
    if key_working:
        print("✅ Your GROQ API key is VALID and working!")
        print("🔧 The issue is likely that your .env file has a different/old key")
        print("💡 Solution: Update .env file and restart Flask server")
        
        # Offer to fix .env file
        print("\n🔧 Would you like me to fix your .env file? (This will overwrite it)")
        print("If yes, run: python -c \"exec(open('test_specific_groq_key.py').read()); fix_env_file()\"")
        
    else:
        print("❌ Your GROQ API key is NOT working")
        print("🔧 You need to get a new API key from https://console.groq.com/keys")
        
    print("\n🚀 Next steps:")
    print("1. Fix .env file with correct API key")
    print("2. Install PyMuPDF: pip install PyMuPDF")
    print("3. Restart Flask server")
    print("4. Test CV upload")

