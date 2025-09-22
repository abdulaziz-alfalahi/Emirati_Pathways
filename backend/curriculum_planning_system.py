"""
Curriculum Planning System
Emirati Journey Platform - Educator Persona
Comprehensive curriculum planning with UAE educational standards integration
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date, timedelta
import json
import logging
from typing import Dict, List, Optional, Any
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CurriculumPlanningSystem:
    """
    Comprehensive curriculum planning system for UAE educators
    """
    
    def __init__(self, db_connection):
        """Initialize the curriculum planning system"""
        self.db_connection = db_connection
        logger.info("✅ Curriculum Planning System initialized")
    
    # UAE Standards Management
    
    def get_uae_standards(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get UAE curriculum standards with optional filtering"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                base_query = """
                    SELECT * FROM uae_curriculum_standards
                    WHERE (effective_to IS NULL OR effective_to > CURRENT_DATE)
                """
                params = []
                
                if filters:
                    if filters.get('subject'):
                        base_query += " AND subject = %s"
                        params.append(filters['subject'])
                    
                    if filters.get('grade_level'):
                        base_query += " AND grade_level = %s"
                        params.append(filters['grade_level'])
                    
                    if filters.get('strand'):
                        base_query += " AND strand ILIKE %s"
                        params.append(f"%{filters['strand']}%")
                    
                    if filters.get('search'):
                        base_query += " AND (learning_outcome ILIKE %s OR description ILIKE %s)"
                        search_term = f"%{filters['search']}%"
                        params.extend([search_term, search_term])
                
                base_query += " ORDER BY subject, grade_level, strand, standard_code"
                
                cursor.execute(base_query, params)
                standards = cursor.fetchall()
                
                return {
                    'success': True,
                    'standards': [dict(standard) for standard in standards],
                    'total_count': len(standards)
                }
                
        except Exception as e:
            logger.error(f"Error getting UAE standards: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve standards: {str(e)}'
            }
    
    def get_subjects_and_grades(self) -> Dict[str, Any]:
        """Get available subjects and grade levels"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get subjects
                cursor.execute("""
                    SELECT DISTINCT subject 
                    FROM uae_curriculum_standards 
                    ORDER BY subject
                """)
                subjects = [row['subject'] for row in cursor.fetchall()]
                
                # Get grade levels
                cursor.execute("""
                    SELECT DISTINCT grade_level 
                    FROM uae_curriculum_standards 
                    ORDER BY grade_level
                """)
                grade_levels = [row['grade_level'] for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'subjects': subjects,
                    'grade_levels': grade_levels
                }
                
        except Exception as e:
            logger.error(f"Error getting subjects and grades: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve subjects and grades: {str(e)}'
            }
    
    # Curriculum Template Management
    
    def create_curriculum_template(self, template_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Create a new curriculum template"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                insert_query = """
                    INSERT INTO curriculum_templates (
                        template_name, subject, grade_level, academic_year, template_type,
                        duration_weeks, total_lessons, description, learning_objectives,
                        key_concepts, essential_questions, assessment_methods,
                        resources_required, differentiation_strategies, cross_curricular_links,
                        cultural_connections, islamic_values_integration, emiratization_focus,
                        created_by, is_public
                    ) VALUES (
                        %(template_name)s, %(subject)s, %(grade_level)s, %(academic_year)s, %(template_type)s,
                        %(duration_weeks)s, %(total_lessons)s, %(description)s, %(learning_objectives)s,
                        %(key_concepts)s, %(essential_questions)s, %(assessment_methods)s,
                        %(resources_required)s, %(differentiation_strategies)s, %(cross_curricular_links)s,
                        %(cultural_connections)s, %(islamic_values_integration)s, %(emiratization_focus)s,
                        %(created_by)s, %(is_public)s
                    ) RETURNING id, created_at
                """
                
                template_data['created_by'] = educator_id
                template_data.setdefault('is_public', False)
                
                cursor.execute(insert_query, template_data)
                result = cursor.fetchone()
                self.db_connection.commit()
                
                return {
                    'success': True,
                    'template_id': result['id'],
                    'created_at': result['created_at'].isoformat(),
                    'message': 'Curriculum template created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating curriculum template: {str(e)}")
            self.db_connection.rollback()
            return {
                'success': False,
                'error': f'Failed to create template: {str(e)}'
            }
    
    def get_curriculum_templates(self, educator_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get curriculum templates for an educator"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                base_query = """
                    SELECT ct.*, 
                           u.first_name || ' ' || u.last_name as creator_name,
                           COUNT(c.id) as usage_count
                    FROM curriculum_templates ct
                    LEFT JOIN users u ON ct.created_by = u.id
                    LEFT JOIN curricula c ON ct.id = c.template_id
                    WHERE (ct.created_by = %s OR ct.is_public = true)
                """
                params = [educator_id]
                
                if filters:
                    if filters.get('subject'):
                        base_query += " AND ct.subject = %s"
                        params.append(filters['subject'])
                    
                    if filters.get('grade_level'):
                        base_query += " AND ct.grade_level = %s"
                        params.append(filters['grade_level'])
                    
                    if filters.get('template_type'):
                        base_query += " AND ct.template_type = %s"
                        params.append(filters['template_type'])
                    
                    if filters.get('search'):
                        base_query += " AND (ct.template_name ILIKE %s OR ct.description ILIKE %s)"
                        search_term = f"%{filters['search']}%"
                        params.extend([search_term, search_term])
                
                base_query += """
                    GROUP BY ct.id, u.first_name, u.last_name
                    ORDER BY ct.created_at DESC
                """
                
                cursor.execute(base_query, params)
                templates = cursor.fetchall()
                
                return {
                    'success': True,
                    'templates': [dict(template) for template in templates],
                    'total_count': len(templates)
                }
                
        except Exception as e:
            logger.error(f"Error getting curriculum templates: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve templates: {str(e)}'
            }
    
    # Curriculum Management
    
    def create_curriculum(self, curriculum_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Create a new curriculum from template or from scratch"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Convert date strings to date objects
                if isinstance(curriculum_data.get('start_date'), str):
                    curriculum_data['start_date'] = datetime.strptime(
                        curriculum_data['start_date'], '%Y-%m-%d'
                    ).date()
                
                if isinstance(curriculum_data.get('end_date'), str):
                    curriculum_data['end_date'] = datetime.strptime(
                        curriculum_data['end_date'], '%Y-%m-%d'
                    ).date()
                
                # Calculate total weeks if not provided
                if not curriculum_data.get('total_weeks'):
                    start_date = curriculum_data['start_date']
                    end_date = curriculum_data['end_date']
                    curriculum_data['total_weeks'] = (end_date - start_date).days // 7
                
                # Calculate total planned lessons
                total_weeks = curriculum_data['total_weeks']
                lessons_per_week = curriculum_data.get('lessons_per_week', 1)
                curriculum_data['total_planned_lessons'] = total_weeks * lessons_per_week
                
                insert_query = """
                    INSERT INTO curricula (
                        curriculum_name, template_id, class_id, educator_id,
                        subject, grade_level, academic_year, start_date, end_date,
                        total_weeks, lessons_per_week, total_planned_lessons,
                        learning_objectives, assessment_plan, resources_list, notes
                    ) VALUES (
                        %(curriculum_name)s, %(template_id)s, %(class_id)s, %(educator_id)s,
                        %(subject)s, %(grade_level)s, %(academic_year)s, %(start_date)s, %(end_date)s,
                        %(total_weeks)s, %(lessons_per_week)s, %(total_planned_lessons)s,
                        %(learning_objectives)s, %(assessment_plan)s, %(resources_list)s, %(notes)s
                    ) RETURNING id, created_at
                """
                
                curriculum_data['educator_id'] = educator_id
                
                cursor.execute(insert_query, curriculum_data)
                result = cursor.fetchone()
                curriculum_id = result['id']
                
                # If created from template, copy standards mapping
                if curriculum_data.get('template_id'):
                    self._copy_template_standards(cursor, curriculum_data['template_id'], curriculum_id)
                
                # Create initial pacing guide
                self._create_initial_pacing_guide(cursor, curriculum_id, curriculum_data)
                
                self.db_connection.commit()
                
                return {
                    'success': True,
                    'curriculum_id': curriculum_id,
                    'created_at': result['created_at'].isoformat(),
                    'message': 'Curriculum created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating curriculum: {str(e)}")
            self.db_connection.rollback()
            return {
                'success': False,
                'error': f'Failed to create curriculum: {str(e)}'
            }
    
    def _copy_template_standards(self, cursor, template_id: str, curriculum_id: str):
        """Copy standards mapping from template to curriculum"""
        # This would copy from a template_standards_mapping table if it existed
        # For now, we'll skip this step
        pass
    
    def _create_initial_pacing_guide(self, cursor, curriculum_id: str, curriculum_data: Dict[str, Any]):
        """Create initial pacing guide for the curriculum"""
        try:
            start_date = curriculum_data['start_date']
            total_weeks = curriculum_data['total_weeks']
            
            for week_num in range(1, total_weeks + 1):
                week_start = start_date + timedelta(weeks=week_num - 1)
                week_end = week_start + timedelta(days=6)
                
                insert_query = """
                    INSERT INTO pacing_guides (
                        curriculum_id, week_number, start_date, end_date,
                        planned_topics, planned_standards, planned_assessments
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, [
                    curriculum_id, week_num, week_start, week_end,
                    [], [], []  # Empty arrays to be filled later
                ])
                
        except Exception as e:
            logger.error(f"Error creating initial pacing guide: {str(e)}")
            raise
    
    def get_curricula(self, educator_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get curricula for an educator"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                base_query = """
                    SELECT c.*, 
                           cl.class_name,
                           ct.template_name,
                           ROUND((c.completed_lessons::DECIMAL / NULLIF(c.total_planned_lessons, 0)) * 100, 1) as completion_percentage
                    FROM curricula c
                    LEFT JOIN classes cl ON c.class_id = cl.id
                    LEFT JOIN curriculum_templates ct ON c.template_id = ct.id
                    WHERE c.educator_id = %s
                """
                params = [educator_id]
                
                if filters:
                    if filters.get('subject'):
                        base_query += " AND c.subject = %s"
                        params.append(filters['subject'])
                    
                    if filters.get('grade_level'):
                        base_query += " AND c.grade_level = %s"
                        params.append(filters['grade_level'])
                    
                    if filters.get('academic_year'):
                        base_query += " AND c.academic_year = %s"
                        params.append(filters['academic_year'])
                    
                    if filters.get('status'):
                        base_query += " AND c.curriculum_status = %s"
                        params.append(filters['status'])
                
                base_query += " ORDER BY c.created_at DESC"
                
                cursor.execute(base_query, params)
                curricula = cursor.fetchall()
                
                return {
                    'success': True,
                    'curricula': [dict(curriculum) for curriculum in curricula],
                    'total_count': len(curricula)
                }
                
        except Exception as e:
            logger.error(f"Error getting curricula: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve curricula: {str(e)}'
            }
    
    # Lesson Planning
    
    def create_lesson_plan(self, lesson_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Create a new lesson plan"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator owns the curriculum
                curriculum_check = """
                    SELECT id FROM curricula 
                    WHERE id = %s AND educator_id = %s
                """
                cursor.execute(curriculum_check, [lesson_data['curriculum_id'], educator_id])
                if not cursor.fetchone():
                    return {
                        'success': False,
                        'error': 'Access denied to this curriculum'
                    }
                
                # Convert date strings to date objects
                date_fields = ['planned_date', 'actual_date']
                for field in date_fields:
                    if lesson_data.get(field) and isinstance(lesson_data[field], str):
                        lesson_data[field] = datetime.strptime(
                            lesson_data[field], '%Y-%m-%d'
                        ).date()
                
                insert_query = """
                    INSERT INTO lesson_plans (
                        curriculum_id, lesson_number, lesson_title, lesson_type,
                        planned_date, duration_minutes, learning_objectives,
                        success_criteria, key_vocabulary, prior_knowledge,
                        lesson_structure, teaching_strategies, differentiation,
                        assessment_methods, resources_needed, homework_assignment
                    ) VALUES (
                        %(curriculum_id)s, %(lesson_number)s, %(lesson_title)s, %(lesson_type)s,
                        %(planned_date)s, %(duration_minutes)s, %(learning_objectives)s,
                        %(success_criteria)s, %(key_vocabulary)s, %(prior_knowledge)s,
                        %(lesson_structure)s, %(teaching_strategies)s, %(differentiation)s,
                        %(assessment_methods)s, %(resources_needed)s, %(homework_assignment)s
                    ) RETURNING id, created_at
                """
                
                # Set defaults
                lesson_data.setdefault('duration_minutes', 45)
                lesson_data.setdefault('lesson_type', 'development')
                
                cursor.execute(insert_query, lesson_data)
                result = cursor.fetchone()
                self.db_connection.commit()
                
                return {
                    'success': True,
                    'lesson_id': result['id'],
                    'created_at': result['created_at'].isoformat(),
                    'message': 'Lesson plan created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating lesson plan: {str(e)}")
            self.db_connection.rollback()
            return {
                'success': False,
                'error': f'Failed to create lesson plan: {str(e)}'
            }
    
    def get_lesson_plans(self, curriculum_id: str, educator_id: str) -> Dict[str, Any]:
        """Get lesson plans for a curriculum"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator owns the curriculum
                curriculum_check = """
                    SELECT id FROM curricula 
                    WHERE id = %s AND educator_id = %s
                """
                cursor.execute(curriculum_check, [curriculum_id, educator_id])
                if not cursor.fetchone():
                    return {
                        'success': False,
                        'error': 'Access denied to this curriculum'
                    }
                
                lessons_query = """
                    SELECT lp.*,
                           COUNT(lsa.standard_id) as standards_count
                    FROM lesson_plans lp
                    LEFT JOIN lesson_standards_alignment lsa ON lp.id = lsa.lesson_id
                    WHERE lp.curriculum_id = %s
                    GROUP BY lp.id
                    ORDER BY lp.lesson_number
                """
                
                cursor.execute(lessons_query, [curriculum_id])
                lessons = cursor.fetchall()
                
                return {
                    'success': True,
                    'lessons': [dict(lesson) for lesson in lessons],
                    'total_count': len(lessons)
                }
                
        except Exception as e:
            logger.error(f"Error getting lesson plans: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve lesson plans: {str(e)}'
            }
    
    # Assessment Planning
    
    def create_assessment_plan(self, assessment_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Create a new assessment plan"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator owns the curriculum
                curriculum_check = """
                    SELECT id FROM curricula 
                    WHERE id = %s AND educator_id = %s
                """
                cursor.execute(curriculum_check, [assessment_data['curriculum_id'], educator_id])
                if not cursor.fetchone():
                    return {
                        'success': False,
                        'error': 'Access denied to this curriculum'
                    }
                
                # Convert date strings to date objects
                date_fields = ['planned_date', 'actual_date']
                for field in date_fields:
                    if assessment_data.get(field) and isinstance(assessment_data[field], str):
                        assessment_data[field] = datetime.strptime(
                            assessment_data[field], '%Y-%m-%d'
                        ).date()
                
                insert_query = """
                    INSERT INTO assessment_plans (
                        curriculum_id, assessment_name, assessment_type, assessment_method,
                        planned_date, duration_minutes, total_marks, passing_marks,
                        weight_percentage, learning_objectives, assessment_criteria,
                        rubric_data, instructions, resources_allowed, special_accommodations
                    ) VALUES (
                        %(curriculum_id)s, %(assessment_name)s, %(assessment_type)s, %(assessment_method)s,
                        %(planned_date)s, %(duration_minutes)s, %(total_marks)s, %(passing_marks)s,
                        %(weight_percentage)s, %(learning_objectives)s, %(assessment_criteria)s,
                        %(rubric_data)s, %(instructions)s, %(resources_allowed)s, %(special_accommodations)s
                    ) RETURNING id, created_at
                """
                
                cursor.execute(insert_query, assessment_data)
                result = cursor.fetchone()
                self.db_connection.commit()
                
                return {
                    'success': True,
                    'assessment_id': result['id'],
                    'created_at': result['created_at'].isoformat(),
                    'message': 'Assessment plan created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating assessment plan: {str(e)}")
            self.db_connection.rollback()
            return {
                'success': False,
                'error': f'Failed to create assessment plan: {str(e)}'
            }
    
    # Resource Management
    
    def get_curriculum_resources(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get curriculum resources with filtering"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                base_query = """
                    SELECT cr.*,
                           u.first_name || ' ' || u.last_name as creator_name,
                           AVG(cru.effectiveness_rating) as avg_effectiveness,
                           COUNT(cru.id) as usage_count
                    FROM curriculum_resources cr
                    LEFT JOIN users u ON cr.created_by = u.id
                    LEFT JOIN curriculum_resource_usage cru ON cr.id = cru.resource_id
                    WHERE cr.is_approved = true
                """
                params = []
                
                if filters:
                    if filters.get('subject'):
                        base_query += " AND cr.subject = %s"
                        params.append(filters['subject'])
                    
                    if filters.get('grade_levels'):
                        base_query += " AND %s = ANY(cr.grade_levels)"
                        params.append(filters['grade_levels'])
                    
                    if filters.get('resource_type'):
                        base_query += " AND cr.resource_type = %s"
                        params.append(filters['resource_type'])
                    
                    if filters.get('topics'):
                        base_query += " AND %s = ANY(cr.topics)"
                        params.append(filters['topics'])
                    
                    if filters.get('search'):
                        base_query += " AND (cr.resource_name ILIKE %s OR cr.description ILIKE %s)"
                        search_term = f"%{filters['search']}%"
                        params.extend([search_term, search_term])
                    
                    if filters.get('is_free'):
                        base_query += " AND cr.is_free = %s"
                        params.append(filters['is_free'])
                
                base_query += """
                    GROUP BY cr.id, u.first_name, u.last_name
                    ORDER BY cr.quality_rating DESC, cr.usage_count DESC
                """
                
                cursor.execute(base_query, params)
                resources = cursor.fetchall()
                
                return {
                    'success': True,
                    'resources': [dict(resource) for resource in resources],
                    'total_count': len(resources)
                }
                
        except Exception as e:
            logger.error(f"Error getting curriculum resources: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve resources: {str(e)}'
            }
    
    # Pacing Guide Management
    
    def update_pacing_guide(self, curriculum_id: str, week_number: int, 
                           pacing_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Update pacing guide for a specific week"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator owns the curriculum
                curriculum_check = """
                    SELECT id FROM curricula 
                    WHERE id = %s AND educator_id = %s
                """
                cursor.execute(curriculum_check, [curriculum_id, educator_id])
                if not cursor.fetchone():
                    return {
                        'success': False,
                        'error': 'Access denied to this curriculum'
                    }
                
                update_query = """
                    UPDATE pacing_guides 
                    SET planned_topics = %(planned_topics)s,
                        planned_standards = %(planned_standards)s,
                        planned_assessments = %(planned_assessments)s,
                        actual_topics_covered = %(actual_topics_covered)s,
                        actual_standards_covered = %(actual_standards_covered)s,
                        actual_assessments_completed = %(actual_assessments_completed)s,
                        pacing_status = %(pacing_status)s,
                        adjustments_needed = %(adjustments_needed)s,
                        notes = %(notes)s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE curriculum_id = %(curriculum_id)s AND week_number = %(week_number)s
                    RETURNING updated_at
                """
                
                pacing_data['curriculum_id'] = curriculum_id
                pacing_data['week_number'] = week_number
                
                cursor.execute(update_query, pacing_data)
                result = cursor.fetchone()
                
                if not result:
                    return {
                        'success': False,
                        'error': 'Pacing guide week not found'
                    }
                
                self.db_connection.commit()
                
                return {
                    'success': True,
                    'updated_at': result['updated_at'].isoformat(),
                    'message': 'Pacing guide updated successfully'
                }
                
        except Exception as e:
            logger.error(f"Error updating pacing guide: {str(e)}")
            self.db_connection.rollback()
            return {
                'success': False,
                'error': f'Failed to update pacing guide: {str(e)}'
            }
    
    def get_pacing_guide(self, curriculum_id: str, educator_id: str) -> Dict[str, Any]:
        """Get complete pacing guide for a curriculum"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator owns the curriculum
                curriculum_check = """
                    SELECT curriculum_name, subject, grade_level, academic_year 
                    FROM curricula 
                    WHERE id = %s AND educator_id = %s
                """
                cursor.execute(curriculum_check, [curriculum_id, educator_id])
                curriculum_info = cursor.fetchone()
                
                if not curriculum_info:
                    return {
                        'success': False,
                        'error': 'Access denied to this curriculum'
                    }
                
                pacing_query = """
                    SELECT * FROM pacing_guides 
                    WHERE curriculum_id = %s 
                    ORDER BY week_number
                """
                
                cursor.execute(pacing_query, [curriculum_id])
                pacing_weeks = cursor.fetchall()
                
                return {
                    'success': True,
                    'curriculum_info': dict(curriculum_info),
                    'pacing_guide': [dict(week) for week in pacing_weeks],
                    'total_weeks': len(pacing_weeks)
                }
                
        except Exception as e:
            logger.error(f"Error getting pacing guide: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve pacing guide: {str(e)}'
            }
