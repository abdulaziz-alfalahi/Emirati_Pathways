"""
Community & Mentorship API Routes
Endpoints for communities, feed, events, mentors, and mentorship stats
"""

from flask import Blueprint, jsonify, request
import psycopg2
import psycopg2.extras
import logging
import os
import json

logger = logging.getLogger(__name__)

community_mentorship_bp = Blueprint('community_mentorship', __name__, url_prefix='/api/community-mentorship')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def _get_conn():
    return psycopg2.connect(**DB_CONFIG)

def _safe_json(val):
    """Parse JSONB value safely."""
    if val is None:
        return []
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return []
    return val


# ─────────────────────────────────────────────
# 1. GET /communities
# ─────────────────────────────────────────────
@community_mentorship_bp.route('/communities', methods=['GET'])
def get_communities():
    """Return all communities."""
    try:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, name, name_ar, description, description_ar,
                   category, category_ar, members, posts_count,
                   verified, avatar, tags
            FROM communities
            ORDER BY members DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        communities = []
        for r in rows:
            communities.append({
                'id': r['id'],
                'name': r['name'],
                'name_ar': r['name_ar'],
                'description': r['description'],
                'description_ar': r['description_ar'],
                'category': r['category'],
                'category_ar': r['category_ar'],
                'members': r['members'],
                'posts': r['posts_count'],
                'verified': r['verified'],
                'avatar': r['avatar'],
                'tags': _safe_json(r['tags']),
            })

        return jsonify({
            'success': True,
            'communities': communities,
            'total_count': len(communities)
        })
    except Exception as e:
        logger.error(f"Error fetching communities: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
# 2. GET /community-feed
# ─────────────────────────────────────────────
@community_mentorship_bp.route('/community-feed', methods=['GET'])
def get_community_feed():
    """Return recent community feed posts."""
    try:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, author_name, author_name_ar, author_title, author_title_ar,
                   author_company, author_company_ar, author_avatar,
                   community_name, community_name_ar,
                   content, content_ar, likes, comments, verified,
                   created_at
            FROM community_posts
            ORDER BY created_at DESC
            LIMIT 20
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        posts = []
        for r in rows:
            posts.append({
                'id': r['id'],
                'author': r['author_name'],
                'author_ar': r['author_name_ar'],
                'title': r['author_title'],
                'title_ar': r['author_title_ar'],
                'company': r['author_company'],
                'company_ar': r['author_company_ar'],
                'avatar': r['author_avatar'],
                'community': r['community_name'],
                'community_ar': r['community_name_ar'],
                'content': r['content'],
                'content_ar': r['content_ar'],
                'likes': r['likes'],
                'comments': r['comments'],
                'verified': r['verified'],
                'time': r['created_at'].strftime('%b %d, %Y') if r['created_at'] else '',
            })

        return jsonify({
            'success': True,
            'posts': posts,
            'total_count': len(posts)
        })
    except Exception as e:
        logger.error(f"Error fetching community feed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
# 3. GET /community-events
# ─────────────────────────────────────────────
@community_mentorship_bp.route('/community-events', methods=['GET'])
def get_community_events():
    """Return upcoming community events."""
    try:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, title, title_ar, event_date, start_time, end_time,
                   location, location_ar, event_type,
                   attendees, max_attendees,
                   community_name, community_name_ar,
                   organizer, organizer_ar
            FROM community_events
            ORDER BY event_date ASC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        events = []
        for r in rows:
            # Extract month/day for display
            ed = r['event_date']
            if ed:
                month = ed.strftime('%b')
                day = str(ed.day)
                date_str = ed.strftime('%b %d, %Y')
            else:
                month, day, date_str = '', '', ''

            events.append({
                'id': r['id'],
                'title': r['title'],
                'title_ar': r['title_ar'],
                'date': date_str,
                'dateParts': {'month': month, 'day': day},
                'time': f"{r['start_time']} – {r['end_time']}" if r['start_time'] else '',
                'location': r['location'],
                'location_ar': r['location_ar'],
                'type': r['event_type'],
                'typeKey': r['event_type'],  # Online, In-Person, Hybrid
                'attendees': r['attendees'],
                'maxAttendees': r['max_attendees'],
                'community': r['community_name'],
                'community_ar': r['community_name_ar'],
                'organizer': r['organizer'],
                'organizer_ar': r['organizer_ar'],
            })

        return jsonify({
            'success': True,
            'events': events,
            'total_count': len(events)
        })
    except Exception as e:
        logger.error(f"Error fetching community events: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
# 4. GET /mentors
# ─────────────────────────────────────────────
@community_mentorship_bp.route('/mentors', methods=['GET'])
def get_mentors():
    """Return all mentor profiles."""
    try:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, full_name, full_name_ar, title, title_ar,
                   company, company_ar, expertise_areas, expertise_areas_ar,
                   rating, total_sessions, location, location_ar,
                   available, avatar, is_uae_national, years_experience,
                   bio, bio_ar
            FROM mentor_profiles
            ORDER BY rating DESC, total_sessions DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        mentors = []
        for r in rows:
            mentors.append({
                'id': r['id'],
                'name': r['full_name'],
                'name_ar': r['full_name_ar'],
                'title': r['title'],
                'title_ar': r['title_ar'],
                'company': r['company'],
                'company_ar': r['company_ar'],
                'expertise': _safe_json(r['expertise_areas']),
                'expertise_ar': _safe_json(r['expertise_areas_ar']),
                'rating': float(r['rating']) if r['rating'] else 0,
                'sessions': r['total_sessions'],
                'location': r['location'],
                'location_ar': r['location_ar'],
                'available': r['available'],
                'avatar': r['avatar'],
                'isUaeNational': r['is_uae_national'],
                'yearsExperience': r['years_experience'],
                'bio': r['bio'],
                'bio_ar': r['bio_ar'],
            })

        return jsonify({
            'success': True,
            'mentors': mentors,
            'total_count': len(mentors)
        })
    except Exception as e:
        logger.error(f"Error fetching mentors: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
# 5. GET /mentorship-stats
# ─────────────────────────────────────────────
@community_mentorship_bp.route('/mentorship-stats', methods=['GET'])
def get_mentorship_stats():
    """Return aggregate mentorship statistics."""
    try:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Mentor count
        cur.execute("SELECT count(*) as cnt FROM mentor_profiles WHERE available = TRUE")
        available_mentors = cur.fetchone()['cnt']

        cur.execute("SELECT count(*) as cnt FROM mentor_profiles")
        total_mentors = cur.fetchone()['cnt']

        # Total sessions & avg rating
        cur.execute("SELECT COALESCE(SUM(total_sessions), 0) as total_sessions, COALESCE(AVG(rating), 0) as avg_rating FROM mentor_profiles")
        agg = cur.fetchone()

        # Mentorship programs: total mentees enrolled
        cur.execute("SELECT COALESCE(SUM(current_mentees), 0) as total_mentees FROM mentorship_programs WHERE status = 'active'")
        total_mentees = cur.fetchone()['total_mentees']

        # Community stats
        cur.execute("SELECT count(*) as cnt, COALESCE(SUM(members), 0) as total_members FROM communities")
        comm = cur.fetchone()

        cur.close()
        conn.close()

        return jsonify({
            'success': True,
            'stats': {
                'total_mentors': total_mentors,
                'available_mentors': available_mentors,
                'total_mentees': total_mentees,
                'total_sessions': agg['total_sessions'],
                'avg_rating': round(float(agg['avg_rating']), 1),
                'total_communities': comm['cnt'],
                'total_community_members': comm['total_members'],
            }
        })
    except Exception as e:
        logger.error(f"Error fetching mentorship stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


logger.info("✅ Community & Mentorship routes loaded")
