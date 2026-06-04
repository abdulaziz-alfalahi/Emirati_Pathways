"""
Policy Simulation, CMS & Call Center API Routes
Blueprint prefix: /api/platform-ops

Combined routes for Phase 4:
- Policy simulation tools for government
- Content management system for admin
- Call center ticket system
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2, psycopg2.extras, os, json, logging, random

logger = logging.getLogger(__name__)
platform_ops_bp = Blueprint('platform_ops', __name__, url_prefix='/api/platform-ops')


def get_db():
    try:
        return psycopg2.connect(os.getenv('DATABASE_URL',
            'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'))
    except Exception as e:
        logger.error(f"DB error: {e}"); return None


def _create_notification(user_id, title, content, notif_type='system_announcement', metadata=None):
    """Insert a notification into the DB and emit a socket event so the bell updates."""
    conn = get_db()
    if not conn:
        return
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO notifications (user_id, type, title, content, metadata)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (str(user_id), notif_type, title, content, json.dumps(metadata or {})))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        # Emit real-time socket event
        try:
            from flask import current_app
            sio = current_app.extensions.get('socketio')
            if not sio:
                from app import socketio as sio
            if sio:
                sio.emit('new_notification', {
                    'user_id': str(user_id),
                    'notification': {
                        'id': str(row['id']),
                        'type': notif_type,
                        'title': title,
                        'content': content,
                        'metadata': metadata or {},
                        'created_at': row['created_at'].isoformat() if row.get('created_at') else None,
                        'read': False,
                        'priority': (metadata or {}).get('priority', 'medium'),
                    }
                })
        except Exception as se:
            logger.warning(f"Socket emit for notification failed: {se}")
    except Exception as e:
        try: conn.rollback(); conn.close()
        except: pass
        logger.warning(f"Failed to create notification for user {user_id}: {e}")

def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS content_submissions (
            id SERIAL PRIMARY KEY,
            submitted_by INTEGER REFERENCES users(id),
            content_type VARCHAR(50) NOT NULL DEFAULT 'general',
            title TEXT NOT NULL DEFAULT '',
            body TEXT DEFAULT '',
            status VARCHAR(20) DEFAULT 'pending',
            reviewed_by INTEGER REFERENCES users(id),
            review_notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS support_tickets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            created_by_agent INTEGER REFERENCES users(id),
            assigned_to INTEGER REFERENCES users(id),
            subject VARCHAR(500) NOT NULL DEFAULT '',
            description TEXT DEFAULT '',
            category VARCHAR(50) DEFAULT 'general',
            priority VARCHAR(20) DEFAULT 'medium',
            status VARCHAR(30) DEFAULT 'open',
            source VARCHAR(20) DEFAULT 'in_app',
            escalated_to VARCHAR(100) DEFAULT '',
            resolved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS ticket_messages (
            id SERIAL PRIMARY KEY,
            ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
            sender_id INTEGER REFERENCES users(id),
            message TEXT NOT NULL DEFAULT '',
            is_internal_note BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS knowledge_base_articles (
            id SERIAL PRIMARY KEY,
            title_en VARCHAR(500) NOT NULL DEFAULT '',
            title_ar VARCHAR(500) DEFAULT '',
            body_en TEXT DEFAULT '',
            body_ar TEXT DEFAULT '',
            category VARCHAR(100) DEFAULT 'general',
            tags JSONB DEFAULT '[]',
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS live_chat_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            agent_id INTEGER REFERENCES users(id),
            conversation_id VARCHAR(200),
            status VARCHAR(20) DEFAULT 'waiting',
            category VARCHAR(50) DEFAULT 'general',
            initial_message TEXT DEFAULT '',
            metadata JSONB DEFAULT '{}',
            started_at TIMESTAMP DEFAULT NOW(),
            accepted_at TIMESTAMP,
            ended_at TIMESTAMP,
            ended_by VARCHAR(20) DEFAULT '',
            ticket_id INTEGER REFERENCES support_tickets(id),
            rating INTEGER DEFAULT 0
        );
        -- Add metadata column if it doesn't exist (idempotent migration)
        DO $$ BEGIN
            ALTER TABLE live_chat_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
        EXCEPTION WHEN others THEN NULL;
        END $$;
        CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
        CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_content_status ON content_submissions(status);
        CREATE INDEX IF NOT EXISTS idx_live_chat_status ON live_chat_sessions(status);
        CREATE INDEX IF NOT EXISTS idx_live_chat_agent ON live_chat_sessions(agent_id);
    """)
    conn.commit(); cur.close()

