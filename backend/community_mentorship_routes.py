"""
Community & Mentorship API Routes
Endpoints for communities, feed, events, mentors, and mentorship stats
"""

from flask import Blueprint, jsonify, request
import psycopg2
import psycopg2.extras
import logging
import json
from backend.db import get_db_connection

logger = logging.getLogger(__name__)

community_mentorship_bp = Blueprint('community_mentorship', __name__, url_prefix='/api/community-mentorship')

def _get_conn():
    return get_db_connection()

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
    """Return all mentor profiles.

    Queried against the DEPLOYED mentor_profiles schema (user_id +
    professional_* columns, name via users) — the previous query named a
    phantom denormalised DDL (full_name/title/bio/...) that doesn't exist
    on the live table, so it 500'd and the page silently showed static
    mentors. There are no _ar/avatar/location columns on this table, so
    those are returned null rather than faked.
    """
    try:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT mp.id, mp.user_id,
                   u.full_name,
                   mp.professional_title, mp.current_company, mp.industry,
                   mp.expertise_areas, mp.rating, mp.total_sessions,
                   mp.is_available, mp.years_of_experience,
                   mp.professional_summary,
                   COALESCE(u.is_uae_national, FALSE) AS is_uae_national
            FROM mentor_profiles mp
            LEFT JOIN users u ON u.id = mp.user_id
            ORDER BY mp.rating DESC, mp.total_sessions DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        mentors = []
        for r in rows:
            mentors.append({
                'id': r['id'],
                'name': r['full_name'],
                'name_ar': None,
                'title': r['professional_title'],
                'title_ar': None,
                'company': r['current_company'],
                'company_ar': None,
                'industry': r['industry'],
                'expertise': _safe_json(r['expertise_areas']),
                'expertise_ar': [],
                'rating': float(r['rating']) if r['rating'] else 0,
                'sessions': r['total_sessions'] or 0,
                'location': None,
                'location_ar': None,
                'available': bool(r['is_available']),
                'avatar': None,
                'isUaeNational': bool(r['is_uae_national']),
                'yearsExperience': r['years_of_experience'] or 0,
                'bio': r['professional_summary'],
                'bio_ar': None,
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

        # Mentor counts + aggregates (live schema uses is_available).
        cur.execute("""
            SELECT count(*) AS total_mentors,
                   count(*) FILTER (WHERE is_available) AS available_mentors,
                   COALESCE(SUM(total_sessions), 0) AS total_sessions,
                   COALESCE(AVG(NULLIF(rating, 0)), 0) AS avg_rating
            FROM mentor_profiles
        """)
        agg = cur.fetchone()

        # Optional aggregates — each guarded so a missing table (schema drift,
        # e.g. communities does not exist on live) yields 0 rather than 500ing
        # the whole stats endpoint.
        def _scalar(sql, default=0):
            try:
                cur.execute("SAVEPOINT s")
                cur.execute(sql)
                cur.execute("RELEASE SAVEPOINT s")
                row = cur.fetchone()
                return list(row.values())[0] if row else default
            except Exception:
                try:
                    cur.execute("ROLLBACK TO SAVEPOINT s")
                except Exception:
                    pass
                return default

        total_mentees = _scalar(
            "SELECT COALESCE(SUM(current_mentees), 0) AS v FROM mentorship_programs WHERE status = 'active'")
        total_communities = _scalar("SELECT count(*) AS v FROM communities")
        total_community_members = _scalar("SELECT COALESCE(SUM(members), 0) AS v FROM communities")

        cur.close()
        conn.close()

        return jsonify({
            'success': True,
            'stats': {
                'total_mentors': agg['total_mentors'],
                'available_mentors': agg['available_mentors'],
                'total_mentees': total_mentees,
                'total_sessions': agg['total_sessions'],
                'avg_rating': round(float(agg['avg_rating']), 1),
                'total_communities': total_communities,
                'total_community_members': total_community_members,
            }
        })
    except Exception as e:
        logger.error(f"Error fetching mentorship stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


logger.info("✅ Community & Mentorship routes loaded")
