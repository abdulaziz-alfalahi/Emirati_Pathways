"""The public share link retires on a date, with a banner before and a 410 after."""
import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.cv_projection import share_retirement, DEFAULT_SHARE_RETIRES_ON  # noqa: E402


def test_before_the_date_the_link_works_and_the_banner_knows_the_date():
    assert share_retirement(date(2026, 9, 6)) == (False, DEFAULT_SHARE_RETIRES_ON)


def test_on_and_after_the_date_the_link_is_gone():
    assert share_retirement(date(2026, 10, 6)) == (True, '2026-10-06')
    assert share_retirement(date(2027, 1, 1)) == (True, '2026-10-06')


def test_the_date_can_be_set_by_environment():
    assert share_retirement(date(2026, 9, 6), '2026-09-01') == (True, '2026-09-01')
    assert share_retirement(date(2026, 9, 6), ' 2026-12-31 ') == (False, '2026-12-31')


def test_a_broken_setting_never_retires_early_and_never_leaks_an_invalid_date():
    assert share_retirement(date(2026, 9, 6), 'not-a-date') == (False, None)
    assert share_retirement(date(2026, 9, 6), '') == (False, DEFAULT_SHARE_RETIRES_ON)
