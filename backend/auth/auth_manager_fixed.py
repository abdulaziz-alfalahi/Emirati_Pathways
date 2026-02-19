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
import uuid
from datetime import datetime, timedelta
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List
import psycopg2
import psycopg2.extras
from flask_jwt_extended import create_access_token, create_refresh_token
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

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
            conn.autocommit = True
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
                'secondary_roles': user.get('secondary_roles', []),
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
                       emirate, nationality, is_active, is_verified, created_at, updated_at,
                       secondary_roles, skills, experience_years
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

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID with role-specific enrichments"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("""
                SELECT id, email, first_name, last_name, role, user_type, phone, 
                       emirate, nationality, is_active, is_verified, created_at, updated_at,
                       secondary_roles, profile_data, location, latitude, longitude,
                       skills, experience_years
                FROM users WHERE id = %s
            """, (user_id,))
            
            user_row = cursor.fetchone()
            
            # Enrich with Company ID if Recruiter
            if user_row:
                role = user_row.get('role') or user_row.get('user_type')
                if role in ('hr_manager', 'hr_recruiter', 'recruiter', 'employer'):
                    try:
                        cursor.execute("""
                            SELECT hp.company_id, COALESCE(c.name, c.company_name) as company_name
                            FROM hr_profiles hp
                            LEFT JOIN companies c ON hp.company_id::text = c.id::text
                            WHERE hp.user_id = %s
                        """, (user_id,))
                        hr_info = cursor.fetchone()
                        if hr_info:
                            user_row['company_id'] = str(hr_info['company_id']) if hr_info['company_id'] else None
                            user_row['company_name'] = hr_info.get('company_name')
                    except Exception as e:
                        self.logger.warning(f"Failed to fetch company info for user {user_id}: {e}")

            cursor.close()
            conn.close()
            
            if user_row:
                return dict(user_row)
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting user by id: {e}")
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
                UPDATE users SET last_login = %s, updated_at = %s WHERE id = %s
            """, (datetime.utcnow(), datetime.utcnow(), user_id))
            
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
    
    def request_otp(self, phone: str) -> Tuple[bool, str, Optional[str]]:
        """Request OTP for phone verification with Magic Bypass"""
        try:
            # Normalize phone
            phone = phone.replace(' ', '').replace('-', '').strip()
            
            # UAE Format Normalization (E.164)
            if phone.startswith('05'):
                phone = '+971' + phone[1:]
            elif phone.startswith('5') and len(phone) == 9:
                phone = '+971' + phone
            
            magic_numbers = [
                '+971500000000', # HR Manager
                '+971502345678', # HR Manager (Zara Saeed)
                '+971503456789', # HR Recruiter
                '+971501234567', # Candidate
                '+971507890123', # Admin
                '+971509999999', # Administrator
                '+971 50 123 4567', # Candidate (formatted)
                '+971509998888',  # Growth Operator
                '+971550000010',  # Test Student
                '+971550000010',  # Test Student
                '+971550000011',  # Test Educator
                '+971500001001',  # Test Team Chat - HR Manager 1
                '+971500001002',  # Test Team Chat - Recruiter 1
                '+971500001003',  # Test Team Chat - Recruiter 2
                '+971500001004'   # Test Parent User
            ]
            is_magic = phone.endswith('1234567') or phone in magic_numbers
            
            if is_magic:
                self.logger.info(f"Magic OTP requested for {phone}")
                otp_code = '123456'
            else:
                # Generate 6-digit secure random code
                otp_code = str(secrets.randbelow(1000000)).zfill(6)
            
            expires_at = datetime.now() + timedelta(minutes=10)
            
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            # Upsert into otp_interactions
            cursor.execute("""
                INSERT INTO otp_interactions (phone, otp_code, expires_at, created_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (phone) 
                DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, attempts = 0
            """, (phone, otp_code, expires_at))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            if is_magic:
                return True, "OTP sent successfully (Test Mode)", otp_code
            
            # --- Twilio WhatsApp Integration ---
            twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
            twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
            twilio_from = os.getenv('TWILIO_FROM_NUMBER') # e.g. whatsapp:+14155238886

            if twilio_sid and twilio_token and twilio_from:
                try:
                    client = Client(twilio_sid, twilio_token)
                    
                    # Smartly handle WhatsApp vs SMS based on sender format
                    if twilio_from.startswith('whatsapp:'):
                        if not phone.startswith('whatsapp:'):
                            to_number = f"whatsapp:{phone}"
                        else:
                            to_number = phone
                    else:
                        # Plain SMS
                        to_number = phone

                    message = client.messages.create(
                        body=f"Your Emirati Pathways Verification Code is: {otp_code}",
                        from_=twilio_from,
                        to=to_number
                    )
                    
                    channel = "WhatsApp" if twilio_from.startswith('whatsapp:') else "SMS"
                    self.logger.info(f"Twilio {channel} sent to {phone}: {message.sid}")
                    return True, f"OTP sent successfully via {channel}", None
                    
                except TwilioRestException as e:
                    self.logger.error(f"Twilio API Error: {e}")
                    # Fallback to simulation/logging so dev flow isn't completely broken
                    self.logger.warning("Falling back to OTP simulation due to Twilio error")
                except Exception as e:
                     self.logger.error(f"Twilio Generic Error: {e}")
                     self.logger.warning("Falling back to OTP simulation due to generic error")

            # Fallback / Simulation
            # For Real Numbers: Log it (Simulate SMS)
            self.logger.info(f"SMS SIMULATION: OTP for {phone} is {otp_code}")
            print(f"SMS SIMULATION: OTP for {phone} is {otp_code}") # Print to stdout for user visibility
            
            # If we had credentials but failed, we warn the user in the message
            if twilio_sid and twilio_token:
                 return True, "OTP sent (Fallback Mode - Check Logs/Console)", None
            
            return True, "OTP sent successfully (Simulation Mode)", None 
            
        except Exception as e:
            self.logger.error(f"OTP Request failed: {e}")
            return False, f"Failed to send OTP: {str(e)}", None

    def verify_phone(self, phone: str, code: str) -> Tuple[bool, str]:
        """Verify phone number with Real OTP logic"""
        try:
            # Normalize phone
            phone = phone.replace(' ', '').replace('-', '').strip()

            # UAE Format Normalization (E.164)
            if phone.startswith('05'):
                phone = '+971' + phone[1:]
            elif phone.startswith('5') and len(phone) == 9:
                phone = '+971' + phone

            # 1. Check Magic Bypass (Hardcoded Safety Net)
            magic_numbers = [
                '+971500000000', # HR Manager
                '+971502345678', # HR Manager (Zara Saeed)
                '+971503456789', # HR Recruiter
                '+971501234567', # Candidate
                '+971507890123', # Admin
                '+971509999999', # Administrator
                '+971 50 123 4567', # Candidate (formatted)
                '+971509998888',  # Growth Operator
                '+971550000010',  # Test Student
                '+971550000010',  # Test Student
                '+971550000011',  # Test Educator
                '+971500001001',  # Test Team Chat - HR Manager 1
                '+971500001002',  # Test Team Chat - Recruiter 1
                '+971500001003',  # Test Team Chat - Recruiter 2
                '+971500001004'   # Test Parent User
            ]
            if code == '123456' and (phone.endswith('1234567') or phone in magic_numbers):
                 print("DEBUG: Magic OTP match!", flush=True)
                 return True, "Phone verified successfully (Magic)"
            print("DEBUG: Not magic OTP, accessing DB...", flush=True)
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT otp_code, expires_at, attempts FROM otp_interactions WHERE phone = %s", (phone,))
            result = cursor.fetchone()
            
            if not result:
                cursor.close()
                conn.close()
                return False, "No OTP requested for this number"
                
            stored_otp, expires_at, attempts = result
            
            # Check attempts
            if attempts >= 5:
                cursor.close()
                conn.close()
                return False, "Too many attempts. Please request a new OTP."
            
            # Check expiry
            if datetime.now() > expires_at:
                cursor.close()
                conn.close()
                return False, "OTP expired"
            
            # Check Match
            if code != stored_otp:
                # Increment attempts
                cursor.execute("UPDATE otp_interactions SET attempts = attempts + 1 WHERE phone = %s", (phone,))
                conn.commit()
                cursor.close()
                conn.close()
                return False, "Invalid OTP"
            
            # Success! Clear OTP
            cursor.execute("DELETE FROM otp_interactions WHERE phone = %s", (phone,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return True, "Phone verified successfully"
            
        except Exception as e:
            self.logger.error(f"OTP Verification failed: {e}")
            return False, "Verification failed due to system error"
    
    def setup_mfa(self, user_id: str) -> Tuple[bool, str, Optional[Dict]]:
        """Setup MFA (simplified implementation)"""
        # For now, just return success
        return True, "MFA setup successful", {'qr_code': 'mock_qr_code'}

    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return user info"""
        try:
            print(f"DEBUG: Verifying token: {token[:20]}...", flush=True)
            from flask_jwt_extended import decode_token
            # Decode token (verifies signature and expiry)
            decoded = decode_token(token)
            print(f"DEBUG: Token decoded successfully: {decoded}", flush=True)
            
            # extract identity (sub)
            user_id = decoded.get('sub')
            if not user_id:
                print("DEBUG: No identity (sub) in token", flush=True)
                return None
            
            # Additional check: does user exist?
            return {'user_id': user_id}
            
        except Exception as e:
            self.logger.error(f"Token verification failed: {e}")
            print(f"DEBUG: Token verification exception: {e}", flush=True)
            return None

    def authenticate_by_phone(self, phone: str, code: str) -> Tuple[bool, str, Optional[Dict]]:
        """Authenticate or Register by Phone OTP. Auto-provisions user if new."""
        # 1. Verify OTP
        valid, msg = self.verify_phone(phone, code)
        if not valid:
             return False, msg, None

        try:
             # 2. Check User
             conn = self._get_db_connection()
             cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
             
             # Normalize phone in DB query too (assumes DB stores it clean, or we attempt to match)
             # Ideally DB phone is normalized.
             clean_phone = phone.replace(' ', '').replace('-', '').strip()
             
             # UAE Format Normalization (E.164)
             if clean_phone.startswith('05'):
                clean_phone = '+971' + clean_phone[1:]
             elif clean_phone.startswith('5') and len(clean_phone) == 9:
                clean_phone = '+971' + clean_phone
             
             # Update phone variable to use normalized version for consistency
             phone = clean_phone
             
             cursor.execute("SELECT * FROM users WHERE phone = %s OR phone = %s", (clean_phone, phone))
             user = cursor.fetchone()
             
             is_new_user = False
             
             if not user:
                 # 3. Create Provisional User
                 is_new_user = True
                 self.logger.info(f"Auto-provisioning new user for phone {phone}")
                 
                 # Generate unique temp email/pass
                 temp_id = secrets.token_hex(4)
                 # Use a dummy email that won't conflict
                 temp_email = f"u{clean_phone.replace('+','')}.{temp_id}@emirati-pathway.temp"
                 temp_pass = secrets.token_urlsafe(16)
                 pass_hash = bcrypt.hashpw(temp_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                 
                 # Determine column name: user_type or role
                 # We try 'user_type' based on setup_database.py
                 try:
                     cursor.execute("""
                         INSERT INTO users (email, password_hash, full_name, user_type, phone, is_verified, is_active)
                         VALUES (%s, %s, %s, %s, %s, %s, %s)
                         RETURNING *
                     """, (temp_email, pass_hash, 'New Member', 'candidate', clean_phone, True, True))
                 except psycopg2.errors.UndefinedColumn:
                     # Fallback to 'role' if user_type doesn't exist (handled by transaction rollback?)
                     conn.rollback()
                     cursor.execute("""
                         INSERT INTO users (email, password_hash, first_name, last_name, role, phone, is_verified, is_active)
                         VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                         RETURNING *
                     """, (temp_email, pass_hash, 'New', 'Member', 'candidate', clean_phone, True, True))
                 
                 user = cursor.fetchone()
                 conn.commit()
             
             cursor.close()
             conn.close()
             
             # 4. Return Data
             if user:
                user_data = dict(user)
                user_data['is_new_user'] = is_new_user
                
                # Ensure consistent name fields - prevent 'None None' display
                if not user_data.get('first_name'):
                    full_name = user_data.get('full_name', 'New Member') or 'New Member'
                    parts = full_name.split(' ', 1) if full_name else ['New', 'Member']
                    user_data['first_name'] = parts[0] if parts else 'New'
                    user_data['last_name'] = parts[1] if len(parts) > 1 else 'Member'
                if not user_data.get('full_name'):
                    user_data['full_name'] = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or 'New Member'
                
                # Update last login
                try:
                    self._update_last_login(user_data['id'])
                except:
                    pass
                
                # Fetch company_id from hr_profiles for HR users
                user_role = user_data.get('role') or user_data.get('user_type') or ''
                if user_role in ('hr_manager', 'hr_recruiter', 'recruiter', 'employer'):
                    try:
                        conn_hr = self._get_db_connection()
                        cursor_hr = conn_hr.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                        cursor_hr.execute("""
                            SELECT hp.company_id, COALESCE(c.name, c.company_name) as company_name
                            FROM hr_profiles hp
                            LEFT JOIN companies c ON hp.company_id::text = c.id::text
                            WHERE hp.user_id = %s
                            LIMIT 1
                        """, (str(user_data['id']),))
                        hr_profile = cursor_hr.fetchone()
                        if hr_profile:
                            user_data['company_id'] = str(hr_profile['company_id']) if hr_profile['company_id'] else None
                            user_data['company_name'] = hr_profile.get('company_name')
                        cursor_hr.close()
                        conn_hr.close()
                    except Exception as hr_err:
                        self.logger.warning(f"Failed to fetch company_id for HR user: {hr_err}")
                    
                return True, "Authenticated successfully", user_data
             else:
                return False, "Failed to retrieve user data", None
             
        except Exception as e:
             self.logger.error(f"Phone Auth failed: {e}")
             return False, f"Authentication failed: {str(e)}", None

    def update_user_role(self, user_id: str, role: str, additional_data: Optional[Dict] = None) -> Tuple[bool, str, Optional[Dict]]:
        """
        Update user role and associated metadata
        Handles creating/updating profile tables for specific roles (Recruiter, Educator, Student)
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # 1. Update User Role
            # Also update user_type if column exists (it's an alias usually)
            try:
                cursor.execute("""
                    UPDATE users 
                    SET role = %s, user_type = %s, updated_at = NOW()
                    WHERE id = %s
                    RETURNING *
                """, (role, role, user_id))
            except psycopg2.errors.UndefinedColumn:
                conn.rollback() 
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cursor.execute("""
                    UPDATE users 
                    SET role = %s, updated_at = NOW()
                    WHERE id = %s
                    RETURNING *
                """, (role, user_id))
                
            user = cursor.fetchone()
            
            if not user:
                conn.rollback()
                conn.close()
                return False, "User not found", None
                
            # 2. Handle Role-Specific Data
            if additional_data:
                try:
                    # --- Recruiter / HR ---
                    if role in ['recruiter', 'hr_recruiter', 'hr_manager']:
                        company_name = additional_data.get('company_name')
                        if company_name:
                            # Check if company exists
                            cursor.execute("SELECT id FROM companies WHERE company_name ILIKE %s", (company_name,))
                            company = cursor.fetchone()
                            
                            company_id = None
                            if company:
                                company_id = company['id']
                            else:
                                # Create new company
                                company_id = str(uuid.uuid4())
                                cursor.execute("""
                                    INSERT INTO companies (id, company_name, is_verified)
                                    VALUES (%s, %s, false)
                                    RETURNING id
                                """, (company_id, company_name))
                                company_id = cursor.fetchone()['id']
                            
                            # Upsert HR Profile
                            cursor.execute("""
                                INSERT INTO hr_profiles (user_id, company_id, position_title)
                                VALUES (%s, %s, 'Recruiter')
                                ON CONFLICT (user_id) 
                                DO UPDATE SET company_id = EXCLUDED.company_id, updated_at = NOW()
                            """, (user_id, company_id))

                    # --- Educator ---
                    elif role == 'educator':
                        institution_name = additional_data.get('institution_name')
                        if institution_name:
                            # Check if institution exists
                            cursor.execute("SELECT id FROM educational_institutions WHERE name ILIKE %s", (institution_name,))
                            inst = cursor.fetchone()
                            
                            inst_id = None
                            if inst:
                                inst_id = inst['id']
                            else:
                                # Create new institution
                                inst_id = str(uuid.uuid4())
                                cursor.execute("""
                                    INSERT INTO educational_institutions (id, name, institution_type, is_verified)
                                    VALUES (%s, %s, 'Other', false)
                                    RETURNING id
                                """, (inst_id, institution_name))
                                inst_id = cursor.fetchone()['id']
                                
                            # Upsert Educator Profile
                            cursor.execute("""
                                INSERT INTO educator_profiles (user_id, institution_id, position_title)
                                VALUES (%s, %s, 'Educator')
                                ON CONFLICT (user_id)
                                DO UPDATE SET institution_id = EXCLUDED.institution_id, updated_at = NOW()
                            """, (user_id, inst_id))

                    # --- Student / Candidate ---
                    elif role in ['student', 'candidate', 'job_seeker']:
                        university_name = additional_data.get('university_name')
                        if university_name:
                            # Create education object
                            education_entry = {
                                "institution": university_name,
                                "level": "Bachelor", # Default assumption
                                "current": True,
                                "start_date": datetime.now().isoformat()
                            }
                            
                            # Upsert Candidate Profile
                            # Append to education array if exists, or create new
                            cursor.execute("""
                                INSERT INTO candidate_profiles (user_id, education)
                                VALUES (%s, %s::jsonb)
                                ON CONFLICT (user_id)
                                DO UPDATE SET 
                                    education = CASE 
                                        WHEN candidate_profiles.education IS NULL OR jsonb_array_length(candidate_profiles.education) = 0 
                                        THEN %s::jsonb 
                                        ELSE candidate_profiles.education || %s::jsonb 
                                    END,
                                    updated_at = NOW()
                            """, (user_id, json.dumps([education_entry]), json.dumps([education_entry]), json.dumps([education_entry])))

                except Exception as meta_e:
                    self.logger.error(f"Error saving metadata: {meta_e}")
                    # We don't rollback main role update if metadata fails, just log it?
                    # Or maybe we serves warning? For now, proceed.

            conn.commit()
            cursor.close()
            conn.close()
            
            return True, "Role updated successfully", dict(user)
            
        except Exception as e:
            self.logger.error(f"Update role failed: {e}")
            return False, f"Update failed: {str(e)}", None

    def update_user_profile(self, user_id: str, data: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict]]:
        """
        Update user profile data - Centralized logic
        Handles mapped columns and JSONB profile_data
        """
        try:
            conn = self._get_db_connection()
            # self._get_db_connection returns autocommit=True
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Prepare fields to update
            update_fields = []
            update_values = []
            
            # 1. Personal Info (Columns)
            if 'personal_info' in data:
                pi = data['personal_info']
                column_map = {
                    'first_name': 'first_name',
                    'last_name': 'last_name',
                    'phone': 'phone',
                    'location': 'location',
                    'latitude': 'latitude',
                    'longitude': 'longitude',
                    'nationality': 'nationality',
                    'emirate': 'emirate'
                }
                
                for key, col in column_map.items():
                    if key in pi:
                        update_fields.append(f"{col} = %s")
                        update_values.append(pi[key])

            # 2. Professional/Skills info (Columns)
            if 'experience_years' in data:
                update_fields.append("experience_years = %s")
                update_values.append(data['experience_years'])
                
            if 'skills' in data:
                update_fields.append("skills = %s")
                # Ensure it's a list for Postgres Array
                skills_list = data['skills'] if isinstance(data['skills'], list) else []
                update_values.append(skills_list)

            # 3. JSONB profile_data
            # Fetch existing to merge
            cursor.execute("SELECT profile_data FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if not row:
                return False, "User not found", None
                
            current_profile_data = row['profile_data'] if row and row['profile_data'] else {}
            
            # Merge known direct keys (Standard Profile)
            direct_keys = ['professional_summary', 'current_position', 'current_company', 
                           'education', 'languages', 'certifications']
            for key in direct_keys:
                if key in data:
                    current_profile_data[key] = data[key]

            # Merge Recruiter/Company/Preferences fields (Allow-list approach)
            extra_keys = [
                # Recruiter / HR
                'companyName', 'companySize', 'companyLocation', 'companyWebsite', 'companyDescription',
                'hiringVolume', 'preferredCandidateLevel', 'preferredSkills', 'workArrangements', 
                'salaryRanges', 'interviewProcess', 'assessmentTools', 'communicationPreferences',
                'workingHours', 'notifications', 'profileVisibility', 'contactVisibility', 'companyInfoPublic',
                'industry', 'jobTitle', 'socialMedia', 'offices', 'headquarters', 'mission', 'vision', 
                'values', 'culture', 'benefits', 'perks', 'awards', 'certifications',
                # Student
                'schoolName', 'gradeLevel', 'gpa', 'majorInterests', 'extracurriculars', 'achievements'
            ]
            
            for key in extra_keys:
                if key in data:
                    # Update or add
                    current_profile_data[key] = data[key]

            # Special handling for personal_info nested in JSON
            if 'personal_info' in data:
                 current_profile_data['personal_info_extra'] = data['personal_info']
                 if 'emirates_id' in data['personal_info']:
                      current_profile_data['emirates_id'] = data['personal_info']['emirates_id']

            # Student backward compat
            if 'schoolName' in data:
                 current_profile_data['education'] = [{'institution': data['schoolName'], 'degree': data.get('gradeLevel', 'Student')}]

            # Add to update
            update_fields.append("profile_data = %s")
            update_values.append(json.dumps(current_profile_data))
            
            update_fields.append("updated_at = NOW()")
            update_values.append(user_id)

            if update_fields:
                query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
                cursor.execute(query, tuple(update_values))
                # No commit needed as autocommit=True in _get_db_connection
                
            cursor.close()
            conn.close()
            
            return True, "Profile updated successfully", {}
            
        except Exception as e:
            self.logger.error(f"Update profile failed: {e}")
            import traceback
            traceback.print_exc()
            return False, f"Update failed: {str(e)}", None
