#!/usr/bin/env python3
"""
Simple CV schema application
"""
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

try:
    # Database connection
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password'),
        port=os.getenv('DB_PORT', '5432')
    )
    
    print("📊 Connected to database")
    cursor = conn.cursor()
    
    # Create UUID extension
    cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    print("✅ UUID extension created")
    
    # Create cv_templates table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cv_templates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            category VARCHAR(50),
            template_data JSONB,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✅ cv_templates table created")
    
    # Create user_cvs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_cvs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            title VARCHAR(200) NOT NULL,
            template_id UUID REFERENCES cv_templates(id),
            language VARCHAR(10) DEFAULT 'en',
            personal_info JSONB NOT NULL DEFAULT '{}',
            professional_summary TEXT,
            technical_skills TEXT[],
            soft_skills TEXT[],
            languages_spoken JSONB DEFAULT '[]',
            work_experience JSONB DEFAULT '[]',
            education JSONB DEFAULT '[]',
            certifications JSONB DEFAULT '[]',
            projects JSONB DEFAULT '[]',
            cv_score INTEGER DEFAULT 0,
            ats_score INTEGER DEFAULT 0,
            last_analyzed_at TIMESTAMP,
            status VARCHAR(20) DEFAULT 'draft',
            is_public BOOLEAN DEFAULT false,
            sharing_token VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✅ user_cvs table created")
    
    # Create cv_versions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cv_versions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            cv_id UUID NOT NULL REFERENCES user_cvs(id) ON DELETE CASCADE,
            version_number INTEGER NOT NULL,
            cv_data JSONB NOT NULL,
            change_summary TEXT,
            created_by UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(cv_id, version_number)
        );
    """)
    print("✅ cv_versions table created")
    
    # Create cv_analytics table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cv_analytics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            cv_id UUID NOT NULL REFERENCES user_cvs(id) ON DELETE CASCADE,
            views_count INTEGER DEFAULT 0,
            downloads_count INTEGER DEFAULT 0,
            shares_count INTEGER DEFAULT 0,
            avg_time_spent INTEGER DEFAULT 0,
            bounce_rate DECIMAL(5,2) DEFAULT 0.0,
            applications_sent INTEGER DEFAULT 0,
            interviews_received INTEGER DEFAULT 0,
            job_offers_received INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✅ cv_analytics table created")
    
    # Insert default templates
    cursor.execute("""
        INSERT INTO cv_templates (name, display_name, description, category, template_data) VALUES
        (
            'government-executive',
            'Government Executive',
            'Professional template designed for UAE government positions and leadership roles',
            'government',
            '{"colors": {"primary": "#1e40af", "secondary": "#374151", "accent": "#059669"}, "fonts": {"title_size": 26, "heading_size": 18, "body_size": 11}, "layout": "traditional", "features": ["D33 Aligned", "Leadership Focus", "Government Style"]}'::jsonb
        ),
        (
            'tech-innovator',
            'Tech Innovator', 
            'Modern template for technology professionals in UAE digital transformation',
            'technology',
            '{"colors": {"primary": "#7c3aed", "secondary": "#0891b2", "accent": "#6b7280"}, "fonts": {"title_size": 24, "heading_size": 16, "body_size": 11}, "layout": "modern", "features": ["Talent33 Focus", "Innovation Highlight", "Tech Skills Matrix"]}'::jsonb
        ),
        (
            'business-leader',
            'Business Leader',
            'Executive template for business professionals and entrepreneurs in UAE market',
            'business', 
            '{"colors": {"primary": "#059669", "secondary": "#dc2626", "accent": "#6b7280"}, "fonts": {"title_size": 25, "heading_size": 17, "body_size": 11}, "layout": "executive", "features": ["Executive Style", "Results Driven", "UAE Market Focus"]}'::jsonb
        )
        ON CONFLICT (name) DO NOTHING;
    """)
    print("✅ Default templates inserted")
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_cvs_user_id ON user_cvs(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_cvs_status ON user_cvs(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cv_versions_cv_id ON cv_versions(cv_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cv_analytics_cv_id ON cv_analytics(cv_id);")
    print("✅ Indexes created")
    
    # Commit changes
    conn.commit()
    cursor.close()
    conn.close()
    
    print("🎉 CV storage schema applied successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")