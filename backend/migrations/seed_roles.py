"""
Seed Role Skill Requirements — UAE-relevant roles with required skills.
Populates role_skill_requirements and role_skill_details tables.
Run: python migrations/seed_roles.py
"""

import os
import sys
import psycopg2
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Skills referenced in roles that may not exist in the taxonomy yet
MISSING_SKILLS = [
    ("api_development", "API Development", "تطوير واجهات برمجية", "Technology", "Software Development", 0.82),
    ("network_security", "Network Security", "أمن الشبكات", "Technology", "Cybersecurity", 0.80),
    ("risk_assessment", "Risk Assessment", "تقييم المخاطر", "Management", "Risk Management", 0.70),
    ("agile_methodology", "Agile Methodology", "منهجية أجايل", "Management", "Project Management", 0.75),
    ("deep_learning", "Deep Learning", "التعلم العميق", "Technology", "AI & Machine Learning", 0.88),
    ("nlp", "Natural Language Processing", "معالجة اللغة الطبيعية", "Technology", "AI & Machine Learning", 0.85),
    ("talent_management", "Talent Management", "إدارة المواهب", "Management", "Human Resources", 0.65),
    ("content_creation", "Content Creation", "إنشاء المحتوى", "Creative", "Digital Marketing", 0.60),
    ("social_media", "Social Media Management", "إدارة وسائل التواصل", "Creative", "Digital Marketing", 0.58),
    ("graphic_design", "Graphic Design", "التصميم الجرافيكي", "Creative", "Design", 0.55),
    ("sustainability", "Sustainability", "الاستدامة", "Government", "Environment", 0.78),
    ("environmental_science", "Environmental Science", "العلوم البيئية", "Government", "Environment", 0.65),
    ("healthcare_informatics", "Healthcare Informatics", "المعلوماتية الصحية", "Healthcare", "Health IT", 0.72),
    ("business_analysis", "Business Analysis", "تحليل الأعمال", "Management", "Business", 0.68),
    ("data_visualization", "Data Visualization", "تصور البيانات", "Technology", "Data Science", 0.72),
]

# UAE-relevant roles with required skills and proficiency levels
ROLES = [
    {
        "role_id": "software_engineer",
        "role_title": "Software Engineer",
        "role_title_ar": "مهندس برمجيات",
        "industry": "Technology",
        "experience_years": 2,
        "emiratization_priority": True,
        "skills": [
            ("python", "advanced"), ("javascript", "advanced"), ("react", "intermediate"),
            ("cloud_architecture", "intermediate"), ("api_development", "intermediate"),
            ("cybersecurity", "beginner"), ("agile_methodology", "intermediate"),
        ]
    },
    {
        "role_id": "data_analyst",
        "role_title": "Data Analyst",
        "role_title_ar": "محلل بيانات",
        "industry": "Technology",
        "experience_years": 1,
        "emiratization_priority": True,
        "skills": [
            ("data_analysis", "advanced"), ("python", "intermediate"), ("sql_databases", "advanced"),
            ("data_visualization", "advanced"), ("ai_ml", "beginner"),
            ("business_analysis", "intermediate"), ("communication", "intermediate"),
        ]
    },
    {
        "role_id": "ai_engineer",
        "role_title": "AI / Machine Learning Engineer",
        "role_title_ar": "مهندس ذكاء اصطناعي",
        "industry": "Technology",
        "experience_years": 3,
        "emiratization_priority": True,
        "skills": [
            ("ai_ml", "expert"), ("python", "advanced"), ("data_analysis", "advanced"),
            ("deep_learning", "advanced"), ("cloud_architecture", "intermediate"),
            ("nlp", "intermediate"),
        ]
    },
    {
        "role_id": "cybersecurity_specialist",
        "role_title": "Cybersecurity Specialist",
        "role_title_ar": "أخصائي أمن سيبراني",
        "industry": "Technology",
        "experience_years": 3,
        "emiratization_priority": True,
        "skills": [
            ("cybersecurity", "expert"), ("network_security", "advanced"),
            ("cloud_architecture", "intermediate"), ("python", "intermediate"),
            ("risk_assessment", "advanced"),
        ]
    },
    {
        "role_id": "project_manager",
        "role_title": "Project Manager",
        "role_title_ar": "مدير مشاريع",
        "industry": "Management",
        "experience_years": 5,
        "emiratization_priority": True,
        "skills": [
            ("project_management", "expert"), ("agile_methodology", "advanced"),
            ("leadership", "advanced"), ("communication", "advanced"),
            ("risk_assessment", "intermediate"), ("business_analysis", "intermediate"),
        ]
    },
    {
        "role_id": "financial_analyst",
        "role_title": "Financial Analyst",
        "role_title_ar": "محلل مالي",
        "industry": "Financial Services",
        "experience_years": 2,
        "emiratization_priority": True,
        "skills": [
            ("financial_analysis", "advanced"), ("data_analysis", "intermediate"),
            ("business_analysis", "advanced"), ("communication", "intermediate"),
            ("risk_assessment", "intermediate"),
        ]
    },
    {
        "role_id": "hr_specialist",
        "role_title": "HR Specialist",
        "role_title_ar": "أخصائي موارد بشرية",
        "industry": "Human Resources",
        "experience_years": 2,
        "emiratization_priority": True,
        "skills": [
            ("hr_management", "advanced"), ("communication", "advanced"),
            ("leadership", "intermediate"), ("talent_management", "intermediate"),
            ("business_analysis", "beginner"),
        ]
    },
    {
        "role_id": "digital_marketer",
        "role_title": "Digital Marketing Specialist",
        "role_title_ar": "أخصائي تسويق رقمي",
        "industry": "Marketing",
        "experience_years": 2,
        "emiratization_priority": False,
        "skills": [
            ("digital_marketing", "advanced"), ("content_creation", "advanced"),
            ("data_analysis", "intermediate"), ("communication", "advanced"),
            ("social_media", "advanced"),
        ]
    },
    {
        "role_id": "cloud_architect",
        "role_title": "Cloud Solutions Architect",
        "role_title_ar": "مهندس حلول سحابية",
        "industry": "Technology",
        "experience_years": 5,
        "emiratization_priority": True,
        "skills": [
            ("cloud_architecture", "expert"), ("cybersecurity", "advanced"),
            ("devops", "advanced"), ("api_development", "advanced"),
            ("python", "intermediate"), ("leadership", "intermediate"),
        ]
    },
    {
        "role_id": "ux_designer",
        "role_title": "UX/UI Designer",
        "role_title_ar": "مصمم تجربة المستخدم",
        "industry": "Technology",
        "experience_years": 2,
        "emiratization_priority": False,
        "skills": [
            ("ui_ux_design", "expert"), ("graphic_design", "advanced"),
            ("communication", "intermediate"), ("data_analysis", "beginner"),
            ("agile_methodology", "intermediate"),
        ]
    },
    {
        "role_id": "sustainability_officer",
        "role_title": "Sustainability Officer",
        "role_title_ar": "مسؤول الاستدامة",
        "industry": "Government",
        "experience_years": 4,
        "emiratization_priority": True,
        "skills": [
            ("sustainability", "expert"), ("environmental_science", "advanced"),
            ("project_management", "intermediate"), ("communication", "advanced"),
            ("data_analysis", "intermediate"), ("leadership", "intermediate"),
        ]
    },
    {
        "role_id": "healthcare_admin",
        "role_title": "Healthcare Administrator",
        "role_title_ar": "مدير رعاية صحية",
        "industry": "Healthcare",
        "experience_years": 3,
        "emiratization_priority": True,
        "skills": [
            ("healthcare_informatics", "advanced"), ("leadership", "advanced"),
            ("project_management", "intermediate"), ("communication", "advanced"),
            ("data_analysis", "intermediate"),
        ]
    },
]


