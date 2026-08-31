"""The Invitation Pipeline search, sorting and filters.

Reported by a call-centre operator on 2026-08-31 (fb_1788153249, fb_1788155851):

  "In the Invitation Pipeline, the Search Companies search bar is not
   functioning as expected. When searching by company name, no results are
   displayed even when the company exists in the system."

Two independent causes sat behind that one sentence:

  * the input wrote to `searchTerm` and the pipeline list never read it, so
    typing changed nothing at all; and
  * the pipeline holds only companies still being ONBOARDED, so one that has
    already gone active is legitimately absent — indistinguishable, from the
    operator's side, from a search that does not work.

Fixing only the first would have left the operator with a search that still
appears broken for exactly the companies they are most likely to look up.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')
PAGE = os.path.join(FRONTEND, 'pages', 'GrowthOperatorDashboard.tsx')


def code():
    """The page with comments stripped — the comments here quote the report."""
    if not os.path.exists(PAGE):
        pytest.skip('GrowthOperatorDashboard.tsx not present')
    src = open(PAGE, encoding='utf-8').read()
    out, i, n = [], 0, len(src)
    while i < n:
        two = src[i:i + 2]
        if two == '/*':
            j = src.find('*/', i + 2)
            i = n if j == -1 else j + 2
        elif two == '//':
            j = src.find('\n', i)
            i = n if j == -1 else j
        else:
            out.append(src[i])
            i += 1
    return ''.join(out)


def pipeline_block(body):
    """Just the pipeline renderer, so a match elsewhere on the page cannot
    make these pass — the search box and the list were always both present;
    the defect was that they were not connected."""
    start = body.index('const renderPipeline')
    return body[start:start + 6000]


# ── the defect ──────────────────────────────────────────────────────────────

def test_the_pipeline_list_actually_applies_the_search_term():
    block = pipeline_block(code())
    assert 'searchTerm' in block, \
        'the pipeline list still ignores the search box'


def test_the_search_covers_the_arabic_company_name():
    """Operators work bilingually. A search that only reads the English name is
    broken for half the register."""
    block = pipeline_block(code())
    assert 'nameAr' in block, 'searching does not consider the Arabic name'


def test_an_empty_result_explains_itself():
    """The reported symptom was a blank list. A company that has finished
    onboarding must be NAMED rather than silently missing."""
    block = pipeline_block(code())
    assert 'matchedElsewhere' in block, \
        'a company that exists but is past the pipeline is still shown as nothing'


# ── what the operators asked for ───────────────────────────────────────────

def test_the_owners_work_order_survives_the_search_request():
    """The operator asked for alphabetical by default (fb_1788155851). The owner
    had deliberately set most-vacancies-first on 2026-08-22: "I need to sort
    companies by the number of vacancies so I can start inviting those with the
    most vacancies first."

    The pipeline is worked top-down, so its order is the WORK order —
    alphabetical would send an operator to invite whoever is called "A..."
    rather than whoever has the most open roles. The operator's real need is
    LOCATING a named company, which the search now does; that was the actual
    defect. This asserts the default was left alone."""
    body = code()
    assert "useState<'vacancies' | 'name'>('vacancies')" in body, \
        "the owner's most-vacancies-first default was overridden"


def test_alphabetical_is_still_one_click_away():
    body = code()
    assert "{ key: 'name'" in body, 'name order is no longer offered at all'


def test_there_is_an_emirate_filter():
    body = code()
    assert 'emirateFilter' in body, 'the requested emirate filter is missing'


def test_there_is_a_vacancies_filter():
    body = code()
    assert 'withVacanciesOnly' in body, 'the requested vacancies filter is missing'


def test_the_filters_are_bilingual():
    """Every control on this screen is bilingual; a new one that is not would
    break the Arabic view."""
    body = code()
    for ar in ('كل الإمارات', 'لديها شواغر'):
        assert ar in body, f'the filter control has no Arabic label ({ar})'
