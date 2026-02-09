
import sys
import os

# Add project root and backend to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(backend_dir)

sys.path.insert(0, root_dir)
sys.path.insert(0, backend_dir)

print(f"Sys path: {sys.path}")

def test_imports():
    print("Testing imports...")
    try:
        from backend.services.profile_v2_service import ProfileV2Service
        print("✅ ProfileV2Service imported")
    except ImportError as e:
        print(f"❌ Failed to import ProfileV2Service: {e}")
        # Try without backend prefix
        try:
            from services.profile_v2_service import ProfileV2Service
            print("✅ ProfileV2Service imported (without prefix)")
        except ImportError as e2:
            print(f"❌ Failed to import ProfileV2Service (without prefix): {e2}")

    try:
        from backend.services.enhanced_matching_service import enhanced_matching_engine, JobRequirements
        print("✅ EnhancedMatchingEngine imported")
    except ImportError as e:
        print(f"❌ Failed to import EnhancedMatchingEngine: {e}")
        try:
            from services.enhanced_matching_service import enhanced_matching_engine
            print("✅ EnhancedMatchingEngine imported (without prefix)")
        except ImportError as e2:
            print(f"❌ Failed to import EnhancedMatchingEngine (without prefix): {e2}")

    try:
        # candidate_job_routes is in backend/
        import candidate_job_routes
        print("✅ candidate_job_routes module loaded")
    except ImportError as e:
        print(f"❌ Failed to load candidate_job_routes: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_imports()
