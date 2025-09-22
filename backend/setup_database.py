#!/usr/bin/env python3
"""
Database Setup Script for Emirati Journey Platform
Creates PostgreSQL database, tables, and initial data
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging
from datetime import datetime
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'admin_user': 'postgres',
    'admin_password': '',  # Will prompt if needed
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def get_admin_password():
    """Get PostgreSQL admin password"""
    import getpass
    if not DB_CONFIG['admin_password']:
        DB_CONFIG['admin_password'] = getpass.getpass("Enter PostgreSQL admin password (or press Enter if no password): ")
        if not DB_CONFIG['admin_password']:
            DB_CONFIG['admin_password'] = None
    return DB_CONFIG['admin_password']

def create_database_and_user():
    """Create database and user"""
    try:
        logger.info("🔧 Creating database and user...")
        
        # Connect as admin
        admin_password = get_admin_password()
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['admin_user'],
            password=admin_password
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create user if not exists
        cursor.execute(f"""
            SELECT 1 FROM pg_roles WHERE rolname='{DB_CONFIG['user']}'
        """)
        if not cursor.fetchone():
            cursor.execute(f"""
                CREATE USER {DB_CONFIG['user']} WITH PASSWORD '{DB_CONFIG['password']}'
            """)
            logger.info(f"✅ Created user: {DB_CONFIG['user']}")
        else:
            logger.info(f"ℹ️ User {DB_CONFIG['user']} already exists")
        
        # Create database if not exists
        cursor.execute(f"""
            SELECT 1 FROM pg_database WHERE datname='{DB_CONFIG['database']}'
        """)
        if not cursor.fetchone():
            cursor.execute(f"""
                CREATE DATABASE {DB_CONFIG['database']} OWNER {DB_CONFIG['user']}
            """)
            logger.info(f"✅ Created database: {DB_CONFIG['database']}")
        else:
            logger.info(f"ℹ️ Database {DB_CONFIG['database']} already exists")
        
        # Grant privileges
        cursor.execute(f"""
            GRANT ALL PRIVILEGES ON DATABASE {DB_CONFIG['database']} TO {DB_CONFIG['user']}
        """)
        
        cursor.close()
        conn.close()
        logger.info("✅ Database and user setup completed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create database and user: {e}")
        return False

def create_tables():
    """Create all necessary tables"""
    try:
        logger.info("📋 Creating tables...")
        
        # Connect to the application database
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('candidate', 'recruiter', 'admin')),
                phone VARCHAR(50),
                location VARCHAR(255),
                emirate VARCHAR(100),
                company VARCHAR(255),
                job_title VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                profile_data JSONB DEFAULT '{}',
                preferences JSONB DEFAULT '{}'
            )
        """)
        
        # CV profiles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cv_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                cv_data JSONB NOT NULL,
                parsed_data JSONB DEFAULT '{}',
                skills JSONB DEFAULT '[]',
                experience_years INTEGER DEFAULT 0,
                education_level VARCHAR(100),
                languages JSONB DEFAULT '[]',
                location VARCHAR(255),
                emirate VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                quality_score FLOAT DEFAULT 0.0,
                completeness_score FLOAT DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Job descriptions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_descriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(500) NOT NULL,
                company VARCHAR(255),
                location VARCHAR(255),
                emirate VARCHAR(100),
                jd_data JSONB NOT NULL,
                parsed_data JSONB DEFAULT '{}',
                required_skills JSONB DEFAULT '[]',
                experience_level INTEGER DEFAULT 0,
                employment_type VARCHAR(100) DEFAULT 'Full-time',
                salary_range VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                quality_score FLOAT DEFAULT 0.0,
                compliance_score FLOAT DEFAULT 0.0,
                emiratization_friendly BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Job matches table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_matches (
                id SERIAL PRIMARY KEY,
                cv_profile_id INTEGER REFERENCES cv_profiles(id) ON DELETE CASCADE,
                job_description_id INTEGER REFERENCES job_descriptions(id) ON DELETE CASCADE,
                overall_score FLOAT NOT NULL,
                skills_score FLOAT DEFAULT 0.0,
                experience_score FLOAT DEFAULT 0.0,
                education_score FLOAT DEFAULT 0.0,
                location_score FLOAT DEFAULT 0.0,
                language_score FLOAT DEFAULT 0.0,
                cultural_score FLOAT DEFAULT 0.0,
                confidence FLOAT DEFAULT 0.0,
                match_data JSONB DEFAULT '{}',
                recommendations JSONB DEFAULT '[]',
                is_favorite BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Analytics events table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analytics_events (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                event_type VARCHAR(100) NOT NULL,
                category VARCHAR(100),
                action VARCHAR(255),
                data JSONB DEFAULT '{}',
                session_id VARCHAR(255),
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Enhanced JD analytics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jd_analytics (
                id SERIAL PRIMARY KEY,
                job_description_id INTEGER REFERENCES job_descriptions(id) ON DELETE CASCADE,
                analysis_type VARCHAR(100) NOT NULL,
                analysis_data JSONB NOT NULL,
                quality_metrics JSONB DEFAULT '{}',
                compliance_metrics JSONB DEFAULT '{}',
                uae_metrics JSONB DEFAULT '{}',
                performance_metrics JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # User sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                refresh_token VARCHAR(255) UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type)",
            "CREATE INDEX IF NOT EXISTS idx_cv_profiles_user_id ON cv_profiles(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_id ON job_descriptions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_job_matches_cv_id ON job_matches(cv_profile_id)",
            "CREATE INDEX IF NOT EXISTS idx_job_matches_jd_id ON job_matches(job_description_id)",
            "CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type)",
            "CREATE INDEX IF NOT EXISTS idx_jd_analytics_jd_id ON jd_analytics(job_description_id)",
            "CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info("✅ All tables created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")
        return False

def create_sample_data():
    """Create sample data for testing"""
    try:
        logger.info("📝 Creating sample data...")
        
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        cursor = conn.cursor()
        
        # Create sample candidate user
        candidate_password = hashlib.sha256("candidate123".encode()).hexdigest()
        cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, user_type, phone, location, emirate, is_verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
        """, (
            "ahmed.candidate@example.com",
            candidate_password,
            "Ahmed Al-Mansouri",
            "candidate",
            "+971 50 123 4567",
            "Dubai",
            "Dubai",
            True
        ))
        
        candidate_result = cursor.fetchone()
        if candidate_result:
            candidate_id = candidate_result[0]
            logger.info(f"✅ Created sample candidate: Ahmed Al-Mansouri (ID: {candidate_id})")
        else:
            # Get existing candidate ID
            cursor.execute("SELECT id FROM users WHERE email = %s", ("ahmed.candidate@example.com",))
            candidate_id = cursor.fetchone()[0]
            logger.info(f"ℹ️ Sample candidate already exists (ID: {candidate_id})")
        
        # Create sample recruiter user
        recruiter_password = hashlib.sha256("recruiter123".encode()).hexdigest()
        cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, user_type, phone, location, emirate, company, job_title, is_verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
        """, (
            "sara.recruiter@techcorp.ae",
            recruiter_password,
            "Sara Al-Zahra",
            "recruiter",
            "+971 50 987 6543",
            "Dubai",
            "Dubai",
            "TechCorp Dubai",
            "Senior Recruiter",
            True
        ))
        
        recruiter_result = cursor.fetchone()
        if recruiter_result:
            recruiter_id = recruiter_result[0]
            logger.info(f"✅ Created sample recruiter: Sara Al-Zahra (ID: {recruiter_id})")
        else:
            # Get existing recruiter ID
            cursor.execute("SELECT id FROM users WHERE email = %s", ("sara.recruiter@techcorp.ae",))
            recruiter_id = cursor.fetchone()[0]
            logger.info(f"ℹ️ Sample recruiter already exists (ID: {recruiter_id})")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info("✅ Sample data created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create sample data: {e}")
        return False

def test_connection():
    """Test database connection"""
    try:
        logger.info("🔍 Testing database connection...")
        
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        logger.info(f"✅ PostgreSQL Version: {version}")
        
        # Test table counts
        tables = ['users', 'cv_profiles', 'job_descriptions', 'job_matches', 'analytics_events']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            logger.info(f"📊 {table}: {count} records")
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Database connection test successful")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {e}")
        return False

def main():
    """Main setup function"""
    logger.info("🚀 Starting Emirati Journey Database Setup")
    logger.info("=" * 50)
    
    # Step 1: Create database and user
    if not create_database_and_user():
        logger.error("❌ Database setup failed at step 1")
        return False
    
    # Step 2: Create tables
    if not create_tables():
        logger.error("❌ Database setup failed at step 2")
        return False
    
    # Step 3: Create sample data
    if not create_sample_data():
        logger.error("❌ Database setup failed at step 3")
        return False
    
    # Step 4: Test connection
    if not test_connection():
        logger.error("❌ Database setup failed at step 4")
        return False
    
    logger.info("=" * 50)
    logger.info("🎉 Database setup completed successfully!")
    logger.info("")
    logger.info("📋 Database Configuration:")
    logger.info(f"   Host: {DB_CONFIG['host']}")
    logger.info(f"   Port: {DB_CONFIG['port']}")
    logger.info(f"   Database: {DB_CONFIG['database']}")
    logger.info(f"   User: {DB_CONFIG['user']}")
    logger.info("")
    logger.info("👥 Sample Users Created:")
    logger.info("   Candidate: ahmed.candidate@example.com / candidate123")
    logger.info("   Recruiter: sara.recruiter@techcorp.ae / recruiter123")
    logger.info("")
    logger.info("🔗 Connection String:")
    logger.info(f"   postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}")
    logger.info("")
    logger.info("✅ Ready to start the Flask application!")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
