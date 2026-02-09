
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from backend.app import app, db
from backend.models.profile.candidate_profile_models import CandidateAssessment, CandidateProfile

if __name__ == "__main__":
    with app.app_context():
        print("--- START DIAGNOSIS ---")
        
        # 1. Check Table
        engine = db.engine
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'candidate_assessments' in tables:
            print("✅ Table 'candidate_assessments' exists.")
        else:
            print("⚠️ Table 'candidate_assessments' MISSING. Creating now...")
            try:
                # Use create_all to be safe, or specific table
                CandidateAssessment.__table__.create(db.engine)
                print("✅ Table 'candidate_assessments' created successfully.")
            except Exception as e:
                print(f"❌ Failed to create table: {e}")

        # 2. Check Profiles
        print("\nChecking Profiles...")
        try:
            profiles = CandidateProfile.query.all()
            print(f"Found {len(profiles)} profiles.")
            
            for p in profiles:
                print(f"\nProfile ID: {p.id}, User ID: {p.user_id}")
                try:
                    # Check relationships count
                    assessments_count = len(p.assessments)
                    print(f"  - Assessments: {assessments_count}")
                    
                    # Try serialization
                    p_dict = p.to_dict()
                    if 'error' in p_dict:
                        print(f"❌ Serialization ERROR: {p_dict['error']}")
                    else:
                        print("✅ Serialization Successful")
                except Exception as e:
                     print(f"❌ Exception during inspection: {e}")
        except Exception as e:
            print(f"❌ Critical Error Querying Profiles: {e}")

        print("\n--- END DIAGNOSIS ---")
