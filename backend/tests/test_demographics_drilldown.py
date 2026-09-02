"""Clicking a demographic bucket must break the tab down by it.

REPORTED BY A BOARD MEMBER 2026-09-01 (fb_1788248093, /executive):
"Demographics need more details — the gender, when clicked, does not provide a
breakdown."

He was right, and the cause was structural rather than a missing handler. Every
chart on that tab was one-dimensional: eight fields, each counted independently,
with the twelve CRM cohorts as the only second axis. Nothing anywhere
cross-tabulated, so the tab could say there are 24,471 women on record and never
what they look like.

`build_cuts(cur, filter_field, filter_value)` now restricts EVERY field to one
bucket, so "Female" turns the other six charts into the age, education, marital,
emirate, employment and reachability profile of women. It reuses the cohort
machinery rather than adding a parallel one, and it generalises — the same
gesture works on any chart, so this does not have to be built again for age.

These tests are pure: they exercise the SQL composition and the whitelist
against a fake cursor. The live-data reconciliation (Female 24,471 + Male 12,201
+ Unknown 2 = 36,674 with gender known) was done by hand on 2026-09-01;
conftest refuses tests aimed at dghr_prod.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

import demographics as demog  # noqa: E402


class FakeCursor:
    """Records every statement and its parameters, answers plausibly."""

    def __init__(self):
        self.statements = []
        self._rows = []

    def execute(self, sql, params=None):
        self.statements.append((' '.join(sql.split()), params))
        low = sql.lower()
        if 'group by 1, 2' in low or 'group by 1,2' in low:
            self._rows = []
        elif 'as seg' in low:
            self._rows = []
        elif 'count(*) as total' in low:
            self._rows = [dict({'total': 10},
                               **{f'{f}_known': 5 for f in demog.FIELDS})]
        else:
            self._rows = []

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return list(self._rows)


def statements_for(**kwargs):
    cur = FakeCursor()
    demog.build_cuts(cur, **kwargs)
    return cur.statements


# ── the whitelist ───────────────────────────────────────────────────────────

def test_an_unknown_field_is_refused_rather_than_ignored():
    """Silently returning the unfiltered population would be read as the
    breakdown — the worst outcome, because it looks like an answer."""
    with pytest.raises(ValueError):
        demog.build_cuts(FakeCursor(), 'gender; DROP TABLE users; --', 'Female')


def test_the_column_never_comes_from_the_caller():
    """The caller names a FIELD; the column is looked up in FIELDS. No
    caller-supplied text reaches the SQL text itself."""
    stmts = statements_for(filter_field='gender', filter_value="'; DROP TABLE users; --")
    for sql, params in stmts:
        assert 'DROP TABLE' not in sql
    assert any(params and "'; DROP TABLE users; --" in params for _sql, params in stmts), \
        'the value should be passed as a bound parameter, not inlined'


@pytest.mark.parametrize('field', sorted(demog.FIELDS))
def test_every_chartable_field_can_be_filtered_on(field):
    stmts = statements_for(filter_field=field, filter_value='X')
    assert any(demog.FIELDS[field] in sql for sql, _ in stmts)


# ── the filter reaches every query, including coverage ──────────────────────

def test_all_four_queries_carry_the_filter():
    """Coverage recomputed on the UNFILTERED population would describe a
    different group of people than the bars beside it."""
    stmts = statements_for(filter_field='gender', filter_value='Female')
    filtered = [s for s, p in stmts if p]
    coverage = [s for s in filtered if 'count(*) as total' in s.lower()]
    assert coverage, 'the coverage queries are not filtered'
    assert all(p == ['Female'] for _s, p in stmts if p)


def test_no_filter_means_no_predicate_and_no_params():
    """The unfiltered path must be exactly what it was before this change —
    it is what the tab loads with."""
    stmts = statements_for()
    assert all(p in (None, []) for _s, p in stmts)
    assert not any('trim(cp.gender::text) =' in s.lower() for s, _p in stmts)


def test_an_empty_value_is_treated_as_no_filter():
    """A cleared filter arriving as '' must not become WHERE gender = ''."""
    for empty in ('', '   ', None):
        stmts = statements_for(filter_field='gender', filter_value=empty)
        assert all(p in (None, []) for _s, p in stmts), f'{empty!r} became a filter'


def test_the_value_is_trimmed():
    stmts = statements_for(filter_field='gender', filter_value='  Female  ')
    assert all(p == ['Female'] for _s, p in stmts if p)
