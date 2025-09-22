"""
Assessment Routes for Emirati Journey Platform
API endpoints for the world's most advanced assessment system
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional
import jwt
from functools import wraps

from assessment_engine import (
    assessment_engine, AssessmentType, DifficultyLevel, QuestionType, 
    IndustryCategory, AssessmentStatus
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
assessment_bp = Blueprint('assessment', __name__, url_prefix='/api/assessment')

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

@assessment_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for assessment system"""
    try:
        health_status = assessment_engine.get_system_health()
        return jsonify(health_status), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Assessment system health check failed',
            'error': str(e)
        }), 500

@assessment_bp.route('/types', methods=['GET'])
def get_assessment_types():
    """Get all available assessment types"""
    try:
        types = [
            {
                'value': assessment_type.value,
                'label': assessment_type.value.replace('_', ' ').title(),
                'description': _get_assessment_type_description(assessment_type)
            }
            for assessment_type in AssessmentType
        ]
        
        return jsonify({
            'assessment_types': types,
            'total_count': len(types)
        }), 200
    except Exception as e:
        logger.error(f"Error getting assessment types: {str(e)}")
        return jsonify({'error': 'Failed to retrieve assessment types'}), 500

@assessment_bp.route('/difficulty-levels', methods=['GET'])
def get_difficulty_levels():
    """Get all available difficulty levels"""
    try:
        levels = [
            {
                'value': level.value,
                'label': level.value.title(),
                'description': _get_difficulty_description(level)
            }
            for level in DifficultyLevel
        ]
        
        return jsonify({
            'difficulty_levels': levels,
            'total_count': len(levels)
        }), 200
    except Exception as e:
        logger.error(f"Error getting difficulty levels: {str(e)}")
        return jsonify({'error': 'Failed to retrieve difficulty levels'}), 500

@assessment_bp.route('/question-types', methods=['GET'])
def get_question_types():
    """Get all available question types"""
    try:
        types = [
            {
                'value': qtype.value,
                'label': qtype.value.replace('_', ' ').title(),
                'description': _get_question_type_description(qtype)
            }
            for qtype in QuestionType
        ]
        
        return jsonify({
            'question_types': types,
            'total_count': len(types)
        }), 200
    except Exception as e:
        logger.error(f"Error getting question types: {str(e)}")
        return jsonify({'error': 'Failed to retrieve question types'}), 500

@assessment_bp.route('/industry-categories', methods=['GET'])
def get_industry_categories():
    """Get all available industry categories"""
    try:
        categories = [
            {
                'value': category.value,
                'label': category.value.replace('_', ' ').title(),
                'description': _get_industry_description(category)
            }
            for category in IndustryCategory
        ]
        
        return jsonify({
            'industry_categories': categories,
            'total_count': len(categories)
        }), 200
    except Exception as e:
        logger.error(f"Error getting industry categories: {str(e)}")
        return jsonify({'error': 'Failed to retrieve industry categories'}), 500

@assessment_bp.route('/question-banks', methods=['GET'])
@token_required
def get_question_banks(current_user):
    """Get all question banks"""
    try:
        banks = []
        for bank_id, bank in assessment_engine.question_banks.items():
            banks.append({
                'bank_id': bank.bank_id,
                'name': bank.name,
                'description': bank.description,
                'industry_category': bank.industry_category.value,
                'difficulty_level': bank.difficulty_level.value,
                'total_questions': bank.total_questions,
                'active': bank.active,
                'created_by': bank.created_by,
                'created_at': bank.created_at.isoformat() if bank.created_at else None
            })
        
        return jsonify({
            'question_banks': banks,
            'total_count': len(banks)
        }), 200
    except Exception as e:
        logger.error(f"Error getting question banks: {str(e)}")
        return jsonify({'error': 'Failed to retrieve question banks'}), 500

