"""
Content Management System API Routes

This module defines the Flask routes for the CMS functionality,
providing endpoints for content and media management operations.
"""

from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
from datetime import datetime
import json
import logging
import os
import io
from functools import wraps
from typing import Dict, Any, Optional

from ..content_management_system import ContentManagementSystem
from ..auth.auth_manager import AuthManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
cms_bp = Blueprint('cms', __name__, url_prefix='/api/cms')

# Initialize systems (these would be properly configured in the main app)
cms_system = None
auth_manager = None

def init_cms_routes(app, db_config: Dict[str, str], storage_config: Dict[str, str]):
    """Initialize CMS routes with database and storage configuration"""
    global cms_system, auth_manager
    cms_system = ContentManagementSystem(db_config, storage_config)
    auth_manager = AuthManager(db_config)

def cms_auth_required(f):
    """Decorator to require CMS authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authentication required'}), 401
            
            token = auth_header.split(' ')[1]
            
            # Verify token and get user info
            user_info = auth_manager.verify_token(token)
            if not user_info:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Add user info to request context
            request.current_user = user_info
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"CMS authentication error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

def content_permission_required(permission: str):
    """Decorator to require specific content permission"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user = getattr(request, 'current_user', None)
                if not user:
                    return jsonify({'error': 'Authentication required'}), 401
                
                # For now, we'll allow all authenticated users
                # In production, implement proper permission checking
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(f"Permission check error: {str(e)}")
                return jsonify({'error': 'Permission check failed'}), 403
        
        return decorated_function
    return decorator

# Health Check
@cms_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for CMS services"""
    try:
        return jsonify({
            'status': 'success',
            'service': 'Content Management System',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"CMS health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'CMS health check failed',
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Content Management Endpoints

@cms_bp.route('/content', methods=['GET'])
@cms_auth_required
@content_permission_required('content.view')
def list_content():
    """List content items with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        content_type = request.args.get('type', '')
        status = request.args.get('status', '')
        language = request.args.get('language', '')
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        created_by = request.args.get('created_by', type=int)
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 20
        
        result = cms_system.list_content(
            page=page,
            per_page=per_page,
            content_type=content_type if content_type else None,
            status=status if status else None,
            language=language if language else None,
            category=category if category else None,
            search=search if search else None,
            created_by=created_by
        )
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        logger.error(f"Failed to list content: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve content list'
        }), 500

@cms_bp.route('/content', methods=['POST'])
@cms_auth_required
@content_permission_required('content.create')
def create_content():
    """Create new content item"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'content_type', 'content_data']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create content
        content_item = cms_system.create_content(
            title=data['title'],
            content_type=data['content_type'],
            content_data=data['content_data'],
            language=data.get('language', 'en'),
            meta_data=data.get('meta_data'),
            category=data.get('category'),
            tags=data.get('tags'),
            created_by=request.current_user['user_id']
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': content_item.id,
                'uuid': content_item.uuid,
                'title': content_item.title,
                'slug': content_item.slug,
                'content_type': content_item.content_type,
                'status': content_item.status,
                'language': content_item.language,
                'created_at': content_item.created_at.isoformat(),
                'updated_at': content_item.updated_at.isoformat()
            },
            'message': 'Content created successfully'
        }), 201
    except Exception as e:
        logger.error(f"Failed to create content: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create content'
        }), 500

@cms_bp.route('/content/<int:content_id>', methods=['GET'])
@cms_auth_required
@content_permission_required('content.view')
def get_content(content_id: int):
    """Get specific content item"""
    try:
        include_drafts = request.args.get('include_drafts', 'false').lower() == 'true'
        
        content_item = cms_system.get_content(content_id, include_drafts=include_drafts)
        if not content_item:
            return jsonify({
                'status': 'error',
                'message': 'Content not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': content_item.id,
                'uuid': content_item.uuid,
                'title': content_item.title,
                'slug': content_item.slug,
                'content_type': content_item.content_type,
                'status': content_item.status,
                'language': content_item.language,
                'content_data': content_item.content_data,
                'meta_data': content_item.meta_data,
                'created_by': content_item.created_by,
                'created_at': content_item.created_at.isoformat(),
                'updated_at': content_item.updated_at.isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Failed to get content: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve content'
        }), 500

@cms_bp.route('/content/slug/<slug>', methods=['GET'])
@cms_auth_required
@content_permission_required('content.view')
def get_content_by_slug(slug: str):
    """Get content item by slug"""
    try:
        include_drafts = request.args.get('include_drafts', 'false').lower() == 'true'
        
        content_item = cms_system.get_content(slug=slug, include_drafts=include_drafts)
        if not content_item:
            return jsonify({
                'status': 'error',
                'message': 'Content not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': content_item.id,
                'uuid': content_item.uuid,
                'title': content_item.title,
                'slug': content_item.slug,
                'content_type': content_item.content_type,
                'status': content_item.status,
                'language': content_item.language,
                'content_data': content_item.content_data,
                'meta_data': content_item.meta_data,
                'created_by': content_item.created_by,
                'created_at': content_item.created_at.isoformat(),
                'updated_at': content_item.updated_at.isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Failed to get content by slug: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve content'
        }), 500

@cms_bp.route('/content/<int:content_id>', methods=['PUT'])
@cms_auth_required
@content_permission_required('content.edit')
def update_content(content_id: int):
    """Update content item"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided for update'
            }), 400
        
        # Remove fields that shouldn't be updated directly
        protected_fields = ['id', 'uuid', 'created_by', 'created_at']
        for field in protected_fields:
            data.pop(field, None)
        
        change_summary = data.pop('change_summary', None)
        
        content_item = cms_system.update_content(
            content_id=content_id,
            updates=data,
            updated_by=request.current_user['user_id'],
            change_summary=change_summary
        )
        
        if not content_item:
            return jsonify({
                'status': 'error',
                'message': 'Content not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': content_item.id,
                'uuid': content_item.uuid,
                'title': content_item.title,
                'slug': content_item.slug,
                'content_type': content_item.content_type,
                'status': content_item.status,
                'language': content_item.language,
                'updated_at': content_item.updated_at.isoformat()
            },
            'message': 'Content updated successfully'
        })
    except Exception as e:
        logger.error(f"Failed to update content: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update content'
        }), 500

