import sys
import os
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey
from datetime import datetime
from dotenv import load_dotenv

# Load env
load_dotenv()
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

# Setup connection
db_url = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost:5432/emirati_journey')
# Ensure driver
if db_url.startswith('postgres:'):
    db_url = db_url.replace('postgres:', 'postgresql:')

print(f"Connecting to: {db_url}")
engine = create_engine(db_url)
metadata = MetaData()

# Define tables using CORE (No ORM Classes) to bypass metaclass issues
candidate_profiles = Table('candidate_profiles', metadata,
    Column('id', Integer, primary_key=True),
    Column('user_id', Integer, unique=True, nullable=False),
    Column('headline', String(255)),
    Column('bio', Text),
    Column('phone', String(50)),
    Column('location', String(100)),
    Column('nationality', String(100), default='UAE'),
    Column('dob', DateTime, nullable=True),
    Column('avatar_url', String(500)),
    Column('video_intro_url', String(500)),
    Column('target_roles', JSON),
    Column('willing_to_relocate', Boolean, default=False),
    Column('expected_salary_range', String(100)),
    Column('notice_period', String(50)),
    Column('created_at', DateTime, default=datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
)

candidate_experience = Table('candidate_experience_entries', metadata,
    Column('id', Integer, primary_key=True),
    Column('profile_id', Integer, ForeignKey('candidate_profiles.id'), nullable=False),
    Column('job_title', String(255), nullable=False),
    Column('company', String(255), nullable=False),
    Column('location', String(255)),
    Column('start_date', DateTime),
    Column('end_date', DateTime, nullable=True),
    Column('is_current', Boolean, default=False),
    Column('description', Text),
    Column('skills_used', JSON)
)

candidate_education = Table('candidate_education_entries', metadata,
    Column('id', Integer, primary_key=True),
    Column('profile_id', Integer, ForeignKey('candidate_profiles.id'), nullable=False),
    Column('institution', String(255), nullable=False),
    Column('degree', String(255), nullable=False),
    Column('field_of_study', String(255)),
    Column('start_date', DateTime),
    Column('end_date', DateTime),
    Column('grade', String(50)),
    Column('is_verified', Boolean, default=False),
    Column('verification_source', String(50), default='self_reported'),
    Column('verification_id', String(255))
)

candidate_skills = Table('candidate_skills', metadata,
    Column('id', Integer, primary_key=True),
    Column('profile_id', Integer, ForeignKey('candidate_profiles.id'), nullable=False),
    Column('name', String(100), nullable=False),
    Column('category', String(50)),
    Column('level', String(50)),
    Column('is_verified', Boolean, default=False),
    Column('assessment_score', Integer, nullable=True)
)

# Fix Certifications Table
candidate_certifications = Table('candidate_certifications', metadata,
    Column('id', Integer, primary_key=True),
    Column('profile_id', Integer, ForeignKey('candidate_profiles.id'), nullable=False),
    Column('name', String(255), nullable=False),
    Column('issuing_organization', String(255), nullable=False),
    Column('issue_date', DateTime),
    Column('expiry_date', DateTime, nullable=True),
    Column('credential_id', String(255)),
    Column('credential_url', String(500))
)

def create_schema():
    print("Creating tables via SQLAlchemy Core...")
    try:
        metadata.create_all(engine)
        print("✅ Tables created successfully (Core Method)!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_schema()
