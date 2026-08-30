"""Nothing invents a listing and attributes it to a real institution.

WHAT THIS PREVENTS

Three education tables carried seed rows that the public pages presented as
fact. `knowledge_camps` was cleared by migration 095; migration 096 cleared the
two that were worse, because their invented figures named REAL organisations on
a government platform:

  graduate_programs (2026-06-17)
    Mohammed Bin Rashid School of Government  MBA  AED 95,000  rated 4.9  45/50
    Khalifa University                        MSc  AED 78,000  rated 4.8  60/70
    Masdar Institute                          PhD  "Fully Funded"
    ... and three more, with tuition, ratings and enrolment nobody had.

  youth_programs (2026-05-31)
    Ministry of Defence   National Service Career Track   1200/1200  "full"
    Federal Youth Authority, Ministry of Education, Dubai Future Foundation ...

A wrong tuition figure is the Council publishing incorrect financial information
about a named university. A fabricated national-service participation figure
credited to the Ministry of Defence is worse still.

THE RE-SEED TRAP

Every one of these seeders fired whenever it found its table EMPTY. Deleting the
rows without removing the seed re-inserts them on the next request — so the
delete and the seed removal have to be the same change. That is what these tests
hold in place.
"""
import inspect
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import code_only  # noqa: E402

SEEDED_TABLES = ('knowledge_camps', 'graduate_programs', 'youth_programs')


def _module():
    import education_api_routes
    return education_api_routes


@pytest.mark.parametrize('table', SEEDED_TABLES)
def test_no_ensure_function_inserts_rows(table):
    """An `ensure_*` function creates schema. It must not invent content."""
    src = open(os.path.join(BACKEND, 'education_api_routes.py'), encoding='utf-8').read()
    assert f'INSERT INTO {table}' not in src, (
        f'{table} is seeded again — it will refill the moment the table is empty')


def test_the_named_institutions_are_gone_from_the_source():
    """These were attributed real fees, ratings and enrolment they never gave us.

    Matched against CODE only. The comments that record why the seeding was
    removed name these institutions deliberately, and an explanation of the fix
    must not read as the fix being undone.
    """
    src = code_only(open(os.path.join(BACKEND, 'education_api_routes.py'),
                         encoding='utf-8').read())
    for named in ('Mohammed Bin Rashid School of Government',
                  'Khalifa University',
                  'Masdar Institute',
                  'Ministry of Defence',
                  'Federal Youth Authority'):
        assert named not in src, (
            f'{named!r} is still seeded with figures the platform invented for it')


def test_no_invented_rating_survives():
    """There is no rating system on this platform, so there is nothing a rating
    column could honestly hold."""
    src = code_only(open(os.path.join(BACKEND, 'education_api_routes.py'),
                         encoding='utf-8').read())
    for fake in ('4.9,', '4.8,', '4.7,', '4.6,', '4.5,'):
        assert fake not in src, f'a hard-coded rating {fake} is still being seeded'


@pytest.mark.parametrize('fn_name', ('ensure_camps_table',
                                     'ensure_grad_programs_table'))
def test_the_ensure_functions_say_why_they_no_longer_seed(fn_name):
    """The next person to look at an empty listing needs to know it is empty on
    purpose, not broken."""
    fn = getattr(_module(), fn_name)
    src = inspect.getsource(fn)
    assert 'migration 09' in src or 'Seeding removed' in src, (
        f'{fn_name} does not record why it stopped seeding')


def test_ensure_youth_programs_table_is_gone_entirely():
    """Stronger than explaining itself: the function and its endpoint were
    removed by migration 100, which folded that table into the one that has a
    workflow. The endpoint read `ORDER BY enrolled DESC` — sorting by the
    invented column migration 096 deleted."""
    assert not hasattr(_module(), 'ensure_youth_programs_table')
    # code_only: the comment recording the removal quotes that query on purpose.
    src = code_only(open(os.path.join(BACKEND, 'education_api_routes.py'),
                         encoding='utf-8').read())
    assert "route('/content/youth-programs'" not in src
    assert 'ORDER BY enrolled DESC' not in src
