#!/usr/bin/env python3
"""
DEBUG SCRIPT: Why is the Groq parser script failing?
This will help identify the specific issue causing "Error during script execution"
"""

import os
import subprocess
import sys
from dotenv import load_dotenv

print("🔍 DEBUGGING GROQ PARSER SCRIPT EXECUTION...")
print("=" * 60)

# Load environment variables
load_dotenv()

# Check environment setup
print("📋 ENVIRONMENT CHECK:")
groq_key = os.getenv('GROQ_API_KEY')
if groq_key:
    print(f"✅ GROQ_API_KEY: {groq_key[:20]}...")
else:
    print("❌ GROQ_API_KEY: NOT FOUND")

# Check if parser script exists
parser_script = "groq_hybrid_parser.py"
if os.path.exists(parser_script):
    print(f"✅ Parser script: {parser_script} EXISTS")
else:
    print(f"❌ Parser script: {parser_script} NOT FOUND")
    print("   Available files:", [f for f in os.listdir('.') if f.endswith('.py')])

# Check temp_files directory
temp_dir = "temp_files"
if os.path.exists(temp_dir):
    print(f"✅ Temp directory: {temp_dir} EXISTS")
else:
    print(f"❌ Temp directory: {temp_dir} NOT FOUND")
    print("   Creating temp_files directory...")
    os.makedirs(temp_dir, exist_ok=True)

print("\n" + "=" * 60)
print("🧪 TESTING PARSER SCRIPT DIRECTLY...")

# Create a simple test file
test_content = """John Doe
Software Engineer
Email: john.doe@example.com
Phone: +971-50-123-4567
Location: Dubai, UAE

Experience:
- Software Developer at Tech Company (2020-2023)
- Junior Developer at StartupCorp (2018-2020)

Education:
- Bachelor of Computer Science, UAE University (2018)

Skills: Python, JavaScript, React, Flask, Machine Learning
"""

test_file = "test_cv.txt"
with open(test_file, 'w', encoding='utf-8') as f:
    f.write(test_content)

print(f"✅ Created test CV file: {test_file}")

# Test the parser script directly
output_dir = os.path.join(temp_dir, "parsed_resumes")
os.makedirs(output_dir, exist_ok=True)

print(f"✅ Output directory: {output_dir}")

# Command that Flask would run
cmd = [
    sys.executable, parser_script, "parse_resume",
    "--resume", test_file,
    "--output_dir", output_dir
]

print(f"\n🚀 RUNNING COMMAND:")
print(f"   {' '.join(cmd)}")
print(f"   Working directory: {os.getcwd()}")

try:
    # Set environment for subprocess (same as Flask does)
    env = os.environ.copy()
    if groq_key:
        env['GROQ_API_KEY'] = groq_key
    
    print(f"\n📡 EXECUTING PARSER SCRIPT...")
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        cwd=os.getcwd()
    )
    
    stdout, stderr = process.communicate(timeout=60)
    
    stdout_text = stdout.decode('utf-8', errors='ignore').strip()
    stderr_text = stderr.decode('utf-8', errors='ignore').strip()
    
    print(f"\n📊 RESULTS:")
    print(f"   Return code: {process.returncode}")
    
    if stdout_text:
        print(f"   STDOUT:\n{stdout_text}")
    else:
        print("   STDOUT: (empty)")
    
    if stderr_text:
        print(f"   STDERR:\n{stderr_text}")
    else:
        print("   STDERR: (empty)")
    
    # Check if output file was created
    expected_output = os.path.join(output_dir, f"{test_file}_parsed.json")
    if os.path.exists(expected_output):
        print(f"✅ Output file created: {expected_output}")
        
        # Try to read the output
        try:
            with open(expected_output, 'r', encoding='utf-8') as f:
                import json
                parsed_data = json.load(f)
            print(f"✅ Output file is valid JSON with {len(parsed_data)} keys")
            print(f"   Keys: {list(parsed_data.keys())}")
        except Exception as e:
            print(f"❌ Error reading output file: {e}")
    else:
        print(f"❌ Output file NOT created: {expected_output}")
    
    if process.returncode == 0:
        print("\n🎉 PARSER SCRIPT EXECUTED SUCCESSFULLY!")
        print("   The issue might be in Flask's error handling or file paths.")
    else:
        print(f"\n❌ PARSER SCRIPT FAILED (return code: {process.returncode})")
        print("   This is the root cause of your 500 error.")

except subprocess.TimeoutExpired:
    print("❌ PARSER SCRIPT TIMED OUT")
    process.kill()
except Exception as e:
    print(f"❌ ERROR RUNNING PARSER SCRIPT: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("🔍 DIAGNOSIS SUMMARY:")

if process.returncode == 0:
    print("✅ Parser script works correctly")
    print("💡 The 500 error might be caused by:")
    print("   - File path issues in Flask")
    print("   - Permission problems")
    print("   - Flask error handling issues")
    print("   - Output file reading problems")
else:
    print("❌ Parser script is failing")
    print("💡 Common causes:")
    print("   - Missing Python packages")
    print("   - GROQ_API_KEY issues")
    print("   - Script syntax errors")
    print("   - File permission problems")

print("\n🔧 NEXT STEPS:")
print("1. Check the STDERR output above for specific error messages")
print("2. Install any missing packages shown in errors")
print("3. Verify GROQ_API_KEY is working")
print("4. Check Flask console logs for additional details")

# Cleanup
try:
    os.remove(test_file)
    print(f"\n🧹 Cleaned up test file: {test_file}")
except:
    pass

