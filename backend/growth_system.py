import logging

try:
    from backend.admin_audit import record_invitation
except ImportError:                          # pragma: no cover — dual root
    from admin_audit import record_invitation
import os
import csv
import io
import uuid
import secrets
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

try:
    from backend.company_identity import (
        NORMALIZED_NAME_SQL, normalize_company_name, display_company_name,
        find_company_id,
    )
    from backend.company_identity import clean_trade_license
    from backend.utils.contact_identity import canonical_email
except ImportError:
    from company_identity import (
        NORMALIZED_NAME_SQL, normalize_company_name, display_company_name,
        find_company_id,
    )
    from company_identity import clean_trade_license
    from utils.contact_identity import canonical_email

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from backend import outbound_mail
    from backend.brand import (PLATFORM_NAME_EN, PLATFORM_NAME_AR,
                               COUNCIL_NAME_EN, COUNCIL_NAME_AR, BILINGUAL_RULE)
except ImportError:  # pragma: no cover — the app runs under both roots
    import outbound_mail
    from brand import (PLATFORM_NAME_EN, PLATFORM_NAME_AR,
                       COUNCIL_NAME_EN, COUNCIL_NAME_AR, BILINGUAL_RULE)

from html import escape as html_escape


#: What an invited company is being asked to become. The operator picks the
#: role at invite time, so the message must say which one — "you have been
#: invited" without saying as what is how an employer decides it is phishing.
#: What the invitation GRANTS — not who the reader is.
#
# The old version named job titles, including HR Manager and HR, which
# ALLOWED_INVITE_ROLES cannot produce: it offered the reader a choice the system
# does not have. Worse, it told a person their own job title, guessed by an
# operator who had only a shared mailbox address to go on.
#
# These describe access instead, which is a fact about the account rather than
# an assertion about the reader.
_ROLE_LABELS = {
    'employer_admin': (
        'manage your organisation\'s account, publish vacancies, and invite '
        'your colleagues',
        'إدارة حساب مؤسستكم ونشر الشواغر ودعوة زملائكم'),
    'recruiter': (
        'publish vacancies and review candidates',
        'نشر الشواغر والاطلاع على المرشحين'),
}


def _role_label(role, arabic=False):
    en, ar = _ROLE_LABELS.get((role or '').strip().lower(),
                              _ROLE_LABELS['recruiter'])
    return ar if arabic else en


def _vacancy_verification_subject(company_name, job_title):
    """Company AND job title, English first — this reaches an employer.

    A CSV import sends one of these per vacancy row, so an employer with twelve
    open roles receives twelve messages, and the reviewer sees twelve queue
    entries. Without the job title in the subject they are indistinguishable —
    to the employer and to whoever is approving them.
    """
    return (f'Verify the vacancy "{job_title}" — {company_name} / '
            f'التحقق من شاغر "{job_title}" — {company_name}')


def _vacancy_verification_body(company_name, job_title, link):
    """Plain-text vacancy verification, ENGLISH first.

    Employer messages lead in English (owner, 2026-08-26): this arrives in a
    shared HR mailbox, which is business correspondence in the UAE and is
    frequently not read in Arabic. The candidate invitation still leads in
    Arabic, because that audience is the opposite case.
    """
    return (
        f"Dear {company_name},\n"
        f"\n"
        f"A vacancy at your organisation — \"{job_title}\" — appears in the NAFIS "
        f"data provided to us.\n"
        f"\n"
        f"Please confirm its details so it can be shown to qualified Emirati "
        f"candidates, and review those who match your requirements.\n"
        f"\n"
        f"To confirm, open this link:\n"
        f"\n"
        f"{link}\n"
        f"\n"
        f"If this vacancy is no longer open, or your organisation did not expect "
        f"this message, you can ignore it.\n"
        f"\n"
        f"— {COUNCIL_NAME_EN}\n"
        f"\n"
        f"{BILINGUAL_RULE}\n"
        f"\n"
        f"السادة/{company_name} المحترمين،\n"
        f"\n"
        f"وردنا ضمن بيانات نافس شاغر لديكم بعنوان \"{job_title}\".\n"
        f"\n"
        f"يرجى تأكيد تفاصيل الشاغر لعرضه على المرشحين الإماراتيين المؤهلين "
        f"والاطلاع على من يطابق متطلباتكم.\n"
        f"\n"
        f"للتأكيد، افتح الرابط التالي:\n"
        f"\n"
        f"{link}\n"
        f"\n"
        f"إذا لم يعد هذا الشاغر متاحاً، أو لم تكن مؤسستكم تتوقع هذه الرسالة، "
        f"يمكنكم تجاهلها.\n"
        f"\n"
        f"— {COUNCIL_NAME_AR}\n"
    )


