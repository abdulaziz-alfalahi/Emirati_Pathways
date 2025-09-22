"""
Administrator System Core Module

This module provides the core functionality for the Administrator persona,
including user management, system monitoring, and administrative operations.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from flask import current_app
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import jwt
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AdminUser:
    """Data class for administrator user information"""
    id: int
    username: str
    email: str
    full_name: str
    roles: List[str]
    permissions: List[str]
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime

@dataclass
class SystemMetric:
    """Data class for system metrics"""
    name: str
    value: float
    unit: str
    category: str
    recorded_at: datetime

class AdministratorSystem:
    """Core administrator system for managing platform operations"""
    
    def __init__(self, db_config: Dict[str, str]):
        """Initialize the administrator system with database configuration"""
        self.db_config = db_config
        self.connection = None
        self._connect_to_database()
    
    def _connect_to_database(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(
                host=self.db_config.get('host', 'localhost'),
                database=self.db_config.get('database', 'emirati_platform'),
                user=self.db_config.get('user', 'postgres'),
                password=self.db_config.get('password', ''),
                port=self.db_config.get('port', 5432)
            )
            logger.info("Successfully connected to database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}")
            raise
    
    def _execute_query(self, query: str, params: tuple = None, fetch: bool = True) -> List[Dict]:
        """Execute database query with error handling"""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                if fetch:
                    return [dict(row) for row in cursor.fetchall()]
                else:
                    self.connection.commit()
                    return []
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Database query failed: {str(e)}")
            raise
    
    def _log_admin_action(self, user_id: int, action: str, resource_type: str, 
                         resource_id: str = None, details: Dict = None, 
                         ip_address: str = None, user_agent: str = None):
        """Log administrative action for audit trail"""
        try:
            query = """
                INSERT INTO admin_audit_log 
                (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            params = (user_id, action, resource_type, resource_id, 
                     json.dumps(details) if details else None, ip_address, user_agent)
            self._execute_query(query, params, fetch=False)
            logger.info(f"Logged admin action: {action} on {resource_type} by user {user_id}")
        except Exception as e:
            logger.error(f"Failed to log admin action: {str(e)}")
    
    # User Management Methods
    
    def get_all_users(self, page: int = 1, per_page: int = 50, 
                     search: str = None, role_filter: str = None) -> Dict[str, Any]:
        """Get paginated list of all users with optional filtering"""
        try:
            offset = (page - 1) * per_page
            
            # Build base query
            base_query = """
                SELECT u.id, u.username, u.email, u.full_name, u.is_active, 
                       u.created_at, u.last_login,
                       ARRAY_AGG(DISTINCT r.name) as roles
                FROM users u
                LEFT JOIN admin_user_roles ur ON u.id = ur.user_id
                LEFT JOIN admin_roles r ON ur.role_id = r.id
            """
            
            conditions = []
            params = []
            
            if search:
                conditions.append("(u.username ILIKE %s OR u.email ILIKE %s OR u.full_name ILIKE %s)")
                search_param = f"%{search}%"
                params.extend([search_param, search_param, search_param])
            
            if role_filter:
                conditions.append("r.name = %s")
                params.append(role_filter)
            
            if conditions:
                base_query += " WHERE " + " AND ".join(conditions)
            
            base_query += " GROUP BY u.id, u.username, u.email, u.full_name, u.is_active, u.created_at, u.last_login"
            base_query += " ORDER BY u.created_at DESC LIMIT %s OFFSET %s"
            params.extend([per_page, offset])
            
            users = self._execute_query(base_query, tuple(params))
            
            # Get total count
            count_query = "SELECT COUNT(DISTINCT u.id) FROM users u"
            if conditions:
                count_query += " LEFT JOIN admin_user_roles ur ON u.id = ur.user_id"
                count_query += " LEFT JOIN admin_roles r ON ur.role_id = r.id"
                count_query += " WHERE " + " AND ".join(conditions[:-1] if role_filter else conditions)
            
            count_params = params[:-2] if not role_filter else params[:-3]
            total_count = self._execute_query(count_query, tuple(count_params))[0]['count']
            
            return {
                'users': users,
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            logger.error(f"Failed to get users: {str(e)}")
            raise
    
    def get_user_details(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific user"""
        try:
            query = """
                SELECT u.*, 
                       ARRAY_AGG(DISTINCT r.name) as roles,
                       ARRAY_AGG(DISTINCT r.permissions) as permissions
                FROM users u
                LEFT JOIN admin_user_roles ur ON u.id = ur.user_id
                LEFT JOIN admin_roles r ON ur.role_id = r.id
                WHERE u.id = %s
                GROUP BY u.id
            """
            result = self._execute_query(query, (user_id,))
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Failed to get user details: {str(e)}")
            raise
    
    def create_user(self, username: str, email: str, password: str, 
                   full_name: str, roles: List[str] = None, 
                   admin_user_id: int = None) -> Dict[str, Any]:
        """Create a new user account"""
        try:
            # Hash password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create user
            user_query = """
                INSERT INTO users (username, email, password_hash, full_name, is_active)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, username, email, full_name, is_active, created_at
            """
            user_result = self._execute_query(
                user_query, 
                (username, email, password_hash, full_name, True)
            )
            
            if not user_result:
                raise Exception("Failed to create user")
            
            user = user_result[0]
            user_id = user['id']
            
            # Assign roles if provided
            if roles:
                for role_name in roles:
                    role_query = "SELECT id FROM admin_roles WHERE name = %s"
                    role_result = self._execute_query(role_query, (role_name,))
                    
                    if role_result:
                        role_id = role_result[0]['id']
                        assignment_query = """
                            INSERT INTO admin_user_roles (user_id, role_id, assigned_by)
                            VALUES (%s, %s, %s)
                        """
                        self._execute_query(assignment_query, (user_id, role_id, admin_user_id), fetch=False)
            
            # Log action
            if admin_user_id:
                self._log_admin_action(
                    admin_user_id, 'create_user', 'user', str(user_id),
                    {'username': username, 'email': email, 'roles': roles}
                )
            
            return user
        except Exception as e:
            logger.error(f"Failed to create user: {str(e)}")
            raise
    
    def update_user(self, user_id: int, updates: Dict[str, Any], 
                   admin_user_id: int = None) -> Dict[str, Any]:
        """Update user information"""
        try:
            # Get current user data for logging
            current_user = self.get_user_details(user_id)
            if not current_user:
                raise Exception("User not found")
            
            # Build update query
            update_fields = []
            params = []
            
            allowed_fields = ['username', 'email', 'full_name', 'is_active']
            for field, value in updates.items():
                if field in allowed_fields:
                    update_fields.append(f"{field} = %s")
                    params.append(value)
            
            if not update_fields:
                raise Exception("No valid fields to update")
            
            params.append(user_id)
            
            query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, username, email, full_name, is_active, updated_at
            """
            
            result = self._execute_query(query, tuple(params))
            
            if admin_user_id:
                self._log_admin_action(
                    admin_user_id, 'update_user', 'user', str(user_id),
                    {'old_values': current_user, 'new_values': updates}
                )
            
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Failed to update user: {str(e)}")
            raise
    
    def suspend_user(self, user_id: int, admin_user_id: int, reason: str = None) -> bool:
        """Suspend a user account"""
        try:
            query = """
                UPDATE users 
                SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            self._execute_query(query, (user_id,), fetch=False)
            
            # Invalidate all user sessions
            session_query = """
                UPDATE admin_user_sessions 
                SET is_active = FALSE 
                WHERE user_id = %s
            """
            self._execute_query(session_query, (user_id,), fetch=False)
            
            self._log_admin_action(
                admin_user_id, 'suspend_user', 'user', str(user_id),
                {'reason': reason}
            )
            
            return True
        except Exception as e:
            logger.error(f"Failed to suspend user: {str(e)}")
            raise
    
    def activate_user(self, user_id: int, admin_user_id: int) -> bool:
        """Activate a suspended user account"""
        try:
            query = """
                UPDATE users 
                SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            self._execute_query(query, (user_id,), fetch=False)
            
            self._log_admin_action(
                admin_user_id, 'activate_user', 'user', str(user_id)
            )
            
            return True
        except Exception as e:
            logger.error(f"Failed to activate user: {str(e)}")
            raise
    
    # System Monitoring Methods
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive system health status"""
        try:
            health_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'healthy',
                'components': {}
            }
            
            # Database health
            try:
                db_query = "SELECT 1"
                self._execute_query(db_query)
                health_data['components']['database'] = {
                    'status': 'healthy',
                    'response_time_ms': 0  # Could measure actual response time
                }
            except Exception as e:
                health_data['components']['database'] = {
                    'status': 'unhealthy',
                    'error': str(e)
                }
                health_data['status'] = 'degraded'
            
            # User statistics
            try:
                user_stats = self._execute_query("""
                    SELECT 
                        COUNT(*) as total_users,
                        COUNT(*) FILTER (WHERE is_active = TRUE) as active_users,
                        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h
                    FROM users
                """)[0]
                health_data['components']['users'] = user_stats
            except Exception as e:
                health_data['components']['users'] = {'error': str(e)}
            
            # Content statistics
            try:
                content_stats = self._execute_query("""
                    SELECT 
                        COUNT(*) as total_content,
                        COUNT(*) FILTER (WHERE status = 'published') as published_content,
                        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_content_24h
                    FROM cms_content
                """)[0]
                health_data['components']['content'] = content_stats
            except Exception as e:
                health_data['components']['content'] = {'error': str(e)}
            
            return health_data
        except Exception as e:
            logger.error(f"Failed to get system health: {str(e)}")
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'error',
                'error': str(e)
            }
    
    def record_system_metric(self, metric_name: str, metric_value: float, 
                           metric_unit: str, metric_category: str, 
                           tags: Dict[str, Any] = None) -> bool:
        """Record a system metric for monitoring"""
        try:
            query = """
                INSERT INTO admin_system_metrics 
                (metric_name, metric_value, metric_unit, metric_category, tags)
                VALUES (%s, %s, %s, %s, %s)
            """
            params = (metric_name, metric_value, metric_unit, metric_category, 
                     json.dumps(tags) if tags else None)
            self._execute_query(query, params, fetch=False)
            return True
        except Exception as e:
            logger.error(f"Failed to record metric: {str(e)}")
            return False
    
    def get_system_metrics(self, metric_category: str = None, 
                          hours_back: int = 24) -> List[SystemMetric]:
        """Get system metrics for the specified time period"""
        try:
            query = """
                SELECT metric_name, metric_value, metric_unit, metric_category, recorded_at
                FROM admin_system_metrics
                WHERE recorded_at > NOW() - INTERVAL '%s hours'
            """
            params = [hours_back]
            
            if metric_category:
                query += " AND metric_category = %s"
                params.append(metric_category)
            
            query += " ORDER BY recorded_at DESC"
            
            results = self._execute_query(query, tuple(params))
            
            return [
                SystemMetric(
                    name=row['metric_name'],
                    value=float(row['metric_value']),
                    unit=row['metric_unit'],
                    category=row['metric_category'],
                    recorded_at=row['recorded_at']
                )
                for row in results
            ]
        except Exception as e:
            logger.error(f"Failed to get system metrics: {str(e)}")
            return []
    
    # Settings Management
    
    def get_system_settings(self, category: str = None, 
                           include_private: bool = False) -> Dict[str, Any]:
        """Get system settings"""
        try:
            query = """
                SELECT setting_key, setting_value, setting_type, category, description, is_public
                FROM admin_settings
            """
            params = []
            
            conditions = []
            if category:
                conditions.append("category = %s")
                params.append(category)
            
            if not include_private:
                conditions.append("is_public = TRUE")
            
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            
            query += " ORDER BY category, setting_key"
            
            results = self._execute_query(query, tuple(params))
            
            settings = {}
            for row in results:
                settings[row['setting_key']] = {
                    'value': json.loads(row['setting_value']),
                    'type': row['setting_type'],
                    'category': row['category'],
                    'description': row['description'],
                    'is_public': row['is_public']
                }
            
            return settings
        except Exception as e:
            logger.error(f"Failed to get system settings: {str(e)}")
            return {}
    
    def update_system_setting(self, setting_key: str, setting_value: Any, 
                             admin_user_id: int) -> bool:
        """Update a system setting"""
        try:
            # Get current value for logging
            current_query = "SELECT setting_value FROM admin_settings WHERE setting_key = %s"
            current_result = self._execute_query(current_query, (setting_key,))
            current_value = json.loads(current_result[0]['setting_value']) if current_result else None
            
            # Update setting
            query = """
                UPDATE admin_settings 
                SET setting_value = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP
                WHERE setting_key = %s
            """
            params = (json.dumps(setting_value), admin_user_id, setting_key)
            self._execute_query(query, params, fetch=False)
            
            self._log_admin_action(
                admin_user_id, 'update_setting', 'setting', setting_key,
                {'old_value': current_value, 'new_value': setting_value}
            )
            
            return True
        except Exception as e:
            logger.error(f"Failed to update system setting: {str(e)}")
            return False
    
    # Notification Management
    
    def create_system_notification(self, notification_type: str, title: str, 
                                 message: str, severity: str = 'info',
                                 target_user_id: int = None, action_url: str = None,
                                 expires_at: datetime = None) -> bool:
        """Create a system notification"""
        try:
            query = """
                INSERT INTO admin_notifications 
                (notification_type, title, message, severity, target_user_id, action_url, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            params = (notification_type, title, message, severity, target_user_id, action_url, expires_at)
            self._execute_query(query, params, fetch=False)
            return True
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")
            return False
    
    def get_notifications(self, target_user_id: int = None, 
                         unread_only: bool = False) -> List[Dict[str, Any]]:
        """Get system notifications"""
        try:
            query = """
                SELECT id, notification_type, title, message, severity, 
                       is_read, action_url, created_at
                FROM admin_notifications
                WHERE (target_user_id IS NULL OR target_user_id = %s)
                  AND (expires_at IS NULL OR expires_at > NOW())
                  AND is_dismissed = FALSE
            """
            params = [target_user_id]
            
            if unread_only:
                query += " AND is_read = FALSE"
            
            query += " ORDER BY created_at DESC LIMIT 50"
            
            return self._execute_query(query, tuple(params))
        except Exception as e:
            logger.error(f"Failed to get notifications: {str(e)}")
            return []
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")

# Utility functions for authentication and authorization

def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Implementation would check for valid admin session/token
        # This is a placeholder for the actual authentication logic
        return f(*args, **kwargs)
    return decorated_function

def permission_required(permission: str):
    """Decorator to require specific permission"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Implementation would check for specific permission
            # This is a placeholder for the actual authorization logic
            return f(*args, **kwargs)
        return decorated_function
    return decorator
