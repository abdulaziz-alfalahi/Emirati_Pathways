"""
JD Upload Routes - File upload and parsing endpoints
Emirati Journey Platform - Recruiter Services

Handles file uploads for job description parsing and auto-fill.
"""

from flask import Blueprint, request, jsonify
import logging
import os
import tempfile
from werkzeug.utils import secure_filename
from typing import List, Dict, Any

from .jd_parser import get_jd_parser
from .jd_builder_engine import get_jd_builder_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
jd_upload_routes = Blueprint('jd_upload', __name__, url_prefix='/api/recruiter/jd')

# Allowed file extensions
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'doc', 'csv', 'xlsx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@jd_upload_routes.route('/upload/parse', methods=['POST'])
def upload_and_parse():
    """
    Upload a job description file and parse it
    
    Request:
        - file: Job description file (PDF, DOCX, TXT)
        - recruiter_id: Recruiter ID
        - company_id: Company ID
        - create_draft: Whether to create a draft JD (default: true)
    
    Response:
        - parsed_data: Structured job description data
        - jd_id: Created draft JD ID (if create_draft=true)
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': f'File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}'}), 400
        
        # Get parameters
        recruiter_id = request.form.get('recruiter_id')
        company_id = request.form.get('company_id')
        create_draft = request.form.get('create_draft', 'true').lower() == 'true'
        
        if not recruiter_id or not company_id:
            return jsonify({'error': 'recruiter_id and company_id are required'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        logger.info(f"File uploaded: {filename}")
        
        # Parse the file
        parser = get_jd_parser()
        parsed_data = parser.parse_document(file_path)
        
        # Clean up temp file
        os.remove(file_path)
        os.rmdir(temp_dir)
        
        response_data = {
            'success': True,
            'parsed_data': parsed_data,
            'source_file': filename
        }
        
        # Create draft JD if requested
        if create_draft:
            engine = get_jd_builder_engine()
            jd_data = engine.create_jd(recruiter_id, company_id, template='custom')
            
            # Update with parsed data
            if parsed_data.get('basic_info'):
                jd_data = engine.update_basic_info(jd_data, parsed_data['basic_info'])
            
            if parsed_data.get('description'):
                jd_data = engine.update_description(jd_data, {
                    'description': parsed_data['description'],
                    'description_arabic': parsed_data.get('description_arabic', '')
                })
            
            if parsed_data.get('requirements'):
                for req in parsed_data['requirements']:
                    jd_data = engine.add_requirement(jd_data, req)
            
            if parsed_data.get('responsibilities'):
                for resp in parsed_data['responsibilities']:
                    jd_data = engine.add_responsibility(jd_data, resp)
            
            if parsed_data.get('benefits'):
                for benefit in parsed_data['benefits']:
                    jd_data = engine.add_benefit(jd_data, benefit)
            
            if parsed_data.get('compensation'):
                jd_data = engine.update_compensation(jd_data, parsed_data['compensation'])
            
            response_data['jd_id'] = jd_data['metadata']['jd_id']
            response_data['jd_data'] = jd_data
            response_data['completion_score'] = jd_data['metadata']['completion_score']
        
        logger.info(f"Successfully parsed and created JD from file: {filename}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error uploading and parsing file: {e}")
        return jsonify({'error': str(e)}), 500


@jd_upload_routes.route('/upload/batch', methods=['POST'])
def upload_batch():
    """
    Upload multiple job description files for batch processing
    
    Request:
        - files[]: Multiple job description files
        - recruiter_id: Recruiter ID
        - company_id: Company ID
        - create_drafts: Whether to create draft JDs (default: true)
    
    Response:
        - results: Array of parsed data and created JD IDs
        - success_count: Number of successfully processed files
        - error_count: Number of failed files
    """
    try:
        # Check if files are present
        if 'files[]' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files[]')
        
        if len(files) == 0:
            return jsonify({'error': 'No files selected'}), 400
        
        # Get parameters
        recruiter_id = request.form.get('recruiter_id')
        company_id = request.form.get('company_id')
        create_drafts = request.form.get('create_drafts', 'true').lower() == 'true'
        
        if not recruiter_id or not company_id:
            return jsonify({'error': 'recruiter_id and company_id are required'}), 400
        
        # Process each file
        results = []
        success_count = 0
        error_count = 0
        
        parser = get_jd_parser()
        engine = get_jd_builder_engine()
        
        for file in files:
            try:
                if not allowed_file(file.filename):
                    results.append({
                        'filename': file.filename,
                        'error': 'File type not allowed',
                        'success': False
                    })
                    error_count += 1
                    continue
                
                # Save file temporarily
                filename = secure_filename(file.filename)
                temp_dir = tempfile.mkdtemp()
                file_path = os.path.join(temp_dir, filename)
                file.save(file_path)
                
                # Parse the file
                parsed_data = parser.parse_document(file_path)
                
                # Clean up temp file
                os.remove(file_path)
                os.rmdir(temp_dir)
                
                result = {
                    'filename': filename,
                    'parsed_data': parsed_data,
                    'success': True
                }
                
                # Create draft JD if requested
                if create_drafts:
                    jd_data = engine.create_jd(recruiter_id, company_id, template='custom')
                    
                    # Update with parsed data
                    if parsed_data.get('basic_info'):
                        jd_data = engine.update_basic_info(jd_data, parsed_data['basic_info'])
                    
                    if parsed_data.get('description'):
                        jd_data = engine.update_description(jd_data, {
                            'description': parsed_data['description'],
                            'description_arabic': parsed_data.get('description_arabic', '')
                        })
                    
                    if parsed_data.get('requirements'):
                        for req in parsed_data['requirements']:
                            jd_data = engine.add_requirement(jd_data, req)
                    
                    if parsed_data.get('responsibilities'):
                        for resp in parsed_data['responsibilities']:
                            jd_data = engine.add_responsibility(jd_data, resp)
                    
                    if parsed_data.get('benefits'):
                        for benefit in parsed_data['benefits']:
                            jd_data = engine.add_benefit(jd_data, benefit)
                    
                    if parsed_data.get('compensation'):
                        jd_data = engine.update_compensation(jd_data, parsed_data['compensation'])
                    
                    result['jd_id'] = jd_data['metadata']['jd_id']
                    result['completion_score'] = jd_data['metadata']['completion_score']
                
                results.append(result)
                success_count += 1
                
            except Exception as e:
                logger.error(f"Error processing file {file.filename}: {e}")
                results.append({
                    'filename': file.filename,
                    'error': str(e),
                    'success': False
                })
                error_count += 1
        
        logger.info(f"Batch upload completed: {success_count} success, {error_count} errors")
        
        return jsonify({
            'success': True,
            'results': results,
            'success_count': success_count,
            'error_count': error_count,
            'total_files': len(files)
        }), 200
        
    except Exception as e:
        logger.error(f"Error in batch upload: {e}")
        return jsonify({'error': str(e)}), 500


@jd_upload_routes.route('/parse/text', methods=['POST'])
def parse_text():
    """
    Parse job description from raw text
    
    Request:
        - text: Job description text
        - recruiter_id: Recruiter ID
        - company_id: Company ID
        - create_draft: Whether to create a draft JD (default: true)
    
    Response:
        - parsed_data: Structured job description data
        - jd_id: Created draft JD ID (if create_draft=true)
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        recruiter_id = data.get('recruiter_id')
        company_id = data.get('company_id')
        create_draft = data.get('create_draft', True)
        
        if not recruiter_id or not company_id:
            return jsonify({'error': 'recruiter_id and company_id are required'}), 400
        
        # Parse the text
        parser = get_jd_parser()
        
        # Create a temporary file for parsing
        temp_dir = tempfile.mkdtemp()
        temp_file = os.path.join(temp_dir, 'temp.txt')
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(text)
        
        parsed_data = parser.parse_document(temp_file)
        
        # Clean up
        os.remove(temp_file)
        os.rmdir(temp_dir)
        
        response_data = {
            'success': True,
            'parsed_data': parsed_data
        }
        
        # Create draft JD if requested
        if create_draft:
            engine = get_jd_builder_engine()
            jd_data = engine.create_jd(recruiter_id, company_id, template='custom')
            
            # Update with parsed data (same as upload_and_parse)
            if parsed_data.get('basic_info'):
                jd_data = engine.update_basic_info(jd_data, parsed_data['basic_info'])
            
            if parsed_data.get('description'):
                jd_data = engine.update_description(jd_data, {
                    'description': parsed_data['description'],
                    'description_arabic': parsed_data.get('description_arabic', '')
                })
            
            if parsed_data.get('requirements'):
                for req in parsed_data['requirements']:
                    jd_data = engine.add_requirement(jd_data, req)
            
            if parsed_data.get('responsibilities'):
                for resp in parsed_data['responsibilities']:
                    jd_data = engine.add_responsibility(jd_data, resp)
            
            if parsed_data.get('benefits'):
                for benefit in parsed_data['benefits']:
                    jd_data = engine.add_benefit(jd_data, benefit)
            
            if parsed_data.get('compensation'):
                jd_data = engine.update_compensation(jd_data, parsed_data['compensation'])
            
            response_data['jd_id'] = jd_data['metadata']['jd_id']
            response_data['jd_data'] = jd_data
            response_data['completion_score'] = jd_data['metadata']['completion_score']
        
        logger.info("Successfully parsed text and created JD")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error parsing text: {e}")
        return jsonify({'error': str(e)}), 500


@jd_upload_routes.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'jd_upload',
        'allowed_formats': list(ALLOWED_EXTENSIONS),
        'max_file_size_mb': MAX_FILE_SIZE / (1024 * 1024)
    }), 200

