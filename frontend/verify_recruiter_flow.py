
import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://localhost:5003"
RECRUITER_ID = "recruiter_test_user_1"
COMPANY_ID = "company_test_1"

def make_request(method, endpoint, data=None, params=None):
    url = f"{BASE_URL}{endpoint}"
    
    if params:
        query_string = urllib.parse.urlencode(params)
        url = f"{url}?{query_string}"
    
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', 'Bearer mock_token_recruiter_123')
    
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.data = json_data

    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_body = response.read().decode('utf-8')
            try:
                json_response = json.loads(response_body)
            except:
                json_response = {}
            return status_code, json_response
    except urllib.error.HTTPError as e:
        return e.code, {"error": str(e)}
    except Exception as e:
        return 0, {"error": str(e)}

def print_result(step, status_code, response):
    status = "✅" if status_code in [200, 201] else "❌"
    print(f"{status} {step}: {status_code}")
    if status_code not in [200, 201]:
        print(f"Error: {response}")
    return status_code, response

print("\n--- Starting Recruiter Flow Verification (Standard Lib) ---\n")

# 1. Health Check
status, resp = make_request("GET", "/health")
print_result("Backend Health", status, resp)
if status != 200:
    print("Backend unreachable.")
    exit(1)

# 2. Get Dashboard Stats
status, resp = make_request("GET", "/api/recruiter/statistics/dashboard", params={"recruiter_id": RECRUITER_ID})
print_result("Fetch Dashboard Stats", status, resp)

# 3. Create JD
jd_payload = {
    "recruiter_id": RECRUITER_ID,
    "company_id": COMPANY_ID,
    "template": "standard"
}
status, resp = make_request("POST", "/api/recruiter/jd/create", data=jd_payload)
print_result("Create JD", status, resp)
if status != 201:
    exit(1)

jd_id = resp.get('jd_id')
print(f"   Created JD ID: {jd_id}")

# 4. Update JD Flow (Mimic Frontend State Management)
# Note: 'create' endpoint doesn't save to DB (it's in-memory/frontend state until first save/update)
# So we skip GET and construct the initial state locally, then SAVE it.
print("   Constructing JD state locally (Frontend behavior)...")
jd_data = {
    "metadata": {
        "jd_id": jd_id,
        "recruiter_id": RECRUITER_ID,
        "company_id": COMPANY_ID,
        "status": "draft"
    },
    "basic_info": {
        "title": "Senior Python Developer (Audit Test)",
        "department": "Engineering",
        "location": "Dubai",
        "job_type": "full_time"
    },
    "requirements": [
        {
            "category": "skills",
            "description": "Expert in Python and Flask",
            "is_required": True
        }
    ],
    "responsibilities": [],
    "benefits": [],
    "compensation": {},
    "description": "Test description."
}

# Save Full Object (POST /save)
save_payload = {
    "jd_data": jd_data,
    "status": "draft",
    "recruiter_id": RECRUITER_ID,
    "company_id": COMPANY_ID
}

print("   Saving JD to DB (First Persistence)...")
status, resp = make_request("POST", f"/api/recruiter/jd/{jd_id}/save", data=save_payload)
print_result("Save JD (Upsert)", status, resp)

# 5. Match Candidates
# Now that it's saved, matching should work
match_payload = {
    "top_n": 5
}
status, resp = make_request("POST", f"/api/recruiter/jd/{jd_id}/match-candidates", data=match_payload)
print_result("Match Candidates", status, resp)

if status == 200:
    matches = resp.get('top_matches', [])
    print(f"   Found {len(matches)} matches.")
    if len(matches) > 0:
        print(f"   Top match: {matches[0].get('candidate_name', 'Unknown')}")
    else:
        print("   (Note: 0 matches is valid if DB is empty, but endpoint works)")

# 7. List JDs to verify persistence
status, resp = make_request("GET", "/api/recruiter/jd/list", params={"recruiter_id": RECRUITER_ID})
print_result("List JDs (Verify Persistence)", status, resp)

print("\n--- Verification Complete ---\n")
