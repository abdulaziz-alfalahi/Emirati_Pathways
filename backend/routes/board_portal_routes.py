from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
import logging
from psycopg2.extras import RealDictCursor
from db import get_db_connection
from functools import wraps

# SECURITY (was a no-op that made the executive board portal fully public — anyone could
# read briefing packs/exports and create/edit board directives with a forged audit trail):
# require an authenticated board/admin caller.
try:
    from backend.auth.access_control import require_roles, BOARD_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, BOARD_ROLES

optional_auth = require_roles(*BOARD_ROLES)
logger = logging.getLogger(__name__)

board_portal_bp = Blueprint('board_portal', __name__, url_prefix='/api/board')

def execute_query(query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False, commit: bool = False):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            
            result = None
            if fetch_one:
                result = cur.fetchone()
            elif fetch_all:
                result = cur.fetchall()
                
            if commit:
                conn.commit()
                
            return result
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        conn.close()

@board_portal_bp.route('/scorecards', methods=['GET'])
@optional_auth
def get_scorecards():
    try:
        total_candidates_query = "SELECT COUNT(*) as count FROM users WHERE role IN ('candidate', 'job_seeker')"
        total_candidates = execute_query(total_candidates_query, fetch_one=True)['count']

        total_companies_query = "SELECT COUNT(*) as count FROM companies"
        total_companies = execute_query(total_companies_query, fetch_one=True)['count']

        total_offers_query = "SELECT COUNT(*) as count FROM job_offers"
        total_offers = execute_query(total_offers_query, fetch_one=True)['count']

        # Report REAL counts — no inflation baselines (was +120000/+24500/+1250) and
        # no fabricated trends. Values not derivable from platform data are null
        # ("not available"), never faked. Targets are retained as stated goals. (#26)
        placement_rate = round(total_offers / total_candidates * 100, 1) if total_candidates else None

        scorecards = {
            'placement_rate': {
                'value': f"{placement_rate}%" if placement_rate is not None else None,
                'trend': None, 'target': '20.0%', 'status': None
            },
            'time_to_hire': {
                'value': None, 'trend': None, 'target': '30 days', 'status': None
            },
            'pipeline_health': {
                'value': total_candidates, 'trend': None, 'target': 1000, 'status': None
            },
            'emiratisation_progress': {
                'value': None, 'trend': None, 'target': '5.0%', 'status': None
            },
            'active_companies': {
                'value': total_companies, 'trend': None, 'target': 1300, 'status': None
            },
            'total_offers': {
                'value': total_offers, 'trend': None, 'target': 25000, 'status': None
            }
        }
        return jsonify(scorecards), 200
    except Exception as e:
        logger.error(f"Error getting scorecards: {str(e)}")
        return jsonify({'error': 'Failed to fetch scorecards'}), 500

@board_portal_bp.route('/insights', methods=['GET'])
@optional_auth
def get_insights():
    try:
        # No fabricated insights — data-driven board insights are not computed yet,
        # so return an empty list instead of invented narratives (previously claimed
        # specific % changes and company counts that weren't derived from data). (#26)
        insights = []
        return jsonify(insights), 200
    except Exception as e:
        logger.error(f"Error getting insights: {str(e)}")
        return jsonify({'error': 'Failed to fetch insights'}), 500

