"""
Competency Validation Routes for Emirati Journey Platform Assessment System
API endpoints for competency validation and certification management
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional
import jwt
from functools import wraps

from competency_validation_system import (
    competency_validation_system, 
    CompetencyLevel, 
    CertificationStatus, 
    CertificationType, 
    ValidationMethod
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
competency_validation_bp = Blueprint('competency_validation', __name__, url_prefix='/api/competency-validation')

def token_required(f):
    """Decorator for routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            # In production, verify JWT token properly
            # For now, we'll accept any token for demo purposes
            current_user = {'user_id': 'demo_user', 'role': 'assessor'}
        except Exception as e:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

@competency_validation_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for competency validation system"""
    try:
        analytics = competency_validation_system.get_validation_analytics()
        return jsonify({
            'status': 'operational',
            'system_health': 'excellent',
            'total_validations': analytics.get('overview', {}).get('total_validations', 0),
            'total_certifications': analytics.get('overview', {}).get('total_certifications', 0),
            'total_frameworks': analytics.get('overview', {}).get('total_frameworks', 0),
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Competency validation health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Competency validation system health check failed',
            'error': str(e)
        }), 500

@competency_validation_bp.route('/frameworks', methods=['GET'])
@token_required
def get_competency_frameworks(current_user):
    """Get all available competency frameworks"""
    try:
        frameworks = []
        for framework in competency_validation_system.competency_frameworks.values():
            frameworks.append({
                'framework_id': framework.framework_id,
                'name': framework.name,
                'description': framework.description,
                'industry_category': framework.industry_category,
                'competency_areas': framework.competency_areas,
                'proficiency_levels': framework.proficiency_levels,
                'uae_cultural_elements': framework.uae_cultural_elements,
                'version': framework.version,
                'active': framework.active,
                'created_at': framework.created_at.isoformat()
            })
        
        return jsonify({
            'frameworks': frameworks,
            'total_count': len(frameworks)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting competency frameworks: {str(e)}")
        return jsonify({'error': 'Failed to retrieve competency frameworks'}), 500

@competency_validation_bp.route('/frameworks', methods=['POST'])
@token_required
def create_competency_framework(current_user):
    """Create a new competency framework"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'industry_category', 'competency_areas']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Add creator information
        data['created_by'] = current_user['user_id']
        
        # Create framework
        framework = competency_validation_system.create_competency_framework(data)
        
        return jsonify({
            'success': True,
            'framework': {
                'framework_id': framework.framework_id,
                'name': framework.name,
                'description': framework.description,
                'industry_category': framework.industry_category,
                'competency_areas': framework.competency_areas,
                'version': framework.version,
                'created_at': framework.created_at.isoformat()
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating competency framework: {str(e)}")
        return jsonify({'error': 'Failed to create competency framework'}), 500

@competency_validation_bp.route('/validate-competency', methods=['POST'])
@token_required
def validate_competency(current_user):
    """Validate a competency for a candidate"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['candidate_id', 'competency_id', 'competency_name', 'validation_method']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Add assessor information
        data['assessor_id'] = current_user['user_id']
        
        # Validate competency
        validation = competency_validation_system.validate_competency(data)
        
        return jsonify({
            'success': True,
            'validation': {
                'validation_id': validation.validation_id,
                'candidate_id': validation.candidate_id,
                'competency_name': validation.competency_name,
                'assessed_level': validation.assessed_level.value,
                'validation_score': validation.validation_score,
                'cultural_competency_score': validation.cultural_competency_score,
                'uae_alignment_score': validation.uae_alignment_score,
                'validation_date': validation.validation_date.isoformat(),
                'expiry_date': validation.expiry_date.isoformat() if validation.expiry_date else None,
                'confidence_level': validation.confidence_level
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error validating competency: {str(e)}")
        return jsonify({'error': 'Failed to validate competency'}), 500

@competency_validation_bp.route('/certifications', methods=['POST'])
@token_required
def issue_certification(current_user):
    """Issue a professional certification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['candidate_id', 'certification_type', 'certification_name', 'competencies_validated']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Issue certification
        certification = competency_validation_system.issue_certification(data)
        
        return jsonify({
            'success': True,
            'certification': {
                'certification_id': certification.certification_id,
                'candidate_id': certification.candidate_id,
                'certification_name': certification.certification_name,
                'certification_type': certification.certification_type.value,
                'issuing_authority': certification.issuing_authority,
                'certification_level': certification.certification_level,
                'issue_date': certification.issue_date.isoformat(),
                'expiry_date': certification.expiry_date.isoformat() if certification.expiry_date else None,
                'status': certification.status.value,
                'verification_code': certification.verification_code,
                'digital_badge_url': certification.digital_badge_url,
                'uae_recognition_status': certification.uae_recognition_status,
                'blockchain_hash': certification.blockchain_hash
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error issuing certification: {str(e)}")
        return jsonify({'error': 'Failed to issue certification'}), 500

@competency_validation_bp.route('/skill-portfolio/<candidate_id>', methods=['GET'])
@token_required
def get_skill_portfolio(current_user, candidate_id):
    """Get skill portfolio for a candidate"""
    try:
        # Create or get existing portfolio
        portfolio = competency_validation_system.create_skill_portfolio(candidate_id)
        
        return jsonify({
            'success': True,
            'portfolio': {
                'portfolio_id': portfolio.portfolio_id,
                'candidate_id': portfolio.candidate_id,
                'portfolio_score': portfolio.portfolio_score,
                'market_readiness_score': portfolio.market_readiness_score,
                'uae_employability_score': portfolio.uae_employability_score,
                'total_validations': len(portfolio.validated_competencies),
                'total_certifications': len(portfolio.certifications),
                'skill_progression': portfolio.skill_progression,
                'last_updated': portfolio.last_updated.isoformat(),
                'verification_status': portfolio.verification_status,
                'validated_competencies': [
                    {
                        'competency_name': v.competency_name,
                        'assessed_level': v.assessed_level.value,
                        'validation_score': v.validation_score,
                        'validation_date': v.validation_date.isoformat(),
                        'cultural_competency_score': v.cultural_competency_score,
                        'uae_alignment_score': v.uae_alignment_score
                    }
                    for v in portfolio.validated_competencies
                ],
                'certifications': [
                    {
                        'certification_name': c.certification_name,
                        'certification_type': c.certification_type.value,
                        'certification_level': c.certification_level,
                        'issue_date': c.issue_date.isoformat(),
                        'status': c.status.value,
                        'verification_code': c.verification_code,
                        'uae_recognition_status': c.uae_recognition_status
                    }
                    for c in portfolio.certifications
                ]
            }
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error getting skill portfolio: {str(e)}")
        return jsonify({'error': 'Failed to retrieve skill portfolio'}), 500

@competency_validation_bp.route('/verify-certification', methods=['POST'])
def verify_certification():
    """Verify a certification using verification code"""
    try:
        data = request.get_json()
        
        if 'verification_code' not in data:
            return jsonify({'error': 'Missing verification code'}), 400
        
        verification_code = data['verification_code']
        result = competency_validation_system.verify_certification(verification_code)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error verifying certification: {str(e)}")
        return jsonify({'error': 'Failed to verify certification'}), 500

@competency_validation_bp.route('/competency-gap-analysis', methods=['POST'])
@token_required
def analyze_competency_gaps(current_user):
    """Analyze competency gaps for a target role"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['candidate_id', 'target_role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        candidate_id = data['candidate_id']
        target_role = data['target_role']
        
        # Analyze gaps
        analysis = competency_validation_system.get_competency_gap_analysis(candidate_id, target_role)
        
        return jsonify({
            'success': True,
            'gap_analysis': analysis
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error analyzing competency gaps: {str(e)}")
        return jsonify({'error': 'Failed to analyze competency gaps'}), 500

@competency_validation_bp.route('/certifications/<certification_id>/renew', methods=['POST'])
@token_required
def renew_certification(current_user, certification_id):
    """Renew an existing certification"""
    try:
        data = request.get_json()
        
        # Renew certification
        certification = competency_validation_system.renew_certification(certification_id, data)
        
        return jsonify({
            'success': True,
            'certification': {
                'certification_id': certification.certification_id,
                'certification_name': certification.certification_name,
                'status': certification.status.value,
                'issue_date': certification.issue_date.isoformat(),
                'expiry_date': certification.expiry_date.isoformat() if certification.expiry_date else None,
                'verification_code': certification.verification_code,
                'continuing_education_credits': certification.continuing_education_credits,
                'blockchain_hash': certification.blockchain_hash
            }
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error renewing certification: {str(e)}")
        return jsonify({'error': 'Failed to renew certification'}), 500

@competency_validation_bp.route('/analytics', methods=['GET'])
@token_required
def get_validation_analytics(current_user):
    """Get comprehensive validation analytics"""
    try:
        analytics = competency_validation_system.get_validation_analytics()
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting validation analytics: {str(e)}")
        return jsonify({'error': 'Failed to retrieve analytics'}), 500

@competency_validation_bp.route('/competency-levels', methods=['GET'])
def get_competency_levels():
    """Get all available competency levels"""
    try:
        levels = [
            {
                'value': level.value,
                'label': level.value.replace('_', ' ').title(),
                'description': _get_level_description(level)
            }
            for level in CompetencyLevel
        ]
        
        return jsonify({
            'competency_levels': levels,
            'total_count': len(levels)
        }), 200
    except Exception as e:
        logger.error(f"Error getting competency levels: {str(e)}")
        return jsonify({'error': 'Failed to retrieve competency levels'}), 500

@competency_validation_bp.route('/certification-types', methods=['GET'])
def get_certification_types():
    """Get all available certification types"""
    try:
        types = [
            {
                'value': cert_type.value,
                'label': cert_type.value.replace('_', ' ').title(),
                'description': _get_certification_type_description(cert_type)
            }
            for cert_type in CertificationType
        ]
        
        return jsonify({
            'certification_types': types,
            'total_count': len(types)
        }), 200
    except Exception as e:
        logger.error(f"Error getting certification types: {str(e)}")
        return jsonify({'error': 'Failed to retrieve certification types'}), 500

@competency_validation_bp.route('/validation-methods', methods=['GET'])
def get_validation_methods():
    """Get all available validation methods"""
    try:
        methods = [
            {
                'value': method.value,
                'label': method.value.replace('_', ' ').title(),
                'description': _get_validation_method_description(method)
            }
            for method in ValidationMethod
        ]
        
        return jsonify({
            'validation_methods': methods,
            'total_count': len(methods)
        }), 200
    except Exception as e:
        logger.error(f"Error getting validation methods: {str(e)}")
        return jsonify({'error': 'Failed to retrieve validation methods'}), 500

@competency_validation_bp.route('/candidate/<candidate_id>/validations', methods=['GET'])
@token_required
def get_candidate_validations(current_user, candidate_id):
    """Get all validations for a specific candidate"""
    try:
        validations = [
            v for v in competency_validation_system.validations.values() 
            if v.candidate_id == candidate_id
        ]
        
        validation_data = []
        for validation in validations:
            validation_data.append({
                'validation_id': validation.validation_id,
                'competency_name': validation.competency_name,
                'assessed_level': validation.assessed_level.value,
                'validation_score': validation.validation_score,
                'validation_method': validation.validation_method.value,
                'cultural_competency_score': validation.cultural_competency_score,
                'uae_alignment_score': validation.uae_alignment_score,
                'validation_date': validation.validation_date.isoformat(),
                'expiry_date': validation.expiry_date.isoformat() if validation.expiry_date else None,
                'assessor_id': validation.assessor_id,
                'confidence_level': validation.confidence_level
            })
        
        return jsonify({
            'success': True,
            'candidate_id': candidate_id,
            'validations': validation_data,
            'total_count': len(validation_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting candidate validations: {str(e)}")
        return jsonify({'error': 'Failed to retrieve candidate validations'}), 500

@competency_validation_bp.route('/candidate/<candidate_id>/certifications', methods=['GET'])
@token_required
def get_candidate_certifications(current_user, candidate_id):
    """Get all certifications for a specific candidate"""
    try:
        certifications = [
            c for c in competency_validation_system.certifications.values() 
            if c.candidate_id == candidate_id
        ]
        
        certification_data = []
        for certification in certifications:
            certification_data.append({
                'certification_id': certification.certification_id,
                'certification_name': certification.certification_name,
                'certification_type': certification.certification_type.value,
                'issuing_authority': certification.issuing_authority,
                'certification_level': certification.certification_level,
                'issue_date': certification.issue_date.isoformat(),
                'expiry_date': certification.expiry_date.isoformat() if certification.expiry_date else None,
                'status': certification.status.value,
                'verification_code': certification.verification_code,
                'digital_badge_url': certification.digital_badge_url,
                'uae_recognition_status': certification.uae_recognition_status,
                'continuing_education_credits': certification.continuing_education_credits
            })
        
        return jsonify({
            'success': True,
            'candidate_id': candidate_id,
            'certifications': certification_data,
            'total_count': len(certification_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting candidate certifications: {str(e)}")
        return jsonify({'error': 'Failed to retrieve candidate certifications'}), 500

@competency_validation_bp.route('/batch-validate', methods=['POST'])
@token_required
def batch_validate_competencies(current_user):
    """Validate multiple competencies in batch"""
    try:
        data = request.get_json()
        
        if 'validations' not in data:
            return jsonify({'error': 'Missing validations array'}), 400
        
        validations_data = data['validations']
        results = []
        
        for i, validation_data in enumerate(validations_data):
            try:
                # Add assessor information
                validation_data['assessor_id'] = current_user['user_id']
                
                # Validate competency
                validation = competency_validation_system.validate_competency(validation_data)
                
                results.append({
                    'index': i,
                    'success': True,
                    'validation_id': validation.validation_id,
                    'competency_name': validation.competency_name,
                    'assessed_level': validation.assessed_level.value,
                    'validation_score': validation.validation_score
                })
                
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'error': str(e)
                })
        
        # Calculate batch statistics
        successful_validations = len([r for r in results if r['success']])
        total_validations = len(results)
        
        return jsonify({
            'batch_results': results,
            'batch_statistics': {
                'total_validations': total_validations,
                'successful_validations': successful_validations,
                'failed_validations': total_validations - successful_validations,
                'success_rate': (successful_validations / total_validations * 100) if total_validations > 0 else 0
            },
            'processed_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Batch validation error: {str(e)}")
        return jsonify({'error': 'Failed to process batch validation'}), 500

@competency_validation_bp.route('/dashboard/overview', methods=['GET'])
@token_required
def get_assessor_dashboard(current_user):
    """Get comprehensive assessor dashboard overview"""
    try:
        analytics = competency_validation_system.get_validation_analytics()
        
        # Get recent validations
        recent_validations = sorted(
            competency_validation_system.validations.values(),
            key=lambda x: x.validation_date,
            reverse=True
        )[:10]
        
        # Get recent certifications
        recent_certifications = sorted(
            competency_validation_system.certifications.values(),
            key=lambda x: x.issue_date,
            reverse=True
        )[:10]
        
        dashboard_data = {
            'overview_metrics': analytics.get('overview', {}),
            'performance_metrics': analytics.get('performance_metrics', {}),
            'recent_validations': [
                {
                    'validation_id': v.validation_id,
                    'candidate_id': v.candidate_id,
                    'competency_name': v.competency_name,
                    'assessed_level': v.assessed_level.value,
                    'validation_score': v.validation_score,
                    'validation_date': v.validation_date.isoformat()
                }
                for v in recent_validations
            ],
            'recent_certifications': [
                {
                    'certification_id': c.certification_id,
                    'candidate_id': c.candidate_id,
                    'certification_name': c.certification_name,
                    'certification_type': c.certification_type.value,
                    'issue_date': c.issue_date.isoformat(),
                    'status': c.status.value
                }
                for c in recent_certifications
            ],
            'trends': analytics.get('trends', {}),
            'generated_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'dashboard': dashboard_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting assessor dashboard: {str(e)}")
        return jsonify({'error': 'Failed to retrieve dashboard data'}), 500

# Helper functions
def _get_level_description(level: CompetencyLevel) -> str:
    """Get description for competency level"""
    descriptions = {
        CompetencyLevel.NOVICE: "Basic understanding, requires guidance and supervision",
        CompetencyLevel.DEVELOPING: "Growing competency, some independence with occasional guidance",
        CompetencyLevel.PROFICIENT: "Competent performance, works independently with minimal supervision",
        CompetencyLevel.ADVANCED: "High-level expertise, mentors others and leads initiatives",
        CompetencyLevel.EXPERT: "Master-level competency, thought leader and innovator"
    }
    return descriptions.get(level, "Competency level description")

def _get_certification_type_description(cert_type: CertificationType) -> str:
    """Get description for certification type"""
    descriptions = {
        CertificationType.SKILL_CERTIFICATION: "Validates specific technical or professional skills",
        CertificationType.PROFESSIONAL_CERTIFICATION: "Comprehensive professional competency certification",
        CertificationType.INDUSTRY_CERTIFICATION: "Industry-specific knowledge and expertise validation",
        CertificationType.CULTURAL_COMPETENCY: "Cultural awareness and cross-cultural communication skills",
        CertificationType.LEADERSHIP_CERTIFICATION: "Leadership and management competencies",
        CertificationType.TECHNICAL_CERTIFICATION: "Technical skills and knowledge validation",
        CertificationType.SOFT_SKILLS_CERTIFICATION: "Interpersonal and communication skills",
        CertificationType.UAE_WORKPLACE_CERTIFICATION: "UAE workplace culture and practices",
        CertificationType.EMIRATIZATION_CERTIFICATION: "UAE national development and Emiratization",
        CertificationType.LANGUAGE_CERTIFICATION: "Language proficiency and communication skills"
    }
    return descriptions.get(cert_type, "Professional certification")

def _get_validation_method_description(method: ValidationMethod) -> str:
    """Get description for validation method"""
    descriptions = {
        ValidationMethod.ASSESSMENT_BASED: "Structured assessment with standardized evaluation criteria",
        ValidationMethod.PORTFOLIO_REVIEW: "Comprehensive review of work portfolio and achievements",
        ValidationMethod.PRACTICAL_DEMONSTRATION: "Hands-on demonstration of skills and competencies",
        ValidationMethod.PEER_EVALUATION: "Evaluation by professional peers and colleagues",
        ValidationMethod.SUPERVISOR_VALIDATION: "Validation by direct supervisor or manager",
        ValidationMethod.PROJECT_BASED: "Assessment through completion of real-world projects",
        ValidationMethod.CONTINUOUS_ASSESSMENT: "Ongoing evaluation over extended period",
        ValidationMethod.HYBRID_VALIDATION: "Combination of multiple validation methods"
    }
    return descriptions.get(method, "Competency validation method")

logger.info("✅ Competency validation routes module loaded successfully")
