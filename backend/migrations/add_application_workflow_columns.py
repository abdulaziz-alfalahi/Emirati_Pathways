"""
Migration: Add application workflow columns.

Adds:
- posted_by (recruiter user_id) to internships and gigs
- educator_id, educator_status, educator_notes, parent_notified_at to application tables
- startup_programs table (replacing hardcoded data)
"""

import psycopg2
import os
import json

DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'
)


def run_migration():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("=== Application Workflow Migration ===\n")

    # ── 1. Add posted_by to internships ──
    try:
        cur.execute("""
            ALTER TABLE internships
            ADD COLUMN IF NOT EXISTS posted_by INTEGER,
            ADD COLUMN IF NOT EXISTS company_id INTEGER
        """)
        conn.commit()
        print("✅ internships: added posted_by, company_id")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  internships alter: {e}")

    # ── 2. Add posted_by to gigs ──
    try:
        cur.execute("""
            ALTER TABLE gigs
            ADD COLUMN IF NOT EXISTS posted_by INTEGER,
            ADD COLUMN IF NOT EXISTS company_id INTEGER
        """)
        conn.commit()
        print("✅ gigs: added posted_by, company_id")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  gigs alter: {e}")

    # ── 3. Add approval workflow columns to internship_applications ──
    try:
        cur.execute("""
            ALTER TABLE internship_applications
            ADD COLUMN IF NOT EXISTS educator_id INTEGER,
            ADD COLUMN IF NOT EXISTS educator_status VARCHAR(20) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS educator_notes TEXT,
            ADD COLUMN IF NOT EXISTS parent_notified_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(200),
            ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(200)
        """)
        conn.commit()
        print("✅ internship_applications: added educator workflow columns")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  internship_applications alter: {e}")

    # ── 4. Add approval workflow columns to gig_applications ──
    try:
        cur.execute("""
            ALTER TABLE gig_applications
            ADD COLUMN IF NOT EXISTS educator_id INTEGER,
            ADD COLUMN IF NOT EXISTS educator_status VARCHAR(20) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS educator_notes TEXT,
            ADD COLUMN IF NOT EXISTS parent_notified_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(200),
            ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(200)
        """)
        conn.commit()
        print("✅ gig_applications: added educator workflow columns")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  gig_applications alter: {e}")

    # ── 5. Create startup_programs table ──
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS startup_programs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                name_ar VARCHAR(200),
                location VARCHAR(100),
                location_ar VARCHAR(100),
                description TEXT,
                description_ar TEXT,
                website VARCHAR(300),
                type VARCHAR(50),
                focus JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit()
        print("✅ startup_programs table created")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  startup_programs create: {e}")

    # ── 6. Seed startup_programs (if empty) ──
    try:
        cur.execute("SELECT COUNT(*) FROM startup_programs")
        count = cur.fetchone()[0]
        if count == 0:
            programs = [
                ("Hub71", "هب 71", "Abu Dhabi", "أبوظبي",
                 "Abu Dhabi's global tech ecosystem offering incentivized packages for startups",
                 "منظومة أبوظبي التقنية العالمية تقدم حزم حوافز للشركات الناشئة",
                 "hub71.com", "accelerator", json.dumps(["Technology", "FinTech", "HealthTech"])),
                ("in5", "in5", "Dubai", "دبي",
                 "TECOM Group's innovation centre supporting tech, media, and design startups",
                 "مركز الابتكار التابع لمجموعة تيكوم يدعم الشركات الناشئة في التكنولوجيا والإعلام والتصميم",
                 "in5.ae", "incubator", json.dumps(["Technology", "Media", "Design"])),
                ("DIFC FinTech Hive", "خلية التقنية المالية DIFC", "Dubai", "دبي",
                 "The region's first FinTech accelerator within DIFC",
                 "أول مسرّع للتقنية المالية في المنطقة ضمن مركز دبي المالي العالمي",
                 "fintechhive.difc.ae", "accelerator", json.dumps(["FinTech", "InsurTech", "RegTech"])),
                ("Sheraa", "شراع", "Sharjah", "الشارقة",
                 "Sharjah Entrepreneurship Center empowering innovators and entrepreneurs",
                 "مركز الشارقة لريادة الأعمال لتمكين المبتكرين ورواد الأعمال",
                 "sheraa.ae", "accelerator", json.dumps(["Social Impact", "EdTech", "Sustainability"])),
            ]
            for p in programs:
                cur.execute("""
                    INSERT INTO startup_programs (name, name_ar, location, location_ar,
                        description, description_ar, website, type, focus)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, p)
            conn.commit()
            print(f"✅ Seeded {len(programs)} startup programs")
        else:
            print(f"ℹ️  startup_programs already has {count} rows, skipping seed")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  startup_programs seed: {e}")

    # ── 7. Add educator approval columns to scholarship_applications (if table exists) ──
    try:
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'scholarship_applications'
            )
        """)
        if cur.fetchone()[0]:
            cur.execute("""
                ALTER TABLE scholarship_applications
                ADD COLUMN IF NOT EXISTS educator_id INTEGER,
                ADD COLUMN IF NOT EXISTS educator_status VARCHAR(20) DEFAULT 'pending',
                ADD COLUMN IF NOT EXISTS educator_notes TEXT,
                ADD COLUMN IF NOT EXISTS parent_notified_at TIMESTAMP
            """)
            conn.commit()
            print("✅ scholarship_applications: added educator workflow columns")
        else:
            print("ℹ️  scholarship_applications table does not exist, skipping")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  scholarship_applications alter: {e}")

    cur.close()
    conn.close()
    print("\n=== Migration complete ===")


if __name__ == '__main__':
    run_migration()
