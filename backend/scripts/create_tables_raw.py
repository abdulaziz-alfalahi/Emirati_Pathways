import psycopg2
import os
from dotenv import load_dotenv

# Load env
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(project_root, 'backend', '.env'))

def get_db_connection():
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/emirati_journey')
    return psycopg2.connect(db_url)

SQL_COMMANDS = [
    "DROP TABLE IF EXISTS candidate_certifications CASCADE;",
    "DROP TABLE IF EXISTS candidate_skills CASCADE;",
    "DROP TABLE IF EXISTS candidate_education_entries CASCADE;",
    "DROP TABLE IF EXISTS candidate_experience_entries CASCADE;",
    "DROP TABLE IF EXISTS candidate_profiles CASCADE;",
    """
    CREATE TABLE candidate_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        headline VARCHAR(255),
        bio TEXT,
        phone VARCHAR(50),
        location VARCHAR(100),
        nationality VARCHAR(100) DEFAULT 'UAE',
        dob TIMESTAMP,
        avatar_url VARCHAR(500),
        video_intro_url VARCHAR(500),
        target_roles JSONB,
        willing_to_relocate BOOLEAN DEFAULT FALSE,
        expected_salary_range VARCHAR(100),
        notice_period VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS candidate_experience_entries (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        job_title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        is_current BOOLEAN DEFAULT FALSE,
        description TEXT,
        skills_used JSONB
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS candidate_education_entries (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        institution VARCHAR(255) NOT NULL,
        degree VARCHAR(255) NOT NULL,
        field_of_study VARCHAR(255),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        grade VARCHAR(50),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_source VARCHAR(50) DEFAULT 'self_reported',
        verification_id VARCHAR(255)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS candidate_skills (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        level VARCHAR(50),
        is_verified BOOLEAN DEFAULT FALSE,
        assessment_score INTEGER
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS candidate_certifications (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        issuing_organization VARCHAR(255) NOT NULL,
        issue_date TIMESTAMP,
        expiry_date TIMESTAMP,
        credential_id VARCHAR(255),
        credential_url VARCHAR(500)
    );
    """
]

def create_tables():
    print("Connecting to DB (Raw Psycopg2)...")
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        for command in SQL_COMMANDS:
            print(f"Executing: {command.split('(')[0].strip()}")
            cur.execute(command)
            
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Tables created successfully (Raw SQL)!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_tables()
