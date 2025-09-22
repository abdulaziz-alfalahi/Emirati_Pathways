#!/usr/bin/env python3
"""
DEBUG SCRIPT: Why isn't Flask starting?

Run this script to identify what's preventing your Flask app from starting.
"""

print("🔍 DEBUGGING FLASK STARTUP ISSUE...")
print("=" * 50)

# Test 1: Check Python version
import sys
print(f"✅ Python version: {sys.version}")

# Test 2: Check if Flask can be imported
try:
    from flask import Flask
    print("✅ Flask import: SUCCESS")
except ImportError as e:
    print(f"❌ Flask import: FAILED - {e}")
    print("   Fix: pip install flask")

# Test 3: Check if flask-cors can be imported
try:
    from flask_cors import CORS
    print("✅ Flask-CORS import: SUCCESS")
except ImportError as e:
    print(f"❌ Flask-CORS import: FAILED - {e}")
    print("   Fix: pip install flask-cors")

# Test 4: Check if python-dotenv can be imported
try:
    from dotenv import load_dotenv
    print("✅ python-dotenv import: SUCCESS")
except ImportError as e:
    print(f"❌ python-dotenv import: FAILED - {e}")
    print("   Fix: pip install python-dotenv")

# Test 5: Check if .env file exists
import os
env_file = ".env"
if os.path.exists(env_file):
    print("✅ .env file: EXISTS")
    try:
        load_dotenv()
        groq_key = os.getenv('GROQ_API_KEY')
        if groq_key:
            print(f"✅ GROQ_API_KEY: LOADED ({groq_key[:20]}...)")
        else:
            print("❌ GROQ_API_KEY: NOT FOUND in .env")
    except Exception as e:
        print(f"❌ .env loading: FAILED - {e}")
else:
    print("❌ .env file: NOT FOUND")
    print("   Create .env file with GROQ_API_KEY=your_key_here")

# Test 6: Check if groq_hybrid_parser.py exists
parser_script = "groq_hybrid_parser.py"
if os.path.exists(parser_script):
    print("✅ groq_hybrid_parser.py: EXISTS")
else:
    print("❌ groq_hybrid_parser.py: NOT FOUND")

# Test 7: Test basic Flask app creation
try:
    print("\n🧪 TESTING BASIC FLASK APP CREATION...")
    app = Flask(__name__)
    
    @app.route('/test')
    def test():
        return "Flask is working!"
    
    print("✅ Basic Flask app: CREATED SUCCESSFULLY")
    print("✅ Route defined: SUCCESS")
    
except Exception as e:
    print(f"❌ Basic Flask app: FAILED - {e}")

print("\n" + "=" * 50)
print("🔍 DIAGNOSIS COMPLETE")
print("\nIf all tests pass, your Flask app should start.")
print("If any tests fail, fix those issues first.")

print("\n🚀 MINIMAL WORKING FLASK APP TEST:")
print("Copy this code to a new file (test_app.py) and run it:")
print("""
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Flask is working!'

if __name__ == '__main__':
    print("Starting minimal Flask app...")
    app.run(debug=True, host='0.0.0.0', port=5001)
""")

