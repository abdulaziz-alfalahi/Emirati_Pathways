"""
Educational Opportunity API Routes
Comprehensive endpoints for educational programs, camps, scholarships, and training
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime
from models.job import Job, EmploymentType, EducationalOpportunityDetails, AgeGroup, OpportunityCategory
from educational_opportunity_ai import educational_ai_engine
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
educational_opportunity_bp = Blueprint('educational_opportunities', __name__, url_prefix='/api/educational')

@educational_opportunity_bp.route('/types', methods=['GET'])
def get_educational_opportunity_types():
    """Get all available educational opportunity types"""
    try:
        educational_types = [
            {
                'value': EmploymentType.SUMMER_CAMP.value,
                'label': 'Summer Camp',
                'description': 'Youth development summer programs',
                'category': 'camps',
                'typical_duration': '2-4 weeks',
                'target_age': '15-18'
            },
            {
                'value': EmploymentType.WINTER_CAMP.value,
                'label': 'Winter Camp', 
                'description': 'Youth development winter programs',
                'category': 'camps',
                'typical_duration': '1-2 weeks',
                'target_age': '15-18'
            },
            {
                'value': EmploymentType.SCHOLARSHIP.value,
                'label': 'Scholarship',
                'description': 'Educational funding opportunities',
                'category': 'funding',
                'typical_duration': 'Academic year',
                'target_age': '18-25'
            },
            {
                'value': EmploymentType.VOCATIONAL_TRAINING.value,
                'label': 'Vocational Training',
                'description': 'Professional skill development programs',
                'category': 'training',
                'typical_duration': '3-12 months',
                'target_age': '18-35'
            },
            {
                'value': EmploymentType.APPRENTICESHIP.value,
                'label': 'Apprenticeship Program',
                'description': 'Work-study learning programs',
                'category': 'training',
                'typical_duration': '1-3 years',
                'target_age': '18-25'
            },
            {
                'value': EmploymentType.CERTIFICATION_PROGRAM.value,
                'label': 'Certification Program',
                'description': 'Professional certification courses',
                'category': 'certification',
                'typical_duration': '1-6 months',
                'target_age': '22-45'
            },
            {
                'value': EmploymentType.WORKSHOP.value,
                'label': 'Workshop',
                'description': 'Short-term skill building sessions',
                'category': 'training',
                'typical_duration': '1-5 days',
                'target_age': 'All ages'
            },
            {
                'value': EmploymentType.SEMINAR.value,
                'label': 'Seminar',
                'description': 'Educational presentations and discussions',
                'category': 'education',
                'typical_duration': '1-2 days',
                'target_age': 'All ages'
            },
            {
                'value': EmploymentType.MENTORSHIP_PROGRAM.value,
                'label': 'Mentorship Program',
                'description': 'Career guidance and support programs',
                'category': 'development',
                'typical_duration': '6-12 months',
                'target_age': '18-35'
            },
            {
                'value': EmploymentType.BOOTCAMP.value,
                'label': 'Bootcamp',
                'description': 'Intensive skill development programs',
                'category': 'training',
                'typical_duration': '8-24 weeks',
                'target_age': '18-35'
            },
            {
                'value': EmploymentType.EXCHANGE_PROGRAM.value,
                'label': 'Exchange Program',
                'description': 'Cultural and educational exchange',
                'category': 'education',
                'typical_duration': '3-12 months',
                'target_age': '18-25'
            }
        ]
        
        return jsonify({
            'success': True,
            'educational_types': educational_types,
            'total_types': len(educational_types)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting educational opportunity types: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get educational opportunity types',
            'message': str(e)
        }), 500

@educational_opportunity_bp.route('/age-groups', methods=['GET'])
def get_age_groups():
    """Get available age groups for educational opportunities"""
    try:
        age_groups = [
            {
                'value': AgeGroup.YOUTH_15_18.value,
                'label': 'Youth (15-18)',
                'description': 'High school students and young adults',
                'min_age': 15,
                'max_age': 18
            },
            {
                'value': AgeGroup.YOUNG_ADULT_18_25.value,
                'label': 'Young Adults (18-25)',
                'description': 'University students and early career',
                'min_age': 18,
                'max_age': 25
            },
            {
                'value': AgeGroup.ADULT_25_35.value,
                'label': 'Adults (25-35)',
                'description': 'Early to mid-career professionals',
                'min_age': 25,
                'max_age': 35
            },
            {
                'value': AgeGroup.MID_CAREER_35_45.value,
                'label': 'Mid-Career (35-45)',
                'description': 'Experienced professionals',
                'min_age': 35,
                'max_age': 45
            },
            {
                'value': AgeGroup.SENIOR_45_PLUS.value,
                'label': 'Senior (45+)',
                'description': 'Senior professionals and executives',
                'min_age': 45,
                'max_age': None
            },
            {
                'value': AgeGroup.ALL_AGES.value,
                'label': 'All Ages',
                'description': 'Open to all age groups',
                'min_age': None,
                'max_age': None
            }
        ]
        
        return jsonify({
            'success': True,
            'age_groups': age_groups
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting age groups: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get age groups',
            'message': str(e)
        }), 500

@educational_opportunity_bp.route('/enhance', methods=['POST'])
@jwt_required()
def enhance_opportunity():
    """Enhance educational opportunity with AI"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        opportunity_text = data.get('description', '')
        opportunity_type_str = data.get('opportunity_type', '')
        
        if not opportunity_type_str:
            return jsonify({
                'success': False,
                'error': 'Opportunity type is required'
            }), 400
        
        # Convert string to enum
        try:
            opportunity_type = EmploymentType(opportunity_type_str)
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid opportunity type: {opportunity_type_str}'
            }), 400
        
        # Check if it's an educational opportunity
        educational_types = [
            EmploymentType.SUMMER_CAMP, EmploymentType.WINTER_CAMP,
            EmploymentType.SCHOLARSHIP, EmploymentType.VOCATIONAL_TRAINING,
            EmploymentType.APPRENTICESHIP, EmploymentType.CERTIFICATION_PROGRAM,
            EmploymentType.WORKSHOP, EmploymentType.SEMINAR,
            EmploymentType.MENTORSHIP_PROGRAM, EmploymentType.BOOTCAMP,
            EmploymentType.EXCHANGE_PROGRAM
        ]
        
        if opportunity_type not in educational_types:
            return jsonify({
                'success': False,
                'error': 'This endpoint is for educational opportunities only'
            }), 400
        
        logger.info(f"Enhancing {opportunity_type.value} opportunity for user {get_jwt_identity()}")
        
        # Enhance with AI
        enhancement_result = educational_ai_engine.enhance_educational_opportunity(
            opportunity_text, opportunity_type
        )
        
        return jsonify({
            'success': True,
            'enhancement': enhancement_result,
            'opportunity_type': opportunity_type.value,
            'processed_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error enhancing educational opportunity: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to enhance educational opportunity',
            'message': str(e)
        }), 500

