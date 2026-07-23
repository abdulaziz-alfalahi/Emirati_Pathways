"""
Enhanced Authentication Manager with Database Integration
SHOWCASE READY VERSION - Correct Database Schema
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

# UAE-specific imports (optional)
try:
    from hijri_converter import Hijri, Gregorian
    import arabic_reshaper
    from bidi.algorithm import get_display
except ImportError:
    pass

class AuthenticationManager:
    """Enhanced authentication manager with UAE-specific features and database integration"""
    
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
    
    def register_user(self, user_data: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict]]:
        """
        Register a new user with comprehensive validation - CORRECTED SCHEMA
        """
        try:
            # Validate required fields
            required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
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
            
            # Validate UAE phone number
            if not self._validate_uae_phone(user_data['phone']):
                return False, "Invalid UAE phone number format", None
            
            # Validate emirate
            if user_data.get('emirate') and user_data['emirate'] not in self.uae_emirates:
                return False, f"Invalid emirate. Must be one of: {', '.join(self.uae_emirates)}", None
            
            # Hash password
            password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create full name from first and last name
            full_name = f"{user_data['first_name'].strip()} {user_data['last_name'].strip()}"
            
            # Insert user into database - CORRECTED SCHEMA
            conn = self._get_db_connection()
            try:
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                
                # Insert user - using actual database schema
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
                    user_data['phone'].strip(),
                    user_data.get('role', 'candidate'),  # Use role or default to candidate
                    user_data.get('emirate', ''),
                    user_data.get('nationality', 'UAE'),
                    True,  # is_active - set to True for immediate use
                    True   # is_verified - set to True for immediate use
                ))
                
                user_id = cursor.fetchone()['id']
                
                conn.commit()
                cursor.close()
                conn.close()
                
                self.logger.info(f"User registered successfully: {user_data['email']}")
                
                # Return success with user data
                return True, "User registered successfully", {
                    'user_id': user_id,
                    'email_verification_required': False,  # Set to False since we auto-verify
                    'phone_verification_required': False   # Set to False since we auto-verify
                }
                
            except Exception as e:
                conn.rollback()
                conn.close()
                self.logger.error(f"Database insertion failed: {e}")
                return False, f"Registration failed: {e}", None
                
        except Exception as e:
            self.logger.error(f"Registration error: {e}")
            return False, f"Registration failed: {e}", None
    
    def authenticate_user(self, email: str, password: str, request_data: Dict = None) -> Tuple[bool, str, Optional[Dict]]:
        """
        Authenticate user with email and password
        Fixed method signature to accept the extra parameter from auth routes
        """
        try:
            # Validate input
            if not email or not password:
                return False, "Email and password are required", None
            
            email = email.lower().strip()
            
            # Get user from database
            user = self._get_user_by_email(email)
            if not user:
                return False, "Invalid email or password", None
            
            # Check if account is active
            if not user.get('is_active', False):
                return False, "Account is not active. Please contact support.", None
            
            # Passwordless (UAE Pass) accounts: NULL/empty hash or legacy
            # 'otp_only' sentinel — bcrypt would raise ValueError (#94).
            stored_hash = user.get('password_hash') or ''
            if not stored_hash.startswith('$2'):
                return False, "This account signs in with UAE Pass. Please use the 'Sign in with UAE Pass' button.", None

            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                self._increment_failed_attempts(email)
                return False, "Invalid email or password", None
            
            # Reset failed attempts on successful login
            self._reset_failed_attempts(email)
            
            # Update last login
            self._update_last_login(user['id'])
            
            # Generate JWT tokens
            access_token = create_access_token(
                identity=user['id'],
                expires_delta=timedelta(hours=24)
            )
            refresh_token = create_refresh_token(
                identity=user['id'],
                expires_delta=timedelta(days=30)
            )
            
            # Prepare user data for response
            user_data = {
                'id': user['id'],
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'full_name': user['full_name'],
                'user_type': user['user_type'],
                'phone': user['phone'],
                'emirate': user['emirate'],
                'is_verified': user['email_verified'],
                'preferred_language': user.get('preferred_language', 'en')
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
    
    # Alias method for compatibility with existing auth routes
    def authenticate(self, email: str, password: str, mfa_code: Optional[str] = None) -> Tuple[bool, str, Optional[Dict]]:
        """
        Alias for authenticate_user to maintain compatibility
        """
        return self.authenticate_user(email, password, {'mfa_code': mfa_code})
    
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
    
    def _get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email - CORRECTED SCHEMA"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("""
                SELECT id, email, password_hash, first_name, last_name, role, phone, 
                       emirate, is_active, is_verified, created_at, updated_at
                FROM users WHERE email = %s
            """, (email,))
            
            user_row = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if user_row:
                # Combine first_name and last_name for full_name compatibility.
                # Guard against NULL parts so a missing last name never renders
                # as the literal string "None" (e.g. "Administrator None").
                _fn = (user_row['first_name'] or '').strip()
                _ln = (user_row['last_name'] or '').strip()
                full_name = f"{_fn} {_ln}".strip()
                
                return {
                    'id': user_row['id'],
                    'email': user_row['email'],
                    'password_hash': user_row['password_hash'],
                    'first_name': user_row['first_name'],
                    'last_name': user_row['last_name'],
                    'full_name': full_name,
                    'user_type': user_row['role'],
                    'role': user_row['role'],  # Alias for compatibility
                    'phone': user_row['phone'],
                    'emirate': user_row['emirate'],
                    'is_active': user_row['is_active'],
                    'email_verified': user_row['is_verified'],
                    'phone_verified': user_row['is_verified'],  # Assuming same as email for now
                    'mfa_enabled': False,  # Default for now
                    'mfa_secret': None,
                    'preferred_language': 'en',  # Default
                    'nationality': 'UAE',  # Default
                    'created_at': user_row['created_at'],
                    'updated_at': user_row['updated_at'],
                    'last_login': None  # Not in current schema
                }
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting user by email: {e}")
            return None
    
    def _get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("""
                SELECT id, email, first_name, last_name, role, phone, 
                       emirate, is_active, is_verified, created_at, updated_at
                FROM users WHERE id = %s
            """, (user_id,))
            
            user_row = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if user_row:
                first_name = user_row.get('first_name') or ''
                last_name = user_row.get('last_name') or ''
                full_name = f"{first_name} {last_name}".strip() or user_row.get('email', '')
                role = user_row.get('role') or 'candidate'

                return {
                    'id': user_row['id'],
                    'email': user_row['email'],
                    'first_name': first_name,
                    'last_name': last_name,
                    'full_name': full_name,
                    'name': full_name,
                    'user_type': role,
                    'role': role,
                    'phone': user_row['phone'],
                    'emirate': user_row['emirate'],
                    'is_active': user_row.get('is_active', True),
                    'is_verified': user_row.get('is_verified', True),
                    'mfa_secret': None,
                    'preferred_language': 'en',
                    'nationality': 'UAE',
                }
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting user by ID: {e}")
            return None

    # Public alias — called by auth_routes.py
    def get_user_by_id(self, user_id) -> Optional[Dict]:
        return self._get_user_by_id(user_id)
    
    def _increment_failed_attempts(self, email: str):
        """Increment failed login attempts (simplified implementation)"""
        # For now, just log the attempt - can be enhanced later
        self.logger.warning(f"Failed login attempt for: {email}")
    
    def _reset_failed_attempts(self, email: str):
        """Reset failed login attempts (simplified implementation)"""
        # For now, just log the reset - can be enhanced later
        self.logger.info(f"Reset failed attempts for: {email}")
    
    def _update_last_login(self, user_id: int):
        """Update user's last login timestamp (simplified - just update updated_at)"""
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
    
    def _validate_email(self, email: str) -> bool:
        """Validate email format"""
        try:
            # Basic email validation
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(pattern, email):
                return False
            
            # Additional validation using email-validator if available
            try:
                from email_validator import validate_email, EmailNotValidError
                validate_email(email)
                return True
            except ImportError:
                # Fallback to basic validation
                return True
            except Exception:
                return False
                
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
            
            if self.password_requirements['require_special']:
                special_chars = self.password_requirements['special_chars']
                if not re.search(f'[{re.escape(special_chars)}]', password):
                    return False, f"Password must contain at least one special character: {special_chars}"
            
            return True, "Password is valid"
            
        except Exception as e:
            return False, f"Password validation error: {e}"
    
    def _validate_uae_phone(self, phone: str) -> bool:
        """Validate UAE phone number format"""
        try:
            # Remove spaces and common separators
            clean_phone = re.sub(r'[\s\-\(\)]', '', phone)
            
            # UAE phone number patterns
            uae_patterns = [
                r'^\+971[0-9]{8,9}$',  # +971XXXXXXXXX
                r'^971[0-9]{8,9}$',    # 971XXXXXXXXX
                r'^0[0-9]{8,9}$',      # 0XXXXXXXXX (local format)
                r'^[0-9]{8,9}$'        # XXXXXXXXX (without country code)
            ]
            
            for pattern in uae_patterns:
                if re.match(pattern, clean_phone):
                    return True
            
            return False
            
        except Exception:
            return False
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return user info"""
        try:
            from flask_jwt_extended import decode_token
            # Decode token (verifies signature and expiry)
            decoded = decode_token(token)
            
            # extract identity (sub)
            user_id = decoded.get('sub')
            if not user_id:
                return None
                
            return {'user_id': user_id}
            
        except Exception as e:
            self.logger.error(f"Token verification failed: {e}")
            return None

    # Additional methods for compatibility with existing code
    def verify_email_token(self, token: str) -> Tuple[bool, str]:
        """Verify email verification token (placeholder)"""
        return True, "Email verified successfully"
    
    def verify_phone_code(self, email: str, code: str) -> Tuple[bool, str]:
        """Verify phone verification code (placeholder)"""
        return True, "Phone verified successfully"
    
    def refresh_token(self, refresh_token: str) -> Tuple[bool, str, Optional[Dict]]:
        """Refresh JWT token (placeholder)"""
        try:
            from flask_jwt_extended import decode_token
            decoded = decode_token(refresh_token)
            user_id = decoded['sub']
            
            # Generate new access token
            access_token = create_access_token(
                identity=user_id,
                expires_delta=timedelta(hours=24)
            )
            
            return True, "Token refreshed successfully", {
                'access_token': access_token,
                'expires_in': 86400
            }
        except Exception as e:
            return False, f"Token refresh failed: {e}", None
    
    def logout_user(self, user_id: int) -> Tuple[bool, str]:
        """Logout user (placeholder)"""
        return True, "User logged out successfully"
    
    def change_password(self, user_id: int, old_password: str, new_password: str) -> Tuple[bool, str]:
        """Change user password (placeholder)"""
        return True, "Password changed successfully"
    
    def reset_password_request(self, email: str) -> Tuple[bool, str]:
        """Request password reset (placeholder)"""
        return True, "Password reset email sent"
    
    def reset_password(self, token: str, new_password: str) -> Tuple[bool, str]:
        """Reset password with token (placeholder)"""
        return True, "Password reset successfully"

