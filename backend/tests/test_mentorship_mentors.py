#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mentorship /mentors and /mentorship-stats against the live schema.

The endpoints queried a phantom denormalised mentor_profiles DDL
(full_name/title/bio/available) that doesn't exist on the deployed table
(user_id + professional_* columns), so they 500'd and the page silently
showed static mentors. These pin the fix. DB mocked.
"""

import os
import re
import sys
from unittest.mock import MagicMock, patch

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from app import create_app

MOD = 'backend.community_mentorship_routes'


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config.update({"TESTING": True})
    return a


@pytest.fixture()
def client(app):
    return app.test_client()


def test_mentors_maps_live_schema(app, client):
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchall.return_value = [{
        'id': 1, 'user_id': '784...', 'full_name': 'Omar Al Hashimi',
        'professional_title': 'Senior Engineer & Mentor', 'current_company': 'TechCorp',
        'industry': 'Technology', 'expertise_areas': ['AI'], 'rating': 4.5,
        'total_sessions': 3, 'is_available': True, 'years_of_experience': 12,
        'professional_summary': 'Bio here', 'is_uae_national': True,
    }]
    conn.cursor.return_value = cur
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.get('/api/community-mentorship/mentors')
    assert r.status_code == 200
    m = r.get_json()['mentors'][0]
    assert m['name'] == 'Omar Al Hashimi'
    assert m['title'] == 'Senior Engineer & Mentor'
    assert m['company'] == 'TechCorp'
    assert m['bio'] == 'Bio here'
    assert m['available'] is True and m['yearsExperience'] == 12
    # query must use the live schema, not the phantom columns
    sql = cur.execute.call_args[0][0]
    assert 'professional_title' in sql and 'JOIN users' in sql
    assert not re.search(r'\bfull_name_ar\b|\bmp\.bio\b|\bmp\.title\b', sql)


def test_stats_resilient_to_missing_tables(app, client):
    conn = MagicMock()
    cur = MagicMock()
    # first fetchone = the mentor aggregate; the guarded _scalar calls raise.
    cur.fetchone.return_value = {
        'total_mentors': 2, 'available_mentors': 2, 'total_sessions': 0, 'avg_rating': 0
    }
    calls = {'n': 0}

    def _execute(sql, *a):
        # make the communities queries blow up like a missing table would
        if 'communities' in sql or 'mentorship_programs' in sql:
            raise Exception('relation does not exist')

    cur.execute.side_effect = _execute
    conn.cursor.return_value = cur
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.get('/api/community-mentorship/mentorship-stats')
    # a missing optional table must NOT 500 the whole stats endpoint
    assert r.status_code == 200
    stats = r.get_json()['stats']
    assert stats['total_mentors'] == 2
    assert stats['total_communities'] == 0