def _vacancy_verification_html(company_name, job_title, link):
    """The delivered vacancy verification. ENGLISH block first — see the body.

    Company name and job title BOTH come from a NAFIS vacancy CSV, so both are
    escaped — a job title is free text typed by an employer, which makes it the
    likelier of the two to contain a character that breaks markup.
    """
    name = html_escape(company_name or '')
    title = html_escape(job_title or '')
    href = html_escape(link, quote=True)
    link_style = 'color:#1E40AF;word-break:break-all'
    p = 'margin:0 0 14px'
    return (
        '<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;'
        'font-size:15px;line-height:1.6;color:#1F2937">'
        f'<div dir="ltr" style="text-align:left">'
        f'<p style="{p}">Dear {name},</p>'
        f'<p style="{p}">A vacancy at your organisation — <strong>{title}</strong> '
        '— appears in the NAFIS data provided to us.</p>'
        f'<p style="{p}">Please confirm its details so it can be shown to '
        'qualified Emirati candidates, and review those who match your '
        'requirements.</p>'
        f'<p style="{p}">To confirm, open this link:</p>'
        f'<p style="{p}"><a href="{href}" style="{link_style}">{href}</a></p>'
        f'<p style="{p}">If this vacancy is no longer open, or your organisation '
        'did not expect this message, you can ignore it.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_EN}</p>'
        '</div>'
        '<hr style="border:none;border-top:1px solid #D1D5DB;margin:22px 0">'
        f'<div dir="rtl" style="text-align:right">'
        f'<p style="{p}">السادة/{name} المحترمين،</p>'
        f'<p style="{p}">وردنا ضمن بيانات نافس شاغر لديكم بعنوان '
        f'<strong>{title}</strong>.</p>'
        f'<p style="{p}">يرجى تأكيد تفاصيل الشاغر لعرضه على المرشحين الإماراتيين '
        'المؤهلين والاطلاع على من يطابق متطلباتكم.</p>'
        f'<p style="{p}">للتأكيد، افتح الرابط التالي:</p>'
        f'<p style="{p};text-align:right" dir="ltr">'
        f'<a href="{href}" style="{link_style}">{href}</a></p>'
        f'<p style="{p}">إذا لم يعد هذا الشاغر متاحاً، أو لم تكن مؤسستكم تتوقع '
        'هذه الرسالة، يمكنكم تجاهلها.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_AR}</p>'
        '</div>'
        '</div>'
    )


def _company_invitation_subject(company_name):
    """ENGLISH first, unlike the candidate invitation.

    Owner, 2026-08-26: employer messages lead in English. The audiences differ.
    A NAFIS candidate is an Emirati national for whom Arabic IS the message; an
    employer message arrives in a shared HR mailbox, which is business
    correspondence in the UAE and is frequently not read in Arabic at all.
    Leading in the wrong language for either audience buries the half that
    matters to them.

    The company's own name is in the subject because an employer receiving an
    unexpected government email scans the subject line for something that
    identifies THEM before deciding it is genuine.
    """
    return (f'Invitation to join the {PLATFORM_NAME_EN} — {company_name} / '
            f'دعوة للانضمام إلى {PLATFORM_NAME_AR} — {company_name}')


