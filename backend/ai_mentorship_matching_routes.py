"""
AI Mentorship Matching Routes for Emirati Journey Platform
API endpoints for AI-powered mentor-mentee matching and compatibility analysis
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime
from typing import Dict, List, Any

# Import the AI matching engine
from ai_mentorship_matching_engine import (
    ai_matching_engine, 
    MenteeProfile, 
    CompatibilityScore,
    MatchingRecommendation
)

# Import mentor system for mentor profiles
from mentor_system import mentor_system

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
ai_matching_bp = Blueprint('ai_matching', __name__, url_prefix='/api/ai-matching')

@ai_matching_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for AI matching system"""
    try:
        analytics = ai_matching_engine.get_matching_analytics()
        
        return jsonify({
            'status': 'healthy',
            'service': 'AI Mentorship Matching Engine',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'features': {
                'ai_powered_matching': True,
                'compatibility_analysis': True,
                'cultural_intelligence': True,
                'emiratization_support': True,
                'success_prediction': True,
                'bias_detection': True,
                'multilingual_support': True
            },
            'analytics': analytics,
            'gemini_status': 'operational' if ai_matching_engine.model else 'unavailable'
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_matching_bp.route('/find-mentors', methods=['POST'])
@jwt_required()
def find_best_mentors():
    """Find the best mentor matches for a mentee"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'mentee_id', 'full_name', 'email', 'age', 'education_level',
            'field_of_study', 'career_goals', 'desired_expertise_areas'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}',
                    'timestamp': datetime.utcnow().isoformat()
                }), 400
        
        # Create mentee profile
        mentee_profile = MenteeProfile(
            mentee_id=data['mentee_id'],
            full_name=data['full_name'],
            email=data['email'],
            age=data['age'],
            education_level=data['education_level'],
            field_of_study=data['field_of_study'],
            current_position=data.get('current_position'),
            career_goals=data['career_goals'],
            desired_expertise_areas=data['desired_expertise_areas'],
            preferred_mentorship_types=data.get('preferred_mentorship_types', ['career_guidance']),
            learning_style=data.get('learning_style', 'hands-on'),
            communication_preferences=data.get('communication_preferences', ['video calls']),
            availability=data.get('availability', {'days': ['Monday', 'Wednesday', 'Friday'], 'times': ['18:00-20:00']}),
            languages=data.get('languages', ['English']),
            is_uae_national=data.get('is_uae_national', False),
            cultural_background=data.get('cultural_background', 'International'),
            personality_traits=data.get('personality_traits', ['ambitious']),
            challenges_faced=data.get('challenges_faced', []),
            success_metrics=data.get('success_metrics', []),
            previous_mentorship_experience=data.get('previous_mentorship_experience', False),
            preferred_mentor_characteristics=data.get('preferred_mentor_characteristics', [])
        )
        
        # Get available mentors
        available_mentors = mentor_system.get_available_mentors()
        
        if not available_mentors:
            return jsonify({
                'message': 'No available mentors found',
                'recommendations': [],
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        
        # Find best matches
        top_n = data.get('top_n', 5)
        recommendations = ai_matching_engine.find_best_mentors(
            mentee_profile, available_mentors, top_n
        )
        
        # Convert to JSON-serializable format
        recommendations_data = [rec.to_dict() for rec in recommendations]
        
        return jsonify({
            'mentee_id': data['mentee_id'],
            'total_mentors_analyzed': len(available_mentors),
            'recommendations_count': len(recommendations),
            'recommendations': recommendations_data,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error finding best mentors: {str(e)}")
        return jsonify({
            'error': 'Failed to find mentor matches',
            'details': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_matching_bp.route('/compatibility-score', methods=['POST'])
@jwt_required()
def calculate_compatibility():
    """Calculate compatibility score between specific mentor and mentee"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'mentor_id' not in data or 'mentee_profile' not in data:
            return jsonify({
                'error': 'Missing mentor_id or mentee_profile',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        
        # Get mentor profile
        mentor_profile = mentor_system.get_mentor_by_id(data['mentor_id'])
        if not mentor_profile:
            return jsonify({
                'error': 'Mentor not found',
                'timestamp': datetime.utcnow().isoformat()
            }), 404
        
        # Create mentee profile
        mentee_data = data['mentee_profile']
        mentee_profile = MenteeProfile(
            mentee_id=mentee_data['mentee_id'],
            full_name=mentee_data['full_name'],
            email=mentee_data['email'],
            age=mentee_data['age'],
            education_level=mentee_data['education_level'],
            field_of_study=mentee_data['field_of_study'],
            current_position=mentee_data.get('current_position'),
            career_goals=mentee_data['career_goals'],
            desired_expertise_areas=mentee_data['desired_expertise_areas'],
            preferred_mentorship_types=mentee_data.get('preferred_mentorship_types', ['career_guidance']),
            learning_style=mentee_data.get('learning_style', 'hands-on'),
            communication_preferences=mentee_data.get('communication_preferences', ['video calls']),
            availability=mentee_data.get('availability', {'days': ['Monday', 'Wednesday', 'Friday'], 'times': ['18:00-20:00']}),
            languages=mentee_data.get('languages', ['English']),
            is_uae_national=mentee_data.get('is_uae_national', False),
            cultural_background=mentee_data.get('cultural_background', 'International'),
            personality_traits=mentee_data.get('personality_traits', ['ambitious']),
            challenges_faced=mentee_data.get('challenges_faced', []),
            success_metrics=mentee_data.get('success_metrics', []),
            previous_mentorship_experience=mentee_data.get('previous_mentorship_experience', False),
            preferred_mentor_characteristics=mentee_data.get('preferred_mentor_characteristics', [])
        )
        
        # Calculate compatibility score
        compatibility_score = ai_matching_engine.calculate_compatibility_score(
            mentor_profile, mentee_profile
        )
        
        return jsonify({
            'compatibility_score': compatibility_score.to_dict(),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error calculating compatibility: {str(e)}")
        return jsonify({
            'error': 'Failed to calculate compatibility score',
            'details': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_matching_bp.route('/batch-matching', methods=['POST'])
@jwt_required()
def batch_mentor_matching():
    """Perform batch matching for multiple mentees"""
    try:
        data = request.get_json()
        
        if 'mentees' not in data:
            return jsonify({
                'error': 'Missing mentees array',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        
        mentees_data = data['mentees']
        top_n = data.get('top_n', 3)
        
        # Get available mentors once
        available_mentors = mentor_system.get_available_mentors()
        
        if not available_mentors:
            return jsonify({
                'message': 'No available mentors found',
                'results': [],
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        
        batch_results = []
        
        for mentee_data in mentees_data:
            try:
                # Create mentee profile
                mentee_profile = MenteeProfile(
                    mentee_id=mentee_data['mentee_id'],
                    full_name=mentee_data['full_name'],
                    email=mentee_data['email'],
                    age=mentee_data['age'],
                    education_level=mentee_data['education_level'],
                    field_of_study=mentee_data['field_of_study'],
                    current_position=mentee_data.get('current_position'),
                    career_goals=mentee_data['career_goals'],
                    desired_expertise_areas=mentee_data['desired_expertise_areas'],
                    preferred_mentorship_types=mentee_data.get('preferred_mentorship_types', ['career_guidance']),
                    learning_style=mentee_data.get('learning_style', 'hands-on'),
                    communication_preferences=mentee_data.get('communication_preferences', ['video calls']),
                    availability=mentee_data.get('availability', {'days': ['Monday', 'Wednesday', 'Friday'], 'times': ['18:00-20:00']}),
                    languages=mentee_data.get('languages', ['English']),
                    is_uae_national=mentee_data.get('is_uae_national', False),
                    cultural_background=mentee_data.get('cultural_background', 'International'),
                    personality_traits=mentee_data.get('personality_traits', ['ambitious']),
                    challenges_faced=mentee_data.get('challenges_faced', []),
                    success_metrics=mentee_data.get('success_metrics', []),
                    previous_mentorship_experience=mentee_data.get('previous_mentorship_experience', False),
                    preferred_mentor_characteristics=mentee_data.get('preferred_mentor_characteristics', [])
                )
                
                # Find matches
                recommendations = ai_matching_engine.find_best_mentors(
                    mentee_profile, available_mentors, top_n
                )
                
                batch_results.append({
                    'mentee_id': mentee_data['mentee_id'],
                    'status': 'success',
                    'recommendations': [rec.to_dict() for rec in recommendations]
                })
                
            except Exception as e:
                logger.error(f"❌ Error processing mentee {mentee_data.get('mentee_id', 'unknown')}: {str(e)}")
                batch_results.append({
                    'mentee_id': mentee_data.get('mentee_id', 'unknown'),
                    'status': 'error',
                    'error': str(e)
                })
        
        return jsonify({
            'total_mentees_processed': len(mentees_data),
            'successful_matches': len([r for r in batch_results if r['status'] == 'success']),
            'failed_matches': len([r for r in batch_results if r['status'] == 'error']),
            'results': batch_results,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error in batch matching: {str(e)}")
        return jsonify({
            'error': 'Failed to perform batch matching',
            'details': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_matching_bp.route('/matching-analytics', methods=['GET'])
@jwt_required()
def get_matching_analytics():
    """Get comprehensive matching analytics"""
    try:
        analytics = ai_matching_engine.get_matching_analytics()
        
        # Add additional system metrics
        system_metrics = {
            'total_mentors_available': len(mentor_system.get_available_mentors()),
            'total_mentors_registered': len(mentor_system.get_all_mentors()),
            'matching_engine_version': '1.0.0',
            'ai_model': 'Gemini 2.5 Pro',
            'cultural_intelligence_enabled': True,
            'emiratization_support_enabled': True
        }
        
        return jsonify({
            'analytics': analytics,
            'system_metrics': system_metrics,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting matching analytics: {str(e)}")
        return jsonify({
            'error': 'Failed to get matching analytics',
            'details': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_matching_bp.route('/sample-mentees', methods=['GET'])
def get_sample_mentees():
    """Get sample mentee profiles for testing"""
    try:
        sample_mentees = [mentee.to_dict() for mentee in ai_matching_engine.sample_mentees]
        
        return jsonify({
            'sample_mentees': sample_mentees,
            'count': len(sample_mentees),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting sample mentees: {str(e)}")
        return jsonify({
            'error': 'Failed to get sample mentees',
            'details': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_matching_bp.route('/demo-matching', methods=['POST'])
def demo_mentor_matching():
    """Demo endpoint for mentor matching (no authentication required)"""
    try:
        data = request.get_json()
        
        # Use sample mentee if no specific mentee provided
        if 'mentee_id' in data:
            # Find specific sample mentee
            sample_mentee = next(
                (m for m in ai_matching_engine.sample_mentees if m.mentee_id == data['mentee_id']),
                ai_matching_engine.sample_mentees[0]
            )
        else:
            # Use first sample mentee
            sample_mentee = ai_matching_engine.sample_mentees[0]
        
        # Get available mentors
        available_mentors = mentor_system.get_available_mentors()
        
        if not available_mentors:
            return jsonify({
                'message': 'No available mentors found for demo',
                'sample_mentee': sample_mentee.to_dict(),
                'recommendations': [],
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        
        # Find best matches
        top_n = data.get('top_n', 3)
        recommendations = ai_matching_engine.find_best_mentors(
            sample_mentee, available_mentors, top_n
        )
        
        return jsonify({
            'demo_type': 'AI-Powered Mentor Matching',
            'sample_mentee': sample_mentee.to_dict(),
            'total_mentors_analyzed': len(available_mentors),
            'recommendations_count': len(recommendations),
            'recommendations': [rec.to_dict() for rec in recommendations],
            'matching_analytics': ai_matching_engine.get_matching_analytics(),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error in demo matching: {str(e)}")
        return jsonify({
            'error': 'Demo matching failed',
            'details': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_matching_bp.route('/criteria-weights', methods=['GET'])
def get_matching_criteria_weights():
    """Get current matching criteria weights"""
    try:
        weights = {
            criteria.value: weight 
            for criteria, weight in ai_matching_engine.matching_criteria_weights.items()
        }
        
        return jsonify({
            'criteria_weights': weights,
            'total_weight': sum(weights.values()),
            'description': 'Weights used in AI-powered mentor-mentee compatibility scoring',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting criteria weights: {str(e)}")
        return jsonify({
            'error': 'Failed to get criteria weights',
            'details': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_matching_bp.route('/update-criteria-weights', methods=['POST'])
@jwt_required()
def update_matching_criteria_weights():
    """Update matching criteria weights (admin only)"""
    try:
        data = request.get_json()
        
        if 'weights' not in data:
            return jsonify({
                'error': 'Missing weights data',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        
        # Validate weights sum to 1.0
        total_weight = sum(data['weights'].values())
        if abs(total_weight - 1.0) > 0.01:
            return jsonify({
                'error': f'Weights must sum to 1.0, got {total_weight}',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        
        # Update weights
        from ai_mentorship_matching_engine import MatchingCriteria
        for criteria_name, weight in data['weights'].items():
            try:
                criteria = MatchingCriteria(criteria_name)
                ai_matching_engine.matching_criteria_weights[criteria] = weight
            except ValueError:
                return jsonify({
                    'error': f'Invalid criteria: {criteria_name}',
                    'timestamp': datetime.utcnow().isoformat()
                }), 400
        
        return jsonify({
            'message': 'Criteria weights updated successfully',
            'new_weights': {
                criteria.value: weight 
                for criteria, weight in ai_matching_engine.matching_criteria_weights.items()
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error updating criteria weights: {str(e)}")
        return jsonify({
            'error': 'Failed to update criteria weights',
            'details': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Error handlers
@ai_matching_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested AI matching endpoint does not exist',
        'timestamp': datetime.utcnow().isoformat()
    }), 404

@ai_matching_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred in the AI matching system',
        'timestamp': datetime.utcnow().isoformat()
    }), 500

logger.info("✅ AI Mentorship Matching routes loaded successfully")
