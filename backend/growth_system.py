import logging
import os
import csv
import io
import uuid
import secrets
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GrowthSystem:
    def __init__(self, db_connection=None):
        self.conn = db_connection
        
    def _get_db_connection(self):
        """Helper to get DB connection if not provided or closed"""
        if self.conn and not self.conn.closed:
            return self.conn
        try:
            import os
            # Fallback to creating new connection
            dbname = os.getenv('DB_NAME', 'emirati_journey')
            logger.info(f"GrowthSystem connecting to DB: {dbname}")
            return psycopg2.connect(
                dbname=dbname,
                user=os.getenv('DB_USER', 'admin'),
                password=os.getenv('DB_PASSWORD', 'admin'),
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', 5432)
            )
        except Exception as e:
            logger.error(f"Failed to connect to DB: {e}")
            raise

    def _generate_synthetic_eid(self, cur):
        """Generate a unique 15-character synthetic EID for users without one."""
        cur.execute("SELECT pg_advisory_xact_lock(784000)")  # Lock ID for EID generation
        cur.execute("""
            SELECT MAX(CAST(SUBSTRING(id FROM 8 FOR 7) AS INTEGER)) AS max_seq
            FROM users WHERE id LIKE '7840000%'
        """)
        row = cur.fetchone()
        max_seq = row['max_seq'] if row and row.get('max_seq') is not None else 0
        return f"784{'0000'}{max_seq + 1:07d}{'0'}"


    def import_vacancies_from_csv(self, csv_file_content):
        """
        Parses Nafis CSV and creates Pending Jobs + Shadow Companies.
        Returns report of actions taken.
        """
        conn = self._get_db_connection()
        report = {
            'total_rows': 0,
            'companies_created': 0,
            'jobs_created': 0,
            'emails_sent': 0,
            'errors': []
        }
        
        try:
            # Decode bytes if needed
            if isinstance(csv_file_content, bytes):
                csv_file_content = csv_file_content.decode('utf-8')
                
            reader = csv.DictReader(io.StringIO(csv_file_content))
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                for row in reader:
                    report['total_rows'] += 1
                    try:
                        cur.execute("SAVEPOINT sp_row")
                        
                        # 1. Normalize Data
                        # Try to handle both standard and Nafis-specific column names
                        company_name = row.get('CompanyName') or row.get('Company Name')
                        company_email = row.get('CompanyEmail') or row.get('Account Email')
                        job_title = row.get('JobsTitle') or row.get('Job Title') or row.get('Jobs Title')
                        nafis_id = row.get('JobID') or row.get('Job ID') or row.get('NafisID')
                        
                        # New fields for Advanced Targeting
                        industry = row.get('CompanySector') or row.get('Company Sector')
                        trade_license = row.get('TradeLicenseNo') or row.get('Trade License No')
                        phone = row.get('CompanyPhone') or row.get('Company Phone')
                        emirate = row.get('JobEmirate') or row.get('Job Emirate') or row.get('Emirate')
                        city = row.get('JobCity') or row.get('Job City')
                        business_type = row.get('PartnerBusinessType') or row.get('BusinessType')
                        
                        if not company_name or not company_email or not job_title:
                            report['errors'].append(f"Row {report['total_rows']}: Missing required fields (Name, Email, or Title)")
                            cur.execute("RELEASE SAVEPOINT sp_row")
                            continue
                            
                        # 2. Find or Create Shadow Company
                        logger.info(f"Processing company: {company_name}")
                        cur.execute("SELECT id FROM public.companies WHERE company_name = %s", (company_name,))
                        company = cur.fetchone()
                        
                        company_id = None
                        if company:
                            company_id = company['id']
                            # Optional: Update existing company with new details if missing
                            cur.execute("""
                                UPDATE companies 
                                SET industry = COALESCE(industry, %s),
                                    trade_license_no = COALESCE(trade_license_no, %s),
                                    phone = COALESCE(phone, %s),
                                    emirate = COALESCE(emirate, %s),
                                    city = COALESCE(city, %s),
                                    business_type = COALESCE(business_type, %s)
                                WHERE id = %s
                            """, (industry, trade_license, phone, emirate, city, business_type, company_id))
                        else:
                            # Create Shadow Company with new details
                            cur.execute("""
                                INSERT INTO public.companies (
                                    company_name, name, contact_email, is_verified, description,
                                    industry, trade_license_no, phone, emirate, city, business_type,
                                    lead_source
                                )
                                VALUES (%s, %s, %s, FALSE, 'Imported from Nafis', %s, %s, %s, %s, %s, %s,
                                        'nafis_import')
                                RETURNING id
                            """, (
                                company_name, company_name, company_email, 
                                industry, trade_license, phone, emirate, city, business_type
                            ))
                            company_id = cur.fetchone()['id']
                            report['companies_created'] += 1
                            
                        # 3. Create Pending Job
                        # Check if job already exists (by Nafis ID)
                        if nafis_id:
                            cur.execute("SELECT id FROM public.job_postings WHERE nafis_job_id = %s", (str(nafis_id),))
                            if cur.fetchone():
                                logger.info(f"Job {nafis_id} already exists, skipping")
                                cur.execute("RELEASE SAVEPOINT sp_row")
                                continue

                        # New Job Fields
                        posted_date_str = row.get('Job Posted Date') or row.get('Posted Date')
                        posted_date = None
                        if posted_date_str:
                            try:
                                # Try parsing common formats
                                for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%b-%y', '%d/%m/%Y %H:%M'):
                                    try:
                                        posted_date = datetime.strptime(posted_date_str, fmt)
                                        break
                                    except ValueError:
                                        pass
                            except Exception:
                                pass # Keep as None if fail
                                
                        job_type = row.get('Job Type') or row.get('JobType')
                        education_level = row.get('JobEducationalorSkillsLevel') or row.get('Education Level')
                        
                        # Calculate expiry (default 30 days) if not provided
                        # Or stick to default logic

                        # Placeholder for creator_id, as it's not in the CSV
                        creator_id = None 

                        cur.execute("""
                            INSERT INTO public.job_postings (
                                company_id, created_by, title, description,
                                status, nafis_job_id, contact_email, created_at, updated_at,
                                jd_id, recruiter_id, posted_date, employment_type, education_level
                            ) VALUES (
                                %s, %s, %s, 'Pending Verification', 
                                'pending_verification', %s, %s, NOW(), NOW(),
                                %s, %s, %s, %s, %s
                            ) RETURNING id
                        """, (
                            str(company_id), creator_id, job_title, 
                            str(nafis_id) if nafis_id else None, company_email,
                            str(uuid.uuid4()), str(creator_id) if creator_id else "0",
                            posted_date, job_type, education_level
                        ))
                        
                        job_id = cur.fetchone()['id']
                        report['jobs_created'] += 1
                        
                        # 4. Generate Magic Link
                        token_str = self._generate_verification_token(cur, job_id, company_email, company_name)
                        
                        # 5. "Send" Email
                        self._mock_send_email(company_email, company_name, job_title, token_str)
                        report['emails_sent'] += 1
                        
                        cur.execute("RELEASE SAVEPOINT sp_row")
                        
                    except Exception as row_error:
                        cur.execute("ROLLBACK TO SAVEPOINT sp_row")
                        logger.error(f"Error processing row {report['total_rows']}: {row_error}")
                        report['errors'].append(f"Row {report['total_rows']}: {str(row_error)}")
                        
                conn.commit()
                
        except Exception as e:
            logger.error(f"CSV Import Error: {e}")
            report['errors'].append(str(e))
        finally:
            conn.close()
            
        return report

    def check_existing_companies(self, company_names):
        """
        Check which of the provided company names already exist in the DB.
        Returns a list of existing company names.
        """
        if not company_names:
            return []
            
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                # Use ANY for efficient bulk check
                cur.execute("""
                    SELECT company_name 
                    FROM companies 
                    WHERE company_name = ANY(%s)
                """, (list(company_names),))
                
                existing = [row[0] for row in cur.fetchall()]
                return existing
        finally:
            conn.close()

    def _generate_verification_token(self, cur, job_id, email, company_name):
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=7) # 7 day link validity
        
        cur.execute("""
            INSERT INTO job_verification_tokens (job_id, token, email, company_name_snapshot, expires_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (job_id, token, email, company_name, expires_at))
        
        return token

    def _mock_send_email(self, email, company, job, token):
        # MOCK EMAIL SENDER
        # In real life, use SendGrid/SMTP
        link = f"http://localhost:8089/verify-job/{token}"
        print(f"\n[EMAIL SIMULATION] ---------------------------------------------------")
        print(f"To: {email}")
        print(f"Subject: Verify your vacancy for {job} at {company}")
        print(f"Body:")
        print(f"Hello {company},")
        print(f"We have identified a vacancy '{job}' matching high-potential Emirati candidates.")
        print(f"Please click here to verify requirements and view candidates:")
        print(f"LINK: {link}")
        print(f"--------------------------------------------------------------------------\n")
        logger.info(f"Sent magic link to {email}")

    def validate_token(self, token):
        """Verifies if a token is valid and returns associated Job Data"""
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT t.*, j.title, j.description, j.nafis_job_id, 
                           c.company_name, c.id as company_id
                    FROM job_verification_tokens t
                    JOIN job_postings j ON t.job_id = j.id
                    JOIN companies c ON j.company_id::uuid = c.id
                    WHERE t.token = %s AND t.is_used = FALSE AND t.expires_at > NOW()
                """, (token,))
                
                result = cur.fetchone()
                if not result:
                    return None
                    
                return result
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            raise e

    def confirm_job_verification(self, token, job_data, password):
        """
        1. Updates Job (Status -> Published)
        2. Creates User Account for Company (if not exists)
        3. Marks Token Used
        """
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # 1. Get Token Info
                cur.execute("SELECT * FROM job_verification_tokens WHERE token = %s FOR UPDATE", (token,))
                token_record = cur.fetchone()
                if not token_record or token_record['is_used']:
                    raise ValueError("Invalid or used token")

                job_id = token_record['job_id']
                email = token_record['email']
                
                # 2. Create/Get User
                # Check if user exists with this email
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                user = cur.fetchone()
                
                user_id = None
                if user:
                    user_id = user['id']
                    # logic to handle existing user (maybe just link them)
                else:
                    # Create new Recruiter User — hash password with bcrypt
                    import bcrypt
                    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    
                    user_id = self._generate_synthetic_eid(cur)
                    cur.execute("""
                        INSERT INTO users (
                            id, email, password_hash, first_name, last_name, 
                            user_type, phone, is_active, created_at
                        ) VALUES (
                            %s, %s, %s, %s, 'Recruiter', 
                            'recruiter', '00000000', TRUE, NOW()
                        ) RETURNING id
                    """, (user_id, email, hashed_pw, token_record['company_name_snapshot']))
                    user_id = cur.fetchone()['id']
                    
                    # Create HR Profile
                    # We need company_id from job
                    cur.execute("SELECT company_id FROM job_postings WHERE id = %s", (job_id,))
                    company_id = cur.fetchone()['company_id']
                    
                    cur.execute("""
                        INSERT INTO hr_profiles (user_id, company_id, position_title)
                        VALUES (%s, %s, 'HR Manager')
                    """, (user_id, company_id))

                # 3. Update Job
                cur.execute("""
                    UPDATE job_postings
                    SET title = %s, description = %s, 
                        requirements = %s,
                        status = 'published',
                        created_by = %s,
                        published_at = NOW()
                    WHERE id = %s
                """, (
                    job_data.get('title'),
                    job_data.get('description'),
                    psycopg2.extras.Json(job_data.get('requirements', [])),
                    user_id,
                    job_id
                ))
                
                # 4. Mark Token Used
                cur.execute("UPDATE job_verification_tokens SET is_used = TRUE WHERE id = %s", (token_record['id'],))
                
                conn.commit()
                return {"success": True, "job_id": job_id, "user_id": user_id}
                
        except Exception as e:
            conn.rollback()
            logger.error(f"Confirmation failed: {e}")
            raise e

    def get_growth_candidates(self, min_vacancies=5):
        """
        Finds companies that have at least `min_vacancies` pending jobs.
        Returns list of companies with vacancy counts.
        """
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Find companies with pending vacancies count >= min_vacancies
                query = """
                    SELECT c.id as company_id, c.company_name, c.contact_email, 
                           COUNT(j.id) as vacancy_count,
                           MAX(j.created_at) as last_import_date,
                           c.is_verified
                    FROM companies c
                    JOIN job_postings j ON c.id = j.company_id::uuid
                    WHERE j.status = 'pending_verification'
                    GROUP BY c.id
                    HAVING COUNT(j.id) >= %s
                    ORDER BY vacancy_count DESC
                """
                cur.execute(query, (min_vacancies,))
                results = cur.fetchall()
                
                # Format dates
                for r in results:
                    if r['last_import_date']:
                        r['last_import_date'] = r['last_import_date'].isoformat()
                        
                return results
        except Exception as e:
            logger.error(f"Error fetching growth candidates: {e}")
            return []

    def send_bulk_emails(self, company_ids):
        """
        Sends verification emails to selected companies.
        Simplification: Sends one email per company for their most recent batch.
        """
        conn = self._get_db_connection()
        report = {'sent': 0, 'failed': 0, 'errors': []}
        
        try:
            for company_id in company_ids:
                try:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        # Get company details and a representative job
                        cur.execute("""
                            SELECT c.company_name, c.contact_email, j.id as job_id, j.title, j.nafis_job_id
                            FROM companies c
                            JOIN job_postings j ON c.id = j.company_id::uuid
                            WHERE c.id = %s AND j.status = 'pending_verification'
                            ORDER BY j.created_at DESC
                            LIMIT 1
                        """, (company_id,))
                        
                        data = cur.fetchone()
                        if not data:
                            report['failed'] += 1
                            continue
                            
                        # Generate or reuse token
                        token = self._generate_verification_token(cur, data['job_id'], data['contact_email'], data['company_name'])
                        
                        # Send email
                        self._mock_send_email(data['contact_email'], data['company_name'], f"{data['title']} (and others)", token)
                        
                        report['sent'] += 1
                        
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Failed to send email to company {company_id}: {e}")
                    report['failed'] += 1
                    report['errors'].append(str(e))
                    
        except Exception as e:
            logger.error(f"Bulk email error: {e}")
            raise e
            
        return report

    # =====================================================
    # COMPANY INVITATION SYSTEM (Magic Links)
    # =====================================================

    def create_company_invitations(self, companies, invited_by=None):
        """
        Generate magic link invitation tokens for a list of companies.
        Each company dict should have: name, code, email, phone, sector, tradeLicense
        Returns list of generated invitation records with tokens.
        """
        conn = self._get_db_connection()
        results = []

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                for company in companies:
                    try:
                        token = secrets.token_urlsafe(32)
                        expires_at = datetime.now() + timedelta(days=7)

                        cur.execute("""
                            INSERT INTO company_invitations (
                                token, company_name, company_code, company_email,
                                company_phone, company_sector, trade_license,
                                invited_by, status, is_used, expires_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', FALSE, %s)
                            RETURNING id, token, company_name, company_email
                        """, (
                            token,
                            company.get('name', ''),
                            company.get('code', ''),
                            company.get('email', ''),
                            company.get('phone', ''),
                            company.get('sector', ''),
                            company.get('tradeLicense', ''),
                            invited_by,
                            expires_at,
                        ))

                        record = cur.fetchone()

                        # Mock email
                        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:8089')
                        link = f"{frontend_url}/join/{token}"
                        print(f"\n[INVITATION EMAIL] ─────────────────────────────────────────")
                        print(f"  To: {company.get('email', 'N/A')}")
                        print(f"  Subject: Join Emirati Human Development Platform — {company.get('name', '')}")
                        print(f"  Body:")
                        print(f"  Dear {company.get('name', '')},")
                        print(f"  You have been invited to join the Emirati Human Development Platform")
                        print(f"  as a Recruiter or HR Manager for your company.")
                        print(f"  Click the link below to complete your registration:")
                        print(f"  🔗 MAGIC LINK: {link}")
                        print(f"  This link expires in 7 days.")
                        print(f"─────────────────────────────────────────────────────────────\n")

                        results.append({
                            'id': str(record['id']),
                            'token': record['token'],
                            'company_name': record['company_name'],
                            'company_email': record['company_email'],
                            'magic_link': link,
                        })

                    except Exception as e:
                        logger.error(f"Failed to create invitation for {company.get('name')}: {e}")
                        results.append({
                            'company_name': company.get('name', ''),
                            'error': str(e),
                        })

                conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"Company invitation error: {e}")
            raise e

        return results

    def validate_company_invitation(self, token):
        """
        Validates a company invitation token.
        Returns invitation data if valid, None if invalid/expired/used.
        """
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, token, company_name, company_code, company_email,
                           company_phone, company_sector, trade_license,
                           status, is_used, expires_at, created_at
                    FROM company_invitations
                    WHERE token = %s AND is_used = FALSE AND expires_at > NOW()
                """, (token,))

                result = cur.fetchone()
                if not result:
                    return None

                # Convert non-serializable types
                for key in ('id',):
                    if result.get(key):
                        result[key] = str(result[key])
                for key in ('expires_at', 'created_at'):
                    if result.get(key):
                        result[key] = result[key].isoformat()

                return dict(result)

        except Exception as e:
            logger.error(f"Invitation validation error: {e}")
            raise e

    def accept_company_invitation(self, token, user_data):
        """
        Accept a company invitation:
        1. Validate the token
        2. Create or find user account (by phone number)
        3. Create HR profile linked to the company
        4. Mark invitation as used
        
        user_data should contain: first_name, last_name, phone, email,
                                   position_title, role (recruiter/hr_manager)
        Returns: user record dict
        """
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # 1. Get and lock the invitation
                cur.execute("""
                    SELECT * FROM company_invitations
                    WHERE token = %s AND is_used = FALSE AND expires_at > NOW()
                    FOR UPDATE
                """, (token,))
                invitation = cur.fetchone()
                if not invitation:
                    raise ValueError("Invalid, expired, or already used invitation token")

                phone = user_data.get('phone', '')
                email = user_data.get('email') or invitation.get('company_email', '')
                first_name = user_data.get('first_name', '')
                last_name = user_data.get('last_name', '')
                role = user_data.get('role', 'recruiter')
                position_title = user_data.get('position_title', '')

                # 2. Check if user already exists (by phone)
                cur.execute("SELECT id, email, user_type FROM users WHERE phone = %s", (phone,))
                existing_user = cur.fetchone()

                user_id = None
                if existing_user:
                    user_id = existing_user['id']
                    # GRANT the invited role as an ADDITIONAL role — never replace
                    # the primary one.
                    #
                    # This used to be `UPDATE users SET user_type = %s`, which was
                    # wrong twice over. First, `user_type` is not the column the
                    # platform authorises on: access_control.resolve_roles reads
                    # `role` + `secondary_roles`, so writing user_type granted
                    # nothing. Second, overwriting the primary role destroys the
                    # account's existing identity — and because this branch is
                    # reached by a PHONE-NUMBER match alone, redeeming a link with
                    # someone else's number silently rewrote that person's role.
                    #
                    # Appending to secondary_roles matches how the platform already
                    # models people who hold several personas, and resolve_roles
                    # unions the two, so access works without the destruction.
                    cur.execute("""
                        UPDATE users
                        SET secondary_roles = COALESCE((
                                SELECT jsonb_agg(DISTINCT r)
                                FROM jsonb_array_elements_text(
                                    COALESCE(secondary_roles, '[]'::jsonb) || to_jsonb(%s::text)
                                ) AS t(r)
                            ), '[]'::jsonb),
                            updated_at = NOW()
                        WHERE id = %s
                    """, (role, user_id))
                else:
                    # Create new user — no password (OTP-only login)
                    user_id = self._generate_synthetic_eid(cur)
                    # Write `role` — the column access_control.resolve_roles and the
                    # UAE Pass callback actually read. `user_type` is kept in sync as
                    # the legacy alias (auth_manager_fixed.py does the same). Writing
                    # only user_type left `role` at its 'candidate' default, so the
                    # account was a recruiter for exactly one session and landed on
                    # the candidate dashboard on every subsequent sign-in.
                    cur.execute("""
                        INSERT INTO users (
                            id, email, first_name, last_name,
                            role, user_type, phone, is_active,
                            password_hash, created_at
                        ) VALUES (
                            %s, %s, %s, %s,
                            %s, %s, %s, TRUE,
                            'otp_only', NOW()
                        ) RETURNING id
                    """, (user_id, email, first_name, last_name, role, role, phone))
                    user_id = cur.fetchone()['id']

                # 3. Find or create company link
                company_name = invitation.get('company_name', '')
                cur.execute("SELECT id FROM companies WHERE company_name = %s", (company_name,))
                company_row = cur.fetchone()

                company_id = None
                if company_row:
                    company_id = company_row['id']
                else:
                    # Create shadow company
                    cur.execute("""
                        INSERT INTO companies (
                            company_name, name, contact_email, phone,
                            industry, trade_license_no, is_verified, description,
                            lead_source
                        ) VALUES (%s, %s, %s, %s, %s, %s, FALSE, 'Invited via Growth Operator',
                                  'magic_link')
                        RETURNING id
                    """, (
                        company_name, company_name,
                        email, invitation.get('company_phone', ''),
                        invitation.get('company_sector', ''),
                        invitation.get('trade_license', ''),
                    ))
                    company_id = cur.fetchone()['id']

                # 4. Create HR profile (if not exists)
                cur.execute("""
                    SELECT id FROM hr_profiles WHERE user_id = %s
                """, (user_id,))
                if not cur.fetchone():
                    cur.execute("""
                        INSERT INTO hr_profiles (user_id, company_id, position_title)
                        VALUES (%s, %s, %s)
                    """, (user_id, str(company_id), position_title or role.replace('_', ' ').title()))

                # 4b. Auto-assign company's unassigned NAFIS jobs to the new recruiter
                cur.execute("""
                    UPDATE job_postings
                    SET recruiter_id = %s, created_by = %s
                    WHERE company_id::text = %s
                      AND (recruiter_id IS NULL OR recruiter_id = '0' OR recruiter_id = '')
                """, (str(user_id), str(user_id), str(company_id)))
                assigned_count = cur.rowcount
                if assigned_count > 0:
                    logger.info(f"Auto-assigned {assigned_count} NAFIS job(s) to recruiter {user_id} for company {company_name}")

                # 5. Mark invitation as accepted
                cur.execute("""
                    UPDATE company_invitations
                    SET is_used = TRUE, status = 'accepted',
                        accepted_at = NOW(), created_user_id = %s
                    WHERE id = %s
                """, (user_id, invitation['id']))

                conn.commit()

                # Return user data for token generation
                return {
                    'id': user_id,
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': phone,
                    'user_type': role,
                    'company_name': company_name,
                    'company_id': str(company_id),
                }

        except Exception as e:
            conn.rollback()
            logger.error(f"Invitation acceptance failed: {e}")
            raise e

    # =====================================================
    # DASHBOARD STATS (Live Funnel)
    # =====================================================

    def get_dashboard_stats(self):
        """
        Returns aggregated dashboard data for the Growth Operator:
        - Funnel counts (lead → contacted → documentation → verification → active)
        - Company list with invitation status, job counts, lead source
        - Recent activity
        - KPI summaries
        """
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # ── 1. Get all companies with job counts ──
                cur.execute("""
                    SELECT
                        c.id,
                        c.company_name,
                        c.contact_email,
                        c.phone,
                        c.industry,
                        c.emirate,
                        c.city,
                        c.trade_license_no,
                        c.business_type,
                        c.is_verified,
                        c.lead_source,
                        COALESCE(j.job_count, 0) AS jobs_posted,
                        COALESCE(j.total_hired, 0) AS total_hired,
                        COALESCE(j.published_count, 0) AS published_jobs
                    FROM companies c
                    LEFT JOIN (
                        SELECT
                            company_id,
                            COUNT(*) AS job_count,
                            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
                            0 AS total_hired
                        FROM job_postings
                        GROUP BY company_id
                    ) j ON c.id::text = j.company_id
                    ORDER BY c.company_name ASC
                """)
                companies_raw = cur.fetchall()

                # ── 2. Get invitation statuses ──
                cur.execute("""
                    SELECT
                        company_name,
                        status,
                        is_used,
                        expires_at,
                        accepted_at,
                        created_at
                    FROM company_invitations
                    ORDER BY created_at DESC
                """)
                invitations = cur.fetchall()

                # Build invitation lookup by company name
                invitation_map = {}
                for inv in invitations:
                    name = inv['company_name']
                    if name not in invitation_map:
                        invitation_map[name] = inv  # latest invitation per company

                # ── 3. Map each company to a funnel stage ──
                companies = []
                funnel = {
                    'lead': 0, 
                    'invited': 0, 
                    'link_opened': 0, 
                    'signing_up': 0, 
                    'active': 0, 
                    'expired': 0,
                    'contacted': 0,
                    'documentation': 0,
                    'verification': 0
                }

                for c in companies_raw:
                    name = c['company_name']
                    inv = invitation_map.get(name)

                    # Determine funnel stage
                    if c['is_verified'] or c.get('published_jobs', 0) > 0:
                        stage = 'active'
                    elif inv and inv['status'] == 'accepted':
                        stage = 'signing_up'
                    elif inv and inv['status'] == 'pending' and not inv['is_used']:
                        # Check if expired
                        if inv['expires_at'] and inv['expires_at'] < datetime.now(inv['expires_at'].tzinfo if inv['expires_at'].tzinfo else None):
                            stage = 'expired'
                        else:
                            stage = 'invited'
                    elif inv and inv['is_used'] and inv['status'] != 'accepted':
                        stage = 'link_opened'
                    else:
                        stage = 'lead'

                    funnel[stage] += 1

                    # Serialize for JSON
                    companies.append({
                        'id': str(c['id']),
                        'name': name,
                        'industry': c.get('industry') or '',
                        'emirate': c.get('emirate') or '',
                        'contactEmail': c.get('contact_email') or '',
                        'contactPhone': c.get('phone') or '',
                        'tradeLicense': c.get('trade_license_no') or '',
                        'businessType': c.get('business_type') or '',
                        'isVerified': c.get('is_verified', False),
                        'leadSource': c.get('lead_source') or 'manual',
                        'status': stage,
                        'jobsPosted': c.get('jobs_posted', 0),
                        'totalHired': c.get('total_hired', 0),
                        'publishedJobs': c.get('published_jobs', 0),
                        'registeredAt': c['created_at'].isoformat() if c.get('created_at') else None,
                        'invitationStatus': inv['status'] if inv else None,
                        'invitationSentAt': inv['created_at'].isoformat() if inv and inv.get('created_at') else None,
                        'invitationAcceptedAt': inv['accepted_at'].isoformat() if inv and inv.get('accepted_at') else None,
                    })

                # ── 4. Recent activity from invitations + job_postings ──
                cur.execute("""
                    (
                        SELECT
                            'invitation' AS type,
                            CASE
                                WHEN status = 'accepted' THEN company_name || ' accepted invitation and joined'
                                ELSE 'Invitation sent to ' || company_name
                            END AS text,
                            COALESCE(accepted_at, created_at) AS event_time
                        FROM company_invitations
                        ORDER BY COALESCE(accepted_at, created_at) DESC
                        LIMIT 5
                    )
                    UNION ALL
                    (
                        SELECT
                            'job' AS type,
                            c.company_name || ' posted job: ' || jp.title AS text,
                            jp.created_at AS event_time
                        FROM job_postings jp
                        JOIN companies c ON c.id::text = jp.company_id
                        WHERE jp.status = 'published'
                        ORDER BY jp.created_at DESC
                        LIMIT 5
                    )
                    ORDER BY event_time DESC
                    LIMIT 10
                """)
                activity_raw = cur.fetchall()
                recent_activity = []
                for a in activity_raw:
                    recent_activity.append({
                        'type': a['type'],
                        'text': a['text'],
                        'time': a['event_time'].isoformat() if a.get('event_time') else None,
                    })

                # ── 5. KPI summaries ──
                total_companies = len(companies)
                active_count = funnel['active']
                in_pipeline = funnel['lead'] + funnel['contacted'] + funnel['documentation'] + funnel['verification']
                total_jobs = sum(c['jobsPosted'] for c in companies)

                return {
                    'funnel': funnel,
                    'companies': companies,
                    'recentActivity': recent_activity,
                    'kpis': {
                        'totalCompanies': total_companies,
                        'activeCompanies': active_count,
                        'inPipeline': in_pipeline,
                        'totalJobs': total_jobs,
                    }
                }

        except Exception as e:
            logger.error(f"Dashboard stats error: {e}")
            raise e
        finally:
            conn.close()
