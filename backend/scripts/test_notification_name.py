from flask import Flask
from backend.services.communication_service import communication_service, MessageType
import os
from dotenv import load_dotenv

load_dotenv()

import logging

# Configure Logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Use app context if needed (though service might not strictly need it for DB calls, logging might)
# But communication_service uses current_app for socketio? 
# send_message calls socketio.emit which requires app context or checks extension.

def test_send():
    with app.app_context():
        # 1. Use existing Recruiter ID (From previous debug: Test Recruiter 2 = 123?)
        recruiter_id = "123" # Prone to change, need to be sure. 
        # From Step 5772: User IDs 121, 122, 123 exist.
        
        # 2. Use HR Manager ID (121) as recipient
        hr_id = "121"

        print(f"--- Sending Message from {recruiter_id} to {hr_id} ---")

        try:
            msg = communication_service.send_message(
                sender_id=recruiter_id,
                recipient_id=hr_id,
                content="Test Notification Name 1",
                message_type=MessageType.TEXT
            )
            
            print(f"Message Sent: {msg.id}")
            print(f"Sender Name: {msg.sender_name}")
            
            if msg.sender_name and msg.sender_name != "Unknown User":
                print("✅ Sender Name Resolved Successfully!")
            else:
                print("❌ Sender Name is missing or Unknown.")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_send()
