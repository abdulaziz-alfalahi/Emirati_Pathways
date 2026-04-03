#!/usr/bin/env python3
"""
CV Upload Routes - DEPRECATED
==============================
⚠️ This module is DEPRECATED. All CV routes have been consolidated into
   routes/enhanced_cv_routes.py (enhanced_cv_bp).

Do NOT register this blueprint alongside enhanced_cv_bp — they share
the same url_prefix (/api/cv) and will cause route collisions.

This file is kept for reference only. Remove in a future cleanup pass.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from pathlib import Path
import mimetypes
import magic
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..cv_parser import CVParser
from ..auth.auth_manager import AuthenticationManager as AuthManager
from ..services.profile_v2_service import ProfileV2Service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
cv_upload_bp = Blueprint('cv_upload', __name__, url_prefix='/api/cv')

# Initialize services
cv_parser = CVParser()
auth_manager = AuthManager()

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain'
}

UPLOAD_FOLDER = Path(os.getenv('UPLOAD_FOLDER', '/tmp/cv_uploads'))
UPLOAD_FOLDER.mkdir(exist_ok=True)

import uuid
def get_normalized_user_id_cv_upload(identity):
    """
    Normalize user identity to a consistent UUID string.
    Local implementation to ensure this route works correctly.
    """
    if not identity:
        return None
        
    if isinstance(identity, dict):
        identity = identity.get('id')
    
    identity_str = str(identity).strip()
    
    # Legacy Integer ID Support
    if identity_str.isdigit():
        return identity_str
    
    try:
        # Check if already valid UUID
        return str(uuid.UUID(identity_str))
    except ValueError:
        # If not, hash strictly using DNS namespace
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, identity_str))


def validate_file(file: FileStorage) -> Dict[str, Any]:
    """Comprehensive file validation with robust error handling"""
    try:
        # Check if file exists
        if not file or not file.filename:
            return {
                'valid': False,
                'error': 'No file provided'
            }
        
        # Check file size safely
        try:
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning
        except Exception as e:
            logger.error(f"Error checking file size: {e}")
            # Fallback if seek fails (unlikely for local files)
            file_size = 0
        
        if file_size > MAX_FILE_SIZE:
            return {
                'valid': False,
                'error': f'File size ({file_size / 1024 / 1024:.1f}MB) exceeds maximum allowed size (10MB)'
            }
        
        if file_size == 0:
            return {
                'valid': False,
                'error': 'File is empty'
            }
        
        # Check file extension
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        
        if file_ext not in ALLOWED_EXTENSIONS:
            return {
                'valid': False,
                'error': f'File type .{file_ext} not supported. Allowed: {", ".join(ALLOWED_EXTENSIONS.keys())}'
            }
        
        # Check MIME type with heavy safety
        detected_mime = None
        try:
            # Try python-magic
            file_content = file.read(2048)
            file.seek(0)
            
            if hasattr(magic, 'from_buffer'):
                detected_mime = magic.from_buffer(file_content, mime=True)
        except Exception as e:
            logger.warning(f"Magic validation failed (non-fatal): {e}")
        
        # Fallback to mimetypes
        if not detected_mime:
            try:
                detected_mime = mimetypes.guess_type(filename)[0]
            except Exception as e:
                logger.warning(f"Mimetypes guess failed: {e}")
        
        # Default fallback
        if not detected_mime:
             detected_mime = 'application/octet-stream'

        expected_mime = ALLOWED_EXTENSIONS.get(file_ext, '')
        
        # Log mismatch but don't fail unless strict security policy needed
        if detected_mime != expected_mime and expected_mime:
            logger.warning(f"MIME type mismatch: detected {detected_mime}, expected {expected_mime} for .{file_ext}")
            
            # Optional: Allow PDF even if detected as something generic, provided extension is PDF
            # This fixes issues where magic detects application/octet-stream for some PDFs
        
        # Additional security checks
        if filename.startswith('.') or '/' in filename or '\\' in filename:
            return {
                'valid': False,
                'error': 'Invalid filename'
            }
        
        return {
            'valid': True,
            'filename': filename,
            'file_size': file_size,
            'file_ext': file_ext,
            'mime_type': detected_mime
        }
        
    except Exception as e:
        import traceback
        logger.error(f"File validation critical error: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'valid': False,
            'error': f'File validation failed: {str(e)}'
        }

@cv_upload_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_cv():
    """Upload and parse CV file"""
    try:
        raw_user_id = get_jwt_identity()
        user_id = get_normalized_user_id_cv_upload(raw_user_id)
        logger.info(f"Processing Upload (Route 2) for User: {user_id} (Raw: {raw_user_id})")
        
        # Check if file is in request
        if 'cv_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided in request'
            }), 400
        
        file = request.files['cv_file']
        
        # Validate file
        validation_result = validate_file(file)
        if not validation_result['valid']:
            return jsonify({
                'success': False,
                'message': validation_result['error']
            }), 400
        
        # Save file temporarily
        filename = validation_result['filename']
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_filename = f"{user_id}_{timestamp}_{filename}"
        file_path = UPLOAD_FOLDER / safe_filename
        
        try:
            file.save(str(file_path))
            logger.info(f"File saved: {file_path}")
            
            # Reset file pointer for parsing
            file.seek(0)
            
            # Parse CV
            parse_result = cv_parser.parse_cv_file(file, user_id)
            
            if not parse_result.get('success', False):
                return jsonify({
                    'success': False,
                    'message': parse_result.get('message', 'CV parsing failed')
                }), 400
            
            # Save parsed data to profile
            try:
                ProfileV2Service.populate_from_cv_data(user_id, parse_result)
            except Exception as e:
                logger.error(f"Failed to save CV data to profile: {e}")

            # Add file metadata to result
            parse_result['file_info'] = {
                'original_filename': filename,
                'file_size': validation_result['file_size'],
                'file_type': validation_result['file_ext'],
                'mime_type': validation_result['mime_type'],
                'upload_timestamp': datetime.utcnow().isoformat()
            }
            
            # Clean up temporary file
            try:
                file_path.unlink()
            except:
                pass
            
            logger.info(f"✅ CV upload successful for user {user_id}")
            return jsonify(parse_result), 200
            
        except Exception as e:
            # Clean up on error
            try:
                file_path.unlink()
            except:
                pass
            raise e
            
    except Exception as e:
        logger.error(f"CV upload error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Upload failed: {str(e)}'
        }), 500

@cv_upload_bp.route('/parse-text', methods=['POST'])
@jwt_required()
def parse_cv_text():
    """Parse CV from text input"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'cv_text' not in data:
            return jsonify({
                'success': False,
                'message': 'No CV text provided'
            }), 400
        
        cv_text = data['cv_text'].strip()
        
        if len(cv_text) < 50:
            return jsonify({
                'success': False,
                'message': 'CV text too short (minimum 50 characters)'
            }), 400
        
        if len(cv_text) > 50000:
            return jsonify({
                'success': False,
                'message': 'CV text too long (maximum 50,000 characters)'
            }), 400
        
        # Parse CV text
        parse_result = cv_parser.parse_cv_text(cv_text, user_id)
        
        if not parse_result.get('success', False):
            return jsonify({
                'success': False,
                'message': parse_result.get('message', 'CV parsing failed')
            }), 400
        
        logger.info(f"✅ CV text parsing successful for user {user_id}")
        return jsonify(parse_result), 200
        
    except Exception as e:
        logger.error(f"CV text parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Text parsing failed: {str(e)}'
        }), 500

