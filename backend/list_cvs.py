
import requests
import json
import os

BASE_URL = "http://localhost:5006/api/cv"
TOKEN = os.environ.get("API_TOKEN", "")

def list_cvs():
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }
    
    try:
        print(f"Sending GET request to {BASE_URL}/list...")
        response = requests.get(f"{BASE_URL}/list", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            cvs = response.json()['data']
            print(f"Found {len(cvs)} CVs:")
            for cv in cvs:
                print(f"- {cv['title']} (ID: {cv['id']}, Updated: {cv['updated_at']})")
        else:
            print(f"List failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_cvs()
