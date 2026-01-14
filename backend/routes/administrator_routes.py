"""
Administrator Persona API Routes

This module defines the Flask routes for the Administrator persona,
providing endpoints for user management, system monitoring, and administrative operations.
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import json
import logging
from functools import wraps
from typing import Dict, Any, Optional

from administrator_system import AdministratorSystem
from auth.auth_manager_fixed import AuthenticationManager as AuthManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
admin_bp = Blueprint('administrator', __name__, url_prefix='/api/admin')

# Initialize systems (these would be properly configured in the main app)
admin_system = None
auth_manager = None

def init_admin_routes(app, db_config: Dict[str, str]):
    """Initialize administrator routes with database configuration"""
    global admin_system, auth_manager
    admin_system = AdministratorSystem(db_config)
    auth_manager = AuthManager()  # Do not pass db_config as it expects redis_client

def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get authorization header
            auth_header = request.headers.get('Authorization')
            logger.debug(f"Admin Route {request.path} - Auth Header present: {bool(auth_header)}")

            if not auth_header or not auth_header.startswith('Bearer '):
                logger.debug(f"Missing Authorization header")
                return jsonify({'error': 'Authentication required'}), 401
            
            token = auth_header.split(' ')[1]
            logger.debug(f"Token received: {token[:10]}...")
            
            # Verify token and get user info
            user_info = auth_manager.verify_token(token)
            if not user_info:
                logger.debug("auth_manager.verify_token returned None")
                return jsonify({'error': 'Invalid token'}), 401
            
            # Check if user has admin role
            user_details = admin_system.get_user_details(user_info['user_id'])
            logger.debug(f"User details looked up for user")

            if not user_details:
                logger.debug(f"User not found in DB: {user_info['user_id']}")
                return jsonify({'error': 'User not found'}), 401
            
            roles = user_details.get('roles') or []
            
            # Check 'role' column from users table as well (for dev/simple users)
            if user_details.get('role'):
                roles.append(user_details['role'])
            
            logger.debug(f"User roles: {roles}")
                
            # Allow admin or super_admin
            if 'admin' not in roles and 'super_admin' not in roles and 'platform_administrator' not in roles:
                logger.warning(f"Access denied for user {user_info['user_id']}. Roles: {roles}")
                return jsonify({'error': 'Admin access required'}), 403
            
            # Add user info to request context
            request.current_user = user_details
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Admin authentication error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

def permission_required(permission: str):
    """Decorator to require specific permission"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user = getattr(request, 'current_user', None)
                if not user:
                    return jsonify({'error': 'Authentication required'}), 401
                
                # Check for admin roles to bypass specific permission checks
                roles = user.get('roles', [])
                if user.get('role'):
                    roles.append(user['role'])
                    
                if 'super_admin' in roles or 'admin' in roles or 'platform_administrator' in roles:
                    return f(*args, **kwargs)

                user_permissions = user.get('permissions', [])
                
                # Check for wildcard permission or specific permission
                if '*' not in user_permissions and permission not in user_permissions:
                    return jsonify({'error': f'Permission {permission} required'}), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(f"Permission check error: {str(e)}")
                return jsonify({'error': 'Permission check failed'}), 403
        
        return decorated_function
    return decorator

# Health and Status Endpoints

@admin_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for administrator services"""
    try:
        health_data = admin_system.get_system_health()
        return jsonify({
            'status': 'success',
            'data': health_data,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Health check failed',
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@admin_bp.route('/system/status', methods=['GET'])
@admin_required
@permission_required('system.view')
def get_system_status():
    """Get comprehensive system status"""
    try:
        health_data = admin_system.get_system_health()
        metrics = admin_system.get_system_metrics(hours_back=1)
        
        return jsonify({
            'status': 'success',
            'data': {
                'health': health_data,
                'recent_metrics': [
                    {
                        'name': metric.name,
                        'value': metric.value,
                        'unit': metric.unit,
                        'category': metric.category,
                        'recorded_at': metric.recorded_at.isoformat()
                    }
                    for metric in metrics[:10]  # Last 10 metrics
                ]
            }
        })
    except Exception as e:
        logger.error(f"Failed to get system status: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve system status'
        }), 500

# User Management Endpoints

@admin_bp.route('/users', methods=['GET'])
@admin_required
@permission_required('users.view')
def get_users():
    """Get paginated list of users"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        role_filter = request.args.get('role', '')
        status_filter = request.args.get('status', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_dir = request.args.get('sort_dir', 'desc')
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 50
        
        result = admin_system.get_all_users(
            page=page,
            per_page=per_page,
            search=search if search else None,
            role_filter=role_filter if role_filter else None,
            status_filter=status_filter if status_filter else None,
            sort_by=sort_by,
            sort_dir=sort_dir
        )
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        logger.error(f"Failed to get users: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve users'
        }), 500

