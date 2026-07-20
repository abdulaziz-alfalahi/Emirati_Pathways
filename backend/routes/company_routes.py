"""
Company Management Routes for Emirati Journey Platform
Comprehensive company profile and management functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.company import Company, CompanySize, CompanyType, SubscriptionTier, CompanyStatus, CompanyLocation, CompanyContact, EmiratiZationInfo, CompanyVerification
from datetime import datetime, date
import logging
import uuid

# Create blueprint
company_bp = Blueprint('companies', __name__, url_prefix='/api/companies')

# Initialize logger
logger = logging.getLogger(__name__)

# Mock database storage (to be replaced with actual database integration)
companies_db = {}

@company_bp.route('/create', methods=['POST'])
@jwt_required()
def create_company():
    """
    Create a new company profile
    Requires: Admin or authorized user
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'company_type', 'industry']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create company ID
        company_id = str(uuid.uuid4())
        
        # Parse location data
        locations = []
        for loc_data in data.get('locations', []):
            location = CompanyLocation(
                emirate=loc_data.get('emirate', ''),
                city=loc_data.get('city', ''),
                area=loc_data.get('area'),
                street_address=loc_data.get('street_address'),
                po_box=loc_data.get('po_box'),
                postal_code=loc_data.get('postal_code'),
                is_headquarters=loc_data.get('is_headquarters', True)
            )
            locations.append(location)
        
        # Parse contact data
        contact_data = data.get('contact', {})
        contact = None
        if contact_data:
            contact = CompanyContact(
                primary_email=contact_data.get('primary_email', ''),
                secondary_email=contact_data.get('secondary_email'),
                phone=contact_data.get('phone'),
                mobile=contact_data.get('mobile'),
                fax=contact_data.get('fax'),
                website=contact_data.get('website'),
                linkedin=contact_data.get('linkedin'),
                twitter=contact_data.get('twitter')
            )
        
        # Parse Emiratization data
        emiratization_data = data.get('emiratization', {})
        emiratization = EmiratiZationInfo(
            current_emiratization_rate=emiratization_data.get('current_emiratization_rate'),
            target_emiratization_rate=emiratization_data.get('target_emiratization_rate'),
            total_employees=emiratization_data.get('total_employees'),
            emirati_employees=emiratization_data.get('emirati_employees'),
            compliance_status=emiratization_data.get('compliance_status', 'unknown')
        )
        
        # Create company object
        company = Company(
            id=company_id,
            name=data.get('name'),
            name_arabic=data.get('name_arabic'),
            description=data.get('description', ''),
            description_arabic=data.get('description_arabic'),
            company_type=CompanyType(data.get('company_type')),
            company_size=CompanySize(data.get('company_size', 'medium')),
            industry=data.get('industry'),
            sub_industry=data.get('sub_industry'),
            founded_year=data.get('founded_year'),
            trade_license_number=data.get('trade_license_number'),
            commercial_registration=data.get('commercial_registration'),
            tax_registration_number=data.get('tax_registration_number'),
            establishment_card=data.get('establishment_card'),
            locations=locations,
            contact=contact,
            emiratization=emiratization,
            subscription_tier=SubscriptionTier(data.get('subscription_tier', 'basic')),
            logo_url=data.get('logo_url'),
            banner_url=data.get('banner_url'),
            brand_colors=data.get('brand_colors', []),
            auto_approve_jobs=data.get('auto_approve_jobs', False),
            allow_direct_applications=data.get('allow_direct_applications', True),
            show_salary_ranges=data.get('show_salary_ranges', True),
            require_cover_letter=data.get('require_cover_letter', False),
            admin_users=[current_user_id]  # Creator becomes admin
        )
        
        # Save to mock database
        companies_db[company_id] = company
        
        logger.info(f"Company created successfully: {company_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Company created successfully',
            'data': {
                'company_id': company_id,
                'company': company.to_dict()
            }
        }), 201
        
    except ValueError as e:
        logger.error(f"Invalid enum value in company creation: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Invalid value provided: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f"Error creating company: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create company'
        }), 500

@company_bp.route('/<company_id>', methods=['GET'])
def get_company(company_id):
    """
    Get company details by ID
    Public endpoint for basic info
    """
    try:
        company = companies_db.get(company_id)
        if not company:
            return jsonify({
                'success': False,
                'message': 'Company not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'company': company.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving company {company_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve company'
        }), 500

