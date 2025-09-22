#!/usr/bin/env python3
"""
EMERGENCY FIX for Groq Client 'proxies' Error

This error suggests there's a version compatibility issue with the Groq library.
Let's fix this step by step.
"""

print("🚨 EMERGENCY GROQ CLIENT FIX")
print("=" * 50)

# Step 1: Check Groq version
try:
    import groq
    print(f"✅ Current Groq version: {groq.__version__}")
except Exception as e:
    print(f"❌ Error importing Groq: {e}")

# Step 2: Test basic Groq import
try:
    from groq import Groq
    print("✅ Groq class imported successfully")
except Exception as e:
    print(f"❌ Error importing Groq class: {e}")

# Step 3: Check what parameters Groq.__init__ accepts
try:
    import inspect
    from groq import Groq
    
    sig = inspect.signature(Groq.__init__)
    params = list(sig.parameters.keys())
    print(f"✅ Groq.__init__ parameters: {params}")
    
    if 'proxies' in params:
        print("✅ 'proxies' parameter is supported")
    else:
        print("❌ 'proxies' parameter is NOT supported")
        
except Exception as e:
    print(f"❌ Error inspecting Groq.__init__: {e}")

# Step 4: Test simple Groq client creation
print("\n🧪 TESTING GROQ CLIENT CREATION...")
try:
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        print("❌ GROQ_API_KEY not found")
    else:
        print(f"✅ GROQ_API_KEY found: {api_key[:20]}...")
        
        # Try the simplest possible initialization
        client = Groq(api_key=api_key)
        print("✅ Groq client created successfully!")
        
except Exception as e:
    print(f"❌ Error creating Groq client: {e}")
    print(f"   Error type: {type(e).__name__}")
    
    # If it's still the proxies error, we need to update the library
    if "'proxies'" in str(e):
        print("\n🔧 SOLUTION: Update Groq library")
        print("   Run: pip install --upgrade groq")
        print("   Or: pip install groq==0.4.2")

print("\n" + "=" * 50)
print("🎯 DIAGNOSIS:")

print("\nIf you see 'proxies parameter is NOT supported' above,")
print("then your Groq library version doesn't support proxies.")
print("This means there's old code somewhere trying to use proxies.")

print("\n🔧 SOLUTIONS TO TRY:")
print("1. Update Groq library: pip install --upgrade groq")
print("2. Downgrade Groq library: pip install groq==0.4.2")
print("3. Check if there's another Groq initialization in your code")
print("4. Restart your virtual environment")

print("\n📋 NEXT STEPS:")
print("1. Try: pip install --upgrade groq")
print("2. Restart your Flask API")
print("3. Test again with: python debug_script_execution_error.py")

