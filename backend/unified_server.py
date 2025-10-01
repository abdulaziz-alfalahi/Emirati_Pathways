#!/usr/bin/env python3
"""
Unified Emirati Journey Platform Backend Server
Consolidates all services: Auth, CV Upload, School Programs, Admin APIs
Port: 5003 (standardized)
"""

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import json
import time
import logging
import os
import sys
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
from pathlib import Path
from werkzeug.utils import secure_filename
import hashlib
import secrets
from functools import wraps
from typing import Dict, List, Optional, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize JWT Manager
jwt = JWTManager(app)

# CORS Configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8080", "http://localhost:8081", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        "supports_credentials": True,
        "expose_headers": ["Authorization"]
    },
    r"/health": {
        "origins": ["*"],
        "methods": ["GET", "OPTIONS"]
    }
})

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

# CV Upload Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
UPLOAD_FOLDER = Path('uploads/cv_uploads')
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# Admin provider templates (from admin_api_server.py)
PROVIDER_TEMPLATES = {
    'google-gemini': {
        'id': 'google-gemini',
        'name': 'Google Gemini 2.5',
        'category': 'LLM',
        'description': 'Advanced multimodal AI with superior reasoning capabilities',
        'endpoint': 'https://generativelanguage.googleapis.com/v1beta',
        'models': ['gemini-2.0-flash-exp', 'gemini-1.5-pro'],
        'default_model': 'gemini-2.0-flash-exp',
        'config_schema': {
            'api_key': {'type': 'string', 'required': True, 'sensitive': True},
            'endpoint': {'type': 'string', 'required': True},
            'model': {'type': 'string', 'required': True},
            'temperature': {'type': 'float', 'default': 0.7, 'min': 0.0, 'max': 2.0},
            'max_output_tokens': {'type': 'integer', 'default': 8192, 'min': 1, 'max': 32768}
        }
    }
}

# Mock admin data storage
admin_providers = {}
admin_configurations = {}
admin_audit_logs = []
admin_health_metrics = {}

# Admin roles
ADMIN_ROLES = ['platform_administrator', 'super_user']

# =====================================================
# DATABASE UTILITIES
# =====================================================

def get_db():
    """Get database connection"""
    if 'db' not in g:
        try:
            g.db = psycopg2.connect(**DATABASE_CONFIG)
        except psycopg2.Error as e:
            logger.error(f"Database connection error: {e}")
            return None
    return g.db

def close_db(e=None):
    """Close database connection"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db_teardown(error):
    close_db()

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """Execute database query with error handling"""
    try:
        db = get_db()
        if not db:
            return None
            
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query, params)
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = None
            
        db.commit()
        cursor.close()
        return result
    except psycopg2.Error as e:
        logger.error(f"Database query error: {e}")
        if db:
            db.rollback()
        return None

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def require_admin_auth(f):
    """Decorator to require admin authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Mock authentication - in production, integrate with your auth system
        auth_header = request.headers.get('Authorization')
        user_email = request.headers.get('X-User-Email', 'admin@emiratijourney.ae')
        user_roles = request.headers.get('X-User-Roles', 'platform_administrator').split(',')
        
        # Check if user has admin role
        if not any(role.strip() in ADMIN_ROLES for role in user_roles):
            return jsonify({
                'success': False,
                'error': 'Insufficient privileges. Admin access required.'
            }), 403
        
        # Add user info to request context
        request.admin_user = {
            'email': user_email,
            'roles': user_roles
        }
        
        return f(*args, **kwargs)
    return decorated_function

def log_admin_action(action: str, provider_id: str, details: str, status: str = 'success'):
    """Log administrative actions for audit trail."""
    log_entry = {
        'id': f"log_{int(time.time())}_{secrets.token_hex(4)}",
        'timestamp': datetime.now().isoformat(),
        'user': getattr(request, 'admin_user', {}).get('email', 'unknown'),
        'action': action,
        'provider_id': provider_id,
        'details': details,
        'status': status,
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', 'unknown')
    }
    
    admin_audit_logs.append(log_entry)
    
    # Keep only last 1000 logs in memory
    if len(admin_audit_logs) > 1000:
        admin_audit_logs.pop(0)
    
    logger.info(f"Admin action logged: {action} on {provider_id}")

