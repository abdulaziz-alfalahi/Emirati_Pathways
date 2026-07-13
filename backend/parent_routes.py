"""
Parent Dashboard API Routes
Blueprint prefix: /api/parent
Real data endpoints for parent-child linking and child progress monitoring.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2, psycopg2.extras, os, json, logging

logger = logging.getLogger(__name__)
parent_bp = Blueprint('parent', __name__, url_prefix='/api/parent')

def get_db():
    try:
        return psycopg2.connect(os.getenv('DATABASE_URL',
            'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'))
    except Exception as e:
        logger.error(f"DB error: {e}"); return None


def _verify_parent_of_child(conn, parent_id, child_id):
    """True if a VERIFIED parent->child link exists for this parent."""
    cur = conn.cursor()
    cur.execute("""SELECT 1 FROM parent_child_links
                   WHERE parent_user_id = %s AND child_user_id = %s AND verified = true""",
                (parent_id, child_id))
    ok = cur.fetchone() is not None
    cur.close()
    return ok

def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS parent_child_links (
            id SERIAL PRIMARY KEY,
            parent_user_id INTEGER REFERENCES users(id),
            child_user_id INTEGER REFERENCES users(id),
            relationship VARCHAR(20) DEFAULT 'parent',
            verified BOOLEAN DEFAULT false,
            verification_code VARCHAR(10),
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(parent_user_id, child_user_id)
        );
        CREATE INDEX IF NOT EXISTS idx_pcl_parent ON parent_child_links(parent_user_id);
    """)
    conn.commit(); cur.close()

_init = False
@parent_bp.before_request
def init():
    global _init
    if _init: return
    conn = get_db()
    if conn:
        try: ensure_tables(conn); _init = True
        except: pass
        finally: conn.close()

@parent_bp.route('/children', methods=['GET'])
@jwt_required()
def get_children():
    parent_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT pcl.child_user_id, pcl.relationship, pcl.verified, u.full_name, u.email,
                   (SELECT COUNT(*) FROM passport_stamps ps JOIN career_passports cp ON cp.id = ps.passport_id WHERE cp.user_id = pcl.child_user_id) as stamp_count,
                   (SELECT COUNT(*) FROM student_goals sg WHERE sg.student_id = pcl.child_user_id) as goal_count
            FROM parent_child_links pcl
            LEFT JOIN users u ON u.id = pcl.child_user_id
            WHERE pcl.parent_user_id = %s
            ORDER BY u.full_name
        """, (parent_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        children = []
        for r in rows:
            d = dict(r)
            children.append(d)
        return jsonify({"children": children, "total": len(children)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@parent_bp.route('/children/<int:child_id>/academic', methods=['GET'])
@jwt_required()
def get_child_academic(child_id):
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    if not _verify_parent_of_child(conn, get_jwt_identity(), child_id):
        conn.close(); return jsonify({"error": "Forbidden - not your child"}), 403
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Get enrolled courses
        cur.execute("""
            SELECT tc.title_en as title, tc.provider, ce.progress, ce.status, ce.enrolled_at
            FROM course_enrollments ce
            JOIN training_courses tc ON tc.id = ce.course_id
            WHERE ce.user_id = %s ORDER BY ce.enrolled_at DESC LIMIT 10
        """, (child_id,))
        courses = [dict(r) for r in cur.fetchall()]
        for c in courses:
            if c.get('enrolled_at'): c['enrolled_at'] = c['enrolled_at'].isoformat()
        cur.close(); conn.close()
        return jsonify({"courses": courses, "total": len(courses)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@parent_bp.route('/children/<int:child_id>/career-passport', methods=['GET'])
@jwt_required()
def get_child_passport(child_id):
    """Read-only view of child's career passport."""
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    if not _verify_parent_of_child(conn, get_jwt_identity(), child_id):
        conn.close(); return jsonify({"error": "Forbidden - not your child"}), 403
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id FROM career_passports WHERE user_id = %s", (child_id,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return jsonify({"stamps": [], "total": 0}), 200
        cur.execute("""
            SELECT category, title_en, issuer, earned_at, verified FROM passport_stamps
            WHERE passport_id = %s ORDER BY earned_at DESC
        """, (str(row['id']),))
        stamps = [dict(r) for r in cur.fetchall()]
        for s in stamps:
            if s.get('earned_at'): s['earned_at'] = s['earned_at'].isoformat()
        cur.close(); conn.close()
        return jsonify({"stamps": stamps, "total": len(stamps)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@parent_bp.route('/link-child', methods=['POST'])
@jwt_required()
def link_child():
    parent_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    child_email = data.get('child_email')
    if not child_email: return jsonify({"error": "child_email required"}), 400
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id FROM users WHERE email = %s", (child_email,))
        child = cur.fetchone()
        if not child:
            cur.close(); conn.close()
            return jsonify({"error": "Child account not found"}), 404
        import random, string
        code = ''.join(random.choices(string.digits, k=6))
        cur.execute("""
            INSERT INTO parent_child_links (parent_user_id, child_user_id, relationship, verification_code)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (parent_user_id, child_user_id) DO UPDATE SET verification_code = %s
            RETURNING id
        """, (parent_id, child['id'], data.get('relationship', 'parent'), code, code))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status": "linked", "verification_code": code, "message": "Share this code with your child to verify"}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500
