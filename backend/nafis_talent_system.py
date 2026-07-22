"""
NAFIS Talent System

Handles importing job seekers from NAFIS CSV exports (26 columns),
creating user accounts, tracking import batches, and managing
magic link invitations for seeker onboarding.
"""

import csv
import io
import os
import uuid
import json
import secrets
import logging
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Inlined schema (avoids file-path issues at runtime)
# ─────────────────────────────────────────────────────────────
_SCHEMA_SQL = """
-- Import batch tracking
CREATE TABLE IF NOT EXISTS nafis_import_batches (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    uploaded_by INTEGER,
    filename VARCHAR(255),
    total_records INTEGER DEFAULT 0,
    successful INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    duplicates INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nafis_batches_code ON nafis_import_batches(batch_code);

-- Job seeker records (all 26 NAFIS CSV columns)
CREATE TABLE IF NOT EXISTS nafis_job_seekers (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES nafis_import_batches(id) ON DELETE SET NULL,

    -- Core identity
    emirates_id VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    full_name_arabic VARCHAR(255),
    gender VARCHAR(20),
    date_of_birth DATE,
    age_group VARCHAR(30),
    marital_status VARCHAR(30),

    -- Education
    education_level VARCHAR(100),
    gpa DECIMAL(4,2),
    is_student BOOLEAN DEFAULT FALSE,
    specialization VARCHAR(200),
    sub_specialization VARCHAR(200),

    -- Work
    experience_years INTEGER DEFAULT 0,
    job_seeker_type VARCHAR(50),
    job_seeker_date DATE,
    preferred_work_mode VARCHAR(50),
    national_service VARCHAR(50),

    -- Location
    emirate_of_origin VARCHAR(50),
    emirate_of_residence VARCHAR(50),
    city_name VARCHAR(100),
    city_name_ar VARCHAR(100),

    -- Contact
    phone VARCHAR(30),
    email VARCHAR(255),

    -- Accessibility
    is_person_of_determination BOOLEAN DEFAULT FALSE,
    determination_type VARCHAR(100),

    -- NAFIS metadata
    registered_on DATE,

    -- Platform link
    user_id INTEGER,
    status VARCHAR(30) DEFAULT 'imported',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seeker invitations (magic links)
CREATE TABLE IF NOT EXISTS seeker_invitations (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    seeker_id INTEGER REFERENCES nafis_job_seekers(id) ON DELETE CASCADE,
    seeker_name VARCHAR(255),
    seeker_email VARCHAR(255),
    invited_by INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""

# Migration: add columns that may be missing from earlier schema versions.
# Must run BEFORE the CREATE INDEX statements that reference new columns.
_MIGRATION_SQL = """
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS full_name_arabic VARCHAR(255);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS age_group VARCHAR(30);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS gpa DECIMAL(4,2);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT FALSE;
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS specialization VARCHAR(200);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS sub_specialization VARCHAR(200);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS job_seeker_type VARCHAR(50);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS job_seeker_date DATE;
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS preferred_work_mode VARCHAR(50);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS national_service VARCHAR(50);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS emirate_of_origin VARCHAR(50);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS emirate_of_residence VARCHAR(50);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS city_name VARCHAR(100);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS city_name_ar VARCHAR(100);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS is_person_of_determination BOOLEAN DEFAULT FALSE;
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS determination_type VARCHAR(100);
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS registered_on DATE;
ALTER TABLE nafis_job_seekers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Fix status CHECK constraint to allow all valid statuses
ALTER TABLE nafis_job_seekers DROP CONSTRAINT IF EXISTS nafis_job_seekers_status_check;
ALTER TABLE nafis_job_seekers ADD CONSTRAINT nafis_job_seekers_status_check
    CHECK (status IN ('imported', 'invited', 'profile_created', 'matched', 'placed', 'inactive'));
"""

# Indexes — safe to run AFTER migration has added all columns
_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_nafis_seekers_eid ON nafis_job_seekers(emirates_id);
CREATE INDEX IF NOT EXISTS idx_nafis_seekers_status ON nafis_job_seekers(status);
CREATE INDEX IF NOT EXISTS idx_nafis_seekers_batch ON nafis_job_seekers(batch_id);
CREATE INDEX IF NOT EXISTS idx_nafis_seekers_email ON nafis_job_seekers(email);
CREATE INDEX IF NOT EXISTS idx_seeker_inv_token ON seeker_invitations(token);
"""


