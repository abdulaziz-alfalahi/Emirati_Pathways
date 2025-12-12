
import requests
import json
import time

BASE_URL = "http://localhost:5006/api/cv"
TOKEN = "mock_token_1"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def log(msg, success=True):
    icon = "✅" if success else "❌"
    print(f"{icon} {msg}")

def test_all():
    print("🚀 Starting Comprehensive CV Routes Test...")
    
    # 1. SAVE
    print("\n1️⃣ Testing SAVE...")
    cv_data = {
        "title": "Comprehensive Test CV",
        "templateId": "professional",
        "cvData": {
            "personalInfo": {"firstName": "Test", "lastName": "User"},
            "professionalSummary": "Summary",
            "technicalSkills": ["Python", "Flask"],
            "softSkills": ["Communication"],
            "experience": [],
            "education": []
        },
        "cvScore": 85,
        "atsScore": 90
    }
    res = requests.post(f"{BASE_URL}/save", json=cv_data, headers=HEADERS)
    if res.status_code == 201:
        cv_id = res.json()['data']['cv_id']
        log(f"SAVE successful. ID: {cv_id}")
    else:
        log(f"SAVE failed: {res.text}", False)
        return

    # 2. LIST
    print("\n2️⃣ Testing LIST...")
    res = requests.get(f"{BASE_URL}/list", headers=HEADERS)
    if res.status_code == 200:
        cvs = res.json()['data']
        found = any(cv['id'] == cv_id for cv in cvs)
        if found:
            log(f"LIST successful. Found CV {cv_id}")
        else:
            log(f"LIST failed. CV {cv_id} not found", False)
    else:
        log(f"LIST failed: {res.text}", False)

    # 3. GET
    print("\n3️⃣ Testing GET...")
    res = requests.get(f"{BASE_URL}/{cv_id}", headers=HEADERS)
    if res.status_code == 200:
        data = res.json()['data']
        if data['personalInfo']['firstName'] == "Test":
            log("GET successful. Data matches.")
        else:
            log("GET failed. Data mismatch.", False)
    else:
        log(f"GET failed: {res.text}", False)

    # 4. UPDATE
    print("\n4️⃣ Testing UPDATE...")
    update_data = {
        "title": "Updated Test CV",
        "cvData": {
            "personalInfo": {"firstName": "Updated", "lastName": "User"}
        }
    }
    res = requests.put(f"{BASE_URL}/{cv_id}", json=update_data, headers=HEADERS)
    if res.status_code == 200:
        log("UPDATE successful.")
        # Verify update
        res = requests.get(f"{BASE_URL}/{cv_id}", headers=HEADERS)
        if res.json()['data']['personalInfo']['firstName'] == "Updated":
            log("UPDATE verification successful.")
        else:
            log("UPDATE verification failed.", False)
    else:
        log(f"UPDATE failed: {res.text}", False)

    # 5. DUPLICATE
    print("\n5️⃣ Testing DUPLICATE...")
    res = requests.post(f"{BASE_URL}/{cv_id}/duplicate", headers=HEADERS)
    if res.status_code == 200:
        dup_id = res.json()['data']['cv_id']
        log(f"DUPLICATE successful. New ID: {dup_id}")
        # Verify copy title
        res = requests.get(f"{BASE_URL}/{dup_id}", headers=HEADERS)
        title = res.json()['metadata']['title']
        if "(Copy)" in title:
            log(f"DUPLICATE verification successful. Title: {title}")
        else:
            log(f"DUPLICATE verification failed. Title: {title}", False)
            
        # Cleanup duplicate
        requests.delete(f"{BASE_URL}/{dup_id}", headers=HEADERS)
    else:
        log(f"DUPLICATE failed: {res.text}", False)

    # 6. SET VISIBLE
    print("\n6️⃣ Testing SET VISIBLE...")
    res = requests.put(f"{BASE_URL}/{cv_id}/visible", headers=HEADERS)
    if res.status_code == 200:
        log("SET VISIBLE successful.")
        # Verify
        res = requests.get(f"{BASE_URL}/list", headers=HEADERS)
        cv = next((c for c in res.json()['data'] if c['id'] == cv_id), None)
        if cv and cv['is_visible']:
            log("SET VISIBLE verification successful.")
        else:
            log("SET VISIBLE verification failed.", False)
    else:
        log(f"SET VISIBLE failed: {res.text}", False)

    # 7. DELETE
    print("\n7️⃣ Testing DELETE...")
    res = requests.delete(f"{BASE_URL}/{cv_id}", headers=HEADERS)
    if res.status_code == 200:
        log("DELETE successful.")
        # Verify
        res = requests.get(f"{BASE_URL}/{cv_id}", headers=HEADERS)
        if res.status_code == 404:
            log("DELETE verification successful (404 returned).")
        else:
            log("DELETE verification failed (CV still exists).", False)
    else:
        log(f"DELETE failed: {res.text}", False)

    print("\n🏁 Test Suite Completed.")

if __name__ == "__main__":
    test_all()
