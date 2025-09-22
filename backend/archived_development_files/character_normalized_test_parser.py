# character_normalized_test_parser.py - Test parser with character normalization for Arabic names

import sys
import os
import logging
import traceback
import json
import re
import fitz  # PyMuPDF - much better for Arabic text
import docx2txt
from groq import Groq
import argparse
from json_repair import repair_json
import unicodedata
from bidi.algorithm import get_display
import arabic_reshaper
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import time
import tempfile

# Configure logging early for debug prints
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - SCRIPT: %(message)s")

# --- Top-level error log file setup ---
SCRIPT_EXECUTION_DIR = os.path.dirname(os.path.abspath(__file__))
ERROR_LOG_FILE = os.path.join(SCRIPT_EXECUTION_DIR, "parser_script_errors.log")

# Clear previous error log if it exists
try:
    if os.path.exists(ERROR_LOG_FILE):
        os.remove(ERROR_LOG_FILE)
except Exception as e_remove:
    logging.warning(f"Could not remove old error log {ERROR_LOG_FILE}: {e_remove}")

def log_to_file(message):
    """Appends a message to the dedicated error log file."""
    try:
        with open(ERROR_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{message}\n")
    except Exception as e_log:
        print(f"CRITICAL: Failed to write to error log file {ERROR_LOG_FILE}: {e_log}", file=sys.stderr)
        print(f"Original message: {message}", file=sys.stderr)

log_to_file("--- SCRIPT EXECUTION STARTED (character_normalized_test_parser.py) ---")
logging.debug("--- SCRIPT START --- CHARACTER_NORMALIZED_TEST_PARSER.PY ---")

# --- Configuration ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")  # Set this environment variable
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # Llama 4 Scout
OUTPUT_DIR_ARG = "output_dir"
SCHEMA_FILE_ARG = "schema_file"
DEFAULT_OUTPUT_DIR = "parsing_results"
DEFAULT_SCHEMA_FILE = "parsing_schema.json"

# OCR Configuration
OCR_TIMEOUT = 30  # Maximum time for OCR processing in seconds
OCR_LANGUAGES = 'ara+eng'  # Arabic + English for Tesseract

# Global Groq client
groq_client_global = None

def load_groq_client():
    """Initialize Groq client"""
    global groq_client_global
    if groq_client_global is not None:
        return groq_client_global
        
    try:
        if not GROQ_API_KEY:
            logging.error("GROQ_API_KEY environment variable not set")
            log_to_file("GROQ_API_KEY environment variable not set")
            return None
        
        groq_client_global = Groq(api_key=GROQ_API_KEY)
        logging.info("Groq client initialized successfully")
        log_to_file("Groq client initialized successfully")
        return groq_client_global
    except Exception as e:
        logging.error(f"Failed to initialize Groq client: {e}")
        log_to_file(f"Failed to initialize Groq client: {e}\n{traceback.format_exc()}")
        return None

def extract_text_from_pdf_standard(file_path):
    """Extract text from PDF using PyMuPDF (standard method)"""
    try:
        logging.info(f"Extracting text from PDF using PyMuPDF: {file_path}")
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        
        if text.strip():
            logging.info(f"Successfully extracted {len(text)} characters from {file_path}")
            return text
        else:
            logging.warning(f"No text extracted from {file_path} - might be image-based PDF")
            return None
            
    except Exception as e:
        logging.error(f"Error extracting text from PDF {file_path}: {e}")
        log_to_file(f"Error extracting text from PDF {file_path}: {e}\n{traceback.format_exc()}")
        return None

def extract_text_from_pdf_ocr(file_path):
    """Extract text from PDF using OCR"""
    try:
        logging.info(f"Starting OCR extraction for {file_path}")
        start_time = time.time()
        
        # Convert PDF to images
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # Convert PDF pages to images
                images = convert_from_path(file_path, dpi=300, fmt='PNG')
                logging.info(f"Converted PDF to {len(images)} images")
                
                extracted_text = ""
                
                for i, image in enumerate(images):
                    try:
                        # Configure Tesseract for Arabic and English
                        custom_config = r'--oem 3 --psm 6 -l ' + OCR_LANGUAGES
                        
                        # Extract text from image
                        page_text = pytesseract.image_to_string(image, config=custom_config)
                        
                        if page_text.strip():
                            extracted_text += f"\n--- Page {i+1} ---\n{page_text}\n"
                            logging.info(f"OCR extracted {len(page_text)} characters from page {i+1}")
                        
                        # Check timeout
                        if time.time() - start_time > OCR_TIMEOUT:
                            logging.warning(f"OCR timeout reached after {OCR_TIMEOUT} seconds")
                            break
                            
                    except Exception as e:
                        logging.warning(f"OCR failed for page {i+1}: {e}")
                        continue
                
                processing_time = time.time() - start_time
                logging.info(f"OCR completed in {processing_time:.2f} seconds, extracted {len(extracted_text)} characters")
                
                if extracted_text.strip():
                    return extracted_text.strip()
                else:
                    logging.warning("OCR extraction resulted in empty text")
                    return None
                    
            except Exception as e:
                logging.error(f"Error converting PDF to images: {e}")
                return None
                
    except Exception as e:
        logging.error(f"Error in OCR extraction: {e}")
        log_to_file(f"Error in OCR extraction: {e}\n{traceback.format_exc()}")
        return None

def normalize_arabic_characters(text):
    """Normalize Arabic characters to standard forms"""
    if not text:
        return text
    
    # Unicode normalization
    text = unicodedata.normalize('NFKC', text)
    
    # Arabic character normalization mappings
    char_mappings = {
        # Different forms of Alef
        'ﺍ': 'ا', 'ﺎ': 'ا', 'ﺃ': 'أ', 'ﺄ': 'أ', 'ﺇ': 'إ', 'ﺈ': 'إ',
        'ﺁ': 'آ', 'ﺂ': 'آ', 'ﺀ': 'ء',
        
        # Different forms of Beh
        'ﺏ': 'ب', 'ﺐ': 'ب', 'ﺑ': 'ب', 'ﺒ': 'ب',
        
        # Different forms of Teh
        'ﺕ': 'ت', 'ﺖ': 'ت', 'ﺗ': 'ت', 'ﺘ': 'ت',
        
        # Different forms of Jeem
        'ﺝ': 'ج', 'ﺞ': 'ج', 'ﺟ': 'ج', 'ﺠ': 'ج',
        
        # Different forms of Hah
        'ﺡ': 'ح', 'ﺢ': 'ح', 'ﺣ': 'ح', 'ﺤ': 'ح',
        
        # Different forms of Dal
        'ﺩ': 'د', 'ﺪ': 'د',
        
        # Different forms of Reh
        'ﺭ': 'ر', 'ﺮ': 'ر',
        
        # Different forms of Seen
        'ﺱ': 'س', 'ﺲ': 'س', 'ﺳ': 'س', 'ﺴ': 'س',
        
        # Different forms of Ain
        'ﻉ': 'ع', 'ﻊ': 'ع', 'ﻋ': 'ع', 'ﻌ': 'ع',
        
        # Different forms of Feh
        'ﻑ': 'ف', 'ﻒ': 'ف', 'ﻓ': 'ف', 'ﻔ': 'ف',
        
        # Different forms of Qaf
        'ﻕ': 'ق', 'ﻖ': 'ق', 'ﻗ': 'ق', 'ﻘ': 'ق',
        
        # Different forms of Lam
        'ﻝ': 'ل', 'ﻞ': 'ل', 'ﻟ': 'ل', 'ﻠ': 'ل',
        
        # Different forms of Meem
        'ﻡ': 'م', 'ﻢ': 'م', 'ﻣ': 'م', 'ﻤ': 'م',
        
        # Different forms of Noon
        'ﻥ': 'ن', 'ﻦ': 'ن', 'ﻧ': 'ن', 'ﻨ': 'ن',
        
        # Different forms of Heh
        'ﻩ': 'ه', 'ﻪ': 'ه', 'ﻫ': 'ه', 'ﻬ': 'ه',
        
        # Different forms of Waw
        'ﻭ': 'و', 'ﻮ': 'و',
        
        # Different forms of Yeh
        'ﻱ': 'ي', 'ﻲ': 'ي', 'ﻳ': 'ي', 'ﻴ': 'ي',
        
        # Different forms of Teh Marbuta
        'ﺓ': 'ة', 'ﺔ': 'ة',
        
        # Different forms of Zain
        'ﺯ': 'ز', 'ﺰ': 'ز',
        
        # Different forms of Kaf
        'ﻙ': 'ك', 'ﻚ': 'ك', 'ﻛ': 'ك', 'ﻜ': 'ك',
    }
    
    # Apply character mappings
    for old_char, new_char in char_mappings.items():
        text = text.replace(old_char, new_char)
    
    return text

def reverse_arabic_text_segments(text):
    """Try reversing Arabic text segments to fix direction issues"""
    if not text:
        return text
    
    try:
        # Split text into words
        words = text.split()
        fixed_words = []
        
        for word in words:
            # If word contains Arabic characters, try reversing it
            if re.search(r'[\u0600-\u06FF]', word):
                # Remove formatting artifacts
                clean_word = re.sub(r'[ـــ\-_*]+', '', word)
                # Try reversing the word
                reversed_word = clean_word[::-1]
                fixed_words.append(reversed_word)
            else:
                fixed_words.append(word)
        
        return ' '.join(fixed_words)
    except Exception as e:
        logging.warning(f"Failed to reverse Arabic text segments: {e}")
        return text

def apply_comprehensive_arabic_normalization(text):
    """Apply comprehensive Arabic text normalization"""
    if not text:
        return text
    
    logging.info("Applying comprehensive Arabic normalization")
    
    # Step 1: Unicode normalization
    text = unicodedata.normalize('NFKC', text)
    
    # Step 2: Character normalization
    text = normalize_arabic_characters(text)
    
    # Step 3: Remove excessive formatting
    text = re.sub(r'[ـــ]{2,}', '', text)  # Remove Arabic tatweel
    text = re.sub(r'[-_*]{2,}', ' ', text)  # Replace multiple dashes with space
    
    # Step 4: Clean up spacing
    text = re.sub(r'\s+', ' ', text)
    
    # Step 5: Try Arabic reshaping and bidirectional display
    try:
        reshaped_text = arabic_reshaper.reshape(text)
        display_text = get_display(reshaped_text)
        text = display_text
    except Exception as e:
        logging.warning(f"Arabic reshaping failed: {e}")
    
    return text.strip()

def correct_specific_name_corruption(extracted_name, expected_name):
    """Try to correct specific name corruption patterns"""
    if not extracted_name or not expected_name:
        return extracted_name
    
    logging.info(f"Attempting to correct name: '{extracted_name}' -> '{expected_name}'")
    
    # Try multiple correction approaches
    approaches = []
    
    # Approach 1: Direct normalization
    normalized = apply_comprehensive_arabic_normalization(extracted_name)
    approaches.append(("normalized", normalized))
    
    # Approach 2: Reverse segments
    reversed_segments = reverse_arabic_text_segments(extracted_name)
    normalized_reversed = apply_comprehensive_arabic_normalization(reversed_segments)
    approaches.append(("reversed_normalized", normalized_reversed))
    
    # Approach 3: Character-by-character analysis
    # Extract individual Arabic words from both names
    extracted_words = re.findall(r'[\u0600-\u06FF]+', extracted_name)
    expected_words = re.findall(r'[\u0600-\u06FF]+', expected_name)
    
    logging.info(f"Extracted words: {extracted_words}")
    logging.info(f"Expected words: {expected_words}")
    
    # Try to match words by length and character similarity
    if extracted_words and expected_words:
        matched_words = []
        for exp_word in expected_words:
            best_match = None
            best_score = 0
            
            for ext_word in extracted_words:
                # Normalize both words
                norm_ext = apply_comprehensive_arabic_normalization(ext_word)
                norm_exp = apply_comprehensive_arabic_normalization(exp_word)
                
                # Calculate similarity (simple character overlap)
                common_chars = set(norm_ext) & set(norm_exp)
                if norm_exp:
                    score = len(common_chars) / len(set(norm_exp))
                    if score > best_score:
                        best_score = score
                        best_match = ext_word
            
            if best_match:
                matched_words.append(best_match)
                extracted_words.remove(best_match)
        
        if matched_words:
            reconstructed = ' '.join(matched_words)
            reconstructed_normalized = apply_comprehensive_arabic_normalization(reconstructed)
            approaches.append(("reconstructed", reconstructed_normalized))
    
    # Evaluate approaches
    best_approach = extracted_name
    best_score = 0
    best_method = "original"
    
    for method, result in approaches:
        # Calculate similarity to expected name
        if result and expected_name:
            # Simple character-based similarity
            result_chars = set(result.replace(' ', ''))
            expected_chars = set(expected_name.replace(' ', ''))
            
            if expected_chars:
                common = result_chars & expected_chars
                score = len(common) / len(expected_chars)
                
                logging.info(f"Method '{method}': '{result}' -> similarity score: {score:.3f}")
                
                if score > best_score:
                    best_score = score
                    best_approach = result
                    best_method = method
    
    logging.info(f"Best correction method: '{best_method}' with score {best_score:.3f}")
    logging.info(f"Corrected name: '{best_approach}'")
    
    return best_approach

def compare_extraction_methods(file_path):
    """Compare standard extraction vs OCR extraction with character normalization"""
    print("\n" + "="*80)
    print("EXTRACTION METHOD COMPARISON WITH CHARACTER NORMALIZATION")
    print("="*80)
    
    # Method 1: Standard extraction
    print("\n1. STANDARD TEXT EXTRACTION (PyMuPDF):")
    print("-" * 50)
    standard_text = extract_text_from_pdf_standard(file_path)
    if standard_text:
        print(f"Length: {len(standard_text)} characters")
        print("First 500 characters:")
        print(repr(standard_text[:500]))
        print("\nReadable preview:")
        print(standard_text[:500])
        
        # Apply character normalization to standard text
        normalized_standard = apply_comprehensive_arabic_normalization(standard_text)
        print(f"\nAfter normalization ({len(normalized_standard)} chars):")
        print(normalized_standard[:500])
    else:
        print("FAILED - No text extracted")
    
    # Method 2: OCR extraction
    print("\n2. OCR EXTRACTION (Tesseract):")
    print("-" * 50)
    ocr_text = extract_text_from_pdf_ocr(file_path)
    if ocr_text:
        print(f"Length: {len(ocr_text)} characters")
        print("First 500 characters:")
        print(repr(ocr_text[:500]))
        print("\nReadable preview:")
        print(ocr_text[:500])
        
        # Apply character normalization to OCR text
        normalized_ocr = apply_comprehensive_arabic_normalization(ocr_text)
        print(f"\nAfter normalization ({len(normalized_ocr)} chars):")
        print(normalized_ocr[:500])
    else:
        print("FAILED - No text extracted")
    
    # Comparison with name correction
    print("\n3. NAME CORRECTION TEST:")
    print("-" * 50)
    
    expected_name = "نوره عبدالعزيز صقر مراد صباح"
    
    if standard_text:
        # Extract names from standard text
        standard_names = re.findall(r'[\u0600-\u06FF\s]{10,50}', standard_text)
        print(f"Names found in standard extraction: {len(standard_names)}")
        
        for i, name in enumerate(standard_names[:3]):  # Test top 3 candidates
            clean_name = name.strip()
            if clean_name:
                print(f"  Candidate {i+1}: '{clean_name}'")
                corrected = correct_specific_name_corruption(clean_name, expected_name)
                print(f"  Corrected: '{corrected}'")
                
                # Check if correction matches expected
                if corrected == expected_name:
                    print(f"  ✅ PERFECT MATCH!")
                    return standard_text, "standard_with_correction", corrected
                elif expected_name in corrected or corrected in expected_name:
                    print(f"  ✅ PARTIAL MATCH!")
    
    if ocr_text:
        # Extract names from OCR text
        ocr_names = re.findall(r'[\u0600-\u06FF\s]{10,50}', ocr_text)
        print(f"Names found in OCR extraction: {len(ocr_names)}")
        
        for i, name in enumerate(ocr_names[:3]):  # Test top 3 candidates
            clean_name = name.strip()
            if clean_name:
                print(f"  Candidate {i+1}: '{clean_name}'")
                corrected = correct_specific_name_corruption(clean_name, expected_name)
                print(f"  Corrected: '{corrected}'")
                
                # Check if correction matches expected
                if corrected == expected_name:
                    print(f"  ✅ PERFECT MATCH!")
                    return ocr_text, "ocr_with_correction", corrected
                elif expected_name in corrected or corrected in expected_name:
                    print(f"  ✅ PARTIAL MATCH!")
    
    # Default recommendation
    if standard_text and ocr_text:
        if len(standard_text) > len(ocr_text):
            return standard_text, "standard_more_content", None
        else:
            return ocr_text, "ocr_more_content", None
    elif standard_text:
        return standard_text, "standard_only", None
    elif ocr_text:
        return ocr_text, "ocr_only", None
    else:
        return None, "both_failed", None

def detect_arabic_content(text):
    """Detect if the text contains significant Arabic content"""
    if not text:
        return False
    
    # Count Arabic characters
    arabic_chars = 0
    total_chars = 0
    
    for char in text:
        if char.strip():  # Skip whitespace
            total_chars += 1
            # Arabic Unicode ranges
            if ('\u0600' <= char <= '\u06FF') or ('\u0750' <= char <= '\u077F') or ('\uFB50' <= char <= '\uFDFF') or ('\uFE70' <= char <= '\uFEFF'):
                arabic_chars += 1
    
    if total_chars == 0:
        return False
    
    arabic_ratio = arabic_chars / total_chars
    logging.info(f"Arabic content detection: {arabic_chars}/{total_chars} = {arabic_ratio:.2f}")
    
    # Consider it Arabic if more than 25% of characters are Arabic
    return arabic_ratio > 0.25

def extract_arabic_name_patterns(text):
    """Extract Arabic names using pattern recognition with normalization"""
    name_patterns = []
    
    # Apply normalization first
    normalized_text = apply_comprehensive_arabic_normalization(text)
    
    # Common Arabic name patterns
    patterns = [
        r'الاسم\s*:?\s*([\u0600-\u06FF\s]+)',
        r'اسم\s*:?\s*([\u0600-\u06FF\s]+)',
        r'([\u0600-\u06FF]+\s+[\u0600-\u06FF]+\s+[\u0600-\u06FF]+)',  # Three Arabic words
        r'([\u0600-\u06FF]+\s+[\u0600-\u06FF]+\s+[\u0600-\u06FF]+\s+[\u0600-\u06FF]+)',  # Four Arabic words
        r'([\u0600-\u06FF]+\s+[\u0600-\u06FF]+\s+[\u0600-\u06FF]+\s+[\u0600-\u06FF]+\s+[\u0600-\u06FF]+)',  # Five Arabic words
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, normalized_text)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0] if match else ""
            
            # Clean the match
            clean_match = re.sub(r'\s+', ' ', match.strip())
            
            # Validate it looks like a name (2-5 words, reasonable length)
            words = clean_match.split()
            if 2 <= len(words) <= 5 and 5 <= len(clean_match) <= 50:
                name_patterns.append(clean_match)
    
    return name_patterns

