"""The Demographics tab must read the database, and must state its coverage.

WHY THIS FILE EXISTS

/api/metrics/demographics served a spreadsheet. demographics_parser parsed
/app/master_file.xlsx, a file baked into the Docker image and last modified
2026-07-04, so the board's Demographics tab drew 4,067 people from a seven-week
-old snapshot while candidate_profiles held 38,297. Nothing was broken. Every
chart rendered, every number was internally consistent, and the tab was wrong.

That is the shape these tests guard: not a failing request, but a correct-looking
page built on the wrong source, and distributions drawn from columns too sparse
to support them. Both are source-level rules because both failures pass any
integration test you could write against them.
"""
import os
import re

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')


def _read(*parts):
    with open(os.path.join(*parts), encoding='utf-8') as fh:
        return fh.read()


def _endpoint_body():
    """The body of get_demographics_metrics, up to the next route."""
    src = _read(BACKEND, 'routes', 'strategic_metrics_api.py')
    start = src.index('def get_demographics_metrics')
    nxt = src.find('@strategic_metrics_bp.route', start)
    return src[start:nxt if nxt > 0 else len(src)]


# ── The source ──────────────────────────────────────────────────────────────

def test_demographics_endpoint_does_not_read_the_spreadsheet():
    # The docstring names the parser to explain why it is gone; only a CALL
    # counts as a regression.
    body = re.sub(r'""".*?"""', '', _endpoint_body(), flags=re.S)
    assert 'get_cached_demographics(' not in body, (
        "get_demographics_metrics calls the Excel parser again. That file is "
        "baked into the image (last modified 2026-07-04) and only changes on a "
        "rebuild, so the board tab silently goes stale while the CRM importer "
        "keeps writing to candidate_profiles."
    )


def test_demographics_endpoint_reads_candidate_profiles():
    body = _endpoint_body()
    assert 'build_cuts' in body, (
        "The endpoint no longer builds its cuts from the database."
    )


def test_every_cut_is_built_from_the_shared_field_map():
    """One list of fields, so a new chart cannot quietly skip its coverage."""
    src = _read(BACKEND, 'demographics.py')
    assert 'FIELDS' in src and 'coverage' in src


# ── Coverage ────────────────────────────────────────────────────────────────

def test_person_of_determination_is_not_exposed():
    """38,296 of 38,297 rows are NULL. There is no distribution to draw."""
    src = _read(BACKEND, 'demographics.py')
    assert 'is_person_of_determination' not in src.split('FIELDS = {')[1].split('}')[0], (
        "is_person_of_determination is in the field map. The column is empty; "
        "a chart of it invites a reading the data cannot support."
    )


def test_both_demographic_surfaces_render_coverage():
    """A distribution without its coverage overstates what the data knows.

    emirate_of_residence is populated on 9% of records and military_status on
    6%. Drawn bare, the emirate chart reports where the roster lives when it
    reports where the tenth that answered lives.
    """
    for page in ('ExecutiveDashboard.tsx', 'DemographicsAnalytics.tsx'):
        src = _read(FRONTEND, 'pages', 'operator-dashboards', page)
        assert 'coverage' in src, f"{page} never reads the coverage block."
        assert re.search(r'Coverage\b', src), (
            f"{page} does not render a coverage note under its charts."
        )


def test_both_demographic_surfaces_state_their_scope():
    """Recorded is not registered — the trap populations.py exists to prevent."""
    for page in ('ExecutiveDashboard.tsx', 'DemographicsAnalytics.tsx'):
        src = _read(FRONTEND, 'pages', 'operator-dashboards', page)
        assert 'scope_note' in src, (
            f"{page} charts 38,297 recorded people without saying that they are "
            "recorded rather than registered."
        )
        assert 'scope_note_ar' in src, (
            f"{page} shows the scope note in English only. An Arabic reader "
            "would get the claim without the qualification."
        )


# ── Labels ──────────────────────────────────────────────────────────────────

def test_demographics_labels_are_not_frozen_at_fetch_time():
    """The English board page was rendering ذكور / إناث (screenshot 2026-08-22).

    The chart arrays were built inside the fetch handler with b(...) choosing the
    language, then stored in state. State outlives a language switch, so the
    labels stayed in whichever language was active when the data arrived.
    """
    src = _read(FRONTEND, 'pages', 'operator-dashboards', 'ExecutiveDashboard.tsx')
    start = src.index('if (demoRes.status')
    end = src.index('if (hasError)', start)
    block = src[start:end]
    assert "b('" not in block, (
        "The demographics fetch handler translates labels again. Translate at "
        "render, or a language switch leaves the charts in the old language."
    )


# ── Vocabulary ──────────────────────────────────────────────────────────────

def test_education_aliases_collapse_the_duplicate_spellings():
    import sys
    sys.path.insert(0, BACKEND)
    from demographics import normalise_education

    assert normalise_education('HighSchool') == 'High School'
    assert normalise_education('BelowHighSchool') == 'Below High School'
    assert normalise_education('Master') == "Master's Degree"
    # Idempotent — the importer runs over rows the migration already fixed.
    assert normalise_education('High School') == 'High School'
    assert normalise_education(None) is None


def test_university_is_not_merged_into_bachelors():
    """The one merge that looks right and is not.

    'University' is the NAFIS file's single coarse bucket for university-level
    education; the spelled-out vocabulary separates Bachelor's / Master's /
    Doctorate. Collapsing 12,078 'University' rows into "Bachelor's Degree"
    asserts none of them hold a postgraduate degree.
    """
    import sys
    sys.path.insert(0, BACKEND)
    from demographics import normalise_education

    assert normalise_education('University') == 'University'


def test_emirate_aliases_fix_case_but_keep_cities_distinct():
    """Al Ain and Hatta are cities, and Hatta is a CRM cohort tracked on purpose."""
    import sys
    sys.path.insert(0, BACKEND)
    from demographics import normalise_emirate

    assert normalise_emirate('DUBAI') == 'Dubai'
    assert normalise_emirate('Abu Dahbi') == 'Abu Dhabi'
    assert normalise_emirate('alain') == 'Al Ain'
    assert normalise_emirate('Al Ain') == 'Al Ain'
    assert normalise_emirate('Hatta') == 'Hatta'


def test_the_importer_normalises_on_write():
    """Otherwise migration 081 is a cleanup with a shelf life of one import."""
    src = _read(BACKEND, 'scripts', 'import_crm_master_file.py')
    assert 'normalise_education' in src, (
        "import_crm_master_file.py writes Education straight through. The next "
        "import reintroduces 'HighSchool' and the duplicate bars come back."
    )
    assert 'normalise_emirate' in src
    assert "txt(r.get('Education')" not in src.replace(
        "normalise_education(txt(r.get('Education')", ''), (
        "An un-normalised Education write remains."
    )
