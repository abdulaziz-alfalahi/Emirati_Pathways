from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from mentor_matching_engine import MentorMatchingEngine, MenteeProfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mentorship_bp = Blueprint('recruiter_mentorship', __name__, url_prefix='/api/recruiter/mentorship')

def get_db_config():
    return {
        "host": "localhost",
        "database": "emirati_journey",
        "user": "emirati_user",
        "password": "emirati_secure_password",
        "port": "5432"
    }

@mentorship_bp.route('/recommend', methods=['POST'])
@jwt_required()
def recommend_mentors():
    """
    Recommend mentors for a candidate based on missing skills.
    Expects JSON: { 
        "candidate_id": "...", 
        "candidate_data": {...}, 
        "missing_skills": ["skill1", "skill2"] 
    }
    """
    try:
        data = request.get_json()
        candidate_id = data.get('candidate_id')
        candidate_data = data.get('candidate_data', {})
        missing_skills = data.get('missing_skills', [])
        
        if not missing_skills:
            return jsonify({'success': True, 'recommendations': []}), 200

        # Initialize engine
        db_config = get_db_config()
        engine = MentorMatchingEngine(db_config)
        
        # Fetch available mentors
        mentors = engine.fetch_mentor_profiles(limit=50)
        
        # Construct MenteeProfile from request data
        # We map the candidate data to the MenteeProfile structure
        # prioritizing the missing skills as 'skill_gaps'
        
        personal_info = candidate_data.get('personalInfo', {})
        experience = candidate_data.get('experience', [])
        
        # Estimate years of experience
        years_exp = 0
        if experience:
            # Very rough estimation, in production would parse dates
            years_exp = len(experience) * 2 

        mentee_profile = MenteeProfile(
            id=candidate_id or "temp_id",
            user_id=candidate_id or "temp_user_id",
            current_industry=experience[0].get('industry', '') if experience else '',
            target_industry='', # Could be passed in if known
            current_role=experience[0].get('title', '') if experience else '',
            target_role='',
            skills=candidate_data.get('skills', {}).get('technical', []),
            skill_gaps=missing_skills,
            years_of_experience=years_exp,
            career_goals=[],
            learning_preferences='structured',
            location=personal_info.get('location', 'Dubai'),
            languages=candidate_data.get('languages', ['English']),
            availability_schedule={},
            budget_range=(0, 0),
            preferred_mentoring_style='collaborative'
        )

        matches = []
        for mentor in mentors:
            # Skip if mentor is at capacity
            if mentor.current_mentees >= mentor.max_mentees:
                continue
            
            # Calculate score
            match_result = engine.calculate_match_score(mentor, mentee_profile)
            
            # Filter low scores
            if match_result.overall_score > 0.4: # Lower threshold for broad recommendations
                matches.append({
                    'mentor': {
                        'id': mentor.id,
                        'name': getattr(mentor, 'full_name', 'Mentor'), # Assuming full_name might be added by fetch
                        'industry': mentor.industry,
                        'expertise': mentor.expertise_areas,
                        'company': 'Nafis Mentor Network', # Placeholder
                        'job_title': 'Senior Mentor', # Placeholder
                        'image_url': '/api/placeholder/150/150' # Placeholder
                    },
                    'match_score': round(match_result.overall_score * 100),
                    'match_reasons': match_result.match_reasons,
                    'skill_match_score': round(match_result.skill_score * 100)
                })
        
        # Sort by score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return jsonify({
            'success': True, 
            'recommendations': matches[:5]
        }), 200

    except Exception as e:
        logger.error(f"Error recommending mentors: {e}")
        # Do not fabricate mentors on failure (was mock 'Fatima Al Kaabi'/'Ahmed Al
        # Mansoori' with 95/88 scores) — return an honest empty result. (#26)
        return jsonify({
            'success': True,
            'recommendations': [],
            'available': False,
            'message': 'Mentor recommendations are temporarily unavailable.'
        }), 200
