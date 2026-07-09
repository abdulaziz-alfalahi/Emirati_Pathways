"""
Student Tracking System
Emirati Journey Platform - Educator Persona
Advanced student management and progress monitoring system
"""

import uuid
import json
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StudentStatus(Enum):
    """Student enrollment status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    GRADUATED = "graduated"
    TRANSFERRED = "transferred"

class AttendanceStatus(Enum):
    """Attendance status options"""
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"
    SICK = "sick"

class EnrollmentStatus(Enum):
    """Enrollment status in classes"""
    ENROLLED = "enrolled"
    COMPLETED = "completed"
    DROPPED = "dropped"
    TRANSFERRED = "transferred"

class BehaviorType(Enum):
    """Behavior incident types"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

@dataclass
class Student:
    """Student data model"""
    id: str
    student_id: str
    first_name: str
    last_name: str
    arabic_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: str = "UAE"
    emirate: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    medical_conditions: Optional[str] = None
    special_needs: Optional[str] = None
    enrollment_date: Optional[date] = None
    graduation_date: Optional[date] = None
    status: StudentStatus = StudentStatus.ACTIVE
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class StudentGuardian:
    """Student guardian/parent data model"""
    id: str
    student_id: str
    guardian_type: str  # father, mother, guardian, sponsor
    first_name: str
    last_name: str
    arabic_name: Optional[str] = None
    relationship: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    work_phone: Optional[str] = None
    occupation: Optional[str] = None
    employer: Optional[str] = None
    is_primary_contact: bool = False
    can_pickup: bool = True
    emergency_contact: bool = False

