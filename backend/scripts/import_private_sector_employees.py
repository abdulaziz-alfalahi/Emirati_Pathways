#!/usr/bin/env python3
"""Load Emirati private-sector employment records (migration 077).

    dry run (default, writes nothing):
        .venv/bin/python backend/scripts/import_private_sector_employees.py FILE.xlsx

    execute:
        .venv/bin/python backend/scripts/import_private_sector_employees.py FILE.xlsx --execute

WHAT THIS WRITES

  private_sector_employment   one row per person: employer, job, benefit flags
  users                       an account for people not already known
  candidate_profiles          work_status = 'Working', plus demographics

WHAT IT REFUSES TO DO

  * READ A CSV. The supplied CSV export carried TWO different date formats in
    the same row — CreatedDate as D/M/Y, JobStartDate as M/D/Y — and 60% of the
    values were individually ambiguous (both parts <= 12), so a single parser
    would silently mis-date them with no error to notice. The .xlsx holds real
    date values and is unambiguous. This is the source-file gate from
    docs/cutover_runbook.md applied to dates rather than encoding.

  * OVERWRITE A RICHER RECORD. Where a person already exists, only empty fields
    are filled. A profile someone completed themselves outranks a bulk roster.

  * MARK ANYONE A MEMBER. These people have never used the platform. Membership
    is derived from having signed in (backend/populations.py), so they are
    invisible to recruiters and match pools until they actually join, and no
    column here can accidentally make them visible.

  * INVENT A LOOKING STATUS. The file says people are employed; it says nothing
    about whether they want to move. looking_status is left NULL rather than
    guessed, so "actively seeking" keeps meaning what it means.
"""
import argparse
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd  # noqa: E402
import psycopg2      # noqa: E402
import psycopg2.extras  # noqa: E402
from dotenv import load_dotenv  # noqa: E402

EID_RE = r'784\d{12}'
SOURCE_LABEL = 'Private Sector Employees (Dubai)'


