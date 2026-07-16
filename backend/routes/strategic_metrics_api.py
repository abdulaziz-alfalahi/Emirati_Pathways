from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
try:
    from backend.auth.access_control import require_roles, GOVERNANCE_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, GOVERNANCE_ROLES
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

strategic_metrics_bp = Blueprint('strategic_metrics', __name__, url_prefix='/api/metrics')

try:
    from backend.db import get_db_connection
except ImportError:
    try:
        from db import get_db_connection
    except ImportError:
        get_db_connection = None

try:
    from backend.demographics_parser import get_cached_demographics
except ImportError:
    try:
        from demographics_parser import get_cached_demographics
    except ImportError:
        get_cached_demographics = None

def get_db_counts():
    # On unavailability, return None (surfaced as null "not available") rather than
    # fabricated counts that look like real data. (#26)
    if not get_db_connection:
        return None, None, None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM users WHERE role IN ('candidate', 'job_seeker')")
            db_candidates = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM companies")
            db_companies = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM job_offers")
            db_offers = cursor.fetchone()[0]
            return db_candidates, db_companies, db_offers
    except Exception:
        return None, None, None

@strategic_metrics_bp.route('/demographics', methods=['GET'])
@require_roles(*GOVERNANCE_ROLES)
def get_demographics_metrics():
    """
    Serves structured demographic data (age distribution, education levels, geographic spread) 
    based on the master file.
    """
    if get_cached_demographics:
        excel_data = get_cached_demographics()
        if excel_data:
            return jsonify({'success': True, 'data': excel_data})

    # Legacy Mock fallback if parsing fails
    data = {
        'source': 'placeholder',
        'message': 'Demographics data not yet connected to real source',
        'age_distribution': [
            {'group': '18-25', 'male': 4500, 'female': 5200},
            {'group': '26-35', 'male': 8200, 'female': 7800},
            {'group': '36-45', 'male': 3100, 'female': 2900},
            {'group': '46+', 'male': 1200, 'female': 800}
        ],
        'regional_spread': [
            {'emirate': 'Abu Dhabi', 'candidates': 12500},
            {'emirate': 'Dubai', 'candidates': 10200},
            {'emirate': 'Sharjah', 'candidates': 6800},
            {'emirate': 'Ajman', 'candidates': 1500},
            {'emirate': 'Fujairah', 'candidates': 1100},
            {'emirate': 'Ras Al Khaimah', 'candidates': 1300},
            {'emirate': 'Umm Al Quwain', 'candidates': 300}
        ],
        'education_levels': [
            {'level': 'High School', 'employed': 3500, 'seeking': 2100},
            {'level': 'Diploma', 'employed': 4200, 'seeking': 1800},
            {'level': 'Bachelor', 'employed': 12000, 'seeking': 4500},
            {'level': 'Master+', 'employed': 3100, 'seeking': 800}
        ]
    }
    return jsonify({'success': True, 'data': data})

