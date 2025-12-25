from flask import Blueprint, request, jsonify
from growth_system import GrowthSystem
import logging

growth_bp = Blueprint('growth', __name__)
logger = logging.getLogger(__name__)

# Initialize system
growth_sys = GrowthSystem()

@growth_bp.route('/api/growth/import', methods=['POST'])
def import_vacancies():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
            
        if not file.filename.endswith('.csv'):
            return jsonify({'success': False, 'error': 'File must be CSV'})
            
        # Read file content
        content = file.read()
        
        report = growth_sys.import_vacancies_from_csv(content)
        
        return jsonify({
            'success': True,
            'message': f"Processed {report['total_rows']} rows. Created {report['companies_created']} companies and {report['jobs_created']} jobs. Sent {report['emails_sent']} emails.",
            'report': report
        })
        
    except Exception as e:
        logger.error(f"Import error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/public/verify-job/<token>', methods=['GET'])
def get_verification_details(token):
    try:
        data = growth_sys.validate_token(token)
        if not data:
            return jsonify({'success': False, 'error': 'Invalid or expired token'}), 404
            
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Verification get error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/public/verify-job/<token>/confirm', methods=['POST'])
def confirm_verification(token):
    try:
        payload = request.json
        job_data = payload.get('job_data')
        password = payload.get('password') # User sets a password to claim account
        
        if not job_data or not password:
            return jsonify({'success': False, 'error': 'Missing data'}), 400
            
        result = growth_sys.confirm_job_verification(token, job_data, password)
        
        return jsonify({
            'success': True,
            'message': 'Job verified and account created!',
            'result': result
        })
    except Exception as e:
        logger.error(f"Confirmation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/growth/candidates', methods=['GET'])
def get_candidates():
    try:
        min_vacancies = int(request.args.get('min_vacancies', 5))
        candidates = growth_sys.get_growth_candidates(min_vacancies)
        return jsonify({'success': True, 'candidates': candidates})
    except Exception as e:
        logger.error(f"Get candidates error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/growth/send-emails', methods=['POST'])
def send_emails():
    try:
        data = request.json
        company_ids = data.get('company_ids', [])
        if not company_ids:
            return jsonify({'success': False, 'error': 'No companies selected'}), 400
            
        report = growth_sys.send_bulk_emails(company_ids)
        return jsonify({'success': True, 'report': report})
    except Exception as e:
        logger.error(f"Send emails error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/growth/check-companies', methods=['POST'])
def check_companies():
    """
    Check if a list of companies already exists in the system.
    Expects JSON: { "companies": ["Company A", "Company B"] }
    Returns: { "existing": ["Company A"] }
    """
    try:
        data = request.json
        companies = data.get('companies', [])
        
        # Reuse the existing GrowthSystem instance
        existing = growth_sys.check_existing_companies(companies)
        
        return jsonify({'existing': existing})
    except Exception as e:
        logger.error(f"Check companies error: {e}")
        return jsonify({'error': str(e)}), 500
