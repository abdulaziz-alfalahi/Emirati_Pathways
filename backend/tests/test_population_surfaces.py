"""The population figures must reach a screen, and must carry their basis.

These are source-level rules, not request tests, because the failure they guard
against was never a broken endpoint. /api/metrics/populations worked perfectly
and returned correct numbers for a day while no page in the application called
it — the owner asked "I didn't see the data from the employed candidates
reflecting anywhere. Do you have this planned?" and the answer was that the API
existed and the UI did not.

A passing integration test would not have caught that. Nothing was broken;
something was absent. So these assert the wiring itself.
"""
import os
import re

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')


def _read(*parts):
    with open(os.path.join(*parts), encoding='utf-8') as fh:
        return fh.read()


def _frontend_sources():
    for root, _dirs, files in os.walk(FRONTEND):
        for name in files:
            if name.endswith(('.tsx', '.ts')):
                yield os.path.join(root, name)


def test_populations_endpoint_has_a_consumer():
    """An endpoint nobody calls is not a delivered feature."""
    callers = [
        path for path in _frontend_sources()
        if '/api/metrics/populations' in _read(path)
    ]
    assert callers, (
        "No frontend file calls /api/metrics/populations. The employed, "
        "seeking and onboarded figures would exist only in the API — which is "
        "exactly the gap the owner reported on 2026-08-22."
    )


def test_population_strip_is_mounted_on_the_named_audiences():
    """The owner named the audiences: board members, CRM, other personas."""
    mounted = {
        os.path.basename(path)
        for path in _frontend_sources()
        if '<PopulationStrip' in _read(path)
    }
    for page in ('ExecutiveDashboard.tsx', 'CareerServicesDashboard.tsx'):
        assert page in mounted, (
            f"{page} does not render <PopulationStrip />. The figures were "
            "requested for board members and the CRM team by name."
        )


def test_strip_never_shows_a_headline_without_its_basis():
    """Recorded and registered travel together, or the number lies.

    33,510 employed records and 37 people who have ever signed in are both true.
    Showing either alone is a false impression, so the component must render the
    second figure and the scope note alongside the first.
    """
    src = _read(FRONTEND, 'components', 'PopulationStrip.tsx')
    assert 'registered' in src, 'the registered basis is not rendered'
    assert 'scope_note' in src, 'the scope disclosure is not rendered'
    assert 'scope_note_ar' in src, (
        'the disclosure is not localised — an Arabic reader would get the '
        'claim with the caveat in English'
    )


def test_crm_stats_scope_is_a_parameter_not_a_hardcoded_filter():
    """The roster boundary must be visible and movable.

    Every chart on the CRM analytics tab was filtered to crm_reference IS NOT
    NULL with nothing on screen saying so, which is how "Working 690" was shown
    while the platform held 33,510 employed people.
    """
    src = _read(BACKEND, 'candidate_profile_routes.py')
    handler = src[src.index('def get_crm_stats'):]
    handler = handler[:handler.index('\n@')] if '\n@' in handler else handler

    assert "request.args.get('scope')" in handler, (
        'crm-stats no longer accepts a scope parameter; the roster boundary '
        'has gone back to being implicit'
    )
    for key in ('roster_total', 'platform_total'):
        assert f"'{key}'" in handler, (
            f"crm-stats does not return {key}; the page cannot state how many "
            "people sit outside the view it is showing"
        )


def test_crm_dashboard_labels_follow_the_scope():
    """A right number under a wrong label is the original bug, restated."""
    src = _read(FRONTEND, 'pages', 'operator-dashboards', 'CareerServicesDashboard.tsx')
    assert "statsScope === 'platform'" in src, (
        'the roster KPI label is not scope-aware — switching to the platform '
        'view would show the platform total labelled "CRM Roster"'
    )


def test_scope_note_is_bilingual_for_every_audience():
    """Both audiences, both languages — no English fallback in an Arabic UI."""
    import sys
    sys.path.insert(0, BACKEND)
    from populations import scope_note_bilingual, AUDIENCE_MEMBERS_ONLY

    for audience in ('board', sorted(AUDIENCE_MEMBERS_ONLY)[0]):
        note = scope_note_bilingual(audience)
        assert set(note) == {'en', 'ar'}, f'{audience} note is missing a language'
        for lang, text in note.items():
            assert text.strip(), f'{audience}/{lang} note is empty'
        # A note that is the same string in both languages means one of them was
        # never translated.
        assert note['en'] != note['ar']
        assert re.search(r'[؀-ۿ]', note['ar']), (
            f'{audience} Arabic note contains no Arabic'
        )