@admin_bp.route('/users/export', methods=['GET'])
@admin_required
@permission_required('users.view')
def export_users():
    """Export users as CSV"""
    try:
        csv_data = admin_system.export_users_csv()
        
        from flask import Response
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=users_export.csv"}
        )
    except Exception as e:
        logger.error(f"Failed to export users: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to export users'
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
@permission_required('users.view')
def get_user_details(user_id: int):
    """Get detailed information about a specific user"""
    try:
        user = admin_system.get_user_details(user_id)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': user
        })
    except Exception as e:
        logger.error(f"Failed to get user details: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve user details'
        }), 500

@admin_bp.route('/users', methods=['POST'])
@admin_required
@permission_required('users.create')
def create_user():
    """Create a new user account"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create user
        user = admin_system.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            full_name=data['full_name'],
            roles=data.get('roles', []),
            admin_user_id=request.current_user['id']
        )
        
        return jsonify({
            'status': 'success',
            'data': user,
            'message': 'User created successfully'
        }), 201
    except Exception as e:
        logger.error(f"Failed to create user: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create user'
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
@permission_required('users.edit')
def update_user(user_id: int):
    """Update user information"""
    try:
        data = request.get_json()
        
        # Remove sensitive fields that shouldn't be updated via this endpoint
        sensitive_fields = ['password', 'password_hash', 'id']
        for field in sensitive_fields:
            data.pop(field, None)
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No valid fields to update'
            }), 400
        
        user = admin_system.update_user(
            user_id=user_id,
            updates=data,
            admin_user_id=request.current_user['id']
        )
        
        # Update roles if provided
        if 'roles' in data:
            admin_system.update_user_roles(
                        user_id=user_id,
                        roles=data['roles'],
                        admin_user_id=request.current_user['id']
            )
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': user,
            'message': 'User updated successfully'
        })
    except Exception as e:
        logger.error(f"Failed to update user: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update user'
        }), 500

@admin_bp.route('/users/<int:user_id>/roles', methods=['PUT'])
@admin_required
@permission_required('users.edit')
def update_user_roles(user_id: int):
    """Update user roles"""
    try:
        data = request.get_json()
        roles = data.get('roles', [])
        
        success = admin_system.update_user_roles(
            user_id=user_id,
            roles=roles,
            admin_user_id=request.current_user['id']
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'User roles updated successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to update user roles'
            }), 500
    except Exception as e:
        logger.error(f"Failed to update user roles: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update user roles'
        }), 500

@admin_bp.route('/users/<int:user_id>/suspend', methods=['POST'])
@admin_required
@permission_required('users.suspend')
def suspend_user(user_id: int):
    """Suspend a user account"""
    try:
        data = request.get_json() or {}
        reason = data.get('reason', '')
        
        success = admin_system.suspend_user(
            user_id=user_id,
            admin_user_id=request.current_user['id'],
            reason=reason
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'User suspended successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to suspend user'
            }), 500
    except Exception as e:
        logger.error(f"Failed to suspend user: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to suspend user'
        }), 500

@admin_bp.route('/users/<int:user_id>/activate', methods=['POST'])
@admin_required
@permission_required('users.activate')
def activate_user(user_id: int):
    """Activate a suspended user account"""
    try:
        success = admin_system.activate_user(
            user_id=user_id,
            admin_user_id=request.current_user['id']
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'User activated successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to activate user'
            }), 500
    except Exception as e:
        logger.error(f"Failed to activate user: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to activate user'
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
@permission_required('users.delete')
def delete_user(user_id: int):
    """
    Permanently delete a user account.
    Fails if user has dependent data that cannot be safely removed.
    """
    try:
        # Prevent self-deletion
        if user_id == request.current_user['id']:
            return jsonify({'error': 'Cannot delete your own account'}), 400

        success, message = admin_system.delete_user(
            user_id=user_id,
            admin_user_id=request.current_user['id']
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': message
            })
        else:
            return jsonify({
                'status': 'error',
                'message': message
            }), 400 # Bad Request if failed due to constraints
            
    except Exception as e:
        logger.error(f"Failed to delete user: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error during user deletion'
        }), 500

# System Settings Endpoints

@admin_bp.route('/settings', methods=['GET'])
@admin_required
@permission_required('settings.view')
def get_system_settings():
    """Get system settings"""
    try:
        category = request.args.get('category')
        include_private = request.args.get('include_private', 'false').lower() == 'true'
        
        settings = admin_system.get_system_settings(
            category=category,
            include_private=include_private
        )
        
        return jsonify({
            'status': 'success',
            'data': settings
        })
    except Exception as e:
        logger.error(f"Failed to get system settings: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve system settings'
        }), 500

@admin_bp.route('/settings/<setting_key>', methods=['PUT'])
@admin_required
@permission_required('settings.edit')
def update_system_setting(setting_key: str):
    """Update a system setting"""
    try:
        data = request.get_json()
        
        if 'value' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Missing setting value'
            }), 400
        
        success = admin_system.update_system_setting(
            setting_key=setting_key,
            setting_value=data['value'],
            admin_user_id=request.current_user['id']
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Setting updated successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to update setting'
            }), 500
    except Exception as e:
        logger.error(f"Failed to update system setting: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update setting'
        }), 500

# Metrics and Analytics Endpoints

@admin_bp.route('/metrics', methods=['GET'])
@admin_required
@permission_required('metrics.view')
def get_system_metrics():
    """Get system metrics"""
    try:
        category = request.args.get('category')
        hours_back = request.args.get('hours_back', 24, type=int)
        
        if hours_back < 1 or hours_back > 168:  # Max 1 week
            hours_back = 24
        
        metrics = admin_system.get_system_metrics(
            metric_category=category,
            hours_back=hours_back
        )
        
        return jsonify({
            'status': 'success',
            'data': [
                {
                    'name': metric.name,
                    'value': metric.value,
                    'unit': metric.unit,
                    'category': metric.category,
                    'recorded_at': metric.recorded_at.isoformat()
                }
                for metric in metrics
            ]
        })
    except Exception as e:
        logger.error(f"Failed to get system metrics: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve system metrics'
        }), 500

@admin_bp.route('/metrics', methods=['POST'])
@admin_required
@permission_required('metrics.create')
def record_system_metric():
    """Record a new system metric"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'value', 'unit', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        success = admin_system.record_system_metric(
            metric_name=data['name'],
            metric_value=float(data['value']),
            metric_unit=data['unit'],
            metric_category=data['category'],
            tags=data.get('tags')
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Metric recorded successfully'
            }), 201
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to record metric'
            }), 500
    except Exception as e:
        logger.error(f"Failed to record system metric: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to record metric'
        }), 500

