"""The AI must call the platform by its name, in the language it is writing.

REPORTED FROM THE MENTORSHIP PAGE, 2026-09-01: Arabic AI-generated guidance
called the platform "منصة إهردك" — a phonetic spelling of the English acronym
EHRDC in Arabic letters. It is not a name in either language, and it appeared on
a page shown to candidates.

The cause was in the prompt, not the model. Both system prompts hardcoded
"the EHRDC Emirati Pathways platform" and the language instruction was the whole
of "Respond in Arabic." — so the model was asked to write Arabic about something
it had only ever been given an English acronym for, and it did the reasonable
thing with it.

Two separate faults, both fixed:
  * no Arabic name was ever supplied, so one got invented;
  * the English was wrong too — "Emirati Pathways" is this repository's name,
    not the product's. backend/brand.py has held the real names all along.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from brand import (PLATFORM_NAME_AR, PLATFORM_NAME_EN,  # noqa: E402
                   COUNCIL_NAME_AR, COUNCIL_NAME_EN)
from routes.ai_assist_routes import _AUTHORING_SYSTEM, _BASE_SYSTEM  # noqa: E402

PROMPTS = {'advice': _BASE_SYSTEM, 'authoring': _AUTHORING_SYSTEM}

FORMAT_ARGS = dict(lang_clause='', platform_en=PLATFORM_NAME_EN,
                   platform_ar=PLATFORM_NAME_AR, council_en=COUNCIL_NAME_EN,
                   council_ar=COUNCIL_NAME_AR)


def _rendered(prompt):
    return prompt.format(**FORMAT_ARGS)


def test_both_prompts_carry_the_platform_name_in_both_languages():
    for name, prompt in PROMPTS.items():
        text = _rendered(prompt)
        assert PLATFORM_NAME_EN in text, f'{name} prompt lost the English name'
        assert PLATFORM_NAME_AR in text, f'{name} prompt lost the Arabic name'


def test_both_prompts_name_the_council_in_both_languages():
    for name, prompt in PROMPTS.items():
        text = _rendered(prompt)
        assert COUNCIL_NAME_EN in text, f'{name} prompt lost the English council name'
        assert COUNCIL_NAME_AR in text, f'{name} prompt lost the Arabic council name'


def test_the_repository_name_is_not_presented_to_users_as_the_product_name():
    """"Emirati Pathways" is what the code is called. Candidates never see it
    anywhere else in the platform and should not read it from the assistant."""
    for name, prompt in PROMPTS.items():
        assert 'Emirati Pathways' not in _rendered(prompt), \
            f'{name} prompt calls the product by the repository name'


def test_writing_arabic_supplies_the_arabic_name_and_forbids_transliteration():
    """The regression that was reported. Asking for Arabic while naming the
    platform only in English is what produced "منصة إهردك"."""
    from routes.ai_assist_routes import _build_lang_clause

    arabic = _build_lang_clause('ar')
    assert PLATFORM_NAME_AR in arabic
    assert COUNCIL_NAME_AR in arabic
    assert 'transliterate' in arabic.lower(), \
        'the instruction not to spell the acronym in Arabic letters is gone'
    assert 'EHRDC' in arabic, 'the model is not told which acronym to avoid'


def test_writing_english_supplies_the_english_name():
    from routes.ai_assist_routes import _build_lang_clause

    english = _build_lang_clause('en')
    assert PLATFORM_NAME_EN in english
    # Arabic guidance in an English answer would be noise in the prompt budget.
    assert PLATFORM_NAME_AR not in english


def test_the_prompts_still_render_without_a_stray_placeholder():
    """A prompt shipped with an unfilled {placeholder} would reach the model
    verbatim, which is invisible in testing and obvious to a user."""
    for name, prompt in PROMPTS.items():
        text = _rendered(prompt)
        assert '{' not in text and '}' not in text, \
            f'{name} prompt has an unsubstituted placeholder'
