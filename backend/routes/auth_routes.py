"""
Authentication Routes for Emirati Journey Platform
UAE Nationals Only - Updated Requirements with Working Week Configuration
"""

from flask import Blueprint, request, jsonify, current_app
import psycopg2
import psycopg2.extras
import uuid
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dataclasses import fields
from datetime import datetime

from backend.auth.auth_manager_fixed import AuthenticationManager
from backend.models.user_profile import UserProfile, PersonalInfo, ProfessionalInfo, ContactInfo, Skill, EducationRecord, VisaStatus, ExperienceLevel, EmploymentStatus

import logging
import os
import json

# Helper for safe dataclass instantiation
def _safe_init(dataclass_type, **kwargs):
    """Safely instantiate a dataclass by filtering out unknown arguments."""
    valid_fields = {f.name for f in fields(dataclass_type)}
    filtered_kwargs = {k: v for k, v in kwargs.items() if k in valid_fields}
    return dataclass_type(**filtered_kwargs)

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize logger
logger = logging.getLogger(__name__)

# --- Rate Limiter ---
# Uses in-memory storage by default. To use Redis, set REDIS_URL in .env.
_storage_uri = os.getenv('REDIS_URL') or 'memory://'
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=_storage_uri,
    default_limits=['30 per minute'],
    strategy='fixed-window',
)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit('5 per minute')
def register():
    """
    Register a new UAE National user
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'first_name', 'last_name', 'phone', 'emirate']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Validate required consents (PDPL T4.2)
        consents = data.get('consents', {})
        required_consents = ['terms', 'privacy', 'data_processing']
        for rc in required_consents:
            if not consents.get(rc):
                return jsonify({
                    'success': False,
                    'message': f'Required consent missing or not granted: {rc}'
                }), 400
        
        # Strip role fields — new users are always candidates (T1.4)
        for field in ['role', 'primary_role', 'roles', 'secondary_roles']:
            data.pop(field, None)
        data['role'] = 'candidate'
        data['primary_role'] = 'candidate'
        
        # Initialize authentication manager
        auth_manager = AuthenticationManager()
        
        # Set UAE nationality by default
        data['nationality'] = 'UAE'
        
        # Register user
        success, message, result_data = auth_manager.register_user(data)
        
        if success:
            user_id = result_data.get('user_id') if result_data else None
            if user_id:
                # Record consents to DB
                from backend.db import get_db_connection
                conn = get_db_connection()
                try:
                    with conn.cursor() as cur:
                        for consent_type in required_consents:
                            cur.execute("""
                                INSERT INTO consents (user_id, consent_type, granted, policy_version, source, ip_address, user_agent)
                                VALUES (%s, %s, True, '1.0', 'registration', %s, %s);
                            """, (
                                user_id,
                                consent_type,
                                request.remote_addr,
                                request.headers.get('User-Agent', 'unknown')
                            ))
                    conn.commit()
                except Exception as db_err:
                    conn.rollback()
                    logger.error(f"Error inserting consents during registration: {db_err}")
                finally:
                    conn.close()

            return jsonify({
                'success': True,
                'message': message,
                'data': {
                    'user_id': user_id,
                    'email_verification_required': True,
                    'phone_verification_required': True
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Registration failed due to system error'
        }), 500

@auth_bp.route('/login', methods=['POST'])
@limiter.limit('10 per minute')
def login():
    """
    Authenticate user login
    """
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        mfa_code = data.get('mfa_code')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Initialize authentication manager
        auth_manager = AuthenticationManager()
        
        # Authenticate user
        success, message, result_data = auth_manager.authenticate_user(email, password)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'data': result_data
            }), 200
        else:
            status_code = 401
            if 'requires_mfa' in (result_data or {}):
                status_code = 200  # MFA required is not an error
            elif 'locked' in message.lower():
                status_code = 423  # Account locked
            
            return jsonify({
                'success': False,
                'message': message,
                'data': result_data
            }), status_code
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Authentication failed due to system error'
        }), 500

@auth_bp.route('/verify-email', methods=['POST'])
@limiter.limit('10 per minute')
def verify_email():
    """
    Verify user email address
    """
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Verification token is required'
            }), 400
        
        # Initialize authentication manager
        auth_manager = AuthenticationManager()
        
        # Verify email
        success, message = auth_manager.verify_email(token)
        
        return jsonify({
            'success': success,
            'message': message
        }), 200 if success else 400
        
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Email verification failed'
        }), 500

@auth_bp.route('/verify-phone', methods=['POST'])
@limiter.limit('10 per minute')
def verify_phone():
    """
    Verify user phone number
    """
    try:
        data = request.get_json()
        phone = data.get('phone')
        code = data.get('code')
        
        if not phone or not code:
            return jsonify({
                'success': False,
                'message': 'Phone number and verification code are required'
            }), 400
        
        # Initialize authentication manager
        auth_manager = AuthenticationManager()
        
        # Verify phone
        success, message = auth_manager.verify_phone(phone, code)
        
        return jsonify({
            'success': success,
            'message': message
        }), 200 if success else 400
        
    except Exception as e:
        logger.error(f"Phone verification error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Phone verification failed'
        }), 500

@auth_bp.route('/setup-mfa', methods=['POST'])
@jwt_required()
def setup_mfa():
    """
    Set up Multi-Factor Authentication
    """
    try:
        user_id = get_jwt_identity()
        
        # Initialize authentication manager
        auth_manager = AuthenticationManager()
        
        # Setup MFA
        success, message, result_data = auth_manager.setup_mfa(user_id)
        
        return jsonify({
            'success': success,
            'message': message,
            'data': result_data
        }), 200 if success else 400
        
    except Exception as e:
        logger.error(f"MFA setup error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'MFA setup failed'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    """
    try:
        user_id = get_jwt_identity()
        
        # Look up the user's role so the refreshed token keeps it
        role = None
        try:
            auth_manager = AuthenticationManager()
            user_data = auth_manager.get_user_by_id(user_id)
            if user_data:
                role = user_data.get('role') or user_data.get('user_type')
        except Exception as role_err:
            logger.warning(f"Could not look up role during refresh: {role_err}")
        
        # Create new access token WITH role claim
        additional_claims = {}
        if role:
            additional_claims['role'] = role
        access_token = create_access_token(identity=user_id, additional_claims=additional_claims)
        
        return jsonify({
            'success': True,
            'message': 'Token refreshed successfully',
            'data': {
                'access_token': access_token
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Token refresh failed'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user (blacklist token)
    """
    try:
        # In a real implementation, you would blacklist the JWT token
        # For now, we'll just return success
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Logout failed'
        }), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get user profile information with UAE working week configuration
    """
    try:
        user_id = get_jwt_identity()
        
        # Initialize user profile
        profile = UserProfile(user_id)
        
        # Get profile data
        auth_manager = AuthenticationManager()
        user_data = auth_manager.get_user_by_id(user_id) or {}
        
        # Populate UserProfile from DB data
        
        # 1. Personal Info
        if not profile.personal_info:
             # Construct PersonalInfo using safe init
             personal_info_kwargs = {}
             # prioritize user_data but check db_profile_data? Usually user_data has basics
             personal_info_kwargs.update(user_data)
             personal_info_kwargs.update({
                 'first_name': user_data.get('first_name') or '',
                 'last_name': user_data.get('last_name') or '',
                 'nationality': user_data.get('nationality'),
                 'emirate': user_data.get('emirate'),
                 'city': user_data.get('location'), 
                 'gender': user_data.get('gender'), 
                 'date_of_birth': user_data.get('date_of_birth')
             })
             profile.personal_info = _safe_init(PersonalInfo, **personal_info_kwargs)

        # 2. Contact Info
        contact_kwargs = {
            'email': user_data.get('email') or '',
            'phone': user_data.get('phone') or ''
        }
        profile.contact_info = _safe_init(ContactInfo, **contact_kwargs)

        # 3. Professional Info & Skills & JSON Data
        db_profile_data = user_data.get('profile_data') or {}
        if isinstance(db_profile_data, str):
            try:
                db_profile_data = json.loads(db_profile_data)
            except:
                db_profile_data = {}
        
        # Skills (Array of strings in DB -> List[Skill] in Obj)
        db_skills = user_data.get('skills') or db_profile_data.get('skills') or []
        for s_name in db_skills:
             if isinstance(s_name, str):
                 profile.skills.append(_safe_init(Skill, name=s_name, level='Intermediate'))

        # Professional Info
        prof_kwargs = db_profile_data.copy()
        prof_kwargs.update({
            'years_of_experience': user_data.get('experience_years') or db_profile_data.get('years_of_experience'),
            'current_job_title': db_profile_data.get('current_position'),
            'current_company': db_profile_data.get('current_company')
        })
        profile.professional_info = _safe_init(ProfessionalInfo, **prof_kwargs)

        profile_data = profile.to_dict()
        
        # Inject raw data for fields not in UserProfile strict schema but needed by frontend
        profile_data['professional_summary'] = db_profile_data.get('professional_summary')
        profile_data['education'] = db_profile_data.get('education') or [] 
        profile_data['languages'] = db_profile_data.get('languages') or []
        profile_data['certifications'] = db_profile_data.get('certifications') or []
        profile_data['skills'] = db_skills # Return simple list too if frontend prefers
        profile_data['current_position'] = db_profile_data.get('current_position')
        profile_data['current_company'] = db_profile_data.get('current_company')
        profile_data['experience_years'] = user_data.get('experience_years') or db_profile_data.get('experience_years')
        
        # Inject Student Info fields to top level for frontend compatibility
        student_info = db_profile_data.get('student_info') or {}
        if student_info:
            profile_data.update(student_info)
            profile_data['student_info'] = student_info # Keep nested copy just in case
            
        # Inject Location Data from columns if available
        if 'latitude' in user_data:
             profile_data['latitude'] = user_data['latitude']
        if 'longitude' in user_data:
             profile_data['longitude'] = user_data['longitude']
             
        # Inject Emirates ID from JSONB
        if 'emirates_id' in db_profile_data:
             profile_data['emirates_id'] = db_profile_data['emirates_id']
        
        # Synchronize essential identity fields
        if user_data:
            raw_secondary = user_data.get('secondary_roles') or []
            
            # Cross-reference growth_operator_* roles against the authoritative
            # growth_operator_assignments table.  The Operators tab may deactivate
            # domain assignments without updating the secondary_roles column,
            # causing stale roles to appear in the role-switcher.
            has_go_roles = any(
                r and r.startswith('growth_operator') for r in raw_secondary
            ) or (user_data.get('role') or '').startswith('growth_operator')
            
            if has_go_roles:
                try:
                    from backend.db import get_db_connection
                    go_conn = get_db_connection()
                    go_cur = go_conn.cursor()
                    go_cur.execute(
                        "SELECT domain FROM growth_operator_assignments WHERE user_id = %s AND is_active = true",
                        (user_id,)
                    )
                    active_domains = [row[0] for row in go_cur.fetchall()]
                    go_conn.close()
                    
                    if active_domains:
                        # Keep non-growth-operator roles, replace GO roles with active assignments
                        non_go = [r for r in raw_secondary if not r.startswith('growth_operator')]
                        go_from_assignments = [f"growth_operator_{d}" for d in active_domains]
                        raw_secondary = non_go + go_from_assignments
                except Exception as go_err:
                    logger.warning(f"Could not cross-ref growth_operator_assignments for profile: {go_err}")
            
            # Default Job Seeker role for UAE Nationals
            nationality = (user_data.get('nationality') or '').upper()
            if nationality in ['UAE', 'AE', 'UNITED ARAB EMIRATES']:
                if 'candidate' not in raw_secondary and user_data.get('role') != 'candidate':
                    raw_secondary.append('candidate')
            
            profile_data['secondary_roles'] = raw_secondary
            profile_data['id'] = user_data.get('id')
            profile_data['user_id'] = user_data.get('id')
            profile_data['role'] = user_data.get('role')
            profile_data['user_type'] = user_data.get('role')
            profile_data['email'] = user_data.get('email')
            profile_data['full_name'] = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
            profile_data['first_name'] = user_data.get('first_name')
            profile_data['last_name'] = user_data.get('last_name')
            profile_data['phone'] = user_data.get('phone')
            
            # Map location if missing
            if not profile_data.get('personal_info'): profile_data['personal_info'] = {}
            if not profile_data['personal_info'].get('city'):
                profile_data['personal_info']['city'] = user_data.get('location')
            
        # INFO: Ensure user_id is present in profile data to prevent frontend crashes (fallback)
        if 'id' not in profile_data:
             profile_data['id'] = user_id

        
        # Add UAE working week information from environment variables
        uae_working_days = os.getenv('UAE_WORKING_DAYS', 'Monday,Tuesday,Wednesday,Thursday,Friday').split(',')
        uae_weekend_days = os.getenv('UAE_WEEKEND_DAYS', 'Saturday,Sunday').split(',')
        uae_business_hours_weekday = os.getenv('UAE_BUSINESS_HOURS_WEEKDAY', '08:00-17:00')
        uae_business_hours_friday = os.getenv('UAE_BUSINESS_HOURS_FRIDAY', '08:00-12:00')
        uae_half_day = os.getenv('UAE_HALF_DAY', 'Friday')
        
        # Add UAE-specific configuration to profile
        profile_data.update({
            'working_days': uae_working_days,
            'weekend_days': uae_weekend_days,
            'business_hours': {
                'weekdays': uae_business_hours_weekday,
                'friday': uae_business_hours_friday,
                'half_day': uae_half_day
            },
            'timezone': os.getenv('TIMEZONE', 'Asia/Dubai'),
            'locale': os.getenv('LOCALE', 'en_AE'),
            'currency': os.getenv('CURRENCY', 'AED'),
            'date_format': os.getenv('DATE_FORMAT', '%d/%m/%Y'),
            'time_format': os.getenv('TIME_FORMAT', '%H:%M'),
            'nationality': 'UAE',
            'country': 'United Arab Emirates',
            'cultural_context': {
                'working_week': 'Monday to Friday',
                'weekend': 'Saturday to Sunday',
                'friday_prayers': 'Half working day (08:00-12:00)',
                'business_culture': 'UAE National standards'
            }
        })
        
        # Fetch profile photo from candidate_profiles
        try:
             conn_photo = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', '5432'),
                database=os.getenv('DB_NAME', 'emirati_journey'),
                user=os.getenv('DB_USER', 'emirati_user'),
                password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
            )
             cur_photo = conn_photo.cursor()
             cur_photo.execute("SELECT profile_photo_url FROM candidate_profiles WHERE user_id = %s", (str(user_id),))
             photo_row = cur_photo.fetchone()
             if photo_row and photo_row[0]:
                 profile_data['profile_photo_url'] = photo_row[0]
             conn_photo.close()
             conn_photo.close()
        except Exception as e:
             logger.warning(f"Failed to fetch profile photo: {e}")

        # [CRITICAL FIX] Merge all dynamic profile_data fields (Recruiter, Helper, etc.) 
        # into the top-level response so Frontend receives "hiringVolume", "companyName" etc.
        if isinstance(db_profile_data, dict):
             # Protect core identity fields from being overwritten by JSON garbage
             readonly_keys = {'id', 'user_id', 'email', 'role', 'user_type', 'is_verified'}
             for k, v in db_profile_data.items():
                 # Only add if not already present or if it helps enrich data
                 if k not in profile_data and k not in readonly_keys:
                     profile_data[k] = v
                 # Special case: Ensure companyName overrides if missing in standard profile
                 elif k == 'companyName' and not profile_data.get('companyName'):
                     profile_data[k] = v
        
        # [CRITICAL FIX] Ensure company_id and company_name from user_data are included
        if 'company_id' in user_data:
            profile_data['company_id'] = user_data['company_id']
        if 'company_name' in user_data:
            profile_data['company_name'] = user_data['company_name']

        return jsonify({
            'success': True,
            'message': 'Profile retrieved successfully',
            'data': profile_data
        }), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Profile retrieval error: {str(e)}")
        try:
            with open('backend/profile_error.log', 'w') as f:
                f.write(f"Error: {str(e)}\nTraceback:\n{error_trace}")
        except:
            pass
        return jsonify({
            'success': False,
            'message': f'Profile retrieval failed: {str(e)}',
            'debug_trace': error_trace
        }), 500

    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Profile update failed: {str(e)}'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update user profile information
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        print(f"DEBUG: update_profile called for user_id={user_id}")
        print(f"DEBUG: Payload: {json.dumps(data, indent=2)}")
        
        # Update using centralized AuthManager
        auth_manager = AuthenticationManager()
        success, message, result_data = auth_manager.update_user_profile(user_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'data': result_data or {}
            }), 200
        else:
             return jsonify({
                'success': False,
                'message': message
            }), 400
        
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Profile update failed: {str(e)}'
        }), 500

