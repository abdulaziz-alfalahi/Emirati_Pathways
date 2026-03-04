"""
Communication Service for Emirati Journey Platform
Real-time messaging, notifications, and automated communication workflows
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
from psycopg2.extras import RealDictCursor

# Initialize logger
logger = logging.getLogger(__name__)

class MessageType(Enum):
    TEXT = "text"
    SYSTEM = "system"
    INTERVIEW_INVITE = "interview_invite"
    OFFER_LETTER = "offer_letter"
    STATUS_UPDATE = "status_update"
    DOCUMENT_SHARE = "document_share"

class NotificationType(Enum):
    APPLICATION_SUBMITTED = "application_submitted"
    APPLICATION_REVIEWED = "application_reviewed"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_RESCHEDULED = "interview_rescheduled"
    INTERVIEW_CANCELLED = "interview_cancelled"
    INTERVIEW_REMINDER = "interview_reminder"
    OFFER_MADE = "offer_made"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    APPLICATION_REJECTED = "application_rejected"
    NEW_JOB_MATCH = "new_job_match"
    PROFILE_VIEWED = "profile_viewed"
    NEW_MESSAGE = "new_message"
    SYSTEM_ANNOUNCEMENT = "system_announcement"

class MessageStatus(Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"

class NotificationChannel(Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"

@dataclass
class Message:
    id: str
    conversation_id: str
    sender_id: str
    recipient_id: str
    message_type: MessageType
    content: str
    metadata: Dict[str, Any]
    status: MessageStatus
    created_at: datetime
    read_at: Optional[datetime] = None
    sender_name: Optional[str] = None # Added for UI convenience
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': str(self.sender_id),
            'sender_name': self.sender_name,
            'recipient_id': str(self.recipient_id),
            'message_type': self.message_type.value,
            'content': self.content,
            'metadata': self.metadata,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None
        }

@dataclass
class Notification:
    id: str
    user_id: str
    notification_type: NotificationType
    title: str
    content: str
    channels: List[NotificationChannel]
    metadata: Dict[str, Any]
    created_at: datetime
    read_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': str(self.user_id),
            'notification_type': self.notification_type.value,
            'title': self.title,
            'content': self.content,
            # 'channels': [channel.value for channel in self.channels], # Channels not stored in DB, implied by logic
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'read': bool(self.read_at),
            'priority': self.metadata.get('priority', 'medium') if self.metadata else 'medium'
        }

@dataclass
class Conversation:
    id: str
    participants: List[str]
    participant_names: Dict[str, str] # Map user_id -> Name
    participant_roles: Dict[str, str] # Map user_id -> Role
    application_id: Optional[str]
    job_id: Optional[str]
    title: str
    created_at: datetime
    last_message_at: Optional[datetime] = None
    is_active: bool = True
    unread_count: int = 0
    last_message_content: Optional[str] = None
    job_title: Optional[str] = None
    
    def to_dict(self):
        return {
            'id': self.id,
            'participants': self.participants,
            'participant_names': self.participant_names,
            'participant_roles': self.participant_roles,
            'application_id': self.application_id,
            'job_id': self.job_id,
            'title': self.title,
            'job_title': self.job_title,
            'created_at': self.created_at.isoformat(),
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
            'is_active': self.is_active,
            'unread_count': self.unread_count,
            'last_message_content': self.last_message_content
        }

class CommunicationService:
    """
    Comprehensive communication service for messaging, notifications, and workflows
    Backed by PostgreSQL
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Email configuration
        self.email_config = {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'email': 'noreply@emiratijourney.ae',
            'password': 'your-app-password',
            'enabled': False 
        }
        
        # Notification templates (Kept in-memory for now)
        self.notification_templates = {
            NotificationType.APPLICATION_SUBMITTED: {
                'title': 'Application Submitted Successfully',
                'content': 'Your application for {job_title} at {company_name} has been submitted.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.APPLICATION_REVIEWED: {
                'title': 'Application Under Review',
                'content': 'Your application for {job_title} is now being reviewed by {company_name}.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.NEW_MESSAGE: {
                'title': 'New Message from {sender_name}',
                'content': '{content_preview}',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.INTERVIEW_SCHEDULED: {
                'title': 'Interview Scheduled: {interview_title}',
                'content': 'You have been invited to an interview for {job_title}. Check your schedule for details.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.INTERVIEW_RESCHEDULED: {
                'title': 'Interview Rescheduled: {interview_title}',
                'content': 'Your interview for {job_title} has been rescheduled to {new_date} at {new_time}.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.INTERVIEW_CANCELLED: {
                'title': 'Interview Cancelled: {interview_title}',
                'content': 'Your interview for {job_title} has been cancelled. Reason: {reason}',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.SYSTEM_ANNOUNCEMENT: {
                'title': '{title}',
                'content': '{message}',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            }
        }

        # Initialize tables
        self.ensure_tables_exist()

    def ensure_tables_exist(self):
        """Ensure all communication tables exist"""
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                # Drop tables to ensure schema update (Development only behavior - for schema fix)
                # In production, use migrations.
                # Drop tables removed for persistence
                # cur.execute("DROP TABLE IF EXISTS messages CASCADE;")
                # cur.execute("DROP TABLE IF EXISTS conversation_participants CASCADE;")
                # cur.execute("DROP TABLE IF EXISTS conversations CASCADE;")
                # cur.execute("DROP TABLE IF EXISTS notifications CASCADE;")

                # Conversations Table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS conversations (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        application_id VARCHAR(255),
                        job_id VARCHAR(255),
                        title VARCHAR(255),
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        is_active BOOLEAN DEFAULT TRUE
                    )
                """)

                # Conversation Participants Table
                # user_id is VARCHAR to support both UUID and Integer IDs
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS conversation_participants (
                        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                        user_id VARCHAR(255) NOT NULL,
                        joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        last_read_at TIMESTAMPTZ,
                        is_archived BOOLEAN DEFAULT FALSE,
                        PRIMARY KEY (conversation_id, user_id)
                    )
                """)

                # Check and add is_archived column if missing (Migration for existing tables)
                cur.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='conversation_participants' AND column_name='is_archived';
                """)
                if not cur.fetchone():
                    self.logger.info("Adding is_archived column to conversation_participants")
                    cur.execute("ALTER TABLE conversation_participants ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;")

                # Check and add role column if missing (Migration for Messaging Separation)
                cur.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='conversation_participants' AND column_name='role';
                """)
                if not cur.fetchone():
                    self.logger.info("Adding role column to conversation_participants")
                    cur.execute("ALTER TABLE conversation_participants ADD COLUMN role VARCHAR(50);")

                # Check and add conversation_type column for group discussions
                cur.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='conversations' AND column_name='conversation_type';
                """)
                if not cur.fetchone():
                    self.logger.info("Adding conversation_type column to conversations")
                    cur.execute("ALTER TABLE conversations ADD COLUMN conversation_type VARCHAR(50) DEFAULT 'direct';")

                # Check and add candidate_id column for candidate discussions
                cur.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='conversations' AND column_name='candidate_id';
                """)
                if not cur.fetchone():
                    self.logger.info("Adding candidate_id column to conversations")
                    cur.execute("ALTER TABLE conversations ADD COLUMN candidate_id VARCHAR(255);")

                # Messages Table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                        sender_id VARCHAR(255) NOT NULL,
                        recipient_id VARCHAR(255),
                        content TEXT NOT NULL,
                        message_type VARCHAR(50) DEFAULT 'text',
                        metadata JSONB DEFAULT '{}',
                        status VARCHAR(20) DEFAULT 'sent',
                        is_read BOOLEAN DEFAULT FALSE,
                        read_at TIMESTAMPTZ,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Notifications Table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        user_id VARCHAR(255) NOT NULL,
                        type VARCHAR(50) NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        content TEXT NOT NULL,
                        metadata JSONB DEFAULT '{}',
                        is_read BOOLEAN DEFAULT FALSE,
                        read_at TIMESTAMPTZ,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                conn.commit()
                self.logger.info("✅ Communication tables ensured (Schema Verified)")
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error ensuring communication tables: {e}")
        finally:
            conn.close()

    def _get_db_connection(self):
        try:
            return psycopg2.connect(
                dbname=os.getenv('DB_NAME', 'emirati_journey'),
                user=os.getenv('DB_USER', 'emirati_user'),
                password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', 5432)
            )
        except Exception as e:
            self.logger.error(f"Failed to connect to DB: {e}")
            raise

    def create_conversation(self, participants: List[str], application_id: Optional[str] = None, 
                          job_id: Optional[str] = None, title: str = "Conversation", participant_roles: Dict[str, str] = None) -> Conversation:
        """
        Create a new conversation between participants
        participant_roles: Optional map of user_id -> role (e.g. {'1': 'recruiter', '2': 'candidate'})
        """
        # Ensure all participants are strings to avoid SQL type mismatch with VARCHAR column
        participants = [str(p) for p in participants]
        
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Check for existing conversation with exact same participants
                # For MVP simplicity, we might just check if a conversation exists between these 2 users
                if len(participants) == 2:
                    self.logger.info(f"Checking for existing conversation between {participants}")
                    cur.execute("""
                        SELECT c.id 
                        FROM conversation_participants cp1
                        JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
                        JOIN conversations c ON cp1.conversation_id = c.id
                        WHERE cp1.user_id = %s AND cp2.user_id = %s
                        AND (c.conversation_type = 'direct' OR c.conversation_type IS NULL)
                        LIMIT 1
                    """, (participants[0], participants[1]))
                    existing = cur.fetchone()
                    if existing:
                        self.logger.info(f"Found existing direct conversation: {existing['id']}")
                        # Ensure it's active/unarchived for both if it exists
                        # If I am creating it, I should see it even if I hid it before.
                        
                        if participant_roles:
                             # Also update ROLES if provided (fixes legacy/broken conversations)
                             for user_id, role in participant_roles.items():
                                  if role:
                                      cur.execute("""
                                          UPDATE conversation_participants
                                          SET role = %s, is_archived = FALSE
                                          WHERE conversation_id = %s AND user_id = %s
                                      """, (role, existing['id'], str(user_id)))
                        else:
                            # Fallback just unarchive
                            cur.execute("""
                                UPDATE conversation_participants 
                                SET is_archived = FALSE 
                                WHERE conversation_id = %s AND user_id IN %s
                            """, (existing['id'], tuple(participants)))
                            
                        conn.commit() # Commit un-archive
                        self.logger.info(f"Returning existing conversation {existing['id']}")
                        return self._get_conversation_by_id(cur, existing['id'])

                # Create new
                cur.execute("""
                    INSERT INTO conversations (application_id, job_id, title)
                    VALUES (%s, %s, %s)
                    RETURNING id, created_at
                """, (application_id, job_id, title))
                conv_data = cur.fetchone()
                conv_id = conv_data['id']
                
                # Add participants
                for p_id in participants:
                    role = participant_roles.get(p_id) if participant_roles else None
                    cur.execute("""
                        INSERT INTO conversation_participants (conversation_id, user_id, is_archived, role)
                        VALUES (%s, %s, FALSE, %s)
                    """, (conv_id, p_id, role))
                
                conn.commit()
                return self._get_conversation_by_id(cur, conv_id)
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error creating conversation: {str(e)}", exc_info=True)
            print(f"CRITICAL ERROR in create_conversation: {str(e)}") # Print to stdout for CLI visibility
            raise
        finally:
            conn.close()

    def create_candidate_discussion(self, creator_id: str, candidate_id: str, job_id: str, 
                                   participant_ids: List[str], candidate_name: str = "Candidate",
                                   job_title: str = "Position") -> Dict[str, Any]:
        """
        Create or get existing discussion thread for a candidate.
        This is a group conversation where team members can discuss a specific candidate.
        """
        creator_id = str(creator_id)
        candidate_id = str(candidate_id)
        all_participants = list(set([creator_id] + [str(p) for p in participant_ids]))
        
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Check if a discussion already exists for this candidate + job
                cur.execute("""
                    SELECT id FROM conversations 
                    WHERE conversation_type = 'candidate_discussion' 
                    AND candidate_id = %s 
                    AND job_id = %s
                    LIMIT 1
                """, (candidate_id, job_id))
                existing = cur.fetchone()
                
                if existing:
                    conv_id = existing['id']
                    self.logger.info(f"Found existing candidate discussion: {conv_id}")
                    
                    # Add new participants if not already in
                    for p_id in all_participants:
                        cur.execute("""
                            INSERT INTO conversation_participants (conversation_id, user_id, is_archived, role)
                            VALUES (%s, %s, FALSE, 'recruiter')
                            ON CONFLICT (conversation_id, user_id) 
                            DO UPDATE SET is_archived = FALSE
                        """, (conv_id, p_id))
                    
                    conn.commit()
                    return {'success': True, 'conversation_id': str(conv_id), 'is_new': False}
                
                # Create new discussion thread
                title = f"Discussion: {candidate_name} - {job_title}"
                cur.execute("""
                    INSERT INTO conversations (job_id, candidate_id, title, conversation_type)
                    VALUES (%s, %s, %s, 'candidate_discussion')
                    RETURNING id, created_at
                """, (job_id, candidate_id, title))
                conv_data = cur.fetchone()
                conv_id = conv_data['id']
                
                # Add all participants
                for p_id in all_participants:
                    cur.execute("""
                        INSERT INTO conversation_participants (conversation_id, user_id, is_archived, role)
                        VALUES (%s, %s, FALSE, 'recruiter')
                    """, (conv_id, p_id))
                
                # Add system message announcing the discussion
                cur.execute("""
                    INSERT INTO messages (conversation_id, sender_id, content, message_type, metadata)
                    VALUES (%s, %s, %s, 'system', %s)
                """, (
                    conv_id, 
                    creator_id, 
                    f"Started a discussion about {candidate_name} for {job_title}",
                    json.dumps({'type': 'discussion_started', 'candidate_id': candidate_id})
                ))
                
                conn.commit()
                self.logger.info(f"Created new candidate discussion: {conv_id}")
                return {'success': True, 'conversation_id': str(conv_id), 'is_new': True}
                
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error creating candidate discussion: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
        finally:
            conn.close()

    def add_participant_to_discussion(self, conversation_id: str, user_id: str) -> Dict[str, Any]:
        """Add a participant to an existing candidate discussion"""
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO conversation_participants (conversation_id, user_id, is_archived, role)
                    VALUES (%s, %s, FALSE, 'recruiter')
                    ON CONFLICT (conversation_id, user_id) DO UPDATE SET is_archived = FALSE
                """, (conversation_id, str(user_id)))
                conn.commit()
                return {'success': True}
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error adding participant: {str(e)}")
            return {'success': False, 'error': str(e)}
        finally:
            conn.close()

    def _get_conversation_by_id(self, cur, conversation_id):
        # Helper to fetch hydrated conversation object
        cur.execute("""
            SELECT c.*, 
                   m.content as last_message_content,
                   m.created_at as last_message_at
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id 
                AND m.created_at = (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id)
            WHERE c.id = %s
        """, (conversation_id,))
        conv_row = cur.fetchone()
        
        if not conv_row:
            return None
            
        # Get participants and names
        # Get participants and names
        # Cast cp.user_id to integer for join with users.id
        # Cast cp.user_id to integer for join with users.id
        cur.execute("""
            SELECT cp.user_id, 
                   cp.role,
                   COALESCE(
                       NULLIF(NULLIF(u.full_name, 'New Member'), ''),
                       NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''),
                       u.full_name,
                       'Unknown User'
                   ) as full_name
            FROM conversation_participants cp
            LEFT JOIN users u ON cp.user_id = u.id::varchar
            WHERE cp.conversation_id = %s
        """, (conversation_id,))
        part_rows = cur.fetchall()
        
        participants = [str(r['user_id']) for r in part_rows]
        participant_names = {str(r['user_id']): r['full_name'] for r in part_rows}
        participant_roles = {str(r['user_id']): r['role'] for r in part_rows}
        
        # Fetch Job Title if job_id is present
        job_title = None
        if conv_row['job_id']:
            try:
                # Try fetching from job_postings or job_descriptions. jobs_api uses job_postings.
                cur.execute("SELECT title FROM job_postings WHERE id::text = %s", (str(conv_row['job_id']),))
                j_row = cur.fetchone()
                if j_row:
                    job_title = j_row['title']
                else:
                    # Fallback check job_descriptions just in case
                    cur.execute("SELECT title FROM job_descriptions WHERE id::text = %s", (str(conv_row['job_id']),))
                    j_row_2 = cur.fetchone()
                    if j_row_2:
                        job_title = j_row_2['title']
            except Exception:
                pass # Ignore if table missing/error

        return Conversation(
            id=str(conv_row['id']),
            participants=participants,
            participant_names=participant_names,
            participant_roles=participant_roles,
            application_id=str(conv_row['application_id']) if conv_row['application_id'] else None,
            job_id=str(conv_row['job_id']) if conv_row['job_id'] else None,
            title=conv_row['title'],
            job_title=job_title,
            created_at=conv_row['created_at'],
            last_message_at=conv_row['last_message_at'],
            is_active=conv_row['is_active'],
            last_message_content=conv_row['last_message_content']
        )
    
    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """Get a conversation by ID"""
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                return self._get_conversation_by_id(cur, conversation_id)
        except Exception as e:
            self.logger.error(f"Error getting conversation {conversation_id}: {e}")
            return None
        finally:
            conn.close()

    def send_message(self, sender_id: str, recipient_id: str, content: str, 
                    message_type: MessageType = MessageType.TEXT, 
                    conversation_id: Optional[str] = None,
                    metadata: Dict[str, Any] = None) -> Message:
        """Send a message between users"""
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Find or create conversation
                if not conversation_id:
                    # Create conversation with both sender and recipient
                    # Try to infer roles from metadata if possible, otherwise rely on create default
                    sender_role = metadata.get('sender_role') if metadata else None
                    recipient_role = metadata.get('recipient_role') if metadata else None
                    
                    # Infer recipient role if not provided but sender role is known
                    if sender_role and not recipient_role:
                        if sender_role == 'recruiter':
                            recipient_role = 'job_seeker'
                        elif sender_role == 'job_seeker':
                            recipient_role = 'recruiter'
                    
                    roles = {}
                    if sender_role: roles[sender_id] = sender_role
                    if recipient_role: roles[recipient_id] = recipient_role
                    
                    conv = self.create_conversation([sender_id, recipient_id], participant_roles=roles)
                    conversation_id = conv.id
                    self.logger.info(f"Auto-created conversation {conversation_id} between {sender_id} and {recipient_id}")
                
                # Un-archive for ALL participants (Sender + Recipient)
                # Logic: If I send a message, it should be active for me and the recipient.
                participants_to_active = [sender_id, recipient_id]
                self.logger.info(f"Attempting to un-archive conversation {conversation_id} for participants {participants_to_active}")
                
                # Also update their roles if provided in metadata (e.g. if starting chat as Recruiter)
                sender_role = metadata.get('sender_role') if metadata else None
                
                if sender_role:
                   # Update Sender Role
                   cur.execute("""
                       UPDATE conversation_participants 
                       SET role = %s 
                       WHERE conversation_id = %s AND user_id = %s AND (role IS NULL OR role != %s)
                   """, (sender_role, conversation_id, sender_id, sender_role))

                   # Update Recipient Role (Infer)
                   recipient_role = None
                   if sender_role == 'recruiter':
                        recipient_role = 'job_seeker'
                   elif sender_role == 'job_seeker':
                        recipient_role = 'recruiter'
                   
                   if recipient_role:
                       cur.execute("""
                           UPDATE conversation_participants 
                           SET role = %s 
                           WHERE conversation_id = %s AND user_id != %s AND (role IS NULL OR role != %s)
                       """, (recipient_role, conversation_id, sender_id, recipient_role))

                cur.execute("""
                    UPDATE conversation_participants 
                    SET is_archived = FALSE 
                    WHERE conversation_id = %s AND user_id IN %s
                """, (conversation_id, tuple(participants_to_active)))
                self.logger.info(f"Un-archive result (rows updated): {cur.rowcount}")

                # Insert Message
                cur.execute("""
                    INSERT INTO messages (conversation_id, sender_id, content, message_type, metadata, status)
                    VALUES (%s, %s, %s, %s, %s, 'sent')
                    RETURNING id, created_at, status
                """, (conversation_id, sender_id, content, message_type.value, json.dumps(metadata or {})))
                
                msg_row = cur.fetchone()
                
                # Update conversation timestamp
                cur.execute("""
                    UPDATE conversations SET last_message_at = %s WHERE id = %s
                """, (msg_row['created_at'], conversation_id))
                
                conn.commit()
                
                msg_obj = Message(
                    id=str(msg_row['id']),
                    conversation_id=conversation_id,
                    sender_id=sender_id,
                    recipient_id=recipient_id,
                    message_type=message_type,
                    content=content,
                    metadata=metadata or {},
                    status=MessageStatus(msg_row['status']),
                    created_at=msg_row['created_at']
                )
                
                # Enrich with sender name for notification purposes
                try:
                    self.logger.info(f"DEBUG: Resolving name for sender_id='{sender_id}' (Type: {type(sender_id)})")
                    cur.execute("SELECT full_name FROM users WHERE id::varchar = %s", (sender_id,))
                    sender_row = cur.fetchone()
                    self.logger.info(f"DEBUG: User Query Result: {sender_row}")
                    
                    if sender_row:
                        msg_obj.sender_name = sender_row['full_name']
                except Exception as e:
                    self.logger.warning(f"Failed to resolve sender name: {e}") 
                
                return msg_obj
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error sending message: {str(e)}")
            raise
        finally:
            conn.close()
    
    def get_conversation_messages(self, conversation_id: str, limit: int = 50, 
                                offset: int = 0, before: str = None) -> dict:
        """Get messages from a conversation. Returns {'messages': [...], 'has_more': bool}"""
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if before:
                    cur.execute("""
                        SELECT m.*, u.first_name, u.last_name
                        FROM messages m
                        JOIN users u ON m.sender_id = u.id::varchar
                        WHERE m.conversation_id = %s AND m.created_at < %s
                        ORDER BY m.created_at DESC
                        LIMIT %s
                    """, (conversation_id, before, limit + 1))
                else:
                    cur.execute("""
                        SELECT m.*, u.first_name, u.last_name
                        FROM messages m
                        JOIN users u ON m.sender_id = u.id::varchar
                        WHERE m.conversation_id = %s
                        ORDER BY m.created_at DESC
                        LIMIT %s OFFSET %s
                    """, (conversation_id, limit + 1, offset))
                rows = cur.fetchall()
                
                has_more = len(rows) > limit
                if has_more:
                    rows = rows[:limit]
                
                messages = []
                for r in rows:
                    messages.append(Message(
                        id=str(r['id']),
                        conversation_id=str(r['conversation_id']),
                        sender_id=str(r['sender_id']),
                        sender_name=f"{r['first_name']} {r['last_name']}",
                        recipient_id="",
                        message_type=MessageType(r['message_type']),
                        content=r['content'],
                        metadata=r['metadata'],
                        status=MessageStatus(r['status']),
                        created_at=r['created_at'],
                        read_at=r['read_at']
                    ))
                return {'messages': messages[::-1], 'has_more': has_more}
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return {'messages': [], 'has_more': False}
        finally:
            conn.close()
    
    def get_user_conversations(self, user_id: str, role: Optional[str] = None) -> List[Conversation]:
        """Get all conversations for a user, optionally filtered by role context"""
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Find all conversation IDs for user
                self.logger.info(f"DEBUG: get_user_conversations querying for user_id={user_id} role={role}")
                
                query = """
                    SELECT conversation_id FROM conversation_participants 
                    WHERE user_id = %s AND (is_archived IS FALSE OR is_archived IS NULL)
                """
                params = [user_id]
                
                if role:
                    # If role specified:
                    # Show conversations matching the role OR where role is NULL (legacy/unspecified)
                    query += " AND (role = %s OR role IS NULL)"
                    params.append(role)
                
                cur.execute(query, tuple(params))
                rows = cur.fetchall()
                conv_ids = [r['conversation_id'] for r in rows]
                self.logger.info(f"DEBUG: Found conversation IDs: {conv_ids}")
                
                conversations = []
                for cid in conv_ids:
                    # Reuse helper (slightly inefficient N+1 but safe for robust data)
                    conv = self._get_conversation_by_id(cur, cid)
                    if conv:
                        conversations.append(conv)
                
                # Sort by last message
                conversations.sort(key=lambda x: x.last_message_at or x.created_at, reverse=True)
                return conversations
        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            return []
        finally:
            conn.close()

            conn.close()
            
    def archive_conversation_for_user(self, conversation_id: str, user_id: str) -> bool:
        """Archive (soft delete) a conversation for a specific user"""
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE conversation_participants
                    SET is_archived = TRUE
                    WHERE conversation_id = %s AND user_id = %s
                """, (conversation_id, user_id))
                conn.commit()
                return cur.rowcount > 0
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error archiving conversation: {e}")
            return False
        finally:
            conn.close()

    # ... Placeholder for notification methods implementation using similar SQL ...
    def create_notification(self, user_id, notification_type, metadata=None):
        # Minimal impl for SQL
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                template = self.notification_templates.get(notification_type, {})
                title = template.get('title', 'Notification').format(**(metadata or {}))
                content = template.get('content', '').format(**(metadata or {}))
                
                cur.execute("""
                    INSERT INTO notifications (user_id, type, title, content, metadata)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (user_id, notification_type.value, title, content, json.dumps(metadata or {})))
                row = cur.fetchone()
                conn.commit()
                
                return Notification(
                    id=str(row['id']),
                    user_id=str(user_id),
                    notification_type=notification_type,
                    title=title,
                    content=content,
                    channels=[],
                    metadata=metadata or {},
                    created_at=row['created_at']
                )
        except Exception as e:
            conn.rollback()
            logger.error(f"Error creating notification: {e}")
            raise
        finally:
            conn.close()

    def get_user_notifications(self, user_id: str, limit: int = 20, unread_only: bool = False) -> List[Notification]:
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = "SELECT * FROM notifications WHERE user_id = %s"
                params = [user_id]
                
                if unread_only:
                    query += " AND is_read = FALSE"
                
                query += " ORDER BY created_at DESC LIMIT %s"
                params.append(limit)
                
                cur.execute(query, tuple(params))
                rows = cur.fetchall()
                
                return [Notification(
                    id=str(r['id']),
                    user_id=str(r['user_id']),
                    notification_type=NotificationType.APPLICATION_SUBMITTED, # Simplified for reconstruction
                    title=r['title'],
                    content=r['content'],
                    channels=[],
                    metadata=r['metadata'],
                    created_at=r['created_at'],
                    read_at=r['read_at']
                ) for r in rows]
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            return []
        finally:
            conn.close()

    def mark_notification_as_read(self, notification_id: str, user_id: str) -> bool:
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE notifications 
                    SET is_read = TRUE, read_at = NOW() 
                    WHERE id = %s AND user_id = %s
                """, (notification_id, user_id))
                conn.commit()
                return cur.rowcount > 0
        except Exception as e:
            conn.rollback()
            return False
        finally:
            conn.close()
            
    def mark_message_as_read(self, message_id: str, user_id: str) -> bool:
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                # Ideally verify recipient_id logic in SQL or assume if they have access to API, it's valid?
                # Simplistic: Just mark it.
                cur.execute("UPDATE messages SET is_read = TRUE, read_at = NOW(), status='read' WHERE id = %s", (message_id,))
                conn.commit()
                return True
        finally:
            conn.close()

    def mark_messages_read(self, conversation_id: str, user_id: str) -> bool:
        """Mark ALL unread messages in a conversation as read for the given user."""
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE messages
                       SET is_read = TRUE, read_at = NOW(), status = 'read'
                       WHERE conversation_id = %s
                         AND recipient_id = %s
                         AND (is_read = FALSE OR is_read IS NULL)""",
                    (conversation_id, user_id)
                )
                conn.commit()
                return cur.rowcount > 0
        finally:
            conn.close()
            
    def get_communication_stats(self, user_id: Optional[str] = None):
        # Stub for now
        return {}
            
    def schedule_interview_reminder(self, application_id, candidate_id, interview_date, job_title):
        pass # Stub
        
    def send_application_status_update(self, **kwargs):
        pass # Stub that would use create_notification

    def mark_conversation_as_read(self, conversation_id: str, user_id: str) -> bool:
        """Mark all messages in a conversation as read for a user"""
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                # Update participant last_read_at
                cur.execute("""
                    UPDATE conversation_participants
                    SET last_read_at = NOW()
                    WHERE conversation_id = %s AND user_id = %s
                """, (conversation_id, user_id))
                
                # Update messages status (incoming messages only)
                cur.execute("""
                    UPDATE messages
                    SET is_read = TRUE, read_at = NOW(), status = 'read'
                    WHERE conversation_id = %s 
                    AND sender_id != %s 
                    AND is_read = FALSE
                """, (conversation_id, user_id))
                
                conn.commit()
                return True
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error marking conversation as read: {e}")
            return False
        finally:
            conn.close()

communication_service = CommunicationService()
