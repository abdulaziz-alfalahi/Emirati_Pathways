import logging
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
                                    industry, trade_license_no, phone, emirate, city, business_type
                                )
                                VALUES (%s, %s, %s, FALSE, 'Imported from Nafis', %s, %s, %s, %s, %s, %s)
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
            
        return report

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
                    # Create new Recruiter User
                    # Hashing password skipped for simplicity in prototype - assume pre-hashed or handle in route
                    # For prototype, we'll store plaintext (BAD PRACTICE, but fine for prototype speed)
                    # In real app replace with bcrypt
                    hashed_pw = password # placeholder
                    
                    cur.execute("""
                        INSERT INTO users (
                            email, password_hash, first_name, last_name, 
                            user_type, phone, is_active, created_at
                        ) VALUES (
                            %s, %s, %s, 'Recruiter', 
                            'recruiter', '00000000', TRUE, NOW()
                        ) RETURNING id
                    """, (email, hashed_pw, token_record['company_name_snapshot']))
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
