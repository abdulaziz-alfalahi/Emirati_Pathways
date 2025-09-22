#!/usr/bin/env python3
"""
CV Parser with Gemini 2.5 Pro Integration
Emirati Journey Platform - Production Implementation
"""

import os
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
import tempfile
import mimetypes
from pathlib import Path

import google.generativeai as genai
from werkzeug.datastructures import FileStorage
import PyPDF2
import docx
from docx import Document

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CVParser:
    """CV Parser with Gemini 2.5 Pro integration for comprehensive CV analysis"""
    
    def __init__(self):
        """Initialize CV Parser with Gemini configuration"""
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            logger.error("GEMINI_API_KEY not found in environment variables")
            raise ValueError("GEMINI_API_KEY is required")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Supported file types
        self.supported_types = {
            'application/pdf': 'pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/msword': 'doc',
            'text/plain': 'txt'
        }
        
        # Create temp directory for file processing
        self.temp_dir = Path(tempfile.gettempdir()) / 'cv_parser'
        self.temp_dir.mkdir(exist_ok=True)
        
        logger.info("✅ CV Parser initialized with Gemini 2.5 Pro")
    
    def parse_cv_file(self, file: FileStorage, user_id: str = None) -> Dict[str, Any]:
        """Parse CV from uploaded file"""
        try:
            # Validate file
            if not file or not file.filename:
                return {
                    'success': False,
                    'message': 'No file provided'
                }
            
            # Check file type
            mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]
            if mime_type not in self.supported_types:
                return {
                    'success': False,
                    'message': f'Unsupported file type: {mime_type}. Supported: PDF, DOCX, DOC, TXT'
                }
            
            # Extract text from file
            text_content = self._extract_text_from_file(file, mime_type)
            if not text_content:
                return {
                    'success': False,
                    'message': 'Could not extract text from file'
                }
            
            # Parse the extracted text
            return self.parse_cv_text(text_content, user_id, file.filename)
            
        except Exception as e:
            logger.error(f"Error parsing CV file: {str(e)}")
            return {
                'success': False,
                'message': f'File parsing failed: {str(e)}'
            }
    
    def parse_cv_text(self, text: str, user_id: str = None, filename: str = None) -> Dict[str, Any]:
        """Parse CV from text content using Gemini 2.5 Pro"""
        try:
            if not text or len(text.strip()) < 50:
                return {
                    'success': False,
                    'message': 'Text content too short or empty'
                }
            
            # Generate CV ID
            cv_id = str(uuid.uuid4())
            
            # Create comprehensive prompt for Gemini
            prompt = self._create_parsing_prompt(text)
            
            # Call Gemini API
            response = self.model.generate_content(prompt)
            
            if not response or not response.text:
                return {
                    'success': False,
                    'message': 'Failed to get response from AI model'
                }
            
            # Parse Gemini response
            parsed_data = self._parse_gemini_response(response.text)
            
            if not parsed_data:
                return {
                    'success': False,
                    'message': 'Failed to parse AI response'
                }
            
            # Enhance with UAE-specific analysis
            enhanced_data = self._enhance_with_uae_analysis(parsed_data, text)
            
            # Calculate scores and insights
            analysis_results = self._calculate_cv_scores(enhanced_data, text)
            
            # Prepare final result
            result = {
                'success': True,
                'cv_id': cv_id,
                'data': {
                    'personal_info': enhanced_data.get('personal_info', {}),
                    'professional_summary': enhanced_data.get('professional_summary', ''),
                    'experience': enhanced_data.get('experience', []),
                    'education': enhanced_data.get('education', []),
                    'skills': enhanced_data.get('skills', []),
                    'languages': enhanced_data.get('languages', []),
                    'certifications': enhanced_data.get('certifications', []),
                    'achievements': enhanced_data.get('achievements', []),
                    'projects': enhanced_data.get('projects', []),
                    'references': enhanced_data.get('references', [])
                },
                'analysis': analysis_results,
                'metadata': {
                    'cv_id': cv_id,
                    'user_id': user_id,
                    'filename': filename,
                    'parsed_at': datetime.utcnow().isoformat(),
                    'parser_version': '2.0',
                    'ai_model': 'gemini-2.0-flash-exp',
                    'text_length': len(text),
                    'processing_time': None  # Will be calculated
                }
            }
            
            logger.info(f"✅ Successfully parsed CV {cv_id} for user {user_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error parsing CV text: {str(e)}")
            return {
                'success': False,
                'message': f'CV parsing failed: {str(e)}'
            }
    
    def _extract_text_from_file(self, file: FileStorage, mime_type: str) -> str:
        """Extract text content from uploaded file"""
        try:
            file_type = self.supported_types[mime_type]
            
            if file_type == 'pdf':
                return self._extract_from_pdf(file)
            elif file_type in ['docx', 'doc']:
                return self._extract_from_docx(file)
            elif file_type == 'txt':
                return file.read().decode('utf-8')
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
                
        except Exception as e:
            logger.error(f"Error extracting text from file: {str(e)}")
            return ""
    
    def _extract_from_pdf(self, file: FileStorage) -> str:
        """Extract text from PDF file"""
        try:
            # Save file temporarily
            temp_path = self.temp_dir / f"temp_{uuid.uuid4()}.pdf"
            file.save(str(temp_path))
            
            text = ""
            with open(temp_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            
            # Clean up
            temp_path.unlink(missing_ok=True)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting from PDF: {str(e)}")
            return ""
    
    def _extract_from_docx(self, file: FileStorage) -> str:
        """Extract text from DOCX file"""
        try:
            # Save file temporarily
            temp_path = self.temp_dir / f"temp_{uuid.uuid4()}.docx"
            file.save(str(temp_path))
            
            doc = Document(temp_path)
            text = ""
            
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            # Extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + " "
                    text += "\n"
            
            # Clean up
            temp_path.unlink(missing_ok=True)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting from DOCX: {str(e)}")
            return ""
    
    def _create_parsing_prompt(self, text: str) -> str:
        """Create comprehensive prompt for Gemini CV parsing"""
        return f"""
You are an expert CV/Resume parser specializing in UAE job market analysis. Parse the following CV text and extract structured information in JSON format.

IMPORTANT INSTRUCTIONS:
1. Extract ALL information accurately
2. Use UAE-specific formatting for phone numbers, addresses
3. Identify UAE work experience and education
4. Detect Arabic names and content
5. Calculate experience levels and skill proficiencies
6. Identify industry-specific keywords
7. Return ONLY valid JSON, no additional text

CV TEXT TO PARSE:
{text}

REQUIRED JSON STRUCTURE:
{{
    "personal_info": {{
        "full_name": "string",
        "first_name": "string", 
        "last_name": "string",
        "email": "string",
        "phone": "string",
        "address": "string",
        "city": "string",
        "emirate": "string (if UAE)",
        "country": "string",
        "nationality": "string",
        "date_of_birth": "string (YYYY-MM-DD if found)",
        "gender": "string (if mentioned)",
        "marital_status": "string (if mentioned)",
        "visa_status": "string (if mentioned)",
        "linkedin": "string",
        "portfolio": "string"
    }},
    "professional_summary": "string (extract or summarize)",
    "experience": [
        {{
            "company": "string",
            "position": "string",
            "start_date": "string (MM/YYYY)",
            "end_date": "string (MM/YYYY or 'Present')",
            "duration": "string (calculated)",
            "location": "string",
            "is_uae_experience": boolean,
            "description": "string",
            "achievements": ["string"],
            "technologies": ["string"],
            "industry": "string"
        }}
    ],
    "education": [
        {{
            "institution": "string",
            "degree": "string",
            "field_of_study": "string",
            "start_date": "string (YYYY)",
            "end_date": "string (YYYY)",
            "location": "string",
            "is_uae_education": boolean,
            "grade": "string (if mentioned)",
            "achievements": ["string"]
        }}
    ],
    "skills": [
        {{
            "name": "string",
            "category": "string (Technical/Soft/Language/Industry)",
            "proficiency": "string (Beginner/Intermediate/Advanced/Expert)",
            "years_experience": number,
            "is_certified": boolean
        }}
    ],
    "languages": [
        {{
            "language": "string",
            "proficiency": "string (Native/Fluent/Conversational/Basic)",
            "reading": "string",
            "writing": "string",
            "speaking": "string"
        }}
    ],
    "certifications": [
        {{
            "name": "string",
            "issuer": "string",
            "date_obtained": "string (MM/YYYY)",
            "expiry_date": "string (MM/YYYY if applicable)",
            "credential_id": "string (if mentioned)"
        }}
    ],
    "achievements": [
        {{
            "title": "string",
            "description": "string",
            "date": "string (YYYY)",
            "organization": "string"
        }}
    ],
    "projects": [
        {{
            "name": "string",
            "description": "string",
            "technologies": ["string"],
            "start_date": "string (MM/YYYY)",
            "end_date": "string (MM/YYYY)",
            "url": "string (if mentioned)"
        }}
    ],
    "references": [
        {{
            "name": "string",
            "position": "string",
            "company": "string",
            "phone": "string",
            "email": "string",
            "relationship": "string"
        }}
    ]
}}

Parse the CV text above and return the structured JSON data:
"""
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate Gemini response"""
        try:
            # Clean response text
            response_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            # Parse JSON
            parsed_data = json.loads(response_text)
            
            # Validate required fields
            required_fields = ['personal_info', 'experience', 'education', 'skills']
            for field in required_fields:
                if field not in parsed_data:
                    parsed_data[field] = [] if field != 'personal_info' else {}
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            logger.error(f"Response text: {response_text[:500]}...")
            return None
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            return None
    
    def _enhance_with_uae_analysis(self, data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Enhance parsed data with UAE-specific analysis"""
        try:
            # UAE experience analysis
            uae_experience_years = 0
            for exp in data.get('experience', []):
                if exp.get('is_uae_experience', False):
                    # Calculate years from duration or dates
                    duration = exp.get('duration', '')
                    if 'year' in duration.lower():
                        try:
                            years = float(duration.split()[0])
                            uae_experience_years += years
                        except:
                            uae_experience_years += 1
            
            # UAE education analysis
            uae_education = any(edu.get('is_uae_education', False) for edu in data.get('education', []))
            
            # Arabic language detection
            has_arabic = any(lang.get('language', '').lower() in ['arabic', 'العربية'] 
                           for lang in data.get('languages', []))
            
            # Add UAE-specific metadata
            data['uae_analysis'] = {
                'uae_experience_years': uae_experience_years,
                'has_uae_education': uae_education,
                'has_arabic_language': has_arabic,
                'is_uae_national': self._detect_uae_nationality(data.get('personal_info', {})),
                'emiratization_eligible': self._check_emiratization_eligibility(data)
            }
            
            return data
            
        except Exception as e:
            logger.error(f"Error in UAE analysis: {str(e)}")
            return data
    
    def _detect_uae_nationality(self, personal_info: Dict[str, Any]) -> bool:
        """Detect if candidate is UAE national"""
        nationality = personal_info.get('nationality', '').lower()
        return 'uae' in nationality or 'emirati' in nationality or 'emirates' in nationality
    
    def _check_emiratization_eligibility(self, data: Dict[str, Any]) -> bool:
        """Check if candidate is eligible for Emiratization programs"""
        uae_analysis = data.get('uae_analysis', {})
        personal_info = data.get('personal_info', {})
        
        # Basic eligibility criteria
        is_uae_national = uae_analysis.get('is_uae_national', False)
        has_education = len(data.get('education', [])) > 0
        
        return is_uae_national and has_education
    
    def _calculate_cv_scores(self, data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Calculate various CV quality and matching scores"""
        try:
            # Completeness score
            completeness = self._calculate_completeness_score(data)
            
            # Experience score
            experience_score = self._calculate_experience_score(data)
            
            # Skills score
            skills_score = self._calculate_skills_score(data)
            
            # UAE relevance score
            uae_score = self._calculate_uae_relevance_score(data)
            
            # Overall quality score
            overall_score = (completeness + experience_score + skills_score + uae_score) / 4
            
            return {
                'scores': {
                    'completeness': round(completeness, 2),
                    'experience': round(experience_score, 2),
                    'skills': round(skills_score, 2),
                    'uae_relevance': round(uae_score, 2),
                    'overall': round(overall_score, 2)
                },
                'insights': {
                    'total_experience_years': self._calculate_total_experience(data),
                    'skill_count': len(data.get('skills', [])),
                    'education_level': self._determine_education_level(data),
                    'industry_focus': self._determine_industry_focus(data),
                    'career_level': self._determine_career_level(data)
                },
                'recommendations': self._generate_recommendations(data, completeness)
            }
            
        except Exception as e:
            logger.error(f"Error calculating CV scores: {str(e)}")
            return {
                'scores': {'overall': 0},
                'insights': {},
                'recommendations': []
            }
    
    def _calculate_completeness_score(self, data: Dict[str, Any]) -> float:
        """Calculate CV completeness score (0-100)"""
        score = 0
        max_score = 100
        
        # Personal info (20 points)
        personal_info = data.get('personal_info', {})
        if personal_info.get('full_name'): score += 5
        if personal_info.get('email'): score += 5
        if personal_info.get('phone'): score += 5
        if personal_info.get('address'): score += 5
        
        # Professional summary (15 points)
        if data.get('professional_summary'): score += 15
        
        # Experience (25 points)
        experience = data.get('experience', [])
        if experience: score += 25
        
        # Education (15 points)
        education = data.get('education', [])
        if education: score += 15
        
        # Skills (15 points)
        skills = data.get('skills', [])
        if len(skills) >= 5: score += 15
        elif len(skills) >= 3: score += 10
        elif len(skills) >= 1: score += 5
        
        # Languages (5 points)
        if data.get('languages'): score += 5
        
        # Certifications (5 points)
        if data.get('certifications'): score += 5
        
        return min(score, max_score)
    
    def _calculate_experience_score(self, data: Dict[str, Any]) -> float:
        """Calculate experience quality score (0-100)"""
        experience = data.get('experience', [])
        if not experience:
            return 0
        
        score = 0
        
        # Total years of experience
        total_years = self._calculate_total_experience(data)
        if total_years >= 10: score += 40
        elif total_years >= 5: score += 30
        elif total_years >= 2: score += 20
        elif total_years >= 1: score += 10
        
        # Number of positions
        if len(experience) >= 5: score += 20
        elif len(experience) >= 3: score += 15
        elif len(experience) >= 2: score += 10
        else: score += 5
        
        # Career progression
        if self._has_career_progression(experience): score += 20
        
        # UAE experience bonus
        uae_analysis = data.get('uae_analysis', {})
        if uae_analysis.get('uae_experience_years', 0) > 0: score += 20
        
        return min(score, 100)
    
    def _calculate_skills_score(self, data: Dict[str, Any]) -> float:
        """Calculate skills quality score (0-100)"""
        skills = data.get('skills', [])
        if not skills:
            return 0
        
        score = 0
        
        # Number of skills
        skill_count = len(skills)
        if skill_count >= 15: score += 30
        elif skill_count >= 10: score += 25
        elif skill_count >= 5: score += 20
        else: score += 10
        
        # Skill diversity
        categories = set(skill.get('category', '') for skill in skills)
        if len(categories) >= 3: score += 25
        elif len(categories) >= 2: score += 15
        else: score += 5
        
        # Advanced skills
        advanced_skills = [s for s in skills if s.get('proficiency') in ['Advanced', 'Expert']]
        if len(advanced_skills) >= 5: score += 25
        elif len(advanced_skills) >= 3: score += 15
        elif len(advanced_skills) >= 1: score += 10
        
        # Certifications
        if data.get('certifications'): score += 20
        
        return min(score, 100)
    
    def _calculate_uae_relevance_score(self, data: Dict[str, Any]) -> float:
        """Calculate UAE market relevance score (0-100)"""
        score = 0
        uae_analysis = data.get('uae_analysis', {})
        
        # UAE nationality
        if uae_analysis.get('is_uae_national'): score += 30
        
        # UAE experience
        uae_exp_years = uae_analysis.get('uae_experience_years', 0)
        if uae_exp_years >= 5: score += 25
        elif uae_exp_years >= 2: score += 15
        elif uae_exp_years > 0: score += 10
        
        # UAE education
        if uae_analysis.get('has_uae_education'): score += 15
        
        # Arabic language
        if uae_analysis.get('has_arabic_language'): score += 15
        
        # Emiratization eligibility
        if uae_analysis.get('emiratization_eligible'): score += 15
        
        return min(score, 100)
    
    def _calculate_total_experience(self, data: Dict[str, Any]) -> float:
        """Calculate total years of experience"""
        total_years = 0
        for exp in data.get('experience', []):
            duration = exp.get('duration', '')
            if 'year' in duration.lower():
                try:
                    years = float(duration.split()[0])
                    total_years += years
                except:
                    total_years += 1
        return total_years
    
    def _has_career_progression(self, experience: List[Dict[str, Any]]) -> bool:
        """Check if there's evidence of career progression"""
        if len(experience) < 2:
            return False
        
        # Simple check for senior/manager titles in recent positions
        recent_positions = experience[:2]  # Assuming sorted by recency
        senior_keywords = ['senior', 'manager', 'director', 'lead', 'head', 'chief']
        
        return any(any(keyword in pos.get('position', '').lower() for keyword in senior_keywords)
                  for pos in recent_positions)
    
    def _determine_education_level(self, data: Dict[str, Any]) -> str:
        """Determine highest education level"""
        education = data.get('education', [])
        if not education:
            return 'Not specified'
        
        degrees = [edu.get('degree', '').lower() for edu in education]
        
        if any('phd' in deg or 'doctorate' in deg for deg in degrees):
            return 'Doctorate'
        elif any('master' in deg or 'mba' in deg for deg in degrees):
            return 'Masters'
        elif any('bachelor' in deg or 'degree' in deg for deg in degrees):
            return 'Bachelors'
        elif any('diploma' in deg for deg in degrees):
            return 'Diploma'
        else:
            return 'Other'
    
    def _determine_industry_focus(self, data: Dict[str, Any]) -> str:
        """Determine primary industry focus"""
        experience = data.get('experience', [])
        if not experience:
            return 'Not specified'
        
        # Get industries from recent experience
        industries = [exp.get('industry', '') for exp in experience[:3]]
        industries = [ind for ind in industries if ind]
        
        if industries:
            # Return most common or most recent
            return industries[0]
        
        return 'Not specified'
    
    def _determine_career_level(self, data: Dict[str, Any]) -> str:
        """Determine career level based on experience and positions"""
        total_years = self._calculate_total_experience(data)
        experience = data.get('experience', [])
        
        if total_years >= 15:
            return 'Executive'
        elif total_years >= 8:
            return 'Senior'
        elif total_years >= 3:
            return 'Mid-level'
        elif total_years >= 1:
            return 'Junior'
        else:
            return 'Entry-level'
    
    def _generate_recommendations(self, data: Dict[str, Any], completeness_score: float) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        if completeness_score < 80:
            if not data.get('professional_summary'):
                recommendations.append("Add a professional summary to highlight your key strengths")
            
            if not data.get('skills') or len(data.get('skills', [])) < 5:
                recommendations.append("Add more skills to improve your profile visibility")
            
            if not data.get('certifications'):
                recommendations.append("Include relevant certifications to strengthen your profile")
        
        uae_analysis = data.get('uae_analysis', {})
        if not uae_analysis.get('uae_experience_years', 0):
            recommendations.append("Consider highlighting any UAE-related experience or projects")
        
        if not uae_analysis.get('has_arabic_language'):
            recommendations.append("Consider adding Arabic language skills for UAE market advantage")
        
        return recommendations
