"""
Reports Engine for Recruiter Dashboard
Generates various reports for recruitment activities
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from backend.db import get_db_connection
import csv
import io
import json



def generate_recruitment_pipeline_report(
    recruiter_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Generate recruitment pipeline report
    
    Args:
        recruiter_id: Optional recruiter ID filter
        start_date: Start date for report (YYYY-MM-DD)
        end_date: End date for report (YYYY-MM-DD)
        
    Returns:
        List of pipeline records
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Build WHERE clause
        where_clauses = []
        params = {}
        
        if recruiter_id:
            where_clauses.append("jp.recruiter_id::text = %(recruiter_id)s")
            params['recruiter_id'] = recruiter_id

        if start_date:
            where_clauses.append("jp.created_at >= %(start_date)s")
            params['start_date'] = start_date

        if end_date:
            where_clauses.append("jp.created_at <= %(end_date)s")
            params['end_date'] = end_date

        where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Aligned to live schema: job_postings is the hub that job_shortlists,
        # interview_schedules and offers all reference via *_id keys. job_shortlists
        # has no status column, so every shortlist row counts as shortlisted.
        query = f"""
            SELECT
                jp.title as job_title,
                COALESCE(co.name, co.company_name) as company_name,
                jp.location,
                COUNT(DISTINCT s.candidate_id) as total_candidates,
                COUNT(DISTINCT s.candidate_id) as shortlisted,
                COUNT(DISTINCT i.id) as interviews_conducted,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending') as offers_pending,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'accepted') as offers_accepted,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'rejected') as offers_rejected,
                jp.created_at as job_posted_date,
                jp.status as job_status
            FROM job_postings jp
            LEFT JOIN job_shortlists s ON jp.id::text = s.job_posting_id::text
            LEFT JOIN interview_schedules i ON jp.id::text = i.job_posting_id::text
            LEFT JOIN offers o ON jp.id::text = o.job_posting_id::text
            LEFT JOIN companies co ON jp.company_id::text = co.id::text
            {where_clause}
            GROUP BY jp.id, jp.title, co.name, co.company_name, jp.location, jp.created_at, jp.status
            ORDER BY jp.created_at DESC
        """
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        return [dict(row) for row in results]
        
    finally:
        cursor.close()
        conn.close()

def generate_candidate_status_report(
    recruiter_id: Optional[str] = None,
    jd_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Generate candidate status report
    
    Args:
        recruiter_id: Optional recruiter ID filter
        jd_id: Optional job description ID filter
        status: Optional status filter
        
    Returns:
        List of candidate records with status
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        where_clauses = []
        params = {}
        
        if recruiter_id:
            where_clauses.append("jp.recruiter_id::text = %(recruiter_id)s")
            params['recruiter_id'] = recruiter_id

        if jd_id:
            # Callers pass a job identifier; job_shortlists keys on job_posting_id.
            where_clauses.append("s.job_posting_id::text = %(jd_id)s")
            params['jd_id'] = jd_id

        if status:
            # job_shortlists has no status; the only lifecycle status is on the offer.
            where_clauses.append("o.status = %(status)s")
            params['status'] = status

        where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Aligned to live schema: candidates come from users; job_shortlists keys on
        # job_posting_id (no status/match_score/updated_at columns exist).
        query = f"""
            SELECT
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                jp.title as job_title,
                COALESCE(co.name, co.company_name) as company_name,
                s.notes,
                s.created_at as application_date,
                COUNT(i.id) as interviews_count,
                MAX(i.scheduled_time) as last_interview_date,
                o.status as offer_status,
                o.created_at as offer_date
            FROM job_shortlists s
            JOIN users c ON s.candidate_id::text = c.id::text
            JOIN job_postings jp ON s.job_posting_id::text = jp.id::text
            LEFT JOIN companies co ON jp.company_id::text = co.id::text
            LEFT JOIN interview_schedules i ON s.candidate_id::text = i.candidate_id::text AND s.job_posting_id::text = i.job_posting_id::text
            LEFT JOIN offers o ON s.candidate_id::text = o.candidate_id::text AND s.job_posting_id::text = o.job_posting_id::text
            {where_clause}
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone,
                     jp.title, co.name, co.company_name, s.notes,
                     s.created_at, o.status, o.created_at
            ORDER BY s.created_at DESC
        """
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        return [dict(row) for row in results]
        
    finally:
        cursor.close()
        conn.close()

def generate_interview_feedback_report(
    recruiter_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Generate interview feedback report
    
    Args:
        recruiter_id: Optional recruiter ID filter
        start_date: Start date for report
        end_date: End date for report
        
    Returns:
        List of interview records with feedback
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        where_clauses = []
        params = {}
        
        if recruiter_id:
            where_clauses.append("i.recruiter_id = %(recruiter_id)s")
            params['recruiter_id'] = recruiter_id
            
        if start_date:
            where_clauses.append("i.scheduled_time >= %(start_date)s")
            params['start_date'] = start_date
            
        if end_date:
            where_clauses.append("i.scheduled_time <= %(end_date)s")
            params['end_date'] = end_date
            
        where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = f"""
            SELECT
                c.first_name,
                c.last_name,
                c.email,
                jp.title as job_title,
                COALESCE(co.name, co.company_name) as company_name,
                i.interview_type,
                i.scheduled_time,
                i.status,
                i.feedback,
                i.rating,
                i.recommendation,
                i.created_at as interview_created,
                i.updated_at as last_updated
            FROM interview_schedules i
            JOIN users c ON i.candidate_id::text = c.id::text
            LEFT JOIN job_postings jp ON i.job_posting_id::text = jp.id::text
            LEFT JOIN companies co ON jp.company_id::text = co.id::text
            {where_clause}
            ORDER BY i.scheduled_time DESC
        """
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        return [dict(row) for row in results]
        
    finally:
        cursor.close()
        conn.close()

def generate_offer_statistics_report(
    recruiter_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate offer statistics report
    
    Args:
        recruiter_id: Optional recruiter ID filter
        start_date: Start date for report
        end_date: End date for report
        
    Returns:
        Dictionary with offer statistics
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        where_clauses = []
        params = {}
        
        if recruiter_id:
            where_clauses.append("o.recruiter_id = %(recruiter_id)s")
            params['recruiter_id'] = recruiter_id
            
        if start_date:
            where_clauses.append("o.created_at >= %(start_date)s")
            params['start_date'] = start_date
            
        if end_date:
            where_clauses.append("o.created_at <= %(end_date)s")
            params['end_date'] = end_date
            
        where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Summary statistics
        # Aligned to live schema: salary lives in offers.offer_data (jsonb); the
        # live status timestamps are accepted_at / declined_at.
        cursor.execute(f"""
            SELECT
                COUNT(*) as total_offers,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_offers,
                COUNT(*) FILTER (WHERE status = 'accepted') as accepted_offers,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected_offers,
                AVG(NULLIF(offer_data->>'base_salary', '')::numeric) as avg_base_salary,
                AVG(NULLIF(offer_data->>'total_compensation', '')::numeric) as avg_total_compensation,
                AVG(EXTRACT(DAY FROM (accepted_at - created_at))) FILTER (WHERE status = 'accepted') as avg_days_to_accept
            FROM offers o
            {where_clause}
        """, params)

        summary = dict(cursor.fetchone())

        # Detailed offer list
        cursor.execute(f"""
            SELECT
                c.first_name,
                c.last_name,
                c.email,
                jp.title as job_title,
                COALESCE(co.name, co.company_name) as company_name,
                NULLIF(o.offer_data->>'base_salary', '')::numeric as base_salary,
                NULLIF(o.offer_data->>'total_compensation', '')::numeric as total_compensation,
                o.status,
                o.created_at as offer_date,
                o.accepted_at as accepted_date,
                o.declined_at as rejected_date,
                o.offer_data->>'rejection_reason' as rejection_reason
            FROM offers o
            JOIN users c ON o.candidate_id::text = c.id::text
            LEFT JOIN job_postings jp ON o.job_posting_id::text = jp.id::text
            LEFT JOIN companies co ON jp.company_id::text = co.id::text
            {where_clause}
            ORDER BY o.created_at DESC
        """, params)
        
        offers = [dict(row) for row in cursor.fetchall()]
        
        return {
            'summary': summary,
            'offers': offers
        }
        
    finally:
        cursor.close()
        conn.close()

def generate_performance_metrics_report(
    recruiter_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate performance metrics report
    
    Args:
        recruiter_id: Optional recruiter ID filter
        start_date: Start date for report
        end_date: End date for report
        
    Returns:
        Dictionary with performance metrics
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        where_clauses = []
        params = {}
        
        if recruiter_id:
            where_clauses.append("recruiter_id = %(recruiter_id)s")
            params['recruiter_id'] = recruiter_id
            
        if start_date:
            where_clauses.append("created_at >= %(start_date)s")
            params['start_date'] = start_date
            
        if end_date:
            where_clauses.append("created_at <= %(end_date)s")
            params['end_date'] = end_date
            
        where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Calculate various metrics
        metrics = {}
        
        # Total placements
        cursor.execute(f"""
            SELECT COUNT(*) as total_placements
            FROM offers
            {where_clause}
            {'AND' if where_clause else 'WHERE'} status = 'accepted'
        """, params)
        metrics['total_placements'] = cursor.fetchone()['total_placements']

        # Active searches (job_postings carries recruiter_id + status in the live schema)
        cursor.execute(f"""
            SELECT COUNT(*) as active_searches
            FROM job_postings
            {where_clause}
            {'AND' if where_clause else 'WHERE'} status = 'active'
        """, params)
        metrics['active_searches'] = cursor.fetchone()['active_searches']

        # Average time to fill
        cursor.execute(f"""
            SELECT AVG(EXTRACT(DAY FROM (o.accepted_at - s.created_at))) as avg_time_to_fill
            FROM offers o
            JOIN job_shortlists s ON o.candidate_id::text = s.candidate_id::text AND o.job_posting_id::text = s.job_posting_id::text
            {where_clause.replace('recruiter_id = ', 'o.recruiter_id = ').replace('created_at ', 'o.created_at ')}
            {'AND' if where_clause else 'WHERE'} o.status = 'accepted'
        """, params)
        avg_time = cursor.fetchone()['avg_time_to_fill']
        metrics['avg_time_to_fill_days'] = int(avg_time) if avg_time else 0

        # Offer acceptance rate
        cursor.execute(f"""
            SELECT
                COUNT(*) as total_offers,
                COUNT(*) FILTER (WHERE status = 'accepted') as accepted_offers
            FROM offers
            {where_clause}
        """, params)
        offer_data = cursor.fetchone()
        total = offer_data['total_offers']
        accepted = offer_data['accepted_offers']
        metrics['offer_acceptance_rate'] = round((accepted / total * 100), 1) if total > 0 else 0

        # Interview to hire ratio
        cursor.execute(f"""
            SELECT
                (SELECT COUNT(*) FROM interview_schedules {where_clause}) as total_interviews,
                (SELECT COUNT(*) FROM offers {where_clause} {'AND' if where_clause else 'WHERE'} status = 'accepted') as total_hires
        """, params)
        interview_data = cursor.fetchone()
        interviews = interview_data['total_interviews']
        hires = interview_data['total_hires']
        metrics['interview_to_hire_ratio'] = round((interviews / hires), 1) if hires > 0 else 0
        
        return metrics
        
    finally:
        cursor.close()
        conn.close()

def export_to_csv(data: List[Dict[str, Any]]) -> str:
    """
    Convert data to CSV format
    
    Args:
        data: List of dictionaries to export
        
    Returns:
        CSV string
    """
    if not data:
        return ""
        
    output = io.StringIO()
    
    # Get headers from first row
    headers = list(data[0].keys())
    
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    
    for row in data:
        # Convert datetime objects to strings
        formatted_row = {}
        for key, value in row.items():
            if isinstance(value, datetime):
                formatted_row[key] = value.isoformat()
            else:
                formatted_row[key] = value
        writer.writerow(formatted_row)
    
    return output.getvalue()

def export_to_json(data: Any) -> str:
    """
    Convert data to JSON format
    
    Args:
        data: Data to export (list or dict)
        
    Returns:
        JSON string
    """
    def json_serial(obj):
        """JSON serializer for objects not serializable by default"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")
    
    return json.dumps(data, indent=2, default=json_serial)

