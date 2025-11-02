"""
Offer Management Engine
Handles business logic for job offer creation, tracking, and management
"""

import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import secrets
import json
import logging
import os

logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'Passw0rd')
}

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

def generate_offer_id():
    """Generate unique offer ID"""
    return f"offer_{secrets.token_hex(6)}"

def create_offer_table():
    """Create job_offers table if it doesn't exist"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS job_offers (
            offer_id VARCHAR(50) PRIMARY KEY,
            jd_id VARCHAR(50) NOT NULL,
            shortlist_id VARCHAR(50) NOT NULL,
            candidate_id VARCHAR(50) NOT NULL,
            recruiter_id VARCHAR(50) NOT NULL,
            
            position_title VARCHAR(255) NOT NULL,
            department VARCHAR(255),
            employment_type VARCHAR(50) NOT NULL,
            start_date DATE,
            
            salary_amount DECIMAL(12, 2) NOT NULL,
            salary_currency VARCHAR(10) DEFAULT 'AED',
            salary_period VARCHAR(20) DEFAULT 'annual',
            bonus_amount DECIMAL(12, 2),
            equity_percentage DECIMAL(5, 2),
            
            benefits JSONB,
            
            status VARCHAR(50) DEFAULT 'draft',
            offer_date TIMESTAMP,
            expiry_date DATE,
            response_deadline DATE,
            
            candidate_response VARCHAR(50),
            response_date TIMESTAMP,
            response_notes TEXT,
            
            negotiation_status VARCHAR(50) DEFAULT 'none',
            negotiation_rounds INTEGER DEFAULT 0,
            negotiation_notes TEXT,
            
            contract_duration_months INTEGER,
            probation_period_months INTEGER,
            notice_period_days INTEGER,
            work_location VARCHAR(255),
            remote_work_policy VARCHAR(50),
            
            offer_letter_url TEXT,
            contract_url TEXT,
            additional_documents JSONB,
            
            approval_status VARCHAR(50) DEFAULT 'pending',
            approved_by VARCHAR(50),
            approval_date TIMESTAMP,
            approval_notes TEXT,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(50),
            notes TEXT
        )
    """)
    
    # Create indexes
    cur.execute("CREATE INDEX IF NOT EXISTS idx_offers_jd ON job_offers(jd_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_offers_candidate ON job_offers(candidate_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_offers_status ON job_offers(status)")
    
    conn.commit()
    cur.close()
    conn.close()

