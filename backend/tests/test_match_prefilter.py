#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Match pre-filter (issue #124).

The AI scorer makes one LLM call per candidate; scoring the full ~4k pool
hung the request. A cheap rule-based pre-filter now shortlists to a cap
before the AI pass. These tests pin: the AI scorer runs at most `cap`
times on a large pool, small pools are unaffected, and the best rule
matches survive into the shortlist.
"""

import os
import sys
from unittest.mock import patch

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.recruiter.ai_candidate_matching_final import AICandidateMatchingEngineFinal


def _jd():
    return {
        'metadata': {'jd_id': 'jd_test'},
        'basic_info': {'title': 'Python Engineer', 'emirate': 'Dubai'},
        'requirements': {'skills': ['python', 'sql', 'aws']},
    }


def _candidates(n):
    # Give candidate i i%5 matching skills so rule scores vary deterministically.
    pool = []
    for i in range(n):
        skills = ['python', 'sql', 'aws', 'docker', 'react'][: (i % 5) + 1]
        pool.append({'candidate_id': str(i), 'user_id': str(i),
                     'skills': skills, 'experience_years': i % 10,
                     'emirate': 'Dubai'})
    return pool


@pytest.fixture
def engine():
    eng = AICandidateMatchingEngineFinal()
    # Force the "AI available" path with a fake per-candidate scorer we can count.
    eng.matching_engine = object()
    return eng


def _fake_ai_score(self, jd, candidate):
    # Deterministic AI score derived from skill count; records the call.
    _fake_ai_score.calls += 1
    return {'overall_score': 50 + len(candidate.get('skills', [])),
            'breakdown': {}, 'matching_skills': candidate.get('skills', []),
            'missing_skills': [], 'strengths': [], 'concerns': []}


def test_large_pool_caps_ai_calls(engine):
    _fake_ai_score.calls = 0
    with patch.object(AICandidateMatchingEngineFinal, '_score_with_ai', _fake_ai_score):
        result = engine.match_candidates_for_job(_jd(), _candidates(500), top_n=10)
    assert result['success'] is True
    assert _fake_ai_score.calls <= engine.AI_SHORTLIST_CAP
    assert result['ai_scored_candidates'] <= engine.AI_SHORTLIST_CAP
    assert result['total_candidates_reviewed'] == 500
    assert len(result['top_matches']) == 10


def test_small_pool_scores_everyone(engine):
    _fake_ai_score.calls = 0
    with patch.object(AICandidateMatchingEngineFinal, '_score_with_ai', _fake_ai_score):
        result = engine.match_candidates_for_job(_jd(), _candidates(10), top_n=10)
    assert _fake_ai_score.calls == 10  # below cap → no pre-filter, all scored


def test_best_rule_matches_reach_the_shortlist(engine):
    # A pool of weak candidates (one unrelated skill each) plus one strong
    # match. The strong one must survive the rule pre-filter into the AI pass.
    pool = [{'candidate_id': str(i), 'user_id': str(i),
             'skills': ['cobol'], 'experience_years': 1, 'emirate': 'Dubai'}
            for i in range(200)]
    pool.append({'candidate_id': 'PERFECT', 'user_id': 'PERFECT',
                 'skills': ['python', 'sql', 'aws'], 'experience_years': 8,
                 'emirate': 'Dubai'})
    with patch.object(AICandidateMatchingEngineFinal, '_score_with_ai', _fake_ai_score):
        result = engine.match_candidates_for_job(_jd(), pool, top_n=10)
    ids = [m['candidate']['candidate_id'] for m in result['top_matches']]
    assert 'PERFECT' in ids
