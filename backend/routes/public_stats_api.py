"""
Public platform statistics for the (pre-login) homepage.

Serves REAL aggregate counts — no auth, no PII — so the landing page can show genuine
numbers instead of the hardcoded marketing figures it used to display
(10,000 users / 500 companies / 2,500 mentors / 15,000 placements). (audit INT-01)
"""
import logging
from flask import Blueprint, jsonify

logger = logging.getLogger(__name__)

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query

public_stats_bp = Blueprint('public_stats', __name__, url_prefix='/api/public')


def _count(sql):
    try:
        row = execute_query(sql, fetch_one=True)
        return (row or {}).get('c', 0) or 0
    except Exception as e:
        logger.warning(f"public stat query failed: {e}")
        return None


@public_stats_bp.route('/platform-stats', methods=['GET'])
def platform_stats():
    """Real platform counts for the public homepage (aggregate only, no PII)."""
    data = {
        'active_users': _count("SELECT COUNT(*) AS c FROM users WHERE role IN ('candidate', 'job_seeker')"),
        'partner_companies': _count("SELECT COUNT(*) AS c FROM companies"),
        'expert_mentors': _count("SELECT COUNT(*) AS c FROM users WHERE role = 'mentor' OR secondary_roles::text ILIKE '%mentor%'"),
        'successful_placements': _count("SELECT COUNT(*) AS c FROM job_offers WHERE LOWER(status) IN ('accepted', 'signed', 'hired')"),
        'active_jobs': _count("SELECT COUNT(*) AS c FROM job_postings WHERE status IN ('active', 'published')"),
    }
    return jsonify({'success': True, 'data': data})
