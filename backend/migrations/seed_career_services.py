"""
Career Services — Seed Data
Seeds internships, gigs, and salary benchmarks matching the current frontend mock data.
Run: python migrations/seed_career_services.py
"""

import os
import sys
import json
import psycopg2
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


INTERNSHIPS = [
    {
        "title": "Software Engineering Intern", "title_ar": "متدرب هندسة برمجيات",
        "company": "Emirates NBD", "company_ar": "الإمارات دبي الوطني",
        "location": "Dubai", "location_ar": "دبي",
        "sector": "Banking & Finance", "sector_ar": "المصارف والتمويل",
        "duration": "3 months", "duration_ar": "3 أشهر",
        "type": "paid", "stipend": "AED 5,000/mo", "stipend_ar": "5,000 د.إ/شهر",
        "description": "Work with the digital banking team on mobile app features and API development",
        "description_ar": "العمل مع فريق الخدمات المصرفية الرقمية على ميزات التطبيق وتطوير واجهات البرمجة",
        "skills": ["React", "Node.js", "SQL"],
        "deadline": "2026-04-15", "company_logo": "🏦"
    },
    {
        "title": "Marketing & Communications Intern", "title_ar": "متدرب تسويق واتصالات",
        "company": "Dubai Tourism", "company_ar": "دبي للسياحة",
        "location": "Dubai", "location_ar": "دبي",
        "sector": "Government", "sector_ar": "الحكومة",
        "duration": "6 months", "duration_ar": "6 أشهر",
        "type": "paid", "stipend": "AED 4,500/mo", "stipend_ar": "4,500 د.إ/شهر",
        "description": "Support digital marketing campaigns and social media strategy for tourism initiatives",
        "description_ar": "دعم حملات التسويق الرقمي واستراتيجية وسائل التواصل لمبادرات السياحة",
        "skills": ["Marketing", "Content", "Analytics"],
        "deadline": "2026-03-30", "company_logo": "🏛️"
    },
    {
        "title": "Data Science Intern", "title_ar": "متدرب علم البيانات",
        "company": "Etisalat (e&)", "company_ar": "اتصالات (e&)",
        "location": "Abu Dhabi", "location_ar": "أبوظبي",
        "sector": "Technology", "sector_ar": "التكنولوجيا",
        "duration": "4 months", "duration_ar": "4 أشهر",
        "type": "paid", "stipend": "AED 6,000/mo", "stipend_ar": "6,000 د.إ/شهر",
        "description": "Develop ML models for customer analytics and network optimization projects",
        "description_ar": "تطوير نماذج التعلم الآلي لتحليل العملاء ومشاريع تحسين الشبكة",
        "skills": ["Python", "TensorFlow", "SQL"],
        "deadline": "2026-04-01", "company_logo": "📡"
    },
    {
        "title": "Architecture & Design Intern", "title_ar": "متدرب هندسة معمارية وتصميم",
        "company": "Emaar Properties", "company_ar": "إعمار العقارية",
        "location": "Dubai", "location_ar": "دبي",
        "sector": "Real Estate", "sector_ar": "العقارات",
        "duration": "3 months", "duration_ar": "3 أشهر",
        "type": "paid", "stipend": "AED 4,000/mo", "stipend_ar": "4,000 د.إ/شهر",
        "description": "Contribute to design concepts for upcoming mixed-use developments and community spaces",
        "description_ar": "المساهمة في مفاهيم التصميم للمشاريع متعددة الاستخدامات والمساحات المجتمعية القادمة",
        "skills": ["AutoCAD", "SketchUp", "Revit"],
        "deadline": "2026-05-01", "company_logo": "🏗️"
    },
    {
        "title": "Sustainability & ESG Intern", "title_ar": "متدرب الاستدامة والحوكمة البيئية",
        "company": "ADNOC", "company_ar": "أدنوك",
        "location": "Abu Dhabi", "location_ar": "أبوظبي",
        "sector": "Energy & Oil", "sector_ar": "الطاقة والنفط",
        "duration": "6 months", "duration_ar": "6 أشهر",
        "type": "paid", "stipend": "AED 7,000/mo", "stipend_ar": "7,000 د.إ/شهر",
        "description": "Support environmental impact assessments and sustainability reporting across operational units",
        "description_ar": "دعم تقييمات الأثر البيئي وتقارير الاستدامة عبر الوحدات التشغيلية",
        "skills": ["Sustainability", "Data Analysis", "Reporting"],
        "deadline": "2026-04-20", "company_logo": "⛽"
    },
    {
        "title": "Healthcare Innovation Intern", "title_ar": "متدرب ابتكار الرعاية الصحية",
        "company": "Cleveland Clinic Abu Dhabi", "company_ar": "كليفلاند كلينك أبوظبي",
        "location": "Abu Dhabi", "location_ar": "أبوظبي",
        "sector": "Healthcare", "sector_ar": "الرعاية الصحية",
        "duration": "3 months", "duration_ar": "3 أشهر",
        "type": "paid", "stipend": "AED 4,500/mo", "stipend_ar": "4,500 د.إ/شهر",
        "description": "Research and implement digital health tools for patient engagement and care coordination",
        "description_ar": "بحث وتطبيق أدوات الصحة الرقمية لتفاعل المرضى وتنسيق الرعاية",
        "skills": ["Research", "Health IT", "UX"],
        "deadline": "2026-03-25", "company_logo": "🏥"
    },
]

