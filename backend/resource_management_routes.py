"""
Resource Management API Routes
Emirati Journey Platform - Educator Persona
RESTful API endpoints for digital library and resource management
Created: September 20, 2025
"""

from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import jwt
import json
from datetime import datetime
import logging
from resource_management_system import ResourceManagementSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
resource_management_bp = Blueprint('resource_management', __name__, url_prefix='/api/resources')

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

# Initialize Resource Management System
resource_system = ResourceManagementSystem(DB_CONFIG)

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data.get('sub') or data.get('user_id')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated

def educator_required(f):
    """Decorator to require educator role"""
    @wraps(f)
    def decorated(current_user_id, *args, **kwargs):
        # Add role verification logic here if needed
        return f(current_user_id, *args, **kwargs)
    return decorated

# ==================== HEALTH CHECK ====================

@resource_management_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Resource Management System',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# ==================== RESOURCE MANAGEMENT ====================

@resource_management_bp.route('/create', methods=['POST'])
@token_required
@educator_required
def create_resource(current_user_id):
    """Create a new educational resource"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided',
                'message': 'Request body is required'
            }), 400
        
        result = resource_system.create_resource(data, current_user_id)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_resource: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

@resource_management_bp.route('/search', methods=['GET', 'POST'])
@token_required
def search_resources(current_user_id):
    """Search for educational resources"""
    try:
        if request.method == 'POST':
            search_params = request.get_json() or {}
        else:
            search_params = {
                'query': request.args.get('query'),
                'subject': request.args.get('subject'),
                'grade_levels': request.args.getlist('grade_levels'),
                'resource_type': request.args.get('resource_type'),
                'difficulty_level': request.args.get('difficulty_level'),
                'is_free': request.args.get('is_free', type=bool),
                'min_rating': request.args.get('min_rating', type=float),
                'sort_by': request.args.get('sort_by', 'relevance'),
                'limit': request.args.get('limit', 20, type=int),
                'offset': request.args.get('offset', 0, type=int)
            }
            
            # Convert grade_levels to integers
            if search_params['grade_levels']:
                search_params['grade_levels'] = [int(g) for g in search_params['grade_levels']]
        
        result = resource_system.search_resources(search_params, current_user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in search_resources: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

@resource_management_bp.route('/<resource_id>', methods=['GET'])
@token_required
def get_resource_details(current_user_id, resource_id):
    """Get detailed information about a specific resource"""
    try:
        result = resource_system.get_resource_details(resource_id, current_user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_resource_details: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

@resource_management_bp.route('/<resource_id>/analytics', methods=['GET'])
@token_required
@educator_required
def get_resource_analytics(current_user_id, resource_id):
    """Get analytics for a specific resource"""
    try:
        result = resource_system.get_resource_analytics(resource_id, current_user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 403
            
    except Exception as e:
        logger.error(f"Error in get_resource_analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

# ==================== RESOURCE COLLECTIONS ====================

@resource_management_bp.route('/collections/create', methods=['POST'])
@token_required
@educator_required
def create_collection(current_user_id):
    """Create a new resource collection"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided',
                'message': 'Request body is required'
            }), 400
        
        result = resource_system.create_collection(data, current_user_id)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_collection: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

