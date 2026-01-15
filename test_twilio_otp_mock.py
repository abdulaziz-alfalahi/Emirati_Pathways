
import os
import unittest
from unittest.mock import patch, MagicMock
from backend.auth.auth_manager_fixed import AuthenticationManager

class TestTwilioOTP(unittest.TestCase):
    def setUp(self):
        # Mock Redis client to avoid connection attempts
        self.mock_redis = MagicMock()
        
    @patch('backend.auth.auth_manager_fixed.Client')
    @patch.dict(os.environ, {
        'TWILIO_ACCOUNT_SID': 'AC_MOCK', 
        'TWILIO_AUTH_TOKEN': 'TOKEN_MOCK', 
        'TWILIO_FROM_NUMBER': '+14155238886'
    })
    def test_request_otp_success_mock(self, mock_client_cls):
        """Test that Twilio Client is initialized and called when creds exist"""
        mock_messages = MagicMock()
        mock_messages.create.return_value.sid = 'SM_MOCK_SID'
        
        mock_client_instance = MagicMock()
        mock_client_instance.messages = mock_messages
        mock_client_cls.return_value = mock_client_instance
        
        # We need to mock DB connection as well since request_otp tries to save
        with patch('backend.auth.auth_manager_fixed.AuthenticationManager._get_db_connection') as mock_db_conn:
            mock_cursor = MagicMock()
            mock_db_conn.return_value.cursor.return_value = mock_cursor
            
            auth_manager = AuthenticationManager(redis_client=self.mock_redis)
            success, msg, otp = auth_manager.request_otp('+971501234567') # Use magic number? No, test normal number
            
            # Normal number should trigger Twilio
            # But wait, +971501234567 IS a magic number in the code.
            # Let's use a non-magic number
            success, msg, otp = auth_manager.request_otp('+971504445555')
            
            self.assertTrue(success)
            self.assertIn("OTP sent successfully via WhatsApp", msg)
            
            # Verify Client was called with correct args
            mock_client_cls.assert_called_with('AC_MOCK', 'TOKEN_MOCK')
            mock_messages.create.assert_called_once()
            
            # Check args
            call_args = mock_messages.create.call_args[1]
            self.assertEqual(call_args['from_'], 'whatsapp:+14155238886')
            self.assertEqual(call_args['to'], 'whatsapp:+971504445555')
            self.assertIn("Your Emirati Pathways Verification Code is:", call_args['body'])

    @patch.dict(os.environ, {}, clear=True)
    def test_request_otp_fallback_no_creds(self):
        """Test fallback to simulation when no creds provided"""
         # Mock DB
        with patch('backend.auth.auth_manager_fixed.AuthenticationManager._get_db_connection') as mock_db_conn:
            mock_cursor = MagicMock()
            mock_db_conn.return_value.cursor.return_value = mock_cursor
            
            auth_manager = AuthenticationManager(redis_client=self.mock_redis)
            
            # Non-magic number
            success, msg, otp = auth_manager.request_otp('+971504445555')
            
            self.assertTrue(success)
            self.assertIn("Simulation Mode", msg)

    @patch('backend.auth.auth_manager_fixed.Client')
    @patch.dict(os.environ, {
        'TWILIO_ACCOUNT_SID': 'AC_MOCK', 
        'TWILIO_AUTH_TOKEN': 'TOKEN_MOCK', 
        'TWILIO_FROM_NUMBER': '+14155238886'
    })
    def test_normalization_05x(self, mock_client_cls):
        """Test conversion of 05X numbers to +9715X"""
        mock_messages = MagicMock()
        mock_client_instance = MagicMock()
        mock_client_instance.messages = mock_messages
        mock_client_cls.return_value = mock_client_instance

        with patch('backend.auth.auth_manager_fixed.AuthenticationManager._get_db_connection') as mock_db_conn:
            mock_cursor = MagicMock()
            mock_db_conn.return_value.cursor.return_value = mock_cursor
            auth_manager = AuthenticationManager(redis_client=self.mock_redis)

            # Test 0504445555 -> +971504445555
            auth_manager.request_otp('0504445555')
            
            call_args = mock_messages.create.call_args[1]
            self.assertEqual(call_args['to'], 'whatsapp:+971504445555')

    def test_verify_normalization(self):
        """Test verification works with 05X number when OTP was stored for +9715X"""
        with patch('backend.auth.auth_manager_fixed.AuthenticationManager._get_db_connection') as mock_db_conn:
            mock_cursor = MagicMock()
            mock_db_conn.return_value.cursor.return_value = mock_cursor
            
            # Mock find OTP for +97150...
            # The verify_phone method normalize the input then queries the DB
            # We assume request_otp already stored it as +97150...
            
            auth_manager = AuthenticationManager(redis_client=self.mock_redis)
            
            # Setup mock return: (otp_code, expires_at, attempts)
            from datetime import datetime, timedelta
            expires_at = datetime.now() + timedelta(minutes=10)
            mock_cursor.fetchone.return_value = ('123456', expires_at, 0)
            
            # Call verify with short number
            success, msg = auth_manager.verify_phone('0504445555', '123456')
            
            self.assertTrue(success)
            
            # Verify the SELECT query used the normalized number
            call_args = mock_cursor.execute.call_args
            # First arg is query, second is params list
            self.assertEqual(call_args[0][1][0], '+971504445555')

if __name__ == '__main__':
    unittest.main()
