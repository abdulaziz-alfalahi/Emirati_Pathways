import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:5005"
SEARCH_URL = f"{BASE_URL}/api/hr/candidates/search"

def test_search():
    headers = {
        "Authorization": "Bearer mock_token_123" # Trigger mock auth logic in route
    }
    
    params = {
        "limit": 5
    }
    
    print(f"Testing Search URL: {SEARCH_URL}")
    try:
        resp = requests.get(SEARCH_URL, headers=headers, params=params)
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            print("Success!")
            print(f"Candidates Found: {len(data['data']['candidates'])}")
            if len(data['data']['candidates']) > 0:
                print(f"First Candidate: {data['data']['candidates'][0]['first_name']}")
        else:
            print("Failed.")
            print(resp.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_search()
