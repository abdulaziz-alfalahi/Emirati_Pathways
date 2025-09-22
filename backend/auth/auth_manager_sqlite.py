"""
SQLite-compatible Authentication Manager for Emirati Journey Platform
Fixed to work with local SQLite database and actual schema
"""

import sqlite3
import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from flask_jwt_extended import create_access_token, create_refresh_token
import os

class AuthenticationManager:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.db_path = self._get_db_path()
        
    def _get_db_path(self):
        """Get the SQLite database path"""
        backend_dir = os.path.dirname(os.path.dirname(__file__))
        db_dir = os.path.join(backend_dir, 'database')
        return os.path.join(db_dir, 'emirati_platform.db')
    
    def _get_db_connection(self):
        """Get SQLite database connection"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Enable dict-like access
            return conn
        except Exception as e:
            self.logger.error(f"Database connection error: {e}")
            raise
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256 (matching setup script)"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return self._hash_password(password) == password_hash
    
    def authenticate_user(self, email: str, password: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Authenticate user with email and password
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
            
            # Verify password
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
                    profile_data = json.loads(user['profile_data'])
                except:
                    profile_data = {}
            
            # Prepare user data for response
            user_data = {
                'id': str(user['id']),
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'full_name': f"{user['first_name']} {user['last_name']}",
                'role': user.get('user_type', 'candidate'),
                'user_type': user.get('user_type', 'candidate'),
                'phone': user.get('phone', ''),
                'nationality': user.get('nationality', 'UAE'),
                'is_active': user.get('is_active', True),
                'created_at': user.get('created_at', ''),
                'profile_data': profile_data,
                'access_token': access_token,
                'refresh_token': refresh_token
            }
            
            return True, "Authentication successful", user_data
            
        except Exception as e:
            self.logger.error(f"Authentication error: {e}")
            return False, "Authentication failed due to server error", None
    
    def _get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email from SQLite database"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, email, password_hash, first_name, last_name, phone, 
                       nationality, user_type, is_active, created_at, updated_at, profile_data
                FROM users WHERE email = ?
            """, (email,))
            
            user_row = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if user_row:
                # Convert Row object to dict
                return dict(user_row)
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting user by email: {e}")
            return None
    
    def _update_last_login(self, user_id: int):
        """Update user's last login timestamp"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE users SET updated_at = ? WHERE id = ?
            """, (datetime.now().isoformat(), user_id))
            
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
            
            # Hash password
            password_hash = self._hash_password(user_data['password'])
            
            # Insert new user
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO users (
                    email, password_hash, first_name, last_name, phone, 
                    nationality, user_type, profile_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_data['email'],
                password_hash,
                user_data['first_name'],
                user_data['last_name'],
                user_data.get('phone', ''),
                user_data.get('nationality', 'UAE'),
                user_data.get('user_type', 'candidate'),
                json.dumps(user_data.get('profile_data', {}))
            ))
            
            user_id = cursor.lastrowid
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
                'user_type': user_data.get('user_type', 'candidate')
            }
            
            return True, "User registered successfully", new_user_data
            
        except Exception as e:
            self.logger.error(f"Registration error: {e}")
            return False, "Registration failed due to server error", None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, email, first_name, last_name, phone, 
                       nationality, user_type, is_active, created_at, profile_data
                FROM users WHERE id = ?
            """, (user_id,))
            
            user_row = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if user_row:
                user_dict = dict(user_row)
                # Parse profile data
                if user_dict.get('profile_data'):
                    try:
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