@assessment_bp.route('/question-banks', methods=['POST'])
@token_required
def create_question_bank(current_user):
    """Create a new question bank"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'industry_category', 'difficulty_level']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Add creator information
        data['created_by'] = current_user['user_id']
        
        # Create question bank
        bank = assessment_engine.create_question_bank(data)
        
        return jsonify({
            'message': 'Question bank created successfully',
            'question_bank': {
                'bank_id': bank.bank_id,
                'name': bank.name,
                'description': bank.description,
                'industry_category': bank.industry_category.value,
                'difficulty_level': bank.difficulty_level.value,
                'total_questions': bank.total_questions,
                'created_at': bank.created_at.isoformat()
            }
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating question bank: {str(e)}")
        return jsonify({'error': 'Failed to create question bank'}), 500

@assessment_bp.route('/question-banks/<bank_id>/questions', methods=['POST'])
@token_required
def add_question_to_bank(current_user, bank_id):
    """Add a question to a question bank"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['question_text', 'question_type', 'difficulty_level', 
                          'industry_category', 'skill_tags']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Add creator information
        data['created_by'] = current_user['user_id']
        
        # Add question to bank
        question = assessment_engine.add_question_to_bank(bank_id, data)
        
        return jsonify({
            'message': 'Question added successfully',
            'question': {
                'question_id': question.question_id,
                'question_text': question.question_text,
                'question_type': question.question_type.value,
                'difficulty_level': question.difficulty_level.value,
                'skill_tags': question.skill_tags,
                'points': question.points,
                'created_at': question.created_at.isoformat()
            }
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error adding question to bank: {str(e)}")
        return jsonify({'error': 'Failed to add question to bank'}), 500

@assessment_bp.route('/templates', methods=['GET'])
@token_required
def get_assessment_templates(current_user):
    """Get all assessment templates"""
    try:
        templates = []
        for template_id, template in assessment_engine.assessment_templates.items():
            templates.append({
                'template_id': template.template_id,
                'name': template.name,
                'description': template.description,
                'assessment_type': template.assessment_type.value,
                'industry_category': template.industry_category.value,
                'difficulty_level': template.difficulty_level.value,
                'duration_minutes': template.duration_minutes,
                'total_questions': template.total_questions,
                'passing_score': template.passing_score,
                'uae_cultural_focus': template.uae_cultural_focus,
                'arabic_support': template.arabic_support,
                'created_by': template.created_by,
                'created_at': template.created_at.isoformat() if template.created_at else None
            })
        
        return jsonify({
            'assessment_templates': templates,
            'total_count': len(templates)
        }), 200
    except Exception as e:
        logger.error(f"Error getting assessment templates: {str(e)}")
        return jsonify({'error': 'Failed to retrieve assessment templates'}), 500

@assessment_bp.route('/templates', methods=['POST'])
@token_required
def create_assessment_template(current_user):
    """Create a new assessment template"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'assessment_type', 'industry_category',
                          'difficulty_level', 'duration_minutes', 'total_questions',
                          'passing_score', 'question_distribution', 'skill_weights']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Add creator information
        data['created_by'] = current_user['user_id']
        
        # Create assessment template
        template = assessment_engine.create_assessment_template(data)
        
        return jsonify({
            'message': 'Assessment template created successfully',
            'template': {
                'template_id': template.template_id,
                'name': template.name,
                'description': template.description,
                'assessment_type': template.assessment_type.value,
                'industry_category': template.industry_category.value,
                'difficulty_level': template.difficulty_level.value,
                'duration_minutes': template.duration_minutes,
                'total_questions': template.total_questions,
                'passing_score': template.passing_score,
                'created_at': template.created_at.isoformat()
            }
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating assessment template: {str(e)}")
        return jsonify({'error': 'Failed to create assessment template'}), 500

@assessment_bp.route('/assessments', methods=['POST'])
@token_required
def create_assessment(current_user):
    """Create an assessment from a template"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'template_id' not in data:
            return jsonify({'error': 'Missing required field: template_id'}), 400
        
        template_id = data['template_id']
        customizations = data.get('customizations')
        
        # Create assessment from template
        assessment = assessment_engine.create_assessment_from_template(
            template_id, current_user['user_id'], customizations
        )
        
        return jsonify({
            'message': 'Assessment created successfully',
            'assessment': {
                'assessment_id': assessment.assessment_id,
                'name': assessment.name,
                'description': assessment.description,
                'assessment_type': assessment.assessment_type.value,
                'industry_category': assessment.industry_category.value,
                'difficulty_level': assessment.difficulty_level.value,
                'duration_minutes': assessment.duration_minutes,
                'total_questions': len(assessment.questions),
                'total_points': assessment.total_points,
                'passing_score': assessment.passing_score,
                'status': assessment.status.value,
                'created_at': assessment.created_at.isoformat()
            }
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating assessment: {str(e)}")
        return jsonify({'error': 'Failed to create assessment'}), 500

@assessment_bp.route('/assessments/<assessment_id>/sessions', methods=['POST'])
@token_required
def start_assessment_session(current_user, assessment_id):
    """Start a new assessment session"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'candidate_id' not in data:
            return jsonify({'error': 'Missing required field: candidate_id'}), 400
        
        candidate_id = data['candidate_id']
        
        # Start assessment session
        session = assessment_engine.start_assessment_session(
            assessment_id, candidate_id, current_user['user_id']
        )
        
        return jsonify({
            'message': 'Assessment session started successfully',
            'session': {
                'session_id': session.session_id,
                'assessment_id': session.assessment_id,
                'candidate_id': session.candidate_id,
                'status': session.status.value,
                'started_at': session.started_at.isoformat(),
                'time_remaining_minutes': session.time_remaining_minutes,
                'current_question_index': session.current_question_index
            }
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error starting assessment session: {str(e)}")
        return jsonify({'error': 'Failed to start assessment session'}), 500

@assessment_bp.route('/sessions/<session_id>/responses', methods=['POST'])
@token_required
def submit_response(current_user, session_id):
    """Submit a response to a question"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['question_id', 'response_text']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Submit response
        response = assessment_engine.submit_response(session_id, data['question_id'], data)
        
        return jsonify({
            'message': 'Response submitted successfully',
            'response': {
                'response_id': response.response_id,
                'question_id': response.question_id,
                'time_spent_seconds': response.time_spent_seconds,
                'submitted_at': response.submitted_at.isoformat()
            }
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error submitting response: {str(e)}")
        return jsonify({'error': 'Failed to submit response'}), 500

@assessment_bp.route('/sessions/<session_id>/complete', methods=['POST'])
@token_required
def complete_assessment_session(current_user, session_id):
    """Complete an assessment session and get results"""
    try:
        # Complete assessment session
        results = assessment_engine.complete_assessment_session(session_id)
        
        return jsonify({
            'message': 'Assessment completed successfully',
            'results': results
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error completing assessment session: {str(e)}")
        return jsonify({'error': 'Failed to complete assessment session'}), 500

@assessment_bp.route('/assessments/<assessment_id>/analytics', methods=['GET'])
@token_required
def get_assessment_analytics(current_user, assessment_id):
    """Get comprehensive analytics for an assessment"""
    try:
        analytics = assessment_engine.get_assessment_analytics(assessment_id)
        
        return jsonify({
            'assessment_id': assessment_id,
            'analytics': analytics
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error getting assessment analytics: {str(e)}")
        return jsonify({'error': 'Failed to retrieve assessment analytics'}), 500

@assessment_bp.route('/candidates/<candidate_id>/history', methods=['GET'])
@token_required
def get_candidate_assessment_history(current_user, candidate_id):
    """Get assessment history for a candidate"""
    try:
        history = assessment_engine.get_candidate_assessment_history(candidate_id)
        
        return jsonify({
            'candidate_id': candidate_id,
            'assessment_history': history,
            'total_assessments': len(history)
        }), 200
    except Exception as e:
        logger.error(f"Error getting candidate assessment history: {str(e)}")
        return jsonify({'error': 'Failed to retrieve assessment history'}), 500

@assessment_bp.route('/sessions/<session_id>', methods=['GET'])
@token_required
def get_assessment_session(current_user, session_id):
    """Get assessment session details"""
    try:
        if session_id not in assessment_engine.assessment_sessions:
            return jsonify({'error': 'Assessment session not found'}), 404
        
        session = assessment_engine.assessment_sessions[session_id]
        assessment = assessment_engine.assessments.get(session.assessment_id)
        
        session_data = {
            'session_id': session.session_id,
            'assessment_id': session.assessment_id,
            'candidate_id': session.candidate_id,
            'assessor_id': session.assessor_id,
            'status': session.status.value,
            'started_at': session.started_at.isoformat() if session.started_at else None,
            'completed_at': session.completed_at.isoformat() if session.completed_at else None,
            'time_remaining_minutes': session.time_remaining_minutes,
            'current_question_index': session.current_question_index,
            'total_score': session.total_score,
            'percentage_score': session.percentage_score,
            'passed': session.passed
        }
        
        if assessment:
            session_data['assessment_info'] = {
                'name': assessment.name,
                'description': assessment.description,
                'total_questions': len(assessment.questions),
                'duration_minutes': assessment.duration_minutes,
                'passing_score': assessment.passing_score
            }
        
        return jsonify({
            'session': session_data
        }), 200
    except Exception as e:
        logger.error(f"Error getting assessment session: {str(e)}")
        return jsonify({'error': 'Failed to retrieve assessment session'}), 500

@assessment_bp.route('/dashboard/overview', methods=['GET'])
@token_required
def get_assessor_dashboard(current_user):
    """Get assessor dashboard overview"""
    try:
        # Get assessor's assessments and sessions
        assessor_assessments = [a for a in assessment_engine.assessments.values() 
                              if a.created_by == current_user['user_id']]
        
        assessor_sessions = [s for s in assessment_engine.assessment_sessions.values() 
                           if s.assessor_id == current_user['user_id']]
        
        # Calculate statistics
        total_assessments = len(assessor_assessments)
        total_sessions = len(assessor_sessions)
        completed_sessions = len([s for s in assessor_sessions 
                                if s.status == AssessmentStatus.COMPLETED])
        
        # Recent activity
        recent_sessions = sorted(assessor_sessions, 
                               key=lambda x: x.started_at or datetime.min, 
                               reverse=True)[:10]
        
        recent_activity = []
        for session in recent_sessions:
            assessment = assessment_engine.assessments.get(session.assessment_id)
            if assessment:
                recent_activity.append({
                    'session_id': session.session_id,
                    'assessment_name': assessment.name,
                    'candidate_id': session.candidate_id,
                    'status': session.status.value,
                    'score': session.percentage_score,
                    'started_at': session.started_at.isoformat() if session.started_at else None
                })
        
        dashboard_data = {
            'overview': {
                'total_assessments': total_assessments,
                'total_sessions': total_sessions,
                'completed_sessions': completed_sessions,
                'completion_rate': (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0,
                'pass_rate': len([s for s in assessor_sessions if s.passed]) / completed_sessions * 100 if completed_sessions > 0 else 0
            },
            'recent_activity': recent_activity,
            'assessment_types': list(set([a.assessment_type.value for a in assessor_assessments])),
            'industry_categories': list(set([a.industry_category.value for a in assessor_assessments]))
        }
        
        return jsonify(dashboard_data), 200
    except Exception as e:
        logger.error(f"Error getting assessor dashboard: {str(e)}")
        return jsonify({'error': 'Failed to retrieve dashboard data'}), 500

# Helper functions
def _get_assessment_type_description(assessment_type: AssessmentType) -> str:
    """Get description for assessment type"""
    descriptions = {
        AssessmentType.TECHNICAL_SKILLS: "Evaluate technical competencies and programming abilities",
        AssessmentType.SOFT_SKILLS: "Assess communication, leadership, and interpersonal skills",
        AssessmentType.LANGUAGE_PROFICIENCY: "Test language skills in Arabic and English",
        AssessmentType.CULTURAL_COMPETENCY: "Evaluate UAE cultural understanding and alignment",
        AssessmentType.LEADERSHIP_ASSESSMENT: "Assess leadership potential and management skills",
        AssessmentType.PROBLEM_SOLVING: "Test analytical and critical thinking abilities",
        AssessmentType.INDUSTRY_KNOWLEDGE: "Evaluate sector-specific knowledge and expertise",
        AssessmentType.CERTIFICATION_EXAM: "Professional certification and credential validation",
        AssessmentType.COMPETENCY_VALIDATION: "Comprehensive skill and competency verification",
        AssessmentType.CAREER_READINESS: "Assess overall readiness for career advancement"
    }
    return descriptions.get(assessment_type, "Professional assessment")

def _get_difficulty_description(level: DifficultyLevel) -> str:
    """Get description for difficulty level"""
    descriptions = {
        DifficultyLevel.BEGINNER: "Entry-level knowledge and basic skills",
        DifficultyLevel.INTERMEDIATE: "Moderate expertise with practical experience",
        DifficultyLevel.ADVANCED: "High-level proficiency with specialized knowledge",
        DifficultyLevel.EXPERT: "Master-level expertise with deep understanding"
    }
    return descriptions.get(level, "Professional level")

def _get_question_type_description(qtype: QuestionType) -> str:
    """Get description for question type"""
    descriptions = {
        QuestionType.MULTIPLE_CHOICE: "Select the best answer from multiple options",
        QuestionType.TRUE_FALSE: "Determine if statements are true or false",
        QuestionType.SHORT_ANSWER: "Provide brief written responses",
        QuestionType.ESSAY: "Write detailed explanations and analysis",
        QuestionType.PRACTICAL_TASK: "Complete hands-on practical exercises",
        QuestionType.CODE_CHALLENGE: "Solve programming and coding problems",
        QuestionType.CASE_STUDY: "Analyze real-world scenarios and situations",
        QuestionType.SCENARIO_BASED: "Respond to hypothetical workplace situations",
        QuestionType.PORTFOLIO_REVIEW: "Present and discuss work samples",
        QuestionType.PRESENTATION: "Deliver oral presentations and demonstrations"
    }
    return descriptions.get(qtype, "Assessment question")

def _get_industry_description(category: IndustryCategory) -> str:
    """Get description for industry category"""
    descriptions = {
        IndustryCategory.TECHNOLOGY: "Software development, IT, and digital innovation",
        IndustryCategory.FINANCE: "Banking, investment, and financial services",
        IndustryCategory.HEALTHCARE: "Medical services, pharmaceuticals, and wellness",
        IndustryCategory.EDUCATION: "Teaching, training, and educational services",
        IndustryCategory.GOVERNMENT: "Public sector and government services",
        IndustryCategory.ENGINEERING: "Civil, mechanical, and technical engineering",
        IndustryCategory.BUSINESS: "Management, consulting, and business services",
        IndustryCategory.MARKETING: "Advertising, branding, and digital marketing",
        IndustryCategory.HOSPITALITY: "Tourism, hotels, and hospitality services",
        IndustryCategory.CONSTRUCTION: "Building, infrastructure, and construction",
        IndustryCategory.ENERGY: "Oil, gas, renewable energy, and utilities",
        IndustryCategory.MEDIA: "Broadcasting, journalism, and content creation"
    }
    return descriptions.get(category, "Professional industry")

logger.info("✅ Assessment routes module loaded successfully")
