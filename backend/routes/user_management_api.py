"""
User Management API Routes

This module provides comprehensive API endpoints for user management,
including CRUD operations, role management, status changes, and bulk operations.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from backend.db import get_db_connection
from functools import wraps
import hashlib
import secrets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
user_management_bp = Blueprint('user_management_api', __name__, url_prefix='/api/admin')

# Valid roles
VALID_ROLES = [
    'super_admin', 'admin',
    'content_admin', 'user_admin',
    'content_editor', 'content_reviewer',
    'candidate',
    'recruiter', 'employer_admin',
    'mentor', 'training_provider', 'candidate', 'parent', 'assessor',
    'candidate',
    'talent_operator', 'employer_relations',
    'education_operator', 'assessment_operator',
    'mentorship_operator', 'community_operator',
    'platform_operator', 'call_center_agent', 'operator', 'career_services_operator'
]

def execute_query(query, params=None, fetch_one=False, fetch_all=True, return_id=False):
    """Execute a database query with error handling"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            if return_id:
                result = cursor.fetchone()
                conn.commit()
                return result.get('id') if result else None
            elif fetch_one:
                result = cursor.fetchone()
                return dict(result) if result else None
            elif fetch_all:
                return [dict(row) for row in cursor.fetchall()]
            else:
                conn.commit()
                return True
    except Exception as e:
        logger.error(f"Query execution failed: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def ensure_tables_exist():
    """Ensure required tables exist"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cursor:
            # Create user_activity_log table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_activity_log (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    action VARCHAR(100),
                    performed_by INTEGER,
                    details JSONB,
                    ip_address VARCHAR(45),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create user_roles table for many-to-many relationship
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_roles (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    role VARCHAR(100) NOT NULL,
                    assigned_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, role)
                )
            """)
            
            conn.commit()
            logger.info("User management tables ensured")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        conn.rollback()
    finally:
        conn.close()

# Initialize tables
ensure_tables_exist()

def optional_auth(f):
    """Decorator that allows requests with or without authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

def hash_password(password):
    """Hash a password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{hashed}"

