"""
Educational Opportunity AI Processing Engine
Enhanced AI capabilities for educational programs, camps, scholarships, and training
"""

import os
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import google.generativeai as genai
from models.job import Job, EmploymentType, EducationalOpportunityDetails, AgeGroup, OpportunityCategory

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EducationalOpportunityAI:
    """AI-powered educational opportunity processing and enhancement"""
    
    def __init__(self):
        """Initialize the Educational Opportunity AI engine"""
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            logger.warning("⚠️ GEMINI_API_KEY not found. Educational AI features will be limited.")
            self.model = None
        else:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("✅ Educational Opportunity AI initialized with Gemini 2.5 Pro")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Gemini: {e}")
                self.model = None
    
    def enhance_educational_opportunity(self, opportunity_text: str, opportunity_type: EmploymentType) -> Dict[str, Any]:
        """
        Enhance educational opportunity description with AI-powered analysis
        """
        if not self.model:
            return self._fallback_enhancement(opportunity_text, opportunity_type)
        
        try:
            prompt = self._create_enhancement_prompt(opportunity_text, opportunity_type)
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                return self._parse_enhancement_response(response.text, opportunity_type)
            else:
                logger.warning("Empty response from Gemini for educational opportunity enhancement")
                return self._fallback_enhancement(opportunity_text, opportunity_type)
                
        except Exception as e:
            logger.error(f"Error enhancing educational opportunity: {e}")
            return self._fallback_enhancement(opportunity_text, opportunity_type)
    
    def _create_enhancement_prompt(self, opportunity_text: str, opportunity_type: EmploymentType) -> str:
        """Create AI prompt for educational opportunity enhancement"""
        
        opportunity_type_context = {
            EmploymentType.SUMMER_CAMP: "youth development summer program",
            EmploymentType.WINTER_CAMP: "youth development winter program", 
            EmploymentType.SCHOLARSHIP: "educational funding opportunity",
            EmploymentType.VOCATIONAL_TRAINING: "professional skill development program",
            EmploymentType.APPRENTICESHIP: "work-study learning program",
            EmploymentType.CERTIFICATION_PROGRAM: "professional certification course",
            EmploymentType.WORKSHOP: "short-term skill building session",
            EmploymentType.SEMINAR: "educational presentation or discussion",
            EmploymentType.MENTORSHIP_PROGRAM: "career guidance and support program",
            EmploymentType.BOOTCAMP: "intensive skill development program",
            EmploymentType.EXCHANGE_PROGRAM: "cultural and educational exchange"
        }
        
        context = opportunity_type_context.get(opportunity_type, "educational opportunity")
        
        return f"""
        As an expert in UAE educational programs and youth development, analyze this {context} description and provide comprehensive enhancements:

        ORIGINAL DESCRIPTION:
        {opportunity_text}

        Please provide a JSON response with the following structure:
        {{
            "enhanced_title": "Improved, engaging title",
            "enhanced_description": "Comprehensive, appealing description",
            "target_age_group": "youth_15_18|young_adult_18_25|adult_25_35|mid_career_35_45|senior_45_plus|all_ages",
            "age_range_min": number or null,
            "age_range_max": number or null,
            "program_duration": "Duration description (e.g., '2 weeks', '3 months')",
            "program_schedule": "Schedule type (e.g., 'Full-time', 'Part-time', 'Weekends')",
            "program_format": "Delivery format (e.g., 'In-person', 'Online', 'Hybrid')",
            "learning_outcomes": ["outcome1", "outcome2", "outcome3"],
            "skills_developed": ["skill1", "skill2", "skill3"],
            "academic_prerequisites": ["prerequisite1", "prerequisite2"],
            "application_requirements": ["requirement1", "requirement2"],
            "required_documents": ["document1", "document2"],
            "certification_offered": "Certificate or credential name",
            "estimated_cost": number or null,
            "financial_aid_available": true/false,
            "max_participants": number or null,
            "uae_relevance_score": number (1-100),
            "emiratization_alignment": true/false,
            "industry_alignment": ["industry1", "industry2"],
            "career_pathways": ["pathway1", "pathway2"],
            "quality_score": number (1-100),
            "recommendations": ["improvement1", "improvement2"]
        }}

        Focus on:
        1. UAE cultural context and national development goals
        2. Emiratization and youth empowerment
        3. Industry-relevant skills and career preparation
        4. Clear learning outcomes and progression pathways
        5. Accessibility and inclusivity
        6. Quality and professional standards
        """
    
    def _parse_enhancement_response(self, response_text: str, opportunity_type: EmploymentType) -> Dict[str, Any]:
        """Parse AI response for educational opportunity enhancement"""
        try:
            import json
            
            # Extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                logger.warning("No JSON found in AI response")
                return self._fallback_enhancement("", opportunity_type)
            
            json_str = response_text[start_idx:end_idx]
            parsed_data = json.loads(json_str)
            
            # Validate and structure the response
            enhancement_data = {
                'enhanced_title': parsed_data.get('enhanced_title', ''),
                'enhanced_description': parsed_data.get('enhanced_description', ''),
                'educational_details': {
                    'target_age_group': self._parse_age_group(parsed_data.get('target_age_group')),
                    'age_range_min': parsed_data.get('age_range_min'),
                    'age_range_max': parsed_data.get('age_range_max'),
                    'program_duration': parsed_data.get('program_duration'),
                    'program_schedule': parsed_data.get('program_schedule'),
                    'program_format': parsed_data.get('program_format'),
                    'learning_outcomes': parsed_data.get('learning_outcomes', []),
                    'skills_developed': parsed_data.get('skills_developed', []),
                    'academic_prerequisites': parsed_data.get('academic_prerequisites', []),
                    'application_requirements': parsed_data.get('application_requirements', []),
                    'required_documents': parsed_data.get('required_documents', []),
                    'certification_offered': parsed_data.get('certification_offered'),
                    'program_cost': parsed_data.get('estimated_cost'),
                    'financial_aid_available': parsed_data.get('financial_aid_available', False),
                    'max_participants': parsed_data.get('max_participants')
                },
                'analysis': {
                    'uae_relevance_score': parsed_data.get('uae_relevance_score', 0),
                    'emiratization_alignment': parsed_data.get('emiratization_alignment', False),
                    'industry_alignment': parsed_data.get('industry_alignment', []),
                    'career_pathways': parsed_data.get('career_pathways', []),
                    'quality_score': parsed_data.get('quality_score', 0),
                    'recommendations': parsed_data.get('recommendations', [])
                },
                'opportunity_category': OpportunityCategory.EDUCATION.value,
                'processing_timestamp': datetime.now().isoformat(),
                'ai_confidence': min(parsed_data.get('quality_score', 0), 100)
            }
            
            logger.info(f"✅ Successfully enhanced {opportunity_type.value} opportunity")
            return enhancement_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from AI response: {e}")
            return self._fallback_enhancement("", opportunity_type)
        except Exception as e:
            logger.error(f"Error parsing enhancement response: {e}")
            return self._fallback_enhancement("", opportunity_type)
    
    def _parse_age_group(self, age_group_str: str) -> Optional[AgeGroup]:
        """Parse age group string to enum"""
        if not age_group_str:
            return None
        
        age_group_mapping = {
            'youth_15_18': AgeGroup.YOUTH_15_18,
            'young_adult_18_25': AgeGroup.YOUNG_ADULT_18_25,
            'adult_25_35': AgeGroup.ADULT_25_35,
            'mid_career_35_45': AgeGroup.MID_CAREER_35_45,
            'senior_45_plus': AgeGroup.SENIOR_45_PLUS,
            'all_ages': AgeGroup.ALL_AGES
        }
        
        return age_group_mapping.get(age_group_str.lower())
    
    def _fallback_enhancement(self, opportunity_text: str, opportunity_type: EmploymentType) -> Dict[str, Any]:
        """Fallback enhancement when AI is not available"""
        
        # Basic enhancement based on opportunity type
        type_defaults = {
            EmploymentType.SUMMER_CAMP: {
                'target_age_group': AgeGroup.YOUTH_15_18,
                'program_duration': '2-4 weeks',
                'program_schedule': 'Full-time',
                'program_format': 'In-person',
                'skills_developed': ['Leadership', 'Teamwork', 'Communication'],
                'learning_outcomes': ['Personal development', 'Social skills', 'Cultural awareness']
            },
            EmploymentType.SCHOLARSHIP: {
                'target_age_group': AgeGroup.YOUNG_ADULT_18_25,
                'financial_aid_available': True,
                'application_requirements': ['Academic transcripts', 'Personal statement', 'References'],
                'required_documents': ['ID copy', 'Academic certificates', 'Financial documents']
            },
            EmploymentType.VOCATIONAL_TRAINING: {
                'target_age_group': AgeGroup.YOUNG_ADULT_18_25,
                'program_duration': '3-6 months',
                'program_schedule': 'Full-time',
                'certification_offered': 'Professional Certificate',
                'skills_developed': ['Technical skills', 'Industry knowledge', 'Practical experience']
            }
        }
        
        defaults = type_defaults.get(opportunity_type, {})
        
        return {
            'enhanced_title': opportunity_text[:100] if opportunity_text else f"{opportunity_type.value.replace('_', ' ').title()} Opportunity",
            'enhanced_description': opportunity_text or f"Exciting {opportunity_type.value.replace('_', ' ')} opportunity for UAE residents",
            'educational_details': {
                'target_age_group': defaults.get('target_age_group'),
                'program_duration': defaults.get('program_duration'),
                'program_schedule': defaults.get('program_schedule'),
                'program_format': defaults.get('program_format', 'In-person'),
                'learning_outcomes': defaults.get('learning_outcomes', []),
                'skills_developed': defaults.get('skills_developed', []),
                'academic_prerequisites': defaults.get('academic_prerequisites', []),
                'application_requirements': defaults.get('application_requirements', []),
                'required_documents': defaults.get('required_documents', []),
                'certification_offered': defaults.get('certification_offered'),
                'financial_aid_available': defaults.get('financial_aid_available', False)
            },
            'analysis': {
                'uae_relevance_score': 75,
                'emiratization_alignment': True,
                'quality_score': 70,
                'recommendations': ['Add more specific details', 'Include clear learning outcomes']
            },
            'opportunity_category': OpportunityCategory.EDUCATION.value,
            'processing_timestamp': datetime.now().isoformat(),
            'ai_confidence': 60
        }
    
    def analyze_opportunity_market_fit(self, opportunity: Job) -> Dict[str, Any]:
        """Analyze how well an educational opportunity fits UAE market needs"""
        if not self.model or not opportunity.is_educational_opportunity():
            return self._basic_market_analysis(opportunity)
        
        try:
            prompt = f"""
            As a UAE education and workforce development expert, analyze this educational opportunity for market fit:

            OPPORTUNITY: {opportunity.title}
            TYPE: {opportunity.employment_type.value}
            DESCRIPTION: {opportunity.description}
            
            Provide analysis in JSON format:
            {{
                "market_demand_score": number (1-100),
                "uae_alignment_score": number (1-100),
                "emiratization_impact": number (1-100),
                "industry_relevance": ["industry1", "industry2"],
                "target_demographics": ["demographic1", "demographic2"],
                "competitive_advantages": ["advantage1", "advantage2"],
                "improvement_suggestions": ["suggestion1", "suggestion2"],
                "success_probability": number (1-100),
                "recommended_enhancements": ["enhancement1", "enhancement2"]
            }}
            """
            
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                return self._parse_market_analysis(response.text)
            else:
                return self._basic_market_analysis(opportunity)
                
        except Exception as e:
            logger.error(f"Error analyzing market fit: {e}")
            return self._basic_market_analysis(opportunity)
    
    def _parse_market_analysis(self, response_text: str) -> Dict[str, Any]:
        """Parse market analysis response"""
        try:
            import json
            
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                return {'error': 'No JSON found in response'}
            
            json_str = response_text[start_idx:end_idx]
            return json.loads(json_str)
            
        except Exception as e:
            logger.error(f"Error parsing market analysis: {e}")
            return {'error': str(e)}
    
    def _basic_market_analysis(self, opportunity: Job) -> Dict[str, Any]:
        """Basic market analysis fallback"""
        return {
            'market_demand_score': 75,
            'uae_alignment_score': 80,
            'emiratization_impact': 85,
            'industry_relevance': ['Education', 'Technology'],
            'target_demographics': ['Youth', 'Young Adults'],
            'competitive_advantages': ['AI-powered platform', 'UAE-specific focus'],
            'success_probability': 80,
            'analysis_timestamp': datetime.now().isoformat()
        }

# Global instance
educational_ai_engine = EducationalOpportunityAI()

def enhance_educational_opportunity(opportunity_text: str, opportunity_type: EmploymentType) -> Dict[str, Any]:
    """Global function to enhance educational opportunities"""
    return educational_ai_engine.enhance_educational_opportunity(opportunity_text, opportunity_type)

def analyze_market_fit(opportunity: Job) -> Dict[str, Any]:
    """Global function to analyze market fit"""
    return educational_ai_engine.analyze_opportunity_market_fit(opportunity)
