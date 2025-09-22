"""
Competency Validation Framework for Emirati Journey Platform
Handles competency assessment, validation, and scoring
"""

import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProficiencyLevel(Enum):
    """Proficiency levels for competency assessment"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class AssessmentMethod(Enum):
    """Available assessment methods"""
    MULTIPLE_CHOICE = "multiple_choice"
    ESSAY = "essay"
    PRACTICAL = "practical"
    SCENARIO = "scenario"
    PORTFOLIO = "portfolio"
    INTERVIEW = "interview"
    OBSERVATION = "observation"

@dataclass
class CompetencyAssessment:
    """Individual competency assessment result"""
    competency_id: int
    assessment_method: str
    raw_score: float
    weighted_score: float
    proficiency_level: str
    evidence_quality: float
    assessor_confidence: float
    feedback: str
    improvement_areas: List[str]

@dataclass
class ValidationCriteria:
    """Criteria for competency validation"""
    minimum_score: float = 70.0
    required_evidence_types: List[str] = None
    peer_validation_required: bool = False
    industry_validation_required: bool = False
    time_limit_minutes: Optional[int] = None
    retake_policy: Dict[str, Any] = None

class CompetencyValidationFramework:
    """Core framework for competency validation and assessment"""
    
    def __init__(self, db_connection_string: str):
        self.db_connection_string = db_connection_string
        self.connection = None
        
        # Scoring weights for different assessment methods
        self.method_weights = {
            AssessmentMethod.MULTIPLE_CHOICE.value: 0.6,
            AssessmentMethod.ESSAY.value: 0.8,
            AssessmentMethod.PRACTICAL.value: 1.0,
            AssessmentMethod.SCENARIO.value: 0.9,
            AssessmentMethod.PORTFOLIO.value: 0.95,
            AssessmentMethod.INTERVIEW.value: 0.85,
            AssessmentMethod.OBSERVATION.value: 0.9
        }
        
        # Proficiency level thresholds
        self.proficiency_thresholds = {
            ProficiencyLevel.BEGINNER.value: (0, 50),
            ProficiencyLevel.INTERMEDIATE.value: (50, 75),
            ProficiencyLevel.ADVANCED.value: (75, 90),
            ProficiencyLevel.EXPERT.value: (90, 100)
        }
    
    def connect_db(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(
                self.db_connection_string,
                cursor_factory=RealDictCursor
            )
            logger.info("Database connection established for competency validation")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def close_db(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def validate_competency(self, assessment_id: int, competency_id: int, 
                          assessment_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate a competency based on assessment results
        
        Args:
            assessment_id: ID of the assessment
            competency_id: ID of the competency being validated
            assessment_results: List of assessment result dictionaries
            
        Returns:
            Validation result with score, proficiency level, and recommendations
        """
        try:
            with self.connection.cursor() as cursor:
                # Get competency model and validation criteria
                cursor.execute("""
                SELECT * FROM competency_models WHERE id = %s
                """, (competency_id,))
                
                competency = cursor.fetchone()
                if not competency:
                    return {
                        "success": False,
                        "message": "Competency model not found"
                    }
                
                competency_def = json.loads(competency['competency_definition'])
                validation_criteria = json.loads(competency.get('validation_criteria', '{}'))
                proficiency_levels = json.loads(competency['proficiency_levels'])
                
                # Calculate weighted scores
                total_weighted_score = 0
                total_weight = 0
                method_scores = {}
                evidence_quality_scores = []
                
                for result in assessment_results:
                    method = result.get('assessment_method', 'multiple_choice')
                    raw_score = float(result.get('score', 0))
                    evidence_quality = float(result.get('evidence_quality', 1.0))
                    
                    # Apply method weight
                    method_weight = self.method_weights.get(method, 0.7)
                    weighted_score = raw_score * method_weight
                    
                    total_weighted_score += weighted_score
                    total_weight += method_weight
                    
                    method_scores[method] = {
                        'raw_score': raw_score,
                        'weighted_score': weighted_score,
                        'evidence_quality': evidence_quality
                    }
                    
                    evidence_quality_scores.append(evidence_quality)
                
                # Calculate final competency score
                if total_weight > 0:
                    final_score = total_weighted_score / total_weight
                else:
                    final_score = 0
                
                # Adjust score based on evidence quality
                avg_evidence_quality = np.mean(evidence_quality_scores) if evidence_quality_scores else 1.0
                adjusted_score = final_score * avg_evidence_quality
                
                # Determine proficiency level
                proficiency_level = self._determine_proficiency_level(adjusted_score)
                
                # Check validation criteria
                validation_passed = self._check_validation_criteria(
                    adjusted_score, method_scores, validation_criteria
                )
                
                # Generate feedback and recommendations
                feedback = self._generate_competency_feedback(
                    competency, adjusted_score, method_scores, proficiency_level
                )
                
                # Store validation result
                validation_result = {
                    "competency_id": competency_id,
                    "final_score": round(adjusted_score, 2),
                    "proficiency_level": proficiency_level,
                    "validation_passed": validation_passed,
                    "method_scores": method_scores,
                    "evidence_quality": round(avg_evidence_quality, 2),
                    "feedback": feedback,
                    "validated_at": datetime.now().isoformat()
                }
                
                # Save to database
                self._save_validation_result(assessment_id, competency_id, validation_result)
                
                logger.info(f"Competency {competency_id} validated with score {adjusted_score}")
                
                return {
                    "success": True,
                    "validation_result": validation_result,
                    "message": "Competency validation completed successfully"
                }
                
        except Exception as e:
            logger.error(f"Error validating competency: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to validate competency"
            }
    
    def _determine_proficiency_level(self, score: float) -> str:
        """Determine proficiency level based on score"""
        for level, (min_score, max_score) in self.proficiency_thresholds.items():
            if min_score <= score < max_score:
                return level
        return ProficiencyLevel.EXPERT.value if score >= 90 else ProficiencyLevel.BEGINNER.value
    
    def _check_validation_criteria(self, score: float, method_scores: Dict[str, Any], 
                                 criteria: Dict[str, Any]) -> bool:
        """Check if validation criteria are met"""
        # Check minimum score
        min_score = criteria.get('minimum_score', 70.0)
        if score < min_score:
            return False
        
        # Check required evidence types
        required_methods = criteria.get('required_evidence_types', [])
        if required_methods:
            available_methods = set(method_scores.keys())
            required_methods_set = set(required_methods)
            if not required_methods_set.issubset(available_methods):
                return False
        
        # Check method-specific minimum scores
        method_minimums = criteria.get('method_minimum_scores', {})
        for method, min_method_score in method_minimums.items():
            if method in method_scores:
                if method_scores[method]['raw_score'] < min_method_score:
                    return False
        
        return True
    
    def _generate_competency_feedback(self, competency: Dict[str, Any], score: float, 
                                    method_scores: Dict[str, Any], proficiency_level: str) -> Dict[str, Any]:
        """Generate detailed feedback for competency assessment"""
        competency_name = competency['name']
        competency_type = competency['competency_type']
        
        # Overall performance feedback
        if score >= 90:
            overall_feedback = f"Excellent demonstration of {competency_name}. You have achieved expert-level proficiency."
        elif score >= 75:
            overall_feedback = f"Strong performance in {competency_name}. You demonstrate advanced competency."
        elif score >= 50:
            overall_feedback = f"Good foundation in {competency_name}. Continue developing to reach advanced level."
        else:
            overall_feedback = f"Basic understanding of {competency_name}. Significant development needed."
        
        # Method-specific feedback
        method_feedback = {}
        strengths = []
        improvement_areas = []
        
        for method, scores in method_scores.items():
            method_score = scores['raw_score']
            
            if method_score >= 80:
                method_feedback[method] = f"Strong performance in {method.replace('_', ' ')} assessment."
                strengths.append(method.replace('_', ' '))
            elif method_score >= 60:
                method_feedback[method] = f"Adequate performance in {method.replace('_', ' ')} assessment."
            else:
                method_feedback[method] = f"Needs improvement in {method.replace('_', ' ')} assessment."
                improvement_areas.append(method.replace('_', ' '))
        
        # Development recommendations
        recommendations = self._generate_development_recommendations(
            competency_type, proficiency_level, improvement_areas
        )
        
        return {
            "overall_feedback": overall_feedback,
            "method_feedback": method_feedback,
            "strengths": strengths,
            "improvement_areas": improvement_areas,
            "recommendations": recommendations,
            "proficiency_level_description": self._get_proficiency_description(proficiency_level)
        }
    
    def _generate_development_recommendations(self, competency_type: str, 
                                           proficiency_level: str, improvement_areas: List[str]) -> List[str]:
        """Generate personalized development recommendations"""
        recommendations = []
        
        # Base recommendations by competency type
        if competency_type == "technical":
            if proficiency_level in ["beginner", "intermediate"]:
                recommendations.extend([
                    "Complete hands-on practice exercises",
                    "Work on real-world projects to apply theoretical knowledge",
                    "Seek mentorship from experienced professionals"
                ])
            else:
                recommendations.extend([
                    "Lead technical projects to demonstrate expertise",
                    "Mentor junior team members",
                    "Stay updated with latest industry trends and technologies"
                ])
        
        elif competency_type == "behavioral":
            if proficiency_level in ["beginner", "intermediate"]:
                recommendations.extend([
                    "Practice active listening and communication skills",
                    "Seek feedback from colleagues and supervisors",
                    "Participate in team-building activities"
                ])
            else:
                recommendations.extend([
                    "Take on leadership roles in team projects",
                    "Facilitate workshops or training sessions",
                    "Develop coaching and mentoring skills"
                ])
        
        elif competency_type == "cognitive":
            recommendations.extend([
                "Practice problem-solving scenarios",
                "Engage in critical thinking exercises",
                "Analyze case studies relevant to your field"
            ])
        
        # Specific recommendations based on improvement areas
        if "practical" in improvement_areas:
            recommendations.append("Focus on hands-on application of concepts")
        
        if "essay" in improvement_areas:
            recommendations.append("Improve written communication and analytical skills")
        
        if "interview" in improvement_areas:
            recommendations.append("Practice verbal communication and presentation skills")
        
        return recommendations
    
    def _get_proficiency_description(self, proficiency_level: str) -> str:
        """Get detailed description of proficiency level"""
        descriptions = {
            "beginner": "Basic understanding with limited practical application. Requires guidance and supervision.",
            "intermediate": "Good understanding with some practical experience. Can work independently on routine tasks.",
            "advanced": "Strong competency with extensive practical experience. Can handle complex tasks and guide others.",
            "expert": "Exceptional competency with deep expertise. Can innovate, lead, and train others in this area."
        }
        return descriptions.get(proficiency_level, "Proficiency level not defined")
    
    def _save_validation_result(self, assessment_id: int, competency_id: int, 
                              validation_result: Dict[str, Any]):
        """Save validation result to database"""
        try:
            with self.connection.cursor() as cursor:
                # Check if result already exists
                cursor.execute("""
                SELECT id FROM assessment_results 
                WHERE assessment_id = %s AND competency_id = %s
                """, (assessment_id, competency_id))
                
                existing = cursor.fetchone()
                
                if existing:
                    # Update existing result
                    cursor.execute("""
                    UPDATE assessment_results 
                    SET assessor_score = %s, 
                        scoring_rationale = %s,
                        is_flagged = %s
                    WHERE id = %s
                    """, (
                        validation_result['final_score'],
                        json.dumps(validation_result),
                        not validation_result['validation_passed'],
                        existing['id']
                    ))
                else:
                    # Insert new result
                    cursor.execute("""
                    INSERT INTO assessment_results 
                    (assessment_id, competency_id, assessor_score, max_possible_score,
                     scoring_rationale, is_flagged, flag_reason)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        assessment_id,
                        competency_id,
                        validation_result['final_score'],
                        100.0,
                        json.dumps(validation_result),
                        not validation_result['validation_passed'],
                        "Validation criteria not met" if not validation_result['validation_passed'] else None
                    ))
                
                self.connection.commit()
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error saving validation result: {e}")
            raise
    
    def batch_validate_competencies(self, assessment_id: int, 
                                  competency_results: Dict[int, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Validate multiple competencies for an assessment
        
        Args:
            assessment_id: ID of the assessment
            competency_results: Dictionary mapping competency_id to list of assessment results
            
        Returns:
            Batch validation results
        """
        try:
            validation_results = {}
            overall_scores = []
            failed_validations = []
            
            for competency_id, results in competency_results.items():
                validation_result = self.validate_competency(assessment_id, competency_id, results)
                
                if validation_result['success']:
                    result_data = validation_result['validation_result']
                    validation_results[competency_id] = result_data
                    overall_scores.append(result_data['final_score'])
                    
                    if not result_data['validation_passed']:
                        failed_validations.append(competency_id)
                else:
                    logger.error(f"Failed to validate competency {competency_id}: {validation_result.get('message')}")
            
            # Calculate overall assessment score
            overall_score = np.mean(overall_scores) if overall_scores else 0
            
            # Determine overall pass/fail status
            overall_passed = len(failed_validations) == 0 and overall_score >= 70.0
            
            # Update assessment with overall results
            self._update_assessment_results(assessment_id, overall_score, overall_passed, validation_results)
            
            return {
                "success": True,
                "assessment_id": assessment_id,
                "overall_score": round(overall_score, 2),
                "overall_passed": overall_passed,
                "competency_results": validation_results,
                "failed_competencies": failed_validations,
                "total_competencies": len(competency_results),
                "passed_competencies": len(competency_results) - len(failed_validations),
                "message": "Batch competency validation completed"
            }
            
        except Exception as e:
            logger.error(f"Error in batch competency validation: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to complete batch competency validation"
            }
    
    def _update_assessment_results(self, assessment_id: int, overall_score: float, 
                                 passed: bool, validation_results: Dict[int, Any]):
        """Update assessment with overall results"""
        try:
            with self.connection.cursor() as cursor:
                status = "completed"
                pass_fail_status = "pass" if passed else "fail"
                
                # Generate overall feedback
                feedback = self._generate_overall_feedback(overall_score, passed, validation_results)
                
                cursor.execute("""
                UPDATE assessments 
                SET total_score = %s,
                    percentage_score = %s,
                    pass_fail_status = %s,
                    status = %s,
                    feedback = %s,
                    end_time = CURRENT_TIMESTAMP
                WHERE id = %s
                """, (
                    overall_score,
                    overall_score,  # Assuming score is already a percentage
                    pass_fail_status,
                    status,
                    feedback,
                    assessment_id
                ))
                
                self.connection.commit()
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error updating assessment results: {e}")
            raise
    
    def _generate_overall_feedback(self, overall_score: float, passed: bool, 
                                 validation_results: Dict[int, Any]) -> str:
        """Generate overall assessment feedback"""
        if passed:
            if overall_score >= 90:
                feedback = "Outstanding performance across all competencies. Exceptional demonstration of skills and knowledge."
            elif overall_score >= 80:
                feedback = "Excellent performance with strong competency demonstration. Well prepared for the role."
            else:
                feedback = "Good performance meeting all validation criteria. Solid foundation for success."
        else:
            feedback = "Assessment completed but some competencies require further development. "
            
            # Identify specific areas for improvement
            weak_areas = []
            for comp_id, result in validation_results.items():
                if not result.get('validation_passed', True):
                    weak_areas.extend(result.get('feedback', {}).get('improvement_areas', []))
            
            if weak_areas:
                feedback += f"Focus on improving: {', '.join(set(weak_areas))}."
        
        return feedback
    
    def get_competency_analytics(self, competency_id: int, date_from: datetime = None, 
                               date_to: datetime = None) -> Dict[str, Any]:
        """Get analytics for a specific competency"""
        try:
            with self.connection.cursor() as cursor:
                # Set default date range if not provided
                if not date_from:
                    date_from = datetime.now() - timedelta(days=90)
                if not date_to:
                    date_to = datetime.now()
                
                # Get competency assessment statistics
                stats_query = """
                SELECT 
                    COUNT(*) as total_assessments,
                    AVG(assessor_score) as average_score,
                    STDDEV(assessor_score) as score_stddev,
                    MIN(assessor_score) as min_score,
                    MAX(assessor_score) as max_score,
                    COUNT(CASE WHEN assessor_score >= 70 THEN 1 END) as passed_count,
                    COUNT(CASE WHEN is_flagged = true THEN 1 END) as flagged_count
                FROM assessment_results ar
                JOIN assessments a ON ar.assessment_id = a.id
                WHERE ar.competency_id = %s
                AND a.created_at BETWEEN %s AND %s
                """
                
                cursor.execute(stats_query, (competency_id, date_from, date_to))
                stats = cursor.fetchone()
                
                # Get score distribution
                distribution_query = """
                SELECT 
                    CASE 
                        WHEN assessor_score >= 90 THEN 'Expert (90-100)'
                        WHEN assessor_score >= 75 THEN 'Advanced (75-89)'
                        WHEN assessor_score >= 50 THEN 'Intermediate (50-74)'
                        ELSE 'Beginner (0-49)'
                    END as proficiency_level,
                    COUNT(*) as count
                FROM assessment_results ar
                JOIN assessments a ON ar.assessment_id = a.id
                WHERE ar.competency_id = %s
                AND a.created_at BETWEEN %s AND %s
                GROUP BY 
                    CASE 
                        WHEN assessor_score >= 90 THEN 'Expert (90-100)'
                        WHEN assessor_score >= 75 THEN 'Advanced (75-89)'
                        WHEN assessor_score >= 50 THEN 'Intermediate (50-74)'
                        ELSE 'Beginner (0-49)'
                    END
                ORDER BY MIN(assessor_score) DESC
                """
                
                cursor.execute(distribution_query, (competency_id, date_from, date_to))
                distribution = cursor.fetchall()
                
                # Calculate pass rate
                total_assessments = stats['total_assessments'] or 0
                passed_count = stats['passed_count'] or 0
                pass_rate = (passed_count / total_assessments * 100) if total_assessments > 0 else 0
                
                return {
                    "success": True,
                    "competency_id": competency_id,
                    "date_range": {
                        "from": date_from.isoformat(),
                        "to": date_to.isoformat()
                    },
                    "statistics": {
                        "total_assessments": total_assessments,
                        "average_score": round(float(stats['average_score'] or 0), 2),
                        "score_stddev": round(float(stats['score_stddev'] or 0), 2),
                        "min_score": float(stats['min_score'] or 0),
                        "max_score": float(stats['max_score'] or 0),
                        "pass_rate": round(pass_rate, 2),
                        "flagged_rate": round((stats['flagged_count'] or 0) / total_assessments * 100, 2) if total_assessments > 0 else 0
                    },
                    "proficiency_distribution": [dict(row) for row in distribution],
                    "message": "Competency analytics retrieved successfully"
                }
                
        except Exception as e:
            logger.error(f"Error retrieving competency analytics: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve competency analytics"
            }

# Health check function
def health_check(db_connection_string: str) -> Dict[str, Any]:
    """Check competency validation framework health"""
    try:
        framework = CompetencyValidationFramework(db_connection_string)
        framework.connect_db()
        
        with framework.connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM competency_models")
            competency_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) FROM assessment_results WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'")
            recent_validations = cursor.fetchone()['count']
        
        framework.close_db()
        
        return {
            "status": "healthy",
            "database_connected": True,
            "competency_models": competency_count,
            "recent_validations": recent_validations,
            "validation_methods": len(AssessmentMethod),
            "proficiency_levels": len(ProficiencyLevel),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "database_connected": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
