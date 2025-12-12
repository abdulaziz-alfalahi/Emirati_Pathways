
import requests
import json

BASE_URL = "http://localhost:5006/api/cv"
TOKEN = "mock_token_1"

def test_duplicate():
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }
    
    # 1. List CVs to get an ID
    print("Listing CVs...")
    response = requests.get(f"{BASE_URL}/list", headers=headers)
    if response.status_code != 200:
        print(f"List failed: {response.text}")
        return

    cvs = response.json()['data']
    if not cvs:
        print("No CVs found to duplicate.")
        return

    cv_id = cvs[0]['id']
    print(f"Duplicating CV ID: {cv_id} ({cvs[0]['title']})")
    
    # 2. Duplicate
    response = requests.post(f"{BASE_URL}/{cv_id}/duplicate", headers=headers)
    print(f"Duplicate Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        new_cv_id = response.json()['data']['cv_id']
        print(f"New CV ID: {new_cv_id}")
        
        # 3. Verify
        response = requests.get(f"{BASE_URL}/list", headers=headers)
        new_cvs = response.json()['data']
        found = False
        for cv in new_cvs:
            if cv['id'] == new_cv_id:
                print(f"Found copy: {cv['title']}")
                found = True
                break
        
        if found:
            print("Duplicate verification SUCCESS!")
        else:
            print("Duplicate verification FAILED (not found in list).")

if __name__ == "__main__":
    test_duplicate()
