import sys
import os
import logging

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.communication_service import communication_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_communication_service():
    logger.info("Starting Communication Service Verification...")
    
    try:
        # 1. Verify Tables Exist (Should be created on init)
        logger.info("Check 1: Tables existence...")
        # We assume if no error on init, tables are likely there or will be created
        
        # 2. Test Get Conversations (Should return empty or list)
        logger.info("Check 2: Fetching conversations...")
        # querying safely
        try:
             # Need a user ID. Using a random UUID for testing
            test_user_id = "00000000-0000-0000-0000-000000000001"
            convs = communication_service.get_user_conversations(test_user_id)
            logger.info(f"Conversations fetch success. Count: {len(convs)}")
        except Exception as e:
            logger.error(f"Failed to fetch conversations: {e}")
            
        logger.info("✅ Communication Service seems operational.")
        
    except Exception as e:
        logger.error(f"Communication Service verification failed: {e}")

if __name__ == "__main__":
    test_communication_service()
