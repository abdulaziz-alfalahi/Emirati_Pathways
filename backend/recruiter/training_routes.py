from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from backend.db import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from backend.auth.access_control import require_roles, require_auth, RECRUITER_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, require_auth, RECRUITER_ROLES

training_bp = Blueprint('training_recommendations', __name__, url_prefix='/api/recruiter/training')


@training_bp.route('/recommend', methods=['POST'])
@require_roles(*RECRUITER_ROLES)
def recommend_training():
    """
    Recommend training programs based on missing skills.
    Expects JSON: { "missing_skills": ["skill1", "skill2"] }
    """
    try:
        data = request.get_json()
        missing_skills = data.get('missing_skills', [])
        
        if not missing_skills:
            return jsonify({'success': True, 'recommendations': []}), 200

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500

        recommendations = []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Simple keyword matching for now
                # In a real system, we'd use vector search or a dedicated skills-to-course mapping
                for skill in missing_skills:
                    query = """
                        SELECT id, curriculum_name, subject, grade_level, description
                        FROM curricula
                        WHERE 
                            LOWER(curriculum_name) LIKE LOWER(%s) OR
                            LOWER(subject) LIKE LOWER(%s) OR
                            LOWER(description) LIKE LOWER(%s)
                        LIMIT 3
                    """
                    search_term = f"%{skill}%"
                    cursor.execute(query, (search_term, search_term, search_term))
                    matches = cursor.fetchall()
                    
                    for match in matches:
                        # Avoid duplicates
                        if not any(r['id'] == match['id'] for r in recommendations):
                            match['matched_skill'] = skill
                            recommendations.append(dict(match))
            
            return jsonify({
                'success': True, 
                'recommendations': recommendations,
                'count': len(recommendations)
            }), 200
            
        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Error recommending training: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
