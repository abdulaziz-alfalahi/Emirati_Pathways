#!/usr/bin/env python3
"""
Enhanced CV Upload Routes with Job Matching Integration
Emirati Journey Platform - Complete CV workflow
"""

import os
import json
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import uuid

# Import our CV processing modules
from ..cv_parser import cv_parser
from ..cv_storage_manager import cv_storage_manager
from ..cv_job_matching_integration import cv_job_matching_integration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
enhanced_cv_bp = Blueprint('enhanced_cv', __name__, url_prefix='/api/cv')

# Configuration
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_user_id_from_token():
    """Extract user ID from JWT token (simplified)"""
    # In production, this would properly decode and validate JWT
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        # For demo purposes, return a mock user ID
        return 'user_123'
    return None

@enhanced_cv_bp.route('/upload', methods=['POST'])
def upload_cv():
    """Upload and parse CV file"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
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
                'message': f'File type not allowed. Supported: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'message': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'
            }), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Save file temporarily
        upload_folder = '/tmp/cv_uploads'
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        try:
            # Parse CV
            logger.info(f"Parsing CV: {filename}")
            parse_result = cv_parser.parse_cv(file_path)
            
            if not parse_result.get('success'):
                return jsonify({
                    'success': False,
                    'message': f'CV parsing failed: {parse_result.get("message", "Unknown error")}'
                }), 400
            
            # Add file metadata
            parse_result['file_info'] = {
                'original_filename': filename,
                'file_size': file_size,
                'file_type': filename.rsplit('.', 1)[1].lower(),
                'mime_type': file.content_type,
                'upload_timestamp': datetime.utcnow().isoformat()
            }
            
            # Store CV data
            storage_result = cv_storage_manager.store_cv(parse_result, user_id)
            
            if not storage_result.get('success'):
                return jsonify({
                    'success': False,
                    'message': f'CV storage failed: {storage_result.get("message", "Unknown error")}'
                }), 500
            
            # Process for job matching
            matching_result = cv_job_matching_integration.process_cv_for_job_matching(parse_result, user_id)
            
            # Find initial job matches
            job_matches = {}
            if matching_result.get('success'):
                job_matches = cv_job_matching_integration.find_job_matches(
                    matching_result['matching_criteria'], 
                    limit=10
                )
            
            # Complete user profile
            profile_result = cv_job_matching_integration.complete_profile_from_cv(parse_result)
            
            # Prepare response
            response_data = {
                'success': True,
                'message': 'CV uploaded and processed successfully',
                'cv_id': storage_result.get('cv_id'),
                'data': parse_result.get('data', {}),
                'analysis': parse_result.get('analysis', {}),
                'file_info': parse_result['file_info'],
                'job_matches': job_matches.get('matches', [])[:5],  # Top 5 matches
                'profile_completion': profile_result.get('completion_percentage', 0),
                'processing_time': parse_result.get('processing_time', 0)
            }
            
            return jsonify(response_data), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
    
    except Exception as e:
        logger.error(f"CV upload error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Upload failed: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/parse-text', methods=['POST'])
def parse_cv_text():
    """Parse CV from text input"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get request data
        data = request.get_json()
        if not data or 'cv_text' not in data:
            return jsonify({
                'success': False,
                'message': 'CV text is required'
            }), 400
        
        cv_text = data['cv_text'].strip()
        
        # Validate text length
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
        logger.info("Parsing CV from text input")
        parse_result = cv_parser.parse_cv_text(cv_text)
        
        if not parse_result.get('success'):
            return jsonify({
                'success': False,
                'message': f'CV parsing failed: {parse_result.get("message", "Unknown error")}'
            }), 400
        
        # Add metadata
        parse_result['file_info'] = {
            'source': 'text_input',
            'text_length': len(cv_text),
            'upload_timestamp': datetime.utcnow().isoformat()
        }
        
        # Store CV data
        storage_result = cv_storage_manager.store_cv(parse_result, user_id)
        
        if not storage_result.get('success'):
            return jsonify({
                'success': False,
                'message': f'CV storage failed: {storage_result.get("message", "Unknown error")}'
            }), 500
        
        # Process for job matching
        matching_result = cv_job_matching_integration.process_cv_for_job_matching(parse_result, user_id)
        
        # Find initial job matches
        job_matches = {}
        if matching_result.get('success'):
            job_matches = cv_job_matching_integration.find_job_matches(
                matching_result['matching_criteria'], 
                limit=10
            )
        
        # Complete user profile
        profile_result = cv_job_matching_integration.complete_profile_from_cv(parse_result)
        
        # Prepare response
        response_data = {
            'success': True,
            'message': 'CV text processed successfully',
            'cv_id': storage_result.get('cv_id'),
            'data': parse_result.get('data', {}),
            'analysis': parse_result.get('analysis', {}),
            'file_info': parse_result['file_info'],
            'job_matches': job_matches.get('matches', [])[:5],  # Top 5 matches
            'profile_completion': profile_result.get('completion_percentage', 0),
            'processing_time': parse_result.get('processing_time', 0)
        }
        
        return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"CV text parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Text parsing failed: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/list', methods=['GET'])
