import requests
import json

BASE_URL = "http://localhost:5006"

def test_feedback_submit():
    print(f"Testing Feedback Submission...")
    url = f"{BASE_URL}/api/feedback/submit"
    payload = {
        "userId": "admin-test",
        "role": "admin",
        "type": "feature",
        "message": "Verification test message from agent script",
        "consoleLogs": []
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code in [200, 201]:
            print("✅ Feedback Submit Success")
        else:
            print("❌ Feedback Submit Failed")
    except Exception as e:
        print(f"❌ Feedback Submit Error: {e}")

def test_notification_health():
    print(f"\nTesting Notification Health...")
    # Should be at /api/communication/notifications/health
    url = f"{BASE_URL}/api/communication/notifications/health"
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print("✅ Notification Route Fix Success")
        else:
            print("❌ Notification Route Fix Failed (Check path)")
    except Exception as e:
        print(f"❌ Notification Health Error: {e}")

if __name__ == "__main__":
    test_feedback_submit()
    test_notification_health()