# Notification Endpoints

@admin_bp.route('/notifications', methods=['GET'])
@admin_required
def get_notifications():
    """Get system notifications for the current admin user"""
    try:
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        notifications = admin_system.get_notifications(
            target_user_id=request.current_user['id'],
            unread_only=unread_only
        )
        
        return jsonify({
            'status': 'success',
            'data': notifications
        })
    except Exception as e:
        logger.error(f"Failed to get notifications: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve notifications'
        }), 500

@admin_bp.route('/notifications', methods=['POST'])
@admin_required
@permission_required('notifications.create')
def create_notification():
    """Create a system notification"""
    try:
        data = request.get_json()
        
        required_fields = ['type', 'title', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Parse expires_at if provided
        expires_at = None
        if data.get('expires_at'):
            try:
                expires_at = datetime.fromisoformat(data['expires_at'])
            except ValueError:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid expires_at format. Use ISO format.'
                }), 400
        
        success = admin_system.create_system_notification(
            notification_type=data['type'],
            title=data['title'],
            message=data['message'],
            severity=data.get('severity', 'info'),
            target_user_id=data.get('target_user_id'),
            action_url=data.get('action_url'),
            expires_at=expires_at
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Notification created successfully'
            }), 201
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to create notification'
            }), 500
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error during notification creation'
        }), 500