@company_bp.route('/<company_id>', methods=['PUT'])
@jwt_required()
def update_company(company_id):
    """
    Update company details
    Requires: Company admin
    """
    try:
        current_user_id = get_jwt_identity()
        company = companies_db.get(company_id)
        
        if not company:
            return jsonify({
                'success': False,
                'message': 'Company not found'
            }), 404
        
        # Check permissions
        if not company.user_is_admin(current_user_id):
            return jsonify({
                'success': False,
                'message': 'Unauthorized to update this company'
            }), 403
        
        data = request.get_json()
        
        # Update basic fields
        updatable_fields = [
            'name', 'name_arabic', 'description', 'description_arabic',
            'sub_industry', 'founded_year', 'trade_license_number',
            'commercial_registration', 'tax_registration_number',
            'establishment_card', 'logo_url', 'banner_url', 'brand_colors',
            'auto_approve_jobs', 'allow_direct_applications',
            'show_salary_ranges', 'require_cover_letter'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(company, field, data[field])
        
        # Update enums
        if 'company_type' in data:
            company.company_type = CompanyType(data['company_type'])
        if 'company_size' in data:
            company.company_size = CompanySize(data['company_size'])
        if 'subscription_tier' in data:
            company.subscription_tier = SubscriptionTier(data['subscription_tier'])
        
        # Update locations
        if 'locations' in data:
            locations = []
            for loc_data in data['locations']:
                location = CompanyLocation(
                    emirate=loc_data.get('emirate', ''),
                    city=loc_data.get('city', ''),
                    area=loc_data.get('area'),
                    street_address=loc_data.get('street_address'),
                    po_box=loc_data.get('po_box'),
                    postal_code=loc_data.get('postal_code'),
                    is_headquarters=loc_data.get('is_headquarters', True)
                )
                locations.append(location)
            company.locations = locations
        
        # Update contact
        if 'contact' in data:
            contact_data = data['contact']
            company.contact = CompanyContact(
                primary_email=contact_data.get('primary_email', ''),
                secondary_email=contact_data.get('secondary_email'),
                phone=contact_data.get('phone'),
                mobile=contact_data.get('mobile'),
                fax=contact_data.get('fax'),
                website=contact_data.get('website'),
                linkedin=contact_data.get('linkedin'),
                twitter=contact_data.get('twitter')
            )
        
        # Update Emiratization info
        if 'emiratization' in data:
            emiratization_data = data['emiratization']
            company.emiratization.current_emiratization_rate = emiratization_data.get('current_emiratization_rate')
            company.emiratization.target_emiratization_rate = emiratization_data.get('target_emiratization_rate')
            company.emiratization.total_employees = emiratization_data.get('total_employees')
            company.emiratization.emirati_employees = emiratization_data.get('emirati_employees')
            company.emiratization.compliance_status = emiratization_data.get('compliance_status', 'unknown')
            company.emiratization.last_updated = datetime.utcnow()
        
        company.updated_at = datetime.utcnow()
        
        # Save to mock database
        companies_db[company_id] = company
        
        logger.info(f"Company updated successfully: {company_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Company updated successfully',
            'data': {
                'company': company.to_dict()
            }
        }), 200
        
    except ValueError as e:
        logger.error(f"Invalid enum value in company update: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Invalid value provided: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f"Error updating company {company_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update company'
        }), 500