class NafisTalentSystem:

    def __init__(self, db_connection=None):
        self.conn = db_connection
        self._tables_ensured = False

    def _get_db_connection(self):
        if self.conn and not self.conn.closed:
            return self.conn
        try:
            dbname = os.getenv('DB_NAME', 'emirati_journey')
            logger.info(f"NafisTalentSystem connecting to DB: {dbname}")
            return psycopg2.connect(
                dbname=dbname,
                user=os.getenv('DB_USER', 'admin'),
                password=os.getenv('DB_PASSWORD', 'admin'),
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', 5432)
            )
        except Exception as e:
            logger.error(f"NafisTalentSystem DB connection failed: {e}")
            raise

    def ensure_tables(self):
        if self._tables_ensured:
            return
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                # 1. Create tables (skipped if already exist)
                cur.execute(_SCHEMA_SQL)
            conn.commit()

            with conn.cursor() as cur:
                # 2. Add any missing columns to existing tables
                cur.execute(_MIGRATION_SQL)
            conn.commit()

            with conn.cursor() as cur:
                # 3. Create indexes (safe now that all columns exist)
                cur.execute(_INDEX_SQL)
            conn.commit()

            self._tables_ensured = True
            logger.info("NAFIS talent tables ensured")
        except Exception as e:
            logger.error(f"Error ensuring NAFIS tables: {e}")
            try:
                conn.rollback()
            except Exception:
                pass

    # ══════════════════════════════════════════════════════════
    # CSV Import  (all 26 columns)
    # ══════════════════════════════════════════════════════════
    def import_job_seekers_from_csv(self, csv_content, uploaded_by=None, filename=None):
        self.ensure_tables()
        conn = self._get_db_connection()

        report = {
            'batch_code': None, 'total_rows': 0,
            'successful': 0, 'duplicates': 0, 'failed': 0,
            'errors': [],
        }

        try:
            if isinstance(csv_content, bytes):
                csv_content = csv_content.decode('utf-8-sig')

            reader = csv.DictReader(io.StringIO(csv_content))
            batch_code = f"NAFIS-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            report['batch_code'] = batch_code

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    INSERT INTO nafis_import_batches (batch_code, uploaded_by, filename, status)
                    VALUES (%s, %s, %s, 'processing') RETURNING id
                """, (batch_code, uploaded_by, filename))
                batch_id = cur.fetchone()['id']

                for row in reader:
                    report['total_rows'] += 1
                    try:
                        cur.execute("SAVEPOINT sp_row")
                        rec = self._parse_row(row)

                        if not rec['emirates_id'] or not rec['full_name']:
                            report['failed'] += 1
                            report['errors'].append(f"Row {report['total_rows']}: Missing EID or FullName")
                            cur.execute("RELEASE SAVEPOINT sp_row")
                            continue

                        # Duplicate check — upsert to backfill missing columns
                        cur.execute("SELECT id FROM nafis_job_seekers WHERE emirates_id = %s", (rec['emirates_id'],))
                        existing = cur.fetchone()
                        if existing:
                            # UPDATE existing record with fresh data
                            cur.execute("""
                                UPDATE nafis_job_seekers SET
                                    full_name = COALESCE(NULLIF(%s,''), full_name),
                                    full_name_arabic = COALESCE(NULLIF(%s,''), full_name_arabic),
                                    gender = COALESCE(NULLIF(%s,''), gender),
                                    date_of_birth = COALESCE(%s, date_of_birth),
                                    age_group = COALESCE(NULLIF(%s,''), age_group),
                                    marital_status = COALESCE(NULLIF(%s,''), marital_status),
                                    education_level = COALESCE(NULLIF(%s,''), education_level),
                                    gpa = COALESCE(%s, gpa),
                                    is_student = COALESCE(%s, is_student),
                                    specialization = COALESCE(NULLIF(%s,''), specialization),
                                    sub_specialization = COALESCE(NULLIF(%s,''), sub_specialization),
                                    experience_years = COALESCE(%s, experience_years),
                                    job_seeker_type = COALESCE(NULLIF(%s,''), job_seeker_type),
                                    job_seeker_date = COALESCE(%s, job_seeker_date),
                                    preferred_work_mode = COALESCE(NULLIF(%s,''), preferred_work_mode),
                                    national_service = COALESCE(NULLIF(%s,''), national_service),
                                    emirate_of_origin = COALESCE(NULLIF(%s,''), emirate_of_origin),
                                    emirate_of_residence = COALESCE(NULLIF(%s,''), emirate_of_residence),
                                    city_name = COALESCE(NULLIF(%s,''), city_name),
                                    city_name_ar = COALESCE(NULLIF(%s,''), city_name_ar),
                                    phone = COALESCE(NULLIF(%s,''), phone),
                                    email = COALESCE(NULLIF(%s,''), email),
                                    is_person_of_determination = COALESCE(%s, is_person_of_determination),
                                    determination_type = COALESCE(NULLIF(%s,''), determination_type),
                                    registered_on = COALESCE(%s, registered_on),
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE emirates_id = %s
                            """, (
                                rec['full_name'], rec['full_name_arabic'],
                                rec['gender'], rec['date_of_birth'], rec['age_group'], rec['marital_status'],
                                rec['education_level'], rec['gpa'], rec['is_student'],
                                rec['specialization'], rec['sub_specialization'],
                                rec['experience_years'], rec['job_seeker_type'], rec['job_seeker_date'],
                                rec['preferred_work_mode'], rec['national_service'],
                                rec['emirate_of_origin'], rec['emirate_of_residence'],
                                rec['city_name'], rec['city_name_ar'],
                                rec['phone'], rec['email'],
                                rec['is_person_of_determination'], rec['determination_type'],
                                rec['registered_on'],
                                rec['emirates_id'],
                            ))
                            report['duplicates'] += 1
                            report['successful'] += 1
                            cur.execute("RELEASE SAVEPOINT sp_row")
                            continue

                        cur.execute("""
                            INSERT INTO nafis_job_seekers (
                                batch_id, emirates_id, full_name, full_name_arabic,
                                gender, date_of_birth, age_group, marital_status,
                                education_level, gpa, is_student, specialization, sub_specialization,
                                experience_years, job_seeker_type, job_seeker_date, preferred_work_mode,
                                national_service,
                                emirate_of_origin, emirate_of_residence, city_name, city_name_ar,
                                phone, email,
                                is_person_of_determination, determination_type,
                                registered_on, status
                            ) VALUES (
                                %s,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s,%s, %s,%s,%s,%s, %s, %s,%s,%s,%s, %s,%s, %s,%s, %s, 'imported'
                            )
                        """, (
                            batch_id, rec['emirates_id'], rec['full_name'], rec['full_name_arabic'],
                            rec['gender'], rec['date_of_birth'], rec['age_group'], rec['marital_status'],
                            rec['education_level'], rec['gpa'], rec['is_student'], rec['specialization'], rec['sub_specialization'],
                            rec['experience_years'], rec['job_seeker_type'], rec['job_seeker_date'], rec['preferred_work_mode'],
                            rec['national_service'],
                            rec['emirate_of_origin'], rec['emirate_of_residence'], rec['city_name'], rec['city_name_ar'],
                            rec['phone'], rec['email'],
                            rec['is_person_of_determination'], rec['determination_type'],
                            rec['registered_on'],
                        ))
                        report['successful'] += 1
                        cur.execute("RELEASE SAVEPOINT sp_row")

                    except Exception as row_err:
                        try:
                            cur.execute("ROLLBACK TO SAVEPOINT sp_row")
                        except Exception:
                            pass
                        report['failed'] += 1
                        report['errors'].append(f"Row {report['total_rows']}: {str(row_err)}")

                cur.execute("""
                    UPDATE nafis_import_batches
                    SET total_records=%s, successful=%s, failed=%s, duplicates=%s, status='completed'
                    WHERE id=%s
                """, (report['total_rows'], report['successful'], report['failed'], report['duplicates'], batch_id))
                conn.commit()

        except Exception as e:
            logger.error(f"NAFIS CSV import error: {e}")
            report['errors'].append(str(e))
            try:
                conn.rollback()
            except Exception:
                pass
        finally:
            try:
                conn.close()
            except Exception:
                pass

        return report

    # ─── Row parser helper ───
    def _parse_row(self, row):
        """Normalise a single CSV DictReader row into a clean dict."""
        def g(*keys):
            for k in keys:
                v = row.get(k)
                if v and str(v).strip():
                    return str(v).strip()
            return None

        def parse_date(val):
            if not val:
                return None
            for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d', '%d-%m-%Y'):
                try:
                    return datetime.strptime(val, fmt).date()
                except ValueError:
                    continue
            return None

        def parse_bool(val):
            if not val:
                return False
            return str(val).strip().lower() in ('true', 'yes', '1', 'نعم')

        def parse_decimal(val):
            if not val:
                return None
            try:
                return float(val)
            except (ValueError, TypeError):
                return None

        def parse_int(val):
            if not val:
                return 0
            try:
                return int(float(val))
            except (ValueError, TypeError):
                return 0

        return {
            'emirates_id': g('EID', 'Emirates ID', 'EmiratesID', 'eid') or '',
            'full_name': g('FullName', 'Full Name', 'fullname', 'Name') or '',
            'full_name_arabic': g('FullNameArabic', 'Full Name Arabic', 'الاسم الكامل'),
            'gender': g('Gender', 'gender'),
            'date_of_birth': parse_date(g('DateOfBirth', 'Date Of Birth', 'DOB')),
            'age_group': g('AgeGroup', 'Age Group'),
            'marital_status': g('MaritalStatus', 'Marital Status'),
            'education_level': g('Education', 'EducationLevel', 'Education Level'),
            'gpa': parse_decimal(g('GPA', 'gpa')),
            'is_student': parse_bool(g('Is Student', 'IsStudent')),
            'specialization': g('Specialization', 'specialization'),
            'sub_specialization': g('SubSpecialization', 'Sub Specialization'),
            'experience_years': parse_int(g('Experience', 'ExperienceYears', 'Experience Years')),
            'job_seeker_type': g('JobSeekerType', 'Job Seeker Type'),
            'job_seeker_date': parse_date(g('Job Seeker Date', 'JobSeekerDate')),
            'preferred_work_mode': g('Preferred Working Mode', 'PreferredWorkingMode'),
            'national_service': g('NationalServiceCompletion', 'National Service Completion'),
            'emirate_of_origin': g('EmirateOfOrigin', 'Emirate Of Origin'),
            'emirate_of_residence': g('Emirate Of Residence', 'EmirateOfResidence'),
            'city_name': g('CityName', 'City Name'),
            'city_name_ar': g('CityNameAR', 'City Name AR'),
            'phone': g('Ph No', 'Phone', 'PhNo', 'phone'),
            'email': g('Email', 'email', 'E-mail'),
            'is_person_of_determination': parse_bool(g('IsPersonOfDetermination', 'Is Person Of Determination')),
            'determination_type': g('Determination Type', 'DeterminationType'),
            'registered_on': parse_date(g('RegisteredOn', 'Registered On')),
        }

    # ══════════════════════════════════════════════════════════
    # Magic Link Invitations
    # ══════════════════════════════════════════════════════════
    def create_seeker_invitations(self, seeker_ids, invited_by=None):
        """Generate magic link tokens for selected seekers and mock-email them."""
        self.ensure_tables()
        conn = self._get_db_connection()
        results = []

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                for sid in seeker_ids:
                    try:
                        # Fetch seeker details
                        cur.execute("""
                            SELECT id, full_name, email, emirates_id
                            FROM nafis_job_seekers WHERE id = %s
                        """, (sid,))
                        seeker = cur.fetchone()
                        if not seeker:
                            results.append({'seeker_id': sid, 'error': 'Seeker not found'})
                            continue
                        if not seeker['email']:
                            results.append({'seeker_id': sid, 'error': 'No email on file', 'name': seeker['full_name']})
                            continue

                        # Check for existing unused invitation
                        cur.execute("""
                            SELECT id FROM seeker_invitations
                            WHERE seeker_id = %s AND is_used = FALSE AND expires_at > NOW()
                        """, (sid,))
                        if cur.fetchone():
                            results.append({'seeker_id': sid, 'error': 'Active invitation already exists', 'name': seeker['full_name']})
                            continue

                        token = secrets.token_urlsafe(32)
                        expires_at = datetime.now() + timedelta(days=7)

                        cur.execute("""
                            INSERT INTO seeker_invitations
                                (token, seeker_id, seeker_name, seeker_email, invited_by, status, is_used, expires_at)
                            VALUES (%s, %s, %s, %s, %s, 'pending', FALSE, %s)
                            RETURNING id, token
                        """, (token, sid, seeker['full_name'], seeker['email'], invited_by, expires_at))
                        record = cur.fetchone()

                        # Update seeker status
                        cur.execute("""
                            UPDATE nafis_job_seekers SET status = 'invited', updated_at = NOW()
                            WHERE id = %s AND status = 'imported'
                        """, (sid,))

                        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:8089')
                        link = f"{frontend_url}/register/{token}"

                        # Mock email
                        print(f"\n[SEEKER INVITATION EMAIL] ──────────────────────────────────")
                        print(f"  To: {seeker['email']}")
                        print(f"  Subject: Complete Your Registration — Emirati Human Development Platform")
                        print(f"  Body:")
                        print(f"  Dear {seeker['full_name']},")
                        print(f"  You have been invited to join the Emirati Human Development Platform.")
                        print(f"  Click the link below to complete your registration:")
                        print(f"  🔗 MAGIC LINK: {link}")
                        print(f"  This link expires in 7 days.")
                        print(f"──────────────────────────────────────────────────────────────\n")

                        results.append({
                            'seeker_id': str(sid),
                            'name': seeker['full_name'],
                            'email': seeker['email'],
                            'token': record['token'],
                            'magic_link': link,
                        })

                    except Exception as e:
                        logger.error(f"Failed to invite seeker {sid}: {e}")
                        results.append({'seeker_id': str(sid), 'error': str(e)})

                conn.commit()
        except Exception as e:
            try:
                conn.rollback()
            except Exception:
                pass
            logger.error(f"Seeker invitation error: {e}")
            raise
        finally:
            try:
                conn.close()
            except Exception:
                pass
        return results

    def validate_seeker_invitation(self, token):
        """Validate a seeker invitation token. Returns seeker data or None."""
        self.ensure_tables()
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT i.id as invitation_id, i.token, i.seeker_id, i.seeker_name,
                           i.seeker_email, i.status, i.expires_at,
                           s.full_name, s.full_name_arabic, s.emirates_id, s.gender,
                           s.education_level, s.specialization, s.experience_years,
                           s.emirate_of_residence, s.phone, s.email
                    FROM seeker_invitations i
                    JOIN nafis_job_seekers s ON i.seeker_id = s.id
                    WHERE i.token = %s AND i.is_used = FALSE AND i.expires_at > NOW()
                """, (token,))
                result = cur.fetchone()
                if not result:
                    return None

                # Serialize datetimes
                for key in ('expires_at',):
                    if result.get(key):
                        result[key] = result[key].isoformat()
                if result.get('invitation_id'):
                    result['invitation_id'] = str(result['invitation_id'])
                if result.get('seeker_id'):
                    result['seeker_id'] = str(result['seeker_id'])
                return result
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def accept_seeker_invitation(self, token, user_data):
        """
        Accept invitation: create candidate user account, link to seeker.
        user_data: { phone, email (optional override) }
        Returns user dict.
        """
        self.ensure_tables()
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Validate
                cur.execute("""
                    SELECT i.id, i.seeker_id, s.full_name, s.full_name_arabic,
                           s.emirates_id, s.gender, s.email, s.phone,
                           s.education_level, s.specialization, s.experience_years,
                           s.emirate_of_residence
                    FROM seeker_invitations i
                    JOIN nafis_job_seekers s ON i.seeker_id = s.id
                    WHERE i.token = %s AND i.is_used = FALSE AND i.expires_at > NOW()
                """, (token,))
                inv = cur.fetchone()
                if not inv:
                    raise ValueError("Invalid or expired invitation link")

                # Determine email and phone
                email = user_data.get('email') or inv['email']
                phone = user_data.get('phone') or inv['phone']
                full_name = inv['full_name']

                if not email:
                    raise ValueError("Email is required to create an account")

                # Check if user already exists
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                existing = cur.fetchone()
                if existing:
                    user_id = existing['id']
                else:
                    # Split name
                    parts = full_name.split(None, 1)
                    first_name = parts[0] if parts else full_name
                    last_name = parts[1] if len(parts) > 1 else ''

                    # Random password (user logs in via magic link)
                    pw_hash = bcrypt.hashpw(uuid.uuid4().hex.encode(), bcrypt.gensalt()).decode()

                    profile_data = json.dumps({
                        'emirates_id': inv['emirates_id'],
                        'gender': inv['gender'],
                        'education': inv['education_level'],
                        'specialization': inv['specialization'],
                        'experience_years': inv['experience_years'],
                        'source': 'nafis_import',
                    })

                    cur.execute("""
                        INSERT INTO users
                            (email, password_hash, full_name, first_name, last_name,
                             phone, emirate, user_type, role, nationality,
                             is_active, is_verified, profile_data)
                        VALUES (%s, %s, %s, %s, %s, %s, %s,
                                'candidate', 'candidate', 'UAE', TRUE, TRUE, %s)
                        RETURNING id
                    """, (
                        email, pw_hash, full_name, first_name, last_name,
                        phone, inv['emirate_of_residence'], profile_data,
                    ))
                    user_id = cur.fetchone()['id']

                # Mark invitation as used
                cur.execute("""
                    UPDATE seeker_invitations SET is_used = TRUE, status = 'accepted' WHERE id = %s
                """, (inv['id'],))

                # Update seeker record
                cur.execute("""
                    UPDATE nafis_job_seekers
                    SET user_id = %s, status = 'profile_created', updated_at = NOW()
                    WHERE id = %s
                """, (user_id, inv['seeker_id']))

                conn.commit()

                # Split name for frontend display
                name_parts = full_name.split(None, 1)
                f_name = name_parts[0] if name_parts else full_name
                l_name = name_parts[1] if len(name_parts) > 1 else ''

                return {
                    'id': user_id,
                    'email': email,
                    'full_name': full_name,
                    'name': full_name,
                    'first_name': f_name,
                    'last_name': l_name,
                    'user_type': 'candidate',
                    'role': 'candidate',
                }

        except ValueError:
            raise
        except Exception as e:
            try:
                conn.rollback()
            except Exception:
                pass
            logger.error(f"Accept seeker invitation error: {e}")
            raise
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def redeem_seeker_invitation_for_user(self, token, user_id, is_new_user=False):
        """Redeem a seeker invitation against a UAE-Pass-PROVEN identity.

        Replaces the OTP/accept flow (retired): the UAE Pass callback has
        already created or resolved the candidate account, so the only
        identity input here is `user_id` — never a phone or a body field.
        Links the imported NAFIS seeker to that account and marks the
        invitation used. Idempotent on re-entry. Mirrors
        growth_system.redeem_invitation_for_user for the employer side.
        """
        self.ensure_tables()
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Lock the invitation so two concurrent callbacks can't
                # double-redeem.
                cur.execute("""
                    SELECT i.id, i.seeker_id, i.is_used, s.full_name, s.emirates_id
                    FROM seeker_invitations i
                    JOIN nafis_job_seekers s ON i.seeker_id = s.id
                    WHERE i.token = %s AND i.expires_at > NOW()
                    FOR UPDATE OF i
                """, (token,))
                inv = cur.fetchone()
                if not inv:
                    raise ValueError("Invalid, expired, or already used invitation link")
                if inv['is_used']:
                    # Already redeemed — return a benign summary rather than error,
                    # so a double UAE Pass callback doesn't surface a scary message.
                    return {
                        'id': str(user_id),
                        'role': 'candidate',
                        'primary_role': 'candidate',
                        'seeker_name': inv.get('full_name'),
                        'seeker_id': str(inv['seeker_id']),
                        'already_redeemed': True,
                    }

                # The proven UAE Pass user must exist (callback created/linked it).
                cur.execute("SELECT id FROM users WHERE id = %s", (str(user_id),))
                if not cur.fetchone():
                    raise ValueError("User account not found for seeker invitation redemption")

                # Link the NAFIS seeker record to the proven account and advance
                # its lifecycle. Match by the invitation's seeker_id (the operator
                # chose this person); the account already carries the real EID.
                cur.execute("""
                    UPDATE nafis_job_seekers
                    SET user_id = %s, status = 'profile_created', updated_at = NOW()
                    WHERE id = %s
                """, (str(user_id), inv['seeker_id']))

                cur.execute("""
                    UPDATE seeker_invitations
                    SET is_used = TRUE, status = 'accepted'
                    WHERE id = %s
                """, (inv['id'],))

                conn.commit()
                logger.info(
                    f"Seeker invitation redeemed for user {user_id} "
                    f"(seeker {inv['seeker_id']}, new_user={is_new_user})"
                )
                return {
                    'id': str(user_id),
                    'role': 'candidate',
                    'primary_role': 'candidate',
                    'seeker_name': inv.get('full_name'),
                    'seeker_id': str(inv['seeker_id']),
                }
        except ValueError:
            try:
                conn.rollback()
            except Exception:
                pass
            raise
        except Exception as e:
            try:
                conn.rollback()
            except Exception:
                pass
            logger.error(f"Seeker invitation redemption failed: {e}")
            raise
        finally:
            try:
                conn.close()
            except Exception:
                pass

    # ══════════════════════════════════════════════════════════
    # Queries
    # ══════════════════════════════════════════════════════════
    def get_invitation_stats(self):
        """Return invitation summary stats and recent invitations for admin dashboard."""
        self.ensure_tables()
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Aggregate counts
                cur.execute("""
                    SELECT
                        COUNT(*) as total,
                        COUNT(*) FILTER (WHERE status = 'accepted' OR is_used = TRUE) as accepted,
                        COUNT(*) FILTER (WHERE status = 'pending' AND (expires_at IS NULL OR expires_at > NOW())) as pending,
                        COUNT(*) FILTER (WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at <= NOW()) as expired
                    FROM seeker_invitations
                """)
                counts = cur.fetchone()

                # Recent invitations (last 20)
                cur.execute("""
                    SELECT
                        i.id,
                        i.seeker_name,
                        i.seeker_email,
                        i.status,
                        i.is_used,
                        i.created_at,
                        i.expires_at,
                        s.full_name  AS seeker_full_name,
                        s.email      AS seeker_orig_email,
                        s.education_level
                    FROM seeker_invitations i
                    LEFT JOIN nafis_job_seekers s ON s.id = i.seeker_id
                    ORDER BY i.created_at DESC
                    LIMIT 20
                """)
                recent = cur.fetchall()

                # Serialise datetimes
                recent_list = []
                for row in recent:
                    r = dict(row)
                    for k in ('created_at', 'expires_at'):
                        if r.get(k):
                            r[k] = r[k].isoformat()
                    recent_list.append(r)

                return {
                    'total': counts['total'],
                    'accepted': counts['accepted'],
                    'pending': counts['pending'],
                    'expired': counts['expired'],
                    'recent': recent_list,
                }
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def get_import_batches(self):
        self.ensure_tables()
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, batch_code, filename, total_records,
                           successful, failed, duplicates, status, created_at
                    FROM nafis_import_batches ORDER BY created_at DESC LIMIT 50
                """)
                return cur.fetchall()
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def get_job_seekers(self, status=None, search=None, page=1, limit=25, filters=None):
        self.ensure_tables()
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                conds, params = [], []
                if status:
                    conds.append("s.status = %s"); params.append(status)
                if search:
                    conds.append("(s.full_name ILIKE %s OR s.emirates_id ILIKE %s OR s.email ILIKE %s)")
                    params.extend([f"%{search}%"] * 3)

                # Advanced filters
                if filters:
                    text_cols = {
                        'gender': 's.gender',
                        'age_group': 's.age_group',
                        'education_level': 's.education_level',
                        'specialization': 's.specialization',
                        'sub_specialization': 's.sub_specialization',
                        'job_seeker_type': 's.job_seeker_type',
                        'preferred_work_mode': 's.preferred_work_mode',
                        'national_service': 's.national_service',
                        'emirate_of_origin': 's.emirate_of_origin',
                        'emirate_of_residence': 's.emirate_of_residence',
                        'city_name': 's.city_name',
                        'marital_status': 's.marital_status',
                        'determination_type': 's.determination_type',
                    }
                    for key, col in text_cols.items():
                        val = filters.get(key)
                        if val:
                            # Support multi-select for specialization fields (delimited by |||)
                            if key in ('specialization', 'sub_specialization') and '|||' in val:
                                vals = [v.strip() for v in val.split('|||') if v.strip()]
                                placeholders = ','.join(['%s'] * len(vals))
                                conds.append(f"{col} IN ({placeholders})")
                                params.extend(vals)
                            else:
                                conds.append(f"{col} = %s"); params.append(val)

                    # Boolean filters
                    if filters.get('is_student') is not None and filters['is_student'] != '':
                        conds.append("s.is_student = %s"); params.append(filters['is_student'] in ('true', True, '1'))
                    if filters.get('is_person_of_determination') is not None and filters['is_person_of_determination'] != '':
                        conds.append("s.is_person_of_determination = %s")
                        params.append(filters['is_person_of_determination'] in ('true', True, '1'))

                    # Numeric range: experience
                    if filters.get('experience_min') not in (None, ''):
                        conds.append("s.experience_years >= %s"); params.append(int(filters['experience_min']))
                    if filters.get('experience_max') not in (None, ''):
                        conds.append("s.experience_years <= %s"); params.append(int(filters['experience_max']))

                    # GPA range
                    if filters.get('gpa_min') not in (None, ''):
                        conds.append("s.gpa >= %s"); params.append(float(filters['gpa_min']))
                    if filters.get('gpa_max') not in (None, ''):
                        conds.append("s.gpa <= %s"); params.append(float(filters['gpa_max']))

                    # Date ranges
                    if filters.get('registered_from'):
                        conds.append("s.registered_on >= %s"); params.append(filters['registered_from'])
                    if filters.get('registered_to'):
                        conds.append("s.registered_on <= %s"); params.append(filters['registered_to'])
                    if filters.get('job_seeker_date_from'):
                        conds.append("s.job_seeker_date >= %s"); params.append(filters['job_seeker_date_from'])
                    if filters.get('job_seeker_date_to'):
                        conds.append("s.job_seeker_date <= %s"); params.append(filters['job_seeker_date_to'])

                where = ("WHERE " + " AND ".join(conds)) if conds else ""
                offset = (page - 1) * limit

                cur.execute(f"SELECT COUNT(*) as total FROM nafis_job_seekers s {where}", params)
                total = cur.fetchone()['total']

                cur.execute(f"""
                    SELECT s.id, s.emirates_id, s.full_name, s.full_name_arabic,
                           s.gender, s.education_level, s.specialization,
                           s.experience_years, s.email, s.phone,
                           s.emirate_of_residence, s.age_group,
                           s.status, s.user_id, s.created_at,
                           b.batch_code
                    FROM nafis_job_seekers s
                    LEFT JOIN nafis_import_batches b ON s.batch_id = b.id
                    {where}
                    ORDER BY s.created_at DESC
                    LIMIT %s OFFSET %s
                """, params + [limit, offset])

                return {'seekers': cur.fetchall(), 'total': total, 'page': page, 'limit': limit}
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def get_filter_options(self):
        """Return distinct values for all filterable columns."""
        self.ensure_tables()
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                options = {}
                columns = [
                    'gender', 'age_group', 'education_level', 'specialization',
                    'sub_specialization', 'job_seeker_type', 'preferred_work_mode',
                    'national_service', 'emirate_of_origin', 'emirate_of_residence',
                    'city_name', 'marital_status', 'determination_type',
                ]
                for col in columns:
                    cur.execute(f"""
                        SELECT DISTINCT {col} FROM nafis_job_seekers
                        WHERE {col} IS NOT NULL AND {col} != ''
                        ORDER BY {col} LIMIT 100
                    """)
                    options[col] = [row[col] for row in cur.fetchall()]
                return options
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def get_stats(self):
        self.ensure_tables()
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        COUNT(*) as total_seekers,
                        COUNT(*) FILTER (WHERE status = 'profile_created') as active_profiles,
                        COUNT(*) FILTER (WHERE status = 'imported') as pending_import,
                        COUNT(*) FILTER (WHERE status = 'invited') as invited,
                        COUNT(*) FILTER (WHERE status = 'placed') as placed,
                        COUNT(*) FILTER (WHERE status = 'matched') as matched
                    FROM nafis_job_seekers
                """)
                seeker_stats = cur.fetchone()

                cur.execute("""
                    SELECT COUNT(*) as total_batches,
                           COALESCE(SUM(total_records), 0) as total_records_imported
                    FROM nafis_import_batches WHERE status = 'completed'
                """)
                batch_stats = cur.fetchone()

                cur.execute("""
                    SELECT education_level, COUNT(*) as count
                    FROM nafis_job_seekers
                    WHERE education_level IS NOT NULL AND education_level != ''
                    GROUP BY education_level ORDER BY count DESC LIMIT 10
                """)
                education_breakdown = cur.fetchall()

                cur.execute("""
                    SELECT gender, COUNT(*) as count
                    FROM nafis_job_seekers
                    WHERE gender IS NOT NULL AND gender != ''
                    GROUP BY gender ORDER BY count DESC
                """)
                gender_breakdown = cur.fetchall()

                return {
                    'total_seekers': seeker_stats['total_seekers'],
                    'active_profiles': seeker_stats['active_profiles'],
                    'pending_import': seeker_stats['pending_import'],
                    'invited': seeker_stats['invited'],
                    'placed': seeker_stats['placed'],
                    'matched': seeker_stats['matched'],
                    'total_batches': batch_stats['total_batches'],
                    'total_records_imported': int(batch_stats['total_records_imported']),
                    'education_breakdown': education_breakdown,
                    'gender_breakdown': gender_breakdown,
                }
        finally:
            try:
                conn.close()
            except Exception:
                pass
