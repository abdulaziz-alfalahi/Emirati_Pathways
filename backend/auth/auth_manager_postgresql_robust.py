"""
Robust PostgreSQL Authentication Manager for Emirati Journey Platform
Handles various column name scenarios and provides better error handling
"""

import psycopg2
import psycopg2.extras
import bcrypt
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from flask_jwt_extended import create_access_token, create_refresh_token
import os

class AuthenticationManager:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def _get_db_connection(self):
        """Get PostgreSQL database connection with environment variables"""
        try:
            db_config = {
                'host': os.getenv('DB_HOST', 'localhost'),
                'port': os.getenv('DB_PORT', '5432'),
                'database': os.getenv('DB_NAME', 'emirati_platform'),
                'user': os.getenv('DB_USER', 'postgres'),
                'password': os.getenv('DB_PASSWORD', 'password')
            }
            
            conn = psycopg2.connect(**db_config)
            return conn
        except Exception as e:
            self.logger.error(f"Database connection error: {e}")
            raise
    
    def _get_table_columns(self):
        """Get actual column names from users table"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position
            """)
            
            columns = [row[0] for row in cursor.fetchall()]
            cursor.close()
            conn.close()
            
            self.logger.info(f"Users table columns: {columns}")
            return columns
            
        except Exception as e:
            self.logger.error(f"Error getting table columns: {e}")
            return []
    
    def authenticate_user(self, email: str, password: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Authenticate user with email and password - Robust version
        Returns: (success, message, user_data)
        """
        try:
            self.logger.info(f"Attempting authentication for: {email}")
            
            # Get user from database
            user = self._get_user_by_email(email)
            if not user:
                self.logger.warning(f"User not found: {email}")
                return False, "Invalid email or password", None
            
            # Check if account is active
            if not user.get('is_active', True):
                self.logger.warning(f"Inactive account: {email}")
                return False, "Account is not active. Please contact support.", None
            
            # Verify password using bcrypt
            if not self._verify_password(password, user['password_hash']):
                self.logger.warning(f"Invalid password for: {email}")
                return False, "Invalid email or password", None
            
            self.logger.info(f"Authentication successful for: {email}")
            
            # Update last login
            self._update_last_login(user['id'])
            
            # Generate JWT tokens
            access_token = create_access_token(
                identity=str(user['id']),
                expires_delta=timedelta(hours=24)
            )
            refresh_token = create_refresh_token(
                identity=str(user['id']),
                expires_delta=timedelta(days=30)
            )
            
            # Parse profile data if it exists
            profile_data = {}
            if user.get('profile_data'):
                try:
                    if isinstance(user['profile_data'], str):
                        profile_data = json.loads(user['profile_data'])
                    else:
                        profile_data = user['profile_data']
                except:
                    profile_data = {}
            
            # Prepare user data for response with flexible column handling
            user_data = {
                'id': str(user['id']),
                'email': user['email'],
                'first_name': user.get('first_name', user.get('firstname', '')),
                'last_name': user.get('last_name', user.get('lastname', '')),
                'full_name': f"{user.get('first_name', user.get('firstname', ''))} {user.get('last_name', user.get('lastname', ''))}".strip(),
                'role': user.get('role', user.get('user_type', 'candidate')),
                'user_type': user.get('role', user.get('user_type', 'candidate')),
                'phone': user.get('phone', ''),
                'emirate': user.get('emirate', ''),
                'nationality': user.get('nationality', 'UAE'),
                'is_active': user.get('is_active', True),
                'is_verified': user.get('is_verified', False),
                'created_at': str(user.get('created_at', '')),
                'profile_data': profile_data,
                'access_token': access_token,
                'refresh_token': refresh_token
            }
            
            return True, "Authentication successful", user_data
            
        except Exception as e:
            self.logger.error(f"Authentication error: {e}")
            return False, "Authentication failed due to server error", None
    
    def _get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email with robust column handling"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # First, try with the expected column names
            try:
                cursor.execute("""
                    SELECT id, email, password_hash, first_name, last_name, phone, 
                           emirate, nationality, role, is_active, is_verified, 
                           created_at, updated_at, profile_data
                    FROM users WHERE email = %s
                """, (email,))
                
                user_row = cursor.fetchone()
                
            except psycopg2.Error as e:
                self.logger.warning(f"First query failed: {e}")
                
                # If that fails, try a simpler query with just essential columns
                cursor.execute("""
                    SELECT * FROM users WHERE email = %s
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
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against bcrypt hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception as e:
            self.logger.error(f"Password verification error: {e}")
            return False
    
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
        """Register a new user"""
        try:
            # Validate required fields
            required_fields = ['email', 'password', 'first_name', 'last_name']
            for field in required_fields:
                if not user_data.get(field):
                    return False, f"Missing required field: {field}", None
            
            # Check if user already exists
            if self._get_user_by_email(user_data['email']):
                return False, "User with this email already exists", None
            
            # Hash password using bcrypt
            password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Insert new user
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO users (
                    email, password_hash, first_name, last_name, phone, 
                    emirate, nationality, role, profile_data
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                user_data['email'],
                password_hash,
                user_data['first_name'],
                user_data['last_name'],
                user_data.get('phone', ''),
                user_data.get('emirate', ''),
                user_data.get('nationality', 'UAE'),
                user_data.get('role', 'candidate'),
                json.dumps(user_data.get('profile_data', {}))
            ))
            
            user_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            conn.close()
            
            self.logger.info(f"User registered successfully: {user_data['email']}")
            
            # Return user data (without password)
            new_user_data = {
                'id': str(user_id),
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'role': user_data.get('role', 'candidate')
            }
            
            return True, "User registered successfully", new_user_data
            
        except Exception as e:
            self.logger.error(f"Registration error: {e}")
            return False, "Registration failed due to server error", None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("""
                SELECT id, email, first_name, last_name, phone, 
                       emirate, nationality, role, is_active, is_verified, 
                       created_at, profile_data
                FROM users WHERE id = %s
            """, (user_id,))
            
            user_row = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if user_row:
                user_dict = dict(user_row)
                # Parse profile data
                if user_dict.get('profile_data'):
                    try:
                        if isinstance(user_dict['profile_data'], str):
                            user_dict['profile_data'] = json.loads(user_dict['profile_data'])
                    except:
                        user_dict['profile_data'] = {}
                return user_dict
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting user by ID: {e}")
            return None
    
    def logout_user(self, user_id: str) -> Tuple[bool, str]:
        """Logout user (simplified - just return success)"""
        try:
            self.logger.info(f"User logged out: {user_id}")
            return True, "Logout successful"
        except Exception as e:
            self.logger.error(f"Logout error: {e}")
            return False, "Logout failed"
