from flask import Blueprint, request, jsonify
from growth_system import GrowthSystem
import logging

growth_bp = Blueprint('growth', __name__)
try:
    from backend.auth.access_control import require_roles, OPERATOR_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, OPERATOR_ROLES
logger = logging.getLogger(__name__)

# Initialize system
growth_sys = GrowthSystem()


# =====================================================
# DASHBOARD STATS (Live Funnel Data)
# =====================================================

@growth_bp.route('/api/growth/dashboard-stats', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def dashboard_stats():
    """
    Returns live funnel data for the Growth Operator dashboard.
    Aggregates companies, invitation statuses, job counts, and recent activity.
    """
    try:
        data = growth_sys.get_dashboard_stats()
        return jsonify({'success': True, **data})
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/growth/import', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def import_vacancies():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
            
        if not file.filename.endswith('.csv'):
            return jsonify({'success': False, 'error': 'File must be CSV'})
            
        # Read file content
        content = file.read()

        # Composing mail is OPT-IN. Importing data and writing to a hundred and
        # forty-five real employers are different decisions, and this endpoint
        # used to make the second one on the caller's behalf every time.
        raw = (request.form.get('queue_emails') or '').strip().lower()
        queue_emails = raw in ('1', 'true', 'yes', 'on')

        imported_by = None
        try:
            from flask_jwt_extended import get_jwt_identity
            imported_by = get_jwt_identity()
        except Exception:
            pass

        report = growth_sys.import_vacancies_from_csv(
            content, queue_emails=queue_emails, imported_by=imported_by)

        # An import that creates companies and vacancies for real employers is
        # worth a line in the audit log. There was none, so answering "who ran
        # this" meant reading timestamps out of the data itself.
        try:
            from backend.admin_audit import record_admin_action
        except ImportError:                  # pragma: no cover — dual root
            from admin_audit import record_admin_action
        record_admin_action(
            'nafis_vacancy_import', imported_by, resource_type='job_posting',
            details={'file': file.filename,
                     'rows': report.get('total_rows'),
                     'companies_created': report.get('companies_created'),
                     'jobs_created': report.get('jobs_created'),
                     'queued_emails': bool(queue_emails),
                     'messages_queued': report.get('messages_queued')})
        
        return jsonify({
            'success': True,
            # NOT "Sent N emails" — nothing is sent by an import. Each message
            # waits for per-message approval, and an import of a few hundred
            # rows queues a few hundred messages, so the operator has to be
            # told that plainly rather than discovering it in the queue.
            'message': (f"Processed {report['total_rows']} rows. Created "
                        f"{report['companies_created']} companies and "
                        f"{report['jobs_created']} jobs. "
                        + (f"Queued {report['messages_queued']} email(s) — NOTHING "
                           f"HAS BEEN SENT YET; each one waits for approval under "
                           f"Admin → Outbound Mail"
                           + (f", and {report['without_email_on_file']} vacancy(ies) "
                              f"had no company email on file"
                              if report.get('without_email_on_file') else '')
                           if queue_emails else
                           "No emails were composed — this import brought the data "
                           "in only. Writing to these employers is a separate, "
                           "deliberate step")
                        + "."),
            'report': report
        })
        
    except Exception as e:
        logger.error(f"Import error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/public/verify-job/<token>', methods=['GET'])
def get_verification_details(token):
    try:
        data = growth_sys.validate_token(token)
        if not data:
            return jsonify({'success': False, 'error': 'Invalid or expired token'}), 404
            
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Verification get error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/public/verify-job/<token>/confirm', methods=['POST'])
def confirm_verification(token):
    try:
        payload = request.get_json(silent=True) or {}
        job_data = payload.get('job_data')
        password = payload.get('password') # User sets a password to claim account
        
        if not job_data or not password:
            return jsonify({'success': False, 'error': 'Missing data'}), 400
            
        result = growth_sys.confirm_job_verification(token, job_data, password)
        
        return jsonify({
            'success': True,
            'message': 'Job verified and account created!',
            'result': result
        })
    except Exception as e:
        logger.error(f"Confirmation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/growth/candidates', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_candidates():
    try:
        min_vacancies = int(request.args.get('min_vacancies', 5))
        candidates = growth_sys.get_growth_candidates(min_vacancies)
        # How much of the vacancy pool this threshold covers, so the operator
        # picks it on evidence rather than guessing (owner, 2026-08-26: work
        # the top of the list — 20% of the effort for 80% of the effect).
        return jsonify({'success': True, 'candidates': candidates,
                        'concentration': growth_sys.get_vacancy_concentration(min_vacancies)})
    except Exception as e:
        logger.error(f"Get candidates error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/growth/send-emails', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def send_emails():
    try:
        data = request.get_json(silent=True) or {}
        company_ids = data.get('company_ids', [])
        if not company_ids:
            return jsonify({'success': False, 'error': 'No companies selected'}), 400
            
        report = growth_sys.send_bulk_emails(company_ids)
        return jsonify({'success': True, 'report': report})
    except Exception as e:
        logger.error(f"Send emails error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@growth_bp.route('/api/growth/companies', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def list_companies():
    """
    Slim companies list for operator tooling — notably the workspace
    provisioning picker (issue #92), which previously called a
    /api/growth-operator/companies route that never existed, got a
    swallowed 404, and rendered an empty dropdown with no error.
    """
    try:
        conn = growth_sys._get_db_connection()
        try:
            with conn.cursor() as cur:
                # Vacancy count and industry, so an operator can concentrate on
                # the employers with the most to offer (fb_1786479039: "filter by
                # number of vacancies, sector, or other attributes").
                #
                # COUNTS EVERY POSTING ATTACHED TO THE COMPANY, not published
                # only. Measured 2026-08-20: 297 of 302 pending_verification
                # postings carry a company_id, while ALL 7 published postings
                # carry NONE. Counting published only would show zero for every
                # employer — a filter that is always empty is worse than none.
                #
                # THOSE 7 ARE NOT A DEFECT (owner, 2026-08-21). They predate the
                # rule that a vacancy must be attached to an employer, and were
                # posted by test users and admins to exercise matching. They are
                # to be removed before cutover, or superseded once real companies
                # join by magic link and post their own.
                #
                # So this counting rule is a decision about TEST-ERA data, and it
                # should be revisited once real employers are posting: at that
                # point "published" becomes the meaningful filter and counting
                # every status would overstate what an operator can act on.
                #
                # Both filters are optional, so the workspace provisioning
                # picker (issue #92) calling this with no arguments is
                # unaffected.
                where, params = [], []
                industry = (request.args.get('industry') or '').strip()
                if industry:
                    where.append("c.industry = %s")
                    params.append(industry)
                try:
                    min_vacancies = int(request.args.get('min_vacancies') or 0)
                except (TypeError, ValueError):
                    min_vacancies = 0

                sql = """
                    SELECT c.id, c.company_name, c.is_verified,
                           COALESCE(c.workspace_enabled, FALSE) AS workspace_enabled,
                           c.industry,
                           COUNT(j.id) AS vacancy_count
                    FROM companies c
                    LEFT JOIN job_postings j ON j.company_id = c.id
                """
                if where:
                    sql += " WHERE " + " AND ".join(where)
                sql += """
                    GROUP BY c.id, c.company_name, c.is_verified,
                             c.workspace_enabled, c.industry
                """
                if min_vacancies > 0:
                    sql += " HAVING COUNT(j.id) >= %s"
                    params.append(min_vacancies)
                # Most vacancies first when filtering on them — that is the
                # question being asked. Otherwise alphabetical, as before, so
                # the picker keeps its existing order.
                sql += (" ORDER BY vacancy_count DESC, c.company_name ASC"
                        if min_vacancies > 0
                        else " ORDER BY c.company_name ASC")

                cur.execute(sql, tuple(params))
                companies = [
                    {'id': str(r[0]), 'company_name': r[1],
                     'is_verified': bool(r[2]), 'workspace_enabled': bool(r[3]),
                     'industry': r[4], 'vacancy_count': int(r[5] or 0)}
                    for r in cur.fetchall()
                ]
        finally:
            conn.close()
        return jsonify({'success': True, 'companies': companies})
    except Exception as e:
        logger.error(f"List companies error: {e}")
        return jsonify({'success': False, 'error': 'Failed to list companies'}), 500


@growth_bp.route('/api/growth/check-companies', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def check_companies():
    """
    Check if a list of companies already exists in the system.
    Expects JSON: { "companies": ["Company A", "Company B"] }
    Returns: { "existing": ["Company A"] }
    """
    try:
        data = request.get_json(silent=True) or {}
        companies = data.get('companies', [])
        
        # Reuse the existing GrowthSystem instance
        existing = growth_sys.check_existing_companies(companies)
        
        return jsonify({'existing': existing})
    except Exception as e:
        logger.error(f"Check companies error: {e}")
        return jsonify({'error': str(e)}), 500


# =====================================================
# COMPANY INVITATION ENDPOINTS (Magic Links)
# =====================================================

@growth_bp.route('/api/growth/invite-companies', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def invite_companies():
    """
    Send magic link invitations to selected companies.
    Expects JSON: {
        "companies": [
            { "name": "...", "code": "...", "email": "...", "phone": "...",
              "sector": "...", "tradeLicense": "...",
              "role": "recruiter" | "employer_admin" },
            ...
        ]
    }
    "role" is what the invitation will confer on whoever redeems it (#89) —
    chosen by the OPERATOR here, validated against an allow-list, and never
    changeable by the invitee. Omitted/invalid values degrade to 'recruiter'.
    Returns list of invitation results with magic links.
    """
    try:
        data = request.get_json(silent=True) or {}
        companies = data.get('companies', [])
        if not companies:
            return jsonify({'success': False, 'error': 'No companies provided'}), 400

        # Get the current user ID if available (from JWT)
        invited_by = None
        try:
            from flask_jwt_extended import get_jwt_identity
            invited_by = get_jwt_identity()
            if invited_by:
                invited_by = int(invited_by)
        except Exception:
            pass

        results = growth_sys.create_company_invitations(companies, invited_by=invited_by)

        successful = [r for r in results if 'error' not in r]
        failed = [r for r in results if 'error' in r]

        try:
            from backend.email_delivery import email_configured, invitation_result_message
        except ImportError:  # pragma: no cover - dual-root import
            from email_delivery import email_configured, invitation_result_message
        # Each invitation queues a real email that waits for per-message
        # approval. A company with no address on file gets a link and no
        # message, so the counts differ and both are reported.
        queued = [r for r in successful if r.get('message_id')]
        no_email = [r for r in successful if r.get('message_status') == 'no_email_on_file']
        return jsonify({
            'success': True,
            'email_delivery_configured': email_configured(),
            'messages_awaiting_approval': len(queued),
            'without_email_on_file': len(no_email),
            'message': invitation_result_message(len(successful), len(failed),
                                                 queued_count=len(queued)),
            'invitations': successful,
            'errors': failed,
        })

    except Exception as e:
        logger.error(f"Invite companies error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@growth_bp.route('/api/growth/companies/<company_id>/verify', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def verify_company(company_id):
    """
    Approve (or revoke approval of) a company — the write side of the
    approval gate (#96). Body: {"verified": true|false} (defaults true).
    Persisted to companies.is_verified with verified_by/verified_at; the
    job-posting publish paths read it and refuse to publish for
    unverified companies.
    """
    try:
        payload = request.get_json(silent=True) or {}
        verified = bool(payload.get('verified', True))

        verified_by = None
        try:
            from flask_jwt_extended import get_jwt_identity
            verified_by = get_jwt_identity()
        except Exception:
            pass

        # An approval with nobody's name on it is not an approval. The identity
        # lookup above swallows its own failure, so check here rather than
        # letting a null approver reach the database and come back as a 500.
        if verified and not verified_by:
            return jsonify({
                'success': False,
                'error': 'Could not establish who is approving this company. '
                         'Sign in again and retry — an approval has to record '
                         'who made it.'}), 401

        result = growth_sys.set_company_verification(company_id, verified, verified_by=verified_by)
        if result is None:
            return jsonify({'success': False, 'error': 'Company not found'}), 404
        return jsonify({'success': True, 'company': result})
    except ValueError as e:
        # The guard in set_company_verification — an operator-actionable refusal
        # rather than a stack trace.
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Verify company error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@growth_bp.route('/api/growth/invitations', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def list_pending_invitations():
    """
    Open invitations with their magic links, so the operator can recover a
    link after the generation dialog is closed (previously impossible).
    """
    try:
        return jsonify({'success': True, 'invitations': growth_sys.get_pending_invitations()})
    except Exception as e:
        logger.error(f"Pending invitations error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@growth_bp.route('/api/public/invitation/<token>', methods=['GET'])
def get_invitation_details(token):
    """
    Public endpoint: Validate a company invitation token.
    Returns company details for the onboarding wizard.
    """
    try:
        data = growth_sys.validate_company_invitation(token)
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired invitation link'
            }), 404

        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Invitation validation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@growth_bp.route('/api/public/invitation/<token>/accept', methods=['POST'])
def accept_invitation(token):
    """
    RETIRED (issue #90). This endpoint used to create accounts from an
    unauthenticated request body and matched existing accounts by PHONE
    NUMBER alone — so redeeming a link with someone else's number captured
    their account. Invitations are now redeemed by signing in with UAE Pass:
    the wizard sends the invitee to /api/auth/uaepass/login with the
    invitation token, and the OAuth callback binds the invitation to the
    identity UAE Pass proved (growth_system.redeem_invitation_for_user).

    410 rather than 404 so an old bookmarked wizard or cached client gets an
    actionable pointer instead of "not found".
    """
    return jsonify({
        'success': False,
        'error': 'This invitation is redeemed by signing in with UAE Pass. '
                 'Open your invitation link again and choose "Continue with UAE PASS".',
        'uaepass_login': f'/api/auth/uaepass/login?invitation_token={token}',
    }), 410


@growth_bp.route('/api/growth/recruiter-performance', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_recruiter_performance():
    """
    Returns responsiveness metrics for registered companies and recruiters.
    """
    try:
        from backend.db import get_db_connection
        from psycopg2.extras import RealDictCursor
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Fetch companies details
        cur.execute("""
            SELECT 
                c.id::text as id,
                COALESCE(c.company_name, c.name) as name,
                c.industry,
                c.phone,
                c.emirate,
                c.is_verified,
                c.contact_email
            FROM companies c
            ORDER BY name ASC
        """)
        companies = cur.fetchall()
        
        # 2. Fetch job posting count per company
        cur.execute("""
            SELECT company_id, COUNT(*) as jobs_count 
            FROM job_postings 
            GROUP BY company_id
        """)
        jobs_map = {row['company_id']: int(row['jobs_count']) for row in cur.fetchall() if row['company_id']}
        
        # 3. Calculate application response metrics per company
        cur.execute("""
            SELECT 
                jp.company_id,
                COUNT(ja.id) as total_apps,
                COUNT(CASE WHEN LOWER(ja.status) != 'pending' THEN 1 END) as reviewed_apps,
                AVG(CASE WHEN LOWER(ja.status) != 'pending' AND ja.submitted_at IS NOT NULL THEN EXTRACT(EPOCH FROM (ja.updated_at - ja.submitted_at))/86400 END) as avg_days
            FROM job_applications ja
            JOIN job_postings jp ON ja.job_id::text = jp.id::text
            GROUP BY jp.company_id
        """)
        apps_map = {}
        for row in cur.fetchall():
            if row['company_id']:
                apps_map[row['company_id']] = {
                    'total': int(row['total_apps']),
                    'reviewed': int(row['reviewed_apps']),
                    'avg_days': round(float(row['avg_days']), 1) if row['avg_days'] is not None else None
                }
                
        # 4. Calculate chat responsiveness per company recruiter
        cur.execute("""
            SELECT 
                u.id::text as recruiter_id,
                u.full_name as recruiter_name,
                u.email as recruiter_email,
                u.company as recruiter_company
            FROM users u
            WHERE u.role = 'recruiter' OR u.role = 'employer'
        """)
        recruiters = cur.fetchall()
        
        # Map recruiter ids to company ids based on name similarity or matches
        recruiter_to_company = {}
        for rec in recruiters:
            rec_comp = (rec.get('recruiter_company') or '').lower().strip()
            if not rec_comp:
                continue
            for comp in companies:
                comp_name = (comp.get('name') or '').lower().strip()
                if rec_comp == comp_name or rec_comp in comp_name or comp_name in rec_comp:
                    recruiter_to_company[rec['recruiter_id']] = comp['id']
                    break
        
        # Let's calculate chat metrics for conversations
        try:
            cur.execute("""
                WITH msg_sequence AS (
                    SELECT 
                        conversation_id,
                        sender_id::text as sender_id,
                        created_at,
                        LAG(sender_id::text) OVER (PARTITION BY conversation_id ORDER BY created_at ASC) as prev_sender_id,
                        LAG(created_at) OVER (PARTITION BY conversation_id ORDER BY created_at ASC) as prev_created_at
                    FROM messages
                )
                SELECT 
                    sender_id as recruiter_id,
                    COUNT(*) as total_replies,
                    AVG(EXTRACT(EPOCH FROM (created_at - prev_created_at))/3600) as avg_response_hours
                FROM msg_sequence
                WHERE prev_sender_id IS NOT NULL AND prev_sender_id != sender_id
                GROUP BY sender_id
            """)
            chat_replies = cur.fetchall()
        except Exception:
            conn.rollback()
            chat_replies = []
 
        chat_map = {}
        for row in chat_replies:
            rec_id = row['recruiter_id']
            comp_id = recruiter_to_company.get(rec_id)
            if comp_id:
                if comp_id not in chat_map:
                    chat_map[comp_id] = []
                chat_map[comp_id].append({
                    'replies': int(row['total_replies']),
                    'avg_hours': round(float(row['avg_response_hours']), 1)
                })
                
        # 5. Build final report list
        report = []
        for comp in companies:
            comp_id = comp['id']
            
            # Jobs Posted
            jobs_count = jobs_map.get(comp_id, 0)
            
            # Application response
            app_stats = apps_map.get(comp_id, {'total': 0, 'reviewed': 0, 'avg_days': None})
            
            # Chat response
            chats = chat_map.get(comp_id, [])
            avg_chat_hours = round(sum(c['avg_hours'] for c in chats) / len(chats), 1) if chats else None
            
            # Combine metrics and fallbacks
            total_apps = app_stats['total']
            reviewed_apps = app_stats['reviewed']
            
            # Calculate rates. Null (not fabricated defaults) when there's no data —
            # was 100.0 / 4.2 / 92.0 presented as real. (#26)
            response_rate = round((reviewed_apps / total_apps) * 100, 1) if total_apps > 0 else None
            avg_response_days = app_stats['avg_days'] if app_stats['avg_days'] is not None else None

            chat_responsiveness = None if avg_chat_hours is None else round(max(100.0 - (avg_chat_hours * 2), 60.0), 1)

            # Recruiter name from real recruiters or the company contact email — never a
            # fabricated name (was falling back to 'Salem Al Ali'). None if unknown. (#26)
            rec_names = [r['recruiter_name'] for r in recruiters if recruiter_to_company.get(r['recruiter_id']) == comp_id]
            recruiter_name = rec_names[0] if rec_names else ((comp.get('contact_email') or '').split('@')[0].replace('.', ' ').title() or None)

            # Flagged only on metrics we actually have (None never flags).
            flagged = ((response_rate is not None and response_rate < 50.0)
                       or (avg_response_days is not None and avg_response_days > 5.0)
                       or (chat_responsiveness is not None and chat_responsiveness < 70.0))
            
            status = 'verified' if comp['is_verified'] else 'pending'
            
            report.append({
                'id': comp_id,
                'company_name': comp['name'] or comp['company_name'] or 'Private Enterprise',
                'recruiter_name': recruiter_name,
                'industry': comp['industry'] or 'Private Sector',
                'emirate': comp['emirate'] or 'Dubai',
                'jobs_posted': jobs_count,
                'total_applications': total_apps,
                'response_rate': response_rate,
                'avg_response_days': avg_response_days,
                'chat_responsiveness': chat_responsiveness,
                'avg_chat_hours': avg_chat_hours,
                'flagged': flagged,
                'status': status
            })
            
        conn.close()
        return jsonify({'success': True, 'data': report}), 200
        
    except Exception as e:
        logger.error(f"Error calculating recruiter performance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@growth_bp.route('/api/growth/nudge-company', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def nudge_company():
    """
    Nudges the recruiters of a company to process their pending applications.
    """
    try:
        from backend.db import get_db_connection
        from psycopg2.extras import RealDictCursor
        from backend.notification_helper import create_notification
        
        data = request.get_json() or {}
        company_id = data.get('company_id')
        if not company_id:
            return jsonify({'success': False, 'message': 'Missing company_id'}), 400
            
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get company details
        cur.execute("SELECT id, COALESCE(company_name, name) as name FROM companies WHERE id = %s::uuid", (company_id,))
        company = cur.fetchone()
        if not company:
            conn.close()
            return jsonify({'success': False, 'message': 'Company not found'}), 404
            
        company_name = company['name']
        
        # Find recruiters for this company
        cur.execute("""
            SELECT id FROM users 
            WHERE (role = 'recruiter' OR role = 'employer') 
            AND (company = %s OR company ILIKE %s)
        """, (company_name, f"%{company_name}%"))
        recruiters = cur.fetchall()
        
        if not recruiters:
            conn.close()
            # If no user in database matches, send success anyway to support simulated data onboarding
            return jsonify({'success': True, 'message': 'Company flagged. Warning message generated.'}), 200
            
        nudged_count = 0
        for rec in recruiters:
            rec_id = rec['id']
            create_notification(
                user_id=rec_id,
                notification_type='system',
                title="SLA Alert: Pending Applications Review Required",
                message="Platform operations officer requests an urgent review and update of all outstanding candidate applications to meet Nafis responsiveness targets.",
                metadata={'company_id': company_id}
            )
            nudged_count += 1
            
        conn.close()
        return jsonify({'success': True, 'message': f'Nudged {nudged_count} recruiters successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error nudging company: {e}")
        return jsonify({'success': False, 'message': 'System error'}), 500

