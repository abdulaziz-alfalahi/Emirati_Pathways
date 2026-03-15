"""
Offer Management Engine
Handles business logic for job offer creation, tracking, and management
"""

import psycopg2
import psycopg2.extras
import json
import secrets
from datetime import datetime, timedelta
import logging
import requests
from backend.db import get_db_connection

logger = logging.getLogger(__name__)



def update_shortlist_status_from_offer(shortlist_id, status, notes=''):
    """
    Update shortlist status when offer status changes
    Helper function to maintain status synchronization
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update status
        update_fields = ["status = %s", "updated_at = CURRENT_TIMESTAMP"]
        params = [status]
        
        if notes:
            update_fields.append("notes = COALESCE(notes, '') || %s")
            params.append(f"\n{datetime.now().strftime('%Y-%m-%d %H:%M')}: {notes}")
        
        params.append(shortlist_id)
        
        cur.execute(f"""
            UPDATE candidate_shortlist 
            SET {', '.join(update_fields)}
            WHERE shortlist_id = %s
        """, params)
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Updated shortlist {shortlist_id} to status: {status}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating shortlist status: {e}")
        return False

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
            rejected_by VARCHAR(50),
            rejection_date TIMESTAMP,
            rejection_reason TEXT,
            
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
        
        # Convert negotiation_notes (text) to negotiation_history (array) for frontend compatibility
        offer_dict = dict(offer)
        if 'negotiation_notes' in offer_dict and offer_dict['negotiation_notes']:
            # Parse negotiation_notes text into structured array
            try:
                # Try to parse as JSON first (in case it's already JSON)
                negotiation_history = json.loads(offer_dict['negotiation_notes'])
            except (json.JSONDecodeError, TypeError):
                # If not JSON, create empty array (old text format)
                negotiation_history = []
            
            offer_dict['negotiation_history'] = negotiation_history
        else:
            offer_dict['negotiation_history'] = []
        
        cur.close()
        conn.close()
        
        return {'success': True, 'offer': offer_dict}
        
    except Exception as e:
        logger.error(f"Error getting offer details: {e}")
        return {'success': False, 'error': str(e)}

def update_offer(offer_id, updates):
    """Update offer details"""
    try:
        logger.info(f"update_offer called for {offer_id} with updates: {updates}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if offer exists and is editable
        cur.execute("SELECT status FROM job_offers WHERE offer_id = %s", (offer_id,))
        result = cur.fetchone()
        
        if not result:
            logger.error(f"Offer {offer_id} not found")
            return {'success': False, 'error': 'Offer not found'}
        
        status = result[0]
        logger.info(f"Current offer status: {status}")
        
        if status not in ['draft', 'negotiating']:
            logger.error(f"Cannot edit offer in status: {status}")
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
            logger.warning("No valid fields to update")
            return {'success': False, 'error': 'No valid fields to update'}
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        update_values.append(offer_id)
        
        query = f"UPDATE job_offers SET {', '.join(update_fields)} WHERE offer_id = %s"
        logger.info(f"Executing SQL: {query}")
        logger.info(f"With values: {update_values}")
        
        cur.execute(query, update_values)
        rows_affected = cur.rowcount
        logger.info(f"Rows affected: {rows_affected}")
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Offer {offer_id} updated successfully")
        
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
        
        # Check if offer exists and get shortlist_id
        cur.execute("SELECT status, shortlist_id FROM job_offers WHERE offer_id = %s", (offer_id,))
        result = cur.fetchone()
        
        if not result:
            return {'success': False, 'error': 'Offer not found'}
        
        if result[0] != 'draft':
            return {'success': False, 'error': 'Offer has already been sent'}
        
        shortlist_id = result[1]
        
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
        
        # Update shortlist status to 'offer_sent'
        if shortlist_id:
            update_shortlist_status_from_offer(
                shortlist_id, 
                'offer_sent', 
                f'Offer {offer_id} sent to candidate'
            )
        
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
        
        # Get shortlist_id, recruiter_id, and position_title before updating
        cur.execute("SELECT shortlist_id, recruiter_id, position_title FROM job_offers WHERE offer_id = %s", (offer_id,))
        result = cur.fetchone()
        shortlist_id = result[0] if result else None
        recruiter_id = result[1] if result else None
        position_title = result[2] if result else 'a position'
        
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
        
        # Update shortlist status based on response
        if shortlist_id:
            if response == 'accepted':
                update_shortlist_status_from_offer(
                    shortlist_id, 
                    'hired', 
                    f'Candidate accepted offer {offer_id}'
                )
            elif response == 'rejected':
                update_shortlist_status_from_offer(
                    shortlist_id, 
                    'rejected', 
                    f'Candidate rejected offer {offer_id}'
                )
        
        # Create notification for the recruiter
        if recruiter_id:
            try:
                notif_conn = get_db_connection()
                notif_cur = notif_conn.cursor()
                
                if response == 'accepted':
                    notif_title = 'Offer Accepted'
                    notif_content = f'Great news! The candidate has accepted your offer for {position_title}.'
                    notif_type = 'offer_accepted'
                elif response == 'rejected':
                    notif_title = 'Offer Declined'
                    notif_content = f'The candidate has declined your offer for {position_title}.'
                    notif_type = 'offer_declined'
                else:  # negotiating
                    notif_title = 'Offer Negotiation Started'
                    notif_content = f'The candidate wants to negotiate the offer for {position_title}.'
                    notif_type = 'offer_negotiation'
                
                notif_metadata = json.dumps({
                    'offer_id': offer_id,
                    'position_title': position_title,
                    'candidate_response': response,
                    'link': '/recruiter?tab=offers'
                })
                
                notif_cur.execute("""
                    INSERT INTO notifications (user_id, type, title, content, metadata)
                    VALUES (%s, %s, %s, %s, %s)
                """, (str(recruiter_id), notif_type, notif_title, notif_content, notif_metadata))
                
                notif_conn.commit()
                notif_cur.close()
                notif_conn.close()
                logger.info(f"Notification sent to recruiter {recruiter_id} for candidate response '{response}' on offer {offer_id}")
            except Exception as notif_err:
                logger.warning(f"Failed to create notification for recruiter {recruiter_id}: {notif_err}")
        
        # Sync candidate response status to the `offers` and `offer_approval_requests` tables
        # These are the tables queried by the recruiter dashboard
        try:
            sync_conn = get_db_connection()
            sync_cur = sync_conn.cursor()
            
            # Map candidate response to dashboard-friendly status
            dashboard_status = response  # 'accepted', 'rejected', 'negotiating'
            if response == 'rejected':
                dashboard_status = 'declined'
            
            # Update offers table (used by recruiter dashboard fallback)
            # Match by candidate_id and current 'sent' status
            sync_cur.execute("""
                UPDATE offers 
                SET status = %s, updated_at = NOW()
                WHERE candidate_id = %s AND status = 'sent'
            """, (dashboard_status, result[3] if result and len(result) > 3 else None))
            
            # Also try matching by candidate_id from the job_offers record
            if result:
                # Get candidate_id from job_offers table
                sync_cur.execute("SELECT candidate_id FROM job_offers WHERE offer_id = %s", (offer_id,))
                jf_row = sync_cur.fetchone()
                if jf_row:
                    candidate_id_val = jf_row[0]
                    sync_cur.execute("""
                        UPDATE offers 
                        SET status = %s, updated_at = NOW()
                        WHERE candidate_id::text = %s AND status = 'sent'
                    """, (dashboard_status, str(candidate_id_val)))
                    
                    # Also update offer_approval_requests (primary table for dashboard)
                    sync_cur.execute("""
                        UPDATE offer_approval_requests
                        SET status = %s, updated_at = NOW()
                        WHERE candidate_id::text = %s AND status = 'approved'
                    """, (dashboard_status, str(candidate_id_val)))
                    
                    rows_updated = sync_cur.rowcount
                    logger.info(f"Synced candidate response '{response}' to dashboard tables for candidate {candidate_id_val} (approval_requests updated: {rows_updated})")
            
            sync_conn.commit()
            sync_cur.close()
            sync_conn.close()
        except Exception as sync_err:
            logger.warning(f"Failed to sync candidate response to dashboard tables: {sync_err}")
        
        logger.info(f"Candidate response recorded for offer: {offer_id} - {response}")
        return {'success': True, 'message': 'Response recorded successfully'}
        
    except Exception as e:
        logger.error(f"Error recording response: {e}")
        return {'success': False, 'error': str(e)}

def get_offer_statistics(jd_id):
    """
    Get offer statistics for a job description
    
    Returns:
        - Total offers by status
        - Acceptance rate
        - Average salary
        - Time-to-accept metrics
        - Negotiation statistics
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get offer counts by status
        cur.execute("""
            SELECT 
                COUNT(*) as total_offers,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
                COUNT(CASE WHEN status = 'viewed' THEN 1 END) as viewed,
                COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'negotiating' THEN 1 END) as negotiating,
                COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn,
                COUNT(CASE WHEN status IN ('sent', 'viewed', 'negotiating') THEN 1 END) as pending,
                AVG(CASE WHEN salary_amount IS NOT NULL THEN salary_amount END) as avg_salary,
                MIN(salary_amount) as min_salary,
                MAX(salary_amount) as max_salary
            FROM job_offers
            WHERE jd_id = %s
        """, (jd_id,))
        
        stats = cur.fetchone()
        
        # Calculate acceptance rate
        total_sent = stats['sent'] + stats['viewed'] + stats['accepted'] + stats['rejected'] + stats['negotiating']
        acceptance_rate = (stats['accepted'] / total_sent * 100) if total_sent > 0 else 0
        
        # Get time-to-accept metrics
        cur.execute("""
            SELECT 
                AVG(EXTRACT(EPOCH FROM (response_date - offer_date)) / 86400) as avg_days_to_respond,
                MIN(EXTRACT(EPOCH FROM (response_date - offer_date)) / 86400) as min_days_to_respond,
                MAX(EXTRACT(EPOCH FROM (response_date - offer_date)) / 86400) as max_days_to_respond
            FROM job_offers
            WHERE jd_id = %s 
                AND offer_date IS NOT NULL 
                AND response_date IS NOT NULL
                AND status = 'accepted'
        """, (jd_id,))
        
        time_metrics = cur.fetchone()
        
        # Get negotiation statistics
        cur.execute("""
            SELECT 
                COUNT(*) as total_negotiations,
                AVG(negotiation_rounds) as avg_negotiation_rounds
            FROM job_offers
            WHERE jd_id = %s 
                AND negotiation_status = 'in_progress'
        """, (jd_id,))
        
        negotiation_stats = cur.fetchone()
        
        # Get expiring offers (within 3 days)
        cur.execute("""
            SELECT COUNT(*) as expiring_soon
            FROM job_offers
            WHERE jd_id = %s 
                AND status IN ('sent', 'viewed', 'negotiating')
                AND expiry_date IS NOT NULL
                AND expiry_date <= CURRENT_TIMESTAMP + INTERVAL '3 days'
                AND expiry_date > CURRENT_TIMESTAMP
        """, (jd_id,))
        
        expiring = cur.fetchone()
        
        cur.close()
        conn.close()
        
        # Build response
        result = {
            'success': True,
            'statistics': {
                'total_offers': stats['total_offers'] or 0,
                'by_status': {
                    'draft': stats['draft'] or 0,
                    'sent': stats['sent'] or 0,
                    'viewed': stats['viewed'] or 0,
                    'accepted': stats['accepted'] or 0,
                    'rejected': stats['rejected'] or 0,
                    'negotiating': stats['negotiating'] or 0,
                    'withdrawn': stats['withdrawn'] or 0,
                    'pending': stats['pending'] or 0
                },
                'acceptance_rate': round(acceptance_rate, 1),
                'salary': {
                    'average': float(stats['avg_salary']) if stats['avg_salary'] else 0,
                    'min': float(stats['min_salary']) if stats['min_salary'] else 0,
                    'max': float(stats['max_salary']) if stats['max_salary'] else 0,
                    'currency': 'AED'
                },
                'time_metrics': {
                    'avg_days_to_respond': round(float(time_metrics['avg_days_to_respond']), 1) if time_metrics['avg_days_to_respond'] else 0,
                    'min_days_to_respond': round(float(time_metrics['min_days_to_respond']), 1) if time_metrics['min_days_to_respond'] else 0,
                    'max_days_to_respond': round(float(time_metrics['max_days_to_respond']), 1) if time_metrics['max_days_to_respond'] else 0
                },
                'negotiations': {
                    'total': negotiation_stats['total_negotiations'] or 0,
                    'avg_rounds': round(float(negotiation_stats['avg_negotiation_rounds']), 1) if negotiation_stats['avg_negotiation_rounds'] else 0
                },
                'expiring_soon': expiring['expiring_soon'] or 0
            }
        }
        
        logger.info(f"Retrieved offer statistics for JD: {jd_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error getting offer statistics: {e}")
        return {'success': False, 'error': str(e)}

