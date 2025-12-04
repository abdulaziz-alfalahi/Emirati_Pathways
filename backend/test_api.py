import requests
import json

url = "http://localhost:5006/api/recruiter/jd/list"
headers = {
    "Authorization": "Bearer mock_token_1"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