@board_portal_bp.route('/directives', methods=['GET', 'POST'])
@optional_auth
def handle_directives():
    if request.method == 'GET':
        status_filter = request.args.get('status')
        query = "SELECT * FROM board_directives"
        params = ()
        if status_filter:
            query += " WHERE status = %s"
            params = (status_filter,)
        query += " ORDER BY created_at DESC"
        
        try:
            directives = execute_query(query, params, fetch_all=True)
            return jsonify(directives), 200
        except Exception as e:
            logger.error(f"Error getting directives: {str(e)}")
            return jsonify({'error': 'Failed to fetch directives'}), 500
            
    elif request.method == 'POST':
        data = request.json
        # require_roles guarantees a verified JWT here; the author is the real
        # caller, never a placeholder (the old fallback stamped every directive
        # with a fixed synthetic EID, fabricating the audit trail).
        author_id = get_jwt_identity()
        if not author_id:
            return jsonify({'error': 'Could not resolve authenticated user'}), 401
        
        try:
            query = """
                INSERT INTO board_directives (author_id, title, body, category, priority)
                VALUES (%s, %s, %s, %s, %s) RETURNING *
            """
            params = (author_id, data['title'], data.get('body', ''), data['category'], data.get('priority', 'normal'))
            directive = execute_query(query, params, fetch_one=True, commit=True)
            # A directive nobody hears about directs nobody — notify the
            # platform operations team.
            try:
                try:
                    from backend.notification_helper import create_notification as _notify
                except ImportError:
                    from notification_helper import create_notification as _notify
                ops = execute_query(
                    """SELECT id FROM users WHERE is_active = TRUE AND (
                           role IN ('admin', 'platform_operator')
                           OR jsonb_exists(COALESCE(secondary_roles, '[]'::jsonb), 'platform_operator'))""",
                    fetch_all=True) or []
                for op in ops:
                    _notify(user_id=str(op['id']), notification_type='board_directive',
                            title='New board directive',
                            message=f"Directive issued: {data['title']}",
                            metadata={'directive_id': str(directive.get('id')) if directive else None,
                                      'priority': data.get('priority', 'normal')})
            except Exception as notify_err:
                logger.warning(f"directive notify failed: {notify_err}")
            return jsonify(directive), 201
        except Exception as e:
            logger.error(f"Error creating directive: {str(e)}")
            return jsonify({'error': 'Failed to create directive'}), 500

@board_portal_bp.route('/directives/<directive_id>/respond', methods=['POST'])
@optional_auth
def respond_directive(directive_id):
    data = request.json
    # Same fix as directive creation: the responder is the verified caller,
    # never a fixed synthetic EID.
    responder_id = get_jwt_identity()
    if not responder_id:
        return jsonify({'error': 'Could not resolve authenticated user'}), 401
    
    try:
        query = """
            INSERT INTO board_directive_responses (directive_id, responder_id, body)
            VALUES (%s, %s, %s) RETURNING *
        """
        response = execute_query(query, (directive_id, responder_id, data['body']), fetch_one=True, commit=True)
        # Tell the directive's author their directive got a response.
        try:
            try:
                from backend.notification_helper import create_notification as _notify
            except ImportError:
                from notification_helper import create_notification as _notify
            d = execute_query("SELECT author_id, title FROM board_directives WHERE id::text = %s",
                              (str(directive_id),), fetch_one=True)
            if d and d.get('author_id') and str(d['author_id']) != str(responder_id):
                _notify(user_id=str(d['author_id']), notification_type='board_directive',
                        title='Response to your directive',
                        message=f"Your directive '{d.get('title') or ''}' received a response.",
                        metadata={'directive_id': str(directive_id)})
        except Exception as notify_err:
            logger.warning(f"directive response notify failed: {notify_err}")
        return jsonify(response), 201
    except Exception as e:
        logger.error(f"Error responding to directive: {str(e)}")
        return jsonify({'error': 'Failed to respond to directive'}), 500

@board_portal_bp.route('/directives/<directive_id>/status', methods=['PUT'])
@optional_auth
def update_directive_status(directive_id):
    data = request.json
    
    try:
        query = """
            UPDATE board_directives SET status = %s, updated_at = NOW()
            WHERE id = %s RETURNING *
        """
        directive = execute_query(query, (data['status'], directive_id), fetch_one=True, commit=True)
        return jsonify(directive), 200
    except Exception as e:
        logger.error(f"Error updating directive status: {str(e)}")
        return jsonify({'error': 'Failed to update directive status'}), 500

# A recommendation still open this long after the board made it needs chasing,
# whether or not anyone set a due date (owner request, fb_1786703303_83d9dd68:
# "any recommendation that remains uncompleted for more than six months is
# automatically highlighted in red").
DIRECTIVE_STALE_DAYS = 183  # six months