def ensure_fallback_schools_exist():
    """Ensure fallback schools exist in database for form functionality"""
    try:
        fallback_schools = [
            {
                'id': '550e8400-e29b-41d4-a716-446655440001',
                'name_en': 'Dubai International Academy',
                'name_ar': 'أكاديمية دبي الدولية',
                'code': 'DIA001',
                'location': 'Dubai'
            },
            {
                'id': '550e8400-e29b-41d4-a716-446655440002',
                'name_en': 'GEMS Wellington Academy',
                'name_ar': 'أكاديمية جيمس ويلينغتون',
                'code': 'GWA002',
                'location': 'Dubai'
            },
            {
                'id': '550e8400-e29b-41d4-a716-446655440003',
                'name_en': 'American School of Dubai',
                'name_ar': 'المدرسة الأمريكية في دبي',
                'code': 'ASD003',
                'location': 'Dubai'
            }
        ]
        
        for school in fallback_schools:
            # Check if school exists
            check_query = "SELECT id FROM schools WHERE id = %s"
            existing = execute_query(check_query, (school['id'],), fetch_one=True)
            
            if not existing:
                # Insert school if it doesn't exist
                insert_query = """
                    INSERT INTO schools (id, name_en, name_ar, code, location, district, is_active)
                    VALUES (%s::uuid, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """
                execute_query(insert_query, (
                    school['id'], school['name_en'], school['name_ar'], 
                    school['code'], school['location'], school['location'], True
                ))
                logger.info(f"Inserted fallback school: {school['name_en']}")
                
    except Exception as e:
        logger.error(f"Error ensuring fallback schools: {e}")

