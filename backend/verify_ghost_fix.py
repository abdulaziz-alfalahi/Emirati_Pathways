import sys
import os
import io
import json
import logging
from datetime import datetime

# Add project root to path (parent of backend)
sys.path.append(os.path.dirname(os.getcwd()))
sys.path.append(os.getcwd())

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from unified_server import app, execute_query
from flask_jwt_extended import create_access_token

def verify_fix():
    print("\n🔍 STARTING VERIFICATION: Ghost Applicant Fix")
    print("=" * 60)

    with app.app_context():
        # 1. Clean up relevant data first
        print("\n1. Cleaning up existing applications for User 73 & Job 756...")
        # execute_query is now imported from unified_server
        execute_query("DELETE FROM job_applications WHERE candidate_id = '73' AND job_id IN ('756', 'JD108_20260128_8')")
        print("   ✅ Cleanup complete.")

        # 2. Simulate User 73 Applying
        print("\n2. Simulating User 73 applying to Job 756...")
        client = app.test_client()
        
        # Create token for User 73
        token = create_access_token(identity='73', additional_claims={'sub': '73', 'role': 'candidate'})
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        # Apply
        apply_payload = {
            'job_id': 756, # The correct numeric ID
            'cover_letter': 'Verification Test Application'
        }
        res = client.post('/api/jobs/apply', json=apply_payload, headers=headers)
        
        if res.status_code in [200, 201]:
            print("   ✅ Application submitted successfully.")
        else:
            print(f"   ❌ Application Failed: {res.status_code} - {res.get_json()}")
            return

        # 3. Verify Database State
        print("\n3. Verifying Database Storage...")
        apps = execute_query("SELECT id, job_id, candidate_id FROM job_applications WHERE candidate_id = '73' AND job_id::text = '756'")
        
        if apps:
            print(f"   ✅ Found Valid Application: ID={apps[0]['id']}, JobID={apps[0]['job_id']}")
        else:
            print("   ❌ Application NOT found in DB with job_id='756'!")
            # Check for ghost
            ghosts = execute_query("SELECT id, job_id FROM job_applications WHERE candidate_id = '73' AND job_id::text = 'JD108_20260128_8'")
            if ghosts:
                print(f"   ❌ Found GHOST Application instead! JobID={ghosts[0]['job_id']}")
            return

        # 4. Check Recruiter API (Correct Endpoint)
        print("\n4. Checking Recruiter API with NUMERIC ID (756) - [Expect Success]")
        # This endpoint is optional_auth or might need recruiter token. Let's try optional first or create recruiter token.
        recruiter_token = create_access_token(identity='recruiter_001', additional_claims={'sub': 'recruiter_001', 'role': 'recruiter'})
        recruiter_headers = {'Authorization': f'Bearer {recruiter_token}'}
        
        res_correct = client.get('/api/recruiter/jobs/756/applicants', headers=recruiter_headers)
        data_correct = res_correct.get_json()
        
        if res_correct.status_code == 200 and len(data_correct.get('data', [])) > 0:
             # Check if User 73 is in the list
             applicants = data_correct['data']
             found = any(str(app.get('candidate_id')) == '73' for app in applicants)
             if found:
                 print("   ✅ User 73 found in Correct API response.")
             else:
                 print("   ⚠️ User 73 NOT found in Correct API response (but response was 200 OK).")
                 print(f"   Data: {applicants}")
        else:
             print(f"   ❌ Correct API Failed or Empty: {res_correct.status_code}")
             print(data_correct)

        # 5. Check Recruiter API (Ghost Endpoint)
        print("\n5. Checking Recruiter API with STRING ID (JD108...) - [Expect Empty/No Ghost]")
        res_ghost = client.get('/api/recruiter/jobs/JD108_20260128_8/applicants', headers=recruiter_headers)
        data_ghost = res_ghost.get_json()
        
        # We expect empty list because we cleaned the ghosts and new app is on 756
        ghost_apps = data_ghost.get('data', []) if res_ghost.status_code == 200 else []
        
        if len(ghost_apps) == 0:
            print("   ✅ Ghost API returned NO applicants (Correct behavior!).")
        else:
            print(f"   ⚠️ Ghost API returned {len(ghost_apps)} applicants. This is unexpected if we cleaned the DB.")
            for ga in ghost_apps:
                print(f"      - {ga.get('candidate_name')} (ID: {ga.get('candidate_id')}) STATUS: {ga.get('status')}")

    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETED")

if __name__ == "__main__":
    verify_fix()
