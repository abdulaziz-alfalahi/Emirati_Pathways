"""
Mentorship Program Management System for Emirati Journey Platform
Comprehensive program management, session tracking, and progress monitoring
"""

import logging
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
# Qwen / DashScope client (replaces google.generativeai)
try:
    from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
    from backend.config.qwen_config import DASHSCOPE_API_KEY
    _qwen_available = bool(DASHSCOPE_API_KEY)
except ImportError:
    _qwen_available = False
from collections import defaultdict
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Qwen AI
try:

    # Model initialized via qwen_client (lazy-loaded)
    logger.info("✅ Qwen / DashScope configured successfully")
except Exception as e:
    logger.error(f"❌ Failed to configure Gemini: {e}")
    model = None

class ProgramStatus(Enum):
    """Mentorship program status"""
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class SessionStatus(Enum):
    """Mentorship session status"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"

class SessionType(Enum):
    """Types of mentorship sessions"""
    INITIAL_MEETING = "initial_meeting"
    GOAL_SETTING = "goal_setting"
    SKILL_DEVELOPMENT = "skill_development"
    CAREER_GUIDANCE = "career_guidance"
    PROGRESS_REVIEW = "progress_review"
    NETWORKING = "networking"
    INTERVIEW_PREP = "interview_prep"
    LEADERSHIP_COACHING = "leadership_coaching"
    CULTURAL_INTEGRATION = "cultural_integration"
    FINAL_EVALUATION = "final_evaluation"

class ProgressLevel(Enum):
    """Progress tracking levels"""
    NOT_STARTED = "not_started"
    BEGINNING = "beginning"
    DEVELOPING = "developing"
    PROFICIENT = "proficient"
    ADVANCED = "advanced"
    EXPERT = "expert"

@dataclass
class MentorshipGoal:
    """Individual mentorship goal"""
    goal_id: str
    title: str
    description: str
    category: str
    target_date: datetime
    priority: str  # high, medium, low
    success_criteria: List[str]
    current_progress: float  # 0-100
    progress_level: ProgressLevel
    milestones: List[Dict[str, Any]]
    resources_needed: List[str]
    mentor_notes: str
    mentee_notes: str
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'goal_id': self.goal_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'target_date': self.target_date.isoformat(),
            'priority': self.priority,
            'success_criteria': self.success_criteria,
            'current_progress': self.current_progress,
            'progress_level': self.progress_level.value,
            'milestones': self.milestones,
            'resources_needed': self.resources_needed,
            'mentor_notes': self.mentor_notes,
            'mentee_notes': self.mentee_notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

@dataclass
class MentorshipSession:
    """Individual mentorship session"""
    session_id: str
    program_id: str
    mentor_id: str
    mentee_id: str
    session_type: SessionType
    title: str
    description: str
    scheduled_date: datetime
    duration_minutes: int
    status: SessionStatus
    location: str  # virtual, in-person, phone
    meeting_link: Optional[str]
    agenda: List[str]
    objectives: List[str]
    pre_session_prep: List[str]
    session_notes: str
    mentor_feedback: str
    mentee_feedback: str
    action_items: List[Dict[str, Any]]
    resources_shared: List[str]
    next_session_topics: List[str]
    rating_mentor: Optional[float]  # 1-5
    rating_mentee: Optional[float]  # 1-5
    attendance_mentor: bool
    attendance_mentee: bool
    recording_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'session_id': self.session_id,
            'program_id': self.program_id,
            'mentor_id': self.mentor_id,
            'mentee_id': self.mentee_id,
            'session_type': self.session_type.value,
            'title': self.title,
            'description': self.description,
            'scheduled_date': self.scheduled_date.isoformat(),
            'duration_minutes': self.duration_minutes,
            'status': self.status.value,
            'location': self.location,
            'meeting_link': self.meeting_link,
            'agenda': self.agenda,
            'objectives': self.objectives,
            'pre_session_prep': self.pre_session_prep,
            'session_notes': self.session_notes,
            'mentor_feedback': self.mentor_feedback,
            'mentee_feedback': self.mentee_feedback,
            'action_items': self.action_items,
            'resources_shared': self.resources_shared,
            'next_session_topics': self.next_session_topics,
            'rating_mentor': self.rating_mentor,
            'rating_mentee': self.rating_mentee,
            'attendance_mentor': self.attendance_mentor,
            'attendance_mentee': self.attendance_mentee,
            'recording_url': self.recording_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

@dataclass
class MentorshipProgram:
    """Complete mentorship program"""
    program_id: str
    mentor_id: str
    mentee_id: str
    program_name: str
    description: str
    start_date: datetime
    end_date: datetime
    status: ProgramStatus
    program_type: str  # career_development, leadership, technical_skills, etc.
    focus_areas: List[str]
    goals: List[MentorshipGoal]
    sessions: List[MentorshipSession]
    overall_progress: float  # 0-100
    success_metrics: Dict[str, Any]
    mentor_commitment: str
    mentee_commitment: str
    meeting_frequency: str  # weekly, bi-weekly, monthly
    communication_preferences: List[str]
    resources_provided: List[str]
    program_notes: str
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'program_id': self.program_id,
            'mentor_id': self.mentor_id,
            'mentee_id': self.mentee_id,
            'program_name': self.program_name,
            'description': self.description,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'status': self.status.value,
            'program_type': self.program_type,
            'focus_areas': self.focus_areas,
            'goals': [goal.to_dict() for goal in self.goals],
            'sessions': [session.to_dict() for session in self.sessions],
            'overall_progress': self.overall_progress,
            'success_metrics': self.success_metrics,
            'mentor_commitment': self.mentor_commitment,
            'mentee_commitment': self.mentee_commitment,
            'meeting_frequency': self.meeting_frequency,
            'communication_preferences': self.communication_preferences,
            'resources_provided': self.resources_provided,
            'program_notes': self.program_notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

@dataclass
class ProgressReport:
    """Progress report for mentorship program"""
    report_id: str
    program_id: str
    reporting_period: str
    overall_progress: float
    goals_progress: Dict[str, float]
    sessions_completed: int
    sessions_scheduled: int
    attendance_rate: float
    engagement_score: float
    mentor_satisfaction: float
    mentee_satisfaction: float
    key_achievements: List[str]
    challenges_faced: List[str]
    recommendations: List[str]
    next_steps: List[str]
    ai_insights: str
    generated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'report_id': self.report_id,
            'program_id': self.program_id,
            'reporting_period': self.reporting_period,
            'overall_progress': self.overall_progress,
            'goals_progress': self.goals_progress,
            'sessions_completed': self.sessions_completed,
            'sessions_scheduled': self.sessions_scheduled,
            'attendance_rate': self.attendance_rate,
            'engagement_score': self.engagement_score,
            'mentor_satisfaction': self.mentor_satisfaction,
            'mentee_satisfaction': self.mentee_satisfaction,
            'key_achievements': self.key_achievements,
            'challenges_faced': self.challenges_faced,
            'recommendations': self.recommendations,
            'next_steps': self.next_steps,
            'ai_insights': self.ai_insights,
            'generated_at': self.generated_at.isoformat()
        }

class MentorshipProgramManager:
    """Comprehensive mentorship program management system"""
    
    def __init__(self):
        """Initialize the program manager"""
        self.programs: Dict[str, MentorshipProgram] = {}
        self.sessions: Dict[str, MentorshipSession] = {}
        self.goals: Dict[str, MentorshipGoal] = {}
        self.progress_reports: Dict[str, ProgressReport] = {}
        
        # Initialize sample data
        self._initialize_sample_programs()
        
        logger.info("✅ Mentorship Program Manager initialized successfully")
    
    def _initialize_sample_programs(self):
        """Initialize sample mentorship programs"""
        try:
            # Sample Program 1: Tech Leadership Development
            program_id_1 = "prog_001"
            mentor_id_1 = "mentor_001"
            mentee_id_1 = "mentee_001"
            
            # Create goals for program 1
            goal_1 = MentorshipGoal(
                goal_id="goal_001",
                title="Develop Technical Leadership Skills",
                description="Build confidence and skills in leading technical teams",
                category="leadership",
                target_date=datetime.utcnow() + timedelta(days=180),
                priority="high",
                success_criteria=[
                    "Lead a technical project successfully",
                    "Mentor junior developers",
                    "Present technical solutions to stakeholders"
                ],
                current_progress=35.0,
                progress_level=ProgressLevel.DEVELOPING,
                milestones=[
                    {"title": "Complete leadership assessment", "completed": True, "date": "2024-01-15"},
                    {"title": "Lead first team meeting", "completed": True, "date": "2024-02-01"},
                    {"title": "Present project proposal", "completed": False, "target_date": "2024-03-15"}
                ],
                resources_needed=["Leadership books", "Project management tools", "Presentation training"],
                mentor_notes="Sara shows great potential in technical leadership. Focus on building confidence.",
                mentee_notes="Feeling more confident after recent team meetings. Need help with stakeholder presentations.",
                created_at=datetime.utcnow() - timedelta(days=60),
                updated_at=datetime.utcnow() - timedelta(days=5)
            )
            
            goal_2 = MentorshipGoal(
                goal_id="goal_002",
                title="Master Advanced Programming Concepts",
                description="Deepen understanding of system architecture and design patterns",
                category="technical_skills",
                target_date=datetime.utcnow() + timedelta(days=120),
                priority="medium",
                success_criteria=[
                    "Design scalable system architecture",
                    "Implement advanced design patterns",
                    "Optimize system performance"
                ],
                current_progress=60.0,
                progress_level=ProgressLevel.PROFICIENT,
                milestones=[
                    {"title": "Complete system design course", "completed": True, "date": "2024-01-30"},
                    {"title": "Implement microservices architecture", "completed": True, "date": "2024-02-15"},
                    {"title": "Performance optimization project", "completed": False, "target_date": "2024-03-30"}
                ],
                resources_needed=["System design resources", "Code review sessions", "Performance monitoring tools"],
                mentor_notes="Excellent progress on technical skills. Ready for more complex challenges.",
                mentee_notes="Really enjoying the system design work. Want to focus more on performance optimization.",
                created_at=datetime.utcnow() - timedelta(days=60),
                updated_at=datetime.utcnow() - timedelta(days=3)
            )
            
            # Create sample sessions
            session_1 = MentorshipSession(
                session_id="sess_001",
                program_id=program_id_1,
                mentor_id=mentor_id_1,
                mentee_id=mentee_id_1,
                session_type=SessionType.INITIAL_MEETING,
                title="Program Kickoff and Goal Setting",
                description="Initial meeting to establish goals and expectations",
                scheduled_date=datetime.utcnow() - timedelta(days=50),
                duration_minutes=90,
                status=SessionStatus.COMPLETED,
                location="virtual",
                meeting_link="https://meet.google.com/abc-def-ghi",
                agenda=[
                    "Introductions and background sharing",
                    "Discuss career goals and aspirations",
                    "Set program expectations",
                    "Create initial development plan"
                ],
                objectives=[
                    "Establish rapport and trust",
                    "Define clear program goals",
                    "Create action plan for first month"
                ],
                pre_session_prep=[
                    "Complete career assessment",
                    "Prepare questions about leadership",
                    "Review current project portfolio"
                ],
                session_notes="Excellent first meeting. Sara is highly motivated and has clear career goals. Strong technical foundation with desire to grow into leadership role.",
                mentor_feedback="Sara demonstrated strong technical knowledge and clear communication. Excited to work together on leadership development.",
                mentee_feedback="Dr. Ahmed is very knowledgeable and approachable. Looking forward to learning from his experience in tech leadership.",
                action_items=[
                    {"task": "Complete leadership style assessment", "owner": "mentee", "due_date": "2024-01-20", "status": "completed"},
                    {"task": "Share recommended leadership resources", "owner": "mentor", "due_date": "2024-01-18", "status": "completed"},
                    {"task": "Schedule next session", "owner": "both", "due_date": "2024-01-16", "status": "completed"}
                ],
                resources_shared=[
                    "Leadership assessment tool",
                    "Recommended reading list",
                    "UAE tech industry insights"
                ],
                next_session_topics=["Leadership styles", "Team dynamics", "Technical communication"],
                rating_mentor=5.0,
                rating_mentee=5.0,
                attendance_mentor=True,
                attendance_mentee=True,
                recording_url=None,
                created_at=datetime.utcnow() - timedelta(days=50),
                updated_at=datetime.utcnow() - timedelta(days=48)
            )
            
            session_2 = MentorshipSession(
                session_id="sess_002",
                program_id=program_id_1,
                mentor_id=mentor_id_1,
                mentee_id=mentee_id_1,
                session_type=SessionType.SKILL_DEVELOPMENT,
                title="Technical Leadership and Team Management",
                description="Focus on building technical leadership skills and team management techniques",
                scheduled_date=datetime.utcnow() - timedelta(days=30),
                duration_minutes=60,
                status=SessionStatus.COMPLETED,
                location="virtual",
                meeting_link="https://meet.google.com/abc-def-ghi",
                agenda=[
                    "Review progress on leadership goals",
                    "Discuss team management challenges",
                    "Practice technical communication",
                    "Plan upcoming project leadership opportunity"
                ],
                objectives=[
                    "Improve team management skills",
                    "Enhance technical communication",
                    "Build confidence in leadership role"
                ],
                pre_session_prep=[
                    "Reflect on recent team interactions",
                    "Prepare questions about conflict resolution",
                    "Review project requirements"
                ],
                session_notes="Great progress on leadership development. Sara successfully led her first team meeting and received positive feedback. Discussed strategies for handling technical disagreements.",
                mentor_feedback="Sara is showing real growth in confidence and leadership presence. Her technical communication has improved significantly.",
                mentee_feedback="Very helpful session on team dynamics. The conflict resolution strategies will be useful for upcoming project challenges.",
                action_items=[
                    {"task": "Lead weekly team standup", "owner": "mentee", "due_date": "2024-02-15", "status": "completed"},
                    {"task": "Practice presentation for stakeholders", "owner": "mentee", "due_date": "2024-02-20", "status": "in_progress"},
                    {"task": "Share conflict resolution framework", "owner": "mentor", "due_date": "2024-02-05", "status": "completed"}
                ],
                resources_shared=[
                    "Team management best practices",
                    "Technical presentation templates",
                    "Conflict resolution guide"
                ],
                next_session_topics=["Stakeholder communication", "Project planning", "Performance management"],
                rating_mentor=4.8,
                rating_mentee=4.9,
                attendance_mentor=True,
                attendance_mentee=True,
                recording_url=None,
                created_at=datetime.utcnow() - timedelta(days=30),
                updated_at=datetime.utcnow() - timedelta(days=28)
            )
            
            # Create program 1
            program_1 = MentorshipProgram(
                program_id=program_id_1,
                mentor_id=mentor_id_1,
                mentee_id=mentee_id_1,
                program_name="Tech Leadership Development Program",
                description="Comprehensive program to develop technical leadership skills for emerging UAE tech leaders",
                start_date=datetime.utcnow() - timedelta(days=60),
                end_date=datetime.utcnow() + timedelta(days=180),
                status=ProgramStatus.ACTIVE,
                program_type="leadership_development",
                focus_areas=["technical_leadership", "team_management", "stakeholder_communication", "career_advancement"],
                goals=[goal_1, goal_2],
                sessions=[session_1, session_2],
                overall_progress=47.5,
                success_metrics={
                    "leadership_confidence": 8.2,
                    "technical_skills": 8.7,
                    "communication_skills": 7.9,
                    "team_management": 7.5,
                    "goal_achievement": 47.5
                },
                mentor_commitment="2 hours per week",
                mentee_commitment="3 hours per week including prep time",
                meeting_frequency="bi-weekly",
                communication_preferences=["video calls", "email", "slack"],
                resources_provided=[
                    "Leadership assessment tools",
                    "Technical resources library",
                    "Industry networking opportunities",
                    "Project mentorship"
                ],
                program_notes="Excellent progress so far. Sara is highly engaged and showing strong leadership potential. Focus areas for next phase: stakeholder communication and strategic thinking.",
                created_at=datetime.utcnow() - timedelta(days=60),
                updated_at=datetime.utcnow() - timedelta(days=1)
            )
            
            # Store program and related data
            self.programs[program_id_1] = program_1
            self.goals[goal_1.goal_id] = goal_1
            self.goals[goal_2.goal_id] = goal_2
            self.sessions[session_1.session_id] = session_1
            self.sessions[session_2.session_id] = session_2
            
            logger.info("✅ Sample mentorship programs initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing sample programs: {str(e)}")
    
    def create_program(self, mentor_id: str, mentee_id: str, program_data: Dict[str, Any]) -> MentorshipProgram:
        """Create a new mentorship program"""
        try:
            program_id = f"prog_{uuid.uuid4().hex[:8]}"
            
            # Create initial goals if provided
            goals = []
            if 'goals' in program_data:
                for goal_data in program_data['goals']:
                    goal = self._create_goal(program_id, goal_data)
                    goals.append(goal)
                    self.goals[goal.goal_id] = goal
            
            # Create program
            program = MentorshipProgram(
                program_id=program_id,
                mentor_id=mentor_id,
                mentee_id=mentee_id,
                program_name=program_data['program_name'],
                description=program_data.get('description', ''),
                start_date=datetime.fromisoformat(program_data['start_date']),
                end_date=datetime.fromisoformat(program_data['end_date']),
                status=ProgramStatus.PENDING,
                program_type=program_data.get('program_type', 'general'),
                focus_areas=program_data.get('focus_areas', []),
                goals=goals,
                sessions=[],
                overall_progress=0.0,
                success_metrics=program_data.get('success_metrics', {}),
                mentor_commitment=program_data.get('mentor_commitment', ''),
                mentee_commitment=program_data.get('mentee_commitment', ''),
                meeting_frequency=program_data.get('meeting_frequency', 'bi-weekly'),
                communication_preferences=program_data.get('communication_preferences', ['video calls']),
                resources_provided=program_data.get('resources_provided', []),
                program_notes='',
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.programs[program_id] = program
            
            # Generate AI-powered program recommendations
            if model:
                ai_recommendations = self._generate_program_recommendations(program)
                program.program_notes = f"AI Recommendations: {ai_recommendations}"
            
            logger.info(f"✅ Created mentorship program: {program_id}")
            return program
            
        except Exception as e:
            logger.error(f"❌ Error creating program: {str(e)}")
            raise
    
    def _create_goal(self, program_id: str, goal_data: Dict[str, Any]) -> MentorshipGoal:
        """Create a mentorship goal"""
        goal_id = f"goal_{uuid.uuid4().hex[:8]}"
        
        return MentorshipGoal(
            goal_id=goal_id,
            title=goal_data['title'],
            description=goal_data.get('description', ''),
            category=goal_data.get('category', 'general'),
            target_date=datetime.fromisoformat(goal_data['target_date']),
            priority=goal_data.get('priority', 'medium'),
            success_criteria=goal_data.get('success_criteria', []),
            current_progress=0.0,
            progress_level=ProgressLevel.NOT_STARTED,
            milestones=goal_data.get('milestones', []),
            resources_needed=goal_data.get('resources_needed', []),
            mentor_notes='',
            mentee_notes='',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    def schedule_session(self, program_id: str, session_data: Dict[str, Any]) -> MentorshipSession:
        """Schedule a new mentorship session"""
        try:
            if program_id not in self.programs:
                raise ValueError(f"Program {program_id} not found")
            
            program = self.programs[program_id]
            session_id = f"sess_{uuid.uuid4().hex[:8]}"
            
            session = MentorshipSession(
                session_id=session_id,
                program_id=program_id,
                mentor_id=program.mentor_id,
                mentee_id=program.mentee_id,
                session_type=SessionType(session_data.get('session_type', 'career_guidance')),
                title=session_data['title'],
                description=session_data.get('description', ''),
                scheduled_date=datetime.fromisoformat(session_data['scheduled_date']),
                duration_minutes=session_data.get('duration_minutes', 60),
                status=SessionStatus.SCHEDULED,
                location=session_data.get('location', 'virtual'),
                meeting_link=session_data.get('meeting_link'),
                agenda=session_data.get('agenda', []),
                objectives=session_data.get('objectives', []),
                pre_session_prep=session_data.get('pre_session_prep', []),
                session_notes='',
                mentor_feedback='',
                mentee_feedback='',
                action_items=[],
                resources_shared=[],
                next_session_topics=[],
                rating_mentor=None,
                rating_mentee=None,
                attendance_mentor=False,
                attendance_mentee=False,
                recording_url=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.sessions[session_id] = session
            program.sessions.append(session)
            program.updated_at = datetime.utcnow()
            
            logger.info(f"✅ Scheduled session: {session_id}")
            return session
            
        except Exception as e:
            logger.error(f"❌ Error scheduling session: {str(e)}")
            raise
    
    def update_session(self, session_id: str, updates: Dict[str, Any]) -> MentorshipSession:
        """Update a mentorship session"""
        try:
            if session_id not in self.sessions:
                raise ValueError(f"Session {session_id} not found")
            
            session = self.sessions[session_id]
            
            # Update fields
            for field, value in updates.items():
                if hasattr(session, field):
                    if field == 'session_type':
                        setattr(session, field, SessionType(value))
                    elif field == 'status':
                        setattr(session, field, SessionStatus(value))
                    elif field == 'scheduled_date':
                        setattr(session, field, datetime.fromisoformat(value))
                    else:
                        setattr(session, field, value)
            
            session.updated_at = datetime.utcnow()
            
            # Update program
            program = self.programs[session.program_id]
            program.updated_at = datetime.utcnow()
            
            logger.info(f"✅ Updated session: {session_id}")
            return session
            
        except Exception as e:
            logger.error(f"❌ Error updating session: {str(e)}")
            raise
    
    def update_goal_progress(self, goal_id: str, progress_data: Dict[str, Any]) -> MentorshipGoal:
        """Update goal progress"""
        try:
            if goal_id not in self.goals:
                raise ValueError(f"Goal {goal_id} not found")
            
            goal = self.goals[goal_id]
            
            # Update progress
            if 'current_progress' in progress_data:
                goal.current_progress = progress_data['current_progress']
            
            if 'progress_level' in progress_data:
                goal.progress_level = ProgressLevel(progress_data['progress_level'])
            
            if 'mentor_notes' in progress_data:
                goal.mentor_notes = progress_data['mentor_notes']
            
            if 'mentee_notes' in progress_data:
                goal.mentee_notes = progress_data['mentee_notes']
            
            if 'milestones' in progress_data:
                goal.milestones = progress_data['milestones']
            
            goal.updated_at = datetime.utcnow()
            
            # Update overall program progress
            self._update_program_progress(goal_id)
            
            logger.info(f"✅ Updated goal progress: {goal_id}")
            return goal
            
        except Exception as e:
            logger.error(f"❌ Error updating goal progress: {str(e)}")
            raise
    
    def _update_program_progress(self, goal_id: str):
        """Update overall program progress based on goal progress"""
        try:
            # Find program containing this goal
            program = None
            for prog in self.programs.values():
                if any(g.goal_id == goal_id for g in prog.goals):
                    program = prog
                    break
            
            if program:
                # Calculate overall progress as average of goal progress
                if program.goals:
                    total_progress = sum(goal.current_progress for goal in program.goals)
                    program.overall_progress = total_progress / len(program.goals)
                    program.updated_at = datetime.utcnow()
                    
        except Exception as e:
            logger.error(f"❌ Error updating program progress: {str(e)}")
    
    def generate_progress_report(self, program_id: str, period: str = "monthly") -> ProgressReport:
        """Generate comprehensive progress report"""
        try:
            if program_id not in self.programs:
                raise ValueError(f"Program {program_id} not found")
            
            program = self.programs[program_id]
            report_id = f"report_{uuid.uuid4().hex[:8]}"
            
            # Calculate metrics
            completed_sessions = len([s for s in program.sessions if s.status == SessionStatus.COMPLETED])
            scheduled_sessions = len(program.sessions)
            
            attendance_rate = 0.0
            if completed_sessions > 0:
                attended_sessions = len([s for s in program.sessions 
                                       if s.status == SessionStatus.COMPLETED and s.attendance_mentor and s.attendance_mentee])
                attendance_rate = (attended_sessions / completed_sessions) * 100
            
            # Calculate engagement score
            engagement_score = self._calculate_engagement_score(program)
            
            # Calculate satisfaction scores
            mentor_ratings = [s.rating_mentor for s in program.sessions if s.rating_mentor]
            mentee_ratings = [s.rating_mentee for s in program.sessions if s.rating_mentee]
            
            mentor_satisfaction = sum(mentor_ratings) / len(mentor_ratings) if mentor_ratings else 0.0
            mentee_satisfaction = sum(mentee_ratings) / len(mentee_ratings) if mentee_ratings else 0.0
            
            # Goals progress
            goals_progress = {goal.title: goal.current_progress for goal in program.goals}
            
            # Generate AI insights
            ai_insights = self._generate_ai_insights(program) if model else "AI insights unavailable"
            
            # Key achievements and challenges
            key_achievements = self._extract_achievements(program)
            challenges_faced = self._extract_challenges(program)
            recommendations = self._generate_recommendations(program)
            next_steps = self._generate_next_steps(program)
            
            report = ProgressReport(
                report_id=report_id,
                program_id=program_id,
                reporting_period=period,
                overall_progress=program.overall_progress,
                goals_progress=goals_progress,
                sessions_completed=completed_sessions,
                sessions_scheduled=scheduled_sessions,
                attendance_rate=attendance_rate,
                engagement_score=engagement_score,
                mentor_satisfaction=mentor_satisfaction,
                mentee_satisfaction=mentee_satisfaction,
                key_achievements=key_achievements,
                challenges_faced=challenges_faced,
                recommendations=recommendations,
                next_steps=next_steps,
                ai_insights=ai_insights,
                generated_at=datetime.utcnow()
            )
            
            self.progress_reports[report_id] = report
            
            logger.info(f"✅ Generated progress report: {report_id}")
            return report
            
        except Exception as e:
            logger.error(f"❌ Error generating progress report: {str(e)}")
            raise
    
    def _calculate_engagement_score(self, program: MentorshipProgram) -> float:
        """Calculate engagement score based on various factors"""
        try:
            score = 0.0
            factors = 0
            
            # Session attendance
            if program.sessions:
                completed_sessions = len([s for s in program.sessions if s.status == SessionStatus.COMPLETED])
                attendance_factor = (completed_sessions / len(program.sessions)) * 100
                score += attendance_factor
                factors += 1
            
            # Goal progress
            if program.goals:
                avg_goal_progress = sum(goal.current_progress for goal in program.goals) / len(program.goals)
                score += avg_goal_progress
                factors += 1
            
            # Feedback quality (based on notes length as proxy)
            feedback_scores = []
            for session in program.sessions:
                if session.mentor_feedback and session.mentee_feedback:
                    feedback_score = min(100, (len(session.mentor_feedback) + len(session.mentee_feedback)) / 10)
                    feedback_scores.append(feedback_score)
            
            if feedback_scores:
                avg_feedback_score = sum(feedback_scores) / len(feedback_scores)
                score += avg_feedback_score
                factors += 1
            
            return score / factors if factors > 0 else 0.0
            
        except Exception as e:
            logger.error(f"❌ Error calculating engagement score: {str(e)}")
            return 0.0
    
    def _generate_program_recommendations(self, program: MentorshipProgram) -> str:
        """Generate AI-powered program recommendations"""
        try:
            if not model:
                return "AI recommendations unavailable"
            
            prompt = f"""
            Analyze this mentorship program and provide recommendations for success:
            
            PROGRAM DETAILS:
            - Name: {program.program_name}
            - Type: {program.program_type}
            - Duration: {(program.end_date - program.start_date).days} days
            - Focus Areas: {program.focus_areas}
            - Meeting Frequency: {program.meeting_frequency}
            - Goals: {len(program.goals)} goals defined
            
            Provide specific recommendations for:
            1. Program structure and pacing
            2. Key success factors to focus on
            3. Potential challenges and mitigation strategies
            4. UAE cultural considerations
            5. Resource recommendations
            
            Keep recommendations practical and actionable (max 200 words).
            """
            
            messages = [

            
                {"role": "system", "content": "You are an expert AI assistant for the UAE job market. Return ONLY raw, valid JSON. No markdown, no code fences."},

            
                {"role": "user", "content": prompt},

            
            ]

            
            response = chat_completion(task_type="explain", messages=messages, response_format={"type": "json_object"})
            return str(response) if response else "AI recommendations could not be generated"
            
        except Exception as e:
            logger.error(f"❌ Error generating program recommendations: {str(e)}")
            return f"AI recommendations error: {str(e)}"
    
    def _generate_ai_insights(self, program: MentorshipProgram) -> str:
        """Generate AI insights for progress report"""
        try:
            if not model:
                return "AI insights unavailable"
            
            # Prepare program data for analysis
            sessions_summary = f"{len(program.sessions)} sessions, {len([s for s in program.sessions if s.status == SessionStatus.COMPLETED])} completed"
            goals_summary = f"{len(program.goals)} goals, average progress: {sum(g.current_progress for g in program.goals) / len(program.goals) if program.goals else 0:.1f}%"
            
            prompt = f"""
            Analyze this mentorship program progress and provide insights:
            
            PROGRAM STATUS:
            - Overall Progress: {program.overall_progress:.1f}%
            - Sessions: {sessions_summary}
            - Goals: {goals_summary}
            - Duration: {(datetime.utcnow() - program.start_date).days} days active
            - Status: {program.status.value}
            
            RECENT SESSION FEEDBACK:
            {program.sessions[-1].mentor_feedback if program.sessions else "No sessions yet"}
            
            Provide insights on:
            1. Progress assessment and trends
            2. Strengths and areas for improvement
            3. Recommendations for next phase
            4. Success probability prediction
            
            Keep insights concise and actionable (max 150 words).
            """
            
            messages = [

            
                {"role": "system", "content": "You are an expert AI assistant for the UAE job market. Return ONLY raw, valid JSON. No markdown, no code fences."},

            
                {"role": "user", "content": prompt},

            
            ]

            
            response = chat_completion(task_type="explain", messages=messages, response_format={"type": "json_object"})
            return str(response) if response else "AI insights could not be generated"
            
        except Exception as e:
            logger.error(f"❌ Error generating AI insights: {str(e)}")
            return f"AI insights error: {str(e)}"
    
    def _extract_achievements(self, program: MentorshipProgram) -> List[str]:
        """Extract key achievements from program"""
        achievements = []
        
        # Goal-based achievements
        for goal in program.goals:
            if goal.current_progress >= 50:
                achievements.append(f"Significant progress on {goal.title} ({goal.current_progress:.1f}%)")
            
            # Milestone achievements
            completed_milestones = [m for m in goal.milestones if m.get('completed', False)]
            if completed_milestones:
                achievements.append(f"Completed {len(completed_milestones)} milestones for {goal.title}")
        
        # Session-based achievements
        completed_sessions = len([s for s in program.sessions if s.status == SessionStatus.COMPLETED])
        if completed_sessions > 0:
            achievements.append(f"Successfully completed {completed_sessions} mentorship sessions")
        
        # High ratings
        high_rated_sessions = [s for s in program.sessions if s.rating_mentor and s.rating_mentor >= 4.5]
        if high_rated_sessions:
            achievements.append(f"Maintained high session quality with {len(high_rated_sessions)} highly-rated sessions")
        
        return achievements[:5]  # Top 5 achievements
    
    def _extract_challenges(self, program: MentorshipProgram) -> List[str]:
        """Extract challenges from program"""
        challenges = []
        
        # Low progress goals
        low_progress_goals = [g for g in program.goals if g.current_progress < 30]
        if low_progress_goals:
            challenges.append(f"Slow progress on {len(low_progress_goals)} goals")
        
        # Cancelled/missed sessions
        missed_sessions = len([s for s in program.sessions if s.status in [SessionStatus.CANCELLED, SessionStatus.NO_SHOW]])
        if missed_sessions > 0:
            challenges.append(f"{missed_sessions} sessions cancelled or missed")
        
        # Low engagement
        if program.overall_progress < 30 and (datetime.utcnow() - program.start_date).days > 30:
            challenges.append("Overall progress below expectations for program duration")
        
        return challenges[:3]  # Top 3 challenges
    
    def _generate_recommendations(self, program: MentorshipProgram) -> List[str]:
        """Generate recommendations based on program analysis"""
        recommendations = []
        
        # Progress-based recommendations
        if program.overall_progress < 40:
            recommendations.append("Consider increasing session frequency or adjusting goals")
        
        # Session-based recommendations
        if len(program.sessions) < 2:
            recommendations.append("Schedule regular sessions to maintain momentum")
        
        # Goal-based recommendations
        overdue_goals = [g for g in program.goals if g.target_date < datetime.utcnow() and g.current_progress < 100]
        if overdue_goals:
            recommendations.append("Review and adjust timelines for overdue goals")
        
        return recommendations[:3]  # Top 3 recommendations
    
    def _generate_next_steps(self, program: MentorshipProgram) -> List[str]:
        """Generate next steps for program"""
        next_steps = []
        
        # Upcoming sessions
        upcoming_sessions = [s for s in program.sessions if s.status == SessionStatus.SCHEDULED and s.scheduled_date > datetime.utcnow()]
        if upcoming_sessions:
            next_session = min(upcoming_sessions, key=lambda x: x.scheduled_date)
            next_steps.append(f"Prepare for upcoming session: {next_session.title}")
        else:
            next_steps.append("Schedule next mentorship session")
        
        # Goal milestones
        for goal in program.goals:
            incomplete_milestones = [m for m in goal.milestones if not m.get('completed', False)]
            if incomplete_milestones:
                next_milestone = incomplete_milestones[0]
                next_steps.append(f"Complete milestone: {next_milestone['title']}")
                break
        
        # Progress review
        if program.overall_progress >= 50:
            next_steps.append("Conduct mid-program progress review and goal adjustment")
        
        return next_steps[:3]  # Top 3 next steps
    
    def get_program_by_id(self, program_id: str) -> Optional[MentorshipProgram]:
        """Get program by ID"""
        return self.programs.get(program_id)
    
    def get_programs_by_mentor(self, mentor_id: str) -> List[MentorshipProgram]:
        """Get all programs for a mentor"""
        return [p for p in self.programs.values() if p.mentor_id == mentor_id]
    
    def get_programs_by_mentee(self, mentee_id: str) -> List[MentorshipProgram]:
        """Get all programs for a mentee"""
        return [p for p in self.programs.values() if p.mentee_id == mentee_id]
    
    def get_upcoming_sessions(self, user_id: str, days_ahead: int = 7) -> List[MentorshipSession]:
        """Get upcoming sessions for a user"""
        cutoff_date = datetime.utcnow() + timedelta(days=days_ahead)
        
        upcoming = []
        for session in self.sessions.values():
            if (session.status == SessionStatus.SCHEDULED and 
                session.scheduled_date <= cutoff_date and
                session.scheduled_date > datetime.utcnow() and
                (session.mentor_id == user_id or session.mentee_id == user_id)):
                upcoming.append(session)
        
        return sorted(upcoming, key=lambda x: x.scheduled_date)
    
    def get_system_analytics(self) -> Dict[str, Any]:
        """Get comprehensive system analytics"""
        try:
            total_programs = len(self.programs)
            active_programs = len([p for p in self.programs.values() if p.status == ProgramStatus.ACTIVE])
            completed_programs = len([p for p in self.programs.values() if p.status == ProgramStatus.COMPLETED])
            
            total_sessions = len(self.sessions)
            completed_sessions = len([s for s in self.sessions.values() if s.status == SessionStatus.COMPLETED])
            
            # Average progress
            avg_progress = sum(p.overall_progress for p in self.programs.values()) / total_programs if total_programs > 0 else 0
            
            # Success rate (programs with >70% progress)
            successful_programs = len([p for p in self.programs.values() if p.overall_progress >= 70])
            success_rate = (successful_programs / total_programs * 100) if total_programs > 0 else 0
            
            return {
                'total_programs': total_programs,
                'active_programs': active_programs,
                'completed_programs': completed_programs,
                'total_sessions': total_sessions,
                'completed_sessions': completed_sessions,
                'average_progress': round(avg_progress, 2),
                'success_rate': round(success_rate, 2),
                'session_completion_rate': round((completed_sessions / total_sessions * 100) if total_sessions > 0 else 0, 2),
                'total_goals': len(self.goals),
                'total_reports': len(self.progress_reports)
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting system analytics: {str(e)}")
            return {}

# Initialize global program manager
program_manager = MentorshipProgramManager()

logger.info("✅ Mentorship Program Management module loaded successfully")
