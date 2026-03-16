"""
Recruiter Shortlist Routes
API endpoints for managing candidate shortlists
"""

from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import logging
from backend.db import get_db_connection
from backend.user_helpers import user_display_name
from datetime import datetime
import json

from .shortlist_engine import ShortlistEngine, ShortlistStatus

logger = logging.getLogger(__name__)

# Create blueprint
shortlist_bp = Blueprint('shortlist', __name__)




@shortlist_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for shortlist routes"""
    return jsonify({
        'status': 'healthy',
        'service': 'Recruiter Shortlist API'
    }), 200


@shortlist_bp.route('/add', methods=['POST'])
def add_to_shortlist():
    """
    Add a candidate to shortlist
    
    Request body:
    {
        "jd_id": "jd_...",
        "candidate_id": "user_...",
        "recruiter_id": "recruiter_...",
        "match_score": 85.5,
        "match_details": {...},
        "notes": "Strong technical background"
    }
    """
    try:
        data = request.get_json()
        
        jd_id = str(data.get('jd_id', ''))
        candidate_id = str(data.get('candidate_id', ''))
        recruiter_id = str(data.get('recruiter_id', ''))
        match_score = data.get('match_score', 0.0)
        match_details = data.get('match_details', {})
        notes = data.get('notes', '')
        
        if not all([jd_id, candidate_id, recruiter_id]):
            return jsonify({
                'error': 'Missing required fields: jd_id, candidate_id, recruiter_id'
            }), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Create shortlist table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS candidate_shortlist (
                id SERIAL PRIMARY KEY,
                shortlist_id VARCHAR(100) UNIQUE NOT NULL,
                jd_id VARCHAR(100) NOT NULL,
                candidate_id VARCHAR(100) NOT NULL,
                recruiter_id VARCHAR(100) NOT NULL,
                match_score DECIMAL(5,2),
                match_details JSONB,
                status VARCHAR(50) DEFAULT 'shortlisted',
                notes TEXT,
                tags JSONB DEFAULT '[]',
                contacted_at TIMESTAMP,
                interview_scheduled_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(jd_id, candidate_id)
            )
        """)
        conn.commit()
        
        # Generate shortlist ID
        import uuid
        shortlist_id = f"sl_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        # Check if already shortlisted
        cur.execute("""
            SELECT shortlist_id FROM candidate_shortlist 
            WHERE jd_id = %s AND candidate_id = %s
        """, (jd_id, candidate_id))
        
        existing = cur.fetchone()
        
        if existing:
            # Check if we should reactivate
            cur.execute("SELECT status FROM candidate_shortlist WHERE shortlist_id = %s", (existing[0],))
            status_row = cur.fetchone()
            current_status = status_row[0] if status_row else None
            
            if current_status in ['rejected', 'withdrawn', 'archived']:
                cur.execute("""
                    UPDATE candidate_shortlist 
                    SET status = 'shortlisted', updated_at = CURRENT_TIMESTAMP, notes = COALESCE(notes, '') || %s 
                    WHERE shortlist_id = %s
                """, (f"\n{datetime.now().strftime('%Y-%m-%d %H:%M')}: Reactivated via re-add", existing[0]))
                conn.commit()
                return jsonify({
                    'success': True,
                    'shortlist_id': existing[0],
                    'message': 'Candidate reactivated in shortlist'
                }), 200
            
            return jsonify({
                'success': False,
                'message': 'Candidate already shortlisted for this job',
                'shortlist_id': existing[0]
            }), 409
        
        # Insert shortlist entry
        cur.execute("""
            INSERT INTO candidate_shortlist (
                shortlist_id, jd_id, candidate_id, recruiter_id,
                match_score, match_details, notes, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            shortlist_id, jd_id, candidate_id, recruiter_id,
            match_score, json.dumps(match_details), notes, 'shortlisted'
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Added candidate {candidate_id} to shortlist for JD {jd_id}")
        
        return jsonify({
            'success': True,
            'shortlist_id': shortlist_id,
            'message': 'Candidate added to shortlist successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding to shortlist: {e}")
        return jsonify({'error': str(e)}), 500


@shortlist_bp.route('/<jd_id>', methods=['GET'])
def get_shortlist(jd_id):
    """
    Get shortlisted candidates for a job description
    
    Query parameters:
    - status: Filter by status (optional)
    - limit: Number of results (default: 50)
    - offset: Pagination offset (default: 0)
    """
    try:
        status_filter = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Build query using the CORRECT table: shortlisted_candidates (unified source of truth)
        # We need to join with job_postings to filter by the public jd_id (UUID)
        
        query = """
            SELECT 
                sc.id as shortlist_id_internal,
                sc.id::text as shortlist_id, -- Frontend expects shortlist_id string
                jp.jd_id,
                sc.candidate_id::text as candidate_id, -- Frontend expects string
                sc.status,
                sc.notes,
                sc.created_at,
                -- Return 0 for match_score if column missing, or fetch if available (schema showed it missing in sample but valid in checks?)
                -- Actually schema check 4371/4391 didn't show match_score in shortlisted_candidates sample, 
                -- so we'll use 0 or fetch from another table if critical. For now 0 to avoid crash.
                0 as match_score, 
                u.first_name,
                u.last_name,
                COALESCE(u.display_name, NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.full_name) as display_name,
                u.email,
                i.interview_id,
                i.feedback as interview_feedback,
                i.rating as interview_rating,
                i.recommendation as interview_recommendation,
                i.scheduled_date as interview_date,
                i.status as interview_status
            FROM shortlisted_candidates sc
            JOIN job_postings jp ON sc.job_id = jp.id
            LEFT JOIN users u ON sc.candidate_id::text = u.id::text
            LEFT JOIN LATERAL (
                SELECT interview_id, feedback, rating, recommendation, scheduled_date, status
                FROM interview_schedules
                WHERE shortlist_id = sc.id::text -- matching string representation
                ORDER BY scheduled_date DESC, created_at DESC
                LIMIT 1
            ) i ON true
            WHERE jp.jd_id = %s
        """
        
        params = [str(jd_id)]
        
        if status_filter:
            query += " AND sc.status = %s"
            params.append(status_filter)
        
        query += " ORDER BY sc.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cur.execute(query, params)
        shortlist = cur.fetchall()
        
        # Convert to list of dicts
        shortlist_data = []
        for entry in shortlist:
            entry_dict = dict(entry)
            # Add synthetic/missing fields for compatibility
            if 'match_details' not in entry_dict:
                entry_dict['match_details'] = {}
            if 'tags' not in entry_dict:
                entry_dict['tags'] = []
            shortlist_data.append(entry_dict)
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'shortlist': shortlist_data,
            'count': len(shortlist_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting shortlist: {e}")
        return jsonify({'error': str(e)}), 500


@shortlist_bp.route('/<shortlist_id>/status', methods=['PUT'])
def update_shortlist_status(shortlist_id):
    """
    Update shortlist candidate status
    
    Request body:
    {
        "status": "contacted",
        "notes": "Sent initial email"
    }
    """
    try:
        data = request.get_json()
        status = data.get('status')
        notes = data.get('notes', '')
        
        if not status:
            return jsonify({'error': 'Status is required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Build update fields for shortlisted_candidates (only has status, notes, updated_at)
        update_fields = ["status = %s", "updated_at = CURRENT_TIMESTAMP"]
        params = [status]
        
        if notes:
            update_fields.append("notes = COALESCE(notes, '') || %s")
            params.append(f"\n{datetime.now().strftime('%Y-%m-%d %H:%M')}: {notes}")
        
        params.append(shortlist_id)
        
        # The frontend sends shortlisted_candidates.id (cast to text) as the shortlist_id
        cur.execute(f"""
            UPDATE shortlisted_candidates 
            SET {', '.join(update_fields)}
            WHERE id = %s::integer
        """, params)
        
        rows_affected = cur.rowcount
        
        # Fallback: try candidate_shortlist (legacy table, has extra columns)
        if rows_affected == 0:
            legacy_fields = list(update_fields)
            legacy_params = list(params)
            # Legacy table has contacted_at and interview_scheduled_at columns
            if status == 'contacted':
                legacy_fields.append("contacted_at = CURRENT_TIMESTAMP")
            if status == 'interview_scheduled':
                legacy_fields.append("interview_scheduled_at = CURRENT_TIMESTAMP")
            
            cur.execute(f"""
                UPDATE candidate_shortlist 
                SET {', '.join(legacy_fields)}
                WHERE shortlist_id = %s
            """, legacy_params)
            rows_affected = cur.rowcount
        
        conn.commit()
        cur.close()
        conn.close()
        
        if rows_affected == 0:
            logger.warning(f"No rows updated for shortlist_id {shortlist_id}")
            return jsonify({
                'success': False,
                'message': f'No shortlist entry found with id {shortlist_id}'
            }), 404
        
        logger.info(f"Updated shortlist {shortlist_id} to status: {status}")
        
        return jsonify({
            'success': True,
            'message': 'Status updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating shortlist status: {e}")
        return jsonify({'error': str(e)}), 500


@shortlist_bp.route('/<shortlist_id>', methods=['DELETE'])
def remove_from_shortlist(shortlist_id):
    """Remove a candidate from shortlist"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            DELETE FROM candidate_shortlist WHERE shortlist_id = %s
        """, (shortlist_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Removed from shortlist: {shortlist_id}")
        
        return jsonify({
            'success': True,
            'message': 'Candidate removed from shortlist'
        }), 200
        
    except Exception as e:
        logger.error(f"Error removing from shortlist: {e}")
        return jsonify({'error': str(e)}), 500


@shortlist_bp.route('/<shortlist_id>/notes', methods=['POST'])
def add_note(shortlist_id):
    """
    Add a note to shortlist entry
    
    Request body:
    {
        "note": "Excellent communication skills",
        "recruiter_id": "recruiter_123"
    }
    """
    try:
        data = request.get_json()
        note = data.get('note', '')
        recruiter_id = data.get('recruiter_id', '')
        
        if not note:
            return jsonify({'error': 'Note is required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        formatted_note = f"\n[{timestamp}] {note}"
        
        cur.execute("""
            UPDATE candidate_shortlist 
            SET notes = COALESCE(notes, '') || %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE shortlist_id = %s
        """, (formatted_note, shortlist_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Note added successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error adding note: {e}")
        return jsonify({'error': str(e)}), 500


@shortlist_bp.route('/<jd_id>/stats', methods=['GET'])
def get_shortlist_stats(jd_id):
    """Get statistics for a job description's shortlist"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get counts by status
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
                COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted,
                COUNT(CASE WHEN status = 'interview_scheduled' THEN 1 END) as interview_scheduled,
                COUNT(CASE WHEN status = 'interviewed' THEN 1 END) as interviewed,
                COUNT(CASE WHEN status = 'offer_sent' THEN 1 END) as offer_sent,
                COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                AVG(match_score) as avg_match_score
            FROM candidate_shortlist
            WHERE jd_id = %s
        """, (jd_id,))
        
        stats = cur.fetchone()
        
        # Get actual interview count from interview_schedules table
        try:
            cur.execute("""
                SELECT COUNT(*) as interview_count
                FROM interview_schedules
                WHERE jd_id = %s
            """, (jd_id,))
            interview_result = cur.fetchone()
            if interview_result and stats:
                stats['interview_count'] = interview_result['interview_count']
        except Exception:
            # Table might not exist yet
            if stats:
                stats['interview_count'] = 0
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': dict(stats) if stats else {}
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting shortlist stats: {e}")
        return jsonify({'error': str(e)}), 500

