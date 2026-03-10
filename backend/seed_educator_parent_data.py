"""
Seed script: create sample students, classes, grades, attendance, and guardian links
for the Educator and Parent dashboard wiring.

Usage:
    cd backend
    python seed_educator_parent_data.py
"""

import psycopg2
import psycopg2.extras
import os
import uuid
from datetime import date, timedelta, datetime

DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'
)


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def run():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # ── 0. Ensure tables exist (idempotent) ──────────────────────────────────
    cur.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            student_id VARCHAR(50) UNIQUE NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            arabic_name VARCHAR(200),
            date_of_birth DATE NOT NULL,
            gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
            nationality VARCHAR(100) DEFAULT 'UAE',
            emirate VARCHAR(50),
            email VARCHAR(255),
            phone VARCHAR(20),
            emergency_contact_name VARCHAR(200),
            emergency_contact_phone VARCHAR(20),
            emergency_contact_relationship VARCHAR(50),
            medical_conditions TEXT,
            special_needs TEXT,
            enrollment_date DATE DEFAULT CURRENT_DATE,
            graduation_date DATE,
            status VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS student_guardians (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            guardian_type VARCHAR(20) CHECK (guardian_type IN ('father', 'mother', 'guardian', 'sponsor')),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            arabic_name VARCHAR(200),
            email VARCHAR(255),
            phone VARCHAR(20),
            is_primary_contact BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Add user_id column to student_guardians if it doesn't exist yet
    try:
        cur.execute("""
            ALTER TABLE student_guardians
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
        """)
    except:
        conn.rollback()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS classes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            class_name VARCHAR(100) NOT NULL,
            grade_level VARCHAR(20),
            section VARCHAR(10),
            subject VARCHAR(100),
            academic_year VARCHAR(20) NOT NULL,
            educator_id INTEGER NOT NULL REFERENCES users(id),
            institution_id UUID,
            classroom VARCHAR(50),
            max_capacity INTEGER DEFAULT 30,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS enrollments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
            enrollment_date DATE DEFAULT CURRENT_DATE,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, class_id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
            attendance_date DATE NOT NULL,
            status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
            arrival_time TIME,
            marked_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, class_id, attendance_date)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS student_progress (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            class_id UUID REFERENCES classes(id),
            subject VARCHAR(100) NOT NULL,
            assessment_type VARCHAR(50),
            score DECIMAL(5,2),
            max_score DECIMAL(5,2),
            grade VARCHAR(5),
            assessment_date DATE,
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS student_achievements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            achievement_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS student_behavior (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            class_id UUID REFERENCES classes(id),
            incident_date DATE NOT NULL,
            incident_type VARCHAR(20) CHECK (incident_type IN ('positive', 'negative', 'neutral')),
            description TEXT,
            reported_by INTEGER NOT NULL REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    print("✅ Tables ensured")

    # ── 1. Find educator and parent user IDs ─────────────────────────────────
    cur.execute("SELECT id, phone, full_name, role FROM users WHERE role = 'educator' ORDER BY id LIMIT 1")
    educator_row = cur.fetchone()
    if not educator_row:
        print("⚠️  No educator user found. Creating one.")
        cur.execute("""
            INSERT INTO users (full_name, phone, role, is_verified)
            VALUES ('Dr. Sarah Al Rashidi', '+971550000011', 'educator', true)
            RETURNING id, phone, full_name, role
        """)
        educator_row = cur.fetchone()
        conn.commit()
    educator_id = educator_row['id']
    print(f"   Educator: id={educator_id}  phone={educator_row['phone']}  name={educator_row['full_name']}")

    cur.execute("SELECT id, phone, full_name, role FROM users WHERE role = 'parent' ORDER BY id LIMIT 1")
    parent_row = cur.fetchone()
    if not parent_row:
        print("⚠️  No parent user found. Creating one.")
        cur.execute("""
            INSERT INTO users (full_name, phone, role, is_verified)
            VALUES ('Mariam Al Falasi', '+971550000012', 'parent', true)
            RETURNING id, phone, full_name, role
        """)
        parent_row = cur.fetchone()
        conn.commit()
    parent_id = parent_row['id']
    print(f"   Parent:   id={parent_id}  phone={parent_row['phone']}  name={parent_row['full_name']}")

    # ── 2. Check if sample students already exist ────────────────────────────
    cur.execute("SELECT COUNT(*) AS cnt FROM students WHERE student_id IN ('STU-AHMED01', 'STU-FATIMA01')")
    if cur.fetchone()['cnt'] >= 2:
        print("✅ Sample students already seeded — skipping")
        cur.close()
        conn.close()
        return

    # ── 3. Create sample students ────────────────────────────────────────────
    students = [
        {
            'student_id': 'STU-AHMED01',
            'first_name': 'Ahmed', 'last_name': 'Al Mansoori',
            'arabic_name': 'أحمد المنصوري',
            'date_of_birth': '2010-03-15', 'gender': 'male',
            'nationality': 'UAE', 'emirate': 'Abu Dhabi',
            'email': 'ahmed.student@example.com',
            'grade_level': '11', 'status': 'active',
        },
        {
            'student_id': 'STU-FATIMA01',
            'first_name': 'Fatima', 'last_name': 'Al Mansoori',
            'arabic_name': 'فاطمة المنصوري',
            'date_of_birth': '2012-07-22', 'gender': 'female',
            'nationality': 'UAE', 'emirate': 'Abu Dhabi',
            'email': 'fatima.student@example.com',
            'grade_level': '9', 'status': 'active',
        },
        {
            'student_id': 'STU-OMAR01',
            'first_name': 'Omar', 'last_name': 'Al Rashid',
            'arabic_name': 'عمر الرشيد',
            'date_of_birth': '2009-11-03', 'gender': 'male',
            'nationality': 'UAE', 'emirate': 'Dubai',
            'email': 'omar.student@example.com',
            'grade_level': '12', 'status': 'active',
        },
    ]

    student_uuids = {}
    for s in students:
        cur.execute("""
            INSERT INTO students (student_id, first_name, last_name, arabic_name,
                date_of_birth, gender, nationality, emirate, email, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (student_id) DO NOTHING
            RETURNING id
        """, (
            s['student_id'], s['first_name'], s['last_name'], s['arabic_name'],
            s['date_of_birth'], s['gender'], s['nationality'], s['emirate'],
            s['email'], s['status']
        ))
        row = cur.fetchone()
        if row:
            student_uuids[s['student_id']] = row['id']
        else:
            cur.execute("SELECT id FROM students WHERE student_id = %s", (s['student_id'],))
            student_uuids[s['student_id']] = cur.fetchone()['id']
    conn.commit()
    print(f"✅ Students created: {list(student_uuids.keys())}")

    # ── 4. Create classes taught by the educator ─────────────────────────────
    subjects_config = [
        ('Mathematics', '11', 'A'),
        ('Physics', '11', 'A'),
        ('Arabic Language', '11', 'A'),
        ('English Language', '11', 'A'),
        ('Mathematics', '9', 'B'),
        ('Biology', '9', 'B'),
        ('Arabic Language', '9', 'B'),
        ('English Language', '9', 'B'),
        ('Computer Science', '12', 'A'),
        ('Chemistry', '12', 'A'),
    ]

    class_uuids = {}
    for subj, grade, section in subjects_config:
        key = f"{subj}_{grade}_{section}"
        cur.execute("""
            INSERT INTO classes (class_name, grade_level, section, subject, academic_year,
                educator_id, classroom)
            VALUES (%s, %s, %s, %s, '2025-2026', %s, %s)
            RETURNING id
        """, (
            f"{subj} — Grade {grade}", grade, section, subj,
            educator_id, f"Room {grade}{section}"
        ))
        class_uuids[key] = cur.fetchone()['id']
    conn.commit()
    print(f"✅ Classes created: {len(class_uuids)}")

    # ── 5. Enroll students in classes ────────────────────────────────────────
    enrollments = {
        'STU-AHMED01': [('Mathematics', '11', 'A'), ('Physics', '11', 'A'),
                         ('Arabic Language', '11', 'A'), ('English Language', '11', 'A')],
        'STU-FATIMA01': [('Mathematics', '9', 'B'), ('Biology', '9', 'B'),
                          ('Arabic Language', '9', 'B'), ('English Language', '9', 'B')],
        'STU-OMAR01': [('Computer Science', '12', 'A'), ('Chemistry', '12', 'A'),
                        ('Mathematics', '11', 'A'), ('English Language', '11', 'A')],
    }

    for stu_code, classes in enrollments.items():
        sid = student_uuids[stu_code]
        for subj, grade, section in classes:
            key = f"{subj}_{grade}_{section}"
            cid = class_uuids.get(key)
            if cid:
                try:
                    cur.execute("""
                        INSERT INTO enrollments (student_id, class_id, status)
                        VALUES (%s, %s, 'active')
                        ON CONFLICT (student_id, class_id) DO NOTHING
                    """, (sid, cid))
                except:
                    conn.rollback()
    conn.commit()
    print("✅ Enrollments created")

    # ── 6. Add student progress (grades) ─────────────────────────────────────
    grade_data = [
        # Ahmed — Grade 11
        ('STU-AHMED01', 'Mathematics', 'midterm', 92, 100, 'A', '2025-12-15', 'Excellent analytical skills'),
        ('STU-AHMED01', 'Physics', 'midterm', 88, 100, 'A-', '2025-12-15', 'Strong in mechanics, improve optics'),
        ('STU-AHMED01', 'Arabic Language', 'midterm', 85, 100, 'B+', '2025-12-15', 'Good literary analysis'),
        ('STU-AHMED01', 'English Language', 'midterm', 91, 100, 'A', '2025-12-15', 'Excellent communication skills'),
        # Fatima — Grade 9
        ('STU-FATIMA01', 'Mathematics', 'midterm', 95, 100, 'A', '2025-12-15', 'Outstanding performance'),
        ('STU-FATIMA01', 'Biology', 'midterm', 97, 100, 'A+', '2025-12-15', 'Top of class, deep understanding'),
        ('STU-FATIMA01', 'Arabic Language', 'midterm', 93, 100, 'A', '2025-12-15', 'Excellent writing'),
        ('STU-FATIMA01', 'English Language', 'midterm', 89, 100, 'A-', '2025-12-15', 'Strong vocabulary'),
        # Omar — Grade 12
        ('STU-OMAR01', 'Computer Science', 'midterm', 78, 100, 'B', '2025-12-15', 'Good coding, needs algorithm practice'),
        ('STU-OMAR01', 'Chemistry', 'midterm', 65, 100, 'C+', '2025-12-15', 'Needs improvement in organic chemistry'),
        ('STU-OMAR01', 'Mathematics', 'midterm', 72, 100, 'B-', '2025-12-15', 'Satisfactory, practice calculus more'),
        ('STU-OMAR01', 'English Language', 'midterm', 80, 100, 'B+', '2025-12-15', 'Good essay writing'),
    ]

    for stu_code, subj, atype, score, mscore, grade, adate, feedback in grade_data:
        sid = student_uuids[stu_code]
        cur.execute("""
            INSERT INTO student_progress (student_id, subject, assessment_type,
                score, max_score, grade, assessment_date, feedback)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (sid, subj, atype, score, mscore, grade, adate, feedback))
    conn.commit()
    print("✅ Grades created")

    # ── 7. Add attendance records (last 30 school days) ──────────────────────
    today = date.today()
    school_days = []
    d = today - timedelta(days=60)
    while d <= today:
        if d.weekday() < 5:  # Mon–Fri
            school_days.append(d)
        d += timedelta(days=1)
    school_days = school_days[-30:]  # keep last 30

    # Ahmed: 98% attendance, Fatima: 99%, Omar: 80%
    attendance_patterns = {
        'STU-AHMED01': 0.98,
        'STU-FATIMA01': 0.99,
        'STU-OMAR01': 0.80,
    }

    import random
    random.seed(42)

    for stu_code, rate in attendance_patterns.items():
        sid = student_uuids[stu_code]
        # Pick first class for this student
        first_class = list(enrollments.get(stu_code, []))[0] if enrollments.get(stu_code) else None
        if not first_class:
            continue
        key = f"{first_class[0]}_{first_class[1]}_{first_class[2]}"
        cid = class_uuids.get(key)
        if not cid:
            continue

        absent_days = set(random.sample(range(len(school_days)),
                                         max(0, int(len(school_days) * (1 - rate)))))
        for i, day in enumerate(school_days):
            status = 'absent' if i in absent_days else 'present'
            try:
                cur.execute("""
                    INSERT INTO attendance (student_id, class_id, attendance_date, status, marked_by)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (student_id, class_id, attendance_date) DO NOTHING
                """, (sid, cid, day, status, educator_id))
            except:
                conn.rollback()
    conn.commit()
    print("✅ Attendance records created")

    # ── 8. Add achievements ──────────────────────────────────────────────────
    achievements = [
        ('STU-AHMED01', 'Robotics Club — Regional 1st Place', '2025-11-20'),
        ('STU-AHMED01', 'Debate Team Captain', '2025-10-15'),
        ('STU-FATIMA01', 'Science Olympiad — Gold Medal', '2025-11-25'),
        ('STU-FATIMA01', 'Art Exhibition — Best Artwork', '2025-09-10'),
        ('STU-OMAR01', 'Hackathon Participant — Top 10', '2025-10-28'),
    ]
    for stu_code, title, adate in achievements:
        sid = student_uuids[stu_code]
        cur.execute("""
            INSERT INTO student_achievements (student_id, title, achievement_date)
            VALUES (%s, %s, %s)
        """, (sid, title, adate))
    conn.commit()
    print("✅ Achievements created")

    # ── 9. Link parent to children via student_guardians ─────────────────────
    guardian_links = [
        ('STU-AHMED01', 'father'),
        ('STU-FATIMA01', 'father'),
    ]
    for stu_code, gtype in guardian_links:
        sid = student_uuids[stu_code]
        cur.execute("""
            INSERT INTO student_guardians (student_id, user_id, guardian_type,
                first_name, last_name, arabic_name, is_primary_contact)
            VALUES (%s, %s, %s, %s, %s, %s, true)
        """, (
            sid, parent_id, gtype,
            parent_row['full_name'].split()[0],
            ' '.join(parent_row['full_name'].split()[1:]) or 'Al Mansoori',
            'ولي الأمر', 
        ))
    conn.commit()
    print("✅ Guardian links created")

    # ── Done ─────────────────────────────────────────────────────────────────
    cur.close()
    conn.close()
    print("\n🎉 Seed complete!")
    print(f"   Educator login: {educator_row['phone']}  OTP: 123456")
    print(f"   Parent login:   {parent_row['phone']}  OTP: 123456")


if __name__ == '__main__':
    run()
