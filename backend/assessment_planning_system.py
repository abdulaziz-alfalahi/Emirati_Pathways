"""
Assessment Planning System for Emirati Journey Platform
Handles assessment template creation, scheduling, and management
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AssessmentTemplate:
    """Assessment template data structure"""
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    template_type: str = ""
    competency_framework: Dict = None
    assessment_criteria: Dict = None
    duration_minutes: int = 60
    passing_score: float = 70.0
    nqf_level: Optional[int] = None
    industry_sector: Optional[str] = None
    is_active: bool = True
    created_by: Optional[int] = None

@dataclass
class Assessment:
    """Assessment instance data structure"""
    id: Optional[int] = None
    assessment_code: str = ""
    template_id: int = 0
    candidate_id: int = 0
    assessor_id: int = 0
    assessment_title: str = ""
    assessment_purpose: str = ""
    scheduled_date: Optional[datetime] = None
    status: str = "scheduled"
    assessment_mode: str = "online"
    location: Optional[str] = None
    special_requirements: Optional[str] = None

@dataclass
class CompetencyModel:
    """Competency model data structure"""
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    competency_type: str = ""
    competency_definition: Dict = None
    assessment_methods: Dict = None
    proficiency_levels: Dict = None
    industry_relevance: List[str] = None
    nqf_alignment: Dict = None
    validation_criteria: Dict = None
    is_core_competency: bool = False

class AssessmentPlanningSystem:
    """Core system for assessment planning and management"""
    
    def __init__(self, db_connection_or_string):
        if isinstance(db_connection_or_string, str):
            self.db_connection_string = db_connection_or_string
            self.connection = None
            self._owns_connection = True
        else:
            # Accept a pre-existing psycopg2 connection
            self.db_connection_string = None
            self.connection = db_connection_or_string
            self._owns_connection = False
        
    def connect_db(self):
        """Establish database connection (no-op if connection already provided)"""
        if self.connection is not None:
            return
        try:
            self.connection = psycopg2.connect(
                self.db_connection_string,
                cursor_factory=RealDictCursor
            )
            self._owns_connection = True
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def close_db(self):
        """Close database connection (only if we created it)"""
        if self.connection and self._owns_connection:
            self.connection.close()
            self.connection = None
            logger.info("Database connection closed")
    
    def generate_assessment_code(self) -> str:
        """Generate unique assessment code"""
        timestamp = datetime.now().strftime("%Y%m%d")
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"ASS-{timestamp}-{unique_id}"
    
    # Assessment Template Management
    
    def create_assessment_template(self, template: AssessmentTemplate) -> Dict[str, Any]:
        """Create a new assessment template"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                INSERT INTO assessment_templates 
                (name, description, template_type, competency_framework, assessment_criteria,
                 duration_minutes, passing_score, nqf_level, industry_sector, is_active, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """
                
                cursor.execute(query, (
                    template.name,
                    template.description,
                    template.template_type,
                    json.dumps(template.competency_framework or {}),
                    json.dumps(template.assessment_criteria or {}),
                    template.duration_minutes,
                    template.passing_score,
                    template.nqf_level,
                    template.industry_sector,
                    template.is_active,
                    template.created_by
                ))
                
                result = cursor.fetchone()
                self.connection.commit()
                
                logger.info(f"Assessment template created with ID: {result['id']}")
                return {
                    "success": True,
                    "template_id": result["id"],
                    "created_at": result["created_at"],
                    "message": "Assessment template created successfully"
                }
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error creating assessment template: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create assessment template"
            }
    
    def get_assessment_templates(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Retrieve assessment templates with optional filters"""
        try:
            with self.connection.cursor() as cursor:
                base_query = """
                SELECT at.*, u.full_name as created_by_name
                FROM assessment_templates at
                LEFT JOIN users u ON at.created_by = u.id
                WHERE at.is_active = true
                """
                
                params = []
                
                if filters:
                    if filters.get('template_type'):
                        base_query += " AND at.template_type = %s"
                        params.append(filters['template_type'])
                    
                    if filters.get('industry_sector'):
                        base_query += " AND at.industry_sector = %s"
                        params.append(filters['industry_sector'])
                    
                    if filters.get('nqf_level'):
                        base_query += " AND at.nqf_level = %s"
                        params.append(filters['nqf_level'])
                
                base_query += " ORDER BY at.created_at DESC"
                
                cursor.execute(base_query, params)
                templates = cursor.fetchall()
                
                # Convert to list of dictionaries and parse JSON fields
                template_list = []
                for template in templates:
                    template_dict = dict(template)
                    template_dict['competency_framework'] = json.loads(template_dict.get('competency_framework', '{}'))
                    template_dict['assessment_criteria'] = json.loads(template_dict.get('assessment_criteria', '{}'))
                    template_list.append(template_dict)
                
                return {
                    "success": True,
                    "templates": template_list,
                    "count": len(template_list)
                }
                
        except Exception as e:
            logger.error(f"Error retrieving assessment templates: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve assessment templates"
            }
    
    def update_assessment_template(self, template_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing assessment template"""
        try:
            with self.connection.cursor() as cursor:
                # Build dynamic update query
                set_clauses = []
                params = []
                
                allowed_fields = [
                    'name', 'description', 'template_type', 'competency_framework',
                    'assessment_criteria', 'duration_minutes', 'passing_score',
                    'nqf_level', 'industry_sector', 'is_active'
                ]
                
                for field, value in updates.items():
                    if field in allowed_fields:
                        set_clauses.append(f"{field} = %s")
                        if field in ['competency_framework', 'assessment_criteria']:
                            params.append(json.dumps(value))
                        else:
                            params.append(value)
                
                if not set_clauses:
                    return {
                        "success": False,
                        "message": "No valid fields to update"
                    }
                
                params.append(template_id)
                
                query = f"""
                UPDATE assessment_templates 
                SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING updated_at
                """
                
                cursor.execute(query, params)
                result = cursor.fetchone()
                
                if result:
                    self.connection.commit()
                    logger.info(f"Assessment template {template_id} updated successfully")
                    return {
                        "success": True,
                        "updated_at": result["updated_at"],
                        "message": "Assessment template updated successfully"
                    }
                else:
                    return {
                        "success": False,
                        "message": "Assessment template not found"
                    }
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error updating assessment template: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to update assessment template"
            }
    
    # Assessment Management
    
    def create_assessment(self, assessment: Assessment) -> Dict[str, Any]:
        """Create a new assessment instance"""
        try:
            with self.connection.cursor() as cursor:
                # Generate assessment code if not provided
                if not assessment.assessment_code:
                    assessment.assessment_code = self.generate_assessment_code()
                
                query = """
                INSERT INTO assessments 
                (assessment_code, template_id, candidate_id, assessor_id, assessment_title,
                 assessment_purpose, scheduled_date, status, assessment_mode, location, special_requirements)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """
                
                cursor.execute(query, (
                    assessment.assessment_code,
                    assessment.template_id,
                    assessment.candidate_id,
                    assessment.assessor_id,
                    assessment.assessment_title,
                    assessment.assessment_purpose,
                    assessment.scheduled_date,
                    assessment.status,
                    assessment.assessment_mode,
                    assessment.location,
                    assessment.special_requirements
                ))
                
                result = cursor.fetchone()
                self.connection.commit()
                
                # Log audit trail
                self._log_audit_trail(
                    assessment_id=result["id"],
                    user_id=assessment.assessor_id,
                    action_type="created",
                    action_description=f"Assessment {assessment.assessment_code} created"
                )
                
                logger.info(f"Assessment created with ID: {result['id']}")
                return {
                    "success": True,
                    "assessment_id": result["id"],
                    "assessment_code": assessment.assessment_code,
                    "created_at": result["created_at"],
                    "message": "Assessment created successfully"
                }
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error creating assessment: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create assessment"
            }
    
    def get_assessments(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Retrieve assessments with optional filters"""
        try:
            with self.connection.cursor() as cursor:
                base_query = """
                SELECT a.*, 
                       at.name as template_name,
                       c.full_name as candidate_name,
                       c.email as candidate_email,
                       ass.full_name as assessor_name,
                       ass.email as assessor_email
                FROM assessments a
                LEFT JOIN assessment_templates at ON a.template_id = at.id
                LEFT JOIN users c ON a.candidate_id = c.id
                LEFT JOIN users ass ON a.assessor_id = ass.id
                WHERE 1=1
                """
                
                params = []
                
                if filters:
                    if filters.get('assessor_id'):
                        base_query += " AND a.assessor_id = %s"
                        params.append(filters['assessor_id'])
                    
                    if filters.get('candidate_id'):
                        base_query += " AND a.candidate_id = %s"
                        params.append(filters['candidate_id'])
                    
                    if filters.get('status'):
                        base_query += " AND a.status = %s"
                        params.append(filters['status'])
                    
                    if filters.get('date_from'):
                        base_query += " AND a.scheduled_date >= %s"
                        params.append(filters['date_from'])
                    
                    if filters.get('date_to'):
                        base_query += " AND a.scheduled_date <= %s"
                        params.append(filters['date_to'])
                
                base_query += " ORDER BY a.scheduled_date DESC"
                
                cursor.execute(base_query, params)
                assessments = cursor.fetchall()
                
                return {
                    "success": True,
                    "assessments": [dict(assessment) for assessment in assessments],
                    "count": len(assessments)
                }
                
        except Exception as e:
            logger.error(f"Error retrieving assessments: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve assessments"
            }
    
    def update_assessment_status(self, assessment_id: int, status: str, user_id: int, notes: str = None) -> Dict[str, Any]:
        """Update assessment status with audit logging"""
        try:
            with self.connection.cursor() as cursor:
                # Get current status for audit trail
                cursor.execute("SELECT status FROM assessments WHERE id = %s", (assessment_id,))
                current = cursor.fetchone()
                
                if not current:
                    return {
                        "success": False,
                        "message": "Assessment not found"
                    }
                
                old_status = current['status']
                
                # Update status
                query = """
                UPDATE assessments 
                SET status = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING updated_at
                """
                
                cursor.execute(query, (status, assessment_id))
                result = cursor.fetchone()
                
                if result:
                    self.connection.commit()
                    
                    # Log audit trail
                    self._log_audit_trail(
                        assessment_id=assessment_id,
                        user_id=user_id,
                        action_type="status_changed",
                        action_description=f"Status changed from {old_status} to {status}",
                        old_values={"status": old_status},
                        new_values={"status": status}
                    )
                    
                    logger.info(f"Assessment {assessment_id} status updated to {status}")
                    return {
                        "success": True,
                        "updated_at": result["updated_at"],
                        "message": f"Assessment status updated to {status}"
                    }
                else:
                    return {
                        "success": False,
                        "message": "Failed to update assessment status"
                    }
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error updating assessment status: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to update assessment status"
            }
    
    # Competency Model Management
    
    def create_competency_model(self, competency: CompetencyModel) -> Dict[str, Any]:
        """Create a new competency model"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                INSERT INTO competency_models 
                (name, description, competency_type, competency_definition, assessment_methods,
                 proficiency_levels, industry_relevance, nqf_alignment, validation_criteria, is_core_competency)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """
                
                cursor.execute(query, (
                    competency.name,
                    competency.description,
                    competency.competency_type,
                    json.dumps(competency.competency_definition or {}),
                    json.dumps(competency.assessment_methods or {}),
                    json.dumps(competency.proficiency_levels or {}),
                    competency.industry_relevance or [],
                    json.dumps(competency.nqf_alignment or {}),
                    json.dumps(competency.validation_criteria or {}),
                    competency.is_core_competency
                ))
                
                result = cursor.fetchone()
                self.connection.commit()
                
                logger.info(f"Competency model created with ID: {result['id']}")
                return {
                    "success": True,
                    "competency_id": result["id"],
                    "created_at": result["created_at"],
                    "message": "Competency model created successfully"
                }
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error creating competency model: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create competency model"
            }
    
    def get_competency_models(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Retrieve competency models with optional filters"""
        try:
            with self.connection.cursor() as cursor:
                base_query = """
                SELECT * FROM competency_models
                WHERE 1=1
                """
                
                params = []
                
                if filters:
                    if filters.get('competency_type'):
                        base_query += " AND competency_type = %s"
                        params.append(filters['competency_type'])
                    
                    if filters.get('is_core_competency') is not None:
                        base_query += " AND is_core_competency = %s"
                        params.append(filters['is_core_competency'])
                    
                    if filters.get('industry'):
                        base_query += " AND %s = ANY(industry_relevance)"
                        params.append(filters['industry'])
                
                base_query += " ORDER BY name"
                
                cursor.execute(base_query, params)
                competencies = cursor.fetchall()
                
                # Parse JSON fields
                competency_list = []
                for comp in competencies:
                    comp_dict = dict(comp)
                    comp_dict['competency_definition'] = json.loads(comp_dict.get('competency_definition', '{}'))
                    comp_dict['assessment_methods'] = json.loads(comp_dict.get('assessment_methods', '{}'))
                    comp_dict['proficiency_levels'] = json.loads(comp_dict.get('proficiency_levels', '{}'))
                    comp_dict['nqf_alignment'] = json.loads(comp_dict.get('nqf_alignment', '{}'))
                    comp_dict['validation_criteria'] = json.loads(comp_dict.get('validation_criteria', '{}'))
                    competency_list.append(comp_dict)
                
                return {
                    "success": True,
                    "competencies": competency_list,
                    "count": len(competency_list)
                }
                
        except Exception as e:
            logger.error(f"Error retrieving competency models: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve competency models"
            }
    
    # Assessment Scheduling
    
    def schedule_assessment(self, assessment_id: int, assessor_id: int, candidate_id: int, 
                          scheduled_date: datetime, start_time: str, end_time: str,
                          location: str = None, timezone: str = "Asia/Dubai") -> Dict[str, Any]:
        """Schedule an assessment session"""
        try:
            with self.connection.cursor() as cursor:
                # Check for scheduling conflicts
                conflict_query = """
                SELECT id FROM assessment_scheduling
                WHERE assessor_id = %s 
                AND scheduled_date = %s
                AND (
                    (start_time <= %s AND end_time > %s) OR
                    (start_time < %s AND end_time >= %s) OR
                    (start_time >= %s AND end_time <= %s)
                )
                AND status NOT IN ('cancelled', 'completed')
                """
                
                cursor.execute(conflict_query, (
                    assessor_id, scheduled_date.date(), start_time, start_time,
                    end_time, end_time, start_time, end_time
                ))
                
                conflicts = cursor.fetchall()
                
                if conflicts:
                    return {
                        "success": False,
                        "message": "Scheduling conflict detected for the assessor",
                        "conflicts": [dict(conflict) for conflict in conflicts]
                    }
                
                # Create scheduling record
                insert_query = """
                INSERT INTO assessment_scheduling
                (assessment_id, assessor_id, candidate_id, scheduled_date, start_time, end_time,
                 timezone, location, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'scheduled')
                RETURNING id, created_at
                """
                
                cursor.execute(insert_query, (
                    assessment_id, assessor_id, candidate_id, scheduled_date.date(),
                    start_time, end_time, timezone, location
                ))
                
                result = cursor.fetchone()
                
                # Update assessment scheduled_date
                cursor.execute("""
                UPDATE assessments 
                SET scheduled_date = %s, location = %s
                WHERE id = %s
                """, (scheduled_date, location, assessment_id))
                
                self.connection.commit()
                
                logger.info(f"Assessment {assessment_id} scheduled successfully")
                return {
                    "success": True,
                    "schedule_id": result["id"],
                    "created_at": result["created_at"],
                    "message": "Assessment scheduled successfully"
                }
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error scheduling assessment: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to schedule assessment"
            }
    
    def _log_audit_trail(self, assessment_id: int, user_id: int, action_type: str, 
                        action_description: str, old_values: Dict = None, new_values: Dict = None):
        """Log audit trail for assessment actions"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                INSERT INTO assessment_audit_trail
                (assessment_id, user_id, action_type, action_description, old_values, new_values)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(query, (
                    assessment_id, user_id, action_type, action_description,
                    json.dumps(old_values) if old_values else None,
                    json.dumps(new_values) if new_values else None
                ))
                
        except Exception as e:
            logger.error(f"Error logging audit trail: {e}")
    
    def get_assessor_dashboard_data(self, assessor_id: int) -> Dict[str, Any]:
        """Get comprehensive dashboard data for an assessor"""
        try:
            with self.connection.cursor() as cursor:
                # Get assessment statistics
                stats_query = """
                SELECT 
                    COUNT(*) as total_assessments,
                    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_assessments,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_assessments,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assessments,
                    AVG(CASE WHEN total_score IS NOT NULL THEN total_score END) as average_score
                FROM assessments
                WHERE assessor_id = %s
                """
                
                cursor.execute(stats_query, (assessor_id,))
                stats = cursor.fetchone()
                
                # Get upcoming assessments
                upcoming_query = """
                SELECT a.*, at.name as template_name, u.full_name as candidate_name
                FROM assessments a
                LEFT JOIN assessment_templates at ON a.template_id = at.id
                LEFT JOIN users u ON a.candidate_id = u.id
                WHERE a.assessor_id = %s 
                AND a.status IN ('scheduled', 'confirmed')
                AND a.scheduled_date >= CURRENT_DATE
                ORDER BY a.scheduled_date ASC
                LIMIT 10
                """
                
                cursor.execute(upcoming_query, (assessor_id,))
                upcoming_assessments = cursor.fetchall()
                
                # Get quality metrics
                quality_query = """
                SELECT 
                    AVG(CASE WHEN metric_type = 'inter_rater_reliability' THEN metric_value END) as reliability_score,
                    AVG(CASE WHEN metric_type = 'consistency' THEN metric_value END) as consistency_score,
                    COUNT(CASE WHEN quality_flag = 'excellent' THEN 1 END) as excellent_count,
                    COUNT(CASE WHEN quality_flag = 'needs_improvement' THEN 1 END) as improvement_needed
                FROM quality_assurance_metrics
                WHERE assessor_id = %s
                AND calculated_at >= CURRENT_DATE - INTERVAL '30 days'
                """
                
                cursor.execute(quality_query, (assessor_id,))
                quality_metrics = cursor.fetchone()
                
                return {
                    "success": True,
                    "statistics": dict(stats) if stats else {},
                    "upcoming_assessments": [dict(assessment) for assessment in upcoming_assessments],
                    "quality_metrics": dict(quality_metrics) if quality_metrics else {},
                    "message": "Dashboard data retrieved successfully"
                }
                
        except Exception as e:
            logger.error(f"Error retrieving assessor dashboard data: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve dashboard data"
            }

# Health check function
def health_check(db_connection_or_string) -> Dict[str, Any]:
    """Check system health and database connectivity"""
    try:
        system = AssessmentPlanningSystem(db_connection_or_string)
        system.connect_db()
        
        with system.connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM assessment_templates")
            template_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) FROM assessments WHERE status = 'scheduled'")
            scheduled_count = cursor.fetchone()['count']
        
        system.close_db()
        
        return {
            "status": "healthy",
            "database_connected": True,
            "assessment_templates": template_count,
            "scheduled_assessments": scheduled_count,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "database_connected": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
