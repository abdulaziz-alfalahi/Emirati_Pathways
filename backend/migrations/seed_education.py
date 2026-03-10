"""
Seed universities, programs, scholarships, and LMS courses into the education tables.
Run: python migrations/seed_education.py
"""

import os
import sys
import psycopg2
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UNIVERSITIES = [
    {
        "name": "United Arab Emirates University",
        "name_ar": "جامعة الإمارات العربية المتحدة",
        "location": "Al Ain", "type": "public", "established": 1976,
        "ranking": 1, "students_count": 14000, "programs_count": 85,
        "website": "www.uaeu.ac.ae",
        "description": "The UAE's flagship university offering comprehensive programs across all disciplines with a focus on research and innovation.",
        "description_ar": "الجامعة الرائدة في الإمارات، تقدم برامج شاملة في جميع التخصصات مع التركيز على البحث والابتكار.",
        "specialties": ["Medicine", "Engineering", "Business", "Education", "Agriculture"],
    },
    {
        "name": "American University of Sharjah",
        "name_ar": "الجامعة الأمريكية في الشارقة",
        "location": "Sharjah", "type": "private", "established": 1997,
        "ranking": 2, "students_count": 6000, "programs_count": 45,
        "website": "www.aus.edu",
        "description": "Leading private university offering American-style education with strong programs in engineering, business, and liberal arts.",
        "description_ar": "جامعة خاصة رائدة تقدم تعليماً على النمط الأمريكي مع برامج قوية في الهندسة والأعمال والآداب.",
        "specialties": ["Engineering", "Computer Science", "Business", "Architecture", "Liberal Arts"],
    },
    {
        "name": "Khalifa University",
        "name_ar": "جامعة خليفة",
        "location": "Abu Dhabi", "type": "public", "established": 2007,
        "ranking": 3, "students_count": 3000, "programs_count": 35,
        "website": "www.ku.ac.ae",
        "description": "Research-intensive university focusing on science, engineering, and technology with world-class facilities.",
        "description_ar": "جامعة بحثية مكثفة تركز على العلوم والهندسة والتكنولوجيا بمرافق عالمية المستوى.",
        "specialties": ["Engineering", "Science", "Medicine", "Technology", "Research"],
    },
    {
        "name": "American University of Dubai",
        "name_ar": "الجامعة الأمريكية في دبي",
        "location": "Dubai", "type": "private", "established": 1995,
        "ranking": 4, "students_count": 2500, "programs_count": 25,
        "website": "www.aud.edu",
        "description": "Business-focused university with strong industry connections and practical learning approach.",
        "description_ar": "جامعة تركز على الأعمال مع روابط صناعية قوية ونهج تعليمي عملي.",
        "specialties": ["Business", "Engineering", "Communication", "Design", "Information Technology"],
    },
    {
        "name": "Emirates Aviation University",
        "name_ar": "جامعة الإمارات للطيران",
        "location": "Dubai", "type": "private", "established": 1991,
        "ranking": 5, "students_count": 2000, "programs_count": 18,
        "website": "www.eau.ac.ae",
        "description": "Specialized aviation and aerospace university with partnerships with Emirates Airlines and Dubai Airports.",
        "description_ar": "جامعة متخصصة في الطيران والفضاء بشراكة مع طيران الإمارات ومطارات دبي.",
        "specialties": ["Aviation", "Aerospace", "Engineering", "Management"],
    },
]

