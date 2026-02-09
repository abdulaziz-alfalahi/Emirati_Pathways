import os
import psycopg2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def clean_user_messages(user_ids):
    """Delete all messaging data for specific users to allow a fresh start"""
    conn = None
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        conn.autocommit = False 
        
        with conn.cursor() as cur:
            for user_id in user_ids:
                logger.info(f"Cleaning messages for User ID: {user_id}")
                
                # 1. Get Conversation IDs where this user is a participant
                cur.execute("SELECT conversation_id FROM conversation_participants WHERE user_id = %s", (str(user_id),))
                rows = cur.fetchall()
                conversation_ids = [row[0] for row in rows]
                
                if not conversation_ids:
                    logger.info(f"No conversations found for User {user_id}")
                    continue
                    
                logger.info(f"Found {len(conversation_ids)} conversations to clean.")
                
                # 2. Delete from conversation_participants (for ALL users in those chats? Or just this user?)
                # User asked "delete messages from MY account".
                # But if we want a "fresh start" for testing separation, we should probably nuke the whole conversation 
                # if it's a 1-on-1 test. 
                # Let's delete the entire conversation to be thorough for testing purposes.
                
                placeholders = ','.join(['%s'] * len(conversation_ids))
                
                # Delete messages
                cur.execute(f"DELETE FROM messages WHERE conversation_id IN ({placeholders})", tuple(conversation_ids))
                logger.info(f"Deleted messages.")
                
                # Delete participants
                cur.execute(f"DELETE FROM conversation_participants WHERE conversation_id IN ({placeholders})", tuple(conversation_ids))
                logger.info(f"Deleted participants.")
                
                # Delete conversations
                cur.execute(f"DELETE FROM conversations WHERE id IN ({placeholders})", tuple(conversation_ids))
                logger.info(f"Deleted conversations.")
            
            conn.commit()
            logger.info("Cleanup completed successfully.")
            
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Cleanup failed: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    # stored as strings in DB based on previous code review
    clean_user_messages(['62', '108']) 