def log_user_activity(user_id, action, performed_by=None, details=None, ip_address=None):
    """Log user activity"""
    try:
        query = """
            INSERT INTO user_activity_log (user_id, action, performed_by, details, ip_address)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(
            query,
            (user_id, action, performed_by, json.dumps(details) if details else None, ip_address),
            fetch_all=False
        )
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")


# =====================================================
# USER LISTING AND SEARCH
# =====================================================

@user_management_bp.route('/users/check-email', methods=['GET'])
@optional_auth
def check_email_availability():
    """Check if an email is available"""
    try:
        email = request.args.get('email', '')
        if not email:
            return jsonify({
                'success': False,
                'message': 'Email is required',
                'available': False
            }), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({'available': True}) # Fail open
            
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM users WHERE email = %s", (email,))
            exists = cursor.fetchone() is not None
            
        conn.close()
        
        return jsonify({
            'success': True,
            'available': not exists
        })
    except Exception as e:
        logger.error(f"Failed to check email: {e}")
        return jsonify({'success': True, 'available': True}) # Fail open

@user_management_bp.route('/users', methods=['GET'])
@optional_auth
def list_users():
    """
    Get paginated list of users with filtering
    
    Query params:
        page: Page number (default: 1)
        per_page: Items per page (default: 20)
        search: Search term for name/email/username
        role: Filter by role
        status: Filter by status (active/inactive)
        sort_by: Sort field (default: created_at)
        sort_order: Sort order (asc/desc, default: desc)
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role', '')
        status = request.args.get('status', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        offset = (page - 1) * per_page
        
        # Build query
        query = """
            SELECT 
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.first_name,
                u.last_name,
                u.role,
                u.is_active,
                u.created_at,
                u.updated_at,
                u.last_login,
                u.phone,
                u.emirate,
                u.profile_data
            FROM users u
            WHERE 1=1
        """
        params = []
        
        if search:
            cleaned_search = search.replace('-', '')
            query += """
                AND (
                    u.username ILIKE %s 
                    OR u.email ILIKE %s 
                    OR u.full_name ILIKE %s
                    OR u.first_name ILIKE %s
                    OR u.last_name ILIKE %s
                    OR CAST(u.id AS TEXT) ILIKE %s
                    OR CAST(u.id AS TEXT) ILIKE %s
                )
            """
            search_param = f"%{search}%"
            cleaned_param = f"%{cleaned_search}%"
            params.extend([search_param, search_param, search_param, search_param, search_param, search_param, cleaned_param])
        
        if role:
            query += " AND u.role = %s"
            params.append(role)
        
        if status == 'active':
            query += " AND u.is_active = true"
        elif status == 'inactive':
            query += " AND u.is_active = false"
        
        # Validate sort field
        valid_sort_fields = ['created_at', 'updated_at', 'username', 'email', 'full_name', 'last_login']
        if sort_by not in valid_sort_fields:
            sort_by = 'created_at'
        
        sort_direction = 'DESC' if sort_order.lower() == 'desc' else 'ASC'
        query += f" ORDER BY u.{sort_by} {sort_direction} NULLS LAST"
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        users = execute_query(query, tuple(params))
        
        # Get total count
        count_query = """
            SELECT COUNT(*) as total FROM users u WHERE 1=1
        """
        count_params = []
        
        if search:
            cleaned_search = search.replace('-', '')
            count_query += """
                AND (
                    u.username ILIKE %s 
                    OR u.email ILIKE %s 
                    OR u.full_name ILIKE %s
                    OR u.first_name ILIKE %s
                    OR u.last_name ILIKE %s
                    OR CAST(u.id AS TEXT) ILIKE %s
                    OR CAST(u.id AS TEXT) ILIKE %s
                )
            """
            search_param = f"%{search}%"
            cleaned_param = f"%{cleaned_search}%"
            count_params.extend([search_param, search_param, search_param, search_param, search_param, search_param, cleaned_param])
        
        if role:
            count_query += " AND u.role = %s"
            count_params.append(role)
        
        if status == 'active':
            count_query += " AND u.is_active = true"
        elif status == 'inactive':
            count_query += " AND u.is_active = false"
        
        total_result = execute_query(count_query, tuple(count_params) if count_params else None, fetch_one=True)
        total = total_result.get('total', 0) if total_result else 0
        
        # Process users
        processed_users = []
        for user in (users or []):
            profile_data = user.get('profile_data') or {}
            if isinstance(profile_data, str):
                try:
                    profile_data = json.loads(profile_data)
                except:
                    profile_data = {}
            
            processed_users.append({
                'id': user.get('id'),
                'username': user.get('username'),
                'email': user.get('email'),
                'full_name': user.get('full_name'),
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'roles': [user.get('role')] if user.get('role') else [],
                'is_active': user.get('is_active', True),
                'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
                'updated_at': user.get('updated_at').isoformat() if user.get('updated_at') else None,
                'last_login': user.get('last_login').isoformat() if user.get('last_login') else None,
                'profile_data': {
                    'phone': user.get('phone') or profile_data.get('phone'),
                    'department': profile_data.get('department'),
                    'position': profile_data.get('position'),
                    'location': user.get('emirate') or profile_data.get('location')
                }
            })
        
        return jsonify({
            'success': True,
            'data': {
                'users': processed_users,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        return jsonify({
            'success': True,
            'data': {
                'users': [],
                'total': 0,
                'page': 1,
                'per_page': 20,
                'total_pages': 0
            }
        })


@user_management_bp.route('/users/<user_id>', methods=['GET'])
@optional_auth
def get_user(user_id):
    """Get details of a specific user"""
    try:
        query = """
            SELECT 
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.first_name,
                u.last_name,
                u.role,
                u.is_active,
                u.created_at,
                u.updated_at,
                u.last_login,
                u.phone,
                u.emirate,
                u.profile_data,
                u.email_verified,
                u.phone_verified
            FROM users u
            WHERE u.id = %s
        """
        
        user = execute_query(query, (user_id,), fetch_one=True)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get activity log
        activity_query = """
            SELECT action, details, created_at, ip_address
            FROM user_activity_log
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 10
        """
        activities = execute_query(activity_query, (user_id,))
        
        profile_data = user.get('profile_data') or {}
        if isinstance(profile_data, str):
            try:
                profile_data = json.loads(profile_data)
            except:
                profile_data = {}
        
        return jsonify({
            'success': True,
            'data': {
                'id': user.get('id'),
                'username': user.get('username'),
                'email': user.get('email'),
                'full_name': user.get('full_name'),
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'roles': [user.get('role')] if user.get('role') else [],
                'is_active': user.get('is_active', True),
                'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
                'updated_at': user.get('updated_at').isoformat() if user.get('updated_at') else None,
                'last_login': user.get('last_login').isoformat() if user.get('last_login') else None,
                'email_verified': user.get('email_verified', False),
                'phone_verified': user.get('phone_verified', False),
                'profile_data': {
                    'phone': user.get('phone') or profile_data.get('phone'),
                    'department': profile_data.get('department'),
                    'position': profile_data.get('position'),
                    'location': user.get('emirate') or profile_data.get('location')
                },
                'recent_activity': activities or []
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to get user: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve user'
        }), 500


# =====================================================
# USER CRUD OPERATIONS
# =====================================================

@user_management_bp.route('/users', methods=['POST'])
@optional_auth
def create_user():
    """
    Create a new user
    
    Body:
        username: Unique username
        email: Unique email address
        full_name: Full name
        password: Password (will be hashed)
        roles: List of roles
        profile_data: Optional profile data
    """
    try:
        data = request.get_json()
        
        username = data.get('username')
        email = data.get('email')
        full_name = data.get('full_name')
        password = data.get('password')
        roles = data.get('roles', ['candidate'])
        profile_data = data.get('profile_data', {})
        
        if not username or not email:
            return jsonify({
                'success': False,
                'message': 'Username and email are required'
            }), 400
        
        # Check for existing user
        check_query = "SELECT id FROM users WHERE username = %s OR email = %s"
        existing = execute_query(check_query, (username, email), fetch_one=True)
        
        if existing:
            return jsonify({
                'success': False,
                'message': 'Username or email already exists'
            }), 400
        
        # Hash password
        hashed_password = hash_password(password) if password else hash_password(secrets.token_urlsafe(12))
        
        # Determine primary role
        primary_role = roles[0] if roles else 'candidate'
        
        # Insert user
        insert_query = """
            INSERT INTO users (username, email, full_name, password, role, profile_data, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, true)
            RETURNING id
        """
        
        user_id = execute_query(
            insert_query,
            (username, email, full_name, hashed_password, primary_role, json.dumps(profile_data)),
            return_id=True
        )
        
        if user_id:
            # Log activity
            log_user_activity(user_id, 'user_created', details={'created_by': 'admin'})
            
            return jsonify({
                'success': True,
                'data': {'id': user_id},
                'message': 'User created successfully'
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to create user'
            }), 500
        
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to create user'
        }), 500


@user_management_bp.route('/users/<user_id>', methods=['PUT'])
@optional_auth
def update_user(user_id):
    """
    Update an existing user
    
    Body:
        username: Updated username
        email: Updated email
        full_name: Updated full name
        roles: Updated roles list
        profile_data: Updated profile data
    """
    try:
        data = request.get_json()
        
        # Build update query dynamically
        updates = []
        params = []
        
        if 'username' in data:
            updates.append("username = %s")
            params.append(data['username'])
        
        if 'email' in data:
            updates.append("email = %s")
            params.append(data['email'])
        
        if 'full_name' in data:
            updates.append("full_name = %s")
            params.append(data['full_name'])
        
        if 'roles' in data and data['roles']:
            updates.append("role = %s")
            params.append(data['roles'][0])  # Primary role
        
        if 'profile_data' in data:
            updates.append("profile_data = %s")
            params.append(json.dumps(data['profile_data']))
        
        if 'phone' in data:
            updates.append("phone = %s")
            params.append(data['phone'])
        
        if 'emirate' in data:
            updates.append("emirate = %s")
            params.append(data['emirate'])
        
        if not updates:
            return jsonify({
                'success': False,
                'message': 'No fields to update'
            }), 400
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        execute_query(query, tuple(params), fetch_all=False)
        
        # Log activity
        log_user_activity(user_id, 'user_updated', details={'updated_fields': list(data.keys())})
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Failed to update user: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update user'
        }), 500


@user_management_bp.route('/users/<user_id>', methods=['DELETE'])
@optional_auth
def delete_user(user_id):
    """Delete a user (soft delete by deactivating)"""
    try:
        # Soft delete - just deactivate
        query = """
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(query, (user_id,), fetch_all=False)
        
        # Log activity
        log_user_activity(user_id, 'user_deleted')
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Failed to delete user: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete user'
        }), 500


# =====================================================
# USER STATUS MANAGEMENT
# =====================================================

@user_management_bp.route('/users/<user_id>/activate', methods=['POST'])
@optional_auth
def activate_user(user_id):
    """Activate a user account"""
    try:
        query = """
            UPDATE users 
            SET is_active = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(query, (user_id,), fetch_all=False)
        
        log_user_activity(user_id, 'user_activated')
        
        return jsonify({
            'success': True,
            'message': 'User activated successfully'
        })
        
    except Exception as e:
        logger.error(f"Failed to activate user: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to activate user'
        }), 500


