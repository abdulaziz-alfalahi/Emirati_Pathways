"""The jobseeker registration date — the field the invitation queue sorts on.

Onboarding is invitation-driven and nobody on the platform has joined yet
(owner, 2026-08-20): every candidate record is a placeholder awaiting a magic
link. So the live operational question is not "is this profile complete" but
"who do we invite first", and the honest answer turns on how long someone has
been waiting.

That field was being dropped in transit. `candidate_profiles` carried
job_seeker_type for 5,034 people and the date for NONE, while the NAFIS staging
table held it for all 3,969 rows spanning 2021-11-08 to 2026-08-18.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


# ── The importer must carry it forward ──────────────────────────────────────

def test_the_master_importer_reads_the_date():
    """Migration 074 backfilled what was already imported. Without this the very
    next import recreates the gap."""
    src = _src('scripts', 'update_candidates_master.py')
    assert 'job_seeker_date' in src
    assert "row.get('Job Seeker Date')" in src


def test_a_missing_date_does_NOT_wipe_an_existing_one():
    """THE REGRESSION THIS NEARLY SHIPPED. The profile UPDATE assigns every key
    in base_cols directly — `SET col = %s`, not COALESCE — because for the
    remarks-derived fields a None deliberately CLEARS a stale value. Adding
    job_seeker_date unconditionally would have wiped all 2,904 backfilled dates
    the first time a file arrived without that column.
    """
    src = _src('scripts', 'update_candidates_master.py')
    assert "if job_seeker_date is not None:" in src
    assert "base_cols['job_seeker_date'] = job_seeker_date" in src
    # And it must NOT be in the unconditional dict literal.
    literal = src.split('base_cols = {')[1].split('}')[0]
    assert 'job_seeker_date' not in literal


def test_an_unparseable_date_costs_one_row_not_the_import():
    src = _src('scripts', 'update_candidates_master.py')
    block = src.split('job_seeker_date = None')[1][:600]
    assert 'except Exception' in block


# ── Operators must be able to see it ────────────────────────────────────────

def test_the_crm_roster_returns_the_date():
    """An operator cannot prioritise on a field the API does not send."""
    src = _src('candidate_profile_routes.py')
    body = src.split('def get_crm_candidates')[1].split('\n@crm_profile_bp.route')[0]
    assert 'cp.job_seeker_date' in body, 'must be selected'
    assert "'job_seeker_date'" in body, 'must be returned'


def test_the_date_is_serialised_not_dumped_raw():
    """A datetime in a jsonify payload is a 500, and this one is nullable."""
    src = _src('candidate_profile_routes.py')
    body = src.split('def get_crm_candidates')[1].split('\n@crm_profile_bp.route')[0]
    # The key appears TWICE on the same statement — as the dict key and inside
    # c['job_seeker_date'] — so splitting on it yields the text BETWEEN the two
    # occurrences, which is ': c['. Assert on the statement instead.
    idx = body.index("'job_seeker_date'")
    stmt = body[idx:idx + 220]
    assert 'isoformat' in stmt, stmt
    assert 'else None' in stmt, stmt


# ── The date, not a duration ────────────────────────────────────────────────

def test_job_search_duration_is_not_backfilled_from_the_date():
    """job_search_duration is a VARCHAR holding text like "6-12 months". A
    stored duration is wrong the day after it is written — the same class of
    mistake as storing an age instead of a birthday. The date is the fact;
    elapsed time is a view of it, computed at read time.
    """
    sql = _src('migrations', '074_backfill_job_seeker_date.sql')
    assert 'job_search_duration' not in sql.split('BEGIN;')[1].split('COMMIT;')[0], \
        'the migration must not write a duration string'


# ── The backfill itself ─────────────────────────────────────────────────────

def test_the_backfill_never_overwrites_an_existing_value():
    sql = _src('migrations', '074_backfill_job_seeker_date.sql')
    update = sql.split('UPDATE candidate_profiles')[1].split(';')[0]
    assert 'p.job_seeker_date IS NULL' in update


def test_the_join_is_on_emirates_id_only():
    """users.id IS the Emirates ID by design, and nafis_job_seekers.emirates_id
    is the same value. Matching people by name or phone is how the wrong record
    gets someone else's history."""
    sql = _src('migrations', '074_backfill_job_seeker_date.sql')
    body = sql.split('BEGIN;')[1].split('COMMIT;')[0]
    assert 'n.emirates_id = p.user_id' in body
    assert 'u.id = n.emirates_id' in body
    for forbidden in ('full_name', 'phone', 'email'):
        assert forbidden not in body, f'must not match on {forbidden}'


def test_the_migration_refuses_an_implausible_result():
    sql = _src('migrations', '074_backfill_job_seeker_date.sql')
    assert 'RAISE EXCEPTION' in sql
    assert 'Refusing' in sql


def test_a_snapshot_is_taken_before_the_update():
    """House rule: snapshot before any destructive statement."""
    sql = _src('migrations', '074_backfill_job_seeker_date.sql')
    assert '_backup_seeker_link_074' in sql
    assert sql.index('_backup_seeker_link_074') < sql.index('UPDATE candidate_profiles')
