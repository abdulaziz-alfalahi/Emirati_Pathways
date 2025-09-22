"""
Mentor Progress Tracking and Goal Management System
Comprehensive system for tracking mentee progress and managing goals
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoalStatus(Enum):
    """Goal status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"

class GoalPriority(Enum):
    """Goal priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class GoalCategory(Enum):
    """Goal category enumeration"""
    CAREER_DEVELOPMENT = "career_development"
    SKILL_BUILDING = "skill_building"
    NETWORKING = "networking"
    LEADERSHIP = "leadership"
    TECHNICAL_SKILLS = "technical_skills"
    SOFT_SKILLS = "soft_skills"
    INDUSTRY_KNOWLEDGE = "industry_knowledge"
    PERSONAL_BRANDING = "personal_branding"
    JOB_SEARCH = "job_search"
    PERFORMANCE_IMPROVEMENT = "performance_improvement"

class MilestoneStatus(Enum):
    """Milestone status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"

class ProgressMetric(Enum):
    """Progress metric types"""
    PERCENTAGE = "percentage"
    BINARY = "binary"
    NUMERIC = "numeric"
    QUALITATIVE = "qualitative"

@dataclass
class Goal:
    """Goal data structure"""
    id: str
    mentorship_id: str
    title: str
    description: str
    category: GoalCategory
    priority: GoalPriority
    status: GoalStatus
    target_date: datetime
    created_date: datetime
    updated_date: datetime
    completion_percentage: float
    success_criteria: List[str]
    resources_needed: List[str]
    mentor_notes: str
    mentee_notes: str
    is_smart_goal: bool
    tags: List[str]

@dataclass
class Milestone:
    """Milestone data structure"""
    id: str
    goal_id: str
    title: str
    description: str
    target_date: datetime
    status: MilestoneStatus
    completion_percentage: float
    created_date: datetime
    updated_date: datetime
    notes: str

@dataclass
class ProgressEntry:
    """Progress entry data structure"""
    id: str
    goal_id: str
    milestone_id: Optional[str]
    entry_date: datetime
    progress_value: float
    metric_type: ProgressMetric
    notes: str
    evidence_links: List[str]
    mentor_feedback: str
    mentee_reflection: str
    created_by: str

@dataclass
class SkillAssessment:
    """Skill assessment data structure"""
    id: str
    mentorship_id: str
    skill_name: str
    initial_level: int  # 1-10 scale
    current_level: int  # 1-10 scale
    target_level: int   # 1-10 scale
    assessment_date: datetime
    assessor: str  # mentor or mentee
    notes: str
    improvement_plan: str

@dataclass
class MentorshipPlan:
    """Mentorship plan data structure"""
    id: str
    mentor_id: str
    mentee_user_id: str
    plan_title: str
    description: str
    duration_months: int
    start_date: datetime
    end_date: datetime
    overall_objectives: List[str]
    success_metrics: List[str]
    meeting_frequency: str
    status: str
    created_date: datetime
    updated_date: datetime

