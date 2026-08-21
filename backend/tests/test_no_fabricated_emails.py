"""No account may carry an invented email address.

backend/scripts/migrate_crm_candidates.py created every account it touched with

    f"{eid}@example.com"

1,046 live accounts carried one. Nothing was ever delivered to them —
example.com is reserved by IANA so it cannot receive mail — but that is luck
rather than design. The address was indistinguishable from a real one to every
query, export and operator on the platform: a CRM screen displayed it as the
person's email, and nobody reading "784198640525865@example.com" could tell the
platform had invented it.

A blank field is honest. "We do not have an email for this person" is something
an operator can act on. A made-up address is a silent dead end that looks like
data, and it is the same failure as a fabricated statistic — the platform
asserting something it was never told.

Migration 079 cleared them: 72 restored from the CRM roster, which held the real
address all along, and 974 blanked.
"""
import os
import re

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


def test_no_importer_fabricates_an_email():
    """The rule, applied to every importer rather than the one that broke it."""
    scripts = os.path.join(BACKEND, 'scripts')
    offenders = []
    for name in os.listdir(scripts):
        if not name.endswith('.py'):
            continue
        body = _src('scripts', name)
        # Strip the docstring/comments so a file explaining the mistake does not
        # trip the check that forbids it.
        code = '\n'.join(
            line.split('#')[0] for line in body.split('\n')
            if not line.strip().startswith(('"', "'", '*'))
        )
        if re.search(r'["\']?\{?\w*\}?@example\.com', code) and 'sys.exit' not in code:
            offenders.append(name)
    assert not offenders, f"these importers invent an email address: {offenders}"


def test_the_retired_importer_refuses_to_run():
    """Leaving it importable is leaving the footgun loaded."""
    body = _src('scripts', 'migrate_crm_candidates.py')
    assert 'RETIRED' in body
    assert 'sys.exit' in body.split('def migrate_crm_data')[1][:400], \
        'the retired importer still runs'


def test_the_replacement_writes_no_email_it_was_not_given():
    body = _src('scripts', 'import_crm_master_file.py')
    assert '@example.com' not in body.split('"""', 2)[-1] or 'REFUSED' in body
    # It reads Email from the source and passes it through; it never composes one.
    assert "txt(r.get('Email')" in body


def test_the_migration_snapshots_before_changing_anything():
    sql = _src('migrations', '079_remove_fabricated_emails.sql')
    assert '_backup_fabricated_emails_079' in sql
    assert sql.index('CREATE TABLE IF NOT EXISTS _backup') < sql.index('UPDATE users'), \
        'the snapshot must be taken before the first change'


def test_the_migration_prefers_a_real_address_over_blanking():
    """72 of them were recoverable — the platform had the true value and was
    displaying its own invention over it."""
    sql = _src('migrations', '079_remove_fabricated_emails.sql')
    restore = sql.index('FROM nafis_job_seekers')
    blank = sql.index('SET email = NULL')
    assert restore < blank, 'restore real addresses before blanking the rest'


def test_blank_means_null_not_empty_string():
    """Two spellings of absent is how a filter starts missing people."""
    sql = _src('migrations', '079_remove_fabricated_emails.sql')
    assert 'SET email = NULL' in sql
    assert "SET email = ''" not in sql
