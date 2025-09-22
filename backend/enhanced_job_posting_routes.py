"""
Enhanced Job Posting Routes
Supports both traditional jobs and educational opportunities
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime
from models.job import Job, EmploymentType, EducationalOpportunityDetails, AgeGroup, OpportunityCategory, JobStatus
from educational_opportunity_ai import educational_ai_engine
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
enhanced_job_posting_bp = Blueprint('enhanced_job_posting', __name__, url_prefix='/api/opportunities')

@enhanced_job_posting_bp.route('/create', methods=['POST'])
@jwt_required()
def create_opportunity():
    """Create a new job or educational opportunity"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['title', 'description', 'employment_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        # Create opportunity
        try:
            employment_type = EmploymentType(data['employment_type'])
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid employment type: {data["employment_type"]}'
            }), 400
        
        # Determine opportunity category
        educational_types = [
            EmploymentType.SUMMER_CAMP, EmploymentType.WINTER_CAMP,
            EmploymentType.SCHOLARSHIP, EmploymentType.VOCATIONAL_TRAINING,
            EmploymentType.APPRENTICESHIP, EmploymentType.CERTIFICATION_PROGRAM,
            EmploymentType.WORKSHOP, EmploymentType.SEMINAR,
            EmploymentType.MENTORSHIP_PROGRAM, EmploymentType.BOOTCAMP,
            EmploymentType.EXCHANGE_PROGRAM
        ]
        
        is_educational = employment_type in educational_types
        opportunity_category = OpportunityCategory.EDUCATION if is_educational else OpportunityCategory.EMPLOYMENT
        
        # Create job object
        job_data = {
            'title': data['title'],
            'description': data['description'],
            'employment_type': employment_type,
            'opportunity_category': opportunity_category,
            'company_name': data.get('company_name', ''),
            'posted_by': user_id,
            'status': JobStatus.DRAFT
        }
        
        # Add educational details if it's an educational opportunity
        if is_educational and data.get('educational_details'):
            edu_details_data = data['educational_details']
            
            # Parse age group if provided
            target_age_group = None
            if edu_details_data.get('target_age_group'):
                try:
                    target_age_group = AgeGroup(edu_details_data['target_age_group'])
                except ValueError:
                    pass
            
            educational_details = EducationalOpportunityDetails(
                target_age_group=target_age_group,
                age_range_min=edu_details_data.get('age_range_min'),
                age_range_max=edu_details_data.get('age_range_max'),
                academic_prerequisites=edu_details_data.get('academic_prerequisites', []),
                program_duration=edu_details_data.get('program_duration'),
                program_schedule=edu_details_data.get('program_schedule'),
                program_format=edu_details_data.get('program_format'),
                certification_offered=edu_details_data.get('certification_offered'),
                learning_outcomes=edu_details_data.get('learning_outcomes', []),
                skills_developed=edu_details_data.get('skills_developed', []),
                program_cost=edu_details_data.get('program_cost'),
                scholarship_amount=edu_details_data.get('scholarship_amount'),
                financial_aid_available=edu_details_data.get('financial_aid_available', False),
                application_requirements=edu_details_data.get('application_requirements', []),
                required_documents=edu_details_data.get('required_documents', []),
                max_participants=edu_details_data.get('max_participants'),
                instructor_info=edu_details_data.get('instructor_info'),
                contact_person=edu_details_data.get('contact_person')
            )
            
            job_data['educational_details'] = educational_details
        
        # Create Job instance
        job = Job(**job_data)
        
        # If it's educational and AI enhancement is requested
        if is_educational and data.get('enhance_with_ai', False):
            try:
                enhancement = educational_ai_engine.enhance_educational_opportunity(
                    job.description, employment_type
                )
                
                if enhancement.get('enhanced_title'):
                    job.title = enhancement['enhanced_title']
                if enhancement.get('enhanced_description'):
                    job.description = enhancement['enhanced_description']
                
                # Update educational details with AI enhancements
                if enhancement.get('educational_details') and job.educational_details:
                    ai_details = enhancement['educational_details']
                    
                    if ai_details.get('learning_outcomes'):
                        job.educational_details.learning_outcomes = ai_details['learning_outcomes']
                    if ai_details.get('skills_developed'):
                        job.educational_details.skills_developed = ai_details['skills_developed']
                    if ai_details.get('program_duration') and not job.educational_details.program_duration:
                        job.educational_details.program_duration = ai_details['program_duration']
                
            except Exception as e:
                logger.warning(f"AI enhancement failed, continuing without: {e}")
        
        # TODO: Save to database (integrate with existing database system)
        # For now, return the created opportunity
        
        logger.info(f"Created {employment_type.value} opportunity: {job.title}")
        
        return jsonify({
            'success': True,
            'opportunity': job.to_dict(),
            'is_educational': is_educational,
            'created_at': datetime.now().isoformat()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating opportunity: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create opportunity',
            'message': str(e)
        }), 500

