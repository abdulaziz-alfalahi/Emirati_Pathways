#!/usr/bin/env python3
"""
Enhanced Job Description Parser with Bilingual Support
Emirati Journey Platform — Qwen Migration

Uses qwen-plus via DashScope for structured JD extraction.
"""

import os
import sys
import json
import argparse
import logging
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import fitz  # PyMuPDF

# Qwen / DashScope client (replaces google.generativeai)
from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
from backend.config.qwen_config import DASHSCOPE_API_KEY

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configure logging with Windows-safe format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class JobDescriptionParser:
    def __init__(self):
        """Initialize the JD parser with Qwen client."""
        if not DASHSCOPE_API_KEY:
            raise ValueError("DASHSCOPE_API_KEY environment variable is required")
        logger.info("SUCCESS: JD Parser initialized with Qwen / DashScope (qwen-plus)")
    
    def safe_console_output(self, text: str) -> str:
        """Convert text to Windows-safe console output."""
        if not text:
            return "[Empty]"
        
        # For console output, handle non-ASCII characters safely
        try:
            text.encode('ascii')
            return text
        except UnicodeEncodeError:
            return f"[Non-ASCII text - {len(text)} characters]"
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF file."""
        try:
            doc = fitz.open(pdf_path)
            text = ""
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                text += page.get_text()
            
            doc.close()
            
            if not text.strip():
                logger.warning("WARNING: No text extracted from PDF")
                return ""
            
            logger.info(f"SUCCESS: Extracted {len(text)} characters from PDF")
            return text.strip()
            
        except Exception as e:
            logger.error(f"ERROR: Failed to extract text from PDF: {str(e)}")
            return ""
    
    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from various file formats."""
        file_path = Path(file_path)
        
        if not file_path.exists():
            logger.error(f"ERROR: File not found: {file_path}")
            return ""
        
        try:
            if file_path.suffix.lower() == '.pdf':
                return self.extract_text_from_pdf(str(file_path))
            elif file_path.suffix.lower() in ['.txt', '.md']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                logger.info(f"SUCCESS: Read {len(text)} characters from text file")
                return text.strip()
            elif file_path.suffix.lower() in ['.doc', '.docx']:
                logger.warning("WARNING: Word document support requires python-docx library")
                return ""
            else:
                logger.error(f"ERROR: Unsupported file format: {file_path.suffix}")
                return ""
                
        except Exception as e:
            logger.error(f"ERROR: Failed to extract text from file: {str(e)}")
            return ""
    
    def detect_language(self, text: str) -> str:
        """Detect the language of the job description text."""
        if not text:
            return "unknown"
        
        arabic_chars = sum(1 for char in text if '\u0600' <= char <= '\u06FF')
        total_chars = len([char for char in text if char.isalpha()])
        
        if total_chars == 0:
            return "unknown"
        
        arabic_ratio = arabic_chars / total_chars
        
        if arabic_ratio > 0.3:
            return "ar"
        else:
            return "en"
    
    def parse_jd_section(self, text: str, section_name: str, language: str) -> Dict[str, Any]:
        """Parse a specific section of the job description using Qwen via DashScope."""
        
        # Define section-specific prompts (system + user message pairs)
        section_configs = {
            "basic_info": {
                "system": (
                    "You are an expert Job Description Parser for the UAE job market. "
                    "Extract basic job information. Return ONLY raw, valid JSON. "
                    "No markdown, no code fences. Field keys in English."
                ),
                "prompts": {
                    "en": """Extract basic job information from this job description text. Return ONLY a JSON object with these exact fields:
{
  "title": "job title",
  "company": "company name", 
  "location": "job location",
  "employment_type": "full-time/part-time/contract/internship",
  "work_mode": "on-site/remote/hybrid",
  "description": "job description summary"
}

Job Description Text:
""",
                    "ar": """استخرج المعلومات الأساسية للوظيفة من نص الوصف الوظيفي. أرجع فقط كائن JSON بهذه الحقول:
{
  "title": "المسمى الوظيفي",
  "company": "اسم الشركة",
  "location": "موقع العمل", 
  "employment_type": "دوام كامل/دوام جزئي/عقد/تدريب",
  "work_mode": "في الموقع/عن بعد/مختلط",
  "description": "ملخص الوصف الوظيفي"
}

نص الوصف الوظيفي:
"""
                }
            },
            "requirements": {
                "system": (
                    "You are an expert Job Description Parser for the UAE job market. "
                    "Extract job requirements. Return ONLY raw, valid JSON. "
                    "No markdown, no code fences. Field keys in English."
                ),
                "prompts": {
                    "en": """Extract job requirements from this job description text. Return ONLY a JSON object with these exact fields:
{
  "education": ["education requirement 1", "education requirement 2"],
  "experience": ["experience requirement 1", "experience requirement 2"], 
  "skills": ["skill 1", "skill 2", "skill 3"],
  "languages": ["language 1", "language 2"],
  "certifications": ["certification 1", "certification 2"]
}

Job Description Text:
""",
                    "ar": """استخرج متطلبات الوظيفة من نص الوصف الوظيفي. أرجع فقط كائن JSON بهذه الحقول:
{
  "education": ["متطلب تعليمي 1", "متطلب تعليمي 2"],
  "experience": ["متطلب خبرة 1", "متطلب خبرة 2"],
  "skills": ["مهارة 1", "مهارة 2", "مهارة 3"], 
  "languages": ["لغة 1", "لغة 2"],
  "certifications": ["شهادة 1", "شهادة 2"]
}

نص الوصف الوظيفي:
"""
                }
            },
            "responsibilities": {
                "system": (
                    "You are an expert Job Description Parser for the UAE job market. "
                    "Extract job responsibilities. Return ONLY raw, valid JSON. "
                    "No markdown, no code fences."
                ),
                "prompts": {
                    "en": """Extract job responsibilities and duties from this job description text. Return ONLY a JSON object with this exact field:
{
  "responsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"]
}

Job Description Text:
""",
                    "ar": """استخرج المسؤوليات والواجبات الوظيفية من نص الوصف الوظيفي. أرجع فقط كائن JSON بهذا الحقل:
{
  "responsibilities": ["مسؤولية 1", "مسؤولية 2", "مسؤولية 3"]
}

نص الوصف الوظيفي:
"""
                }
            },
            "benefits": {
                "system": (
                    "You are an expert Job Description Parser for the UAE job market. "
                    "Extract job benefits and compensation. Return ONLY raw, valid JSON. "
                    "No markdown, no code fences."
                ),
                "prompts": {
                    "en": """Extract job benefits, compensation, and perks from this job description text. Return ONLY a JSON object with these exact fields:
{
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "salary": null,
  "application_deadline": null
}

Job Description Text:
""",
                    "ar": """استخرج المزايا والتعويضات والامتيازات من نص الوصف الوظيفي. أرجع فقط كائن JSON بهذه الحقول:
{
  "benefits": ["ميزة 1", "ميزة 2", "ميزة 3"],
  "salary": null,
  "application_deadline": null
}

نص الوصف الوظيفي:
"""
                }
            }
        }
        
        config = section_configs.get(section_name)
        if not config:
            return {"data": {}, "success": False, "processing_time": 0}

        user_prompt = config["prompts"].get(language, config["prompts"]["en"])
        full_user_prompt = user_prompt + "\n\n" + text
        
        messages = [
            {"role": "system", "content": config["system"]},
            {"role": "user", "content": full_user_prompt},
        ]
        
        try:
            start_time = time.time()
            parsed_data = chat_completion(
                task_type="jd_parse",
                messages=messages,
                response_format={"type": "json_object"},
            )
            processing_time = time.time() - start_time

            if not parsed_data:
                logger.warning(f"WARNING: Empty response for section {section_name}")
                return {"data": {}, "success": False, "processing_time": processing_time}

            logger.info(f"SUCCESS: Parsed section {section_name} in {processing_time:.2f}s")
            return {"data": parsed_data, "success": True, "processing_time": processing_time}

        except (QwenParsingError, QwenClientError) as e:
            logger.error(f"ERROR: Qwen API call failed for section {section_name}: {str(e)}")
            return {"data": {}, "success": False, "processing_time": 0}
        except Exception as e:
            logger.error(f"ERROR: Unexpected error for section {section_name}: {str(e)}")
            return {"data": {}, "success": False, "processing_time": 0}
    
    def fix_arabic_text_direction(self, text: str) -> str:
        """Fix Arabic text direction issues."""
        if not text or not isinstance(text, str):
            return text
        
        # Common Arabic text direction fixes
        corrections = {
            # Names
            'خيش': 'شيخه',
            'يواودبلا': 'البدواي',
            'دمحم': 'محمد',
            
            # Locations
            'ءابزع': 'عجمان',
            'هدحتملا': 'المتحدة',
            'هيبرعلا': 'العربية', 
            'تاراملاا': 'الإمارات',
            'يبد': 'دبي',
            
            # Job titles
            'سدنهم': 'مهندس',
            'ريدم': 'مدير',
            'لمع': 'عمل',
            
            # Skills
            'ةيبرعلا': 'العربية',
            'ةيزيلجنلاا': 'الإنجليزية',
            'بوساحلا': 'الحاسوب',
            'ةرادلاا': 'الإدارة'
        }
        
        # Apply corrections
        fixed_text = text
        for wrong, correct in corrections.items():
            fixed_text = fixed_text.replace(wrong, correct)
        
        return fixed_text
    
    def post_process_jd_data(self, jd_data: Dict[str, Any], language: str) -> Dict[str, Any]:
        """Post-process and enhance the extracted JD data."""
        
        # Fix Arabic text direction if needed
        if language == "ar":
            for key, value in jd_data.items():
                if isinstance(value, str):
                    jd_data[key] = self.fix_arabic_text_direction(value)
                elif isinstance(value, list):
                    jd_data[key] = [self.fix_arabic_text_direction(item) if isinstance(item, str) else item for item in value]
                elif isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, str):
                            jd_data[key][sub_key] = self.fix_arabic_text_direction(sub_value)
                        elif isinstance(sub_value, list):
                            jd_data[key][sub_key] = [self.fix_arabic_text_direction(item) if isinstance(item, str) else item for item in sub_value]
        
        # Generate keywords from title and skills
        keywords = []
        
        if jd_data.get('title'):
            title_words = jd_data['title'].lower().split()
            keywords.extend([word for word in title_words if len(word) > 2])
        
        if jd_data.get('requirements', {}).get('skills'):
            skills = jd_data['requirements']['skills']
            if isinstance(skills, list):
                keywords.extend([skill.lower() for skill in skills if isinstance(skill, str)])
        
        jd_data['keywords'] = list(set(keywords))[:10]
        
        # Set default values
        jd_data.setdefault('is_active', True)
        jd_data.setdefault('posted_date', time.strftime('%Y-%m-%dT%H:%M:%S'))
        
        return jd_data
    
    def parse_job_description(self, text: str) -> Dict[str, Any]:
        """Parse complete job description from text."""
        if not text or len(text.strip()) < 50:
            logger.error("ERROR: Job description text is too short or empty")
            return {
                "success": False,
                "error": "Job description text is too short or empty",
                "data": {}
            }
        
        start_time = time.time()
        language = self.detect_language(text)
        
        logger.info(f"INFO: Processing JD in language: {language}")
        logger.info(f"INFO: Text length: {len(text)} characters")
        
        # Parse each section
        sections = ["basic_info", "requirements", "responsibilities", "benefits"]
        parsed_sections = {}
        successful_sections = 0
        total_processing_time = 0
        
        for section in sections:
            logger.info(f"INFO: Processing section: {section}")
            result = self.parse_jd_section(text, section, language)
            
            if result["success"]:
                parsed_sections[section] = result["data"]
                successful_sections += 1
                logger.info(f"SUCCESS: Section {section} completed")
            else:
                parsed_sections[section] = {}
                logger.warning(f"WARNING: Section {section} failed")
            
            total_processing_time += result["processing_time"]
        
        # Combine all sections into final JD structure
        jd_data = {
            "id": f"jd_{int(time.time())}",
            "created_at": time.strftime('%Y-%m-%dT%H:%M:%S'),
            "updated_at": time.strftime('%Y-%m-%dT%H:%M:%S'),
        }
        
        # Add basic info
        basic_info = parsed_sections.get("basic_info", {})
        jd_data.update({
            "title": basic_info.get("title", ""),
            "company": basic_info.get("company", ""),
            "location": basic_info.get("location", ""),
            "employment_type": basic_info.get("employment_type", "full-time"),
            "work_mode": basic_info.get("work_mode", "on-site"),
            "description": basic_info.get("description", "")
        })
        
        # Add requirements
        requirements = parsed_sections.get("requirements", {})
        jd_data["requirements"] = {
            "education": requirements.get("education", []),
            "experience": requirements.get("experience", []),
            "skills": requirements.get("skills", []),
            "languages": requirements.get("languages", []),
            "certifications": requirements.get("certifications", [])
        }
        
        # Add responsibilities
        responsibilities = parsed_sections.get("responsibilities", {})
        jd_data["responsibilities"] = responsibilities.get("responsibilities", [])
        
        # Add benefits
        benefits = parsed_sections.get("benefits", {})
        jd_data["benefits"] = benefits.get("benefits", [])
        jd_data["salary"] = benefits.get("salary")
        jd_data["application_deadline"] = benefits.get("application_deadline")
        
        # Post-process the data
        jd_data = self.post_process_jd_data(jd_data, language)
        
        # Calculate completeness score
        completeness_score = (successful_sections / len(sections)) * 100
        
        # Add parsing metadata
        jd_data["parsing_metadata"] = {
            "extraction_method": "qwen_enhanced_jd_processing",
            "confidence_score": completeness_score,
            "language_detected": language,
            "source_format": "text_input",
            "processing_time": total_processing_time,
            "successful_sections": successful_sections,
            "total_sections": len(sections),
            "ai_model": "qwen-plus",
        }
        
        total_time = time.time() - start_time
        
        # Log results with Windows-safe output
        logger.info(f"SUCCESS: JD parsing completed in {total_time:.2f}s")
        logger.info(f"DATA: Successful sections: {successful_sections}/{len(sections)}")
        logger.info(f"DATA: Completeness score: {completeness_score:.1f}%")
        logger.info(f"DATA: Language detected: {language}")
        
        title_safe = self.safe_console_output(jd_data.get('title', ''))
        company_safe = self.safe_console_output(jd_data.get('company', ''))
        logger.info(f"DATA: Title: {title_safe}")
        logger.info(f"DATA: Company: {company_safe}")
        
        return {
            "success": True,
            "data": jd_data,
            "processing_time": total_time,
            "completeness_score": completeness_score,
            "successful_sections": successful_sections
        }

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Enhanced Job Description Parser')
    parser.add_argument('command', choices=['parse_jd'], help='Command to execute')
    parser.add_argument('--jd', required=True, help='Path to job description file or text')
    parser.add_argument('--output_dir', required=True, help='Output directory for parsed results')
    
    args = parser.parse_args()
    
    try:
        jd_parser = JobDescriptionParser()
        
        if args.command == 'parse_jd':
            if os.path.isfile(args.jd):
                text = jd_parser.extract_text_from_file(args.jd)
                if not text:
                    logger.error("ERROR: Failed to extract text from file")
                    sys.exit(1)
                
                input_path = Path(args.jd)
                output_filename = f"{input_path.stem}_parsed.json"
            else:
                text = args.jd
                output_filename = f"jd_{int(time.time())}_parsed.json"
            
            result = jd_parser.parse_job_description(text)
            
            if not result["success"]:
                logger.error(f"ERROR: JD parsing failed: {result.get('error', 'Unknown error')}")
                sys.exit(1)
            
            output_dir = Path(args.output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / output_filename
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result["data"], f, ensure_ascii=False, indent=2)
            
            logger.info(f"SUCCESS: Results saved to {output_path}")
            logger.info(f"DATA: Processing completed successfully")
            
    except Exception as e:
        logger.error(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