def _directive_overdue(row, status):
    """Is this recommendation overdue, and on which of the two grounds?

    Two independent triggers, because the board asked for the second and only
    the first existed:
      • a due date that has passed
      • six months open with no completion, due date or not — which is the one
        that actually fires here, since no directive in the live data has ever
        had a due date set

    'cancelled' is excluded: a recommendation that was called off is not
    outstanding work. 'deferred' is NOT excluded — a deliberate postponement is
    still an open commitment the board is waiting on, and hiding it is how
    something quietly stops being tracked.
    """
    if status in ('completed', 'cancelled'):
        return {'overdue': False, 'overdue_reason': None, 'days_open': None}

    today = datetime.now().date()
    created = row.get('created_at')
    created_date = created.date() if hasattr(created, 'date') else created
    days_open = (today - created_date).days if created_date else None

    due = row.get('due_date')
    past_due = bool(due and due < today)

    # The secretary's lever (owner ruling 2026-08-14: deferred stays overdue,
    # "but can be adjusted by the secretary").
    #
    # A due date in the FUTURE is an explicit re-baseline — someone has looked
    # at this and committed to a date — so it suppresses the age rule until
    # that date arrives. The six-month trigger is a default for recommendations
    # nobody has spoken for, not a verdict that overrides a human decision.
    # Deferring alone does NOT clear the flag: a deferral with no new date is
    # exactly the case the board asked to keep seeing.
    rebaselined = bool(due and due >= today)
    stale = bool(days_open is not None
                 and days_open >= DIRECTIVE_STALE_DAYS
                 and not rebaselined)

    reason = None
    if past_due and stale:
        reason = 'past_due_and_stale'
    elif past_due:
        reason = 'past_due'
    elif stale:
        reason = 'open_six_months'
    return {'overdue': past_due or stale, 'overdue_reason': reason, 'days_open': days_open}