def create_offer(offer_data):
    """
    Create a new job offer
    
    Args:
        offer_data: Dictionary containing offer details
        
    Returns:
        dict: {success, offer_id, message}
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Create table if not exists
        create_offer_table()
        
        # Validate required fields
        required_fields = ['jd_id', 'shortlist_id', 'candidate_id', 'recruiter_id', 
                          'position_title', 'employment_type', 'salary_amount']
        for field in required_fields:
            if field not in offer_data or not offer_data[field]:
                return {'success': False, 'error': f'Missing required field: {field}'}
        
        # Check if candidate already has an active offer for this JD
        cur.execute("""
            SELECT offer_id FROM job_offers
            WHERE jd_id = %s AND candidate_id = %s 
            AND status IN ('draft', 'sent', 'viewed', 'negotiating')
        """, (offer_data['jd_id'], offer_data['candidate_id']))
        
        existing_offer = cur.fetchone()
        if existing_offer:
            return {'success': False, 'error': 'Candidate already has an active offer for this position'}
        
        # Generate offer ID
        offer_id = generate_offer_id()
        
        # Convert benefits to JSON string if it's a dict
        benefits = offer_data.get('benefits', {})
        if isinstance(benefits, dict):
            benefits = json.dumps(benefits)
        
        # Insert offer
        cur.execute("""
            INSERT INTO job_offers (
                offer_id, jd_id, shortlist_id, candidate_id, recruiter_id,
                position_title, department, employment_type, start_date,
                salary_amount, salary_currency, salary_period,
                bonus_amount, equity_percentage, benefits,
                contract_duration_months, probation_period_months,
                notice_period_days, work_location, remote_work_policy,
                response_deadline, notes, created_by
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
        """, (
            offer_id, offer_data['jd_id'], offer_data['shortlist_id'], 
            offer_data['candidate_id'], offer_data['recruiter_id'],
            offer_data['position_title'], offer_data.get('department'),
            offer_data['employment_type'], offer_data.get('start_date'),
            offer_data['salary_amount'], offer_data.get('salary_currency', 'AED'),
            offer_data.get('salary_period', 'annual'),
            offer_data.get('bonus_amount'), offer_data.get('equity_percentage'),
            benefits,
            offer_data.get('contract_duration_months'), 
            offer_data.get('probation_period_months', 3),
            offer_data.get('notice_period_days', 30),
            offer_data.get('work_location'), offer_data.get('remote_work_policy'),
            offer_data.get('response_deadline'), offer_data.get('notes'),
            offer_data['recruiter_id']
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Offer created: {offer_id}")
        return {'success': True, 'offer_id': offer_id, 'message': 'Offer created successfully'}
        
    except Exception as e:
        logger.error(f"Error creating offer: {e}")
        return {'success': False, 'error': str(e)}

def get_offers_by_jd(jd_id):
    """Get all offers for a job description"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        create_offer_table()
        
        cur.execute("""
            SELECT * FROM job_offers
            WHERE jd_id = %s
            ORDER BY created_at DESC
        """, (jd_id,))
        
        offers = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {'success': True, 'offers': [dict(offer) for offer in offers]}
        
    except Exception as e:
        logger.error(f"Error getting offers: {e}")
        return {'success': False, 'error': str(e)}

def get_offer_details(offer_id):
    """Get detailed information about an offer"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("SELECT * FROM job_offers WHERE offer_id = %s", (offer_id,))
        offer = cur.fetchone()
        
        if not offer:
            return {'success': False, 'error': 'Offer not found'}
        
        cur.close()
        conn.close()
        
        return {'success': True, 'offer': dict(offer)}
        
    except Exception as e:
        logger.error(f"Error getting offer details: {e}")
        return {'success': False, 'error': str(e)}

def update_offer(offer_id, updates):
    """Update offer details"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if offer exists and is editable
        cur.execute("SELECT status FROM job_offers WHERE offer_id = %s", (offer_id,))
        result = cur.fetchone()
        
        if not result:
            return {'success': False, 'error': 'Offer not found'}
        
        status = result[0]
        if status not in ['draft', 'negotiating']:
            return {'success': False, 'error': 'Cannot edit offer in current status'}
        
        # Build update query dynamically
        allowed_fields = [
            'position_title', 'department', 'employment_type', 'start_date',
            'salary_amount', 'salary_currency', 'salary_period',
            'bonus_amount', 'equity_percentage', 'benefits',
            'contract_duration_months', 'probation_period_months',
            'notice_period_days', 'work_location', 'remote_work_policy',
            'response_deadline', 'notes'
        ]
        
        update_fields = []
        update_values = []
        
        for field in allowed_fields:
            if field in updates:
                update_fields.append(f"{field} = %s")
                value = updates[field]
                if field == 'benefits' and isinstance(value, dict):
                    value = json.dumps(value)
                update_values.append(value)
        
        if not update_fields:
            return {'success': False, 'error': 'No valid fields to update'}
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        update_values.append(offer_id)
        
        query = f"UPDATE job_offers SET {', '.join(update_fields)} WHERE offer_id = %s"
        cur.execute(query, update_values)
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Offer updated: {offer_id}")
        return {'success': True, 'message': 'Offer updated successfully'}
        
    except Exception as e:
        logger.error(f"Error updating offer: {e}")
        return {'success': False, 'error': str(e)}

def send_offer(offer_id, send_method='email', message=''):
    """Send offer to candidate"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if offer exists and is in draft status
        cur.execute("SELECT status FROM job_offers WHERE offer_id = %s", (offer_id,))
        result = cur.fetchone()
        
        if not result:
            return {'success': False, 'error': 'Offer not found'}
        
        if result[0] != 'draft':
            return {'success': False, 'error': 'Offer has already been sent'}
        
        # Calculate expiry date (7 days from now if not set)
        expiry_date = datetime.now() + timedelta(days=7)
        
        # Update offer status
        cur.execute("""
            UPDATE job_offers
            SET status = 'sent',
                offer_date = CURRENT_TIMESTAMP,
                expiry_date = COALESCE(expiry_date, %s),
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = %s
        """, (expiry_date, offer_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Offer sent: {offer_id}")
        return {'success': True, 'message': 'Offer sent successfully'}
        
    except Exception as e:
        logger.error(f"Error sending offer: {e}")
        return {'success': False, 'error': str(e)}

def withdraw_offer(offer_id, reason=''):
    """Withdraw an offer"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE job_offers
            SET status = 'withdrawn',
                notes = COALESCE(notes, '') || %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = %s AND status IN ('draft', 'sent', 'viewed')
        """, (f"\n\nWithdrawn: {reason}", offer_id))
        
        if cur.rowcount == 0:
            return {'success': False, 'error': 'Offer not found or cannot be withdrawn'}
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Offer withdrawn: {offer_id}")
        return {'success': True, 'message': 'Offer withdrawn successfully'}
        
    except Exception as e:
        logger.error(f"Error withdrawing offer: {e}")
        return {'success': False, 'error': str(e)}

def record_candidate_response(offer_id, response, notes=''):
    """Record candidate's response to offer"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        valid_responses = ['accepted', 'rejected', 'negotiating']
        if response not in valid_responses:
            return {'success': False, 'error': f'Invalid response. Must be one of: {valid_responses}'}
        
        # Determine new status based on response
        new_status = response
        negotiation_status = 'in_progress' if response == 'negotiating' else 'none'
        
        cur.execute("""
            UPDATE job_offers
            SET candidate_response = %s,
                response_date = CURRENT_TIMESTAMP,
                response_notes = %s,
                status = %s,
                negotiation_status = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = %s AND status IN ('sent', 'viewed')
        """, (response, notes, new_status, negotiation_status, offer_id))
        
        if cur.rowcount == 0:
            return {'success': False, 'error': 'Offer not found or not in valid state for response'}
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Candidate response recorded for offer: {offer_id} - {response}")
        return {'success': True, 'message': 'Response recorded successfully'}
        
    except Exception as e:
        logger.error(f"Error recording response: {e}")
        return {'success': False, 'error': str(e)}

def start_negotiation(offer_id, notes=''):
    """Start negotiation process"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE job_offers
            SET negotiation_status = 'in_progress',
                negotiation_rounds = negotiation_rounds + 1,
                negotiation_notes = COALESCE(negotiation_notes, '') || %s,
                status = 'negotiating',
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = %s
        """, (f"\n\nRound {datetime.now()}: {notes}", offer_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Negotiation started for offer: {offer_id}")
        return {'success': True, 'message': 'Negotiation started'}
        
    except Exception as e:
        logger.error(f"Error starting negotiation: {e}")
        return {'success': False, 'error': str(e)}

def approve_offer(offer_id, approved_by, notes=''):
    """Approve an offer"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE job_offers
            SET approval_status = 'approved',
                approved_by = %s,
                approval_date = CURRENT_TIMESTAMP,
                approval_notes = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = %s
        """, (approved_by, notes, offer_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Offer approved: {offer_id} by {approved_by}")
        return {'success': True, 'message': 'Offer approved successfully'}
        
    except Exception as e:
        logger.error(f"Error approving offer: {e}")
        return {'success': False, 'error': str(e)}

def get_offer_statistics(jd_id):
    """Get statistics for offers"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        create_offer_table()
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_offers,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
                COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'negotiating' THEN 1 END) as negotiating,
                COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn,
                COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
                AVG(EXTRACT(EPOCH FROM (response_date - offer_date))/86400) as avg_response_days,
                ROUND(COUNT(CASE WHEN status = 'accepted' THEN 1 END)::numeric / 
                      NULLIF(COUNT(CASE WHEN status IN ('accepted', 'rejected') THEN 1 END), 0) * 100, 2) as acceptance_rate
            FROM job_offers
            WHERE jd_id = %s
        """, (jd_id,))
        
        stats = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {'success': True, 'stats': dict(stats) if stats else {}}
        
    except Exception as e:
        logger.error(f"Error getting offer statistics: {e}")
        return {'success': False, 'error': str(e)}