# Role Management Routes

@admin_bp.route('/roles', methods=['GET'])
@admin_required
def get_roles():
    """Get all defined roles"""
    try:
        roles = admin_system.get_roles()
        return jsonify({
            'status': 'success',
            'data': roles
        })
    except Exception as e:
        logger.error(f"Failed to get roles: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve roles'
        }), 500

@admin_bp.route('/roles', methods=['POST'])
@admin_required
@permission_required('roles.create')
def create_role():
    """Create a new role"""
    try:
        data = request.get_json()
        required = ['name', 'display_name', 'permissions']
        if not all(k in data for k in required):
            return jsonify({'error': 'Missing required fields'}), 400
            
        role = admin_system.create_role(
            name=data['name'],
            display_name=data['display_name'],
            description=data.get('description'),
            permissions=data['permissions'],
            admin_user_id=request.current_user['id']
        )
        return jsonify({
            'status': 'success',
            'data': role
        }), 201
    except Exception as e:
        logger.error(f"Failed to create role: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@admin_bp.route('/roles/<int:role_id>', methods=['PUT'])
@admin_required
@permission_required('roles.edit')
def update_role(role_id):
    """Update role"""
    try:
        data = request.get_json()
        success = admin_system.update_role(
            role_id=role_id,
            updates=data,
            admin_user_id=request.current_user['id']
        )
        if success:
            return jsonify({'status': 'success', 'message': 'Role updated'})
        return jsonify({'error': 'Failed to update role'}), 400
    except Exception as e:
        logger.error(f"Failed to update role: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@admin_required
@permission_required('roles.delete')
def delete_role(role_id):
    """Delete role"""
    try:
        success = admin_system.delete_role(
            role_id=role_id,
            admin_user_id=request.current_user['id']
        )
        if success:
            return jsonify({'status': 'success', 'message': 'Role deleted'})
        return jsonify({'error': 'Failed to delete role'}), 400
    except Exception as e:
        logger.error(f"Failed to delete role: {str(e)}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create notification'
        }), 500

# Dashboard Data Endpoint

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard_data():
    """Get comprehensive dashboard data for administrators"""
    try:
        # Get system health
        health_data = admin_system.get_system_health()
        
        # Get recent metrics
        recent_metrics = admin_system.get_system_metrics(hours_back=24)
        
        # Get recent notifications
        notifications = admin_system.get_notifications(
            target_user_id=request.current_user['id'],
            unread_only=True
        )
        
        # Get recent audit logs for activity feed
        recent_activity = admin_system.get_recent_audit_logs(limit=10)
        
        # Get user statistics
        user_stats = admin_system.get_all_users(page=1, per_page=1)
        
        # Get analytics data
        analytics_data = admin_system.get_dashboard_analytics()
        
        dashboard_data = {
            'health': health_data,
            'metrics': {
                'recent': [
                    {
                        'name': metric.name,
                        'value': metric.value,
                        'unit': metric.unit,
                        'category': metric.category,
                        'recorded_at': metric.recorded_at.isoformat()
                    }
                    for metric in recent_metrics[:20]
                ]
            },
            'notifications': {
                'unread_count': len(notifications),
                'recent': recent_activity
            },
            'users': {
                'total': user_stats.get('total', 0)
            },
            'analytics': analytics_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'status': 'success',
            'data': dashboard_data
        })
    except Exception as e:
        logger.error(f"Failed to get dashboard data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve dashboard data'
        }), 500

# Error handlers
@admin_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@admin_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500
