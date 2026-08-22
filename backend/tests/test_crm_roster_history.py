"""The CRM importer must write the roster movement history.

WHY THIS FILE EXISTS: scripts/import_crm_master_file.py replaced
scripts/import_crm_master.py and inherited everything except one obligation —
writing crm_roster_history. The retired script built it from the workbook's
"Add & Remove Pivot" sheet; the new one reads the per-cycle Added/Removed sheets
instead, a better source, and then wrote nothing.

The failure was invisible for a week. The 17 August file imported correctly:
3,936 roster rows refreshed, 131 removals dated, every figure on the population
strip right. But crm_roster_history still ended at 27 July, so the CRM dashboard
reported "CRM Roster — as of 27 Jul 2026" and both movement charts stopped a
month short. The owner spotted it, not the tests.

A stale page over correct data is harder to notice than a failed import, which
is exactly why it needs a test rather than vigilance.
"""
import os
import re

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMPORTER = os.path.join(BACKEND, 'scripts', 'import_crm_master_file.py')


def _src():
    with open(IMPORTER, encoding='utf-8') as fh:
        return fh.read()


def _code():
    """Source with comments stripped.

    Two tests earlier in this work failed against their own explanatory
    comments. A substring search cannot tell a rationale from an implementation.
    """
    return re.sub(r'^\s*#.*$', '', _src(), flags=re.M)


def test_the_importer_writes_roster_history():
    code = _code()
    assert 'crm_roster_history' in code, (
        'the CRM importer does not write crm_roster_history — the dashboard '
        'as-of date and both movement charts will freeze at the last run of '
        'the retired importer'
    )
    for period in ("'week'", "'month'"):
        assert period in code, f'no {period} rows are written'


def test_history_writes_are_idempotent():
    """Re-running the same file must not double a cycle."""
    code = _code()
    hist = code[code.index('crm_roster_history'):]
    assert 'ON CONFLICT (period_type, period_date)' in hist, (
        'the history insert has no conflict target; re-running an import would '
        'either fail or duplicate the cycle'
    )
    assert 'DO UPDATE SET' in hist


def test_months_are_recomputed_from_stored_weeks_not_from_the_file():
    """A file carries only its own recent cycles.

    Rolling up just those would rewrite August from the two cycles in next
    week's file and silently drop the three in this one. Summing the week rows
    already in the table is self-correcting, and reproduces the months the
    retired importer wrote from its pivot sheet exactly: July's 1,113/749 is the
    sum of its four week rows, June's 1,089/1,323 the sum of its six.
    """
    code = _code()
    assert 'touched_months' in code, 'monthly rollup is not recomputed'
    month_block = code[code.index('touched_months'):]
    month_block = month_block[:month_block.index("'month'")]
    assert "period_type = 'week'" in month_block, (
        'the monthly rollup does not read the stored week rows, so it can only '
        'reflect the cycles in the file being imported'
    )
    assert 'SUM(added)' in month_block and 'SUM(removed)' in month_block


def test_a_cycle_with_an_unparseable_date_is_reported_not_skipped_silently():
    """The dating bug already happened once.

    The first run parsed the date out of the filename, got None, and left all
    131 removals undated — the whole point of dated cycles. A cycle whose label
    will not parse must say so rather than vanish from the history.
    """
    code = _code()
    assert 'no parseable date' in code, (
        'an undatable cycle is dropped from the history without a word'
    )