@board_portal_bp.route('/recommendations/summary', methods=['GET'])
@optional_auth
def recommendations_summary():
    """Implementation status of board recommendations (migration 052).

    Counts by state, plus an overall completion percentage.

    The overall figure is the plain average of the percentages people have
    actually set — it is NOT inferred from statuses, dates or activity. Two
    numbers are returned alongside it so the board can judge how much of the
    portfolio the average speaks for: `assessed` (recommendations with a
    percentage set) and `unassessed`. A completed recommendation with no
    percentage recorded counts as 100 because its status is itself the
    statement; anything else without a percentage is excluded from the
    average rather than silently treated as zero.
    """
    try:
        rows = execute_query("""
            SELECT d.id, d.title, d.category, d.priority, d.status, d.owner_id, d.due_date,
                   d.owner_entity, d.created_at,
                   d.completion_percent, d.completion_note, d.completion_updated_at,
                   d.completion_updated_by,
                   COALESCE(u.full_name, u.email) AS owner_name,
                   -- Who actually recorded the figure. Written on every change
                   -- since this feature shipped, and never once read back.
                   COALESCE(w.full_name, w.email) AS completion_updated_by_name
            FROM board_directives d
            LEFT JOIN users u ON u.id = d.owner_id
            LEFT JOIN users w ON w.id = d.completion_updated_by
            ORDER BY d.created_at DESC
        """, fetch_all=True) or []

        def norm(st):
            # Legacy 'resolved' predates this feature; treat it as completed
            # rather than rewriting historical records.
            st = (st or 'open').lower()
            return 'completed' if st in ('resolved', 'completed') else st

        def bucket(st):
            """Which counter a status belongs to.

            NOT the same as the status itself: 'open' is a real stored value
            and belongs in 'outstanding'. Written once because the per-owner
            grouping below needs exactly this mapping — keying that off the raw
            status silently dropped every 'open' action from its owner's count
            while the portfolio total still included it.
            """
            if st == 'completed':
                return 'completed'
            if st == 'in_progress':
                return 'in_progress'
            if st in ('deferred', 'cancelled'):
                return st
            return 'outstanding'

        counts = {'completed': 0, 'in_progress': 0, 'outstanding': 0, 'deferred': 0, 'cancelled': 0}
        contributing = []
        items = []
        for r in rows:
            st = norm(r.get('status'))
            pct = r.get('completion_percent')
            if st == 'completed':
                counts['completed'] += 1
                contributing.append(100 if pct is None else pct)
            elif st == 'in_progress':
                counts['in_progress'] += 1
                if pct is not None:
                    contributing.append(pct)
            elif st in ('deferred', 'cancelled'):
                counts[st] += 1          # excluded from the average entirely
            else:
                counts['outstanding'] += 1
                # An OUTSTANDING recommendation counts as 0 even without an
                # explicit percentage: 'outstanding' means work has not
                # started, and that status was itself set by a person, so this
                # is reading their statement rather than inferring one.
                # Excluding them instead produced a 100% headline sitting next
                # to '3 outstanding' — which reads as "all done".
                contributing.append(0 if pct is None else pct)
            items.append({
                'id': str(r['id']), 'title': r.get('title'), 'category': r.get('category'),
                'priority': r.get('priority'), 'status': st, 'bucket': bucket(st),
                'owner_id': r.get('owner_id'), 'owner_name': r.get('owner_name'),
                'due_date': r['due_date'].isoformat() if r.get('due_date') else None,
                'completion_percent': pct,
                'completion_note': r.get('completion_note'),
                'completion_updated_at': r['completion_updated_at'].isoformat()
                                          if r.get('completion_updated_at') else None,
                # WHO recorded the percentage, and whether that was the owner.
                #
                # The secretary may record progress on a member's behalf (owner
                # ruling 2026-08-21), which settles GH #460. That was already
                # permitted and already happening — all four live
                # recommendations were last written by the secretary — and
                # completion_updated_by has been stored on every change since
                # this feature shipped. It was simply never read back, so a
                # figure typed by the secretariat was indistinguishable from
                # one the owner had stated themselves.
                #
                # That was harmless while progress was housekeeping. It is not
                # now: the chairman made action progress THE accountability
                # measure (2026-08-21), so "60%" means something different
                # depending on who said it. Permission to enter it on someone's
                # behalf and visibility of having done so are the same
                # decision — this is the second half.
                'completion_updated_by': r.get('completion_updated_by'),
                'completion_updated_by_name': r.get('completion_updated_by_name'),
                'recorded_on_behalf': bool(
                    r.get('completion_updated_by')
                    and r.get('owner_id')
                    and str(r['completion_updated_by']).strip() != str(r['owner_id']).strip()
                ),
                'owner_entity': r.get('owner_entity'),
                'created_at': r['created_at'].isoformat() if r.get('created_at') else None,
                **_directive_overdue(r, st),
            })

        tracked = counts['completed'] + counts['in_progress'] + counts['outstanding']
        # 'assessed' counts recommendations whose owner recorded a percentage
        # explicitly — the figure the board should weigh the average against.
        explicit = sum(1 for r in rows
                       if r.get('completion_percent') is not None
                       and norm(r.get('status')) not in ('deferred', 'cancelled'))
        overall = round(sum(contributing) / len(contributing)) if contributing else None
        # ── Accountability sits with the OWNER OF THE ACTION ────────────────
        #
        # Chairman's decision, 2026-08-21: the platform must NOT generate a
        # board member engagement percentage; what is tracked is to be related
        # to the owner of the action instead. That closes the participation-rate
        # requests (fb_1787140915, fb_1786012027), which measured a member by
        # how long they sat in a meeting.
        #
        # DELIBERATELY NO PER-PERSON PERCENTAGE HERE. Averaging someone's
        # actions into a single figure would rebuild the very score he
        # rejected, computed from actions rather than attendance, and it would
        # be a worse number than the one it replaced: an owner of one hard
        # action would rank below an owner of five easy ones. The percentages
        # belong to the ACTIONS. This groups them by who owns them and counts
        # what is late — facts about the work, attributed to a person, not a
        # judgement about the person.
        #
        # Built from `items` above rather than a second query, so there is one
        # set of rules for status and overdue, not two that can drift.
        by_owner = {}
        for it in items:
            key = it.get('owner_id') or f"entity:{it.get('owner_entity') or 'unassigned'}"
            g = by_owner.setdefault(key, {
                'owner_id': it.get('owner_id'),
                'owner_name': it.get('owner_name'),
                'owner_entity': it.get('owner_entity'),
                'counts': {'completed': 0, 'in_progress': 0, 'outstanding': 0,
                           'deferred': 0, 'cancelled': 0},
                'overdue': 0,
                'actions': [],
            })
            g['counts'][it['bucket']] += 1
            if it.get('overdue'):
                g['overdue'] += 1
            g['actions'].append(it)

        # Most late first, then most open work — the order a chairman reads in.
        owners = sorted(by_owner.values(),
                        key=lambda g: (-g['overdue'],
                                       -(g['counts']['outstanding'] + g['counts']['in_progress']),
                                       (g.get('owner_name') or '')))

        return jsonify({'success': True, 'data': {
            'counts': counts,
            'total_tracked': tracked,
            'assessed': explicit,
            'unassessed': max(0, tracked - explicit),
            # None — never 0 — when nothing has been assessed yet.
            'overall_completion_percent': overall,
            'by_owner': owners,
            'by_owner_basis': 'Actions grouped by the person or entity accountable for '
                              'them. No score is calculated for a person: the percentages '
                              'belong to the actions.',
            'basis': 'Average across tracked recommendations. Completed counts as 100%, '
                     'outstanding as 0%, and in-progress uses the percentage its owner '
                     'recorded (excluded if none has been recorded). Deferred and '
                     'cancelled recommendations are excluded.',
            'items': items,
        }})
    except Exception as e:
        logger.error(f"recommendations summary failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load recommendations'}), 500


@board_portal_bp.route('/directives/<directive_id>/tracking', methods=['PUT'])
@optional_auth
def update_directive_tracking(directive_id):
    """Set owner, due date, status and completion percentage.

    Every percentage change records who made it and when — a board-facing
    figure must be attributable.
    """
    data = request.json or {}
    allowed_status = {'open', 'in_progress', 'completed', 'deferred', 'cancelled'}
    status = (data.get('status') or '').strip().lower() or None
    if status and status not in allowed_status:
        return jsonify({'success': False, 'message': f"Unknown status '{status}'"}), 400

    pct = data.get('completion_percent', 'unset')
    if pct not in ('unset', None):
        try:
            pct = int(pct)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'completion_percent must be a whole number'}), 400
        if not 0 <= pct <= 100:
            return jsonify({'success': False, 'message': 'completion_percent must be between 0 and 100'}), 400

    try:
        me = str(get_jwt_identity() or '')[:15]
        sets, params = [], []
        if status:
            sets.append('status = %s'); params.append(status)
        if 'owner_id' in data:
            sets.append('owner_id = %s'); params.append((data.get('owner_id') or None) and str(data['owner_id'])[:15])
        if 'owner_entity' in data:
            # Free text: the bodies a board holds accountable have no canonical
            # list, and a dropdown that cannot express "Ministry of Education"
            # would be worse than a box that can. Empty clears it.
            sets.append('owner_entity = %s')
            params.append(((data.get('owner_entity') or '').strip() or None))
        if 'due_date' in data:
            sets.append('due_date = %s'); params.append(data.get('due_date') or None)
        if pct != 'unset':
            sets.extend(['completion_percent = %s', 'completion_updated_by = %s',
                         'completion_updated_at = NOW()'])
            params.extend([pct, me])
        if 'completion_note' in data:
            sets.append('completion_note = %s'); params.append(data.get('completion_note') or None)
        if not sets:
            return jsonify({'success': False, 'message': 'Nothing to update'}), 400
        sets.append('updated_at = NOW()')
        params.append(str(directive_id))
        # NB this module's execute_query does not commit unless asked.
        execute_query(f"UPDATE board_directives SET {', '.join(sets)} WHERE id::text = %s",
                      tuple(params), commit=True)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"update directive tracking failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to update the recommendation'}), 500


