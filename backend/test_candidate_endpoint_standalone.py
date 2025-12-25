
import os
import sys
import logging
from flask import Flask

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock env vars if not set
if not os.getenv('DB_USER'):
    # Try to load from .env manually if needed, or assume defaults from code
    pass

from candidate_job_routes import candidate_job_bp

def create_test_app():
    app = Flask(__name__)
    app.register_blueprint(candidate_job_bp)
    return app

def test_endpoint():
    app = create_test_app()
    client = app.test_client()
    
    print("Testing /api/candidate/job-matches...")
    response = client.get('/api/candidate/job-matches')
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"Success: {data.get('success')}")
        print(f"Count: {data.get('count')}")
        jobs = data.get('jobs', [])
        if jobs:
            print(f"First Job: {jobs[0]['title']} at {jobs[0]['company']}")
        else:
            print("No jobs found (but query worked)")
    else:
        print(f"Error: {response.get_data(as_text=True)}")

if __name__ == "__main__":
    test_endpoint()
