"""
Mentor Communication and Messaging System
Comprehensive system for mentor-mentee communication, messaging, and collaboration
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from backend.user_helpers import user_display_name

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MessageType(Enum):
    """Message type enumeration"""
    TEXT = "text"
    FILE = "file"
    IMAGE = "image"
    VOICE = "voice"
    VIDEO = "video"
    LINK = "link"
    GOAL_UPDATE = "goal_update"
    SESSION_REMINDER = "session_reminder"
    MILESTONE_ACHIEVEMENT = "milestone_achievement"
    SYSTEM_NOTIFICATION = "system_notification"

class MessageStatus(Enum):
    """Message status enumeration"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    ARCHIVED = "archived"

class ConversationType(Enum):
    """Conversation type enumeration"""
    DIRECT_MESSAGE = "direct_message"
    GROUP_CHAT = "group_chat"
    SESSION_CHAT = "session_chat"
    GOAL_DISCUSSION = "goal_discussion"

class NotificationType(Enum):
    """Notification type enumeration"""
    MESSAGE = "message"
    SESSION_REMINDER = "session_reminder"
    GOAL_DEADLINE = "goal_deadline"
    MILESTONE_DUE = "milestone_due"
    PROGRESS_UPDATE = "progress_update"
    SKILL_ASSESSMENT = "skill_assessment"
    MENTORSHIP_UPDATE = "mentorship_update"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_RESCHEDULED = "interview_rescheduled"
    INTERVIEW_CANCELLED = "interview_cancelled"

