#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Priority fairness snapshot (#34) — aggregation correctness + guardrails.
DB mocked; no live database touched.
"""

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

import backend.priority_fairness as pf


class FakeCur:
    """Serves the candidate query then the three signal queries."""
    def __init__(self, candidates):
        self._candidates = candidates
        self._mode = None

    def execute(self, sql, params=None):
        if 'FROM users' in sql:
            self._mode = 'cands'
        elif 'user_lifecycle_stage' in sql:
            self._mode = 'stage'
        else:
            self._mode = 'other'

    def fetchall(self):
        if self._mode == 'cands':
            return self._candidates
        return []

    def close(self):
        pass


def _conn(candidates):
    conn = MagicMock()
    conn.cursor.side_effect = lambda *a, **k: FakeCur(candidates)
    return conn


def test_distribution_sums_to_total():
    cands = [
        {'id': '1', 'experience_years': 0, 'skills': ['ai']},        # entry + strategic
        {'id': '2', 'experience_years': 5, 'skills': []},            # nothing
        {'id': '3', 'experience_years': 0, 'skills': ['cybersecurity']},
    ]
    with patch.object(pf, 'compute_fairness_snapshot', pf.compute_fairness_snapshot):
        snap = pf.compute_fairness_snapshot(_conn(cands))
    assert snap['total_candidates'] == 3
    assert sum(b['count'] for b in snap['score_distribution']) == 3


def test_reasons_and_strategic_counted():
    cands = [
        {'id': '1', 'experience_years': 0, 'skills': ['ai']},
        {'id': '2', 'experience_years': 0, 'skills': ['renewable energy']},
        {'id': '3', 'experience_years': 8, 'skills': ['excel']},
    ]
    snap = pf.compute_fairness_snapshot(_conn(cands))
    codes = {r['code'] for r in snap['reason_frequency']}
    assert 'strategic_priority_skills' in codes
    assert snap['strategic_sector']['with_priority_skill'] == 2
    assert snap['strategic_sector']['without'] == 1


def test_notes_disclose_no_geography_and_no_gender():
    snap = pf.compute_fairness_snapshot(_conn([]))
    joined = ' '.join(snap['notes']).lower()
    assert 'geographic' in joined
    assert 'gender' in joined


def test_empty_pool_safe():
    snap = pf.compute_fairness_snapshot(_conn([]))
    assert snap['total_candidates'] == 0
    assert snap['summary']['mean_score'] == 0.0
