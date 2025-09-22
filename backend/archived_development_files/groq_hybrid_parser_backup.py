#!/usr/bin/env python3
"""
Enhanced Groq CV Parser with Llama-4 Optimized Parallel Processing
Windows-compatible version with ASCII-safe logging
"""

import os
import json
import logging
import traceback
import argparse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from typing import Dict, List, Any, Optional
import uuid
import re

# Import existing libraries
from groq import Groq
import fitz  # PyMuPDF
import docx2txt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
MAX_WORKERS = 4  # Number of parallel threads

# Logging setup with ASCII-safe formatting
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s: %(message)s')
logger = logging.getLogger('LLAMA4_PARSER')

class Llama4CVParser:
    """Enhanced CV Parser optimized for Llama-4 with parallel processing"""
    
    def __init__(self):
        """Initialize the Llama-4 optimized CV parser"""
        self.groq_client = None
        self.initialize_groq_client()
        
    def initialize_groq_client(self):
        """Initialize Groq client with error handling"""
        try:
            if not GROQ_API_KEY:
                logger.error("GROQ_API_KEY environment variable not set")
                return False
            
            self.groq_client = Groq(api_key=GROQ_API_KEY)
            logger.info("SUCCESS: Groq client initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"FAILED: Failed to initialize Groq client: {e}")
            return False
    
    def extract_json_from_response(self, response_text: str) -> Optional[Dict]:
        """Extract JSON from Llama-4's markdown-wrapped responses"""
        try:
            # Strategy 1: Look for JSON in markdown code blocks (improved patterns)
            json_patterns = [
                r'```json\s*(\{.*?\})\s*```',        # ```json { ... } ```
                r'```\s*(\{.*?\})\s*```',            # ``` { ... } ```
                r'```json\s*([\s\S]*?)\s*```',       # ```json multiline ```
                r'```\s*([\s\S]*?)\s*```',           # ``` multiline ```
                r'(\{[\s\S]*?\})',                   # Any JSON object (multiline)
            ]
            
            for pattern in json_patterns:
                matches = re.findall(pattern, response_text, re.DOTALL | re.MULTILINE)
                for match in matches:
                    try:
                        # Clean the JSON string
                        json_str = match.strip()
                        
                        # Handle cases where JSON might have extra text after closing brace
                        # Find the last complete JSON object
                        brace_count = 0
                        json_end = -1
                        for i, char in enumerate(json_str):
                            if char == '{':
                                brace_count += 1
                            elif char == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    json_end = i + 1
                                    break
                        
                        if json_end > 0:
                            json_str = json_str[:json_end]
                        
                        # Try to parse the JSON
                        parsed_json = json.loads(json_str)
                        logger.info(f"SUCCESS: Successfully extracted JSON with {len(parsed_json)} keys")
                        return parsed_json
                    except json.JSONDecodeError as e:
                        logger.debug(f"JSON decode error for pattern: {e}")
                        continue
            
            # Strategy 2: Look for key-value pairs and construct JSON
            logger.warning("No JSON found, attempting key-value extraction")
            return self._extract_key_value_pairs(response_text)
                
        except Exception as e:
            logger.error(f"Error extracting JSON from response: {e}")
            logger.debug(f"Response text: {response_text[:500]}...")
            
        return None
    
    def _extract_key_value_pairs(self, text: str) -> Dict:
        """Fallback: Extract key-value pairs from natural language response"""
        result = {}
        
        # Common patterns for key-value extraction
        patterns = {
            'name': [r'name[:\s]+([^\n,]+)', r'Name[:\s]+([^\n,]+)'],
            'email': [r'email[:\s]+([^\s\n,]+)', r'Email[:\s]+([^\s\n,]+)'],
            'phone': [r'phone[:\s]+([^\n,]+)', r'Phone[:\s]+([^\n,]+)'],
            'location': [r'location[:\s]+([^\n,]+)', r'Location[:\s]+([^\n,]+)'],
            'summary': [r'summary[:\s]+([^\n]+)', r'Summary[:\s]+([^\n]+)'],
        }
        
        for key, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    result[key] = match.group(1).strip().strip('"\'')
                    break
        
        return result
    
    def get_section_prompts(self) -> Dict[str, str]:
        """Get optimized prompts for each CV section for Llama-4"""
        return {
            'personal_info': """Extract personal information from the CV text and return ONLY valid JSON format.

Required JSON structure:
{
  "name": "full name",
  "email": "email address", 
  "phone": "phone number",
  "location": "city, country",
  "summary": "professional summary"
}

IMPORTANT: Return ONLY the JSON object, no explanations, no code, no markdown formatting.

CV Text:""",

            'work_experience': """Extract work experience from the CV text and return ONLY valid JSON format.

Required JSON structure:
{
  "experience": [
    {
      "position": "job title",
      "company": "company name",
      "start_date": "start date",
      "end_date": "end date or Present",
      "location": "city, country",
      "responsibilities": ["responsibility 1", "responsibility 2"]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no explanations, no code, no markdown formatting.

CV Text:""",

            'education': """Extract education information from the CV text and return ONLY valid JSON format.

Required JSON structure:
{
  "education": [
    {
      "degree": "degree name",
      "institution": "university/school name",
      "graduation_date": "graduation year",
      "location": "city, country",
      "gpa": "GPA if mentioned"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no explanations, no code, no markdown formatting.

CV Text:""",

            'skills_and_languages': """Extract skills and languages from the CV text and return ONLY valid JSON format.

Required JSON structure:
{
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "languages": [
    {
      "language": "language name",
      "proficiency": "proficiency level"
    }
  ],
  "certifications": ["cert1", "cert2"]
}

IMPORTANT: Return ONLY the JSON object, no explanations, no code, no markdown formatting.

CV Text:"""
        }
    
    def process_section(self, section_name: str, cv_text: str) -> Dict[str, Any]:
        """Process a single CV section with Llama-4 optimized prompts"""
        try:
            prompts = self.get_section_prompts()
            if section_name not in prompts:
                logger.error(f"Unknown section: {section_name}")
                return {"error": f"Unknown section: {section_name}"}
            
            prompt = prompts[section_name]
            full_prompt = f"{prompt}\n\n{cv_text}"
            
            logger.info(f"PROCESSING: Processing section: {section_name}")
            
            # Make API call with optimized parameters for Llama-4
            response = self.groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a precise data extraction tool. Always return valid JSON format only, no explanations or code."
                    },
                    {
                        "role": "user", 
                        "content": full_prompt
                    }
                ],
                max_tokens=3000,  # Generous token limit for detailed sections
                temperature=0.1,   # Low temperature for consistent output
                top_p=0.9
            )
            
            response_text = response.choices[0].message.content
            logger.debug(f"Raw response for {section_name}: {response_text[:200]}...")
            
            # Extract JSON from the response
            extracted_data = self.extract_json_from_response(response_text)
            
            if extracted_data:
                logger.info(f"SUCCESS: Section {section_name} processed successfully")
                return {
                    "section": section_name,
                    "data": extracted_data,
                    "success": True,
                    "raw_response": response_text[:500]  # Keep first 500 chars for debugging
                }
            else:
                logger.warning(f"WARNING: Failed to extract JSON from {section_name}")
                return {
                    "section": section_name,
                    "data": {},
                    "success": False,
                    "error": "Failed to extract JSON",
                    "raw_response": response_text[:500]
                }
                
        except Exception as e:
            logger.error(f"ERROR: Error processing section {section_name}: {e}")
            return {
                "section": section_name,
                "data": {},
                "success": False,
                "error": str(e)
            }
    
    def parse_cv_parallel(self, cv_text: str) -> Dict[str, Any]:
        """Parse CV using parallel processing with Llama-4 optimized prompts"""
        start_time = time.time()
        logger.info("STARTING: Starting parallel CV processing with Llama-4")
        
        sections = ['personal_info', 'work_experience', 'education', 'skills_and_languages']
        results = {}
        
        # Process sections in parallel
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Submit all tasks
            future_to_section = {
                executor.submit(self.process_section, section, cv_text): section 
                for section in sections
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_section):
                section = future_to_section[future]
                try:
                    result = future.result(timeout=30)  # 30 second timeout per section
                    results[section] = result
                    logger.info(f"COMPLETED: Completed: {section}")
                except Exception as e:
                    logger.error(f"FAILED: Failed: {section} - {e}")
                    results[section] = {
                        "section": section,
                        "data": {},
                        "success": False,
                        "error": str(e)
                    }
        
        # Merge all successful results into final CV data
        final_cv_data = self.merge_section_results(results)
        
        processing_time = time.time() - start_time
        logger.info(f"FINISHED: Parallel processing completed in {processing_time:.2f} seconds")
        
        return {
            "cv_data": final_cv_data,
            "processing_metadata": {
                "processing_time": processing_time,
                "model_used": GROQ_MODEL,
                "sections_processed": len(sections),
                "successful_sections": sum(1 for r in results.values() if r.get('success', False)),
                "extraction_method": "llama4_parallel_processing"
            },
            "section_results": results
        }
    
    def merge_section_results(self, results: Dict[str, Dict]) -> Dict[str, Any]:
        """Merge parallel processing results into final CV structure"""
        merged_data = {
            "personalInfo": {},
            "experience": [],
            "education": [],
            "skills": {"technical": [], "soft": []},
            "languages": [],
            "certifications": []
        }
        
        try:
            # Merge personal info
            if results.get('personal_info', {}).get('success'):
                personal_data = results['personal_info']['data']
                merged_data["personalInfo"] = {
                    "name": personal_data.get("name", ""),
                    "fullName": personal_data.get("name", ""),
                    "email": personal_data.get("email", ""),
                    "phone": personal_data.get("phone", ""),
                    "location": personal_data.get("location", ""),
                    "address": personal_data.get("location", ""),
                    "summary": personal_data.get("summary", "")
                }
            
            # Merge work experience
            if results.get('work_experience', {}).get('success'):
                exp_data = results['work_experience']['data']
                if 'experience' in exp_data:
                    merged_data["experience"] = exp_data['experience']
            
            # Merge education
            if results.get('education', {}).get('success'):
                edu_data = results['education']['data']
                if 'education' in edu_data:
                    merged_data["education"] = edu_data['education']
            
            # Merge skills and languages
            if results.get('skills_and_languages', {}).get('success'):
                skills_data = results['skills_and_languages']['data']
                if 'skills' in skills_data:
                    merged_data["skills"] = skills_data['skills']
                if 'languages' in skills_data:
                    merged_data["languages"] = skills_data['languages']
                if 'certifications' in skills_data:
                    merged_data["certifications"] = skills_data['certifications']
            
            logger.info("SUCCESS: Successfully merged all section results")
            
        except Exception as e:
            logger.error(f"Error merging section results: {e}")
        
        return merged_data
    
    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from various file formats"""
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                return self._extract_from_pdf(file_path)
            elif file_extension == '.docx':
                return self._extract_from_docx(file_path)
            elif file_extension == '.txt':
                return self._extract_from_txt(file_path)
            else:
                logger.warning(f"Unsupported file format: {file_extension}")
                return ""
                
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            return ""
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            logger.info(f"Extracted {len(text)} characters from PDF")
            return text
        except Exception as e:
            logger.error(f"Error extracting from PDF: {e}")
            return ""
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            text = docx2txt.process(file_path)
            logger.info(f"Extracted {len(text)} characters from DOCX")
            return text
        except Exception as e:
            logger.error(f"Error extracting from DOCX: {e}")
            return ""
    
    def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            logger.info(f"Extracted {len(text)} characters from TXT")
            return text
        except Exception as e:
            logger.error(f"Error extracting from TXT: {e}")
            return ""

def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description='Enhanced Llama-4 CV Parser with Parallel Processing')
    parser.add_argument('action', choices=['parse_resume'], help='Action to perform')
    parser.add_argument('--resume', required=True, help='Path to CV file')
    parser.add_argument('--output_dir', required=True, help='Output directory for parsed results')
    
    args = parser.parse_args()
    
    # Initialize parser
    cv_parser = Llama4CVParser()
    
    if not cv_parser.groq_client:
        logger.error("Failed to initialize Groq client")
        return 1
    
    # Extract text from file
    cv_text = cv_parser.extract_text_from_file(args.resume)
    if not cv_text:
        logger.error("Failed to extract text from CV file")
        return 1
    
    # Parse CV with parallel processing
    results = cv_parser.parse_cv_parallel(cv_text)
    
    # Save results
    try:
        os.makedirs(args.output_dir, exist_ok=True)
        
        # Generate output filename (keep full filename including extension)
        base_name = os.path.basename(args.resume)  # Keep .pdf extension
        output_file = os.path.join(args.output_dir, f"{base_name}_parsed.json")
        
        # Save parsed data with explicit UTF-8 encoding
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"SUCCESS: Results saved to: {output_file}")
        print(f"SUCCESS: CV parsed successfully! Results saved to: {output_file}")
        
        # Print summary (ASCII-safe)
        metadata = results.get('processing_metadata', {})
        print(f"STATS: Processing time: {metadata.get('processing_time', 0):.2f} seconds")
        print(f"MODEL: Model used: {metadata.get('model_used', 'Unknown')}")
        print(f"SECTIONS: Successful sections: {metadata.get('successful_sections', 0)}/{metadata.get('sections_processed', 0)}")
        
        return 0
        
    except Exception as e:
        logger.error(f"Error saving results: {e}")
        return 1

if __name__ == "__main__":
    exit(main())

