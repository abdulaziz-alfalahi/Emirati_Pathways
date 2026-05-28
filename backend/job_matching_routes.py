"""
Enhanced Job Matching API Routes
Provides endpoints for AI-powered job matching and recommendations
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from enhanced_job_matching import enhanced_job_matcher
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
job_matching_bp = Blueprint('job_matching', __name__, url_prefix='/api/job-matching')

@job_matching_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_job_recommendations():
    """Get AI-powered job recommendations for the current user"""
    try:
        user_id = get_jwt_identity()
        refresh = request.args.get('refresh', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 20))
        
        logger.info(f"Getting job recommendations for user {user_id}, refresh={refresh}")
        
        # Get recommendations from enhanced matcher
        recommendations = enhanced_job_matcher.get_job_recommendations(
            user_id=user_id, 
            refresh=refresh
        )
        
        # Convert to JSON-serializable format
        recommendations_data = []
        for match in recommendations:
            recommendations_data.append({
                'job_id': match.job_id,
                'title': match.title,
                'company': match.company,
                'location': match.location,
                'salary_range': match.salary_range,
                'match_score': round(match.match_score * 100, 1),  # Convert to percentage
                'reasons': match.reasons,
                'emiratization_eligible': match.emiratization_eligible,
                'skills_match': {
                    'matching_skills': match.skills_match.get('matching', []),
                    'missing_skills': match.skills_match.get('missing', []),
                    'score': round(match.skills_match.get('score', 0) * 100, 1)
                },
                'experience_match': round(match.experience_match * 100, 1),
                'education_match': round(match.education_match * 100, 1),
                'location_match': round(match.location_preference_match * 100, 1)
            })
        
        return jsonify({
            'success': True,
            'recommendations': recommendations_data,
            'total_count': len(recommendations_data),
            'generated_at': datetime.now().isoformat(),
            'message': f'Found {len(recommendations_data)} job recommendations'
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting job recommendations: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get job recommendations',
            'message': str(e)
        }), 500

@job_matching_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_job_market_insights():
    """Get job market insights for the current user"""
    try:
        user_id = get_jwt_identity()
        
        logger.info(f"Getting job market insights for user {user_id}")
        
        # Get insights from enhanced matcher
        insights = enhanced_job_matcher.get_job_insights(user_id)
        
        return jsonify({
            'success': True,
            'insights': insights,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting job market insights: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get job market insights',
            'message': str(e)
        }), 500

@job_matching_bp.route('/match-analysis', methods=['POST'])
@jwt_required()
def analyze_specific_job_match():
    """Analyze match compatibility for a specific job"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        job_id = data.get('job_id')
        if not job_id:
            return jsonify({
                'success': False,
                'error': 'job_id is required'
            }), 400
        
        logger.info(f"Analyzing job match for user {user_id}, job {job_id}")
        
        # Get candidate profile
        candidate_profile = enhanced_job_matcher.get_candidate_profile(user_id)
        if not candidate_profile:
            return jsonify({
                'success': False,
                'error': 'Candidate profile not found'
            }), 404
        
        # Get job details (you would implement this method)
        # For now, we'll use the provided job data
        job_data = data.get('job_data', {})
        
        # Perform AI analysis
        ai_analysis = enhanced_job_matcher.analyze_job_match_with_ai(
            candidate_profile, job_data
        )
        
        # Calculate enhanced score
        match_score = enhanced_job_matcher.calculate_enhanced_match_score(
            ai_analysis, job_data
        )
        
        return jsonify({
            'success': True,
            'analysis': {
                'overall_match_score': round(match_score * 100, 1),
                'detailed_scores': {
                    'skills_match': round(ai_analysis.get('skills_match_score', 0) * 100, 1),
                    'experience_match': round(ai_analysis.get('experience_match_score', 0) * 100, 1),
                    'education_match': round(ai_analysis.get('education_match_score', 0) * 100, 1),
                    'location_match': round(ai_analysis.get('location_match_score', 0) * 100, 1)
                },
                'emiratization_eligible': ai_analysis.get('emiratization_eligible', False),
                'matching_skills': ai_analysis.get('matching_skills', []),
                'missing_skills': ai_analysis.get('missing_skills', []),
                'match_reasons': ai_analysis.get('match_reasons', []),
                'growth_opportunities': ai_analysis.get('growth_opportunities', []),
                'recommendations': ai_analysis.get('recommendations', []),
                'uae_career_alignment': ai_analysis.get('uae_career_alignment', ''),
                'confidence_level': round(ai_analysis.get('confidence_level', 0) * 100, 1)
            },
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing job match: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to analyze job match',
            'message': str(e)
        }), 500

