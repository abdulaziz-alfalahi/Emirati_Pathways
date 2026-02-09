import requests
import json

BASE_URL = "http://127.0.0.1:5005/api/communication"

def test_filtering():
    print("--- TESTING API FILTERING ---")
    
    # 1. Test with role='candidate' (Strict)
    # Expected: Should NOT return the conversation with role=None
    print("\n1. Requesting role='candidate'...")
    try:
        r = requests.get(f"{BASE_URL}/conversations", params={'user_id': 108, 'role': 'candidate'})
        print(f"Status: {r.status_code}")
        data = r.json()
        print(f"Data matches: {len(data.get('data', []))}")
        for c in data.get('data', []):
            print(f" - Conv ID: {c['id']}")
    except Exception as e:
        print(f"Failed: {e}")

    # 2. Test WITHOUT role (Unfiltered)
    # Expected: Should return the conversation (since it has role=None, and logic allows implicit return? 
    # Wait, my logic was: query = ...
    # If role is NOT provided, the query is just WHERE user_id. 
    # So it SHOULD return the NULL row.
    print("\n2. Requesting NO role...")
    try:
        r = requests.get(f"{BASE_URL}/conversations", params={'user_id': 108})
        print(f"Status: {r.status_code}")
        data = r.json()
        print(f"Data matches: {len(data.get('data', []))}")
        for c in data.get('data', []):
            print(f" - Conv ID: {c['id']}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_filtering()