@user_management_bp.route('/users/<user_id>/suspend', methods=['POST'])
@optional_auth
def suspend_user(user_id):
    """Suspend a user account"""
    try:
        data = request.get_json() or {}
        reason = data.get('reason', '')
        
        query = """
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(query, (user_id,), fetch_all=False)
        
        log_user_activity(user_id, 'user_suspended', details={'reason': reason})
        
        return jsonify({
            'success': True,
            'message': 'User suspended successfully'
        })
        
    except Exception as e:
        logger.error(f"Failed to suspend user: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to suspend user'
        }), 500


# =====================================================
# ROLE MANAGEMENT
# =====================================================

@user_management_bp.route('/users/<user_id>/roles', methods=['PUT'])
@optional_auth
def update_user_roles(user_id):
    """
    Update user roles
    
    Body:
        roles: List of role names
    """
    try:
        data = request.get_json()
        roles = data.get('roles', [])
        
        if not roles:
            return jsonify({
                'success': False,
                'message': 'At least one role is required'
            }), 400
        
        # Validate roles
        invalid_roles = [r for r in roles if r not in VALID_ROLES]
        if invalid_roles:
            return jsonify({
                'success': False,
                'message': f'Invalid roles: {invalid_roles}'
            }), 400
        
        # Update primary role in users table
        primary_role = roles[0]
        query = """
            UPDATE users 
            SET role = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(query, (primary_role, user_id), fetch_all=False)
        
        # Update user_roles table
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    # Remove existing roles
                    cursor.execute("DELETE FROM user_roles WHERE user_id = %s", (user_id,))
                    
                    # Add new roles
                    for role in roles:
                        cursor.execute("""
                            INSERT INTO user_roles (user_id, role)
                            VALUES (%s, %s)
                            ON CONFLICT (user_id, role) DO NOTHING
                        """, (user_id, role))
                    
                    conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error(f"Failed to update user_roles: {e}")
            finally:
                conn.close()
        
        log_user_activity(user_id, 'roles_updated', details={'roles': roles})
        
        return jsonify({
            'success': True,
            'message': 'User roles updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Failed to update user roles: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update user roles'
        }), 500


