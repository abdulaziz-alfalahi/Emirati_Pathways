import sys
import os

# Add project root to path (Emirati_Pathways)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

# Also add backend to path explicitly
backend_path = os.path.join(project_root, 'backend')
sys.path.append(backend_path)

from flask import Flask
# Use absolute import from backend package
from backend.extensions import db
from backend.models.profile.candidate_profile_models import CandidateProfile, CandidateExperience, CandidateEducation, CandidateSkill, CandidateCertification
from dotenv import load_dotenv

# Load env
load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost:5432/emirati_journey')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def create_tables():
    with app.app_context():
        print(f"Connecting to DB: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("Creating Profile V2 tables...")
        try:
            # This creates all tables defined by models imported above
            db.create_all()
            print("✅ Successfully created: candidate_profiles, experience, education, skills, certifications")
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    create_tables()
