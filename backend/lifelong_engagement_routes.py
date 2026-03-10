"""
Lifelong Engagement API Blueprint
Serves curated editorial data for:
  - National Service & Sustainability
  - Thought Leadership (UAE leaders)
  - Success Stories (Emirati private sector)
  - Retiree Services
"""

from flask import Blueprint, jsonify, request
import psycopg2, os
from dotenv import load_dotenv

load_dotenv()

lifelong_engagement_bp = Blueprint('lifelong_engagement', __name__, url_prefix='/api/lifelong')

def _conn():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', '127.0.0.1'),
        port=os.getenv('DB_PORT', '5432'),
        dbname=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
    )

def _q(sql, params=None):
    conn = _conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()

# ═══════════════════════════════════════
#  NATIONAL SERVICE
# ═══════════════════════════════════════

@lifelong_engagement_bp.route('/national-service/programs', methods=['GET'])
def get_ns_programs():
    try:
        rows = _q('SELECT * FROM ns_programs ORDER BY id')
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lifelong_engagement_bp.route('/national-service/opportunities', methods=['GET'])
def get_ns_opportunities():
    try:
        rows = _q('SELECT * FROM ns_sustainability_opportunities ORDER BY id')
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lifelong_engagement_bp.route('/national-service/partners', methods=['GET'])
def get_ns_partners():
    try:
        rows = _q('SELECT * FROM ns_partners ORDER BY id')
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lifelong_engagement_bp.route('/national-service/milestones', methods=['GET'])
def get_ns_milestones():
    try:
        rows = _q('SELECT * FROM ns_milestones ORDER BY id')
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lifelong_engagement_bp.route('/national-service/stats', methods=['GET'])
def get_ns_stats():
    try:
        impact = _q('SELECT * FROM ns_sustainability_impact ORDER BY id')
        steps = _q('SELECT * FROM ns_enrolment_steps ORDER BY step')
        return jsonify({'sustainability_impact': impact, 'enrolment_steps': steps}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ═══════════════════════════════════════
#  THOUGHT LEADERSHIP
# ═══════════════════════════════════════

@lifelong_engagement_bp.route('/thought-leadership/leaders', methods=['GET'])
def get_tl_leaders():
    try:
        leaders = _q('SELECT * FROM tl_leaders ORDER BY id')
        for l in leaders:
            lid = l['id']
            l['books'] = _q('SELECT * FROM tl_books WHERE leader_id = %s ORDER BY id', (lid,))
            l['speeches'] = _q('SELECT * FROM tl_speeches WHERE leader_id = %s ORDER BY id', (lid,))
        return jsonify(leaders), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ═══════════════════════════════════════
#  SUCCESS STORIES
# ═══════════════════════════════════════

@lifelong_engagement_bp.route('/success-stories', methods=['GET'])
def get_success_stories():
    try:
        stories = _q('SELECT * FROM success_stories ORDER BY id')
        for s in stories:
            sid = s['id']
            hl = _q('SELECT highlight_en, highlight_ar FROM ss_highlights WHERE story_id = %s ORDER BY id', (sid,))
            s['highlights'] = hl
        return jsonify(stories), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lifelong_engagement_bp.route('/success-stories/stats', methods=['GET'])
def get_ss_stats():
    try:
        sectors = _q('SELECT * FROM ss_sectors ORDER BY id')
        return jsonify({'sectors': sectors}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ═══════════════════════════════════════
#  RETIREE SERVICES
# ═══════════════════════════════════════

@lifelong_engagement_bp.route('/retiree/pension-benefits', methods=['GET'])
def get_ret_pension():
    try:
        benefits = _q('SELECT * FROM ret_pension_benefits ORDER BY id')
        for b in benefits:
            bid = b['id']
            details = _q('SELECT detail_en, detail_ar FROM ret_pension_details WHERE benefit_id = %s ORDER BY id', (bid,))
            b['details'] = details
        return jsonify(benefits), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lifelong_engagement_bp.route('/retiree/healthcare', methods=['GET'])
def get_ret_healthcare():
    try:
        rows = _q('SELECT * FROM ret_healthcare ORDER BY id')
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lifelong_engagement_bp.route('/retiree/engagement', methods=['GET'])
def get_ret_engagement():
    try:
        rows = _q('SELECT * FROM ret_engagement ORDER BY id')
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lifelong_engagement_bp.route('/retiree/perks', methods=['GET'])
def get_ret_perks():
    try:
        perks = _q('SELECT * FROM ret_lifestyle_perks ORDER BY id')
        centres = _q('SELECT * FROM ret_service_centres ORDER BY id')
        return jsonify({'perks': perks, 'service_centres': centres}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
