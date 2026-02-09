"""
Enhanced authentication routes with support for all personas and flexible role system
"""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import re
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

# Available roles configuration
AVAILABLE_ROLES = [
    {
        'id': 'job_seeker',
        'name': 'Job Seeker',
        'description': 'Find your dream career with AI-powered job matching',
        'dashboard': '/candidate-dashboard'
    },
    {
        'id': 'student',
        'name': 'Student',
        'description': 'Access student resources, academic tracking, and career guidance',
        'dashboard': '/student-dashboard'
    },
    {
        'id': 'hr_recruiter',
        'name': 'HR / Recruiter',
        'description': 'Streamline hiring with advanced recruitment tools',
        'dashboard': '/recruiter'
    },
    {
        'id': 'educator',
        'name': 'Educator',
        'description': 'Enhance student outcomes with curriculum management',
        'dashboard': '/educator-dashboard'
    },
    {
        'id': 'mentor',
        'name': 'Mentor',
        'description': 'Guide the next generation of professionals',
        'dashboard': '/mentor-dashboard'
    },
    {
        'id': 'assessor',
        'name': 'Assessor',
        'description': 'Evaluate and validate professional competencies',
        'dashboard': '/assessor-dashboard'
    }
]

# Role mapping for backward compatibility
ROLE_MAPPING = {
    'job_seeker': 'job_seeker',
    'hr_manager': 'hr_recruiter',
    'recruiter': 'hr_recruiter',
    'hr_recruiter': 'hr_recruiter',
    'educator': 'educator',
    'mentor': 'mentor',
    'assessor': 'assessor',
    'administrator': 'administrator'  # Special admin role
}

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_uae_phone(phone):
    """Validate UAE phone number format"""
    pattern = r'^(\+971|971|0)(50|51|52|55|56|58|2|3|4|6|7|9)\d{7}$'
    return re.match(pattern, phone) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"

def get_role_info(role_id):
    """Get role information by ID"""
    return next((role for role in AVAILABLE_ROLES if role['id'] == role_id), None)

def normalize_role(role):
    """Normalize role to standard format"""
    return ROLE_MAPPING.get(role.lower(), role.lower())

