"""Three fields recruiters asked for on the job posting, 2026-09-02.

    fb_1788340436  "Multiple locations needed in the job posting. e.g.
                    different branches."
    fb_1788342002  "...indicate whether a job vacancy is designated for, or
                    suitable for, People of Determination, through a simple
                    Yes/No option."
    fb_1788341608  "...a dedicated field to specify the number of vacancies."

THE TRAP THIS FILE EXISTS TO GUARD

A job posting is written by TWO code paths: the batch create in
hr_job_posting_routes and the wizard's own save in recruiter/jd_routes_v2. The
wizard is the one a recruiter actually uses. A field added to the first and not
the second is collected on screen and silently dropped on save — the recurring
shape where the frontend asks for something no writer stores.

number_of_vacancies is the worked example: migration 102 added the column and
PR #564 put it in the batch insert, and on 2026-09-02 all 289 postings still
held 1, because the wizard path never wrote it and nothing in the UI ever asked.
"""
import ast
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(BACKEND)
for path in (BACKEND, REPO):
    if path not in sys.path:
        sys.path.insert(0, path)

import pytest  # noqa: E402

from hr_job_posting_routes import (_extra_locations, _tristate,  # noqa: E402
                                   _vacancy_count)

WIZARD_SAVE = os.path.join(BACKEND, 'recruiter', 'jd_routes_v2.py')
WIZARD_FORM = os.path.join(REPO, 'frontend', 'src', 'components', 'recruiter',
                           'job-descriptions', 'JobDescriptionWizard.tsx')
NEW_COLUMNS = ('locations', 'suitable_for_people_of_determination',
               'number_of_vacancies')


# ── accessibility is tri-state, and that is the whole point ─────────────────

def test_not_stated_is_not_the_same_as_no():
    """289 postings predate anyone being asked. Defaulting them to False would
    record on every one that the employer considered accessibility and declined
    — a claim we have no basis for."""
    assert _tristate(None) is None
    assert _tristate('') is None


@pytest.mark.parametrize('value, expected', [
    (True, True), ('yes', True), ('Yes', True), ('true', True), ('1', True), ('y', True),
    (False, False), ('no', False), ('NO', False), ('false', False), ('0', False), ('n', False),
])
def test_the_answers_people_actually_send(value, expected):
    assert _tristate(value) is expected


def test_an_unrecognised_answer_is_not_stated_rather_than_no():
    assert _tristate('maybe') is None
    assert _tristate('لا أعرف') is None


# ── vacancy count ───────────────────────────────────────────────────────────

def test_a_missing_count_is_one_not_zero():
    assert _vacancy_count({}) == 1


def test_zero_and_negative_become_one():
    """A vacancy advertising zero openings is a posting nobody can be hired
    into, and it would drop off the matcher for a reason no one could see."""
    assert _vacancy_count({'number_of_vacancies': 0}) == 1
    assert _vacancy_count({'number_of_vacancies': -3}) == 1


def test_a_real_count_is_honoured():
    assert _vacancy_count({'number_of_vacancies': 12}) == 12
    assert _vacancy_count({'number_of_vacancies': '7'}) == 7


def test_nonsense_does_not_raise_mid_save():
    assert _vacancy_count({'number_of_vacancies': 'four'}) == 1
    assert _vacancy_count({'number_of_vacancies': None}) == 1


# ── branches ────────────────────────────────────────────────────────────────

def test_a_single_location_posting_serialises_to_nothing():
    """The first location stays in emirate/city. A posting with no extra
    branches must be byte-for-byte what it was before this field existed."""
    assert _extra_locations({}) == []
    assert _extra_locations({'locations': []}) == []


def test_branches_are_normalised():
    out = _extra_locations({'locations': [
        {'emirate': ' Dubai ', 'city': 'Deira', 'branch': 'HQ'}]})
    assert out == [{'emirate': 'Dubai', 'city': 'Deira', 'branch': 'HQ'}]


