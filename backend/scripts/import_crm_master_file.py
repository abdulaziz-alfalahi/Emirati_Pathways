#!/usr/bin/env python3
"""Import the CRM Main Master File — the job-seeker roster and its add/drop cycles.

    dry run (default, writes nothing):
        .venv/bin/python backend/scripts/import_crm_master_file.py FILE.xlsx

    execute:
        .venv/bin/python backend/scripts/import_crm_master_file.py FILE.xlsx --execute

WHAT THIS REPLACES

backend/scripts/migrate_crm_candidates.py, which is left in place but should not
be used again. It reads a hardcoded /app/master_file.xlsx, has no dry run, and —
the reason not to reuse it — INVENTS AN EMAIL for every person it creates:

    f"{eid}@example.com"

1,046 accounts on the live database carry one of those today. A fabricated
contact address is worse than a blank one: blank is honest, and someone will
eventually send mail to the other. Nothing here writes an email it was not
given.

WHAT THIS DOES

  Master sheet   -> nafis_job_seekers (the roster) + candidate_profiles (CRM
                    fields: call status, work status, looking status, remarks)
  Removed sheets -> roster_status = 'removed', dated
  Added sheets   -> reported only; they are already in Master, so importing them
                    separately would double-count

REMOVAL IS NOT AN ASSERTION ABOUT THE PERSON. Leaving the roster is a fact about
the roster. Nothing here writes looking_status or work_status from a removal:
43% of removed people turn up in the private-sector employment file, but the
other 57% do not, and inferring "no longer seeking" from a removal would put a
guess into a field the board reads as fact.
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd  # noqa: E402
import psycopg2  # noqa: E402
import psycopg2.extras  # noqa: E402
from dotenv import load_dotenv  # noqa: E402

EID_RE = r'784\d{12}'
CYCLE_RE = re.compile(r'^(Added|Removed)\s+(.+)$', re.I)


def connect():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(here, '.env'))
    return psycopg2.connect(
        host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
        dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'), connect_timeout=10)


def txt(v, limit=None):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip()
    if not s or s.lower() in ('nan', 'none', 'nat'):
        return None
    if s.endswith('.0') and s[:-2].isdigit():
        s = s[:-2]
    return s[:limit] if limit else s


def as_date(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    d = pd.to_datetime(v, errors='coerce')
    return None if pd.isna(d) else d.date()


def eids_of(df):
    s = df['EID'].astype(str).str.strip()
    return set(s[s.str.fullmatch(EID_RE)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('--execute', action='store_true')
    args = ap.parse_args()

    if not args.source.lower().endswith(('.xlsx', '.xlsm')):
        sys.exit('REFUSED: import the .xlsx, not a CSV export of it.')

    xl = pd.ExcelFile(args.source)
    if 'Master' not in xl.sheet_names:
        sys.exit("REFUSED: no 'Master' sheet in this workbook.")

    master = pd.read_excel(args.source, sheet_name='Master')
    master['EID'] = master['EID'].astype(str).str.strip()
    valid = master['EID'].str.fullmatch(EID_RE)
    rejected = int((~valid).sum())
    master = master.loc[valid].copy()

    removed_cycles, added_cycles = {}, {}
    for sheet in xl.sheet_names:
        m = CYCLE_RE.match(sheet.strip())
        if not m:
            continue
        kind, label = m.group(1).lower(), m.group(2).strip()
        try:
            df = pd.read_excel(args.source, sheet_name=sheet)
            if 'EID' not in df.columns:
                continue
            (removed_cycles if kind == 'removed' else added_cycles)[label] = eids_of(df)
        except Exception as e:  # pragma: no cover
            print(f"  ! could not read {sheet}: {e}")

    src_name = os.path.basename(args.source)
    print(f"source           : {src_name}")
    print(f"master rows      : {len(master):,}   (rejected {rejected})")
    print(f"duplicate EIDs   : {int(master['EID'].duplicated().sum()):,}")
    for label, s in added_cycles.items():
        print(f"  added   {label:<14} {len(s):>5,}")
    for label, s in removed_cycles.items():
        print(f"  removed {label:<14} {len(s):>5,}")

    all_removed = set().union(*removed_cycles.values()) if removed_cycles else set()
    master_eids = set(master['EID'])
    # Someone can be removed in one cycle and re-added in a later one. The
    # master sheet is the current truth, so anyone still in it is active
    # regardless of having appeared on an earlier Removed sheet.
    genuinely_removed = all_removed - master_eids
    readded = all_removed & master_eids

    conn = connect()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT emirates_id FROM nafis_job_seekers")
    known = {r['emirates_id'].strip() for r in cur.fetchall()}
    cur.execute("SELECT id FROM users WHERE id = ANY(%s)", (sorted(master_eids),))
    have_user = {r['id'].strip() for r in cur.fetchall()}
    cur.execute("SELECT user_id FROM candidate_profiles WHERE user_id = ANY(%s)",
                (sorted(master_eids),))
    have_profile = {r['user_id'].strip() for r in cur.fetchall()}

    print()
    print("=== reconciliation ===")
    print(f"  already on the roster        : {len(master_eids & known):,}")
    print(f"  new to the roster            : {len(master_eids - known):,}")
    print(f"  on the roster but NOT in this file (will be marked removed): "
          f"{len(known - master_eids):,}")
    print(f"  removed sheets, still absent : {len(genuinely_removed):,}")
    print(f"  removed then re-added        : {len(readded):,}   (stay active — master is current truth)")
    print(f"  need a user account          : {len(master_eids - have_user):,}")
    print(f"  need a candidate profile     : {len(master_eids - have_profile):,}")

    if not args.execute:
        print("\nDRY RUN — nothing written. Re-run with --execute to commit.")
        conn.close()
        return

    # The date a person left is the date of the CYCLE they left on, not the date
    # of the file. Parsing it out of the filename silently produced None on the
    # first run and left 131 removals undated — the whole point of dated cycles.
    #
    # Sheet labels look like "17th Aug"; the year comes from the filename
    # ("...__17_Aug26.xlsx"), falling back to today's year rather than guessing.
    year_m = re.search(r'(20\d{2}|(?<=[A-Za-z])(\d{2})(?!\d))', src_name)
    yr = None
    if year_m:
        g = year_m.group(1)
        yr = int(g) if len(g) == 4 else 2000 + int(g)
    yr = yr or pd.Timestamp.today().year

    def cycle_date(label):
        d = pd.to_datetime(f"{label} {yr}", errors='coerce', dayfirst=True)
        return None if pd.isna(d) else d.date()

    file_date = max([d for d in (cycle_date(l) for l in
                                 list(removed_cycles) + list(added_cycles)) if d],
                    default=pd.Timestamp.today().date())
    print("\nwriting…")
    new_seekers = new_users = new_profiles = upd_profiles = 0

    for _, r in master.iterrows():
        eid = r['EID']
        cur.execute("""
            INSERT INTO nafis_job_seekers
                   (emirates_id, user_id, full_name, full_name_arabic, gender,
                    age_group, education_level, emirate_of_origin, emirate_of_residence,
                    city_name, specialization, phone, email, marital_status,
                    job_seeker_type, job_seeker_date, registered_on,
                    roster_status, roster_last_seen_on, status, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    'active',%s,'imported',NOW())
            ON CONFLICT (emirates_id) DO UPDATE SET
                   roster_status = 'active',
                   roster_last_seen_on = EXCLUDED.roster_last_seen_on,
                   roster_removed_on = NULL,
                   job_seeker_type = COALESCE(EXCLUDED.job_seeker_type, nafis_job_seekers.job_seeker_type),
                   phone = COALESCE(EXCLUDED.phone, nafis_job_seekers.phone),
                   updated_at = NOW()
        """, (eid, eid if eid in have_user else None,
              txt(r.get('Full Name'), 200), txt(r.get('Full Name Arabic'), 200),
              txt(r.get('Gender'), 20), txt(r.get('Age Group'), 20),
              txt(r.get('Education'), 60), txt(r.get('Emirate Of Origin'), 60),
              txt(r.get('Emirate Of Residence'), 60), txt(r.get('City Name'), 60),
              txt(r.get('Specialization'), 120), txt(r.get('Ph No'), 32),
              txt(r.get('Email'), 160), txt(r.get('Marital Status'), 40),
              txt(r.get('Job Seeker Type'), 50), as_date(r.get('Job Seeker Date')),
              as_date(r.get('Registered On')), file_date))
        if cur.rowcount == 1:
            new_seekers += 1

        if eid not in have_user:
            have_user.add(eid)
            # No fabricated email. Blank is honest; an invented address is not.
            cur.execute("""
                INSERT INTO users (id, full_name, phone, email, emirate, nationality,
                                   role, user_type, is_active, is_visible, created_at)
                VALUES (%s,%s,%s,%s,%s,'UAE','candidate','candidate',TRUE,TRUE,NOW())
                ON CONFLICT (id) DO NOTHING
            """, (eid, txt(r.get('Full Name'), 200), txt(r.get('Ph No'), 32),
                  txt(r.get('Email'), 160), txt(r.get('Emirate Of Residence'), 60)))
            new_users += cur.rowcount

        crm = (txt(r.get('Call Status'), 50), txt(r.get('Work Status'), 50),
               txt(r.get('Looking / Not Looking'), 50), txt(r.get('Job Seeker Type'), 50),
               txt(r.get('Remarks')), txt(r.get('Candidates’ Source'), 80),
               txt(r.get('CV Status'), 50), txt(r.get('Military Status'), 50),
               txt(r.get('Salary Expectations'), 80), as_date(r.get('Date Of Call')))
        if eid not in have_profile:
            have_profile.add(eid)
            cur.execute("""
                INSERT INTO candidate_profiles
                       (user_id, full_name, gender, age_group, education_level,
                        emirate_of_origin, marital_status, phone,
                        call_status, work_status, looking_status, job_seeker_type,
                        counseling_remarks, candidates_source, cv_status,
                        military_status, salary_expectations, date_of_call, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            """, (eid, txt(r.get('Full Name'), 200), txt(r.get('Gender'), 20),
                  txt(r.get('Age Group'), 20), txt(r.get('Education'), 60),
                  txt(r.get('Emirate Of Origin'), 60), txt(r.get('Marital Status'), 40),
                  txt(r.get('Ph No'), 32), *crm))
            new_profiles += 1
        else:
            # The CRM file is authoritative for CRM fields — an operator's call
            # outcome is more current than anything else on the profile.
            cur.execute("""
                UPDATE candidate_profiles
                   SET call_status = COALESCE(%s, call_status),
                       work_status = COALESCE(%s, work_status),
                       looking_status = COALESCE(%s, looking_status),
                       job_seeker_type = COALESCE(%s, job_seeker_type),
                       counseling_remarks = COALESCE(%s, counseling_remarks),
                       candidates_source = COALESCE(%s, candidates_source),
                       cv_status = COALESCE(%s, cv_status),
                       military_status = COALESCE(%s, military_status),
                       salary_expectations = COALESCE(%s, salary_expectations),
                       date_of_call = COALESCE(%s, date_of_call)
                 WHERE user_id = %s
            """, (*crm, eid))
            upd_profiles += 1

    # Anyone the platform holds who is no longer in the master sheet has left the
    # roster — whether or not they appeared on a Removed sheet. Silent drops are
    # real: the sheets do not always account for everyone.
    # Date each person to the cycle they actually appear on, newest first so a
    # re-removal keeps its latest date.
    marked_removed = 0
    for label in sorted(removed_cycles, key=lambda l: (cycle_date(l) or file_date)):
        d = cycle_date(label) or file_date
        ids = sorted(removed_cycles[label] - master_eids)
        if not ids:
            continue
        cur.execute("""
            UPDATE nafis_job_seekers
               SET roster_status = 'removed', roster_removed_on = %s, updated_at = NOW()
             WHERE emirates_id = ANY(%s)
        """, (d, ids))
        marked_removed += cur.rowcount

    # Silent drops: on our roster, absent from the master sheet, and never named
    # on a Removed sheet. Dated to this file, because that is genuinely when the
    # platform learned of it — anything earlier would be invented.
    cur.execute("""
        UPDATE nafis_job_seekers
           SET roster_status = 'removed',
               roster_removed_on = COALESCE(roster_removed_on, %s),
               updated_at = NOW()
         WHERE emirates_id <> ALL(%s) AND roster_removed_on IS NULL
    """, (file_date, sorted(master_eids)))
    marked_removed += cur.rowcount

    # ── Roster movement history ─────────────────────────────────────────────
    #
    # WHY THIS IS HERE: it was missing, and the omission was invisible for a
    # week. This script replaced scripts/import_crm_master.py, which wrote
    # crm_roster_history from the workbook's "Add & Remove Pivot" sheet. This
    # one reads the per-cycle Added/Removed sheets instead — better source, same
    # obligation — but never wrote the table. So the 17 Aug file imported
    # correctly into the roster while the CRM dashboard went on reporting
    # "as of 27 Jul 2026" and both movement charts stopped a month short. The
    # data was right and the page was stale, which is harder to notice than a
    # failed import.
    #
    # Weekly rows are the cycles themselves. Monthly rows are their rollup —
    # recomputed from the cycles in that month rather than accumulated, so a
    # re-run of the same file cannot double a month.
    hist_weeks = {}
    for label in set(added_cycles) | set(removed_cycles):
        d = cycle_date(label)
        if not d:
            print(f"  ! cycle '{label}' has no parseable date — not written to history")
            continue
        # Normalise the label to the format already on the chart axis
        # ("27 Jul 26"). The sheet tab says "17th Aug" — no year, different
        # shape — and using it raw put "27 Jul 26 … 17th Aug" side by side on
        # the same axis. The date is authoritative; the tab name is just how the
        # CRM team happened to title a sheet that week.
        hist_weeks[d] = (len(added_cycles.get(label, ())),
                         len(removed_cycles.get(label, ())),
                         d.strftime('%d %b %y'))

    for d, (a, rem, label) in sorted(hist_weeks.items()):
        cur.execute("""
            INSERT INTO crm_roster_history
                   (period_type, period_date, period_label, added, removed, total, source)
            VALUES ('week', %s, %s, %s, %s, %s, %s)
            ON CONFLICT (period_type, period_date)
            DO UPDATE SET added = EXCLUDED.added, removed = EXCLUDED.removed,
                          total = EXCLUDED.total, source = EXCLUDED.source,
                          period_label = EXCLUDED.period_label
        """, (d, label, a, rem, a + rem, src_name))

    # Monthly rows are recomputed from the WEEK rows now in the table, not from
    # this file's cycles. A file carries only its own recent cycles: rolling up
    # just those would rewrite August from the two cycles in next week's file and
    # silently drop the three in this one. Summing the stored weeks is
    # self-correcting and reproduces the existing months exactly — July's
    # 1,113/749 from the retired importer's pivot sheet is the sum of its four
    # week rows, and June's 1,089/1,323 the sum of its six.
    touched_months = sorted({d.replace(day=1) for d in hist_weeks})
    months = {}
    for m in touched_months:
        cur.execute("""
            SELECT COALESCE(SUM(added),0) a, COALESCE(SUM(removed),0) r
              FROM crm_roster_history
             WHERE period_type = 'week'
               AND period_date >= %s
               AND period_date < (%s::date + INTERVAL '1 month')
        """, (m, m))
        row = cur.fetchone()
        months[m] = (int(row['a']), int(row['r']))
    for d, (a, rem) in sorted(months.items()):
        cur.execute("""
            INSERT INTO crm_roster_history
                   (period_type, period_date, period_label, added, removed, total, source)
            VALUES ('month', %s, %s, %s, %s, %s, %s)
            ON CONFLICT (period_type, period_date)
            DO UPDATE SET added = EXCLUDED.added, removed = EXCLUDED.removed,
                          total = EXCLUDED.total, source = EXCLUDED.source,
                          period_label = EXCLUDED.period_label
        """, (d, d.strftime("%b '%y"), a, rem, a + rem, src_name))

    conn.commit()
    print(f"  roster rows written  : {new_seekers:,}  (inserted or refreshed)")
    print(f"  users created        : {new_users:,}")
    print(f"  profiles created     : {new_profiles:,}")
    print(f"  profiles updated     : {upd_profiles:,}")
    print(f"  marked off-roster    : {marked_removed:,}")
    print(f"  history rows written : {len(hist_weeks)} weekly + {len(months)} monthly")

    cur.execute("SELECT roster_status, COUNT(*) c FROM nafis_job_seekers GROUP BY 1")
    print("  roster now:", {r['roster_status']: r['c'] for r in cur.fetchall()})
    cur.execute("SELECT COUNT(*) c FROM users WHERE email LIKE '%@example.com'")
    print(f"  fabricated emails    : {cur.fetchone()['c']:,}  (unchanged — none created here)")
    conn.close()


if __name__ == '__main__':
    main()