@auth_bp.route('/working-schedule', methods=['GET'])
@jwt_required()
def get_working_schedule():
    """
    Get UAE working schedule information
    """
    try:
        # Get UAE working schedule from environment variables
        working_schedule = {
            'working_days': os.getenv('UAE_WORKING_DAYS', 'Monday,Tuesday,Wednesday,Thursday,Friday').split(','),
            'weekend_days': os.getenv('UAE_WEEKEND_DAYS', 'Saturday,Sunday').split(','),
            'business_hours': {
                'monday_to_thursday': os.getenv('UAE_BUSINESS_HOURS_WEEKDAY', '08:00-17:00'),
                'friday': os.getenv('UAE_BUSINESS_HOURS_FRIDAY', '08:00-12:00'),
                'saturday_sunday': 'Closed (Weekend)'
            },
            'special_notes': {
                'friday': 'Half working day for Jummah prayers',
                'weekend': 'Saturday and Sunday are full weekend days',
                'culture': 'Aligned with UAE business practices and Islamic traditions'
            },
            'timezone': os.getenv('TIMEZONE', 'Asia/Dubai'),
            'locale': os.getenv('LOCALE', 'en_AE')
        }
        
        return jsonify({
            'success': True,
            'message': 'Working schedule retrieved successfully',
            'data': working_schedule
        }), 200
        
    except Exception as e:
        logger.error(f"Working schedule retrieval error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Working schedule retrieval failed'
        }), 500

