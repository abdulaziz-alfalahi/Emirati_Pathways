"""
UAE National Qualifications Framework (NQF) Integration System
Handles NQF level mapping, qualification pathways, and credential validation
"""

import json
import hashlib
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

class NQFLevel(Enum):
    """UAE NQF Levels (1-10)"""
    LEVEL_1 = 1  # Foundation Certificate
    LEVEL_2 = 2  # Foundation Diploma
    LEVEL_3 = 3  # General Diploma
    LEVEL_4 = 4  # Higher Diploma
    LEVEL_5 = 5  # Advanced Diploma
    LEVEL_6 = 6  # Bachelor's Degree
    LEVEL_7 = 7  # Bachelor's Honours / Graduate Diploma
    LEVEL_8 = 8  # Master's Degree
    LEVEL_9 = 9  # Doctoral Degree
    LEVEL_10 = 10  # Higher Doctoral Degree

class QualificationType(Enum):
    """Types of qualifications in UAE NQF"""
    ACADEMIC = "academic"
    VOCATIONAL = "vocational"
    PROFESSIONAL = "professional"
    SKILLS_BASED = "skills_based"

@dataclass
class NQFQualification:
    """NQF Qualification structure"""
    id: Optional[int] = None
    qualification_code: str = ""
    title: str = ""
    nqf_level: int = 1
    qualification_type: str = ""
    credit_points: int = 0
    learning_outcomes: List[str] = None
    competency_requirements: Dict[str, Any] = None
    industry_alignment: List[str] = None
    progression_pathways: Dict[str, Any] = None
    recognition_status: str = "pending"
    issuing_authority: str = ""
    validity_period_months: int = 60

@dataclass
class DigitalCredential:
    """Digital credential structure"""
    credential_id: str = ""
    holder_id: int = 0
    qualification_id: int = 0
    issued_date: datetime = None
    expiry_date: datetime = None
    verification_hash: str = ""
    blockchain_reference: Optional[str] = None
    issuer_signature: str = ""
    status: str = "active"

