"""
Statistics Engine for Recruiter Dashboard
Provides real-time statistics and metrics for recruiter performance and pipeline
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from backend.db import get_db_connection



def get_dashboard_statistics(recruiter_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get comprehensive dashboard statistics
    
    Args:
        recruiter_id: Optional recruiter ID to filter statistics
        
    Returns:
        Dictionary containing all dashboard metrics
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get current date ranges
        now = datetime.now()
        start_of_month = datetime(now.year, now.month, 1)
        start_of_quarter = datetime(now.year, ((now.month - 1) // 3) * 3 + 1, 1)
        start_of_year = datetime(now.year, 1, 1)
        
        # Build WHERE clause for recruiter filter
        recruiter_filter = ""
        recruiter_and = "WHERE"
        params = {}
        if recruiter_id:
            recruiter_filter = "recruiter_id::text = %(recruiter_id)s AND"
            params['recruiter_id'] = recruiter_id
        
        # 1. Placements Statistics
        cursor.execute(f"""
            SELECT 
                COUNT(*) FILTER (WHERE created_at >= %(start_of_month)s) as this_month,
                COUNT(*) FILTER (WHERE created_at >= %(start_of_quarter)s) as this_quarter,
                COUNT(*) FILTER (WHERE created_at >= %(start_of_year)s) as this_year
            FROM offers
            WHERE {recruiter_filter} status = 'accepted'
        """, {**params, 
              'start_of_month': start_of_month,
              'start_of_quarter': start_of_quarter,
              'start_of_year': start_of_year})
        
        placements = cursor.fetchone()
        
        # 2. Pipeline Statistics  
        cursor.execute(f"""
            SELECT 
                (SELECT COUNT(*) FROM job_postings WHERE {recruiter_filter} status = 'active') as active_searches,
                (SELECT COUNT(*) FROM job_shortlists {('WHERE ' + recruiter_filter.replace('recruiter_id::text', 'added_by::text').replace(' AND', '')) if recruiter_filter else ''}) as candidates_in_process,
                0 as interviews_scheduled,
                (SELECT COUNT(*) FROM offers WHERE {recruiter_filter} status = 'pending') as offers_extended
        """, params)
        
        pipeline = cursor.fetchone()
        
        # 3. Performance Metrics
        # Placement Rate: (hired candidates / total candidates) * 100
        # Placement Rate: job_shortlists doesn't have status column, use count of shortlisted candidates
        cursor.execute(f"""
            SELECT 
                COUNT(*) as total
            FROM job_shortlists
            {('WHERE ' + recruiter_filter.replace('recruiter_id::text', 'added_by::text').replace(' AND', '')) if recruiter_filter else ''}
        """, params)

        placement_data = cursor.fetchone()
        # Placeholder calculation - would need offers.status='accepted' count / shortlist count
        placement_rate = 0  # TODO: Calculate from offers table
        
        # Average Time to Fill: avg(hire_date - application_date)
        cursor.execute(f"""
            SELECT 
                AVG(EXTRACT(DAY FROM (o.created_at - s.created_at))) as avg_days
            FROM offers o
            JOIN job_shortlists s ON o.candidate_id::text = s.candidate_id::text AND o.job_posting_id::text = s.job_posting_id::text
            JOIN job_postings jd ON o.job_posting_id::text = jd.id::text
            WHERE {recruiter_filter.replace('recruiter_id::text', 'o.recruiter_id::text')} o.status = 'accepted'
        """, params)
        
        time_to_fill_data = cursor.fetchone()
        # Null when there's no data rather than a fabricated 21-day default. (#26)
        avg_time_to_fill = int(time_to_fill_data['avg_days']) if time_to_fill_data and time_to_fill_data['avg_days'] is not None else None

        # Client Satisfaction / Candidate Quality have no source (no feedback/ratings
        # table wired) — return null instead of fabricated 4.6 / 4.4. (#26)
        client_satisfaction = None
        candidate_quality = None
        
        # 4. Recent Activity
        cursor.execute(f"""
            SELECT 
                'placement_success' as type,
                'Successful Placement' as title,
                CONCAT(c.first_name, ' ', c.last_name, ' placed as ', jd.title) as description,
                o.created_at as timestamp,
                'high' as priority
            FROM offers o
            JOIN users c ON o.candidate_id::text = c.id::text
            JOIN job_postings jd ON o.job_posting_id::text = jd.id::text
            WHERE {recruiter_filter.replace('recruiter_id::text', 'o.recruiter_id::text')} o.status = 'accepted'
            
            UNION ALL
            
            SELECT 
                'new_requirement' as type,
                'New Vacancy' as title,
                CONCAT(jd.title, ' position for ', c.company_name) as description,
                jd.created_at as timestamp,
                'high' as priority
            FROM job_postings jd
            LEFT JOIN companies c ON jd.company_id::text = c.id::text
            {('WHERE ' + recruiter_filter.replace('recruiter_id::text', 'jd.recruiter_id::text').replace(' AND', '')) if recruiter_filter else ''}
            
            ORDER BY timestamp DESC
            LIMIT 10
        """, params)
        
        activity = cursor.fetchall()
        
        # Format activity with IDs
        formatted_activity = [
            {
                'id': idx + 1,
                'type': item['type'],
                'title': item['title'],
                'description': item['description'],
                'timestamp': item['timestamp'].isoformat() if item['timestamp'] else None,
                'priority': item['priority']
            }
            for idx, item in enumerate(activity)
        ]
        
        return {
            'placements': {
                'thisMonth': placements['this_month'] or 0,
                'thisQuarter': placements['this_quarter'] or 0,
                'thisYear': placements['this_year'] or 0,
                'target': 180  # This could be configured per recruiter
            },
            'pipeline': {
                'activeSearches': pipeline['active_searches'] or 0,
                'candidatesInProcess': pipeline['candidates_in_process'] or 0,
                'interviewsScheduled': pipeline['interviews_scheduled'] or 0,
                'offersExtended': pipeline['offers_extended'] or 0
            },
            'performance': {
                'placementRate': round(placement_rate, 1),
                'averageTimeToFill': avg_time_to_fill,
                'clientSatisfaction': client_satisfaction,
                'candidateQuality': candidate_quality
            },
            'activity': formatted_activity
        }
        
    except Exception as e:
        print(f"Error getting dashboard statistics: {e}")
        # Return empty data structure on error
        return {
            'placements': {'thisMonth': 0, 'thisQuarter': 0, 'thisYear': 0, 'target': 180},
            'pipeline': {'activeSearches': 0, 'candidatesInProcess': 0, 'interviewsScheduled': 0, 'offersExtended': 0},
            'performance': {'placementRate': 0, 'averageTimeToFill': 0, 'clientSatisfaction': 0, 'candidateQuality': 0},
            'activity': []
        }
    finally:
        cursor.close()
        conn.close()

def get_placement_statistics(recruiter_id: Optional[str] = None) -> Dict[str, int]:
    """Get placement statistics by time period"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        now = datetime.now()
        start_of_month = datetime(now.year, now.month, 1)
        start_of_quarter = datetime(now.year, ((now.month - 1) // 3) * 3 + 1, 1)
        start_of_year = datetime(now.year, 1, 1)
        
        recruiter_filter = "WHERE recruiter_id = %s" if recruiter_id else ""
        params = (recruiter_id,) if recruiter_id else ()
        
        cursor.execute(f"""
            SELECT 
                COUNT(*) FILTER (WHERE created_at >= %s) as this_month,
                COUNT(*) FILTER (WHERE created_at >= %s) as this_quarter,
                COUNT(*) FILTER (WHERE created_at >= %s) as this_year
            FROM offers
            {recruiter_filter}
            {'AND' if recruiter_filter else 'WHERE'} status = 'accepted'
        """, (start_of_month, start_of_quarter, start_of_year) + params)
        
        result = cursor.fetchone()
        return {
            'this_month': result['this_month'] or 0,
            'this_quarter': result['this_quarter'] or 0,
            'this_year': result['this_year'] or 0,
            'target': 180
        }
        
    finally:
        cursor.close()
        conn.close()

def get_pipeline_statistics(recruiter_id: Optional[str] = None) -> Dict[str, int]:
    """Get recruitment pipeline statistics"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Aligned to live schema: interviews_placeholder does not exist (use
        # interview_schedules); job_shortlists has no recruiter_id (the recruiter who
        # added the candidate is added_by). Named params so each subquery can reuse
        # the filter without a positional param-count mismatch.
        if recruiter_id:
            params = {'recruiter_id': recruiter_id}
            cursor.execute("""
                SELECT
                    (SELECT COUNT(*) FROM job_postings WHERE recruiter_id::text = %(recruiter_id)s AND status = 'active') as active_searches,
                    (SELECT COUNT(*) FROM job_shortlists WHERE added_by::text = %(recruiter_id)s) as candidates_in_process,
                    (SELECT COUNT(*) FROM interview_schedules WHERE recruiter_id::text = %(recruiter_id)s AND status = 'scheduled') as interviews_scheduled,
                    (SELECT COUNT(*) FROM offers WHERE recruiter_id::text = %(recruiter_id)s AND status = 'pending') as offers_extended
            """, params)
        else:
            cursor.execute("""
                SELECT
                    (SELECT COUNT(*) FROM job_postings WHERE status = 'active') as active_searches,
                    (SELECT COUNT(*) FROM job_shortlists) as candidates_in_process,
                    (SELECT COUNT(*) FROM interview_schedules WHERE status = 'scheduled') as interviews_scheduled,
                    (SELECT COUNT(*) FROM offers WHERE status = 'pending') as offers_extended
            """)
        
        result = cursor.fetchone()
        return {
            'active_searches': result['active_searches'] or 0,
            'candidates_in_process': result['candidates_in_process'] or 0,
            'interviews_scheduled': result['interviews_scheduled'] or 0,
            'offers_extended': result['offers_extended'] or 0
        }
        
    finally:
        cursor.close()
        conn.close()

def get_performance_metrics(recruiter_id: Optional[str] = None) -> Dict[str, float]:
    """Get performance metrics"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Placement Rate — job_shortlists has no status column in the live schema, so
        # "hired" is derived from accepted offers over total shortlisted candidates.
        # job_shortlists is filtered by added_by (it has no recruiter_id).
        if recruiter_id:
            cursor.execute("""
                SELECT
                    (SELECT COUNT(*) FROM offers WHERE recruiter_id::text = %(recruiter_id)s AND status = 'accepted') as hired,
                    (SELECT COUNT(*) FROM job_shortlists WHERE added_by::text = %(recruiter_id)s) as total
            """, {'recruiter_id': recruiter_id})
        else:
            cursor.execute("""
                SELECT
                    (SELECT COUNT(*) FROM offers WHERE status = 'accepted') as hired,
                    (SELECT COUNT(*) FROM job_shortlists) as total
            """)

        placement_data = cursor.fetchone()
        placement_rate = (placement_data['hired'] / placement_data['total'] * 100) if placement_data['total'] > 0 else 0

        # Average Time to Fill
        recruiter_filter = "WHERE recruiter_id = %s" if recruiter_id else ""
        params = (recruiter_id,) if recruiter_id else ()
        cursor.execute(f"""
            SELECT
                AVG(EXTRACT(DAY FROM (o.created_at - s.created_at))) as avg_days
            FROM offers o
            JOIN job_shortlists s ON o.candidate_id::text = s.candidate_id::text AND o.job_posting_id::text = s.job_posting_id::text
            JOIN job_postings jd ON o.job_posting_id::text = jd.id::text
            {recruiter_filter.replace('recruiter_id', 'o.recruiter_id')}
            {'AND' if recruiter_filter else 'WHERE'} o.status = 'accepted'
        """, params)
        
        time_to_fill_data = cursor.fetchone()
        # Null when no data (was fabricated 21); satisfaction/quality have no source. (#26)
        avg_time_to_fill = time_to_fill_data['avg_days'] if time_to_fill_data and time_to_fill_data['avg_days'] is not None else None

        return {
            'placement_rate': round(placement_rate, 1),
            'average_time_to_fill': int(avg_time_to_fill) if avg_time_to_fill is not None else None,
            'client_satisfaction': None,
            'candidate_quality': None
        }
        
    finally:
        cursor.close()
        conn.close()