@strategic_metrics_bp.route('/executive-impact', methods=['GET'])
@require_roles(*GOVERNANCE_ROLES)
def get_executive_impact_metrics():
    """
    Serves high-level KPIs (total placements, economic value generated, target vs. actuals) 
    for the Board Members.
    """
    db_candidates, db_companies, db_offers = get_db_counts()
    
    excel_data = None
    if get_cached_demographics:
        excel_data = get_cached_demographics()
        
    if excel_data:
        registered_cnt = excel_data.get('registered', {}).get('total', 3054)
        active_cnt = excel_data.get('active', {}).get('total', 1514)
        total_placed = max(0, registered_cnt - active_cnt) + (db_offers or 0)
        active_partners = db_companies
        
        # Map monthly rapid nomination data if available
        raw_nomination = excel_data.get('rapid_nomination', [])
        strategic_impact = []
        if raw_nomination:
            for item in raw_nomination:
                strategic_impact.append({
                    'month': item.get('month', ''),
                    'placements': item.get('nominated', 0),
                    'target': item.get('vacancies', 0)
                })
        else:
            strategic_impact = [
                {'month': 'Jan', 'placements': 1200, 'target': 1000, 'source': 'placeholder'},
                {'month': 'Feb', 'placements': 1450, 'target': 1100, 'source': 'placeholder'},
                {'month': 'Mar', 'placements': 1600, 'target': 1200, 'source': 'placeholder'},
                {'month': 'Apr', 'placements': 1350, 'target': 1300, 'source': 'placeholder'},
                {'month': 'May', 'placements': 1800, 'target': 1400, 'source': 'placeholder'},
                {'month': 'Jun', 'placements': 2100, 'target': 1500, 'source': 'placeholder'}
            ]
            
        data = {
            'kpis': {
                'total_placed': total_placed,
                'active_partners': active_partners,
                'emiratization_target_progress': 82.5,
                'economic_value_aed': "2.4B",
                'source': 'placeholder',
                'message': 'KPI values are illustrative — not yet connected to real aggregation'
            },
            'strategic_impact': strategic_impact,
            'sector_distribution': [
                {'name': 'Banking & Finance', 'value': 35},
                {'name': 'Technology', 'value': 25},
                {'name': 'Healthcare', 'value': 20},
                {'name': 'Retail', 'value': 10},
                {'name': 'Manufacturing', 'value': 10}
            ],
            'sector_distribution_source': 'placeholder'
        }
    else:
        # Real counts only — no inflation baselines (was +24500/+1250). None
        # surfaces as null "not available" when the DB read failed. (#26)
        total_placed = db_offers
        active_partners = db_companies
        
        data = {
            'kpis': {
                'total_placed': total_placed,
                'active_partners': active_partners,
                'emiratization_target_progress': 82.5,
                'economic_value_aed': "2.4B",
                'source': 'placeholder',
                'message': 'KPI values are illustrative — not yet connected to real aggregation'
            },
            'strategic_impact': [
                {'month': 'Jan', 'placements': 1200, 'target': 1000, 'source': 'placeholder'},
                {'month': 'Feb', 'placements': 1450, 'target': 1100, 'source': 'placeholder'},
                {'month': 'Mar', 'placements': 1600, 'target': 1200, 'source': 'placeholder'},
                {'month': 'Apr', 'placements': 1350, 'target': 1300, 'source': 'placeholder'},
                {'month': 'May', 'placements': 1800, 'target': 1400, 'source': 'placeholder'},
                {'month': 'Jun', 'placements': 2100, 'target': 1500, 'source': 'placeholder'}
            ],
            'sector_distribution': [
                {'name': 'Banking & Finance', 'value': 35},
                {'name': 'Technology', 'value': 25},
                {'name': 'Healthcare', 'value': 20},
                {'name': 'Retail', 'value': 10},
                {'name': 'Manufacturing', 'value': 10}
            ],
            'sector_distribution_source': 'placeholder'
        }
        
    return jsonify({'success': True, 'data': data})

@strategic_metrics_bp.route('/operations-live', methods=['GET'])
@require_roles(*GOVERNANCE_ROLES)
def get_operations_live_metrics():
    """
    Serves real-time system health, NAFIS sync status, and active user metrics.
    """
    data = {
        'system_health': {
            # No probe is connected — do not assert a health status or uptime we
            # haven't measured. Surfaced as null "not implemented" like the peers. (#26)
            'nafis_sync_status': {'value': None, 'source': 'not_implemented', 'message': 'Real NAFIS sync-status probe not yet connected'},
            'last_sync': None,
            'db_latency_ms': {'value': None, 'source': 'not_implemented', 'message': 'Real latency probe not yet connected'},
            'active_sessions': {'value': None, 'source': 'not_implemented', 'message': 'Real session count not yet connected'},
            'uptime_percent': {'value': None, 'source': 'not_implemented', 'message': 'Real uptime probe not yet connected'}
        },
        'live_activity': [
            {'time': '10:00', 'logins': 120, 'applications': 45},
            {'time': '10:15', 'logins': 135, 'applications': 52},
            {'time': '10:30', 'logins': 150, 'applications': 60},
            {'time': '10:45', 'logins': 142, 'applications': 58},
            {'time': '11:00', 'logins': 160, 'applications': 75},
            {'time': '11:15', 'logins': 180, 'applications': 82}
        ],
        'live_activity_source': 'placeholder',
        'funnel_analytics': {
            'signup': 5000,
            'profile_completion': 3800,
            'assessment_taken': 2900,
            'job_applied': 2100,
            'interviewed': 850,
            'hired': 320,
            'source': 'placeholder'
        }
    }
    return jsonify({'success': True, 'data': data})
