import os
import sys
import unittest
import json
from flask import Flask
from flask_jwt_extended import create_access_token, JWTManager

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the blueprint
from hr_job_posting_routes import hr_job_posting_bp

class TestHRJobsEndpoint(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['JWT_SECRET_KEY'] = 'test-secret'
        self.jwt = JWTManager(self.app)
        self.app.register_blueprint(hr_job_posting_bp)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_get_jobs_response_structure(self):
        # Create token for HR Manager (user_id=47)
        access_token = create_access_token(identity='47', additional_claims={'role': 'hr_manager'})
        headers = {
            'Authorization': f'Bearer {access_token}'
        }

        # Make request
        print("\nCalling /api/hr/jobs...")
        response = self.client.get('/api/hr/jobs', headers=headers)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Error Response: {response.json}")
            
        self.assertEqual(response.status_code, 200)
        data = response.json
        
        # Check for 'jobs' key (The Fix)
        print(f"Keys in response: {list(data.keys())}")
        self.assertIn('jobs', data)
        self.assertTrue(data['success'])
        
        jobs = data['jobs']
        print(f"Number of jobs returned: {len(jobs)}")
        if len(jobs) > 0:
            print(f"Sample Job 0 Title: {jobs[0].get('title')}")
            print(f"Sample Job 0 Company: {jobs[0].get('company_name')}")
            print(f"Sample Job 0 ID: {jobs[0].get('id')}")

if __name__ == '__main__':
    unittest.main()
