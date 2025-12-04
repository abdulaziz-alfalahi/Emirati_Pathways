"""
Advanced Scoring System for Enhanced Job Matching
Multi-dimensional scoring with confidence metrics and validation
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import logging
import json
from enum import Enum

logger = logging.getLogger(__name__)

class ConfidenceLevel(Enum):
    """Confidence levels for scoring"""
    VERY_HIGH = "very_high"  # 90-100%
    HIGH = "high"           # 80-89%
    MEDIUM = "medium"       # 70-79%
    LOW = "low"            # 60-69%
    VERY_LOW = "very_low"  # <60%

@dataclass
class ScoringDimension:
    """Individual scoring dimension with metadata"""
    name: str
    score: float
    weight: float
    confidence: float
    evidence: List[str]
    reasoning: str
    max_possible_score: float = 100.0

@dataclass
class AdvancedScore:
    """Advanced scoring result with comprehensive metrics"""
    overall_score: float
    confidence_score: float
    confidence_level: ConfidenceLevel
    dimensions: Dict[str, ScoringDimension]
    weighted_score: float
    normalized_score: float
    reliability_index: float
    validation_flags: List[str]
    recommendations: List[str]
    improvement_areas: List[str]
    timestamp: datetime

class AdvancedScoringSystem:
    """
    Advanced multi-dimensional scoring system with confidence metrics
    """
    
    def __init__(self):
        """Initialize the advanced scoring system"""
        self.setup_scoring_dimensions()
        self.setup_confidence_thresholds()
        self.setup_validation_rules()
        self.setup_uae_adjustments()
        
        logger.info("Advanced Scoring System initialized")
    
    def setup_scoring_dimensions(self):
        """Setup scoring dimensions and their base weights"""
        self.base_dimensions = {
            'skills_match': {
                'weight': 0.25,
                'description': 'Technical and soft skills alignment',
                'sub_dimensions': {
                    'technical_skills': 0.6,
                    'soft_skills': 0.3,
                    'certifications': 0.1
                }
            },
            'experience_match': {
                'weight': 0.20,
                'description': 'Professional experience relevance',
                'sub_dimensions': {
                    'years_experience': 0.4,
                    'industry_experience': 0.3,
                    'role_similarity': 0.3
                }
            },
            'education_match': {
                'weight': 0.15,
                'description': 'Educational background alignment',
                'sub_dimensions': {
                    'degree_level': 0.4,
                    'field_relevance': 0.4,
                    'institution_quality': 0.2
                }
            },
            'location_preference': {
                'weight': 0.10,
                'description': 'Geographic and location preferences',
                'sub_dimensions': {
                    'emirate_preference': 0.6,
                    'commute_feasibility': 0.3,
                    'relocation_willingness': 0.1
                }
            },
            'cultural_fit': {
                'weight': 0.15,
                'description': 'Cultural alignment and adaptability',
                'sub_dimensions': {
                    'cultural_awareness': 0.4,
                    'language_skills': 0.3,
                    'local_experience': 0.3
                }
            },
            'industry_alignment': {
                'weight': 0.10,
                'description': 'Industry knowledge and alignment',
                'sub_dimensions': {
                    'industry_knowledge': 0.5,
                    'sector_experience': 0.3,
                    'market_understanding': 0.2
                }
            },
            'career_progression': {
                'weight': 0.05,
                'description': 'Career growth and trajectory',
                'sub_dimensions': {
                    'growth_potential': 0.5,
                    'career_stability': 0.3,
                    'leadership_potential': 0.2
                }
            }
        }
    
    def setup_confidence_thresholds(self):
        """Setup confidence level thresholds"""
        self.confidence_thresholds = {
            ConfidenceLevel.VERY_HIGH: 90.0,
            ConfidenceLevel.HIGH: 80.0,
            ConfidenceLevel.MEDIUM: 70.0,
            ConfidenceLevel.LOW: 60.0,
            ConfidenceLevel.VERY_LOW: 0.0
        }
    
    def setup_validation_rules(self):
        """Setup validation rules for score reliability"""
        self.validation_rules = {
            'minimum_data_completeness': 0.7,  # 70% of required data must be present
            'maximum_score_variance': 0.3,     # Scores shouldn't vary more than 30% between dimensions
            'minimum_evidence_count': 3,       # At least 3 pieces of evidence per dimension
            'consistency_threshold': 0.8,      # Internal consistency threshold
            'outlier_detection_threshold': 2.0  # Standard deviations for outlier detection
        }
    
    def setup_uae_adjustments(self):
        """Setup UAE-specific scoring adjustments"""
        self.uae_adjustments = {
            'cultural_fit_multiplier': 1.3,
            'location_preference_multiplier': 1.2,
            'arabic_language_bonus': 0.15,
            'uae_experience_bonus': 0.20,
            'gcc_experience_bonus': 0.10,
            'government_sector_bonus': 0.05,
            'strategic_industry_bonus': 0.10
        }
    
    def calculate_dimension_score(self, dimension_name: str, cv_data: Dict, jd_data: Dict, 
                                ai_analysis: Dict) -> ScoringDimension:
        """Calculate score for a specific dimension"""
        
        dimension_config = self.base_dimensions[dimension_name]
        
        # Try to get score from detailed_scores first
        ai_score = ai_analysis.get('detailed_scores', {}).get(dimension_name, 0)
        
        # If not found, try top-level with _score suffix (common in Gemini/fallback response)
        if ai_score == 0:
            ai_score = ai_analysis.get(f"{dimension_name}_score", 0)
        
        # Extract evidence and reasoning from AI analysis
        evidence = self._extract_evidence(dimension_name, cv_data, jd_data, ai_analysis)
        reasoning = self._generate_reasoning(dimension_name, ai_score, evidence)
        
        # Calculate confidence based on evidence quality and quantity
        confidence = self._calculate_confidence(evidence, ai_analysis)
        
        # Apply UAE-specific adjustments
        adjusted_score = self._apply_uae_adjustments(dimension_name, ai_score, cv_data, jd_data)
        
        return ScoringDimension(
            name=dimension_name,
            score=adjusted_score,
            weight=dimension_config['weight'],
            confidence=confidence,
            evidence=evidence,
            reasoning=reasoning
        )
    
    def _extract_evidence(self, dimension_name: str, cv_data: Dict, jd_data: Dict, 
                         ai_analysis: Dict) -> List[str]:
        """Extract evidence supporting the score for a dimension"""
        evidence = []
        
        if dimension_name == 'skills_match':
            # Technical skills evidence
            cv_skills = cv_data.get('skills', {}).get('technical', [])
            jd_skills = jd_data.get('requirements', {}).get('skills', [])
            matched_skills = set(cv_skills) & set(jd_skills)
            
            if matched_skills:
                evidence.append(f"Matched technical skills: {', '.join(matched_skills)}")
            
            # Soft skills evidence
            cv_soft_skills = cv_data.get('skills', {}).get('soft', [])
            if cv_soft_skills:
                evidence.append(f"Relevant soft skills: {', '.join(cv_soft_skills[:3])}")
        
        elif dimension_name == 'experience_match':
            # Years of experience
            cv_experience = self._calculate_total_experience(cv_data)
            jd_experience = self._extract_required_experience(jd_data)
            
            if cv_experience >= jd_experience:
                evidence.append(f"Experience requirement met: {cv_experience} years (required: {jd_experience})")
            else:
                evidence.append(f"Experience gap: {cv_experience} years (required: {jd_experience})")
            
            # Industry experience
            cv_industries = self._extract_industries(cv_data)
            jd_industry = jd_data.get('industry', '')
            
            if jd_industry in cv_industries:
                evidence.append(f"Relevant industry experience: {jd_industry}")
        
        elif dimension_name == 'education_match':
            cv_education = cv_data.get('education', [])
            jd_education = jd_data.get('requirements', {}).get('education', [])
            
            if cv_education:
                highest_degree = cv_education[0].get('degree', '')
                evidence.append(f"Highest degree: {highest_degree}")
        
        elif dimension_name == 'location_preference':
            cv_location = cv_data.get('personalInfo', {}).get('location', '')
            jd_location = jd_data.get('location', '')
            
            if cv_location and jd_location:
                if self._same_emirate(cv_location, jd_location):
                    evidence.append(f"Same emirate preference: {cv_location}")
                else:
                    evidence.append(f"Different emirates: CV({cv_location}) vs JD({jd_location})")
        
        elif dimension_name == 'cultural_fit':
            # Arabic language skills
            cv_languages = cv_data.get('languages', [])
            if 'Arabic' in cv_languages or 'العربية' in cv_languages:
                evidence.append("Arabic language proficiency indicated")
            
            # UAE experience
            uae_experience = self._calculate_uae_experience(cv_data)
            if uae_experience > 0:
                evidence.append(f"UAE work experience: {uae_experience} years")
        
        # Add AI-generated evidence if available
        ai_evidence = ai_analysis.get('evidence', {}).get(dimension_name, [])
        evidence.extend(ai_evidence)
        
        return evidence[:5]  # Limit to top 5 pieces of evidence
    
    def _generate_reasoning(self, dimension_name: str, score: float, evidence: List[str]) -> str:
        """Generate reasoning explanation for the score"""
        
        if score >= 80:
            strength = "strong"
        elif score >= 60:
            strength = "moderate"
        else:
            strength = "weak"
        
        reasoning = f"The {dimension_name} shows {strength} alignment (score: {score:.1f}). "
        
        if evidence:
            reasoning += f"Key factors: {'; '.join(evidence[:3])}."
        else:
            reasoning += "Limited evidence available for detailed assessment."
        
        return reasoning
    
    def _calculate_confidence(self, evidence: List[str], ai_analysis: Dict) -> float:
        """Calculate confidence score based on evidence quality and AI confidence"""
        
        # Base confidence from AI
        ai_confidence = ai_analysis.get('confidence_score', 70.0)
        
        # Evidence-based confidence adjustment
        evidence_count = len(evidence)
        evidence_bonus = min(20, evidence_count * 5)  # Up to 20% bonus for evidence
        
        # Data completeness factor
        completeness_factor = ai_analysis.get('data_completeness', 0.8)
        
        final_confidence = (ai_confidence + evidence_bonus) * completeness_factor
        
        return min(100.0, final_confidence)
    
    def _apply_uae_adjustments(self, dimension_name: str, base_score: float, 
                              cv_data: Dict, jd_data: Dict) -> float:
        """Apply UAE-specific adjustments to scores"""
        
        adjusted_score = base_score
        
        if dimension_name == 'cultural_fit':
            # Arabic language bonus
            cv_languages = cv_data.get('languages', [])
            if 'Arabic' in cv_languages or 'العربية' in cv_languages:
                adjusted_score += self.uae_adjustments['arabic_language_bonus'] * 100
            
            # UAE experience bonus
            uae_experience = self._calculate_uae_experience(cv_data)
            if uae_experience > 0:
                bonus = min(self.uae_adjustments['uae_experience_bonus'] * 100, 
                           uae_experience * 5)
                adjusted_score += bonus
        
        elif dimension_name == 'location_preference':
            # Same emirate bonus
            cv_location = cv_data.get('personalInfo', {}).get('location', '')
            jd_location = jd_data.get('location', '')
            
            if self._same_emirate(cv_location, jd_location):
                adjusted_score *= self.uae_adjustments['location_preference_multiplier']
        
        elif dimension_name == 'industry_alignment':
            # Strategic industry bonus
            jd_industry = jd_data.get('industry', '')
            strategic_industries = ['technology', 'renewable_energy', 'healthcare', 'education']
            
            if jd_industry in strategic_industries:
                adjusted_score += self.uae_adjustments['strategic_industry_bonus'] * 100
        
        return min(100.0, adjusted_score)
    
    def calculate_advanced_score(self, cv_data: Dict, jd_data: Dict, 
                               ai_analysis: Dict) -> AdvancedScore:
        """Calculate comprehensive advanced score"""
        
        start_time = datetime.now()
        
        # Calculate individual dimension scores
        dimensions = {}
        total_weighted_score = 0.0
        total_weight = 0.0
        confidence_scores = []
        
        for dimension_name in self.base_dimensions.keys():
            dimension_score = self.calculate_dimension_score(
                dimension_name, cv_data, jd_data, ai_analysis
            )
            dimensions[dimension_name] = dimension_score
            
            # Calculate weighted contribution
            weighted_contribution = dimension_score.score * dimension_score.weight
            total_weighted_score += weighted_contribution
            total_weight += dimension_score.weight
            confidence_scores.append(dimension_score.confidence)
        
        # Calculate overall metrics
        overall_score = total_weighted_score / total_weight if total_weight > 0 else 0
        confidence_score = np.mean(confidence_scores) if confidence_scores else 0
        
        # Determine confidence level
        confidence_level = self._determine_confidence_level(confidence_score)
        
        # Calculate normalized score (0-1 scale)
        normalized_score = overall_score / 100.0
        
        # Calculate reliability index
        reliability_index = self._calculate_reliability_index(dimensions, confidence_scores)
        
        # Perform validation
        validation_flags = self._validate_scores(dimensions, cv_data, jd_data)
        
        # Generate recommendations and improvement areas
        recommendations = self._generate_recommendations(dimensions, overall_score)
        improvement_areas = self._identify_improvement_areas(dimensions)
        
        return AdvancedScore(
            overall_score=overall_score,
            confidence_score=confidence_score,
            confidence_level=confidence_level,
            dimensions=dimensions,
            weighted_score=total_weighted_score,
            normalized_score=normalized_score,
            reliability_index=reliability_index,
            validation_flags=validation_flags,
            recommendations=recommendations,
            improvement_areas=improvement_areas,
            timestamp=start_time
        )
    
    def _determine_confidence_level(self, confidence_score: float) -> ConfidenceLevel:
        """Determine confidence level based on score"""
        for level, threshold in self.confidence_thresholds.items():
            if confidence_score >= threshold:
                return level
        return ConfidenceLevel.VERY_LOW
    
    def _calculate_reliability_index(self, dimensions: Dict[str, ScoringDimension], 
                                   confidence_scores: List[float]) -> float:
        """Calculate reliability index based on score consistency and confidence"""
        
        # Score variance factor
        scores = [dim.score for dim in dimensions.values()]
        score_variance = np.var(scores) if len(scores) > 1 else 0
        variance_factor = max(0, 1 - (score_variance / 1000))  # Normalize variance
        
        # Confidence consistency factor
        confidence_variance = np.var(confidence_scores) if len(confidence_scores) > 1 else 0
        confidence_factor = max(0, 1 - (confidence_variance / 1000))
        
        # Evidence quality factor
        total_evidence = sum(len(dim.evidence) for dim in dimensions.values())
        evidence_factor = min(1.0, total_evidence / (len(dimensions) * 3))  # 3 evidence per dimension
        
        # Combined reliability index
        reliability_index = (variance_factor + confidence_factor + evidence_factor) / 3
        
        return reliability_index * 100
    
    def _validate_scores(self, dimensions: Dict[str, ScoringDimension], 
                        cv_data: Dict, jd_data: Dict) -> List[str]:
        """Validate scores and identify potential issues"""
        flags = []
        
        # Check for missing critical data
        if not cv_data.get('skills'):
            flags.append("missing_skills_data")
        
        if not cv_data.get('experience'):
            flags.append("missing_experience_data")
        
        # Check for score outliers
        scores = [dim.score for dim in dimensions.values()]
        if len(scores) > 1:
            mean_score = np.mean(scores)
            std_score = np.std(scores)
            
            for dim_name, dimension in dimensions.items():
                if abs(dimension.score - mean_score) > (2 * std_score):
                    flags.append(f"outlier_score_{dim_name}")
        
        # Check for low confidence scores
        low_confidence_dims = [
            dim_name for dim_name, dim in dimensions.items() 
            if dim.confidence < 60
        ]
        if low_confidence_dims:
            flags.append(f"low_confidence_{','.join(low_confidence_dims)}")
        
        # Check for insufficient evidence
        low_evidence_dims = [
            dim_name for dim_name, dim in dimensions.items() 
            if len(dim.evidence) < 2
        ]
        if low_evidence_dims:
            flags.append(f"insufficient_evidence_{','.join(low_evidence_dims)}")
        
        return flags
    
    def _generate_recommendations(self, dimensions: Dict[str, ScoringDimension], 
                                overall_score: float) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Overall score recommendations
        if overall_score >= 80:
            recommendations.append("Excellent match - proceed with interview process")
        elif overall_score >= 60:
            recommendations.append("Good match - consider for further evaluation")
        else:
            recommendations.append("Below threshold - may require additional assessment")
        
        # Dimension-specific recommendations
        for dim_name, dimension in dimensions.items():
            if dimension.score < 60:
                if dim_name == 'skills_match':
                    recommendations.append("Consider skills development or training programs")
                elif dim_name == 'experience_match':
                    recommendations.append("Evaluate transferable experience and potential")
                elif dim_name == 'cultural_fit':
                    recommendations.append("Assess cultural adaptability and provide orientation")
                elif dim_name == 'location_preference':
                    recommendations.append("Discuss relocation support or remote work options")
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _identify_improvement_areas(self, dimensions: Dict[str, ScoringDimension]) -> List[str]:
        """Identify areas for candidate improvement"""
        improvement_areas = []
        
        # Find lowest scoring dimensions
        sorted_dims = sorted(dimensions.items(), key=lambda x: x[1].score)
        
        for dim_name, dimension in sorted_dims[:3]:  # Top 3 improvement areas
            if dimension.score < 70:
                area_map = {
                    'skills_match': 'Technical and soft skills development',
                    'experience_match': 'Relevant industry experience',
                    'education_match': 'Educational qualifications or certifications',
                    'cultural_fit': 'Cultural awareness and language skills',
                    'location_preference': 'Geographic flexibility',
                    'industry_alignment': 'Industry knowledge and expertise'
                }
                
                improvement_areas.append(area_map.get(dim_name, f"{dim_name} improvement"))
        
        return improvement_areas
    
    def calculate_advanced_scores(self, cv_info: Dict, jd_info: Dict, 
                                ai_analysis: Dict, uae_adjustments: Dict = None) -> Dict[str, Any]:
        """
        Calculate advanced scores (compatibility wrapper for job_matching_engine_optimized)
        
        Args:
            cv_info: Extracted CV information
            jd_info: Extracted JD information
            ai_analysis: AI analysis results
            uae_adjustments: Optional UAE-specific adjustments
            
        Returns:
            Dictionary containing scores and breakdown
        """
        # Call internal method
        result = self.calculate_advanced_score(cv_info, jd_info, ai_analysis)
        
        # Format result to match expectation of optimized engine
        formatted_result = {
            'overall_score': result.overall_score,
            'confidence_score': result.confidence_score,
            'confidence_level': result.confidence_level.value,
            'weighted_score': result.weighted_score,
            'normalized_score': result.normalized_score,
            'reliability_index': result.reliability_index,
            'detailed_scores': {name: dim.score for name, dim in result.dimensions.items()},
            'recommendations': result.recommendations,
            'improvement_areas': result.improvement_areas
        }
        
        # Merge detailed dimensions
        for name, dim in result.dimensions.items():
            formatted_result[name] = dim.score
            
        return formatted_result

    # Helper methods
    def _calculate_total_experience(self, cv_data: Dict) -> float:
        """Calculate total years of experience"""
        experience = cv_data.get('experience', [])
        total_years = 0
        
        for exp in experience:
            duration = exp.get('duration', '')
            years = self._parse_duration_to_years(duration)
            total_years += years
        
        return total_years
    
    def _extract_required_experience(self, jd_data: Dict) -> float:
        """Extract required years of experience from JD"""
        requirements = jd_data.get('requirements', {}).get('experience', [])
        
        for req in requirements:
            if isinstance(req, str):
                # Parse strings like "3+ years", "5-7 years"
                import re
                numbers = re.findall(r'\d+', req)
                if numbers:
                    return float(numbers[0])
        
        return 0.0
    
    def _parse_duration_to_years(self, duration: str) -> float:
        """Parse duration string to years"""
        if not duration:
            return 0
        
        # Simple parsing for formats like "2020-2023", "2 years"
        import re
        
        # Year range format
        year_match = re.search(r'(\d{4})-(\d{4})', duration)
        if year_match:
            start_year, end_year = year_match.groups()
            return float(end_year) - float(start_year)
        
        # Years format
        years_match = re.search(r'(\d+)\s*years?', duration.lower())
        if years_match:
            return float(years_match.group(1))
        
        return 1.0  # Default to 1 year if can't parse
    
    def _extract_industries(self, cv_data: Dict) -> List[str]:
        """Extract industries from CV experience"""
        industries = []
        experience = cv_data.get('experience', [])
        
        for exp in experience:
            company = exp.get('company', '').lower()
            # Simple industry mapping based on company names
            if 'tech' in company or 'software' in company:
                industries.append('technology')
            elif 'bank' in company or 'finance' in company:
                industries.append('finance')
            elif 'hospital' in company or 'health' in company:
                industries.append('healthcare')
        
        return list(set(industries))
    
    def _same_emirate(self, location1: str, location2: str) -> bool:
        """Check if two locations are in the same emirate"""
        emirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
        
        for emirate in emirates:
            if emirate.lower() in location1.lower() and emirate.lower() in location2.lower():
                return True
        
        return False
    
    def _calculate_uae_experience(self, cv_data: Dict) -> float:
        """Calculate years of UAE work experience"""
        experience = cv_data.get('experience', [])
        uae_years = 0
        
        for exp in experience:
            location = exp.get('location', '').lower()
            if 'uae' in location or 'dubai' in location or 'abu dhabi' in location:
                duration = exp.get('duration', '')
                years = self._parse_duration_to_years(duration)
                uae_years += years
        
        return uae_years

# Global instance
advanced_scoring_system = AdvancedScoringSystem()

def get_advanced_scoring_system():
    """Get the global advanced scoring system instance"""
    return advanced_scoring_system

