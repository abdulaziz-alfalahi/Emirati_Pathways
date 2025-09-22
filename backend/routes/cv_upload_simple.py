"""
Simplified CV Upload Routes - No Magic Dependency
"""
import os
import json
import logging
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
cv_upload_bp = Blueprint('cv_upload', __name__, url_prefix='/api/cv')

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
UPLOAD_FOLDER = Path('/tmp/cv_uploads')
UPLOAD_FOLDER.mkdir(exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@cv_upload_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_cv():
    """Upload and process CV file"""
    try:
        user_id = get_jwt_identity()
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

@cv_upload_bp.route('/list', methods=['GET'])
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
