"""
Coach API Routes
Blueprint prefix: /api/coach

Career coaching dashboard for managing clients, development plans,
coaching sessions, and skill gap analysis.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import os
import json
import logging
import uuid
from datetime import datetime, timedelta

# What time it is here — see backend/platform_time.py. A naive timestamp in this
# database is Gulf wall-clock time; comparing it against datetime.now() (UTC in
# the container) refused sessions that had already started.
try:
    from backend import platform_time
except ImportError:  # pragma: no cover — the app runs under both roots
    import platform_time


# The assignment lifecycle — states, origins and legal transitions — lives in one
# place because TWO subsystems write coach_client_assignments (this file for
# candidate self-requests, caseload_assignment_routes for operator allocation).
try:
    from backend import caseload_states as cs
except ImportError:  # pragma: no cover — the app runs under both roots
    import caseload_states as cs


# Read auditing for coach access to a client's data (see pii_access_log.py).
try:
    from backend.pii_access_log import (log_pii_read, COACH_CLIENT_LIST_READ,
                                        COACH_SKILL_GAP_READ)
except ImportError:  # pragma: no cover — the app runs under both roots
    from pii_access_log import (log_pii_read, COACH_CLIENT_LIST_READ,
                                COACH_SKILL_GAP_READ)

try:
    from backend.auth.access_control import resolve_roles, ADMIN_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import resolve_roles, ADMIN_ROLES
try:
    from backend.user_helpers import user_display_name
except ImportError:  # pragma: no cover
    from user_helpers import user_display_name

logger = logging.getLogger(__name__)
try:
    from backend.services import skill_gap
except ImportError:  # pragma: no cover — the app runs under both roots
    from services import skill_gap

coach_bp = Blueprint('coach', __name__, url_prefix='/api/coach')

def get_db():
    try:
        return psycopg2.connect(
            os.getenv('DATABASE_URL',
                       'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'))
    except Exception as e:
        logger.error(f"DB connection error: {e}")
        return None


# Roles permitted to act as a career coach (view client PII, manage plans/sessions).
# Sourced from ADMIN_ROLES so every admin alias (super_user, platform_administrator,
# administrator) is honoured — a hand-rolled {'admin','super_admin'} 403'd real admins.
_COACH_ROLES = ADMIN_ROLES | {'coach', 'advisor'}


def _require_coach_role():
    """Return a (response, 403) if the caller lacks a coach role, else None.
    Resolves secondary_roles (C1)."""
    try:
        if not (resolve_roles() & _COACH_ROLES):
            return jsonify({"error": "Forbidden - coach access required"}), 403
    except Exception:
        return jsonify({"error": "Forbidden - coach access required"}), 403
    return None


def _coach_owns_client(conn, coach_id, client_id):
    """True if an active coach->client assignment links this coach to the client."""
    cur = conn.cursor()
    cur.execute("""SELECT 1 FROM coach_client_assignments
                   WHERE coach_id = %s AND client_id = %s AND status = 'active'""",
                (coach_id, client_id))
    ok = cur.fetchone() is not None
    cur.close()
    return ok


def _safe_notify(user_id, notification_type, title, message=''):
    """Best-effort in-app notification — never break the request on failure."""
    try:
        try:
            from backend.notification_helper import create_notification
        except ImportError:  # pragma: no cover
            from notification_helper import create_notification
        create_notification(str(user_id), notification_type, title, message, {})
    except Exception as e:
        logger.warning(f"coach notify skipped: {e}")


def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS coaching_sessions (
            id SERIAL PRIMARY KEY,
            client_id VARCHAR(20) REFERENCES users(id),
            coach_id VARCHAR(20) REFERENCES users(id),
            session_type VARCHAR(50) DEFAULT 'one_on_one',
            notes TEXT DEFAULT '',
            action_items JSONB DEFAULT '[]',
            duration_minutes INTEGER DEFAULT 60,
            session_date TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS development_plans (
            id SERIAL PRIMARY KEY,
            client_id VARCHAR(20) REFERENCES users(id),
            coach_id VARCHAR(20) REFERENCES users(id),
            title VARCHAR(255) NOT NULL,
            description TEXT DEFAULT '',
            milestones JSONB DEFAULT '[]',
            status VARCHAR(30) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS coach_client_assignments (
            id SERIAL PRIMARY KEY,
            coach_id VARCHAR(20) REFERENCES users(id),
            client_id VARCHAR(20) REFERENCES users(id),
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
@jwt_required()
def list_clients():
    guard = _require_coach_role()
    if guard: return guard
    coach_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # C3-COA-2: resolve a display name (full_name -> first||last -> email) so the
        # UI shows a name, not a raw 15-digit Emirates ID when full_name is null.
        cur.execute(f"""
            SELECT cca.client_id, u.full_name, {user_display_name('display_name', 'u')},
                   u.email, u.phone, cca.assigned_at, cca.origin, cca.assigned_by,
                   (SELECT COUNT(*) FROM development_plans dp WHERE dp.client_id = cca.client_id AND dp.status = 'active') as active_plans,
                   -- Scoped to THIS coach. Unscoped, it counted sessions the
                   -- client had with other coaches too, which both overstated
                   -- the number and disclosed activity outside this
                   -- relationship.
                   (SELECT COUNT(*) FROM coaching_sessions cs
                     WHERE cs.client_id = cca.client_id AND cs.coach_id = cca.coach_id) as total_sessions
            FROM coach_client_assignments cca
            LEFT JOIN users u ON u.id = cca.client_id
            WHERE cca.coach_id = %s AND cca.status = 'active'
            ORDER BY display_name
        """, (coach_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        clients = []
        for r in rows:
            d = dict(r)
            if d.get('assigned_at'): d['assigned_at'] = d['assigned_at'].isoformat()
            clients.append(d)
        log_pii_read(COACH_CLIENT_LIST_READ, 'coach_clients',
                     actor_id=coach_id, subject_count=len(clients))
        return jsonify({"clients": clients, "total": len(clients)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


# ─── MENTEE-FACING DISCOVERY (C3-MEE-3: the mentee had no way to see a coach) ──

@coach_bp.route('/clients/past', methods=['GET'])
@jwt_required()
def list_past_clients():
    """Clients this coach no longer holds, and why.

    /clients filters on status='active', which is right for a caseload — but it
    was the ONLY view, so handing a client back erased every trace that the
    relationship had existed: "Hand back eliminates all records from my
    dashboard" (fb_1787134699).

    A session history alone would NOT have answered that report. The client in
    question had no recorded sessions, so a sessions-only view would still have
    shown the coach nothing. The assignment row is the record that the
    relationship happened; this returns it.

    Contact details are deliberately omitted — see list_my_sessions.
    """
    guard = _require_coach_role()
    if guard: return guard
    coach_id = get_jwt_identity()
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"""
            SELECT cca.client_id, cca.status, cca.origin, cca.assigned_at,
                   {user_display_name('display_name', 'u')},
                   (SELECT COUNT(*) FROM coaching_sessions s
                     WHERE s.client_id = cca.client_id
                       AND s.coach_id = cca.coach_id) AS my_sessions,
                   (SELECT MAX(COALESCE(s.session_date, s.created_at))
                      FROM coaching_sessions s
                     WHERE s.client_id = cca.client_id
                       AND s.coach_id = cca.coach_id) AS last_session_at
              FROM coach_client_assignments cca
              LEFT JOIN users u ON u.id = cca.client_id
             WHERE cca.coach_id = %s
               AND cca.status <> %s
             ORDER BY cca.assigned_at DESC NULLS LAST
             LIMIT 200
        """, (coach_id, cs.ACTIVE))
        rows = cur.fetchall()
        cur.close(); conn.close()

        clients = []
        for r in rows:
            d = dict(r)
            for k in ('assigned_at', 'last_session_at'):
                if d.get(k):
                    d[k] = d[k].isoformat()
            clients.append(d)

        log_pii_read(COACH_CLIENT_LIST_READ, 'coach_past_clients',
                     actor_id=coach_id, subject_count=len(clients))
        return jsonify({"clients": clients, "total": len(clients)}), 200
    except Exception as e:
        conn.close()
        logger.error(f"list past clients failed: {e}")
        return jsonify({"error": "Failed to load past clients"}), 500


@coach_bp.route('/directory', methods=['GET'])
@jwt_required()
def coach_directory():
    """Public-ish directory of coaches so a mentee can pick a coach_id to
    POST /api/coach/request. Any signed-in user may read it (no coach role
    required). A coach is a user with role='coach' OR 'coach' in secondary_roles.
    NB there is no coach-profile table today, so bio/specialisation come back
    null — shape kept stable for the frontend."""
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"""
            SELECT u.id, {user_display_name('display_name', 'u')}
            FROM users u
            WHERE (u.role = 'coach' OR COALESCE(u.secondary_roles, '[]'::jsonb) @> '["coach"]'::jsonb)
              AND COALESCE(u.is_active, TRUE) IS TRUE
            ORDER BY display_name
        """)
        coaches = []
        for r in cur.fetchall():
            d = dict(r)
            d['bio'] = None
            d['specialization'] = None
            coaches.append(d)
        cur.close(); conn.close()
        return jsonify({"coaches": coaches, "total": len(coaches)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


@coach_bp.route('/my-coaching', methods=['GET'])
@jwt_required()
def my_coaching():
    """The caller's own coaching relationships (mentee-facing) — mirrors the
    mentor side's /my-mentors. Returns each coach the caller has requested or is
    an active client of (pending + active), with the coach's display name and
    status, so the mentee can see a request that's still awaiting acceptance."""
    caller = str(get_jwt_identity())
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"""
            SELECT cca.coach_id, {user_display_name('coach_name', 'u')},
                   cca.status, cca.assigned_at
            FROM coach_client_assignments cca
            LEFT JOIN users u ON u.id = cca.coach_id
            WHERE cca.client_id = %s AND cca.status IN ('pending', 'active')
            ORDER BY cca.assigned_at DESC
        """, (caller,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        coaching = []
        for r in rows:
            d = dict(r)
            if d.get('assigned_at'): d['assigned_at'] = d['assigned_at'].isoformat()
            coaching.append(d)
        return jsonify({"coaching": coaching, "total": len(coaching)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


# ─── DEVELOPMENT PLANS ───────────────────────────────────
@coach_bp.route('/clients/<client_id>/development-plan', methods=['POST'])
@jwt_required()
def create_development_plan(client_id):
    guard = _require_coach_role()
    if guard: return guard
    coach_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    if not _coach_owns_client(conn, coach_id, client_id):
        conn.close(); return jsonify({"error": "Forbidden - not your client"}), 403
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
@jwt_required()
def get_development_plan(plan_id):
    guard = _require_coach_role()
    if guard: return guard
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Scope to the calling coach's own plan.
        cur.execute("SELECT * FROM development_plans WHERE id = %s AND coach_id = %s", (plan_id, get_jwt_identity()))
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
@jwt_required()
def log_session():
    guard = _require_coach_role()
    if guard: return guard
    data = request.get_json(silent=True) or {}
    coach_id = get_jwt_identity()
    client_id = data.get('client_id')
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    if not _coach_owns_client(conn, coach_id, client_id):
        conn.close(); return jsonify({"error": "Forbidden - not your client"}), 403
    try:
        # A room is minted only for a session that is actually being scheduled.
        # One logged after the fact -- a conversation that already happened in
        # person -- gets no room, and room_name NULL says exactly that.
        room_name = None
        if data.get('is_virtual'):
            room_name = f"coach-{uuid.uuid4().hex[:12]}".lower()

        # session_date IS the session time. A future value schedules it; the
        # column default (now()) covers one logged retrospectively. Deliberately
        # not a second `scheduled_at` column -- see migration 071.
        scheduled_at = (data.get('session_date') or '').strip() or None

        cur = conn.cursor()
        cur.execute("""
            INSERT INTO coaching_sessions
                (client_id, coach_id, session_type, notes, action_items,
                 duration_minutes, room_name, session_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, COALESCE(%s::timestamp, now()))
            RETURNING id, session_date
        """, (client_id, coach_id, data.get('session_type', 'one_on_one'),
              data.get('notes', ''), json.dumps(data.get('action_items', [])),
              data.get('duration_minutes', 60), room_name, scheduled_at))
        row = cur.fetchone()
        session_id, session_date = row[0], row[1]
        conn.commit(); cur.close(); conn.close()
        if room_name:
            _safe_notify(client_id, 'coaching_session_scheduled', 'Coaching session scheduled',
                         'Your coach scheduled an online session with you.')
        return jsonify({"session_id": session_id, "status": "created",
                        "room_name": room_name,
                        "session_date": session_date.isoformat() if session_date else None}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


# ─── SKILL GAPS ───────────────────────────────────────────
@coach_bp.route('/clients/<client_id>/skill-gaps', methods=['GET'])
@jwt_required()
def get_skill_gaps(client_id):
    """Analyze skill gaps for a client using skill taxonomy data."""
    guard = _require_coach_role()
    if guard: return guard
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    if not _coach_owns_client(conn, get_jwt_identity(), client_id):
        conn.close(); return jsonify({"error": "Forbidden - not your client"}), 403
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # C3-COA-2: read the client's skills straight from user_skills by skill_name.
        # The old INNER JOIN to skill_taxonomy (st.skill_id = us.skill_id) dropped
        # every self-reported skill — those carry skill_id like 'self_python' which
        # has no taxonomy row — so the analysis always returned total_skills: 0.
        cur.execute("""
            SELECT skill_name AS name, proficiency AS proficiency_level,
                   source, verified
            FROM user_skills
            WHERE user_id = %s
            ORDER BY skill_name
        """, (client_id,))
        current_skills = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()

        return jsonify({
            "current_skills": current_skills,
            "total_skills": len(current_skills),
            "verified_skills": len([s for s in current_skills if s.get('verified')]),
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
@jwt_required()
def coach_analytics():
    guard = _require_coach_role()
    if guard: return guard
    coach_id = get_jwt_identity()
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


@coach_bp.route('/request', methods=['POST'])
@jwt_required()
def request_coach():
    """A candidate requests a career coach → a PENDING coach_client_assignment.
    The coach must accept it (see /requests/<id>/decision) before it becomes
    active — mirrors the mentor request→accept flow (owner decision: coaches
    accept like mentors, no silent auto-assign). The target must hold the coach role."""
    me = str(get_jwt_identity())
    coach_id = ((request.get_json(silent=True) or {}).get('coach_id') or '').strip()
    if not coach_id:
        return jsonify({"success": False, "message": "coach_id is required"}), 400
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT role, secondary_roles FROM users WHERE id = %s", (coach_id,))
        u = cur.fetchone()
        is_coach = bool(u and ((u.get('role') == 'coach') or ('coach' in (u.get('secondary_roles') or []))))
        if not is_coach:
            cur.close(); conn.close()
            return jsonify({"success": False, "message": "That user is not a coach"}), 404
        cur.execute("""SELECT id, status FROM coach_client_assignments
                       WHERE coach_id = %s AND client_id = %s""", (coach_id, me))
        existing = cur.fetchone()
        if existing:
            st = existing['status']
            if st == 'active':
                cur.close(); conn.close()
                return jsonify({"success": True, "status": "active",
                                "message": "You already have an active coaching relationship with this coach",
                                "data": {"id": existing['id'], "status": "active"}}), 200
            if st == 'pending':
                cur.close(); conn.close()
                return jsonify({"success": True, "status": "pending",
                                "message": "You have already requested this coach — awaiting their acceptance",
                                "data": {"id": existing['id'], "status": "pending"}}), 200
            # a previously declined request may be re-sent → back to pending
            cur.execute("""UPDATE coach_client_assignments
                              SET status=%s, assigned_at=NOW(), origin=%s WHERE id=%s""",
                        (cs.PENDING, cs.ORIGIN_REQUESTED, existing['id']))
            new_id = existing['id']
        else:
            # origin marks this as the candidate's own choice, which is what
            # makes it NOT hand-backable: the coach accepted this one.
            cur.execute("""INSERT INTO coach_client_assignments
                               (coach_id, client_id, status, assigned_at, origin)
                           VALUES (%s, %s, %s, NOW(), %s) RETURNING id""",
                        (coach_id, me, cs.PENDING, cs.ORIGIN_REQUESTED))
            new_id = cur.fetchone()['id']
        conn.commit(); cur.close(); conn.close()
        _safe_notify(coach_id, 'coaching_requested', 'New coaching request',
                     'A candidate has requested you as their coach — review and accept or decline.')
        return jsonify({"success": True, "status": "pending",
                        "message": "Coaching requested — awaiting the coach",
                        "data": {"id": new_id, "status": "pending"}}), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"success": False, "message": str(e)}), 500


@coach_bp.route('/requests', methods=['GET'])
@jwt_required()
def list_coach_requests():
    """The coach's PENDING requests to accept/decline (mirrors the mentor pool)."""
    guard = _require_coach_role()
    if guard: return guard
    coach_id = str(get_jwt_identity())
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"""
            SELECT cca.id, cca.client_id, {user_display_name('display_name', 'u')},
                   u.email, cca.status, cca.assigned_at AS requested_at
            FROM coach_client_assignments cca
            LEFT JOIN users u ON u.id = cca.client_id
            WHERE cca.coach_id = %s AND cca.status = 'pending'
            ORDER BY cca.assigned_at DESC
        """, (coach_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        out = []
        for r in rows:
            d = dict(r)
            if d.get('requested_at'): d['requested_at'] = d['requested_at'].isoformat()
            out.append(d)
        return jsonify({"requests": out, "total": len(out)}), 200
    except Exception as e:
        conn.close(); return jsonify({"error": str(e)}), 500


@coach_bp.route('/requests/<assignment_id>/decision', methods=['POST'])
@jwt_required()
def decide_coach_request(assignment_id):
    """The COACH accepts or declines a pending coaching request. Only the
    assignment's own coach may decide (BOLA guard). accept → active, decline →
    declined. Mirrors the mentor /requests/<id>/decision flow."""
    guard = _require_coach_role()
    if guard: return guard
    me = str(get_jwt_identity())
    decision = ((request.get_json(silent=True) or {}).get('decision') or '').strip().lower()
    if decision not in ('accept', 'decline'):
        return jsonify({"success": False, "message": "decision must be 'accept' or 'decline'"}), 400
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id, coach_id, client_id, status FROM coach_client_assignments WHERE id = %s",
                    (assignment_id,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return jsonify({"success": False, "message": "Request not found"}), 404
        if str(row['coach_id']) != me:
            cur.close(); conn.close()
            return jsonify({"success": False, "message": "This is not your coaching request"}), 403
        if row['status'] != 'pending':
            cur.close(); conn.close()
            return jsonify({"success": False, "message": "Request already decided"}), 409
        new_status = 'active' if decision == 'accept' else 'declined'
        cur.execute("UPDATE coach_client_assignments SET status=%s WHERE id=%s", (new_status, assignment_id))
        conn.commit(); cur.close(); conn.close()
        if decision == 'accept':
            _safe_notify(row['client_id'], 'coaching_accepted', 'Coaching request accepted',
                         'Your coach accepted your request — you can now work together.')
        else:
            _safe_notify(row['client_id'], 'coaching_declined', 'Coaching request declined',
                         'Your coaching request was declined. You can request another coach.')
        return jsonify({"success": True, "message": f"Request {new_status}",
                        "data": {"id": assignment_id, "status": new_status}}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"success": False, "message": str(e)}), 500


# ─── SKILL-GAP COMPARISON (Phase 1 — docs/skill_gap_comparison_scope.md) ─────
#
# The dashboard could show what a client HAS but not what they are MISSING for a
# target role, because the two vocabularies barely intersect (6-13% overlap with
# the taxonomy, measured live). These endpoints compare against a role the coach
# CHOOSES, assert only what an exact match proves, and record what the coach
# decides — which is both the answer here and the training data a real resolver
# will need. See services/skill_gap.py for why nothing is inferred as missing.

@coach_bp.route('/target-roles', methods=['GET'])
@jwt_required()
def target_roles():
    """Roles a client can be aimed at, from career_paths. Coaches only."""
    guard = _require_coach_role()
    if guard: return guard
    try:
        roles = skill_gap.list_target_roles()
        return jsonify({"roles": roles, "total": len(roles)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@coach_bp.route('/clients/<client_id>/skill-gap', methods=['GET'])
@jwt_required()
def client_skill_gap(client_id):
    """Required vs held for one client against one target role.

    404 on an unresolvable role_key rather than an empty comparison: showing no
    requirements would read as "this client meets everything".
    """
    guard = _require_coach_role()
    if guard: return guard
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        if not _coach_owns_client(conn, get_jwt_identity(), client_id):
            return jsonify({"error": "Forbidden - not your client"}), 403
    finally:
        conn.close()

    key = (request.args.get('role_key') or '').strip()
    if not key:
        return jsonify({"error": "role_key is required"}), 400
    try:
        result = skill_gap.compare(client_id, key)
        if result is None:
            return jsonify({"error": "Unknown target role"}), 404
        log_pii_read(COACH_SKILL_GAP_READ, 'candidate_skill_gap',
                     actor_id=get_jwt_identity(), resource_id=client_id,
                     subject_count=1, extra={'role_key': key})
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@coach_bp.route('/clients/<client_id>/skill-gap/review', methods=['POST'])
@jwt_required()
def review_skill_gap(client_id):
    """Record the coach's judgement on one required skill.

    'unclear' is rejected: it is the absence of a review, not a verdict, and
    storing it would blur "not looked at" with "looked at and could not tell".
    """
    guard = _require_coach_role()
    if guard: return guard
    conn = get_db()
    if not conn: return jsonify({"error": "Database unavailable"}), 503
    try:
        if not _coach_owns_client(conn, get_jwt_identity(), client_id):
            return jsonify({"error": "Forbidden - not your client"}), 403
    finally:
        conn.close()

    body = request.get_json(silent=True) or {}
    key = (body.get('role_key') or '').strip()
    skill_name = (body.get('skill_name') or '').strip()
    status = (body.get('status') or '').strip().lower()
    matched = (body.get('matched_skill') or '').strip() or None

    if not key or not skill_name:
        return jsonify({"error": "role_key and skill_name are required"}), 400
    if status not in skill_gap.REVIEWABLE:
        return jsonify({"error": "status must be 'held' or 'missing'"}), 400

    try:
        if not skill_gap.record_review(client_id, str(get_jwt_identity()), key,
                                       skill_name, status, matched):
            return jsonify({"error": "Could not record the review"}), 500
        return jsonify({"success": True, "data": skill_gap.compare(client_id, key)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── ONLINE COACHING SESSION ─────────────────────────────────────────────────
#
# A room minted at booking, joined by the two people in the conversation. Reuses
# the LiveKit token path that video interviews and board meetings already use --
# a second video implementation is how they drift apart.
#
# NOT LIKE BOARD MEETINGS IN ONE RESPECT: an admin cannot join. A board meeting
# admits an admin as a recorded observer because it is a governance forum. A
# coaching session is a private conversation the client did not agree to open to
# anyone else, so membership is exactly two people and there is no observer role.
#
# TRANSCRIBED AND RETAINED (owner decision 2026-08-16). Every video session on
# the platform is transcribed, because a government entity asked for a record of
# a session should not have to answer that it does not keep one. Disclosed in the
# terms all users accept -- see consent_policy.py -- and both participants are
# told in the room, because a disclosure nobody sees at the time is not much of
# a disclosure.

# A room should not stand open indefinitely.
_COACH_JOIN_BEFORE = timedelta(minutes=15)
_COACH_JOIN_GRACE = timedelta(minutes=30)


@coach_bp.route('/sessions/<int:session_id>/join', methods=['POST'])
@jwt_required()
def join_coaching_session(session_id):
    """Mint a LiveKit token for a coaching session.

    Open to the session's coach AND its client — deliberately not behind
    _require_coach_role, because the client is half the conversation and holds
    no coach role.
    """
    me = str(get_jwt_identity())
    conn = get_db()
    if not conn:
        return jsonify({"success": False, "message": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT id, coach_id, client_id, room_name, session_date, duration_minutes
                         FROM coaching_sessions WHERE id = %s""", (session_id,))
        sess = cur.fetchone()
        cur.close()
    finally:
        conn.close()

    if not sess:
        return jsonify({"success": False, "message": "Session not found"}), 404
    if str(sess['coach_id']) != me and str(sess['client_id']) != me:
        return jsonify({"success": False, "message": "This is not your session"}), 403
    if not sess['room_name']:
        return jsonify({"success": False, "error_code": "not_virtual",
                        "message": "This session has no online room"}), 400

    start = sess['session_date']
    if start:
        end = start + timedelta(minutes=int(sess.get('duration_minutes') or 60))
        start = platform_time.aware(start)
        end = platform_time.aware(end)
        now = platform_time.now()
        if now < start - _COACH_JOIN_BEFORE:
            return jsonify({"success": False, "error_code": "too_early",
                            "message": f"This session opens at "
                                       f"{(start - _COACH_JOIN_BEFORE).strftime('%H:%M')}."}), 409
        if now > end + _COACH_JOIN_GRACE:
            return jsonify({"success": False, "error_code": "closed",
                            "message": "This session has ended."}), 409

    try:
        from backend.video_interview_system import video_interview_engine
    except ImportError:  # pragma: no cover — the app runs under both roots
        from video_interview_system import video_interview_engine

    display = me
    conn = get_db()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT full_name, email FROM users WHERE id = %s", (me,))
            u = cur.fetchone() or {}
            display = u.get('full_name') or u.get('email') or me
            cur.close()
        finally:
            conn.close()
    token = video_interview_engine.generate_livekit_token(sess['room_name'], me, display)

    # Summon the transcription agent. Best-effort by design: a transcription
    # failure must not stop two people meeting, and the attempt is logged either
    # way so a missing transcript is explicable rather than mysterious.
    try:
        import requests as _http
        _http.post(os.getenv('AGENT_JOIN_URL', 'http://interview-agent:8080/join'),
                   json={'room': sess['room_name']}, timeout=3,
                   proxies={'http': None, 'https': None})
    except Exception as _agent_err:
        logger.warning("coaching transcription agent join skipped for %s: %s",
                       sess['room_name'], _agent_err)

    # Whether this participant has accepted the terms version that discloses
    # recording. Recorded, NOT enforced: users who registered before 2026-08-16
    # accepted terms that said nothing about it, and refusing them a session
    # would break the platform for everyone predating the change. Surfacing it
    # is what makes the gap closeable instead of invisible.
    try:
        from backend.consent_policy import has_current_consent, POLICY_VERSION
    except ImportError:  # pragma: no cover — the app runs under both roots
        from consent_policy import has_current_consent, POLICY_VERSION
    consented = has_current_consent(me)
    if consented is False:
        logger.info("coaching join: %s has no recording consent at policy %s",
                    me, POLICY_VERSION)

    return jsonify({"success": True, "data": {
        "room_name": sess['room_name'],
        "token": token,
        "livekit_url": os.getenv('LIVEKIT_URL', ''),
        "role": 'coach' if str(sess['coach_id']) == me else 'client',
        # The client is told in the room, not only in a document they accepted
        # months ago. None means we could not check — shown as the notice, since
        # the session IS being recorded regardless of what we could verify.
        "is_recorded": True,
        "recording_consent_current": consented,
        "policy_version": POLICY_VERSION,
    }}), 200


@coach_bp.route('/clients/<client_id>/hand-back', methods=['POST'])
@jwt_required()
def hand_back_client(client_id):
    """Return an operator-allocated client to the career-services team.

    WHY THIS EXISTS. An operator allocation lands ACTIVE without waiting for the
    coach to accept (owner, 2026-08-17) — in a call-centre-driven operation a
    coach's veto would leave an agent's promise to a candidate unfulfilled. That
    is a defensible trade only if the coach has a way out afterwards, and this
    is it. Without it the decision is simply "coaches take what they are given".

    ONLY ALLOCATED WORK. A candidate who chose this coach cannot be handed back:
    the coach already accepted that request, and withdrawing from it is a
    different act with a different conversation attached. can_hand_back()
    enforces the distinction rather than each caller remembering it.

    The reason is REQUIRED. A hand-back with no reason gives the operator nothing
    to act on and turns reallocation into guesswork — capacity, conflict of
    interest and wrong-fit need different responses.
    """
    guard = _require_coach_role()
    if guard:
        return guard
    coach_id = str(get_jwt_identity())
    reason = ((request.get_json(silent=True) or {}).get('reason') or '').strip()
    if not reason:
        return jsonify({"success": False, "message": "A reason is required"}), 400

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""SELECT id, status, origin, assigned_by
                         FROM coach_client_assignments
                        WHERE coach_id = %s AND client_id = %s""",
                    (coach_id, client_id))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return jsonify({"success": False, "message": "Not your client"}), 404

        if not cs.can_hand_back(row['status'], row['origin']):
            cur.close(); conn.close()
            # Distinguish the two refusals: "you chose to take this on" is a very
            # different message from "this is not active".
            if row['origin'] != cs.ORIGIN_ASSIGNED:
                msg = ("This client requested you and you accepted. Only clients "
                       "allocated by an operator can be handed back.")
            else:
                msg = f"Cannot hand back an assignment in state '{row['status']}'"
            return jsonify({"success": False, "message": msg}), 409

        cur.execute("UPDATE coach_client_assignments SET status=%s WHERE id=%s",
                    (cs.HANDED_BACK, row['id']))
        conn.commit()
        assigned_by = row['assigned_by']
        cur.close(); conn.close()

        # Back to the operator who allocated them. If nobody is recorded (a row
        # predating migration 072) the hand-back still succeeds — losing the
        # notification is better than refusing the coach a way out.
        if assigned_by:
            _safe_notify(assigned_by, 'caseload_handed_back',
                         'A coach has handed back a client',
                         f'Reason: {reason}')
        else:
            logger.warning("hand-back of %s by %s has no assigned_by to notify",
                           client_id, coach_id)

        return jsonify({"success": True, "status": cs.HANDED_BACK,
                        "message": "Client returned to career services"}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"success": False, "message": str(e)}), 500


@coach_bp.route('/my-sessions', methods=['GET'])
@jwt_required()
def my_sessions():
    """Sessions the caller is part of, either side of the relationship.

    The client had no way to see a session booked for them, which made an online
    room unreachable for half the people entitled to join it.
    """
    me = str(get_jwt_identity())
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT s.id, s.coach_id, s.client_id, s.session_type, s.duration_minutes,
                   s.session_date, s.room_name,
                   cu.full_name AS coach_name, cl.full_name AS client_name
              FROM coaching_sessions s
              LEFT JOIN users cu ON cu.id = s.coach_id
              LEFT JOIN users cl ON cl.id = s.client_id
             WHERE s.coach_id = %s OR s.client_id = %s
             ORDER BY s.session_date DESC LIMIT 50
        """, (me, me))
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()

    sessions = []
    for r in rows:
        d = dict(r)
        if d.get('session_date'):
            d['session_date'] = d['session_date'].isoformat()
        d['is_virtual'] = bool(d.get('room_name'))
        d['your_role'] = 'coach' if str(d['coach_id']) == me else 'client'
        # The room name is not a secret, but it is not needed by the client
        # either — /join is the only way in, and it re-checks membership.
        d.pop('room_name', None)
        sessions.append(d)
    return jsonify({"sessions": sessions, "total": len(sessions)}), 200
