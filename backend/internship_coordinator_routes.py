"""
Internship Coordinator API Routes
Blueprint prefix: /api/internship-coord
Full internship lifecycle: programs, matching, placements, evaluations.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2, psycopg2.extras, os, json, logging

logger = logging.getLogger(__name__)
internship_coord_bp = Blueprint('internship_coord', __name__, url_prefix='/api/internship-coord')

def get_db():
    try:
        return psycopg2.connect(os.getenv('DATABASE_URL',
            'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'))
    except Exception as e:
        logger.error(f"DB error: {e}"); return None

def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS internship_programs (
            id SERIAL PRIMARY KEY,
            coordinator_id INTEGER REFERENCES users(id),
            title VARCHAR(255) NOT NULL,
            institution VARCHAR(255) DEFAULT '',
            season VARCHAR(50) DEFAULT 'summer',
            start_date DATE, end_date DATE,
            credit_value INTEGER DEFAULT 0,
            max_students INTEGER DEFAULT 20,
            requirements JSONB DEFAULT '{}',
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS internship_placements (
            id SERIAL PRIMARY KEY,
            program_id INTEGER REFERENCES internship_programs(id),
            student_id INTEGER REFERENCES users(id),
            company_id INTEGER,
            position_title VARCHAR(255) DEFAULT '',
            start_date DATE, end_date DATE,
            status VARCHAR(30) DEFAULT 'pending',
            supervisor_name VARCHAR(255) DEFAULT '',
            supervisor_email VARCHAR(255) DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS internship_evaluations (
            id SERIAL PRIMARY KEY,
            placement_id INTEGER REFERENCES internship_placements(id),
            evaluator_type VARCHAR(30) DEFAULT 'coordinator',
            competencies JSONB DEFAULT '{}',
            rating INTEGER DEFAULT 0,
            feedback TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    conn.commit(); cur.close()

_init = False
@internship_coord_bp.before_request
def init():
    global _init
    if _init: return
    conn = get_db()
    if conn:
        try: ensure_tables(conn); _init = True
        except: pass
        finally: conn.close()

@internship_coord_bp.route('/programs', methods=['GET'])
@jwt_required(optional=True)
def list_programs():
    coord_id = None
    try: coord_id = get_jwt_identity()
    except: pass
    if not coord_id: coord_id = request.args.get('coordinator_id', 1)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT ip.*,
                   (SELECT COUNT(*) FROM internship_placements ipl WHERE ipl.program_id = ip.id) as placement_count
            FROM internship_programs ip WHERE ip.coordinator_id = %s ORDER BY ip.created_at DESC
        """, (coord_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        programs = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get('requirements'), str): d['requirements'] = json.loads(d['requirements'])
            for k in ('start_date', 'end_date', 'created_at'):
                if d.get(k): d[k] = d[k].isoformat()
            programs.append(d)
        return jsonify({"programs": programs, "total": len(programs)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@internship_coord_bp.route('/programs', methods=['POST'])
@jwt_required(optional=True)
def create_program():
    coord_id = None
    try: coord_id = get_jwt_identity()
    except: pass
    data = request.get_json(silent=True) or {}
    if not coord_id: coord_id = data.get('coordinator_id', 1)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO internship_programs (coordinator_id, title, institution, season, start_date, end_date, credit_value, max_students, requirements)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (coord_id, data.get('title',''), data.get('institution',''), data.get('season','summer'),
              data.get('start_date'), data.get('end_date'), data.get('credit_value', 0),
              data.get('max_students', 20), json.dumps(data.get('requirements', {}))))
        pid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"program_id": pid}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500

@internship_coord_bp.route('/placements', methods=['GET'])
@jwt_required(optional=True)
def list_placements():
    coord_id = None
    try: coord_id = get_jwt_identity()
    except: pass
    if not coord_id: coord_id = request.args.get('coordinator_id', 1)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT ipl.*, u.full_name as student_name, ip.title as program_title
            FROM internship_placements ipl
            JOIN internship_programs ip ON ip.id = ipl.program_id
            LEFT JOIN users u ON u.id = ipl.student_id
            WHERE ip.coordinator_id = %s ORDER BY ipl.created_at DESC
        """, (coord_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        placements = []
        for r in rows:
            d = dict(r)
            for k in ('start_date', 'end_date', 'created_at'):
                if d.get(k): d[k] = d[k].isoformat()
            placements.append(d)
        return jsonify({"placements": placements, "total": len(placements)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500

@internship_coord_bp.route('/evaluations', methods=['POST'])
@jwt_required(optional=True)
def submit_evaluation():
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO internship_evaluations (placement_id, evaluator_type, competencies, rating, feedback)
            VALUES (%s,%s,%s,%s,%s) RETURNING id
        """, (data.get('placement_id'), data.get('evaluator_type', 'coordinator'),
              json.dumps(data.get('competencies', {})), data.get('rating', 0), data.get('feedback', '')))
        eid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"evaluation_id": eid}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500

@internship_coord_bp.route('/analytics', methods=['GET'])
@jwt_required(optional=True)
def coord_analytics():
    coord_id = None
    try: coord_id = get_jwt_identity()
    except: pass
    if not coord_id: coord_id = request.args.get('coordinator_id', 1)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) as total FROM internship_programs WHERE coordinator_id = %s", (coord_id,))
        total_programs = cur.fetchone()['total']
        cur.execute("""
            SELECT COUNT(*) as total FROM internship_placements ipl
            JOIN internship_programs ip ON ip.id = ipl.program_id WHERE ip.coordinator_id = %s
        """, (coord_id,))
        total_placements = cur.fetchone()['total']
        cur.execute("""
            SELECT ipl.status, COUNT(*) as count FROM internship_placements ipl
            JOIN internship_programs ip ON ip.id = ipl.program_id WHERE ip.coordinator_id = %s
            GROUP BY ipl.status
        """, (coord_id,))
        status_breakdown = {r['status']: r['count'] for r in cur.fetchall()}
        cur.close(); conn.close()
        return jsonify({
            "total_programs": total_programs,
            "total_placements": total_placements,
            "status_breakdown": status_breakdown,
            "placement_rate": round(status_breakdown.get('active', 0) / max(total_placements, 1) * 100, 1)
        }), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500