def seed_roles():
    """Seed role requirements into the database."""
    database_url = os.getenv('DATABASE_URL', 'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey')

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        logger.info("Connected. Seeding role skill requirements...")

        # Step 1: Insert any missing skills into taxonomy
        skills_added = 0
        for skill in MISSING_SKILLS:
            cursor.execute("""
                INSERT INTO skill_taxonomy (skill_id, name, name_ar, domain, category, demand_score)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (skill_id) DO NOTHING
            """, skill)
            skills_added += cursor.rowcount
        conn.commit()
        if skills_added:
            logger.info(f"Added {skills_added} missing skills to taxonomy")

        # Step 2: Seed roles
        roles_inserted = 0
        details_inserted = 0

        for role in ROLES:
            # Insert role
            cursor.execute("""
                INSERT INTO role_skill_requirements (role_id, role_title, role_title_ar,
                    industry, experience_years, emiratization_priority)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (role_id) DO UPDATE SET
                    role_title = EXCLUDED.role_title,
                    role_title_ar = EXCLUDED.role_title_ar,
                    industry = EXCLUDED.industry,
                    experience_years = EXCLUDED.experience_years,
                    emiratization_priority = EXCLUDED.emiratization_priority
            """, (
                role["role_id"], role["role_title"], role["role_title_ar"],
                role["industry"], role["experience_years"], role["emiratization_priority"]
            ))
            roles_inserted += 1

            # Insert skill details
            for skill_id, required_level in role["skills"]:
                cursor.execute("""
                    INSERT INTO role_skill_details (role_id, skill_id, required_level)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (role_id, skill_id) DO UPDATE SET
                        required_level = EXCLUDED.required_level
                """, (role["role_id"], skill_id, required_level))
                details_inserted += 1

        conn.commit()
        cursor.close()
        conn.close()

        print(f"\n✅ Seeded {roles_inserted} roles with {details_inserted} skill requirements")
        for role in ROLES:
            print(f"   • {role['role_title']} ({len(role['skills'])} skills)")
        return True

    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        print(f"\n❌ Seeding failed: {e}")
        return False


if __name__ == '__main__':
    success = seed_roles()
    sys.exit(0 if success else 1)
