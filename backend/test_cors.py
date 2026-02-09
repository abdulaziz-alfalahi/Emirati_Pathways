import requests

def test_cors():
    url = "http://localhost:5005/api/auth/request-otp"
    headers = {
        "Origin": "http://localhost:8089",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    }
    
    print(f"Testing CORS for {url} with Origin: http://localhost:8089")
    try:
        response = requests.options(url, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print("Headers:")
        for k, v in response.headers.items():
            print(f"{k}: {v}")
            
        allowed_origin = response.headers.get("Access-Control-Allow-Origin")
        if allowed_origin == "http://localhost:8089":
            print("\n✅ Valid CORS Header Found!")
        else:
            print(f"\n❌ Invalid or Missing CORS Header. Got: {allowed_origin}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_cors()
