"""
Statistics Engine for Recruiter Dashboard
Provides real-time statistics and metrics for recruiter performance and pipeline
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import os

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'emirati_pathways'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'postgres')
    )

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
            recruiter_filter = "recruiter_id = %(recruiter_id)s AND"
            params['recruiter_id'] = recruiter_id
        
        # 1. Placements Statistics
        cursor.execute(f"""
            SELECT 
                COUNT(*) FILTER (WHERE created_at >= %(start_of_month)s) as this_month,
                COUNT(*) FILTER (WHERE created_at >= %(start_of_quarter)s) as this_quarter,
                COUNT(*) FILTER (WHERE created_at >= %(start_of_year)s) as this_year
            FROM job_offers
            WHERE {recruiter_filter} status = 'accepted'
        """, {**params, 
              'start_of_month': start_of_month,
              'start_of_quarter': start_of_quarter,
              'start_of_year': start_of_year})
        
        placements = cursor.fetchone()
        
        # 2. Pipeline Statistics  
        cursor.execute(f"""
            SELECT 
                (SELECT COUNT(*) FROM job_descriptions WHERE {recruiter_filter.replace('recruiter_id', 'created_by')} status = 'active') as active_searches,
                (SELECT COUNT(*) FROM shortlist WHERE {recruiter_filter} status NOT IN ('rejected', 'hired')) as candidates_in_process,
                (SELECT COUNT(*) FROM interviews WHERE {recruiter_filter} status = 'scheduled') as interviews_scheduled,
                (SELECT COUNT(*) FROM job_offers WHERE {recruiter_filter} status = 'pending') as offers_extended
        """, params)
        
        pipeline = cursor.fetchone()
        
        # 3. Performance Metrics
        # Placement Rate: (hired candidates / total candidates) * 100
        cursor.execute(f"""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'hired') as hired,
                COUNT(*) as total
            FROM shortlist
            {('WHERE ' + recruiter_filter.replace(' AND', '')) if recruiter_filter else ''}
        """, params)
        
        placement_data = cursor.fetchone()
        placement_rate = (placement_data['hired'] / placement_data['total'] * 100) if placement_data['total'] > 0 else 0
        
        # Average Time to Fill: avg(hire_date - application_date)
        cursor.execute(f"""
            SELECT 
                AVG(EXTRACT(DAY FROM (o.created_at - s.created_at))) as avg_days
            FROM job_offers o
            JOIN shortlist s ON o.candidate_id = s.candidate_id AND o.jd_id = s.jd_id
            WHERE {recruiter_filter.replace('recruiter_id', 'o.recruiter_id')} o.status = 'accepted'
        """, params)
        
        time_to_fill_data = cursor.fetchone()
        avg_time_to_fill = int(time_to_fill_data['avg_days'] or 21)  # Default to 21 if no data
        
        # Client Satisfaction (placeholder - would come from feedback table)
        client_satisfaction = 4.6
        
        # Candidate Quality (placeholder - would come from ratings)
        candidate_quality = 4.4
        
        # 4. Recent Activity
        cursor.execute(f"""
            SELECT 
                'placement_success' as type,
                'Successful Placement' as title,
                CONCAT(c.first_name, ' ', c.last_name, ' placed as ', jd.title) as description,
                o.created_at as timestamp,
                'high' as priority
            FROM job_offers o
            JOIN candidates c ON o.candidate_id = c.id
            JOIN job_descriptions jd ON o.jd_id = jd.id
            WHERE {recruiter_filter.replace('recruiter_id', 'o.recruiter_id')} o.status = 'accepted'
            
            UNION ALL
            
            SELECT 
                'interview_scheduled' as type,
                'Interview Scheduled' as title,
                CONCAT(i.interview_type, ' interview for ', jd.title) as description,
                i.scheduled_time as timestamp,
                'medium' as priority
            FROM interviews i
            JOIN job_descriptions jd ON i.jd_id = jd.id
            WHERE {recruiter_filter.replace('recruiter_id', 'i.recruiter_id')} i.status = 'scheduled'
            
            UNION ALL
            
            SELECT 
                'new_requirement' as type,
                'New Search Assignment' as title,
                CONCAT(jd.title, ' position for ', jd.company_name) as description,
                jd.created_at as timestamp,
                'high' as priority
            FROM job_descriptions jd
            {('WHERE ' + recruiter_filter.replace('recruiter_id', 'jd.created_by').replace(' AND', '')) if recruiter_filter else ''}
            
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
            FROM job_offers
            {recruiter_filter}
            {'AND' if recruiter_filter else 'WHERE'} status = 'accepted'
        """, params + (start_of_month, start_of_quarter, start_of_year))
        
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
        recruiter_filter = "WHERE recruiter_id = %s" if recruiter_id else ""
        params = (recruiter_id,) if recruiter_id else ()
        
        cursor.execute(f"""
            SELECT 
                (SELECT COUNT(*) FROM job_descriptions {recruiter_filter.replace('recruiter_id', 'created_by')} {'AND' if recruiter_filter else 'WHERE'} status = 'active') as active_searches,
                (SELECT COUNT(*) FROM shortlist {recruiter_filter} {'AND' if recruiter_filter else 'WHERE'} status NOT IN ('rejected', 'hired')) as candidates_in_process,
                (SELECT COUNT(*) FROM interviews {recruiter_filter} {'AND' if recruiter_filter else 'WHERE'} status = 'scheduled') as interviews_scheduled,
                (SELECT COUNT(*) FROM job_offers {recruiter_filter} {'AND' if recruiter_filter else 'WHERE'} status = 'pending') as offers_extended
        """, params)
        
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
        recruiter_filter = "WHERE recruiter_id = %s" if recruiter_id else ""
        params = (recruiter_id,) if recruiter_id else ()
        
        # Placement Rate
        cursor.execute(f"""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'hired') as hired,
                COUNT(*) as total
            FROM shortlist
            {recruiter_filter}
        """, params)
        
        placement_data = cursor.fetchone()
        placement_rate = (placement_data['hired'] / placement_data['total'] * 100) if placement_data['total'] > 0 else 0
        
        # Average Time to Fill
        cursor.execute(f"""
            SELECT 
                AVG(EXTRACT(DAY FROM (o.created_at - s.created_at))) as avg_days
            FROM job_offers o
            JOIN shortlist s ON o.candidate_id = s.candidate_id AND o.jd_id = s.jd_id
            {recruiter_filter.replace('recruiter_id', 'o.recruiter_id')}
            {'AND' if recruiter_filter else 'WHERE'} o.status = 'accepted'
        """, params)
        
        time_to_fill_data = cursor.fetchone()
        avg_time_to_fill = time_to_fill_data['avg_days'] or 21
        
        return {
            'placement_rate': round(placement_rate, 1),
            'average_time_to_fill': int(avg_time_to_fill),
            'client_satisfaction': 4.6,  # Placeholder
            'candidate_quality': 4.4  # Placeholder
        }
        
    finally:
        cursor.close()
        conn.close()

