"""
UAE Compliance Checker for Job Descriptions
Handles Emiratization requirements, regulatory compliance, and cultural alignment
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

class UAEComplianceChecker:
    """UAE-specific compliance checker for job descriptions"""
    
    def __init__(self):
        """Initialize the UAE compliance checker"""
        self.emiratization_patterns = self._load_emiratization_patterns()
        self.regulatory_requirements = self._load_regulatory_requirements()
        self.cultural_indicators = self._load_cultural_indicators()
        self.sector_specific_rules = self._load_sector_specific_rules()
        
    def _load_emiratization_patterns(self) -> Dict[str, List[str]]:
        """Load Emiratization-related patterns and keywords"""
        return {
            'uae_nationals_preferred': [
                'UAE nationals preferred', 'Emiratis preferred', 'UAE citizens preferred',
                'Local talent preferred', 'National talent preferred', 'Emirati candidates',
                'UAE national priority', 'Emiratization initiative', 'National development'
            ],
            'uae_nationals_required': [
                'UAE nationals only', 'Emiratis only', 'UAE citizens only',
                'Must be UAE national', 'Emirati required', 'UAE passport required',
                'Local hire only', 'National candidates only'
            ],
            'emiratization_compliance': [
                'Emiratization compliant', 'Supports UAE Vision 2071', 'National agenda',
                'UAE talent development', 'Local capacity building', 'National workforce',
                'Emiratization strategy', 'UAE workforce development'
            ],
            'cultural_integration': [
                'Cultural integration', 'UAE culture knowledge', 'Local customs',
                'Arabic language advantage', 'GCC experience', 'Middle East experience',
                'Regional expertise', 'Cultural sensitivity'
            ]
        }
    
    def _load_regulatory_requirements(self) -> Dict[str, Dict[str, Any]]:
        """Load UAE regulatory requirements by sector"""
        return {
            'banking_finance': {
                'emiratization_quota': 4.0,  # 4% annual increase
                'required_certifications': ['UAE Central Bank License', 'Financial Services License'],
                'language_requirements': ['Arabic preferred', 'English required'],
                'compliance_notes': 'Banking sector has specific Emiratization targets'
            },
            'government': {
                'emiratization_quota': 100.0,  # Government positions prioritize UAE nationals
                'required_certifications': ['Government clearance', 'Security clearance'],
                'language_requirements': ['Arabic required', 'English required'],
                'compliance_notes': 'Government positions typically require UAE nationality'
            },
            'oil_gas': {
                'emiratization_quota': 2.0,  # 2% annual increase
                'required_certifications': ['Industry safety certifications', 'Technical licenses'],
                'language_requirements': ['English required', 'Arabic preferred'],
                'compliance_notes': 'Oil & Gas sector has strategic Emiratization goals'
            },
            'healthcare': {
                'emiratization_quota': 1.0,  # 1% annual increase
                'required_certifications': ['UAE Health Authority License', 'Professional registration'],
                'language_requirements': ['English required', 'Arabic preferred'],
                'compliance_notes': 'Healthcare requires professional licensing'
            },
            'education': {
                'emiratization_quota': 3.0,  # 3% annual increase
                'required_certifications': ['Teaching license', 'Educational qualifications'],
                'language_requirements': ['Arabic required for Arabic subjects', 'English required'],
                'compliance_notes': 'Education sector emphasizes bilingual capabilities'
            },
            'technology': {
                'emiratization_quota': 2.0,  # 2% annual increase
                'required_certifications': ['Technical certifications', 'Industry standards'],
                'language_requirements': ['English required', 'Arabic preferred'],
                'compliance_notes': 'Technology sector focuses on skill development'
            },
            'private_general': {
                'emiratization_quota': 2.0,  # General private sector target
                'required_certifications': ['Professional licenses as applicable'],
                'language_requirements': ['English required', 'Arabic preferred'],
                'compliance_notes': 'General private sector Emiratization guidelines'
            }
        }
    
    def _load_cultural_indicators(self) -> Dict[str, List[str]]:
        """Load cultural alignment indicators"""
        return {
            'uae_values': [
                'tolerance', 'respect', 'innovation', 'excellence', 'sustainability',
                'heritage', 'tradition', 'modernization', 'diversity', 'inclusion'
            ],
            'work_culture': [
                'collaborative environment', 'team spirit', 'professional development',
                'work-life balance', 'continuous learning', 'career growth',
                'mentorship', 'knowledge sharing', 'innovation culture'
            ],
            'islamic_values': [
                'integrity', 'honesty', 'commitment', 'responsibility', 'accountability',
                'ethical conduct', 'moral values', 'trustworthiness', 'reliability'
            ],
            'regional_awareness': [
                'GCC market knowledge', 'Middle East experience', 'regional expertise',
                'cross-cultural communication', 'international perspective',
                'global mindset', 'cultural sensitivity'
            ]
        }
    
    def _load_sector_specific_rules(self) -> Dict[str, Dict[str, Any]]:
        """Load sector-specific compliance rules"""
        return {
            'government': {
                'nationality_requirement': 'UAE nationals strongly preferred',
                'security_clearance': 'Required for most positions',
                'arabic_proficiency': 'Required',
                'cultural_knowledge': 'Essential'
            },
            'banking': {
                'regulatory_compliance': 'UAE Central Bank regulations',
                'professional_licensing': 'Required for key positions',
                'emiratization_reporting': 'Quarterly reporting required',
                'training_requirements': 'Continuous professional development'
            },
            'healthcare': {
                'professional_licensing': 'UAE Health Authority registration',
                'language_requirements': 'Arabic for patient interaction',
                'cultural_sensitivity': 'Essential for patient care',
                'continuing_education': 'Mandatory professional development'
            },
            'education': {
                'teaching_license': 'UAE teaching license required',
                'curriculum_knowledge': 'UAE curriculum familiarity',
                'bilingual_capability': 'Arabic and English proficiency',
                'cultural_education': 'UAE history and culture knowledge'
            }
        }
    
    def check_compliance(self, jd_text: str, sector: str = 'private_general') -> Dict[str, Any]:
        """
        Perform comprehensive UAE compliance check on job description
        
        Args:
            jd_text: Job description text
            sector: Industry sector (government, banking, healthcare, etc.)
            
        Returns:
            Comprehensive compliance analysis
        """
        try:
            logger.info(f"Starting UAE compliance check for sector: {sector}")
            
            # Emiratization compliance check
            emiratization_analysis = self._check_emiratization_compliance(jd_text)
            
            # Regulatory requirements check
            regulatory_analysis = self._check_regulatory_requirements(jd_text, sector)
            
            # Cultural alignment check
            cultural_analysis = self._check_cultural_alignment(jd_text)
            
            # Language requirements check
            language_analysis = self._check_language_requirements(jd_text)
            
            # Sector-specific compliance
            sector_analysis = self._check_sector_specific_compliance(jd_text, sector)
            
            # Calculate overall compliance score
            overall_score = self._calculate_overall_compliance_score({
                'emiratization': emiratization_analysis,
                'regulatory': regulatory_analysis,
                'cultural': cultural_analysis,
                'language': language_analysis,
                'sector': sector_analysis
            })
            
            # Generate compliance recommendations
            recommendations = self._generate_compliance_recommendations(
                jd_text, sector, {
                    'emiratization': emiratization_analysis,
                    'regulatory': regulatory_analysis,
                    'cultural': cultural_analysis,
                    'language': language_analysis,
                    'sector': sector_analysis
                }
            )
            
            compliance_result = {
                'compliance_id': f"compliance_{int(datetime.now().timestamp())}",
                'timestamp': datetime.now().isoformat(),
                'sector': sector,
                'overall_compliance_score': overall_score,
                'compliance_grade': self._get_compliance_grade(overall_score),
                
                # Detailed analysis
                'emiratization_analysis': emiratization_analysis,
                'regulatory_analysis': regulatory_analysis,
                'cultural_analysis': cultural_analysis,
                'language_analysis': language_analysis,
                'sector_analysis': sector_analysis,
                
                # Recommendations and actions
                'recommendations': recommendations,
                'compliance_status': self._get_compliance_status(overall_score),
                'risk_level': self._assess_risk_level(overall_score, sector),
                
                # UAE-specific metrics
                'uae_readiness_score': self._calculate_uae_readiness_score({
                    'cultural': cultural_analysis,
                    'language': language_analysis,
                    'emiratization': emiratization_analysis
                })
            }
            
            logger.info(f"UAE compliance check completed. Overall score: {overall_score}")
            return compliance_result
            
        except Exception as e:
            logger.error(f"Error in UAE compliance check: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'compliance_status': 'error'
            }
    
    def _check_emiratization_compliance(self, jd_text: str) -> Dict[str, Any]:
        """Check Emiratization compliance indicators"""
        
        emiratization_score = 0
        found_patterns = {}
        
        for category, patterns in self.emiratization_patterns.items():
            found_in_category = []
            for pattern in patterns:
                if re.search(r'\b' + re.escape(pattern.lower()) + r'\b', jd_text.lower()):
                    found_in_category.append(pattern)
                    emiratization_score += self._get_pattern_weight(category)
            
            if found_in_category:
                found_patterns[category] = found_in_category
        
        # Check for explicit UAE national requirements
        uae_national_explicit = bool(re.search(
            r'\b(?:uae national|emirati|uae citizen).*(?:required|mandatory|only|must)\b',
            jd_text.lower()
        ))
        
        # Check for UAE national preference
        uae_national_preferred = bool(re.search(
            r'\b(?:uae national|emirati|uae citizen).*(?:preferred|advantage|plus)\b',
            jd_text.lower()
        ))
        
        return {
            'emiratization_score': min(emiratization_score, 100),
            'found_patterns': found_patterns,
            'uae_national_explicit': uae_national_explicit,
            'uae_national_preferred': uae_national_preferred,
            'emiratization_level': self._determine_emiratization_level(
                uae_national_explicit, uae_national_preferred, emiratization_score
            ),
            'compliance_indicators': len(found_patterns)
        }
    
    def _check_regulatory_requirements(self, jd_text: str, sector: str) -> Dict[str, Any]:
        """Check sector-specific regulatory requirements"""
        
        sector_rules = self.regulatory_requirements.get(sector, self.regulatory_requirements['private_general'])
        regulatory_score = 0
        compliance_items = {}
        
        # Check for required certifications
        cert_mentions = 0
        for cert in sector_rules['required_certifications']:
            if re.search(r'\b' + re.escape(cert.lower()) + r'\b', jd_text.lower()):
                cert_mentions += 1
                regulatory_score += 20
        
        compliance_items['certifications'] = {
            'required': sector_rules['required_certifications'],
            'mentioned': cert_mentions,
            'score': min(cert_mentions * 20, 40)
        }
        
        # Check language requirements
        lang_score = 0
        for lang_req in sector_rules['language_requirements']:
            if re.search(r'\b' + re.escape(lang_req.lower()) + r'\b', jd_text.lower()):
                lang_score += 15
                regulatory_score += 15
        
        compliance_items['language_requirements'] = {
            'required': sector_rules['language_requirements'],
            'score': min(lang_score, 30)
        }
        
        # Check for emiratization quota awareness
        quota_awareness = bool(re.search(
            r'\b(?:emiratization|national.*development|local.*talent|uae.*workforce)\b',
            jd_text.lower()
        ))
        
        if quota_awareness:
            regulatory_score += 30
        
        compliance_items['emiratization_quota'] = {
            'target_percentage': sector_rules['emiratization_quota'],
            'awareness_mentioned': quota_awareness,
            'score': 30 if quota_awareness else 0
        }
        
        return {
            'regulatory_score': min(regulatory_score, 100),
            'sector': sector,
            'compliance_items': compliance_items,
            'sector_requirements': sector_rules,
            'regulatory_gaps': self._identify_regulatory_gaps(compliance_items, sector_rules)
        }
    
    def _check_cultural_alignment(self, jd_text: str) -> Dict[str, Any]:
        """Check cultural alignment with UAE values"""
        
        cultural_score = 0
        found_indicators = {}
        
        for category, indicators in self.cultural_indicators.items():
            found_in_category = []
            for indicator in indicators:
                if re.search(r'\b' + re.escape(indicator.lower()) + r'\b', jd_text.lower()):
                    found_in_category.append(indicator)
                    cultural_score += 5
            
            if found_in_category:
                found_indicators[category] = found_in_category
        
        # Check for diversity and inclusion mentions
        diversity_score = 0
        diversity_keywords = ['diversity', 'inclusion', 'equal opportunity', 'multicultural']
        for keyword in diversity_keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', jd_text.lower()):
                diversity_score += 10
                cultural_score += 10
        
        # Check for UAE Vision 2071 or similar strategic mentions
        vision_alignment = bool(re.search(
            r'\b(?:uae vision|vision 2071|national agenda|strategic plan)\b',
            jd_text.lower()
        ))
        
        if vision_alignment:
            cultural_score += 20
        
        return {
            'cultural_score': min(cultural_score, 100),
            'found_indicators': found_indicators,
            'diversity_score': min(diversity_score, 40),
            'vision_alignment': vision_alignment,
            'cultural_categories_covered': len(found_indicators),
            'cultural_depth': self._assess_cultural_depth(found_indicators)
        }
    
    def _check_language_requirements(self, jd_text: str) -> Dict[str, Any]:
        """Check language requirements and bilingual capabilities"""
        
        language_analysis = {
            'arabic': {'mentioned': False, 'requirement_level': 'not_specified'},
            'english': {'mentioned': False, 'requirement_level': 'not_specified'},
            'bilingual': {'mentioned': False, 'emphasized': False}
        }
        
        # Check Arabic requirements
        arabic_patterns = [
            (r'\barabic.*(?:required|mandatory|essential|must)\b', 'required'),
            (r'\barabic.*(?:preferred|advantage|plus|beneficial)\b', 'preferred'),
            (r'\bnative.*arabic\b', 'native'),
            (r'\bfluent.*arabic\b', 'fluent')
        ]
        
        for pattern, level in arabic_patterns:
            if re.search(pattern, jd_text.lower()):
                language_analysis['arabic']['mentioned'] = True
                language_analysis['arabic']['requirement_level'] = level
                break
        
        # Check English requirements
        english_patterns = [
            (r'\benglish.*(?:required|mandatory|essential|must)\b', 'required'),
            (r'\benglish.*(?:preferred|advantage|plus|beneficial)\b', 'preferred'),
            (r'\bnative.*english\b', 'native'),
            (r'\bfluent.*english\b', 'fluent')
        ]
        
        for pattern, level in english_patterns:
            if re.search(pattern, jd_text.lower()):
                language_analysis['english']['mentioned'] = True
                language_analysis['english']['requirement_level'] = level
                break
        
        # Check bilingual emphasis
        bilingual_patterns = [
            r'\bbilingual\b', r'\bmultilingual\b', r'\btwo.*language\b',
            r'\barabic.*english\b', r'\benglish.*arabic\b'
        ]
        
        for pattern in bilingual_patterns:
            if re.search(pattern, jd_text.lower()):
                language_analysis['bilingual']['mentioned'] = True
                language_analysis['bilingual']['emphasized'] = True
                break
        
        # Calculate language compliance score
        language_score = 0
        if language_analysis['arabic']['mentioned']:
            language_score += 30
        if language_analysis['english']['mentioned']:
            language_score += 20
        if language_analysis['bilingual']['mentioned']:
            language_score += 25
        
        return {
            'language_score': min(language_score, 100),
            'language_analysis': language_analysis,
            'bilingual_emphasis': language_analysis['bilingual']['emphasized'],
            'language_inclusivity': self._assess_language_inclusivity(language_analysis)
        }
    
    def _check_sector_specific_compliance(self, jd_text: str, sector: str) -> Dict[str, Any]:
        """Check sector-specific compliance requirements"""
        
        sector_rules = self.sector_specific_rules.get(sector, {})
        if not sector_rules:
            return {'sector_score': 0, 'sector_compliance': 'not_applicable'}
        
        sector_score = 0
        compliance_items = {}
        
        for rule_category, rule_description in sector_rules.items():
            # Create search patterns based on rule descriptions
            rule_keywords = self._extract_keywords_from_rule(rule_description)
            found_keywords = []
            
            for keyword in rule_keywords:
                if re.search(r'\b' + re.escape(keyword.lower()) + r'\b', jd_text.lower()):
                    found_keywords.append(keyword)
                    sector_score += 15
            
            compliance_items[rule_category] = {
                'rule': rule_description,
                'keywords_found': found_keywords,
                'compliance_level': 'high' if found_keywords else 'low'
            }
        
        return {
            'sector_score': min(sector_score, 100),
            'sector': sector,
            'compliance_items': compliance_items,
            'sector_compliance': self._determine_sector_compliance_level(sector_score)
        }
    
    # Helper methods for scoring and analysis
    def _get_pattern_weight(self, category: str) -> int:
        """Get weight for different emiratization pattern categories"""
        weights = {
            'uae_nationals_required': 30,
            'uae_nationals_preferred': 20,
            'emiratization_compliance': 25,
            'cultural_integration': 15
        }
        return weights.get(category, 10)
    
    def _determine_emiratization_level(self, explicit: bool, preferred: bool, score: int) -> str:
        """Determine emiratization compliance level"""
        if explicit:
            return 'explicit_requirement'
        elif preferred:
            return 'preferred_candidate'
        elif score > 50:
            return 'emiratization_aligned'
        elif score > 20:
            return 'partially_aligned'
        else:
            return 'not_specified'
    
    def _identify_regulatory_gaps(self, compliance_items: Dict, sector_rules: Dict) -> List[str]:
        """Identify gaps in regulatory compliance"""
        gaps = []
        
        if compliance_items['certifications']['mentioned'] == 0:
            gaps.append('No required certifications mentioned')
        
        if compliance_items['language_requirements']['score'] < 15:
            gaps.append('Language requirements not clearly specified')
        
        if not compliance_items['emiratization_quota']['awareness_mentioned']:
            gaps.append('No awareness of Emiratization requirements')
        
        return gaps
    
    def _assess_cultural_depth(self, found_indicators: Dict) -> str:
        """Assess depth of cultural alignment"""
        total_categories = len(self.cultural_indicators)
        covered_categories = len(found_indicators)
        
        coverage_ratio = covered_categories / total_categories
        
        if coverage_ratio >= 0.75:
            return 'comprehensive'
        elif coverage_ratio >= 0.5:
            return 'good'
        elif coverage_ratio >= 0.25:
            return 'basic'
        else:
            return 'minimal'
    
    def _assess_language_inclusivity(self, language_analysis: Dict) -> str:
        """Assess language inclusivity level"""
        arabic_mentioned = language_analysis['arabic']['mentioned']
        english_mentioned = language_analysis['english']['mentioned']
        bilingual_emphasized = language_analysis['bilingual']['emphasized']
        
        if bilingual_emphasized and arabic_mentioned and english_mentioned:
            return 'highly_inclusive'
        elif arabic_mentioned and english_mentioned:
            return 'inclusive'
        elif arabic_mentioned or english_mentioned:
            return 'partially_inclusive'
        else:
            return 'not_specified'
    
    def _extract_keywords_from_rule(self, rule_description: str) -> List[str]:
        """Extract searchable keywords from rule descriptions"""
        # Simple keyword extraction - can be enhanced with NLP
        keywords = []
        
        # Common patterns to extract
        if 'license' in rule_description.lower():
            keywords.extend(['license', 'licensed', 'certification'])
        if 'clearance' in rule_description.lower():
            keywords.extend(['clearance', 'security', 'background check'])
        if 'arabic' in rule_description.lower():
            keywords.extend(['arabic', 'bilingual', 'language'])
        if 'registration' in rule_description.lower():
            keywords.extend(['registration', 'registered', 'professional'])
        
        return keywords
    
    def _determine_sector_compliance_level(self, score: int) -> str:
        """Determine sector-specific compliance level"""
        if score >= 80:
            return 'fully_compliant'
        elif score >= 60:
            return 'mostly_compliant'
        elif score >= 40:
            return 'partially_compliant'
        else:
            return 'non_compliant'
    
    def _calculate_overall_compliance_score(self, analyses: Dict) -> float:
        """Calculate overall compliance score from all analyses"""
        weights = {
            'emiratization': 0.3,
            'regulatory': 0.25,
            'cultural': 0.2,
            'language': 0.15,
            'sector': 0.1
        }
        
        total_score = 0
        for category, analysis in analyses.items():
            score_key = f"{category}_score"
            if score_key in analysis:
                total_score += analysis[score_key] * weights.get(category, 0.1)
        
        return round(total_score, 2)
    
    def _get_compliance_grade(self, score: float) -> str:
        """Convert compliance score to letter grade"""
        if score >= 90:
            return 'A+'
        elif score >= 85:
            return 'A'
        elif score >= 80:
            return 'B+'
        elif score >= 75:
            return 'B'
        elif score >= 70:
            return 'C+'
        elif score >= 65:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'
    
    def _get_compliance_status(self, score: float) -> str:
        """Get compliance status based on score"""
        if score >= 80:
            return 'compliant'
        elif score >= 60:
            return 'partially_compliant'
        else:
            return 'non_compliant'
    
    def _assess_risk_level(self, score: float, sector: str) -> str:
        """Assess compliance risk level"""
        # Government and banking sectors have higher compliance requirements
        high_risk_sectors = ['government', 'banking_finance']
        
        if sector in high_risk_sectors:
            if score < 70:
                return 'high_risk'
            elif score < 85:
                return 'medium_risk'
            else:
                return 'low_risk'
        else:
            if score < 60:
                return 'high_risk'
            elif score < 75:
                return 'medium_risk'
            else:
                return 'low_risk'
    
    def _calculate_uae_readiness_score(self, analyses: Dict) -> float:
        """Calculate UAE readiness score for international candidates"""
        cultural_score = analyses.get('cultural', {}).get('cultural_score', 0)
        language_score = analyses.get('language', {}).get('language_score', 0)
        emiratization_score = analyses.get('emiratization', {}).get('emiratization_score', 0)
        
        # Weighted average for UAE readiness
        uae_readiness = (cultural_score * 0.4 + language_score * 0.4 + emiratization_score * 0.2)
        return round(uae_readiness, 2)
    
    def _generate_compliance_recommendations(self, jd_text: str, sector: str, analyses: Dict) -> List[Dict[str, Any]]:
        """Generate actionable compliance recommendations"""
        recommendations = []
        
        # Emiratization recommendations
        emiratization_analysis = analyses.get('emiratization', {})
        if emiratization_analysis.get('emiratization_score', 0) < 50:
            recommendations.append({
                'category': 'emiratization',
                'priority': 'high',
                'title': 'Add Emiratization Statement',
                'description': 'Include a statement about UAE national preference or Emiratization support.',
                'suggested_text': 'UAE nationals are encouraged to apply as part of our commitment to Emiratization and national talent development.',
                'impact': 'Ensures compliance with UAE employment regulations and demonstrates commitment to national development.'
            })
        
        # Language recommendations
        language_analysis = analyses.get('language', {})
        if language_analysis.get('language_score', 0) < 40:
            recommendations.append({
                'category': 'language',
                'priority': 'medium',
                'title': 'Clarify Language Requirements',
                'description': 'Specify Arabic and English language requirements clearly.',
                'suggested_text': 'Proficiency in English is required. Arabic language skills are preferred and will be considered an advantage.',
                'impact': 'Attracts bilingual candidates and ensures clear communication expectations.'
            })
        
        # Cultural recommendations
        cultural_analysis = analyses.get('cultural', {})
        if cultural_analysis.get('cultural_score', 0) < 30:
            recommendations.append({
                'category': 'cultural',
                'priority': 'medium',
                'title': 'Enhance Cultural Alignment',
                'description': 'Include references to UAE values and work culture.',
                'suggested_text': 'We value diversity, innovation, and excellence in line with UAE Vision 2071. Join our inclusive team that celebrates cultural diversity while respecting local traditions.',
                'impact': 'Demonstrates cultural awareness and attracts candidates who align with UAE values.'
            })
        
        # Regulatory recommendations
        regulatory_analysis = analyses.get('regulatory', {})
        if regulatory_analysis.get('regulatory_score', 0) < 60:
            sector_rules = self.regulatory_requirements.get(sector, {})
            if sector_rules.get('required_certifications'):
                recommendations.append({
                    'category': 'regulatory',
                    'priority': 'high',
                    'title': 'Add Required Certifications',
                    'description': f'Include sector-specific certifications: {", ".join(sector_rules["required_certifications"])}',
                    'suggested_text': f'Required certifications: {", ".join(sector_rules["required_certifications"])}',
                    'impact': 'Ensures regulatory compliance and attracts qualified candidates.'
                })
        
        return recommendations

