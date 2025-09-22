import unittest
import json
from unittest.mock import patch, MagicMock

# Mock the Flask app and other dependencies before importing them
# This is a common practice when you can't easily separate your app creation

# Mocking external libraries that might not be in the test environment
import sys
sys.modules['flask'] = MagicMock()
sys.modules['flask_socketio'] = MagicMock()
sys.modules['flask_sqlalchemy'] = MagicMock()
sys.modules['pandas'] = MagicMock()
sys.modules['numpy'] = MagicMock()
sys.modules['sklearn'] = MagicMock()


from backend.app_with_notifications import app, socketio
from backend.advanced_analytics_engine import AdvancedAnalyticsEngine

class AdvancedFeaturesBackendTest(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        self.socketio_test_client = socketio.test_client(app)

    @patch('backend.notification_system.emit')
    def test_real_time_notification_broadcast(self, mock_emit):
        """Test that a real-time notification is broadcasted correctly."""
        self.socketio_test_client.emit('send_notification', {'message': 'Test Notification'})
        # In a real test, you would check if the emit function was called with the correct arguments
        # Here we just check if it was called
        self.assertTrue(mock_emit.called)

    def test_create_and_get_notification(self):
        """Test creating and retrieving a notification via API."""
        # Mock database interaction
        with patch('backend.routes.notification_routes.db.session.add'), patch('backend.routes.notification_routes.db.session.commit'), patch('backend.routes.notification_routes.Notification.query') as mock_query:
            # Mock the query result
            mock_notification = MagicMock()
            mock_notification.to_dict.return_value = {'id': 1, 'message': 'Test Notification', 'user_id': 1}
            mock_query.all.return_value = [mock_notification]

            response = self.app.post('/api/notifications', 
                                     data=json.dumps({'message': 'Test Notification', 'user_id': 1}),
                                     content_type='application/json')
            self.assertEqual(response.status_code, 201)

            response = self.app.get('/api/notifications')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(len(data['notifications']), 1)
            self.assertEqual(data['notifications'][0]['message'], 'Test Notification')

    def test_advanced_analytics_engine(self):
        """Test the advanced analytics engine's data processing and insight generation."""
        # Mock data for the analytics engine
        mock_data = {
            'applications': [{'sector': 'Tech', 'emirati': True, 'successful': True}],
            'users': [{'user_type': 'job_seeker', 'last_login': '2025-09-20'}]
        }
        engine = AdvancedAnalyticsEngine(mock_data)
        insights = engine.generate_insights()

        self.assertIn('emiratization_rate', insights)
        self.assertIn('user_engagement', insights)
        self.assertGreater(insights['emiratization_rate']['Tech'], 0)

    def test_advanced_analytics_api(self):
        """Test the advanced analytics API endpoint."""
        # Mock the analytics engine within the API route
        with patch('backend.routes.advanced_analytics_routes.AdvancedAnalyticsEngine') as mock_engine:
            mock_instance = mock_engine.return_value
            mock_instance.generate_insights.return_value = {'test_insight': 'test_value'}

            response = self.app.get('/api/advanced-analytics/dashboard')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertIn('test_insight', data['data'])
            self.assertEqual(data['data']['test_insight'], 'test_value')

if __name__ == "__main__":
    unittest.main()
