"""
Demographics & Executive Analytics API
Serves data for the Demographics Analytics and Executive Dashboard.
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from psycopg2.extras import RealDictCursor
from backend.db import get_db_connection
import logging

logger = logging.getLogger(__name__)

demographics_bp = Blueprint('demographics', __name__, url_prefix='/api/analytics')

def get_db():
    return get_db_connection()

@demographics_bp.route('/demographics/main', methods=['GET'])
@jwt_required()
def get_main_demographics():
    """
    Returns data for the Main JS Dashboard: Gender, Age Group, Education, Employment Status
    """
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Gender
        cur.execute("SELECT COALESCE(gender, 'Unknown') as name, COUNT(*) as value FROM nafis_job_seekers GROUP BY gender")
        gender_data = cur.fetchall()

        # Age Group
        cur.execute("SELECT COALESCE(age_group, 'Unknown') as name, COUNT(*) as value FROM nafis_job_seekers GROUP BY age_group ORDER BY name")
        age_data = cur.fetchall()

        # Education
        cur.execute("SELECT COALESCE(education_level, 'Unknown') as name, COUNT(*) as value FROM nafis_job_seekers GROUP BY education_level ORDER BY value DESC LIMIT 10")
        education_data = cur.fetchall()

        # Employment Status (job_seeker_type)
        cur.execute("SELECT COALESCE(job_seeker_type, 'Unknown') as name, COUNT(*) as value FROM nafis_job_seekers GROUP BY job_seeker_type ORDER BY value DESC")
        employment_data = cur.fetchall()

        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'gender': gender_data,
                'age_group': age_data,
                'education': education_data,
                'employment': employment_data
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching main demographics: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@demographics_bp.route('/demographics/priority', methods=['GET'])
@jwt_required()
def get_priority_demographics():
    """
    Returns data for 2nd/3rd Priority JS Dashboards: Military, Marital, Emirate
    """
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Military Status
        cur.execute("SELECT COALESCE(national_service, 'Unknown') as name, COUNT(*) as value FROM nafis_job_seekers GROUP BY national_service")
        military_data = cur.fetchall()

        # Marital Status
        cur.execute("SELECT COALESCE(marital_status, 'Unknown') as name, COUNT(*) as value FROM nafis_job_seekers GROUP BY marital_status")
        marital_data = cur.fetchall()

        # Emirate of Residence
        cur.execute("SELECT COALESCE(emirate_of_residence, 'Unknown') as name, COUNT(*) as value FROM nafis_job_seekers GROUP BY emirate_of_residence ORDER BY value DESC")
        emirate_data = cur.fetchall()

        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'military': military_data,
                'marital': marital_data,
                'emirate': emirate_data
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching priority demographics: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@demographics_bp.route('/executive', methods=['GET'])
@jwt_required()
def get_executive_impact():
    """
    Returns data for the Executive Impact Dashboard.
    """
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Active JS Indicator (Total vs Placed)
        cur.execute("SELECT COUNT(*) as c FROM nafis_job_seekers")
        total_seekers = int(cur.fetchone()['c'] or 0)

        cur.execute("SELECT COUNT(*) as c FROM job_offers WHERE LOWER(status) IN ('accepted', 'signed')")
        total_placements = int(cur.fetchone()['c'] or 0)
        
        active_js = total_seekers - total_placements if total_seekers > total_placements else total_seekers
        
        # 2. EHRDC Initiatives — no real source for these internal metrics; do not
        # fabricate them from arbitrary multipliers of placements (was *1.5 / *0.8). (#26)
        fast_track_nominations = None
        proactive_hiring = None

        # 3. Employer Participation
        cur.execute("SELECT COUNT(*) as c FROM companies")
        total_companies = int(cur.fetchone()['c'] or 0)

        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_seekers': total_seekers,
                'total_placements': total_placements,
                'active_js': active_js,
                'fast_track_nominations': fast_track_nominations,
                'proactive_hiring': proactive_hiring,
                'total_companies': total_companies
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching executive impact: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
