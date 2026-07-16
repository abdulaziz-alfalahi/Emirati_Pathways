from flask import Blueprint, jsonify
import logging

try:
    from backend.auth.access_control import require_roles, require_auth, RECRUITER_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, require_auth, RECRUITER_ROLES

analytics_bp = Blueprint('analytics_bp', __name__)
logger = logging.getLogger(__name__)

@analytics_bp.route('/analytics', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_analytics():
    """
    Get recruiter analytics data
    """
    try:
        # Recruiter analytics are not yet wired to real data — return an explicit
        # "not available" instead of the previous fabricated figures
        # (150 matches / 75.5 avg score / 45 CVs). (#26)
        data = {
            'total_matches': None,
            'average_score': None,
            'qualification_rate': None,
            'stored_data': {'cvs': None},
            'available': False,
        }

        return jsonify({
            'success': True,
            'data': data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        return jsonify({'error': str(e)}), 500
