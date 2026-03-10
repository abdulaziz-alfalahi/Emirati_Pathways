"""
University Programs & Scholarships — Database Migration
Creates tables for university programs, scholarships, and applications.
Run: python migrations/create_education_tables.py
"""

import os
import sys
import psycopg2
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


EDUCATION_TABLES_SQL = """
-- ═══════════════════════════════════════════
-- UNIVERSITIES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS universities (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(300) NOT NULL,
    name_ar         VARCHAR(300) NOT NULL DEFAULT '',
    location        VARCHAR(100) NOT NULL DEFAULT '',
    type            VARCHAR(20)  NOT NULL DEFAULT 'public',
    established     INTEGER,
    ranking         INTEGER,
    students_count  INTEGER DEFAULT 0,
    programs_count  INTEGER DEFAULT 0,
    website         VARCHAR(300) DEFAULT '',
    description     TEXT DEFAULT '',
    description_ar  TEXT DEFAULT '',
    specialties     JSONB DEFAULT '[]',
    logo_url        VARCHAR(500) DEFAULT '',
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- UNIVERSITY PROGRAMS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS university_programs (
    id                  SERIAL PRIMARY KEY,
    university_id       INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    title               VARCHAR(300) NOT NULL,
    title_ar            VARCHAR(300) NOT NULL DEFAULT '',
    degree              VARCHAR(50)  NOT NULL DEFAULT 'bachelor',
    category            VARCHAR(100) NOT NULL DEFAULT 'General',
    category_ar         VARCHAR(100) DEFAULT '',
    description         TEXT DEFAULT '',
    description_ar      TEXT DEFAULT '',
    duration            VARCHAR(50)  DEFAULT '',
    language            VARCHAR(50)  DEFAULT 'English',
    tuition             VARCHAR(100) DEFAULT '',
    career_outcomes     JSONB DEFAULT '[]',
    subjects            JSONB DEFAULT '[]',
    skills_taught       JSONB DEFAULT '[]',
    accreditation       JSONB DEFAULT '[]',
    rating              FLOAT DEFAULT 0,
    enrolled            INTEGER DEFAULT 0,
    capacity            INTEGER DEFAULT 0,
    employment_rate     FLOAT DEFAULT 0,
    is_popular          BOOLEAN DEFAULT FALSE,
    is_new              BOOLEAN DEFAULT FALSE,
    scholarship_available BOOLEAN DEFAULT FALSE,
    active              BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uni_programs_university ON university_programs(university_id);
CREATE INDEX IF NOT EXISTS idx_uni_programs_category ON university_programs(category);
CREATE INDEX IF NOT EXISTS idx_uni_programs_degree ON university_programs(degree);

-- ═══════════════════════════════════════════
-- PROGRAM APPLICATIONS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS program_applications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    program_id      INTEGER NOT NULL REFERENCES university_programs(id) ON DELETE CASCADE,
    status          VARCHAR(20) DEFAULT 'pending',
    application_data JSONB DEFAULT '{}',
    submitted_at    TIMESTAMP DEFAULT NOW(),
    reviewed_at     TIMESTAMP,
    reviewer_notes  TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_prog_apps_user ON program_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_prog_apps_program ON program_applications(program_id);

-- ═══════════════════════════════════════════
-- SCHOLARSHIPS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scholarships (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(300) NOT NULL,
    title_ar        VARCHAR(300) DEFAULT '',
    provider        VARCHAR(200) NOT NULL DEFAULT '',
    provider_type   VARCHAR(50) DEFAULT 'government',
    amount          FLOAT DEFAULT 0,
    currency        VARCHAR(10) DEFAULT 'AED',
    description     TEXT DEFAULT '',
    description_ar  TEXT DEFAULT '',
    eligibility     JSONB DEFAULT '[]',
    required_gpa    FLOAT DEFAULT 0,
    deadline        TIMESTAMP,
    available_slots INTEGER DEFAULT 0,
    category        VARCHAR(100) DEFAULT 'General',
    university_id   INTEGER REFERENCES universities(id) ON DELETE SET NULL,
    skills_required JSONB DEFAULT '[]',
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholarships_provider ON scholarships(provider_type);
CREATE INDEX IF NOT EXISTS idx_scholarships_category ON scholarships(category);

CREATE TABLE IF NOT EXISTS scholarship_applications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    scholarship_id  INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    status          VARCHAR(20) DEFAULT 'pending',
    application_data JSONB DEFAULT '{}',
    ai_match_score  FLOAT DEFAULT 0,
    submitted_at    TIMESTAMP DEFAULT NOW(),
    reviewed_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schol_apps_user ON scholarship_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_schol_apps_scholarship ON scholarship_applications(scholarship_id);

-- ═══════════════════════════════════════════
-- LMS (LEARNING MANAGEMENT)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lms_courses (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(300) NOT NULL,
    title_ar        VARCHAR(300) DEFAULT '',
    provider        VARCHAR(200) DEFAULT '',
    category        VARCHAR(100) DEFAULT 'General',
    description     TEXT DEFAULT '',
    description_ar  TEXT DEFAULT '',
    duration_hours  INTEGER DEFAULT 0,
    level           VARCHAR(20) DEFAULT 'beginner',
    skills_covered  JSONB DEFAULT '[]',
    thumbnail_url   VARCHAR(500) DEFAULT '',
    content_url     VARCHAR(500) DEFAULT '',
    rating          FLOAT DEFAULT 0,
    enrollments     INTEGER DEFAULT 0,
    certification_offered BOOLEAN DEFAULT FALSE,
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_courses_category ON lms_courses(category);

CREATE TABLE IF NOT EXISTS lms_enrollments (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    course_id       INTEGER NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
    progress_pct    INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'enrolled',
    enrolled_at     TIMESTAMP DEFAULT NOW(),
    completed_at    TIMESTAMP,
    certificate_url VARCHAR(500) DEFAULT '',
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_lms_enrollments_user ON lms_enrollments(user_id);

-- ═══════════════════════════════════════════
-- TRAINING PROGRAMS (Flask-managed)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training_programs (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(300) NOT NULL,
    title_ar        VARCHAR(300) DEFAULT '',
    provider        VARCHAR(200) DEFAULT '',
    category        VARCHAR(100) DEFAULT 'General',
    duration        VARCHAR(100) DEFAULT '',
    level           VARCHAR(20) DEFAULT 'intermediate',
    url             VARCHAR(500) DEFAULT '',
    skills_covered  TEXT DEFAULT '',
    relevance_score FLOAT DEFAULT 0,
    active          BOOLEAN DEFAULT TRUE,
    certification_offered BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_programs_category ON training_programs(category);
""";


def run_migration():
    """Execute the education tables migration."""
    database_url = os.getenv('DATABASE_URL', 'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey')

    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        logger.info("Connected. Creating education tables...")

        # Execute the entire SQL block at once (CREATE IF NOT EXISTS is safe)
        cursor.execute(EDUCATION_TABLES_SQL)

        # Add missing columns to existing scholarships table
        alter_stmts = [
            "ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50) DEFAULT 'government'",
            "ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS skills_required JSONB DEFAULT '[]'",
            "ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS university_id INTEGER",
            "ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General'",
        ]
        for alter in alter_stmts:
            try:
                cursor.execute(alter)
            except Exception:
                pass

        # Verify
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN (
                'universities', 'university_programs', 'program_applications',
                'scholarships', 'scholarship_applications',
                'lms_courses', 'lms_enrollments', 'training_programs'
            )
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print(f"\n✅ {len(tables)} education tables ready:")
        for t in tables:
            print(f"   • {t}")

        cursor.close()
        conn.close()
        return True

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