class UAENQFIntegration:
    """UAE National Qualifications Framework Integration System"""
    
    def __init__(self, db_connection_string: str):
        self.db_connection_string = db_connection_string
        self.connection = None
        
        # NQF Level descriptors and requirements
        self.nqf_descriptors = {
            1: {
                "title": "Foundation Certificate",
                "description": "Basic knowledge and skills for simple tasks",
                "credit_range": (10, 30),
                "learning_outcomes": ["Basic factual knowledge", "Simple cognitive skills", "Basic practical skills"],
                "complexity": "Simple, routine tasks under direct supervision"
            },
            2: {
                "title": "Foundation Diploma", 
                "description": "Foundational knowledge and skills for routine tasks",
                "credit_range": (30, 60),
                "learning_outcomes": ["Foundational knowledge", "Basic cognitive skills", "Routine practical skills"],
                "complexity": "Routine tasks with some autonomy"
            },
            3: {
                "title": "General Diploma",
                "description": "General knowledge and skills for varied tasks",
                "credit_range": (60, 90),
                "learning_outcomes": ["General knowledge", "Interpretive skills", "Varied practical skills"],
                "complexity": "Varied tasks with guided autonomy"
            },
            4: {
                "title": "Higher Diploma",
                "description": "Broad knowledge and skills for complex tasks",
                "credit_range": (90, 120),
                "learning_outcomes": ["Broad knowledge", "Analytical skills", "Complex practical skills"],
                "complexity": "Complex tasks with supervised autonomy"
            },
            5: {
                "title": "Advanced Diploma",
                "description": "Comprehensive knowledge and advanced skills",
                "credit_range": (120, 150),
                "learning_outcomes": ["Comprehensive knowledge", "Critical thinking", "Advanced practical skills"],
                "complexity": "Advanced tasks with significant autonomy"
            },
            6: {
                "title": "Bachelor's Degree",
                "description": "Systematic knowledge and professional skills",
                "credit_range": (180, 240),
                "learning_outcomes": ["Systematic knowledge", "Professional skills", "Research capabilities"],
                "complexity": "Professional tasks with full autonomy"
            },
            7: {
                "title": "Bachelor's Honours / Graduate Diploma",
                "description": "Advanced systematic knowledge and specialized skills",
                "credit_range": (240, 270),
                "learning_outcomes": ["Advanced knowledge", "Specialized skills", "Independent research"],
                "complexity": "Specialized professional tasks with leadership"
            },
            8: {
                "title": "Master's Degree",
                "description": "Highly specialized knowledge and expert skills",
                "credit_range": (90, 180),
                "learning_outcomes": ["Expert knowledge", "Innovation skills", "Advanced research"],
                "complexity": "Expert-level tasks with strategic thinking"
            },
            9: {
                "title": "Doctoral Degree",
                "description": "Cutting-edge knowledge and research expertise",
                "credit_range": (180, 240),
                "learning_outcomes": ["Cutting-edge knowledge", "Research leadership", "Innovation"],
                "complexity": "Research leadership and knowledge creation"
            },
            10: {
                "title": "Higher Doctoral Degree",
                "description": "Pinnacle of academic and professional achievement",
                "credit_range": (240, 300),
                "learning_outcomes": ["Pinnacle knowledge", "Thought leadership", "Global impact"],
                "complexity": "Thought leadership and global influence"
            }
        }
        
        # Industry alignment mappings
        self.industry_nqf_mapping = {
            "oil_and_gas": {
                "entry_level": [1, 2, 3],
                "technical": [4, 5, 6],
                "professional": [6, 7, 8],
                "leadership": [8, 9, 10]
            },
            "finance": {
                "entry_level": [2, 3, 4],
                "technical": [5, 6, 7],
                "professional": [7, 8, 9],
                "leadership": [8, 9, 10]
            },
            "healthcare": {
                "entry_level": [2, 3, 4],
                "technical": [5, 6, 7],
                "professional": [7, 8, 9],
                "leadership": [8, 9, 10]
            },
            "technology": {
                "entry_level": [3, 4, 5],
                "technical": [5, 6, 7],
                "professional": [6, 7, 8],
                "leadership": [7, 8, 9]
            },
            "education": {
                "entry_level": [4, 5, 6],
                "technical": [6, 7, 8],
                "professional": [7, 8, 9],
                "leadership": [8, 9, 10]
            }
        }
    
    def connect_db(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(
                self.db_connection_string,
                cursor_factory=RealDictCursor
            )
            logger.info("Database connection established for NQF integration")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def close_db(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def create_nqf_qualification(self, qualification: NQFQualification) -> Dict[str, Any]:
        """Create a new NQF-aligned qualification"""
        try:
            with self.connection.cursor() as cursor:
                # Validate NQF level
                if qualification.nqf_level not in range(1, 11):
                    return {
                        "success": False,
                        "message": "Invalid NQF level. Must be between 1 and 10."
                    }
                
                # Generate qualification code if not provided
                if not qualification.qualification_code:
                    qualification.qualification_code = self._generate_qualification_code(
                        qualification.nqf_level, qualification.qualification_type
                    )
                
                # Validate credit points against NQF level
                level_descriptor = self.nqf_descriptors[qualification.nqf_level]
                min_credits, max_credits = level_descriptor["credit_range"]
                
                if not (min_credits <= qualification.credit_points <= max_credits):
                    return {
                        "success": False,
                        "message": f"Credit points ({qualification.credit_points}) not within NQF Level {qualification.nqf_level} range ({min_credits}-{max_credits})"
                    }
                
                # Insert qualification
                query = """
                INSERT INTO nqf_qualifications 
                (qualification_code, title, nqf_level, qualification_type, credit_points,
                 learning_outcomes, competency_requirements, industry_alignment, 
                 progression_pathways, recognition_status, issuing_authority, validity_period_months)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """
                
                cursor.execute(query, (
                    qualification.qualification_code,
                    qualification.title,
                    qualification.nqf_level,
                    qualification.qualification_type,
                    qualification.credit_points,
                    json.dumps(qualification.learning_outcomes or []),
                    json.dumps(qualification.competency_requirements or {}),
                    qualification.industry_alignment or [],
                    json.dumps(qualification.progression_pathways or {}),
                    qualification.recognition_status,
                    qualification.issuing_authority,
                    qualification.validity_period_months
                ))
                
                result = cursor.fetchone()
                self.connection.commit()
                
                logger.info(f"NQF qualification created with ID: {result['id']}")
                return {
                    "success": True,
                    "qualification_id": result["id"],
                    "qualification_code": qualification.qualification_code,
                    "nqf_level": qualification.nqf_level,
                    "created_at": result["created_at"],
                    "message": "NQF qualification created successfully"
                }
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error creating NQF qualification: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create NQF qualification"
            }
    
    def _generate_qualification_code(self, nqf_level: int, qualification_type: str) -> str:
        """Generate unique qualification code"""
        timestamp = datetime.now().strftime("%Y%m")
        type_code = qualification_type[:3].upper()
        return f"UAE-NQF-L{nqf_level}-{type_code}-{timestamp}"
    
    def map_competency_to_nqf(self, competency_id: int, assessment_score: float, 
                            evidence_quality: float) -> Dict[str, Any]:
        """Map competency assessment results to NQF level"""
        try:
            with self.connection.cursor() as cursor:
                # Get competency details
                cursor.execute("""
                SELECT cm.*, 
                       COALESCE(cm.nqf_alignment, '{}') as nqf_alignment
                FROM competency_models cm 
                WHERE cm.id = %s
                """, (competency_id,))
                
                competency = cursor.fetchone()
                if not competency:
                    return {
                        "success": False,
                        "message": "Competency not found"
                    }
                
                nqf_alignment = json.loads(competency['nqf_alignment'])
                
                # Calculate NQF level based on score and evidence quality
                adjusted_score = assessment_score * evidence_quality
                
                # Determine NQF level based on performance
                if adjusted_score >= 95:
                    suggested_nqf_level = nqf_alignment.get('expert_level', 8)
                elif adjusted_score >= 85:
                    suggested_nqf_level = nqf_alignment.get('advanced_level', 7)
                elif adjusted_score >= 75:
                    suggested_nqf_level = nqf_alignment.get('proficient_level', 6)
                elif adjusted_score >= 65:
                    suggested_nqf_level = nqf_alignment.get('competent_level', 5)
                else:
                    suggested_nqf_level = nqf_alignment.get('developing_level', 4)
                
                # Ensure level is within valid range
                suggested_nqf_level = max(1, min(10, suggested_nqf_level))
                
                # Get level descriptor
                level_descriptor = self.nqf_descriptors[suggested_nqf_level]
                
                # Generate mapping result
                mapping_result = {
                    "competency_id": competency_id,
                    "competency_name": competency['name'],
                    "assessment_score": assessment_score,
                    "evidence_quality": evidence_quality,
                    "adjusted_score": round(adjusted_score, 2),
                    "suggested_nqf_level": suggested_nqf_level,
                    "level_title": level_descriptor["title"],
                    "level_description": level_descriptor["description"],
                    "credit_range": level_descriptor["credit_range"],
                    "learning_outcomes": level_descriptor["learning_outcomes"],
                    "complexity_level": level_descriptor["complexity"],
                    "mapping_confidence": self._calculate_mapping_confidence(adjusted_score, evidence_quality),
                    "mapped_at": datetime.now().isoformat()
                }
                
                # Store mapping result
                self._store_nqf_mapping(competency_id, mapping_result)
                
                return {
                    "success": True,
                    "nqf_mapping": mapping_result,
                    "message": "Competency mapped to NQF level successfully"
                }
                
        except Exception as e:
            logger.error(f"Error mapping competency to NQF: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to map competency to NQF level"
            }
    
    def _calculate_mapping_confidence(self, score: float, evidence_quality: float) -> float:
        """Calculate confidence level for NQF mapping"""
        # Base confidence on score consistency and evidence quality
        score_confidence = min(1.0, score / 100.0)
        evidence_confidence = evidence_quality
        
        # Combined confidence with weights
        combined_confidence = (score_confidence * 0.7) + (evidence_confidence * 0.3)
        
        return round(combined_confidence, 2)
    
    def _store_nqf_mapping(self, competency_id: int, mapping_result: Dict[str, Any]):
        """Store NQF mapping result in database"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                INSERT INTO nqf_competency_mappings 
                (competency_id, nqf_level, mapping_score, evidence_quality, 
                 mapping_confidence, mapping_data, mapped_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (competency_id) 
                DO UPDATE SET 
                    nqf_level = EXCLUDED.nqf_level,
                    mapping_score = EXCLUDED.mapping_score,
                    evidence_quality = EXCLUDED.evidence_quality,
                    mapping_confidence = EXCLUDED.mapping_confidence,
                    mapping_data = EXCLUDED.mapping_data,
                    mapped_at = EXCLUDED.mapped_at
                """
                
                cursor.execute(query, (
                    competency_id,
                    mapping_result['suggested_nqf_level'],
                    mapping_result['adjusted_score'],
                    mapping_result['evidence_quality'],
                    mapping_result['mapping_confidence'],
                    json.dumps(mapping_result),
                    datetime.now()
                ))
                
                self.connection.commit()
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error storing NQF mapping: {e}")
            raise
    
    def generate_digital_credential(self, holder_id: int, qualification_id: int, 
                                  assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a blockchain-verifiable digital credential"""
        try:
            with self.connection.cursor() as cursor:
                # Get qualification details
                cursor.execute("""
                SELECT * FROM nqf_qualifications WHERE id = %s
                """, (qualification_id,))
                
                qualification = cursor.fetchone()
                if not qualification:
                    return {
                        "success": False,
                        "message": "Qualification not found"
                    }
                
                # Generate credential ID
                credential_id = self._generate_credential_id(holder_id, qualification_id)
                
                # Calculate expiry date
                issued_date = datetime.now()
                expiry_date = issued_date + timedelta(days=qualification['validity_period_months'] * 30)
                
                # Create verification hash
                verification_data = {
                    "credential_id": credential_id,
                    "holder_id": holder_id,
                    "qualification_id": qualification_id,
                    "qualification_code": qualification['qualification_code'],
                    "nqf_level": qualification['nqf_level'],
                    "issued_date": issued_date.isoformat(),
                    "assessment_data": assessment_data
                }
                
                verification_hash = self._create_verification_hash(verification_data)
                
                # Generate issuer signature (simplified - in production would use proper cryptographic signing)
                issuer_signature = self._generate_issuer_signature(verification_data)
                
                # Store digital credential
                insert_query = """
                INSERT INTO digital_credentials 
                (credential_id, holder_id, qualification_id, issued_date, expiry_date,
                 verification_hash, issuer_signature, credential_data, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active')
                RETURNING id, created_at
                """
                
                cursor.execute(insert_query, (
                    credential_id,
                    holder_id,
                    qualification_id,
                    issued_date,
                    expiry_date,
                    verification_hash,
                    issuer_signature,
                    json.dumps(verification_data)
                ))
                
                result = cursor.fetchone()
                self.connection.commit()
                
                # Create credential response
                credential_response = {
                    "credential_id": credential_id,
                    "holder_id": holder_id,
                    "qualification": {
                        "id": qualification_id,
                        "code": qualification['qualification_code'],
                        "title": qualification['title'],
                        "nqf_level": qualification['nqf_level'],
                        "type": qualification['qualification_type']
                    },
                    "issued_date": issued_date.isoformat(),
                    "expiry_date": expiry_date.isoformat(),
                    "verification_hash": verification_hash,
                    "verification_url": f"https://nqf.uae.gov.ae/verify/{credential_id}",
                    "blockchain_reference": None,  # Would be populated in production
                    "status": "active"
                }
                
                logger.info(f"Digital credential generated: {credential_id}")
                return {
                    "success": True,
                    "credential": credential_response,
                    "message": "Digital credential generated successfully"
                }
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error generating digital credential: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to generate digital credential"
            }
    
    def _generate_credential_id(self, holder_id: int, qualification_id: int) -> str:
        """Generate unique credential ID"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"UAE-CRED-{holder_id}-{qualification_id}-{timestamp}"
    
    def _create_verification_hash(self, verification_data: Dict[str, Any]) -> str:
        """Create verification hash for credential"""
        # Sort data for consistent hashing
        sorted_data = json.dumps(verification_data, sort_keys=True)
        return hashlib.sha256(sorted_data.encode()).hexdigest()
    
    def _generate_issuer_signature(self, verification_data: Dict[str, Any]) -> str:
        """Generate issuer signature (simplified implementation)"""
        # In production, this would use proper cryptographic signing
        signature_data = f"UAE-NQF-{verification_data['credential_id']}-{datetime.now().isoformat()}"
        return hashlib.sha256(signature_data.encode()).hexdigest()
    
    def verify_digital_credential(self, credential_id: str) -> Dict[str, Any]:
        """Verify the authenticity of a digital credential"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                SELECT dc.*, nq.qualification_code, nq.title as qualification_title,
                       nq.nqf_level, u.full_name as holder_name, u.email as holder_email
                FROM digital_credentials dc
                JOIN nqf_qualifications nq ON dc.qualification_id = nq.id
                JOIN users u ON dc.holder_id = u.id
                WHERE dc.credential_id = %s
                """
                
                cursor.execute(query, (credential_id,))
                credential = cursor.fetchone()
                
                if not credential:
                    return {
                        "success": False,
                        "verified": False,
                        "message": "Credential not found"
                    }
                
                # Check if credential is still valid
                current_date = datetime.now()
                expiry_date = credential['expiry_date']
                
                if current_date > expiry_date:
                    return {
                        "success": True,
                        "verified": False,
                        "message": "Credential has expired",
                        "expiry_date": expiry_date.isoformat()
                    }
                
                # Verify hash integrity
                credential_data = json.loads(credential['credential_data'])
                expected_hash = self._create_verification_hash(credential_data)
                
                hash_valid = expected_hash == credential['verification_hash']
                
                verification_result = {
                    "credential_id": credential_id,
                    "verified": hash_valid and credential['status'] == 'active',
                    "holder": {
                        "name": credential['holder_name'],
                        "email": credential['holder_email']
                    },
                    "qualification": {
                        "code": credential['qualification_code'],
                        "title": credential['qualification_title'],
                        "nqf_level": credential['nqf_level']
                    },
                    "issued_date": credential['issued_date'].isoformat(),
                    "expiry_date": credential['expiry_date'].isoformat(),
                    "status": credential['status'],
                    "verification_timestamp": current_date.isoformat()
                }
                
                return {
                    "success": True,
                    "verification_result": verification_result,
                    "message": "Credential verification completed"
                }
                
        except Exception as e:
            logger.error(f"Error verifying digital credential: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to verify digital credential"
            }
    
    def get_qualification_pathways(self, current_nqf_level: int, 
                                 target_industry: str = None) -> Dict[str, Any]:
        """Get available qualification pathways for progression"""
        try:
            # Define progression pathways
            pathways = []
            
            # Vertical progression (higher NQF levels)
            for level in range(current_nqf_level + 1, 11):
                level_descriptor = self.nqf_descriptors[level]
                pathway = {
                    "pathway_type": "vertical_progression",
                    "target_nqf_level": level,
                    "title": level_descriptor["title"],
                    "description": level_descriptor["description"],
                    "credit_requirements": level_descriptor["credit_range"],
                    "estimated_duration_months": self._estimate_pathway_duration(current_nqf_level, level),
                    "prerequisites": self._get_pathway_prerequisites(current_nqf_level, level),
                    "career_opportunities": self._get_career_opportunities(level, target_industry)
                }
                pathways.append(pathway)
            
            # Horizontal progression (same level, different specializations)
            if target_industry:
                industry_mapping = self.industry_nqf_mapping.get(target_industry, {})
                for role_level, nqf_levels in industry_mapping.items():
                    if current_nqf_level in nqf_levels:
                        pathway = {
                            "pathway_type": "horizontal_specialization",
                            "target_nqf_level": current_nqf_level,
                            "specialization": role_level,
                            "industry": target_industry,
                            "description": f"Specialize in {role_level} roles within {target_industry}",
                            "credit_requirements": (30, 60),
                            "estimated_duration_months": 6,
                            "prerequisites": ["Current qualification in related field"],
                            "career_opportunities": self._get_career_opportunities(current_nqf_level, target_industry, role_level)
                        }
                        pathways.append(pathway)
            
            return {
                "success": True,
                "current_nqf_level": current_nqf_level,
                "target_industry": target_industry,
                "available_pathways": pathways,
                "total_pathways": len(pathways),
                "message": "Qualification pathways retrieved successfully"
            }
            
        except Exception as e:
            logger.error(f"Error getting qualification pathways: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve qualification pathways"
            }
    
    def _estimate_pathway_duration(self, current_level: int, target_level: int) -> int:
        """Estimate duration in months for pathway completion"""
        level_difference = target_level - current_level
        
        # Base duration estimates per level
        duration_mapping = {
            1: 6,   # 6 months per level for lower levels
            2: 8,   # 8 months for mid levels
            3: 12,  # 12 months for higher levels
            4: 18   # 18 months for advanced levels
        }
        
        if level_difference <= 2:
            base_duration = duration_mapping[1]
        elif level_difference <= 4:
            base_duration = duration_mapping[2]
        elif level_difference <= 6:
            base_duration = duration_mapping[3]
        else:
            base_duration = duration_mapping[4]
        
        return base_duration * level_difference
    
    def _get_pathway_prerequisites(self, current_level: int, target_level: int) -> List[str]:
        """Get prerequisites for pathway progression"""
        prerequisites = []
        
        if target_level > current_level + 1:
            prerequisites.append(f"Complete NQF Level {current_level + 1} qualification first")
        
        if target_level >= 6:
            prerequisites.append("Demonstrate professional competency")
        
        if target_level >= 8:
            prerequisites.append("Research experience or advanced professional practice")
        
        if target_level >= 9:
            prerequisites.append("Significant research contribution or innovation")
        
        return prerequisites
    
    def _get_career_opportunities(self, nqf_level: int, industry: str = None, 
                                role_level: str = None) -> List[str]:
        """Get career opportunities for NQF level and industry"""
        opportunities = []
        
        # General opportunities by NQF level
        level_opportunities = {
            1: ["Entry-level assistant", "Basic operator", "Support staff"],
            2: ["Junior technician", "Administrative assistant", "Customer service representative"],
            3: ["Technician", "Coordinator", "Supervisor"],
            4: ["Senior technician", "Team leader", "Specialist"],
            5: ["Advanced specialist", "Project coordinator", "Department supervisor"],
            6: ["Professional", "Manager", "Consultant"],
            7: ["Senior professional", "Senior manager", "Principal consultant"],
            8: ["Expert", "Director", "Senior consultant"],
            9: ["Research leader", "Executive", "Principal expert"],
            10: ["Thought leader", "C-level executive", "Distinguished expert"]
        }
        
        opportunities.extend(level_opportunities.get(nqf_level, []))
        
        # Industry-specific opportunities
        if industry and role_level:
            industry_roles = {
                "oil_and_gas": {
                    "entry_level": ["Field operator", "Safety assistant", "Maintenance helper"],
                    "technical": ["Process engineer", "Drilling technician", "Safety coordinator"],
                    "professional": ["Petroleum engineer", "Project manager", "HSE manager"],
                    "leadership": ["Operations director", "Chief engineer", "VP Operations"]
                },
                "finance": {
                    "entry_level": ["Bank teller", "Financial assistant", "Data entry clerk"],
                    "technical": ["Financial analyst", "Risk analyst", "Investment advisor"],
                    "professional": ["Portfolio manager", "Risk manager", "Financial controller"],
                    "leadership": ["Chief financial officer", "Investment director", "Bank president"]
                },
                "technology": {
                    "entry_level": ["IT support", "Junior developer", "System administrator"],
                    "technical": ["Software engineer", "System analyst", "DevOps engineer"],
                    "professional": ["Technical architect", "Product manager", "Engineering manager"],
                    "leadership": ["Chief technology officer", "VP Engineering", "Technical director"]
                }
            }
            
            if industry in industry_roles and role_level in industry_roles[industry]:
                opportunities.extend(industry_roles[industry][role_level])
        
        return opportunities
    
    def get_nqf_analytics(self, date_from: datetime = None, date_to: datetime = None) -> Dict[str, Any]:
        """Get NQF system analytics and statistics"""
        try:
            with self.connection.cursor() as cursor:
                # Set default date range
                if not date_from:
                    date_from = datetime.now() - timedelta(days=365)
                if not date_to:
                    date_to = datetime.now()
                
                # Get qualification statistics
                stats_query = """
                SELECT 
                    nqf_level,
                    qualification_type,
                    COUNT(*) as qualification_count,
                    AVG(credit_points) as avg_credits
                FROM nqf_qualifications
                WHERE created_at BETWEEN %s AND %s
                GROUP BY nqf_level, qualification_type
                ORDER BY nqf_level, qualification_type
                """
                
                cursor.execute(stats_query, (date_from, date_to))
                qualification_stats = cursor.fetchall()
                
                # Get credential statistics
                credential_query = """
                SELECT 
                    nq.nqf_level,
                    COUNT(dc.id) as credentials_issued,
                    COUNT(CASE WHEN dc.status = 'active' THEN 1 END) as active_credentials,
                    COUNT(CASE WHEN dc.expiry_date < CURRENT_DATE THEN 1 END) as expired_credentials
                FROM digital_credentials dc
                JOIN nqf_qualifications nq ON dc.qualification_id = nq.id
                WHERE dc.created_at BETWEEN %s AND %s
                GROUP BY nq.nqf_level
                ORDER BY nq.nqf_level
                """
                
                cursor.execute(credential_query, (date_from, date_to))
                credential_stats = cursor.fetchall()
                
                # Get competency mapping statistics
                mapping_query = """
                SELECT 
                    nqf_level,
                    COUNT(*) as mappings_count,
                    AVG(mapping_confidence) as avg_confidence,
                    AVG(mapping_score) as avg_score
                FROM nqf_competency_mappings
                WHERE mapped_at BETWEEN %s AND %s
                GROUP BY nqf_level
                ORDER BY nqf_level
                """
                
                cursor.execute(mapping_query, (date_from, date_to))
                mapping_stats = cursor.fetchall()
                
                return {
                    "success": True,
                    "date_range": {
                        "from": date_from.isoformat(),
                        "to": date_to.isoformat()
                    },
                    "qualification_statistics": [dict(row) for row in qualification_stats],
                    "credential_statistics": [dict(row) for row in credential_stats],
                    "mapping_statistics": [dict(row) for row in mapping_stats],
                    "nqf_levels": list(self.nqf_descriptors.keys()),
                    "total_levels": len(self.nqf_descriptors),
                    "message": "NQF analytics retrieved successfully"
                }
                
        except Exception as e:
            logger.error(f"Error retrieving NQF analytics: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve NQF analytics"
            }

# Health check function
def health_check(db_connection_string: str) -> Dict[str, Any]:
    """Check UAE NQF integration system health"""
    try:
        nqf_system = UAENQFIntegration(db_connection_string)
        nqf_system.connect_db()
        
        with nqf_system.connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM nqf_qualifications")
            qualification_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) FROM digital_credentials WHERE status = 'active'")
            active_credentials = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) FROM nqf_competency_mappings")
            mapping_count = cursor.fetchone()['count']
        
        nqf_system.close_db()
        
        return {
            "status": "healthy",
            "database_connected": True,
            "nqf_qualifications": qualification_count,
            "active_credentials": active_credentials,
            "competency_mappings": mapping_count,
            "nqf_levels_supported": len(nqf_system.nqf_descriptors),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "database_connected": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
