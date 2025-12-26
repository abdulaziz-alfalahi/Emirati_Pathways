"""
HR Dashboard System - Core Backend
Provides comprehensive HR dashboard functionality with AI-powered insights
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    FILLED = "filled"

class ApplicationStage(Enum):
    NEW = "new"
    SCREENING = "screening"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEWED = "interviewed"
    OFFER_EXTENDED = "offer_extended"
    HIRED = "hired"
    REJECTED = "rejected"

@dataclass
class HRDashboardMetrics:
    total_jobs: int
    active_jobs: int
    total_applications: int
    new_applications: int
    interviews_scheduled: int
    offers_extended: int
    positions_filled: int
    emiratization_rate: float
    avg_time_to_hire: float
    top_performing_jobs: List[Dict[str, Any]]
    application_trends: Dict[str, int]
    candidate_pipeline: Dict[str, int]

@dataclass
class JobPosting:
    id: str
    title: str
    department: str
    location: str
    job_type: str
    salary_range: str
    status: JobStatus
    created_date: datetime
    application_deadline: datetime
    description: str
    requirements: str
    benefits: str
    emiratization_priority: bool
    applications_count: int
    views_count: int

class HRDashboardEngine:
    def __init__(self):
        """Initialize the HR Dashboard Engine"""
        # Database connection
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'port': os.getenv('DB_PORT', '5432')
        }
        
        # Initialize Gemini AI
        self.api_key = os.getenv('GEMINI_API_KEY')
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        else:
            logger.warning("GEMINI_API_KEY not found - AI features will be limited")
            self.model = None
        
        logger.info("HR Dashboard Engine initialized")

    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def get_hr_dashboard_metrics(self, hr_user_id: str, company_id: Optional[str] = None) -> HRDashboardMetrics:
        """Get comprehensive HR dashboard metrics"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Base query conditions
                    company_filter = ""
                    params = []
                    
                    if company_id:
                        company_filter = "AND j.company_id = %s"
                        params.append(company_id)
                    
                    # Total jobs
                    cur.execute(f"""
                        SELECT COUNT(*) as total_jobs FROM jobs j 
                        WHERE 1=1 {company_filter}
                    """, params)
                    total_jobs = cur.fetchone()['total_jobs']
                    
                    # Active jobs
                    cur.execute(f"""
                        SELECT COUNT(*) as active_jobs FROM jobs j 
                        WHERE j.status = 'active' {company_filter}
                    """, params)
                    active_jobs = cur.fetchone()['active_jobs']
                    
                    # Total applications
                    cur.execute(f"""
                        SELECT COUNT(*) as total_applications 
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE 1=1 {company_filter}
                    """, params)
                    total_applications = cur.fetchone()['total_applications']
                    
                    # New applications (last 7 days)
                    cur.execute(f"""
                        SELECT COUNT(*) as new_applications 
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE ja.applied_date >= %s {company_filter}
                    """, [datetime.now() - timedelta(days=7)] + params)
                    new_applications = cur.fetchone()['new_applications']
                    
                    # Interviews scheduled
                    cur.execute(f"""
                        SELECT COUNT(*) as interviews_scheduled 
                        FROM job_interviews ji
                        JOIN job_applications ja ON ji.application_id = ja.id
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE ji.status = 'scheduled' AND ji.scheduled_date >= %s {company_filter}
                    """, [datetime.now()] + params)
                    interviews_scheduled = cur.fetchone()['interviews_scheduled']
                    
                    # Offers extended
                    cur.execute(f"""
                        SELECT COUNT(*) as offers_extended 
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE ja.status = 'offer_received' {company_filter}
                    """, params)
                    offers_extended = cur.fetchone()['offers_extended']
                    
                    # Positions filled
                    cur.execute(f"""
                        SELECT COUNT(*) as positions_filled 
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE ja.status = 'accepted' {company_filter}
                    """, params)
                    positions_filled = cur.fetchone()['positions_filled']
                    
                    # Emiratization rate
                    cur.execute(f"""
                        SELECT 
                            COUNT(CASE WHEN u.nationality = 'UAE' THEN 1 END) as emirati_hires,
                            COUNT(*) as total_hires
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        JOIN users u ON ja.user_id = u.id
                        WHERE ja.status = 'accepted' {company_filter}
                    """, params)
                    emiratization_data = cur.fetchone()
                    emiratization_rate = (
                        (emiratization_data['emirati_hires'] / emiratization_data['total_hires'] * 100)
                        if emiratization_data['total_hires'] > 0 else 0
                    )
                    
                    # Average time to hire
                    cur.execute(f"""
                        SELECT AVG(EXTRACT(EPOCH FROM (ja.last_updated - ja.applied_date))/86400) as avg_days
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE ja.status = 'accepted' {company_filter}
                    """, params)
                    avg_time_to_hire = float(cur.fetchone()['avg_days'] or 0)
                    
                    # Top performing jobs
                    cur.execute(f"""
                        SELECT 
                            j.id, j.title, j.department,
                            COUNT(ja.id) as applications_count,
                            COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END) as hires_count
                        FROM jobs j
                        LEFT JOIN job_applications ja ON j.id = ja.job_id
                        WHERE j.status = 'active' {company_filter}
                        GROUP BY j.id, j.title, j.department
                        ORDER BY applications_count DESC
                        LIMIT 5
                    """, params)
                    top_performing_jobs = [dict(row) for row in cur.fetchall()]
                    
                    # Application trends (last 30 days)
                    cur.execute(f"""
                        SELECT 
                            DATE(ja.applied_date) as application_date,
                            COUNT(*) as applications_count
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE ja.applied_date >= %s {company_filter}
                        GROUP BY DATE(ja.applied_date)
                        ORDER BY application_date
                    """, [datetime.now() - timedelta(days=30)] + params)
                    trends_data = cur.fetchall()
                    application_trends = {
                        row['application_date'].strftime('%Y-%m-%d'): row['applications_count']
                        for row in trends_data
                    }
                    
                    # Candidate pipeline
                    cur.execute(f"""
                        SELECT 
                            ja.status,
                            COUNT(*) as count
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        WHERE 1=1 {company_filter}
                        GROUP BY ja.status
                    """, params)
                    pipeline_data = cur.fetchall()
                    candidate_pipeline = {
                        row['status']: row['count']
                        for row in pipeline_data
                    }
                    
                    return HRDashboardMetrics(
                        total_jobs=total_jobs,
                        active_jobs=active_jobs,
                        total_applications=total_applications,
                        new_applications=new_applications,
                        interviews_scheduled=interviews_scheduled,
                        offers_extended=offers_extended,
                        positions_filled=positions_filled,
                        emiratization_rate=round(emiratization_rate, 1),
                        avg_time_to_hire=round(avg_time_to_hire, 1),
                        top_performing_jobs=top_performing_jobs,
                        application_trends=application_trends,
                        candidate_pipeline=candidate_pipeline
                    )
                    
        except Exception as e:
            logger.error(f"Error getting HR dashboard metrics: {e}")
            return HRDashboardMetrics(
                total_jobs=0, active_jobs=0, total_applications=0, new_applications=0,
                interviews_scheduled=0, offers_extended=0, positions_filled=0,
                emiratization_rate=0.0, avg_time_to_hire=0.0,
                top_performing_jobs=[], application_trends={}, candidate_pipeline={}
            )

    def create_job_posting(self, hr_user_id: str, job_data: Dict[str, Any]) -> str:
        """Create a new job posting with AI enhancement"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Generate job ID
                    job_id = f"job_{int(datetime.now().timestamp())}"
                    
                    # AI-enhance job description if available
                    enhanced_description = self._enhance_job_description(job_data) if self.model else job_data.get('description', '')
                    
                    # Insert job posting
                    cur.execute("""
                        INSERT INTO jobs (
                            id, title, department, location, job_type, salary_range,
                            status, description, requirements, benefits, 
                            emiratization_priority, company_id, created_by,
                            created_at, application_deadline
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        job_id,
                        job_data.get('title', ''),
                        job_data.get('department', ''),
                        job_data.get('location', ''),
                        job_data.get('job_type', 'full_time'),
                        job_data.get('salary_range', ''),
                        JobStatus.DRAFT.value,
                        enhanced_description,
                        job_data.get('requirements', ''),
                        job_data.get('benefits', ''),
                        job_data.get('emiratization_priority', False),
                        job_data.get('company_id'),
                        hr_user_id,
                        datetime.now(),
                        job_data.get('application_deadline')
                    ))
                    
                    conn.commit()
                    logger.info(f"Created job posting {job_id}")
                    return job_id
                    
        except Exception as e:
            logger.error(f"Error creating job posting: {e}")
            raise

    def _enhance_job_description(self, job_data: Dict[str, Any]) -> str:
        """Use AI to enhance job description"""
        try:
            if not self.model:
                return job_data.get('description', '')
            
            prompt = f"""
            Enhance this job description for the UAE market with Emiratization focus:
            
            ORIGINAL JOB DATA:
            Title: {job_data.get('title', '')}
            Department: {job_data.get('department', '')}
            Location: {job_data.get('location', '')}
            Description: {job_data.get('description', '')}
            Requirements: {job_data.get('requirements', '')}
            
            Please enhance the job description to:
            1. Make it more engaging and professional
            2. Include UAE cultural context where appropriate
            3. Emphasize Emiratization benefits if applicable
            4. Use inclusive language
            5. Highlight growth opportunities
            6. Ensure compliance with UAE employment standards
            
            Return only the enhanced job description text.
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error enhancing job description: {e}")
            return job_data.get('description', '')

    def get_job_postings(self, hr_user_id: str, company_id: Optional[str] = None, 
                        status_filter: Optional[str] = None,
                        opportunity_type: Optional[str] = None) -> List[JobPosting]:
        """Get job postings for HR user"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                        SELECT 
                            j.*,
                            COUNT(ja.id) as applications_count,
                            COALESCE(jv.views_count, 0) as views_count
                        FROM jobs j
                        LEFT JOIN job_applications ja ON j.id = ja.job_id
                        LEFT JOIN (
                            SELECT job_id, COUNT(*) as views_count 
                            FROM job_views 
                            GROUP BY job_id
                        ) jv ON j.id = jv.job_id
                        WHERE 1=1
                    """
                    params = []
                    
                    if company_id:
                        query += " AND j.company_id = %s"
                        params.append(company_id)
                    
                    if status_filter:
                        query += " AND j.status = %s"
                        params.append(status_filter)

                    if opportunity_type:
                        query += " AND j.job_type = %s"
                        params.append(opportunity_type)
                    
                    query += """
                        GROUP BY j.id, jv.views_count
                        ORDER BY j.created_at DESC
                    """
                    
                    cur.execute(query, params)
                    jobs_data = cur.fetchall()
                    
                    job_postings = []
                    for job_data in jobs_data:
                        job_posting = JobPosting(
                            id=job_data['id'],
                            title=job_data['title'],
                            department=job_data['department'] or '',
                            location=job_data['location'] or '',
                            job_type=job_data['job_type'] or 'full_time',
                            salary_range=job_data['salary_range'] or '',
                            status=JobStatus(job_data['status']),
                            created_date=job_data['created_at'],
                            application_deadline=job_data['application_deadline'],
                            description=job_data['description'] or '',
                            requirements=job_data['requirements'] or '',
                            benefits=job_data['benefits'] or '',
                            emiratization_priority=job_data.get('emiratization_priority', False),
                            applications_count=job_data['applications_count'] or 0,
                            views_count=job_data['views_count'] or 0
                        )
                        job_postings.append(job_posting)
                    
                    return job_postings
                    
        except Exception as e:
            logger.error(f"Error getting job postings: {e}")
            return []

    def update_job_status(self, job_id: str, new_status: JobStatus, hr_user_id: str) -> bool:
        """Update job posting status"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE jobs 
                        SET status = %s, updated_at = %s, updated_by = %s
                        WHERE id = %s
                    """, (new_status.value, datetime.now(), hr_user_id, job_id))
                    
                    conn.commit()
                    logger.info(f"Updated job {job_id} status to {new_status.value}")
                    return True
                    
        except Exception as e:
            logger.error(f"Error updating job status: {e}")
            return False

    def get_applications_for_job(self, job_id: str, stage_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get applications for a specific job"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                        SELECT 
                            ja.*,
                            u.first_name, u.last_name, u.email, u.nationality,
                            p.phone, p.location as candidate_location,
                            p.experience_years, p.current_position
                        FROM job_applications ja
                        JOIN users u ON ja.user_id = u.id
                        LEFT JOIN profiles p ON u.id = p.user_id
                        WHERE ja.job_id = %s
                    """
                    params = [job_id]
                    
                    if stage_filter:
                        query += " AND ja.status = %s"
                        params.append(stage_filter)
                    
                    query += " ORDER BY ja.applied_date DESC"
                    
                    cur.execute(query, params)
                    applications = cur.fetchall()
                    
                    return [dict(app) for app in applications]
                    
        except Exception as e:
            logger.error(f"Error getting applications for job: {e}")
            return []

    def shortlist_candidate(self, application_id: str, hr_user_id: str, notes: str = '') -> bool:
        """Shortlist a candidate application"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Update application status
                    cur.execute("""
                        UPDATE job_applications 
                        SET status = %s, last_updated = %s
                        WHERE id = %s
                    """, (ApplicationStage.SHORTLISTED.value, datetime.now(), application_id))
                    
                    # Add shortlist note
                    if notes:
                        cur.execute("""
                            INSERT INTO application_notes (application_id, hr_user_id, note, created_at)
                            VALUES (%s, %s, %s, %s)
                        """, (application_id, hr_user_id, f"Shortlisted: {notes}", datetime.now()))
                    
                    conn.commit()
                    logger.info(f"Shortlisted application {application_id}")
                    return True
                    
        except Exception as e:
            logger.error(f"Error shortlisting candidate: {e}")
            return False

    def get_ai_recruitment_insights(self, company_id: Optional[str] = None) -> Dict[str, Any]:
        """Get AI-powered recruitment insights"""
        try:
            if not self.model:
                return {'error': 'AI model not available'}
            
            # Get recent hiring data
            metrics = self.get_hr_dashboard_metrics('system', company_id)
            
            prompt = f"""
            Analyze this UAE recruitment data and provide insights:
            
            RECRUITMENT METRICS:
            - Total Jobs: {metrics.total_jobs}
            - Active Jobs: {metrics.active_jobs}
            - Total Applications: {metrics.total_applications}
            - Emiratization Rate: {metrics.emiratization_rate}%
            - Average Time to Hire: {metrics.avg_time_to_hire} days
            - Pipeline: {metrics.candidate_pipeline}
            
            Provide insights in JSON format:
            {{
                "recruitment_health": "excellent/good/needs_improvement",
                "emiratization_assessment": "analysis of UAE national hiring",
                "efficiency_insights": "time-to-hire and process optimization",
                "pipeline_analysis": "candidate pipeline assessment",
                "recommendations": ["rec1", "rec2", "rec3"],
                "market_trends": "UAE job market insights",
                "success_factors": ["factor1", "factor2"],
                "areas_for_improvement": ["area1", "area2"]
            }}
            
            Focus on UAE market context and Emiratization goals.
            """
            
            response = self.model.generate_content(prompt)
            
            try:
                insights = json.loads(response.text)
                return insights
            except json.JSONDecodeError:
                return {
                    'recruitment_health': 'good',
                    'emiratization_assessment': 'On track with UAE national hiring goals',
                    'efficiency_insights': 'Standard recruitment timelines observed',
                    'pipeline_analysis': 'Healthy candidate pipeline',
                    'recommendations': ['Continue current practices', 'Focus on Emiratization'],
                    'market_trends': 'UAE job market remains competitive',
                    'success_factors': ['Strong employer brand', 'Competitive packages'],
                    'areas_for_improvement': ['Process optimization', 'Candidate experience']
                }
                
        except Exception as e:
            logger.error(f"Error getting AI recruitment insights: {e}")
            return {'error': 'Failed to generate insights'}

# Initialize the HR Dashboard Engine
hr_dashboard_engine = HRDashboardEngine()
