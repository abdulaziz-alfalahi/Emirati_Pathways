#!/usr/bin/env python3
"""
Real-Time Notification System for Emirati Journey Platform
Handles WebSocket connections, notification management, and real-time updates
"""

from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
import redis
import json
import jwt
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from enum import Enum
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NotificationType(Enum):
    JOB_ALERT = "job_alert"
    APPLICATION_UPDATE = "application_update"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    MENTORING_SESSION = "mentoring_session"
    EDUCATIONAL_CONTENT = "educational_content"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    MESSAGE = "message"
    ROLE_REQUEST = "role_request"
    ROLE_DECISION = "role_decision"

class NotificationPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationManager:
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.active_connections = {}  # user_id -> session_id mapping
        
    def create_notification(self, user_id: str, notification_type: NotificationType, 
                          title: str, message: str, data: Dict = None, 
                          priority: NotificationPriority = NotificationPriority.MEDIUM) -> str:
        """Create a new notification"""
        notification_id = str(uuid.uuid4())
        
        notification = {
            'id': notification_id,
            'user_id': user_id,
            'type': notification_type.value,
            'title': title,
            'message': message,
            'data': data or {},
            'priority': priority.value,
            'created_at': datetime.now().isoformat(),
            'read': False,
            'delivered': False
        }
        
        # Store notification in Redis
        self.redis_client.hset(
            f"notifications:{user_id}", 
            notification_id, 
            json.dumps(notification)
        )
        
        # Add to unread notifications list
        self.redis_client.lpush(f"unread:{user_id}", notification_id)
        
        # Set expiration for notifications (30 days)
        self.redis_client.expire(f"notifications:{user_id}", 30 * 24 * 60 * 60)
        self.redis_client.expire(f"unread:{user_id}", 30 * 24 * 60 * 60)
        
        logger.info(f"Created notification {notification_id} for user {user_id}")
        return notification_id
    
    def get_user_notifications(self, user_id: str, limit: int = 50, 
                             unread_only: bool = False) -> List[Dict]:
        """Get notifications for a user"""
        if unread_only:
            notification_ids = self.redis_client.lrange(f"unread:{user_id}", 0, limit - 1)
        else:
            all_notifications = self.redis_client.hgetall(f"notifications:{user_id}")
            notification_ids = list(all_notifications.keys())[:limit]
        
        notifications = []
        for notification_id in notification_ids:
            notification_data = self.redis_client.hget(f"notifications:{user_id}", notification_id)
            if notification_data:
                notifications.append(json.loads(notification_data))
        
        # Sort by created_at descending
        notifications.sort(key=lambda x: x['created_at'], reverse=True)
        return notifications
    
    def mark_notification_read(self, user_id: str, notification_id: str) -> bool:
        """Mark a notification as read"""
        notification_data = self.redis_client.hget(f"notifications:{user_id}", notification_id)
        if notification_data:
            notification = json.loads(notification_data)
            notification['read'] = True
            notification['read_at'] = datetime.now().isoformat()
            
            # Update in Redis
            self.redis_client.hset(
                f"notifications:{user_id}", 
                notification_id, 
                json.dumps(notification)
            )
            
            # Remove from unread list
            self.redis_client.lrem(f"unread:{user_id}", 1, notification_id)
            
            logger.info(f"Marked notification {notification_id} as read for user {user_id}")
            return True
        return False
    
    def mark_all_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        unread_ids = self.redis_client.lrange(f"unread:{user_id}", 0, -1)
        count = 0
        
        for notification_id in unread_ids:
            if self.mark_notification_read(user_id, notification_id.decode('utf-8')):
                count += 1
        
        return count
    
    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        return self.redis_client.llen(f"unread:{user_id}")
    
    def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a notification"""
        # Remove from notifications hash
        result = self.redis_client.hdel(f"notifications:{user_id}", notification_id)
        
        # Remove from unread list if present
        self.redis_client.lrem(f"unread:{user_id}", 1, notification_id)
        
        if result:
            logger.info(f"Deleted notification {notification_id} for user {user_id}")
            return True
        return False

class RealTimeNotificationSystem:
    def __init__(self, app: Flask, redis_url: str = "redis://localhost:6379/0", socketio=None):
        self.app = app
        
        if socketio:
            self.socketio = socketio
            logger.info("Using provided SocketIO instance")
        else:
            self.socketio = SocketIO(
                app, 
                cors_allowed_origins="*",
                async_mode='eventlet',
                logger=True,
                engineio_logger=True
            )
        
        # Initialize Redis client
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()  # Test connection
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            # Fallback to in-memory storage for development
            self.redis_client = None
        
        self.notification_manager = NotificationManager(self.redis_client)
        self.setup_socket_handlers()
    
    def setup_socket_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.socketio.on('connect')
        def handle_connect(auth):
            """Handle client connection"""
            try:
                # Verify JWT token
                token = auth.get('token') if auth else None
                if not token:
                    logger.warning("Connection attempt without token")
                    disconnect()
                    return False
                
                # Decode JWT token (simplified - in production, use proper JWT verification)
                try:
                    # For demo purposes, we'll extract user_id from token
                    # In production, properly verify the JWT signature
                    payload = jwt.decode(token, options={"verify_signature": False})
                    user_id = payload.get('user_id')
                    user_type = payload.get('user_type', 'job_seeker')
                    
                    if not user_id:
                        disconnect()
                        return False
                    
                except Exception as e:
                    logger.error(f"Invalid token: {e}")
                    disconnect()
                    return False
                
                # Store connection info
                session_id = request.sid
                self.notification_manager.active_connections[user_id] = session_id
                
                # Join user-specific room
                join_room(f"user_{user_id}")
                
                # Join persona-specific room
                join_room(f"persona_{user_type}")
                
                # Send initial data
                unread_count = self.notification_manager.get_unread_count(user_id)
                recent_notifications = self.notification_manager.get_user_notifications(
                    user_id, limit=10
                )
                
                emit('connection_established', {
                    'status': 'connected',
                    'user_id': user_id,
                    'unread_count': unread_count,
                    'recent_notifications': recent_notifications
                })
                
                logger.info(f"User {user_id} connected with session {session_id}")
                
            except Exception as e:
                logger.error(f"Connection error: {e}")
                disconnect()
                return False
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection"""
            session_id = request.sid
            
            # Find and remove user from active connections
            user_id = None
            for uid, sid in self.notification_manager.active_connections.items():
                if sid == session_id:
                    user_id = uid
                    break
            
            if user_id:
                del self.notification_manager.active_connections[user_id]
                logger.info(f"User {user_id} disconnected")
        
        @self.socketio.on('get_notifications')
        def handle_get_notifications(data):
            """Handle request for notifications"""
            try:
                user_id = data.get('user_id')
                limit = data.get('limit', 20)
                unread_only = data.get('unread_only', False)
                
                notifications = self.notification_manager.get_user_notifications(
                    user_id, limit, unread_only
                )
                
                emit('notifications_data', {
                    'notifications': notifications,
                    'unread_count': self.notification_manager.get_unread_count(user_id)
                })
                
            except Exception as e:
                logger.error(f"Error getting notifications: {e}")
                emit('error', {'message': 'Failed to get notifications'})
        
        @self.socketio.on('mark_read')
        def handle_mark_read(data):
            """Handle marking notification as read"""
            try:
                user_id = data.get('user_id')
                notification_id = data.get('notification_id')
                
                if notification_id == 'all':
                    count = self.notification_manager.mark_all_read(user_id)
                    emit('notifications_updated', {
                        'action': 'mark_all_read',
                        'count': count,
                        'unread_count': 0
                    })
                else:
                    success = self.notification_manager.mark_notification_read(user_id, notification_id)
                    if success:
                        emit('notifications_updated', {
                            'action': 'mark_read',
                            'notification_id': notification_id,
                            'unread_count': self.notification_manager.get_unread_count(user_id)
                        })
                
            except Exception as e:
                logger.error(f"Error marking notification as read: {e}")
                emit('error', {'message': 'Failed to mark notification as read'})
        
        @self.socketio.on('delete_notification')
        def handle_delete_notification(data):
            """Handle deleting notification"""
            try:
                user_id = data.get('user_id')
                notification_id = data.get('notification_id')
                
                success = self.notification_manager.delete_notification(user_id, notification_id)
                if success:
                    emit('notifications_updated', {
                        'action': 'delete',
                        'notification_id': notification_id,
                        'unread_count': self.notification_manager.get_unread_count(user_id)
                    })
                
            except Exception as e:
                logger.error(f"Error deleting notification: {e}")
                emit('error', {'message': 'Failed to delete notification'})
    
    def send_notification(self, user_id: str, notification_type: NotificationType,
                         title: str, message: str, data: Dict = None,
                         priority: NotificationPriority = NotificationPriority.MEDIUM):
        """Send real-time notification to user"""
        try:
            # Create notification
            notification_id = self.notification_manager.create_notification(
                user_id, notification_type, title, message, data, priority
            )
            
            # Send real-time update if user is connected
            if user_id in self.notification_manager.active_connections:
                notification_data = {
                    'id': notification_id,
                    'type': notification_type.value,
                    'title': title,
                    'message': message,
                    'data': data or {},
                    'priority': priority.value,
                    'created_at': datetime.now().isoformat(),
                    'read': False
                }
                
                self.socketio.emit('new_notification', {
                    'notification': notification_data,
                    'unread_count': self.notification_manager.get_unread_count(user_id)
                }, room=f"user_{user_id}")
                
                logger.info(f"Sent real-time notification {notification_id} to user {user_id}")
            
            return notification_id
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return None
    
    def broadcast_to_persona(self, persona_type: str, notification_type: NotificationType,
                           title: str, message: str, data: Dict = None):
        """Broadcast notification to all users of a specific persona"""
        try:
            self.socketio.emit('broadcast_notification', {
                'type': notification_type.value,
                'title': title,
                'message': message,
                'data': data or {},
                'created_at': datetime.now().isoformat()
            }, room=f"persona_{persona_type}")
            
            logger.info(f"Broadcasted notification to {persona_type} users")
            
        except Exception as e:
            logger.error(f"Error broadcasting notification: {e}")
    
    def get_socketio(self):
        """Get SocketIO instance for integration with Flask app"""
        return self.socketio

