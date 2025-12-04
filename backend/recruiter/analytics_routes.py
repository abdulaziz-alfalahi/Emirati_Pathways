from flask import Blueprint, jsonify
import logging

analytics_bp = Blueprint('analytics_bp', __name__)
logger = logging.getLogger(__name__)

@analytics_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """
    Get recruiter analytics data
    """
    try:
        # Mock data for now
        data = {
            'total_matches': 150,
            'average_score': 75.5,
            'qualification_rate': 60.0,
            'stored_data': {
                'cvs': 45
            }
        }
        
        return jsonify({
            'success': True,
            'data': data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        return jsonify({'error': str(e)}), 500
