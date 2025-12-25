
import os
import sys
import logging
from flask import Flask

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from candidate_job_routes import candidate_job_bp

def create_test_app():
    app = Flask(__name__)
    app.register_blueprint(candidate_job_bp)
    return app

def test_stats():
    app = create_test_app()
    client = app.test_client()
    
    print("Testing /api/candidate/dashboard/stats...")
    response = client.get('/api/candidate/dashboard/stats')
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        stats = data.get('data', {}).get('stats', {})
        print(f"Job Matches Count: {stats.get('jobMatches')}")
    else:
        print(f"Error: {response.get_data(as_text=True)}")

if __name__ == "__main__":
    test_stats()
