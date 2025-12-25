
import requests
import time

BASE_URL = "http://localhost:5003/api"

def test_verification_flow():
    # 1. Prepare CSV
    csv_content = """CompanyName,Account Email,JobsTitle,Job ID
Test Corp,test@testcorp.com,Senior Developer,NAFIS-101
Growth Inc,hr@growth.com,Marketing Manager,NAFIS-102"""
    
    # 2. Upload CSV (Simulate Admin Upload)
    print("Uploading CSV...")
    files = {'file': ('nafis.csv', csv_content)}
    try:
        resp = requests.post(f"{BASE_URL}/growth/import", files=files)
        print(f"Upload Result: {resp.status_code}")
        with open('verification_result.txt', 'w') as f:
            f.write(resp.text)
    except Exception as e:
        print(f"Upload Failed: {e}")
        return

    # 3. We can't easily get the token from the response because the response just says "Sent emails".
    # In a real test we'd inspect the DB. 
    # For this script to work fully, I'd need DB access or logs inspection.
    # BUT, the server logs should have printed the LINK. I will ask the user to check logs.

if __name__ == "__main__":
    test_verification_flow()
