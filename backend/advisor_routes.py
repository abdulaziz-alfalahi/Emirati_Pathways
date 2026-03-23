"""
Advisor API Routes
Blueprint prefix: /api/advisor

Academic/career advisor dashboard for managing student goals,
risk monitoring, and intervention logging.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import os
import json
import logging

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


def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS student_goals (
            id SERIAL PRIMARY KEY,
            student_id INTEGER REFERENCES users(id),
            advisor_id INTEGER REFERENCES users(id),
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
            student_id INTEGER REFERENCES users(id),
            advisor_id INTEGER REFERENCES users(id),
            type VARCHAR(50) NOT NULL DEFAULT 'career',
            notes TEXT DEFAULT '',
            outcome TEXT DEFAULT '',
            follow_up_date DATE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS advisor_student_assignments (
            id SERIAL PRIMARY KEY,
            advisor_id INTEGER REFERENCES users(id),
            student_id INTEGER REFERENCES users(id),
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
@jwt_required(optional=True)
def list_students():
    advisor_id = None
    try: advisor_id = get_jwt_identity()
    except: pass
    if not advisor_id: advisor_id = request.args.get('advisor_id', 1)
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
@advisor_bp.route('/students/<int:student_id>/goals', methods=['GET'])
def get_student_goals(student_id):
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM student_goals WHERE student_id = %s ORDER BY created_at DESC", (student_id,))
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


@advisor_bp.route('/students/<int:student_id>/goals', methods=['POST'])
@jwt_required(optional=True)
def create_goal(student_id):
    advisor_id = None
    try: advisor_id = get_jwt_identity()
    except: pass
    data = request.get_json(silent=True) or {}
    if not advisor_id: advisor_id = data.get('advisor_id', 1)
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
@jwt_required(optional=True)
def update_goal(goal_id):
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
        cur.execute(f"UPDATE student_goals SET {', '.join(fields)} WHERE id = %s", params)
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


# ─── AT-RISK ──────────────────────────────────────────────
@advisor_bp.route('/at-risk', methods=['GET'])
@jwt_required(optional=True)
def get_at_risk_students():
    advisor_id = None
    try: advisor_id = get_jwt_identity()
    except: pass
    if not advisor_id: advisor_id = request.args.get('advisor_id', 1)
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
@jwt_required(optional=True)
def create_intervention():
    data = request.get_json(silent=True) or {}
    advisor_id = None
    try: advisor_id = get_jwt_identity()
    except: pass
    if not advisor_id: advisor_id = data.get('advisor_id', 1)
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
@jwt_required(optional=True)
def advisor_analytics():
    advisor_id = None
    try: advisor_id = get_jwt_identity()
    except: pass
    if not advisor_id: advisor_id = request.args.get('advisor_id', 1)
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
