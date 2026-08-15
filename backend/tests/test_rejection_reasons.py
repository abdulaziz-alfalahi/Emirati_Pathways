"""The standardised rejection reason list.

These reasons are quoted back to candidates and counted in reporting, so the
list is a policy artefact as much as a vocabulary. The tests that matter here
are the ones about what it must NOT contain.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rejection_reasons import (  # noqa: E402
    REJECTION_REASONS,
    REJECTION_REASON_CODES,
    EMPLOYER_SIDE_REASONS,
    is_valid_reason,
    validate_rejection,
    reason_options,
)


def test_the_list_is_extensive():
    # Owner asked for extensive: a short list forces people into 'other', and
    # everything in 'other' is lost to counting.
    assert len(REJECTION_REASONS) >= 25


def test_no_protected_characteristic_is_offered_as_a_reason():
    """The point of the list is what it refuses to make easy.

    A dropdown is not neutral — whatever it offers, it legitimises. An employer
    who genuinely rejected on one of these grounds has to type it into 'other',
    where it is a visible sentence rather than a tidy aggregate.
    """
    # Word-START boundaries, not substrings: 'age' appears inside 'language',
    # and a check that flags "language proficiency" as discrimination is a check
    # nobody will keep.
    forbidden = re.compile(
        r'\b(?:age|gender|male|female|marital|married|disab|determination|'
        r'nationality|race|religion|pregnan|family)', re.I)
    for code, (en, ar, _group, _employer) in REJECTION_REASONS.items():
        hit = forbidden.search(f'{code} {en}')
        assert not hit, f"'{code}' ({en}) refers to a protected characteristic: '{hit.group()}'"


def test_employer_side_reasons_are_marked():
    """Reasons that say nothing about the candidate must be separable.

    Counting "the role was withdrawn" into a candidate's rejection rate would
    penalise them for an employer's planning.
    """
    assert 'role_filled' in EMPLOYER_SIDE_REASONS
    assert 'role_withdrawn' in EMPLOYER_SIDE_REASONS
    assert 'budget_changed' in EMPLOYER_SIDE_REASONS
    # ...and reasons about the candidate are not marked as employer-side
    assert 'insufficient_experience' not in EMPLOYER_SIDE_REASONS
    assert 'no_show_interview' not in EMPLOYER_SIDE_REASONS


def test_every_reason_is_bilingual_and_grouped():
    for code, value in REJECTION_REASONS.items():
        en, ar, group, employer_side = value
        assert en and ar, f'{code} is missing a translation'
        assert ar != en, f'{code} has English in the Arabic slot'
        assert group, f'{code} has no group'
        assert isinstance(employer_side, bool)


def test_other_requires_an_explanation():
    # A fixed list with no escape forces a false choice, which is worse data
    # than a sentence — but an unexplained 'other' is no data at all.
    assert validate_rejection('other') is not None
    assert validate_rejection('other', '   ') is not None
    assert validate_rejection('other', 'Role needs an on-site security clearance') is None


def test_a_normal_reason_needs_no_note():
    assert validate_rejection('insufficient_experience') is None


def test_unknown_and_empty_reasons_are_refused():
    assert validate_rejection(None) is not None
    assert validate_rejection('') is not None
    assert validate_rejection('not_a_reason') is not None
    assert is_valid_reason('not_a_reason') is False


def test_codes_are_case_insensitive_on_input():
    assert validate_rejection('Insufficient_Experience') is None


def test_options_render_for_a_dropdown():
    opts = reason_options()
    assert len(opts) == len(REJECTION_REASON_CODES)
    assert all({'code', 'label', 'group', 'employer_side'} <= set(o) for o in opts)
    # Arabic labels differ from English ones
    assert reason_options(arabic=True)[0]['label'] != opts[0]['label']