def test_a_bare_string_is_accepted_as_a_city():
    assert _extra_locations({'locations': ['Sharjah']}) == [{'city': 'Sharjah'}]


def test_empty_rows_are_dropped():
    """The form adds a blank row when the recruiter clicks "Add a branch"; one
    left unfilled must not be stored as a location with no place in it."""
    assert _extra_locations({'locations': [
        {'emirate': '', 'city': '', 'branch': ''}, {'city': 'Abu Dhabi'}]}) == \
        [{'city': 'Abu Dhabi'}]


def test_keys_with_no_value_are_omitted_rather_than_stored_empty():
    assert _extra_locations({'locations': [{'city': 'Al Ain'}]}) == [{'city': 'Al Ain'}]


# ── both writers, or the field is collected and dropped ─────────────────────

@pytest.mark.parametrize('column', NEW_COLUMNS)
def test_the_wizard_save_path_writes_every_new_column(column):
    """This is the test that matters. The wizard is the path a recruiter
    actually uses; hr_job_posting_routes is the batch importer."""
    source = open(WIZARD_SAVE, encoding='utf-8').read()
    update = source[source.index('UPDATE job_postings SET'):]
    update = update[:update.index('"""')]
    insert = source[source.index('INSERT INTO job_postings ('):]
    insert = insert[:insert.index('"""')]
    assert column in update, f'the wizard UPDATE drops {column}'
    assert column in insert, f'the wizard INSERT drops {column}'


@pytest.mark.parametrize('column', NEW_COLUMNS)
def test_the_batch_create_writes_every_new_column(column):
    source = open(os.path.join(BACKEND, 'hr_job_posting_routes.py'),
                  encoding='utf-8').read()
    insert = source[source.index('INSERT INTO job_postings ('):]
    insert = insert[:insert.index('RETURNING')]
    assert column in insert, f'the batch create drops {column}'


@pytest.mark.parametrize('column', NEW_COLUMNS)
def test_the_wizard_reads_them_back(column):
    """A draft reopened with the fields blank loses what the recruiter typed."""
    source = open(WIZARD_SAVE, encoding='utf-8').read()
    basic = source[source.index("basic_info = {"):]
    basic = basic[:basic.index('}')]
    assert column in basic, f'reopening a draft loses {column}'


def test_the_wizard_statements_balance():
    """A column added without its placeholder raises at runtime, on the save a
    recruiter just pressed.

    Counted from the AST rather than by scanning for commas: the parameter
    tuple contains nested calls, dicts and json.dumps(...) with commas of their
    own, and a text parser gets it wrong in both directions. An earlier version
    of this test did exactly that and failed against correct code.
    """
    tree = ast.parse(open(WIZARD_SAVE, encoding='utf-8').read())
    checked = 0
    for node in ast.walk(tree):
        if not (isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == 'execute'
                and len(node.args) == 2):
            continue
        sql_node, params_node = node.args
        if not isinstance(sql_node, ast.Constant) or not isinstance(sql_node.value, str):
            continue
        if 'job_postings' not in sql_node.value:
            continue
        if not isinstance(params_node, (ast.Tuple, ast.List)):
            continue
        placeholders = sql_node.value.count('%s')
        assert placeholders == len(params_node.elts), (
            f"line {node.lineno}: {placeholders} placeholders vs "
            f"{len(params_node.elts)} parameters")
        checked += 1
    assert checked >= 2, f'expected the wizard INSERT and UPDATE, checked {checked}'


# ── the form asks for them ──────────────────────────────────────────────────

@pytest.mark.parametrize('field', NEW_COLUMNS)
def test_the_wizard_form_collects_them(field):
    """A column nothing asks for stays at its default for ever — which is how
    number_of_vacancies sat at 1 on all 289 postings."""
    assert field in open(WIZARD_FORM, encoding='utf-8').read()