GIGS = [
    {
        "title": "Mobile App Developer", "title_ar": "مطوّر تطبيقات جوال",
        "company": "Careem", "company_ar": "كريم",
        "company_rating": 4.6, "company_reviews": 23,
        "location": "Remote", "location_ar": "عن بُعد",
        "budget": "AED 15,000", "budget_ar": "15,000 د.إ",
        "duration": "3 months", "duration_ar": "3 أشهر",
        "description": "Build a cross-platform delivery tracking module using React Native",
        "description_ar": "بناء وحدة تتبع التوصيل عبر المنصات باستخدام React Native",
        "category": "Technology", "category_ar": "التكنولوجيا",
        "skills": ["React Native", "TypeScript", "APIs"],
        "is_featured": True
    },
    {
        "title": "Content Strategist", "title_ar": "استراتيجي محتوى",
        "company": "Dubai Tourism", "company_ar": "دبي للسياحة",
        "company_rating": 4.8, "company_reviews": 41,
        "location": "Dubai", "location_ar": "دبي",
        "budget": "AED 8,000", "budget_ar": "8,000 د.إ",
        "duration": "6 weeks", "duration_ar": "6 أسابيع",
        "description": "Develop bilingual content strategy for tourism campaigns",
        "description_ar": "تطوير استراتيجية محتوى ثنائية اللغة للحملات السياحية",
        "category": "Marketing", "category_ar": "التسويق",
        "skills": ["Content Strategy", "Bilingual", "SEO"],
        "is_featured": True
    },
    {
        "title": "UI/UX Designer", "title_ar": "مصمّم واجهات",
        "company": "Noon.com", "company_ar": "نون.كوم",
        "company_rating": 4.3, "company_reviews": 18,
        "location": "Hybrid", "location_ar": "هجين",
        "budget": "AED 12,000", "budget_ar": "12,000 د.إ",
        "duration": "2 months", "duration_ar": "شهران",
        "description": "Redesign the checkout experience for the e-commerce super-app",
        "description_ar": "إعادة تصميم تجربة الدفع لتطبيق التجارة الإلكتروني",
        "category": "Design", "category_ar": "التصميم",
        "skills": ["Figma", "Prototyping", "User Research"],
        "is_featured": False
    },
    {
        "title": "Data Analyst", "title_ar": "محلّل بيانات",
        "company": "ADNOC", "company_ar": "أدنوك",
        "company_rating": 4.7, "company_reviews": 35,
        "location": "Abu Dhabi", "location_ar": "أبوظبي",
        "budget": "AED 10,000", "budget_ar": "10,000 د.إ",
        "duration": "4 weeks", "duration_ar": "4 أسابيع",
        "description": "Analyze production data and build dashboards for operations team",
        "description_ar": "تحليل بيانات الإنتاج وبناء لوحات تحكم لفريق العمليات",
        "category": "Technology", "category_ar": "التكنولوجيا",
        "skills": ["Python", "Power BI", "SQL"],
        "is_featured": False
    },
    {
        "title": "Arabic Translator", "title_ar": "مترجم عربي",
        "company": "Emirates Group", "company_ar": "مجموعة الإمارات",
        "company_rating": 4.9, "company_reviews": 52,
        "location": "Remote", "location_ar": "عن بُعد",
        "budget": "AED 5,000", "budget_ar": "5,000 د.إ",
        "duration": "2 weeks", "duration_ar": "أسبوعان",
        "description": "Translate aviation safety and compliance documents EN↔AR",
        "description_ar": "ترجمة وثائق السلامة والامتثال في مجال الطيران EN↔AR",
        "category": "Translation", "category_ar": "الترجمة",
        "skills": ["Legal Translation", "Aviation", "Proofreading"],
        "is_featured": True
    },
    {
        "title": "STEM Workshop Facilitator", "title_ar": "ميسّر ورش عمل STEM",
        "company": "KHDA", "company_ar": "هيئة المعرفة",
        "company_rating": 4.5, "company_reviews": 14,
        "location": "Dubai", "location_ar": "دبي",
        "budget": "AED 7,000", "budget_ar": "7,000 د.إ",
        "duration": "1 month", "duration_ar": "شهر واحد",
        "description": "Facilitate hands-on STEM workshops for K-12 students in Dubai schools",
        "description_ar": "تيسير ورش عمل STEM تطبيقية لطلاب المدارس في دبي",
        "category": "Education", "category_ar": "التعليم",
        "skills": ["Teaching", "STEM", "Curriculum Design"],
        "is_featured": False
    },
]

