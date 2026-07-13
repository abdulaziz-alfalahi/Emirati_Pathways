"""
Career Pathway Simulator API Routes
Blueprint prefix: /api/career-simulator

Provides interactive career path exploration, simulation, and gap analysis.
Used by: Student, Jobseeker, Parent, Advisor, Coach, Government personas.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import os
import json
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

career_simulator_bp = Blueprint('career_simulator', __name__, url_prefix='/api/career-simulator')

def get_db():
    try:
        conn = psycopg2.connect(
            os.getenv('DATABASE_URL',
                       'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey')
        )
        return conn
    except Exception as e:
        logger.error(f"DB connection error: {e}")
        return None


def ensure_tables(conn):
    """Create career_paths and career_simulations tables if they don't exist."""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS career_paths (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title_en VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) DEFAULT '',
            sector VARCHAR(100) NOT NULL,
            sector_ar VARCHAR(100) DEFAULT '',
            description_en TEXT DEFAULT '',
            description_ar TEXT DEFAULT '',
            nodes JSONB NOT NULL DEFAULT '[]',
            growth_rate FLOAT DEFAULT 0.0,
            emiratization_rate FLOAT DEFAULT 0.0,
            avg_salary_range JSONB DEFAULT '{"min": 0, "max": 0}',
            demand_level VARCHAR(20) DEFAULT 'moderate',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS career_simulations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(20) REFERENCES users(id),
            source_role VARCHAR(255) NOT NULL,
            target_role VARCHAR(255) NOT NULL,
            career_path_id UUID REFERENCES career_paths(id),
            gap_analysis JSONB DEFAULT '{}',
            recommended_training JSONB DEFAULT '[]',
            estimated_months INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_career_paths_sector ON career_paths(sector);
        CREATE INDEX IF NOT EXISTS idx_career_simulations_user ON career_simulations(user_id);
    """)
    conn.commit()
    cur.close()


def seed_career_paths(conn):
    """Seed initial UAE-focused career paths if table is empty."""
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM career_paths")
    count = cur.fetchone()[0]
    if count > 0:
        cur.close()
        return

    paths = [
        {
            "title_en": "Software Engineering Leadership",
            "title_ar": "قيادة هندسة البرمجيات",
            "sector": "Technology",
            "sector_ar": "التكنولوجيا",
            "description_en": "From junior developer to engineering director in the UAE tech sector.",
            "description_ar": "من مطور مبتدئ إلى مدير هندسة في قطاع التكنولوجيا الإماراتي.",
            "growth_rate": 12.5,
            "emiratization_rate": 8.2,
            "demand_level": "high",
            "avg_salary_range": {"min": 8000, "max": 65000},
            "nodes": [
                {"role": "Junior Developer", "role_ar": "مطور مبتدئ", "avg_salary": 8000, "years_experience": 0,
                 "required_skills": ["Python", "JavaScript", "Git", "SQL"],
                 "certifications": ["AWS Cloud Practitioner"]},
                {"role": "Mid-Level Developer", "role_ar": "مطور متوسط", "avg_salary": 15000, "years_experience": 2,
                 "required_skills": ["React", "Node.js", "Docker", "CI/CD", "System Design"],
                 "certifications": ["AWS Solutions Architect"]},
                {"role": "Senior Developer", "role_ar": "مطور أول", "avg_salary": 25000, "years_experience": 5,
                 "required_skills": ["Architecture", "Mentoring", "Performance Optimization", "Cloud Infrastructure"],
                 "certifications": ["AWS Professional", "Kubernetes CKA"]},
                {"role": "Tech Lead", "role_ar": "قائد تقني", "avg_salary": 35000, "years_experience": 7,
                 "required_skills": ["Team Leadership", "Project Management", "Stakeholder Communication", "Technical Strategy"],
                 "certifications": ["PMP", "TOGAF"]},
                {"role": "Engineering Manager", "role_ar": "مدير هندسة", "avg_salary": 45000, "years_experience": 10,
                 "required_skills": ["People Management", "Budget Planning", "Organizational Design", "Executive Communication"],
                 "certifications": []},
                {"role": "Engineering Director", "role_ar": "مدير إدارة هندسية", "avg_salary": 65000, "years_experience": 14,
                 "required_skills": ["Strategic Planning", "P&L Management", "Board Reporting", "Innovation Strategy"],
                 "certifications": ["MBA (preferred)"]}
            ]
        },
        {
            "title_en": "Healthcare Administration",
            "title_ar": "إدارة الرعاية الصحية",
            "sector": "Healthcare",
            "sector_ar": "الرعاية الصحية",
            "description_en": "From clinical roles to healthcare leadership in the UAE.",
            "description_ar": "من الأدوار السريرية إلى قيادة الرعاية الصحية في الإمارات.",
            "growth_rate": 9.8,
            "emiratization_rate": 15.4,
            "demand_level": "high",
            "avg_salary_range": {"min": 10000, "max": 55000},
            "nodes": [
                {"role": "Healthcare Assistant", "role_ar": "مساعد رعاية صحية", "avg_salary": 10000, "years_experience": 0,
                 "required_skills": ["Patient Care", "Medical Terminology", "First Aid", "Arabic/English Communication"],
                 "certifications": ["BLS Certification"]},
                {"role": "Clinical Coordinator", "role_ar": "منسق سريري", "avg_salary": 18000, "years_experience": 3,
                 "required_skills": ["Clinical Protocols", "Team Coordination", "EHR Systems", "Quality Assurance"],
                 "certifications": ["Healthcare Quality Certificate"]},
                {"role": "Department Supervisor", "role_ar": "مشرف قسم", "avg_salary": 28000, "years_experience": 6,
                 "required_skills": ["Operational Management", "Staff Scheduling", "Compliance", "Performance Metrics"],
                 "certifications": ["ACHE Fellowship"]},
                {"role": "Healthcare Manager", "role_ar": "مدير رعاية صحية", "avg_salary": 38000, "years_experience": 9,
                 "required_skills": ["Healthcare Policy", "Budget Management", "Regulatory Compliance", "Strategic Planning"],
                 "certifications": ["MHA or MBA-Healthcare"]},
                {"role": "Hospital Director", "role_ar": "مدير مستشفى", "avg_salary": 55000, "years_experience": 14,
                 "required_skills": ["Executive Leadership", "Government Relations", "Capital Planning", "National Health Strategy"],
                 "certifications": ["Board Certification in Healthcare Management"]}
            ]
        },
        {
            "title_en": "Finance & Banking Career Path",
            "title_ar": "مسار وظيفي في المالية والمصارف",
            "sector": "Finance",
            "sector_ar": "المالية",
            "description_en": "Progress from analyst to CFO in UAE's thriving financial sector.",
            "description_ar": "التقدم من محلل إلى مدير مالي في القطاع المالي المزدهر بالإمارات.",
            "growth_rate": 7.3,
            "emiratization_rate": 22.1,
            "demand_level": "high",
            "avg_salary_range": {"min": 12000, "max": 70000},
            "nodes": [
                {"role": "Financial Analyst", "role_ar": "محلل مالي", "avg_salary": 12000, "years_experience": 0,
                 "required_skills": ["Financial Modeling", "Excel", "Accounting Principles", "Data Analysis"],
                 "certifications": ["CFA Level 1"]},
                {"role": "Senior Analyst", "role_ar": "محلل أول", "avg_salary": 20000, "years_experience": 3,
                 "required_skills": ["Valuation", "Risk Assessment", "Bloomberg Terminal", "Presentations"],
                 "certifications": ["CFA Level 2"]},
                {"role": "Finance Manager", "role_ar": "مدير مالي", "avg_salary": 32000, "years_experience": 6,
                 "required_skills": ["Team Management", "Budgeting", "Regulatory Reporting", "Treasury"],
                 "certifications": ["CFA Charterholder", "CPA"]},
                {"role": "VP Finance", "role_ar": "نائب رئيس المالية", "avg_salary": 48000, "years_experience": 10,
                 "required_skills": ["Strategic Finance", "M&A", "Investor Relations", "Board Reporting"],
                 "certifications": []},
                {"role": "Chief Financial Officer", "role_ar": "الرئيس التنفيذي المالي", "avg_salary": 70000, "years_experience": 15,
                 "required_skills": ["Corporate Strategy", "Governance", "Capital Markets", "Transformation"],
                 "certifications": ["MBA (preferred)"]}
            ]
        },
        {
            "title_en": "Oil & Gas Engineering",
            "title_ar": "هندسة النفط والغاز",
            "sector": "Energy",
            "sector_ar": "الطاقة",
            "description_en": "Technical career in the UAE's flagship energy industry.",
            "description_ar": "مسار مهني تقني في صناعة الطاقة الرائدة في الإمارات.",
            "growth_rate": 4.2,
            "emiratization_rate": 35.0,
            "demand_level": "moderate",
            "avg_salary_range": {"min": 15000, "max": 60000},
            "nodes": [
                {"role": "Graduate Engineer", "role_ar": "مهندس خريج", "avg_salary": 15000, "years_experience": 0,
                 "required_skills": ["Engineering Fundamentals", "HSE Awareness", "AutoCAD", "Technical Reporting"],
                 "certifications": ["NEBOSH IGC"]},
                {"role": "Process Engineer", "role_ar": "مهندس عمليات", "avg_salary": 22000, "years_experience": 3,
                 "required_skills": ["Process Simulation", "HAZOP", "P&ID", "Process Control"],
                 "certifications": ["CEng or PE"]},
                {"role": "Senior Engineer", "role_ar": "مهندس أول", "avg_salary": 32000, "years_experience": 7,
                 "required_skills": ["Project Management", "Contractor Management", "Technical Specifications", "Commissioning"],
                 "certifications": ["PMP"]},
                {"role": "Principal Engineer", "role_ar": "مهندس رئيسي", "avg_salary": 45000, "years_experience": 12,
                 "required_skills": ["Technical Authority", "Innovation", "Mentoring", "Technology Selection"],
                 "certifications": []},
                {"role": "Engineering Director", "role_ar": "مدير الهندسة", "avg_salary": 60000, "years_experience": 18,
                 "required_skills": ["Strategic Direction", "Emiratization Strategy", "CAPEX Planning", "Government Liaison"],
                 "certifications": ["MBA (preferred)"]}
            ]
        },
        {
            "title_en": "Digital Marketing & Media",
            "title_ar": "التسويق الرقمي والإعلام",
            "sector": "Marketing",
            "sector_ar": "التسويق",
            "description_en": "Creative career from content creator to CMO in the UAE market.",
            "description_ar": "مسار إبداعي من صانع محتوى إلى مدير تسويق أول في السوق الإماراتي.",
            "growth_rate": 15.2,
            "emiratization_rate": 11.0,
            "demand_level": "high",
            "avg_salary_range": {"min": 7000, "max": 50000},
            "nodes": [
                {"role": "Content Creator", "role_ar": "صانع محتوى", "avg_salary": 7000, "years_experience": 0,
                 "required_skills": ["Social Media", "Copywriting", "Canva/Adobe", "Photography"],
                 "certifications": ["Google Digital Marketing"]},
                {"role": "Digital Marketing Specialist", "role_ar": "أخصائي تسويق رقمي", "avg_salary": 12000, "years_experience": 2,
                 "required_skills": ["SEO/SEM", "Google Analytics", "Paid Advertising", "Email Marketing"],
                 "certifications": ["Google Ads Certification", "HubSpot Inbound"]},
                {"role": "Marketing Manager", "role_ar": "مدير تسويق", "avg_salary": 22000, "years_experience": 5,
                 "required_skills": ["Campaign Strategy", "Brand Management", "Team Leadership", "Budget Management"],
                 "certifications": ["CIM Diploma"]},
                {"role": "Head of Marketing", "role_ar": "رئيس التسويق", "avg_salary": 35000, "years_experience": 9,
                 "required_skills": ["Omnichannel Strategy", "Data-Driven Marketing", "Agency Management", "C-Suite Communication"],
                 "certifications": []},
                {"role": "Chief Marketing Officer", "role_ar": "مدير التسويق الأول", "avg_salary": 50000, "years_experience": 13,
                 "required_skills": ["Business Strategy", "Revenue Growth", "Digital Transformation", "Board Presentation"],
                 "certifications": ["MBA (preferred)"]}
            ]
        },
        {
            "title_en": "Education & Academic Leadership",
            "title_ar": "القيادة التعليمية والأكاديمية",
            "sector": "Education",
            "sector_ar": "التعليم",
            "description_en": "From teacher to school principal or education policy maker.",
            "description_ar": "من معلم إلى مدير مدرسة أو صانع سياسات تعليمية.",
            "growth_rate": 6.1,
            "emiratization_rate": 28.5,
            "demand_level": "moderate",
            "avg_salary_range": {"min": 10000, "max": 45000},
            "nodes": [
                {"role": "Teacher", "role_ar": "معلم", "avg_salary": 10000, "years_experience": 0,
                 "required_skills": ["Pedagogy", "Classroom Management", "Curriculum Delivery", "Student Assessment"],
                 "certifications": ["Teaching License"]},
                {"role": "Senior Teacher / Head of Department", "role_ar": "معلم أول / رئيس قسم", "avg_salary": 16000, "years_experience": 4,
                 "required_skills": ["Mentoring", "Curriculum Design", "Data-Driven Instruction", "Professional Development"],
                 "certifications": ["PGCE or MEd"]},
                {"role": "Vice Principal", "role_ar": "نائب مدير", "avg_salary": 25000, "years_experience": 8,
                 "required_skills": ["School Operations", "Staff Management", "Parent Communication", "Compliance"],
                 "certifications": ["Leadership Certificate"]},
                {"role": "School Principal", "role_ar": "مدير مدرسة", "avg_salary": 35000, "years_experience": 12,
                 "required_skills": ["Strategic Vision", "Community Engagement", "Budget Management", "Accreditation"],
                 "certifications": ["NPQH or Equivalent"]},
                {"role": "Director of Education", "role_ar": "مدير التعليم", "avg_salary": 45000, "years_experience": 16,
                 "required_skills": ["Policy Development", "Large-Scale Reform", "Government Relations", "System-Level Thinking"],
                 "certifications": ["EdD or PhD (preferred)"]}
            ]
        },
        {
            "title_en": "Hospitality & Tourism Management",
            "title_ar": "إدارة الضيافة والسياحة",
            "sector": "Hospitality",
            "sector_ar": "الضيافة",
            "description_en": "Career growth in the UAE's world-class hospitality industry.",
            "description_ar": "نمو مهني في صناعة الضيافة العالمية بالإمارات.",
            "growth_rate": 8.5,
            "emiratization_rate": 12.3,
            "demand_level": "high",
            "avg_salary_range": {"min": 6000, "max": 45000},
            "nodes": [
                {"role": "Guest Service Agent", "role_ar": "وكيل خدمة ضيوف", "avg_salary": 6000, "years_experience": 0,
                 "required_skills": ["Customer Service", "Communication", "Opera PMS", "Multilingual"],
                 "certifications": ["Hospitality Certificate"]},
                {"role": "Front Office Supervisor", "role_ar": "مشرف مكتب أمامي", "avg_salary": 10000, "years_experience": 2,
                 "required_skills": ["Team Supervision", "Revenue Management", "Guest Recovery", "Training"],
                 "certifications": []},
                {"role": "Department Manager", "role_ar": "مدير قسم", "avg_salary": 18000, "years_experience": 5,
                 "required_skills": ["Departmental P&L", "Quality Standards", "Staff Development", "Cross-Functional Collaboration"],
                 "certifications": ["Certified Hotel Administrator"]},
                {"role": "Hotel General Manager", "role_ar": "مدير عام فندق", "avg_salary": 35000, "years_experience": 10,
                 "required_skills": ["Full P&L Ownership", "Asset Management", "Brand Standards", "Owner Relations"],
                 "certifications": []},
                {"role": "Regional VP / CEO", "role_ar": "نائب رئيس إقليمي", "avg_salary": 45000, "years_experience": 15,
                 "required_skills": ["Multi-Property Oversight", "Strategic Expansion", "Government Partnerships", "Tourism Development"],
                 "certifications": ["MBA (preferred)"]}
            ]
        }
    ]

    for p in paths:
        cur.execute("""
            INSERT INTO career_paths (title_en, title_ar, sector, sector_ar, description_en, description_ar,
                                       nodes, growth_rate, emiratization_rate, avg_salary_range, demand_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            p["title_en"], p["title_ar"], p["sector"], p["sector_ar"],
            p["description_en"], p["description_ar"],
            json.dumps(p["nodes"]), p["growth_rate"], p["emiratization_rate"],
            json.dumps(p["avg_salary_range"]), p["demand_level"]
        ))
    conn.commit()
    cur.close()
    logger.info(f"✅ Seeded {len(paths)} career paths")


