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
        
        # Initialize authentication manager
        auth_manager = AuthenticationManager()
        
        # Set UAE nationality by default
        data['nationality'] = 'UAE'
        
        # Register user
        success, message, result_data = auth_manager.register_user(data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'data': {
                    'user_id': result_data['user_data']['id'] if 'user_data' in result_data else None,
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
            profile_data['secondary_roles'] = user_data.get('secondary_roles') or []
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
            'role': user_data.get('role', 'job_seeker'),
            'user_type': user_data.get('role', 'job_seeker'),
            'permissions': get_role_permissions(user_data.get('role', 'job_seeker')),
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
    Update user's primary role and metadata
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        primary_role = data.get('primary_role')
        # secondary_roles = data.get('secondary_roles', [])
        metadata = data.get('metadata', {})
        
        if not primary_role:
             return jsonify({'success': False, 'message': 'primary_role is required'}), 400
             
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
        'job_seeker': [
            'view_dashboard',
            'upload_cv',
            'apply_jobs',
            'view_profile',
            'edit_profile',
            'view_analytics'
        ],
        'hr_manager': [
            'view_dashboard',
            'view_candidates',
            'post_jobs',
            'manage_applications',
            'view_analytics',
            'conduct_interviews',
            'manage_team'
        ],
        'hr_recruiter': [
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
        'educator': [
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
        'growth_operator_education': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_institutions',
            'manage_programs',
            'onboard_education',
            'view_analytics'
        ],
        'growth_operator_company': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_companies',
            'onboard_employers',
            'view_analytics'
        ],
        'growth_operator_mentorship': [
            'view_dashboard',
            'roles.approve_requests',
            'manage_mentorship',
            'onboard_mentors',
            'view_analytics'
        ],
        'growth_operator_assessment': [
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
        'administrator': [ # Alias for admin
            'view_dashboard',
            'manage_users',
            'manage_system',
            'view_all_analytics',
            'system_configuration',
            'roles.approve_requests'
        ],
        'nafis_talent_operator': [
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
        'operations_monitor': [
            'view_dashboard',
            'view_operations_center',
            'view_all_analytics',
            'view_analytics'
        ],
        'operator': [
            'view_dashboard',
            'manage_growth',
            'view_analytics'
        ]
    }
    
    return role_permissions.get(role, role_permissions['job_seeker'])

# Error handlers
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


def _seed_dev_data(user_id, email, role):
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'emirati_user'),
            password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
        )
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 1. Ensure HR Profile
        cursor.execute("SELECT * FROM hr_profiles WHERE user_id = %s", (user_id,))
        profile = cursor.fetchone()
        company_id = None
        
        if not profile:
            # Check for existing company or create one
            cursor.execute("SELECT id FROM companies LIMIT 1")
            company = cursor.fetchone()
            if company:
                company_id = company['id']
            else:
                # Create default company
                company_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO companies (id, name, industry, description)
                    VALUES (%s, 'UAE Talent Solutions', 'Technology', 'Leading recruitment agency')
                    RETURNING id
                """, (company_id,))
                company_id = cursor.fetchone()['id']
                conn.commit()
            
            # Create HR Profile
            cursor.execute("""
                INSERT INTO hr_profiles (user_id, company_id, position, department)
                VALUES (%s, %s, 'Recruiter', 'HR')
            """, (user_id, company_id))
            conn.commit()
            logger.info(f"Seeded HR Profile for {email}")
        else:
            company_id = profile['company_id']
            
        # 2. Ensure Job Posting
        cursor.execute("SELECT id FROM job_postings WHERE created_by = %s", (user_id,))
        job = cursor.fetchone()
        
        if not job and company_id:
            jd_id = str(uuid.uuid4()) # Public ID
            job_uuid = str(uuid.uuid4()) # Primary Key
            cursor.execute("""
                INSERT INTO job_postings (
                    id, jd_id, recruiter_id, company_id, created_by, title, description, 
                    status, salary_range_min, salary_range_max, currency,
                    location, employment_type, experience_level
                ) VALUES (
                    %s, %s, %s, %s, %s, 'Senior Software Engineer', 'We are looking for a skilled engineer to join our team.',
                    'active', 15000, 25000, 'AED',
                    'Dubai', 'full-time', 'mid'
                )
            """, (job_uuid, jd_id, user_id, company_id, user_id))
            conn.commit()
            logger.info(f"Seeded Sample Job for {email}")
            
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"Seeding error: {e}")
        # Don't raise, just log, so login still works
        pass

@auth_bp.route('/dev-login', methods=['POST'])
def dev_login():
    """
    Development only: Generate a token for a mock user, ensuring they exist in DB
    """
    try:
        data = request.get_json()
        mock_user_id = data.get('user_id')
        role = data.get('role', 'job_seeker')
        email = data.get('email')
        
        if not email:
            return jsonify({'success': False, 'message': 'email required'}), 400

        # Initialize authentication manager
        auth_manager = AuthenticationManager()
        
        # Check if user exists
        # Navigate name mangling/protected method access for dev utility
        user = auth_manager._get_user_by_email(email)
        
        real_user_id = None
        
        if user:
            real_user_id = user['id']
            # Update role if needed? No, respect DB role.
        else:
            # Create user if not exists
            logger.info(f"Dev Login: Creating missing user {email}")
            user_data = {
                'email': email,
                'password': 'DevPassword123!', # Default dev password
                'first_name': 'Dev',
                'last_name': role.capitalize(),
                'role': role,
                'phone': '+971500000000', # Dummy phone
                'nationality': 'UAE',
                'emirate': 'Dubai'
            }
            success, msg, res = auth_manager.register_user(user_data)
            if success and res:
                 real_user_id = res['user_id']
            else:
                 return jsonify({'success': False, 'message': f'Failed to create dev user: {msg}'}), 500

        # Create access token with REAL identity
        # Add role to claims if needed by your JWT setup
        additional_claims = {'role': role, 'email': email}
        access_token = create_access_token(identity=str(real_user_id), additional_claims=additional_claims)
        
        # Seed data for HR roles if missing
        if role in ('hr_recruiter', 'recruiter', 'hr', 'hr_manager'):
             try:
                _seed_dev_data(str(real_user_id), email, role)
             except Exception as seed_err:
                 logger.error(f"Seeding failed: {seed_err}")
        
        # Fetch full user details to ensure secondary_roles are included
        full_user_data = auth_manager.get_user_by_id(str(real_user_id))
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': access_token,
                'user': {
                    'id': str(real_user_id),
                    'role': role,
                    'email': email,
                    'user_type': role,
                    'secondary_roles': full_user_data.get('secondary_roles', []) if full_user_data else [],
                    'full_name': f"{full_user_data.get('first_name', '')} {full_user_data.get('last_name', '')}".strip() if full_user_data else 'Dev User'
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Dev login error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/request-otp', methods=['POST', 'OPTIONS'])
def request_otp_route():
    """Request OTP for phone verification"""
    if request.method == 'OPTIONS':
        # Manual CORS Preflight Response
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8089')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    try:
        data = request.get_json()
        phone = data.get('phone')
        if not phone:
            return jsonify({'success': False, 'message': 'Phone number required'}), 400
        
        auth_manager = AuthenticationManager()
        # Ensure we call the new method (which we added to the class)
        # Note: request_otp was added to AuthenticationManager in auth_manager_fixed.py
        if not hasattr(auth_manager, 'request_otp'):
             return jsonify({'success': False, 'message': 'OTP system not fully initialized'}), 503

        success, msg, otp = auth_manager.request_otp(phone)
        
        if success:
            # Include debug_otp only in dev environment if needed, but for now we follow the plan
            response = {'success': True, 'message': msg}
            if otp: # Magic or Test mode
                response['debug_otp'] = otp
            return jsonify(response), 200
            
        return jsonify({'success': False, 'message': msg}), 400
    except Exception as e:
        logger.error(f"OTP Request Validaton Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/login-with-otp', methods=['POST'])
def login_with_otp_route():
    """Login or Register with OTP"""
    try:
        data = request.get_json()
        phone = data.get('phone')
        code = data.get('code')
        if not phone or not code:
             return jsonify({'success': False, 'message': 'Phone and code required'}), 400
             
        auth_manager = AuthenticationManager()
        
        if not hasattr(auth_manager, 'authenticate_by_phone'):
             return jsonify({'success': False, 'message': 'OTP auth not implemented'}), 503

        success, msg, user_data = auth_manager.authenticate_by_phone(phone, code)
        
        if success and user_data:
            # Create tokens
            # Determine role/user_type
            identity_role = user_data.get('user_type') or user_data.get('role') or 'job_seeker'
            
            # Ensure ID is string
            user_id = str(user_data.get('id', ''))
            
            access_token = create_access_token(
                identity=user_id, 
                additional_claims={'role': identity_role}
            )
            refresh_token = create_refresh_token(identity=user_id)
            
            return jsonify({
                'success': True,
                'message': msg,
                'data': {
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': user_data
                }
            }), 200
            
        return jsonify({'success': False, 'message': msg}), 401
    except Exception as e:
        logger.error(f"OTP Login Error: {e}")









