"""
JD Parser - AI-powered Job Description Document Parser
Emirati Journey Platform - Recruiter Services

Parses job description documents (PDF, DOCX, TXT) and extracts structured data.
"""

import logging
import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JDParser:
    """Parse job description documents and extract structured data"""
    
    def __init__(self):
        """Initialize JD Parser"""
        self.supported_formats = ['.pdf', '.docx', '.txt', '.doc']
        logger.info("JDParser initialized")
    
    def parse_document(self, file_path: str, file_content: Optional[str] = None) -> Dict[str, Any]:
        """
        Parse a job description document and extract structured data
        
        Args:
            file_path: Path to the document file
            file_content: Optional pre-extracted text content
            
        Returns:
            Dictionary with structured JD data
        """
        try:
            # Extract text from document if not provided
            if file_content is None:
                file_content = self._extract_text(file_path)
            
            # Parse using AI or rule-based extraction
            parsed_data = self._parse_with_ai(file_content)
            
            # Validate and structure the data
            structured_data = self._structure_data(parsed_data)
            
            logger.info(f"Successfully parsed document: {file_path}")
            return structured_data
            
        except Exception as e:
            logger.error(f"Error parsing document {file_path}: {e}")
            raise
    
    def parse_batch(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Parse multiple job description documents
        
        Args:
            files: List of file dictionaries with 'path' and optional 'content'
            
        Returns:
            List of structured JD data dictionaries
        """
        results = []
        for file_info in files:
            try:
                file_path = file_info.get('path')
                file_content = file_info.get('content')
                
                parsed = self.parse_document(file_path, file_content)
                parsed['source_file'] = file_path
                results.append(parsed)
                
            except Exception as e:
                logger.error(f"Error parsing file {file_info.get('path')}: {e}")
                results.append({
                    'error': str(e),
                    'source_file': file_info.get('path')
                })
        
        return results
    
    def _extract_text(self, file_path: str) -> str:
        """Extract text content from document file"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        
        elif file_ext == '.pdf':
            # Use PyPDF2 or pdfplumber
            try:
                import PyPDF2
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    text = ''
                    for page in reader.pages:
                        text += page.extract_text()
                    return text
            except ImportError:
                logger.warning("PyPDF2 not available, trying pdfplumber")
                try:
                    import pdfplumber
                    with pdfplumber.open(file_path) as pdf:
                        text = ''
                        for page in pdf.pages:
                            text += page.extract_text()
                        return text
                except ImportError:
                    raise ImportError("Neither PyPDF2 nor pdfplumber is available")
        
        elif file_ext in ['.docx', '.doc']:
            # Use python-docx
            try:
                from docx import Document
                doc = Document(file_path)
                text = '\n'.join([para.text for para in doc.paragraphs])
                return text
            except ImportError:
                raise ImportError("python-docx is not available")
        
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
    
    def _parse_with_ai(self, content: str) -> Dict[str, Any]:
        """
        Parse job description content using AI (Gemini)
        Falls back to rule-based parsing if AI is unavailable
        """
        # Try AI parsing first
        try:
            ai_result = self._ai_parse(content)
            if ai_result:
                return ai_result
        except Exception as e:
            logger.warning(f"AI parsing failed, falling back to rule-based: {e}")
        
        # Fallback to rule-based parsing
        return self._rule_based_parse(content)
    
    def _ai_parse(self, content: str) -> Optional[Dict[str, Any]]:
        """Parse using Gemini AI"""
        try:
            import google.generativeai as genai
            
            # Get API key from environment
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                logger.warning("GEMINI_API_KEY not found")
                return None
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-pro')
            
            prompt = f"""
Extract structured information from this job description and return it as JSON.

Job Description:
{content}

Extract the following fields:
1. job_title: The job title
2. department: Department or team
3. job_type: full_time, part_time, contract, internship, or temporary
4. job_level: entry, mid, senior, executive, manager, or director
5. emirate: Dubai, Abu Dhabi, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, or Fujairah
6. city: Specific city name
7. is_remote: true or false
8. description: Full job description (2-3 paragraphs)
9. requirements: Array of requirement objects with:
   - category: education, experience, skills, certification, or language
   - description: requirement text
   - is_required: true or false
10. responsibilities: Array of responsibility strings
11. benefits: Array of benefit objects with:
   - category: compensation, health, time_off, development, or perks
   - description: benefit text
12. salary_min: Minimum salary (number)
13. salary_max: Maximum salary (number)
14. salary_currency: Currency code (default: AED)

Return ONLY valid JSON, no markdown or explanations.
"""
            
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith('```'):
                result_text = re.sub(r'^```json?\s*', '', result_text)
                result_text = re.sub(r'\s*```$', '', result_text)
            
            parsed = json.loads(result_text)
            logger.info("Successfully parsed with AI")
            return parsed
            
        except Exception as e:
            logger.error(f"AI parsing error: {e}")
            return None
    
    def _rule_based_parse(self, content: str) -> Dict[str, Any]:
        """Parse using rule-based extraction"""
        logger.info("Using rule-based parsing")
        
        result = {
            'job_title': self._extract_title(content),
            'department': self._extract_department(content),
            'job_type': self._extract_job_type(content),
            'job_level': self._extract_job_level(content),
            'emirate': self._extract_emirate(content),
            'city': self._extract_city(content),
            'is_remote': self._extract_remote(content),
            'description': self._extract_description(content),
            'requirements': self._extract_requirements(content),
            'responsibilities': self._extract_responsibilities(content),
            'benefits': self._extract_benefits(content),
            'salary_min': self._extract_salary_min(content),
            'salary_max': self._extract_salary_max(content),
            'salary_currency': 'AED'
        }
        
        return result
    
    def _extract_title(self, content: str) -> str:
        """Extract job title from content"""
        # Look for common patterns
        patterns = [
            r'(?:job title|position|role):\s*(.+?)(?:\n|$)',
            r'^(.+?)(?:\n|$)',  # First line
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
            if match:
                title = match.group(1).strip()
                if len(title) < 100:  # Reasonable title length
                    return title
        
        return "Untitled Position"
    
    def _extract_department(self, content: str) -> str:
        """Extract department from content"""
        patterns = [
            r'(?:department|team|division):\s*(.+?)(?:\n|$)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_job_type(self, content: str) -> str:
        """Extract job type from content"""
        content_lower = content.lower()
        
        if 'full-time' in content_lower or 'full time' in content_lower:
            return 'full_time'
        elif 'part-time' in content_lower or 'part time' in content_lower:
            return 'part_time'
        elif 'contract' in content_lower:
            return 'contract'
        elif 'internship' in content_lower or 'intern' in content_lower:
            return 'internship'
        elif 'temporary' in content_lower or 'temp' in content_lower:
            return 'temporary'
        
        return 'full_time'  # Default
    
    def _extract_job_level(self, content: str) -> str:
        """Extract job level from content"""
        content_lower = content.lower()
        
        if 'director' in content_lower:
            return 'director'
        elif 'executive' in content_lower or 'c-level' in content_lower:
            return 'executive'
        elif 'manager' in content_lower or 'lead' in content_lower:
            return 'manager'
        elif 'senior' in content_lower or 'sr.' in content_lower:
            return 'senior'
        elif 'mid-level' in content_lower or 'intermediate' in content_lower:
            return 'mid'
        elif 'entry' in content_lower or 'junior' in content_lower or 'jr.' in content_lower:
            return 'entry'
        
        return 'mid'  # Default
    
    def _extract_emirate(self, content: str) -> str:
        """Extract emirate from content"""
        emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
        
        for emirate in emirates:
            if emirate.lower() in content.lower():
                return emirate
        
        return ""
    
    def _extract_city(self, content: str) -> str:
        """Extract city from content"""
        # For now, return emirate as city if found
        return self._extract_emirate(content)
    
    def _extract_remote(self, content: str) -> bool:
        """Extract remote work option from content"""
        content_lower = content.lower()
        return 'remote' in content_lower or 'work from home' in content_lower
    
    def _extract_description(self, content: str) -> str:
        """Extract job description from content"""
        # Look for description section
        patterns = [
            r'(?:job description|description|about the role):\s*(.+?)(?:\n\n|\n(?:requirements|responsibilities|qualifications))',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()
        
        # If no specific section found, take first few paragraphs
        paragraphs = content.split('\n\n')
        if len(paragraphs) > 1:
            return '\n\n'.join(paragraphs[1:3])
        
        return content[:500]  # First 500 chars as fallback
    
    def _extract_requirements(self, content: str) -> List[Dict[str, Any]]:
        """Extract requirements from content"""
        requirements = []
        
        # Look for requirements section
        req_match = re.search(
            r'(?:requirements|qualifications|required skills):\s*(.+?)(?:\n\n|\n(?:responsibilities|benefits|salary))',
            content,
            re.IGNORECASE | re.DOTALL
        )
        
        if req_match:
            req_text = req_match.group(1)
            # Split by bullet points or newlines
            items = re.split(r'[\n•\-\*]\s*', req_text)
            
            for item in items:
                item = item.strip()
                if len(item) > 10:  # Reasonable requirement length
                    requirements.append({
                        'category': self._categorize_requirement(item),
                        'description': item,
                        'is_required': 'required' in item.lower() or 'must' in item.lower()
                    })
        
        return requirements[:10]  # Limit to 10
    
    def _categorize_requirement(self, text: str) -> str:
        """Categorize a requirement"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['degree', 'bachelor', 'master', 'phd', 'education']):
            return 'education'
        elif any(word in text_lower for word in ['years', 'experience', 'worked']):
            return 'experience'
        elif any(word in text_lower for word in ['certified', 'certification', 'license']):
            return 'certification'
        elif any(word in text_lower for word in ['english', 'arabic', 'language', 'bilingual']):
            return 'language'
        else:
            return 'skills'
    
    def _extract_responsibilities(self, content: str) -> List[str]:
        """Extract responsibilities from content"""
        responsibilities = []
        
        # Look for responsibilities section
        resp_match = re.search(
            r'(?:responsibilities|duties|what you will do):\s*(.+?)(?:\n\n|\n(?:requirements|benefits|salary))',
            content,
            re.IGNORECASE | re.DOTALL
        )
        
        if resp_match:
            resp_text = resp_match.group(1)
            # Split by bullet points or newlines
            items = re.split(r'[\n•\-\*]\s*', resp_text)
            
            for item in items:
                item = item.strip()
                if len(item) > 10:  # Reasonable responsibility length
                    responsibilities.append(item)
        
        return responsibilities[:10]  # Limit to 10
    
    def _extract_benefits(self, content: str) -> List[Dict[str, str]]:
        """Extract benefits from content"""
        benefits = []
        
        # Look for benefits section
        ben_match = re.search(
            r'(?:benefits|what we offer|perks):\s*(.+?)(?:\n\n|$)',
            content,
            re.IGNORECASE | re.DOTALL
        )
        
        if ben_match:
            ben_text = ben_match.group(1)
            # Split by bullet points or newlines
            items = re.split(r'[\n•\-\*]\s*', ben_text)
            
            for item in items:
                item = item.strip()
                if len(item) > 5:  # Reasonable benefit length
                    benefits.append({
                        'category': self._categorize_benefit(item),
                        'description': item
                    })
        
        return benefits[:10]  # Limit to 10
    
    def _categorize_benefit(self, text: str) -> str:
        """Categorize a benefit"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['salary', 'bonus', 'compensation']):
            return 'compensation'
        elif any(word in text_lower for word in ['health', 'medical', 'insurance', 'dental']):
            return 'health'
        elif any(word in text_lower for word in ['vacation', 'leave', 'pto', 'holiday']):
            return 'time_off'
        elif any(word in text_lower for word in ['training', 'development', 'learning', 'course']):
            return 'development'
        else:
            return 'perks'
    
    def _extract_salary_min(self, content: str) -> Optional[int]:
        """Extract minimum salary from content"""
        # Look for salary patterns
        patterns = [
            r'(?:salary|compensation):\s*(?:AED|aed)?\s*(\d+(?:,\d+)?)\s*-\s*(?:AED|aed)?\s*\d+',
            r'(\d+(?:,\d+)?)\s*-\s*\d+(?:,\d+)?\s*(?:AED|aed)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                salary_str = match.group(1).replace(',', '')
                try:
                    return int(salary_str)
                except ValueError:
                    pass
        
        return None
    
    def _extract_salary_max(self, content: str) -> Optional[int]:
        """Extract maximum salary from content"""
        # Look for salary patterns
        patterns = [
            r'(?:salary|compensation):\s*(?:AED|aed)?\s*\d+(?:,\d+)?\s*-\s*(?:AED|aed)?\s*(\d+(?:,\d+)?)',
            r'\d+(?:,\d+)?\s*-\s*(\d+(?:,\d+)?)\s*(?:AED|aed)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                salary_str = match.group(1).replace(',', '')
                try:
                    return int(salary_str)
                except ValueError:
                    pass
        
        return None
    
    def _structure_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Structure and validate parsed data"""
        return {
            'basic_info': {
                'title': parsed_data.get('job_title', ''),
                'title_arabic': '',  # Can be translated later
                'department': parsed_data.get('department', ''),
                'job_type': parsed_data.get('job_type', 'full_time'),
                'job_level': parsed_data.get('job_level', 'mid'),
                'emirate': parsed_data.get('emirate', ''),
                'city': parsed_data.get('city', ''),
                'is_remote': parsed_data.get('is_remote', False)
            },
            'description': parsed_data.get('description', ''),
            'description_arabic': '',  # Can be translated later
            'requirements': parsed_data.get('requirements', []),
            'responsibilities': parsed_data.get('responsibilities', []),
            'benefits': parsed_data.get('benefits', []),
            'compensation': {
                'salary_min': parsed_data.get('salary_min'),
                'salary_max': parsed_data.get('salary_max'),
                'salary_currency': parsed_data.get('salary_currency', 'AED')
            },
            'parsed_at': datetime.now().isoformat(),
            'parsing_method': 'ai' if parsed_data.get('_ai_parsed') else 'rule_based'
        }


# Singleton instance
_jd_parser_instance = None

def get_jd_parser() -> JDParser:
    """Get or create JD Parser singleton instance"""
    global _jd_parser_instance
    if _jd_parser_instance is None:
        _jd_parser_instance = JDParser()
    return _jd_parser_instance

