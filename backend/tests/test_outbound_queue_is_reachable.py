"""A review queue you cannot reach the end of is not a review queue.

WHY THIS FILE EXISTS

Checked 2026-08-27 at the owner's request. The screen showed 50 messages and
reported 268 waiting, with nothing to reach the other 218 and no way to filter.

The consequence was not abstract. 267 vacancy verifications were queued on one
day, so the single invitation to a real employer — the only message actually
waiting on a decision, and the one the owner had just asked about — sat at
position 268 behind 267 renderings of the same template. On a screen whose
entire purpose is deciding what leaves the platform, it could not be seen.

Oldest-first is kept: a queue that shows newest first buries whatever nobody
dealt with, which is exactly the wrong end to hide.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import inspect  # noqa: E402
import pytest  # noqa: E402

from tests.source_utils import code_only, js_code_only  # noqa: E402

import outbound_mail  # noqa: E402


def test_the_queue_can_be_paged():
    sig = inspect.signature(outbound_mail.held_messages)
    assert 'offset' in sig.parameters, 'no way to ask for anything past the first page'
    assert 'kind' in sig.parameters


def test_a_page_comes_with_its_denominator():
    """"50 messages" means nothing without "of 268"."""
    assert hasattr(outbound_mail, 'held_count')
    source = code_only(open(os.path.join(BACKEND, 'routes', 'outbound_mail_routes.py'),
                            encoding='utf-8').read())
    queue = source[source.index('def get_queue'):source.index('def get_config')]
    for field in ("'matching'", "'has_more'", "'offset'", "'kinds'"):
        assert field in queue, f'the queue response omits {field}'


def test_the_oldest_are_still_shown_first():
    """Newest-first would bury whatever has not been dealt with."""
    source = inspect.getsource(outbound_mail.held_messages)
    assert 'ORDER BY created_at' in source
    assert 'DESC' not in source.split('ORDER BY created_at')[1].split('LIMIT')[0]


def test_a_kind_filter_exists_so_one_template_cannot_bury_everything():
    assert hasattr(outbound_mail, 'held_kinds')
    source = inspect.getsource(outbound_mail.held_kinds)
    assert 'GROUP BY kind' in source


def test_the_kind_filter_is_bound_not_interpolated():
    """The WHERE clause is built as a string, so the VALUE must not be."""
    source = inspect.getsource(outbound_mail.held_messages)
    assert 'params.append(kind)' in source
    assert '{kind}' not in source, 'the kind is interpolated into SQL'


def test_the_screen_offers_the_controls():
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'components',
                        'admin', 'OutboundMailReview.tsx')
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    source = js_code_only(open(path, encoding='utf-8').read())
    assert 'setOffset' in source, 'no pager'
    assert 'setKindFilter' in source, 'no kind filter'
    assert 'page.matching' in source, 'the screen never says how many there are'


def test_the_queue_names_the_kind_instead_of_printing_the_identifier():
    """It rendered `vacancy_verification` under every recipient's address."""
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'components',
                        'admin', 'OutboundMailReview.tsx')
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    source = js_code_only(open(path, encoding='utf-8').read())
    assert 'mailKindLabel(' in source
    assert '{m.kind}' not in source