# Programs: (title, title_ar, degree, category, category_ar, description, description_ar,
#            duration, language, tuition, career_outcomes, subjects, skills_taught,
#            accreditation, rating, enrolled, capacity, employment_rate,
#            is_popular, is_new, scholarship_available, university_index)
PROGRAMS = [
    {
        "title": "Computer Science & Engineering", "title_ar": "علوم الحاسوب والهندسة",
        "degree": "bachelor", "category": "Technology", "category_ar": "تكنولوجيا",
        "description": "Comprehensive computer science program covering software engineering, AI, cybersecurity, and data science with hands-on industry projects.",
        "description_ar": "برنامج شامل في علوم الحاسوب يغطي هندسة البرمجيات والذكاء الاصطناعي والأمن السيبراني وعلوم البيانات.",
        "duration": "4 years", "language": "English", "tuition": "AED 65,000/yr",
        "career_outcomes": ["Software Engineer", "Data Scientist", "Cybersecurity Analyst", "AI Engineer"],
        "subjects": ["Programming", "Data Structures", "Machine Learning", "Cybersecurity"],
        "skills_taught": ["python", "javascript", "ai_ml", "cybersecurity", "data_analysis"],
        "accreditation": ["ABET", "UAE Ministry of Education"],
        "rating": 4.8, "enrolled": 1247, "capacity": 1400, "employment_rate": 96,
        "is_popular": True, "is_new": False, "scholarship_available": True, "uni_idx": 1,
    },
    {
        "title": "Medicine & Surgery", "title_ar": "الطب والجراحة",
        "degree": "bachelor", "category": "Healthcare", "category_ar": "رعاية صحية",
        "description": "Comprehensive medical education program preparing students for practice with clinical rotations in UAE hospitals.",
        "description_ar": "برنامج تعليم طبي شامل يُعدّ الطلاب للممارسة مع تدريب سريري في مستشفيات الإمارات.",
        "duration": "6 years", "language": "English", "tuition": "Free for UAE Nationals",
        "career_outcomes": ["General Practitioner", "Specialist Doctor", "Surgeon", "Medical Researcher"],
        "subjects": ["Anatomy", "Physiology", "Pathology", "Clinical Medicine"],
        "skills_taught": ["clinical_research", "public_health", "healthcare_admin"],
        "accreditation": ["LCME", "UAE Ministry of Health"],
        "rating": 4.9, "enrolled": 856, "capacity": 900, "employment_rate": 98,
        "is_popular": True, "is_new": False, "scholarship_available": True, "uni_idx": 0,
    },
    {
        "title": "Business Administration (MBA)", "title_ar": "إدارة الأعمال (MBA)",
        "degree": "master", "category": "Business", "category_ar": "أعمال",
        "description": "Executive MBA for working professionals focusing on strategic management, leadership, and innovation in the Middle East business environment.",
        "description_ar": "ماجستير إدارة أعمال تنفيذي للمهنيين العاملين يركز على الإدارة والقيادة والابتكار.",
        "duration": "2 years", "language": "English", "tuition": "AED 85,000/yr",
        "career_outcomes": ["CEO/Executive", "Management Consultant", "Business Development Manager", "Entrepreneur"],
        "subjects": ["Strategic Management", "Financial Analysis", "Marketing Strategy", "Leadership"],
        "skills_taught": ["leadership", "financial_analysis", "strategic_planning", "business_development"],
        "accreditation": ["AACSB", "UAE Ministry of Education"],
        "rating": 4.7, "enrolled": 324, "capacity": 400, "employment_rate": 94,
        "is_popular": True, "is_new": False, "scholarship_available": False, "uni_idx": 3,
    },
    {
        "title": "Renewable Energy Engineering", "title_ar": "هندسة الطاقة المتجددة",
        "degree": "bachelor", "category": "Engineering", "category_ar": "هندسة",
        "description": "Cutting-edge engineering program on sustainable energy technologies, solar power, and environmental engineering aligned with D33.",
        "description_ar": "برنامج هندسي متطور في تقنيات الطاقة المستدامة وأنظمة الطاقة الشمسية.",
        "duration": "4 years", "language": "English", "tuition": "AED 45,000/yr",
        "career_outcomes": ["Renewable Energy Engineer", "Solar System Designer", "Environmental Consultant", "Sustainability Manager"],
        "subjects": ["Solar Energy", "Wind Power", "Energy Storage", "Sustainable Design"],
        "skills_taught": ["renewable_energy", "sustainability", "environmental_science"],
        "accreditation": ["ABET", "UAE Ministry of Energy"],
        "rating": 4.6, "enrolled": 567, "capacity": 650, "employment_rate": 92,
        "is_popular": False, "is_new": True, "scholarship_available": True, "uni_idx": 2,
    },
    {
        "title": "Arabic Language & Literature", "title_ar": "اللغة العربية وآدابها",
        "degree": "bachelor", "category": "Arts & Humanities", "category_ar": "فنون وعلوم إنسانية",
        "description": "Arabic language and literature program preserving UAE cultural heritage while preparing students for education, media, and cultural careers.",
        "description_ar": "برنامج اللغة العربية وآدابها للحفاظ على التراث الثقافي الإماراتي.",
        "duration": "4 years", "language": "Arabic", "tuition": "Free for UAE Nationals",
        "career_outcomes": ["Arabic Teacher", "Translator", "Journalist", "Cultural Affairs Officer"],
        "subjects": ["Classical Arabic", "Modern Arabic Literature", "Poetry", "Linguistics"],
        "skills_taught": ["arabic_fluency", "communication", "presentation"],
        "accreditation": ["UAE Ministry of Education"],
        "rating": 4.5, "enrolled": 423, "capacity": 500, "employment_rate": 89,
        "is_popular": False, "is_new": False, "scholarship_available": True, "uni_idx": 0,
    },
    {
        "title": "Aviation Management", "title_ar": "إدارة الطيران",
        "degree": "bachelor", "category": "Aviation", "category_ar": "طيران",
        "description": "Specialized aviation program covering airline operations, airport management, and safety with Emirates Airlines partnership.",
        "description_ar": "برنامج طيران متخصص يشمل عمليات شركات الطيران وإدارة المطارات والسلامة.",
        "duration": "4 years", "language": "English", "tuition": "AED 75,000/yr",
        "career_outcomes": ["Airport Manager", "Airline Operations Manager", "Aviation Safety Officer"],
        "subjects": ["Aviation Operations", "Airport Management", "Aviation Safety", "Airline Economics"],
        "skills_taught": ["aviation_management", "leadership", "project_management"],
        "accreditation": ["ICAO", "UAE General Civil Aviation Authority"],
        "rating": 4.4, "enrolled": 289, "capacity": 350, "employment_rate": 91,
        "is_popular": False, "is_new": False, "scholarship_available": False, "uni_idx": 4,
    },
    {
        "title": "Artificial Intelligence", "title_ar": "الذكاء الاصطناعي",
        "degree": "master", "category": "Technology", "category_ar": "تكنولوجيا",
        "description": "Advanced AI and ML program covering deep learning, NLP, computer vision, and applied AI solutions for UAE national priorities.",
        "description_ar": "برنامج متقدم في الذكاء الاصطناعي يشمل التعلم العميق ومعالجة اللغة الطبيعية والرؤية الحاسوبية.",
        "duration": "2 years", "language": "English", "tuition": "AED 55,000/yr",
        "career_outcomes": ["AI Engineer", "ML Researcher", "Data Scientist", "AI Product Manager"],
        "subjects": ["Deep Learning", "NLP", "Computer Vision", "Reinforcement Learning"],
        "skills_taught": ["ai_ml", "deep_learning", "nlp", "python", "data_analysis"],
        "accreditation": ["UAE Ministry of Education"],
        "rating": 4.8, "enrolled": 180, "capacity": 200, "employment_rate": 97,
        "is_popular": True, "is_new": True, "scholarship_available": True, "uni_idx": 2,
    },
    {
        "title": "Cybersecurity", "title_ar": "الأمن السيبراني",
        "degree": "bachelor", "category": "Technology", "category_ar": "تكنولوجيا",
        "description": "Cybersecurity program focusing on network security, ethical hacking, digital forensics, and UAE national cyber defense.",
        "description_ar": "برنامج الأمن السيبراني يركز على أمن الشبكات والاختراق الأخلاقي والطب الشرعي الرقمي.",
        "duration": "4 years", "language": "English", "tuition": "AED 50,000/yr",
        "career_outcomes": ["Cybersecurity Specialist", "Security Analyst", "Penetration Tester", "CISO"],
        "subjects": ["Network Security", "Cryptography", "Digital Forensics", "Ethical Hacking"],
        "skills_taught": ["cybersecurity", "network_security", "python", "risk_assessment"],
        "accreditation": ["ABET", "UAE National Cybersecurity Authority"],
        "rating": 4.7, "enrolled": 420, "capacity": 500, "employment_rate": 95,
        "is_popular": True, "is_new": False, "scholarship_available": True, "uni_idx": 1,
    },
]