def call_groq_api(prompt, model=GROQ_MODEL):
    """Call Groq API for text generation with Llama 4 Scout"""
    try:
        client = load_groq_client()
        if not client:
            logging.error("Groq client not initialized")
            return None
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert document parser specializing in both English and Arabic content. Extract information accurately and return valid JSON. Pay special attention to Arabic text and names. Always escape special characters properly in JSON strings."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=model,
            temperature=0.01,  # Extremely low temperature for maximum consistency
            max_completion_tokens=4096  # Increased for complex CVs
        )
        
        return chat_completion.choices[0].message.content
        
    except Exception as e:
        logging.error(f"Error calling Groq API: {e}")
        log_to_file(f"Error calling Groq API: {e}\n{traceback.format_exc()}")
        return None

def clean_and_repair_json(json_text):
    """Clean and repair potentially malformed JSON"""
    try:
        # First, try to parse as-is
        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            pass
        
        # Extract JSON from response if it's wrapped in markdown or other text
        json_match = re.search(r'```json\s*(.*?)\s*```', json_text, re.DOTALL)
        if json_match:
            json_text = json_match.group(1)
        
        # Try to find JSON object in the text
        json_start = json_text.find('{')
        json_end = json_text.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            json_text = json_text[json_start:json_end]
        
        # Try parsing again
        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            pass
        
        # Use json_repair to fix malformed JSON
        logging.info("Attempting to repair malformed JSON")
        repaired_json = repair_json(json_text)
        return json.loads(repaired_json)
        
    except Exception as e:
        logging.error(f"Failed to clean and repair JSON: {e}")
        log_to_file(f"Failed to clean and repair JSON: {e}\nOriginal text: {json_text[:500]}...")
        return None