# Notification helper functions for different scenarios
class NotificationHelpers:
    def __init__(self, notification_system: RealTimeNotificationSystem):
        self.notification_system = notification_system
    
    def job_application_status_update(self, user_id: str, job_title: str, 
                                    company: str, status: str):
        """Send job application status update notification"""
        status_messages = {
            'submitted': f"Your application for {job_title} at {company} has been submitted successfully.",
            'under_review': f"Your application for {job_title} at {company} is now under review.",
            'interview_scheduled': f"Interview scheduled for {job_title} position at {company}.",
            'accepted': f"Congratulations! Your application for {job_title} at {company} has been accepted.",
            'rejected': f"Your application for {job_title} at {company} was not successful this time."
        }
        
        priority = NotificationPriority.CRITICAL if status in ['interview_scheduled', 'accepted'] else NotificationPriority.HIGH
        
        self.notification_system.send_notification(
            user_id=user_id,
            notification_type=NotificationType.APPLICATION_UPDATE,
            title=f"Application Update - {job_title}",
            message=status_messages.get(status, f"Application status updated to: {status}"),
            data={'job_title': job_title, 'company': company, 'status': status},
            priority=priority
        )
    
    def new_job_alert(self, user_id: str, job_title: str, company: str, 
                     location: str, job_id: str):
        """Send new job alert notification"""
        self.notification_system.send_notification(
            user_id=user_id,
            notification_type=NotificationType.JOB_ALERT,
            title="New Job Opportunity",
            message=f"New {job_title} position available at {company} in {location}",
            data={'job_id': job_id, 'job_title': job_title, 'company': company, 'location': location},
            priority=NotificationPriority.HIGH
        )
    
    def mentoring_session_reminder(self, user_id: str, mentor_name: str, 
                                 session_time: str, session_id: str):
        """Send mentoring session reminder"""
        self.notification_system.send_notification(
            user_id=user_id,
            notification_type=NotificationType.MENTORING_SESSION,
            title="Mentoring Session Reminder",
            message=f"You have a mentoring session with {mentor_name} at {session_time}",
            data={'mentor_name': mentor_name, 'session_time': session_time, 'session_id': session_id},
            priority=NotificationPriority.HIGH
        )
    
    def educational_content_update(self, user_id: str, content_title: str, 
                                 content_type: str, educator_name: str):
        """Send educational content update notification"""
        self.notification_system.send_notification(
            user_id=user_id,
            notification_type=NotificationType.EDUCATIONAL_CONTENT,
            title="New Educational Content",
            message=f"New {content_type} '{content_title}' shared by {educator_name}",
            data={'content_title': content_title, 'content_type': content_type, 'educator_name': educator_name},
            priority=NotificationPriority.MEDIUM
        )
    
    def system_announcement(self, message: str, persona_types: List[str] = None):
        """Send system announcement to specified personas or all users"""
        if persona_types:
            for persona_type in persona_types:
                self.notification_system.broadcast_to_persona(
                    persona_type=persona_type,
                    notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
                    title="System Announcement",
                    message=message
                )
        else:
            # Broadcast to all persona types
            for persona_type in ['job_seeker', 'hr_recruiter', 'mentor', 'educator']:
                self.notification_system.broadcast_to_persona(
                    persona_type=persona_type,
                    notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
                    title="System Announcement",
                    message=message
                )

# Initialize notification system (to be imported by main app)
def create_notification_system(app: Flask, redis_url: str = "redis://localhost:6379/0", socketio=None):
    """Factory function to create notification system"""
    notification_system = RealTimeNotificationSystem(app, redis_url, socketio=socketio)
    notification_helpers = NotificationHelpers(notification_system)
    
    return notification_system, notification_helpers