SCHOLARSHIPS = [
    {
        "title": "Talent33 STEM Excellence Scholarship",
        "title_ar": "منحة Talent33 للتميز في العلوم والتكنولوجيا",
        "provider": "Dubai Government", "provider_type": "government",
        "amount": 50000, "currency": "AED",
        "description": "Full scholarship for top Emirati students pursuing STEM degrees aligned with D33 economic priorities.",
        "description_ar": "منحة كاملة للطلاب الإماراتيين المتفوقين في تخصصات العلوم والتكنولوجيا.",
        "eligibility": ["UAE National", "GPA 3.5+", "STEM Major", "Under 25"],
        "required_gpa": 3.5, "available_slots": 100, "category": "STEM",
        "skills_required": ["python", "data_analysis", "ai_ml"],
    },
    {
        "title": "Emirati Women in Tech Scholarship",
        "title_ar": "منحة المرأة الإماراتية في التكنولوجيا",
        "provider": "UAE Ministry of Education", "provider_type": "government",
        "amount": 40000, "currency": "AED",
        "description": "Scholarship for Emirati women pursuing technology and engineering degrees.",
        "description_ar": "منحة للنساء الإماراتيات الملتحقات بتخصصات التكنولوجيا والهندسة.",
        "eligibility": ["UAE National", "Female", "GPA 3.0+", "Tech/Engineering"],
        "required_gpa": 3.0, "available_slots": 75, "category": "Technology",
        "skills_required": ["javascript", "python", "cybersecurity"],
    },
    {
        "title": "Future Leaders Scholarship",
        "title_ar": "منحة قادة المستقبل",
        "provider": "Mohammed bin Rashid Fund", "provider_type": "government",
        "amount": 60000, "currency": "AED",
        "description": "Prestigious scholarship for exceptional students demonstrating leadership potential in any field.",
        "description_ar": "منحة مرموقة للطلاب المتميزين الذين يظهرون إمكانات قيادية في أي مجال.",
        "eligibility": ["UAE National", "GPA 3.7+", "Leadership Experience", "Community Service"],
        "required_gpa": 3.7, "available_slots": 50, "category": "General",
        "skills_required": ["leadership", "communication", "project_management"],
    },
    {
        "title": "Green Economy Scholarship",
        "title_ar": "منحة الاقتصاد الأخضر",
        "provider": "Masdar Institute", "provider_type": "academic",
        "amount": 35000, "currency": "AED",
        "description": "Scholarship for students studying renewable energy, sustainability, and environmental sciences.",
        "description_ar": "منحة للطلاب الدارسين في الطاقة المتجددة والاستدامة والعلوم البيئية.",
        "eligibility": ["UAE National or Resident", "GPA 3.2+", "Sustainability Major"],
        "required_gpa": 3.2, "available_slots": 30, "category": "Engineering",
        "skills_required": ["sustainability", "environmental_science", "renewable_energy"],
    },
    {
        "title": "Healthcare Heroes Scholarship",
        "title_ar": "منحة أبطال الرعاية الصحية",
        "provider": "Abu Dhabi Health Authority", "provider_type": "government",
        "amount": 45000, "currency": "AED",
        "description": "Full tuition scholarship for students pursuing medical and healthcare degrees.",
        "description_ar": "منحة رسوم دراسية كاملة للطلاب الملتحقين بتخصصات الطب والرعاية الصحية.",
        "eligibility": ["UAE National", "GPA 3.6+", "Healthcare Major"],
        "required_gpa": 3.6, "available_slots": 40, "category": "Healthcare",
        "skills_required": ["clinical_research", "public_health"],
    },
]

