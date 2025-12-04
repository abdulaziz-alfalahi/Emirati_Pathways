"""
Authentication Routes for Emirati Journey Platform
UAE Nationals Only - Updated Requirements with Working Week Configuration
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from auth.auth_manager_fixed import AuthenticationManager
from models.user_profile import UserProfile
import logging
import os

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize logger
logger = logging.getLogger(__name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new UAE National user
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'emirate']
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
        
        # Create new access token
        access_token = create_access_token(identity=user_id)
        
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
        # In a real implementation, you would load the profile from database
        
        # Get profile data
        profile_data = profile.to_dict()
        
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
        
        return jsonify({
            'success': True,
            'message': 'Profile retrieved successfully',
            'data': profile_data
        }), 200
        
    except Exception as e:
        logger.error(f"Profile retrieval error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Profile retrieval failed'
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
        
        # Initialize user profile
        profile = UserProfile(user_id)
        
        # Update different sections based on the data provided
        if 'personal_info' in data:
            profile.update_personal_info(data['personal_info'])
        
        if 'contact_info' in data:
            profile.update_contact_info(data['contact_info'])
        
        if 'professional_info' in data:
            profile.update_professional_info(data['professional_info'])
        
        # In a real implementation, you would save the profile to database
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'data': {
                'profile_completion': profile.profile_completion,
                'updated_at': profile.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Profile update failed'
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
            'permissions': _get_role_permissions(user_data.get('role', 'candidate')),
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

def _get_role_permissions(role: str) -> list:
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
        'hr_recruiter': [
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
        'admin': [
            'view_dashboard',
            'manage_users',
            'manage_system',
            'view_all_analytics',
            'system_configuration'
        ]
    }
    
    return role_permissions.get(role, role_permissions['candidate'])

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

@auth_bp.route('/dev-login', methods=['POST'])
def dev_login():
    """
    Development only: Generate a token for a mock user
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        role = data.get('role', 'candidate')
        email = data.get('email')
        
        if not user_id:
            return jsonify({'success': False, 'message': 'user_id required'}), 400

        # Create access token with identity as user_id
        # Add role to claims if needed by your JWT setup
        additional_claims = {'role': role, 'email': email}
        access_token = create_access_token(identity=str(user_id), additional_claims=additional_claims)
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': access_token,
                'user': {
                    'id': user_id,
                    'role': role,
                    'email': email
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Dev login error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