def _company_invitation_body(company_name, link, role=None):
    """Plain-text company invitation, Arabic first.

    See `_invitation_html` for why the delivered copy is HTML: a text body
    carries no direction, so a mail client renders the trailing "." and ":" of
    every Arabic line at the left edge.
    """
    return (
        f"Dear {company_name},\n"
        f"\n"
        f"Your organisation has been invited to join the {PLATFORM_NAME_EN}, "
        f"where you can publish vacancies and review qualified Emirati candidates.\n"
        f"\n"
        f"Whoever accepts this invitation will be able to "
        f"{_role_label(role)}. If that is not you, please pass this message to "
        f"the right colleague — the link works for whoever opens it.\n"
        f"\n"
        f"To complete your registration, open this link:\n"
        f"\n"
        f"{link}\n"
        f"\n"
        f"The link is valid for 7 days and can only be used once.\n"
        f"If your organisation did not expect this invitation, you can ignore "
        f"this message.\n"
        f"\n"
        f"— {COUNCIL_NAME_EN}\n"
        f"\n"
        f"{BILINGUAL_RULE}\n"
        f"\n"
        f"السادة/{company_name} المحترمين،\n"
        f"\n"
        f"تمت دعوة مؤسستكم للانضمام إلى {PLATFORM_NAME_AR}، حيث يمكنكم نشر "
        f"الشواغر والاطلاع على المرشحين الإماراتيين المؤهلين.\n"
        f"\n"
        f"سيتمكّن من يقبل هذه الدعوة من {_role_label(role, arabic=True)}. "
        f"وإذا لم تكن الشخص المعني، يُرجى تحويل الرسالة إلى الزميل المختص — "
        f"فالرابط يعمل لمن يفتحه.\n"
        f"\n"
        f"لإكمال التسجيل، افتح الرابط التالي:\n"
        f"\n"
        f"{link}\n"
        f"\n"
        f"الرابط صالح لمدة 7 أيام ويُستخدم مرة واحدة فقط.\n"
        f"إذا لم تكن مؤسستكم تتوقع هذه الدعوة، يمكنكم تجاهل هذه الرسالة.\n"
        f"\n"
        f"— {COUNCIL_NAME_AR}\n"
    )