@cms_bp.route('/content/<int:content_id>', methods=['DELETE'])
@cms_auth_required
@content_permission_required('content.delete')
def delete_content(content_id: int):
    """Delete (archive) content item"""
    try:
        success = cms_system.delete_content(content_id, request.current_user['user_id'])
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Content archived successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to archive content'
            }), 500
    except Exception as e:
        logger.error(f"Failed to delete content: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to archive content'
        }), 500

@cms_bp.route('/content/<int:content_id>/versions', methods=['GET'])
@cms_auth_required
@content_permission_required('content.view')
def get_content_versions(content_id: int):
    """Get version history for content item"""
    try:
        versions = cms_system.get_content_versions(content_id)
        
        return jsonify({
            'status': 'success',
            'data': versions
        })
    except Exception as e:
        logger.error(f"Failed to get content versions: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve content versions'
        }), 500

@cms_bp.route('/content/<int:content_id>/versions/<int:version_number>/restore', methods=['POST'])
@cms_auth_required
@content_permission_required('content.edit')
def restore_content_version(content_id: int, version_number: int):
    """Restore content to a specific version"""
    try:
        content_item = cms_system.restore_content_version(
            content_id, version_number, request.current_user['user_id']
        )
        
        if not content_item:
            return jsonify({
                'status': 'error',
                'message': 'Failed to restore content version'
            }), 500
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': content_item.id,
                'title': content_item.title,
                'updated_at': content_item.updated_at.isoformat()
            },
            'message': f'Content restored to version {version_number}'
        })
    except Exception as e:
        logger.error(f"Failed to restore content version: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to restore content version'
        }), 500

# Media Management Endpoints

