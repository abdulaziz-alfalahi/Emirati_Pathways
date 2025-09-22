import unittest
import json
from unittest.mock import patch, MagicMock

# Mock the database connection before importing the app
from ..backend import db
db.init_app = MagicMock()
db.create_all = MagicMock()

from ..backend.app import create_app
from ..backend.administrator_system import AdministratorSystem
from ..backend.content_management_system import ContentManagementSystem
from ..backend.auth.auth_manager import AuthManager

class AdministratorCMSBackendTestCase(unittest.TestCase):
    """Test case for the Administrator and CMS backend functionality."""

    def setUp(self):
        """Set up a test client and initialize the database."""
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

        # Mock dependencies
        self.auth_manager_patch = patch("../backend.routes.administrator_routes.auth_manager", spec=AuthManager)
        self.admin_system_patch = patch("../backend.routes.administrator_routes.admin_system", spec=AdministratorSystem)
        self.cms_system_patch = patch("../backend.routes.cms_routes.cms_system", spec=ContentManagementSystem)

        self.mock_auth_manager = self.auth_manager_patch.start()
        self.mock_admin_system = self.admin_system_patch.start()
        self.mock_cms_system = self.cms_system_patch.start()

        self.mock_auth_manager.verify_token.return_value = {
            "user_id": 1,
            "username": "admin",
            "roles": ["super_admin"]
        }

    def tearDown(self):
        """Clean up after each test."""
        self.auth_manager_patch.stop()
        self.admin_system_patch.stop()
        self.cms_system_patch.stop()

    def _get_headers(self, roles=["super_admin"]):
        """Helper to create authorization headers."""
        # In a real scenario, you would generate a token for a user with these roles
        return {
            "Authorization": "Bearer test_token"
        }

    # Administrator Routes Tests
    def test_admin_health_check(self):
        """Test the admin health check endpoint."""
        response = self.client.get("/api/admin/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["service"], "Administrator System")

    def test_get_dashboard_stats(self):
        """Test retrieving dashboard statistics."""
        self.mock_admin_system.get_dashboard_stats.return_value = {"total_users": 100}
        response = self.client.get("/api/admin/dashboard/stats", headers=self._get_headers())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["data"]["total_users"], 100)

    def test_list_users(self):
        """Test listing users with pagination and filters."""
        self.mock_admin_system.list_users.return_value = {"users": [], "total": 0}
        response = self.client.get("/api/admin/users?page=1&per_page=10", headers=self._get_headers())
        self.assertEqual(response.status_code, 200)
        self.assertIn("users", response.json["data"])

    def test_create_user(self):
        """Test creating a new user."""
        new_user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "password123",
            "roles": ["job_seeker"]
        }
        self.mock_admin_system.create_user.return_value = {"id": 1, **new_user_data}
        response = self.client.post("/api/admin/users", json=new_user_data, headers=self._get_headers())
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json["data"]["username"], "testuser")

    def test_update_user_roles(self):
        """Test updating a user's roles."""
        self.mock_admin_system.update_user_roles.return_value = True
        response = self.client.put("/api/admin/users/1/roles", json={"roles": ["mentor"]}, headers=self._get_headers())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["message"], "User roles updated successfully")

    # CMS Routes Tests
    def test_cms_health_check(self):
        """Test the CMS health check endpoint."""
        response = self.client.get("/api/cms/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["service"], "Content Management System")

    def test_list_content(self):
        """Test listing content items."""
        self.mock_cms_system.list_content.return_value = {"content": [], "total": 0}
        response = self.client.get("/api/cms/content", headers=self._get_headers())
        self.assertEqual(response.status_code, 200)
        self.assertIn("content", response.json["data"])

    def test_create_content(self):
        """Test creating a new content item."""
        new_content_data = {
            "title": "New Article",
            "content_type": "article",
            "content_data": {"body": "This is a test article."},
            "language": "en"
        }
        # Mock the return value to have an `id` attribute
        mock_content_item = MagicMock()
        mock_content_item.id = 1
        mock_content_item.uuid = "some-uuid"
        mock_content_item.title = "New Article"
        mock_content_item.slug = "new-article"
        mock_content_item.content_type = "article"
        mock_content_item.status = "draft"
        mock_content_item.language = "en"
        mock_content_item.created_at.isoformat.return_value = "2024-01-01T00:00:00"
        mock_content_item.updated_at.isoformat.return_value = "2024-01-01T00:00:00"

        self.mock_cms_system.create_content.return_value = mock_content_item
        response = self.client.post("/api/cms/content", json=new_content_data, headers=self._get_headers())
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json["data"]["title"], "New Article")

    def test_update_content(self):
        """Test updating a content item."""
        update_data = {"title": "Updated Title"}
        mock_content_item = MagicMock()
        mock_content_item.id = 1
        mock_content_item.uuid = "some-uuid"
        mock_content_item.title = "Updated Title"
        mock_content_item.slug = "updated-title"
        mock_content_item.content_type = "article"
        mock_content_item.status = "draft"
        mock_content_item.language = "en"
        mock_content_item.updated_at.isoformat.return_value = "2024-01-01T00:00:00"

        self.mock_cms_system.update_content.return_value = mock_content_item
        response = self.client.put("/api/cms/content/1", json=update_data, headers=self._get_headers())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["data"]["title"], "Updated Title")

    def test_upload_media(self):
        """Test uploading a media file."""
        # This test is more complex and would require mocking file uploads.
        # For simplicity, we'll just check the endpoint exists and returns a proper error without a file.
        response = self.client.post("/api/cms/media", headers=self._get_headers())
        self.assertEqual(response.status_code, 400) # Bad Request - No file provided

if __name__ == "__main__":
    unittest.main()

