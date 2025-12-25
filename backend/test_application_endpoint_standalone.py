
import os
import sys
import logging
from flask import Flask, jsonify

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock jwt_required/get_jwt_identity since we are testing endpoints directly without full auth context in standalone
# Actually, the routes use @jwt_required(). I need to mock it or provide a token.
# To make it easier, I will monkeypatch flask_jwt_extended in this script before importing routes.

import flask_jwt_extended

def mock_jwt_required(*args, **kwargs):
    def wrapper(fn):
        def decorator(*args, **kwargs):
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def mock_get_jwt_identity():
    return "test_candidate_id"

flask_jwt_extended.jwt_required = mock_jwt_required
flask_jwt_extended.get_jwt_identity = mock_get_jwt_identity

from job_application_routes import job_application_bp

def create_test_app():
    app = Flask(__name__)
    app.register_blueprint(job_application_bp)
    return app

def test_endpoint():
    app = create_test_app()
    client = app.test_client()
    
    print("Testing /api/jobs/apply...")
    payload = {
        "job_id": "test-job-123",
        "cover_letter": "This is a test application."
    }
    
    response = client.post('/api/jobs/apply', json=payload)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code in [200, 201]:
        data = response.get_json()
        print(f"Success: {data.get('success')}")
        print(f"Message: {data.get('message')}")
    else:
        print(f"Error: {response.get_data(as_text=True)}")

if __name__ == "__main__":
    test_endpoint()
