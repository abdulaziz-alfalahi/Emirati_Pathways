import sys
import os
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load env BEFORE importing app/parser
# Try backend/.env first
backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    # Fallback to root
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from backend.cv_parser import CVParser

def test_parsing():
    print("--- Testing Real CV Parsing ---")
    
    # Check key
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ GEMINI_API_KEY not found in env")
        return

    parser = CVParser()
    
    print(f"Parsing Dummy Text...")
    dummy_text = """
    ABDULLAH AL-MANSOORI
    Dubai, UAE | +971 50 123 4567 | abdullah@mapped.ae
    
    PROFESSIONAL SUMMARY
    Dedicated and results-oriented Software Engineer with over 8 years of experience in full-stack development. 
    Proven track record of delivering high-quality, scalable web applications for government and private sector clients. 
    Adept at leading cross-functional teams and implementing agile methodologies to improve project efficiency. 
    Passionate about mentoring junior developers and fostering a culture of continuous learning. 
    Seeking a challenging role to leverage my technical skills and drive innovation in a dynamic organization. 
    Extensive experience in Python, Javascript, and Cloud Architecture.

    EXPERIENCE
    Senior Developer | Tech Solutions UAE
    Jan 2020 - Present
    - Lead developer for core platform.
    
    Junior Developer | Web Corp
    2018 - 2019
    - Backend API development.

    EDUCATION
    Bachelor of Computer Science | UAE University
    Sep 2014 - Jun 2018
    """

    try:
        # Direct text call
        result = parser.parse_cv_text(dummy_text, user_id="test_user")
        
        print("\n--- Parsed Result ---")
        personal = result.get('data', {}).get('personal_info', {})
        summary = result.get('data', {}).get('professional_summary', '')
        experience = result.get('data', {}).get('experience', [])
        education = result.get('data', {}).get('education', [])
        
        print(f"Full Name: '{personal.get('full_name')}'")
        print(f"Summary Length: {len(summary.split())} words")
        print(f"Summary Content: {summary}")
        
        print(f"\nExperience Entries: {len(experience)}")
        for i, exp in enumerate(experience):
            print(f"  Exp {i+1}: {exp.get('start_date')} to {exp.get('end_date')} | {exp.get('company')}")
            
        print(f"\nEducation Entries: {len(education)}")
        for i, edu in enumerate(education):
            print(f"  Edu {i+1}: {edu.get('start_date')} to {edu.get('end_date')} | {edu.get('institution')}")
            
    except Exception as e:
        print(f"❌ Parsing failed: {e}")

if __name__ == "__main__":
    test_parsing()