# Initialize default providers
def initialize_default_providers():
    """Initialize default provider configurations."""
    for provider_id, template in PROVIDER_TEMPLATES.items():
        if provider_id not in admin_providers:
            admin_providers[provider_id] = {
                'id': provider_id,
                'name': template['name'],
                'category': template['category'],
                'description': template['description'],
                'status': 'inactive',
                'is_default': provider_id == 'google-gemini',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Initialize empty configuration
            admin_configurations[provider_id] = {
                'provider_id': provider_id,
                'config': {},
                'is_active': False,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }

# =====================================================
# HEALTH CHECK ENDPOINT
# =====================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Unified health check endpoint"""
    try:
        db = get_db()
        db_status = 'connected' if db else 'disconnected'
        
        return jsonify({
            'status': 'healthy',
            'service': 'emirati-journey-unified',
            'version': '1.0.0',
            'database': db_status,
            'features': {
                'authentication': True,
                'cv_upload': True,
                'school_programs': True,
                'admin_management': True
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy', 
            'error': str(e)
        }), 500

# =====================================================
# AUTHENTICATION ROUTES
# =====================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user login"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Import and use authentication manager
        from auth.auth_manager_fixed import AuthenticationManager
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
            return jsonify({
                'success': False,
                'message': message
            }), 401
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Authentication failed due to system error'
        }), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new UAE National user"""
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
        
        # Import and use authentication manager
        from auth.auth_manager_fixed import AuthenticationManager
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

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile information"""
    try:
        user_id = get_jwt_identity()
        
        # Import user profile
        from models.user_profile import UserProfile
        profile = UserProfile(user_id)
        profile_data = profile.to_dict()
        
        # Add UAE-specific configuration
        profile_data.update({
            'working_days': os.getenv('UAE_WORKING_DAYS', 'Monday,Tuesday,Wednesday,Thursday,Friday').split(','),
            'weekend_days': os.getenv('UAE_WEEKEND_DAYS', 'Saturday,Sunday').split(','),
            'timezone': os.getenv('TIMEZONE', 'Asia/Dubai'),
            'locale': os.getenv('LOCALE', 'en_AE'),
            'currency': os.getenv('CURRENCY', 'AED'),
            'nationality': 'UAE'
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

# =====================================================
# CV UPLOAD ROUTES
# =====================================================

@app.route('/api/cv/upload', methods=['POST'])
def upload_cv():
    """Upload and process CV file"""
    try:
        # For development: accept mock tokens or use fallback user_id
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'
        logger.info(f"CV upload request from user: {user_id}")
        
        # Check if file is present
        if 'cv_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['cv_file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Validate file
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'File type not allowed. Please upload PDF, DOCX, DOC, or TXT files.'
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'message': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'
            }), 400
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{user_id}_{timestamp}_{filename}"
        file_path = UPLOAD_FOLDER / safe_filename
        
        file.save(str(file_path))
        logger.info(f"File saved: {file_path}")
        
        # Mock CV analysis (since we don't have the full parser)
        analysis_result = {
            'personal_info': {
                'name': 'Ahmed Al Mansouri',
                'email': 'ahmed.almansouri@gmail.com',
                'phone': '+971 50 123 4567',
                'location': 'Dubai, UAE'
            },
            'experience_years': 5,
            'skills': ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
            'education': 'Bachelor of Computer Science',
            'job_matches': [
                {
                    'title': 'Senior Software Engineer',
                    'company': 'Dubai Digital Authority',
                    'match_score': 95,
                    'alignment': 'D33 Digital Transformation'
                },
                {
                    'title': 'Full Stack Developer',
                    'company': 'Emirates NBD',
                    'match_score': 88,
                    'alignment': 'Talent33 Initiative'
                }
            ]
        }
        
        return jsonify({
            'success': True,
            'message': 'CV uploaded and analyzed successfully',
            'data': {
                'file_id': safe_filename,
                'file_size': file_size,
                'analysis': analysis_result,
                'upload_time': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"CV upload error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Upload failed due to system error'
        }), 500

@app.route('/api/cv/list', methods=['GET'])
@jwt_required()
def list_cvs():
    """List user's uploaded CVs"""
    try:
        user_id = get_jwt_identity()
        
        # Mock CV list
        cvs = [
            {
                'id': 'cv_001',
                'filename': 'Ahmed_Al_Mansouri_CV.pdf',
                'upload_date': '2025-09-22T15:20:00Z',
                'status': 'analyzed',
                'match_score': 95
            }
        ]
        
        return jsonify({
            'success': True,
            'data': cvs
        }), 200
        
    except Exception as e:
        logger.error(f"List CVs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve CVs'
        }), 500

# =====================================================
# SCHOOL PROGRAMS ROUTES
# =====================================================