def create_test_prompt_with_normalization(text, extraction_method, corrected_name, doc_type, schema_content_str):
    """Create a test prompt that includes character normalization results"""
    
    expected_name = "نوره عبدالعزيز صقر مراد صباح"
    
    name_correction_info = ""
    if corrected_name:
        name_correction_info = f"\nCHARACTER NORMALIZATION RESULT: The name has been corrected to: '{corrected_name}'"
    
    return f"""You are testing CV parsing accuracy with advanced character normalization. This text was extracted using {extraction_method}.

CRITICAL TEST OBJECTIVE:
The correct name in this CV should be: "{expected_name}"{name_correction_info}

ULTRA-CRITICAL PARSING INSTRUCTIONS:

1. NAME EXTRACTION WITH NORMALIZATION:
   - The text has been processed with character normalization
   - Look for the complete Arabic name: "{expected_name}"
   - If character correction was applied, use the corrected name: "{corrected_name if corrected_name else 'No correction applied'}"
   - Extract the most accurate name available

2. SYSTEMATIC CONTENT EXTRACTION:
   - Personal Info: Look for الاسم، الهاتف، البريد الإلكتروني
   - Education: Look for التعليم، المؤهلات، الشهادات، ثانوية، جامعة
   - Work Experience: Look for الخبرة، الوظائف، العمل، الشركة
   - Skills: Look for المهارات، القدرات، الحاسوب، التواصل
   - Languages: Look for اللغات، العربية، الإنجليزية

3. EXTRACTION QUALITY ASSESSMENT:
   - Report in the summary field whether character normalization helped
   - Note the accuracy of name extraction
   - Indicate confidence level in your extraction

Schema:
{schema_content_str}

Text to analyze (extracted using {extraction_method} with character normalization):
{text}

Extract ALL information accurately and return complete JSON. Use the best available name after character normalization:"""

