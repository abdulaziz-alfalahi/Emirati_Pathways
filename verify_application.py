import requests
import json

BASE_URL = "http://localhost:5005"
HEADERS = {"Authorization": "mock_token", "Content-Type": "application/json"}

def verify():
    # 1. Get Job Matches
    print(f"Fetching jobs from {BASE_URL}/api/candidate/job-matches...")
    try:
        resp = requests.get(f"{BASE_URL}/api/candidate/job-matches?use_ai=false", headers=HEADERS)
        if resp.status_code != 200:
            print(f"FAILED: Get jobs returned {resp.status_code}")
            return
        
        data = resp.json()
        jobs = data.get('jobs', [])
        if not jobs:
            print("FAILED: No jobs found")
            return
            
        job_id = jobs[0]['id']
        print(f"Found job ID: {job_id}")
        
        # 2. Apply to Job
        print(f"Applying to job {job_id}...")
        payload = {
            "job_id": job_id,
            "cover_letter": "Test application for verification"
        }
        resp = requests.post(f"{BASE_URL}/api/jobs/apply", headers=HEADERS, json=payload)
        
        if resp.status_code == 201:
            print(f"SUCCESS: Application submitted (201)")
        elif resp.status_code == 400 and "already applied" in resp.text.lower():
            print(f"SUCCESS: Already applied (400) - Expected if re-running")
        else:
            print(f"FAILED: Application returned {resp.status_code}: {resp.text}")
            return

        # 3. Verify status shows as applied
        print("Verifying applied status in job matches...")
        resp = requests.get(f"{BASE_URL}/api/candidate/job-matches?use_ai=false", headers=HEADERS)
        data = resp.json()
        jobs = data.get('jobs', [])
        
        target_job = next((j for j in jobs if j['id'] == job_id), None)
        if target_job and target_job.get('hasApplied'):
            print(f"SUCCESS: Job {job_id} marked as hasApplied=True")
        else:
            print(f"FAILED: Job {job_id} hasApplied={target_job.get('hasApplied') if target_job else 'Job not found'}")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    verify()
