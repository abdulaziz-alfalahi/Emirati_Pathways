import requests
import json

def test_port(port):
    print(f"\n--- Testing Port {port} ---")
    BASE_URL = f"http://localhost:{port}/api"
    
    # 1. Login
    login_url = f"{BASE_URL}/auth/dev-login"
    payload = {"user_id": "3", "role": "recruiter", "email": "omar@test.com"}
    
    try:
        resp = requests.post(login_url, json=payload, timeout=2)
        if resp.status_code != 200:
            print(f"Login Failed: {resp.status_code} {resp.text}")
            return

        data = resp.json()
        token = data.get('data', {}).get('access_token')
        if not token:
             print("No token in response")
             return
             
        # 2. Get Conversations
        conv_url = f"{BASE_URL}/communication/conversations"
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.get(conv_url, headers=headers, timeout=2)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            convs = resp.json().get('data', {}).get('conversations', [])
            print(f"Conversations Count: {len(convs)}")
        else:
            print(f"Error: {resp.text}")
            
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_port(5003)
    test_port(5005)
