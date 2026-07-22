"""
Advisor API Routes
Blueprint prefix: /api/advisor

Academic/career advisor dashboard for managing student goals,
risk monitoring, and intervention logging.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import os
import json
import logging
try:
    from backend.auth.access_control import resolve_roles
except ImportError:  # pragma: no cover
    from auth.access_control import resolve_roles

logger = logging.getLogger(__name__)
advisor_bp = Blueprint('advisor', __name__, url_prefix='/api/advisor')

def get_db():
    try:
        return psycopg2.connect(
            os.getenv('DATABASE_URL',
                       'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'))
    except Exception as e:
        logger.error(f"DB connection error: {e}")
        return None


# Roles permitted to act as an academic/career advisor.
_ADVISOR_ROLES = {'advisor', 'admin', 'super_admin'}


def _require_advisor_role():
    """Return a (response, 403) if the caller isn't an advisor, else None.
    Resolves secondary_roles (C1)."""
    try:
        if not (resolve_roles() & _ADVISOR_ROLES):
            return jsonify({"error": "Forbidden - advisor access required"}), 403
    except Exception:
        return jsonify({"error": "Forbidden - advisor access required"}), 403
    return None


def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS student_goals (
            id SERIAL PRIMARY KEY,
            student_id VARCHAR(20) REFERENCES users(id),
            advisor_id VARCHAR(20) REFERENCES users(id),
            title VARCHAR(255) NOT NULL,
            description TEXT DEFAULT '',
            target_date DATE,
            status VARCHAR(30) DEFAULT 'not_started',
            category VARCHAR(50) DEFAULT 'career',
            progress INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS advisor_interventions (
            id SERIAL PRIMARY KEY,
            student_id VARCHAR(20) REFERENCES users(id),
            advisor_id VARCHAR(20) REFERENCES users(id),
            type VARCHAR(50) NOT NULL DEFAULT 'career',
            notes TEXT DEFAULT '',
            outcome TEXT DEFAULT '',
            follow_up_date DATE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS advisor_student_assignments (
            id SERIAL PRIMARY KEY,
            advisor_id VARCHAR(20) REFERENCES users(id),
            student_id VARCHAR(20) REFERENCES users(id),
            assigned_at TIMESTAMP DEFAULT NOW(),
            status VARCHAR(20) DEFAULT 'active',
            UNIQUE(advisor_id, student_id)
        );
        CREATE INDEX IF NOT EXISTS idx_student_goals_student ON student_goals(student_id);
        CREATE INDEX IF NOT EXISTS idx_student_goals_advisor ON student_goals(advisor_id);
        CREATE INDEX IF NOT EXISTS idx_advisor_interventions_student ON advisor_interventions(student_id);
    """)
    conn.commit()
    cur.close()

_initialized = False
@advisor_bp.before_request
def init():
    global _initialized
    if _initialized: return
    conn = get_db()
    if conn:
        try: ensure_tables(conn); _initialized = True
        except Exception as e: logger.error(f"Advisor init error: {e}")
        finally: conn.close()


