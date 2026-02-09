import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'backend'))

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

# Define models directly here to avoid import issues for now
# We will just verify connection first
app = Flask(__name__)
# Use a direct connection string if env is failing, but try env first
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/emirati_journey')
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Import the models to register them with SQLAlchemy
# We need to ensure the shared 'db' instance is used, or we just redefine them if needed for this utility script
# But correctly, we should use the one from extensions
from backend.extensions import db as shared_db
shared_db.init_app(app)

from backend.models.profile.candidate_profile_models import CandidateProfile

def create_tables():
    with app.app_context():
        print(f"Connecting to DB...")
        try:
            shared_db.create_all()
            print("✅ Tables created successfully!")
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    create_tables()