@board_portal_bp.route('/briefing-pack', methods=['GET'])
@optional_auth
def get_briefing_pack():
    import io
    from flask import Response
    try:
        # 1. Fetch scorecard metrics
        total_candidates = execute_query("SELECT COUNT(*) as count FROM users WHERE role IN ('candidate', 'job_seeker')", fetch_one=True)['count']
        total_companies = execute_query("SELECT COUNT(*) as count FROM companies", fetch_one=True)['count']
        total_offers = execute_query("SELECT COUNT(*) as count FROM job_offers", fetch_one=True)['count']
        
        # Real counts, no inflation baselines. (#26)
        placement_rate = f"{(total_offers / total_candidates * 100):.1f}%" if total_candidates else 'N/A'
        
        # 2. Fetch directives
        directives = execute_query("SELECT title, body, category, priority, status, created_at FROM board_directives ORDER BY created_at DESC", fetch_all=True)
        
        # 3. Build markdown briefing pack
        md = []
        md.append("# UAE Executive Board Briefing Pack")
        md.append(f"**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (UAE Time)")
        md.append("\n## 1. Executive Performance Scorecard")
        md.append(f"- **Talent Placement Rate:** {placement_rate} (Target: 20.0%)")
        md.append("- **Average Time to Hire:** N/A (Target: 30 Days)")
        md.append(f"- **Active Partner Companies:** {total_companies} (Target: 1,300)")
        md.append(f"- **Total Offers:** {total_offers} (Target: 25,000)")
        md.append(f"- **Active Talent Pipeline:** {total_candidates} candidates")
        md.append("- **Emiratisation Average Growth:** N/A (Target: 5.0%)")
        
        md.append("\n## 2. Active Board Directives")
        if directives:
            for idx, d in enumerate(directives, 1):
                md.append(f"\n### Directive {idx}: {d['title']}")
                md.append(f"- **Category:** {d['category'].replace('_', ' ').title()}")
                md.append(f"- **Priority:** {d['priority'].upper()}")
                md.append(f"- **Status:** {d['status'].upper()}")
                md.append(f"- **Issued on:** {d['created_at'].strftime('%Y-%m-%d') if hasattr(d['created_at'], 'strftime') else d['created_at']}")
                md.append(f"- **Details:** {d['body']}")
        else:
            md.append("No active directives found.")
            
        # No fabricated insights in a document a board member can circulate —
        # the old Insight A/B/C blocks asserted specific figures (+12% Abu Dhabi
        # placements, "45 vs 28 profiles") that were never derived from data.
        md.append("\n## 3. Strategic Insights & Recommendations")
        md.append("Data-driven insights are not yet computed for this platform. "
                  "This section will populate automatically once a real analytics "
                  "source is connected.")
        
        md_content = "\n".join(md)
        
        return Response(
            md_content,
            mimetype="text/markdown",
            headers={"Content-disposition": f"attachment; filename=Board_Briefing_Pack_{datetime.now().strftime('%Y%m%d')}.md"}
        )
    except Exception as e:
        logger.error(f"Error generating briefing pack: {str(e)}")
        return jsonify({'error': f'Failed to generate briefing pack: {str(e)}'}), 500