# ═══════════════════════════════════════════════════════════
# INITIALIZATION — Auto-create tables + seed on first request
# ═══════════════════════════════════════════════════════════

_initialized = False

@career_simulator_bp.before_request
def init_tables():
    """Ensure tables exist on first request."""
    global _initialized
    if _initialized:
        return
    conn = get_db()
    if conn:
        try:
            ensure_tables(conn)
            seed_career_paths(conn)
            _initialized = True
        except Exception as e:
            logger.error(f"Career simulator init error: {e}")
        finally:
            conn.close()


# ═══════════════════════════════════════════════════════════
# GET ALL CAREER PATHS
# ═══════════════════════════════════════════════════════════

@career_simulator_bp.route('/paths', methods=['GET'])
def list_career_paths():
    """List all career paths, optionally filtered by sector."""
    sector = request.args.get('sector')
    demand = request.args.get('demand_level')
    search = request.args.get('search', '')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = "SELECT * FROM career_paths WHERE is_active = true"
        params = []
        if sector:
            sql += " AND sector ILIKE %s"
            params.append(f"%{sector}%")
        if demand:
            sql += " AND demand_level = %s"
            params.append(demand)
        if search:
            sql += " AND (title_en ILIKE %s OR title_ar ILIKE %s OR sector ILIKE %s)"
            params.extend([f"%{search}%"] * 3)
        sql += " ORDER BY growth_rate DESC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        paths = []
        for r in rows:
            d = dict(r)
            # Parse JSONB fields
            if isinstance(d.get('nodes'), str):
                d['nodes'] = json.loads(d['nodes'])
            if isinstance(d.get('avg_salary_range'), str):
                d['avg_salary_range'] = json.loads(d['avg_salary_range'])
            # Add computed fields
            nodes = d.get('nodes', [])
            d['total_steps'] = len(nodes)
            d['entry_salary'] = nodes[0].get('avg_salary', 0) if nodes else 0
            d['peak_salary'] = nodes[-1].get('avg_salary', 0) if nodes else 0
            d['years_to_peak'] = nodes[-1].get('years_experience', 0) if nodes else 0
            # Serialize datetimes
            for k in ('created_at', 'updated_at'):
                if d.get(k):
                    d[k] = d[k].isoformat()
            d['id'] = str(d['id'])
            paths.append(d)

        return jsonify({"paths": paths, "total": len(paths)}), 200
    except Exception as e:
        conn.close()
        logger.error(f"List career paths error: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# GET SINGLE CAREER PATH
# ═══════════════════════════════════════════════════════════

@career_simulator_bp.route('/paths/<path_id>', methods=['GET'])
def get_career_path(path_id):
    """Get full detail for a single career path."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM career_paths WHERE id = %s", (path_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return jsonify({"error": "Career path not found"}), 404
        d = dict(row)
        if isinstance(d.get('nodes'), str):
            d['nodes'] = json.loads(d['nodes'])
        if isinstance(d.get('avg_salary_range'), str):
            d['avg_salary_range'] = json.loads(d['avg_salary_range'])
        for k in ('created_at', 'updated_at'):
            if d.get(k):
                d[k] = d[k].isoformat()
        d['id'] = str(d['id'])
        return jsonify(d), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# GET SECTORS SUMMARY
# ═══════════════════════════════════════════════════════════

@career_simulator_bp.route('/sectors', methods=['GET'])
def get_sectors():
    """Get sector-level aggregates."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT sector, sector_ar,
                   COUNT(*) as path_count,
                   AVG(growth_rate) as avg_growth_rate,
                   AVG(emiratization_rate) as avg_emiratization_rate,
                   MAX(demand_level) as top_demand_level
            FROM career_paths
            WHERE is_active = true
            GROUP BY sector, sector_ar
            ORDER BY AVG(growth_rate) DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        sectors = []
        for r in rows:
            d = dict(r)
            d['avg_growth_rate'] = round(float(d['avg_growth_rate'] or 0), 1)
            d['avg_emiratization_rate'] = round(float(d['avg_emiratization_rate'] or 0), 1)
            sectors.append(d)
        return jsonify({"sectors": sectors, "total": len(sectors)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# SIMULATE CAREER PATH
# ═══════════════════════════════════════════════════════════

@career_simulator_bp.route('/simulate', methods=['POST'])
@jwt_required()
def simulate_career():
    """
    Given current skills + target role, compute:
    - Gap analysis (missing skills, certifications)
    - Estimated time to reach target
    - Recommended training
    """
    user_id = get_jwt_identity()

    data = request.get_json(silent=True) or {}
    source_role = data.get('source_role', '').strip()
    target_role = data.get('target_role', '').strip()
    current_skills = [s.lower() for s in data.get('current_skills', [])]
    career_path_id = data.get('career_path_id')

    if not target_role:
        return jsonify({"error": "target_role is required"}), 400

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Find relevant career path
        if career_path_id:
            cur.execute("SELECT * FROM career_paths WHERE id = %s", (career_path_id,))
        else:
            cur.execute("""
                SELECT * FROM career_paths WHERE is_active = true
                AND (nodes::text ILIKE %s OR nodes::text ILIKE %s)
                LIMIT 1
            """, (f"%{target_role}%", f"%{source_role}%"))

        path_row = cur.fetchone()
        if not path_row:
            cur.close()
            conn.close()
            return jsonify({
                "simulation": {
                    "source_role": source_role,
                    "target_role": target_role,
                    "gap_analysis": {"message": "No matching career path found. Try a different role."},
                    "estimated_months": 0,
                    "recommended_training": []
                }
            }), 200

        path = dict(path_row)
        nodes = path['nodes'] if isinstance(path['nodes'], list) else json.loads(path['nodes'])

        # Find source and target nodes
        source_idx = 0
        target_idx = len(nodes) - 1
        for i, node in enumerate(nodes):
            if source_role.lower() in node.get('role', '').lower():
                source_idx = i
            if target_role.lower() in node.get('role', '').lower():
                target_idx = i

        if target_idx <= source_idx:
            target_idx = min(source_idx + 1, len(nodes) - 1)

        # Calculate gaps
        all_required_skills = set()
        all_certifications = set()
        for node in nodes[source_idx + 1:target_idx + 1]:
            for skill in node.get('required_skills', []):
                all_required_skills.add(skill)
            for cert in node.get('certifications', []):
                all_certifications.add(cert)

        missing_skills = [s for s in all_required_skills if s.lower() not in current_skills]
        total_skills = len(all_required_skills)
        covered_skills = total_skills - len(missing_skills)

        # Estimate time
        source_years = nodes[source_idx].get('years_experience', 0)
        target_years = nodes[target_idx].get('years_experience', 0)
        estimated_months = (target_years - source_years) * 12

        # Salary progression
        source_salary = nodes[source_idx].get('avg_salary', 0)
        target_salary = nodes[target_idx].get('avg_salary', 0)

        # Build recommended training
        recommended_training = []
        for skill in missing_skills[:10]:  # Top 10
            recommended_training.append({
                "skill": skill,
                "priority": "high" if skill in (nodes[source_idx + 1].get('required_skills', []) if source_idx + 1 < len(nodes) else []) else "medium",
                "type": "course"
            })
        for cert in all_certifications:
            recommended_training.append({
                "skill": cert,
                "priority": "medium",
                "type": "certification"
            })

        gap_analysis = {
            "total_required_skills": total_skills,
            "skills_you_have": covered_skills,
            "missing_skills": missing_skills,
            "missing_certifications": list(all_certifications),
            "readiness_percentage": round((covered_skills / total_skills * 100) if total_skills > 0 else 0, 1),
            "salary_current": source_salary,
            "salary_target": target_salary,
            "salary_increase_pct": round(((target_salary - source_salary) / source_salary * 100) if source_salary > 0 else 0, 1),
            "steps_remaining": target_idx - source_idx,
            "path_nodes": nodes[source_idx:target_idx + 1]
        }

        # Save simulation if user is authenticated
        simulation_id = None
        if user_id:
            try:
                cur.execute("""
                    INSERT INTO career_simulations (user_id, source_role, target_role, career_path_id, gap_analysis, recommended_training, estimated_months)
                    VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (user_id, source_role, target_role, path['id'],
                      json.dumps(gap_analysis), json.dumps(recommended_training), estimated_months))
                simulation_id = str(cur.fetchone()['id'])
                conn.commit()
            except Exception as save_err:
                logger.warning(f"Failed to save simulation: {save_err}")
                conn.rollback()

        cur.close()
        conn.close()

        return jsonify({
            "simulation": {
                "id": simulation_id,
                "source_role": source_role or nodes[source_idx]['role'],
                "target_role": target_role or nodes[target_idx]['role'],
                "career_path": {
                    "id": str(path['id']),
                    "title_en": path['title_en'],
                    "sector": path['sector']
                },
                "gap_analysis": gap_analysis,
                "estimated_months": estimated_months,
                "recommended_training": recommended_training
            }
        }), 200
    except Exception as e:
        conn.close()
        logger.error(f"Simulation error: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# USER SIMULATION HISTORY
# ═══════════════════════════════════════════════════════════

@career_simulator_bp.route('/my-simulations', methods=['GET'])
@jwt_required()
def get_my_simulations():
    """Get user's saved career simulations."""
    user_id = get_jwt_identity()

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT cs.*, cp.title_en as path_title, cp.sector
            FROM career_simulations cs
            LEFT JOIN career_paths cp ON cp.id = cs.career_path_id
            WHERE cs.user_id = %s
            ORDER BY cs.created_at DESC
            LIMIT 20
        """, (user_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        simulations = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get('gap_analysis'), str):
                d['gap_analysis'] = json.loads(d['gap_analysis'])
            if isinstance(d.get('recommended_training'), str):
                d['recommended_training'] = json.loads(d['recommended_training'])
            if d.get('created_at'):
                d['created_at'] = d['created_at'].isoformat()
            d['id'] = str(d['id'])
            if d.get('career_path_id'):
                d['career_path_id'] = str(d['career_path_id'])
            simulations.append(d)

        return jsonify({"simulations": simulations, "total": len(simulations)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# COMPARE CAREER PATHS
# ═══════════════════════════════════════════════════════════

@career_simulator_bp.route('/compare', methods=['POST'])
def compare_paths():
    """Compare multiple career paths side-by-side."""
    data = request.get_json(silent=True) or {}
    path_ids = data.get('path_ids', [])
    if not path_ids or len(path_ids) < 2:
        return jsonify({"error": "Provide at least 2 path_ids to compare"}), 400

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        placeholders = ','.join(['%s'] * len(path_ids))
        cur.execute(f"SELECT * FROM career_paths WHERE id IN ({placeholders})", path_ids)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        comparison = []
        for r in rows:
            d = dict(r)
            nodes = d['nodes'] if isinstance(d['nodes'], list) else json.loads(d['nodes'])
            comparison.append({
                "id": str(d['id']),
                "title_en": d['title_en'],
                "title_ar": d.get('title_ar', ''),
                "sector": d['sector'],
                "growth_rate": d['growth_rate'],
                "emiratization_rate": d['emiratization_rate'],
                "demand_level": d['demand_level'],
                "entry_salary": nodes[0].get('avg_salary', 0) if nodes else 0,
                "peak_salary": nodes[-1].get('avg_salary', 0) if nodes else 0,
                "years_to_peak": nodes[-1].get('years_experience', 0) if nodes else 0,
                "total_steps": len(nodes),
                "roles": [n.get('role', '') for n in nodes]
            })

        return jsonify({"comparison": comparison}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500
