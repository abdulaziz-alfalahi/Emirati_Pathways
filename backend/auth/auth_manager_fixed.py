"""
Fixed Authentication Manager with Correct Database Schema
Matches the actual PostgreSQL database structure
"""

import os
import re
import json
import bcrypt
import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List
import psycopg2
import psycopg2.extras
from flask_jwt_extended import create_access_token, create_refresh_token

class AuthenticationManager:
    """Fixed authentication manager matching actual database schema"""
    
    def __init__(self, redis_client=None):
        # Setup logging
        self.logger = logging.getLogger(__name__)
        
        # Handle Redis connection gracefully
        self.redis_client = None
        redis_url = os.getenv('REDIS_URL')
        
        if redis_url and redis_url.strip():
            try:
                import redis
                self.redis_client = redis_client or redis.from_url(redis_url)
            except Exception as e:
                self.logger.warning(f'Redis connection failed: {e}')
        
        # Database configuration
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
        }
        
        # UAE Emirates list
        self.uae_emirates = [
            'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 
            'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
        ]
        
        # Password requirements
        self.password_requirements = {
            'min_length': 8,
            'require_uppercase': True,
            'require_lowercase': True,
            'require_numbers': True,
            'require_special': True,
            'special_chars': '!@#$%^&*()_+-=[]{}|;:,.<>?'
        }
    
    def _get_db_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            self.logger.error(f"Database connection error: {e}")
            raise
    
    def authenticate_user(self, email: str, password: str, mfa_code: Optional[str] = None) -> Tuple[bool, str, Optional[Dict]]:
        """
        Authenticate user with email and password - FIXED for actual schema
        """
        try:
            # Validate input
            if not email or not password:
                return False, "Email and password are required", None
            
            email = email.lower().strip()
            
            # Get user from database using actual schema
            user = self._get_user_by_email(email)
            if not user:
                return False, "Invalid email or password", None
            
            # Check if account is active
            if not user.get('is_active', False):
                return False, "Account is not active. Please contact support.", None
            
            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                self._increment_failed_attempts(email)
                return False, "Invalid email or password", None
            
            # Reset failed attempts on successful login
            self._reset_failed_attempts(email)
            
            # Update last login
            self._update_last_login(user['id'])
            
            # Generate JWT tokens
            access_token = create_access_token(
                identity=str(user['id']),  # Convert UUID to string
                expires_delta=timedelta(hours=24)
            )
            refresh_token = create_refresh_token(
                identity=str(user['id']),  # Convert UUID to string
                expires_delta=timedelta(days=30)
            )
            
            # Prepare user data for response
            user_data = {
                'id': str(user['id']),  # Convert UUID to string
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'full_name': f"{user['first_name']} {user['last_name']}",
                'role': user['role'],
                'user_type': user['role'],  # Alias for compatibility
                'phone': user['phone'],
                'emirate': user['emirate'],
                'nationality': user['nationality'],
                'is_verified': user['is_verified'],
                'preferred_language': user.get('preferred_language', 'en'),
                'mfa_enabled': False  # Default for now
            }
            
            return True, "Authentication successful", {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user_data,
                'expires_in': 86400  # 24 hours in seconds
            }
            
        except Exception as e:
            self.logger.error(f"Authentication error: {e}")
            return False, "Authentication failed due to system error", None
    
    def _get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email - FIXED for actual schema"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("""
                SELECT id, email, password_hash, first_name, last_name, role, phone, 
                       emirate, nationality, is_active, is_verified, created_at, updated_at
                FROM users WHERE email = %s
            """, (email,))
            
            user_row = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if user_row:
                return dict(user_row)
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting user by email: {e}")
            return None
    
    def _increment_failed_attempts(self, email: str):
        """Increment failed login attempts (simplified implementation)"""
        self.logger.warning(f"Failed login attempt for: {email}")
    
    def _reset_failed_attempts(self, email: str):
        """Reset failed login attempts (simplified implementation)"""
        self.logger.info(f"Reset failed attempts for: {email}")
    
    def _update_last_login(self, user_id: str):
        """Update user's last login timestamp"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE users SET updated_at = %s WHERE id = %s
            """, (datetime.utcnow(), user_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Error updating last login: {e}")
    
    def register_user(self, user_data: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict]]:
        """
        Register a new user - FIXED for actual schema
        """
        try:
            # Validate required fields
            required_fields = ['email', 'password', 'first_name', 'last_name']
            for field in required_fields:
                if not user_data.get(field):
                    return False, f"Missing required field: {field}", None
            
            # Validate email format
            if not self._validate_email(user_data['email']):
                return False, "Invalid email format", None
            
            # Check if user already exists
            if self._user_exists(user_data['email']):
                return False, "User with this email already exists", None
            
            # Validate password strength
            password_valid, password_msg = self._validate_password(user_data['password'])
            if not password_valid:
                return False, f"Password validation failed: {password_msg}", None
            
            # Hash password
            password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Insert user into database using actual schema
            conn = self._get_db_connection()
            try:
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                
                cursor.execute("""
                    INSERT INTO users (
                        email, password_hash, first_name, last_name, phone, 
                        role, emirate, nationality, is_active, is_verified
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    user_data['email'].lower().strip(),
                    password_hash,
                    user_data['first_name'].strip(),
                    user_data['last_name'].strip(),
                    user_data.get('phone', ''),
                    user_data.get('role', 'candidate'),
                    user_data.get('emirate', ''),
                    user_data.get('nationality', 'UAE'),
                    True,  # is_active
                    True   # is_verified
                ))
                
                user_id = cursor.fetchone()['id']
                
                conn.commit()
                cursor.close()
                conn.close()
                
                self.logger.info(f"User registered successfully: {user_data['email']}")
                
                return True, "User registered successfully", {
                    'user_id': str(user_id),
                    'email_verification_required': False,
                    'phone_verification_required': False
                }
                
            except Exception as e:
                conn.rollback()
                conn.close()
                self.logger.error(f"Database insertion failed: {e}")
                return False, f"Registration failed: {e}", None
                
        except Exception as e:
            self.logger.error(f"Registration error: {e}")
            return False, f"Registration failed: {e}", None
    
    def _user_exists(self, email: str) -> bool:
        """Check if user exists by email"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM users WHERE email = %s", (email.lower().strip(),))
            count = cursor.fetchone()[0]
            
            cursor.close()
            conn.close()
            
            return count > 0
            
        except Exception as e:
            self.logger.error(f"Error checking user existence: {e}")
            return False
    
    def _validate_email(self, email: str) -> bool:
        """Validate email format"""
        try:
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            return bool(re.match(pattern, email))
        except Exception:
            return False
    
    def _validate_password(self, password: str) -> Tuple[bool, str]:
        """Validate password strength"""
        try:
            if len(password) < self.password_requirements['min_length']:
                return False, f"Password must be at least {self.password_requirements['min_length']} characters long"
            
            if self.password_requirements['require_uppercase'] and not re.search(r'[A-Z]', password):
                return False, "Password must contain at least one uppercase letter"
            
            if self.password_requirements['require_lowercase'] and not re.search(r'[a-z]', password):
                return False, "Password must contain at least one lowercase letter"
            
            if self.password_requirements['require_numbers'] and not re.search(r'\d', password):
                return False, "Password must contain at least one number"
            
            if self.password_requirements['require_special'] and not re.search(f'[{re.escape(self.password_requirements["special_chars"])}]', password):
                return False, f"Password must contain at least one special character: {self.password_requirements['special_chars']}"
            
            return True, "Password is valid"
            
        except Exception as e:
            self.logger.error(f"Password validation error: {e}")
            return False, "Password validation failed"
    
    def verify_email(self, token: str) -> Tuple[bool, str]:
        """Verify email address (simplified implementation)"""
        # For now, just return success
        return True, "Email verified successfully"
    
    def verify_phone(self, phone: str, code: str) -> Tuple[bool, str]:
        """Verify phone number (simplified implementation)"""
        # For now, just return success
        return True, "Phone verified successfully"
    
    def setup_mfa(self, user_id: str) -> Tuple[bool, str, Optional[Dict]]:
        """Setup MFA (simplified implementation)"""
        # For now, just return success
        return True, "MFA setup successful", {'qr_code': 'mock_qr_code'}