@board_portal_bp.route('/export', methods=['GET'])
@optional_auth
def export_dashboard_data():
    import csv
    import io
    from flask import Response
    try:
        # Fetch stats
        total_candidates = execute_query("SELECT COUNT(*) as count FROM users WHERE role IN ('candidate', 'job_seeker')", fetch_one=True)['count']
        total_companies = execute_query("SELECT COUNT(*) as count FROM companies", fetch_one=True)['count']
        total_offers = execute_query("SELECT COUNT(*) as count FROM job_offers", fetch_one=True)['count']
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write CSV Header
        writer.writerow(['Metric Category', 'Metric Name', 'Current Value', 'Target', 'Status'])
        # Real counts, no inflation; non-derivable metrics exported as N/A. (#26)
        _placement = f"{(total_offers / total_candidates * 100):.1f}%" if total_candidates else 'N/A'
        writer.writerow(['Scorecard', 'Placement Rate', _placement, '20.0%', ''])
        writer.writerow(['Scorecard', 'Time to Hire', 'N/A', '30 days', ''])
        writer.writerow(['Scorecard', 'Pipeline Health', f"{total_candidates}", '1000', ''])
        writer.writerow(['Scorecard', 'Emiratisation Progress', 'N/A', '5.0%', ''])
        writer.writerow(['Scorecard', 'Active Companies', f"{total_companies}", '1300', ''])
        writer.writerow(['Scorecard', 'Total Offers', f"{total_offers}", '25000', ''])

        # Demographic breakdowns are not sourced from real data — omitted rather than
        # exporting fabricated age/geographic figures in a board deliverable. (#26)
        writer.writerow([])
        writer.writerow(['Demographics', 'Not available', 'Demographic breakdowns are not yet sourced from real data'])

        csv_content = output.getvalue()
        return Response(
            csv_content,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename=Executive_Dashboard_Export_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    except Exception as e:
        logger.error(f"Error exporting dashboard data: {str(e)}")
        return jsonify({'error': f'Failed to export data: {str(e)}'}), 500
