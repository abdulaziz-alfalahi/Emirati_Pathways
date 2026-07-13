"""Issue #12 — National Development Priority axis.

The priority score is a SEPARATE, disclosed axis: config-governed, explainable,
fail-neutral, and it must never use geography.
"""
try:
    from national_priority_engine import compute_national_priority, DEFAULT_WEIGHTS
except ImportError:
    from backend.national_priority_engine import compute_national_priority, DEFAULT_WEIGHTS

W = {c: {"label": l, "points": p, "category": cat} for c, l, p, cat in DEFAULT_WEIGHTS}


def test_entry_stage_fires_employment_support():
    r = compute_national_priority({'skills': [], 'experience_years': 3}, W, stage='entry')
    codes = {x['code'] for x in r['reasons']}
    assert 'emp_entry_stage' in codes
    assert r['score'] == 40


def test_first_time_seeker_proxy_when_no_stage():
    r = compute_national_priority({'skills': [], 'experience_years': 0}, W, stage=None)
    assert any(x['code'] == 'emp_entry_stage' for x in r['reasons'])


def test_strategic_skills_and_certifications():
    r = compute_national_priority({'skills': ['Python', 'AI'], 'experience_years': 5},
                                  W, stage='growth', cert_count=2)
    codes = {x['code'] for x in r['reasons']}
    assert 'strategic_priority_skills' in codes
    assert 'dev_certification' in codes
    assert 'emp_entry_stage' not in codes  # established candidate, not entry


def test_geography_is_ignored_and_fail_neutral():
    # emirate present but must never contribute; no other signals -> 0.
    r = compute_national_priority({'skills': [], 'experience_years': 5, 'emirate': 'Dubai'},
                                  W, stage='growth')
    assert r['score'] == 0
    assert r['reasons'] == []


def test_every_reason_has_a_plain_language_label():
    r = compute_national_priority({'skills': ['AI'], 'experience_years': 0},
                                  W, stage='entry', cert_count=1)
    assert r['reasons']
    for reason in r['reasons']:
        assert reason['label'] and isinstance(reason['label'], str)
        assert reason['points'] > 0


def test_score_capped_at_100():
    r = compute_national_priority({'skills': ['AI'], 'experience_years': 0},
                                  W, stage='entry', cert_count=1, training_count=1)
    assert r['score'] <= 100


if __name__ == '__main__':
    for name, fn in list(globals().items()):
        if name.startswith('test_') and callable(fn):
            fn()
    print("OK — National Priority engine: explainable, fail-neutral, no geography")