SALARY_BENCHMARKS = [
    {"role_title": "Software Engineer", "role_title_ar": "مهندس برمجيات", "industry": "Technology", "industry_ar": "التكنولوجيا", "experience_level": "junior", "min_salary": 12000, "median_salary": 16000, "max_salary": 22000},
    {"role_title": "Software Engineer", "role_title_ar": "مهندس برمجيات", "industry": "Technology", "industry_ar": "التكنولوجيا", "experience_level": "mid", "min_salary": 20000, "median_salary": 28000, "max_salary": 38000},
    {"role_title": "Software Engineer", "role_title_ar": "مهندس برمجيات", "industry": "Technology", "industry_ar": "التكنولوجيا", "experience_level": "senior", "min_salary": 35000, "median_salary": 45000, "max_salary": 65000},
    {"role_title": "Data Scientist", "role_title_ar": "عالم بيانات", "industry": "Technology", "industry_ar": "التكنولوجيا", "experience_level": "junior", "min_salary": 14000, "median_salary": 18000, "max_salary": 24000},
    {"role_title": "Data Scientist", "role_title_ar": "عالم بيانات", "industry": "Technology", "industry_ar": "التكنولوجيا", "experience_level": "mid", "min_salary": 22000, "median_salary": 32000, "max_salary": 42000},
    {"role_title": "Data Scientist", "role_title_ar": "عالم بيانات", "industry": "Technology", "industry_ar": "التكنولوجيا", "experience_level": "senior", "min_salary": 38000, "median_salary": 50000, "max_salary": 70000},
    {"role_title": "Marketing Manager", "role_title_ar": "مدير تسويق", "industry": "Marketing", "industry_ar": "التسويق", "experience_level": "mid", "min_salary": 18000, "median_salary": 25000, "max_salary": 35000},
    {"role_title": "Financial Analyst", "role_title_ar": "محلل مالي", "industry": "Banking & Finance", "industry_ar": "المصارف والتمويل", "experience_level": "junior", "min_salary": 15000, "median_salary": 20000, "max_salary": 28000},
    {"role_title": "Financial Analyst", "role_title_ar": "محلل مالي", "industry": "Banking & Finance", "industry_ar": "المصارف والتمويل", "experience_level": "senior", "min_salary": 30000, "median_salary": 42000, "max_salary": 60000},
    {"role_title": "Mechanical Engineer", "role_title_ar": "مهندس ميكانيكي", "industry": "Energy & Oil", "industry_ar": "الطاقة والنفط", "experience_level": "mid", "min_salary": 20000, "median_salary": 30000, "max_salary": 40000},
    {"role_title": "Healthcare Administrator", "role_title_ar": "مدير رعاية صحية", "industry": "Healthcare", "industry_ar": "الرعاية الصحية", "experience_level": "mid", "min_salary": 22000, "median_salary": 30000, "max_salary": 40000},
    {"role_title": "UX/UI Designer", "role_title_ar": "مصمم واجهات", "industry": "Technology", "industry_ar": "التكنولوجيا", "experience_level": "mid", "min_salary": 16000, "median_salary": 24000, "max_salary": 34000},
]


