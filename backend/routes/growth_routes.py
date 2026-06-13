from flask import Blueprint, request, jsonify
from growth_system import GrowthSystem
import logging

growth_bp = Blueprint('growth', __name__)
logger = logging.getLogger(__name__)

# Initialize system
growth_sys = GrowthSystem()


# =====================================================
# DASHBOARD STATS (Live Funnel Data)
# =====================================================

@growth_bp.route('/api/growth/dashboard-stats', methods=['GET'])
def dashboard_stats():
    """
    Returns live funnel data for the Growth Operator dashboard.
    Aggregates companies, invitation statuses, job counts, and recent activity.
    """
    try:
        data = growth_sys.get_dashboard_stats()
        return jsonify({'success': True, **data})
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

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


# =====================================================
# COMPANY INVITATION ENDPOINTS (Magic Links)
# =====================================================

@growth_bp.route('/api/growth/invite-companies', methods=['POST'])
def invite_companies():
    """
    Send magic link invitations to selected companies.
    Expects JSON: {
        "companies": [
            { "name": "...", "code": "...", "email": "...", "phone": "...",
              "sector": "...", "tradeLicense": "..." },
            ...
        ]
    }
    Returns list of invitation results with magic links.
    """
    try:
        data = request.json
        companies = data.get('companies', [])
        if not companies:
            return jsonify({'success': False, 'error': 'No companies provided'}), 400

        # Get the current user ID if available (from JWT)
        invited_by = None
        try:
            from flask_jwt_extended import get_jwt_identity
            invited_by = get_jwt_identity()
            if invited_by:
                invited_by = int(invited_by)
        except Exception:
            pass

        results = growth_sys.create_company_invitations(companies, invited_by=invited_by)

        successful = [r for r in results if 'error' not in r]
        failed = [r for r in results if 'error' in r]

        return jsonify({
            'success': True,
            'message': f"Sent {len(successful)} invitations ({len(failed)} failed)",
            'invitations': successful,
            'errors': failed,
        })

    except Exception as e:
        logger.error(f"Invite companies error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@growth_bp.route('/api/public/invitation/<token>', methods=['GET'])
def get_invitation_details(token):
    """
    Public endpoint: Validate a company invitation token.
    Returns company details for the onboarding wizard.
    """
    try:
        data = growth_sys.validate_company_invitation(token)
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired invitation link'
            }), 404

        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Invitation validation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@growth_bp.route('/api/public/invitation/<token>/accept', methods=['POST'])
def accept_invitation(token):
    """
    Public endpoint: Accept a company invitation.
    Creates user account and HR profile.
    Expects JSON: {
        "first_name": "...",
        "last_name": "...",
        "phone": "...",
        "email": "...",
        "position_title": "...",
        "role": "recruiter" | 'employer_admin'
    }
    Returns JWT tokens for auto-login.
    """
    try:
        payload = request.json
        if not payload:
            return jsonify({'success': False, 'error': 'Missing request body'}), 400

        required = ['first_name', 'last_name', 'phone', 'role']
        for field in required:
            if not payload.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        # Accept the invitation and create user
        user_data = growth_sys.accept_company_invitation(token, payload)

        # Generate JWT tokens for auto-login
        try:
            from flask_jwt_extended import create_access_token, create_refresh_token
            user_id = str(user_data['id'])
            role = user_data.get('user_type', 'recruiter')

            access_token = create_access_token(
                identity=user_id,
                additional_claims={'role': role}
            )
            refresh_token = create_refresh_token(identity=user_id)

            return jsonify({
                'success': True,
                'message': 'Registration complete! Welcome to Emirati Pathways.',
                'data': {
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': user_data,
                }
            })
        except ImportError:
            # If JWT is not available, just return user data
            return jsonify({
                'success': True,
                'message': 'Registration complete!',
                'data': {'user': user_data}
            })

    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Invitation acceptance error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

