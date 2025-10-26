"""
Diagnostic script to test JD upload functionality
Run this to identify issues before testing through the web interface
"""

import sys
import os

print("=" * 60)
print("JD Upload Diagnostic Test")
print("=" * 60)

# Test 1: Check Python dependencies
print("\n1. Checking Python dependencies...")
dependencies = {
    'flask': 'Flask',
    'werkzeug': 'Werkzeug',
}

optional_deps = {
    'PyPDF2': 'PyPDF2 (for PDF parsing)',
    'docx': 'python-docx (for DOCX parsing)',
    'google.generativeai': 'google-generativeai (for AI parsing)'
}

all_good = True
for module, name in dependencies.items():
    try:
        __import__(module)
        print(f"   ✓ {name}")
    except ImportError:
        print(f"   ✗ {name} - MISSING (required)")
        all_good = False

print("\n   Optional dependencies:")
for module, name in optional_deps.items():
    try:
        __import__(module)
        print(f"   ✓ {name}")
    except ImportError:
        print(f"   ⚠ {name} - Not installed (will use fallback)")

# Test 2: Check if modules can be imported
print("\n2. Checking module imports...")
try:
    from recruiter.jd_parser import get_jd_parser
    print("   ✓ jd_parser module")
except Exception as e:
    print(f"   ✗ jd_parser module - ERROR: {e}")
    all_good = False

try:
    from recruiter.jd_builder_engine import get_jd_builder_engine
    print("   ✓ jd_builder_engine module")
except Exception as e:
    print(f"   ✗ jd_builder_engine module - ERROR: {e}")
    all_good = False

try:
    from recruiter.jd_upload_routes import jd_upload_routes
    print("   ✓ jd_upload_routes module")
except Exception as e:
    print(f"   ✗ jd_upload_routes module - ERROR: {e}")
    all_good = False

# Test 3: Test parser initialization
print("\n3. Testing parser initialization...")
try:
    from recruiter.jd_parser import get_jd_parser
    parser = get_jd_parser()
    print(f"   ✓ Parser initialized")
    print(f"   Supported formats: {parser.supported_formats}")
except Exception as e:
    print(f"   ✗ Parser initialization failed - ERROR: {e}")
    all_good = False

# Test 4: Test parsing sample text
print("\n4. Testing text parsing...")
try:
    sample_text = """
Senior Software Engineer

Department: Engineering
Job Type: Full-time
Location: Dubai, UAE

Job Description:
We are seeking an experienced Senior Software Engineer.

Requirements:
- Bachelor's degree in Computer Science
- 5+ years of experience
- Python and JavaScript skills

Responsibilities:
- Design software solutions
- Mentor junior developers

Benefits:
- Competitive salary
- Health insurance

Salary: AED 15,000 - 25,000
"""
    
    from recruiter.jd_parser import get_jd_parser
    import tempfile
    
    parser = get_jd_parser()
    
    # Create temp file
    temp_dir = tempfile.mkdtemp()
    temp_file = os.path.join(temp_dir, 'test.txt')
    with open(temp_file, 'w') as f:
        f.write(sample_text)
    
    # Parse
    result = parser.parse_document(temp_file)
    
    # Cleanup
    os.remove(temp_file)
    os.rmdir(temp_dir)
    
    print(f"   ✓ Text parsing successful")
    print(f"   Extracted title: {result.get('basic_info', {}).get('title', 'N/A')}")
    print(f"   Requirements found: {len(result.get('requirements', []))}")
    print(f"   Responsibilities found: {len(result.get('responsibilities', []))}")
    
except Exception as e:
    print(f"   ✗ Text parsing failed - ERROR: {e}")
    import traceback
    traceback.print_exc()
    all_good = False

# Test 5: Test JD builder engine
print("\n5. Testing JD builder engine...")
try:
    from recruiter.jd_builder_engine import get_jd_builder_engine
    engine = get_jd_builder_engine()
    
    # Try to create a JD
    jd = engine.create_jd('test_recruiter', 'test_company')
    print(f"   ✓ JD builder engine works")
    print(f"   Created JD ID: {jd.get('metadata', {}).get('jd_id', 'N/A')}")
    
except Exception as e:
    print(f"   ✗ JD builder engine failed - ERROR: {e}")
    import traceback
    traceback.print_exc()
    all_good = False

# Test 6: Check environment variables
print("\n6. Checking environment variables...")
gemini_key = os.getenv('GEMINI_API_KEY')
if gemini_key:
    print(f"   ✓ GEMINI_API_KEY is set")
else:
    print(f"   ⚠ GEMINI_API_KEY not set (will use rule-based parsing)")

# Summary
print("\n" + "=" * 60)
if all_good:
    print("✓ ALL TESTS PASSED - Upload should work!")
    print("\nYou can now test uploading through the web interface.")
else:
    print("✗ SOME TESTS FAILED - Please fix the errors above")
    print("\nCommon fixes:")
    print("1. Install missing dependencies:")
    print("   pip install PyPDF2 python-docx google-generativeai")
    print("2. Check that all files are in the correct location")
    print("3. Restart the backend server after installing dependencies")
print("=" * 60)