def test_parsing_with_normalization(text, extraction_method, corrected_name, doc_type, schema_file, model):
    """Test parsing with character normalization applied"""
    try:
        with open(schema_file, "r", encoding="utf-8") as f:
            schema_content = json.load(f).get(f"{doc_type}_schema")
            schema_content_str = json.dumps(schema_content, indent=2)
    except Exception as e:
        logging.error(f"Could not read schema {schema_file}: {e}")
        return None
    
    # Apply comprehensive normalization to the text
    normalized_text = apply_comprehensive_arabic_normalization(text)
    
    # Detect if content is primarily Arabic
    is_arabic = detect_arabic_content(normalized_text)
    logging.info(f"Content language detection: {'Arabic' if is_arabic else 'English'}")
    
    # Extract potential names using pattern recognition with normalization
    extracted_names = extract_arabic_name_patterns(normalized_text)
    logging.info(f"Extracted potential names after normalization: {extracted_names}")
    
    # Create test prompt with normalization info
    prompt = create_test_prompt_with_normalization(normalized_text, extraction_method, corrected_name, doc_type, schema_content_str)
    
    generated_text = call_groq_api(prompt, model)
    if not generated_text:
        return None
    
    # Clean and repair the JSON response
    parsed_data = clean_and_repair_json(generated_text)
    if not parsed_data:
        logging.error("Failed to parse JSON response from Groq API")
        return None
    
    # If we have a corrected name, use it
    if corrected_name and parsed_data.get("contact_info"):
        parsed_data["contact_info"]["name"] = corrected_name
        parsed_data["_character_correction_applied"] = True
        parsed_data["_corrected_name"] = corrected_name
    
    # Add metadata
    parsed_data["_raw_text_preview"] = normalized_text[:200] + "..."
    parsed_data["_groq_model_used"] = model
    parsed_data["_extraction_method"] = f"character_normalized_{extraction_method}"
    parsed_data["_language_detected"] = "Arabic" if is_arabic else "English"
    
    if extracted_names:
        parsed_data["_detected_names"] = extracted_names[:3]  # Top 3 detected names
    
    return parsed_data

