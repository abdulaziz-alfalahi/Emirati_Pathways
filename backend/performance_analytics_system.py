"""
Performance Analytics System
Emirati Journey Platform - Educator Persona
Comprehensive analytics and assessment management system
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
import statistics
import numpy as np
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerformanceAnalyticsSystem:
    """Comprehensive performance analytics and assessment management system"""
    
    def __init__(self, db_connection):
        self.db_connection = db_connection
        
    def calculate_student_performance_analytics(self, student_id: str, class_id: str, subject: str, academic_year: str) -> Dict[str, Any]:
        """Calculate comprehensive performance analytics for a student"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get all assessment results for the student
                assessment_query = """
                    SELECT sar.*, ap.assessment_type, ap.total_points as assessment_total_points,
                           ap.learning_objectives, ap.standards_alignment
                    FROM student_assessment_results sar
                    JOIN assessment_plans ap ON sar.assessment_id = ap.id
                    WHERE sar.student_id = %s AND ap.class_id = %s 
                    AND ap.subject = %s AND ap.academic_year = %s
                    AND sar.completion_status = 'graded'
                    ORDER BY sar.submission_date
                """
                cursor.execute(assessment_query, [student_id, class_id, subject, academic_year])
                assessments = cursor.fetchall()
                
                if not assessments:
                    return {
                        'success': False,
                        'error': 'No graded assessments found for this student'
                    }
                
                # Calculate overall performance metrics
                all_scores = [float(a['percentage_score']) for a in assessments if a['percentage_score'] is not None]
                
                overall_average = round(statistics.mean(all_scores), 2) if all_scores else 0
                overall_grade = self._calculate_letter_grade(overall_average)
                
                # Calculate performance by assessment type
                formative_scores = [float(a['percentage_score']) for a in assessments 
                                  if a['assessment_type'] == 'formative' and a['percentage_score'] is not None]
                summative_scores = [float(a['percentage_score']) for a in assessments 
                                  if a['assessment_type'] == 'summative' and a['percentage_score'] is not None]
                project_scores = [float(a['percentage_score']) for a in assessments 
                                if a['assessment_type'] == 'project' and a['percentage_score'] is not None]
                
                formative_average = round(statistics.mean(formative_scores), 2) if formative_scores else None
                summative_average = round(statistics.mean(summative_scores), 2) if summative_scores else None
                project_average = round(statistics.mean(project_scores), 2) if project_scores else None
                
                # Calculate skill area performance
                skill_scores = self._calculate_skill_performance(assessments)
                
                # Determine strength and improvement areas
                strength_areas, improvement_areas = self._identify_strength_improvement_areas(skill_scores)
                
                # Calculate engagement metrics
                engagement_metrics = self._calculate_engagement_metrics(student_id, class_id, academic_year)
                
                # Calculate learning progress
                learning_progress = self._calculate_learning_progress(student_id, class_id, subject)
                
                # Determine risk level and predictions
                risk_analysis = self._calculate_risk_level(overall_average, engagement_metrics, all_scores)
                
                # Get class rank and percentile
                class_stats = self._get_class_statistics(class_id, subject, academic_year)
                class_rank, class_percentile = self._calculate_class_position(overall_average, class_stats)
                
                # Prepare analytics data
                analytics_data = {
                    'student_id': student_id,
                    'class_id': class_id,
                    'subject': subject,
                    'academic_year': academic_year,
                    'analysis_date': date.today(),
                    'overall_average': overall_average,
                    'overall_grade': overall_grade,
                    'class_rank': class_rank,
                    'class_percentile': class_percentile,
                    'formative_average': formative_average,
                    'summative_average': summative_average,
                    'project_average': project_average,
                    'skill_scores': json.dumps(skill_scores),
                    'strength_areas': strength_areas,
                    'improvement_areas': improvement_areas,
                    'attendance_percentage': engagement_metrics.get('attendance_percentage'),
                    'assignment_completion_rate': engagement_metrics.get('assignment_completion_rate'),
                    'participation_level': engagement_metrics.get('participation_level'),
                    'engagement_trend': engagement_metrics.get('engagement_trend'),
                    'learning_objectives_met': learning_progress.get('objectives_met'),
                    'learning_objectives_total': learning_progress.get('objectives_total'),
                    'standards_mastered': learning_progress.get('standards_mastered'),
                    'standards_developing': learning_progress.get('standards_developing'),
                    'standards_beginning': learning_progress.get('standards_beginning'),
                    'homework_completion_rate': engagement_metrics.get('homework_completion_rate'),
                    'on_time_submission_rate': engagement_metrics.get('on_time_submission_rate'),
                    'risk_level': risk_analysis.get('risk_level'),
                    'predicted_final_grade': risk_analysis.get('predicted_final_grade'),
                    'intervention_recommended': risk_analysis.get('intervention_recommended'),
                    'intervention_type': risk_analysis.get('intervention_type')
                }
                
                # Insert or update analytics record
                self._save_student_analytics(analytics_data)
                
                return {
                    'success': True,
                    'analytics': analytics_data,
                    'assessment_count': len(assessments),
                    'latest_assessment_date': max([a['submission_date'] for a in assessments]).isoformat() if assessments else None
                }
                
        except Exception as e:
            logger.error(f"Error calculating student performance analytics: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to calculate analytics: {str(e)}'
            }
    
    def calculate_class_performance_analytics(self, class_id: str, subject: str, academic_year: str, educator_id: str) -> Dict[str, Any]:
        """Calculate comprehensive performance analytics for a class"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get class demographics
                demographics_query = """
                    SELECT COUNT(*) as total_students,
                           COUNT(CASE WHEN s.gender = 'male' THEN 1 END) as male_students,
                           COUNT(CASE WHEN s.gender = 'female' THEN 1 END) as female_students,
                           COUNT(CASE WHEN s.nationality = 'UAE' THEN 1 END) as uae_nationals,
                           COUNT(CASE WHEN s.nationality != 'UAE' THEN 1 END) as expatriate_students
                    FROM students s
                    JOIN class_enrollments ce ON s.id = ce.student_id
                    WHERE ce.class_id = %s AND ce.enrollment_status = 'active'
                """
                cursor.execute(demographics_query, [class_id])
                demographics = cursor.fetchone()
                
                # Get all assessment results for the class
                class_assessments_query = """
                    SELECT sar.percentage_score, sar.letter_grade, ap.assessment_type,
                           ap.learning_objectives, ap.standards_alignment
                    FROM student_assessment_results sar
                    JOIN assessment_plans ap ON sar.assessment_id = ap.id
                    WHERE ap.class_id = %s AND ap.subject = %s 
                    AND ap.academic_year = %s AND sar.completion_status = 'graded'
                """
                cursor.execute(class_assessments_query, [class_id, subject, academic_year])
                class_results = cursor.fetchall()
                
                if not class_results:
                    return {
                        'success': False,
                        'error': 'No graded assessments found for this class'
                    }
                
                # Calculate class performance statistics
                all_scores = [float(r['percentage_score']) for r in class_results if r['percentage_score'] is not None]
                
                class_average = round(statistics.mean(all_scores), 2) if all_scores else 0
                median_score = round(statistics.median(all_scores), 2) if all_scores else 0
                highest_score = round(max(all_scores), 2) if all_scores else 0
                lowest_score = round(min(all_scores), 2) if all_scores else 0
                standard_deviation = round(statistics.stdev(all_scores), 4) if len(all_scores) > 1 else 0
                
                # Calculate grade distribution
                grade_distribution = self._calculate_grade_distribution(class_results)
                
                # Calculate performance by assessment type
                formative_scores = [float(r['percentage_score']) for r in class_results 
                                  if r['assessment_type'] == 'formative' and r['percentage_score'] is not None]
                summative_scores = [float(r['percentage_score']) for r in class_results 
                                  if r['assessment_type'] == 'summative' and r['percentage_score'] is not None]
                project_scores = [float(r['percentage_score']) for r in class_results 
                                if r['assessment_type'] == 'project' and r['percentage_score'] is not None]
                
                formative_class_average = round(statistics.mean(formative_scores), 2) if formative_scores else None
                summative_class_average = round(statistics.mean(summative_scores), 2) if summative_scores else None
                project_class_average = round(statistics.mean(project_scores), 2) if project_scores else None
                
                # Calculate standards performance
                standards_performance = self._calculate_standards_performance(class_results)
                
                # Calculate engagement metrics for the class
                class_engagement = self._calculate_class_engagement_metrics(class_id, academic_year)
                
                # Risk analysis
                risk_analysis = self._calculate_class_risk_analysis(class_id, subject, academic_year)
                
                # Prepare class analytics data
                analytics_data = {
                    'class_id': class_id,
                    'educator_id': educator_id,
                    'subject': subject,
                    'academic_year': academic_year,
                    'analysis_date': date.today(),
                    'total_students': demographics['total_students'],
                    'active_students': demographics['total_students'],  # Assuming all are active
                    'male_students': demographics['male_students'],
                    'female_students': demographics['female_students'],
                    'uae_nationals': demographics['uae_nationals'],
                    'expatriate_students': demographics['expatriate_students'],
                    'class_average': class_average,
                    'median_score': median_score,
                    'highest_score': highest_score,
                    'lowest_score': lowest_score,
                    'standard_deviation': standard_deviation,
                    'grade_a_count': grade_distribution.get('A', 0),
                    'grade_b_count': grade_distribution.get('B', 0),
                    'grade_c_count': grade_distribution.get('C', 0),
                    'grade_d_count': grade_distribution.get('D', 0),
                    'grade_f_count': grade_distribution.get('F', 0),
                    'formative_class_average': formative_class_average,
                    'summative_class_average': summative_class_average,
                    'project_class_average': project_class_average,
                    'standards_performance': json.dumps(standards_performance),
                    'average_attendance': class_engagement.get('average_attendance'),
                    'average_participation': class_engagement.get('average_participation'),
                    'assignment_completion_rate': class_engagement.get('assignment_completion_rate'),
                    'students_at_risk': risk_analysis.get('students_at_risk'),
                    'students_excelling': risk_analysis.get('students_excelling'),
                    'intervention_needed_count': risk_analysis.get('intervention_needed_count')
                }
                
                # Save class analytics
                self._save_class_analytics(analytics_data)
                
                return {
                    'success': True,
                    'analytics': analytics_data,
                    'total_assessments': len(class_results)
                }
                
        except Exception as e:
            logger.error(f"Error calculating class performance analytics: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to calculate class analytics: {str(e)}'
            }
    
    def analyze_assessment_performance(self, assessment_id: str, educator_id: str) -> Dict[str, Any]:
        """Analyze performance for a specific assessment"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get assessment details
                assessment_query = """
                    SELECT ap.*, c.class_name
                    FROM assessment_plans ap
                    JOIN classes c ON ap.class_id = c.id
                    WHERE ap.id = %s AND ap.educator_id = %s
                """
                cursor.execute(assessment_query, [assessment_id, educator_id])
                assessment = cursor.fetchone()
                
                if not assessment:
                    return {
                        'success': False,
                        'error': 'Assessment not found or access denied'
                    }
                
                # Get all student results for this assessment
                results_query = """
                    SELECT sar.*, s.first_name, s.last_name
                    FROM student_assessment_results sar
                    JOIN students s ON sar.student_id = s.id
                    WHERE sar.assessment_id = %s
                    ORDER BY sar.submission_date
                """
                cursor.execute(results_query, [assessment_id])
                results = cursor.fetchall()
                
                # Calculate participation metrics
                total_students = len(results)
                completed_students = len([r for r in results if r['completion_status'] == 'graded'])
                in_progress_students = len([r for r in results if r['completion_status'] == 'in_progress'])
                not_started_students = total_students - completed_students - in_progress_students
                completion_rate = round((completed_students / total_students) * 100, 2) if total_students > 0 else 0
                
                # Calculate score statistics for completed assessments
                completed_results = [r for r in results if r['completion_status'] == 'graded' and r['percentage_score'] is not None]
                
                if completed_results:
                    scores = [float(r['percentage_score']) for r in completed_results]
                    
                    mean_score = round(statistics.mean(scores), 2)
                    median_score = round(statistics.median(scores), 2)
                    highest_score = round(max(scores), 2)
                    lowest_score = round(min(scores), 2)
                    standard_deviation = round(statistics.stdev(scores), 4) if len(scores) > 1 else 0
                    
                    # Calculate grade distribution
                    grade_distribution = {}
                    for result in completed_results:
                        grade = result['letter_grade'] or self._calculate_letter_grade(result['percentage_score'])
                        grade_distribution[grade] = grade_distribution.get(grade, 0) + 1
                    
                    # Calculate pass rate (assuming 60% is passing)
                    pass_rate = round((len([s for s in scores if s >= 60]) / len(scores)) * 100, 2)
                    excellence_rate = round((len([s for s in scores if s >= 90]) / len(scores)) * 100, 2)
                    
                    # Calculate time analysis
                    time_data = [r['time_taken_minutes'] for r in completed_results if r['time_taken_minutes'] is not None]
                    if time_data:
                        avg_completion_time = round(statistics.mean(time_data))
                        median_completion_time = round(statistics.median(time_data))
                        fastest_completion = min(time_data)
                        slowest_completion = max(time_data)
                    else:
                        avg_completion_time = median_completion_time = fastest_completion = slowest_completion = None
                    
                else:
                    mean_score = median_score = highest_score = lowest_score = standard_deviation = 0
                    grade_distribution = {}
                    pass_rate = excellence_rate = 0
                    avg_completion_time = median_completion_time = fastest_completion = slowest_completion = None
                
                # Prepare assessment analytics
                analytics_data = {
                    'assessment_id': assessment_id,
                    'class_id': assessment['class_id'],
                    'educator_id': educator_id,
                    'analysis_date': date.today(),
                    'total_students': total_students,
                    'students_completed': completed_students,
                    'students_in_progress': in_progress_students,
                    'students_not_started': not_started_students,
                    'completion_rate': completion_rate,
                    'mean_score': mean_score,
                    'median_score': median_score,
                    'highest_score': highest_score,
                    'lowest_score': lowest_score,
                    'standard_deviation': standard_deviation,
                    'grade_distribution': json.dumps(grade_distribution),
                    'pass_rate': pass_rate,
                    'excellence_rate': excellence_rate,
                    'average_completion_time': avg_completion_time,
                    'median_completion_time': median_completion_time,
                    'fastest_completion': fastest_completion,
                    'slowest_completion': slowest_completion
                }
                
                # Save assessment analytics
                self._save_assessment_analytics(analytics_data)
                
                return {
                    'success': True,
                    'assessment_info': dict(assessment),
                    'analytics': analytics_data,
                    'student_results': [dict(r) for r in results]
                }
                
        except Exception as e:
            logger.error(f"Error analyzing assessment performance: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to analyze assessment: {str(e)}'
            }
    
    def track_learning_progress(self, student_id: str, class_id: str, standard_id: str, 
                               assessment_data: Dict[str, Any], educator_id: str) -> Dict[str, Any]:
        """Track learning progress for a specific standard"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get previous progress record
                previous_query = """
                    SELECT * FROM learning_progress_tracking
                    WHERE student_id = %s AND class_id = %s AND standard_id = %s
                    ORDER BY assessment_date DESC
                    LIMIT 1
                """
                cursor.execute(previous_query, [student_id, class_id, standard_id])
                previous_record = cursor.fetchone()
                
                # Determine progress rate
                current_level = assessment_data.get('current_level')
                if previous_record:
                    previous_level = previous_record['current_level']
                    progress_rate = self._calculate_progress_rate(previous_level, current_level)
                else:
                    progress_rate = 'on_track'
                
                # Determine if mastery is achieved
                mastery_achieved = current_level in ['proficient', 'advanced']
                mastery_date = date.today() if mastery_achieved else None
                
                # Insert new progress record
                insert_query = """
                    INSERT INTO learning_progress_tracking (
                        student_id, class_id, standard_id, learning_objective,
                        skill_area, initial_level, current_level, target_level,
                        assessment_date, assessment_method, evidence_collected,
                        score_achieved, score_possible, progress_rate,
                        mastery_achieved, mastery_date, support_provided,
                        intervention_applied, accommodations_used,
                        next_learning_goals, recommended_activities,
                        target_mastery_date, educator_observations,
                        parent_communication, student_self_reflection,
                        created_by
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) RETURNING id
                """
                
                cursor.execute(insert_query, [
                    student_id, class_id, standard_id,
                    assessment_data.get('learning_objective'),
                    assessment_data.get('skill_area'),
                    assessment_data.get('initial_level', 'not_introduced'),
                    current_level,
                    assessment_data.get('target_level', 'proficient'),
                    assessment_data.get('assessment_date', date.today()),
                    assessment_data.get('assessment_method'),
                    assessment_data.get('evidence_collected'),
                    assessment_data.get('score_achieved'),
                    assessment_data.get('score_possible'),
                    progress_rate,
                    mastery_achieved,
                    mastery_date,
                    assessment_data.get('support_provided'),
                    assessment_data.get('intervention_applied'),
                    assessment_data.get('accommodations_used', []),
                    assessment_data.get('next_learning_goals'),
                    assessment_data.get('recommended_activities', []),
                    assessment_data.get('target_mastery_date'),
                    assessment_data.get('educator_observations'),
                    assessment_data.get('parent_communication'),
                    assessment_data.get('student_self_reflection'),
                    educator_id
                ])
                
                progress_id = cursor.fetchone()[0]
                self.db_connection.commit()
                
                return {
                    'success': True,
                    'progress_id': progress_id,
                    'progress_rate': progress_rate,
                    'mastery_achieved': mastery_achieved,
                    'mastery_date': mastery_date.isoformat() if mastery_date else None
                }
                
        except Exception as e:
            logger.error(f"Error tracking learning progress: {str(e)}")
            self.db_connection.rollback()
            return {
                'success': False,
                'error': f'Failed to track progress: {str(e)}'
            }
    
    def get_performance_benchmarks(self, subject: str, grade_level: int, benchmark_type: str = 'national') -> Dict[str, Any]:
        """Get performance benchmarks for comparison"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                    SELECT * FROM performance_benchmarks
                    WHERE subject = %s AND grade_level = %s AND benchmark_type = %s
                    AND is_active = true
                    ORDER BY academic_year DESC
                    LIMIT 1
                """
                cursor.execute(query, [subject, grade_level, benchmark_type])
                benchmark = cursor.fetchone()
                
                if benchmark:
                    return {
                        'success': True,
                        'benchmark': dict(benchmark)
                    }
                else:
                    return {
                        'success': False,
                        'error': 'No benchmarks found for the specified criteria'
                    }
                    
        except Exception as e:
            logger.error(f"Error getting performance benchmarks: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get benchmarks: {str(e)}'
            }
    
    # Helper methods
    
    def _calculate_letter_grade(self, percentage: float) -> str:
        """Calculate letter grade from percentage"""
        if percentage >= 90:
            return 'A'
        elif percentage >= 80:
            return 'B'
        elif percentage >= 70:
            return 'C'
        elif percentage >= 60:
            return 'D'
        else:
            return 'F'
    
    def _calculate_skill_performance(self, assessments: List[Dict]) -> Dict[str, float]:
        """Calculate performance by skill area"""
        skill_scores = defaultdict(list)
        
        for assessment in assessments:
            if assessment.get('rubric_scores'):
                try:
                    rubric_data = json.loads(assessment['rubric_scores'])
                    for skill, score in rubric_data.items():
                        if isinstance(score, (int, float)):
                            skill_scores[skill].append(float(score))
                except (json.JSONDecodeError, TypeError):
                    continue
        
        # Calculate average for each skill
        return {skill: round(statistics.mean(scores), 2) 
                for skill, scores in skill_scores.items() if scores}
    
    def _identify_strength_improvement_areas(self, skill_scores: Dict[str, float]) -> tuple:
        """Identify strength and improvement areas"""
        if not skill_scores:
            return [], []
        
        scores_list = list(skill_scores.values())
        avg_score = statistics.mean(scores_list)
        
        strength_areas = [skill for skill, score in skill_scores.items() if score > avg_score + 5]
        improvement_areas = [skill for skill, score in skill_scores.items() if score < avg_score - 5]
        
        return strength_areas, improvement_areas
    
    def _calculate_engagement_metrics(self, student_id: str, class_id: str, academic_year: str) -> Dict[str, Any]:
        """Calculate student engagement metrics"""
        # This would integrate with attendance and participation tracking
        # For now, return sample data
        return {
            'attendance_percentage': 92.5,
            'assignment_completion_rate': 88.0,
            'participation_level': 4,
            'engagement_trend': 'stable',
            'homework_completion_rate': 85.0,
            'on_time_submission_rate': 90.0
        }
    
    def _calculate_learning_progress(self, student_id: str, class_id: str, subject: str) -> Dict[str, int]:
        """Calculate learning progress metrics"""
        # This would integrate with standards tracking
        # For now, return sample data
        return {
            'objectives_met': 15,
            'objectives_total': 20,
            'standards_mastered': 8,
            'standards_developing': 5,
            'standards_beginning': 2
        }
    
    def _calculate_risk_level(self, overall_average: float, engagement_metrics: Dict, score_history: List[float]) -> Dict[str, Any]:
        """Calculate risk level and predictions"""
        risk_factors = 0
        
        if overall_average < 60:
            risk_factors += 2
        elif overall_average < 70:
            risk_factors += 1
        
        if engagement_metrics.get('attendance_percentage', 100) < 80:
            risk_factors += 1
        
        if engagement_metrics.get('assignment_completion_rate', 100) < 70:
            risk_factors += 1
        
        # Analyze trend
        if len(score_history) >= 3:
            recent_trend = score_history[-3:]
            if all(recent_trend[i] <= recent_trend[i-1] for i in range(1, len(recent_trend))):
                risk_factors += 1
        
        if risk_factors >= 3:
            risk_level = 'critical'
        elif risk_factors == 2:
            risk_level = 'high'
        elif risk_factors == 1:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        predicted_final_grade = self._calculate_letter_grade(max(overall_average - (risk_factors * 5), 0))
        intervention_recommended = risk_factors >= 2
        
        intervention_types = []
        if risk_factors >= 2:
            intervention_types.append('academic_support')
        if engagement_metrics.get('attendance_percentage', 100) < 80:
            intervention_types.append('attendance_monitoring')
        if engagement_metrics.get('assignment_completion_rate', 100) < 70:
            intervention_types.append('assignment_support')
        
        return {
            'risk_level': risk_level,
            'predicted_final_grade': predicted_final_grade,
            'intervention_recommended': intervention_recommended,
            'intervention_type': intervention_types
        }
    
    def _get_class_statistics(self, class_id: str, subject: str, academic_year: str) -> List[float]:
        """Get class performance statistics for ranking"""
        try:
            with self.db_connection.cursor() as cursor:
                query = """
                    SELECT AVG(sar.percentage_score) as avg_score
                    FROM student_assessment_results sar
                    JOIN assessment_plans ap ON sar.assessment_id = ap.id
                    WHERE ap.class_id = %s AND ap.subject = %s 
                    AND ap.academic_year = %s AND sar.completion_status = 'graded'
                    GROUP BY sar.student_id
                """
                cursor.execute(query, [class_id, subject, academic_year])
                results = cursor.fetchall()
                return [float(r[0]) for r in results if r[0] is not None]
        except Exception:
            return []
    
    def _calculate_class_position(self, student_average: float, class_averages: List[float]) -> tuple:
        """Calculate class rank and percentile"""
        if not class_averages:
            return None, None
        
        sorted_averages = sorted(class_averages, reverse=True)
        rank = sorted_averages.index(student_average) + 1 if student_average in sorted_averages else len(sorted_averages)
        percentile = round(((len(sorted_averages) - rank + 1) / len(sorted_averages)) * 100, 1)
        
        return rank, percentile
    
    def _calculate_grade_distribution(self, results: List[Dict]) -> Dict[str, int]:
        """Calculate grade distribution"""
        distribution = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0}
        
        for result in results:
            grade = result['letter_grade'] or self._calculate_letter_grade(result['percentage_score'])
            if grade in distribution:
                distribution[grade] += 1
        
        return distribution
    
    def _calculate_standards_performance(self, results: List[Dict]) -> Dict[str, float]:
        """Calculate performance by standards"""
        # This would analyze standards alignment from assessments
        # For now, return sample data
        return {
            'UAE-MATH-G5-1.1': 85.5,
            'UAE-MATH-G5-1.2': 78.2,
            'UAE-MATH-G5-2.1': 92.1
        }
    
    def _calculate_class_engagement_metrics(self, class_id: str, academic_year: str) -> Dict[str, float]:
        """Calculate class-level engagement metrics"""
        # This would integrate with attendance and participation systems
        return {
            'average_attendance': 91.2,
            'average_participation': 3.8,
            'assignment_completion_rate': 86.5
        }
    
    def _calculate_class_risk_analysis(self, class_id: str, subject: str, academic_year: str) -> Dict[str, int]:
        """Calculate class risk analysis"""
        # This would analyze individual student risk levels
        return {
            'students_at_risk': 3,
            'students_excelling': 8,
            'intervention_needed_count': 5
        }
    
    def _calculate_progress_rate(self, previous_level: str, current_level: str) -> str:
        """Calculate progress rate between levels"""
        levels = ['not_introduced', 'beginning', 'developing', 'proficient', 'advanced']
        
        try:
            prev_index = levels.index(previous_level)
            curr_index = levels.index(current_level)
            
            if curr_index > prev_index + 1:
                return 'accelerated'
            elif curr_index > prev_index:
                return 'on_track'
            elif curr_index == prev_index:
                return 'stagnant'
            else:
                return 'regressing'
        except ValueError:
            return 'on_track'
    
    def _save_student_analytics(self, analytics_data: Dict[str, Any]):
        """Save student analytics to database"""
        try:
            with self.db_connection.cursor() as cursor:
                # Check if record exists
                check_query = """
                    SELECT id FROM student_performance_analytics
                    WHERE student_id = %s AND class_id = %s AND subject = %s AND analysis_date = %s
                """
                cursor.execute(check_query, [
                    analytics_data['student_id'],
                    analytics_data['class_id'],
                    analytics_data['subject'],
                    analytics_data['analysis_date']
                ])
                
                if cursor.fetchone():
                    # Update existing record
                    update_query = """
                        UPDATE student_performance_analytics SET
                        overall_average = %s, overall_grade = %s, class_rank = %s,
                        class_percentile = %s, formative_average = %s, summative_average = %s,
                        project_average = %s, skill_scores = %s, strength_areas = %s,
                        improvement_areas = %s, attendance_percentage = %s,
                        assignment_completion_rate = %s, participation_level = %s,
                        engagement_trend = %s, learning_objectives_met = %s,
                        learning_objectives_total = %s, standards_mastered = %s,
                        standards_developing = %s, standards_beginning = %s,
                        homework_completion_rate = %s, on_time_submission_rate = %s,
                        risk_level = %s, predicted_final_grade = %s,
                        intervention_recommended = %s, intervention_type = %s,
                        updated_at = CURRENT_TIMESTAMP
                        WHERE student_id = %s AND class_id = %s AND subject = %s AND analysis_date = %s
                    """
                    cursor.execute(update_query, [
                        analytics_data['overall_average'], analytics_data['overall_grade'],
                        analytics_data['class_rank'], analytics_data['class_percentile'],
                        analytics_data['formative_average'], analytics_data['summative_average'],
                        analytics_data['project_average'], analytics_data['skill_scores'],
                        analytics_data['strength_areas'], analytics_data['improvement_areas'],
                        analytics_data['attendance_percentage'], analytics_data['assignment_completion_rate'],
                        analytics_data['participation_level'], analytics_data['engagement_trend'],
                        analytics_data['learning_objectives_met'], analytics_data['learning_objectives_total'],
                        analytics_data['standards_mastered'], analytics_data['standards_developing'],
                        analytics_data['standards_beginning'], analytics_data['homework_completion_rate'],
                        analytics_data['on_time_submission_rate'], analytics_data['risk_level'],
                        analytics_data['predicted_final_grade'], analytics_data['intervention_recommended'],
                        analytics_data['intervention_type'], analytics_data['student_id'],
                        analytics_data['class_id'], analytics_data['subject'], analytics_data['analysis_date']
                    ])
                else:
                    # Insert new record
                    insert_query = """
                        INSERT INTO student_performance_analytics (
                            student_id, class_id, subject, academic_year, analysis_date,
                            overall_average, overall_grade, class_rank, class_percentile,
                            formative_average, summative_average, project_average,
                            skill_scores, strength_areas, improvement_areas,
                            attendance_percentage, assignment_completion_rate,
                            participation_level, engagement_trend, learning_objectives_met,
                            learning_objectives_total, standards_mastered, standards_developing,
                            standards_beginning, homework_completion_rate, on_time_submission_rate,
                            risk_level, predicted_final_grade, intervention_recommended,
                            intervention_type
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """
                    cursor.execute(insert_query, [
                        analytics_data['student_id'], analytics_data['class_id'],
                        analytics_data['subject'], analytics_data['academic_year'],
                        analytics_data['analysis_date'], analytics_data['overall_average'],
                        analytics_data['overall_grade'], analytics_data['class_rank'],
                        analytics_data['class_percentile'], analytics_data['formative_average'],
                        analytics_data['summative_average'], analytics_data['project_average'],
                        analytics_data['skill_scores'], analytics_data['strength_areas'],
                        analytics_data['improvement_areas'], analytics_data['attendance_percentage'],
                        analytics_data['assignment_completion_rate'], analytics_data['participation_level'],
                        analytics_data['engagement_trend'], analytics_data['learning_objectives_met'],
                        analytics_data['learning_objectives_total'], analytics_data['standards_mastered'],
                        analytics_data['standards_developing'], analytics_data['standards_beginning'],
                        analytics_data['homework_completion_rate'], analytics_data['on_time_submission_rate'],
                        analytics_data['risk_level'], analytics_data['predicted_final_grade'],
                        analytics_data['intervention_recommended'], analytics_data['intervention_type']
                    ])
                
                self.db_connection.commit()
                
        except Exception as e:
            logger.error(f"Error saving student analytics: {str(e)}")
            self.db_connection.rollback()
    
    def _save_class_analytics(self, analytics_data: Dict[str, Any]):
        """Save class analytics to database"""
        try:
            with self.db_connection.cursor() as cursor:
                # Check if record exists
                check_query = """
                    SELECT id FROM class_performance_analytics
                    WHERE class_id = %s AND subject = %s AND analysis_date = %s
                """
                cursor.execute(check_query, [
                    analytics_data['class_id'],
                    analytics_data['subject'],
                    analytics_data['analysis_date']
                ])
                
                if cursor.fetchone():
                    # Update existing record
                    update_query = """
                        UPDATE class_performance_analytics SET
                        educator_id = %s, academic_year = %s, total_students = %s,
                        active_students = %s, male_students = %s, female_students = %s,
                        uae_nationals = %s, expatriate_students = %s, class_average = %s,
                        median_score = %s, highest_score = %s, lowest_score = %s,
                        standard_deviation = %s, grade_a_count = %s, grade_b_count = %s,
                        grade_c_count = %s, grade_d_count = %s, grade_f_count = %s,
                        formative_class_average = %s, summative_class_average = %s,
                        project_class_average = %s, standards_performance = %s,
                        average_attendance = %s, average_participation = %s,
                        assignment_completion_rate = %s, students_at_risk = %s,
                        students_excelling = %s, intervention_needed_count = %s,
                        updated_at = CURRENT_TIMESTAMP
                        WHERE class_id = %s AND subject = %s AND analysis_date = %s
                    """
                    cursor.execute(update_query, [
                        analytics_data['educator_id'], analytics_data['academic_year'],
                        analytics_data['total_students'], analytics_data['active_students'],
                        analytics_data['male_students'], analytics_data['female_students'],
                        analytics_data['uae_nationals'], analytics_data['expatriate_students'],
                        analytics_data['class_average'], analytics_data['median_score'],
                        analytics_data['highest_score'], analytics_data['lowest_score'],
                        analytics_data['standard_deviation'], analytics_data['grade_a_count'],
                        analytics_data['grade_b_count'], analytics_data['grade_c_count'],
                        analytics_data['grade_d_count'], analytics_data['grade_f_count'],
                        analytics_data['formative_class_average'], analytics_data['summative_class_average'],
                        analytics_data['project_class_average'], analytics_data['standards_performance'],
                        analytics_data['average_attendance'], analytics_data['average_participation'],
                        analytics_data['assignment_completion_rate'], analytics_data['students_at_risk'],
                        analytics_data['students_excelling'], analytics_data['intervention_needed_count'],
                        analytics_data['class_id'], analytics_data['subject'], analytics_data['analysis_date']
                    ])
                else:
                    # Insert new record
                    insert_query = """
                        INSERT INTO class_performance_analytics (
                            class_id, educator_id, subject, academic_year, analysis_date,
                            total_students, active_students, male_students, female_students,
                            uae_nationals, expatriate_students, class_average, median_score,
                            highest_score, lowest_score, standard_deviation, grade_a_count,
                            grade_b_count, grade_c_count, grade_d_count, grade_f_count,
                            formative_class_average, summative_class_average, project_class_average,
                            standards_performance, average_attendance, average_participation,
                            assignment_completion_rate, students_at_risk, students_excelling,
                            intervention_needed_count
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """
                    cursor.execute(insert_query, [
                        analytics_data['class_id'], analytics_data['educator_id'],
                        analytics_data['subject'], analytics_data['academic_year'],
                        analytics_data['analysis_date'], analytics_data['total_students'],
                        analytics_data['active_students'], analytics_data['male_students'],
                        analytics_data['female_students'], analytics_data['uae_nationals'],
                        analytics_data['expatriate_students'], analytics_data['class_average'],
                        analytics_data['median_score'], analytics_data['highest_score'],
                        analytics_data['lowest_score'], analytics_data['standard_deviation'],
                        analytics_data['grade_a_count'], analytics_data['grade_b_count'],
                        analytics_data['grade_c_count'], analytics_data['grade_d_count'],
                        analytics_data['grade_f_count'], analytics_data['formative_class_average'],
                        analytics_data['summative_class_average'], analytics_data['project_class_average'],
                        analytics_data['standards_performance'], analytics_data['average_attendance'],
                        analytics_data['average_participation'], analytics_data['assignment_completion_rate'],
                        analytics_data['students_at_risk'], analytics_data['students_excelling'],
                        analytics_data['intervention_needed_count']
                    ])
                
                self.db_connection.commit()
                
        except Exception as e:
            logger.error(f"Error saving class analytics: {str(e)}")
            self.db_connection.rollback()
    
    def _save_assessment_analytics(self, analytics_data: Dict[str, Any]):
        """Save assessment analytics to database"""
        try:
            with self.db_connection.cursor() as cursor:
                # Check if record exists
                check_query = """
                    SELECT id FROM assessment_analytics
                    WHERE assessment_id = %s AND analysis_date = %s
                """
                cursor.execute(check_query, [
                    analytics_data['assessment_id'],
                    analytics_data['analysis_date']
                ])
                
                if cursor.fetchone():
                    # Update existing record
                    update_query = """
                        UPDATE assessment_analytics SET
                        total_students = %s, students_completed = %s, students_in_progress = %s,
                        students_not_started = %s, completion_rate = %s, mean_score = %s,
                        median_score = %s, highest_score = %s, lowest_score = %s,
                        standard_deviation = %s, grade_distribution = %s, pass_rate = %s,
                        excellence_rate = %s, average_completion_time = %s,
                        median_completion_time = %s, fastest_completion = %s,
                        slowest_completion = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE assessment_id = %s AND analysis_date = %s
                    """
                    cursor.execute(update_query, [
                        analytics_data['total_students'], analytics_data['students_completed'],
                        analytics_data['students_in_progress'], analytics_data['students_not_started'],
                        analytics_data['completion_rate'], analytics_data['mean_score'],
                        analytics_data['median_score'], analytics_data['highest_score'],
                        analytics_data['lowest_score'], analytics_data['standard_deviation'],
                        analytics_data['grade_distribution'], analytics_data['pass_rate'],
                        analytics_data['excellence_rate'], analytics_data['average_completion_time'],
                        analytics_data['median_completion_time'], analytics_data['fastest_completion'],
                        analytics_data['slowest_completion'], analytics_data['assessment_id'],
                        analytics_data['analysis_date']
                    ])
                else:
                    # Insert new record
                    insert_query = """
                        INSERT INTO assessment_analytics (
                            assessment_id, class_id, educator_id, analysis_date,
                            total_students, students_completed, students_in_progress,
                            students_not_started, completion_rate, mean_score, median_score,
                            highest_score, lowest_score, standard_deviation, grade_distribution,
                            pass_rate, excellence_rate, average_completion_time,
                            median_completion_time, fastest_completion, slowest_completion
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s
                        )
                    """
                    cursor.execute(insert_query, [
                        analytics_data['assessment_id'], analytics_data['class_id'],
                        analytics_data['educator_id'], analytics_data['analysis_date'],
                        analytics_data['total_students'], analytics_data['students_completed'],
                        analytics_data['students_in_progress'], analytics_data['students_not_started'],
                        analytics_data['completion_rate'], analytics_data['mean_score'],
                        analytics_data['median_score'], analytics_data['highest_score'],
                        analytics_data['lowest_score'], analytics_data['standard_deviation'],
                        analytics_data['grade_distribution'], analytics_data['pass_rate'],
                        analytics_data['excellence_rate'], analytics_data['average_completion_time'],
                        analytics_data['median_completion_time'], analytics_data['fastest_completion'],
                        analytics_data['slowest_completion']
                    ])
                
                self.db_connection.commit()
                
        except Exception as e:
            logger.error(f"Error saving assessment analytics: {str(e)}")
            self.db_connection.rollback()
