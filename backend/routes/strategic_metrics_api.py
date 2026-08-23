from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
try:
    from backend.auth.access_control import require_roles, GOVERNANCE_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, GOVERNANCE_ROLES
from datetime import datetime
from psycopg2.extras import RealDictCursor
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

try:
    from backend import demographics as demog
    from backend import populations as pop_defs
except ImportError:  # pragma: no cover
    import demographics as demog
    import populations as pop_defs

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
    """Demographic distributions for the board tab and the /demographics page.

    READS THE DATABASE. It used to read a spreadsheet: get_cached_demographics()
    parses /app/master_file.xlsx, which is baked into the Docker image and was
    last modified 2026-07-04. The tab therefore showed a seven-week-old snapshot
    of 4,067 people while candidate_profiles held 38,297 — a board member had no
    way to tell (2026-08-23).

    The Excel parser is left in place because /executive-impact still uses it
    for the rapid-nomination series, which has no database equivalent yet. It is
    no longer the source of anything on this endpoint.
    """
    if not get_db_connection:
        return jsonify({'success': False,
                        'message': 'Database unavailable'}), 503

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cuts = demog.build_cuts(cur)

        note = pop_defs.scope_note_bilingual('board')
        data = dict(cuts)
        data.update({
            'source': 'database',
            'as_of': datetime.utcnow().isoformat() + 'Z',
            # The same disclosure the population strip carries. These are
            # RECORDED people — imported from NAFIS and the CRM master file —
            # not people who have signed in. Charting 38,297 without saying so
            # is the failure this endpoint just stopped committing in a
            # different way.
            'scope_note': note['en'],
            'scope_note_ar': note['ar'],
            'segments': {k: {'label_en': v['label_en'], 'label_ar': v['label_ar']}
                         for k, v in demog.SEGMENTS.items()},
            'education_unspecified_level': demog.EDUCATION_UNSPECIFIED_LEVEL,
            'education_labels_ar': demog.EDUCATION_LABELS_AR,
        })
        return jsonify({'success': True, 'data': data})

    except Exception as e:
        logger.error(f"Error building demographics from the database: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

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
    #
    #                         NO LONGER RENDERED (2026-08-22). The board page now
    #                         shows the employed figure from /populations, which
    #                         additionally requires an active users row with a
    #                         candidate role and so returns 33,510 where this
    #                         returns 33,511. Two near-identical numbers on one
    #                         board screen is worse than either alone. Kept in
    #                         the payload for API compatibility; if you are about
    #                         to put it back on a page, use /populations instead
    #                         so there is one definition of "employed".
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
# 'operator' is here because it is in CAREER_SERVICES_ROLES and can therefore
# open the CRM dashboard. Without it the population strip would 403 for that one
# role and render "unavailable" — a per-role blank panel that looks like an
# outage rather than a permission, and would be reported as a bug.
@require_roles(*(GOVERNANCE_ROLES | {'career_services_operator', 'call_center_agent',
                                     'recruiter', 'employer_admin', 'talent_operator',
                                     'operator'}))
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

        # Overlaps, so the page can say the tiles are not addable. Computed
        # rather than hardcoded: these move with every import, and a stale
        # "2,335" in a caption would be the same class of invented number the
        # rest of this work removed.
        overlaps = []
        for a, b in pop.OVERLAP_PAIRS:
            cur.execute(f"""
                SELECT COUNT(DISTINCT u.id) FROM users u
                  JOIN candidate_profiles cp ON cp.user_id = u.id
                 WHERE u.role IN ('candidate','job_seeker') AND u.is_active IS TRUE
                   AND ({pop.POPULATIONS[a]['sql']}) AND ({pop.POPULATIONS[b]['sql']})
            """)
            n = cur.fetchone()[0]
            if n:
                overlaps.append({
                    'a': a, 'b': b, 'count': n,
                    'a_label_en': pop.POPULATIONS[a]['label_en'],
                    'b_label_en': pop.POPULATIONS[b]['label_en'],
                    'a_label_ar': pop.POPULATIONS[a]['label_ar'],
                    'b_label_ar': pop.POPULATIONS[b]['label_ar'],
                })
        cur.close(); conn.close()

        result = {
            'populations': data,
            'overlaps': overlaps,
            'onboarded': {
                'label_en': 'Onboarded and using the platform',
                'label_ar': 'انضموا ويستخدمون المنصة',
                'signed_in': onboarded,
                'via_uaepass': via_uaepass,
                'means': 'Has authenticated at least once. Derived from sign-in, '
                         'not a flag, so it becomes true the moment someone joins.',
            },
            'scope_note': pop.scope_note('recruiter' if members_only else 'board'),
            'scope_note_ar': pop.scope_note_bilingual(
                'recruiter' if members_only else 'board')['ar'],
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
        # THE SUPPORT RATE DOES NOT EXIST BEFORE THE PROGRAMME DID.
        #
        # NAFIS launched in 2021. The query happily computes a rate for every
        # cohort back to 2010 — 66.9% for 2010, 77.1% for 2015 — and those
        # numbers are not nonsense in themselves: they are the share of people
        # hired that year who are on NAFIS support TODAY. But plotted against a
        # year axis beside "job starts in that year", they read as "67% were on
        # NAFIS support in 2010", which is impossible and is exactly how the
        # owner read it (fb_1787452023, 2026-08-23).
        #
        # The cohort is kept and its COUNT still plots; only the ratio is
        # withheld, for the same reason the monthly series withholds a rate on a
        # tiny denominator below — a number the axis will cause to be misread is
        # worse than a gap. nafis_basis states the cut-off so it is disclosed
        # rather than silently applied.
        NAFIS_START_YEAR = 2021
        by_year = [{
            'year': r[0],
            'starts': r[1],
            'nafis_supported': r[2],
            'nafis_support_pct': (round(r[2] / r[1] * 100, 1)
                                  if r[1] and r[0] >= NAFIS_START_YEAR else None),
        } for r in cur.fetchall()]

        # Running total of people whose CURRENT job began on or before each year.
        running = 0
        for row in by_year:
            running += row['starts']
            row['cumulative'] = running

        # Monthly, because the yearly chart cannot show seasonality and the
        # seasonality here is large and real: June and December each carry ~18%
        # of all starts against ~5% for a typical month. That is NOT a defaulted
        # date — checked live 2026-08-22, the spikes spread across their months
        # (the busiest single day in June holds 8% of June, in line with the
        # 1st-of-month effect everywhere else). Graduation and year-end hiring.
        #
        # Same survivorship caveat as by_year, and the same basis string carries
        # it. From 2010 to match the yearly series; earlier months hold single
        # figures and would be noise on a monthly axis.
        cur.execute("""
            SELECT to_char(date_trunc('month', job_start_date), 'YYYY-MM') AS ym,
                   date_part('year',  job_start_date)::int AS yr,
                   date_part('month', job_start_date)::int AS mon,
                   COUNT(*) AS n,
                   COUNT(*) FILTER (WHERE salary_support) AS supported
              FROM private_sector_employment
             WHERE job_start_date IS NOT NULL
               AND job_start_date >= DATE '2010-01-01'
             GROUP BY 1, 2, 3 ORDER BY 1
        """)
        # A RATE ON A TINY DENOMINATOR IS NOT A RATE. September 2026 holds five
        # starts, none yet on support, and plotted as 0% it drew the NAFIS line
        # off a cliff at the right-hand edge of the chart — a board member sees
        # support collapsing when what happened is that five people started.
        #
        # Below the threshold the percentage is null, so the line simply stops
        # rather than lying. The BARS still show every month, so nothing is
        # hidden: the count is reported, only the ratio is withheld, and the
        # threshold is stated in month_basis rather than applied silently.
        MIN_N_FOR_RATE = 30
        by_month = [{
            'ym': r[0],
            'year': r[1],
            'month': r[2],
            'starts': r[3],
            'nafis_supported': r[4],
            'nafis_support_pct': (round(r[4] / r[3] * 100, 1)
                                  if r[3] >= MIN_N_FOR_RATE
                                  and r[1] >= NAFIS_START_YEAR else None),
        } for r in cur.fetchall()]

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

        # WHERE EMIRATIS ACTUALLY WORK — the standing distribution, not the
        # hiring flow. by_sector above is keyed by year and starts at 2021, so
        # it answers "which sectors are recruiting"; it cannot answer "how are
        # the 33,352 distributed", which is a different question and the one
        # asked more often.
        #
        # NO DATE FILTER HERE, deliberately. Restricting to dated rows would
        # drop 209 people from a headcount for a reason that has nothing to do
        # with where they work.
        #
        # 'Not stated' IS A ROW, not an omission. 4,091 records (12.3%) carry no
        # sector — the source file gives a company CODE and the sector is only
        # present for some. Dropping them would make the percentages add to 100
        # of a population that is not the one named, and quietly overstate every
        # sector's share by about an eighth.
        cur.execute("""
            SELECT COALESCE(NULLIF(TRIM(company_sector), ''), 'Not stated') AS sector,
                   COUNT(*) AS n,
                   COUNT(*) FILTER (WHERE salary_support) AS supported
              FROM private_sector_employment
             GROUP BY 1 ORDER BY 2 DESC
        """)
        # ISIC section names in Arabic, keyed by the section LETTER rather than
        # the English string — the letter is the stable identifier, the English
        # wording is the source's own abbreviation and varies ("Administrative
        # services activities" is not the official ISIC phrasing either).
        #
        # Without this the whole axis rendered in English on the Arabic board
        # view: numbers localised, categories not. A board member reading Arabic
        # got an English chart.
        ISIC_AR = {
            'A': 'الزراعة والحراجة وصيد الأسماك',
            'B': 'التعدين واستغلال المحاجر',
            'C': 'الصناعة التحويلية',
            'D': 'إمدادات الكهرباء والغاز',
            'E': 'إمدادات المياه والصرف الصحي وإدارة النفايات',
            'F': 'التشييد والبناء',
            'G': 'تجارة الجملة والتجزئة',
            'H': 'النقل والتخزين',
            'I': 'الإقامة وخدمات الطعام',
            'J': 'المعلومات والاتصالات',
            'K': 'الأنشطة المالية والتأمين',
            'L': 'الأنشطة العقارية',
            'M': 'الأنشطة المهنية والعلمية والتقنية',
            'N': 'أنشطة الخدمات الإدارية والدعم',
            'O': 'الإدارة العامة والدفاع',
            'P': 'التعليم',
            'Q': 'الصحة والعمل الاجتماعي',
            'R': 'الفنون والترفيه والتسلية',
            'S': 'أنشطة الخدمات الأخرى',
        }
        OTHER_AR = {'Not stated': 'غير مذكور', 'Other': 'أخرى'}

        rows = cur.fetchall()
        grand = sum(r[1] for r in rows) or 1
        sector_distribution = [{
            # Source values are ISIC sections prefixed with their letter
            # ("F-Construction"). The letter is meaningful to a statistician and
            # noise to a board member, so it is split out rather than deleted.
            'code': (r[0].split('-', 1)[0] if len(r[0]) > 1 and r[0][1:2] == '-' else None),
            'sector': (r[0].split('-', 1)[1].strip()
                       if len(r[0]) > 1 and r[0][1:2] == '-' else r[0]),
            # Falls back to the English name rather than to a blank: an
            # untranslated sector should read oddly, not vanish from the axis.
            'sector_ar': (
                ISIC_AR.get(r[0].split('-', 1)[0])
                if len(r[0]) > 1 and r[0][1:2] == '-'
                else OTHER_AR.get(r[0])
            ) or (r[0].split('-', 1)[1].strip()
                  if len(r[0]) > 1 and r[0][1:2] == '-' else r[0]),
            'headcount': r[1],
            'pct': round(r[1] / grand * 100, 1),
            'nafis_supported': r[2],
            'nafis_support_pct': round(r[2] / r[1] * 100, 1) if r[1] >= 30 else None,
        } for r in rows]

        cur.execute("SELECT COUNT(*) FROM private_sector_employment WHERE job_start_date IS NULL")
        undated = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM private_sector_employment")
        total = cur.fetchone()[0]
        cur.close(); conn.close()

        return jsonify({'success': True, 'data': {
            'by_year': by_year,
            'by_month': by_month,
            'by_sector': by_sector,
            'sector_distribution': sector_distribution,
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
                'support (meaning confirmed 2026-08-21). Shown from 2021 only, '
                'because NAFIS began in 2021 — earlier cohorts have a '
                'computable figure, but on a year axis it would read as support '
                'paid in a year the programme did not exist. Their job-start '
                'counts are still plotted. The RATE is more reliable than the '
                'counts above, because survivorship affects its numerator and '
                'denominator together. The most recent year reads low because '
                'support for very recent hires may not yet be in payment, not '
                'because fewer of them qualify.'),
            'sector_basis': (
                'Where the 33,352 Emiratis in this file currently work, across '
                'all years — not who is hiring now. "Not stated" is shown rather '
                'than dropped: the source gives a company code and carries a '
                'sector for 87.7% of records, so excluding the rest would '
                'overstate every sector\'s share by about an eighth.'),
            'month_basis': (
                'Monthly starts for people currently employed. June and December '
                'are genuine hiring peaks, not artefacts — the starts spread '
                'across those months rather than falling on one default date. '
                'The current month is partial, and 11 records carry a start date '
                'still in the future (signed but not yet begun). The support rate '
                'is not plotted for months with fewer than 30 starts, where a '
                'percentage would be noise; the most recent months read low '
                'because support for new hires is often not yet in payment, not '
                'because fewer of them qualify.'),
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
                   -- A company ROW is not a relationship. Rows are created by
                   -- the NAFIS vacancy import as leads, so `co.id IS NOT NULL`
                   -- marked 257 companies as onboarded when 4 had anyone from
                   -- the company actually join (owner, 2026-08-22). The ACL rule
                   -- — an accepted team member — is the authority.
                   BOOL_OR(EXISTS (SELECT 1 FROM company_team_members m
                                    WHERE m.company_id = co.id
                                      AND m.invitation_status = 'accepted')) AS onboarded,
                   BOOL_OR(COALESCE(co.is_verified, FALSE)) AS verified,
                   BOOL_OR(co.id IS NOT NULL) AS has_record
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
            'state': ('onboarded' if r[5] else
                      'verified_not_joined' if r[6] else
                      'record_only' if r[7] else 'not_on_file'),
        } for r in cur.fetchall()]

        # Companies currently hiring, cross-referenced against how many Emiratis
        # they already employ.
        #
        # This is the pairing worth showing: 17 of the top 20 hiring companies
        # already have Emirati staff, so they are warm relationships rather than
        # cold outreach — and unlike the headcount ranking, every one of these
        # HAS A NAME, because a vacancy only exists on the platform if a company
        # record was created for it.
        cur.execute("""
            SELECT co.company_name, co.company_code,
                   COUNT(jp.id) AS vacancies,
                   (SELECT COUNT(*) FROM private_sector_employment p
                     WHERE p.company_code = co.company_code) AS emiratis
              FROM job_postings jp
              JOIN companies co ON co.id = jp.company_id
             GROUP BY co.company_name, co.company_code
             ORDER BY vacancies DESC, emiratis DESC
             LIMIT %s
        """, (limit,))
        top_hiring = [{
            'company_name': r[0],
            'company_code': r[1],
            'vacancies': r[2],
            'emiratis': r[3],
            'already_employs_emiratis': bool(r[3]),
        } for r in cur.fetchall()]

        cur.execute("SELECT COUNT(DISTINCT company_id) FROM job_postings WHERE company_id IS NOT NULL")
        hiring_companies = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM job_postings")
        total_vacancies = cur.fetchone()[0]

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

        warm = sum(1 for h in top_hiring if h['already_employs_emiratis'])
        return jsonify({'success': True, 'data': {
            'targets': targets,
            'top_hiring': top_hiring,
            'hiring_companies': hiring_companies,
            'total_vacancies': total_vacancies,
            'hiring_basis': (
                f'{total_vacancies:,} vacancies across {hiring_companies:,} companies. '
                f'{warm} of the top {len(top_hiring)} already employ Emiratis, so they '
                f'are existing relationships rather than cold outreach. Every company '
                f'here has a name — a vacancy only exists on the platform once a '
                f'company record was created for it.'),
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
            'onboarding_basis': (
                'Onboarded means someone from the company has joined and can act '
                'for it. A company record on its own is not a relationship — most '
                'records were created by the vacancy import.'),
            'strategy_note': (
                f'The top 100 employers account for {round(top100 / covered * 100)}% '
                f'of employed Emiratis and {singles:,} employers have exactly one. '
                f'This is a long tail: onboarding cannot cover it one company at a '
                f'time.'),
        }})
    except Exception as e:
        logger.error(f"employer targets failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load employer targets'}), 500