@job_matching_bp.route('/preferences', methods=['GET', 'POST'])
@jwt_required()
def job_preferences():
    """Get or update job matching preferences"""
    try:
        user_id = get_jwt_identity()
        
        if request.method == 'GET':
            # Get current preferences
            # This would fetch from database - simplified for now
            preferences = {
                'preferred_locations': ['Dubai', 'Abu Dhabi'],
                'preferred_industries': ['Technology', 'Finance'],
                'salary_range': {'min': 5000, 'max': 15000},
                'job_types': ['Full-time', 'Remote'],
                'experience_level': 'Mid-level',
                'emiratization_priority': True
            }
            
            return jsonify({
                'success': True,
                'preferences': preferences
            }), 200
            
        else:  # POST
            data = request.get_json()
            
            # Update preferences in database
            # This would save to database - simplified for now
            logger.info(f"Updating job preferences for user {user_id}: {data}")
            
            return jsonify({
                'success': True,
                'message': 'Job preferences updated successfully'
            }), 200
            
    except Exception as e:
        logger.error(f"Error handling job preferences: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to handle job preferences',
            'message': str(e)
        }), 500

@job_matching_bp.route('/save-job', methods=['POST'])
@jwt_required()
def save_job():
    """Save a job for later review"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        job_id = data.get('job_id')
        if not job_id:
            return jsonify({
                'success': False,
                'error': 'job_id is required'
            }), 400
        
        # Save job to database (implement this)
        logger.info(f"Saving job {job_id} for user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Job saved successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error saving job: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to save job',
            'message': str(e)
        }), 500

@job_matching_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_to_job():
    """Apply to a specific job"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        job_id = data.get('job_id')
        cover_letter = data.get('cover_letter', '')
        
        if not job_id:
            return jsonify({
                'success': False,
                'error': 'job_id is required'
            }), 400
        
        # Create job application (implement this)
        logger.info(f"Creating job application for user {user_id}, job {job_id}")
        
        return jsonify({
            'success': True,
            'message': 'Job application submitted successfully',
            'application_id': f'app_{user_id}_{job_id}_{int(datetime.now().timestamp())}'
        }), 200
        
    except Exception as e:
        logger.error(f"Error applying to job: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to apply to job',
            'message': str(e)
        }), 500

@job_matching_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_matching_stats():
    """Get job matching statistics for the user"""
    try:
        user_id = get_jwt_identity()
        
        # Get statistics (implement database queries)
        stats = {
            'total_recommendations': 25,
            'high_match_jobs': 8,
            'applications_sent': 5,
            'interviews_scheduled': 2,
            'emiratization_eligible_jobs': 15,
            'avg_match_score': 78.5,
            'top_matching_industries': ['Technology', 'Finance', 'Healthcare'],
            'skill_improvement_suggestions': ['Python', 'Data Analysis', 'Project Management']
        }
        
        return jsonify({
            'success': True,
            'stats': stats,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting matching stats: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get matching statistics',
            'message': str(e)
        }), 500

# Health check endpoint
@job_matching_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for job matching service"""
    return jsonify({
        'success': True,
        'service': 'Job Matching API',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ai_engine': 'AI Engine',
        'version': '1.0.0'
    }), 200
