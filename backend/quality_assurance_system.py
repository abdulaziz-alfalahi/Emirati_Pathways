"""
Quality Assurance System for Emirati Journey Platform
Handles assessment quality monitoring, bias detection, and reliability analysis
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
from scipy import stats
from sklearn.metrics import cohen_kappa_score
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QualityFlag(Enum):
    """Quality assessment flags"""
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    NEEDS_IMPROVEMENT = "needs_improvement"
    CRITICAL = "critical"

class BiasType(Enum):
    """Types of assessment bias"""
    GENDER_BIAS = "gender_bias"
    AGE_BIAS = "age_bias"
    NATIONALITY_BIAS = "nationality_bias"
    EDUCATIONAL_BIAS = "educational_bias"
    EXPERIENCE_BIAS = "experience_bias"
    HALO_EFFECT = "halo_effect"
    SEVERITY_BIAS = "severity_bias"
    LENIENCY_BIAS = "leniency_bias"

@dataclass
class QualityMetric:
    """Quality metric data structure"""
    metric_type: str
    metric_value: float
    benchmark_value: float
    variance_from_benchmark: float
    quality_flag: str
    improvement_recommendations: List[str]
    calculated_at: datetime

@dataclass
class BiasAnalysis:
    """Bias analysis result structure"""
    bias_type: str
    detected: bool
    severity_level: str
    statistical_significance: float
    affected_groups: List[str]
    recommendations: List[str]
    analysis_data: Dict[str, Any]

class QualityAssuranceSystem:
    """Comprehensive quality assurance system for assessments"""
    
    def __init__(self, db_connection_string: str):
        self.db_connection_string = db_connection_string
        self.connection = None
        
        # Quality benchmarks
        self.quality_benchmarks = {
            "inter_rater_reliability": 0.85,
            "consistency": 0.80,
            "fairness": 0.90,
            "validity": 0.85,
            "reliability": 0.80,
            "bias_threshold": 0.05,
            "score_variance_threshold": 15.0
        }
        
        # Quality flag thresholds
        self.quality_thresholds = {
            QualityFlag.EXCELLENT.value: 0.95,
            QualityFlag.GOOD.value: 0.85,
            QualityFlag.ACCEPTABLE.value: 0.70,
            QualityFlag.NEEDS_IMPROVEMENT.value: 0.50,
            QualityFlag.CRITICAL.value: 0.0
        }
    
    def connect_db(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(
                self.db_connection_string,
                cursor_factory=RealDictCursor
            )
            logger.info("Database connection established for quality assurance")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def close_db(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def calculate_inter_rater_reliability(self, assessment_id: int) -> Dict[str, Any]:
        """Calculate inter-rater reliability for assessments with multiple assessors"""
        try:
            with self.connection.cursor() as cursor:
                # Get assessment results from multiple assessors for the same competencies
                query = """
                SELECT 
                    ar.competency_id,
                    ar.assessor_score,
                    a.assessor_id,
                    u.full_name as assessor_name
                FROM assessment_results ar
                JOIN assessments a ON ar.assessment_id = a.id
                JOIN users u ON a.assessor_id = u.id
                WHERE ar.assessment_id = %s
                ORDER BY ar.competency_id, a.assessor_id
                """
                
                cursor.execute(query, (assessment_id,))
                results = cursor.fetchall()
                
                if len(results) < 2:
                    return {
                        "success": False,
                        "message": "Insufficient data for inter-rater reliability calculation"
                    }
                
                # Organize data by competency
                competency_scores = {}
                for result in results:
                    comp_id = result['competency_id']
                    if comp_id not in competency_scores:
                        competency_scores[comp_id] = {}
                    competency_scores[comp_id][result['assessor_id']] = result['assessor_score']
                
                # Calculate reliability metrics
                reliability_results = {}
                overall_correlations = []
                
                for comp_id, scores in competency_scores.items():
                    if len(scores) >= 2:
                        assessor_ids = list(scores.keys())
                        score_values = list(scores.values())
                        
                        # Calculate Pearson correlation for this competency
                        if len(set(score_values)) > 1:  # Avoid division by zero
                            correlation_matrix = np.corrcoef([score_values])
                            if correlation_matrix.size > 1:
                                avg_correlation = np.mean(correlation_matrix[np.triu_indices_from(correlation_matrix, k=1)])
                            else:
                                avg_correlation = 1.0
                        else:
                            avg_correlation = 1.0
                        
                        # Calculate Cohen's Kappa for categorical agreement
                        # Convert scores to categories for kappa calculation
                        categories = [self._score_to_category(score) for score in score_values]
                        if len(set(categories)) > 1:
                            # For simplicity, calculate agreement percentage
                            agreement = sum(1 for i in range(len(categories)-1) 
                                          if categories[i] == categories[i+1]) / (len(categories)-1)
                        else:
                            agreement = 1.0
                        
                        reliability_results[comp_id] = {
                            "correlation": round(avg_correlation, 3),
                            "agreement": round(agreement, 3),
                            "assessor_count": len(scores),
                            "score_variance": round(np.var(score_values), 2)
                        }
                        
                        overall_correlations.append(avg_correlation)
                
                # Calculate overall reliability
                overall_reliability = np.mean(overall_correlations) if overall_correlations else 0
                
                # Determine quality flag
                quality_flag = self._determine_quality_flag(overall_reliability)
                
                # Generate recommendations
                recommendations = self._generate_reliability_recommendations(
                    overall_reliability, reliability_results
                )
                
                # Store quality metric
                quality_metric = QualityMetric(
                    metric_type="inter_rater_reliability",
                    metric_value=overall_reliability,
                    benchmark_value=self.quality_benchmarks["inter_rater_reliability"],
                    variance_from_benchmark=overall_reliability - self.quality_benchmarks["inter_rater_reliability"],
                    quality_flag=quality_flag,
                    improvement_recommendations=recommendations,
                    calculated_at=datetime.now()
                )
                
                self._store_quality_metric(assessment_id, quality_metric)
                
                return {
                    "success": True,
                    "assessment_id": assessment_id,
                    "overall_reliability": round(overall_reliability, 3),
                    "competency_reliability": reliability_results,
                    "quality_flag": quality_flag,
                    "benchmark": self.quality_benchmarks["inter_rater_reliability"],
                    "recommendations": recommendations,
                    "message": "Inter-rater reliability calculated successfully"
                }
                
        except Exception as e:
            logger.error(f"Error calculating inter-rater reliability: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to calculate inter-rater reliability"
            }
    
    def _score_to_category(self, score: float) -> str:
        """Convert numerical score to category for agreement analysis"""
        if score >= 90:
            return "excellent"
        elif score >= 80:
            return "good"
        elif score >= 70:
            return "satisfactory"
        elif score >= 60:
            return "needs_improvement"
        else:
            return "unsatisfactory"
    
    def detect_assessment_bias(self, assessor_id: int, date_from: datetime = None, 
                             date_to: datetime = None) -> Dict[str, Any]:
        """Detect various types of bias in assessor's evaluations"""
        try:
            if not date_from:
                date_from = datetime.now() - timedelta(days=90)
            if not date_to:
                date_to = datetime.now()
            
            with self.connection.cursor() as cursor:
                # Get assessment data with candidate demographics
                query = """
                SELECT 
                    ar.assessment_id,
                    ar.competency_id,
                    ar.assessor_score,
                    a.candidate_id,
                    cp.gender,
                    cp.age,
                    cp.nationality,
                    cp.education_level,
                    cp.years_experience,
                    cm.competency_type
                FROM assessment_results ar
                JOIN assessments a ON ar.assessment_id = a.id
                JOIN candidate_profiles cp ON a.candidate_id = cp.user_id
                JOIN competency_models cm ON ar.competency_id = cm.id
                WHERE a.assessor_id = %s
                AND a.created_at BETWEEN %s AND %s
                ORDER BY ar.created_at
                """
                
                cursor.execute(query, (assessor_id, date_from, date_to))
                assessment_data = cursor.fetchall()
                
                if len(assessment_data) < 10:
                    return {
                        "success": False,
                        "message": "Insufficient data for bias analysis (minimum 10 assessments required)"
                    }
                
                # Convert to DataFrame for analysis
                df = pd.DataFrame([dict(row) for row in assessment_data])
                
                # Perform bias analyses
                bias_analyses = []
                
                # Gender bias analysis
                gender_bias = self._analyze_gender_bias(df)
                bias_analyses.append(gender_bias)
                
                # Age bias analysis
                age_bias = self._analyze_age_bias(df)
                bias_analyses.append(age_bias)
                
                # Nationality bias analysis
                nationality_bias = self._analyze_nationality_bias(df)
                bias_analyses.append(nationality_bias)
                
                # Educational bias analysis
                education_bias = self._analyze_educational_bias(df)
                bias_analyses.append(education_bias)
                
                # Experience bias analysis
                experience_bias = self._analyze_experience_bias(df)
                bias_analyses.append(experience_bias)
                
                # Severity/Leniency bias analysis
                severity_bias = self._analyze_severity_bias(df)
                bias_analyses.append(severity_bias)
                
                # Calculate overall bias score
                detected_biases = [bias for bias in bias_analyses if bias.detected]
                overall_bias_score = len(detected_biases) / len(bias_analyses)
                
                # Determine overall quality flag
                if overall_bias_score <= 0.1:
                    overall_flag = QualityFlag.EXCELLENT.value
                elif overall_bias_score <= 0.2:
                    overall_flag = QualityFlag.GOOD.value
                elif overall_bias_score <= 0.3:
                    overall_flag = QualityFlag.ACCEPTABLE.value
                elif overall_bias_score <= 0.5:
                    overall_flag = QualityFlag.NEEDS_IMPROVEMENT.value
                else:
                    overall_flag = QualityFlag.CRITICAL.value
                
                # Store bias analysis results
                self._store_bias_analysis(assessor_id, bias_analyses, overall_bias_score)
                
                return {
                    "success": True,
                    "assessor_id": assessor_id,
                    "analysis_period": {
                        "from": date_from.isoformat(),
                        "to": date_to.isoformat()
                    },
                    "assessments_analyzed": len(assessment_data),
                    "overall_bias_score": round(overall_bias_score, 3),
                    "overall_quality_flag": overall_flag,
                    "bias_analyses": [self._bias_analysis_to_dict(bias) for bias in bias_analyses],
                    "detected_biases": len(detected_biases),
                    "total_bias_types": len(bias_analyses),
                    "message": "Bias analysis completed successfully"
                }
                
        except Exception as e:
            logger.error(f"Error detecting assessment bias: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to detect assessment bias"
            }
    
    def _analyze_gender_bias(self, df: pd.DataFrame) -> BiasAnalysis:
        """Analyze gender bias in scoring"""
        try:
            if 'gender' not in df.columns or df['gender'].nunique() < 2:
                return BiasAnalysis(
                    bias_type=BiasType.GENDER_BIAS.value,
                    detected=False,
                    severity_level="none",
                    statistical_significance=0.0,
                    affected_groups=[],
                    recommendations=[],
                    analysis_data={"reason": "Insufficient gender diversity in data"}
                )
            
            # Group by gender and calculate mean scores
            gender_scores = df.groupby('gender')['assessor_score'].agg(['mean', 'std', 'count'])
            
            # Perform t-test if we have both genders
            genders = gender_scores.index.tolist()
            if len(genders) >= 2:
                group1_scores = df[df['gender'] == genders[0]]['assessor_score']
                group2_scores = df[df['gender'] == genders[1]]['assessor_score']
                
                t_stat, p_value = stats.ttest_ind(group1_scores, group2_scores)
                
                # Calculate effect size (Cohen's d)
                pooled_std = np.sqrt(((len(group1_scores) - 1) * group1_scores.std() ** 2 + 
                                    (len(group2_scores) - 1) * group2_scores.std() ** 2) / 
                                   (len(group1_scores) + len(group2_scores) - 2))
                cohens_d = abs(group1_scores.mean() - group2_scores.mean()) / pooled_std
                
                # Determine if bias is detected
                bias_detected = p_value < 0.05 and cohens_d > 0.3
                
                if bias_detected:
                    if cohens_d > 0.8:
                        severity = "high"
                    elif cohens_d > 0.5:
                        severity = "medium"
                    else:
                        severity = "low"
                    
                    # Identify affected group
                    if group1_scores.mean() < group2_scores.mean():
                        affected_groups = [genders[0]]
                    else:
                        affected_groups = [genders[1]]
                    
                    recommendations = [
                        "Review assessment criteria for gender-neutral language",
                        "Provide unconscious bias training for assessors",
                        "Implement blind assessment procedures where possible",
                        "Monitor gender-based scoring patterns regularly"
                    ]
                else:
                    severity = "none"
                    affected_groups = []
                    recommendations = []
                
                analysis_data = {
                    "gender_scores": gender_scores.to_dict(),
                    "t_statistic": t_stat,
                    "p_value": p_value,
                    "cohens_d": cohens_d,
                    "sample_sizes": {gender: len(df[df['gender'] == gender]) for gender in genders}
                }
                
                return BiasAnalysis(
                    bias_type=BiasType.GENDER_BIAS.value,
                    detected=bias_detected,
                    severity_level=severity,
                    statistical_significance=p_value,
                    affected_groups=affected_groups,
                    recommendations=recommendations,
                    analysis_data=analysis_data
                )
            
        except Exception as e:
            logger.error(f"Error in gender bias analysis: {e}")
            
        return BiasAnalysis(
            bias_type=BiasType.GENDER_BIAS.value,
            detected=False,
            severity_level="none",
            statistical_significance=1.0,
            affected_groups=[],
            recommendations=[],
            analysis_data={"error": "Analysis failed"}
        )
    
    def _analyze_age_bias(self, df: pd.DataFrame) -> BiasAnalysis:
        """Analyze age bias in scoring"""
        try:
            if 'age' not in df.columns or df['age'].isna().all():
                return BiasAnalysis(
                    bias_type=BiasType.AGE_BIAS.value,
                    detected=False,
                    severity_level="none",
                    statistical_significance=0.0,
                    affected_groups=[],
                    recommendations=[],
                    analysis_data={"reason": "No age data available"}
                )
            
            # Create age groups
            df_copy = df.copy()
            df_copy['age_group'] = pd.cut(df_copy['age'], 
                                        bins=[0, 25, 35, 45, 55, 100], 
                                        labels=['<25', '25-34', '35-44', '45-54', '55+'])
            
            # Perform ANOVA to test for age group differences
            age_groups = df_copy.groupby('age_group')['assessor_score'].apply(list)
            
            if len(age_groups) >= 2:
                f_stat, p_value = stats.f_oneway(*age_groups.values)
                
                # Calculate correlation between age and score
                correlation, corr_p_value = stats.pearsonr(df_copy['age'].dropna(), 
                                                         df_copy.loc[df_copy['age'].notna(), 'assessor_score'])
                
                bias_detected = p_value < 0.05 and abs(correlation) > 0.3
                
                if bias_detected:
                    if abs(correlation) > 0.7:
                        severity = "high"
                    elif abs(correlation) > 0.5:
                        severity = "medium"
                    else:
                        severity = "low"
                    
                    # Identify affected age groups
                    age_means = df_copy.groupby('age_group')['assessor_score'].mean()
                    overall_mean = df_copy['assessor_score'].mean()
                    affected_groups = age_means[age_means < overall_mean - 5].index.tolist()
                    
                    recommendations = [
                        "Review assessment methods for age-related bias",
                        "Ensure assessment criteria are age-neutral",
                        "Provide training on age diversity and inclusion",
                        "Consider alternative assessment formats for different age groups"
                    ]
                else:
                    severity = "none"
                    affected_groups = []
                    recommendations = []
                
                analysis_data = {
                    "age_group_means": age_means.to_dict(),
                    "f_statistic": f_stat,
                    "p_value": p_value,
                    "correlation": correlation,
                    "correlation_p_value": corr_p_value
                }
                
                return BiasAnalysis(
                    bias_type=BiasType.AGE_BIAS.value,
                    detected=bias_detected,
                    severity_level=severity,
                    statistical_significance=p_value,
                    affected_groups=affected_groups,
                    recommendations=recommendations,
                    analysis_data=analysis_data
                )
            
        except Exception as e:
            logger.error(f"Error in age bias analysis: {e}")
        
        return BiasAnalysis(
            bias_type=BiasType.AGE_BIAS.value,
            detected=False,
            severity_level="none",
            statistical_significance=1.0,
            affected_groups=[],
            recommendations=[],
            analysis_data={"error": "Analysis failed"}
        )
    
    def _analyze_nationality_bias(self, df: pd.DataFrame) -> BiasAnalysis:
        """Analyze nationality bias in scoring"""
        try:
            if 'nationality' not in df.columns or df['nationality'].nunique() < 2:
                return BiasAnalysis(
                    bias_type=BiasType.NATIONALITY_BIAS.value,
                    detected=False,
                    severity_level="none",
                    statistical_significance=0.0,
                    affected_groups=[],
                    recommendations=[],
                    analysis_data={"reason": "Insufficient nationality diversity"}
                )
            
            # Group by nationality and calculate statistics
            nationality_stats = df.groupby('nationality')['assessor_score'].agg(['mean', 'std', 'count'])
            
            # Perform ANOVA if we have multiple nationalities
            nationality_groups = df.groupby('nationality')['assessor_score'].apply(list)
            
            if len(nationality_groups) >= 2:
                f_stat, p_value = stats.f_oneway(*nationality_groups.values)
                
                # Calculate effect size (eta squared)
                ss_between = sum(len(group) * (np.mean(group) - df['assessor_score'].mean())**2 
                               for group in nationality_groups.values)
                ss_total = sum((score - df['assessor_score'].mean())**2 for score in df['assessor_score'])
                eta_squared = ss_between / ss_total if ss_total > 0 else 0
                
                bias_detected = p_value < 0.05 and eta_squared > 0.06  # Medium effect size
                
                if bias_detected:
                    if eta_squared > 0.14:
                        severity = "high"
                    elif eta_squared > 0.06:
                        severity = "medium"
                    else:
                        severity = "low"
                    
                    # Identify affected nationalities
                    overall_mean = df['assessor_score'].mean()
                    affected_groups = nationality_stats[nationality_stats['mean'] < overall_mean - 5].index.tolist()
                    
                    recommendations = [
                        "Review assessment content for cultural bias",
                        "Ensure assessment materials are culturally neutral",
                        "Provide cultural competency training for assessors",
                        "Consider multiple assessment formats to accommodate cultural differences"
                    ]
                else:
                    severity = "none"
                    affected_groups = []
                    recommendations = []
                
                analysis_data = {
                    "nationality_stats": nationality_stats.to_dict(),
                    "f_statistic": f_stat,
                    "p_value": p_value,
                    "eta_squared": eta_squared
                }
                
                return BiasAnalysis(
                    bias_type=BiasType.NATIONALITY_BIAS.value,
                    detected=bias_detected,
                    severity_level=severity,
                    statistical_significance=p_value,
                    affected_groups=affected_groups,
                    recommendations=recommendations,
                    analysis_data=analysis_data
                )
            
        except Exception as e:
            logger.error(f"Error in nationality bias analysis: {e}")
        
        return BiasAnalysis(
            bias_type=BiasType.NATIONALITY_BIAS.value,
            detected=False,
            severity_level="none",
            statistical_significance=1.0,
            affected_groups=[],
            recommendations=[],
            analysis_data={"error": "Analysis failed"}
        )
    
    def _analyze_educational_bias(self, df: pd.DataFrame) -> BiasAnalysis:
        """Analyze educational background bias in scoring"""
        try:
            if 'education_level' not in df.columns or df['education_level'].nunique() < 2:
                return BiasAnalysis(
                    bias_type=BiasType.EDUCATIONAL_BIAS.value,
                    detected=False,
                    severity_level="none",
                    statistical_significance=0.0,
                    affected_groups=[],
                    recommendations=[],
                    analysis_data={"reason": "Insufficient educational diversity"}
                )
            
            # Define education level order for correlation analysis
            education_order = {
                'high_school': 1,
                'diploma': 2,
                'bachelor': 3,
                'master': 4,
                'phd': 5
            }
            
            df_copy = df.copy()
            df_copy['education_numeric'] = df_copy['education_level'].map(education_order)
            
            # Calculate correlation between education level and scores
            valid_data = df_copy.dropna(subset=['education_numeric', 'assessor_score'])
            
            if len(valid_data) >= 10:
                correlation, p_value = stats.pearsonr(valid_data['education_numeric'], 
                                                    valid_data['assessor_score'])
                
                bias_detected = p_value < 0.05 and abs(correlation) > 0.3
                
                if bias_detected:
                    if abs(correlation) > 0.7:
                        severity = "high"
                    elif abs(correlation) > 0.5:
                        severity = "medium"
                    else:
                        severity = "low"
                    
                    # Identify affected education levels
                    education_means = df_copy.groupby('education_level')['assessor_score'].mean()
                    overall_mean = df_copy['assessor_score'].mean()
                    
                    if correlation > 0:  # Higher education gets higher scores
                        affected_groups = education_means[education_means < overall_mean - 3].index.tolist()
                    else:  # Lower education gets higher scores
                        affected_groups = education_means[education_means > overall_mean + 3].index.tolist()
                    
                    recommendations = [
                        "Ensure assessment criteria focus on job-relevant competencies",
                        "Avoid educational background assumptions in scoring",
                        "Provide training on competency-based assessment",
                        "Review assessment methods for educational bias"
                    ]
                else:
                    severity = "none"
                    affected_groups = []
                    recommendations = []
                
                analysis_data = {
                    "education_means": education_means.to_dict(),
                    "correlation": correlation,
                    "p_value": p_value,
                    "sample_size": len(valid_data)
                }
                
                return BiasAnalysis(
                    bias_type=BiasType.EDUCATIONAL_BIAS.value,
                    detected=bias_detected,
                    severity_level=severity,
                    statistical_significance=p_value,
                    affected_groups=affected_groups,
                    recommendations=recommendations,
                    analysis_data=analysis_data
                )
            
        except Exception as e:
            logger.error(f"Error in educational bias analysis: {e}")
        
        return BiasAnalysis(
            bias_type=BiasType.EDUCATIONAL_BIAS.value,
            detected=False,
            severity_level="none",
            statistical_significance=1.0,
            affected_groups=[],
            recommendations=[],
            analysis_data={"error": "Analysis failed"}
        )
    
    def _analyze_experience_bias(self, df: pd.DataFrame) -> BiasAnalysis:
        """Analyze experience level bias in scoring"""
        try:
            if 'years_experience' not in df.columns or df['years_experience'].isna().all():
                return BiasAnalysis(
                    bias_type=BiasType.EXPERIENCE_BIAS.value,
                    detected=False,
                    severity_level="none",
                    statistical_significance=0.0,
                    affected_groups=[],
                    recommendations=[],
                    analysis_data={"reason": "No experience data available"}
                )
            
            # Calculate correlation between experience and scores
            valid_data = df.dropna(subset=['years_experience', 'assessor_score'])
            
            if len(valid_data) >= 10:
                correlation, p_value = stats.pearsonr(valid_data['years_experience'], 
                                                    valid_data['assessor_score'])
                
                # Create experience groups for additional analysis
                df_copy = valid_data.copy()
                df_copy['experience_group'] = pd.cut(df_copy['years_experience'], 
                                                   bins=[0, 2, 5, 10, 20, 100], 
                                                   labels=['0-2', '3-5', '6-10', '11-20', '20+'])
                
                experience_means = df_copy.groupby('experience_group')['assessor_score'].mean()
                
                bias_detected = p_value < 0.05 and abs(correlation) > 0.3
                
                if bias_detected:
                    if abs(correlation) > 0.7:
                        severity = "high"
                    elif abs(correlation) > 0.5:
                        severity = "medium"
                    else:
                        severity = "low"
                    
                    # Identify affected experience groups
                    overall_mean = df_copy['assessor_score'].mean()
                    
                    if correlation > 0:  # More experience gets higher scores
                        affected_groups = experience_means[experience_means < overall_mean - 3].index.tolist()
                    else:  # Less experience gets higher scores
                        affected_groups = experience_means[experience_means > overall_mean + 3].index.tolist()
                    
                    recommendations = [
                        "Focus assessment on current competency rather than experience length",
                        "Ensure assessment criteria are experience-neutral",
                        "Provide training on competency-based vs. experience-based evaluation",
                        "Consider portfolio-based assessments for experience validation"
                    ]
                else:
                    severity = "none"
                    affected_groups = []
                    recommendations = []
                
                analysis_data = {
                    "experience_means": experience_means.to_dict(),
                    "correlation": correlation,
                    "p_value": p_value,
                    "sample_size": len(valid_data)
                }
                
                return BiasAnalysis(
                    bias_type=BiasType.EXPERIENCE_BIAS.value,
                    detected=bias_detected,
                    severity_level=severity,
                    statistical_significance=p_value,
                    affected_groups=affected_groups,
                    recommendations=recommendations,
                    analysis_data=analysis_data
                )
            
        except Exception as e:
            logger.error(f"Error in experience bias analysis: {e}")
        
        return BiasAnalysis(
            bias_type=BiasType.EXPERIENCE_BIAS.value,
            detected=False,
            severity_level="none",
            statistical_significance=1.0,
            affected_groups=[],
            recommendations=[],
            analysis_data={"error": "Analysis failed"}
        )
    
    def _analyze_severity_bias(self, df: pd.DataFrame) -> BiasAnalysis:
        """Analyze severity/leniency bias in scoring patterns"""
        try:
            # Calculate assessor's scoring patterns
            mean_score = df['assessor_score'].mean()
            std_score = df['assessor_score'].std()
            
            # Compare with expected distribution (assuming normal distribution around 75-80)
            expected_mean = 77.5
            expected_std = 12.0
            
            # Calculate z-scores for mean and standard deviation
            mean_z = abs(mean_score - expected_mean) / (expected_std / np.sqrt(len(df)))
            std_ratio = std_score / expected_std
            
            # Determine bias type and severity
            severity_detected = False
            leniency_detected = False
            bias_type = "none"
            
            if mean_score > expected_mean + 10:  # Too lenient
                leniency_detected = True
                bias_type = "leniency"
            elif mean_score < expected_mean - 10:  # Too severe
                severity_detected = True
                bias_type = "severity"
            
            bias_detected = severity_detected or leniency_detected
            
            if bias_detected:
                if abs(mean_score - expected_mean) > 15:
                    severity = "high"
                elif abs(mean_score - expected_mean) > 10:
                    severity = "medium"
                else:
                    severity = "low"
                
                if bias_type == "leniency":
                    recommendations = [
                        "Review scoring criteria for appropriate rigor",
                        "Calibrate scoring against established benchmarks",
                        "Participate in assessor calibration sessions",
                        "Consider implementing scoring rubrics with clear thresholds"
                    ]
                else:  # severity
                    recommendations = [
                        "Review scoring criteria for fairness and achievability",
                        "Calibrate scoring to allow for appropriate score distribution",
                        "Consider candidate development stage in scoring",
                        "Participate in assessor calibration sessions"
                    ]
                
                affected_groups = ["all_candidates"]
            else:
                severity = "none"
                recommendations = []
                affected_groups = []
            
            # Calculate p-value using t-test against expected mean
            t_stat, p_value = stats.ttest_1samp(df['assessor_score'], expected_mean)
            
            analysis_data = {
                "mean_score": round(mean_score, 2),
                "expected_mean": expected_mean,
                "std_score": round(std_score, 2),
                "expected_std": expected_std,
                "mean_z_score": round(mean_z, 2),
                "std_ratio": round(std_ratio, 2),
                "bias_type": bias_type,
                "t_statistic": t_stat,
                "sample_size": len(df)
            }
            
            return BiasAnalysis(
                bias_type=BiasType.SEVERITY_BIAS.value if severity_detected else BiasType.LENIENCY_BIAS.value,
                detected=bias_detected,
                severity_level=severity,
                statistical_significance=p_value,
                affected_groups=affected_groups,
                recommendations=recommendations,
                analysis_data=analysis_data
            )
            
        except Exception as e:
            logger.error(f"Error in severity bias analysis: {e}")
            
        return BiasAnalysis(
            bias_type=BiasType.SEVERITY_BIAS.value,
            detected=False,
            severity_level="none",
            statistical_significance=1.0,
            affected_groups=[],
            recommendations=[],
            analysis_data={"error": "Analysis failed"}
        )
    
    def _determine_quality_flag(self, metric_value: float) -> str:
        """Determine quality flag based on metric value"""
        for flag, threshold in sorted(self.quality_thresholds.items(), 
                                    key=lambda x: x[1], reverse=True):
            if metric_value >= threshold:
                return flag
        return QualityFlag.CRITICAL.value
    
    def _generate_reliability_recommendations(self, reliability: float, 
                                           competency_results: Dict[int, Any]) -> List[str]:
        """Generate recommendations for improving reliability"""
        recommendations = []
        
        if reliability < 0.7:
            recommendations.extend([
                "Provide comprehensive assessor training and calibration",
                "Develop clearer scoring rubrics and criteria",
                "Implement regular assessor calibration sessions",
                "Consider using multiple assessors for critical evaluations"
            ])
        elif reliability < 0.8:
            recommendations.extend([
                "Conduct periodic assessor calibration sessions",
                "Review and refine scoring criteria",
                "Provide feedback to assessors on scoring consistency"
            ])
        
        # Competency-specific recommendations
        low_reliability_competencies = [
            comp_id for comp_id, results in competency_results.items()
            if results.get('correlation', 1.0) < 0.7
        ]
        
        if low_reliability_competencies:
            recommendations.append(
                f"Focus on improving reliability for competencies: {', '.join(map(str, low_reliability_competencies))}"
            )
        
        return recommendations
    
    def _bias_analysis_to_dict(self, bias_analysis: BiasAnalysis) -> Dict[str, Any]:
        """Convert BiasAnalysis object to dictionary"""
        return {
            "bias_type": bias_analysis.bias_type,
            "detected": bias_analysis.detected,
            "severity_level": bias_analysis.severity_level,
            "statistical_significance": bias_analysis.statistical_significance,
            "affected_groups": bias_analysis.affected_groups,
            "recommendations": bias_analysis.recommendations,
            "analysis_data": bias_analysis.analysis_data
        }
    
    def _store_quality_metric(self, assessment_id: int, quality_metric: QualityMetric):
        """Store quality metric in database"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                INSERT INTO quality_assurance_metrics 
                (assessment_id, metric_type, metric_value, benchmark_value, 
                 variance_from_benchmark, quality_flag, improvement_recommendations, calculated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(query, (
                    assessment_id,
                    quality_metric.metric_type,
                    quality_metric.metric_value,
                    quality_metric.benchmark_value,
                    quality_metric.variance_from_benchmark,
                    quality_metric.quality_flag,
                    json.dumps(quality_metric.improvement_recommendations),
                    quality_metric.calculated_at
                ))
                
                self.connection.commit()
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error storing quality metric: {e}")
            raise
    
    def _store_bias_analysis(self, assessor_id: int, bias_analyses: List[BiasAnalysis], 
                           overall_bias_score: float):
        """Store bias analysis results in database"""
        try:
            with self.connection.cursor() as cursor:
                for bias_analysis in bias_analyses:
                    query = """
                    INSERT INTO assessor_bias_analysis 
                    (assessor_id, bias_type, detected, severity_level, statistical_significance,
                     affected_groups, recommendations, analysis_data, analyzed_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (assessor_id, bias_type) 
                    DO UPDATE SET 
                        detected = EXCLUDED.detected,
                        severity_level = EXCLUDED.severity_level,
                        statistical_significance = EXCLUDED.statistical_significance,
                        affected_groups = EXCLUDED.affected_groups,
                        recommendations = EXCLUDED.recommendations,
                        analysis_data = EXCLUDED.analysis_data,
                        analyzed_at = EXCLUDED.analyzed_at
                    """
                    
                    cursor.execute(query, (
                        assessor_id,
                        bias_analysis.bias_type,
                        bias_analysis.detected,
                        bias_analysis.severity_level,
                        bias_analysis.statistical_significance,
                        bias_analysis.affected_groups,
                        json.dumps(bias_analysis.recommendations),
                        json.dumps(bias_analysis.analysis_data),
                        datetime.now()
                    ))
                
                # Store overall bias score
                cursor.execute("""
                INSERT INTO assessor_quality_scores 
                (assessor_id, overall_bias_score, last_analyzed)
                VALUES (%s, %s, %s)
                ON CONFLICT (assessor_id) 
                DO UPDATE SET 
                    overall_bias_score = EXCLUDED.overall_bias_score,
                    last_analyzed = EXCLUDED.last_analyzed
                """, (assessor_id, overall_bias_score, datetime.now()))
                
                self.connection.commit()
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error storing bias analysis: {e}")
            raise
    
    def get_quality_dashboard(self, assessor_id: int = None) -> Dict[str, Any]:
        """Get quality assurance dashboard data"""
        try:
            with self.connection.cursor() as cursor:
                # Get overall quality metrics
                if assessor_id:
                    metrics_query = """
                    SELECT 
                        metric_type,
                        AVG(metric_value) as avg_value,
                        AVG(benchmark_value) as benchmark,
                        COUNT(*) as metric_count,
                        MAX(calculated_at) as last_calculated
                    FROM quality_assurance_metrics qam
                    JOIN assessments a ON qam.assessment_id = a.id
                    WHERE a.assessor_id = %s
                    AND qam.calculated_at >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY metric_type
                    """
                    cursor.execute(metrics_query, (assessor_id,))
                else:
                    metrics_query = """
                    SELECT 
                        metric_type,
                        AVG(metric_value) as avg_value,
                        AVG(benchmark_value) as benchmark,
                        COUNT(*) as metric_count,
                        MAX(calculated_at) as last_calculated
                    FROM quality_assurance_metrics
                    WHERE calculated_at >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY metric_type
                    """
                    cursor.execute(metrics_query)
                
                quality_metrics = cursor.fetchall()
                
                # Get bias analysis summary
                if assessor_id:
                    bias_query = """
                    SELECT 
                        bias_type,
                        detected,
                        severity_level,
                        analyzed_at
                    FROM assessor_bias_analysis
                    WHERE assessor_id = %s
                    ORDER BY analyzed_at DESC
                    """
                    cursor.execute(bias_query, (assessor_id,))
                else:
                    bias_query = """
                    SELECT 
                        bias_type,
                        COUNT(*) as total_assessors,
                        COUNT(CASE WHEN detected = true THEN 1 END) as detected_count,
                        AVG(CASE WHEN detected = true THEN 1.0 ELSE 0.0 END) as detection_rate
                    FROM assessor_bias_analysis
                    WHERE analyzed_at >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY bias_type
                    """
                    cursor.execute(bias_query)
                
                bias_data = cursor.fetchall()
                
                return {
                    "success": True,
                    "assessor_id": assessor_id,
                    "quality_metrics": [dict(row) for row in quality_metrics],
                    "bias_analysis": [dict(row) for row in bias_data],
                    "dashboard_generated_at": datetime.now().isoformat(),
                    "message": "Quality dashboard data retrieved successfully"
                }
                
        except Exception as e:
            logger.error(f"Error retrieving quality dashboard: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve quality dashboard data"
            }

# Health check function
def health_check(db_connection_string: str) -> Dict[str, Any]:
    """Check quality assurance system health"""
    try:
        qa_system = QualityAssuranceSystem(db_connection_string)
        qa_system.connect_db()
        
        with qa_system.connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM quality_assurance_metrics")
            metrics_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) FROM assessor_bias_analysis")
            bias_analyses_count = cursor.fetchone()['count']
        
        qa_system.close_db()
        
        return {
            "status": "healthy",
            "database_connected": True,
            "quality_metrics": metrics_count,
            "bias_analyses": bias_analyses_count,
            "supported_bias_types": len(BiasType),
            "quality_flags": len(QualityFlag),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "database_connected": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