@company_bp.route('/<company_id>/users', methods=['POST'])
@jwt_required()
def add_company_user():
    """
    Add user to company with specific role
    Requires: Company admin
    """
    try:
        current_user_id = get_jwt_identity()
        company_id = request.view_args['company_id']
        data = request.get_json()
        
        company = companies_db.get(company_id)
        if not company:
            return jsonify({
                'success': False,
                'message': 'Company not found'
            }), 404
        
        # Check permissions
        if not company.user_is_admin(current_user_id):
            return jsonify({
                'success': False,
                'message': 'Unauthorized to manage company users'
            }), 403
        
        # Validate required fields
        required_fields = ['user_id', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        user_id = data.get('user_id')
        role = data.get('role')
        
        # Validate role
        valid_roles = ['admin', 'employer_admin', 'recruiter']
        if role not in valid_roles:
            return jsonify({
                'success': False,
                'message': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
            }), 400
        
        # Add user to company
        company.add_user(user_id, role)
        
        # Save to mock database
        companies_db[company_id] = company
        
        logger.info(f"User {user_id} added to company {company_id} with role {role} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': f'User added to company with {role} role',
            'data': {
                'company': company.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error adding user to company: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to add user to company'
        }), 500

@company_bp.route('/<company_id>/users/<user_id>', methods=['DELETE'])
@jwt_required()
def remove_company_user():
    """
    Remove user from company
    Requires: Company admin
    """
    try:
        current_user_id = get_jwt_identity()
        company_id = request.view_args['company_id']
        user_id = request.view_args['user_id']
        
        company = companies_db.get(company_id)
        if not company:
            return jsonify({
                'success': False,
                'message': 'Company not found'
            }), 404
        
        # Check permissions
        if not company.user_is_admin(current_user_id):
            return jsonify({
                'success': False,
                'message': 'Unauthorized to manage company users'
            }), 403
        
        # Don't allow removing the last admin
        if user_id in company.admin_users and len(company.admin_users) == 1:
            return jsonify({
                'success': False,
                'message': 'Cannot remove the last admin user'
            }), 400
        
        # Remove user from company
        company.remove_user(user_id)
        
        # Save to mock database
        companies_db[company_id] = company
        
        logger.info(f"User {user_id} removed from company {company_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'User removed from company',
            'data': {
                'company': company.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error removing user from company: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to remove user from company'
        }), 500

@company_bp.route('/<company_id>/verify', methods=['POST'])
@jwt_required()
def verify_company():
    """
    RETIRED (issue #96). This wrote a "verification" into an in-memory dict —
    it looked successful, checked no privilege (the admin check was a TODO),
    and vanished on restart while the real gate column, companies.is_verified,
    stayed untouched. The real endpoint is operator-gated and persists:
    POST /api/growth/companies/<company_id>/verify.
    """
    company_id = request.view_args['company_id']
    return jsonify({
        'success': False,
        'message': 'Company verification moved to the operator API.',
        'operator_endpoint': f'/api/growth/companies/{company_id}/verify',
    }), 410

@company_bp.route('/search', methods=['GET'])
def search_companies():
    """
    Search companies with filters
    Public endpoint
    """
    try:
        # Get query parameters
        query = request.args.get('q', '')
        emirate = request.args.get('emirate')
        industry = request.args.get('industry')
        company_size = request.args.get('company_size')
        company_type = request.args.get('company_type')
        is_verified = request.args.get('is_verified')
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Filter companies
        filtered_companies = []
        for company in companies_db.values():
            # Only show active companies
            if company.status != CompanyStatus.ACTIVE:
                continue
            
            # Apply filters
            if query and query.lower() not in company.name.lower() and query.lower() not in company.description.lower():
                continue
            
            if emirate:
                primary_location = company.get_primary_location()
                if not primary_location or primary_location.emirate != emirate:
                    continue
            
            if industry and company.industry != industry:
                continue
            
            if company_size and company.company_size.value != company_size:
                continue
            
            if company_type and company.company_type.value != company_type:
                continue
            
            if is_verified:
                is_verified_bool = is_verified.lower() == 'true'
                if company.verification.is_verified != is_verified_bool:
                    continue
            
            filtered_companies.append(company)
        
        # Sort by verification status and name
        filtered_companies.sort(key=lambda x: (not x.verification.is_verified, x.name))
        
        # Pagination
        total = len(filtered_companies)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_companies = filtered_companies[start:end]
        
        return jsonify({
            'success': True,
            'data': {
                'companies': [company.to_dict() for company in paginated_companies],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                },
                'filters_applied': {
                    'query': query,
                    'emirate': emirate,
                    'industry': industry,
                    'company_size': company_size,
                    'company_type': company_type,
                    'is_verified': is_verified
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching companies: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to search companies'
        }), 500

@company_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_companies(user_id):
    """
    Get all companies where user has access
    Requires: User access or admin
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check permissions (simplified)
        if user_id != current_user_id:
            # TODO: Add admin check
            pass
        
        # Filter companies by user access
        user_companies = [company for company in companies_db.values() if company.user_has_access(user_id)]
        
        # Sort by name
        user_companies.sort(key=lambda x: x.name)
        
        return jsonify({
            'success': True,
            'data': {
                'companies': [company.to_dict() for company in user_companies],
                'total': len(user_companies)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving user companies: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve user companies'
        }), 500

@company_bp.route('/stats', methods=['GET'])
def get_company_stats():
    """
    Get platform company statistics
    Public endpoint
    """
    try:
        total_companies = len(companies_db)
        verified_companies = len([c for c in companies_db.values() if c.verification.is_verified])
        active_companies = len([c for c in companies_db.values() if c.status == CompanyStatus.ACTIVE])
        
        # Group by emirate
        emirate_stats = {}
        for company in companies_db.values():
            primary_location = company.get_primary_location()
            if primary_location and company.status == CompanyStatus.ACTIVE:
                emirate = primary_location.emirate
                emirate_stats[emirate] = emirate_stats.get(emirate, 0) + 1
        
        # Group by industry
        industry_stats = {}
        for company in companies_db.values():
            if company.industry and company.status == CompanyStatus.ACTIVE:
                industry = company.industry
                industry_stats[industry] = industry_stats.get(industry, 0) + 1
        
        # Group by size
        size_stats = {}
        for company in companies_db.values():
            if company.status == CompanyStatus.ACTIVE:
                size = company.company_size.value
                size_stats[size] = size_stats.get(size, 0) + 1
        
        # Emiratization compliance
        compliant_companies = len([c for c in companies_db.values() if c.is_emiratization_compliant()])
        
        return jsonify({
            'success': True,
            'data': {
                'total_companies': total_companies,
                'verified_companies': verified_companies,
                'active_companies': active_companies,
                'emiratization_compliant': compliant_companies,
                'emirate_distribution': emirate_stats,
                'industry_distribution': industry_stats,
                'size_distribution': size_stats
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving company stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve company statistics'
        }), 500


@company_bp.route('/progression', methods=['GET'])
def get_company_progression():
    """
    Get career progression details for a company.
    Query parameters:
        name: Name of the company (case-insensitive, e.g. "Google", "Microsoft")
        company_id: UUID of the company
    """
    name = request.args.get('name')
    company_id = request.args.get('company_id')

    if not name and not company_id:
        return jsonify({
            'success': False,
            'message': 'Either company name or company_id is required'
        }), 400

    from backend.db_utils import execute_query

    # Query progression
    row = None
    if company_id:
        row = execute_query("""
            SELECT c.id as company_id, c.name, cp.overview, cp.overview_ar, 
                   cp.career_path, cp.promotion_criteria, cp.emiratisation_support
            FROM company_career_progressions cp
            JOIN companies c ON c.id = cp.company_id
            WHERE cp.company_id = %s
        """, (company_id,), fetch_one=True)
    elif name:
        # Normalize name: e.g. "Amazon (AWS)" -> "Amazon"
        normalized_name = name.split('(')[0].strip()
        row = execute_query("""
            SELECT c.id as company_id, c.name, cp.overview, cp.overview_ar, 
                   cp.career_path, cp.promotion_criteria, cp.emiratisation_support
            FROM company_career_progressions cp
            JOIN companies c ON c.id = cp.company_id
            WHERE c.name ILIKE %s OR c.company_name ILIKE %s
        """, (normalized_name, normalized_name), fetch_one=True)

        if not row:
            # Try fuzzy/prefix match
            row = execute_query("""
                SELECT c.id as company_id, c.name, cp.overview, cp.overview_ar, 
                       cp.career_path, cp.promotion_criteria, cp.emiratisation_support
                FROM company_career_progressions cp
                JOIN companies c ON c.id = cp.company_id
                WHERE c.name ILIKE %s OR c.company_name ILIKE %s 
                   OR %s ILIKE CONCAT(c.name, '%%')
            """, (f"%{normalized_name}%", f"%{normalized_name}%", normalized_name), fetch_one=True)

    if not row:
        return jsonify({
            'success': False,
            'message': 'Career progression details not found for this company'
        }), 404

    # Ensure JSON structures are parsed properly
    import json
    for field in ('career_path', 'promotion_criteria', 'emiratisation_support'):
        if isinstance(row.get(field), str):
            try:
                row[field] = json.loads(row[field])
            except:
                pass

    return jsonify({
        'success': True,
        'data': {
            'company_id': row['company_id'],
            'name': row['name'],
            'overview': row['overview'],
            'overview_ar': row['overview_ar'],
            'career_path': row['career_path'],
            'promotion_criteria': row['promotion_criteria'],
            'emiratisation_support': row['emiratisation_support']
        }
    }), 200


