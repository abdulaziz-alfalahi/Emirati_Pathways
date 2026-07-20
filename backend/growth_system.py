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

    # Roles an invitation may ever confer. employer_admin is deliberately NOT
    # self-selectable by the invitee (issue #89) — it carries
    # workspace.manage_employees, i.e. the ability to add and remove team
    # members. It can only be set by the operator who creates the invitation.
    ALLOWED_INVITE_ROLES = ('recruiter', 'employer_admin')
    DEFAULT_INVITE_ROLE = 'recruiter'

    @classmethod
    def _validate_role(cls, role):
        """Return role if it is an allowed invite role, else the safe default.

        Never raises: an operator typo must not break invite generation, and an
        invitee-supplied value must never widen privileges. Anything unknown
        degrades to the least-privileged role.
        """
        if isinstance(role, str) and role.strip() in cls.ALLOWED_INVITE_ROLES:
            return role.strip()
        return cls.DEFAULT_INVITE_ROLE

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
                                invited_by, status, is_used, expires_at, intended_role
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', FALSE, %s, %s)
                            RETURNING id, token, company_name, company_email, intended_role
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
                            # The role is decided by the OPERATOR at invite time and
                            # validated here — never taken from the invitee. See the
                            # allow-list check in redeem_invitation_for_user.
                            self._validate_role(company.get('role')),
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
                            'intended_role': record['intended_role'],
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

    def set_company_verification(self, company_id, verified, verified_by=None):
        """
        The operator-side write of the company approval gate (#96):
        `companies.is_verified` is what _unverified_company_block reads before
        any job posting may be published. Records who flipped it and when
        (migration 009 adds the columns) — this is an approval decision, not
        a display flag.

        Returns the updated company summary, or None if the id is unknown.
        """
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    UPDATE companies
                    SET is_verified = %s,
                        verified_by = %s,
                        verified_at = CASE WHEN %s THEN NOW() ELSE NULL END
                    WHERE id::text = %s
                    RETURNING id, company_name, is_verified, verified_by, verified_at
                """, (bool(verified), str(verified_by) if verified_by else None,
                      bool(verified), str(company_id)))
                row = cur.fetchone()
                if not row:
                    conn.rollback()
                    return None
                conn.commit()
                return {
                    'id': str(row['id']),
                    'company_name': row['company_name'],
                    'is_verified': row['is_verified'],
                    'verified_by': row['verified_by'],
                    'verified_at': row['verified_at'].isoformat() if row['verified_at'] else None,
                }
        except Exception as e:
            conn.rollback()
            logger.error(f"Company verification update failed: {e}")
            raise e

    def get_pending_invitations(self):
        """
        All open (unused, unexpired) invitations, with their magic links,
        for the operator dashboard. Before this existed, a magic link was
        only visible in the one dialog that generated it — closing that
        dialog meant the operator had to reissue the invitation.

        Operator-facing only: the route serving this is gated on
        OPERATOR_ROLES. The token is intentionally included — the operator
        is the person who delivers the link.
        """
        conn = self._get_db_connection()
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:8089')
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, token, company_name, company_email,
                           intended_role, expires_at, created_at
                    FROM company_invitations
                    WHERE is_used = FALSE AND expires_at > NOW()
                    ORDER BY created_at DESC
                """)
                rows = cur.fetchall()
                return [{
                    'id': str(r['id']),
                    'company_name': r['company_name'],
                    'company_email': r['company_email'] or '',
                    'intended_role': r['intended_role'] or 'recruiter',
                    'magic_link': f"{frontend_url}/join/{r['token']}",
                    'expires_at': r['expires_at'].isoformat() if r['expires_at'] else None,
                    'created_at': r['created_at'].isoformat() if r['created_at'] else None,
                } for r in rows]
        except Exception as e:
            logger.error(f"Pending invitations query failed: {e}")
            raise e

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
                           status, is_used, expires_at, created_at, intended_role
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

    def redeem_invitation_for_user(self, token, user_id, is_new_user=False):
        """
        Redeem a company invitation for an ALREADY-AUTHENTICATED user
        (issues #90, #103).

        The magic link no longer creates accounts from client-supplied data.
        Instead the wizard hands off to UAE Pass, and the OAuth callback calls
        this with the identity UAE Pass proved. That closes the takeover in the
        old flow, which matched an existing account by PHONE NUMBER from an
        unauthenticated request body — redeeming a link with someone else's
        number captured their account. Here there is nothing to spoof: the only
        identity input is the user id the callback resolved from UAE Pass.

        Role handling follows the owner's identity model:
          - a brand-new account (created moments ago by this same callback,
            hardcoded to 'candidate') takes the invited role as its PRIMARY
            role — this person joined the platform as invited staff;
          - an existing account KEEPS its primary role and the invited role is
            APPENDED to secondary_roles — identity is proven by UAE Pass, so
            linking is safe where the phone version was not, and
            resolve_roles unions the two columns.

        The role itself comes from the invitation's operator-set intended_role
        (issue #89); there is no caller-supplied role to validate.

        Returns: dict with user id, granted role, and company info.
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

                role = self._validate_role(invitation.get('intended_role'))

                # 2. The user must already exist — created or linked by the UAE
                #    Pass callback before this is called. Lock the row so two
                #    concurrent redemptions cannot interleave role writes.
                cur.execute(
                    "SELECT id, email, role, user_type FROM users WHERE id = %s FOR UPDATE",
                    (user_id,),
                )
                user = cur.fetchone()
                if not user:
                    raise ValueError("User account not found for invitation redemption")
                email = user.get('email') or invitation.get('company_email', '')

                if is_new_user:
                    # Fresh account from this same OAuth callback: the invited
                    # role becomes primary, with user_type mirrored as the
                    # legacy alias (#93).
                    cur.execute("""
                        UPDATE users
                        SET role = %s, user_type = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (role, role, user_id))
                else:
                    # Existing account: ADD the invited role, never replace.
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
                    """, (user_id, str(company_id), role.replace('_', ' ').title()))

                # 4a. Team membership. The ACL reads company_team_members, not
                #     hr_profiles (workspace_middleware.get_company_context), so
                #     without this row the new member 403s on every workspace
                #     endpoint despite having an HR profile. Vocabulary is the
                #     middleware's ROLE_PERMISSIONS keys: employer_admin
                #     invitations confer 'admin', everything else 'recruiter'.
                #     'accepted' is the only status the ACL honours (#91).
                ctm_role = 'admin' if role == 'employer_admin' else 'recruiter'
                cur.execute("""
                    INSERT INTO company_team_members
                        (id, company_id, user_id, role, invitation_status, joined_at, permissions)
                    VALUES (%s, %s, %s, %s, 'accepted', NOW(), '{}')
                    ON CONFLICT (company_id, user_id) DO NOTHING
                """, (str(uuid.uuid4()), str(company_id), user_id, ctm_role))

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

                return {
                    'id': user_id,
                    'email': email,
                    'role': role,
                    # Primary role only changes for brand-new accounts; the
                    # callback uses this for the JWT role claim.
                    'primary_role': role if is_new_user else user.get('role'),
                    'company_name': company_name,
                    'company_id': str(company_id),
                }

        except Exception as e:
            conn.rollback()
            logger.error(f"Invitation redemption failed: {e}")
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
