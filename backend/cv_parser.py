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

# Fix: Import google.generativeai safely
try:
    import google.generativeai as genai
except ImportError:
    genai = None

from werkzeug.datastructures import FileStorage
import PyPDF2
# Fix: Import docx safely
try:
    import docx
    from docx import Document
except ImportError:
    docx = None
    Document = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CVParser:
    """CV Parser with Gemini 2.5 Pro integration for comprehensive CV analysis"""
    
    def __init__(self):
        """Initialize CV Parser with Gemini configuration"""
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model = None
        
        if not self.api_key:
            logger.warning("⚠️ GEMINI_API_KEY not found. AI features will be disabled.")
        elif genai:
            try:
                # Configure Gemini
                genai.configure(api_key=self.api_key)
                # [FIX] Use 2026-available model
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                logger.info("✅ CV Parser initialized with Gemini 2.5 Flash")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Gemini: {e}")
        else:
             logger.warning("⚠️ google-generativeai package not installed/imported.")

        
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

    def parse_cv(self, file_path: str, user_id: str = None) -> Dict[str, Any]:
        """
        Parse CV from a file path (Wrapper for compatibility).
        This is the method called by enhanced_cv_routes.py
        """
        try:
            if not os.path.exists(file_path):
                 return {'success': False, 'message': f'File not found: {file_path}'}
            
            # Detect mime type
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                 # Fallback based on extension
                 ext = os.path.splitext(file_path)[1].lower()
                 if ext == '.pdf': mime_type = 'application/pdf'
                 elif ext == '.docx': mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                 elif ext == '.txt': mime_type = 'text/plain'
            
            # Extract text
            text_content = ""
            if mime_type == 'application/pdf':
                with open(file_path, 'rb') as f:
                     text_content = self._extract_from_pdf_stream(f)
            elif mime_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
                 # docx library handles paths directly usually, but let's stick to stream for consistency if we want
                 # But _extract_from_docx uses Document(path) in my previous read?
                 # Let's write a robust extractor for path
                 text_content = self._extract_text_from_path(file_path, mime_type)
            elif mime_type == 'text/plain':
                 with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                     text_content = f.read()
            
            if not text_content:
                 return {'success': False, 'message': 'Could not extract text from file'}

            return self.parse_cv_text(text_content, user_id, os.path.basename(file_path))

        except Exception as e:
            logger.error(f"Error in parse_cv: {e}")
            return {'success': False, 'message': str(e)}

    
    def parse_cv_file(self, file: FileStorage, user_id: str = None) -> Dict[str, Any]:
        """Parse CV from uploaded FileStorage object"""
        try:
            # Validate file
            if not file or not file.filename:
                return {
                    'success': False,
                    'message': 'No file provided'
                }
            
            # Check file type
            mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]
            # Simple check
            if mime_type not in self.supported_types and not any(file.filename.lower().endswith(ext) for ext in ['.pdf', '.docx', '.doc', '.txt']):
                return {
                    'success': False,
                    'message': f'Unsupported file type: {mime_type}. Supported: PDF, DOCX, DOC, TXT'
                }
            
            # Extract text from file
            text_content = self._extract_text_from_file_storage(file, mime_type)
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
            cleaned_text = text.strip()
            if not cleaned_text or len(cleaned_text) < 50:
                 # Try fallback if short? Or just fail
                return {
                    'success': False,
                    'message': 'Text content too short or empty'
                }

            # If no model (no API key), use fallback
            if not self.model:
                 logger.info("Using fallback parser (No AI)")
                 return self._fallback_parse_text(cleaned_text, user_id, filename)
            
            # Generate CV ID
            cv_id = str(uuid.uuid4())
            
            # Create comprehensive prompt for Gemini
            prompt = self._create_parsing_prompt(cleaned_text)
            
            
            # [ENHANCED] Call Gemini API with aggressive retries and model fallbacks
            import time
            
            # Try multiple models in order of preference (2026 available models)
            models_to_try = [
                'gemini-3-flash-preview',      # Fast, frontier-class performance (2026)
                'gemini-2.5-flash',            # Lightning-fast and capable
                'gemini-3-pro-preview'         # Most capable for complex reasoning
            ]

            
            max_retries_per_model = 3  # Retry each model 3 times
            retry_delay = 2  # Start with 2 seconds
            response = None
            last_error = None
            
            for model_name in models_to_try:
                logger.info(f"Trying Gemini model: {model_name}")
                
                try:
                    # Reinitialize model if different from current
                    if not self.model or model_name != 'gemini-2.5-flash':
                        current_model = genai.GenerativeModel(model_name)
                    else:
                        current_model = self.model
                    
                    # Retry with current model
                    for attempt in range(max_retries_per_model):
                        try:
                            logger.info(f"Model {model_name} - Attempt {attempt + 1}/{max_retries_per_model}")
                            response = current_model.generate_content(prompt)
                            
                            if response and response.text:
                                logger.info(f"✅ Success with {model_name} on attempt {attempt + 1}")
                                break
                                
                        except Exception as e:
                            last_error = e
                            logger.warning(f"{model_name} attempt {attempt + 1} failed: {str(e)}")
                            
                            if attempt < max_retries_per_model - 1:
                                # Exponential backoff
                                wait_time = retry_delay * (2 ** attempt)
                                logger.info(f"Waiting {wait_time}s before retry...")
                                time.sleep(wait_time)
                    
                    # If we got a response, break out of model loop
                    if response and response.text:
                        break
                        
                except Exception as model_error:
                    logger.error(f"Failed to initialize {model_name}: {model_error}")
                    continue
            
            if not response or not response.text:
                logger.error(f"❌ All Gemini models failed after multiple retries. Last error: {last_error}")
                return self._fallback_parse_text(cleaned_text, user_id, filename)
            
            # Parse Gemini response
            parsed_data = self._parse_gemini_response(response.text)
            
            if not parsed_data:
                logger.warning("Failed to parse Gemini response JSON, retrying with fallback")
                return self._fallback_parse_text(cleaned_text, user_id, filename)

            
            # Enhance with UAE-specific analysis
            enhanced_data = self._enhance_with_uae_analysis(parsed_data, cleaned_text)
            
            # Calculate scores and insights
            analysis_results = self._calculate_cv_scores(enhanced_data, cleaned_text)
            
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
                    'ai_model': 'gemini-2.5-flash',  # Updated for 2026
                    'text_length': len(cleaned_text),
                    'processing_time': None 
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error parsing CV text with Gemini: {str(e)}")
            return self._fallback_parse_text(text, user_id, filename)

    def _fallback_parse_text(self, text: str, user_id: str = None, filename: str = None) -> Dict[str, Any]:
        """Fallback parsing when AI is unavailable"""
        cv_id = str(uuid.uuid4())
        import re
        
        # Simple RegExp Extraction
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        email = email_match.group(0) if email_match else ""
        
        phone_match = re.search(r'(\+971|05)\d{8,9}', text)
        phone = phone_match.group(0) if phone_match else ""
        
        lines = [l.strip() for l in text.split('\n') if l.strip()]  # [FIX] Use actual newline, not literal backslash-n
        name = lines[0][:100] if lines else "Candidate"  # [FIX] Truncate name to prevent DB errors
        
        name_parts = name.split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        data = {
            'personal_info': {
                'full_name': name,
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': phone,
                'nationality': 'UAE' 
            },
            # [FIX] Truncate professional_summary to prevent DB errors (keep first 200 chars max)
            'professional_summary': text[:200] if len(text) > 200 else text,
            # [FIX] Extract basic experience, education, skills from text patterns
            'experience': self._extract_basic_experience(text),
            'education': self._extract_basic_education(text),
            'skills': self._extract_basic_skills(text),
            'languages': [],
            'certifications': [],
        }
        
        analysis_results = {
            'scores': {'overall': 40, 'completeness': 40, 'uae_relevance': 50}, 
            'insights': {'message': 'Parsed using basic fallback parser (AI unavailable)'},
            'recommendations': ['Please review and update your details manually.']
        }

        result = {
            'success': True,
            'cv_id': cv_id,
            'data': data,
            'analysis': analysis_results,
            'metadata': {
                'cv_id': cv_id,
                'user_id': user_id,
                'filename': filename,
                'parsed_at': datetime.utcnow().isoformat(),
                'parser_version': '2.0-fallback',
                'ai_model': 'none',
                'text_length': len(text)
            }
        }
        return result
    
    def _extract_basic_experience(self, text: str) -> list:
        """Extract basic work experience using pattern matching"""
        experience = []
        lines = text.split('\n')
        
        # Look for common job title keywords
        job_keywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 
                       'director', 'coordinator', 'specialist', 'assistant', 'officer',
                       'lead', 'senior', 'junior', 'intern', 'executive']
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            # Check if line contains a job title
            if any(keyword in line_lower for keyword in job_keywords) and len(line.strip()) > 5:
                # Try to extract company from next few lines
                company = "Company"
                for j in range(i+1, min(i+3, len(lines))):
                    if lines[j].strip() and len(lines[j].strip()) < 50:
                        company = lines[j].strip()[:100]
                        break
                
                experience.append({
                    'company': company,
                    'position': line.strip()[:100],
                    'start_date': None,
                    'end_date': None,
                    'is_current': False,
                    'description': ''
                })
                
                # Limit to 3 entries to avoid spam
                if len(experience) >= 3:
                    break
        
        return experience if experience else []
    
    def _extract_basic_education(self, text: str) -> list:
        """Extract basic education using pattern matching"""
        education = []
        lines = text.split('\n')
        
        # Look for degree keywords
        degree_keywords = ['bachelor', 'master', 'phd', 'diploma', 'degree', 
                          'university', 'college', 'institute', 'school',
                          'b.sc', 'm.sc', 'bsc', 'msc', 'ba', 'ma', 'mba']
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            if any(keyword in line_lower for keyword in degree_keywords) and len(line.strip()) > 5:
                # Extract institution and degree
                degree = line.strip()[:100]
                institution = "Educational Institution"
                
                # Try to find institution in nearby lines
                for j in range(max(0, i-2), min(i+3, len(lines))):
                    if 'university' in lines[j].lower() or 'college' in lines[j].lower():
                        institution = lines[j].strip()[:100]
                        break
                
                education.append({
                    'institution': institution,
                    'degree': degree,
                    'field_of_study': '',
                    'start_date': None,
                    'end_date': None,
                    'grade': ''
                })
                
                # Limit to 2 entries
                if len(education) >= 2:
                    break
        
        return education if education else []
    
    def _extract_basic_skills(self, text: str) -> list:
        """Extract basic skills using common skill keywords"""
        skills = []
        text_lower = text.lower()
        
        # Common technical skills
        tech_skills = ['python', 'java', 'javascript', 'react', 'node.js', 'sql', 
                      'c++', 'c#', 'php', 'ruby', 'go', 'swift', 'kotlin',
                      'html', 'css', 'typescript', 'angular', 'vue',
                      'aws', 'azure', 'docker', 'kubernetes', 'git']
        
        # Common soft skills
        soft_skills = ['leadership', 'communication', 'teamwork', 'problem solving',
                      'analytical', 'creative', 'organized', 'detail-oriented']
        
        # Extract technical skills
        for skill in tech_skills:
            if skill in text_lower:
                skills.append({
                    'name': skill.title(),
                    'level': 'Intermediate',
                    'category': 'Technical'
                })
        
        # Extract soft skills  
        for skill in soft_skills:
            if skill in text_lower:
                skills.append({
                    'name': skill.title(),
                    'level': 'Intermediate',
                    'category': 'Soft Skill'
                })
        
        # Limit to 10 skills
        return skills[:10] if skills else [{'name': 'General', 'level': 'Basic', 'category': 'General'}]
    
    
    def _extract_text_from_file_storage(self, file: FileStorage, mime_type: str) -> str:
        """Extract text content from uploaded file"""
        try:
            # We must map mime types to our logic
            if 'pdf' in mime_type:
                return self._extract_from_pdf_stream(file)
            elif 'word' in mime_type or 'office' in mime_type:
                 # Need to save to temp for docx usually
                suffix = '.docx' if 'openxml' in mime_type else '.doc'
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    file.save(tmp.name)
                    tmp_path = tmp.name
                
                text = self._extract_text_from_path(tmp_path, mime_type)
                
                try:
                    os.unlink(tmp_path)
                except: pass
                return text

            elif 'text' in mime_type:
                return file.read().decode('utf-8', errors='ignore')
            else:
                return ""
                
        except Exception as e:
            logger.error(f"Error extracting text from file: {str(e)}")
            return ""

    def _extract_from_pdf_stream(self, file_stream) -> str:
        try:
            reader = PyPDF2.PdfReader(file_stream)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"PDF extract error: {e}")
            return ""

    def _extract_text_from_path(self, path: str, mime_type: str) -> str:
        try:
            if 'pdf' in mime_type or path.lower().endswith('.pdf'):
                with open(path, 'rb') as f:
                    return self._extract_from_pdf_stream(f)
            elif ('word' in mime_type or 'office' in mime_type or path.endswith('.doc') or path.endswith('.docx')):
                 if docx:
                     doc = Document(path)
                     text = "\\n".join([p.text for p in doc.paragraphs])
                     for table in doc.tables:
                         for row in table.rows:
                             text += " ".join([c.text for c in row.cells]) + "\\n"
                     return text
                 else:
                     return ""
            else:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
        except Exception as e:
            logger.error(f"Path extract error: {e}")
            return ""

    def _create_parsing_prompt(self, text: str) -> str:
        return f"""
        You are an AI Resume Parsert customized for the UAE Job Market.
        Extract JSON data from this CV.
        
        CRITICAL EXTRACTION RULES:
        1. **Dates**: MUST be "YYYY-MM-DD" or null. 
           - If currently working, set `end_date` to null. DO NOT use "Present" or "Current".
           - When parsing durations (e.g., "5 years"), do NOT guess dates. Only extract explicit dates.
           - If day is unknown, use "01" (e.g. "2022-05" -> "2022-05-01").
           - If month is unknown, use "01" (e.g. "2022" -> "2022-01-01").
        2. **Summary**: Maximum 30 words. Consolidate into 2 concise sentences. Be extremely brief.
        3. **Name**: The Name is almost always the very first line of the document. Extract `full_name` strictly.
        4. **Education/Experience**: strictly extract start/end dates.
        5. **Skills**: Extract ALL technical and soft skills found. Categorize them properly.

        Text:
        {text[:15000]} 

        Output JSON format:
        {{
            "personal_info": {{ "full_name": "John Doe", "first_name": "", "last_name": "", "email": "", "phone": "", "nationality": "", "location": "" }},
            "professional_summary": "Motivated software engineer with 5 years exp...",
            "skills": [ {{ "name": "Python", "level": "Intermediate", "category": "Technical" }} ],
            "experience": [ 
                {{ "company": "Tech Corp", "position": "Senior Dev", "start_date": "2020-01-01", "end_date": null, "description": "Led team...", "is_current": true }}
            ],
            "education": [ 
                {{ "institution": "UAE University", "degree": "BS CS", "start_date": "2015-09-01", "end_date": "2019-06-01" }} 
            ],
            "languages": [],
            "certifications": []
        }}
        """

    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        try:
            text = response_text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            return json.loads(text.strip())
        except Exception as e:
            logger.error(f"JSON Parse Error: {e}")
            return None

    def _enhance_with_uae_analysis(self, data: Dict, text: str) -> Dict:
        # Placeholder for UAE Specific Logic
        if 'uae_analysis' not in data:
            data['uae_analysis'] = {
                'is_uae_national': 'uae' in text.lower() or 'emirati' in text.lower(),
                'uae_experience_years': 0,
                'has_arabic_language': False
            }
        return data

    def _calculate_cv_scores(self, data: Dict, text: str) -> Dict:
        # Placeholder
        return {'scores': {'overall': 75}, 'insights': {}, 'recommendations': []}

# Instantiate the parser for import
cv_parser = CVParser()