def _company_invitation_html(company_name, link, role=None):
    """The delivered company invitation. ENGLISH block first — see the body.

    Same shape as the seeker invitation, and for the same measured reason: in
    Outlook a plain-text Arabic paragraph renders with its punctuation at the
    LEFT edge, because a text body carries no direction.

    The company name is escaped. It arrives from a NAFIS vacancy CSV — the same
    source that produced 126 invitation tokens to real employers — and a stray
    "<" in a trade name would eat the rest of the paragraph.
    """
    name = html_escape(company_name or '')
    href = html_escape(link, quote=True)
    link_style = 'color:#1E40AF;word-break:break-all'
    p = 'margin:0 0 14px'
    return (
        '<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;'
        'font-size:15px;line-height:1.6;color:#1F2937">'
        f'<div dir="ltr" style="text-align:left">'
        f'<p style="{p}">Dear {name},</p>'
        f'<p style="{p}">Your organisation has been invited to join the '
        f'{PLATFORM_NAME_EN}, where you can publish vacancies and review '
        'qualified Emirati candidates.</p>'
        f'<p style="{p}">Whoever accepts this invitation will be able to '
        f'<strong>{html_escape(_role_label(role))}</strong>. If that is not you, '
        'please pass this message to the right colleague — the link works for '
        'whoever opens it.</p>'
        f'<p style="{p}">To complete your registration, open this link:</p>'
        f'<p style="{p}"><a href="{href}" style="{link_style}">{href}</a></p>'
        f'<p style="{p}">The link is valid for 7 days and can only be used '
        'once.<br>If your organisation did not expect this invitation, you can '
        'ignore this message.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_EN}</p>'
        '</div>'
        '<hr style="border:none;border-top:1px solid #D1D5DB;margin:22px 0">'
        f'<div dir="rtl" style="text-align:right">'
        f'<p style="{p}">السادة/{name} المحترمين،</p>'
        f'<p style="{p}">تمت دعوة مؤسستكم للانضمام إلى {PLATFORM_NAME_AR}، حيث '
        'يمكنكم نشر الشواغر والاطلاع على المرشحين الإماراتيين المؤهلين.</p>'
        f'<p style="{p}">سيتمكّن من يقبل هذه الدعوة من '
        f'<strong>{html_escape(_role_label(role, arabic=True))}</strong>. وإذا لم '
        'تكن الشخص المعني، يُرجى تحويل الرسالة إلى الزميل المختص — فالرابط يعمل '
        'لمن يفتحه.</p>'
        f'<p style="{p}">لإكمال التسجيل، افتح الرابط التالي:</p>'
        # The URL stays LTR inside the Arabic block — see the seeker invitation.
        f'<p style="{p};text-align:right" dir="ltr">'
        f'<a href="{href}" style="{link_style}">{href}</a></p>'
        f'<p style="{p}">الرابط صالح لمدة 7 أيام ويُستخدم مرة واحدة فقط.<br>'
        'إذا لم تكن مؤسستكم تتوقع هذه الدعوة، يمكنكم تجاهل هذه الرسالة.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_AR}</p>'
        '</div>'
        '</div>'
    )


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

    #: What a FIRST CONTACT with a company confers when no role is named.
    #
    # Owner's decision, 2026-08-26. Outreach invitations go to an address taken
    # from a NAFIS vacancy CSV — usually hr@ or info@, a shared mailbox — so the
    # operator was guessing the job title of somebody they cannot identify, and
    # the invitation then asserted that guess back to them. Whoever opened it
    # received the guessed role.
    #
    # The company knows who is who and the operator does not, so the first
    # person to redeem becomes the ADMINISTRATOR of their own company account
    # and invites their own recruiters and HR managers from inside. The guess
    # disappears rather than being made more precisely.
    FIRST_CONTACT_ROLE = 'employer_admin'

    #: Where an UNRECOGNISED value lands. Deliberately different from
    #: FIRST_CONTACT_ROLE and deliberately the least-privileged option: "the
    #: operator did not name a role" and "something supplied a role we do not
    #: understand" are different situations, and only the first is a decision.
    #: Collapsing them would turn a typo into a privilege escalation.
    FALLBACK_ROLE = 'recruiter'

    #: Kept as an alias: other modules and tests refer to it.
    DEFAULT_INVITE_ROLE = FIRST_CONTACT_ROLE

    @classmethod
    def _validate_role(cls, role):
        """Return the role an invitation should confer. Never raises.

        An operator typo must not break invite generation, and nothing supplied
        by an invitee may ever widen privileges.
        """
        if role is None or (isinstance(role, str) and not role.strip()):
            # Nobody chose. This is bulk outreach to a company that is not on
            # the platform yet, so it is a first contact.
            return cls.FIRST_CONTACT_ROLE
        if isinstance(role, str) and role.strip() in cls.ALLOWED_INVITE_ROLES:
            return role.strip()
        # Present but unrecognised — degrade, never widen.
        return cls.FALLBACK_ROLE

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


    def import_vacancies_from_csv(self, csv_file_content, queue_emails=False,
                                  imported_by=None):
        """
        Parses Nafis CSV and creates Pending Jobs + Shadow Companies.
        Returns report of actions taken.

        queue_emails DEFAULTS TO FALSE, AND THAT IS THE POINT.

        Importing used to compose a verification email for every vacancy row as
        an unavoidable side effect. On 2026-08-27 that put 267 messages to 145
        REAL employers into the approval queue in a single transaction, and
        nobody had decided to email anyone: the operator screen uploads the file
        the moment it is chosen, so picking a CSV to preview and filter was
        enough to compose them all.

        Nothing was delivered — the allow-list and per-message approval both
        held — but "nothing escaped" is luck about configuration, not a design.
        Bringing data in and writing to 145 companies are different decisions
        and one must not imply the other.

        imported_by is recorded on everything this creates. It was not, so the
        rows carried recruiter_id '0' and created_by NULL, and the platform
        could not say who had run the import that produced them.
        """
        conn = self._get_db_connection()
        report = {
            'total_rows': 0,
            'companies_created': 0,
            'jobs_created': 0,
            # NOT 'emails_sent'. Nothing is sent here; each message waits
            # for per-message approval. The old key fed a response that said
            # "Sent N emails" when none had been.
            'messages_queued': 0,
            # Rows that WOULD have had a message composed had this import been
            # asked to. Reported so "no emails" is a visible fact rather than a
            # silence that looks identical to "the mail step is broken".
            'messages_not_queued': 0,
            'without_email_on_file': 0,
            'queued_emails': queue_emails,
            'errors': []
        }
        
        try:
            # Decode robustly. A bare .decode('utf-8') used to raise
            # UnicodeDecodeError on a cp1256 (Arabic Windows) export and take the
            # ENTIRE import down with it — no rows landed at all.
            try:
                from backend.csv_encoding import decode_csv_bytes, looks_encoding_mangled
            except ImportError:
                from csv_encoding import decode_csv_bytes, looks_encoding_mangled
            csv_file_content, _used_encoding = decode_csv_bytes(csv_file_content)
            if _used_encoding not in ('utf-8-sig', 'utf-8', 'str'):
                report['errors'].append(
                    f"File was not UTF-8 (read as {_used_encoding}). Re-export as "
                    f"'CSV UTF-8' if any Arabic text looks wrong.")

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
                        trade_license = clean_trade_license(
                            row.get('TradeLicenseNo') or row.get('Trade License No'))
                        company_code = (row.get('CompanyCode') or row.get('Company Code') or '').strip() or None
                        phone = row.get('CompanyPhone') or row.get('Company Phone')
                        emirate = row.get('JobEmirate') or row.get('Job Emirate') or row.get('Emirate')
                        city = row.get('JobCity') or row.get('Job City')
                        business_type = row.get('PartnerBusinessType') or row.get('BusinessType')
                        
                        if not company_name or not company_email or not job_title:
                            report['errors'].append(f"Row {report['total_rows']}: Missing required fields (Name, Email, or Title)")
                            cur.execute("RELEASE SAVEPOINT sp_row")
                            continue

                        # The spreadsheet already destroyed this text before upload
                        # (Excel replaces anything it can't encode with '?'). We
                        # cannot recover it here — the characters are gone — so
                        # refuse the row rather than commit '???? ???????' under a
                        # real company's identity, which is what happened to one
                        # of the companies already on staging.
                        if looks_encoding_mangled(company_name):
                            report['errors'].append(
                                f"Row {report['total_rows']}: company name looks corrupted "
                                f"by the export ('{company_name[:40]}'). Re-export the file as "
                                f"'CSV UTF-8' — the original characters cannot be recovered "
                                f"from this file.")
                            cur.execute("RELEASE SAVEPOINT sp_row")
                            continue


                        # 2. Find or Create Shadow Company — resolved by trade
                        #    licence / normalised name, not exact string (#99)
                        logger.info(f"Processing company: {company_name}")
                        company_id = find_company_id(cur, company_name, trade_license)

                        if company_id:
                            # Optional: Update existing company with new details if missing
                            cur.execute("""
                                UPDATE companies
                                SET industry = COALESCE(industry, %s),
                                    trade_license_no = COALESCE(trade_license_no, %s),
                                    company_code = COALESCE(company_code, %s),
                                    phone = COALESCE(phone, %s),
                                    emirate = COALESCE(emirate, %s),
                                    city = COALESCE(city, %s),
                                    business_type = COALESCE(business_type, %s)
                                WHERE id = %s
                            """, (industry, trade_license, company_code, phone, emirate, city, business_type, company_id))
                        else:
                            # Create Shadow Company with new details
                            cur.execute("""
                                INSERT INTO public.companies (
                                    company_name, name, contact_email, is_verified, description,
                                    industry, trade_license_no, company_code, phone, emirate, city,
                                    business_type, lead_source
                                )
                                VALUES (%s, %s, %s, FALSE, 'Imported from Nafis', %s, %s, %s, %s, %s, %s, %s,
                                        'nafis_import')
                                RETURNING id
                            """, (
                                display_company_name(company_name),
                                display_company_name(company_name), company_email,
                                industry, trade_license, company_code, phone, emirate, city, business_type
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

                        # Who ran the import. It is not in the CSV — it is the
                        # operator who uploaded it, and it used to be dropped:
                        # every row landed with created_by NULL and
                        # recruiter_id the literal string '0', so 267 vacancies
                        # and 267 messages to real employers existed with
                        # nothing anywhere naming who had produced them.
                        creator_id = imported_by

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
                        
                        # 5. Queue the verification email for approval — ONLY
                        # if this import was explicitly asked to compose mail.
                        # On the SAME cursor as the job and its token, so a row
                        # that rolls back does not leave a message behind.
                        if not queue_emails:
                            report['messages_not_queued'] += 1
                        elif self._queue_verification_email(
                                cur, company_email, company_name, job_title,
                                token_str, job_id, invited_by=imported_by):
                            report['messages_queued'] += 1
                        else:
                            report['without_email_on_file'] += 1
                        
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
        Check which of the provided company names already exist in the DB,
        matching case/whitespace-insensitively (#99).

        Returns the CALLER'S spellings, not the stored ones: both frontends
        (NafisVacancyImport, GrowthTools) flag rows via
        `existingSet.has(row.companyName)`, so returning the DB's casing
        would silently unflag every row that differs only in case.
        """
        if not company_names:
            return []

        normalized_to_inputs = {}
        for name in company_names:
            normalized = normalize_company_name(name)
            if normalized:
                normalized_to_inputs.setdefault(normalized, []).append(name)
        if not normalized_to_inputs:
            return []

        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT DISTINCT {NORMALIZED_NAME_SQL}
                    FROM companies
                    WHERE {NORMALIZED_NAME_SQL} = ANY(%s)
                """, (list(normalized_to_inputs.keys()),))

                hits = {row[0] for row in cur.fetchall()}
                return [
                    original
                    for normalized, originals in normalized_to_inputs.items()
                    if normalized in hits
                    for original in originals
                ]
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

    def _queue_verification_email(self, cur, email, company, job, token, job_id,
                                  invited_by=None):
        """Hold a vacancy-verification message for approval. Returns its id.

        Replaces a print that claimed to be an email. Two things were wrong
        with it beyond not sending:

          * The link was hardcoded to http://localhost:8089 — not even
            FRONTEND_URL. Had this flow ever really sent, every employer would
            have received a link to their own machine.
          * The caller counted each one into report['emails_sent'], which the
            import endpoint reported as "Sent N emails".

        This runs ONCE PER VACANCY ROW, not once per company: a single CSV
        import fans out to one message per job. That is how one test run on
        2026-08-21 produced 126 live tokens across 219 domains. At that volume
        the reviewer needs the company AND the job title in the subject, or the
        queue is 126 indistinguishable rows.
        """
        if not (email or '').strip():
            return None
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:8089')
        link = f"{frontend_url}/verify-job/{token}"
        return outbound_mail.queue(
            to_email=email.strip(),
            to_name=company,
            subject=_vacancy_verification_subject(company, job),
            body_text=_vacancy_verification_body(company, job, link),
            body_html=_vacancy_verification_html(company, job, link),
            kind='vacancy_verification',
            related_type='job_posting',
            related_id=str(job_id),
            created_by=invited_by,
            cursor=cur)
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
                # Canonical on both sides (#95) — the token may carry any
                # spelling the operator's CSV had.
                email = canonical_email(token_record['email'])

                # 2. Create/Get User
                # Check if user exists with this email
                cur.execute("SELECT id FROM users WHERE lower(btrim(email)) = %s", (email,))
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
                    # role AND user_type (#93): the authorizer and the JWT
                    # claim read `role`; writing only user_type made this
                    # account a candidate on every login after the first.
                    # Phone is unknown here — store empty, not a '00000000'
                    # sentinel that could collide in phone matching (#95).
                    cur.execute("""
                        INSERT INTO users (
                            id, email, password_hash, first_name, last_name,
                            role, user_type, phone, is_active, created_at
                        ) VALUES (
                            %s, %s, %s, %s, 'Recruiter',
                            'recruiter', 'recruiter', '', TRUE, NOW()
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

    def get_vacancy_concentration(self, min_vacancies=5):
        """How much of the vacancy pool a threshold actually covers.

        WHY THIS EXISTS (owner, 2026-08-26): the onboarding plan is to filter
        employers by vacancy count and work the top of the list — 20% of the
        effort for 80% of the effect. The operator screen already ranks and
        filters, but the threshold slider defaulted to 5 with nothing to judge
        it by, so the 80% was being guessed at rather than seen.

        Returns the totals and, for this threshold, how many employers it
        selects and what share of all pending vacancies they hold. Also the
        SUGGESTED threshold: the smallest one whose selected employers hold at
        least 80% of the vacancies.

        Counts 'pending_verification' only — the same population the operator
        can actually act on, and the same one get_growth_candidates ranks.
        Counting every status would include draft and published postings that
        are not part of this outreach.
        """
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT COUNT(j.id) AS vacancies
                      FROM companies c
                      JOIN job_postings j ON c.id = j.company_id::uuid
                     WHERE j.status = 'pending_verification'
                     GROUP BY c.id
                     ORDER BY vacancies DESC
                """)
                counts = [int(r['vacancies']) for r in cur.fetchall()]

            total_vacancies = sum(counts)
            total_companies = len(counts)
            if not total_vacancies:
                # Honest empty rather than a division by zero or a fake 100%.
                # This is the state right after migration 089 and before a new
                # NAFIS sheet is imported.
                return {'total_companies': 0, 'total_vacancies': 0,
                        'selected_companies': 0, 'selected_vacancies': 0,
                        'coverage_percent': None, 'suggested_min_vacancies': None}

            selected = [n for n in counts if n >= min_vacancies]
            selected_vacancies = sum(selected)

            # The smallest threshold reaching 80% coverage. Walking DOWN from
            # the largest count means the answer is the point at which adding
            # the next-smaller employer is no longer worth the visit.
            suggested, running = None, 0
            for n in counts:
                running += n
                if running * 100 >= total_vacancies * 80:
                    suggested = n
                    break

            return {
                'total_companies': total_companies,
                'total_vacancies': total_vacancies,
                'selected_companies': len(selected),
                'selected_vacancies': selected_vacancies,
                'coverage_percent': round(selected_vacancies * 100.0 / total_vacancies, 1),
                'company_percent': round(len(selected) * 100.0 / total_companies, 1),
                'suggested_min_vacancies': suggested,
            }
        except Exception as e:
            logger.error(f"Error computing vacancy concentration: {e}")
            return {'total_companies': 0, 'total_vacancies': 0,
                    'selected_companies': 0, 'selected_vacancies': 0,
                    'coverage_percent': None, 'suggested_min_vacancies': None}

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
                            (company.get('code') or '').strip(),
                            company.get('email', ''),
                            company.get('phone', ''),
                            company.get('sector', ''),
                            # Sanity-cleaned; junk becomes '' rather than a
                            # licence-shaped string that later pollutes
                            # companies.trade_license_no (#98).
                            clean_trade_license(company.get('tradeLicense')) or '',
                            invited_by,
                            expires_at,
                            # The role is decided by the OPERATOR at invite time and
                            # validated here — never taken from the invitee. See the
                            # allow-list check in redeem_invitation_for_user.
                            self._validate_role(company.get('role')),
                        ))

                        record = cur.fetchone()

                        # Who issued this, recorded before anything is sent.
                        #
                        # Asked on 2026-08-27 who had invited a real employer,
                        # the platform could not say: the invitation named an
                        # operator who truthfully denied it (the button told him
                        # it had sent nothing) and the ACT of issuing it was
                        # recorded nowhere. A row naming an operator is not an
                        # audit trail on its own.
                        record_invitation(
                            'company', invited_by, str(record['id']),
                            record['company_email'],
                            intended_role=record.get('intended_role'),
                            extra={'company_name': record['company_name']})

                        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:8089')
                        link = f"{frontend_url}/join/{token}"

                        # Queued for per-message approval, never sent from here.
                        # Written on THIS cursor so the message commits — or
                        # rolls back — with the token it carries: a queued email
                        # holding a link to a token that never existed is the
                        # orphan shape migration 086 had to clean up.
                        #
                        # A company with no email address on file still gets an
                        # invitation record; the operator passes that link on by
                        # hand. Queuing a message addressed to nobody would put
                        # an unsendable row in the reviewer's queue for ever.
                        company_email = (record['company_email'] or '').strip()
                        message_id = None
                        if company_email:
                            message_id = outbound_mail.queue(
                                to_email=company_email,
                                to_name=record['company_name'],
                                subject=_company_invitation_subject(record['company_name']),
                                body_text=_company_invitation_body(
                                    record['company_name'], link, record['intended_role']),
                                body_html=_company_invitation_html(
                                    record['company_name'], link, record['intended_role']),
                                kind='company_invitation',
                                related_type='company_invitation',
                                related_id=str(record['id']),
                                created_by=invited_by,
                                cursor=cur)

                        results.append({
                            'id': str(record['id']),
                            'token': record['token'],
                            'company_name': record['company_name'],
                            'company_email': record['company_email'],
                            'intended_role': record['intended_role'],
                            'magic_link': link,
                            'message_id': message_id,
                            'message_status': ('awaiting_approval' if message_id
                                               else 'no_email_on_file'),
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
        # Verification must name who approved it. The database enforces this
        # too (migration 107, companies_verification_needs_an_approver), but a
        # constraint violation reaches an operator as a 500; refusing here gives
        # them a sentence they can act on.
        #
        # WHY IT MATTERS: nine seeded companies were found verified with
        # verified_by NULL — nobody had approved them, and because publishing is
        # gated on verification they were the only employers on the platform who
        # could reach a candidate, while 269 companies holding real trade
        # licences could not.
        if verified and not verified_by:
            raise ValueError('Verifying a company requires the id of whoever '
                             'approved it; is_verified gates publishing and is '
                             'an approval decision, not a display flag.')

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

                # 3. Find or create company link — resolved by trade licence /
                #    normalised name, not exact string (#99)
                company_name = invitation.get('company_name', '')
                trade_license = clean_trade_license(invitation.get('trade_license'))
                company_id = find_company_id(cur, company_name, trade_license)

                if company_id:
                    # Existing company: persist the operator's corrections
                    # instead of silently discarding every invite field (#98).
                    # COALESCE — fill gaps, never overwrite existing values.
                    cur.execute("""
                        UPDATE companies
                        SET trade_license_no = COALESCE(trade_license_no, %s),
                            company_code = COALESCE(company_code, %s),
                            industry = COALESCE(industry, %s),
                            phone = COALESCE(NULLIF(phone, ''), %s)
                        WHERE id = %s
                    """, (
                        trade_license,
                        (invitation.get('company_code') or '').strip() or None,
                        invitation.get('company_sector') or None,
                        invitation.get('company_phone') or None,
                        company_id,
                    ))
                else:
                    # Create shadow company
                    cur.execute("""
                        INSERT INTO companies (
                            company_name, name, contact_email, phone,
                            industry, trade_license_no, company_code,
                            is_verified, description, lead_source
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE, 'Invited via Growth Operator',
                                  'magic_link')
                        RETURNING id
                    """, (
                        display_company_name(company_name),
                        display_company_name(company_name),
                        email, invitation.get('company_phone', ''),
                        invitation.get('company_sector', ''),
                        trade_license,
                        (invitation.get('company_code') or '').strip() or None,
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
                        COALESCE(j.published_count, 0) AS published_jobs,
                        -- Has anyone from this company actually joined? The ACL
                        -- rule (accepted team member) is what decides whether
                        -- someone may act for a company, so it is what decides
                        -- whether the company is really on the platform.
                        EXISTS (SELECT 1 FROM company_team_members m
                                 WHERE m.company_id = c.id
                                   AND m.invitation_status = 'accepted') AS has_joined_member
                    FROM companies c
                    LEFT JOIN (
                        SELECT
                            company_id,
                            COUNT(*) AS job_count,
                            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
                            0 AS total_hired
                        FROM job_postings
                        GROUP BY company_id
                    ) j ON c.id = j.company_id
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

                # Build invitation lookup by normalised company name (#99) —
                # invitations store a name snapshot from the operator's CSV,
                # which may differ from the stored company row in case or
                # whitespace only.
                invitation_map = {}
                for inv in invitations:
                    name = normalize_company_name(inv['company_name'])
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
                    name = normalize_company_name(c['company_name'])
                    inv = invitation_map.get(name)

                    # Determine funnel stage
                    #
                    # ACTIVE MEANS SOMEONE FROM THE COMPANY HAS JOINED.
                    #
                    # This used to be `is_verified or published_jobs > 0`, and
                    # active companies are EXCLUDED from the invitation pipeline —
                    # so verifying a trade licence removed the company from the
                    # list of companies to invite, before anyone from it had an
                    # account. 8 of 11 verified companies had nobody joined
                    # (owner, 2026-08-22). None had vacancies, so nothing
                    # actionable was hidden in practice, but the next real
                    # employer verified ahead of onboarding would vanish from the
                    # one screen an operator works from.
                    #
                    # is_verified is a check on the trade licence, not evidence
                    # of a relationship. Verified-but-not-joined now stays IN the
                    # pipeline, which is exactly where a company that has been
                    # checked but never onboarded belongs.
                    if c.get('has_joined_member'):
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
                        JOIN companies c ON c.id = jp.company_id
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