# ─── STUDENTS ─────────────────────────────────────────────
@advisor_bp.route('/students', methods=['GET'])
@jwt_required()
def list_students():
    guard = _require_advisor_role()
    if guard: return guard
    advisor_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT asa.student_id, u.full_name, u.email, u.phone, asa.assigned_at, asa.status,
                   (SELECT COUNT(*) FROM student_goals sg WHERE sg.student_id = asa.student_id AND sg.status != 'completed') as open_goals,
                   (SELECT COUNT(*) FROM advisor_interventions ai WHERE ai.student_id = asa.student_id) as total_interventions
            FROM advisor_student_assignments asa
            LEFT JOIN users u ON u.id = asa.student_id
            WHERE asa.advisor_id = %s AND asa.status = 'active'
            ORDER BY u.full_name
        """, (advisor_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        students = []
        for r in rows:
            d = dict(r)
            d['risk_level'] = 'high' if d.get('open_goals', 0) > 3 else 'medium' if d.get('open_goals', 0) > 1 else 'low'
            if d.get('assigned_at'): d['assigned_at'] = d['assigned_at'].isoformat()
            students.append(d)
        return jsonify({"students": students, "total": len(students)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ─── GOALS ────────────────────────────────────────────────
@advisor_bp.route('/students/<student_id>/goals', methods=['GET'])
@jwt_required()
def get_student_goals(student_id):
    guard = _require_advisor_role()
    if guard: return guard
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Scope to the calling advisor's own goals for this student.
        cur.execute("SELECT * FROM student_goals WHERE student_id = %s AND advisor_id = %s ORDER BY created_at DESC",
                    (student_id, get_jwt_identity()))
        rows = cur.fetchall()
        cur.close(); conn.close()
        goals = []
        for r in rows:
            d = dict(r)
            for k in ('created_at', 'updated_at', 'target_date'):
                if d.get(k): d[k] = d[k].isoformat()
            goals.append(d)
        return jsonify({"goals": goals, "total": len(goals)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


@advisor_bp.route('/students/<student_id>/goals', methods=['POST'])
@jwt_required()
def create_goal(student_id):
    guard = _require_advisor_role()
    if guard: return guard
    advisor_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO student_goals (student_id, advisor_id, title, description, target_date, category)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (student_id, advisor_id, data.get('title', ''), data.get('description', ''),
              data.get('target_date'), data.get('category', 'career')))
        goal_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"goal_id": goal_id, "status": "created"}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


@advisor_bp.route('/goals/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    guard = _require_advisor_role()
    if guard: return guard
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        fields, params = [], []
        for f in ['title', 'description', 'status', 'category', 'notes']:
            if f in data: fields.append(f"{f} = %s"); params.append(data[f])
        if 'progress' in data: fields.append("progress = %s"); params.append(data['progress'])
        if 'target_date' in data: fields.append("target_date = %s"); params.append(data['target_date'])
        if not fields: return jsonify({"error": "No fields to update"}), 400
        fields.append("updated_at = NOW()")
        params.append(goal_id)
        params.append(get_jwt_identity())
        cur.execute(f"UPDATE student_goals SET {', '.join(fields)} WHERE id = %s AND advisor_id = %s", params)
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


# ─── AT-RISK ──────────────────────────────────────────────
@advisor_bp.route('/at-risk', methods=['GET'])
@jwt_required()
def get_at_risk_students():
    guard = _require_advisor_role()
    if guard: return guard
    advisor_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT asa.student_id, u.full_name, u.email,
                   COUNT(sg.id) FILTER (WHERE sg.status = 'not_started') as stalled_goals,
                   COUNT(sg.id) FILTER (WHERE sg.target_date < NOW() AND sg.status != 'completed') as overdue_goals
            FROM advisor_student_assignments asa
            LEFT JOIN users u ON u.id = asa.student_id
            LEFT JOIN student_goals sg ON sg.student_id = asa.student_id
            WHERE asa.advisor_id = %s AND asa.status = 'active'
            GROUP BY asa.student_id, u.full_name, u.email
            HAVING COUNT(sg.id) FILTER (WHERE sg.status = 'not_started') > 2
                OR COUNT(sg.id) FILTER (WHERE sg.target_date < NOW() AND sg.status != 'completed') > 0
            ORDER BY COUNT(sg.id) FILTER (WHERE sg.target_date < NOW() AND sg.status != 'completed') DESC
        """, (advisor_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({"at_risk_students": [dict(r) for r in rows], "total": len(rows)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


# ─── INTERVENTIONS ────────────────────────────────────────
@advisor_bp.route('/interventions', methods=['POST'])
@jwt_required()
def create_intervention():
    guard = _require_advisor_role()
    if guard: return guard
    data = request.get_json(silent=True) or {}
    advisor_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO advisor_interventions (student_id, advisor_id, type, notes, outcome, follow_up_date)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (data.get('student_id'), advisor_id, data.get('type', 'career'),
              data.get('notes', ''), data.get('outcome', ''), data.get('follow_up_date')))
        int_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"intervention_id": int_id, "status": "created"}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


# ─── ANALYTICS ────────────────────────────────────────────
@advisor_bp.route('/analytics', methods=['GET'])
@jwt_required()
def advisor_analytics():
    guard = _require_advisor_role()
    if guard: return guard
    advisor_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) as total FROM advisor_student_assignments WHERE advisor_id = %s AND status = 'active'", (advisor_id,))
        total_students = cur.fetchone()['total']
        cur.execute("SELECT status, COUNT(*) as count FROM student_goals WHERE advisor_id = %s GROUP BY status", (advisor_id,))
        goal_stats = {r['status']: r['count'] for r in cur.fetchall()}
        cur.execute("SELECT COUNT(*) as total FROM advisor_interventions WHERE advisor_id = %s", (advisor_id,))
        total_interventions = cur.fetchone()['total']
        cur.close(); conn.close()
        return jsonify({
            "total_students": total_students,
            "goal_stats": goal_stats,
            "total_interventions": total_interventions,
            "completion_rate": round(goal_stats.get('completed', 0) / max(sum(goal_stats.values()), 1) * 100, 1)
        }), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500