LMS_COURSES = [
    {"title": "Python for Beginners", "title_ar": "بايثون للمبتدئين", "provider": "Coursera", "category": "Technology",
     "duration_hours": 40, "level": "beginner", "skills_covered": ["python"], "rating": 4.7, "enrollments": 3200, "certification_offered": True},
    {"title": "Data Analysis with Python", "title_ar": "تحليل البيانات باستخدام بايثون", "provider": "Udemy", "category": "Technology",
     "duration_hours": 60, "level": "intermediate", "skills_covered": ["data_analysis", "python", "data_visualization"], "rating": 4.6, "enrollments": 2100, "certification_offered": True},
    {"title": "Introduction to Cybersecurity", "title_ar": "مقدمة في الأمن السيبراني", "provider": "edX", "category": "Technology",
     "duration_hours": 30, "level": "beginner", "skills_covered": ["cybersecurity", "network_security"], "rating": 4.5, "enrollments": 1800, "certification_offered": True},
    {"title": "Leadership Essentials", "title_ar": "أساسيات القيادة", "provider": "LinkedIn Learning", "category": "Management",
     "duration_hours": 20, "level": "intermediate", "skills_covered": ["leadership", "communication"], "rating": 4.4, "enrollments": 4500, "certification_offered": False},
    {"title": "Project Management Professional (PMP)", "title_ar": "إدارة المشاريع الاحترافية", "provider": "Coursera", "category": "Management",
     "duration_hours": 80, "level": "advanced", "skills_covered": ["project_management", "agile_methodology", "risk_assessment"], "rating": 4.8, "enrollments": 2800, "certification_offered": True},
    {"title": "Cloud Architecture on AWS", "title_ar": "الهندسة السحابية على AWS", "provider": "AWS Academy", "category": "Technology",
     "duration_hours": 50, "level": "intermediate", "skills_covered": ["cloud_architecture", "aws", "devops"], "rating": 4.6, "enrollments": 1500, "certification_offered": True},
    {"title": "AI & Machine Learning Fundamentals", "title_ar": "أساسيات الذكاء الاصطناعي", "provider": "Google AI", "category": "Technology",
     "duration_hours": 45, "level": "beginner", "skills_covered": ["ai_ml", "python", "data_analysis"], "rating": 4.7, "enrollments": 3800, "certification_offered": True},
    {"title": "Financial Analysis Masterclass", "title_ar": "دورة متقدمة في التحليل المالي", "provider": "Udemy", "category": "Finance",
     "duration_hours": 35, "level": "intermediate", "skills_covered": ["financial_analysis", "accounting"], "rating": 4.3, "enrollments": 1200, "certification_offered": False},
]


