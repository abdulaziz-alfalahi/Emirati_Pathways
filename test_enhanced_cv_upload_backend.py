#!/usr/bin/env python3
"""
Backend Testing Suite for Enhanced CV Upload Functionality
Emirati Journey Platform - Comprehensive testing of CV workflow
"""

import os
import unittest
import json
import tempfile
from unittest.mock import patch, MagicMock

# Add backend to path
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

# Import Flask app and blueprints
from backend.app import create_app
from backend.routes.enhanced_cv_routes import enhanced_cv_bp

class TestEnhancedCVUpload(unittest.TestCase):
    """Test suite for enhanced CV upload functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.register_blueprint(enhanced_cv_bp)
        self.client = self.app.test_client()
        
        # Create temporary database for testing
        self.db_fd, self.db_path = tempfile.mkstemp()
        self.app.config["CV_DB_PATH"] = self.db_path
        
        # Mock external dependencies
        self.mock_cv_parser = patch("backend.routes.enhanced_cv_routes.cv_parser").start()
        self.mock_cv_storage = patch("backend.routes.enhanced_cv_routes.cv_storage_manager").start()
        self.mock_cv_job_matching = patch("backend.routes.enhanced_cv_routes.cv_job_matching_integration").start()
        
        # Mock user authentication
        self.mock_get_user_id = patch("backend.routes.enhanced_cv_routes.get_user_id_from_token").start()
        self.mock_get_user_id.return_value = "test_user_123"
        
        # Configure mocks
        self.configure_mocks()
    
    def tearDown(self):
        """Tear down test environment"""
        os.close(self.db_fd)
        os.unlink(self.db_path)
        patch.stopall()
    
    def configure_mocks(self):
        """Configure mock objects for tests"""
        # Mock CV parser
        self.mock_cv_parser.parse_cv.return_value = {
            "success": True,
            "data": {"personal_info": {"full_name": "Test User"}},
            "analysis": {"cv_score": 85},
            "processing_time": 1.5
        }
        self.mock_cv_parser.parse_cv_text.return_value = {
            "success": True,
            "data": {"personal_info": {"full_name": "Test User from Text"}},
            "analysis": {"cv_score": 80},
            "processing_time": 1.2
        }
        
        # Mock CV storage
        self.mock_cv_storage.store_cv.return_value = {
            "success": True,
            "cv_id": "cv_test_id_123"
        }
        self.mock_cv_storage.get_cv.return_value = {
            "success": True,
            "cv_id": "cv_test_id_123",
            "data": {"personal_info": {"full_name": "Test User"}}
        }
        self.mock_cv_storage.get_user_cvs.return_value = {
            "success": True,
            "cvs": [{"cv_id": "cv_test_id_123", "filename": "test.pdf"}]
        }
        self.mock_cv_storage.delete_cv.return_value = {"success": True}
        
        # Mock job matching
        self.mock_cv_job_matching.process_cv_for_job_matching.return_value = {
            "success": True,
            "matching_criteria": {"keywords": ["python", "react"]}
        }
        self.mock_cv_job_matching.find_job_matches.return_value = {
            "success": True,
            "matches": [{"job_id": "job_1", "title": "Python Developer"}]
        }
        self.mock_cv_job_matching.complete_profile_from_cv.return_value = {
            "success": True,
            "completion_percentage": 90
        }
        self.mock_cv_job_matching.generate_job_application_insights.return_value = {
            "success": True,
            "insights": {"match_percentage": 88}
        }
    
    def test_01_upload_cv_success(self):
        """Test successful CV upload"""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(b"Test CV content")
            tmp_path = tmp.name
        
        with open(tmp_path, "rb") as f:
            response = self.client.post(
                "/api/cv/upload",
                data={"cv_file": (f, "test.pdf")},
                content_type="multipart/form-data",
                headers={"Authorization": "Bearer test_token"}
            )
        
        os.remove(tmp_path)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["cv_id"], "cv_test_id_123")
        self.assertIn("job_matches", data)
        self.assertIn("profile_completion", data)
        self.mock_cv_parser.parse_cv.assert_called_once()
        self.mock_cv_storage.store_cv.assert_called_once()
        self.mock_cv_job_matching.process_cv_for_job_matching.assert_called_once()
        self.mock_cv_job_matching.find_job_matches.assert_called_once()
        self.mock_cv_job_matching.complete_profile_from_cv.assert_called_once()
    
    def test_02_upload_cv_no_file(self):
        """Test CV upload with no file"""
        response = self.client.post("/api/cv/upload", headers={"Authorization": "Bearer test_token"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "No file provided")
    
    def test_03_upload_cv_invalid_type(self):
        """Test CV upload with invalid file type"""
        with tempfile.NamedTemporaryFile(suffix=".exe", delete=False) as tmp:
            tmp.write(b"malicious content")
            tmp_path = tmp.name
        
        with open(tmp_path, "rb") as f:
            response = self.client.post(
                "/api/cv/upload",
                data={"cv_file": (f, "test.exe")},
                headers={"Authorization": "Bearer test_token"}
            )
        
        os.remove(tmp_path)
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data["success"])
        self.assertIn("File type not allowed", data["message"])
    
    def test_04_upload_cv_too_large(self):
        """Test CV upload with file too large"""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            # Create a file larger than MAX_FILE_SIZE
            tmp.seek(11 * 1024 * 1024)
            tmp.write(b"\0")
            tmp_path = tmp.name
        
        with open(tmp_path, "rb") as f:
            response = self.client.post(
                "/api/cv/upload",
                data={"cv_file": (f, "large.pdf")},
                headers={"Authorization": "Bearer test_token"}
            )
        
        os.remove(tmp_path)
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data["success"])
        self.assertIn("File too large", data["message"])
    
    def test_05_parse_cv_text_success(self):
        """Test successful CV text parsing"""
        response = self.client.post(
            "/api/cv/parse-text",
            json={"cv_text": "This is a test CV content with enough length to pass validation."},
            headers={"Authorization": "Bearer test_token"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["cv_id"], "cv_test_id_123")
        self.assertIn("job_matches", data)
        self.assertIn("profile_completion", data)
        self.mock_cv_parser.parse_cv_text.assert_called_once()
    
    def test_06_parse_cv_text_too_short(self):
        """Test CV text parsing with text too short"""
        response = self.client.post(
            "/api/cv/parse-text",
            json={"cv_text": "short"},
            headers={"Authorization": "Bearer test_token"}
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "CV text too short (minimum 50 characters)")
    
    def test_07_list_user_cvs(self):
        """Test listing user CVs"""
        response = self.client.get("/api/cv/list", headers={"Authorization": "Bearer test_token"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertIsInstance(data["cvs"], list)
        self.assertEqual(len(data["cvs"]), 1)
        self.mock_cv_storage.get_user_cvs.assert_called_once_with("test_user_123", 20, 0)
    
    def test_08_get_cv_by_id(self):
        """Test getting a specific CV by ID"""
        response = self.client.get("/api/cv/cv_test_id_123", headers={"Authorization": "Bearer test_token"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["cv_id"], "cv_test_id_123")
        self.mock_cv_storage.get_cv.assert_called_once_with("cv_test_id_123", "test_user_123")
    
    def test_09_delete_cv(self):
        """Test deleting a CV"""
        response = self.client.delete("/api/cv/cv_test_id_123", headers={"Authorization": "Bearer test_token"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.mock_cv_storage.delete_cv.assert_called_once_with("cv_test_id_123", "test_user_123")
    
    def test_10_get_job_matches_for_cv(self):
        """Test getting job matches for a specific CV"""
        response = self.client.get("/api/cv/cv_test_id_123/job-matches", headers={"Authorization": "Bearer test_token"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertIsInstance(data["matches"], list)
        self.assertEqual(len(data["matches"]), 1)
        self.assertEqual(data["matches"][0]["title"], "Python Developer")
    
    def test_11_get_job_application_insights(self):
        """Test getting job application insights"""
        response = self.client.post(
            "/api/cv/cv_test_id_123/job-application-insights",
            json={"job_description": "We are looking for a Python developer."},
            headers={"Authorization": "Bearer test_token"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertIn("insights", data)
        self.assertEqual(data["insights"]["match_percentage"], 88)
    
    def test_12_health_check(self):
        """Test health check endpoint"""
        response = self.client.get("/api/cv/health")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["status"], "healthy")

if __name__ == "__main__":
    unittest.main()