def list_user_cvs():
    """List user's CVs"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get pagination parameters
        limit = min(int(request.args.get('limit', 20)), 100)
        offset = int(request.args.get('offset', 0))
        
        # Get user CVs
        result = cv_storage_manager.get_user_cvs(user_id, limit, offset)
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"CV list error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve CVs: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>', methods=['GET'])
def get_cv(cv_id):
    """Get specific CV data"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get CV data
        result = cv_storage_manager.get_cv(cv_id, user_id)
        
        return jsonify(result), 200 if result.get('success') else 404
    
    except Exception as e:
        logger.error(f"CV retrieval error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve CV: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>', methods=['DELETE'])
def delete_cv(cv_id):
    """Delete CV"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Delete CV
        result = cv_storage_manager.delete_cv(cv_id, user_id)
        
        return jsonify(result), 200 if result.get('success') else 404
    
    except Exception as e:
        logger.error(f"CV deletion error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to delete CV: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>/job-matches', methods=['GET'])
def get_cv_job_matches(cv_id):
    """Get job matches for specific CV"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get CV data
        cv_result = cv_storage_manager.get_cv(cv_id, user_id)
        
        if not cv_result.get('success'):
            return jsonify({
                'success': False,
                'message': 'CV not found'
            }), 404
        
        # Process for job matching
        matching_result = cv_job_matching_integration.process_cv_for_job_matching(cv_result, user_id)
        
        if not matching_result.get('success'):
            return jsonify({
                'success': False,
                'message': 'Failed to process CV for job matching'
            }), 500
        
        # Get pagination parameters
        limit = min(int(request.args.get('limit', 20)), 100)
        
        # Find job matches
        job_matches = cv_job_matching_integration.find_job_matches(
            matching_result['matching_criteria'], 
            limit=limit
        )
        
        return jsonify(job_matches), 200
    
    except Exception as e:
        logger.error(f"Job matching error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to find job matches: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>/job-application-insights', methods=['POST'])
def get_job_application_insights(cv_id):
    """Get insights for job application"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get request data
        data = request.get_json()
        if not data or 'job_description' not in data:
            return jsonify({
                'success': False,
                'message': 'Job description is required'
            }), 400
        
        job_description = data['job_description']
        
        # Get CV data
        cv_result = cv_storage_manager.get_cv(cv_id, user_id)
        
        if not cv_result.get('success'):
            return jsonify({
                'success': False,
                'message': 'CV not found'
            }), 404
        
        # Generate insights
        insights = cv_job_matching_integration.generate_job_application_insights(
            cv_result, 
            job_description
        )
        
        return jsonify(insights), 200
    
    except Exception as e:
        logger.error(f"Job application insights error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to generate insights: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>/analytics', methods=['GET'])
def get_cv_analytics(cv_id):
    """Get CV analytics"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get analytics
        result = cv_storage_manager.get_cv_analytics(cv_id, user_id)
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"CV analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve analytics: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/storage-stats', methods=['GET'])
def get_storage_stats():
    """Get storage statistics (admin only)"""
    try:
        # In production, check admin permissions
        result = cv_storage_manager.get_storage_stats()
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Storage stats error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve stats: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test basic functionality
        test_result = {
            'cv_parser': hasattr(cv_parser, 'parse_cv'),
            'storage_manager': hasattr(cv_storage_manager, 'store_cv'),
            'job_matching': hasattr(cv_job_matching_integration, 'process_cv_for_job_matching'),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        all_healthy = all(test_result.values())
        
        return jsonify({
            'success': True,
            'status': 'healthy' if all_healthy else 'degraded',
            'components': test_result
        }), 200 if all_healthy else 503
    
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'message': str(e)
        }), 503

# Error handlers
@enhanced_cv_bp.errorhandler(413)
def file_too_large(error):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'message': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'
    }), 413

@enhanced_cv_bp.errorhandler(400)
def bad_request(error):
    """Handle bad request error"""
    return jsonify({
        'success': False,
        'message': 'Bad request'
    }), 400

@enhanced_cv_bp.errorhandler(500)
def internal_error(error):
    """Handle internal server error"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500