def seed_sample_data(conn):
    """Seed sample tickets, messages, and KB articles for demo."""
    cur = conn.cursor()
    # Check if already seeded
    cur.execute("SELECT COUNT(*) FROM support_tickets")
    if cur.fetchone()[0] > 0:
        cur.close(); return
    # Get some user IDs for realistic data
    cur.execute("SELECT id FROM users LIMIT 10")
    user_ids = [r[0] for r in cur.fetchall()]
    if not user_ids:
        cur.close(); return
    uid = lambda i: user_ids[i % len(user_ids)]

    # Sample tickets
    tickets = [
        (uid(0), 'Cannot access CV Builder', 'User reports blank page when navigating to CV Builder. Cleared cache, issue persists.', 'technical', 'urgent', 'open', 'phone'),
        (uid(1), 'Nafis salary support not reflected', 'User completed Nafis registration 3 weeks ago but salary support is not showing in their dashboard.', 'nafis', 'high', 'open', 'phone'),
        (uid(2), 'Job application status unknown', 'Applied to 4 positions 2 weeks ago, all still showing "Under Review". User wants update.', 'jobs', 'medium', 'in_progress', 'whatsapp'),
        (uid(3), 'Password reset not working', 'OTP not arriving on WhatsApp. User tried 5 times. Phone number verified as correct.', 'account', 'high', 'open', 'phone'),
        (uid(4), 'Training certificate not appearing', 'Completed "Digital Marketing Fundamentals" course but certificate not in profile.', 'training', 'medium', 'in_progress', 'email'),
        (uid(5), 'Request for employer partnership info', 'HR manager from ADNOC wants info on employer partnership program and onboarding process.', 'employer', 'low', 'open', 'email'),
        (uid(6), 'Interview scheduling conflict', 'Received two interview invitations for the same time slot. Needs to reschedule one.', 'jobs', 'high', 'in_progress', 'whatsapp'),
        (uid(0), 'Profile data incorrect after update', 'Updated phone number and education, but old data still displays. Possible sync issue.', 'account', 'medium', 'resolved', 'in_app'),
        (uid(1), 'Mentorship program enrollment', 'User wants to enroll in the mentorship program but cannot find the registration page.', 'general', 'low', 'resolved', 'phone'),
        (uid(2), 'Assessment results not loading', 'Skills assessment completed yesterday but results page shows spinner indefinitely.', 'technical', 'urgent', 'open', 'phone'),
        (uid(3), 'Emiratization target question', 'Company HR asking how emiratization targets are calculated on the compliance dashboard.', 'employer', 'low', 'resolved', 'email'),
        (uid(4), 'Cannot upload documents', 'File upload fails with "413 Request Entity Too Large" error for a 15MB certificate scan.', 'technical', 'medium', 'open', 'whatsapp'),
    ]
    for t in tickets:
        cur.execute("""INSERT INTO support_tickets (user_id, subject, description, category, priority, status, source,
            created_at) VALUES (%s,%s,%s,%s,%s,%s,%s, NOW() - interval '1 day' * (random()*14)::int)""", t)
    conn.commit()

    # Sample messages for first few tickets
    cur.execute("SELECT id FROM support_tickets ORDER BY id LIMIT 5")
    tids = [r[0] for r in cur.fetchall()]
    messages = [
        (tids[0], uid(0), 'Hi, I cannot open the CV Builder page. It just shows a blank white screen.', False),
        (tids[0], uid(8 % len(user_ids)), 'Thank you for reporting. Can you tell me which browser you are using?', False),
        (tids[0], uid(0), 'Google Chrome, latest version.', False),
        (tids[0], uid(8 % len(user_ids)), 'Internal: Checked logs — 500 error on /api/cv-builder/templates. Escalating to dev team.', True),
        (tids[1], uid(1), 'I registered for Nafis 3 weeks ago and my employer confirmed it. But I see nothing on my dashboard.', False),
        (tids[1], uid(8 % len(user_ids)), 'Let me check your Nafis integration status. Can you provide your Nafis reference number?', False),
        (tids[2], uid(2), 'I applied to Senior Analyst at ADNOC, Marketing Lead at Emaar, and two others. No updates at all.', False),
        (tids[2], uid(8 % len(user_ids)), 'I can see your applications. ADNOC has shortlisted you — you should receive an interview invite within 48 hours. The others are still in review.', False),
        (tids[3], uid(3), 'My WhatsApp is +971511234505 but I never receive the OTP code.', False),
        (tids[3], uid(8 % len(user_ids)), 'I have verified your number in our system. Let me trigger a test OTP now.', False),
    ]
    for m in messages:
        cur.execute("INSERT INTO ticket_messages (ticket_id, sender_id, message, is_internal_note) VALUES (%s,%s,%s,%s)", m)
    conn.commit()

    # Knowledge base articles
    kb_articles = [
        ('How to Reset User Password', 'كيفية إعادة تعيين كلمة مرور المستخدم',
         'Step 1: Ask user to go to /auth page.\nStep 2: Click "Forgot Password" or request a new OTP.\nStep 3: If OTP does not arrive, verify the phone number in the admin panel.\nStep 4: If the issue persists, escalate to the technical team with the user ID.',
         'الخطوة 1: اطلب من المستخدم الذهاب إلى صفحة /auth.\nالخطوة 2: النقر على "نسيت كلمة المرور" أو طلب رمز OTP جديد.\nالخطوة 3: إذا لم يصل الرمز، تحقق من رقم الهاتف في لوحة الإدارة.',
         'account', '["password", "otp", "login", "authentication"]'),
        ('Nafis Program — Common Questions', 'برنامج نافس — أسئلة شائعة',
         'Q: How long does Nafis registration take?\nA: Usually 5-7 business days after employer confirmation.\n\nQ: Where can users see their Nafis status?\nA: Dashboard > My Benefits > Nafis Support section.\n\nQ: What if the salary support amount is wrong?\nA: Direct the user to contact Nafis directly at 800-NAFIS or escalate via the employer portal.',
         'س: كم يستغرق تسجيل نافس؟\nج: عادة 5-7 أيام عمل بعد تأكيد صاحب العمل.\n\nس: أين يمكن للمستخدمين رؤية حالة نافس؟\nج: لوحة التحكم > مزاياي > قسم دعم نافس.',
         'nafis', '["nafis", "salary", "support", "benefits"]'),
        ('CV Builder Troubleshooting', 'استكشاف أخطاء منشئ السيرة الذاتية',
         'Common issues:\n1. Blank page: Clear browser cache and try incognito mode.\n2. Template not loading: Check if user has selected a template first.\n3. PDF download fails: Ensure popup blocker is disabled.\n4. Data not saving: Check network connectivity.\n\nIf none of these work, collect browser console errors and escalate to dev.',
         'المشاكل الشائعة:\n1. صفحة فارغة: امسح ذاكرة التخزين المؤقت وجرب وضع التصفح المتخفي.\n2. القالب لا يتحمل: تحقق من أن المستخدم قد اختار قالبًا أولاً.',
         'technical', '["cv", "builder", "pdf", "template"]'),
        ('Job Application Status Guide', 'دليل حالة طلب التوظيف',
         'Application statuses explained:\n- Submitted: Application received, pending initial screening.\n- Under Review: HR is evaluating the application.\n- Shortlisted: Candidate selected for interview.\n- Interview Scheduled: Interview date confirmed.\n- Offered: Job offer extended.\n- Rejected: Application not successful.\n\nNote: Average review time is 7-14 business days.',
         'شرح حالات الطلب:\n- مرسل: تم استلام الطلب، في انتظار الفحص الأولي.\n- قيد المراجعة: يقوم قسم الموارد البشرية بتقييم الطلب.',
         'jobs', '["application", "status", "interview", "hiring"]'),
        ('Employer Partnership Onboarding', 'استقطاب شراكات أصحاب العمل',
         'To onboard a new employer:\n1. Direct them to the Growth Operator who manages company onboarding.\n2. Provide the magic link process: HR manager receives an SMS with a unique onboarding link.\n3. Required docs: Trade license, company profile, HR contact details.\n4. Timeline: Onboarding typically completes within 3 business days.',
         'لاستقطاب صاحب عمل جديد:\n1. وجههم إلى مشغل النمو الذي يدير استقطاب الشركات.\n2. قدم عملية الرابط السحري.',
         'employer', '["employer", "onboarding", "partnership", "company"]'),
        ('Platform Navigation Help', 'مساعدة في التنقل في المنصة',
         'Key pages for candidates:\n- /dashboard — Main candidate dashboard\n- /jobs — Job listings and search\n- /cv-builder — Create and manage CVs\n- /training — Available training programs\n- /assessments — Skills assessments\n\nFor employers:\n- /recruiter-dashboard — Recruiter workspace\n- /recruiter/jobs — Manage job postings',
         'الصفحات الرئيسية للمرشحين:\n- /dashboard — لوحة تحكم المرشح الرئيسية\n- /jobs — قوائم الوظائف والبحث',
         'general', '["navigation", "pages", "urls", "help"]'),
    ]
    for a in kb_articles:
        cur.execute("""INSERT INTO knowledge_base_articles (title_en, title_ar, body_en, body_ar, category, tags)
            VALUES (%s,%s,%s,%s,%s,%s::jsonb)""", a)
    conn.commit()
    cur.close()
    logger.info("Seeded call center sample data")