def seed_education():
    """Seed all education data."""
    database_url = os.getenv('DATABASE_URL', 'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey')
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        logger.info("Connected. Seeding education data...")

        # 1. Universities
        uni_ids = []
        for u in UNIVERSITIES:
            cursor.execute("""
                INSERT INTO universities (name, name_ar, location, type, established, ranking,
                    students_count, programs_count, website, description, description_ar, specialties)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                RETURNING id
            """, (u['name'], u['name_ar'], u['location'], u['type'], u['established'],
                  u['ranking'], u['students_count'], u['programs_count'], u['website'],
                  u['description'], u['description_ar'], json.dumps(u['specialties'])))
            row = cursor.fetchone()
            uni_ids.append(row[0] if row else None)
        conn.commit()
        # If ids are None (already existed), fetch them
        if not all(uni_ids):
            for i, u in enumerate(UNIVERSITIES):
                if uni_ids[i] is None:
                    cursor.execute("SELECT id FROM universities WHERE name = %s", (u['name'],))
                    row = cursor.fetchone()
                    uni_ids[i] = row[0] if row else None
        print(f"  ✅ {len(uni_ids)} universities")

        # 2. Programs
        for p in PROGRAMS:
            uni_id = uni_ids[p['uni_idx']] if p['uni_idx'] < len(uni_ids) else None
            cursor.execute("""
                INSERT INTO university_programs (university_id, title, title_ar, degree, category, category_ar,
                    description, description_ar, duration, language, tuition, career_outcomes, subjects,
                    skills_taught, accreditation, rating, enrolled, capacity, employment_rate,
                    is_popular, is_new, scholarship_available)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT DO NOTHING
            """, (uni_id, p['title'], p['title_ar'], p['degree'], p['category'], p.get('category_ar', ''),
                  p['description'], p['description_ar'], p['duration'], p['language'], p['tuition'],
                  json.dumps(p['career_outcomes']), json.dumps(p['subjects']),
                  json.dumps(p['skills_taught']), json.dumps(p['accreditation']),
                  p['rating'], p['enrolled'], p['capacity'], p['employment_rate'],
                  p['is_popular'], p['is_new'], p['scholarship_available']))
        conn.commit()
        print(f"  ✅ {len(PROGRAMS)} university programs")

        # 3. Scholarships — use existing column names from Supabase schema
        for s in SCHOLARSHIPS:
            cursor.execute("""
                INSERT INTO scholarships (title, title_ar, provider_name, provider_type, amount,
                    description, description_ar, eligibility, min_gpa, available_slots, category,
                    skills_required, is_active)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,TRUE)
                ON CONFLICT DO NOTHING
            """, (s['title'], s['title_ar'], s['provider'], s['provider_type'], s['amount'],
                  s['description'], s['description_ar'], json.dumps(s['eligibility']),
                  s['required_gpa'], s['available_slots'], s['category'],
                  json.dumps(s['skills_required'])))
        conn.commit()
        print(f"  ✅ {len(SCHOLARSHIPS)} scholarships")

        # 4. LMS Courses
        for c in LMS_COURSES:
            cursor.execute("""
                INSERT INTO lms_courses (title, title_ar, provider, category, duration_hours, level,
                    skills_covered, rating, enrollments, certification_offered, active)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,TRUE)
                ON CONFLICT DO NOTHING
            """, (c['title'], c['title_ar'], c['provider'], c['category'], c['duration_hours'],
                  c['level'], json.dumps(c['skills_covered']), c['rating'], c['enrollments'],
                  c['certification_offered']))
        conn.commit()
        print(f"  ✅ {len(LMS_COURSES)} LMS courses")

        print(f"\n✅ Education data seeding complete!")
        cursor.close()
        conn.close()
        return True

    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = seed_education()
    sys.exit(0 if success else 1)