def seed():
    database_url = os.getenv('DATABASE_URL', 'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey')
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()

        # ── Internships ──
        cur.execute("SELECT COUNT(*) FROM internships")
        if cur.fetchone()[0] == 0:
            for item in INTERNSHIPS:
                cur.execute("""
                    INSERT INTO internships (title, title_ar, company, company_ar, location, location_ar,
                        sector, sector_ar, duration, duration_ar, type, stipend, stipend_ar,
                        description, description_ar, skills, deadline, company_logo)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    item['title'], item['title_ar'], item['company'], item['company_ar'],
                    item['location'], item['location_ar'], item['sector'], item['sector_ar'],
                    item['duration'], item['duration_ar'], item['type'], item['stipend'], item['stipend_ar'],
                    item['description'], item['description_ar'], json.dumps(item['skills']),
                    item['deadline'], item['company_logo']
                ))
            logger.info(f"✅ Seeded {len(INTERNSHIPS)} internships")
        else:
            logger.info("⏭️  Internships already seeded")

        # ── Gigs ──
        cur.execute("SELECT COUNT(*) FROM gigs")
        if cur.fetchone()[0] == 0:
            for item in GIGS:
                cur.execute("""
                    INSERT INTO gigs (title, title_ar, company, company_ar, company_rating, company_reviews,
                        location, location_ar, budget, budget_ar, duration, duration_ar,
                        description, description_ar, category, category_ar, skills, is_featured)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    item['title'], item['title_ar'], item['company'], item['company_ar'],
                    item['company_rating'], item['company_reviews'],
                    item['location'], item['location_ar'], item['budget'], item['budget_ar'],
                    item['duration'], item['duration_ar'], item['description'], item['description_ar'],
                    item['category'], item['category_ar'], json.dumps(item['skills']), item['is_featured']
                ))
            logger.info(f"✅ Seeded {len(GIGS)} gigs")
        else:
            logger.info("⏭️  Gigs already seeded")

        # ── Salary Benchmarks ──
        cur.execute("SELECT COUNT(*) FROM salary_benchmarks")
        if cur.fetchone()[0] == 0:
            for item in SALARY_BENCHMARKS:
                cur.execute("""
                    INSERT INTO salary_benchmarks (role_title, role_title_ar, industry, industry_ar,
                        experience_level, min_salary, median_salary, max_salary)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    item['role_title'], item['role_title_ar'], item['industry'], item['industry_ar'],
                    item['experience_level'], item['min_salary'], item['median_salary'], item['max_salary']
                ))
            logger.info(f"✅ Seeded {len(SALARY_BENCHMARKS)} salary benchmarks")
        else:
            logger.info("⏭️  Salary benchmarks already seeded")

        cur.close()
        conn.close()
        logger.info("✅ Career services seed complete!")
    except Exception as e:
        logger.error(f"❌ Seed failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    seed()
