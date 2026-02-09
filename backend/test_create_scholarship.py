
import requests
import json

def test_api():
    url = "http://127.0.0.1:5005/api/educator/scholarships"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer educator_token_123"
    }
    data = {
        "title": "AI Innovation Scholarship",
        "provider": "Dubai Future Foundation",
        "description": "Full scholarship for AI students",
        "amount": "Full Tuition + Stipend",
        "coverage_type": "Full",
        "deadline": "2026-09-01",
        "min_gpa": 3.5,
        "academic_level": "University",
        "eligible_majors": ["Computer Science", "Artificial Intelligence"],
        "application_link": "https://dff.ae/scholarship"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
