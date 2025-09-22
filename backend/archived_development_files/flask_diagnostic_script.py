#!/usr/bin/env python3
"""
Flask API Diagnostic Script
Tests all components to identify the root cause of 500 errors
"""

import os
import sys
import subprocess
import json
import tempfile
from datetime import datetime

def test_environment_variables():
    """Test if required environment variables are available"""
    print("🔍 Testing Environment Variables...")
    
    groq_api_key = os.getenv('GROQ_API_KEY')
    if groq_api_key:
        print(f"✅ GROQ_API_KEY: Available ({groq_api_key[:20]}...)")
        return True
    else:
        print("❌ GROQ_API_KEY: Missing")
        return False

def test_parser_script_exists():
    """Test if the parser script exists and is accessible"""
    print("\n🔍 Testing Parser Script...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parser_script_path = os.path.join(script_dir, "groq_hybrid_parser.py")
    
    if os.path.exists(parser_script_path):
        print(f"✅ Parser script exists: {parser_script_path}")
        
        # Check if it's readable
        if os.access(parser_script_path, os.R_OK):
            print("✅ Parser script is readable")
        else:
            print("❌ Parser script is not readable")
            return False
            
        # Check if it's executable
        if os.access(parser_script_path, os.X_OK):
            print("✅ Parser script is executable")
        else:
            print("⚠️ Parser script is not executable (might be OK)")
            
        return True
    else:
        print(f"❌ Parser script not found: {parser_script_path}")
        return False

def test_parser_script_basic_execution():
    """Test basic execution of the parser script"""
    print("\n🔍 Testing Parser Script Basic Execution...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parser_script_path = os.path.join(script_dir, "groq_hybrid_parser.py")
    
    if not os.path.exists(parser_script_path):
        print("❌ Parser script not found, skipping execution test")
        return False
    
    try:
        # Test with --help flag
        cmd = [sys.executable, parser_script_path, "--help"]
        print(f"🔄 Running: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10,
            cwd=script_dir
        )
        
        if result.returncode == 0:
            print("✅ Parser script executes successfully")
            print(f"📄 Help output preview: {result.stdout[:200]}...")
            return True
        else:
            print(f"❌ Parser script execution failed with return code: {result.returncode}")
            print(f"❌ Error output: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Parser script execution timed out")
        return False
    except Exception as e:
        print(f"❌ Exception during parser script execution: {e}")
        return False

def test_dependencies():
    """Test if required Python dependencies are available"""
    print("\n🔍 Testing Python Dependencies...")
    
    required_packages = [
        'groq',
        'fitz',  # PyMuPDF
        'docx2txt',
        'flask',
        'flask_cors',
        'dotenv'
    ]
    
    all_available = True
    
    for package in required_packages:
        try:
            if package == 'fitz':
                import fitz
                print(f"✅ {package} (PyMuPDF): Available")
            elif package == 'dotenv':
                from dotenv import load_dotenv
                print(f"✅ {package} (python-dotenv): Available")
            elif package == 'flask_cors':
                from flask_cors import CORS
                print(f"✅ {package}: Available")
            else:
                __import__(package)
                print(f"✅ {package}: Available")
        except ImportError as e:
            print(f"❌ {package}: Missing - {e}")
            all_available = False
    
    return all_available

def test_temp_directories():
    """Test if temporary directories can be created"""
    print("\n🔍 Testing Temporary Directories...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    temp_files_dir = os.path.join(script_dir, "temp_files")
    parsed_resumes_dir = os.path.join(temp_files_dir, "parsed_resumes")
    
    try:
        # Create temp_files directory
        os.makedirs(temp_files_dir, exist_ok=True)
        print(f"✅ Created temp_files directory: {temp_files_dir}")
        
        # Create parsed_resumes directory
        os.makedirs(parsed_resumes_dir, exist_ok=True)
        print(f"✅ Created parsed_resumes directory: {parsed_resumes_dir}")
        
        # Test write permissions
        test_file = os.path.join(temp_files_dir, "test_write.txt")
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        print("✅ Write permissions confirmed")
        
        return True
        
    except Exception as e:
        print(f"❌ Error with temporary directories: {e}")
        return False

def test_sample_pdf_creation():
    """Create a sample PDF for testing"""
    print("\n🔍 Creating Sample Test File...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    temp_files_dir = os.path.join(script_dir, "temp_files")
    
    try:
        # Create a simple text file for testing
        test_file_path = os.path.join(temp_files_dir, "test_cv.txt")
        
        sample_cv_content = """
John Doe
Software Engineer
Email: john.doe@example.com
Phone: +1-555-123-4567
Location: New York, NY

EXPERIENCE:
Software Engineer at Tech Corp (2020-Present)
- Developed web applications
- Led team of 5 developers

EDUCATION:
Bachelor of Computer Science
University of Technology (2018)

SKILLS:
Python, JavaScript, React, Flask

LANGUAGES:
English (Native)
Spanish (Intermediate)
"""
        
        with open(test_file_path, 'w', encoding='utf-8') as f:
            f.write(sample_cv_content)
        
        print(f"✅ Created test CV file: {test_file_path}")
        return test_file_path
        
    except Exception as e:
        print(f"❌ Error creating test file: {e}")
        return None

def test_parser_with_sample_file(test_file_path):
    """Test the parser with a sample file"""
    print("\n🔍 Testing Parser with Sample File...")
    
    if not test_file_path or not os.path.exists(test_file_path):
        print("❌ No test file available")
        return False
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parser_script_path = os.path.join(script_dir, "groq_hybrid_parser.py")
    output_dir = os.path.join(script_dir, "temp_files", "parsed_resumes")
    
    try:
        cmd = [
            sys.executable, parser_script_path, "parse_resume",
            "--resume", test_file_path,
            "--output_dir", output_dir
        ]
        
        print(f"🔄 Running: {' '.join(cmd)}")
        
        # Set environment variables
        env = os.environ.copy()
        groq_api_key = os.getenv('GROQ_API_KEY')
        if groq_api_key:
            env['GROQ_API_KEY'] = groq_api_key
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,  # 60 second timeout
            cwd=script_dir,
            env=env
        )
        
        print(f"📊 Return code: {result.returncode}")
        print(f"📄 Stdout: {result.stdout}")
        if result.stderr:
            print(f"⚠️ Stderr: {result.stderr}")
        
        if result.returncode == 0:
            print("✅ Parser executed successfully")
            
            # Check if output file was created
            expected_output = os.path.join(output_dir, "test_cv.txt_parsed.json")
            if os.path.exists(expected_output):
                print(f"✅ Output file created: {expected_output}")
                
                # Try to read and validate JSON
                try:
                    with open(expected_output, 'r', encoding='utf-8') as f:
                        parsed_data = json.load(f)
                    print("✅ Output JSON is valid")
                    print(f"📊 JSON keys: {list(parsed_data.keys())}")
                    return True
                except json.JSONDecodeError as e:
                    print(f"❌ Output JSON is invalid: {e}")
                    return False
            else:
                print(f"❌ Expected output file not found: {expected_output}")
                return False
        else:
            print(f"❌ Parser execution failed")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Parser execution timed out")
        return False
    except Exception as e:
        print(f"❌ Exception during parser execution: {e}")
        return False

def main():
    """Run all diagnostic tests"""
    print("🚀 Flask API Diagnostic Script")
    print("=" * 50)
    
    test_results = []
    
    # Run all tests
    test_results.append(("Environment Variables", test_environment_variables()))
    test_results.append(("Parser Script Exists", test_parser_script_exists()))
    test_results.append(("Dependencies", test_dependencies()))
    test_results.append(("Temporary Directories", test_temp_directories()))
    test_results.append(("Parser Basic Execution", test_parser_script_basic_execution()))
    
    # Create sample file and test parser
    test_file_path = test_sample_pdf_creation()
    if test_file_path:
        test_results.append(("Parser with Sample File", test_parser_with_sample_file(test_file_path)))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n📈 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Flask API should work correctly.")
    else:
        print("⚠️ Some tests failed. Check the issues above.")
        print("💡 Fix the failing components before running Flask API.")

if __name__ == "__main__":
    main()

