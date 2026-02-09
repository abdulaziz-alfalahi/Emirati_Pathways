import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

try:
    print("Importing Assessment Engine...")
    from backend.assessment_engine import AssessmentEngine, IndustryCategory
    print(f"Industry Categories: {[e.value for e in IndustryCategory]}")
    
    print("\nImporting Candidate Profile Models...")
    from backend.models.profile.candidate_profile_models import CandidateProfile, CandidateAssessment
    print("CandidateAssessment model found.")
    
    print("\nImporting Profile V2 Service...")
    from backend.services.profile_v2_service import ProfileV2Service
    print("ProfileV2Service imported.")
    
    print("\n✅ Backend Verification Successful!")
except Exception as e:
    print(f"\n❌ Verification Failed: {e}")
    import traceback
    traceback.print_exc()
