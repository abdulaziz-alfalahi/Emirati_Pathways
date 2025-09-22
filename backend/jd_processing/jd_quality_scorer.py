"""
JD Quality Scorer for Job Description Quality Assessment
Provides comprehensive quality scoring, analysis, and improvement recommendations
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import statistics
from collections import Counter

logger = logging.getLogger(__name__)

class JDQualityScorer:
    """Quality scorer for job descriptions with comprehensive assessment"""
    
    def __init__(self):
        """Initialize the JD quality scorer"""
        self.quality_criteria = self._load_quality_criteria()
        self.scoring_weights = self._load_scoring_weights()
        self.improvement_templates = self._load_improvement_templates()
        self.industry_standards = self._load_industry_standards()
        
    def _load_quality_criteria(self) -> Dict[str, Dict[str, Any]]:
        """Load quality assessment criteria"""
        return {
            'structure': {
                'job_title': {'weight': 15, 'required': True},
                'company_info': {'weight': 10, 'required': True},
                'job_summary': {'weight': 15, 'required': True},
                'responsibilities': {'weight': 20, 'required': True},
                'requirements': {'weight': 20, 'required': True},
                'benefits': {'weight': 10, 'required': False},
                'application_process': {'weight': 10, 'required': False}
            },
            'content_quality': {
                'clarity': {'weight': 30, 'metrics': ['readability', 'sentence_length', 'jargon_usage']},
                'completeness': {'weight': 25, 'metrics': ['section_coverage', 'detail_level']},
                'accuracy': {'weight': 25, 'metrics': ['spelling', 'grammar', 'consistency']},
                'engagement': {'weight': 20, 'metrics': ['tone', 'appeal', 'motivation']}
            },
            'technical_aspects': {
                'skills_specification': {'weight': 25, 'required': True},
                'experience_clarity': {'weight': 20, 'required': True},
                'education_requirements': {'weight': 15, 'required': True},
                'technical_depth': {'weight': 20, 'required': False},
                'growth_opportunities': {'weight': 20, 'required': False}
            },
            'uae_alignment': {
                'cultural_sensitivity': {'weight': 25, 'required': True},
                'language_requirements': {'weight': 20, 'required': True},
                'emiratization_awareness': {'weight': 25, 'required': True},
                'local_context': {'weight': 15, 'required': False},
                'visa_information': {'weight': 15, 'required': False}
            }
        }
    
    def _load_scoring_weights(self) -> Dict[str, float]:
        """Load weights for different quality categories"""
        return {
            'structure': 0.25,
            'content_quality': 0.30,
            'technical_aspects': 0.25,
            'uae_alignment': 0.20
        }
    
    def _load_improvement_templates(self) -> Dict[str, Dict[str, str]]:
        """Load improvement suggestion templates"""
        return {
            'structure': {
                'missing_job_title': 'Add a clear, specific job title that accurately reflects the role.',
                'missing_company_info': 'Include company background, mission, and culture information.',
                'missing_job_summary': 'Add a compelling job summary that highlights key aspects of the role.',
                'missing_responsibilities': 'Provide detailed list of key responsibilities and duties.',
                'missing_requirements': 'Specify required qualifications, skills, and experience.',
                'missing_benefits': 'Include compensation, benefits, and growth opportunities.',
                'missing_application_process': 'Provide clear application instructions and contact information.'
            },
            'content_quality': {
                'poor_clarity': 'Simplify complex sentences and reduce technical jargon for better readability.',
                'incomplete_content': 'Add more detailed information in key sections to provide complete picture.',
                'accuracy_issues': 'Review for spelling, grammar, and consistency errors.',
                'low_engagement': 'Use more engaging language and highlight exciting aspects of the role.'
            },
            'technical_aspects': {
                'vague_skills': 'Specify exact technical skills, tools, and technologies required.',
                'unclear_experience': 'Clarify years of experience needed and specific industry background.',
                'missing_education': 'Specify educational requirements and preferred qualifications.',
                'shallow_technical_depth': 'Add more technical details about the role and responsibilities.',
                'no_growth_opportunities': 'Mention career development, training, and advancement opportunities.'
            },
            'uae_alignment': {
                'cultural_insensitivity': 'Add references to UAE culture, values, and work environment.',
                'missing_language_requirements': 'Specify Arabic and English language requirements clearly.',
                'no_emiratization_awareness': 'Include statement about UAE national preference or Emiratization support.',
                'lack_local_context': 'Add information about UAE market, industry, or regional aspects.',
                'missing_visa_info': 'Clarify visa sponsorship availability and requirements.'
            }
        }
    
    def _load_industry_standards(self) -> Dict[str, Dict[str, Any]]:
        """Load industry-specific quality standards"""
        return {
            'technology': {
                'min_technical_skills': 5,
                'required_sections': ['responsibilities', 'requirements', 'technical_skills'],
                'preferred_length': {'min': 300, 'max': 800},
                'technical_depth_required': True
            },
            'banking_finance': {
                'min_technical_skills': 3,
                'required_sections': ['responsibilities', 'requirements', 'compliance'],
                'preferred_length': {'min': 400, 'max': 900},
                'regulatory_mentions_required': True
            },
            'healthcare': {
                'min_technical_skills': 4,
                'required_sections': ['responsibilities', 'requirements', 'certifications'],
                'preferred_length': {'min': 350, 'max': 850},
                'certification_requirements': True
            },
            'government': {
                'min_technical_skills': 2,
                'required_sections': ['responsibilities', 'requirements', 'eligibility'],
                'preferred_length': {'min': 400, 'max': 1000},
                'emiratization_required': True
            },
            'general': {
                'min_technical_skills': 3,
                'required_sections': ['responsibilities', 'requirements'],
                'preferred_length': {'min': 300, 'max': 800},
                'basic_requirements': True
            }
        }
    
    def assess_quality(self, jd_text: str, jd_data: Dict[str, Any], 
                      sector: str = 'general') -> Dict[str, Any]:
        """
        Perform comprehensive quality assessment of job description
        
        Args:
            jd_text: Raw job description text
            jd_data: Parsed job description data
            sector: Industry sector for context-specific assessment
            
        Returns:
            Comprehensive quality assessment results
        """
        try:
            logger.info(f"Starting quality assessment for sector: {sector}")
            
            # Assess structure quality
            structure_assessment = self._assess_structure_quality(jd_text, jd_data)
            
            # Assess content quality
            content_assessment = self._assess_content_quality(jd_text, jd_data)
            
            # Assess technical aspects
            technical_assessment = self._assess_technical_aspects(jd_text, jd_data)
            
            # Assess UAE alignment
            uae_assessment = self._assess_uae_alignment(jd_text, jd_data)
            
            # Calculate overall quality score
            overall_score = self._calculate_overall_quality_score({
                'structure': structure_assessment,
                'content_quality': content_assessment,
                'technical_aspects': technical_assessment,
                'uae_alignment': uae_assessment
            })
            
            # Generate improvement recommendations
            recommendations = self._generate_quality_recommendations(
                jd_text, jd_data, sector, {
                    'structure': structure_assessment,
                    'content_quality': content_assessment,
                    'technical_aspects': technical_assessment,
                    'uae_alignment': uae_assessment
                }
            )
            
            # Industry-specific assessment
            industry_assessment = self._assess_industry_standards(jd_text, jd_data, sector)
            
            quality_result = {
                'quality_id': f"quality_{int(datetime.now().timestamp())}",
                'timestamp': datetime.now().isoformat(),
                'sector': sector,
                'overall_quality_score': overall_score,
                'quality_grade': self._get_quality_grade(overall_score),
                
                # Detailed assessments
                'structure_assessment': structure_assessment,
                'content_assessment': content_assessment,
                'technical_assessment': technical_assessment,
                'uae_assessment': uae_assessment,
                'industry_assessment': industry_assessment,
                
                # Recommendations and insights
                'recommendations': recommendations,
                'quality_status': self._get_quality_status(overall_score),
                'improvement_priority': self._determine_improvement_priority(overall_score, recommendations),
                
                # Competitive analysis
                'market_competitiveness': self._assess_market_competitiveness(overall_score, sector),
                'candidate_appeal_score': self._calculate_candidate_appeal_score({
                    'content_quality': content_assessment,
                    'technical_aspects': technical_assessment,
                    'uae_alignment': uae_assessment
                })
            }
            
            logger.info(f"Quality assessment completed. Overall score: {overall_score}")
            return quality_result
            
        except Exception as e:
            logger.error(f"Error in quality assessment: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'quality_status': 'error'
            }
    
    def _assess_structure_quality(self, jd_text: str, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess structural quality of the job description"""
        
        structure_criteria = self.quality_criteria['structure']
        structure_score = 0
        section_scores = {}
        missing_sections = []
        
        # Check for required sections
        basic_info = jd_data.get('basic_info', {})
        
        # Job title assessment
        job_title = basic_info.get('job_title', '')
        if job_title and len(job_title.strip()) > 5:
            title_score = min(100, len(job_title.strip()) * 2)  # Reward descriptive titles
            section_scores['job_title'] = title_score
            structure_score += title_score * structure_criteria['job_title']['weight'] / 100
        else:
            missing_sections.append('job_title')
        
        # Company info assessment
        company = basic_info.get('company', '')
        if company and len(company.strip()) > 2:
            company_score = 80 if len(company.strip()) > 10 else 60
            section_scores['company_info'] = company_score
            structure_score += company_score * structure_criteria['company_info']['weight'] / 100
        else:
            missing_sections.append('company_info')
        
        # Job summary assessment
        summary = jd_data.get('job_summary', '')
        if summary and len(summary.strip()) > 50:
            summary_score = min(100, len(summary.strip()) / 2)  # Reward comprehensive summaries
            section_scores['job_summary'] = summary_score
            structure_score += summary_score * structure_criteria['job_summary']['weight'] / 100
        else:
            missing_sections.append('job_summary')
        
        # Responsibilities assessment
        responsibilities = jd_data.get('responsibilities', [])
        if responsibilities and len(responsibilities) >= 3:
            resp_score = min(100, len(responsibilities) * 15)  # Reward detailed responsibilities
            section_scores['responsibilities'] = resp_score
            structure_score += resp_score * structure_criteria['responsibilities']['weight'] / 100
        else:
            missing_sections.append('responsibilities')
        
        # Requirements assessment
        requirements = jd_data.get('requirements', {})
        if requirements and (requirements.get('education') or requirements.get('experience')):
            req_score = 80
            if requirements.get('skills'):
                req_score = 100
            section_scores['requirements'] = req_score
            structure_score += req_score * structure_criteria['requirements']['weight'] / 100
        else:
            missing_sections.append('requirements')
        
        # Benefits assessment (optional)
        benefits = jd_data.get('benefits', [])
        if benefits:
            benefits_score = min(100, len(benefits) * 20)
            section_scores['benefits'] = benefits_score
            structure_score += benefits_score * structure_criteria['benefits']['weight'] / 100
        
        # Application process assessment (optional)
        application_info = jd_data.get('application_info', {})
        if application_info:
            app_score = 80
            section_scores['application_process'] = app_score
            structure_score += app_score * structure_criteria['application_process']['weight'] / 100
        
        return {
            'structure_score': round(structure_score, 2),
            'section_scores': section_scores,
            'missing_sections': missing_sections,
            'structure_completeness': len(section_scores) / len(structure_criteria) * 100,
            'critical_sections_present': len([s for s in structure_criteria.keys() 
                                            if structure_criteria[s]['required'] and s in section_scores])
        }
    
    def _assess_content_quality(self, jd_text: str, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess content quality including clarity, completeness, and engagement"""
        
        content_score = 0
        quality_metrics = {}
        
        # Clarity assessment
        clarity_score = self._assess_clarity(jd_text)
        quality_metrics['clarity'] = clarity_score
        content_score += clarity_score * 0.30
        
        # Completeness assessment
        completeness_score = self._assess_completeness(jd_text, jd_data)
        quality_metrics['completeness'] = completeness_score
        content_score += completeness_score * 0.25
        
        # Accuracy assessment
        accuracy_score = self._assess_accuracy(jd_text)
        quality_metrics['accuracy'] = accuracy_score
        content_score += accuracy_score * 0.25
        
        # Engagement assessment
        engagement_score = self._assess_engagement(jd_text)
        quality_metrics['engagement'] = engagement_score
        content_score += engagement_score * 0.20
        
        return {
            'content_score': round(content_score, 2),
            'quality_metrics': quality_metrics,
            'readability_level': self._calculate_readability_level(jd_text),
            'content_length': len(jd_text),
            'optimal_length_range': {'min': 300, 'max': 800},
            'length_assessment': self._assess_content_length(jd_text)
        }
    
    def _assess_technical_aspects(self, jd_text: str, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess technical aspects of the job description"""
        
        technical_score = 0
        technical_metrics = {}
        
        # Skills specification assessment
        skills = jd_data.get('skills_analysis', {}).get('technical_skills', [])
        skills_score = min(100, len(skills) * 10) if skills else 0
        technical_metrics['skills_specification'] = skills_score
        technical_score += skills_score * 0.25
        
        # Experience clarity assessment
        experience = jd_data.get('requirements', {}).get('experience', '')
        exp_score = 80 if experience and len(experience) > 20 else 40 if experience else 0
        technical_metrics['experience_clarity'] = exp_score
        technical_score += exp_score * 0.20
        
        # Education requirements assessment
        education = jd_data.get('requirements', {}).get('education', '')
        edu_score = 80 if education and len(education) > 10 else 40 if education else 0
        technical_metrics['education_requirements'] = edu_score
        technical_score += edu_score * 0.15
        
        # Technical depth assessment
        technical_depth = self._assess_technical_depth(jd_text, jd_data)
        technical_metrics['technical_depth'] = technical_depth
        technical_score += technical_depth * 0.20
        
        # Growth opportunities assessment
        growth_score = self._assess_growth_opportunities(jd_text)
        technical_metrics['growth_opportunities'] = growth_score
        technical_score += growth_score * 0.20
        
        return {
            'technical_score': round(technical_score, 2),
            'technical_metrics': technical_metrics,
            'skills_count': len(skills),
            'technical_complexity': self._calculate_technical_complexity(jd_data),
            'role_seniority': self._determine_role_seniority(jd_text, jd_data)
        }
    
    def _assess_uae_alignment(self, jd_text: str, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess UAE-specific alignment and cultural sensitivity"""
        
        uae_score = 0
        uae_metrics = {}
        
        # Cultural sensitivity assessment
        cultural_score = self._assess_cultural_sensitivity(jd_text)
        uae_metrics['cultural_sensitivity'] = cultural_score
        uae_score += cultural_score * 0.25
        
        # Language requirements assessment
        language_score = self._assess_language_requirements(jd_text)
        uae_metrics['language_requirements'] = language_score
        uae_score += language_score * 0.20
        
        # Emiratization awareness assessment
        emiratization_score = self._assess_emiratization_awareness(jd_text)
        uae_metrics['emiratization_awareness'] = emiratization_score
        uae_score += emiratization_score * 0.25
        
        # Local context assessment
        local_context_score = self._assess_local_context(jd_text)
        uae_metrics['local_context'] = local_context_score
        uae_score += local_context_score * 0.15
        
        # Visa information assessment
        visa_score = self._assess_visa_information(jd_text)
        uae_metrics['visa_information'] = visa_score
        uae_score += visa_score * 0.15
        
        return {
            'uae_score': round(uae_score, 2),
            'uae_metrics': uae_metrics,
            'cultural_alignment_level': self._get_cultural_alignment_level(cultural_score),
            'emiratization_compliance': emiratization_score > 60,
            'international_candidate_friendly': visa_score > 50
        }
    
    def _assess_industry_standards(self, jd_text: str, jd_data: Dict[str, Any], 
                                 sector: str) -> Dict[str, Any]:
        """Assess against industry-specific standards"""
        
        standards = self.industry_standards.get(sector, self.industry_standards['general'])
        industry_score = 0
        compliance_items = {}
        
        # Check minimum technical skills
        skills_count = len(jd_data.get('skills_analysis', {}).get('technical_skills', []))
        min_skills = standards['min_technical_skills']
        skills_compliance = skills_count >= min_skills
        compliance_items['technical_skills'] = {
            'required': min_skills,
            'actual': skills_count,
            'compliant': skills_compliance
        }
        if skills_compliance:
            industry_score += 25
        
        # Check required sections
        required_sections = standards['required_sections']
        sections_present = 0
        for section in required_sections:
            if self._check_section_presence(jd_text, jd_data, section):
                sections_present += 1
        
        sections_compliance = sections_present == len(required_sections)
        compliance_items['required_sections'] = {
            'required': required_sections,
            'present': sections_present,
            'compliant': sections_compliance
        }
        if sections_compliance:
            industry_score += 30
        
        # Check content length
        content_length = len(jd_text)
        length_range = standards['preferred_length']
        length_compliance = length_range['min'] <= content_length <= length_range['max']
        compliance_items['content_length'] = {
            'range': length_range,
            'actual': content_length,
            'compliant': length_compliance
        }
        if length_compliance:
            industry_score += 20
        
        # Check sector-specific requirements
        sector_specific_score = self._check_sector_specific_requirements(jd_text, jd_data, sector, standards)
        industry_score += sector_specific_score
        
        return {
            'industry_score': round(industry_score, 2),
            'sector': sector,
            'compliance_items': compliance_items,
            'industry_compliance_level': self._get_industry_compliance_level(industry_score),
            'sector_specific_score': sector_specific_score
        }
    
    # Helper methods for detailed assessments
    def _assess_clarity(self, jd_text: str) -> float:
        """Assess clarity of the job description"""
        
        clarity_score = 80  # Base score
        
        # Check sentence length
        sentences = re.split(r'[.!?]+', jd_text)
        avg_sentence_length = statistics.mean([len(s.split()) for s in sentences if s.strip()])
        
        if avg_sentence_length > 25:
            clarity_score -= 15  # Penalize very long sentences
        elif avg_sentence_length < 8:
            clarity_score -= 10  # Penalize very short sentences
        
        # Check for jargon and complex terms
        jargon_count = len(re.findall(r'\b(?:synergize|leverage|paradigm|utilize|optimize)\b', jd_text.lower()))
        clarity_score -= min(jargon_count * 5, 20)
        
        # Check for clear structure indicators
        structure_indicators = len(re.findall(r'\b(?:responsibilities|requirements|qualifications|benefits)\b', jd_text.lower()))
        clarity_score += min(structure_indicators * 5, 20)
        
        return max(0, min(100, clarity_score))
    
    def _assess_completeness(self, jd_text: str, jd_data: Dict[str, Any]) -> float:
        """Assess completeness of the job description"""
        
        completeness_score = 0
        
        # Check for key information presence
        key_elements = [
            'job_title', 'responsibilities', 'requirements', 'company', 'location'
        ]
        
        for element in key_elements:
            if self._check_element_presence(jd_data, element):
                completeness_score += 20
        
        return min(100, completeness_score)
    
    def _assess_accuracy(self, jd_text: str) -> float:
        """Assess accuracy including spelling and grammar"""
        
        accuracy_score = 90  # Base score assuming good accuracy
        
        # Simple checks for common issues
        # Check for repeated words
        words = jd_text.lower().split()
        repeated_words = len(words) - len(set(words))
        accuracy_score -= min(repeated_words * 2, 10)
        
        # Check for inconsistent capitalization
        sentences = re.split(r'[.!?]+', jd_text)
        capitalization_issues = sum(1 for s in sentences if s.strip() and not s.strip()[0].isupper())
        accuracy_score -= min(capitalization_issues * 3, 15)
        
        return max(0, accuracy_score)
    
    def _assess_engagement(self, jd_text: str) -> float:
        """Assess engagement level of the job description"""
        
        engagement_score = 60  # Base score
        
        # Check for engaging language
        engaging_words = ['exciting', 'opportunity', 'growth', 'innovative', 'dynamic', 'challenging']
        engagement_count = sum(1 for word in engaging_words if word in jd_text.lower())
        engagement_score += min(engagement_count * 8, 30)
        
        # Check for benefit mentions
        benefit_indicators = ['benefits', 'compensation', 'salary', 'bonus', 'training', 'development']
        benefit_count = sum(1 for indicator in benefit_indicators if indicator in jd_text.lower())
        engagement_score += min(benefit_count * 5, 20)
        
        return min(100, engagement_score)
    
    def _calculate_readability_level(self, jd_text: str) -> str:
        """Calculate readability level of the job description"""
        
        # Simple readability assessment based on sentence and word length
        sentences = re.split(r'[.!?]+', jd_text)
        words = jd_text.split()
        
        avg_sentence_length = len(words) / max(len(sentences), 1)
        avg_word_length = statistics.mean([len(word) for word in words])
        
        if avg_sentence_length < 15 and avg_word_length < 5:
            return 'easy'
        elif avg_sentence_length < 20 and avg_word_length < 6:
            return 'moderate'
        else:
            return 'difficult'
    
    def _assess_content_length(self, jd_text: str) -> str:
        """Assess if content length is appropriate"""
        
        length = len(jd_text)
        
        if length < 200:
            return 'too_short'
        elif length > 1000:
            return 'too_long'
        else:
            return 'appropriate'
    
    def _assess_technical_depth(self, jd_text: str, jd_data: Dict[str, Any]) -> float:
        """Assess technical depth of the job description"""
        
        technical_score = 50  # Base score
        
        # Check for specific tools and technologies
        tech_keywords = ['software', 'system', 'platform', 'tool', 'technology', 'framework']
        tech_count = sum(1 for keyword in tech_keywords if keyword in jd_text.lower())
        technical_score += min(tech_count * 8, 30)
        
        # Check for technical skills specificity
        skills = jd_data.get('skills_analysis', {}).get('technical_skills', [])
        if skills:
            specific_skills = [skill for skill in skills if len(skill) > 3]  # Filter out generic skills
            technical_score += min(len(specific_skills) * 5, 20)
        
        return min(100, technical_score)
    
    def _assess_growth_opportunities(self, jd_text: str) -> float:
        """Assess mention of growth and development opportunities"""
        
        growth_score = 0
        
        growth_keywords = [
            'career development', 'growth opportunity', 'advancement', 'promotion',
            'training', 'learning', 'mentorship', 'professional development'
        ]
        
        for keyword in growth_keywords:
            if keyword in jd_text.lower():
                growth_score += 15
        
        return min(100, growth_score)
    
    def _assess_cultural_sensitivity(self, jd_text: str) -> float:
        """Assess cultural sensitivity and UAE awareness"""
        
        cultural_score = 40  # Base score
        
        # Check for UAE cultural references
        uae_cultural_keywords = [
            'uae culture', 'local culture', 'cultural diversity', 'inclusion',
            'respect', 'tolerance', 'heritage', 'tradition'
        ]
        
        for keyword in uae_cultural_keywords:
            if keyword in jd_text.lower():
                cultural_score += 12
        
        return min(100, cultural_score)
    
    def _assess_language_requirements(self, jd_text: str) -> float:
        """Assess language requirements specification"""
        
        language_score = 0
        
        # Check for Arabic language mentions
        if re.search(r'\barabic\b', jd_text.lower()):
            language_score += 40
        
        # Check for English language mentions
        if re.search(r'\benglish\b', jd_text.lower()):
            language_score += 30
        
        # Check for bilingual mentions
        if re.search(r'\bbilingual\b', jd_text.lower()):
            language_score += 30
        
        return min(100, language_score)
    
    def _assess_emiratization_awareness(self, jd_text: str) -> float:
        """Assess Emiratization awareness and compliance"""
        
        emiratization_score = 0
        
        emiratization_keywords = [
            'uae national', 'emirati', 'emiratization', 'local talent',
            'national development', 'uae citizen'
        ]
        
        for keyword in emiratization_keywords:
            if keyword in jd_text.lower():
                emiratization_score += 20
        
        return min(100, emiratization_score)
    
    def _assess_local_context(self, jd_text: str) -> float:
        """Assess local UAE context and market awareness"""
        
        local_score = 30  # Base score
        
        local_keywords = [
            'uae market', 'dubai', 'abu dhabi', 'gcc', 'middle east',
            'regional', 'local market', 'uae experience'
        ]
        
        for keyword in local_keywords:
            if keyword in jd_text.lower():
                local_score += 15
        
        return min(100, local_score)
    
    def _assess_visa_information(self, jd_text: str) -> float:
        """Assess visa and sponsorship information"""
        
        visa_score = 0
        
        visa_keywords = [
            'visa sponsorship', 'work permit', 'residence visa',
            'sponsorship provided', 'visa support'
        ]
        
        for keyword in visa_keywords:
            if keyword in jd_text.lower():
                visa_score += 25
        
        return min(100, visa_score)
    
    def _check_section_presence(self, jd_text: str, jd_data: Dict[str, Any], section: str) -> bool:
        """Check if a specific section is present"""
        
        section_mapping = {
            'responsibilities': jd_data.get('responsibilities'),
            'requirements': jd_data.get('requirements'),
            'technical_skills': jd_data.get('skills_analysis', {}).get('technical_skills'),
            'compliance': 'compliance' in jd_text.lower(),
            'certifications': 'certification' in jd_text.lower(),
            'eligibility': 'eligible' in jd_text.lower()
        }
        
        return bool(section_mapping.get(section, False))
    
    def _check_element_presence(self, jd_data: Dict[str, Any], element: str) -> bool:
        """Check if a key element is present in the JD data"""
        
        element_mapping = {
            'job_title': jd_data.get('basic_info', {}).get('job_title'),
            'responsibilities': jd_data.get('responsibilities'),
            'requirements': jd_data.get('requirements'),
            'company': jd_data.get('basic_info', {}).get('company'),
            'location': jd_data.get('basic_info', {}).get('location')
        }
        
        return bool(element_mapping.get(element))
    
    def _check_sector_specific_requirements(self, jd_text: str, jd_data: Dict[str, Any], 
                                          sector: str, standards: Dict[str, Any]) -> float:
        """Check sector-specific requirements"""
        
        sector_score = 0
        
        if sector == 'technology' and standards.get('technical_depth_required'):
            # Check for technical depth
            if len(jd_data.get('skills_analysis', {}).get('technical_skills', [])) >= 5:
                sector_score += 25
        
        elif sector == 'banking_finance' and standards.get('regulatory_mentions_required'):
            # Check for regulatory mentions
            if re.search(r'\b(?:regulation|compliance|license|certified)\b', jd_text.lower()):
                sector_score += 25
        
        elif sector == 'healthcare' and standards.get('certification_requirements'):
            # Check for certification requirements
            if re.search(r'\b(?:license|certification|registered|board certified)\b', jd_text.lower()):
                sector_score += 25
        
        elif sector == 'government' and standards.get('emiratization_required'):
            # Check for Emiratization mentions
            if re.search(r'\b(?:uae national|emirati|emiratization)\b', jd_text.lower()):
                sector_score += 25
        
        return sector_score
    
    def _calculate_technical_complexity(self, jd_data: Dict[str, Any]) -> str:
        """Calculate technical complexity level"""
        
        skills_count = len(jd_data.get('skills_analysis', {}).get('technical_skills', []))
        
        if skills_count >= 8:
            return 'high'
        elif skills_count >= 4:
            return 'medium'
        else:
            return 'low'
    
    def _determine_role_seniority(self, jd_text: str, jd_data: Dict[str, Any]) -> str:
        """Determine role seniority level"""
        
        senior_keywords = ['senior', 'lead', 'manager', 'director', 'head', 'chief']
        junior_keywords = ['junior', 'entry', 'associate', 'assistant', 'trainee']
        
        jd_lower = jd_text.lower()
        
        if any(keyword in jd_lower for keyword in senior_keywords):
            return 'senior'
        elif any(keyword in jd_lower for keyword in junior_keywords):
            return 'junior'
        else:
            return 'mid'
    
    def _calculate_overall_quality_score(self, assessments: Dict[str, Dict[str, Any]]) -> float:
        """Calculate overall quality score from all assessments"""
        
        total_score = 0
        for category, assessment in assessments.items():
            score_key = f"{category}_score" if category != 'content_quality' else 'content_score'
            if score_key in assessment:
                weight = self.scoring_weights.get(category, 0.25)
                total_score += assessment[score_key] * weight
        
        return round(total_score, 2)
    
    def _get_quality_grade(self, score: float) -> str:
        """Convert quality score to letter grade"""
        if score >= 95:
            return 'A+'
        elif score >= 90:
            return 'A'
        elif score >= 85:
            return 'B+'
        elif score >= 80:
            return 'B'
        elif score >= 75:
            return 'C+'
        elif score >= 70:
            return 'C'
        elif score >= 65:
            return 'D+'
        elif score >= 60:
            return 'D'
        else:
            return 'F'
    
    def _get_quality_status(self, score: float) -> str:
        """Get quality status based on score"""
        if score >= 85:
            return 'excellent'
        elif score >= 75:
            return 'good'
        elif score >= 65:
            return 'fair'
        else:
            return 'needs_improvement'
    
    def _determine_improvement_priority(self, score: float, recommendations: List[Dict]) -> str:
        """Determine improvement priority level"""
        if score < 60:
            return 'urgent'
        elif score < 75:
            return 'high'
        elif score < 85:
            return 'medium'
        else:
            return 'low'
    
    def _assess_market_competitiveness(self, score: float, sector: str) -> Dict[str, Any]:
        """Assess market competitiveness of the job description"""
        
        competitiveness_level = 'average'
        if score >= 85:
            competitiveness_level = 'highly_competitive'
        elif score >= 75:
            competitiveness_level = 'competitive'
        elif score < 60:
            competitiveness_level = 'below_average'
        
        return {
            'competitiveness_level': competitiveness_level,
            'market_position': self._get_market_position(score),
            'candidate_attraction_potential': 'high' if score >= 80 else 'medium' if score >= 65 else 'low'
        }
    
    def _calculate_candidate_appeal_score(self, assessments: Dict[str, Dict[str, Any]]) -> float:
        """Calculate how appealing the JD is to candidates"""
        
        content_score = assessments.get('content_quality', {}).get('content_score', 0)
        technical_score = assessments.get('technical_aspects', {}).get('technical_score', 0)
        uae_score = assessments.get('uae_alignment', {}).get('uae_score', 0)
        
        # Weighted average for candidate appeal
        appeal_score = (content_score * 0.5 + technical_score * 0.3 + uae_score * 0.2)
        return round(appeal_score, 2)
    
    def _get_cultural_alignment_level(self, score: float) -> str:
        """Get cultural alignment level"""
        if score >= 80:
            return 'excellent'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'basic'
        else:
            return 'poor'
    
    def _get_industry_compliance_level(self, score: float) -> str:
        """Get industry compliance level"""
        if score >= 80:
            return 'fully_compliant'
        elif score >= 60:
            return 'mostly_compliant'
        elif score >= 40:
            return 'partially_compliant'
        else:
            return 'non_compliant'
    
    def _get_market_position(self, score: float) -> str:
        """Get market position based on quality score"""
        if score >= 90:
            return 'top_tier'
        elif score >= 80:
            return 'above_average'
        elif score >= 70:
            return 'average'
        else:
            return 'below_average'
    
    def _generate_quality_recommendations(self, jd_text: str, jd_data: Dict[str, Any], 
                                        sector: str, assessments: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate comprehensive quality improvement recommendations"""
        
        recommendations = []
        
        # Structure recommendations
        structure_assessment = assessments.get('structure', {})
        missing_sections = structure_assessment.get('missing_sections', [])
        
        for section in missing_sections:
            if section in self.improvement_templates['structure']:
                recommendations.append({
                    'category': 'structure',
                    'priority': 'high' if section in ['job_title', 'responsibilities', 'requirements'] else 'medium',
                    'title': f'Add {section.replace("_", " ").title()}',
                    'description': self.improvement_templates['structure'][f'missing_{section}'],
                    'impact': 'Improves JD completeness and candidate understanding',
                    'effort': 'low'
                })
        
        # Content quality recommendations
        content_assessment = assessments.get('content_quality', {})
        if content_assessment.get('content_score', 0) < 75:
            quality_metrics = content_assessment.get('quality_metrics', {})
            
            if quality_metrics.get('clarity', 0) < 70:
                recommendations.append({
                    'category': 'content',
                    'priority': 'medium',
                    'title': 'Improve Content Clarity',
                    'description': self.improvement_templates['content_quality']['poor_clarity'],
                    'impact': 'Increases candidate understanding and application rates',
                    'effort': 'medium'
                })
            
            if quality_metrics.get('engagement', 0) < 60:
                recommendations.append({
                    'category': 'content',
                    'priority': 'medium',
                    'title': 'Enhance Engagement',
                    'description': self.improvement_templates['content_quality']['low_engagement'],
                    'impact': 'Attracts more qualified candidates',
                    'effort': 'low'
                })
        
        # Technical recommendations
        technical_assessment = assessments.get('technical_aspects', {})
        if technical_assessment.get('technical_score', 0) < 70:
            technical_metrics = technical_assessment.get('technical_metrics', {})
            
            if technical_metrics.get('skills_specification', 0) < 60:
                recommendations.append({
                    'category': 'technical',
                    'priority': 'high',
                    'title': 'Specify Technical Skills',
                    'description': self.improvement_templates['technical_aspects']['vague_skills'],
                    'impact': 'Attracts candidates with right technical background',
                    'effort': 'low'
                })
        
        # UAE alignment recommendations
        uae_assessment = assessments.get('uae_alignment', {})
        if uae_assessment.get('uae_score', 0) < 60:
            uae_metrics = uae_assessment.get('uae_metrics', {})
            
            if uae_metrics.get('emiratization_awareness', 0) < 50:
                recommendations.append({
                    'category': 'uae_compliance',
                    'priority': 'high',
                    'title': 'Add Emiratization Statement',
                    'description': self.improvement_templates['uae_alignment']['no_emiratization_awareness'],
                    'impact': 'Ensures compliance and attracts UAE nationals',
                    'effort': 'low'
                })
        
        return recommendations

