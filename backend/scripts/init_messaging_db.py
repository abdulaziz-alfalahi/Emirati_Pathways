
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from dotenv import load_dotenv
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../.env')))

from backend.db import get_db_connection

def init_messaging_schema():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            print("Creating messaging tables...")

            # 1. Conversations Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title TEXT,
                    application_id UUID, -- Optional link to an application
                    job_id UUID, -- Optional link to a job
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    last_message_at TIMESTAMP WITH TIME ZONE,
                    is_active BOOLEAN DEFAULT TRUE,
                    metadata JSONB DEFAULT '{}'
                );
            """)

            # 2. Participants Table (Many-to-Many)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS conversation_participants (
                    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- Assuming users.id is INT based on AuthManager, verify?
                    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    last_read_at TIMESTAMP WITH TIME ZONE,
                    PRIMARY KEY (conversation_id, user_id)
                );
            """)

            # 3. Messages Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                    sender_id INT REFERENCES users(id),
                    content TEXT NOT NULL,
                    message_type VARCHAR(50) DEFAULT 'text', -- text, system, invite, offer
                    status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    is_read BOOLEAN DEFAULT FALSE,
                    read_at TIMESTAMP WITH TIME ZONE
                );
            """)
            
            # 4. Notifications Table (Consolidated)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    type VARCHAR(50) NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT,
                    is_read BOOLEAN DEFAULT FALSE,
                    read_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    metadata JSONB DEFAULT '{}'
                );
            """)

            conn.commit()
            print("✅ Messaging tables created successfully.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error creating tables: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    init_messaging_schema()
