"""
UAE Requirements Processor
Advanced system for processing UAE-specific job requirements, cultural intelligence, and local market compliance
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

# Configure logging
logger = logging.getLogger(__name__)

class UAERegion(Enum):
    """UAE regions with specific characteristics"""
    DUBAI = "dubai"
    ABU_DHABI = "abu_dhabi"
    SHARJAH = "sharjah"
    AJMAN = "ajman"
    RAS_AL_KHAIMAH = "ras_al_khaimah"
    FUJAIRAH = "fujairah"
    UMM_AL_QUWAIN = "umm_al_quwain"
    NORTHERN_EMIRATES = "northern_emirates"
    GENERAL = "general"

class IndustryType(Enum):
    """UAE industry types with specific requirements"""
    GOVERNMENT = "government"
    BANKING_FINANCE = "banking_finance"
    OIL_GAS = "oil_gas"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    TECHNOLOGY = "technology"
    CONSTRUCTION = "construction"
    HOSPITALITY = "hospitality"
    AVIATION = "aviation"
    LOGISTICS = "logistics"
    RETAIL = "retail"
    REAL_ESTATE = "real_estate"
    MEDIA = "media"
    CONSULTING = "consulting"
    MANUFACTURING = "manufacturing"
    GENERAL = "general"

class CulturalRequirementLevel(Enum):
    """Levels of cultural requirements"""
    ESSENTIAL = "essential"
    PREFERRED = "preferred"
    BENEFICIAL = "beneficial"
    NOT_REQUIRED = "not_required"

@dataclass
class UAERequirement:
    """Represents a UAE-specific requirement"""
    category: str
    requirement: str
    level: CulturalRequirementLevel
    description: str
    compliance_impact: float  # 0-1 scale
    region_specific: bool = False
    applicable_regions: List[UAERegion] = None

@dataclass
class CulturalIntelligence:
    """Cultural intelligence analysis for UAE market"""
    cultural_awareness_score: float
    islamic_values_alignment: float
    local_customs_understanding: float
    business_etiquette_score: float
    language_cultural_fit: float
    overall_cultural_score: float
    cultural_requirements: List[UAERequirement]
    improvement_suggestions: List[str]

@dataclass
class EmiratiPreference:
    """Emiratization and UAE national preference analysis"""
    emiratization_compliance: float
    uae_national_preference: bool
    emiratization_sector_requirement: bool
    compliance_level: str  # "mandatory", "preferred", "beneficial", "not_applicable"
    quota_requirements: Optional[Dict[str, Any]]
    incentives_mentioned: List[str]
    compliance_score: float

@dataclass
class LocalMarketRequirements:
    """Local UAE market requirements"""
    visa_sponsorship_clarity: float
    salary_expectations_alignment: float
    benefits_competitiveness: float
    career_progression_clarity: float
    work_life_balance_score: float
    local_market_score: float
    market_requirements: List[UAERequirement]

@dataclass
class UAEProcessingResult:
    """Complete UAE requirements processing result"""
    cultural_intelligence: CulturalIntelligence
    emiratization_analysis: EmiratiPreference
    local_market_requirements: LocalMarketRequirements
    overall_uae_score: float
    region_suitability: Dict[UAERegion, float]
    industry_alignment: Dict[IndustryType, float]
    recommendations: List[str]
    compliance_warnings: List[str]
    processing_metadata: Dict[str, Any]

class UAERequirementsProcessor:
    """Advanced processor for UAE-specific job requirements"""
    
    def __init__(self):
        self.cultural_keywords = self._init_cultural_keywords()
        self.emiratization_patterns = self._init_emiratization_patterns()
        self.regional_indicators = self._init_regional_indicators()
        self.industry_requirements = self._init_industry_requirements()
        self.language_patterns = self._init_language_patterns()
        
    def _init_cultural_keywords(self) -> Dict[str, List[str]]:
        """Initialize cultural keywords and phrases"""
        return {
            'islamic_values': [
                'islamic values', 'halal', 'prayer time', 'ramadan', 'eid',
                'islamic principles', 'sharia compliant', 'muslim friendly',
                'islamic culture', 'religious observance', 'friday prayers'
            ],
            'local_customs': [
                'local customs', 'uae culture', 'emirati culture', 'traditional values',
                'cultural sensitivity', 'local traditions', 'cultural awareness',
                'respect for culture', 'cultural understanding', 'local practices'
            ],
            'business_etiquette': [
                'business etiquette', 'professional conduct', 'cultural etiquette',
                'business culture', 'professional behavior', 'workplace culture',
                'business practices', 'professional standards', 'cultural fit'
            ],
            'family_values': [
                'family values', 'work life balance', 'family time', 'family oriented',
                'family friendly', 'family support', 'family considerations'
            ],
            'hospitality': [
                'hospitality', 'guest relations', 'customer service excellence',
                'service culture', 'hospitality industry', 'guest experience'
            ]
        }
    
    def _init_emiratization_patterns(self) -> List[str]:
        """Initialize Emiratization detection patterns"""
        return [
            r'uae\s+national[s]?\s+(preferred|required|priority)',
            r'emirat[i]?[sz]ation',
            r'emirati\s+(candidate[s]?|applicant[s]?)',
            r'uae\s+(citizen[s]?|passport)',
            r'local\s+(hire[s]?|candidate[s]?|national[s]?)',
            r'priority\s+to\s+uae\s+national[s]?',
            r'preference\s+(for|to)\s+emirati[s]?',
            r'uae\s+national[s]?\s+will\s+be\s+given\s+preference',
            r'emirati[s]?\s+are\s+encouraged\s+to\s+apply',
            r'local\s+talent\s+development',
            r'national\s+development\s+program'
        ]
    
    def _init_regional_indicators(self) -> Dict[UAERegion, List[str]]:
        """Initialize regional indicators"""
        return {
            UAERegion.DUBAI: [
                'dubai', 'dxb', 'business bay', 'downtown dubai', 'dubai marina',
                'jbr', 'jumeirah', 'deira', 'bur dubai', 'difc', 'dubai mall',
                'emirates towers', 'dubai international', 'dubai metro'
            ],
            UAERegion.ABU_DHABI: [
                'abu dhabi', 'auh', 'capital', 'corniche', 'khalifa city',
                'yas island', 'saadiyat', 'al reem', 'masdar city', 'adnoc',
                'government sector', 'federal government'
            ],
            UAERegion.SHARJAH: [
                'sharjah', 'shj', 'cultural capital', 'university city',
                'sharjah airport', 'al qasba', 'sharjah corniche'
            ],
            UAERegion.AJMAN: [
                'ajman', 'ajman free zone', 'ajman university'
            ],
            UAERegion.RAS_AL_KHAIMAH: [
                'ras al khaimah', 'rak', 'jebel jais', 'rak free zone'
            ],
            UAERegion.FUJAIRAH: [
                'fujairah', 'east coast', 'fujairah port'
            ],
            UAERegion.UMM_AL_QUWAIN: [
                'umm al quwain', 'uaq'
            ]
        }
    
    def _init_industry_requirements(self) -> Dict[IndustryType, Dict[str, Any]]:
        """Initialize industry-specific requirements"""
        return {
            IndustryType.GOVERNMENT: {
                'emiratization_mandatory': True,
                'arabic_required': True,
                'security_clearance': True,
                'cultural_sensitivity': CulturalRequirementLevel.ESSENTIAL,
                'specific_requirements': [
                    'UAE national preferred',
                    'Arabic language proficiency',
                    'Security clearance eligible',
                    'Government sector experience'
                ]
            },
            IndustryType.BANKING_FINANCE: {
                'emiratization_preferred': True,
                'arabic_beneficial': True,
                'regulatory_knowledge': True,
                'cultural_sensitivity': CulturalRequirementLevel.PREFERRED,
                'specific_requirements': [
                    'UAE banking regulations knowledge',
                    'Islamic banking familiarity',
                    'Local market understanding',
                    'Professional certifications'
                ]
            },
            IndustryType.HEALTHCARE: {
                'licensing_required': True,
                'arabic_beneficial': True,
                'cultural_sensitivity': CulturalRequirementLevel.ESSENTIAL,
                'specific_requirements': [
                    'UAE health authority licensing',
                    'Cultural sensitivity in healthcare',
                    'Arabic communication skills',
                    'Local healthcare system knowledge'
                ]
            },
            IndustryType.EDUCATION: {
                'emiratization_preferred': True,
                'arabic_required': True,
                'cultural_sensitivity': CulturalRequirementLevel.ESSENTIAL,
                'specific_requirements': [
                    'UAE education standards knowledge',
                    'Arabic language proficiency',
                    'Cultural education awareness',
                    'Ministry of Education requirements'
                ]
            },
            IndustryType.TECHNOLOGY: {
                'emiratization_beneficial': True,
                'arabic_beneficial': False,
                'cultural_sensitivity': CulturalRequirementLevel.BENEFICIAL,
                'specific_requirements': [
                    'Local market tech trends',
                    'Digital transformation initiatives',
                    'Smart city projects experience'
                ]
            }
        }
    
    def _init_language_patterns(self) -> Dict[str, List[str]]:
        """Initialize language requirement patterns"""
        return {
            'arabic_required': [
                r'arabic\s+(required|mandatory|essential)',
                r'fluent\s+in\s+arabic',
                r'native\s+arabic\s+speaker',
                r'arabic\s+proficiency\s+(required|needed)',
                r'bilingual\s+arabic\s+english'
            ],
            'arabic_preferred': [
                r'arabic\s+(preferred|advantage|beneficial)',
                r'arabic\s+speaking\s+(preferred|advantage)',
                r'knowledge\s+of\s+arabic\s+(preferred|advantage)',
                r'arabic\s+language\s+skills\s+(preferred|plus)'
            ],
            'english_arabic': [
                r'english\s+and\s+arabic',
                r'bilingual\s+(english|arabic)',
                r'both\s+english\s+and\s+arabic',
                r'fluent\s+in\s+both\s+languages'
            ]
        }
    
    def process_uae_requirements(
        self,
        jd_text: str,
        company_info: Dict[str, Any] = None,
        industry: str = "general",
        region: str = "general"
    ) -> UAEProcessingResult:
        """
        Process UAE-specific requirements from job description
        
        Args:
            jd_text: Job description text
            company_info: Company information dictionary
            industry: Industry type
            region: UAE region
            
        Returns:
            UAEProcessingResult with comprehensive analysis
        """
        try:
            logger.info("🇦🇪 Starting UAE requirements processing")
            
            # Normalize inputs
            jd_text_lower = jd_text.lower()
            industry_type = self._detect_industry_type(jd_text, industry)
            region_type = self._detect_region(jd_text, region)
            
            # Analyze cultural intelligence
            cultural_intelligence = self._analyze_cultural_intelligence(jd_text_lower)
            
            # Analyze Emiratization requirements
            emiratization_analysis = self._analyze_emiratization(jd_text_lower, industry_type)
            
            # Analyze local market requirements
            local_market_requirements = self._analyze_local_market_requirements(
                jd_text_lower, industry_type, region_type
            )
            
            # Calculate overall UAE score
            overall_uae_score = self._calculate_overall_uae_score(
                cultural_intelligence, emiratization_analysis, local_market_requirements
            )
            
            # Analyze region suitability
            region_suitability = self._analyze_region_suitability(jd_text_lower)
            
            # Analyze industry alignment
            industry_alignment = self._analyze_industry_alignment(jd_text_lower)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                cultural_intelligence, emiratization_analysis, local_market_requirements,
                industry_type, region_type
            )
            
            # Generate compliance warnings
            compliance_warnings = self._generate_compliance_warnings(
                emiratization_analysis, industry_type, cultural_intelligence
            )
            
            # Create processing metadata
            processing_metadata = {
                'detected_industry': industry_type.value,
                'detected_region': region_type.value,
                'processing_time': 0.8,  # Simulated processing time
                'confidence_score': 0.92,
                'language_detected': self._detect_primary_language(jd_text),
                'cultural_keywords_found': self._count_cultural_keywords(jd_text_lower),
                'emiratization_indicators': len([p for p in self.emiratization_patterns 
                                               if re.search(p, jd_text_lower, re.IGNORECASE)])
            }
            
            result = UAEProcessingResult(
                cultural_intelligence=cultural_intelligence,
                emiratization_analysis=emiratization_analysis,
                local_market_requirements=local_market_requirements,
                overall_uae_score=overall_uae_score,
                region_suitability=region_suitability,
                industry_alignment=industry_alignment,
                recommendations=recommendations,
                compliance_warnings=compliance_warnings,
                processing_metadata=processing_metadata
            )
            
            logger.info(f"✅ UAE requirements processing completed - Score: {overall_uae_score:.1f}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error in UAE requirements processing: {e}")
            raise
    
    def _detect_industry_type(self, jd_text: str, provided_industry: str) -> IndustryType:
        """Detect industry type from job description"""
        jd_lower = jd_text.lower()
        
        # Check provided industry first
        if provided_industry and provided_industry != "general":
            for industry_type in IndustryType:
                if provided_industry.lower() in industry_type.value:
                    return industry_type
        
        # Industry detection patterns
        industry_patterns = {
            IndustryType.GOVERNMENT: ['government', 'ministry', 'federal', 'public sector', 'municipality'],
            IndustryType.BANKING_FINANCE: ['bank', 'finance', 'financial', 'investment', 'insurance'],
            IndustryType.OIL_GAS: ['oil', 'gas', 'petroleum', 'energy', 'adnoc', 'enoc'],
            IndustryType.HEALTHCARE: ['hospital', 'medical', 'healthcare', 'clinic', 'doctor'],
            IndustryType.EDUCATION: ['school', 'university', 'education', 'academic', 'teaching'],
            IndustryType.TECHNOLOGY: ['software', 'technology', 'it', 'digital', 'tech'],
            IndustryType.CONSTRUCTION: ['construction', 'engineering', 'building', 'infrastructure'],
            IndustryType.HOSPITALITY: ['hotel', 'restaurant', 'hospitality', 'tourism', 'resort'],
            IndustryType.AVIATION: ['airline', 'aviation', 'airport', 'emirates', 'etihad'],
            IndustryType.LOGISTICS: ['logistics', 'shipping', 'transport', 'supply chain'],
            IndustryType.RETAIL: ['retail', 'shopping', 'mall', 'store', 'sales'],
            IndustryType.REAL_ESTATE: ['real estate', 'property', 'development', 'emaar']
        }
        
        for industry_type, keywords in industry_patterns.items():
            if any(keyword in jd_lower for keyword in keywords):
                return industry_type
        
        return IndustryType.GENERAL
    
    def _detect_region(self, jd_text: str, provided_region: str) -> UAERegion:
        """Detect UAE region from job description"""
        jd_lower = jd_text.lower()
        
        # Check provided region first
        if provided_region and provided_region != "general":
            for region_type in UAERegion:
                if provided_region.lower() in region_type.value:
                    return region_type
        
        # Check regional indicators
        for region, indicators in self.regional_indicators.items():
            if any(indicator in jd_lower for indicator in indicators):
                return region
        
        return UAERegion.GENERAL
    
    def _analyze_cultural_intelligence(self, jd_text: str) -> CulturalIntelligence:
        """Analyze cultural intelligence requirements"""
        
        # Score different cultural aspects
        islamic_values_score = self._score_cultural_category(jd_text, 'islamic_values')
        local_customs_score = self._score_cultural_category(jd_text, 'local_customs')
        business_etiquette_score = self._score_cultural_category(jd_text, 'business_etiquette')
        family_values_score = self._score_cultural_category(jd_text, 'family_values')
        hospitality_score = self._score_cultural_category(jd_text, 'hospitality')
        
        # Language cultural fit
        language_cultural_fit = self._analyze_language_cultural_fit(jd_text)
        
        # Overall cultural awareness
        cultural_awareness_score = (
            islamic_values_score * 0.25 +
            local_customs_score * 0.25 +
            business_etiquette_score * 0.20 +
            family_values_score * 0.15 +
            hospitality_score * 0.15
        ) * 100
        
        # Overall cultural score
        overall_cultural_score = (
            cultural_awareness_score * 0.4 +
            islamic_values_score * 100 * 0.25 +
            local_customs_score * 100 * 0.20 +
            business_etiquette_score * 100 * 0.10 +
            language_cultural_fit * 0.05
        )
        
        # Generate cultural requirements
        cultural_requirements = self._generate_cultural_requirements(
            islamic_values_score, local_customs_score, business_etiquette_score
        )
        
        # Generate improvement suggestions
        improvement_suggestions = self._generate_cultural_improvements(
            islamic_values_score, local_customs_score, business_etiquette_score,
            language_cultural_fit
        )
        
        return CulturalIntelligence(
            cultural_awareness_score=cultural_awareness_score,
            islamic_values_alignment=islamic_values_score * 100,
            local_customs_understanding=local_customs_score * 100,
            business_etiquette_score=business_etiquette_score * 100,
            language_cultural_fit=language_cultural_fit,
            overall_cultural_score=overall_cultural_score,
            cultural_requirements=cultural_requirements,
            improvement_suggestions=improvement_suggestions
        )
    
    def _analyze_emiratization(self, jd_text: str, industry: IndustryType) -> EmiratiPreference:
        """Analyze Emiratization and UAE national preference"""
        
        # Check for Emiratization patterns
        emiratization_mentions = 0
        for pattern in self.emiratization_patterns:
            if re.search(pattern, jd_text, re.IGNORECASE):
                emiratization_mentions += 1
        
        # Industry-specific requirements
        industry_req = self.industry_requirements.get(industry, {})
        
        # Determine compliance level
        if industry_req.get('emiratization_mandatory', False) or emiratization_mentions >= 3:
            compliance_level = "mandatory"
            compliance_score = 95.0
        elif industry_req.get('emiratization_preferred', False) or emiratization_mentions >= 2:
            compliance_level = "preferred"
            compliance_score = 75.0
        elif emiratization_mentions >= 1:
            compliance_level = "beneficial"
            compliance_score = 50.0
        else:
            compliance_level = "not_applicable"
            compliance_score = 25.0
        
        # UAE national preference detection
        uae_national_preference = emiratization_mentions > 0 or industry_req.get('emiratization_preferred', False)
        
        # Sector requirement
        emiratization_sector_requirement = industry_req.get('emiratization_mandatory', False)
        
        # Emiratization compliance score
        emiratization_compliance = min(100.0, compliance_score + (emiratization_mentions * 10))
        
        # Detect incentives
        incentives_patterns = [
            'career development', 'training program', 'leadership development',
            'mentorship', 'growth opportunities', 'fast track', 'talent development'
        ]
        incentives_mentioned = [inc for inc in incentives_patterns if inc in jd_text]
        
        # Quota requirements (if applicable)
        quota_requirements = None
        if compliance_level in ["mandatory", "preferred"]:
            quota_requirements = {
                'sector': industry.value,
                'compliance_level': compliance_level,
                'estimated_quota': self._estimate_emiratization_quota(industry)
            }
        
        return EmiratiPreference(
            emiratization_compliance=emiratization_compliance,
            uae_national_preference=uae_national_preference,
            emiratization_sector_requirement=emiratization_sector_requirement,
            compliance_level=compliance_level,
            quota_requirements=quota_requirements,
            incentives_mentioned=incentives_mentioned,
            compliance_score=compliance_score
        )
    
    def _analyze_local_market_requirements(
        self, jd_text: str, industry: IndustryType, region: UAERegion
    ) -> LocalMarketRequirements:
        """Analyze local UAE market requirements"""
        
        # Visa sponsorship clarity
        visa_patterns = ['visa', 'sponsorship', 'work permit', 'residence visa', 'employment visa']
        visa_mentions = sum(1 for pattern in visa_patterns if pattern in jd_text)
        visa_sponsorship_clarity = min(100.0, visa_mentions * 25.0)
        
        # Salary expectations alignment
        salary_patterns = ['competitive salary', 'attractive package', 'market rate', 'tax free']
        salary_mentions = sum(1 for pattern in salary_patterns if pattern in jd_text)
        salary_expectations_alignment = min(100.0, salary_mentions * 30.0 + 40.0)
        
        # Benefits competitiveness
        benefits_patterns = [
            'health insurance', 'medical', 'annual leave', 'ticket', 'housing',
            'transportation', 'education allowance', 'family benefits'
        ]
        benefits_mentions = sum(1 for pattern in benefits_patterns if pattern in jd_text)
        benefits_competitiveness = min(100.0, benefits_mentions * 15.0 + 30.0)
        
        # Career progression clarity
        career_patterns = [
            'career growth', 'promotion', 'development', 'advancement',
            'leadership', 'progression', 'opportunities'
        ]
        career_mentions = sum(1 for pattern in career_patterns if pattern in jd_text)
        career_progression_clarity = min(100.0, career_mentions * 20.0 + 20.0)
        
        # Work-life balance score
        balance_patterns = [
            'work life balance', 'flexible', 'remote', 'family time',
            'personal time', 'wellness', 'balance'
        ]
        balance_mentions = sum(1 for pattern in balance_patterns if pattern in jd_text)
        work_life_balance_score = min(100.0, balance_mentions * 25.0 + 25.0)
        
        # Overall local market score
        local_market_score = (
            visa_sponsorship_clarity * 0.20 +
            salary_expectations_alignment * 0.25 +
            benefits_competitiveness * 0.25 +
            career_progression_clarity * 0.15 +
            work_life_balance_score * 0.15
        )
        
        # Generate market requirements
        market_requirements = self._generate_market_requirements(
            visa_sponsorship_clarity, salary_expectations_alignment,
            benefits_competitiveness, industry, region
        )
        
        return LocalMarketRequirements(
            visa_sponsorship_clarity=visa_sponsorship_clarity,
            salary_expectations_alignment=salary_expectations_alignment,
            benefits_competitiveness=benefits_competitiveness,
            career_progression_clarity=career_progression_clarity,
            work_life_balance_score=work_life_balance_score,
            local_market_score=local_market_score,
            market_requirements=market_requirements
        )
    
    def _score_cultural_category(self, jd_text: str, category: str) -> float:
        """Score a specific cultural category"""
        keywords = self.cultural_keywords.get(category, [])
        matches = sum(1 for keyword in keywords if keyword in jd_text)
        return min(1.0, matches / max(1, len(keywords) * 0.3))
    
    def _analyze_language_cultural_fit(self, jd_text: str) -> float:
        """Analyze language requirements for cultural fit"""
        score = 50.0  # Base score
        
        # Check Arabic requirements
        for pattern_list in self.language_patterns.values():
            for pattern in pattern_list:
                if re.search(pattern, jd_text, re.IGNORECASE):
                    score += 15.0
                    break
        
        return min(100.0, score)
    
    def _generate_cultural_requirements(
        self, islamic_score: float, customs_score: float, etiquette_score: float
    ) -> List[UAERequirement]:
        """Generate cultural requirements based on scores"""
        requirements = []
        
        if islamic_score > 0.3:
            requirements.append(UAERequirement(
                category="cultural_awareness",
                requirement="Understanding of Islamic values and practices",
                level=CulturalRequirementLevel.PREFERRED,
                description="Awareness of Islamic culture and values in workplace",
                compliance_impact=0.25
            ))
        
        if customs_score > 0.3:
            requirements.append(UAERequirement(
                category="local_customs",
                requirement="Knowledge of UAE local customs and traditions",
                level=CulturalRequirementLevel.BENEFICIAL,
                description="Understanding of Emirati culture and local practices",
                compliance_impact=0.20
            ))
        
        if etiquette_score > 0.3:
            requirements.append(UAERequirement(
                category="business_etiquette",
                requirement="Professional business etiquette in UAE context",
                level=CulturalRequirementLevel.PREFERRED,
                description="Understanding of professional conduct in UAE business environment",
                compliance_impact=0.15
            ))
        
        return requirements
    
    def _generate_cultural_improvements(
        self, islamic_score: float, customs_score: float, 
        etiquette_score: float, language_fit: float
    ) -> List[str]:
        """Generate cultural improvement suggestions"""
        suggestions = []
        
        if islamic_score < 0.3:
            suggestions.append(
                "Consider mentioning respect for Islamic values and practices to improve cultural alignment"
            )
        
        if customs_score < 0.3:
            suggestions.append(
                "Add references to UAE local customs and cultural awareness to attract local talent"
            )
        
        if etiquette_score < 0.3:
            suggestions.append(
                "Include professional business etiquette requirements for better cultural fit"
            )
        
        if language_fit < 60.0:
            suggestions.append(
                "Consider specifying Arabic language skills as preferred or beneficial"
            )
        
        return suggestions
    
    def _estimate_emiratization_quota(self, industry: IndustryType) -> str:
        """Estimate Emiratization quota for industry"""
        quotas = {
            IndustryType.GOVERNMENT: "75-100%",
            IndustryType.BANKING_FINANCE: "4% annually",
            IndustryType.OIL_GAS: "Variable by company",
            IndustryType.HEALTHCARE: "Preferred but not mandatory",
            IndustryType.EDUCATION: "Preferred for leadership roles",
            IndustryType.TECHNOLOGY: "Encouraged but flexible"
        }
        return quotas.get(industry, "No specific quota")
    
    def _generate_market_requirements(
        self, visa_clarity: float, salary_alignment: float, benefits_comp: float,
        industry: IndustryType, region: UAERegion
    ) -> List[UAERequirement]:
        """Generate local market requirements"""
        requirements = []
        
        if visa_clarity < 50.0:
            requirements.append(UAERequirement(
                category="visa_sponsorship",
                requirement="Clear visa sponsorship policy",
                level=CulturalRequirementLevel.ESSENTIAL,
                description="Transparent information about visa and work permit sponsorship",
                compliance_impact=0.30
            ))
        
        if salary_alignment < 60.0:
            requirements.append(UAERequirement(
                category="compensation",
                requirement="Competitive salary package aligned with UAE market",
                level=CulturalRequirementLevel.PREFERRED,
                description="Salary and benefits competitive with local market standards",
                compliance_impact=0.25
            ))
        
        if benefits_comp < 70.0:
            requirements.append(UAERequirement(
                category="benefits",
                requirement="Comprehensive benefits package",
                level=CulturalRequirementLevel.PREFERRED,
                description="Health insurance, annual leave, and other standard UAE benefits",
                compliance_impact=0.20
            ))
        
        return requirements
    
    def _calculate_overall_uae_score(
        self, cultural: CulturalIntelligence, emiratization: EmiratiPreference,
        local_market: LocalMarketRequirements
    ) -> float:
        """Calculate overall UAE alignment score"""
        return (
            cultural.overall_cultural_score * 0.35 +
            emiratization.compliance_score * 0.35 +
            local_market.local_market_score * 0.30
        )
    
    def _analyze_region_suitability(self, jd_text: str) -> Dict[UAERegion, float]:
        """Analyze suitability for different UAE regions"""
        suitability = {}
        
        for region, indicators in self.regional_indicators.items():
            score = 50.0  # Base score
            matches = sum(1 for indicator in indicators if indicator in jd_text)
            score += matches * 15.0
            suitability[region] = min(100.0, score)
        
        return suitability
    
    def _analyze_industry_alignment(self, jd_text: str) -> Dict[IndustryType, float]:
        """Analyze alignment with different industries"""
        alignment = {}
        
        industry_keywords = {
            IndustryType.GOVERNMENT: ['government', 'public', 'ministry', 'federal'],
            IndustryType.BANKING_FINANCE: ['bank', 'finance', 'financial', 'investment'],
            IndustryType.TECHNOLOGY: ['software', 'tech', 'digital', 'it'],
            IndustryType.HEALTHCARE: ['medical', 'health', 'hospital', 'clinic'],
            IndustryType.EDUCATION: ['education', 'school', 'university', 'academic']
        }
        
        for industry, keywords in industry_keywords.items():
            score = 30.0  # Base score
            matches = sum(1 for keyword in keywords if keyword in jd_text)
            score += matches * 20.0
            alignment[industry] = min(100.0, score)
        
        return alignment
    
    def _generate_recommendations(
        self, cultural: CulturalIntelligence, emiratization: EmiratiPreference,
        local_market: LocalMarketRequirements, industry: IndustryType, region: UAERegion
    ) -> List[str]:
        """Generate comprehensive recommendations"""
        recommendations = []
        
        # Cultural recommendations
        if cultural.overall_cultural_score < 60:
            recommendations.append(
                "Enhance cultural awareness elements to better attract UAE talent"
            )
        
        # Emiratization recommendations
        if emiratization.compliance_score < 50 and industry in [
            IndustryType.GOVERNMENT, IndustryType.BANKING_FINANCE
        ]:
            recommendations.append(
                "Add Emiratization statement to comply with sector requirements"
            )
        
        # Market recommendations
        if local_market.local_market_score < 60:
            recommendations.append(
                "Improve local market appeal with competitive benefits and clear career progression"
            )
        
        # Industry-specific recommendations
        if industry == IndustryType.GOVERNMENT:
            recommendations.append(
                "Emphasize public service mission and national development contribution"
            )
        elif industry == IndustryType.BANKING_FINANCE:
            recommendations.append(
                "Highlight Islamic banking knowledge and regulatory compliance requirements"
            )
        
        return recommendations
    
    def _generate_compliance_warnings(
        self, emiratization: EmiratiPreference, industry: IndustryType,
        cultural: CulturalIntelligence
    ) -> List[str]:
        """Generate compliance warnings"""
        warnings = []
        
        # Emiratization warnings
        if industry == IndustryType.GOVERNMENT and emiratization.compliance_score < 80:
            warnings.append(
                "Government sector positions typically require strong Emiratization compliance"
            )
        
        # Cultural warnings
        if cultural.overall_cultural_score < 40:
            warnings.append(
                "Low cultural alignment may impact candidate attraction and retention"
            )
        
        # Industry-specific warnings
        if industry == IndustryType.HEALTHCARE and cultural.islamic_values_alignment < 50:
            warnings.append(
                "Healthcare positions benefit from cultural sensitivity and Islamic values awareness"
            )
        
        return warnings
    
    def _detect_primary_language(self, jd_text: str) -> str:
        """Detect primary language of job description"""
        # Simple language detection based on character patterns
        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', jd_text))
        total_chars = len(jd_text)
        
        if arabic_chars > total_chars * 0.3:
            return "arabic"
        elif arabic_chars > 0:
            return "bilingual"
        else:
            return "english"
    
    def _count_cultural_keywords(self, jd_text: str) -> int:
        """Count total cultural keywords found"""
        total_count = 0
        for category_keywords in self.cultural_keywords.values():
            total_count += sum(1 for keyword in category_keywords if keyword in jd_text)
        return total_count

# Factory function
def get_uae_requirements_processor() -> UAERequirementsProcessor:
    """Get UAE requirements processor instance"""
    return UAERequirementsProcessor()

# Example usage
if __name__ == "__main__":
    processor = get_uae_requirements_processor()
    
    sample_jd = """
    We are seeking a Senior Software Engineer to join our Dubai team.
    The ideal candidate should have experience in UAE market and 
    understanding of local business culture. Arabic language skills 
    are preferred. We offer competitive salary, health insurance,
    and annual leave. UAE nationals are encouraged to apply.
    """
    
    result = processor.process_uae_requirements(
        jd_text=sample_jd,
        industry="technology",
        region="dubai"
    )
    
    print(f"Overall UAE Score: {result.overall_uae_score:.1f}")
    print(f"Cultural Score: {result.cultural_intelligence.overall_cultural_score:.1f}")
    print(f"Emiratization Score: {result.emiratization_analysis.compliance_score:.1f}")
    print(f"Recommendations: {len(result.recommendations)}")

