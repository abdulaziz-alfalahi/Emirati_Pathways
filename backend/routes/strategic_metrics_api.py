from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
import random

strategic_metrics_bp = Blueprint('strategic_metrics', __name__, url_prefix='/api/metrics')

@strategic_metrics_bp.route('/demographics', methods=['GET'])
# @jwt_required()
def get_demographics_metrics():
    """
    Serves structured demographic data (age distribution, education levels, geographic spread) 
    based on the master file.
    """
    data = {
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
# @jwt_required()
def get_executive_impact_metrics():
    """
    Serves high-level KPIs (total placements, economic value generated, target vs. actuals) 
    for the Board Members.
    """
    data = {
        'kpis': {
            'total_placed': 24500,
            'active_partners': 1250,
            'emiratization_target_progress': 82.5,
            'economic_value_aed': "2.4B"
        },
        'strategic_impact': [
            {'month': 'Jan', 'placements': 1200, 'target': 1000},
            {'month': 'Feb', 'placements': 1450, 'target': 1100},
            {'month': 'Mar', 'placements': 1600, 'target': 1200},
            {'month': 'Apr', 'placements': 1350, 'target': 1300},
            {'month': 'May', 'placements': 1800, 'target': 1400},
            {'month': 'Jun', 'placements': 2100, 'target': 1500}
        ],
        'sector_distribution': [
            {'name': 'Banking & Finance', 'value': 35},
            {'name': 'Technology', 'value': 25},
            {'name': 'Healthcare', 'value': 20},
            {'name': 'Retail', 'value': 10},
            {'name': 'Manufacturing', 'value': 10}
        ]
    }
    return jsonify({'success': True, 'data': data})

@strategic_metrics_bp.route('/operations-live', methods=['GET'])
# @jwt_required()
def get_operations_live_metrics():
    """
    Serves real-time system health, NAFIS sync status, and active user metrics.
    """
    # Generating some random fluctuations for a "live" feel
    base_latency = 45
    
    data = {
        'system_health': {
            'nafis_sync_status': 'Operational',
            'last_sync': datetime.utcnow().isoformat(),
            'db_latency_ms': base_latency + random.randint(-10, 20),
            'active_sessions': 1240 + random.randint(-50, 50),
            'uptime_percent': 99.98
        },
        'live_activity': [
            {'time': '10:00', 'logins': 120, 'applications': 45},
            {'time': '10:15', 'logins': 135, 'applications': 52},
            {'time': '10:30', 'logins': 150, 'applications': 60},
            {'time': '10:45', 'logins': 142, 'applications': 58},
            {'time': '11:00', 'logins': 160, 'applications': 75},
            {'time': '11:15', 'logins': 180, 'applications': 82}
        ],
        'funnel_analytics': {
            'signup': 5000,
            'profile_completion': 3800,
            'assessment_taken': 2900,
            'job_applied': 2100,
            'interviewed': 850,
            'hired': 320
        }
    }
    return jsonify({'success': True, 'data': data})
