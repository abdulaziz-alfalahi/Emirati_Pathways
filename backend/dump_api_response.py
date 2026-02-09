import sys
import os
import json
from datetime import datetime, date

# Add project root to path (parent of backend)
sys.path.append(os.path.dirname(os.getcwd()))
sys.path.append(os.getcwd())

from unified_server import app, execute_query
from flask_jwt_extended import create_access_token

def dump_response():
    print("\n🔍 DUMPING API RESPONSE")
    print("=" * 60)

    job_id = '756'
    
    class DateTimeEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            return super().default(obj)

    with app.app_context():
        client = app.test_client()
        # Mock Recruiter Auth
        token = create_access_token(identity='recruiter_001', additional_claims={'sub': 'recruiter_001', 'role': 'recruiter'})
        headers = {'Authorization': f'Bearer {token}'}

        print(f"   Requesting /api/recruiter/jobs/{job_id}/applicants...")
        res = client.get(f'/api/recruiter/jobs/{job_id}/applicants', headers=headers)
        
        if res.status_code != 200:
            print(f"❌ API Failed: {res.status_code}")
            print(res.get_data(as_text=True))
            return

        data = res.get_json()
        applicants = data.get('data', [])
        
        print(f"   ✅ API Status: 200")
        print(f"   ℹ️ Total Items in 'data' array: {len(applicants)}")
        print(f"   ℹ️ Pagination Total: {data.get('pagination', {}).get('total')}")
        
        # Save to file
        with open('api_dump.json', 'w') as f:
            json.dump(data, f, indent=2, cls=DateTimeEncoder)
        print("   ✅ Saved to api_dump.json")

        # Quick Analysis
        if len(applicants) > 1:
            print("\n   ⚠️ DUPLICATES FOUND IN JSON!")
            first = applicants[0]
            for i, app in enumerate(applicants[1:]):
                print(f"   COMPARING Row 0 vs Row {i+1}:")
                diffs = []
                for k in first.keys():
                    v1 = first.get(k)
                    v2 = app.get(k)
                    if v1 != v2:
                        diffs.append(f"{k}: '{v1}' vs '{v2}'")
                if diffs:
                    print(f"      Rows DIFFER at: {', '.join(diffs)}")
                else:
                    print("      Rows are IDENTICAL.")
        else:
            print("\n   ✅ JSON contains 0 or 1 item. Backend is CLEAN.")

if __name__ == "__main__":
    try:
        dump_response()
    except Exception as e:
        print(f"CRASH: {e}")
        import traceback
        traceback.print_exc()
