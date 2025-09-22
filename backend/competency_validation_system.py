"""
Advanced Competency Validation and Certification System for Emirati Journey Platform
Comprehensive skill validation, professional certification, and competency verification
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import hashlib
import base64
from cryptography.fernet import Fernet
import qrcode
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CompetencyLevel(Enum):
    """Competency proficiency levels"""
    NOVICE = "novice"
    DEVELOPING = "developing"
    PROFICIENT = "proficient"
    ADVANCED = "advanced"
    EXPERT = "expert"

class CertificationStatus(Enum):
    """Certification status types"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"
    REVOKED = "revoked"
    RENEWED = "renewed"

class CertificationType(Enum):
    """Types of certifications"""
    SKILL_CERTIFICATION = "skill_certification"
    PROFESSIONAL_CERTIFICATION = "professional_certification"
    INDUSTRY_CERTIFICATION = "industry_certification"
    CULTURAL_COMPETENCY = "cultural_competency"
    LEADERSHIP_CERTIFICATION = "leadership_certification"
    TECHNICAL_CERTIFICATION = "technical_certification"
    SOFT_SKILLS_CERTIFICATION = "soft_skills_certification"
    UAE_WORKPLACE_CERTIFICATION = "uae_workplace_certification"
    EMIRATIZATION_CERTIFICATION = "emiratization_certification"
    LANGUAGE_CERTIFICATION = "language_certification"

class ValidationMethod(Enum):
    """Methods for competency validation"""
    ASSESSMENT_BASED = "assessment_based"
    PORTFOLIO_REVIEW = "portfolio_review"
    PRACTICAL_DEMONSTRATION = "practical_demonstration"
    PEER_EVALUATION = "peer_evaluation"
    SUPERVISOR_VALIDATION = "supervisor_validation"
    PROJECT_BASED = "project_based"
    CONTINUOUS_ASSESSMENT = "continuous_assessment"
    HYBRID_VALIDATION = "hybrid_validation"

@dataclass
class CompetencyFramework:
    """Competency framework definition"""
    framework_id: str
    name: str
    description: str
    industry_category: str
    competency_areas: List[Dict[str, Any]]
    proficiency_levels: List[Dict[str, Any]]
    validation_criteria: Dict[str, Any]
    uae_cultural_elements: Dict[str, Any]
    created_by: str
    created_at: datetime
    version: str
    active: bool

@dataclass
class CompetencyValidation:
    """Individual competency validation record"""
    validation_id: str
    candidate_id: str
    competency_id: str
    competency_name: str
    assessed_level: CompetencyLevel
    validation_method: ValidationMethod
    validation_score: float
    evidence_provided: List[Dict[str, Any]]
    assessor_id: str
    validation_date: datetime
    expiry_date: Optional[datetime]
    validation_notes: str
    cultural_competency_score: float
    uae_alignment_score: float
    confidence_level: float

@dataclass
class ProfessionalCertification:
    """Professional certification record"""
    certification_id: str
    candidate_id: str
    certification_type: CertificationType
    certification_name: str
    issuing_authority: str
    competencies_validated: List[str]
    assessment_results: Dict[str, Any]
    certification_level: str
    issue_date: datetime
    expiry_date: Optional[datetime]
    status: CertificationStatus
    digital_badge_url: str
    verification_code: str
    blockchain_hash: Optional[str]
    renewal_requirements: Dict[str, Any]
    continuing_education_credits: float
    uae_recognition_status: str

@dataclass
class SkillPortfolio:
    """Comprehensive skill portfolio"""
    portfolio_id: str
    candidate_id: str
    validated_competencies: List[CompetencyValidation]
    certifications: List[ProfessionalCertification]
    skill_progression: Dict[str, List[Dict[str, Any]]]
    portfolio_score: float
    market_readiness_score: float
    uae_employability_score: float
    last_updated: datetime
    verification_status: str

