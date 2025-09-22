"""
UAE-Specific Matching Criteria Module
Comprehensive criteria for UAE job market alignment
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class EmirateType(Enum):
    """UAE Emirates enumeration"""
    ABU_DHABI = "Abu Dhabi"
    DUBAI = "Dubai"
    SHARJAH = "Sharjah"
    AJMAN = "Ajman"
    UMM_AL_QUWAIN = "Umm Al Quwain"
    RAS_AL_KHAIMAH = "Ras Al Khaimah"
    FUJAIRAH = "Fujairah"

class IndustryPriority(Enum):
    """UAE Industry Priority Levels"""
    CRITICAL = "critical"
    STRATEGIC = "strategic"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ArabicProficiency(Enum):
    """Arabic Language Proficiency Levels"""
    NATIVE = "native"
    FLUENT = "fluent"
    CONVERSATIONAL = "conversational"
    BASIC = "basic"
    NONE = "none"

@dataclass
class UAELocationPreference:
    """UAE location preference with scoring"""
    emirate: EmirateType
    preference_score: float
    commute_tolerance: int  # minutes
    relocation_willingness: bool
    housing_preference: str  # "provided", "allowance", "own"

@dataclass
class UAECulturalProfile:
    """UAE cultural awareness and fit profile"""
    arabic_proficiency: ArabicProficiency
    uae_work_experience_years: float
    gcc_work_experience_years: float
    ramadan_awareness: bool
    business_etiquette_knowledge: bool
    local_customs_familiarity: bool
    cultural_sensitivity_score: float

@dataclass
class UAEIndustryAlignment:
    """UAE industry alignment and expertise"""
    primary_industry: str
    secondary_industries: List[str]
    uae_industry_experience: Dict[str, float]  # industry -> years
    government_sector_experience: bool
    private_sector_experience: bool
    startup_experience: bool
    multinational_experience: bool

class UAEMatchingCriteria:
    """
    Comprehensive UAE-specific matching criteria system
    """
    
    def __init__(self):
        """Initialize UAE matching criteria"""
        self.setup_emirates_data()
        self.setup_industry_data()
        self.setup_cultural_factors()
        self.setup_scoring_matrices()
        
        logger.info("UAE Matching Criteria initialized")
    
    def setup_emirates_data(self):
        """Setup Emirates-specific data and preferences"""
        self.emirates_data = {
            EmirateType.ABU_DHABI: {
                'population': 3100000,
                'economic_focus': ['oil_gas', 'government', 'finance', 'tourism', 'renewable_energy'],
                'major_employers': ['ADNOC', 'Mubadala', 'ADIA', 'Government Entities'],
                'business_districts': ['Downtown', 'Al Reem Island', 'Yas Island', 'Saadiyat Island'],
                'cost_of_living_index': 85,
                'job_market_competitiveness': 'high',
                'growth_sectors': ['renewable_energy', 'technology', 'healthcare', 'education'],
                'language_requirements': {'arabic': 0.3, 'english': 0.9},
                'cultural_importance': 0.9,  # Capital city, high cultural importance
                'government_job_availability': 'high'
            },
            EmirateType.DUBAI: {
                'population': 3500000,
                'economic_focus': ['finance', 'tourism', 'trade', 'technology', 'aviation', 'real_estate'],
                'major_employers': ['Emirates Group', 'DIFC', 'DP World', 'Emaar', 'Dubai Municipality'],
                'business_districts': ['DIFC', 'DMCC', 'Downtown', 'Business Bay', 'Dubai Marina'],
                'cost_of_living_index': 90,
                'job_market_competitiveness': 'very_high',
                'growth_sectors': ['technology', 'fintech', 'e_commerce', 'logistics', 'tourism'],
                'language_requirements': {'arabic': 0.2, 'english': 0.95},
                'cultural_importance': 0.7,  # International hub, moderate cultural importance
                'government_job_availability': 'medium'
            },
            EmirateType.SHARJAH: {
                'population': 1800000,
                'economic_focus': ['manufacturing', 'education', 'culture', 'logistics', 'healthcare'],
                'major_employers': ['Sharjah Investment Authority', 'University of Sharjah', 'Sharjah Municipality'],
                'business_districts': ['Sharjah City Centre', 'Al Qasba', 'University City'],
                'cost_of_living_index': 70,
                'job_market_competitiveness': 'medium',
                'growth_sectors': ['education', 'healthcare', 'manufacturing', 'culture'],
                'language_requirements': {'arabic': 0.4, 'english': 0.8},
                'cultural_importance': 0.95,  # Cultural capital, very high cultural importance
                'government_job_availability': 'medium'
            },
            EmirateType.AJMAN: {
                'population': 540000,
                'economic_focus': ['manufacturing', 'real_estate', 'tourism', 'small_business'],
                'major_employers': ['Ajman Municipality', 'Ajman University', 'Local Businesses'],
                'business_districts': ['Ajman City Centre', 'Al Nuaimiya'],
                'cost_of_living_index': 60,
                'job_market_competitiveness': 'low',
                'growth_sectors': ['tourism', 'real_estate', 'small_business'],
                'language_requirements': {'arabic': 0.5, 'english': 0.7},
                'cultural_importance': 0.8,
                'government_job_availability': 'low'
            },
            EmirateType.UMM_AL_QUWAIN: {
                'population': 72000,
                'economic_focus': ['agriculture', 'fishing', 'tourism', 'small_business'],
                'major_employers': ['UAQ Municipality', 'Local Businesses', 'Tourism Sector'],
                'business_districts': ['UAQ City Centre'],
                'cost_of_living_index': 50,
                'job_market_competitiveness': 'very_low',
                'growth_sectors': ['tourism', 'agriculture', 'fishing'],
                'language_requirements': {'arabic': 0.6, 'english': 0.6},
                'cultural_importance': 0.9,
                'government_job_availability': 'very_low'
            },
            EmirateType.RAS_AL_KHAIMAH: {
                'population': 400000,
                'economic_focus': ['manufacturing', 'tourism', 'agriculture', 'ceramics'],
                'major_employers': ['RAK Ceramics', 'RAK Municipality', 'Tourism Sector'],
                'business_districts': ['RAK City Centre', 'Al Nakheel'],
                'cost_of_living_index': 65,
                'job_market_competitiveness': 'medium',
                'growth_sectors': ['tourism', 'manufacturing', 'agriculture'],
                'language_requirements': {'arabic': 0.4, 'english': 0.75},
                'cultural_importance': 0.85,
                'government_job_availability': 'low'
            },
            EmirateType.FUJAIRAH: {
                'population': 260000,
                'economic_focus': ['shipping', 'oil_gas', 'tourism', 'agriculture', 'fishing'],
                'major_employers': ['Port of Fujairah', 'ADNOC', 'Fujairah Municipality'],
                'business_districts': ['Fujairah City Centre', 'Port Area'],
                'cost_of_living_index': 55,
                'job_market_competitiveness': 'low',
                'growth_sectors': ['shipping', 'tourism', 'oil_gas'],
                'language_requirements': {'arabic': 0.5, 'english': 0.8},
                'cultural_importance': 0.9,
                'government_job_availability': 'low'
            }
        }
    
    def setup_industry_data(self):
        """Setup UAE industry-specific data"""
        self.industry_data = {
            'oil_gas': {
                'priority': IndustryPriority.CRITICAL,
                'growth_rate': 'stable',
                'demand_level': 'high',
                'uae_strategic_importance': 0.95,
                'preferred_emirates': [EmirateType.ABU_DHABI, EmirateType.FUJAIRAH],
                'required_certifications': ['HSE', 'NEBOSH', 'IOSH'],
                'arabic_importance': 0.4,
                'cultural_sensitivity_importance': 0.8
            },
            'finance': {
                'priority': IndustryPriority.HIGH,
                'growth_rate': 'growing',
                'demand_level': 'high',
                'uae_strategic_importance': 0.9,
                'preferred_emirates': [EmirateType.DUBAI, EmirateType.ABU_DHABI],
                'required_certifications': ['CFA', 'FRM', 'ACCA', 'CPA'],
                'arabic_importance': 0.2,
                'cultural_sensitivity_importance': 0.6
            },
            'technology': {
                'priority': IndustryPriority.STRATEGIC,
                'growth_rate': 'rapid',
                'demand_level': 'very_high',
                'uae_strategic_importance': 0.95,
                'preferred_emirates': [EmirateType.DUBAI, EmirateType.ABU_DHABI],
                'required_certifications': ['AWS', 'Azure', 'Google Cloud', 'Cisco'],
                'arabic_importance': 0.1,
                'cultural_sensitivity_importance': 0.4
            },
            'tourism': {
                'priority': IndustryPriority.HIGH,
                'growth_rate': 'growing',
                'demand_level': 'high',
                'uae_strategic_importance': 0.85,
                'preferred_emirates': [EmirateType.DUBAI, EmirateType.ABU_DHABI, EmirateType.RAS_AL_KHAIMAH],
                'required_certifications': ['IATA', 'WSET', 'Hospitality Management'],
                'arabic_importance': 0.3,
                'cultural_sensitivity_importance': 0.9
            },
            'healthcare': {
                'priority': IndustryPriority.CRITICAL,
                'growth_rate': 'growing',
                'demand_level': 'high',
                'uae_strategic_importance': 0.9,
                'preferred_emirates': [EmirateType.ABU_DHABI, EmirateType.DUBAI, EmirateType.SHARJAH],
                'required_certifications': ['DHA', 'HAAD', 'MOH', 'DOH'],
                'arabic_importance': 0.4,
                'cultural_sensitivity_importance': 0.85
            },
            'education': {
                'priority': IndustryPriority.HIGH,
                'growth_rate': 'stable',
                'demand_level': 'medium',
                'uae_strategic_importance': 0.8,
                'preferred_emirates': [EmirateType.SHARJAH, EmirateType.ABU_DHABI, EmirateType.DUBAI],
                'required_certifications': ['Teaching License', 'TESOL', 'CELTA'],
                'arabic_importance': 0.5,
                'cultural_sensitivity_importance': 0.9
            },
            'government': {
                'priority': IndustryPriority.CRITICAL,
                'growth_rate': 'stable',
                'demand_level': 'medium',
                'uae_strategic_importance': 0.95,
                'preferred_emirates': [EmirateType.ABU_DHABI],
                'required_certifications': ['Government Specific'],
                'arabic_importance': 0.7,
                'cultural_sensitivity_importance': 0.95
            }
        }
    
    def setup_cultural_factors(self):
        """Setup cultural factors and their importance"""
        self.cultural_factors = {
            'ramadan_awareness': {
                'importance': 0.8,
                'description': 'Understanding of Ramadan practices and workplace adjustments',
                'indicators': ['flexible_hours', 'reduced_productivity_awareness', 'cultural_respect']
            },
            'business_etiquette': {
                'importance': 0.7,
                'description': 'Knowledge of UAE business customs and etiquette',
                'indicators': ['greeting_customs', 'meeting_protocols', 'dress_code_awareness']
            },
            'local_customs': {
                'importance': 0.6,
                'description': 'Familiarity with local customs and traditions',
                'indicators': ['national_day_awareness', 'cultural_events', 'social_norms']
            },
            'language_sensitivity': {
                'importance': 0.5,
                'description': 'Sensitivity to Arabic language and multilingual environment',
                'indicators': ['arabic_respect', 'translation_awareness', 'communication_adaptation']
            },
            'religious_awareness': {
                'importance': 0.9,
                'description': 'Understanding and respect for Islamic practices',
                'indicators': ['prayer_time_respect', 'halal_awareness', 'religious_holidays']
            }
        }
    
    def setup_scoring_matrices(self):
        """Setup scoring matrices for different criteria"""
        
        # Arabic proficiency scoring
        self.arabic_proficiency_scores = {
            ArabicProficiency.NATIVE: 100,
            ArabicProficiency.FLUENT: 90,
            ArabicProficiency.CONVERSATIONAL: 70,
            ArabicProficiency.BASIC: 40,
            ArabicProficiency.NONE: 0
        }
        
        # UAE experience scoring (years -> score)
        self.uae_experience_scoring = {
            0: 0,
            1: 20,
            2: 40,
            3: 60,
            5: 80,
            7: 90,
            10: 100
        }
        
        # Industry alignment scoring
        self.industry_alignment_multipliers = {
            IndustryPriority.CRITICAL: 1.3,
            IndustryPriority.STRATEGIC: 1.25,
            IndustryPriority.HIGH: 1.15,
            IndustryPriority.MEDIUM: 1.0,
            IndustryPriority.LOW: 0.8
        }
    
    def calculate_location_score(self, candidate_preferences: UAELocationPreference, job_emirate: EmirateType) -> float:
        """Calculate location preference score"""
        if candidate_preferences.emirate == job_emirate:
            return 100.0
        
        # Get emirate data
        job_emirate_data = self.emirates_data[job_emirate]
        candidate_emirate_data = self.emirates_data[candidate_preferences.emirate]
        
        # Calculate distance penalty (simplified)
        distance_penalty = 0
        if candidate_preferences.emirate != job_emirate:
            if candidate_preferences.relocation_willingness:
                distance_penalty = 10  # Willing to relocate
            else:
                distance_penalty = 30  # Not willing to relocate
        
        # Calculate cost of living adjustment
        cost_difference = abs(job_emirate_data['cost_of_living_index'] - 
                            candidate_emirate_data['cost_of_living_index'])
        cost_penalty = min(cost_difference * 0.2, 20)
        
        base_score = candidate_preferences.preference_score
        final_score = max(0, base_score - distance_penalty - cost_penalty)
        
        return final_score
    
    def calculate_cultural_fit_score(self, cultural_profile: UAECulturalProfile, job_requirements: Dict) -> Tuple[float, List[str]]:
        """Calculate cultural fit score with detailed breakdown"""
        
        total_score = 0.0
        max_score = 0.0
        recommendations = []
        
        # Arabic proficiency scoring
        arabic_weight = job_requirements.get('arabic_importance', 0.3)
        arabic_score = self.arabic_proficiency_scores[cultural_profile.arabic_proficiency]
        total_score += arabic_score * arabic_weight
        max_score += 100 * arabic_weight
        
        if arabic_score < 70 and arabic_weight > 0.3:
            recommendations.append("Consider improving Arabic language skills for better cultural integration")
        
        # UAE work experience scoring
        uae_exp_weight = 0.4
        uae_exp_score = min(100, cultural_profile.uae_work_experience_years * 20)
        total_score += uae_exp_score * uae_exp_weight
        max_score += 100 * uae_exp_weight
        
        if cultural_profile.uae_work_experience_years < 2:
            recommendations.append("UAE work experience would be highly beneficial")
        
        # GCC experience bonus
        gcc_exp_weight = 0.2
        gcc_exp_score = min(100, cultural_profile.gcc_work_experience_years * 15)
        total_score += gcc_exp_score * gcc_exp_weight
        max_score += 100 * gcc_exp_weight
        
        # Cultural awareness factors
        cultural_awareness_weight = 0.3
        cultural_factors_score = 0
        cultural_factors_count = 0
        
        if cultural_profile.ramadan_awareness:
            cultural_factors_score += 100
        cultural_factors_count += 1
        
        if cultural_profile.business_etiquette_knowledge:
            cultural_factors_score += 100
        cultural_factors_count += 1
        
        if cultural_profile.local_customs_familiarity:
            cultural_factors_score += 100
        cultural_factors_count += 1
        
        avg_cultural_score = cultural_factors_score / cultural_factors_count if cultural_factors_count > 0 else 0
        total_score += avg_cultural_score * cultural_awareness_weight
        max_score += 100 * cultural_awareness_weight
        
        # Add cultural sensitivity score
        sensitivity_weight = 0.1
        total_score += cultural_profile.cultural_sensitivity_score * sensitivity_weight
        max_score += 100 * sensitivity_weight
        
        if not cultural_profile.ramadan_awareness:
            recommendations.append("Learn about Ramadan workplace practices and cultural sensitivity")
        
        if not cultural_profile.business_etiquette_knowledge:
            recommendations.append("Familiarize yourself with UAE business etiquette and customs")
        
        final_score = (total_score / max_score * 100) if max_score > 0 else 0
        
        return final_score, recommendations
    
    def calculate_industry_alignment_score(self, industry_profile: UAEIndustryAlignment, job_industry: str) -> float:
        """Calculate industry alignment score"""
        
        if job_industry not in self.industry_data:
            return 50.0  # Default score for unknown industries
        
        industry_info = self.industry_data[job_industry]
        
        # Primary industry match
        if industry_profile.primary_industry == job_industry:
            base_score = 100
        elif job_industry in industry_profile.secondary_industries:
            base_score = 80
        else:
            base_score = 30
        
        # UAE industry experience bonus
        uae_industry_exp = industry_profile.uae_industry_experience.get(job_industry, 0)
        experience_bonus = min(20, uae_industry_exp * 4)
        
        # Strategic importance multiplier
        priority_multiplier = self.industry_alignment_multipliers[industry_info['priority']]
        
        # Sector experience bonuses
        sector_bonus = 0
        if industry_info.get('government_focus', False) and industry_profile.government_sector_experience:
            sector_bonus += 10
        if industry_profile.private_sector_experience:
            sector_bonus += 5
        if industry_profile.multinational_experience:
            sector_bonus += 5
        
        final_score = min(100, (base_score + experience_bonus + sector_bonus) * priority_multiplier)
        
        return final_score
    
    def get_emirate_recommendations(self, candidate_profile: Dict, job_requirements: Dict) -> List[str]:
        """Get emirate-specific recommendations"""
        recommendations = []
        
        job_emirate = job_requirements.get('emirate')
        if not job_emirate:
            return recommendations
        
        emirate_data = self.emirates_data.get(job_emirate)
        if not emirate_data:
            return recommendations
        
        # Cost of living recommendations
        if emirate_data['cost_of_living_index'] > 80:
            recommendations.append(f"Consider the higher cost of living in {job_emirate.value}")
        
        # Language recommendations
        arabic_req = emirate_data['language_requirements']['arabic']
        if arabic_req > 0.4:
            recommendations.append(f"Arabic language skills are important in {job_emirate.value}")
        
        # Cultural importance
        if emirate_data['cultural_importance'] > 0.8:
            recommendations.append(f"Strong cultural awareness is essential in {job_emirate.value}")
        
        # Growth sectors
        growth_sectors = emirate_data.get('growth_sectors', [])
        if growth_sectors:
            recommendations.append(f"Consider opportunities in growing sectors: {', '.join(growth_sectors)}")
        
        return recommendations

# Global instance
uae_criteria = UAEMatchingCriteria()

def get_uae_criteria():
    """Get the global UAE criteria instance"""
    return uae_criteria

