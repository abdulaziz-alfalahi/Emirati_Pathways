"""
Migration: Create Intelligence Tables
Creates skill_taxonomy, user_skills, user_recommendations, career_stages tables
and seeds the skill taxonomy if empty.
"""

import psycopg2
import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME', 'emirati_pathways'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'postgres')
    )


def run_migration():
    conn = get_connection()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # ─── 1. skill_taxonomy ───
        cur.execute("""
            CREATE TABLE IF NOT EXISTS skill_taxonomy (
                skill_id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) DEFAULT '',
                domain VARCHAR(100) NOT NULL,
                category VARCHAR(100) DEFAULT '',
                description TEXT DEFAULT '',
                description_ar TEXT DEFAULT '',
                parent_skill_id VARCHAR(100),
                related_skills JSONB DEFAULT '[]',
                demand_level VARCHAR(50) DEFAULT 'moderate',
                demand_score FLOAT DEFAULT 0.5,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        logger.info("✅ skill_taxonomy table ensured")

        # ─── 2. user_skills ───
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_skills (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                skill_id VARCHAR(100) NOT NULL,
                skill_name VARCHAR(255) NOT NULL,
                proficiency VARCHAR(50) DEFAULT 'beginner',
                source VARCHAR(50) DEFAULT 'self_reported',
                verified BOOLEAN DEFAULT FALSE,
                evidence TEXT DEFAULT '',
                last_assessed TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, skill_id)
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id)")
        logger.info("✅ user_skills table ensured")

        # ─── 3. user_recommendations ───
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_recommendations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                recommendation_type VARCHAR(50) NOT NULL,
                title VARCHAR(500) NOT NULL,
                title_ar VARCHAR(500) DEFAULT '',
                description TEXT DEFAULT '',
                description_ar TEXT DEFAULT '',
                gap_skill VARCHAR(255) DEFAULT '',
                priority FLOAT DEFAULT 0,
                effort VARCHAR(100) DEFAULT '',
                action_url VARCHAR(500) DEFAULT '',
                provider VARCHAR(255) DEFAULT '',
                status VARCHAR(50) DEFAULT 'active',
                feedback VARCHAR(50),
                feedback_notes TEXT DEFAULT '',
                generated_at TIMESTAMP DEFAULT NOW(),
                acted_at TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_recs_user ON user_recommendations(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_recs_type ON user_recommendations(recommendation_type)")
        logger.info("✅ user_recommendations table ensured")

        # ─── 4. career_stages ───
        cur.execute("""
            CREATE TABLE IF NOT EXISTS career_stages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                current_stage VARCHAR(100) NOT NULL DEFAULT 'exploration',
                milestones_completed JSONB DEFAULT '[]',
                entered_at TIMESTAMP DEFAULT NOW(),
                advanced_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_career_stages_user ON career_stages(user_id)")
        logger.info("✅ career_stages table ensured")

        conn.commit()
        logger.info("✅ All intelligence tables created/verified")

        # ─── Seed skill taxonomy if empty ───
        cur.execute("SELECT COUNT(*) FROM skill_taxonomy")
        count = cur.fetchone()[0]
        if count == 0:
            logger.info("Seeding skill taxonomy with UAE-relevant skills...")
            seed_taxonomy(cur)
            conn.commit()
            cur.execute("SELECT COUNT(*) FROM skill_taxonomy")
            final_count = cur.fetchone()[0]
            logger.info(f"✅ Seeded {final_count} skills into skill_taxonomy")
        else:
            logger.info(f"ℹ️  skill_taxonomy already has {count} skills, skipping seed")

    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Migration failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()


def seed_taxonomy(cur):
    """Seed the skill taxonomy with UAE-relevant skills across all domains."""
    skills = [
        # Technology
        ("tech_python", "Python", "بايثون", "technology", "Programming Languages", 0.9),
        ("tech_javascript", "JavaScript", "جافاسكريبت", "technology", "Programming Languages", 0.9),
        ("tech_react", "React.js", "رياكت", "technology", "Frontend Frameworks", 0.85),
        ("tech_node", "Node.js", "نود.جي إس", "technology", "Backend Frameworks", 0.8),
        ("tech_aws", "AWS Cloud Services", "خدمات أمازون السحابية", "technology", "Cloud Computing", 0.9),
        ("tech_azure", "Microsoft Azure", "مايكروسوفت أزور", "technology", "Cloud Computing", 0.85),
        ("tech_docker", "Docker / Containers", "دوكر / الحاويات", "technology", "DevOps", 0.8),
        ("tech_kubernetes", "Kubernetes", "كوبرنيتس", "technology", "DevOps", 0.75),
        ("tech_sql", "SQL / Databases", "قواعد البيانات", "technology", "Data Management", 0.85),
        ("tech_ml", "Machine Learning", "تعلم الآلة", "technology", "AI / ML", 0.9),
        ("tech_data_science", "Data Science", "علم البيانات", "technology", "AI / ML", 0.85),
        ("tech_cybersecurity", "Cybersecurity", "الأمن السيبراني", "technology", "Security", 0.95),
        ("tech_blockchain", "Blockchain", "بلوك تشين", "technology", "Emerging Tech", 0.7),
        ("tech_iot", "Internet of Things", "إنترنت الأشياء", "technology", "Emerging Tech", 0.7),
        ("tech_ai", "Artificial Intelligence", "الذكاء الاصطناعي", "technology", "AI / ML", 0.95),
        # Business & Management
        ("biz_project_mgmt", "Project Management", "إدارة المشاريع", "business", "Management", 0.85),
        ("biz_strategic_planning", "Strategic Planning", "التخطيط الاستراتيجي", "business", "Strategy", 0.8),
        ("biz_financial_analysis", "Financial Analysis", "التحليل المالي", "business", "Finance", 0.85),
        ("biz_marketing", "Digital Marketing", "التسويق الرقمي", "business", "Marketing", 0.8),
        ("biz_leadership", "Leadership", "القيادة", "business", "Management", 0.85),
        ("biz_agile", "Agile / Scrum", "أجايل / سكرم", "business", "Methodology", 0.75),
        ("biz_analytics", "Business Analytics", "تحليلات الأعمال", "business", "Analytics", 0.8),
        ("biz_communication", "Business Communication", "التواصل المؤسسي", "business", "Soft Skills", 0.7),
        # Energy & Engineering
        ("eng_petroleum", "Petroleum Engineering", "هندسة البترول", "engineering", "Energy", 0.85),
        ("eng_renewable", "Renewable Energy", "الطاقة المتجددة", "engineering", "Energy", 0.9),
        ("eng_civil", "Civil Engineering", "الهندسة المدنية", "engineering", "Construction", 0.75),
        ("eng_mechanical", "Mechanical Engineering", "الهندسة الميكانيكية", "engineering", "Manufacturing", 0.7),
        ("eng_electrical", "Electrical Engineering", "الهندسة الكهربائية", "engineering", "Electronics", 0.75),
        # Healthcare
        ("health_clinical", "Clinical Skills", "المهارات السريرية", "healthcare", "Clinical", 0.8),
        ("health_public", "Public Health", "الصحة العامة", "healthcare", "Public Health", 0.85),
        ("health_informatics", "Health Informatics", "المعلوماتية الصحية", "healthcare", "Technology", 0.8),
        ("health_pharma", "Pharmaceutical Sciences", "العلوم الصيدلانية", "healthcare", "Pharmacy", 0.75),
        # Finance (UAE-critical)
        ("fin_islamic", "Islamic Finance", "التمويل الإسلامي", "finance", "Specialized Finance", 0.9),
        ("fin_risk", "Risk Management", "إدارة المخاطر", "finance", "Risk", 0.85),
        ("fin_fintech", "FinTech", "التقنية المالية", "finance", "Technology", 0.9),
        ("fin_accounting", "Accounting / IFRS", "المحاسبة", "finance", "Accounting", 0.8),
        ("fin_investment", "Investment Analysis", "تحليل الاستثمار", "finance", "Investment", 0.8),
        # Soft Skills / Core Competencies
        ("soft_arabic", "Arabic Language (Business)", "اللغة العربية (أعمال)", "core", "Languages", 0.9),
        ("soft_english", "English Language (Business)", "اللغة الإنجليزية (أعمال)", "core", "Languages", 0.85),
        ("soft_critical_thinking", "Critical Thinking", "التفكير النقدي", "core", "Cognitive", 0.75),
        ("soft_teamwork", "Teamwork & Collaboration", "العمل الجماعي والتعاون", "core", "Interpersonal", 0.7),
        ("soft_problem_solving", "Problem Solving", "حل المشكلات", "core", "Cognitive", 0.8),
        ("soft_presentation", "Presentation Skills", "مهارات العرض", "core", "Communication", 0.7),
        # Government & Public Sector
        ("gov_policy", "Public Policy Analysis", "تحليل السياسات العامة", "government", "Policy", 0.8),
        ("gov_governance", "Corporate Governance", "الحوكمة المؤسسية", "government", "Governance", 0.85),
        ("gov_emiratization", "Emiratization Strategy", "استراتيجية التوطين", "government", "National Programs", 0.9),
        ("gov_smart_gov", "Smart Government", "الحكومة الذكية", "government", "Digital Transformation", 0.85),
        # Hospitality & Tourism (UAE-critical)
        ("hosp_management", "Hospitality Management", "إدارة الضيافة", "hospitality", "Management", 0.8),
        ("hosp_tourism", "Tourism Development", "تطوير السياحة", "hospitality", "Tourism", 0.75),
        ("hosp_events", "Event Management", "إدارة الفعاليات", "hospitality", "Events", 0.7),
    ]

    for skill_id, name, name_ar, domain, category, demand_score in skills:
        cur.execute("""
            INSERT INTO skill_taxonomy (skill_id, name, name_ar, domain, category, demand_score, demand_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (skill_id) DO NOTHING
        """, (
            skill_id, name, name_ar, domain, category, demand_score,
            'critical' if demand_score >= 0.9 else 'high' if demand_score >= 0.8 else 'moderate'
        ))


if __name__ == '__main__':
    run_migration()