@enhanced_job_posting_bp.route('/list', methods=['GET'])
@jwt_required()
def list_opportunities():
    """List opportunities with filtering support"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        opportunity_type = request.args.get('type')
        category = request.args.get('category')  # 'employment' or 'education'
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # TODO: Implement database query with filters
        # For now, return sample data structure
        
        sample_opportunities = []
        
        # Add sample educational opportunities
        if not category or category == 'education':
            educational_samples = [
                {
                    'id': 'edu_001',
                    'title': 'UAE Youth Leadership Summer Camp 2024',
                    'employment_type': 'summer_camp',
                    'opportunity_category': 'education',
                    'description': 'Intensive leadership development program for Emirati youth',
                    'status': 'published',
                    'created_at': datetime.now().isoformat(),
                    'is_educational': True,
                    'educational_details': {
                        'target_age_group': 'youth_15_18',
                        'program_duration': '3 weeks',
                        'max_participants': 50
                    }
                },
                {
                    'id': 'edu_002',
                    'title': 'Digital Skills Scholarship Program',
                    'employment_type': 'scholarship',
                    'opportunity_category': 'education',
                    'description': 'Merit-based scholarship for digital technology studies',
                    'status': 'published',
                    'created_at': datetime.now().isoformat(),
                    'is_educational': True,
                    'educational_details': {
                        'target_age_group': 'young_adult_18_25',
                        'scholarship_amount': 50000,
                        'financial_aid_available': True
                    }
                }
            ]
            sample_opportunities.extend(educational_samples)
        
        # Filter by type if specified
        if opportunity_type:
            sample_opportunities = [
                opp for opp in sample_opportunities 
                if opp['employment_type'] == opportunity_type
            ]
        
        # Pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_opportunities = sample_opportunities[start_idx:end_idx]
        
        return jsonify({
            'success': True,
            'opportunities': paginated_opportunities,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': len(sample_opportunities),
                'pages': (len(sample_opportunities) + per_page - 1) // per_page
            },
            'filters_applied': {
                'type': opportunity_type,
                'category': category,
                'status': status
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing opportunities: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to list opportunities',
            'message': str(e)
        }), 500

@enhanced_job_posting_bp.route('/<opportunity_id>', methods=['GET'])
@jwt_required()
def get_opportunity(opportunity_id):
    """Get specific opportunity by ID"""
    try:
        # TODO: Implement database lookup
        # For now, return sample data
        
        sample_opportunity = {
            'id': opportunity_id,
            'title': 'UAE Innovation Bootcamp',
            'employment_type': 'bootcamp',
            'opportunity_category': 'education',
            'description': 'Intensive 12-week program focusing on innovation and entrepreneurship',
            'status': 'published',
            'created_at': datetime.now().isoformat(),
            'is_educational': True,
            'educational_details': {
                'target_age_group': 'young_adult_18_25',
                'program_duration': '12 weeks',
                'program_schedule': 'Full-time',
                'program_format': 'Hybrid',
                'certification_offered': 'Innovation and Entrepreneurship Certificate',
                'learning_outcomes': [
                    'Innovation methodology mastery',
                    'Business model development',
                    'Prototype creation and testing',
                    'Pitch presentation skills'
                ],
                'skills_developed': [
                    'Design thinking',
                    'Business analysis',
                    'Project management',
                    'Public speaking',
                    'Team leadership'
                ],
                'max_participants': 30,
                'current_participants': 15
            }
        }
        
        return jsonify({
            'success': True,
            'opportunity': sample_opportunity
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting opportunity {opportunity_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get opportunity',
            'message': str(e)
        }), 500

@enhanced_job_posting_bp.route('/<opportunity_id>/publish', methods=['POST'])
@jwt_required()
def publish_opportunity(opportunity_id):
    """Publish an opportunity"""
    try:
        user_id = get_jwt_identity()
        
        # TODO: Implement database update
        # For now, return success response
        
        logger.info(f"Publishing opportunity {opportunity_id} by user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Opportunity published successfully',
            'opportunity_id': opportunity_id,
            'published_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error publishing opportunity {opportunity_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to publish opportunity',
            'message': str(e)
        }), 500

@enhanced_job_posting_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_opportunity_stats():
    """Get opportunity statistics"""
    try:
        user_id = get_jwt_identity()
        
        # TODO: Implement database aggregation
        # For now, return sample stats
        
        stats = {
            'total_opportunities': 25,
            'by_category': {
                'employment': 15,
                'education': 10
            },
            'by_type': {
                'full_time': 8,
                'internship': 7,
                'summer_camp': 3,
                'scholarship': 2,
                'vocational_training': 2,
                'workshop': 2,
                'bootcamp': 1
            },
            'by_status': {
                'draft': 5,
                'published': 18,
                'closed': 2
            },
            'educational_stats': {
                'total_educational': 10,
                'by_age_group': {
                    'youth_15_18': 4,
                    'young_adult_18_25': 5,
                    'all_ages': 1
                },
                'with_certification': 6,
                'with_financial_aid': 3
            }
        }
        
        return jsonify({
            'success': True,
            'stats': stats,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting opportunity stats: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get opportunity stats',
            'message': str(e)
        }), 500
