"""
Communication Service for Emirati Journey Platform
Real-time messaging, notifications, and automated communication workflows
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
    INTERVIEW_REMINDER = "interview_reminder"
    OFFER_MADE = "offer_made"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    APPLICATION_REJECTED = "application_rejected"
    NEW_JOB_MATCH = "new_job_match"
    PROFILE_VIEWED = "profile_viewed"

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
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
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
            'user_id': self.user_id,
            'notification_type': self.notification_type.value,
            'title': self.title,
            'content': self.content,
            'channels': [channel.value for channel in self.channels],
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None
        }

@dataclass
class Conversation:
    id: str
    participants: List[str]
    application_id: Optional[str]
    job_id: Optional[str]
    title: str
    created_at: datetime
    last_message_at: Optional[datetime] = None
    is_active: bool = True
    
    def to_dict(self):
        return {
            'id': self.id,
            'participants': self.participants,
            'application_id': self.application_id,
            'job_id': self.job_id,
            'title': self.title,
            'created_at': self.created_at.isoformat(),
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
            'is_active': self.is_active
        }

class CommunicationService:
    """
    Comprehensive communication service for messaging, notifications, and workflows
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Mock storage (would be database in production)
        self.messages_db = {}
        self.conversations_db = {}
        self.notifications_db = {}
        
        # Email configuration (would be from environment variables)
        self.email_config = {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'email': 'noreply@emiratijourney.ae',
            'password': 'your-app-password',  # Would be from env vars
            'enabled': False  # Set to True when email is configured
        }
        
        # Notification templates
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
            NotificationType.INTERVIEW_SCHEDULED: {
                'title': 'Interview Scheduled',
                'content': 'An interview has been scheduled for {job_title} on {interview_date}.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS]
            },
            NotificationType.INTERVIEW_REMINDER: {
                'title': 'Interview Reminder',
                'content': 'Reminder: You have an interview for {job_title} tomorrow at {interview_time}.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS]
            },
            NotificationType.OFFER_MADE: {
                'title': 'Job Offer Received',
                'content': 'Congratulations! You have received a job offer for {job_title} at {company_name}.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS]
            },
            NotificationType.OFFER_ACCEPTED: {
                'title': 'Offer Accepted',
                'content': 'The candidate has accepted your offer for {job_title}.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.OFFER_DECLINED: {
                'title': 'Offer Declined',
                'content': 'The candidate has declined your offer for {job_title}.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.APPLICATION_REJECTED: {
                'title': 'Application Update',
                'content': 'Thank you for your interest in {job_title}. We have decided to move forward with other candidates.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.NEW_JOB_MATCH: {
                'title': 'New Job Match Found',
                'content': 'We found a new job that matches your profile: {job_title} at {company_name}.',
                'channels': [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
            },
            NotificationType.PROFILE_VIEWED: {
                'title': 'Profile Viewed',
                'content': 'Your profile was viewed by {company_name}.',
                'channels': [NotificationChannel.IN_APP]
            }
        }
    
    def create_conversation(self, participants: List[str], application_id: Optional[str] = None, 
                          job_id: Optional[str] = None, title: str = "Conversation") -> Conversation:
        """Create a new conversation between participants"""
        try:
            conversation_id = str(uuid.uuid4())
            
            conversation = Conversation(
                id=conversation_id,
                participants=participants,
                application_id=application_id,
                job_id=job_id,
                title=title,
                created_at=datetime.utcnow()
            )
            
            self.conversations_db[conversation_id] = conversation
            
            self.logger.info(f"Conversation created: {conversation_id} with participants: {participants}")
            
            return conversation
            
        except Exception as e:
            self.logger.error(f"Error creating conversation: {str(e)}")
            raise
    
    def send_message(self, sender_id: str, recipient_id: str, content: str, 
                    message_type: MessageType = MessageType.TEXT, 
                    conversation_id: Optional[str] = None,
                    metadata: Dict[str, Any] = None) -> Message:
        """Send a message between users"""
        try:
            # Find or create conversation
            if not conversation_id:
                # Look for existing conversation between these participants
                existing_conversation = None
                for conv in self.conversations_db.values():
                    if set(conv.participants) == {sender_id, recipient_id}:
                        existing_conversation = conv
                        break
                
                if existing_conversation:
                    conversation_id = existing_conversation.id
                else:
                    # Create new conversation
                    new_conversation = self.create_conversation([sender_id, recipient_id])
                    conversation_id = new_conversation.id
            
            # Create message
            message_id = str(uuid.uuid4())
            message = Message(
                id=message_id,
                conversation_id=conversation_id,
                sender_id=sender_id,
                recipient_id=recipient_id,
                message_type=message_type,
                content=content,
                metadata=metadata or {},
                status=MessageStatus.SENT,
                created_at=datetime.utcnow()
            )
            
            # Store message
            self.messages_db[message_id] = message
            
            # Update conversation
            if conversation_id in self.conversations_db:
                self.conversations_db[conversation_id].last_message_at = datetime.utcnow()
            
            self.logger.info(f"Message sent: {message_id} from {sender_id} to {recipient_id}")
            
            return message
            
        except Exception as e:
            self.logger.error(f"Error sending message: {str(e)}")
            raise
    
    def get_conversation_messages(self, conversation_id: str, limit: int = 50, 
                                offset: int = 0) -> List[Message]:
        """Get messages from a conversation"""
        try:
            messages = [msg for msg in self.messages_db.values() 
                       if msg.conversation_id == conversation_id]
            
            # Sort by creation time (newest first)
            messages.sort(key=lambda x: x.created_at, reverse=True)
            
            # Apply pagination
            return messages[offset:offset + limit]
            
        except Exception as e:
            self.logger.error(f"Error getting conversation messages: {str(e)}")
            return []
    
    def get_user_conversations(self, user_id: str) -> List[Conversation]:
        """Get all conversations for a user"""
        try:
            conversations = [conv for conv in self.conversations_db.values() 
                           if user_id in conv.participants and conv.is_active]
            
            # Sort by last message time (newest first)
            conversations.sort(key=lambda x: x.last_message_at or x.created_at, reverse=True)
            
            return conversations
            
        except Exception as e:
            self.logger.error(f"Error getting user conversations: {str(e)}")
            return []
    
    def mark_message_as_read(self, message_id: str, user_id: str) -> bool:
        """Mark a message as read"""
        try:
            message = self.messages_db.get(message_id)
            if not message:
                return False
            
            # Only recipient can mark as read
            if message.recipient_id != user_id:
                return False
            
            message.read_at = datetime.utcnow()
            message.status = MessageStatus.READ
            
            self.messages_db[message_id] = message
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error marking message as read: {str(e)}")
            return False
    
    def create_notification(self, user_id: str, notification_type: NotificationType, 
                          metadata: Dict[str, Any] = None) -> Notification:
        """Create and send a notification"""
        try:
            template = self.notification_templates.get(notification_type)
            if not template:
                raise ValueError(f"No template found for notification type: {notification_type}")
            
            metadata = metadata or {}
            
            # Format content with metadata
            title = template['title'].format(**metadata) if metadata else template['title']
            content = template['content'].format(**metadata) if metadata else template['content']
            
            notification_id = str(uuid.uuid4())
            notification = Notification(
                id=notification_id,
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                content=content,
                channels=template['channels'],
                metadata=metadata,
                created_at=datetime.utcnow()
            )
            
            # Store notification
            self.notifications_db[notification_id] = notification
            
            # Send through configured channels
            self._send_notification(notification)
            
            self.logger.info(f"Notification created: {notification_id} for user {user_id}")
            
            return notification
            
        except Exception as e:
            self.logger.error(f"Error creating notification: {str(e)}")
            raise
    
    def _send_notification(self, notification: Notification):
        """Send notification through configured channels"""
        try:
            for channel in notification.channels:
                if channel == NotificationChannel.IN_APP:
                    # In-app notifications are stored and displayed in UI
                    pass
                elif channel == NotificationChannel.EMAIL:
                    self._send_email_notification(notification)
                elif channel == NotificationChannel.SMS:
                    self._send_sms_notification(notification)
                elif channel == NotificationChannel.PUSH:
                    self._send_push_notification(notification)
            
            notification.sent_at = datetime.utcnow()
            self.notifications_db[notification.id] = notification
            
        except Exception as e:
            self.logger.error(f"Error sending notification: {str(e)}")
    
    def _send_email_notification(self, notification: Notification):
        """Send email notification"""
        try:
            if not self.email_config['enabled']:
                self.logger.info(f"Email disabled - would send: {notification.title}")
                return
            
            # TODO: Get user email from user service
            recipient_email = f"user_{notification.user_id}@example.com"
            
            msg = MIMEMultipart()
            msg['From'] = self.email_config['email']
            msg['To'] = recipient_email
            msg['Subject'] = notification.title
            
            # Create HTML email body
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; font-size: 24px;">🇦🇪 Emirati Journey</h1>
                        </div>
                        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #667eea; margin-top: 0;">{notification.title}</h2>
                            <p style="font-size: 16px; margin-bottom: 20px;">{notification.content}</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://emiratijourney.ae/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                            <p>This is an automated message from Emirati Journey Platform</p>
                        </div>
                    </div>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email (commented out for demo)
            # server = smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port'])
            # server.starttls()
            # server.login(self.email_config['email'], self.email_config['password'])
            # server.send_message(msg)
            # server.quit()
            
            self.logger.info(f"Email notification sent to {recipient_email}")
            
        except Exception as e:
            self.logger.error(f"Error sending email notification: {str(e)}")
    
    def _send_sms_notification(self, notification: Notification):
        """Send SMS notification"""
        try:
            # TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
            self.logger.info(f"SMS notification would be sent: {notification.title}")
            
        except Exception as e:
            self.logger.error(f"Error sending SMS notification: {str(e)}")
    
    def _send_push_notification(self, notification: Notification):
        """Send push notification"""
        try:
            # TODO: Integrate with push notification service (Firebase, etc.)
            self.logger.info(f"Push notification would be sent: {notification.title}")
            
        except Exception as e:
            self.logger.error(f"Error sending push notification: {str(e)}")
    
    def get_user_notifications(self, user_id: str, limit: int = 20, 
                             unread_only: bool = False) -> List[Notification]:
        """Get notifications for a user"""
        try:
            notifications = [notif for notif in self.notifications_db.values() 
                           if notif.user_id == user_id]
            
            if unread_only:
                notifications = [notif for notif in notifications if not notif.read_at]
            
            # Sort by creation time (newest first)
            notifications.sort(key=lambda x: x.created_at, reverse=True)
            
            return notifications[:limit]
            
        except Exception as e:
            self.logger.error(f"Error getting user notifications: {str(e)}")
            return []
    
    def mark_notification_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read"""
        try:
            notification = self.notifications_db.get(notification_id)
            if not notification or notification.user_id != user_id:
                return False
            
            notification.read_at = datetime.utcnow()
            self.notifications_db[notification_id] = notification
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error marking notification as read: {str(e)}")
            return False
    
    def send_application_status_update(self, application_id: str, candidate_id: str, 
                                     recruiter_id: str, new_status: str, 
                                     job_title: str, company_name: str):
        """Send automated notification for application status update"""
        try:
            # Determine notification type based on status
            notification_type_map = {
                'submitted': NotificationType.APPLICATION_SUBMITTED,
                'under_review': NotificationType.APPLICATION_REVIEWED,
                'interview_scheduled': NotificationType.INTERVIEW_SCHEDULED,
                'offer_made': NotificationType.OFFER_MADE,
                'offer_accepted': NotificationType.OFFER_ACCEPTED,
                'offer_declined': NotificationType.OFFER_DECLINED,
                'rejected': NotificationType.APPLICATION_REJECTED
            }
            
            notification_type = notification_type_map.get(new_status)
            if not notification_type:
                return
            
            metadata = {
                'application_id': application_id,
                'job_title': job_title,
                'company_name': company_name,
                'new_status': new_status
            }
            
            # Send notification to candidate
            self.create_notification(candidate_id, notification_type, metadata)
            
            # Send notification to recruiter for certain events
            if new_status in ['offer_accepted', 'offer_declined']:
                recruiter_notification_type = NotificationType.OFFER_ACCEPTED if new_status == 'offer_accepted' else NotificationType.OFFER_DECLINED
                self.create_notification(recruiter_id, recruiter_notification_type, metadata)
            
            # Create system message in conversation
            conversation_title = f"Application: {job_title}"
            conversation = self.create_conversation([candidate_id, recruiter_id], 
                                                  application_id=application_id, 
                                                  title=conversation_title)
            
            system_message = f"Application status updated to: {new_status.replace('_', ' ').title()}"
            self.send_message("system", candidate_id, system_message, 
                            MessageType.SYSTEM, conversation.id, metadata)
            
        except Exception as e:
            self.logger.error(f"Error sending application status update: {str(e)}")
    
    def schedule_interview_reminder(self, application_id: str, candidate_id: str, 
                                  interview_date: datetime, job_title: str):
        """Schedule interview reminder notification"""
        try:
            # Calculate reminder time (24 hours before interview)
            reminder_time = interview_date - timedelta(hours=24)
            
            if reminder_time > datetime.utcnow():
                metadata = {
                    'application_id': application_id,
                    'job_title': job_title,
                    'interview_date': interview_date.strftime('%Y-%m-%d'),
                    'interview_time': interview_date.strftime('%H:%M')
                }
                
                # TODO: Implement scheduled notification system
                # For now, just log the scheduled reminder
                self.logger.info(f"Interview reminder scheduled for {reminder_time} - Application: {application_id}")
                
        except Exception as e:
            self.logger.error(f"Error scheduling interview reminder: {str(e)}")
    
    def get_communication_stats(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get communication statistics"""
        try:
            if user_id:
                # User-specific stats
                user_messages = [msg for msg in self.messages_db.values() 
                               if msg.sender_id == user_id or msg.recipient_id == user_id]
                user_notifications = [notif for notif in self.notifications_db.values() 
                                    if notif.user_id == user_id]
                user_conversations = [conv for conv in self.conversations_db.values() 
                                    if user_id in conv.participants]
                
                unread_messages = len([msg for msg in user_messages 
                                     if msg.recipient_id == user_id and not msg.read_at])
                unread_notifications = len([notif for notif in user_notifications 
                                          if not notif.read_at])
                
                return {
                    'total_messages': len(user_messages),
                    'unread_messages': unread_messages,
                    'total_notifications': len(user_notifications),
                    'unread_notifications': unread_notifications,
                    'active_conversations': len(user_conversations)
                }
            else:
                # Platform-wide stats
                return {
                    'total_messages': len(self.messages_db),
                    'total_notifications': len(self.notifications_db),
                    'total_conversations': len(self.conversations_db),
                    'active_conversations': len([conv for conv in self.conversations_db.values() if conv.is_active])
                }
                
        except Exception as e:
            self.logger.error(f"Error getting communication stats: {str(e)}")
            return {}

# Global communication service instance
communication_service = CommunicationService()

