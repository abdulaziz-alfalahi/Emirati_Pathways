"""Filtering employers by vacancy count and sector (fb_1786479039).

"It would be really beneficial to filter by number of vacancies, sector, or
other attributes to focus efforts on more effective results."

The counting rule is the whole decision here, and it is driven by a data fact
rather than a preference — see the first test.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _fn():
    """Handler code with docstring and # comments stripped — prose has tripped
    assertions four times in this codebase."""
    with open(os.path.join(BACKEND, 'routes', 'growth_routes.py'), encoding='utf-8') as fh:
        src = fh.read()
    fn = src.split('def list_companies')[1].split('\n@growth_bp.route')[0]
    parts = fn.split('"""')
    fn = parts[0] + '"""'.join(parts[2:]) if len(parts) >= 3 else fn
    return '\n'.join(l for l in fn.splitlines() if not l.lstrip().startswith('#'))


def test_it_counts_every_attached_posting_not_published_only():
    """Measured 2026-08-20: ALL 7 published postings have company_id NULL, while
    297 of 302 pending_verification postings carry one. Counting published only
    would show zero for every employer — a filter that is always empty.

    Those 7 are TEST-ERA data, not a defect (owner, 2026-08-21): they predate the
    rule requiring a vacancy to be attached to an employer. This rule is
    therefore provisional — once real companies post through the magic-link
    onboarding, "published" becomes the meaningful filter and counting every
    status would overstate what an operator can act on.
    """
    fn = _fn()
    assert 'LEFT JOIN job_postings j ON j.company_id = c.id' in fn
    assert "j.status = 'published'" not in fn


def test_both_filters_are_optional():
    """The workspace provisioning picker (issue #92) calls this with no
    arguments and must keep working."""
    fn = _fn()
    assert "request.args.get('industry')" in fn
    assert "request.args.get('min_vacancies')" in fn
    assert 'if min_vacancies > 0:' in fn


def test_a_non_numeric_min_vacancies_does_not_500():
    fn = _fn()
    assert 'except (TypeError, ValueError)' in fn


def test_the_unfiltered_order_is_unchanged():
    """Alphabetical, as the picker has always been."""
    fn = _fn()
    assert 'ORDER BY c.company_name ASC' in fn


def test_filtering_on_vacancies_sorts_by_them():
    """Most vacancies first is the question being asked."""
    fn = _fn()
    assert 'ORDER BY vacancy_count DESC' in fn


def test_the_filters_are_parameterised():
    """Industry is a user-supplied string going into SQL."""
    fn = _fn()
    assert 'params.append(industry)' in fn
    assert 'c.industry = %s' in fn


def test_the_response_carries_both_new_fields():
    fn = _fn()
    assert "'industry': r[4]" in fn
    assert "'vacancy_count': int(r[5] or 0)" in fn