@user_management_bp.route('/roles', methods=['GET'])
@optional_auth
def list_roles():
    """Get list of available roles"""
    try:
        roles = [
            # Administrative
            {'id': 'admin', 'name': 'admin', 'display_name': 'Administrator', 'description': 'Full platform governance and system access', 'permissions': ['manage_users', 'system_settings', 'view_all_analytics', 'manage_all'], 'is_system': True, 'category': 'Administrative'},
            # Growth Operators
            {'id': 'talent_operator', 'name': 'talent_operator', 'display_name': 'Candidate Onboarding Operator', 'description': 'Onboard NAFIS job seekers and manage candidate engagement', 'permissions': ['onboard_candidates', 'manage_candidate_engagement', 'view_analytics'], 'is_system': True, 'category': 'Growth Operators'},
            {'id': 'employer_relations', 'name': 'employer_relations', 'display_name': 'Company Onboarding Operator', 'description': 'Onboard private sector companies and manage employer partnerships', 'permissions': ['onboard_companies', 'manage_company_engagement', 'view_analytics'], 'is_system': True, 'category': 'Growth Operators'},
            {'id': 'education_operator', 'name': 'education_operator', 'display_name': 'Education Operator', 'description': 'Partner with schools, universities, and training institutes', 'permissions': ['onboard_education', 'manage_education_partnerships', 'view_analytics'], 'is_system': True, 'category': 'Growth Operators'},
            {'id': 'assessment_operator', 'name': 'assessment_operator', 'display_name': 'Assessment Operator', 'description': 'Manage assessment centers and certification bodies', 'permissions': ['onboard_assessment', 'manage_assessment_centers', 'view_analytics'], 'is_system': True, 'category': 'Growth Operators'},
            {'id': 'mentorship_operator', 'name': 'mentorship_operator', 'display_name': 'Mentorship Operator', 'description': 'Onboard mentors and manage coaching programs', 'permissions': ['onboard_mentors', 'manage_mentorship_programs', 'view_analytics'], 'is_system': True, 'category': 'Growth Operators'},
            {'id': 'community_operator', 'name': 'community_operator', 'display_name': 'Community Operator', 'description': 'Moderate communities and manage events', 'permissions': ['moderate_communities', 'manage_community_events', 'view_analytics'], 'is_system': True, 'category': 'Growth Operators'},
            {'id': 'platform_operator', 'name': 'platform_operator', 'display_name': 'Monitoring Center Operator', 'description': 'Monitor platform operations and track metrics', 'permissions': ['view_operations_center', 'view_all_analytics', 'view_analytics'], 'is_system': True, 'category': 'Growth Operators'},
        ]
        
        return jsonify({
            'success': True,
            'data': roles
        })
        
    except Exception as e:
        logger.error(f"Failed to list roles: {e}")
        return jsonify({
            'success': True,
            'data': []
        })