@auth_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_user_roles():
    """
    Get current user's roles and permissions
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Initialize authentication manager
        auth_manager = AuthenticationManager()
        
        # Get user data
        user_data = auth_manager.get_user_by_id(current_user_id)
        
        if not user_data:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Return user roles and permissions
        roles_data = {
            'user_id': str(user_data['id']),
            'email': user_data['email'],
            'role': user_data.get('role', 'candidate'),
            'user_type': user_data.get('role', 'candidate'),
            'permissions': get_role_permissions(user_data.get('role', 'candidate')),
            'secondary_roles': user_data.get('secondary_roles', []),
            'is_active': user_data.get('is_active', True),
            'is_verified': user_data.get('is_verified', False)
        }
        
        return jsonify({
            'success': True,
            'data': roles_data
        }), 200
        
    except Exception as e:
        logger.error(f"Get roles error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get user roles'
        }), 500

@auth_bp.route('/update-roles', methods=['PUT'])
@jwt_required()
def update_user_roles():
    """
    Update user's primary role and metadata (admin-only — T1.4)
    """
    try:
        from flask_jwt_extended import get_jwt
        claims = get_jwt()
        current_role = claims.get('role', '')
        if current_role not in ['admin', 'platform_administrator', 'super_admin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        primary_role = data.get('primary_role')
        # secondary_roles = data.get('secondary_roles', [])
        metadata = data.get('metadata', {})
        
        if not primary_role:
             return jsonify({'success': False, 'message': 'primary_role is required'}), 400
        
        # Role allow-list validation (T1.4)
        ALLOWED_ROLES = ['candidate', 'recruiter', 'assessor', 'educator', 'job_seeker', 'employer', 'training_center', 'advisor']
        if primary_role not in ALLOWED_ROLES:
            return jsonify({'error': f'Invalid role. Allowed: {ALLOWED_ROLES}'}), 400
             
        auth_manager = AuthenticationManager()
        
        # Check if update_user_role exists
        if not hasattr(auth_manager, 'update_user_role'):
             return jsonify({'success': False, 'message': 'Role update not supported completely'}), 501
             
        success, msg, updated_user = auth_manager.update_user_role(user_id, primary_role, metadata)
        
        if success and updated_user:
            # Refresh token claims if necessary (usually requires re-login, but front-end can handle it)
            return jsonify({
                'success': True,
                'message': msg,
                'data': {'user': updated_user}
            }), 200
            
        return jsonify({
            'success': False,
            'message': msg
        }), 400
        
    except Exception as e:
        logger.error(f"Update roles error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Failed to update roles: {str(e)}"
        }), 500

def get_role_permissions(role: str) -> list:
    """Get permissions for a given role"""
    role_permissions = {
        'candidate': [
            'view_dashboard',
            'upload_cv',
            'apply_jobs',
            'view_profile',
            'edit_profile',
            'view_analytics'
        ],
        'employer_admin': [
            'view_dashboard',
            'view_candidates',
            'post_jobs',
            'manage_applications',
            'view_analytics',
            'conduct_interviews',
            'manage_team'
        ],
        'recruiter': [
            'view_dashboard',
            'view_candidates',
            'post_jobs',
            'manage_applications',
            'view_analytics',
            'conduct_interviews'
        ],
        'recruiter': [
            'view_dashboard',
            'view_candidates',
            'post_jobs',
            'manage_applications',
            'view_analytics',
            'conduct_interviews'
        ],
        'training_provider': [
            'view_dashboard',
            'manage_curriculum',
            'track_students',
            'view_analytics',
            'create_programs'
        ],
        'mentor': [
            'view_dashboard',
            'mentor_candidates',
            'track_progress',
            'view_analytics',
            'provide_guidance'
        ],
        'assessor': [
            'view_dashboard',
            'conduct_assessments',
            'validate_competencies',
            'view_analytics',
            'certify_skills'
        ],
        'growth_operator': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_growth',
            'view_analytics'
        ],
        'education_operator': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_institutions',
            'manage_programs',
            'onboard_education',
            'view_analytics'
        ],
        'employer_relations': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_companies',
            'onboard_employers',
            'view_analytics'
        ],
        'mentorship_operator': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_mentorship',
            'onboard_mentors',
            'view_analytics'
        ],
        'assessment_operator': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_assessments',
            'onboard_assessors',
            'view_analytics'
        ],
        'admin': [
            'view_dashboard',
            'manage_users',
            'manage_system',
            'view_all_analytics',
            'system_configuration',
            'roles.approve_requests'
        ],
        'admin': [ # Alias for admin
            'view_dashboard',
            'manage_users',
            'manage_system',
            'view_all_analytics',
            'system_configuration',
            'roles.approve_requests'
        ],
        'talent_operator': [
            'view_dashboard',
            'bulk_import_candidates',
            'manage_nafis_sync',
            'onboard_candidates',
            'manage_candidate_engagement',
            'view_analytics'
        ],
        'education_operator': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_institutions',
            'manage_programs',
            'onboard_education',
            'manage_education_partnerships',
            'view_analytics'
        ],
        'professional_dev_operator': [
            'view_dashboard',
            'manage_training',
            'manage_certifications',
            'onboard_mentors',
            'onboard_assessment',
            'manage_mentorship_programs',
            'manage_assessment_centers',
            'view_analytics'
        ],
        'community_operator': [
            'view_dashboard',
            'manage_content',
            'moderate_communities',
            'manage_community_events',
            'view_analytics'
        ],
        'platform_operator': [
            'view_dashboard',
            'view_operations_center',
            'view_all_analytics',
            'view_analytics'
        ],
        'operator': [
            'view_dashboard',
            'manage_growth',
            'view_analytics'
        ],
        'career_services_operator': [
            'view_dashboard',
            'manage_growth',
            'view_analytics'
        ],
        'call_center_agent': [
            'view_dashboard',
            'view_users',
            'view_analytics'
        ]
    }
    
    return role_permissions.get(role, role_permissions['candidate'])

@auth_bp.route('/consents', methods=['POST'])
@jwt_required()
def update_consents():
    """
    Grant or withdraw consents.
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        consent_type = data.get('consent_type')
        granted = data.get('granted')
        policy_version = data.get('policy_version', '1.0')
        
        if not consent_type or granted is None:
            return jsonify({
                'success': False,
                'message': 'consent_type and granted fields are required'
            }), 400
            
        from backend.db import get_db_connection
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                if granted:
                    cur.execute("""
                        INSERT INTO consents (user_id, consent_type, granted, policy_version, source, ip_address, user_agent)
                        VALUES (%s, %s, True, %s, 'settings', %s, %s);
                    """, (
                        user_id,
                        consent_type,
                        policy_version,
                        request.remote_addr,
                        request.headers.get('User-Agent', 'unknown')
                    ))
                else:
                    cur.execute("""
                        UPDATE consents 
                        SET withdrawn_at = NOW(), granted = False
                        WHERE user_id = %s AND consent_type = %s AND withdrawn_at IS NULL;
                    """, (user_id, consent_type))
            conn.commit()
            return jsonify({
                'success': True,
                'message': f"Consent '{consent_type}' updated successfully"
            }), 200
        except Exception as db_err:
            conn.rollback()
            logger.error(f"Database error updating consent: {db_err}")
            return jsonify({
                'success': False,
                'message': 'Database error occurred'
            }), 500
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Consent update failed: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@auth_bp.route('/consents/me', methods=['GET'])
@jwt_required()
def get_my_consents():
    """
    Get all consents given by the current user.
    """
    try:
        user_id = get_jwt_identity()
        from backend.db import get_db_connection
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("""
                    SELECT consent_type, granted, policy_version, created_at, withdrawn_at 
                    FROM consents 
                    WHERE user_id = %s
                    ORDER BY created_at DESC;
                """, (user_id,))
                rows = cur.fetchall()
                
                latest_consents = {}
                for row in rows:
                    ct = row['consent_type']
                    if ct not in latest_consents:
                        latest_consents[ct] = {
                            'consent_type': ct,
                            'granted': row['granted'] and (row['withdrawn_at'] is None),
                            'policy_version': row['policy_version'],
                            'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                            'withdrawn_at': row['withdrawn_at'].isoformat() if row['withdrawn_at'] else None
                        }
                return jsonify({
                    'success': True,
                    'consents': list(latest_consents.values())
                }), 200
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Get consents failed: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@auth_bp.route('/dsr/export', methods=['GET'])
@jwt_required()
def dsr_export():
    """
    Get a machine-readable bundle of all data held about the current user.
    """
    try:
        user_id = get_jwt_identity()
        from backend.db import get_db_connection
        conn = get_db_connection()
        data_bundle = {}
        
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("SELECT id, email, first_name, last_name, phone, role, emirate, nationality, is_active, is_verified, created_at FROM users WHERE id = %s;", (user_id,))
                user_row = cur.fetchone()
                if user_row:
                    data_bundle['user'] = dict(user_row)
                    if data_bundle['user'].get('created_at'):
                        data_bundle['user']['created_at'] = data_bundle['user']['created_at'].isoformat()
                
                user_linked_tables = [
                    ('consents', 'user_id', 'consents'),
                    ('user_cvs', 'user_id', 'cvs'),
                    ('cv_profiles', 'user_id', 'cv_profiles'),
                    ('candidate_profiles', 'user_id', 'candidate_profiles'),
                    ('nafis_job_seekers', 'user_id', 'nafis_data'),
                    ('notifications', 'user_id', 'notifications'),
                    ('messages', 'sender_id', 'messages_sent'),
                    ('user_activity_log', 'user_id', 'activity_logs'),
                    ('user_sessions', 'user_id', 'sessions'),
                    ('user_journey_analytics', 'user_id', 'journey_analytics')
                ]
                
                for table, col, label in user_linked_tables:
                    try:
                        cur.execute(f"SELECT * FROM {table} WHERE {col} = %s;", (user_id,))
                        rows = cur.fetchall()
                        data_bundle[label] = [dict(r) for r in rows]
                        for r in data_bundle[label]:
                            for k, v in r.items():
                                if isinstance(v, datetime):
                                    r[k] = v.isoformat()
                    except Exception as tbl_err:
                        conn.rollback()
                        logger.warning(f"DSR export skipped table {table}: {tbl_err}")
                        
        finally:
            conn.close()
            
        return jsonify({
            'success': True,
            'data_subject': user_id,
            'exported_at': datetime.utcnow().isoformat(),
            'data': data_bundle
        }), 200
        
    except Exception as e:
        logger.error(f"DSR export failed: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@auth_bp.route('/dsr/erase', methods=['POST'])
@jwt_required()
def dsr_erase():
    """
    Cascading erasure/anonymization of all user PII data.
    """
    try:
        user_id = get_jwt_identity()
        from backend.db import get_db_connection
        conn = get_db_connection()
        conn.autocommit = False
        
        try:
            with conn.cursor() as cur:
                import secrets
                file_paths = []
                try:
                    cur.execute("SELECT filename FROM user_cvs WHERE user_id = %s;", (user_id,))
                    filenames = [row[0] for row in cur.fetchall() if row[0]]
                    for fn in filenames:
                        file_paths.append(os.path.join('uploads', 'cv_uploads', fn))
                        file_paths.append(os.path.join('/tmp', 'cv_uploads', fn))
                        import tempfile
                        file_paths.append(os.path.join(tempfile.gettempdir(), 'cv_uploads', fn))
                except Exception as fe:
                    conn.rollback()
                    logger.warning(f"Error fetching CV filenames: {fe}")
                
                try:
                    cur.execute("DELETE FROM consents WHERE user_id = %s;", (user_id,))
                except Exception:
                    conn.rollback()
                
                cv_profile_ids = []
                try:
                    cur.execute("SELECT id FROM cv_profiles WHERE user_id = %s;", (user_id,))
                    cv_profile_ids = [row[0] for row in cur.fetchall()]
                except Exception:
                    conn.rollback()
                
                for cv_pid in cv_profile_ids:
                    for child_tbl in ['cv_versions', 'cv_usage_logs', 'cv_analytics']:
                        try:
                            cur.execute(f"DELETE FROM {child_tbl} WHERE profile_id = %s;", (cv_pid,))
                        except Exception:
                            conn.rollback()
                try:
                    cur.execute("DELETE FROM cv_profiles WHERE user_id = %s;", (user_id,))
                except Exception:
                    conn.rollback()
                try:
                    cur.execute("DELETE FROM user_cvs WHERE user_id = %s;", (user_id,))
                except Exception:
                    conn.rollback()
                    
                candidate_profile_ids = []
                try:
                    cur.execute("SELECT id FROM candidate_profiles WHERE user_id = %s;", (user_id,))
                    candidate_profile_ids = [row[0] for row in cur.fetchall()]
                except Exception:
                    conn.rollback()
                
                candidate_child_tables = [
                    'candidate_assessments', 'candidate_certifications', 
                    'candidate_education_entries', 'candidate_experience_entries', 
                    'candidate_skills', 'candidate_shortlist'
                ]
                for cp_id in candidate_profile_ids:
                    for tbl in candidate_child_tables:
                        try:
                            cur.execute(f"DELETE FROM {tbl} WHERE profile_id = %s;", (cp_id,))
                        except Exception:
                            conn.rollback()
                
                try:
                    cur.execute("DELETE FROM candidate_profiles WHERE user_id = %s;", (user_id,))
                except Exception:
                    conn.rollback()
                    
                other_user_tables = [
                    ('notifications', 'user_id'),
                    ('messages', 'sender_id'),
                    ('user_activity_log', 'user_id'),
                    ('user_sessions', 'user_id'),
                    ('user_journey_analytics', 'user_id'),
                    ('nafis_job_seekers', 'user_id')
                ]
                for tbl, col in other_user_tables:
                    try:
                        cur.execute(f"DELETE FROM {tbl} WHERE {col} = %s;", (user_id,))
                    except Exception:
                        conn.rollback()
                
                anon_suffix = secrets.token_hex(4)
                cur.execute("""
                    UPDATE users SET
                        first_name = 'Anonymized',
                        last_name = 'User',
                        full_name = 'Anonymized User',
                        email = %s,
                        phone = NULL,
                        emirates_id_enc = NULL,
                        fullname_ar = NULL,
                        nationality = 'Anonymized',
                        nationality_ar = NULL,
                        password_hash = '',
                        uaepass_uuid = NULL,
                        is_active = False,
                        is_verified = False,
                        updated_at = NOW()
                    WHERE id = %s;
                """, (f"deleted_user_{user_id}_{anon_suffix}@anonymized.local", user_id))
                
                cur.execute("""
                    INSERT INTO admin_audit_log 
                    (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
                    VALUES (%s, 'DSR Erase', 'user', %s, %s::jsonb, %s, %s);
                """, (
                    None,
                    user_id,
                    json.dumps({
                        'action_detail': 'Data Subject Right (DSR) Erasure executed',
                        'anonymized_user_id': user_id,
                        'timestamp': datetime.utcnow().isoformat()
                    }),
                    request.remote_addr,
                    request.headers.get('User-Agent', 'unknown')
                ))
                
            conn.commit()
            
            for fp in file_paths:
                if fp and os.path.exists(fp):
                    try:
                        os.remove(fp)
                        logger.info(f"DSR erased physical file: {fp}")
                    except Exception as file_err:
                        logger.warning(f"DSR failed to delete file {fp}: {file_err}")
            
            return jsonify({
                'success': True,
                'message': 'Your personal data has been completely erased and anonymized.'
            }), 200
            
        except Exception as db_err:
            conn.rollback()
            logger.error(f"DSR erase database error: {db_err}")
            return jsonify({
                'success': False,
                'message': 'Database error occurred during erasure'
            }), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"DSR erase failed: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@auth_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'message': 'Bad request'
    }), 400

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'message': 'Unauthorized access'
    }), 401

@auth_bp.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'message': 'Access forbidden'
    }), 403

@auth_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Resource not found'
    }), 404

@auth_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500
