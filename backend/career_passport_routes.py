"""
Career Passport & Digital Stamps API Routes
Blueprint prefix: /api/career-passport

Persistent, gamified credential record tracking verified achievements
(courses, certs, internships, projects) as collectible digital stamps.
Used by: Student, Jobseeker, Parent (read-only).
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

career_passport_bp = Blueprint('career_passport', __name__, url_prefix='/api/career-passport')

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
    """Create career_passports and passport_stamps tables if they don't exist."""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS career_passports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER REFERENCES users(id) UNIQUE,
            level INTEGER DEFAULT 1,
            total_stamps INTEGER DEFAULT 0,
            title VARCHAR(100) DEFAULT 'Explorer',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS passport_stamps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            passport_id UUID REFERENCES career_passports(id) ON DELETE CASCADE,
            category VARCHAR(50) NOT NULL,
            title_en VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) DEFAULT '',
            description_en TEXT DEFAULT '',
            description_ar TEXT DEFAULT '',
            issuer VARCHAR(255) DEFAULT '',
            evidence_url VARCHAR(500) DEFAULT '',
            icon VARCHAR(50) DEFAULT 'award',
            color VARCHAR(20) DEFAULT '#6366f1',
            earned_at TIMESTAMP DEFAULT NOW(),
            verified BOOLEAN DEFAULT false,
            metadata JSONB DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS idx_career_passports_user ON career_passports(user_id);
        CREATE INDEX IF NOT EXISTS idx_passport_stamps_passport ON passport_stamps(passport_id);
        CREATE INDEX IF NOT EXISTS idx_passport_stamps_category ON passport_stamps(category);
    """)
    conn.commit()
    cur.close()


# Level thresholds
LEVEL_THRESHOLDS = [
    (0, 'Explorer', '🌱'),
    (3, 'Achiever', '⭐'),
    (7, 'Professional', '🏅'),
    (12, 'Expert', '🏆'),
    (20, 'Master', '👑'),
    (30, 'Legend', '💎'),
]

STAMP_CATEGORIES = ['training', 'certification', 'internship', 'project', 'community', 'assessment', 'achievement']

CATEGORY_ICONS = {
    'training': '📚',
    'certification': '🎖️',
    'internship': '💼',
    'project': '🛠️',
    'community': '🤝',
    'assessment': '📋',
    'achievement': '🌟',
}

CATEGORY_COLORS = {
    'training': '#3b82f6',
    'certification': '#f59e0b',
    'internship': '#10b981',
    'project': '#8b5cf6',
    'community': '#ec4899',
    'assessment': '#06b6d4',
    'achievement': '#f97316',
}


def get_level_info(total_stamps):
    """Determine level based on stamp count."""
    level_name = 'Explorer'
    level_icon = '🌱'
    level_num = 1
    next_threshold = 3
    for i, (threshold, name, icon) in enumerate(LEVEL_THRESHOLDS):
        if total_stamps >= threshold:
            level_name = name
            level_icon = icon
            level_num = i + 1
            next_threshold = LEVEL_THRESHOLDS[i + 1][0] if i + 1 < len(LEVEL_THRESHOLDS) else threshold + 10
    return level_num, level_name, level_icon, next_threshold


# ═══════════════════════════════════════════════════════════
# INITIALIZATION
# ═══════════════════════════════════════════════════════════

_initialized = False

@career_passport_bp.before_request
def init_tables():
    global _initialized
    if _initialized:
        return
    conn = get_db()
    if conn:
        try:
            ensure_tables(conn)
            _initialized = True
        except Exception as e:
            logger.error(f"Career passport init error: {e}")
        finally:
            conn.close()


# ═══════════════════════════════════════════════════════════
# GET PASSPORT
# ═══════════════════════════════════════════════════════════

@career_passport_bp.route('/<int:user_id>', methods=['GET'])
def get_passport(user_id):
    """Get full passport with all stamps for a user."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get or create passport
        cur.execute("SELECT * FROM career_passports WHERE user_id = %s", (user_id,))
        passport = cur.fetchone()
        if not passport:
            cur.execute("""
                INSERT INTO career_passports (user_id) VALUES (%s)
                RETURNING *
            """, (user_id,))
            passport = cur.fetchone()
            conn.commit()

        passport = dict(passport)
        passport['id'] = str(passport['id'])

        # Get stamps
        cur.execute("""
            SELECT * FROM passport_stamps
            WHERE passport_id = %s
            ORDER BY earned_at DESC
        """, (passport['id'],))
        stamps = [dict(r) for r in cur.fetchall()]

        # Process stamps
        for s in stamps:
            s['id'] = str(s['id'])
            s['passport_id'] = str(s['passport_id'])
            if s.get('earned_at'):
                s['earned_at'] = s['earned_at'].isoformat()
            if isinstance(s.get('metadata'), str):
                s['metadata'] = json.loads(s['metadata'])

        # Calculate level
        total = len(stamps)
        level_num, level_name, level_icon, next_threshold = get_level_info(total)

        # Category breakdown
        categories = {}
        for cat in STAMP_CATEGORIES:
            count = sum(1 for s in stamps if s.get('category') == cat)
            categories[cat] = {
                'count': count,
                'icon': CATEGORY_ICONS.get(cat, '📌'),
                'color': CATEGORY_COLORS.get(cat, '#6366f1'),
            }

        # Serialize datetimes
        for k in ('created_at', 'updated_at'):
            if passport.get(k):
                passport[k] = passport[k].isoformat()

        cur.close()
        conn.close()
        return jsonify({
            "passport": {
                **passport,
                "total_stamps": total,
                "level": level_num,
                "level_name": level_name,
                "level_icon": level_icon,
                "next_level_at": next_threshold,
                "progress_to_next": round((total / next_threshold * 100) if next_threshold > 0 else 100, 1),
            },
            "stamps": stamps,
            "categories": categories,
        }), 200
    except Exception as e:
        conn.close()
        logger.error(f"Get passport error: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════

@career_passport_bp.route('/<int:user_id>/summary', methods=['GET'])
def get_passport_summary(user_id):
    """Quick stats for a user's passport (for dashboard widgets)."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id FROM career_passports WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"total_stamps": 0, "level": 1, "level_name": "Explorer", "level_icon": "🌱"}), 200

        passport_id = str(row['id'])
        cur.execute("SELECT COUNT(*) as total FROM passport_stamps WHERE passport_id = %s", (passport_id,))
        total = cur.fetchone()['total']

        cur.execute("""
            SELECT category, COUNT(*) as count FROM passport_stamps
            WHERE passport_id = %s GROUP BY category
        """, (passport_id,))
        breakdown = {r['category']: r['count'] for r in cur.fetchall()}

        level_num, level_name, level_icon, next_threshold = get_level_info(total)

        cur.close()
        conn.close()
        return jsonify({
            "total_stamps": total,
            "level": level_num,
            "level_name": level_name,
            "level_icon": level_icon,
            "next_level_at": next_threshold,
            "progress_to_next": round((total / next_threshold * 100) if next_threshold > 0 else 100, 1),
            "breakdown": breakdown,
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# AWARD STAMP
# ═══════════════════════════════════════════════════════════

@career_passport_bp.route('/stamps', methods=['POST'])
@jwt_required(optional=True)
def award_stamp():
    """
    Award a digital stamp to a user's passport.
    Triggered by: course completion, certification, internship end, project milestone, etc.
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    if not user_id:
        try:
            user_id = get_jwt_identity()
        except:
            pass
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    category = data.get('category', 'achievement')
    if category not in STAMP_CATEGORIES:
        return jsonify({"error": f"Invalid category. Must be one of: {STAMP_CATEGORIES}"}), 400

    title_en = data.get('title_en', data.get('title', ''))
    if not title_en:
        return jsonify({"error": "title_en is required"}), 400

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get or create passport
        cur.execute("SELECT id FROM career_passports WHERE user_id = %s", (user_id,))
        passport = cur.fetchone()
        if not passport:
            cur.execute("INSERT INTO career_passports (user_id) VALUES (%s) RETURNING id", (user_id,))
            passport = cur.fetchone()
            conn.commit()

        passport_id = str(passport['id'])

        # Insert stamp
        cur.execute("""
            INSERT INTO passport_stamps (passport_id, category, title_en, title_ar,
                                          description_en, description_ar, issuer, evidence_url,
                                          icon, color, verified, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            passport_id, category, title_en,
            data.get('title_ar', ''),
            data.get('description_en', ''),
            data.get('description_ar', ''),
            data.get('issuer', ''),
            data.get('evidence_url', ''),
            data.get('icon', CATEGORY_ICONS.get(category, '📌')),
            data.get('color', CATEGORY_COLORS.get(category, '#6366f1')),
            data.get('verified', False),
            json.dumps(data.get('metadata', {})),
        ))
        stamp = dict(cur.fetchone())

        # Update passport total + level
        cur.execute("SELECT COUNT(*) as total FROM passport_stamps WHERE passport_id = %s", (passport_id,))
        total = cur.fetchone()['total']
        level_num, level_name, _, _ = get_level_info(total)
        cur.execute("""
            UPDATE career_passports SET total_stamps = %s, level = %s, title = %s, updated_at = NOW()
            WHERE id = %s
        """, (total, level_num, level_name, passport_id))
        conn.commit()

        stamp['id'] = str(stamp['id'])
        stamp['passport_id'] = str(stamp['passport_id'])
        if stamp.get('earned_at'):
            stamp['earned_at'] = stamp['earned_at'].isoformat()

        cur.close()
        conn.close()
        return jsonify({
            "stamp": stamp,
            "passport_update": {
                "total_stamps": total,
                "level": level_num,
                "level_name": level_name,
            }
        }), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        logger.error(f"Award stamp error: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
# LEADERBOARD
# ═══════════════════════════════════════════════════════════

@career_passport_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Top passport holders by stamp count."""
    limit = request.args.get('limit', 20, type=int)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT cp.user_id, cp.total_stamps, cp.level, cp.title,
                   u.full_name, u.email
            FROM career_passports cp
            LEFT JOIN users u ON u.id = cp.user_id
            WHERE cp.total_stamps > 0
            ORDER BY cp.total_stamps DESC
            LIMIT %s
        """, (limit,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        leaders = []
        for i, r in enumerate(rows):
            d = dict(r)
            _, level_name, level_icon, _ = get_level_info(d.get('total_stamps', 0))
            leaders.append({
                "rank": i + 1,
                "user_id": d['user_id'],
                "name": d.get('full_name', 'Anonymous'),
                "total_stamps": d['total_stamps'],
                "level": d['level'],
                "level_name": level_name,
                "level_icon": level_icon,
            })

        return jsonify({"leaderboard": leaders, "total": len(leaders)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500
