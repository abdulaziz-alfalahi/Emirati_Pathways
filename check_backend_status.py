
import requests

def check_login():
    url = "http://127.0.0.1:5005/api/auth/dev-login"
    payload = {
        'email': 'omar.alrashid@recruitment.ae',
        'role': 'hr_recruiter',
        'user_id': '3'
    }
    try:
        print(f"Checking {url}...")
        response = requests.post(url, json=payload, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
    except Exception as e:
        print(f"Error checking login: {e}")

if __name__ == "__main__":
    check_login()
