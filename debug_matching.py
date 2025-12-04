
import os
import sys
import logging
import json

# Add backend to path
sys.path.insert(0, os.path.abspath('backend'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_matching():
    print("Testing matching engine...")
    
    try:
        from recruiter.ai_candidate_matching import get_ai_matching_engine, AICandidateMatchingEngine
        import matching.job_matching_engine_optimized as jme
        print(f"Loaded job_matching_engine_optimized from: {jme.__file__}")
        
        engine = get_ai_matching_engine()
        print(f"Engine initialized: {engine}")
        print(f"Matching engine available: {engine.matching_engine is not None}")
        
        # Dummy JD
        jd_data = {
            'metadata': {'jd_id': 'test_jd'},
            'basic_info': {
                'title': 'Python Developer',
                'emirate': 'Dubai',
                'job_type': 'full_time'
            },
            'description': 'Looking for a Python developer',
            'requirements': [
                {'category': 'skills', 'description': 'Python'},
                {'category': 'skills', 'description': 'SQL'},
                {'category': 'experience', 'description': '3 years experience'}
            ]
        }
        
        # Dummy Candidate
        candidate = {
            'candidate_id': 'test_cand',
            'first_name': 'Test',
            'last_name': 'User 2',
            'email': 'test@example.com',
            'skills': ['Python', 'Java', 'SQL'],
            'experience_years': 4,
            'education_level': 'Bachelor',
            'emirate': 'Dubai',
            'is_uae_national': False
        }
        
        # Test scoring
        print("\n--- Scoring Candidate ---")
        score = engine._score_candidate(jd_data, candidate)
        print(f"Score result: {json.dumps(score, indent=2)}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_matching()