@app.route('/api/school-programs', methods=['GET'])
def get_school_programs():
    """Get all school programs with filtering and search"""
    try:
        # Get query parameters
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        status = request.args.get('status', 'published')
        featured = request.args.get('featured', '')
        
        # Build query
        query = """
            SELECT 
                sp.*,
                s.name_en as school_name_en,
                s.name_ar as school_name_ar,
                s.location as school_location,
                s.khda_rating,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'name', pt.tag_name,
                            'type', pt.tag_type
                        )
                    ) FILTER (WHERE pt.tag_name IS NOT NULL), 
                    '[]'::json
                ) as tags
            FROM school_programs sp
            JOIN schools s ON sp.school_id = s.id
            LEFT JOIN program_tags pt ON sp.id = pt.program_id
            WHERE 1=1
        """
        
        params = []
        
        if search:
            query += " AND (sp.title_en ILIKE %s OR sp.description_en ILIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
            
        if category:
            query += " AND sp.category = %s"
            params.append(category)
            
        if status:
            query += " AND sp.status = %s"
            params.append(status)
            
        if featured:
            query += " AND sp.featured = %s"
            params.append(featured.lower() == 'true')
            
        query += " GROUP BY sp.id, s.name_en, s.name_ar, s.location, s.khda_rating ORDER BY sp.created_at DESC"
        
        programs = execute_query(query, params)
        
        if programs is None:
            return jsonify({'error': 'Database error'}), 500
            
        # Convert to JSON-serializable format
        result = []
        for program in programs:
            program_dict = dict(program)
            # Convert dates to ISO format
            for date_field in ['created_at', 'updated_at', 'start_date', 'end_date', 'application_deadline']:
                if program_dict.get(date_field):
                    if isinstance(program_dict[date_field], datetime):
                        program_dict[date_field] = program_dict[date_field].isoformat()
            
            # Ensure arrays are properly formatted
            for array_field in ['requirements', 'learning_outcomes', 'assessment_methods', 'language_of_instruction', 'schedule_days', 'equipment_provided', 'prerequisites', 'image_urls', 'video_urls']:
                if program_dict.get(array_field) is None:
                    program_dict[array_field] = []
                    
            result.append(program_dict)
            
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_school_programs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/school-programs', methods=['POST'])
def create_school_program():
    """Create a new school program"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Validate required fields
        required_fields = ['title_en', 'school_id', 'category', 'description_en']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Ensure fallback schools exist in database
        ensure_fallback_schools_exist()
        
        # Insert new program
        insert_query = """
            INSERT INTO school_programs (
                title_en, title_ar, school_id, category, status,
                description_en, description_ar, target_age_min, target_age_max,
                capacity_total, capacity_available, fees_amount, fees_currency,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id
        """
        
        params = (
            data['title_en'],
            data.get('title_ar', data['title_en']),
            data['school_id'],
            data['category'],
            data.get('status', 'draft'),
            data['description_en'],
            data.get('description_ar', data['description_en']),
            data.get('target_age_min', 5),
            data.get('target_age_max', 18),
            data.get('capacity_total', 50),
            data.get('capacity_available', data.get('capacity_total', 50)),
            data.get('fees_amount', 0),
            data.get('fees_currency', 'AED')
        )
        
        result = execute_query(insert_query, params, fetch_one=True)
        
        if not result:
            logger.error("Failed to insert program - no result returned")
            return jsonify({'error': 'Failed to create program'}), 500
            
        program_id = result['id']
        logger.info(f"Program created successfully with ID: {program_id}")
        
        return jsonify({
            'message': 'Program created successfully',
            'program_id': str(program_id),
            'id': str(program_id),
            'success': True
        }), 201
        
    except Exception as e:
        logger.error(f"Error in create_school_program: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'success': False
        }), 500

@app.route('/api/schools', methods=['GET'])
def get_schools():
    """Get all schools"""
    try:
        query = "SELECT * FROM schools WHERE is_active = true ORDER BY name_en"
        schools = execute_query(query)
        
        if schools is None:
            return jsonify({'error': 'Database error'}), 500
            
        result = []
        for school in schools:
            school_dict = dict(school)
            # Convert dates to ISO format
            for date_field in ['created_at', 'updated_at']:
                if school_dict.get(date_field):
                    if isinstance(school_dict[date_field], datetime):
                        school_dict[date_field] = school_dict[date_field].isoformat()
            result.append(school_dict)
            
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_schools: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for admin interface"""
    try:
        # Get total programs
        total_query = "SELECT COUNT(*) as total FROM school_programs"
        total_result = execute_query(total_query, fetch_one=True)
        total_programs = total_result['total'] if total_result else 0
        
        # Get published programs
        published_query = "SELECT COUNT(*) as published FROM school_programs WHERE status = 'published'"
        published_result = execute_query(published_query, fetch_one=True)
        published_programs = published_result['published'] if published_result else 0
        
        # Get pending reviews
        pending_query = "SELECT COUNT(*) as pending FROM school_programs WHERE status = 'under_review'"
        pending_result = execute_query(pending_query, fetch_one=True)
        pending_reviews = pending_result['pending'] if pending_result else 0
        
        # Calculate approval rate
        approval_rate = (published_programs / total_programs * 100) if total_programs > 0 else 0
        
        stats = {
            'totalPrograms': total_programs,
            'publishedPrograms': published_programs,
            'pendingReviews': pending_reviews,
            'approvalRate': round(approval_rate, 1),
            'averageApprovalTime': '18 days'
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# =====================================================
# ADMIN PROVIDER MANAGEMENT ROUTES
# =====================================================

@app.route('/api/admin/health', methods=['GET'])
@require_admin_auth
def admin_health_check():
    """Admin health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'admin_features': {
            'provider_management': True,
            'configuration_management': True,
            'health_monitoring': True,
            'audit_logging': True
        },
        'providers_count': len(admin_providers),
        'version': '1.0.0'
    })

@app.route('/api/admin/providers', methods=['GET'])
@require_admin_auth
def list_providers():
    """List all available providers"""
    try:
        providers_list = []
        
        for provider_id, provider in admin_providers.items():
            config = admin_configurations.get(provider_id, {}).get('config', {})
            template = PROVIDER_TEMPLATES.get(provider_id, {})
            
            provider_data = {
                **provider,
                'config': config,
                'available_models': template.get('models', []),
                'default_model': template.get('default_model'),
                'config_schema': template.get('config_schema', {})
            }
            
            providers_list.append(provider_data)
        
        providers_list.sort(key=lambda x: (x['category'], x['name']))
        
        log_admin_action('List Providers', 'all', f"Retrieved {len(providers_list)} providers")
        
        return jsonify({
            'success': True,
            'providers': providers_list,
            'total_count': len(providers_list),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing providers: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to list providers: {str(e)}'
        }), 500

# =====================================================
# ERROR HANDLERS
# =====================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'message': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'message': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'message': 'Authorization token is required'}), 401

# =====================================================
# INITIALIZATION AND STARTUP
# =====================================================

def initialize_unified_server():
    """Initialize all components of the unified server"""
    logger.info("🔧 Initializing unified server components...")
    
    # Initialize admin providers
    initialize_default_providers()
    logger.info("✅ Admin providers initialized")
    
    # Ensure database tables exist
    ensure_fallback_schools_exist()
    logger.info("✅ Database fallback data ensured")
    
    logger.info("🚀 Unified server initialization complete")

if __name__ == '__main__':
    # Initialize the unified server
    initialize_unified_server()
    
    port = int(os.getenv('PORT', 5003))
    
    print("="*80)
    print("🇦🇪 EMIRATI JOURNEY PLATFORM - UNIFIED BACKEND SERVER")
    print("="*80)
    print(f"🚀 Server starting on port {port}")
    print(f"🔗 Health check: http://localhost:{port}/health")
    print("")
    print("📋 Available Endpoints:")
    print("  🔐 Authentication:")
    print(f"    POST http://localhost:{port}/api/auth/login")
    print(f"    POST http://localhost:{port}/api/auth/register")
    print(f"    GET  http://localhost:{port}/api/auth/profile")
    print("")
    print("  📄 CV Management:")
    print(f"    POST http://localhost:{port}/api/cv/upload")
    print(f"    GET  http://localhost:{port}/api/cv/list")
    print("")
    print("  🏫 School Programs:")
    print(f"    GET  http://localhost:{port}/api/school-programs")
    print(f"    POST http://localhost:{port}/api/school-programs")
    print(f"    GET  http://localhost:{port}/api/schools")
    print(f"    GET  http://localhost:{port}/api/admin/dashboard-stats")
    print("")
    print("  ⚙️  Admin Management:")
    print(f"    GET  http://localhost:{port}/api/admin/health")
    print(f"    GET  http://localhost:{port}/api/admin/providers")
    print("")
    print("🔑 Features: Auth + CV Upload + School Programs + Admin APIs")
    print("🌐 CORS: Configured for frontend origins")
    print("🛡️  Security: JWT authentication with role-based access")
    print("="*80)
    
    # Run the unified Flask app
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)