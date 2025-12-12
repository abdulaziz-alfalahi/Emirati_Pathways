import requests
import sys

def test_backend():
    print("Testing backend connection on http://127.0.0.1:5003...")
    try:
        # Test Health Endpoint
        print("1. Pinging /health...")
        response = requests.get('http://127.0.0.1:5003/health', timeout=5)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
        
        # Test CV Upload Endpoint (just checking if it exists/responds)
        print("\n2. Pinging /api/cv/upload (OPTIONS)...")
        response = requests.options('http://127.0.0.1:5003/api/cv/upload', timeout=5)
        print(f"   Status Code: {response.status_code}")
        
        print("\n✅ Backend connection SUCCESSFUL!")
        return True
    except requests.exceptions.ConnectionError:
        print("\n❌ CONNECTION REFUSED")
        print("   The backend is NOT accessible at http://127.0.0.1:5003")
        print("   Possible causes:")
        print("   1. The server is not running.")
        print("   2. It is running on a different port (check startup logs).")
        print("   3. It is binding to localhost but we are using 127.0.0.1 (or vice versa).")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    test_backend()
