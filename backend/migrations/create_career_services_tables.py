"""
Career Services — Database Migration
Creates tables for internships, gigs, career plans, salary benchmarks, and portfolio.
Run: python migrations/create_career_services_tables.py
"""

import os
import sys
import psycopg2
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TABLES = {
    "internships": """
        CREATE TABLE IF NOT EXISTS internships (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255),
            company VARCHAR(255) NOT NULL,
            company_ar VARCHAR(255),
            location VARCHAR(100),
            location_ar VARCHAR(100),
            sector VARCHAR(100),
            sector_ar VARCHAR(100),
            duration VARCHAR(100),
            duration_ar VARCHAR(100),
            type VARCHAR(50) DEFAULT 'paid',
            stipend VARCHAR(100),
            stipend_ar VARCHAR(100),
            description TEXT,
            description_ar TEXT,
            skills JSONB DEFAULT '[]',
            deadline DATE,
            company_logo VARCHAR(10),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """,
    "internship_applications": """
        CREATE TABLE IF NOT EXISTS internship_applications (
            id SERIAL PRIMARY KEY,
            internship_id INTEGER REFERENCES internships(id),
            user_id INTEGER,
            status VARCHAR(50) DEFAULT 'pending',
            applied_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """,
    "gigs": """
        CREATE TABLE IF NOT EXISTS gigs (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255),
            company VARCHAR(255) NOT NULL,
            company_ar VARCHAR(255),
            company_rating NUMERIC(2,1) DEFAULT 0,
            company_reviews INTEGER DEFAULT 0,
            location VARCHAR(100),
            location_ar VARCHAR(100),
            budget VARCHAR(100),
            budget_ar VARCHAR(100),
            duration VARCHAR(100),
            duration_ar VARCHAR(100),
            description TEXT,
            description_ar TEXT,
            category VARCHAR(100),
            category_ar VARCHAR(100),
            skills JSONB DEFAULT '[]',
            is_featured BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            posted_at TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """,
    "gig_applications": """
        CREATE TABLE IF NOT EXISTS gig_applications (
            id SERIAL PRIMARY KEY,
            gig_id INTEGER REFERENCES gigs(id),
            user_id INTEGER,
            status VARCHAR(50) DEFAULT 'pending',
            applied_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            client_rating INTEGER,
            client_review TEXT,
            freelancer_rating INTEGER,
            freelancer_review TEXT
        )
    """,
    "career_plans": """
        CREATE TABLE IF NOT EXISTS career_plans (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            target_role VARCHAR(255),
            target_role_ar VARCHAR(255),
            current_stage VARCHAR(50),
            target_industry VARCHAR(100),
            timeline_months INTEGER DEFAULT 12,
            skill_gaps JSONB DEFAULT '[]',
            action_items JSONB DEFAULT '[]',
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """,
    "salary_benchmarks": """
        CREATE TABLE IF NOT EXISTS salary_benchmarks (
            id SERIAL PRIMARY KEY,
            role_title VARCHAR(255) NOT NULL,
            role_title_ar VARCHAR(255),
            industry VARCHAR(100),
            industry_ar VARCHAR(100),
            experience_level VARCHAR(50),
            min_salary INTEGER,
            median_salary INTEGER,
            max_salary INTEGER,
            currency VARCHAR(10) DEFAULT 'AED',
            location VARCHAR(100) DEFAULT 'UAE',
            data_year INTEGER DEFAULT 2026,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """,
    "portfolio_projects": """
        CREATE TABLE IF NOT EXISTS portfolio_projects (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255),
            description TEXT,
            description_ar TEXT,
            project_url VARCHAR(500),
            image_url VARCHAR(500),
            skills_demonstrated JSONB DEFAULT '[]',
            category VARCHAR(100),
            completion_date DATE,
            is_public BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """
}


def run_migration():
    database_url = os.getenv('DATABASE_URL', 'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey')
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()

        for table_name, sql in TABLES.items():
            try:
                cur.execute(sql)
                logger.info(f"✅ Table '{table_name}' — OK")
            except Exception as e:
                logger.warning(f"⚠️  Table '{table_name}' — {e}")

        cur.close()
        conn.close()
        logger.info("✅ Career services migration complete!")
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    run_migration()