class NotificationPriority(Enum):
    """Notification priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

@dataclass
class Message:
    """Message data structure"""
    id: str
    conversation_id: str
    sender_id: str
    recipient_id: str
    message_type: MessageType
    content: str
    attachments: List[str]
    metadata: Dict
    status: MessageStatus
    sent_at: datetime
    delivered_at: Optional[datetime]
    read_at: Optional[datetime]
    reply_to_id: Optional[str]
    is_edited: bool
    edited_at: Optional[datetime]

@dataclass
class Conversation:
    """Conversation data structure"""
    id: str
    conversation_type: ConversationType
    participants: List[str]
    title: str
    description: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime]
    is_active: bool
    metadata: Dict

@dataclass
class Notification:
    """Notification data structure"""
    id: str
    user_id: str
    notification_type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    data: Dict
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    expires_at: Optional[datetime]

@dataclass
class CommunicationPreferences:
    """Communication preferences data structure"""
    user_id: str
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    in_app_notifications: bool
    notification_frequency: str
    quiet_hours_start: str
    quiet_hours_end: str
    preferred_language: str
    timezone: str

class MentorCommunicationSystem:
    """Comprehensive communication and messaging system"""
    
    def __init__(self, db_config: Dict):
        """Initialize the communication system with database configuration"""
        self.db_config = db_config
        
        # UAE-specific communication features
        self.uae_features = {
            'arabic_support': True,
            'cultural_sensitivity': True,
            'business_hours': {
                'start': '08:00',
                'end': '18:00',
                'timezone': 'Asia/Dubai'
            },
            'ramadan_mode': {
                'adjusted_hours': True,
                'respectful_timing': True
            },
            'government_compliance': {
                'data_residency': True,
                'privacy_protection': True
            }
        }
        
        # Message templates for common scenarios
        self.message_templates = {
            'session_reminder': {
                'en': "Reminder: You have a mentoring session scheduled for {datetime} with {participant}",
                'ar': "تذكير: لديك جلسة إرشاد مجدولة في {datetime} مع {participant}"
            },
            'goal_deadline': {
                'en': "Your goal '{goal_title}' is due on {deadline}. Current progress: {progress}%",
                'ar': "هدفك '{goal_title}' مستحق في {deadline}. التقدم الحالي: {progress}%"
            },
            'milestone_achievement': {
                'en': "Congratulations! You've achieved the milestone: {milestone_title}",
                'ar': "تهانينا! لقد حققت المعلم: {milestone_title}"
            },
            'welcome_message': {
                'en': "Welcome to your mentorship journey! I'm excited to work with you.",
                'ar': "مرحباً بك في رحلة الإرشاد! أنا متحمس للعمل معك."
            }
        }

    def get_database_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def create_conversation(self, conversation_data: Dict) -> Optional[str]:
        """Create a new conversation"""
        try:
            conversation_id = str(uuid.uuid4())
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO conversations 
                        (id, conversation_type, participants, title, description, 
                         created_by, created_at, updated_at, is_active, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        conversation_id,
                        conversation_data['conversation_type'],
                        json.dumps(conversation_data['participants']),
                        conversation_data.get('title', ''),
                        conversation_data.get('description', ''),
                        conversation_data['created_by'],
                        datetime.now(),
                        datetime.now(),
                        True,
                        json.dumps(conversation_data.get('metadata', {}))
                    ))
                    
                    conn.commit()
                    return conversation_id
                    
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return None

    def send_message(self, message_data: Dict) -> Optional[str]:
        """Send a message"""
        try:
            message_id = str(uuid.uuid4())
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO messages 
                        (id, conversation_id, sender_id, recipient_id, message_type, 
                         content, attachments, metadata, status, sent_at, reply_to_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        message_id,
                        message_data['conversation_id'],
                        message_data['sender_id'],
                        message_data['recipient_id'],
                        message_data.get('message_type', MessageType.TEXT.value),
                        message_data['content'],
                        json.dumps(message_data.get('attachments', [])),
                        json.dumps(message_data.get('metadata', {})),
                        MessageStatus.SENT.value,
                        datetime.now(),
                        message_data.get('reply_to_id')
                    ))
                    
                    # Update conversation last message time
                    cursor.execute("""
                        UPDATE conversations 
                        SET last_message_at = %s, updated_at = %s
                        WHERE id = %s
                    """, (datetime.now(), datetime.now(), message_data['conversation_id']))
                    
                    # Create notification for recipient
                    self.create_notification({
                        'user_id': message_data['recipient_id'],
                        'notification_type': NotificationType.MESSAGE.value,
                        'priority': NotificationPriority.MEDIUM.value,
                        'title': 'New Message',
                        'message': f"You have a new message from your mentor/mentee",
                        'data': {
                            'message_id': message_id,
                            'conversation_id': message_data['conversation_id'],
                            'sender_id': message_data['sender_id']
                        }
                    })
                    
                    conn.commit()
                    return message_id
                    
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return None

    def get_conversations(self, user_id: str, conversation_type: Optional[str] = None) -> List[Conversation]:
        """Get conversations for a user"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    where_clause = "WHERE %s = ANY(participants::text[]) AND is_active = true"
                    params = [user_id]
                    
                    if conversation_type:
                        where_clause += " AND conversation_type = %s"
                        params.append(conversation_type)
                    
                    cursor.execute(f"""
                        SELECT c.*, 
                               m.content as last_message_content,
                               m.sent_at as last_message_time,
                               {user_display_name('other_participant_name')}
                        FROM conversations c
                        LEFT JOIN messages m ON c.id = m.conversation_id 
                            AND m.sent_at = c.last_message_at
                        LEFT JOIN users u ON u.id = (
                            SELECT unnest(participants::text[])::uuid 
                            FROM conversations 
                            WHERE id = c.id AND unnest(participants::text[])::uuid != %s 
                            LIMIT 1
                        )
                        {where_clause}
                        ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
                    """, params + [user_id])
                    
                    conversations = []
                    for row in cursor.fetchall():
                        conversation = Conversation(
                            id=str(row['id']),
                            conversation_type=ConversationType(row['conversation_type']),
                            participants=json.loads(row['participants']),
                            title=row['title'] or row.get('other_participant_name', 'Unknown'),
                            description=row['description'] or '',
                            created_by=str(row['created_by']),
                            created_at=row['created_at'],
                            updated_at=row['updated_at'],
                            last_message_at=row['last_message_at'],
                            is_active=row['is_active'],
                            metadata=json.loads(row['metadata']) if row['metadata'] else {}
                        )
                        conversations.append(conversation)
                    
                    return conversations
                    
        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            return []

    def get_messages(self, conversation_id: str, limit: int = 50, offset: int = 0) -> List[Message]:
        """Get messages for a conversation"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(f"""
                        SELECT m.*, 
                               {user_display_name('sender_name')}
                        FROM messages m
                        JOIN users u ON m.sender_id = u.id
                        WHERE m.conversation_id = %s
                        ORDER BY m.sent_at DESC
                        LIMIT %s OFFSET %s
                    """, (conversation_id, limit, offset))
                    
                    messages = []
                    for row in cursor.fetchall():
                        message = Message(
                            id=str(row['id']),
                            conversation_id=str(row['conversation_id']),
                            sender_id=str(row['sender_id']),
                            recipient_id=str(row['recipient_id']),
                            message_type=MessageType(row['message_type']),
                            content=row['content'],
                            attachments=json.loads(row['attachments']) if row['attachments'] else [],
                            metadata=json.loads(row['metadata']) if row['metadata'] else {},
                            status=MessageStatus(row['status']),
                            sent_at=row['sent_at'],
                            delivered_at=row['delivered_at'],
                            read_at=row['read_at'],
                            reply_to_id=str(row['reply_to_id']) if row['reply_to_id'] else None,
                            is_edited=row.get('is_edited', False),
                            edited_at=row.get('edited_at')
                        )
                        messages.append(message)
                    
                    return messages
                    
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return []

    def mark_message_as_read(self, message_id: str, user_id: str) -> bool:
        """Mark a message as read"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE messages 
                        SET status = %s, read_at = %s
                        WHERE id = %s AND recipient_id = %s
                    """, (MessageStatus.READ.value, datetime.now(), message_id, user_id))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error marking message as read: {e}")
            return False

    def mark_conversation_as_read(self, conversation_id: str, user_id: str) -> bool:
        """Mark all messages in a conversation as read"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE messages 
                        SET status = %s, read_at = %s
                        WHERE conversation_id = %s AND recipient_id = %s AND status != %s
                    """, (MessageStatus.READ.value, datetime.now(), conversation_id, user_id, MessageStatus.READ.value))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error marking conversation as read: {e}")
            return False

    def create_notification(self, notification_data: Dict) -> Optional[str]:
        """Create a notification"""
        try:
            notification_id = str(uuid.uuid4())
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO notifications 
                        (id, user_id, notification_type, priority, title, message, 
                         data, is_read, created_at, expires_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        notification_id,
                        notification_data['user_id'],
                        notification_data['notification_type'],
                        notification_data['priority'],
                        notification_data['title'],
                        notification_data['message'],
                        json.dumps(notification_data.get('data', {})),
                        False,
                        datetime.now(),
                        notification_data.get('expires_at')
                    ))
                    
                    conn.commit()
                    return notification_id
                    
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None

    def get_notifications(self, user_id: str, unread_only: bool = False, limit: int = 50) -> List[Notification]:
        """Get notifications for a user"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    where_clause = "WHERE user_id = %s"
                    params = [user_id]
                    
                    if unread_only:
                        where_clause += " AND is_read = false"
                    
                    where_clause += " AND (expires_at IS NULL OR expires_at > %s)"
                    params.append(datetime.now())
                    
                    cursor.execute(f"""
                        SELECT * FROM notifications 
                        {where_clause}
                        ORDER BY created_at DESC
                        LIMIT %s
                    """, params + [limit])
                    
                    notifications = []
                    for row in cursor.fetchall():
                        notification = Notification(
                            id=str(row['id']),
                            user_id=str(row['user_id']),
                            notification_type=NotificationType(row['notification_type']),
                            priority=NotificationPriority(row['priority']),
                            title=row['title'],
                            message=row['message'],
                            data=json.loads(row['data']) if row['data'] else {},
                            is_read=row['is_read'],
                            created_at=row['created_at'],
                            read_at=row['read_at'],
                            expires_at=row['expires_at']
                        )
                        notifications.append(notification)
                    
                    return notifications
                    
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            return []

    def mark_notification_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE notifications 
                        SET is_read = true, read_at = %s
                        WHERE id = %s AND user_id = %s
                    """, (datetime.now(), notification_id, user_id))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False

    def get_communication_preferences(self, user_id: str) -> Optional[CommunicationPreferences]:
        """Get communication preferences for a user"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT * FROM communication_preferences 
                        WHERE user_id = %s
                    """, (user_id,))
                    
                    row = cursor.fetchone()
                    if row:
                        return CommunicationPreferences(
                            user_id=str(row['user_id']),
                            email_notifications=row['email_notifications'],
                            push_notifications=row['push_notifications'],
                            sms_notifications=row['sms_notifications'],
                            in_app_notifications=row['in_app_notifications'],
                            notification_frequency=row['notification_frequency'],
                            quiet_hours_start=row['quiet_hours_start'],
                            quiet_hours_end=row['quiet_hours_end'],
                            preferred_language=row['preferred_language'],
                            timezone=row['timezone']
                        )
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting communication preferences: {e}")
            return None

    def update_communication_preferences(self, user_id: str, preferences: Dict) -> bool:
        """Update communication preferences for a user"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO communication_preferences 
                        (user_id, email_notifications, push_notifications, sms_notifications,
                         in_app_notifications, notification_frequency, quiet_hours_start,
                         quiet_hours_end, preferred_language, timezone, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (user_id) 
                        DO UPDATE SET 
                            email_notifications = EXCLUDED.email_notifications,
                            push_notifications = EXCLUDED.push_notifications,
                            sms_notifications = EXCLUDED.sms_notifications,
                            in_app_notifications = EXCLUDED.in_app_notifications,
                            notification_frequency = EXCLUDED.notification_frequency,
                            quiet_hours_start = EXCLUDED.quiet_hours_start,
                            quiet_hours_end = EXCLUDED.quiet_hours_end,
                            preferred_language = EXCLUDED.preferred_language,
                            timezone = EXCLUDED.timezone,
                            updated_at = EXCLUDED.updated_at
                    """, (
                        user_id,
                        preferences.get('email_notifications', True),
                        preferences.get('push_notifications', True),
                        preferences.get('sms_notifications', False),
                        preferences.get('in_app_notifications', True),
                        preferences.get('notification_frequency', 'immediate'),
                        preferences.get('quiet_hours_start', '22:00'),
                        preferences.get('quiet_hours_end', '08:00'),
                        preferences.get('preferred_language', 'en'),
                        preferences.get('timezone', 'Asia/Dubai'),
                        datetime.now()
                    ))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error updating communication preferences: {e}")
            return False

    def send_session_reminder(self, session_id: str, reminder_minutes: int = 30) -> bool:
        """Send session reminder notifications"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Get session details
                    cursor.execute(f"""
                        SELECT ms.*, 
                               mp.user_id as mentor_user_id,
                               {user_display_name('mentor_name', 'u_mentor')},
                               {user_display_name('mentee_name', 'u_mentee')}
                        FROM mentorship_sessions ms
                        JOIN mentor_profiles mp ON ms.mentor_id = mp.id
                        JOIN users u_mentor ON mp.user_id = u_mentor.id
                        JOIN users u_mentee ON ms.mentee_user_id = u_mentee.id
                        WHERE ms.id = %s
                    """, (session_id,))
                    
                    session = cursor.fetchone()
                    if not session:
                        return False
                    
                    # Send reminder to mentor
                    mentor_notification = {
                        'user_id': str(session['mentor_user_id']),
                        'notification_type': NotificationType.SESSION_REMINDER.value,
                        'priority': NotificationPriority.HIGH.value,
                        'title': 'Session Reminder',
                        'message': f"Reminder: You have a mentoring session with {session['mentee_name']} in {reminder_minutes} minutes",
                        'data': {
                            'session_id': session_id,
                            'session_date': session['scheduled_date'].isoformat(),
                            'participant': session['mentee_name']
                        }
                    }
                    
                    # Send reminder to mentee
                    mentee_notification = {
                        'user_id': str(session['mentee_user_id']),
                        'notification_type': NotificationType.SESSION_REMINDER.value,
                        'priority': NotificationPriority.HIGH.value,
                        'title': 'Session Reminder',
                        'message': f"Reminder: You have a mentoring session with {session['mentor_name']} in {reminder_minutes} minutes",
                        'data': {
                            'session_id': session_id,
                            'session_date': session['scheduled_date'].isoformat(),
                            'participant': session['mentor_name']
                        }
                    }
                    
                    # Create notifications
                    self.create_notification(mentor_notification)
                    self.create_notification(mentee_notification)
                    
                    # Mark reminder as sent
                    cursor.execute("""
                        UPDATE mentorship_sessions 
                        SET reminder_sent = true
                        WHERE id = %s
                    """, (session_id,))
                    
                    conn.commit()
                    return True
                    
        except Exception as e:
            logger.error(f"Error sending session reminder: {e}")
            return False

    def send_goal_deadline_reminder(self, goal_id: str) -> bool:
        """Send goal deadline reminder"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Get goal and mentorship details
                    cursor.execute("""
                        SELECT mg.*, 
                               mp.user_id as mentor_user_id,
                               mm.mentee_user_id
                        FROM mentorship_goals mg
                        JOIN mentorship_matching mm ON mg.mentorship_id = mm.id
                        JOIN mentor_profiles mp ON mm.mentor_id = mp.id
                        WHERE mg.id = %s
                    """, (goal_id,))
                    
                    goal = cursor.fetchone()
                    if not goal:
                        return False
                    
                    # Calculate days until deadline
                    days_until = (goal['target_date'] - datetime.now()).days
                    
                    # Send reminder to mentor
                    mentor_notification = {
                        'user_id': str(goal['mentor_user_id']),
                        'notification_type': NotificationType.GOAL_DEADLINE.value,
                        'priority': NotificationPriority.MEDIUM.value,
                        'title': 'Goal Deadline Approaching',
                        'message': f"Goal '{goal['title']}' is due in {days_until} days. Current progress: {goal['completion_percentage']}%",
                        'data': {
                            'goal_id': goal_id,
                            'goal_title': goal['title'],
                            'deadline': goal['target_date'].isoformat(),
                            'progress': float(goal['completion_percentage'])
                        }
                    }
                    
                    # Send reminder to mentee
                    mentee_notification = {
                        'user_id': str(goal['mentee_user_id']),
                        'notification_type': NotificationType.GOAL_DEADLINE.value,
                        'priority': NotificationPriority.MEDIUM.value,
                        'title': 'Goal Deadline Approaching',
                        'message': f"Your goal '{goal['title']}' is due in {days_until} days. Current progress: {goal['completion_percentage']}%",
                        'data': {
                            'goal_id': goal_id,
                            'goal_title': goal['title'],
                            'deadline': goal['target_date'].isoformat(),
                            'progress': float(goal['completion_percentage'])
                        }
                    }
                    
                    # Create notifications
                    self.create_notification(mentor_notification)
                    self.create_notification(mentee_notification)
                    
                    conn.commit()
                    return True
                    
        except Exception as e:
            logger.error(f"Error sending goal deadline reminder: {e}")
            return False

    def send_milestone_achievement_notification(self, milestone_id: str) -> bool:
        """Send milestone achievement notification"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Get milestone and related details
                    cursor.execute("""
                        SELECT gm.*, mg.title as goal_title,
                               mp.user_id as mentor_user_id,
                               mm.mentee_user_id
                        FROM goal_milestones gm
                        JOIN mentorship_goals mg ON gm.goal_id = mg.id
                        JOIN mentorship_matching mm ON mg.mentorship_id = mm.id
                        JOIN mentor_profiles mp ON mm.mentor_id = mp.id
                        WHERE gm.id = %s
                    """, (milestone_id,))
                    
                    milestone = cursor.fetchone()
                    if not milestone:
                        return False
                    
                    # Send notification to mentor
                    mentor_notification = {
                        'user_id': str(milestone['mentor_user_id']),
                        'notification_type': NotificationType.MILESTONE_DUE.value,
                        'priority': NotificationPriority.HIGH.value,
                        'title': 'Milestone Achieved!',
                        'message': f"Milestone '{milestone['title']}' has been achieved for goal '{milestone['goal_title']}'",
                        'data': {
                            'milestone_id': milestone_id,
                            'milestone_title': milestone['title'],
                            'goal_title': milestone['goal_title']
                        }
                    }
                    
                    # Send notification to mentee
                    mentee_notification = {
                        'user_id': str(milestone['mentee_user_id']),
                        'notification_type': NotificationType.MILESTONE_DUE.value,
                        'priority': NotificationPriority.HIGH.value,
                        'title': 'Congratulations!',
                        'message': f"You've achieved the milestone: '{milestone['title']}'!",
                        'data': {
                            'milestone_id': milestone_id,
                            'milestone_title': milestone['title'],
                            'goal_title': milestone['goal_title']
                        }
                    }
                    
                    # Create notifications
                    self.create_notification(mentor_notification)
                    self.create_notification(mentee_notification)
                    
                    conn.commit()
                    return True
                    
        except Exception as e:
            logger.error(f"Error sending milestone achievement notification: {e}")
            return False

    def get_unread_message_count(self, user_id: str) -> int:
        """Get count of unread messages for a user"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT COUNT(*) FROM messages 
                        WHERE recipient_id = %s AND status != %s
                    """, (user_id, MessageStatus.READ.value))
                    
                    result = cursor.fetchone()
                    return result[0] if result else 0
                    
        except Exception as e:
            logger.error(f"Error getting unread message count: {e}")
            return 0

    def get_unread_notification_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT COUNT(*) FROM notifications 
                        WHERE user_id = %s AND is_read = false
                        AND (expires_at IS NULL OR expires_at > %s)
                    """, (user_id, datetime.now()))
                    
                    result = cursor.fetchone()
                    return result[0] if result else 0
                    
        except Exception as e:
            logger.error(f"Error getting unread notification count: {e}")
            return 0

    def search_messages(self, user_id: str, query: str, conversation_id: Optional[str] = None) -> List[Message]:
        """Search messages for a user"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    where_clause = """
                        WHERE (m.sender_id = %s OR m.recipient_id = %s)
                        AND m.content ILIKE %s
                    """
                    params = [user_id, user_id, f'%{query}%']
                    
                    if conversation_id:
                        where_clause += " AND m.conversation_id = %s"
                        params.append(conversation_id)
                    
                    cursor.execute(f"""
                        SELECT m.*, 
                               {user_display_name('sender_name')}
                        FROM messages m
                        JOIN users u ON m.sender_id = u.id
                        {where_clause}
                        ORDER BY m.sent_at DESC
                        LIMIT 100
                    """, params)
                    
                    messages = []
                    for row in cursor.fetchall():
                        message = Message(
                            id=str(row['id']),
                            conversation_id=str(row['conversation_id']),
                            sender_id=str(row['sender_id']),
                            recipient_id=str(row['recipient_id']),
                            message_type=MessageType(row['message_type']),
                            content=row['content'],
                            attachments=json.loads(row['attachments']) if row['attachments'] else [],
                            metadata=json.loads(row['metadata']) if row['metadata'] else {},
                            status=MessageStatus(row['status']),
                            sent_at=row['sent_at'],
                            delivered_at=row['delivered_at'],
                            read_at=row['read_at'],
                            reply_to_id=str(row['reply_to_id']) if row['reply_to_id'] else None,
                            is_edited=row.get('is_edited', False),
                            edited_at=row.get('edited_at')
                        )
                        messages.append(message)
                    
                    return messages
                    
        except Exception as e:
            logger.error(f"Error searching messages: {e}")
            return []

    def delete_message(self, message_id: str, user_id: str) -> bool:
        """Delete a message (soft delete)"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE messages 
                        SET content = '[Message deleted]', 
                            attachments = '[]',
                            is_edited = true,
                            edited_at = %s
                        WHERE id = %s AND sender_id = %s
                    """, (datetime.now(), message_id, user_id))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error deleting message: {e}")
            return False

    def edit_message(self, message_id: str, user_id: str, new_content: str) -> bool:
        """Edit a message"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE messages 
                        SET content = %s, 
                            is_edited = true,
                            edited_at = %s
                        WHERE id = %s AND sender_id = %s
                    """, (new_content, datetime.now(), message_id, user_id))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error editing message: {e}")
            return False
