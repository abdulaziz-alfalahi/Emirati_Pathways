"""
Coach API Routes
Blueprint prefix: /api/coach

Career coaching dashboard for managing clients, development plans,
coaching sessions, and skill gap analysis.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import os
import json
import logging

logger = logging.getLogger(__name__)
coach_bp = Blueprint('coach', __name__, url_prefix='/api/coach')

def get_db():
    try:
        return psycopg2.connect(
            os.getenv('DATABASE_URL',
                       'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'))
    except Exception as e:
        logger.error(f"DB connection error: {e}")
        return None


def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS coaching_sessions (
            id SERIAL PRIMARY KEY,
            client_id INTEGER REFERENCES users(id),
            coach_id INTEGER REFERENCES users(id),
            session_type VARCHAR(50) DEFAULT 'one_on_one',
            notes TEXT DEFAULT '',
            action_items JSONB DEFAULT '[]',
            duration_minutes INTEGER DEFAULT 60,
            session_date TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS development_plans (
            id SERIAL PRIMARY KEY,
            client_id INTEGER REFERENCES users(id),
            coach_id INTEGER REFERENCES users(id),
            title VARCHAR(255) NOT NULL,
            description TEXT DEFAULT '',
            milestones JSONB DEFAULT '[]',
            status VARCHAR(30) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS coach_client_assignments (
            id SERIAL PRIMARY KEY,
            coach_id INTEGER REFERENCES users(id),
            client_id INTEGER REFERENCES users(id),
            assigned_at TIMESTAMP DEFAULT NOW(),
            status VARCHAR(20) DEFAULT 'active',
            UNIQUE(coach_id, client_id)
        );
        CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach ON coaching_sessions(coach_id);
        CREATE INDEX IF NOT EXISTS idx_development_plans_coach ON development_plans(coach_id);
    """)
    conn.commit()
    cur.close()

_initialized = False
@coach_bp.before_request
def init():
    global _initialized
    if _initialized: return
    conn = get_db()
    if conn:
        try: ensure_tables(conn); _initialized = True
        except Exception as e: logger.error(f"Coach init error: {e}")
        finally: conn.close()


# ─── CLIENTS ──────────────────────────────────────────────
@coach_bp.route('/clients', methods=['GET'])
@jwt_required(optional=True)
def list_clients():
    coach_id = None
    try: coach_id = get_jwt_identity()
    except: pass
    if not coach_id: coach_id = request.args.get('coach_id', 1)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT cca.client_id, u.full_name, u.email, u.phone, cca.assigned_at,
                   (SELECT COUNT(*) FROM development_plans dp WHERE dp.client_id = cca.client_id AND dp.status = 'active') as active_plans,
                   (SELECT COUNT(*) FROM coaching_sessions cs WHERE cs.client_id = cca.client_id) as total_sessions
            FROM coach_client_assignments cca
            LEFT JOIN users u ON u.id = cca.client_id
            WHERE cca.coach_id = %s AND cca.status = 'active'
            ORDER BY u.full_name
        """, (coach_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        clients = []
        for r in rows:
            d = dict(r)
            if d.get('assigned_at'): d['assigned_at'] = d['assigned_at'].isoformat()
            clients.append(d)
        return jsonify({"clients": clients, "total": len(clients)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


# ─── DEVELOPMENT PLANS ───────────────────────────────────
@coach_bp.route('/clients/<int:client_id>/development-plan', methods=['POST'])
@jwt_required(optional=True)
def create_development_plan(client_id):
    coach_id = None
    try: coach_id = get_jwt_identity()
    except: pass
    data = request.get_json(silent=True) or {}
    if not coach_id: coach_id = data.get('coach_id', 1)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO development_plans (client_id, coach_id, title, description, milestones)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        """, (client_id, coach_id, data.get('title', ''), data.get('description', ''),
              json.dumps(data.get('milestones', []))))
        plan_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"plan_id": plan_id, "status": "created"}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


@coach_bp.route('/development-plans/<int:plan_id>', methods=['GET'])
def get_development_plan(plan_id):
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM development_plans WHERE id = %s", (plan_id,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row: return jsonify({"error": "Not found"}), 404
        d = dict(row)
        if isinstance(d.get('milestones'), str): d['milestones'] = json.loads(d['milestones'])
        for k in ('created_at', 'updated_at'): 
            if d.get(k): d[k] = d[k].isoformat()
        return jsonify(d), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


# ─── SESSIONS ─────────────────────────────────────────────
@coach_bp.route('/sessions', methods=['POST'])
@jwt_required(optional=True)
def log_session():
    data = request.get_json(silent=True) or {}
    coach_id = None
    try: coach_id = get_jwt_identity()
    except: pass
    if not coach_id: coach_id = data.get('coach_id', 1)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO coaching_sessions (client_id, coach_id, session_type, notes, action_items, duration_minutes)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (data.get('client_id'), coach_id, data.get('session_type', 'one_on_one'),
              data.get('notes', ''), json.dumps(data.get('action_items', [])),
              data.get('duration_minutes', 60)))
        session_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"session_id": session_id, "status": "created"}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


# ─── SKILL GAPS ───────────────────────────────────────────
@coach_bp.route('/clients/<int:client_id>/skill-gaps', methods=['GET'])
def get_skill_gaps(client_id):
    """Analyze skill gaps for a client using skill taxonomy data."""
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Get client's current skills
        cur.execute("""
            SELECT st.name, us.proficiency_level, us.source
            FROM user_skills us
            JOIN skill_taxonomy st ON st.id = us.skill_id
            WHERE us.user_id = %s
        """, (client_id,))
        current_skills = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()
        
        skill_map = {s['name'].lower(): s for s in current_skills}
        return jsonify({
            "current_skills": current_skills,
            "total_skills": len(current_skills),
            "skills_by_level": {
                "beginner": len([s for s in current_skills if s.get('proficiency_level') == 'beginner']),
                "intermediate": len([s for s in current_skills if s.get('proficiency_level') == 'intermediate']),
                "advanced": len([s for s in current_skills if s.get('proficiency_level') == 'advanced']),
            }
        }), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


# ─── ANALYTICS ────────────────────────────────────────────
@coach_bp.route('/analytics', methods=['GET'])
@jwt_required(optional=True)
def coach_analytics():
    coach_id = None
    try: coach_id = get_jwt_identity()
    except: pass
    if not coach_id: coach_id = request.args.get('coach_id', 1)
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) as total FROM coach_client_assignments WHERE coach_id = %s AND status = 'active'", (coach_id,))
        total_clients = cur.fetchone()['total']
        cur.execute("SELECT COUNT(*) as total FROM coaching_sessions WHERE coach_id = %s", (coach_id,))
        total_sessions = cur.fetchone()['total']
        cur.execute("SELECT SUM(duration_minutes) as total FROM coaching_sessions WHERE coach_id = %s", (coach_id,))
        total_hours = round((cur.fetchone()['total'] or 0) / 60, 1)
        cur.execute("SELECT status, COUNT(*) as count FROM development_plans WHERE coach_id = %s GROUP BY status", (coach_id,))
        plan_stats = {r['status']: r['count'] for r in cur.fetchall()}
        cur.close(); conn.close()
        return jsonify({
            "total_clients": total_clients,
            "total_sessions": total_sessions,
            "total_coaching_hours": total_hours,
            "plan_stats": plan_stats,
        }), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500
