"""
Operations Monitoring Center — Backend API
Provides real-time platform metrics from the database.
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
try:
    from backend.auth.access_control import require_roles, OPERATOR_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, OPERATOR_ROLES
from datetime import datetime, timedelta, date
import logging
from psycopg2.extras import RealDictCursor
from backend.db import get_db_connection

logger = logging.getLogger(__name__)

operations_bp = Blueprint('operations', __name__, url_prefix='/api/operations')


def get_db():
    conn = get_db_connection()
    return conn


def safe_int(val):
    """Safely convert a DB value to int."""
    if val is None:
        return 0
    return int(val)


@operations_bp.route('/stats', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_operations_stats():
    """
    Returns all metrics for the Operations Monitoring Center.
    One endpoint — all sections.
    """
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        now = datetime.utcnow()
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday

        # ─── 1. Platform Health ───────────────────────────────────────────
        cur.execute("SELECT COUNT(*) as c FROM users")
        total_users = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM users WHERE created_at::date = %s", (today,))
        registrations_today = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM users WHERE created_at::date >= %s", (week_start,))
        registrations_week = safe_int(cur.fetchone()['c'])

        platform_health = {
            'total_users': total_users,
            'registrations_today': registrations_today,
            'registrations_week': registrations_week,
            # No real uptime/latency probe is connected — return null instead of
            # asserting measured values we haven't measured. (#26)
            'uptime': None,
            'response_time': None,
        }

        # ─── 2. Talent Pipeline ───────────────────────────────────────────
        cur.execute("SELECT COUNT(*) as c FROM candidate_profiles")
        total_candidates = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM user_cvs")
        total_cvs = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM job_applications")
        total_applications = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM job_applications WHERE submitted_at >= %s", (week_start,))
        applications_week = safe_int(cur.fetchone()['c'])

        # Placements = accepted offers
        cur.execute("SELECT COUNT(*) as c FROM job_offers WHERE LOWER(status) IN ('accepted', 'signed')")
        placements = safe_int(cur.fetchone()['c'])

        talent_pipeline = {
            'total_candidates': total_candidates,
            'total_cvs': total_cvs,
            'total_applications': total_applications,
            'applications_week': applications_week,
            'placements': placements,
        }

        # ─── 3. Employer Activity ─────────────────────────────────────────
        cur.execute("SELECT COUNT(*) as c FROM companies")
        total_companies = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM job_postings WHERE LOWER(status) = 'published' OR status IS NULL")
        active_vacancies = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM job_postings")
        total_jobs = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM job_postings WHERE created_at::date >= %s", (week_start,))
        new_jobs_week = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM job_offers")
        total_offers = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM job_offers WHERE created_at::date >= %s", (week_start,))
        offers_week = safe_int(cur.fetchone()['c'])

        # Calculate recruiter responsiveness rates
        try:
            # 1. Avg response time (days) for applications moved out of pending status
            cur.execute("""
                SELECT AVG(EXTRACT(EPOCH FROM (updated_at - submitted_at))/86400) as avg_days
                FROM job_applications 
                WHERE status IS NOT NULL AND LOWER(status) != 'pending' AND submitted_at IS NOT NULL
            """)
            avg_resp_row = cur.fetchone()
            # Null when there's no data — do not substitute a fabricated 4.2. (#26)
            avg_response_days = round(float(avg_resp_row['avg_days']), 1) if avg_resp_row and avg_resp_row['avg_days'] is not None else None
        except Exception as e:
            logger.warning(f"Error calculating avg response days: {e}")
            conn.rollback()
            avg_response_days = None

        try:
            # 2. Response rate (%)
            cur.execute("""
                SELECT 
                    COUNT(CASE WHEN LOWER(status) != 'pending' THEN 1 END) as reviewed,
                    COUNT(*) as total
                FROM job_applications
            """)
            rate_row = cur.fetchone()
            if rate_row and rate_row['total'] > 0:
                response_rate = round((rate_row['reviewed'] / rate_row['total']) * 100, 1)
            else:
                # No applications yet — null, not a fabricated 82.0. (#26)
                response_rate = None
        except Exception as e:
            logger.warning(f"Error calculating response rate: {e}")
            conn.rollback()
            response_rate = None

        employer_activity = {
            'total_companies': total_companies,
            'active_vacancies': active_vacancies,
            'total_jobs': total_jobs,
            'new_jobs_week': new_jobs_week,
            'total_offers': total_offers,
            'offers_week': offers_week,
            'avg_recruiter_response_days': avg_response_days,
            'recruiter_response_rate': response_rate,
        }

        # ─── 4. Interview Tracker ─────────────────────────────────────────
        # Conducted today
        cur.execute("""
            SELECT COUNT(*) as c FROM interview_schedules 
            WHERE scheduled_date = %s AND LOWER(status) IN ('completed', 'conducted', 'done')
        """, (today,))
        interviews_conducted_today = safe_int(cur.fetchone()['c'])

        # Conducted this week
        cur.execute("""
            SELECT COUNT(*) as c FROM interview_schedules 
            WHERE scheduled_date >= %s AND LOWER(status) IN ('completed', 'conducted', 'done')
        """, (week_start,))
        interviews_conducted_week = safe_int(cur.fetchone()['c'])

        # Ongoing right now (scheduled today, status = in_progress/started, or time overlap)
        cur.execute("""
            SELECT COUNT(*) as c FROM interview_schedules 
            WHERE scheduled_date = %s AND LOWER(status) IN ('in_progress', 'started', 'ongoing')
        """, (today,))
        interviews_ongoing = safe_int(cur.fetchone()['c'])

        # Upcoming today (scheduled today, not yet started)
        cur.execute("""
            SELECT COUNT(*) as c FROM interview_schedules 
            WHERE scheduled_date = %s AND LOWER(status) IN ('scheduled', 'confirmed', 'pending')
        """, (today,))
        interviews_upcoming_today = safe_int(cur.fetchone()['c'])

        # Upcoming this week (scheduled this week, not yet conducted)
        cur.execute("""
            SELECT COUNT(*) as c FROM interview_schedules 
            WHERE scheduled_date >= %s AND scheduled_date <= %s
            AND LOWER(status) IN ('scheduled', 'confirmed', 'pending')
        """, (today, week_start + timedelta(days=6)))
        interviews_upcoming_week = safe_int(cur.fetchone()['c'])

        # Total interviews ever
        cur.execute("SELECT COUNT(*) as c FROM interview_schedules")
        interviews_total = safe_int(cur.fetchone()['c'])

        interview_tracker = {
            'conducted_today': interviews_conducted_today,
            'conducted_week': interviews_conducted_week,
            'ongoing': interviews_ongoing,
            'upcoming_today': interviews_upcoming_today,
            'upcoming_week': interviews_upcoming_week,
            'total': interviews_total,
        }

        # ─── 5. Shortlisted & Rejected ────────────────────────────────────
        cur.execute("""
            SELECT COUNT(*) as c FROM shortlisted_candidates 
            WHERE LOWER(status) = 'shortlisted' AND created_at::date >= %s
        """, (week_start,))
        shortlisted_week = safe_int(cur.fetchone()['c'])

        cur.execute("""
            SELECT COUNT(*) as c FROM shortlisted_candidates 
            WHERE LOWER(status) IN ('rejected', 'declined') AND created_at::date >= %s
        """, (week_start,))
        rejected_week = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM shortlisted_candidates WHERE LOWER(status) = 'shortlisted'")
        shortlisted_total = safe_int(cur.fetchone()['c'])

        cur.execute("SELECT COUNT(*) as c FROM shortlisted_candidates WHERE LOWER(status) IN ('rejected', 'declined')")
        rejected_total = safe_int(cur.fetchone()['c'])

        shortlist_stats = {
            'shortlisted_week': shortlisted_week,
            'rejected_week': rejected_week,
            'shortlisted_total': shortlisted_total,
            'rejected_total': rejected_total,
        }

        # ─── 6. Emiratization ─────────────────────────────────────────────
        cur.execute("""
            SELECT 
                COALESCE(department, 'Other') as sector,
                COUNT(*) as total_jobs,
                AVG(COALESCE(emiratization_target, 0)) as avg_target
            FROM job_postings 
            WHERE department IS NOT NULL
            GROUP BY department 
            ORDER BY total_jobs DESC
            LIMIT 8
        """)
        sectors = []
        for row in cur.fetchall():
            sectors.append({
                'name': row['sector'],
                'total_jobs': safe_int(row['total_jobs']),
                'target': round(float(row['avg_target'] or 0), 1),
            })

        emiratization = {
            'sectors': sectors,
        }

        # ─── 7. User Role Distribution ────────────────────────────────────
        cur.execute("""
            SELECT role, COUNT(*) as cnt 
            FROM users WHERE role IS NOT NULL 
            GROUP BY role ORDER BY cnt DESC
        """)
        role_distribution = {}
        for row in cur.fetchall():
            role_distribution[row['role']] = safe_int(row['cnt'])

        # ─── 8. Live Feed ─────────────────────────────────────────────────
        feed_items = []

        # Recent user registrations
        try:
            cur.execute("""
                SELECT full_name, role, created_at 
                FROM users WHERE created_at IS NOT NULL 
                ORDER BY created_at DESC LIMIT 3
            """)
            for row in cur.fetchall():
                name = row.get('full_name') or 'New user'
                role = (row.get('role') or 'user').replace('_', ' ').title()
                feed_items.append({
                    'text': f"{name} joined as {role}",
                    'time': row['created_at'].isoformat() if row.get('created_at') else '',
                    'type': 'user',
                })
        except Exception as e:
            logger.warning(f"Feed users query failed: {e}")
            conn.rollback()

        # Recent job postings (cast company_id to text for JOIN since companies.id is uuid)
        try:
            cur.execute("""
                SELECT jp.title, c.company_name, jp.created_at
                FROM job_postings jp 
                LEFT JOIN companies c ON jp.company_id = c.id
                WHERE jp.created_at IS NOT NULL
                ORDER BY jp.created_at DESC LIMIT 3
            """)
            for row in cur.fetchall():
                company = row.get('company_name') or 'A company'
                title = row.get('title') or 'a new position'
                feed_items.append({
                    'text': f"{company} posted '{title}'",
                    'time': row['created_at'].isoformat() if row.get('created_at') else '',
                    'type': 'job',
                })
        except Exception as e:
            logger.warning(f"Feed jobs query failed: {e}")
            conn.rollback()

        # Recent applications
        try:
            cur.execute("""
                SELECT ja.status, ja.submitted_at, u.full_name
                FROM job_applications ja
                LEFT JOIN users u ON u.id = ja.candidate_id
                WHERE ja.submitted_at IS NOT NULL
                ORDER BY ja.submitted_at DESC LIMIT 3
            """)
            for row in cur.fetchall():
                name = row.get('full_name') or 'A candidate'
                feed_items.append({
                    'text': f"{name} submitted an application",
                    'time': row['submitted_at'].isoformat() if row.get('submitted_at') else '',
                    'type': 'application',
                })
        except Exception as e:
            logger.warning(f"Feed applications query failed: {e}")
            conn.rollback()

        # Sort by time descending
        feed_items.sort(key=lambda x: x.get('time', ''), reverse=True)
        feed_items = feed_items[:8]

        # Calculate relative time
        for item in feed_items:
            if item['time']:
                try:
                    t = datetime.fromisoformat(item['time'].replace('+00:00', '').replace('Z', ''))
                    delta = now - t
                    if delta.days > 0:
                        item['relative'] = f"{delta.days}d"
                    elif delta.seconds >= 3600:
                        item['relative'] = f"{delta.seconds // 3600}h"
                    elif delta.seconds >= 60:
                        item['relative'] = f"{delta.seconds // 60}m"
                    else:
                        item['relative'] = 'now'
                except:
                    item['relative'] = ''
            else:
                item['relative'] = ''

        conn.close()

        return jsonify({
            'success': True,
            'data': {
                'platform_health': platform_health,
                'talent_pipeline': talent_pipeline,
                'employer_activity': employer_activity,
                'interview_tracker': interview_tracker,
                'shortlist_stats': shortlist_stats,
                'emiratization': emiratization,
                'role_distribution': role_distribution,
                'live_feed': feed_items,
                'generated_at': now.isoformat(),
            }
        }), 200

    except Exception as e:
        logger.error(f"Operations stats error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500
