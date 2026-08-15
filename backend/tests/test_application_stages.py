"""The application stage ladder is defined once and everything follows it.

Three overlapping vocabularies existed before #410, and the API's own validation
set omitted three values its own code wrote — so a status could be stored that
the endpoint validating statuses would have refused. These tests pin the pieces
that drifted apart, because nothing else notices when they do.

The database CHECK in migration 068 carries the same list. If you change the
ladder, change it in application_stages.py AND in a new migration; this file
will fail until the two agree in code, and the constraint will refuse the write
at runtime if you forget the migration.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application_stages import (  # noqa: E402
    APPLICATION_STAGES,
    APPLICATION_TERMINAL,
    ALL_APPLICATION_STATUSES,
    LEGACY_STATUS_MAP,
    normalise_status,
    stage_index,
)


def test_ladder_is_the_owner_approved_order():
    assert APPLICATION_STAGES == (
        'submitted', 'under_review', 'shortlisted', 'interview_scheduled',
        'interviewed', 'offered', 'placed',
    )
    assert APPLICATION_TERMINAL == ('rejected', 'withdrawn')


def test_hired_and_placed_are_one_stage():
    # Two names for one thing is how a pipeline stops being countable.
    assert normalise_status('hired') == 'placed'
    assert normalise_status('accepted') == 'placed'
    assert 'hired' not in ALL_APPLICATION_STATUSES


def test_interview_maps_to_scheduled_not_interviewed():
    # It was set when an interview was BOOKED. Mapping it to 'interviewed'
    # would assert an interview took place — inventing a fact about real rows.
    assert normalise_status('interview') == 'interview_scheduled'


def test_every_legacy_value_maps_into_the_ladder():
    for legacy, canonical in LEGACY_STATUS_MAP.items():
        assert canonical in ALL_APPLICATION_STATUSES, (
            f"legacy '{legacy}' maps to '{canonical}', which is not a status"
        )


def test_unknown_status_is_refused_not_guessed():
    # A status nobody defined should surface as a rejected write, not be filed
    # under whatever looked closest.
    assert normalise_status('almost_hired') is None
    assert normalise_status('') is None
    assert normalise_status(None) is None


def test_case_and_whitespace_are_tolerated():
    assert normalise_status('  Shortlisted ') == 'shortlisted'


def test_stages_are_ordered_and_terminals_are_not():
    assert stage_index('submitted') < stage_index('shortlisted') < stage_index('placed')
    # Terminal states are ends, not steps — asking how far along they are is a
    # category error, so there is no answer rather than a misleading one.
    assert stage_index('rejected') is None
    assert stage_index('withdrawn') is None


def test_api_validation_set_matches_the_ladder():
    """The exact drift that let 'accepted' be written but not validated."""
    from routes.applications_api import _VALID_STATUSES
    assert set(_VALID_STATUSES) == set(ALL_APPLICATION_STATUSES)


def test_event_outcomes_vocabulary_is_a_subset():
    """Open-day results and application pipelines must be countable together.

    event_outcomes.stage (migration 061) was named for this request. Every stage
    it can record has to exist on the ladder, or the two cannot be summed.
    """
    event_outcome_stages = {'interviewed', 'shortlisted', 'offered', 'placed', 'rejected'}
    assert event_outcome_stages <= set(ALL_APPLICATION_STATUSES)
