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

    # No real demographic source connected — return EMPTY structures with an
    # honest marker rather than fabricated distributions the UI would show as
    # real. (data-honesty audit; supersedes the #26 placeholder-marker approach)
    data = {
        'source': 'unavailable',
        'message': 'Demographics data not yet connected to a real source',
        'age_distribution': [],
        'regional_spread': [],
        'education_levels': []
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

    excel_data = get_cached_demographics() if get_cached_demographics else None

    if excel_data:
        # Derived from the master file (real) + real DB offer count. No fabricated
        # baselines (the old 3054/1514 defaults were invented).
        registered_cnt = excel_data.get('registered', {}).get('total', 0)
        active_cnt = excel_data.get('active', {}).get('total', 0)
        total_placed = max(0, registered_cnt - active_cnt) + (db_offers or 0)
        raw_nomination = excel_data.get('rapid_nomination', [])
        strategic_impact = [
            {'month': item.get('month', ''),
             'placements': item.get('nominated', 0),
             'target': item.get('vacancies', 0)}
            for item in raw_nomination
        ]
    else:
        # Real DB counts only; None surfaces as "not available" when the read failed.
        total_placed = db_offers
        strategic_impact = []

    # emiratization % and economic value have NO real aggregation behind them —
    # return null rather than the old fabricated 82.5% / "2.4B". sector_distribution
    # likewise has no real source, so it is empty, not the invented 35/25/20/10/10.
    data = {
        'kpis': {
            'total_placed': total_placed,
            'active_partners': db_companies,
            'emiratization_target_progress': None,
            'economic_value_aed': None,
            'source': 'partial',
            'message': ('Placements and partners are real counts; emiratization % '
                        'and economic value are not yet connected to a real source.')
        },
        'strategic_impact': strategic_impact,   # from the master file when present, else empty
        'sector_distribution': [],
        'sector_distribution_source': 'unavailable'
    }
    return jsonify({'success': True, 'data': data})

@strategic_metrics_bp.route('/operations-live', methods=['GET'])
@require_roles(*GOVERNANCE_ROLES)
def get_operations_live_metrics():
    """
    Real system-health signals and conversion-funnel counts. Everything here is
    measured or counted; anything without an honest source stays null with a
    marker (uptime_percent — no SLA record exists to derive it from).
    """
    import time as _time

    db_latency_ms = None
    funnel = None
    last_batch = None
    if get_db_connection:
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                _t0 = _time.perf_counter()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                db_latency_ms = round((_time.perf_counter() - _t0) * 1000, 1)

                cursor.execute("SELECT COUNT(*) FROM users WHERE role IN ('candidate', 'job_seeker')")
                signups = cursor.fetchone()[0]
                # "Completed" = the profile was ever actually edited after its
                # (bulk-import) creation. There is no stored completeness score;
                # the definition ships with the number so it can't be misread.
                cursor.execute("""SELECT COUNT(*) FROM candidate_profiles
                                  WHERE updated_at > created_at + INTERVAL '1 minute'""")
                profiles_completed = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM candidate_assessments WHERE LOWER(status) = 'completed'")
                assessments_taken = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM job_applications")
                applications = cursor.fetchone()[0]
                cursor.execute("""SELECT COUNT(*) FROM interview_schedules
                                  WHERE LOWER(status) IN ('completed', 'conducted', 'done')""")
                interviewed = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM job_offers WHERE LOWER(status) IN ('accepted', 'signed')")
                hired = cursor.fetchone()[0]
                funnel = {
                    'signup': signups,
                    'profile_completion': profiles_completed,
                    'assessment_taken': assessments_taken,
                    'job_applied': applications,
                    'interviewed': interviewed,
                    'hired': hired,
                    'source': 'live',
                    'profile_completion_definition': 'profiles edited after creation (no stored completeness score)',
                }
                # NAFIS is a manual CSV import, not a live connector — report the
                # last batch as exactly that.
                cursor.execute("""SELECT status, created_at FROM nafis_import_batches
                                  ORDER BY created_at DESC LIMIT 1""")
                row = cursor.fetchone()
                if row:
                    last_batch = {'status': row[0], 'at': row[1].isoformat() if row[1] else None}
            conn.close()
        except Exception as e:
            logger.warning(f"operations-live probes failed: {e}")

    try:
        from backend.app import online_users as _online
    except ImportError:  # pragma: no cover
        from app import online_users as _online

    data = {
        'system_health': {
            'nafis_sync_status': (
                {'value': last_batch['status'], 'source': 'import_batch_log',
                 'message': 'Status of the most recent manual NAFIS CSV import batch'}
                if last_batch else
                {'value': None, 'source': 'unavailable', 'message': 'No NAFIS import batches recorded'}
            ),
            'last_sync': last_batch['at'] if last_batch else None,
            'last_sync_kind': 'manual_csv_import_batch',
            'db_latency_ms': (
                {'value': db_latency_ms, 'source': 'measured', 'message': 'SELECT 1 roundtrip on an open connection'}
                if db_latency_ms is not None else
                {'value': None, 'source': 'unavailable', 'message': 'DB probe failed'}
            ),
            # Accurate under the 1-worker gunicorn deployment (process-local dict).
            'active_sessions': {'value': len(_online), 'source': 'socketio_presence',
                                'message': 'Authenticated Socket.IO connections right now'},
            'uptime_percent': {'value': None, 'source': 'not_implemented',
                               'message': 'No SLA/availability record exists to derive an uptime percentage from'}
        },
        'live_activity': [],
        'live_activity_source': 'unavailable',
        'funnel_analytics': funnel or {
            'signup': None, 'profile_completion': None, 'assessment_taken': None,
            'job_applied': None, 'interviewed': None, 'hired': None,
            'source': 'unavailable', 'message': 'DB unavailable'
        }
    }
    return jsonify({'success': True, 'data': data})