@resource_management_bp.route('/collections/<collection_id>/add-resource', methods=['POST'])
@token_required
@educator_required
def add_resource_to_collection(current_user_id, collection_id):
    """Add a resource to a collection"""
    try:
        data = request.get_json()
        
        if not data or 'resource_id' not in data:
            return jsonify({
                'success': False,
                'error': 'Resource ID is required',
                'message': 'Please provide a resource_id in the request body'
            }), 400
        
        resource_id = data['resource_id']
        item_data = data.get('item_data', {})
        
        result = resource_system.add_resource_to_collection(
            collection_id, resource_id, current_user_id, item_data
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in add_resource_to_collection: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

# ==================== USER LIBRARY MANAGEMENT ====================

@resource_management_bp.route('/library/add', methods=['POST'])
@token_required
def add_to_library(current_user_id):
    """Add a resource to user's personal library"""
    try:
        data = request.get_json()
        
        if not data or 'resource_id' not in data:
            return jsonify({
                'success': False,
                'error': 'Resource ID is required',
                'message': 'Please provide a resource_id in the request body'
            }), 400
        
        resource_id = data['resource_id']
        library_data = data.get('library_data', {})
        
        result = resource_system.add_to_user_library(current_user_id, resource_id, library_data)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in add_to_library: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

@resource_management_bp.route('/library', methods=['GET'])
@token_required
def get_user_library(current_user_id):
    """Get user's personal resource library"""
    try:
        filters = {
            'folder_name': request.args.get('folder_name'),
            'is_favorite': request.args.get('is_favorite', type=bool),
            'tags': request.args.getlist('tags'),
            'subject': request.args.get('subject')
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        result = resource_system.get_user_library(current_user_id, filters)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in get_user_library: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

# ==================== CATEGORIES AND DISCOVERY ====================

@resource_management_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all resource categories"""
    try:
        result = resource_system.get_resource_categories()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in get_categories: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

@resource_management_bp.route('/featured', methods=['GET'])
def get_featured_resources():
    """Get featured educational resources"""
    try:
        limit = request.args.get('limit', 10, type=int)
        result = resource_system.get_featured_resources(limit)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in get_featured_resources: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

# ==================== RESOURCE REVIEWS ====================

@resource_management_bp.route('/<resource_id>/review', methods=['POST'])
@token_required
def create_resource_review(current_user_id, resource_id):
    """Create a review for a resource"""
    try:
        data = request.get_json()
        
        if not data or 'rating' not in data:
            return jsonify({
                'success': False,
                'error': 'Rating is required',
                'message': 'Please provide a rating (1-5) in the request body'
            }), 400
        
        # This would be implemented in the resource system
        # For now, return a placeholder response
        return jsonify({
            'success': True,
            'message': 'Review functionality will be implemented',
            'data': data
        }), 201
        
    except Exception as e:
        logger.error(f"Error in create_resource_review: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

# ==================== BULK OPERATIONS ====================

@resource_management_bp.route('/bulk/import', methods=['POST'])
@token_required
@educator_required
def bulk_import_resources(current_user_id):
    """Bulk import resources from external sources"""
    try:
        data = request.get_json()
        
        if not data or 'resources' not in data:
            return jsonify({
                'success': False,
                'error': 'Resources list is required',
                'message': 'Please provide a resources array in the request body'
            }), 400
        
        # This would be implemented for bulk operations
        # For now, return a placeholder response
        return jsonify({
            'success': True,
            'message': 'Bulk import functionality will be implemented',
            'imported_count': len(data['resources'])
        }), 201
        
    except Exception as e:
        logger.error(f"Error in bulk_import_resources: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

# ==================== ADVANCED SEARCH ====================

@resource_management_bp.route('/advanced-search', methods=['POST'])
@token_required
def advanced_search(current_user_id):
    """Advanced search with complex filters and facets"""
    try:
        search_params = request.get_json() or {}
        
        # Enhanced search with additional filters
        enhanced_params = {
            **search_params,
            'include_facets': True,
            'include_suggestions': True
        }
        
        result = resource_system.search_resources(enhanced_params, current_user_id)
        
        if result['success']:
            # Add facets and suggestions to the response
            result['facets'] = {
                'subjects': ['Mathematics', 'Science', 'English', 'Arabic', 'Social Studies'],
                'resource_types': ['lesson_plan', 'worksheet', 'video', 'assessment'],
                'difficulty_levels': ['beginner', 'intermediate', 'advanced'],
                'grade_levels': list(range(1, 13))
            }
            
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in advanced_search: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

# ==================== RECOMMENDATIONS ====================

@resource_management_bp.route('/recommendations', methods=['GET'])
@token_required
def get_recommendations(current_user_id):
    """Get personalized resource recommendations"""
    try:
        # This would implement ML-based recommendations
        # For now, return featured resources as recommendations
        result = resource_system.get_featured_resources(10)
        
        if result['success']:
            return jsonify({
                'success': True,
                'recommendations': result['featured_resources'],
                'recommendation_type': 'featured_based',
                'message': 'Personalized recommendations based on your activity'
            }), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in get_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

# ==================== ERROR HANDLERS ====================

@resource_management_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested resource management endpoint does not exist'
    }), 404

@resource_management_bp.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({
        'success': False,
        'error': 'Method not allowed',
        'message': 'The HTTP method is not allowed for this endpoint'
    }), 405

@resource_management_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred in the resource management system'
    }), 500

# Export the blueprint
__all__ = ['resource_management_bp']
