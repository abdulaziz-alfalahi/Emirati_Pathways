#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Commute facts + matching-axes guardrails (issue #32).

Commute is INFORMATIONAL ONLY (owner rule, #12): these tests cover the
estimate itself and pin that neither score consumes geography or the
candidate's commute preference.
"""

import os
import sys

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.services.commute_calculator import (
    commute_info, haversine, EMIRATE_CENTROIDS,
)


class TestCommuteInfo:
    def test_coordinates_basis(self):
        # Dubai -> Sharjah centroids, but passed as raw coordinates
        info = commute_info(25.2048, 55.2708, None, 25.3463, 55.4209, None)
        assert info['basis'] == 'coordinates'
        assert 15 < info['distance_km'] < 30
        assert info['peak_commute_mins'] > info['commute_mins'] > 0

    def test_emirate_fallback(self):
        info = commute_info(None, None, 'Dubai', None, None, 'Abu Dhabi')
        assert info['basis'] == 'emirate'
        assert 100 < info['distance_km'] < 160

    def test_mixed_basis_is_flagged_emirate(self):
        info = commute_info(25.2048, 55.2708, 'Dubai', None, None, 'Sharjah')
        assert info['basis'] == 'emirate'

    def test_unknown_emirate_returns_none(self):
        assert commute_info(None, None, 'Atlantis', None, None, 'Dubai') is None
        assert commute_info(None, None, None, None, None, None) is None

    def test_emirate_names_case_insensitive(self):
        a = commute_info(None, None, 'DUBAI', None, None, 'abu dhabi')
        b = commute_info(None, None, 'dubai', None, None, 'Abu Dhabi')
        assert a == b

    def test_all_seven_emirates_have_centroids(self):
        for name in ('abu dhabi', 'dubai', 'sharjah', 'ajman',
                     'umm al quwain', 'ras al khaimah', 'fujairah'):
            assert name in EMIRATE_CENTROIDS

    def test_haversine_none_inputs(self):
        assert haversine(None, 55.0, 25.0, 55.0) is None


class TestGeographyNeverScored:
    """Owner rule (#12): no geography in Job Fit or National Priority, and
    the candidate's commute preference must never feed a score."""

    def test_national_priority_engine_is_geography_free(self):
        src = open(os.path.join(_backend_dir, 'national_priority_engine.py'),
                   encoding='utf-8').read().lower()
        for banned in ('commute', 'distance_km', 'haversine', 'latitude'):
            assert banned not in src, f"geography signal '{banned}' in priority engine"

    def test_job_fit_engine_does_not_import_commute(self):
        src = open(os.path.join(_backend_dir, 'recruiter', 'ai_candidate_matching_final.py'),
                   encoding='utf-8').read().lower()
        for banned in ('commute_calculator', 'haversine', 'max_commute'):
            assert banned not in src, f"'{banned}' reached the Job Fit engine"