# =====================================================
# BULK OPERATIONS
# =====================================================

@user_management_bp.route('/users/bulk/activate', methods=['POST'])
@optional_auth
def bulk_activate_users():
    """Activate multiple users"""
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        
        if not user_ids:
            return jsonify({
                'success': False,
                'message': 'No user IDs provided'
            }), 400
        
        query = """
            UPDATE users 
            SET is_active = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = ANY(%s)
        """
        execute_query(query, (user_ids,), fetch_all=False)
        
        return jsonify({
            'success': True,
            'message': f'{len(user_ids)} users activated'
        })
        
    except Exception as e:
        logger.error(f"Failed to bulk activate: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to activate users'
        }), 500


@user_management_bp.route('/users/bulk/suspend', methods=['POST'])
@optional_auth
def bulk_suspend_users():
    """Suspend multiple users"""
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        reason = data.get('reason', '')
        
        if not user_ids:
            return jsonify({
                'success': False,
                'message': 'No user IDs provided'
            }), 400
        
        query = """
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = ANY(%s)
        """
        execute_query(query, (user_ids,), fetch_all=False)
        
        return jsonify({
            'success': True,
            'message': f'{len(user_ids)} users suspended'
        })
        
    except Exception as e:
        logger.error(f"Failed to bulk suspend: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to suspend users'
        }), 500


# =====================================================
# USER EXPORT
# =====================================================

@user_management_bp.route('/users/export', methods=['GET'])
@optional_auth
def export_users():
    """Export users data as JSON"""
    try:
        role = request.args.get('role')
        status = request.args.get('status')
        
        query = """
            SELECT 
                id, username, email, full_name, role, is_active, 
                created_at, last_login, phone, emirate
            FROM users
            WHERE 1=1
        """
        params = []
        
        if role:
            query += " AND role = %s"
            params.append(role)
        
        if status == 'active':
            query += " AND is_active = true"
        elif status == 'inactive':
            query += " AND is_active = false"
        
        query += " ORDER BY created_at DESC"
        
        users = execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'success': True,
            'data': users or [],
            'exported_at': datetime.utcnow().isoformat(),
            'total': len(users) if users else 0
        })
        
    except Exception as e:
        logger.error(f"Failed to export users: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to export users'
        }), 500


# =====================================================
# USER STATISTICS
# =====================================================

@user_management_bp.route('/users/statistics', methods=['GET'])
@optional_auth
def get_user_statistics():
    """Get user statistics for dashboard"""
    try:
        stats = {
            'total_users': 0,
            'active_users': 0,
            'inactive_users': 0,
            'new_users_today': 0,
            'new_users_week': 0,
            'users_by_role': [],
            'recent_signups': []
        }
        
        # Total counts
        count_query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE is_active = true) as active,
                COUNT(*) FILTER (WHERE is_active = false) as inactive,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week
            FROM users
        """
        counts = execute_query(count_query, fetch_one=True)
        if counts:
            stats['total_users'] = counts.get('total', 0) or 0
            stats['active_users'] = counts.get('active', 0) or 0
            stats['inactive_users'] = counts.get('inactive', 0) or 0
            stats['new_users_today'] = counts.get('today', 0) or 0
            stats['new_users_week'] = counts.get('week', 0) or 0
        
        # Users by role
        role_query = """
            SELECT role, COUNT(*) as count
            FROM users
            WHERE role IS NOT NULL
            GROUP BY role
            ORDER BY count DESC
        """
        role_counts = execute_query(role_query)
        if role_counts:
            stats['users_by_role'] = role_counts
        
        # Recent signups
        recent_query = """
            SELECT id, username, email, full_name, role, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        """
        recent = execute_query(recent_query)
        if recent:
            stats['recent_signups'] = recent
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Failed to get user statistics: {e}")
        return jsonify({
            'success': True,
            'data': {
                'total_users': 0,
                'active_users': 0,
                'inactive_users': 0,
                'new_users_today': 0,
                'new_users_week': 0,
                'users_by_role': [],
                'recent_signups': []
            }
        })


# Register the blueprint function
def register_user_management_routes(app):
    """Register user management routes with the Flask app"""
    app.register_blueprint(user_management_bp)
    logger.info("✅ User Management API routes registered")