@cv_upload_bp.route('/validate-file', methods=['POST'])
@jwt_required()
def validate_cv_file():
    """Validate CV file without parsing"""
    try:
        if 'cv_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['cv_file']
        validation_result = validate_file(file)
        
        if validation_result['valid']:
            return jsonify({
                'success': True,
                'message': 'File is valid',
                'file_info': {
                    'filename': validation_result['filename'],
                    'size': validation_result['file_size'],
                    'type': validation_result['file_ext'],
                    'mime_type': validation_result['mime_type']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': validation_result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"File validation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Validation failed: {str(e)}'
        }), 500

@cv_upload_bp.route('/supported-formats', methods=['GET'])
def get_supported_formats():
    """Get list of supported file formats"""
    return jsonify({
        'success': True,
        'supported_formats': [
            {
                'extension': ext,
                'mime_type': mime,
                'description': {
                    'pdf': 'PDF Document',
                    'docx': 'Microsoft Word Document (2007+)',
                    'doc': 'Microsoft Word Document (Legacy)',
                    'txt': 'Plain Text File'
                }.get(ext, ext.upper())
            }
            for ext, mime in ALLOWED_EXTENSIONS.items()
        ],
        'max_file_size': f"{MAX_FILE_SIZE / 1024 / 1024:.0f}MB",
        'max_text_length': '50,000 characters'
    }), 200

@cv_upload_bp.route('/upload-status/<cv_id>', methods=['GET'])
@jwt_required()
def get_upload_status(cv_id: str):
    """Get CV upload and parsing status"""
    try:
        user_id = get_jwt_identity()
        
        # This would typically query a database for CV status
        # For now, return a mock response
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'status': 'completed',
            'user_id': user_id,
            'message': 'CV processing completed successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Status check failed: {str(e)}'
        }), 500

@cv_upload_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check if CV parser is working
        test_result = cv_parser.parse_cv_text("Test CV content for health check", "health_check")
        
        return jsonify({
            'success': True,
            'message': 'CV upload service is healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'parser_status': 'operational' if test_result else 'degraded',
            'supported_formats': len(ALLOWED_EXTENSIONS),
            'max_file_size': f"{MAX_FILE_SIZE / 1024 / 1024:.0f}MB"
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Service unhealthy: {str(e)}'
        }), 503

# Error handlers
@cv_upload_bp.errorhandler(413)
def file_too_large(error):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'message': f'File too large. Maximum size allowed: {MAX_FILE_SIZE / 1024 / 1024:.0f}MB'
    }), 413

@cv_upload_bp.errorhandler(400)
def bad_request(error):
    """Handle bad request error"""
    return jsonify({
        'success': False,
        'message': 'Bad request. Please check your input.'
    }), 400

@cv_upload_bp.errorhandler(500)
def internal_error(error):
    """Handle internal server error"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'message': 'Internal server error. Please try again later.'
    }), 500

# Register blueprint function
def register_cv_upload_routes(app):
    """Register CV upload routes with Flask app"""
    app.register_blueprint(cv_upload_bp)
    logger.info("✅ CV upload routes registered")
