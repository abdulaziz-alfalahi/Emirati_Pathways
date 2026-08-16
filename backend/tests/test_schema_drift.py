"""The schema-drift check (issue #418).

DATABASE_SCHEMA.md is labelled "the single source of truth" and is converged
toward by migrate.py, but it was generated from a localhost development database
while CLAUDE.md says the live information_schema is the only authority. This
tool exists so the gap between those two claims is measurable rather than
discovered at a production reset.

The tests that matter are about the comparison being HONEST: type synonyms must
not be reported as drift (or the real findings drown), and genuine join-key
mismatches must not be normalised away (or the tool hides the thing it was built
to surface).
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts import schema_drift as sd  # noqa: E402


# ── Type normalisation: the line between noise and finding ──────────────────

@pytest.mark.parametrize('a,b', [
    ('VARCHAR', 'character varying'),
    ('varchar(255)', 'character varying'),
    ('TIMESTAMPTZ', 'timestamp with time zone'),
    ('INT', 'integer'),
    ('SERIAL', 'integer'),          # serial IS an integer with a sequence default
    ('BIGSERIAL', 'bigint'),
    ('BOOL', 'boolean'),
    ('CHAR', 'character'),
    ('DECIMAL', 'numeric'),
])
def test_spelling_differences_are_not_drift(a, b):
    """The document and information_schema spell the same types differently.

    Reporting these would bury the real findings: a first, naive comparison
    produced 330 "mismatches" where only 162 were real.
    """
    assert sd.normalise(a) == sd.normalise(b)


@pytest.mark.parametrize('a,b', [
    ('UUID', 'text'),               # application_status_history.application_id
    ('VARCHAR', 'uuid'),            # job_postings.company_id
    ('INTEGER', 'character'),       # the pre-EID users.id pattern
    ('TEXT', 'integer'),            # interview_sessions.candidate_id
    ('UUID', 'integer'),            # interview_recordings.id
])
def test_real_type_differences_are_reported(a, b):
    """Each of these is an actual finding from the live comparison. If
    normalisation ever swallowed one, the tool would go quiet about exactly the
    problem it exists to find."""
    assert sd.normalise(a) != sd.normalise(b)


def test_length_qualifiers_are_ignored():
    assert sd.normalise('character varying(100)') == sd.normalise('character varying(255)')


def test_join_keys_are_recognised():
    assert sd.is_join_key('id')
    assert sd.is_join_key('user_id')
    assert sd.is_join_key('application_id')
    assert not sd.is_join_key('applied_at')
    assert not sd.is_join_key('identity')       # not an id despite the prefix


# ── The comparison ──────────────────────────────────────────────────────────

DOC = {
    'job_applications': {'id': 'TEXT', 'job_id': 'TEXT', 'submitted_at': 'TIMESTAMPTZ'},
    'application_status_history': {'application_id': 'UUID'},
}
LIVE = {
    'job_applications': {'id': 'text', 'job_id': 'text',
                         'submitted_at': 'timestamp with time zone',
                         'applied_at': 'timestamp with time zone'},
    'application_status_history': {'application_id': 'text'},
    'ai_usage_log': {'id': 'bigint'},
}


def test_the_join_breaking_mismatch_is_found():
    """The finding that started #418: in the document application_id is uuid
    while job_applications.id is text, so the two cannot be joined."""
    result = sd.compare(DOC, LIVE)

    joins = [m for m in result['type_mismatches'] if sd.is_join_key(m[1])]
    assert ('application_status_history', 'application_id', 'UUID', 'text') in joins


def test_matching_columns_are_not_reported():
    result = sd.compare(DOC, LIVE)
    reported = {(t, c) for t, c, _, _ in result['type_mismatches']}
    assert ('job_applications', 'id') not in reported
    assert ('job_applications', 'submitted_at') not in reported   # synonym


def test_undocumented_tables_and_columns_are_separated():
    """Two different problems: a table nobody wrote down, versus a column the
    document claims that the database does not have. Only the latter is
    something migrate.py would WRITE."""
    result = sd.compare(DOC, LIVE)

    assert result['tables_only_in_live'] == ['ai_usage_log']
    assert result['tables_only_in_doc'] == []
    assert ('job_applications', 'applied_at', 'timestamp with time zone') in \
        result['columns_undocumented']


def test_columns_the_doc_claims_but_the_db_lacks_are_flagged_as_writes():
    """migrate.py only ever ADDs columns, so this list is the complete set of
    changes it would make to a populated database — the actionable one."""
    doc = {'t': {'id': 'TEXT', 'ghost': 'INTEGER'}}
    live = {'t': {'id': 'text'}}

    result = sd.compare(doc, live)

    assert result['columns_doc_would_add'] == [('t', 'ghost', 'INTEGER')]
    assert result['type_mismatches'] == []


# ── Exit code, so this can gate something later ─────────────────────────────

def test_report_exits_nonzero_on_drift(capsys):
    code = sd.report(sd.compare(DOC, LIVE))
    assert code == 1
    assert 'does not describe this database' in capsys.readouterr().out


def test_report_exits_zero_when_aligned(capsys):
    aligned_doc = {'t': {'id': 'TEXT'}}
    aligned_live = {'t': {'id': 'text'}}

    code = sd.report(sd.compare(aligned_doc, aligned_live))

    assert code == 0
    assert 'matches this database' in capsys.readouterr().out


# ── Against the real document ───────────────────────────────────────────────

def test_the_shipped_document_parses():
    """Guards the parser contract this tool borrows from migrate.py: if the
    document format changes, the drift check must fail loudly rather than
    silently report no drift."""
    doc = sd.documented_schema()

    assert len(doc) > 100
    assert 'job_applications' in doc
    assert 'submitted_at' in doc['job_applications']
    # The column that exists only in the live database, never in the document —
    # which is why employer_value.py reads submitted_at (PR #417).
    assert 'applied_at' not in doc['job_applications']