_init = False
@platform_ops_bp.before_request
def init():
    global _init
    if _init: return
    conn = get_db()
    if conn:
        try:
            ensure_tables(conn)
            seed_sample_data(conn)
            _init = True
        except Exception as e:
            logger.error(f"Init error: {e}")
        finally: conn.close()


# ═══════ POLICY SIMULATION ═══════
@platform_ops_bp.route('/policy/simulate', methods=['POST'])
def simulate_policy():
    """Run a policy simulation with adjustable parameters."""
    data = request.get_json(silent=True) or {}
    # Parameters
    training_budget_change = data.get('training_budget_change', 0)  # %
    emiratization_target = data.get('emiratization_target', 10)  # %
    incentive_amount = data.get('incentive_amount', 0)  # AED
    sector_focus = data.get('sector_focus', 'all')

    # Baseline metrics (simulated from current platform data)
    baseline = {
        "employment_rate": 68.5,
        "avg_time_to_employment_months": 4.2,
        "skill_gap_index": 35.0,
        "employer_satisfaction": 72.0,
        "emiratization_rate": 15.3,
        "training_completion_rate": 61.0,
    }
    # Projected impact (simplified model)
    projected = {
        "employment_rate": min(100, baseline["employment_rate"] + training_budget_change * 0.15 + incentive_amount * 0.001),
        "avg_time_to_employment_months": max(1, baseline["avg_time_to_employment_months"] - training_budget_change * 0.03),
        "skill_gap_index": max(5, baseline["skill_gap_index"] - training_budget_change * 0.2),
        "employer_satisfaction": min(100, baseline["employer_satisfaction"] + emiratization_target * 0.1 + incentive_amount * 0.002),
        "emiratization_rate": min(100, baseline["emiratization_rate"] + emiratization_target * 0.3),
        "training_completion_rate": min(100, baseline["training_completion_rate"] + training_budget_change * 0.25),
    }
    # Add slight randomness for realism
    for k in projected:
        projected[k] = round(projected[k] + random.uniform(-1.5, 1.5), 1)

    return jsonify({
        "baseline": baseline,
        "projected": projected,
        "parameters": {
            "training_budget_change": training_budget_change,
            "emiratization_target": emiratization_target,
            "incentive_amount": incentive_amount,
            "sector_focus": sector_focus,
        },
        "impact_summary": {
            "employment_change": round(projected["employment_rate"] - baseline["employment_rate"], 1),
            "emiratization_change": round(projected["emiratization_rate"] - baseline["emiratization_rate"], 1),
            "skill_gap_reduction": round(baseline["skill_gap_index"] - projected["skill_gap_index"], 1),
        }
    }), 200

