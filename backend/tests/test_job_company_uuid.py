#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
job_postings.company_id uuid reconciliation — regression pins (issue #14).

Migration 015 made company_id a uuid FK to companies(id). These tests pin
the code patterns that would break (uuid = text comparisons, placeholder
NULLIF hacks, ILIKE on the uuid) or re-poison the column (placeholder
writes) so they cannot silently return.
"""

import os
import re
import sys
import glob

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)


def _backend_sources():
    for path in glob.glob(os.path.join(_backend_dir, '**', '*.py'), recursive=True):
        rel = os.path.relpath(path, _backend_dir)
        if rel.startswith(('archived_development_files', 'archives', 'tests', 'scripts')):
            continue
        yield rel, open(path, encoding='utf-8', errors='replace').read()


# Patterns that ERROR against a uuid company_id (operator text = uuid does
# not exist in Postgres) or that only made sense in the free-text era.
FORBIDDEN = [
    # uuid column compared to an explicitly text-cast expression
    r"c\.id::text\s*=\s*jp?\.company_id\b(?!::)",
    r"ON\s+jp?\.company_id\s*=\s*\w+\.id::text",
    r"ON\s+jp\.company_id\s*=\s*hp\.company_id::text",
    # placeholder-era hacks: NULLIF/COALESCE mixing the uuid with text junk
    r"NULLIF\(\s*jp\.company_id\s*,\s*'company_default'",
    r"COALESCE\(\s*jp\.company_id\s*,\s*'Unknown",
    # name-search against the uuid column
    r"jp\.company_id\s+ILIKE",
]


@pytest.mark.parametrize("pattern", FORBIDDEN)
def test_no_freetext_era_company_id_sql(pattern):
    offenders = []
    rx = re.compile(pattern)
    for rel, src in _backend_sources():
        for i, line in enumerate(src.splitlines(), 1):
            if rx.search(line):
                offenders.append(f"{rel}:{i}: {line.strip()[:100]}")
    assert offenders == [], (
        f"free-text-era company_id SQL resurfaced (breaks against the uuid "
        f"column from migration 015):\n" + "\n".join(offenders))


def test_jd_storage_normalizer_still_guards_writes():
    """jd_routes_v2 must keep normalising company_id before persisting —
    the FK now rejects junk loudly, but the normaliser is what makes the
    write succeed with the RIGHT value instead of failing."""
    src = open(os.path.join(_backend_dir, 'recruiter', 'jd_routes_v2.py'),
               encoding='utf-8').read()
    assert '_normalize_company_id_for_storage' in src
    assert src.count('_normalize_company_id_for_storage(') >= 3  # def + 2 call sites


def test_migration_015_scoped_to_public_schema():
    sql = open(os.path.join(_backend_dir, 'migrations', '015_job_company_uuid.sql'),
               encoding='utf-8').read()
    assert "table_schema = 'public'" in sql
    assert 'ON DELETE SET NULL' in sql
