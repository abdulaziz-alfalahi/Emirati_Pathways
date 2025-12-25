
import urllib.request
import urllib.error

url = "http://localhost:5003/api/hr/dashboard/metrics"
headers = {
    "Origin": "http://localhost:8089",
    "Access-Control-Request-Method": "GET"
}

req = urllib.request.Request(url, headers=headers, method="OPTIONS")

try:
    print(f"Sending OPTIONS to {url}")
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        print("Headers:")
        for k, v in response.headers.items():
            print(f"  {k}: {v}")
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code} {e.reason}")
    print("Headers:")
    for k, v in e.headers.items():
        print(f"  {k}: {v}")
except Exception as e:
    print(f"Error: {e}")