@platform_ops_bp.route('/policy/workforce-forecast', methods=['GET'])
def workforce_forecast():
    """Predictive analytics for workforce supply/demand."""
    return jsonify({
        "forecast_years": [2026, 2027, 2028, 2029, 2030],
        "supply_projection": [45000, 48000, 52000, 55000, 58000],
        "demand_projection": [50000, 54000, 57000, 60000, 63000],
        "gap": [-5000, -6000, -5000, -5000, -5000],
        "top_demand_sectors": [
            {"sector": "Technology", "demand_growth": 15.2},
            {"sector": "Healthcare", "demand_growth": 12.1},
            {"sector": "Finance", "demand_growth": 8.5},
            {"sector": "Energy", "demand_growth": 6.3},
        ]
    }), 200


# ═══════ CONTENT MANAGEMENT ═══════
@platform_ops_bp.route('/content/queue', methods=['GET'])
def content_queue():
    status = request.args.get('status', 'pending')
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT cs.*, u.full_name as submitter_name FROM content_submissions cs
            LEFT JOIN users u ON u.id = cs.submitted_by
            WHERE cs.status = %s ORDER BY cs.created_at DESC
        """, (status,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        items = []
        for r in rows:
            d = dict(r)
            if d.get('created_at'): d['created_at'] = d['created_at'].isoformat()
            items.append(d)
        return jsonify({"items": items, "total": len(items)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/content/<int:content_id>/approve', methods=['PUT'])
@jwt_required(optional=True)
def approve_content(content_id):
    admin_id = None
    try: admin_id = get_jwt_identity()
    except: pass
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("UPDATE content_submissions SET status = 'approved', reviewed_by = %s WHERE id = %s",
                    (admin_id, content_id))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status": "approved"}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/content/<int:content_id>/reject', methods=['PUT'])
@jwt_required(optional=True)
def reject_content(content_id):
    data = request.get_json(silent=True) or {}
    admin_id = None
    try: admin_id = get_jwt_identity()
    except: pass
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("UPDATE content_submissions SET status = 'rejected', reviewed_by = %s, review_notes = %s WHERE id = %s",
                    (admin_id, data.get('reason', ''), content_id))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status": "rejected"}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════ CALL CENTER / SUPPORT TICKETS ═══════
@platform_ops_bp.route('/tickets', methods=['GET'])
@jwt_required(optional=True)
def list_tickets():
    status = request.args.get('status')
    priority = request.args.get('priority')
    agent_id = None
    try: agent_id = get_jwt_identity()
    except: pass
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = "SELECT st.*, u.full_name as user_name FROM support_tickets st LEFT JOIN users u ON u.id = st.user_id WHERE 1=1"
        params = []
        if status: sql += " AND st.status = %s"; params.append(status)
        if priority: sql += " AND st.priority = %s"; params.append(priority)
        sql += " ORDER BY CASE st.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, st.created_at DESC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close(); conn.close()
        tickets = []
        for r in rows:
            d = dict(r)
            for k in ('created_at', 'resolved_at'):
                if d.get(k): d[k] = d[k].isoformat()
            tickets.append(d)
        return jsonify({"tickets": tickets, "total": len(tickets)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/tickets', methods=['POST'])
@jwt_required(optional=True)
def create_ticket():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    if not user_id:
        try: user_id = get_jwt_identity()
        except: pass
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO support_tickets (user_id, created_by_agent, subject, description, category, priority, source)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (user_id, data.get('agent_id'), data.get('subject',''),
              data.get('description',''), data.get('category','general'),
              data.get('priority','medium'), data.get('source','in_app')))
        tid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"ticket_id": tid}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/tickets/<int:ticket_id>', methods=['PUT'])
@jwt_required(optional=True)
def update_ticket(ticket_id):
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        fields, params = [], []
        for f in ['status', 'priority', 'assigned_to', 'escalated_to', 'category']:
            if f in data: fields.append(f"{f} = %s"); params.append(data[f])
        if data.get('status') == 'resolved': fields.append("resolved_at = NOW()")
        if not fields:
            cur.close(); conn.close()
            return jsonify({"error": "No fields"}), 400
        params.append(ticket_id)
        cur.execute(f"UPDATE support_tickets SET {', '.join(fields)} WHERE id = %s RETURNING *", params)
        updated_ticket = cur.fetchone()
        conn.commit()

        # ── Notification: tell ticket owner about status change ──
        new_status = data.get('status')
        if updated_ticket and new_status and updated_ticket.get('user_id'):
            status_labels = {
                'resolved': ('Ticket Resolved', f'Your support ticket #{ticket_id} has been resolved. If the issue persists, you can reopen it.'),
                'in_progress': ('Ticket In Progress', f'Your support ticket #{ticket_id} is now being worked on by our team.'),
                'escalated': ('Ticket Escalated', f'Your support ticket #{ticket_id} has been escalated to a senior specialist for further review.'),
                'closed': ('Ticket Closed', f'Your support ticket #{ticket_id} has been closed.'),
            }
            if new_status in status_labels:
                title, content = status_labels[new_status]
                _create_notification(
                    updated_ticket['user_id'],
                    title,
                    content,
                    metadata={'type': 'ticket_status_update', 'ticket_id': ticket_id,
                              'new_status': new_status, 'priority': 'high',
                              'link': '/candidate-dashboard?tab=messages'}
                )

        cur.close(); conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/tickets/<int:ticket_id>/messages', methods=['GET'])
def get_ticket_messages(ticket_id):
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT tm.*, u.full_name as sender_name FROM ticket_messages tm
            LEFT JOIN users u ON u.id = tm.sender_id
            WHERE tm.ticket_id = %s ORDER BY tm.created_at
        """, (ticket_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        msgs = []
        for r in rows:
            d = dict(r)
            if d.get('created_at'): d['created_at'] = d['created_at'].isoformat()
            msgs.append(d)
        return jsonify({"messages": msgs}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/tickets/<int:ticket_id>/messages', methods=['POST'])
@jwt_required(optional=True)
def add_ticket_message(ticket_id):
    data = request.get_json(silent=True) or {}
    sender_id = None
    try: sender_id = get_jwt_identity()
    except: pass
    if not sender_id: sender_id = data.get('sender_id')
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO ticket_messages (ticket_id, sender_id, message, is_internal_note)
            VALUES (%s,%s,%s,%s) RETURNING id
        """, (ticket_id, sender_id, data.get('message',''), data.get('is_internal_note', False)))
        mid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"message_id": mid}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/user-lookup', methods=['GET'])
@jwt_required(optional=True)
def user_lookup():
    q = request.args.get('q', '')
    if not q or len(q) < 2: return jsonify({"users": []}), 200
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, full_name, email, phone, user_type, created_at FROM users
            WHERE full_name ILIKE %s OR email ILIKE %s OR phone ILIKE %s
            LIMIT 20
        """, (f"%{q}%", f"%{q}%", f"%{q}%"))
        rows = cur.fetchall()
        cur.close(); conn.close()
        users = []
        for r in rows:
            d = dict(r)
            if d.get('created_at'): d['created_at'] = d['created_at'].isoformat()
            users.append(d)
        return jsonify({"users": users, "total": len(users)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/knowledge-base', methods=['GET'])
def search_knowledge_base():
    q = request.args.get('q', '')
    category = request.args.get('category')
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = "SELECT * FROM knowledge_base_articles WHERE 1=1"
        params = []
        if q: sql += " AND (title_en ILIKE %s OR body_en ILIKE %s)"; params.extend([f"%{q}%"]*2)
        if category: sql += " AND category = %s"; params.append(category)
        sql += " ORDER BY created_at DESC LIMIT 50"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close(); conn.close()
        articles = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get('tags'), str): d['tags'] = json.loads(d['tags'])
            if d.get('created_at'): d['created_at'] = d['created_at'].isoformat()
            articles.append(d)
        return jsonify({"articles": articles, "total": len(articles)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@platform_ops_bp.route('/tickets/analytics', methods=['GET'])
def ticket_analytics():
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT status, COUNT(*) as count FROM support_tickets GROUP BY status")
        status_counts = {r['status']: r['count'] for r in cur.fetchall()}
        cur.execute("SELECT category, COUNT(*) as count FROM support_tickets GROUP BY category ORDER BY count DESC")
        category_counts = {r['category']: r['count'] for r in cur.fetchall()}
        cur.execute("SELECT COUNT(*) as total FROM support_tickets")
        total = cur.fetchone()['total']
        cur.close(); conn.close()
        return jsonify({
            "total_tickets": total,
            "by_status": status_counts,
            "by_category": category_counts,
        }), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


# ═══════ LIVE CHAT ═══════

@platform_ops_bp.route('/live-chat/start', methods=['POST'])
@jwt_required(optional=True)
def start_live_chat():
    """User initiates a live chat session."""
    user_id = None
    try: user_id = get_jwt_identity()
    except: pass
    data = request.get_json(silent=True) or {}
    if not user_id:
        user_id = data.get('user_id')
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    category = data.get('category', 'general')
    initial_message = data.get('message', '')

    # Context metadata from the chat initiator
    chat_metadata = {
        'user_role': data.get('user_role', ''),
        'current_route': data.get('current_route', ''),
        'entity_id': data.get('entity_id', ''),
    }

    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Find an available agent (round-robin: agent with fewest active chats)
        cur.execute("""
            SELECT u.id, u.full_name FROM users u
            WHERE u.user_type = 'call_center_agent' OR u.role = 'call_center_agent'
            ORDER BY (
                SELECT COUNT(*) FROM live_chat_sessions lcs
                WHERE lcs.agent_id = u.id AND lcs.status = 'active'
            ) ASC
            LIMIT 1
        """)
        agent_row = cur.fetchone()

        agent_id = agent_row['id'] if agent_row else None
        agent_name = agent_row['full_name'] if agent_row else None
        status = 'waiting'  # even if agent found, wait for accept

        # Create the conversation via the communication_service if available
        conversation_id = None
        if agent_id:
            try:
                from services.communication_service import communication_service
                conv = communication_service.create_conversation(
                    participants=[str(user_id), str(agent_id)],
                    title=f"Live Chat - {category}",
                    participant_roles={str(user_id): 'user', str(agent_id): 'call_center_agent'}
                )
                conversation_id = str(conv.id) if conv else None
            except Exception as ce:
                logger.warning(f"Could not create conversation via service: {ce}")
                conversation_id = f"livechat_{user_id}_{agent_id}_{int(__import__('time').time())}"
        else:
            conversation_id = f"livechat_{user_id}_unassigned_{int(__import__('time').time())}"

        cur.execute("""
            INSERT INTO live_chat_sessions (user_id, agent_id, conversation_id, status, category, initial_message, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, started_at
        """, (user_id, agent_id, conversation_id, status, category, initial_message, json.dumps(chat_metadata)))
        row = cur.fetchone()
        session_id = row['id']
        started_at = row['started_at'].isoformat() if row.get('started_at') else None
        conn.commit()

        # Get user name for the agent notification
        cur.execute("SELECT full_name FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()
        user_name = user_row['full_name'] if user_row else 'User'

        cur.close(); conn.close()

        # Emit socket event to alert agents
        try:
            from flask import current_app
            sio = current_app.extensions.get('socketio')
            if not sio:
                from app import socketio as sio
            if sio:
                sio.emit('live_chat_queue_update', {
                    'session_id': session_id,
                    'user_id': user_id,
                    'user_name': user_name,
                    'category': category,
                    'message': initial_message,
                    'started_at': started_at,
                    'agent_id': agent_id,
                    'metadata': chat_metadata,
                })
        except Exception as se:
            logger.warning(f"Socket emit failed: {se}")

        # ── Notification: alert agent about new chat request ──
        if agent_id:
            _create_notification(
                agent_id,
                f'New Live Chat from {user_name}',
                f'{user_name} needs help with: {category}. "{initial_message[:80]}"' if initial_message else f'{user_name} started a live chat ({category})',
                metadata={'type': 'live_chat_request', 'session_id': session_id, 'priority': 'high',
                          'link': '/call-center-dashboard?tab=live-chats'}
            )

        return jsonify({
            "session_id": session_id,
            "conversation_id": conversation_id,
            "status": status,
            "agent_id": agent_id,
            "agent_name": agent_name,
            "started_at": started_at,
            "metadata": chat_metadata,
        }), 201
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"Live chat start error: {e}")
        return jsonify({"error": str(e)}), 500


@platform_ops_bp.route('/live-chat/session/<int:session_id>', methods=['GET'])
@jwt_required(optional=True)
def get_live_chat_session(session_id):
    """Get details of a live chat session."""
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT lcs.*, u.full_name as user_name, a.full_name as agent_name
            FROM live_chat_sessions lcs
            LEFT JOIN users u ON u.id = lcs.user_id
            LEFT JOIN users a ON a.id = lcs.agent_id
            WHERE lcs.id = %s
        """, (session_id,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return jsonify({"error": "Session not found"}), 404
        d = dict(row)
        for k in ('started_at', 'accepted_at', 'ended_at'):
            if d.get(k): d[k] = d[k].isoformat()
        return jsonify(d), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


@platform_ops_bp.route('/live-chat/session/<int:session_id>/accept', methods=['PUT'])
@jwt_required(optional=True)
def accept_live_chat(session_id):
    """Agent accepts a waiting live chat session."""
    agent_id = None
    try: agent_id = get_jwt_identity()
    except: pass
    data = request.get_json(silent=True) or {}
    if not agent_id:
        agent_id = data.get('agent_id')

    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM live_chat_sessions WHERE id = %s", (session_id,))
        session = cur.fetchone()
        if not session:
            cur.close(); conn.close()
            return jsonify({"error": "Session not found"}), 404
        if session['status'] != 'waiting':
            cur.close(); conn.close()
            return jsonify({"error": "Session is not in waiting status"}), 400

        # If no conversation yet (or needs re-creation with this agent):
        conversation_id = session.get('conversation_id')
        if not conversation_id or 'unassigned' in str(conversation_id):
            try:
                from services.communication_service import communication_service
                conv = communication_service.create_conversation(
                    participants=[str(session['user_id']), str(agent_id)],
                    title=f"Live Chat - {session.get('category', 'general')}",
                    participant_roles={str(session['user_id']): 'user', str(agent_id): 'call_center_agent'}
                )
                conversation_id = str(conv.id) if conv else conversation_id
            except Exception as ce:
                logger.warning(f"Could not create conversation: {ce}")

        cur.execute("""
            UPDATE live_chat_sessions
            SET status = 'active', agent_id = %s, accepted_at = NOW(), conversation_id = %s
            WHERE id = %s
        """, (agent_id, conversation_id, session_id))
        conn.commit()

        # Get agent name
        cur.execute("SELECT full_name FROM users WHERE id = %s", (agent_id,))
        agent_row = cur.fetchone()
        agent_name = agent_row['full_name'] if agent_row else 'Agent'

        cur.close(); conn.close()

        # Emit to both parties
        try:
            from flask import current_app
            sio = current_app.extensions.get('socketio')
            if not sio:
                from app import socketio as sio
            if sio:
                sio.emit('live_chat_assigned', {
                    'session_id': session_id,
                    'agent_id': agent_id,
                    'agent_name': agent_name,
                    'conversation_id': conversation_id,
                    'user_id': session['user_id'],
                })
        except Exception as se:
            logger.warning(f"Socket emit failed: {se}")

        # ── Notification: tell user their chat was accepted ──
        _create_notification(
            session['user_id'],
            f'Agent {agent_name} joined your chat',
            f'Your support request has been accepted. {agent_name} is now assisting you.',
            metadata={'type': 'live_chat_accepted', 'session_id': session_id, 'agent_name': agent_name,
                      'link': '/candidate-dashboard?tab=messages'}
        )

        return jsonify({
            "status": "active",
            "agent_id": agent_id,
            "agent_name": agent_name,
            "conversation_id": conversation_id,
        }), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


@platform_ops_bp.route('/live-chat/session/<int:session_id>/end', methods=['PUT'])
@jwt_required(optional=True)
def end_live_chat(session_id):
    """End a live chat session."""
    user_id = None
    try: user_id = get_jwt_identity()
    except: pass
    data = request.get_json(silent=True) or {}
    ended_by = data.get('ended_by', 'user')
    rating = data.get('rating', 0)
    create_ticket = data.get('create_ticket', False)

    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM live_chat_sessions WHERE id = %s", (session_id,))
        session = cur.fetchone()
        if not session:
            cur.close(); conn.close()
            return jsonify({"error": "Session not found"}), 404

        ticket_id = None
        if create_ticket:
            cur.execute("""
                INSERT INTO support_tickets (user_id, created_by_agent, subject, description, category, source, status)
                VALUES (%s, %s, %s, %s, %s, 'live_chat', 'open') RETURNING id
            """, (
                session['user_id'], session.get('agent_id'),
                f"Live Chat Follow-up - {session.get('category', 'general')}",
                session.get('initial_message', ''),
                session.get('category', 'general'),
            ))
            ticket_id = cur.fetchone()['id']

        cur.execute("""
            UPDATE live_chat_sessions
            SET status = 'ended', ended_at = NOW(), ended_by = %s, rating = %s, ticket_id = %s
            WHERE id = %s
        """, (ended_by, rating, ticket_id, session_id))
        conn.commit()
        cur.close(); conn.close()

        # Emit end event
        try:
            from flask import current_app
            sio = current_app.extensions.get('socketio')
            if not sio:
                from app import socketio as sio
            if sio:
                sio.emit('live_chat_ended', {
                    'session_id': session_id,
                    'ended_by': ended_by,
                    'user_id': session['user_id'],
                    'agent_id': session.get('agent_id'),
                    'ticket_id': ticket_id,
                })
        except Exception as se:
            logger.warning(f"Socket emit failed: {se}")

        # ── Notification: tell user chat ended (+ ticket if created) ──
        if ticket_id:
            _create_notification(
                session['user_id'],
                f'Support Ticket #{ticket_id} Created',
                f'Your live chat has ended and a follow-up ticket #{ticket_id} has been created. You can track its progress in your dashboard.',
                metadata={'type': 'ticket_created', 'ticket_id': ticket_id, 'session_id': session_id, 'priority': 'high',
                          'link': '/candidate-dashboard?tab=messages'}
            )
        else:
            _create_notification(
                session['user_id'],
                'Live Chat Ended',
                'Your support chat session has ended. If you need further help, you can start a new chat anytime.',
                metadata={'type': 'live_chat_ended', 'session_id': session_id,
                          'link': '/candidate-dashboard?tab=messages'}
            )

        return jsonify({"status": "ended", "ticket_id": ticket_id}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


@platform_ops_bp.route('/live-chat/agent/sessions', methods=['GET'])
@jwt_required(optional=True)
def agent_live_chats():
    """Get all live chat sessions for the call center (waiting + active)."""
    status_filter = request.args.get('status')  # 'waiting', 'active', 'ended'
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = """
            SELECT lcs.*, u.full_name as user_name, a.full_name as agent_name
            FROM live_chat_sessions lcs
            LEFT JOIN users u ON u.id = lcs.user_id
            LEFT JOIN users a ON a.id = lcs.agent_id
            WHERE 1=1
        """
        params = []
        if status_filter:
            sql += " AND lcs.status = %s"
            params.append(status_filter)
        else:
            sql += " AND lcs.status IN ('waiting', 'active')"
        sql += " ORDER BY CASE lcs.status WHEN 'waiting' THEN 1 WHEN 'active' THEN 2 ELSE 3 END, lcs.started_at ASC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close(); conn.close()
        sessions = []
        for r in rows:
            d = dict(r)
            for k in ('started_at', 'accepted_at', 'ended_at'):
                if d.get(k): d[k] = d[k].isoformat()
            sessions.append(d)
        return jsonify({"sessions": sessions, "total": len(sessions)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


@platform_ops_bp.route('/live-chat/session/<int:session_id>/rate', methods=['PUT'])
@jwt_required(optional=True)
def rate_live_chat(session_id):
    """Rate a completed live chat session."""
    data = request.get_json(silent=True) or {}
    rating = data.get('rating', 0)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("UPDATE live_chat_sessions SET rating = %s WHERE id = %s", (rating, session_id))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status": "rated", "rating": rating}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500
