import requests
import os

BASE_URL = "http://localhost:5005"

def test_cv_upload_validation():
    print(f"Testing CV Validation...")
    url = f"{BASE_URL}/api/cv/validate-file"
    
    # Create a dummy PDF file
    with open("test_cv.pdf", "wb") as f:
        f.write(b"%PDF-1.4\n%Dummy PDF content")
        
    files = {'cv_file': ('test_cv.pdf', open('test_cv.pdf', 'rb'), 'application/pdf')}
    
    # We need a token?
    # validation endpoint requires @jwt_required()
    # Let's get a token first involving auth
    # Or I can just check if I can get a 401 (meaning it reached the endpoint)
    # But I want to check logic.
    # To bypass auth for this test, I might need a token.
    # I'll rely on the manual test in browser if auth is hard.
    # But wait, I can simulate a login first.
    
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {"email": "admin@emiratipathways.ae", "password": "securePassword123!"} # Assuming this user exists or I use Guest
    # Actually, I'll try to just hit the endpoint without token first and see response
    
    try:
        response = requests.post(url, files=files)
        print(f"Response without token: {response.status_code}")
        # Expect 401
    except Exception as e:
        print(f"Error: {e}")
        
    # If I need token, I'd need to register/login.
    # For now, I'll rely on the server logs which I can inspect.
    # Is there a way to unit test `validate_file` directly?
    # Yes, by importing it in a python script.

if __name__ == "__main__":
    # Import validation function directly to test logic without server overhead
    import sys
    from dotenv import load_dotenv
    load_dotenv()
    
    sys.path.append(os.getcwd()) 
    try:
        from backend.routes.cv_upload_routes import validate_file
        from werkzeug.datastructures import FileStorage
        
        print("\n--- Direct Function Test ---")
        with open("test_cv.pdf", "rb") as f:
            fs = FileStorage(f, filename="test_cv.pdf", content_type="application/pdf")
            result = validate_file(fs)
            print(f"Validation Result: {result}")
            
            if result['valid']:
                print("✅ Validation PASSED")
            else:
                print(f"❌ Validation FAILED: {result.get('error')}")
                
    except ImportError as e:
        print(f"Import Error: {e}")
    except Exception as e:
        print(f"Test Error: {e}")
