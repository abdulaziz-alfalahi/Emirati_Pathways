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
            where_clauses.append("s.recruiter_id = %(recruiter_id)s")
            params['recruiter_id'] = recruiter_id
            
        if start_date:
            where_clauses.append("s.created_at >= %(start_date)s")
            params['start_date'] = start_date
            
        if end_date:
            where_clauses.append("s.created_at <= %(end_date)s")
            params['end_date'] = end_date
            
        where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = f"""
            SELECT 
                jd.title as job_title,
                jd.company_name,
                jd.location,
                COUNT(DISTINCT s.candidate_id) as total_candidates,
                COUNT(DISTINCT s.candidate_id) FILTER (WHERE s.status = 'shortlisted') as shortlisted,
                COUNT(DISTINCT i.id) as interviews_conducted,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending') as offers_pending,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'accepted') as offers_accepted,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'rejected') as offers_rejected,
                jd.created_at as job_posted_date,
                jd.status as job_status
            FROM job_descriptions jd
            LEFT JOIN shortlist s ON jd.id = s.jd_id
            LEFT JOIN interviews i ON jd.id = i.jd_id
            LEFT JOIN job_offers o ON jd.id = o.jd_id
            {where_clause}
            GROUP BY jd.id, jd.title, jd.company_name, jd.location, jd.created_at, jd.status
            ORDER BY jd.created_at DESC
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
            where_clauses.append("s.recruiter_id = %(recruiter_id)s")
            params['recruiter_id'] = recruiter_id
            
        if jd_id:
            where_clauses.append("s.jd_id = %(jd_id)s")
            params['jd_id'] = jd_id
            
        if status:
            where_clauses.append("s.status = %(status)s")
            params['status'] = status
            
        where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = f"""
            SELECT 
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                jd.title as job_title,
                jd.company_name,
                s.status,
                s.match_score,
                s.created_at as application_date,
                s.updated_at as last_updated,
                COUNT(i.id) as interviews_count,
                MAX(i.scheduled_time) as last_interview_date,
                o.status as offer_status,
                o.created_at as offer_date
            FROM shortlist s
            JOIN candidates c ON s.candidate_id = c.id
            JOIN job_descriptions jd ON s.jd_id = jd.id
            LEFT JOIN interviews i ON s.candidate_id = i.candidate_id AND s.jd_id = i.jd_id
            LEFT JOIN job_offers o ON s.candidate_id = o.candidate_id AND s.jd_id = o.jd_id
            {where_clause}
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, 
                     jd.title, jd.company_name, s.status, s.match_score, 
                     s.created_at, s.updated_at, o.status, o.created_at
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
                jd.title as job_title,
                jd.company_name,
                i.interview_type,
                i.scheduled_time,
                i.status,
                i.feedback,
                i.rating,
                i.recommendation,
                i.created_at as interview_created,
                i.updated_at as last_updated
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN job_descriptions jd ON i.jd_id = jd.id
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
        cursor.execute(f"""
            SELECT 
                COUNT(*) as total_offers,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_offers,
                COUNT(*) FILTER (WHERE status = 'accepted') as accepted_offers,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected_offers,
                AVG(base_salary) as avg_base_salary,
                AVG(total_compensation) as avg_total_compensation,
                AVG(EXTRACT(DAY FROM (accepted_date - created_at))) FILTER (WHERE status = 'accepted') as avg_days_to_accept
            FROM job_offers o
            {where_clause}
        """, params)
        
        summary = dict(cursor.fetchone())
        
        # Detailed offer list
        cursor.execute(f"""
            SELECT 
                c.first_name,
                c.last_name,
                c.email,
                jd.title as job_title,
                jd.company_name,
                o.base_salary,
                o.total_compensation,
                o.status,
                o.created_at as offer_date,
                o.accepted_date,
                o.rejected_date,
                o.rejection_reason
            FROM job_offers o
            JOIN candidates c ON o.candidate_id = c.id
            JOIN job_descriptions jd ON o.jd_id = jd.id
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
            FROM job_offers
            {where_clause}
            {'AND' if where_clause else 'WHERE'} status = 'accepted'
        """, params)
        metrics['total_placements'] = cursor.fetchone()['total_placements']
        
        # Active searches
        cursor.execute(f"""
            SELECT COUNT(*) as active_searches
            FROM job_descriptions
            {where_clause.replace('recruiter_id', 'created_by')}
            {'AND' if where_clause else 'WHERE'} status = 'active'
        """, params)
        metrics['active_searches'] = cursor.fetchone()['active_searches']
        
        # Average time to fill
        cursor.execute(f"""
            SELECT AVG(EXTRACT(DAY FROM (o.accepted_date - s.created_at))) as avg_time_to_fill
            FROM job_offers o
            JOIN shortlist s ON o.candidate_id = s.candidate_id AND o.jd_id = s.jd_id
            {where_clause.replace('recruiter_id', 'o.recruiter_id')}
            {'AND' if where_clause else 'WHERE'} o.status = 'accepted'
        """, params)
        avg_time = cursor.fetchone()['avg_time_to_fill']
        metrics['avg_time_to_fill_days'] = int(avg_time) if avg_time else 0
        
        # Offer acceptance rate
        cursor.execute(f"""
            SELECT 
                COUNT(*) as total_offers,
                COUNT(*) FILTER (WHERE status = 'accepted') as accepted_offers
            FROM job_offers
            {where_clause}
        """, params)
        offer_data = cursor.fetchone()
        total = offer_data['total_offers']
        accepted = offer_data['accepted_offers']
        metrics['offer_acceptance_rate'] = round((accepted / total * 100), 1) if total > 0 else 0
        
        # Interview to hire ratio
        cursor.execute(f"""
            SELECT 
                (SELECT COUNT(*) FROM interviews {where_clause}) as total_interviews,
                (SELECT COUNT(*) FROM job_offers {where_clause} {'AND' if where_clause else 'WHERE'} status = 'accepted') as total_hires
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