@cms_bp.route('/media', methods=['GET'])
@cms_auth_required
@content_permission_required('media.view')
def list_media():
    """List media assets with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        mime_type_filter = request.args.get('type', '')
        uploaded_by = request.args.get('uploaded_by', type=int)
        search = request.args.get('search', '')
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 20
        
        result = cms_system.list_media(
            page=page,
            per_page=per_page,
            mime_type_filter=mime_type_filter if mime_type_filter else None,
            uploaded_by=uploaded_by,
            search=search if search else None
        )
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        logger.error(f"Failed to list media: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve media list'
        }), 500

@cms_bp.route('/media', methods=['POST'])
@cms_auth_required
@content_permission_required('media.upload')
def upload_media():
    """Upload media file"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No file selected'
            }), 400
        
        # Get additional metadata
        alt_text = request.form.get('alt_text', '')
        caption = request.form.get('caption', '')
        description = request.form.get('description', '')
        tags = request.form.get('tags', '').split(',') if request.form.get('tags') else []
        
        # Clean tags
        tags = [tag.strip() for tag in tags if tag.strip()]
        
        # Upload media
        media_asset = cms_system.upload_media(
            file_data=file,
            original_filename=secure_filename(file.filename),
            alt_text=alt_text if alt_text else None,
            caption=caption if caption else None,
            description=description if description else None,
            tags=tags if tags else None,
            uploaded_by=request.current_user['user_id']
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': media_asset.id,
                'uuid': media_asset.uuid,
                'filename': media_asset.filename,
                'original_name': media_asset.original_name,
                'mime_type': media_asset.mime_type,
                'file_size': media_asset.file_size,
                'alt_text': media_asset.alt_text,
                'uploaded_at': media_asset.uploaded_at.isoformat()
            },
            'message': 'Media uploaded successfully'
        }), 201
    except Exception as e:
        logger.error(f"Failed to upload media: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to upload media'
        }), 500

@cms_bp.route('/media/<int:media_id>', methods=['GET'])
@cms_auth_required
@content_permission_required('media.view')
def get_media_info(media_id: int):
    """Get media asset information"""
    try:
        media_asset = cms_system.get_media(media_id)
        if not media_asset:
            return jsonify({
                'status': 'error',
                'message': 'Media not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': media_asset.id,
                'uuid': media_asset.uuid,
                'filename': media_asset.filename,
                'original_name': media_asset.original_name,
                'mime_type': media_asset.mime_type,
                'file_size': media_asset.file_size,
                'alt_text': media_asset.alt_text,
                'uploaded_by': media_asset.uploaded_by,
                'uploaded_at': media_asset.uploaded_at.isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Failed to get media info: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve media information'
        }), 500

@cms_bp.route('/media/<int:media_id>/download', methods=['GET'])
@cms_auth_required
@content_permission_required('media.view')
def download_media(media_id: int):
    """Download media file"""
    try:
        media_asset = cms_system.get_media(media_id)
        if not media_asset:
            return jsonify({
                'status': 'error',
                'message': 'Media not found'
            }), 404
        
        if not os.path.exists(media_asset.storage_path):
            return jsonify({
                'status': 'error',
                'message': 'Media file not found on storage'
            }), 404
        
        return send_file(
            media_asset.storage_path,
            as_attachment=True,
            download_name=media_asset.original_name,
            mimetype=media_asset.mime_type
        )
    except Exception as e:
        logger.error(f"Failed to download media: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to download media'
        }), 500

@cms_bp.route('/media/<int:media_id>', methods=['DELETE'])
@cms_auth_required
@content_permission_required('media.delete')
def delete_media(media_id: int):
    """Delete media asset"""
    try:
        success = cms_system.delete_media(media_id)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Media deleted successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to delete media'
            }), 500
    except Exception as e:
        logger.error(f"Failed to delete media: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete media'
        }), 500

# Bulk Operations

@cms_bp.route('/content/bulk/publish', methods=['POST'])
@cms_auth_required
@content_permission_required('content.publish')
def bulk_publish_content():
    """Bulk publish content items"""
    try:
        data = request.get_json()
        content_ids = data.get('content_ids', [])
        
        if not content_ids:
            return jsonify({
                'status': 'error',
                'message': 'No content IDs provided'
            }), 400
        
        published_count = 0
        failed_count = 0
        
        for content_id in content_ids:
            try:
                cms_system.update_content(
                    content_id=content_id,
                    updates={'status': 'published', 'publish_date': datetime.utcnow()},
                    updated_by=request.current_user['user_id'],
                    change_summary='Bulk published'
                )
                published_count += 1
            except Exception as e:
                logger.error(f"Failed to publish content {content_id}: {str(e)}")
                failed_count += 1
        
        return jsonify({
            'status': 'success',
            'data': {
                'published_count': published_count,
                'failed_count': failed_count,
                'total_count': len(content_ids)
            },
            'message': f'Bulk publish completed: {published_count} published, {failed_count} failed'
        })
    except Exception as e:
        logger.error(f"Failed to bulk publish content: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to bulk publish content'
        }), 500

# Error handlers
@cms_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@cms_bp.errorhandler(413)
def file_too_large(error):
    return jsonify({
        'status': 'error',
        'message': 'File too large'
    }), 413

@cms_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500