class CompetencyValidationSystem:
    """Advanced competency validation and certification system"""
    
    def __init__(self):
        self.competency_frameworks = {}
        self.validations = {}
        self.certifications = {}
        self.skill_portfolios = {}
        self.validation_stats = {
            'total_validations': 0,
            'total_certifications': 0,
            'average_competency_score': 0.0,
            'uae_alignment_average': 0.0
        }
        
        # Initialize encryption for secure certificates
        self.encryption_key = self._generate_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
        
        # Initialize default UAE competency frameworks
        self._initialize_uae_frameworks()
        
        logger.info("✅ Competency Validation System initialized")
    
    def create_competency_framework(self, framework_data: Dict[str, Any]) -> CompetencyFramework:
        """Create a new competency framework"""
        try:
            framework_id = str(uuid.uuid4())
            
            framework = CompetencyFramework(
                framework_id=framework_id,
                name=framework_data['name'],
                description=framework_data['description'],
                industry_category=framework_data['industry_category'],
                competency_areas=framework_data['competency_areas'],
                proficiency_levels=framework_data.get('proficiency_levels', self._get_default_proficiency_levels()),
                validation_criteria=framework_data.get('validation_criteria', {}),
                uae_cultural_elements=framework_data.get('uae_cultural_elements', {}),
                created_by=framework_data['created_by'],
                created_at=datetime.now(),
                version=framework_data.get('version', '1.0'),
                active=framework_data.get('active', True)
            )
            
            self.competency_frameworks[framework_id] = framework
            
            logger.info(f"✅ Competency framework created: {framework.name}")
            return framework
            
        except Exception as e:
            logger.error(f"Error creating competency framework: {str(e)}")
            raise ValueError(f"Failed to create competency framework: {str(e)}")
    
    def validate_competency(self, validation_data: Dict[str, Any]) -> CompetencyValidation:
        """Validate a specific competency for a candidate"""
        try:
            validation_id = str(uuid.uuid4())
            
            # Calculate validation score based on evidence and assessment
            validation_score = self._calculate_validation_score(validation_data)
            
            # Calculate cultural competency and UAE alignment scores
            cultural_score = self._calculate_cultural_competency_score(validation_data)
            uae_alignment_score = self._calculate_uae_alignment_score(validation_data)
            
            # Determine competency level based on score
            assessed_level = self._determine_competency_level(validation_score)
            
            validation = CompetencyValidation(
                validation_id=validation_id,
                candidate_id=validation_data['candidate_id'],
                competency_id=validation_data['competency_id'],
                competency_name=validation_data['competency_name'],
                assessed_level=assessed_level,
                validation_method=ValidationMethod(validation_data['validation_method']),
                validation_score=validation_score,
                evidence_provided=validation_data.get('evidence_provided', []),
                assessor_id=validation_data['assessor_id'],
                validation_date=datetime.now(),
                expiry_date=self._calculate_expiry_date(validation_data),
                validation_notes=validation_data.get('validation_notes', ''),
                cultural_competency_score=cultural_score,
                uae_alignment_score=uae_alignment_score,
                confidence_level=validation_data.get('confidence_level', 0.85)
            )
            
            self.validations[validation_id] = validation
            self._update_validation_stats()
            
            logger.info(f"✅ Competency validated: {validation.competency_name} for candidate {validation.candidate_id}")
            return validation
            
        except Exception as e:
            logger.error(f"Error validating competency: {str(e)}")
            raise ValueError(f"Failed to validate competency: {str(e)}")
    
    def issue_certification(self, certification_data: Dict[str, Any]) -> ProfessionalCertification:
        """Issue a professional certification"""
        try:
            certification_id = str(uuid.uuid4())
            verification_code = self._generate_verification_code()
            
            # Generate digital badge
            digital_badge_url = self._generate_digital_badge(certification_data, certification_id)
            
            # Calculate blockchain hash for verification
            blockchain_hash = self._generate_blockchain_hash(certification_data, certification_id)
            
            certification = ProfessionalCertification(
                certification_id=certification_id,
                candidate_id=certification_data['candidate_id'],
                certification_type=CertificationType(certification_data['certification_type']),
                certification_name=certification_data['certification_name'],
                issuing_authority=certification_data.get('issuing_authority', 'Emirati Journey Platform'),
                competencies_validated=certification_data['competencies_validated'],
                assessment_results=certification_data.get('assessment_results', {}),
                certification_level=certification_data.get('certification_level', 'Professional'),
                issue_date=datetime.now(),
                expiry_date=self._calculate_certification_expiry(certification_data),
                status=CertificationStatus.COMPLETED,
                digital_badge_url=digital_badge_url,
                verification_code=verification_code,
                blockchain_hash=blockchain_hash,
                renewal_requirements=certification_data.get('renewal_requirements', {}),
                continuing_education_credits=certification_data.get('continuing_education_credits', 0.0),
                uae_recognition_status=certification_data.get('uae_recognition_status', 'Recognized')
            )
            
            self.certifications[certification_id] = certification
            self._update_validation_stats()
            
            logger.info(f"✅ Certification issued: {certification.certification_name} for candidate {certification.candidate_id}")
            return certification
            
        except Exception as e:
            logger.error(f"Error issuing certification: {str(e)}")
            raise ValueError(f"Failed to issue certification: {str(e)}")
    
    def create_skill_portfolio(self, candidate_id: str) -> SkillPortfolio:
        """Create comprehensive skill portfolio for a candidate"""
        try:
            portfolio_id = str(uuid.uuid4())
            
            # Get all validations for the candidate
            candidate_validations = [v for v in self.validations.values() if v.candidate_id == candidate_id]
            
            # Get all certifications for the candidate
            candidate_certifications = [c for c in self.certifications.values() if c.candidate_id == candidate_id]
            
            # Calculate skill progression
            skill_progression = self._calculate_skill_progression(candidate_validations)
            
            # Calculate portfolio scores
            portfolio_score = self._calculate_portfolio_score(candidate_validations, candidate_certifications)
            market_readiness_score = self._calculate_market_readiness_score(candidate_validations, candidate_certifications)
            uae_employability_score = self._calculate_uae_employability_score(candidate_validations, candidate_certifications)
            
            portfolio = SkillPortfolio(
                portfolio_id=portfolio_id,
                candidate_id=candidate_id,
                validated_competencies=candidate_validations,
                certifications=candidate_certifications,
                skill_progression=skill_progression,
                portfolio_score=portfolio_score,
                market_readiness_score=market_readiness_score,
                uae_employability_score=uae_employability_score,
                last_updated=datetime.now(),
                verification_status='Verified'
            )
            
            self.skill_portfolios[portfolio_id] = portfolio
            
            logger.info(f"✅ Skill portfolio created for candidate {candidate_id}")
            return portfolio
            
        except Exception as e:
            logger.error(f"Error creating skill portfolio: {str(e)}")
            raise ValueError(f"Failed to create skill portfolio: {str(e)}")
    
    def verify_certification(self, verification_code: str) -> Dict[str, Any]:
        """Verify a certification using verification code"""
        try:
            # Find certification by verification code
            certification = None
            for cert in self.certifications.values():
                if cert.verification_code == verification_code:
                    certification = cert
                    break
            
            if not certification:
                return {
                    'valid': False,
                    'message': 'Certification not found'
                }
            
            # Check if certification is still valid
            if certification.expiry_date and datetime.now() > certification.expiry_date:
                return {
                    'valid': False,
                    'message': 'Certification has expired',
                    'expiry_date': certification.expiry_date.isoformat()
                }
            
            if certification.status == CertificationStatus.REVOKED:
                return {
                    'valid': False,
                    'message': 'Certification has been revoked'
                }
            
            return {
                'valid': True,
                'certification': {
                    'certification_id': certification.certification_id,
                    'certification_name': certification.certification_name,
                    'candidate_id': certification.candidate_id,
                    'issuing_authority': certification.issuing_authority,
                    'issue_date': certification.issue_date.isoformat(),
                    'expiry_date': certification.expiry_date.isoformat() if certification.expiry_date else None,
                    'certification_level': certification.certification_level,
                    'status': certification.status.value,
                    'uae_recognition_status': certification.uae_recognition_status,
                    'blockchain_hash': certification.blockchain_hash
                }
            }
            
        except Exception as e:
            logger.error(f"Error verifying certification: {str(e)}")
            return {
                'valid': False,
                'message': 'Verification failed'
            }
    
    def get_competency_gap_analysis(self, candidate_id: str, target_role: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze competency gaps for a target role"""
        try:
            # Get candidate's current competencies
            candidate_validations = [v for v in self.validations.values() if v.candidate_id == candidate_id]
            
            # Extract required competencies for target role
            required_competencies = target_role.get('required_competencies', [])
            
            gaps = []
            strengths = []
            
            for required_comp in required_competencies:
                comp_name = required_comp['competency_name']
                required_level = CompetencyLevel(required_comp['required_level'])
                
                # Find candidate's current level for this competency
                current_validation = None
                for validation in candidate_validations:
                    if validation.competency_name == comp_name:
                        current_validation = validation
                        break
                
                if current_validation:
                    current_level = current_validation.assessed_level
                    
                    # Compare levels
                    level_values = {
                        CompetencyLevel.NOVICE: 1,
                        CompetencyLevel.DEVELOPING: 2,
                        CompetencyLevel.PROFICIENT: 3,
                        CompetencyLevel.ADVANCED: 4,
                        CompetencyLevel.EXPERT: 5
                    }
                    
                    current_value = level_values[current_level]
                    required_value = level_values[required_level]
                    
                    if current_value >= required_value:
                        strengths.append({
                            'competency_name': comp_name,
                            'current_level': current_level.value,
                            'required_level': required_level.value,
                            'validation_score': current_validation.validation_score,
                            'cultural_score': current_validation.cultural_competency_score
                        })
                    else:
                        gaps.append({
                            'competency_name': comp_name,
                            'current_level': current_level.value,
                            'required_level': required_level.value,
                            'gap_severity': 'high' if required_value - current_value > 2 else 'medium',
                            'development_priority': required_comp.get('priority', 'medium'),
                            'estimated_development_time_weeks': (required_value - current_value) * 4
                        })
                else:
                    # Competency not validated yet
                    gaps.append({
                        'competency_name': comp_name,
                        'current_level': 'not_validated',
                        'required_level': required_level.value,
                        'gap_severity': 'high',
                        'development_priority': required_comp.get('priority', 'high'),
                        'estimated_development_time_weeks': level_values[required_level] * 4
                    })
            
            # Generate development recommendations
            recommendations = self._generate_development_recommendations(gaps, target_role)
            
            return {
                'candidate_id': candidate_id,
                'target_role': target_role.get('role_name', 'Unknown'),
                'analysis_date': datetime.now().isoformat(),
                'competency_gaps': gaps,
                'competency_strengths': strengths,
                'overall_readiness_percentage': len(strengths) / len(required_competencies) * 100 if required_competencies else 0,
                'development_recommendations': recommendations,
                'estimated_total_development_time_weeks': sum(gap.get('estimated_development_time_weeks', 0) for gap in gaps),
                'priority_development_areas': [gap for gap in gaps if gap.get('development_priority') == 'high']
            }
            
        except Exception as e:
            logger.error(f"Error analyzing competency gaps: {str(e)}")
            raise ValueError(f"Failed to analyze competency gaps: {str(e)}")
    
    def renew_certification(self, certification_id: str, renewal_data: Dict[str, Any]) -> ProfessionalCertification:
        """Renew an existing certification"""
        try:
            if certification_id not in self.certifications:
                raise ValueError("Certification not found")
            
            certification = self.certifications[certification_id]
            
            # Validate renewal requirements
            if not self._validate_renewal_requirements(certification, renewal_data):
                raise ValueError("Renewal requirements not met")
            
            # Update certification
            certification.status = CertificationStatus.RENEWED
            certification.issue_date = datetime.now()
            certification.expiry_date = self._calculate_certification_expiry(renewal_data)
            certification.continuing_education_credits += renewal_data.get('additional_credits', 0.0)
            
            # Generate new verification code
            certification.verification_code = self._generate_verification_code()
            
            # Update blockchain hash
            certification.blockchain_hash = self._generate_blockchain_hash(
                {'certification_id': certification_id, **renewal_data}, 
                certification_id
            )
            
            logger.info(f"✅ Certification renewed: {certification.certification_name}")
            return certification
            
        except Exception as e:
            logger.error(f"Error renewing certification: {str(e)}")
            raise ValueError(f"Failed to renew certification: {str(e)}")
    
    def get_validation_analytics(self) -> Dict[str, Any]:
        """Get comprehensive validation analytics"""
        try:
            total_validations = len(self.validations)
            total_certifications = len(self.certifications)
            
            if total_validations == 0:
                return {
                    'total_validations': 0,
                    'total_certifications': 0,
                    'message': 'No validation data available'
                }
            
            # Calculate averages
            avg_validation_score = sum(v.validation_score for v in self.validations.values()) / total_validations
            avg_cultural_score = sum(v.cultural_competency_score for v in self.validations.values()) / total_validations
            avg_uae_alignment = sum(v.uae_alignment_score for v in self.validations.values()) / total_validations
            
            # Competency level distribution
            level_distribution = {}
            for level in CompetencyLevel:
                level_distribution[level.value] = len([v for v in self.validations.values() if v.assessed_level == level])
            
            # Certification type distribution
            cert_type_distribution = {}
            for cert_type in CertificationType:
                cert_type_distribution[cert_type.value] = len([c for c in self.certifications.values() if c.certification_type == cert_type])
            
            # Validation method distribution
            method_distribution = {}
            for method in ValidationMethod:
                method_distribution[method.value] = len([v for v in self.validations.values() if v.validation_method == method])
            
            return {
                'overview': {
                    'total_validations': total_validations,
                    'total_certifications': total_certifications,
                    'total_frameworks': len(self.competency_frameworks),
                    'total_portfolios': len(self.skill_portfolios)
                },
                'performance_metrics': {
                    'average_validation_score': round(avg_validation_score, 2),
                    'average_cultural_competency_score': round(avg_cultural_score, 2),
                    'average_uae_alignment_score': round(avg_uae_alignment, 2),
                    'validation_success_rate': len([v for v in self.validations.values() if v.validation_score >= 70]) / total_validations * 100
                },
                'distributions': {
                    'competency_levels': level_distribution,
                    'certification_types': cert_type_distribution,
                    'validation_methods': method_distribution
                },
                'trends': {
                    'monthly_validations': self._calculate_monthly_trends(),
                    'popular_competencies': self._get_popular_competencies(),
                    'top_performing_candidates': self._get_top_performers()
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting validation analytics: {str(e)}")
            return {'error': 'Failed to generate analytics'}
    
    # Private helper methods
    def _initialize_uae_frameworks(self):
        """Initialize default UAE competency frameworks"""
        uae_frameworks = [
            {
                'name': 'UAE Workplace Excellence Framework',
                'description': 'Comprehensive framework for UAE workplace competencies',
                'industry_category': 'general',
                'competency_areas': [
                    {
                        'area': 'Cultural Intelligence',
                        'competencies': ['UAE Cultural Awareness', 'Cross-Cultural Communication', 'Cultural Adaptation']
                    },
                    {
                        'area': 'Professional Excellence',
                        'competencies': ['Work Ethics', 'Professional Communication', 'Team Collaboration']
                    },
                    {
                        'area': 'Innovation and Leadership',
                        'competencies': ['Creative Problem Solving', 'Leadership Skills', 'Change Management']
                    }
                ],
                'uae_cultural_elements': {
                    'respect_for_hierarchy': True,
                    'cultural_sensitivity': True,
                    'arabic_language_appreciation': True,
                    'emiratization_support': True
                },
                'created_by': 'system'
            }
        ]
        
        for framework_data in uae_frameworks:
            try:
                self.create_competency_framework(framework_data)
            except Exception as e:
                logger.warning(f"Failed to create default framework: {str(e)}")
    
    def _calculate_validation_score(self, validation_data: Dict[str, Any]) -> float:
        """Calculate validation score based on evidence and assessment"""
        base_score = validation_data.get('assessment_score', 70.0)
        
        # Adjust based on evidence quality
        evidence_bonus = len(validation_data.get('evidence_provided', [])) * 2.0
        
        # Adjust based on validation method
        method_multiplier = {
            ValidationMethod.PRACTICAL_DEMONSTRATION: 1.2,
            ValidationMethod.PROJECT_BASED: 1.15,
            ValidationMethod.PORTFOLIO_REVIEW: 1.1,
            ValidationMethod.ASSESSMENT_BASED: 1.0,
            ValidationMethod.PEER_EVALUATION: 0.95,
            ValidationMethod.SUPERVISOR_VALIDATION: 1.05
        }
        
        method = ValidationMethod(validation_data['validation_method'])
        multiplier = method_multiplier.get(method, 1.0)
        
        final_score = min(100.0, (base_score + evidence_bonus) * multiplier)
        return round(final_score, 2)
    
    def _calculate_cultural_competency_score(self, validation_data: Dict[str, Any]) -> float:
        """Calculate cultural competency score"""
        base_score = 75.0
        
        # Adjust based on UAE experience
        if validation_data.get('candidate_uae_experience', False):
            base_score += 10.0
        
        # Adjust based on Arabic language skills
        if validation_data.get('arabic_proficiency', 'none') != 'none':
            base_score += 5.0
        
        # Adjust based on cultural awareness assessment
        cultural_assessment_score = validation_data.get('cultural_assessment_score', 75.0)
        final_score = (base_score + cultural_assessment_score) / 2
        
        return round(min(100.0, final_score), 2)
    
    def _calculate_uae_alignment_score(self, validation_data: Dict[str, Any]) -> float:
        """Calculate UAE market alignment score"""
        base_score = 80.0
        
        # Adjust based on industry relevance
        if validation_data.get('industry_category') in ['government', 'energy', 'finance']:
            base_score += 5.0
        
        # Adjust based on Emiratization factors
        if validation_data.get('supports_emiratization', False):
            base_score += 10.0
        
        return round(min(100.0, base_score), 2)
    
    def _determine_competency_level(self, score: float) -> CompetencyLevel:
        """Determine competency level based on score"""
        if score >= 90:
            return CompetencyLevel.EXPERT
        elif score >= 80:
            return CompetencyLevel.ADVANCED
        elif score >= 70:
            return CompetencyLevel.PROFICIENT
        elif score >= 60:
            return CompetencyLevel.DEVELOPING
        else:
            return CompetencyLevel.NOVICE
    
    def _calculate_expiry_date(self, validation_data: Dict[str, Any]) -> Optional[datetime]:
        """Calculate expiry date for validation"""
        validity_months = validation_data.get('validity_months', 24)
        if validity_months > 0:
            return datetime.now() + timedelta(days=validity_months * 30)
        return None
    
    def _calculate_certification_expiry(self, certification_data: Dict[str, Any]) -> Optional[datetime]:
        """Calculate expiry date for certification"""
        validity_years = certification_data.get('validity_years', 3)
        if validity_years > 0:
            return datetime.now() + timedelta(days=validity_years * 365)
        return None
    
    def _generate_verification_code(self) -> str:
        """Generate unique verification code"""
        return f"EJP-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:8].upper()}"
    
    def _generate_digital_badge(self, certification_data: Dict[str, Any], certification_id: str) -> str:
        """Generate digital badge URL"""
        return f"https://badges.emiratijourney.ae/cert/{certification_id}"
    
    def _generate_blockchain_hash(self, data: Dict[str, Any], certification_id: str) -> str:
        """Generate blockchain hash for verification"""
        hash_data = f"{certification_id}{json.dumps(data, sort_keys=True)}{datetime.now().isoformat()}"
        return hashlib.sha256(hash_data.encode()).hexdigest()
    
    def _generate_encryption_key(self) -> bytes:
        """Generate encryption key for secure certificates"""
        return Fernet.generate_key()
    
    def _get_default_proficiency_levels(self) -> List[Dict[str, Any]]:
        """Get default proficiency levels"""
        return [
            {'level': 'novice', 'description': 'Basic understanding, requires guidance'},
            {'level': 'developing', 'description': 'Growing competency, some independence'},
            {'level': 'proficient', 'description': 'Competent performance, works independently'},
            {'level': 'advanced', 'description': 'High-level expertise, mentors others'},
            {'level': 'expert', 'description': 'Master-level competency, thought leader'}
        ]
    
    def _calculate_skill_progression(self, validations: List[CompetencyValidation]) -> Dict[str, List[Dict[str, Any]]]:
        """Calculate skill progression over time"""
        progression = {}
        
        for validation in sorted(validations, key=lambda x: x.validation_date):
            skill = validation.competency_name
            if skill not in progression:
                progression[skill] = []
            
            progression[skill].append({
                'date': validation.validation_date.isoformat(),
                'level': validation.assessed_level.value,
                'score': validation.validation_score
            })
        
        return progression
    
    def _calculate_portfolio_score(self, validations: List[CompetencyValidation], 
                                 certifications: List[ProfessionalCertification]) -> float:
        """Calculate overall portfolio score"""
        if not validations and not certifications:
            return 0.0
        
        validation_score = sum(v.validation_score for v in validations) / len(validations) if validations else 0
        certification_bonus = len(certifications) * 5.0
        
        return min(100.0, validation_score + certification_bonus)
    
    def _calculate_market_readiness_score(self, validations: List[CompetencyValidation], 
                                        certifications: List[ProfessionalCertification]) -> float:
        """Calculate market readiness score"""
        base_score = 70.0
        
        # Boost based on advanced competencies
        advanced_count = len([v for v in validations if v.assessed_level in [CompetencyLevel.ADVANCED, CompetencyLevel.EXPERT]])
        base_score += advanced_count * 3.0
        
        # Boost based on certifications
        base_score += len(certifications) * 5.0
        
        return min(100.0, base_score)
    
    def _calculate_uae_employability_score(self, validations: List[CompetencyValidation], 
                                         certifications: List[ProfessionalCertification]) -> float:
        """Calculate UAE employability score"""
        base_score = 75.0
        
        # Boost based on cultural competency scores
        if validations:
            avg_cultural_score = sum(v.cultural_competency_score for v in validations) / len(validations)
            base_score = (base_score + avg_cultural_score) / 2
        
        # Boost based on UAE-specific certifications
        uae_certs = len([c for c in certifications if 'uae' in c.certification_name.lower() or c.certification_type == CertificationType.UAE_WORKPLACE_CERTIFICATION])
        base_score += uae_certs * 8.0
        
        return min(100.0, base_score)
    
    def _generate_development_recommendations(self, gaps: List[Dict[str, Any]], 
                                            target_role: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate development recommendations based on gaps"""
        recommendations = []
        
        for gap in gaps:
            if gap['gap_severity'] == 'high':
                recommendations.append({
                    'competency': gap['competency_name'],
                    'recommendation': f"Prioritize development of {gap['competency_name']} through structured learning program",
                    'suggested_actions': [
                        'Enroll in relevant certification program',
                        'Seek mentorship from expert practitioners',
                        'Complete practical projects to demonstrate competency'
                    ],
                    'timeline_weeks': gap.get('estimated_development_time_weeks', 12),
                    'priority': 'high'
                })
        
        return recommendations
    
    def _validate_renewal_requirements(self, certification: ProfessionalCertification, 
                                     renewal_data: Dict[str, Any]) -> bool:
        """Validate certification renewal requirements"""
        required_credits = certification.renewal_requirements.get('continuing_education_credits', 0)
        provided_credits = renewal_data.get('continuing_education_credits', 0)
        
        return provided_credits >= required_credits
    
    def _calculate_monthly_trends(self) -> Dict[str, int]:
        """Calculate monthly validation trends"""
        trends = {}
        for validation in self.validations.values():
            month_key = validation.validation_date.strftime('%Y-%m')
            trends[month_key] = trends.get(month_key, 0) + 1
        return trends
    
    def _get_popular_competencies(self) -> List[Dict[str, Any]]:
        """Get most popular competencies"""
        competency_counts = {}
        for validation in self.validations.values():
            comp_name = validation.competency_name
            competency_counts[comp_name] = competency_counts.get(comp_name, 0) + 1
        
        sorted_competencies = sorted(competency_counts.items(), key=lambda x: x[1], reverse=True)
        return [{'competency': comp, 'count': count} for comp, count in sorted_competencies[:10]]
    
    def _get_top_performers(self) -> List[Dict[str, Any]]:
        """Get top performing candidates"""
        candidate_scores = {}
        for validation in self.validations.values():
            candidate_id = validation.candidate_id
            if candidate_id not in candidate_scores:
                candidate_scores[candidate_id] = []
            candidate_scores[candidate_id].append(validation.validation_score)
        
        # Calculate average scores
        candidate_averages = {}
        for candidate_id, scores in candidate_scores.items():
            candidate_averages[candidate_id] = sum(scores) / len(scores)
        
        sorted_candidates = sorted(candidate_averages.items(), key=lambda x: x[1], reverse=True)
        return [{'candidate_id': candidate, 'average_score': score} for candidate, score in sorted_candidates[:10]]
    
    def _update_validation_stats(self):
        """Update validation statistics"""
        self.validation_stats['total_validations'] = len(self.validations)
        self.validation_stats['total_certifications'] = len(self.certifications)
        
        if self.validations:
            self.validation_stats['average_competency_score'] = sum(v.validation_score for v in self.validations.values()) / len(self.validations)
            self.validation_stats['uae_alignment_average'] = sum(v.uae_alignment_score for v in self.validations.values()) / len(self.validations)

# Global instance
competency_validation_system = CompetencyValidationSystem()

logger.info("✅ Competency Validation System module loaded successfully")