class MentorProgressTracker:
    """Comprehensive progress tracking and goal management system"""
    
    def __init__(self, db_config: Dict):
        """Initialize the progress tracker with database configuration"""
        self.db_config = db_config
        
        # SMART goal criteria
        self.smart_criteria = {
            'specific': 'Goal is clearly defined and specific',
            'measurable': 'Goal has quantifiable success criteria',
            'achievable': 'Goal is realistic and attainable',
            'relevant': 'Goal aligns with career objectives',
            'time_bound': 'Goal has a clear deadline'
        }
        
        # UAE professional development focus areas
        self.uae_focus_areas = {
            'emiratization': 'Supporting UAE nationals in career development',
            'vision_2071': 'Aligning with UAE Vision 2071 objectives',
            'digital_transformation': 'Building digital economy skills',
            'sustainability': 'Green economy and sustainability skills',
            'innovation': 'Innovation and entrepreneurship capabilities',
            'cultural_competency': 'UAE cultural and business etiquette',
            'arabic_proficiency': 'Arabic language skills for business',
            'government_sector': 'Public sector career development',
            'private_sector': 'Private sector opportunities',
            'startup_ecosystem': 'Entrepreneurship and startup skills'
        }

    def get_database_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def create_mentorship_plan(self, mentor_id: str, mentee_user_id: str, 
                              plan_data: Dict) -> Optional[str]:
        """Create a comprehensive mentorship plan"""
        try:
            plan_id = str(uuid.uuid4())
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO mentorship_plans 
                        (id, mentor_id, mentee_user_id, plan_title, description, 
                         duration_months, start_date, end_date, overall_objectives, 
                         success_metrics, meeting_frequency, status, created_date, updated_date)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        plan_id,
                        mentor_id,
                        mentee_user_id,
                        plan_data['plan_title'],
                        plan_data['description'],
                        plan_data['duration_months'],
                        plan_data['start_date'],
                        plan_data['end_date'],
                        json.dumps(plan_data.get('overall_objectives', [])),
                        json.dumps(plan_data.get('success_metrics', [])),
                        plan_data.get('meeting_frequency', 'weekly'),
                        'active',
                        datetime.now(),
                        datetime.now()
                    ))
                    
                    conn.commit()
                    return plan_id
                    
        except Exception as e:
            logger.error(f"Error creating mentorship plan: {e}")
            return None

    def create_goal(self, goal_data: Dict) -> Optional[str]:
        """Create a new goal"""
        try:
            goal_id = str(uuid.uuid4())
            
            # Validate SMART goal criteria
            is_smart = self.validate_smart_goal(goal_data)
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO mentorship_goals 
                        (id, mentorship_id, title, description, category, priority, 
                         status, target_date, completion_percentage, success_criteria, 
                         resources_needed, mentor_notes, mentee_notes, is_smart_goal, 
                         tags, created_date, updated_date)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        goal_id,
                        goal_data['mentorship_id'],
                        goal_data['title'],
                        goal_data['description'],
                        goal_data['category'],
                        goal_data.get('priority', GoalPriority.MEDIUM.value),
                        GoalStatus.ACTIVE.value,
                        goal_data['target_date'],
                        0.0,  # Initial completion percentage
                        json.dumps(goal_data.get('success_criteria', [])),
                        json.dumps(goal_data.get('resources_needed', [])),
                        goal_data.get('mentor_notes', ''),
                        goal_data.get('mentee_notes', ''),
                        is_smart,
                        json.dumps(goal_data.get('tags', [])),
                        datetime.now(),
                        datetime.now()
                    ))
                    
                    conn.commit()
                    return goal_id
                    
        except Exception as e:
            logger.error(f"Error creating goal: {e}")
            return None

    def validate_smart_goal(self, goal_data: Dict) -> bool:
        """Validate if goal meets SMART criteria"""
        try:
            # Check if goal has specific elements
            has_specific = len(goal_data.get('title', '')) > 10 and len(goal_data.get('description', '')) > 20
            has_measurable = len(goal_data.get('success_criteria', [])) > 0
            has_time_bound = 'target_date' in goal_data
            has_relevant = goal_data.get('category') in [cat.value for cat in GoalCategory]
            
            # Simple heuristic for achievable (could be enhanced with ML)
            has_achievable = True  # Assume achievable for now
            
            return has_specific and has_measurable and has_achievable and has_relevant and has_time_bound
            
        except Exception as e:
            logger.error(f"Error validating SMART goal: {e}")
            return False

    def create_milestone(self, milestone_data: Dict) -> Optional[str]:
        """Create a milestone for a goal"""
        try:
            milestone_id = str(uuid.uuid4())
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO goal_milestones 
                        (id, goal_id, title, description, target_date, status, 
                         completion_percentage, notes, created_date, updated_date)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        milestone_id,
                        milestone_data['goal_id'],
                        milestone_data['title'],
                        milestone_data['description'],
                        milestone_data['target_date'],
                        MilestoneStatus.PENDING.value,
                        0.0,
                        milestone_data.get('notes', ''),
                        datetime.now(),
                        datetime.now()
                    ))
                    
                    conn.commit()
                    return milestone_id
                    
        except Exception as e:
            logger.error(f"Error creating milestone: {e}")
            return None

    def record_progress(self, progress_data: Dict) -> Optional[str]:
        """Record progress entry"""
        try:
            progress_id = str(uuid.uuid4())
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO progress_entries 
                        (id, goal_id, milestone_id, entry_date, progress_value, 
                         metric_type, notes, evidence_links, mentor_feedback, 
                         mentee_reflection, created_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        progress_id,
                        progress_data['goal_id'],
                        progress_data.get('milestone_id'),
                        progress_data.get('entry_date', datetime.now()),
                        progress_data['progress_value'],
                        progress_data.get('metric_type', ProgressMetric.PERCENTAGE.value),
                        progress_data.get('notes', ''),
                        json.dumps(progress_data.get('evidence_links', [])),
                        progress_data.get('mentor_feedback', ''),
                        progress_data.get('mentee_reflection', ''),
                        progress_data['created_by']
                    ))
                    
                    # Update goal completion percentage
                    self.update_goal_progress(progress_data['goal_id'])
                    
                    conn.commit()
                    return progress_id
                    
        except Exception as e:
            logger.error(f"Error recording progress: {e}")
            return None

    def update_goal_progress(self, goal_id: str):
        """Update goal completion percentage based on progress entries and milestones"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    # Get latest progress entries
                    cursor.execute("""
                        SELECT AVG(progress_value) as avg_progress
                        FROM progress_entries 
                        WHERE goal_id = %s
                        AND entry_date >= CURRENT_DATE - INTERVAL '30 days'
                    """, (goal_id,))
                    
                    progress_result = cursor.fetchone()
                    avg_progress = progress_result[0] if progress_result and progress_result[0] else 0
                    
                    # Get milestone completion
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_milestones,
                            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_milestones
                        FROM goal_milestones 
                        WHERE goal_id = %s
                    """, (goal_id,))
                    
                    milestone_result = cursor.fetchone()
                    total_milestones, completed_milestones = milestone_result
                    
                    # Calculate overall progress (weighted average)
                    if total_milestones > 0:
                        milestone_progress = (completed_milestones / total_milestones) * 100
                        overall_progress = (avg_progress * 0.6) + (milestone_progress * 0.4)
                    else:
                        overall_progress = avg_progress
                    
                    # Update goal
                    cursor.execute("""
                        UPDATE mentorship_goals 
                        SET completion_percentage = %s, 
                            updated_date = %s,
                            status = CASE 
                                WHEN %s >= 100 THEN 'completed'
                                WHEN %s > 0 THEN 'in_progress'
                                ELSE status
                            END
                        WHERE id = %s
                    """, (overall_progress, datetime.now(), overall_progress, overall_progress, goal_id))
                    
                    conn.commit()
                    
        except Exception as e:
            logger.error(f"Error updating goal progress: {e}")

    def conduct_skill_assessment(self, assessment_data: Dict) -> Optional[str]:
        """Conduct skill assessment"""
        try:
            assessment_id = str(uuid.uuid4())
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO skill_assessments 
                        (id, mentorship_id, skill_name, initial_level, current_level, 
                         target_level, assessment_date, assessor, notes, improvement_plan)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (mentorship_id, skill_name) 
                        DO UPDATE SET 
                            current_level = EXCLUDED.current_level,
                            assessment_date = EXCLUDED.assessment_date,
                            assessor = EXCLUDED.assessor,
                            notes = EXCLUDED.notes,
                            improvement_plan = EXCLUDED.improvement_plan
                    """, (
                        assessment_id,
                        assessment_data['mentorship_id'],
                        assessment_data['skill_name'],
                        assessment_data.get('initial_level', assessment_data['current_level']),
                        assessment_data['current_level'],
                        assessment_data['target_level'],
                        assessment_data.get('assessment_date', datetime.now()),
                        assessment_data['assessor'],
                        assessment_data.get('notes', ''),
                        assessment_data.get('improvement_plan', '')
                    ))
                    
                    conn.commit()
                    return assessment_id
                    
        except Exception as e:
            logger.error(f"Error conducting skill assessment: {e}")
            return None

    def get_mentorship_goals(self, mentorship_id: str, status_filter: Optional[str] = None) -> List[Goal]:
        """Get goals for a mentorship"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    where_clause = "WHERE mentorship_id = %s"
                    params = [mentorship_id]
                    
                    if status_filter:
                        where_clause += " AND status = %s"
                        params.append(status_filter)
                    
                    cursor.execute(f"""
                        SELECT * FROM mentorship_goals 
                        {where_clause}
                        ORDER BY priority DESC, target_date ASC
                    """, params)
                    
                    goals = []
                    for row in cursor.fetchall():
                        goal = Goal(
                            id=str(row['id']),
                            mentorship_id=str(row['mentorship_id']),
                            title=row['title'],
                            description=row['description'],
                            category=GoalCategory(row['category']),
                            priority=GoalPriority(row['priority']),
                            status=GoalStatus(row['status']),
                            target_date=row['target_date'],
                            created_date=row['created_date'],
                            updated_date=row['updated_date'],
                            completion_percentage=float(row['completion_percentage']),
                            success_criteria=json.loads(row['success_criteria']) if row['success_criteria'] else [],
                            resources_needed=json.loads(row['resources_needed']) if row['resources_needed'] else [],
                            mentor_notes=row.get('mentor_notes', ''),
                            mentee_notes=row.get('mentee_notes', ''),
                            is_smart_goal=row.get('is_smart_goal', False),
                            tags=json.loads(row['tags']) if row['tags'] else []
                        )
                        goals.append(goal)
                    
                    return goals
                    
        except Exception as e:
            logger.error(f"Error getting mentorship goals: {e}")
            return []

    def get_goal_milestones(self, goal_id: str) -> List[Milestone]:
        """Get milestones for a goal"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT * FROM goal_milestones 
                        WHERE goal_id = %s
                        ORDER BY target_date ASC
                    """, (goal_id,))
                    
                    milestones = []
                    for row in cursor.fetchall():
                        milestone = Milestone(
                            id=str(row['id']),
                            goal_id=str(row['goal_id']),
                            title=row['title'],
                            description=row['description'],
                            target_date=row['target_date'],
                            status=MilestoneStatus(row['status']),
                            completion_percentage=float(row['completion_percentage']),
                            created_date=row['created_date'],
                            updated_date=row['updated_date'],
                            notes=row.get('notes', '')
                        )
                        milestones.append(milestone)
                    
                    return milestones
                    
        except Exception as e:
            logger.error(f"Error getting goal milestones: {e}")
            return []

    def get_progress_entries(self, goal_id: str, limit: int = 50) -> List[ProgressEntry]:
        """Get progress entries for a goal"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT * FROM progress_entries 
                        WHERE goal_id = %s
                        ORDER BY entry_date DESC
                        LIMIT %s
                    """, (goal_id, limit))
                    
                    entries = []
                    for row in cursor.fetchall():
                        entry = ProgressEntry(
                            id=str(row['id']),
                            goal_id=str(row['goal_id']),
                            milestone_id=str(row['milestone_id']) if row['milestone_id'] else None,
                            entry_date=row['entry_date'],
                            progress_value=float(row['progress_value']),
                            metric_type=ProgressMetric(row['metric_type']),
                            notes=row.get('notes', ''),
                            evidence_links=json.loads(row['evidence_links']) if row['evidence_links'] else [],
                            mentor_feedback=row.get('mentor_feedback', ''),
                            mentee_reflection=row.get('mentee_reflection', ''),
                            created_by=str(row['created_by'])
                        )
                        entries.append(entry)
                    
                    return entries
                    
        except Exception as e:
            logger.error(f"Error getting progress entries: {e}")
            return []

    def get_skill_assessments(self, mentorship_id: str) -> List[SkillAssessment]:
        """Get skill assessments for a mentorship"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT * FROM skill_assessments 
                        WHERE mentorship_id = %s
                        ORDER BY assessment_date DESC
                    """, (mentorship_id,))
                    
                    assessments = []
                    for row in cursor.fetchall():
                        assessment = SkillAssessment(
                            id=str(row['id']),
                            mentorship_id=str(row['mentorship_id']),
                            skill_name=row['skill_name'],
                            initial_level=row['initial_level'],
                            current_level=row['current_level'],
                            target_level=row['target_level'],
                            assessment_date=row['assessment_date'],
                            assessor=row['assessor'],
                            notes=row.get('notes', ''),
                            improvement_plan=row.get('improvement_plan', '')
                        )
                        assessments.append(assessment)
                    
                    return assessments
                    
        except Exception as e:
            logger.error(f"Error getting skill assessments: {e}")
            return []

    def generate_progress_report(self, mentorship_id: str) -> Dict:
        """Generate comprehensive progress report"""
        try:
            # Get all goals
            goals = self.get_mentorship_goals(mentorship_id)
            
            # Calculate overall statistics
            total_goals = len(goals)
            completed_goals = len([g for g in goals if g.status == GoalStatus.COMPLETED])
            in_progress_goals = len([g for g in goals if g.status == GoalStatus.IN_PROGRESS])
            
            # Calculate average completion
            avg_completion = sum(g.completion_percentage for g in goals) / total_goals if total_goals > 0 else 0
            
            # Get skill assessments
            skill_assessments = self.get_skill_assessments(mentorship_id)
            
            # Calculate skill improvement
            skill_improvements = []
            for assessment in skill_assessments:
                improvement = assessment.current_level - assessment.initial_level
                skill_improvements.append({
                    'skill_name': assessment.skill_name,
                    'initial_level': assessment.initial_level,
                    'current_level': assessment.current_level,
                    'target_level': assessment.target_level,
                    'improvement': improvement,
                    'progress_to_target': ((assessment.current_level - assessment.initial_level) / 
                                         (assessment.target_level - assessment.initial_level)) * 100 
                                         if assessment.target_level > assessment.initial_level else 100
                })
            
            # Get recent progress entries
            recent_progress = []
            for goal in goals:
                entries = self.get_progress_entries(goal.id, 5)
                recent_progress.extend(entries)
            
            # Sort by date
            recent_progress.sort(key=lambda x: x.entry_date, reverse=True)
            recent_progress = recent_progress[:10]  # Top 10 recent entries
            
            report = {
                'mentorship_id': mentorship_id,
                'report_date': datetime.now().isoformat(),
                'overall_statistics': {
                    'total_goals': total_goals,
                    'completed_goals': completed_goals,
                    'in_progress_goals': in_progress_goals,
                    'average_completion': round(avg_completion, 2),
                    'completion_rate': round((completed_goals / total_goals) * 100, 2) if total_goals > 0 else 0
                },
                'goals_summary': [
                    {
                        'id': goal.id,
                        'title': goal.title,
                        'category': goal.category.value,
                        'priority': goal.priority.value,
                        'status': goal.status.value,
                        'completion_percentage': goal.completion_percentage,
                        'target_date': goal.target_date.isoformat(),
                        'is_overdue': goal.target_date < datetime.now() and goal.status != GoalStatus.COMPLETED
                    }
                    for goal in goals
                ],
                'skill_improvements': skill_improvements,
                'recent_progress': [
                    {
                        'id': entry.id,
                        'goal_id': entry.goal_id,
                        'entry_date': entry.entry_date.isoformat(),
                        'progress_value': entry.progress_value,
                        'notes': entry.notes,
                        'mentor_feedback': entry.mentor_feedback
                    }
                    for entry in recent_progress
                ]
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating progress report: {e}")
            return {}

    def get_mentorship_analytics(self, mentorship_id: str) -> Dict:
        """Get comprehensive mentorship analytics"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Goal analytics
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_goals,
                            AVG(completion_percentage) as avg_completion,
                            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals,
                            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_goals,
                            COUNT(CASE WHEN target_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue_goals
                        FROM mentorship_goals 
                        WHERE mentorship_id = %s
                    """, (mentorship_id,))
                    
                    goal_stats = cursor.fetchone()
                    
                    # Progress analytics
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_progress_entries,
                            AVG(progress_value) as avg_progress_value,
                            COUNT(DISTINCT goal_id) as goals_with_progress
                        FROM progress_entries pe
                        JOIN mentorship_goals mg ON pe.goal_id = mg.id
                        WHERE mg.mentorship_id = %s
                    """, (mentorship_id,))
                    
                    progress_stats = cursor.fetchone()
                    
                    # Skill analytics
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_skills_assessed,
                            AVG(current_level - initial_level) as avg_skill_improvement,
                            AVG(current_level) as avg_current_level,
                            AVG(target_level) as avg_target_level
                        FROM skill_assessments 
                        WHERE mentorship_id = %s
                    """, (mentorship_id,))
                    
                    skill_stats = cursor.fetchone()
                    
                    analytics = {
                        'mentorship_id': mentorship_id,
                        'goal_analytics': dict(goal_stats) if goal_stats else {},
                        'progress_analytics': dict(progress_stats) if progress_stats else {},
                        'skill_analytics': dict(skill_stats) if skill_stats else {},
                        'generated_at': datetime.now().isoformat()
                    }
                    
                    return analytics
                    
        except Exception as e:
            logger.error(f"Error getting mentorship analytics: {e}")
            return {}

    def update_goal_status(self, goal_id: str, new_status: GoalStatus, notes: str = "") -> bool:
        """Update goal status"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE mentorship_goals 
                        SET status = %s, 
                            updated_date = %s,
                            completion_percentage = CASE 
                                WHEN %s = 'completed' THEN 100
                                WHEN %s = 'cancelled' THEN 0
                                ELSE completion_percentage
                            END
                        WHERE id = %s
                    """, (new_status.value, datetime.now(), new_status.value, new_status.value, goal_id))
                    
                    # Add status change note
                    if notes:
                        cursor.execute("""
                            INSERT INTO progress_entries 
                            (id, goal_id, entry_date, progress_value, metric_type, notes, created_by)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (
                            str(uuid.uuid4()),
                            goal_id,
                            datetime.now(),
                            100 if new_status == GoalStatus.COMPLETED else 0,
                            ProgressMetric.QUALITATIVE.value,
                            f"Status changed to {new_status.value}: {notes}",
                            'system'
                        ))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error updating goal status: {e}")
            return False

    def update_milestone_status(self, milestone_id: str, new_status: MilestoneStatus, 
                               completion_percentage: float = None) -> bool:
        """Update milestone status"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    if completion_percentage is not None:
                        cursor.execute("""
                            UPDATE goal_milestones 
                            SET status = %s, 
                                completion_percentage = %s,
                                updated_date = %s
                            WHERE id = %s
                        """, (new_status.value, completion_percentage, datetime.now(), milestone_id))
                    else:
                        cursor.execute("""
                            UPDATE goal_milestones 
                            SET status = %s, 
                                completion_percentage = CASE 
                                    WHEN %s = 'completed' THEN 100
                                    ELSE completion_percentage
                                END,
                                updated_date = %s
                            WHERE id = %s
                        """, (new_status.value, new_status.value, datetime.now(), milestone_id))
                    
                    # Update parent goal progress
                    cursor.execute("""
                        SELECT goal_id FROM goal_milestones WHERE id = %s
                    """, (milestone_id,))
                    
                    result = cursor.fetchone()
                    if result:
                        self.update_goal_progress(result[0])
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error updating milestone status: {e}")
            return False