@educational_opportunity_bp.route('/analyze-market-fit', methods=['POST'])
@jwt_required()
def analyze_market_fit():
    """Analyze market fit for educational opportunity"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Create a temporary Job object for analysis
        job_data = {
            'title': data.get('title', ''),
            'description': data.get('description', ''),
            'employment_type': EmploymentType(data.get('opportunity_type', 'workshop')),
            'opportunity_category': OpportunityCategory.EDUCATION
        }
        
        temp_job = Job(**job_data)
        
        # Analyze market fit
        analysis_result = educational_ai_engine.analyze_opportunity_market_fit(temp_job)
        
        return jsonify({
            'success': True,
            'market_analysis': analysis_result,
            'analyzed_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing market fit: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to analyze market fit',
            'message': str(e)
        }), 500

@educational_opportunity_bp.route('/templates', methods=['GET'])
def get_opportunity_templates():
    """Get templates for different educational opportunity types"""
    try:
        opportunity_type = request.args.get('type')
        
        templates = {
            'summer_camp': {
                'title': 'UAE Youth Leadership Summer Camp',
                'description': 'An intensive leadership development program for Emirati youth aged 15-18, focusing on national values, innovation, and future readiness.',
                'suggested_fields': {
                    'program_duration': '3 weeks',
                    'program_schedule': 'Full-time',
                    'program_format': 'In-person',
                    'target_age_group': 'youth_15_18',
                    'learning_outcomes': [
                        'Leadership skills development',
                        'Cultural awareness and national identity',
                        'Innovation and entrepreneurship mindset',
                        'Communication and presentation skills'
                    ],
                    'skills_developed': [
                        'Leadership',
                        'Public speaking',
                        'Team collaboration',
                        'Problem solving',
                        'Cultural intelligence'
                    ],
                    'application_requirements': [
                        'UAE national or resident',
                        'Age 15-18',
                        'School enrollment certificate',
                        'Parent/guardian consent'
                    ]
                }
            },
            'scholarship': {
                'title': 'UAE Excellence Scholarship Program',
                'description': 'Merit-based scholarship supporting outstanding Emirati students in pursuing higher education in priority fields aligned with UAE Vision 2071.',
                'suggested_fields': {
                    'target_age_group': 'young_adult_18_25',
                    'financial_aid_available': True,
                    'application_requirements': [
                        'UAE national',
                        'Minimum GPA 3.5',
                        'Acceptance letter from accredited university',
                        'Field of study aligned with UAE priorities'
                    ],
                    'required_documents': [
                        'Academic transcripts',
                        'Personal statement',
                        'Letters of recommendation',
                        'Emirates ID copy',
                        'University acceptance letter'
                    ]
                }
            },
            'vocational_training': {
                'title': 'Advanced Digital Skills Training Program',
                'description': 'Comprehensive vocational training in high-demand digital skills, preparing participants for the UAE\'s knowledge economy.',
                'suggested_fields': {
                    'program_duration': '6 months',
                    'program_schedule': 'Full-time',
                    'program_format': 'Hybrid',
                    'target_age_group': 'young_adult_18_25',
                    'certification_offered': 'Professional Digital Skills Certificate',
                    'skills_developed': [
                        'Digital marketing',
                        'Data analysis',
                        'Web development',
                        'AI and automation tools',
                        'Project management'
                    ],
                    'learning_outcomes': [
                        'Industry-ready digital skills',
                        'Professional certification',
                        'Job placement assistance',
                        'Entrepreneurship preparation'
                    ]
                }
            }
        }
        
        if opportunity_type and opportunity_type in templates:
            return jsonify({
                'success': True,
                'template': templates[opportunity_type]
            }), 200
        else:
            return jsonify({
                'success': True,
                'templates': templates,
                'available_types': list(templates.keys())
            }), 200
            
    except Exception as e:
        logger.error(f"Error getting opportunity templates: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get opportunity templates',
            'message': str(e)
        }), 500

@educational_opportunity_bp.route('/validate', methods=['POST'])
@jwt_required()
def validate_opportunity():
    """Validate educational opportunity data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        validation_results = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'suggestions': []
        }
        
        # Required fields validation
        required_fields = ['title', 'description', 'opportunity_type']
        for field in required_fields:
            if not data.get(field):
                validation_results['errors'].append(f'{field} is required')
                validation_results['is_valid'] = False
        
        # Educational opportunity specific validation
        opportunity_type = data.get('opportunity_type')
        if opportunity_type:
            try:
                opp_type = EmploymentType(opportunity_type)
                
                # Age range validation
                educational_details = data.get('educational_details', {})
                age_min = educational_details.get('age_range_min')
                age_max = educational_details.get('age_range_max')
                
                if age_min and age_max and age_min >= age_max:
                    validation_results['errors'].append('Minimum age must be less than maximum age')
                    validation_results['is_valid'] = False
                
                # Program duration validation
                if opp_type in [EmploymentType.WORKSHOP, EmploymentType.SEMINAR]:
                    if not educational_details.get('program_duration'):
                        validation_results['warnings'].append('Program duration is recommended for workshops and seminars')
                
                # Scholarship specific validation
                if opp_type == EmploymentType.SCHOLARSHIP:
                    if not educational_details.get('scholarship_amount') and not educational_details.get('program_cost'):
                        validation_results['warnings'].append('Scholarship amount or program cost should be specified')
                
            except ValueError:
                validation_results['errors'].append(f'Invalid opportunity type: {opportunity_type}')
                validation_results['is_valid'] = False
        
        # Content quality suggestions
        description = data.get('description', '')
        if description:
            if len(description) < 100:
                validation_results['suggestions'].append('Consider adding more detailed description (current: {} characters)'.format(len(description)))
            
            if 'UAE' not in description and 'Emirates' not in description:
                validation_results['suggestions'].append('Consider highlighting UAE relevance in the description')
        
        return jsonify({
            'success': True,
            'validation': validation_results,
            'validated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error validating opportunity: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to validate opportunity',
            'message': str(e)
        }), 500

@educational_opportunity_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for educational opportunity services"""
    try:
        health_status = {
            'service': 'Educational Opportunities API',
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'features': {
                'ai_enhancement': educational_ai_engine.model is not None,
                'opportunity_types': len([t for t in EmploymentType if t.value.endswith(('camp', 'scholarship', 'training', 'program', 'workshop', 'seminar'))]),
                'age_groups': len(AgeGroup),
                'templates_available': True
            },
            'version': '1.0.0'
        }
        
        return jsonify({
            'success': True,
            'health': health_status
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Health check failed',
            'message': str(e)
        }), 500
