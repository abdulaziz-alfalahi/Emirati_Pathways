from flask import Blueprint, jsonify, request
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
            # Real placements only: an application that reached 'hired' or an
            # offer the candidate accepted. Counting ALL job_offers (including
            # pending ones) overstated it, and the caller then added roster
            # attrition on top — see below.
            cursor.execute("""
                SELECT
                  (SELECT COUNT(*) FROM job_applications
                    WHERE LOWER(status) IN ('hired', 'placed')) +
                  (SELECT COUNT(*) FROM job_offers
                    WHERE LOWER(COALESCE(status, '')) IN ('accepted', 'signed'))
            """)
            db_offers = cursor.fetchone()[0]
            return db_candidates, db_companies, db_offers
    except Exception:
        return None, None, None

# The demographics page calls THIS endpoint — /api/metrics/demographics — not
# the similarly named ones in demographics_routes.py (/api/analytics/...), which
# nothing in the product calls. Widening those instead would have opened two
# endpoints nobody uses and left this one refusing.
#
# career_services_operator added with the route (owner decision 2026-08-15).
# Aggregate counts only, and these operators already see every candidate's name,
# Emirates ID and phone in the CRM roster — so this is strictly less than they
# are trusted with, not more.
@strategic_metrics_bp.route('/demographics', methods=['GET'])
@require_roles(*(GOVERNANCE_ROLES | {'career_services_operator'}))
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
        # Placements are COUNTED, never inferred. This used to report
        # (registered - still active) + offers as "Total Placements" — i.e.
        # roster attrition relabelled as jobs found, which produced 1,542
        # placements on a platform with zero hires (feedback: "the number
        # incorrect 1542 what does it mean?"). People leave the active roster
        # for many reasons; that figure is reported separately and honestly.
        total_placed = db_offers
        roster_exits = max(0, registered_cnt - active_cnt)
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
        roster_exits = None
        strategic_impact = []

    # Board-requested headline counts (fb_1787129939): "the board members should
    # see the total number of active JS, the total number of employees from
    # Dubai, and the total number of active vacancies".
    #
    # Two of the three are real counts. The third is NOT, and is deliberately
    # not faked:
    #
    #   active_jobseekers   — candidate_profiles carrying an ActiveJobseeker
    #                         type from NAFIS. A real count of this platform's
    #                         roster.
    #   active_vacancies    — PUBLISHED postings only. 'pending_verification'
    #                         and 'draft' are not vacancies anyone can apply to,
    #                         and counting them would inflate the figure roughly
    #                         fortyfold today.
    #   employed_on_roster  — candidates the CRM records as Working. This is NOT
    #                         "total employees from Dubai": that is a
    #                         MOHRE-wide figure the platform does not hold. It
    #                         is named for what it actually counts, and
    #                         dubai_employees_total stays None so nobody reads
    #                         the roster number as the emirate's.
    active_jobseekers = active_vacancies = employed_on_roster = None
    # get_db_connection, matching the rest of this module — it does not import
    # db_utils, and reaching for execute_query here would have been an
    # ImportError at request time rather than a visible one at boot.
    if get_db_connection:
        _conn = None
        try:
            _conn = get_db_connection()
            with _conn.cursor() as _cur:
                _cur.execute("""SELECT COUNT(*) FROM candidate_profiles
                                 WHERE job_seeker_type ILIKE '%%ActiveJobseeker%%'""")
                active_jobseekers = int(_cur.fetchone()[0])
                _cur.execute("SELECT COUNT(*) FROM job_postings WHERE status = 'published'")
                active_vacancies = int(_cur.fetchone()[0])
                _cur.execute("""SELECT COUNT(*) FROM candidate_profiles
                                 WHERE work_status = 'Working'""")
                employed_on_roster = int(_cur.fetchone()[0])
        except Exception as _e:
            # None, not 0. A failed read must not tell the board there are no
            # jobseekers and no vacancies.
            logger.warning(f"board headline counts failed: {_e}")
        finally:
            if _conn:
                try:
                    _conn.close()
                except Exception:
                    pass

    # emiratization % and economic value have NO real aggregation behind them —
    # return null rather than the old fabricated 82.5% / "2.4B". sector_distribution
    # likewise has no real source, so it is empty, not the invented 35/25/20/10/10.
    data = {
        'kpis': {
            'total_placed': total_placed,
            # Left the active job-seeker roster — NOT placements.
            'roster_exits': roster_exits,
            'active_partners': db_companies,
            'active_jobseekers': active_jobseekers,
            'active_vacancies': active_vacancies,
            'employed_on_roster': employed_on_roster,
            # The emirate-wide employed figure would come from MOHRE, which the
            # platform does not hold. Explicitly null so employed_on_roster is
            # never read as standing in for it.
            'dubai_employees_total': None,
            'emiratization_target_progress': None,
            'economic_value_aed': None,
            'source': 'partial',
            'message': ('Placements are counted from confirmed hires and accepted '
                        'offers; partners is a real count. Roster exits are people no '
                        'longer on the active job-seeker roster, which is NOT the same '
                        'as being placed. Emiratization % and economic value are not '
                        'yet connected to a real source. Active vacancies counts '
                        'PUBLISHED postings only. Employed on roster counts '
                        'candidates this platform records as working — it is NOT '
                        'the total number of employees in Dubai, which would come '
                        'from MOHRE and is not available.')
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


# ── The three population numbers, defined once (owner request 2026-08-21) ────
#
# "I need the number of employed Emiratis and their details. I need the number
#  of Job seekers and their details. I also need the number of Emiratis who were
#  onboarded and started using the platform. These numbers are for different
#  viewers."
#
# One endpoint, one set of definitions (backend/populations.py), and the SAME
# totals for every reader. What changes by audience is DETAIL, never the number:
# a board paper and a CRM screen disagreeing about how many job seekers exist
# would discredit both.
#
# RECORDED vs REGISTERED is returned for every population, because the gap is
# currently enormous — 5,309 candidate records, 37 of whom have ever signed in —
# and a single figure would be a false statement whichever one was chosen.

@strategic_metrics_bp.route('/populations', methods=['GET'])
@require_roles(*(GOVERNANCE_ROLES | {'career_services_operator', 'call_center_agent',
                                     'recruiter', 'employer_admin', 'talent_operator'}))
def population_summary():
    """How many people are employed, seeking, and actually using the platform."""
    try:
        from flask import request as _rq
        try:
            from backend import populations as pop
            from backend.auth.access_control import resolve_roles
        except ImportError:  # pragma: no cover — the app runs under both roots
            import populations as pop
            from auth.access_control import resolve_roles

        roles = resolve_roles() or set()
        members_only = bool(roles & pop.AUDIENCE_MEMBERS_ONLY) and not (roles & GOVERNANCE_ROLES)

        conn = get_db_connection()
        cur = conn.cursor()

        def count(where_sql, members=False):
            sql = f"""
                SELECT COUNT(*) FROM users u
                LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
                 WHERE u.role IN ('candidate','job_seeker')
                   AND u.is_active IS TRUE
                   AND ({where_sql})
            """
            if members:
                sql += f" AND {pop.MEMBER_PREDICATE}"
            cur.execute(sql)
            return cur.fetchone()[0]

        data = {}
        for key, spec in pop.POPULATIONS.items():
            recorded = count(spec['sql'])
            registered = count(spec['sql'], members=True)
            entry = {
                'label_en': spec['label_en'],
                'label_ar': spec['label_ar'],
                'means': spec['means'],
                # Registered is always present. Recorded is withheld from
                # employer-side readers, who must not be given a headline that
                # counts people they cannot contact.
                'registered': registered,
            }
            if not members_only:
                entry['recorded'] = recorded
            data[key] = entry

        # Onboarded: the third number asked for. Everyone who has signed in,
        # whatever their employment status.
        cur.execute(f"""
            SELECT COUNT(*) FROM users u
             WHERE u.role IN ('candidate','job_seeker') AND u.is_active IS TRUE
               AND {pop.MEMBER_PREDICATE}
        """)
        onboarded = cur.fetchone()[0]
        cur.execute("""
            SELECT COUNT(*) FROM users u
             WHERE u.role IN ('candidate','job_seeker') AND u.is_active IS TRUE
               AND u.uaepass_uuid IS NOT NULL
        """)
        via_uaepass = cur.fetchone()[0]
        cur.execute("""
            SELECT COUNT(*) FROM users u
             WHERE u.role IN ('candidate','job_seeker') AND u.is_active IS TRUE
        """)
        total_recorded = cur.fetchone()[0]
        cur.close(); conn.close()

        result = {
            'populations': data,
            'onboarded': {
                'label_en': 'Onboarded and using the platform',
                'label_ar': 'انضموا ويستخدمون المنصة',
                'signed_in': onboarded,
                'via_uaepass': via_uaepass,
                'means': 'Has authenticated at least once. Derived from sign-in, '
                         'not a flag, so it becomes true the moment someone joins.',
            },
            'scope_note': pop.scope_note('recruiter' if members_only else 'board'),
            'members_only': members_only,
        }
        if not members_only:
            result['onboarded']['recorded_total'] = total_recorded
            result['onboarded']['not_yet_signed_in'] = total_recorded - onboarded
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        logger.error(f"population summary failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load population figures'}), 500


# ── Emirati private-sector employment over time (owner request 2026-08-21) ───

@strategic_metrics_bp.route('/employment-timeline', methods=['GET'])
@require_roles(*(GOVERNANCE_ROLES | {'career_services_operator', 'talent_operator'}))
def employment_timeline():
    """When Emiratis started their current private-sector jobs, by year.

    THE CAVEAT IS PART OF THE ANSWER. This is built from people employed
    RIGHT NOW, so it undercounts every earlier year: someone who started in 2016
    and has since left is not in the file at all. The rise from 529 starts in
    2021 to 10,470 in 2025 is therefore partly real hiring growth and partly
    survivorship — recent jobs are simply more likely to still be running.

    Presented without that sentence the chart would read as a fivefold increase
    in Emirati private-sector hiring, which the data cannot support on its own.
    The basis string travels with the numbers so the caveat cannot be lost
    between here and a board slide.

    Sector breakdown is included for the same period because "which sectors are
    absorbing Emiratis" is the question that follows immediately.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # NAFIS support is counted alongside the hires, because the RATE is the
        # more robust number here. Survivorship distorts the raw counts — only
        # people still employed appear — but it distorts the numerator and
        # denominator of a percentage together, so the proportion on support
        # survives that bias far better than the totals do.
        cur.execute("""
            SELECT date_part('year', job_start_date)::int AS yr,
                   COUNT(*) AS n,
                   COUNT(*) FILTER (WHERE salary_support) AS supported
              FROM private_sector_employment
             WHERE job_start_date IS NOT NULL
               AND job_start_date >= DATE '2010-01-01'
             GROUP BY 1 ORDER BY 1
        """)
        by_year = [{
            'year': r[0],
            'starts': r[1],
            'nafis_supported': r[2],
            'nafis_support_pct': round(r[2] / r[1] * 100, 1) if r[1] else None,
        } for r in cur.fetchall()]

        # Running total of people whose CURRENT job began on or before each year.
        running = 0
        for row in by_year:
            running += row['starts']
            row['cumulative'] = running

        cur.execute("""
            SELECT date_part('year', job_start_date)::int AS yr,
                   COALESCE(NULLIF(company_sector, ''), 'Unspecified') AS sector,
                   COUNT(*) AS n
              FROM private_sector_employment
             WHERE job_start_date IS NOT NULL
               AND job_start_date >= DATE '2021-01-01'
             GROUP BY 1, 2 ORDER BY 1, 3 DESC
        """)
        by_sector = {}
        for yr, sector, n in cur.fetchall():
            by_sector.setdefault(str(yr), []).append({'sector': sector, 'starts': n})

        cur.execute("SELECT COUNT(*) FROM private_sector_employment WHERE job_start_date IS NULL")
        undated = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM private_sector_employment")
        total = cur.fetchone()[0]
        cur.close(); conn.close()

        return jsonify({'success': True, 'data': {
            'by_year': by_year,
            'by_sector': by_sector,
            'total_records': total,
            'undated': undated,
            'basis': (
                'Counts when people in current private-sector employment started '
                'that job. Earlier years are UNDERCOUNTED: anyone who has since '
                'left is not in the source, so the upward trend is part real '
                'hiring growth and part survivorship. Not a measure of total '
                'hiring in any given year.'),
            'nafis_basis': (
                'Share of each hiring cohort currently receiving NAFIS salary '
                'support (meaning confirmed 2026-08-21). The RATE is more '
                'reliable than the counts above, because survivorship affects '
                'its numerator and denominator together. The most recent year '
                'reads low because support for very recent hires may not yet be '
                'in payment, not because fewer of them qualify.'),
        }})
    except Exception as e:
        logger.error(f"employment timeline failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load the employment timeline'}), 500


# ── Employer onboarding targets (owner request 2026-08-21) ───────────────────

@strategic_metrics_bp.route('/employer-targets', methods=['GET'])
@require_roles(*(GOVERNANCE_ROLES | {'talent_operator', 'employer_relations',
                                     'growth_operator', 'career_services_operator'}))
def employer_targets():
    """Employers of Emiratis, ranked by how many they employ.

    TWO THINGS MAKE THIS LESS ACTIONABLE THAN IT LOOKS, and both are returned
    rather than left for someone to discover:

    1. WE HAVE NO NAME FOR MOST OF THEM. The source file carries a company CODE
       and nothing else, so of 9,822 employers we can name 113 — the ones
       already on the platform. An operator handed "163801, 401 Emiratis"
       cannot act on it without resolving that code against a licensing source.
       The ranking is still useful for deciding WHICH codes are worth resolving
       first.

    2. IT IS A LONG TAIL, NOT A SHORTLIST. The top 100 employers account for
       20% of employed Emiratis; 53% of employers have exactly one. Onboarding
       cannot cover this population one company at a time, and a "top targets"
       list read without that context would suggest it can.
    """
    try:
        limit = min(int(request.args.get('limit', 50)), 500)
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT p.company_code,
                   COUNT(*) AS emiratis,
                   COUNT(*) FILTER (WHERE p.salary_support) AS on_nafis,
                   MODE() WITHIN GROUP (ORDER BY p.company_sector) AS sector,
                   MAX(co.company_name) AS company_name,
                   BOOL_OR(co.id IS NOT NULL) AS onboarded
              FROM private_sector_employment p
              LEFT JOIN companies co ON co.company_code = p.company_code
             WHERE p.company_code IS NOT NULL AND p.company_code <> '0'
             GROUP BY p.company_code
             ORDER BY emiratis DESC
             LIMIT %s
        """, (limit,))
        targets = [{
            'company_code': r[0],
            'emiratis': r[1],
            'on_nafis': r[2],
            'nafis_pct': round(r[2] / r[1] * 100) if r[1] else None,
            'sector': r[3],
            'company_name': r[4],
            'onboarded': bool(r[5]),
        } for r in cur.fetchall()]

        cur.execute("""
            SELECT COUNT(DISTINCT company_code),
                   COUNT(DISTINCT company_code) FILTER (
                       WHERE company_code IN (SELECT company_code FROM companies
                                               WHERE company_code IS NOT NULL))
              FROM private_sector_employment
             WHERE company_code IS NOT NULL AND company_code <> '0'
        """)
        total_employers, named = cur.fetchone()

        # Concentration, so the long tail is visible rather than inferred from a
        # list that necessarily shows only the head of it.
        cur.execute("""
            WITH ranked AS (
                SELECT COUNT(*) AS n FROM private_sector_employment
                 WHERE company_code IS NOT NULL AND company_code <> '0'
                 GROUP BY company_code ORDER BY n DESC)
            SELECT (SELECT SUM(n) FROM ranked),
                   (SELECT SUM(n) FROM (SELECT n FROM ranked LIMIT 100) x),
                   (SELECT COUNT(*) FROM ranked WHERE n = 1)
        """)
        covered, top100, singles = cur.fetchone()
        cur.close(); conn.close()

        return jsonify({'success': True, 'data': {
            'targets': targets,
            'total_employers': total_employers,
            'named_employers': named,
            'unnamed_employers': total_employers - named,
            'employees_covered': covered,
            'top100_share_pct': round(top100 / covered * 100, 1) if covered else None,
            'single_employee_employers': singles,
            'basis': (
                f'{total_employers:,} employers of Emiratis in Dubai. The platform '
                f'can name {named:,} of them — the source supplies a company CODE '
                f'only, so the rest need resolving against a licensing source '
                f'before anyone can be contacted. Ranking by headcount says which '
                f'codes are worth resolving first.'),
            'strategy_note': (
                f'The top 100 employers account for {round(top100 / covered * 100)}% '
                f'of employed Emiratis and {singles:,} employers have exactly one. '
                f'This is a long tail: onboarding cannot cover it one company at a '
                f'time.'),
        }})
    except Exception as e:
        logger.error(f"employer targets failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load employer targets'}), 500
