"""
Seed script for Skills & Development tables.
Populates: training_programs, courses, candidate_certifications, candidate_assessments
"""
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def seed():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # ── 1. training_programs ──────────────────────────────────────
    cur.execute("SELECT COUNT(*) as c FROM training_programs")
    if cur.fetchone()['c'] == 0:
        programs = [
            ('UAE Government Leadership Program', 'برنامج القيادة الحكومية الإماراتية', 'Mohammed Bin Rashid Centre for Leadership Development', 'Leadership', '12 weeks', 'Advanced', 'https://mbrcld.ae', '["Strategic Planning","Public Policy","Governance","Leadership"]', 95, True, True),
            ('Fintech Innovation Bootcamp', 'معسكر ابتكار التكنولوجيا المالية', 'DIFC Innovation Hub', 'Finance', '8 weeks', 'Intermediate', 'https://difc.ae', '["Blockchain","Digital Payments","RegTech","Risk Management"]', 90, True, True),
            ('Smart City Technologies Workshop', 'ورشة تقنيات المدن الذكية', 'Dubai Future Foundation', 'Technology', '6 weeks', 'Intermediate', 'https://dubaifuture.gov.ae', '["IoT","Smart Infrastructure","Data Analytics","AI"]', 88, True, True),
            ('Energy Sector Digital Transformation', 'التحول الرقمي في قطاع الطاقة', 'DEWA Academy', 'Energy', '10 weeks', 'Advanced', 'https://dewa.gov.ae', '["Renewable Energy","Smart Grids","Sustainability","Digital Twins"]', 85, True, True),
            ('Healthcare Management Certificate', 'شهادة إدارة الرعاية الصحية', 'Dubai Health Authority', 'Healthcare', '8 weeks', 'Intermediate', 'https://dha.gov.ae', '["Healthcare Administration","Patient Safety","Quality Management"]', 82, True, True),
            ('Aviation Operations Excellence', 'التميز في عمليات الطيران', 'Emirates Aviation University', 'Aviation', '6 weeks', 'Advanced', 'https://eau.ac.ae', '["Aviation Safety","Operations Management","Logistics"]', 92, True, True),
            ('Project Management Professional (PMP)', 'إدارة المشاريع الاحترافية', 'PMI Arabia', 'Management', '10 weeks', 'Advanced', 'https://pmi.org', '["Project Planning","Risk Management","Agile","Scrum"]', 96, True, True),
            ('Cybersecurity Specialist Program', 'برنامج أخصائي الأمن السيبراني', 'Abu Dhabi Digital Authority', 'Technology', '12 weeks', 'Advanced', 'https://adda.gov.ae', '["Network Security","Ethical Hacking","Incident Response","Compliance"]', 91, True, True),
            ('Digital Marketing Mastery', 'إتقان التسويق الرقمي', 'Dubai Knowledge Village', 'Marketing', '6 weeks', 'Beginner', 'https://dkv.ae', '["SEO","Content Marketing","Social Media","Analytics"]', 78, True, True),
            ('Entrepreneurship & Innovation Lab', 'مختبر ريادة الأعمال والابتكار', 'Khalifa Fund', 'Business', '8 weeks', 'Intermediate', 'https://khalifafund.gov.ae', '["Business Modeling","Startup Finance","Pitching","Market Research"]', 86, True, True),
        ]
        for p in programs:
            cur.execute("""
                INSERT INTO training_programs (title, title_ar, provider, category, duration, level, url, skills_covered, relevance_score, active, certification_offered)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, p)
        conn.commit()
        print(f"✅ Seeded {len(programs)} training_programs")
    else:
        print("⏭️  training_programs already has data")

    # ── 2. courses (digital skills) ────────────────────────────────
    cur.execute("SELECT COUNT(*) as c FROM courses")
    if cur.fetchone()['c'] == 0:
        # Ensure educational_institutions has at least one entry
        cur.execute("SELECT id FROM educational_institutions LIMIT 1")
        inst_row = cur.fetchone()
        if not inst_row:
            try:
                cur.execute("""
                    INSERT INTO educational_institutions (name, institution_type, location, country, accreditation_status)
                    VALUES ('Dubai Digital Skills Academy', 'training_center', 'Dubai', 'UAE', 'accredited')
                    RETURNING id
                """)
                inst_row = cur.fetchone()
                conn.commit()
                print("  ✅ Created educational_institution: Dubai Digital Skills Academy")
            except Exception as e:
                conn.rollback()
                print(f"  ⚠️  Could not create institution: {e}")
                # Try minimal insert
                try:
                    cur.execute("""
                        INSERT INTO educational_institutions (name, institution_type)
                        VALUES ('Dubai Digital Skills Academy', 'training_center')
                        RETURNING id
                    """)
                    inst_row = cur.fetchone()
                    conn.commit()
                    print("  ✅ Created educational_institution (minimal)")
                except Exception as e2:
                    conn.rollback()
                    print(f"  ⚠️  Still failed: {e2}")
                    inst_row = None
        
        inst_id = inst_row['id'] if inst_row else None
        if not inst_id:
            print("  ⚠️  Cannot create institution, skipping courses")
        else:
            courses = [
                ('CS-CLOUD-101', 'Cloud Computing Fundamentals', 'Master AWS, Azure, and GCP cloud platforms with hands-on labs and real-world projects.', 'Beginner', 'Course', 'Cloud Computing', 6, 3, 50, 24, 'Online'),
                ('CS-FSTACK-201', 'Full-Stack Web Development', 'Build production-grade web applications with React, Node.js, TypeScript, and PostgreSQL.', 'Intermediate', 'Course', 'Software Engineering', 12, 6, 40, 18, 'Hybrid'),
                ('CS-CYBER-201', 'Cybersecurity Essentials', 'Learn network security, ethical hacking, and incident response to protect digital assets.', 'Intermediate', 'Course', 'Cybersecurity', 8, 4, 35, 15, 'Online'),
                ('CS-AIML-301', 'Data Science & Machine Learning', 'Train and deploy ML models using Python, TensorFlow, and scikit-learn on real datasets.', 'Advanced', 'Course', 'Artificial Intelligence', 10, 5, 30, 21, 'Online'),
                ('CS-UIUX-101', 'UI/UX Design Masterclass', 'Design beautiful, user-centered interfaces with Figma and modern design principles.', 'Beginner', 'Course', 'Design', 8, 3, 45, 12, 'Hybrid'),
                ('CS-DMARK-101', 'Digital Marketing & Analytics', 'Master SEO, social media, content marketing, and Google Analytics for business growth.', 'Beginner', 'Course', 'Marketing', 6, 3, 60, 32, 'Online'),
                ('CS-BLOCK-301', 'Blockchain Development', 'Build decentralized apps and smart contracts with Solidity and Ethereum.', 'Advanced', 'Course', 'Blockchain', 8, 4, 25, 8, 'Online'),
                ('CS-DEVOPS-201', 'DevOps & CI/CD Engineering', 'Automate software delivery with Docker, Kubernetes, Jenkins, and Terraform.', 'Intermediate', 'Course', 'DevOps', 8, 4, 35, 14, 'Online'),
            ]
            for c in courses:
                cur.execute("""
                    INSERT INTO courses (institution_id, course_code, course_name, course_description, course_level, course_type, subject_area, duration_weeks, credit_hours, max_students, current_enrollment, delivery_mode, is_active, is_published)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true, true)
                """, (inst_id, *c))
            conn.commit()
            print(f"✅ Seeded {len(courses)} courses")
    else:
        print("⏭️  courses already has data")

    # ── 3. candidate_certifications (for logged-in user demo) ─────
    cur.execute("SELECT COUNT(*) as c FROM candidate_certifications")
    if cur.fetchone()['c'] == 0:
        cur.execute("SELECT id FROM candidate_profiles LIMIT 3")
        profiles = [r['id'] for r in cur.fetchall()]
        if profiles:
            certs = [
                (profiles[0], 'Project Management Professional (PMP)', 'PMI Arabia', '2026-01-15', '2029-01-15', 'PMP-UAE-2026-1247', 'https://pmi.org/verify/PMP-UAE-2026-1247'),
                (profiles[0], 'Certified Scrum Master (CSM)', 'Scrum Alliance UAE', '2025-12-01', '2027-06-01', 'CSM-2025-8391', 'https://scrumalliance.org/verify/CSM-2025-8391'),
                (profiles[0], 'AWS Solutions Architect Associate', 'Amazon Web Services', '2025-11-10', '2028-11-10', 'AWS-SAA-2025-4521', 'https://aws.amazon.com/verify/AWS-SAA-2025-4521'),
            ]
            if len(profiles) > 1:
                certs.append((profiles[1], 'Google Data Analytics Certificate', 'Google', '2025-10-05', None, 'GDA-2025-7823', 'https://grow.google/verify/GDA-2025-7823'))
                certs.append((profiles[1], 'CompTIA Security+', 'CompTIA', '2025-09-20', '2028-09-20', 'SEC-PLUS-2025', 'https://comptia.org/verify/SEC-PLUS-2025'))
            for c in certs:
                cur.execute("""
                    INSERT INTO candidate_certifications (profile_id, name, issuing_organization, issue_date, expiry_date, credential_id, credential_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, c)
            conn.commit()
            print(f"✅ Seeded {len(certs)} candidate_certifications")
        else:
            print("⚠️  No candidate_profiles found, skipping certifications")
    else:
        print("⏭️  candidate_certifications already has data")

    # ── 4. candidate_assessments ──────────────────────────────────
    cur.execute("SELECT COUNT(*) as c FROM candidate_assessments")
    if cur.fetchone()['c'] == 0:
        cur.execute("SELECT id FROM candidate_profiles LIMIT 3")
        profiles = [r['id'] for r in cur.fetchall()]
        if profiles:
            assessments = [
                (profiles[0], 'Technical', 'Python Programming Assessment', 88, 100, 'completed', 'Technology'),
                (profiles[0], 'Technical', 'Cloud Architecture Assessment', 75, 100, 'completed', 'Technology'),
                (profiles[0], 'Soft Skills', 'Leadership Competency Assessment', 92, 100, 'completed', 'Management'),
                (profiles[0], 'Industry', 'Financial Services Knowledge Test', 70, 100, 'completed', 'Finance'),
            ]
            if len(profiles) > 1:
                assessments.append((profiles[1], 'Technical', 'Full-Stack Development Assessment', 82, 100, 'completed', 'Technology'))
                assessments.append((profiles[1], 'Soft Skills', 'Communication Skills Assessment', 90, 100, 'completed', 'General'))
            for a in assessments:
                cur.execute("""
                    INSERT INTO candidate_assessments (profile_id, assessment_type, title, score, max_score, status, d33_sector)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, a)
            conn.commit()
            print(f"✅ Seeded {len(assessments)} candidate_assessments")
        else:
            print("⚠️  No candidate_profiles found, skipping assessments")
    else:
        print("⏭️  candidate_assessments already has data")

    conn.close()
    print("\n✅ Seeding complete!")

if __name__ == '__main__':
    seed()