@dataclass
class ClassInfo:
    """Class information data model"""
    id: str
    class_name: str
    grade_level: int
    section: Optional[str] = None
    subject: Optional[str] = None
    academic_year: str = "2024-2025"
    educator_id: str = None
    institution_id: Optional[str] = None
    classroom: Optional[str] = None
    max_capacity: int = 30
    current_enrollment: int = 0
    schedule_days: Optional[str] = None
    schedule_times: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class StudentTrackingSystem:
    """Comprehensive student tracking and management system"""
    
    def __init__(self, db_connection):
        """Initialize the student tracking system"""
        self.db = db_connection
        self.logger = logging.getLogger(__name__)
    
    # Student Management Methods
    
    def create_student(self, student_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Create a new student record"""
        try:
            with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
                # Generate unique student ID if not provided
                if 'student_id' not in student_data:
                    student_data['student_id'] = f"STU{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"
                
                # Insert student record
                insert_query = """
                    INSERT INTO students (
                        student_id, first_name, last_name, arabic_name, date_of_birth,
                        gender, nationality, emirate, email, phone, emergency_contact_name,
                        emergency_contact_phone, emergency_contact_relationship,
                        medical_conditions, special_needs, status
                    ) VALUES (
                        %(student_id)s, %(first_name)s, %(last_name)s, %(arabic_name)s, %(date_of_birth)s,
                        %(gender)s, %(nationality)s, %(emirate)s, %(email)s, %(phone)s, %(emergency_contact_name)s,
                        %(emergency_contact_phone)s, %(emergency_contact_relationship)s,
                        %(medical_conditions)s, %(special_needs)s, %(status)s
                    ) RETURNING id, student_id, created_at
                """
                
                cursor.execute(insert_query, student_data)
                result = cursor.fetchone()
                self.db.commit()
                
                self.logger.info(f"Student created successfully: {result['student_id']}")
                return {
                    'success': True,
                    'student_id': result['id'],
                    'student_number': result['student_id'],
                    'created_at': result['created_at'].isoformat(),
                    'message': 'Student created successfully'
                }
                
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating student: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to create student: {str(e)}'
            }
    
    def get_students(self, educator_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get list of students with optional filtering"""
        try:
            with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
                # Base query to get students enrolled in educator's classes
                base_query = """
                    SELECT DISTINCT s.*, 
                           COUNT(e.id) as enrolled_classes,
                           AVG(CASE WHEN e.final_percentage IS NOT NULL THEN e.final_percentage END) as avg_grade
                    FROM students s
                    LEFT JOIN enrollments e ON s.id = e.student_id
                    LEFT JOIN classes c ON e.class_id = c.id
                    WHERE c.educator_id = %s
                """
                
                params = [educator_id]
                conditions = []
                
                # Apply filters
                if filters:
                    if filters.get('status'):
                        conditions.append("s.status = %s")
                        params.append(filters['status'])
                    
                    if filters.get('grade_level'):
                        conditions.append("c.grade_level = %s")
                        params.append(filters['grade_level'])
                    
                    if filters.get('class_id'):
                        conditions.append("c.id = %s")
                        params.append(filters['class_id'])
                    
                    if filters.get('search'):
                        conditions.append("(s.first_name ILIKE %s OR s.last_name ILIKE %s OR s.student_id ILIKE %s)")
                        search_term = f"%{filters['search']}%"
                        params.extend([search_term, search_term, search_term])
                
                if conditions:
                    base_query += " AND " + " AND ".join(conditions)
                
                base_query += " GROUP BY s.id ORDER BY s.last_name, s.first_name"
                
                cursor.execute(base_query, params)
                students = cursor.fetchall()
                
                return {
                    'success': True,
                    'students': [dict(student) for student in students],
                    'total_count': len(students)
                }
                
        except Exception as e:
            self.logger.error(f"Error retrieving students: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve students: {str(e)}'
            }
    
    def get_student_details(self, student_id: str, educator_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific student"""
        try:
            with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get student basic information
                student_query = """
                    SELECT s.*, 
                           COUNT(DISTINCT e.id) as total_enrollments,
                           COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as days_present,
                           COUNT(DISTINCT a.id) as total_attendance_records,
                           AVG(CASE WHEN e.final_percentage IS NOT NULL THEN e.final_percentage END) as overall_average
                    FROM students s
                    LEFT JOIN enrollments e ON s.id = e.student_id
                    LEFT JOIN classes c ON e.class_id = c.id
                    LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = c.id
                    WHERE s.id = %s AND c.educator_id = %s
                    GROUP BY s.id
                """
                
                cursor.execute(student_query, [student_id, educator_id])
                student = cursor.fetchone()
                
                if not student:
                    return {
                        'success': False,
                        'error': 'Student not found or not accessible'
                    }
                
                # Get student guardians
                guardians_query = """
                    SELECT * FROM student_guardians 
                    WHERE student_id = %s 
                    ORDER BY is_primary_contact DESC, guardian_type
                """
                cursor.execute(guardians_query, [student_id])
                guardians = cursor.fetchall()
                
                # Get current enrollments
                enrollments_query = """
                    SELECT e.*, c.class_name, c.subject, c.grade_level, c.section
                    FROM enrollments e
                    JOIN classes c ON e.class_id = c.id
                    WHERE e.student_id = %s AND c.educator_id = %s AND e.status = 'enrolled'
                    ORDER BY c.class_name
                """
                cursor.execute(enrollments_query, [student_id, educator_id])
                enrollments = cursor.fetchall()
                
                # Get recent attendance (last 30 days)
                attendance_query = """
                    SELECT a.*, c.class_name
                    FROM attendance a
                    JOIN classes c ON a.class_id = c.id
                    WHERE a.student_id = %s AND c.educator_id = %s 
                    AND a.attendance_date >= %s
                    ORDER BY a.attendance_date DESC
                    LIMIT 30
                """
                thirty_days_ago = datetime.now().date() - timedelta(days=30)
                cursor.execute(attendance_query, [student_id, educator_id, thirty_days_ago])
                recent_attendance = cursor.fetchall()
                
                # Get recent behavior records
                behavior_query = """
                    SELECT sb.*, c.class_name, u.first_name as reporter_first_name, u.last_name as reporter_last_name
                    FROM student_behavior sb
                    LEFT JOIN classes c ON sb.class_id = c.id
                    LEFT JOIN users u ON sb.reported_by = u.id
                    WHERE sb.student_id = %s AND (c.educator_id = %s OR sb.reported_by = %s)
                    ORDER BY sb.incident_date DESC
                    LIMIT 20
                """
                cursor.execute(behavior_query, [student_id, educator_id, educator_id])
                behavior_records = cursor.fetchall()
                
                # Calculate attendance percentage
                attendance_percentage = 0
                if student['total_attendance_records'] > 0:
                    attendance_percentage = (student['days_present'] / student['total_attendance_records']) * 100
                
                return {
                    'success': True,
                    'candidate': dict(student),
                    'guardians': [dict(guardian) for guardian in guardians],
                    'enrollments': [dict(enrollment) for enrollment in enrollments],
                    'recent_attendance': [dict(record) for record in recent_attendance],
                    'behavior_records': [dict(record) for record in behavior_records],
                    'attendance_percentage': round(attendance_percentage, 2),
                    'overall_average': float(student['overall_average']) if student['overall_average'] else None
                }
                
        except Exception as e:
            self.logger.error(f"Error retrieving student details: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve student details: {str(e)}'
            }
    
    # Attendance Management Methods
    
    def record_attendance(self, attendance_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Record attendance for students"""
        try:
            with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator has access to the class
                class_check_query = """
                    SELECT id FROM classes WHERE id = %s AND educator_id = %s
                """
                cursor.execute(class_check_query, [attendance_data['class_id'], educator_id])
                if not cursor.fetchone():
                    return {
                        'success': False,
                        'error': 'Access denied to this class'
                    }
                
                # Record attendance (using UPSERT to handle duplicates)
                attendance_records = attendance_data.get('attendance_records', [])
                successful_records = 0
                
                for record in attendance_records:
                    upsert_query = """
                        INSERT INTO attendance (
                            student_id, class_id, attendance_date, status, 
                            arrival_time, departure_time, notes, marked_by
                        ) VALUES (
                            %(student_id)s, %(class_id)s, %(attendance_date)s, %(status)s,
                            %(arrival_time)s, %(departure_time)s, %(notes)s, %(marked_by)s
                        )
                        ON CONFLICT (student_id, class_id, attendance_date)
                        DO UPDATE SET
                            status = EXCLUDED.status,
                            arrival_time = EXCLUDED.arrival_time,
                            departure_time = EXCLUDED.departure_time,
                            notes = EXCLUDED.notes,
                            marked_by = EXCLUDED.marked_by,
                            marked_at = CURRENT_TIMESTAMP
                    """
                    
                    record_data = {
                        'student_id': record['student_id'],
                        'class_id': attendance_data['class_id'],
                        'attendance_date': record.get('attendance_date', datetime.now().date()),
                        'status': record['status'],
                        'arrival_time': record.get('arrival_time'),
                        'departure_time': record.get('departure_time'),
                        'notes': record.get('notes'),
                        'marked_by': educator_id
                    }
                    
                    cursor.execute(upsert_query, record_data)
                    successful_records += 1
                
                self.db.commit()
                
                return {
                    'success': True,
                    'records_processed': successful_records,
                    'message': f'Attendance recorded for {successful_records} students'
                }
                
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error recording attendance: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to record attendance: {str(e)}'
            }
    
    def get_attendance_report(self, class_id: str, educator_id: str, 
                            start_date: date = None, end_date: date = None) -> Dict[str, Any]:
        """Generate attendance report for a class"""
        try:
            with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator has access to the class
                class_check_query = """
                    SELECT class_name, grade_level, section, subject FROM classes 
                    WHERE id = %s AND educator_id = %s
                """
                cursor.execute(class_check_query, [class_id, educator_id])
                class_info = cursor.fetchone()
                
                if not class_info:
                    return {
                        'success': False,
                        'error': 'Access denied to this class'
                    }
                
                # Set default date range if not provided
                if not start_date:
                    start_date = datetime.now().date() - timedelta(days=30)
                if not end_date:
                    end_date = datetime.now().date()
                
                # Get attendance data
                attendance_query = """
                    SELECT s.id as student_id, s.first_name, s.last_name, s.student_id as student_number,
                           a.attendance_date, a.status, a.arrival_time, a.departure_time, a.notes
                    FROM students s
                    JOIN enrollments e ON s.id = e.student_id
                    LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = %s 
                                           AND a.attendance_date BETWEEN %s AND %s
                    WHERE e.class_id = %s AND e.status = 'enrolled'
                    ORDER BY s.last_name, s.first_name, a.attendance_date
                """
                
                cursor.execute(attendance_query, [class_id, start_date, end_date, class_id])
                attendance_records = cursor.fetchall()
                
                # Calculate statistics
                stats_query = """
                    SELECT 
                        COUNT(DISTINCT s.id) as total_students,
                        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
                        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
                        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as total_late,
                        COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as total_excused,
                        COUNT(CASE WHEN a.status = 'sick' THEN 1 END) as total_sick,
                        COUNT(a.id) as total_records
                    FROM students s
                    JOIN enrollments e ON s.id = e.student_id
                    LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = %s 
                                           AND a.attendance_date BETWEEN %s AND %s
                    WHERE e.class_id = %s AND e.status = 'enrolled'
                """
                
                cursor.execute(stats_query, [class_id, start_date, end_date, class_id])
                stats = cursor.fetchone()
                
                # Calculate attendance percentage
                attendance_percentage = 0
                if stats['total_records'] > 0:
                    attendance_percentage = (stats['total_present'] / stats['total_records']) * 100
                
                return {
                    'success': True,
                    'class_info': dict(class_info),
                    'date_range': {
                        'start_date': start_date.isoformat(),
                        'end_date': end_date.isoformat()
                    },
                    'attendance_records': [dict(record) for record in attendance_records],
                    'statistics': {
                        **dict(stats),
                        'attendance_percentage': round(attendance_percentage, 2)
                    }
                }
                
        except Exception as e:
            self.logger.error(f"Error generating attendance report: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to generate attendance report: {str(e)}'
            }
    
    # Progress Tracking Methods
    
    def update_student_progress(self, progress_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Update student progress in specific subject/skill areas"""
        try:
            with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator has access to the student through class enrollment
                access_check_query = """
                    SELECT COUNT(*) as access_count FROM students s
                    JOIN enrollments e ON s.id = e.student_id
                    JOIN classes c ON e.class_id = c.id
                    WHERE s.id = %s AND c.educator_id = %s AND e.status = 'enrolled'
                """
                cursor.execute(access_check_query, [progress_data['student_id'], educator_id])
                access_result = cursor.fetchone()
                
                if access_result['access_count'] == 0:
                    return {
                        'success': False,
                        'error': 'Access denied to this student'
                    }
                
                # Update or insert progress record
                upsert_query = """
                    INSERT INTO student_progress (
                        student_id, class_id, subject, skill_area, current_level, target_level,
                        progress_percentage, last_assessment_date, next_assessment_date,
                        strengths, areas_for_improvement, intervention_needed, intervention_type, notes
                    ) VALUES (
                        %(student_id)s, %(class_id)s, %(subject)s, %(skill_area)s, %(current_level)s, %(target_level)s,
                        %(progress_percentage)s, %(last_assessment_date)s, %(next_assessment_date)s,
                        %(strengths)s, %(areas_for_improvement)s, %(intervention_needed)s, %(intervention_type)s, %(notes)s
                    )
                    ON CONFLICT (student_id, class_id, subject, skill_area)
                    DO UPDATE SET
                        current_level = EXCLUDED.current_level,
                        target_level = EXCLUDED.target_level,
                        progress_percentage = EXCLUDED.progress_percentage,
                        last_assessment_date = EXCLUDED.last_assessment_date,
                        next_assessment_date = EXCLUDED.next_assessment_date,
                        strengths = EXCLUDED.strengths,
                        areas_for_improvement = EXCLUDED.areas_for_improvement,
                        intervention_needed = EXCLUDED.intervention_needed,
                        intervention_type = EXCLUDED.intervention_type,
                        notes = EXCLUDED.notes,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                """
                
                cursor.execute(upsert_query, progress_data)
                result = cursor.fetchone()
                self.db.commit()
                
                return {
                    'success': True,
                    'progress_id': result['id'],
                    'message': 'Student progress updated successfully'
                }
                
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating student progress: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to update student progress: {str(e)}'
            }
    
    def get_class_progress_overview(self, class_id: str, educator_id: str) -> Dict[str, Any]:
        """Get progress overview for all students in a class"""
        try:
            with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator has access to the class
                class_check_query = """
                    SELECT class_name, subject, grade_level FROM classes 
                    WHERE id = %s AND educator_id = %s
                """
                cursor.execute(class_check_query, [class_id, educator_id])
                class_info = cursor.fetchone()
                
                if not class_info:
                    return {
                        'success': False,
                        'error': 'Access denied to this class'
                    }
                
                # Get progress data for all students in the class
                progress_query = """
                    SELECT s.id as student_id, s.first_name, s.last_name, s.student_id as student_number,
                           sp.subject, sp.skill_area, sp.current_level, sp.target_level, sp.progress_percentage,
                           sp.last_assessment_date, sp.intervention_needed, sp.intervention_type
                    FROM students s
                    JOIN enrollments e ON s.id = e.student_id
                    LEFT JOIN student_progress sp ON s.id = sp.student_id AND sp.class_id = %s
                    WHERE e.class_id = %s AND e.status = 'enrolled'
                    ORDER BY s.last_name, s.first_name, sp.subject, sp.skill_area
                """
                
                cursor.execute(progress_query, [class_id, class_id])
                progress_records = cursor.fetchall()
                
                # Calculate class statistics
                stats_query = """
                    SELECT 
                        COUNT(DISTINCT s.id) as total_students,
                        AVG(sp.progress_percentage) as average_progress,
                        COUNT(CASE WHEN sp.intervention_needed = true THEN 1 END) as students_needing_intervention,
                        COUNT(CASE WHEN sp.progress_percentage >= 80 THEN 1 END) as students_excelling,
                        COUNT(CASE WHEN sp.progress_percentage < 60 THEN 1 END) as students_struggling
                    FROM students s
                    JOIN enrollments e ON s.id = e.student_id
                    LEFT JOIN student_progress sp ON s.id = sp.student_id AND sp.class_id = %s
                    WHERE e.class_id = %s AND e.status = 'enrolled'
                """
                
                cursor.execute(stats_query, [class_id, class_id])
                stats = cursor.fetchone()
                
                return {
                    'success': True,
                    'class_info': dict(class_info),
                    'progress_records': [dict(record) for record in progress_records],
                    'statistics': {
                        **dict(stats),
                        'average_progress': float(stats['average_progress']) if stats['average_progress'] else 0
                    }
                }
                
        except Exception as e:
            self.logger.error(f"Error retrieving class progress overview: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to retrieve class progress overview: {str(e)}'
            }
