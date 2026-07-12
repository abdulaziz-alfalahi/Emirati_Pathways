"""
Training Center Self-Service API Routes
Blueprint prefix: /api/training-center
Self-management portal for training center reps to list programs, track enrollments, issue certificates.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2, psycopg2.extras, os, json, logging

logger = logging.getLogger(__name__)
training_center_bp = Blueprint('training_center', __name__, url_prefix='/api/training-center')

# Roles permitted to operate a training center (manage courses, issue certificates).
_TRAINING_ROLES = {'training_provider', 'training_center_rep', 'educator',
                   'education_operator', 'admin', 'super_admin'}


def _require_training_role():
    """Return a (response, 403) if the caller isn't a training provider, else None."""
    try:
        role = (get_jwt() or {}).get('role', '')
    except Exception:
        role = ''
    if role not in _TRAINING_ROLES:
        return jsonify({"error": "Forbidden - training provider access required"}), 403
    return None

def get_db():
    try:
        return psycopg2.connect(os.getenv('DATABASE_URL',
            'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'))
    except Exception as e:
        logger.error(f"DB error: {e}"); return None

def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS training_center_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) UNIQUE,
            center_name VARCHAR(255) NOT NULL DEFAULT '',
            accreditations JSONB DEFAULT '[]',
            specializations JSONB DEFAULT '[]',
            facilities TEXT DEFAULT '',
            website VARCHAR(500) DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    conn.commit(); cur.close()

_init = False
@training_center_bp.before_request
def init():
    global _init
    if _init: return
    conn = get_db()
    if conn:
        try: ensure_tables(conn); _init = True
        except: pass
        finally: conn.close()

@training_center_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    # Owner is always the authenticated caller (no client-supplied ?user_id).
    user_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM training_center_profiles WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row: return jsonify({"profile": None}), 200
        d = dict(row)
        for k in ('accreditations', 'specializations'):
            if isinstance(d.get(k), str): d[k] = json.loads(d[k])
        if d.get('created_at'): d['created_at'] = d['created_at'].isoformat()
        return jsonify({"profile": d}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@training_center_bp.route('/programs', methods=['GET'])
@jwt_required()
def list_programs():
    # Owner is always the authenticated caller (no client-supplied ?user_id).
    user_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Look up their center_id first
        cur.execute("SELECT id FROM training_center_profiles WHERE user_id = %s", (user_id,))
        center = cur.fetchone()
        if not center:
            cur.close(); conn.close()
            return jsonify({"programs": [], "total": 0}), 200
        cur.execute("""
            SELECT tc.*, (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = tc.id) as enrolled_count
            FROM training_courses tc WHERE tc.provider ILIKE (
                SELECT center_name FROM training_center_profiles WHERE id = %s
            ) ORDER BY tc.created_at DESC
        """, (center['id'],))
        rows = cur.fetchall()
        cur.close(); conn.close()
        programs = []
        for r in rows:
            d = dict(r)
            for k in ('created_at',):
                if d.get(k): d[k] = d[k].isoformat()
            programs.append(d)
        return jsonify({"programs": programs, "total": len(programs)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@training_center_bp.route('/programs', methods=['POST'])
@jwt_required()
def create_program():
    guard = _require_training_role()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO training_courses (title_en, title_ar, description_en, description_ar,
                provider, category, duration, level, skills_covered, price, capacity, is_active)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true) RETURNING id
        """, (data.get('title_en',''), data.get('title_ar',''), data.get('description_en',''),
              data.get('description_ar',''), data.get('provider',''), data.get('category',''),
              data.get('duration',''), data.get('level','beginner'),
              json.dumps(data.get('skills_covered', [])), data.get('price', 0),
              data.get('capacity', 30)))
        pid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"program_id": pid}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500

@training_center_bp.route('/certificates', methods=['POST'])
@jwt_required()
def issue_certificate():
    """Issue certificate → auto-create passport stamp. Training-provider only."""
    guard = _require_training_role()
    if guard:
        return guard
    data = request.get_json(silent=True) or {}
    student_id = data.get('student_id')
    course_title = data.get('course_title', '')
    if not student_id: return jsonify({"error": "student_id required"}), 400
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Attribute the issuer to the authenticated training center, not a spoofable body value
        cur.execute("SELECT center_name FROM training_center_profiles WHERE user_id = %s", (get_jwt_identity(),))
        _prof = cur.fetchone()
        issuer = (_prof or {}).get('center_name') or data.get('issuer', '')
        # Auto-create passport stamp
        cur.execute("SELECT id FROM career_passports WHERE user_id = %s", (student_id,))
        passport = cur.fetchone()
        if not passport:
            cur.execute("INSERT INTO career_passports (user_id) VALUES (%s) RETURNING id", (student_id,))
            passport = cur.fetchone()
        cur.execute("""
            INSERT INTO passport_stamps (passport_id, category, title_en, issuer, verified, icon, color)
            VALUES (%s, 'certification', %s, %s, true, '🎖️', '#f59e0b') RETURNING id
        """, (str(passport['id']), course_title, issuer))
        stamp_id = str(cur.fetchone()['id'])
        # Update passport count
        cur.execute("SELECT COUNT(*) as total FROM passport_stamps WHERE passport_id = %s", (str(passport['id']),))
        total = cur.fetchone()['total']
        cur.execute("UPDATE career_passports SET total_stamps = %s, updated_at = NOW() WHERE id = %s",
                    (total, str(passport['id'])))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"stamp_id": stamp_id, "message": "Certificate issued and passport stamp created"}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500

@training_center_bp.route('/analytics', methods=['GET'])
@jwt_required()
def center_analytics():
    # Owner is always the authenticated caller (no client-supplied ?user_id).
    user_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT center_name FROM training_center_profiles WHERE user_id = %s", (user_id,))
        center = cur.fetchone()
        if not center:
            cur.close(); conn.close()
            return jsonify({"total_programs": 0, "total_enrollments": 0}), 200
        cur.execute("SELECT COUNT(*) as total FROM training_courses WHERE provider ILIKE %s", (f"%{center['center_name']}%",))
        progs = cur.fetchone()['total']
        cur.close(); conn.close()
        return jsonify({"total_programs": progs, "center_name": center['center_name']}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500
