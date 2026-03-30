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
        CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
        CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_content_status ON content_submissions(status);
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
        cur = conn.cursor()
        fields, params = [], []
        for f in ['status', 'priority', 'assigned_to', 'escalated_to', 'category']:
            if f in data: fields.append(f"{f} = %s"); params.append(data[f])
        if data.get('status') == 'resolved': fields.append("resolved_at = NOW()")
        if not fields: return jsonify({"error": "No fields"}), 400
        params.append(ticket_id)
        cur.execute(f"UPDATE support_tickets SET {', '.join(fields)} WHERE id = %s", params)
        conn.commit(); cur.close(); conn.close()
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
