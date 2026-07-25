"""
Training Center Self-Service API Routes
Blueprint prefix: /api/training-center
Self-management portal for training center reps to list programs, track enrollments, issue certificates.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2, psycopg2.extras, os, json, logging

try:
    from backend.db_utils import execute_query
    from backend.auth.access_control import (
        require_roles, resolve_roles, PROFDEV_ROLES, TRAINING_ROLES,
    )
except ImportError:  # pragma: no cover
    from db_utils import execute_query
    from auth.access_control import (
        require_roles, resolve_roles, PROFDEV_ROLES, TRAINING_ROLES,
    )

logger = logging.getLogger(__name__)
training_center_bp = Blueprint('training_center', __name__, url_prefix='/api/training-center')


def _require_training_role():
    """Return a (response, 403) if the caller isn't a training provider, else None.
    Resolves secondary_roles — operator-bound reps hold training_provider as a
    SECONDARY role, so a primary-claim-only check would lock them out."""
    try:
        if not (resolve_roles() & TRAINING_ROLES):
            return jsonify({"error": "Forbidden - training provider access required"}), 403
    except Exception:
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
            -- users.id is CHAR(15) (Emirates ID); the earlier INTEGER FK made
            -- this CREATE fail on every request, so the table never existed
            -- and /profile //programs 500'd (audit 2026-07-23; migration 017
            -- now owns the real table — this stays only for fresh DBs/CI).
            user_id CHAR(15) REFERENCES users(id) UNIQUE,
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

def _my_center():
    """The center (id, name) the caller represents, or None. First active binding."""
    return execute_query(
        "SELECT c.id, c.name FROM training_center_staff st "
        "JOIN training_centers c ON c.id = st.training_center_id "
        "WHERE st.user_id = %s AND st.status = 'active' ORDER BY c.id LIMIT 1",
        (get_jwt_identity(),), fetch_one=True)


@training_center_bp.route('/programs', methods=['GET'])
@jwt_required()
def list_programs():
    """List the caller's center's programs from the canonical training_programs
    catalogue, with a correct enrolment count (training_program_enrollments)."""
    center = _my_center()
    if not center:
        return jsonify({"programs": [], "total": 0}), 200
    rows = execute_query(
        """SELECT tp.id, tp.title, tp.title_ar, tp.provider, tp.category, tp.level,
                  tp.duration, tp.url, tp.status, tp.active, tp.created_at::text AS created_at,
                  COALESCE((SELECT COUNT(*) FROM training_program_enrollments e
                            WHERE e.program_id = tp.id), 0) AS enrolled_count
           FROM training_programs tp
           WHERE tp.provider_id = %s
           ORDER BY tp.created_at DESC""",
        (center['id'],)) or []
    return jsonify({"programs": rows, "total": len(rows)}), 200


@training_center_bp.route('/programs', methods=['POST'])
@jwt_required()
def create_program():
    """A center rep submits a program into the canonical catalogue for review
    (status='submitted' until the Professional Dev Operator approves it)."""
    guard = _require_training_role()
    if guard:
        return guard
    center = _my_center()
    if not center:
        return jsonify({"error": "You are not bound to a training center"}), 403
    data = request.get_json(silent=True) or {}
    title = (data.get('title_en') or data.get('title') or data.get('name') or '').strip()
    if not title:
        return jsonify({"error": "title is required"}), 400
    skills = data.get('skills_covered') or data.get('skills') or []
    row = execute_query(
        """INSERT INTO training_programs
               (title, title_ar, provider, provider_id, category, level, duration, url,
                skills_covered, description, certification_offered, status, active,
                created_by, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, 'submitted', FALSE, %s, NOW())
           RETURNING id""",
        (title, data.get('title_ar') or data.get('name_ar'), center['name'], center['id'],
         data.get('category') or data.get('course_type') or 'General', data.get('level'),
         data.get('duration'), data.get('url'), json.dumps(skills), data.get('description'),
         bool(data.get('certification_offered', False)), get_jwt_identity()),
        fetch_one=True)
    return jsonify({"program_id": (row or {}).get('id'),
                    "message": "Program submitted for operator review"}), 201

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

# ─────────────────────────────────────────────────────────────────────────────
# Operator onboarding surface (Professional Dev Operator) — create/vet training
# centers and bind their representatives. Mirrors the education-operator ↔
# institution ↔ advisor model. Uses the shared execute_query access layer.
# ─────────────────────────────────────────────────────────────────────────────

@training_center_bp.route('/centers', methods=['POST'])
@require_roles(*PROFDEV_ROLES)
def create_center():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'name is required'}), 400
    existing = execute_query("SELECT id, name FROM training_centers WHERE LOWER(name) = LOWER(%s)",
                             (name,), fetch_one=True)
    if existing:
        return jsonify({'success': True, 'data': existing, 'message': 'Already exists'}), 200
    row = execute_query(
        "INSERT INTO training_centers (name, name_ar, accreditations, specializations, website, "
        "emirate, status, created_by, approved_by, created_at) "
        "VALUES (%s, %s, %s::jsonb, %s::jsonb, %s, %s, 'approved', %s, %s, NOW()) "
        "RETURNING id, name, name_ar, website, emirate, status",
        (name, data.get('name_ar'), json.dumps(data.get('accreditations') or []),
         json.dumps(data.get('specializations') or []), data.get('website'), data.get('emirate'),
         get_jwt_identity(), get_jwt_identity()), fetch_one=True)
    return jsonify({'success': True, 'data': row, 'message': 'Training center created'}), 201


@training_center_bp.route('/centers', methods=['GET'])
@require_roles(*PROFDEV_ROLES)
def list_centers():
    rows = execute_query(
        "SELECT id, name, name_ar, website, emirate, status FROM training_centers ORDER BY name") or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@training_center_bp.route('/centers/<int:center_id>/staff', methods=['GET'])
@require_roles(*PROFDEV_ROLES)
def list_center_staff(center_id):
    rows = execute_query(
        "SELECT st.user_id, COALESCE(u.full_name, st.user_id) AS full_name, st.staff_role, st.status "
        "FROM training_center_staff st LEFT JOIN users u ON u.id = st.user_id "
        "WHERE st.training_center_id = %s AND st.status = 'active' ORDER BY full_name",
        (center_id,)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@training_center_bp.route('/centers/<int:center_id>/staff', methods=['POST'])
@require_roles(*PROFDEV_ROLES)
def add_center_staff(center_id):
    """Bind a user as a training-center representative AND grant the
    training_provider role, so affiliation and role never drift apart."""
    data = request.get_json() or {}
    user_id = (data.get('user_id') or '').strip()
    if not execute_query("SELECT id FROM training_centers WHERE id = %s", (center_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'Training center not found'}), 404
    if not execute_query("SELECT id FROM users WHERE id = %s", (user_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'User not found'}), 404
    execute_query(
        "INSERT INTO training_center_staff (user_id, training_center_id, staff_role, status, created_by, created_at) "
        "VALUES (%s, %s, 'representative', 'active', %s, NOW()) "
        "ON CONFLICT (user_id, training_center_id, staff_role) DO UPDATE SET status = 'active'",
        (user_id, center_id, get_jwt_identity()), fetch_all=False)
    execute_query(
        "UPDATE users SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) "
        "|| jsonb_build_array('training_provider') WHERE id = %s "
        "AND NOT (COALESCE(secondary_roles, '[]'::jsonb) ? 'training_provider')",
        (user_id,), fetch_all=False)
    return jsonify({'success': True, 'message': f'{user_id} bound as representative',
                    'data': {'user_id': user_id, 'training_center_id': center_id}}), 201


@training_center_bp.route('/centers/<int:center_id>/staff/<user_id>', methods=['DELETE'])
@require_roles(*PROFDEV_ROLES)
def remove_center_staff(center_id, user_id):
    """Deactivate a rep binding (role left intact — they may staff another center)."""
    execute_query(
        "UPDATE training_center_staff SET status = 'inactive' "
        "WHERE training_center_id = %s AND user_id = %s",
        (center_id, str(user_id).strip()), fetch_all=False)
    return jsonify({'success': True, 'message': 'Representative removed'})


@training_center_bp.route('/my-centers', methods=['GET'])
@require_roles(*TRAINING_ROLES)
def my_centers():
    """The training centers the caller represents (for the provider dashboard)."""
    rows = execute_query(
        "SELECT c.id, c.name, c.name_ar, c.website, c.emirate, c.status "
        "FROM training_center_staff st JOIN training_centers c ON c.id = st.training_center_id "
        "WHERE st.user_id = %s AND st.status = 'active' ORDER BY c.name",
        (get_jwt_identity(),)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


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