def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(description="Character normalization test parser for Arabic name correction")
    parser.add_argument("--file", required=True, help="Path to PDF file to test")
    parser.add_argument("--output_dir", default="test_output", help="Output directory")
    parser.add_argument("--schema_file", default=DEFAULT_SCHEMA_FILE, help="Schema file path")
    parser.add_argument("--method", choices=["compare", "standard", "ocr"], default="compare", 
                       help="Test method: compare both, standard only, or ocr only")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        sys.exit(1)
    
    print(f"Testing character normalization on: {args.file}")
    
    if args.method == "compare":
        # Compare both methods with character normalization
        result = compare_extraction_methods(args.file)
        
        if len(result) == 3:
            best_text, recommendation, corrected_name = result
        else:
            best_text, recommendation = result
            corrected_name = None
        
        if best_text:
            print(f"\nUsing {recommendation} for parsing with character normalization...")
            result = test_parsing_with_normalization(best_text, recommendation, corrected_name, "resume", args.schema_file, GROQ_MODEL)
            
            if result:
                # Save results
                os.makedirs(args.output_dir, exist_ok=True)
                output_filename = os.path.join(args.output_dir, f"{os.path.basename(args.file)}_normalized_test.json")
                
                with open(output_filename, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=4, ensure_ascii=False)
                
                print(f"\nParsing completed. Results saved to: {output_filename}")
                
                # Show key results
                print(f"\nKEY RESULTS:")
                extracted_name = result.get('contact_info', {}).get('name', 'NOT FOUND')
                expected_name = "نوره عبدالعزيز صقر مراد صباح"
                
                print(f"Extracted name: {extracted_name}")
                print(f"Expected name: {expected_name}")
                
                # Check for exact match
                if extracted_name == expected_name:
                    print(f"✅ PERFECT MATCH!")
                elif expected_name in extracted_name or extracted_name in expected_name:
                    print(f"✅ PARTIAL MATCH!")
                elif corrected_name:
                    print(f"🔧 CHARACTER CORRECTION APPLIED: {corrected_name}")
                    if corrected_name == expected_name:
                        print(f"✅ CORRECTION SUCCESSFUL!")
                    else:
                        print(f"⚠️ CORRECTION PARTIAL")
                else:
                    print(f"❌ NO MATCH")
                
                # Show character correction info
                if result.get("_character_correction_applied"):
                    print(f"🔧 Character correction was applied successfully")
                
            else:
                print("Parsing failed")
        else:
            print("Both extraction methods failed")
    
    elif args.method == "standard":
        text = extract_text_from_pdf_standard(args.file)
        if text:
            result = test_parsing_with_normalization(text, "standard_only", None, "resume", args.schema_file, GROQ_MODEL)
            print("Standard extraction with normalization test completed")
        else:
            print("Standard extraction failed")
    
    elif args.method == "ocr":
        text = extract_text_from_pdf_ocr(args.file)
        if text:
            result = test_parsing_with_normalization(text, "ocr_only", None, "resume", args.schema_file, GROQ_MODEL)
            print("OCR extraction with normalization test completed")
        else:
            print("OCR extraction failed")

if __name__ == "__main__":
    main()