def start_negotiation(offer_id, negotiation_data):
    """Start negotiation process and add negotiation entry"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get current negotiation_notes
        cur.execute("SELECT negotiation_notes FROM job_offers WHERE offer_id = %s", (offer_id,))
        result = cur.fetchone()
        
        if not result:
            return {'success': False, 'error': 'Offer not found'}
        
        current_notes = result[0]
        
        # Parse existing negotiation history or create new array
        try:
            if current_notes:
                negotiation_history = json.loads(current_notes)
            else:
                negotiation_history = []
        except (json.JSONDecodeError, TypeError):
            # Old text format, start fresh with array
            negotiation_history = []
        
        # Add new negotiation entry
        new_entry = {
            'party': negotiation_data.get('party', 'recruiter'),
            'timestamp': datetime.now().isoformat(),
        }
        
        if 'proposed_salary' in negotiation_data:
            new_entry['proposed_salary'] = negotiation_data['proposed_salary']
        
        if 'proposed_benefits' in negotiation_data:
            new_entry['proposed_benefits'] = negotiation_data['proposed_benefits']
        
        if 'notes' in negotiation_data:
            new_entry['notes'] = negotiation_data['notes']
        
        negotiation_history.append(new_entry)
        
        # Save as JSON string
        negotiation_json = json.dumps(negotiation_history)
        
        cur.execute("""
            UPDATE job_offers
            SET negotiation_status = 'in_progress',
                negotiation_rounds = negotiation_rounds + 1,
                negotiation_notes = %s,
                status = 'negotiating',
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = %s
        """, (negotiation_json, offer_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Negotiation entry added for offer: {offer_id}")
        return {'success': True, 'message': 'Negotiation entry added successfully'}
        
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
            SET status = 'approved',
                approved_by = %s,
                approval_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = %s
        """, (approved_by, offer_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Offer approved: {offer_id} by {approved_by}")
        return {'success': True, 'message': 'Offer approved successfully'}
        
    except Exception as e:
        logger.error(f"Error approving offer: {e}")
        return {'success': False, 'error': str(e)}

def reject_offer(offer_id, rejected_by, rejection_reason=''):
    """Reject an offer"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE job_offers
            SET approval_status = 'rejected',
                status = 'rejected',
                rejected_by = %s,
                rejection_date = CURRENT_TIMESTAMP,
                rejection_reason = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = %s
        """, (rejected_by, rejection_reason, offer_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Offer rejected: {offer_id} by {rejected_by}")
        return {'success': True, 'message': 'Offer rejected successfully'}
        
    except Exception as e:
        logger.error(f"Error rejecting offer: {e}")
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

