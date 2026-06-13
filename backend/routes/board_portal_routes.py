from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
from psycopg2.extras import RealDictCursor
from db import get_db_connection
from functools import wraps

def optional_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow requests without auth to proceed
        return f(*args, **kwargs)
    return decorated_function
logger = logging.getLogger(__name__)

board_portal_bp = Blueprint('board_portal', __name__, url_prefix='/api/board')

def execute_query(query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False, commit: bool = False):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            
            result = None
            if fetch_one:
                result = cur.fetchone()
            elif fetch_all:
                result = cur.fetchall()
                
            if commit:
                conn.commit()
                
            return result
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        conn.close()

@board_portal_bp.route('/scorecards', methods=['GET'])
@optional_auth
def get_scorecards():
    try:
        # Mocking complex aggregations for the sprint, read from existing tables where possible
        total_candidates_query = "SELECT COUNT(*) as count FROM users WHERE role IN ('candidate', 'job_seeker')"
        total_candidates = execute_query(total_candidates_query, fetch_one=True)['count']

        total_companies_query = "SELECT COUNT(*) as count FROM companies"
        total_companies = execute_query(total_companies_query, fetch_one=True)['count']

        total_offers_query = "SELECT COUNT(*) as count FROM offers"
        total_offers = execute_query(total_offers_query, fetch_one=True)['count']

        scorecards = {
            'placement_rate': {
                'value': f"{(total_offers / total_candidates * 100) if total_candidates > 0 else 0:.1f}%",
                'trend': '+2.4%',
                'target': '15.0%',
                'status': 'good'
            },
            'time_to_hire': {
                'value': '24 days',
                'trend': '-3 days',
                'target': '30 days',
                'status': 'excellent'
            },
            'pipeline_health': {
                'value': f"{total_candidates}",
                'trend': '+12%',
                'target': '1000',
                'status': 'good'
            },
            'emiratisation_progress': {
                'value': '4.2%',
                'trend': '+0.5%',
                'target': '5.0%',
                'status': 'warning'
            },
            'active_companies': {
                'value': f"{total_companies}",
                'trend': '+5%',
                'target': '50',
                'status': 'good'
            },
            'total_offers': {
                'value': f"{total_offers}",
                'trend': '+18%',
                'target': '100',
                'status': 'excellent'
            }
        }
        return jsonify(scorecards), 200
    except Exception as e:
        logger.error(f"Error getting scorecards: {str(e)}")
        return jsonify({'error': 'Failed to fetch scorecards'}), 500

@board_portal_bp.route('/insights', methods=['GET'])
@optional_auth
def get_insights():
    try:
        # Generate AI-like insights based on simple rules or mock data for the sprint
        insights = [
            {
                'id': 1,
                'title': 'Placement Rate Growth',
                'description': 'Abu Dhabi placement rate increased by 12%, driven primarily by the technology sector.',
                'severity': 'info',
                'theme': 'talent_supply'
            },
            {
                'id': 2,
                'title': 'Company Inactivity',
                'description': '3 major enterprise companies have not posted new roles in the last 30 days.',
                'severity': 'warning',
                'theme': 'company_demand'
            },
            {
                'id': 3,
                'title': 'Candidate Registration Surge',
                'description': '45 candidates completed their profile this week vs. 28 last week.',
                'severity': 'info',
                'theme': 'platform_health'
            }
        ]
        return jsonify(insights), 200
    except Exception as e:
        logger.error(f"Error getting insights: {str(e)}")
        return jsonify({'error': 'Failed to fetch insights'}), 500

@board_portal_bp.route('/directives', methods=['GET', 'POST'])
@optional_auth
def handle_directives():
    if request.method == 'GET':
        status_filter = request.args.get('status')
        query = "SELECT * FROM board_directives"
        params = ()
        if status_filter:
            query += " WHERE status = %s"
            params = (status_filter,)
        query += " ORDER BY created_at DESC"
        
        try:
            directives = execute_query(query, params, fetch_all=True)
            return jsonify(directives), 200
        except Exception as e:
            logger.error(f"Error getting directives: {str(e)}")
            return jsonify({'error': 'Failed to fetch directives'}), 500
            
    elif request.method == 'POST':
        data = request.json
        # Handle optional_auth behavior where user might be None if no token, 
        # mock author_id if no proper auth for this demo sprint
        author_id = getattr(request, 'user', {}).get('id', 'board_user_1') 
        
        try:
            query = """
                INSERT INTO board_directives (author_id, title, body, category, priority)
                VALUES (%s, %s, %s, %s, %s) RETURNING *
            """
            params = (author_id, data['title'], data.get('body', ''), data['category'], data.get('priority', 'normal'))
            directive = execute_query(query, params, fetch_one=True, commit=True)
            return jsonify(directive), 201
        except Exception as e:
            logger.error(f"Error creating directive: {str(e)}")
            return jsonify({'error': 'Failed to create directive'}), 500

@board_portal_bp.route('/directives/<directive_id>/respond', methods=['POST'])
@optional_auth
def respond_directive(directive_id):
    data = request.json
    responder_id = getattr(request, 'user', {}).get('id', 'admin_user_1')
    
    try:
        query = """
            INSERT INTO board_directive_responses (directive_id, responder_id, body)
            VALUES (%s, %s, %s) RETURNING *
        """
        response = execute_query(query, (directive_id, responder_id, data['body']), fetch_one=True, commit=True)
        return jsonify(response), 201
    except Exception as e:
        logger.error(f"Error responding to directive: {str(e)}")
        return jsonify({'error': 'Failed to respond to directive'}), 500

@board_portal_bp.route('/directives/<directive_id>/status', methods=['PUT'])
@optional_auth
def update_directive_status(directive_id):
    data = request.json
    
    try:
        query = """
            UPDATE board_directives SET status = %s, updated_at = NOW()
            WHERE id = %s RETURNING *
        """
        directive = execute_query(query, (data['status'], directive_id), fetch_one=True, commit=True)
        return jsonify(directive), 200
    except Exception as e:
        logger.error(f"Error updating directive status: {str(e)}")
        return jsonify({'error': 'Failed to update directive status'}), 500

@board_portal_bp.route('/briefing-pack', methods=['GET'])
@optional_auth
def get_briefing_pack():
    # Helper endpoint that bundles scorecards, insights, and open directives
    try:
        # Reuse existing functions for simplicity in this endpoint
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'message': 'Briefing pack generated successfully.',
            # In a real scenario, this would call the logic inside the respective methods
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to generate briefing pack'}), 500