@auth_bp.route('/register', methods=['POST'])
def register():
    """Enhanced user registration with role support"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'password', 'phone', 'emirate', 'user_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Extract and validate data
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        phone = data['phone'].strip()
        emirate = data['emirate']
        user_type = data['user_type']
        
        # Validate email
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate phone
        if not validate_uae_phone(phone):
            return jsonify({
                'success': False,
                'message': 'Invalid UAE phone number format'
            }), 400
        
        # Validate password
        is_valid, password_message = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': password_message
            }), 400
        
        # Normalize and validate role
        normalized_role = normalize_role(user_type)
        role_info = get_role_info(normalized_role)
        
        if not role_info and normalized_role != 'administrator':
            return jsonify({
                'success': False,
                'message': f'Invalid role: {user_type}'
            }), 400
        
        # Check if user already exists
        # Note: This would typically check against a database
        # For now, we'll simulate the check
        
        # Hash password
        password_hash = generate_password_hash(password)
        
        # Create user record (simulated)
        user_data = {
            'id': f"user_{datetime.now().timestamp()}",
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'phone': phone,
            'emirate': emirate,
            'user_type': normalized_role,
            'primary_role': normalized_role,
            'secondary_roles': [],
            'password_hash': password_hash,
            'is_verified': False,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"User registration successful: {email} with role {normalized_role}")
        
        return jsonify({
            'success': True,
            'message': 'Registration successful! Please verify your email and phone number.',
            'data': {
                'user_id': user_data['id'],
                'email_verification_required': True,
                'phone_verification_required': True,
                'role': normalized_role,
                'dashboard_route': role_info['dashboard'] if role_info else '/candidate-dashboard'
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during registration'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Enhanced user login with role-based routing"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validate email format
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Simulate user lookup and password verification
        # In a real implementation, this would query the database
        
        # For demo purposes, create a mock user
        mock_user = {
            'id': 'user_123',
            'email': email,
            'first_name': 'Ahmed',
            'last_name': 'Al Emirati',
            'phone': '+971501234567',
            'emirate': 'Dubai',
            'user_type': 'job_seeker',
            'primary_role': 'job_seeker',
            'secondary_roles': [],
            'is_verified': True
        }
        
        # Create tokens
        access_token = create_access_token(
            identity=mock_user['id'],
            expires_delta=timedelta(hours=24)
        )
        refresh_token = create_refresh_token(
            identity=mock_user['id'],
            expires_delta=timedelta(days=30)
        )
        
        # Get role info for dashboard routing
        role_info = get_role_info(mock_user['primary_role'])
        
        logger.info(f"User login successful: {email}")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': mock_user['id'],
                    'email': mock_user['email'],
                    'first_name': mock_user['first_name'],
                    'last_name': mock_user['last_name'],
                    'phone': mock_user['phone'],
                    'emirate': mock_user['emirate'],
                    'user_type': mock_user['user_type'],
                    'primary_role': mock_user['primary_role'],
                    'secondary_roles': mock_user['secondary_roles'],
                    'is_verified': mock_user['is_verified']
                },
                'dashboard_route': role_info['dashboard'] if role_info else '/candidate-dashboard',
                'expires_in': 86400  # 24 hours in seconds
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during login'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        
        # Create new access token
        new_access_token = create_access_token(
            identity=current_user_id,
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': new_access_token
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Token refresh failed'
        }), 500

@auth_bp.route('/update-roles', methods=['PUT'])
@jwt_required()
def update_roles():
    """Update user roles (primary and secondary)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        primary_role = data.get('primary_role')
        secondary_roles = data.get('secondary_roles', [])
        
        if not primary_role:
            return jsonify({
                'success': False,
                'message': 'Primary role is required'
            }), 400
        
        # Validate primary role
        normalized_primary = normalize_role(primary_role)
        if not get_role_info(normalized_primary) and normalized_primary != 'administrator':
            return jsonify({
                'success': False,
                'message': f'Invalid primary role: {primary_role}'
            }), 400
        
        # Validate secondary roles
        normalized_secondary = []
        for role in secondary_roles:
            normalized_role = normalize_role(role)
            if get_role_info(normalized_role) or normalized_role == 'administrator':
                normalized_secondary.append(normalized_role)
            else:
                return jsonify({
                    'success': False,
                    'message': f'Invalid secondary role: {role}'
                }), 400
        
        # Update user roles (simulated)
        updated_user = {
            'id': current_user_id,
            'email': 'user@example.com',
            'first_name': 'Ahmed',
            'last_name': 'Al Emirati',
            'phone': '+971501234567',
            'emirate': 'Dubai',
            'user_type': normalized_primary,
            'primary_role': normalized_primary,
            'secondary_roles': normalized_secondary,
            'is_verified': True,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"User roles updated: {current_user_id} - Primary: {normalized_primary}, Secondary: {normalized_secondary}")
        
        return jsonify({
            'success': True,
            'message': 'Roles updated successfully',
            'data': {
                'user': updated_user
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Update roles error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update roles'
        }), 500

@auth_bp.route('/roles', methods=['GET'])
def get_available_roles():
    """Get list of available roles"""
    return jsonify({
        'success': True,
        'data': {
            'roles': AVAILABLE_ROLES
        }
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        
        # Simulate user profile retrieval
        user_profile = {
            'id': current_user_id,
            'email': 'user@example.com',
            'first_name': 'Ahmed',
            'last_name': 'Al Emirati',
            'phone': '+971501234567',
            'emirate': 'Dubai',
            'user_type': 'job_seeker',
            'primary_role': 'job_seeker',
            'secondary_roles': [],
            'is_verified': True,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }
        
        return jsonify({
            'success': True,
            'data': {
                'user': user_profile
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve profile'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    try:
        current_user_id = get_jwt_identity()
        
        # In a real implementation, you would invalidate the token
        # For now, we'll just return success
        
        logger.info(f"User logout: {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Logout failed'
        }), 500