def connect():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(here, '.env'))
    return psycopg2.connect(
        host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
        dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'), connect_timeout=10)


def yesno(v):
    """Yes/No text -> boolean, and anything else -> None.

    None rather than False for an unrecognised value: 'we were not told' and
    'we were told no' are different facts, and a benefit flag is not the place
    to blur them.
    """
    s = str(v or '').strip().lower()
    return True if s == 'yes' else (False if s == 'no' else None)


def load_source(path):
    if not path.lower().endswith(('.xlsx', '.xlsm')):
        sys.exit(f"REFUSED: {path} is not an Excel file.\n"
                 "  The CSV export of this data carries two different date formats in the\n"
                 "  same row and 60% of its date values are ambiguous. Import the .xlsx.")
    # Dates must stay native (that is the whole reason for using the .xlsx),
    # but identifier-ish columns must NOT be inferred as numbers: pandas turns
    # CompanyCode 167990 into the float 167990.0, which then matches no company
    # on the platform and silently corrupts the join key on ~29,500 rows. Caught
    # by a dry run reporting 0 known employers where 113 were expected.
    df = pd.read_excel(path, dtype={'EID': str, 'CompanyCode': str,
                                    'PhoneNumber': str})
    df['EID'] = df['EID'].astype(str).str.strip()
    valid = df['EID'].str.fullmatch(EID_RE)
    rejected = df.loc[~valid]
    return df.loc[valid].copy(), rejected


def as_date(v):
    if pd.isna(v):
        return None
    if isinstance(v, datetime):
        return v.date()
    try:
        d = pd.to_datetime(v, errors='coerce')
        return None if pd.isna(d) else d.date()
    except Exception:
        return None


def txt(v, limit=None):
    if pd.isna(v):
        return None
    s = str(v).strip()
    if not s:
        return None
    # A numeric-looking id that has been through a float at any point arrives as
    # '167990.0'. Strip it rather than store a key that matches nothing.
    if s.endswith('.0') and s[:-2].isdigit():
        s = s[:-2]
    return s[:limit] if limit else s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('--execute', action='store_true',
                    help='actually write; without it nothing is committed')
    args = ap.parse_args()

    df, rejected = load_source(args.source)
    src_name = os.path.basename(args.source)[:160]
    print(f"source           : {src_name}")
    print(f"rows accepted    : {len(df):,}")
    print(f"rows rejected    : {len(rejected):,}   (blank / non-EID footer rows)")
    dupes = df['EID'].duplicated().sum()
    print(f"duplicate EIDs   : {dupes:,}")
    if dupes:
        sys.exit("REFUSED: duplicate Emirates IDs in the source. Resolve upstream.")

    conn = connect()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    eids = df['EID'].tolist()

    cur.execute("SELECT id FROM users WHERE id = ANY(%s)", (eids,))
    existing = {r['id'].strip() for r in cur.fetchall()}
    cur.execute("SELECT user_id FROM candidate_profiles WHERE user_id = ANY(%s)", (eids,))
    has_profile = {r['user_id'].strip() for r in cur.fetchall()}
    cur.execute(f"""SELECT id FROM users WHERE id = ANY(%s)
                     AND (last_login IS NOT NULL OR uaepass_uuid IS NOT NULL)""", (eids,))
    already_members = {r['id'].strip() for r in cur.fetchall()}

    print()
    print("=== reconciliation ===")
    print(f"  already have an account      : {len(existing):,}")
    print(f"  already have a profile       : {len(has_profile):,}")
    print(f"  new people to create         : {len(eids) - len(existing):,}")
    print(f"  of the existing, are MEMBERS : {len(already_members):,}"
          "   (their profiles are left alone beyond employment)")

    codes = {txt(c) for c in df['CompanyCode'] if txt(c)}
    cur.execute("SELECT company_code FROM companies WHERE company_code = ANY(%s)",
                (sorted(codes),))
    known = {r['company_code'] for r in cur.fetchall()}
    print(f"  distinct employers in file   : {len(codes):,}")
    print(f"  already onboarded companies  : {len(known):,}")
    print(f"  employers NOT yet on platform: {len(codes) - len(known):,}")

    if not args.execute:
        print("\nDRY RUN — nothing written. Re-run with --execute to commit.")
        conn.close()
        return

    print("\nwriting…")
    ins_user = ins_profile = ins_emp = upd_emp = 0
    for _, r in df.iterrows():
        eid = r['EID']
        if eid not in existing:
            # users has no gender column — gender lives on candidate_profiles.
            # emirate is the job emirate from the roster; nationality is known
            # because this file is Emiratis by definition.
            cur.execute("""
                INSERT INTO users (id, full_name, phone, emirate, nationality,
                                   role, user_type, is_active, is_visible, created_at)
                VALUES (%s, %s, %s, %s, 'UAE', 'candidate', 'candidate', TRUE, TRUE, NOW())
                ON CONFLICT (id) DO NOTHING
            """, (eid, txt(r.get('FullName'), 200), txt(r.get('PhoneNumber'), 32),
                  txt(r.get('JobEmirate'), 60)))
            ins_user += cur.rowcount

        # candidate_profiles has NO unique index on user_id — only a primary key
        # on its own id. One profile per person is a convention here, not a
        # constraint (0 duplicates today), so this guard is the only thing
        # preventing a second profile. Re-running the import must not create one.
        if eid not in has_profile:
            has_profile.add(eid)
            cur.execute("""
                INSERT INTO candidate_profiles
                       (user_id, full_name, gender, age_group, education_level,
                        emirate_of_origin, marital_status, phone,
                        work_status, candidates_source, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'Working',%s,NOW())
            """, (eid, txt(r.get('FullName'), 200), txt(r.get('Gender'), 20),
                  txt(r.get('AgeGroup'), 20), txt(r.get('EducationLevel'), 60),
                  txt(r.get('EmirateOfOrigin'), 60), txt(r.get('MaritalStatus'), 40),
                  txt(r.get('PhoneNumber'), 32), SOURCE_LABEL))
            ins_profile += cur.rowcount
        else:
            # Fill gaps only — never overwrite a richer existing record.
            cur.execute("""
                UPDATE candidate_profiles
                   SET work_status      = COALESCE(work_status, 'Working'),
                       age_group        = COALESCE(age_group, %s),
                       education_level  = COALESCE(education_level, %s),
                       marital_status   = COALESCE(marital_status, %s),
                       candidates_source= COALESCE(candidates_source, %s)
                 WHERE user_id = %s
            """, (txt(r.get('AgeGroup'), 20), txt(r.get('EducationLevel'), 60),
                  txt(r.get('MaritalStatus'), 40), SOURCE_LABEL, eid))

        cur.execute("""
            INSERT INTO private_sector_employment
                   (emirates_id, user_id, company_code, company_sector, job_name,
                    job_name_ar, job_start_date, employment_status, employment_category,
                    job_emirate, salary_support, child_allowance, pension, merit,
                    source_created_date, source_file)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (emirates_id, source_file) DO UPDATE SET
                   user_id = EXCLUDED.user_id,
                   company_code = EXCLUDED.company_code,
                   company_sector = EXCLUDED.company_sector,
                   job_name = EXCLUDED.job_name,
                   job_name_ar = EXCLUDED.job_name_ar,
                   job_start_date = EXCLUDED.job_start_date,
                   salary_support = EXCLUDED.salary_support,
                   child_allowance = EXCLUDED.child_allowance,
                   pension = EXCLUDED.pension,
                   merit = EXCLUDED.merit,
                   updated_at = NOW()
        """, (eid, eid, txt(r.get('CompanyCode'), 32), txt(r.get('Company Sector'), 120),
              txt(r.get('JobName'), 200), txt(r.get('JobNameAR'), 200),
              as_date(r.get('JobStartDate')), txt(r.get('EmploymentStatus'), 40),
              txt(r.get('EmploymentCategory'), 40), txt(r.get('JobEmirate'), 60),
              yesno(r.get('Salary Support')), yesno(r.get('Child Allowance')),
              yesno(r.get('Pension')), yesno(r.get('Merit')),
              as_date(r.get('CreatedDate')), src_name))
        if cur.rowcount == 1:
            ins_emp += 1
        else:
            upd_emp += 1

    conn.commit()
    print(f"  users created        : {ins_user:,}")
    print(f"  profiles created     : {ins_profile:,}")
    print(f"  employment rows      : {ins_emp:,} inserted / {upd_emp:,} updated")

    cur.execute("SELECT COUNT(*) c FROM candidate_profiles WHERE work_status='Working'")
    print(f"  work_status Working  : {cur.fetchone()['c']:,}")
    cur.execute("""SELECT COUNT(*) c FROM users
                    WHERE role IN ('candidate','job_seeker')
                      AND (last_login IS NOT NULL OR uaepass_uuid IS NOT NULL)""")
    print(f"  members (unchanged)  : {cur.fetchone()['c']:,}")
    conn.close()


if __name__ == '__main__':
    main()
