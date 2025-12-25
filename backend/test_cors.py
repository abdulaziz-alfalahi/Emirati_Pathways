
import requests

url = "http://localhost:5003/api/hr/dashboard/metrics"
headers = {
    "Origin": "http://localhost:8089",
    "Access-Control-Request-Method": "GET"
}

try:
    print(f"Sending OPTIONS to {url}")
    response = requests.options(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Headers:")
    for k, v in response.headers.items():
        print(f"  {k}: {v}")
except Exception as e:
    print(f"Error: {e}")
