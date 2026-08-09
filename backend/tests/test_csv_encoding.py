"""CSV upload encoding: Arabic must survive, and text a spreadsheet already
destroyed must be detected rather than stored as a real name.

Both cases are live findings from the 2026-08-09 onboarding E2E.
"""
try:
    from backend.csv_encoding import decode_csv_bytes, looks_encoding_mangled
except ImportError:
    from csv_encoding import decode_csv_bytes, looks_encoding_mangled

ARABIC = 'شركة الإمارات للتقنية'


def test_utf8_arabic_round_trips():
    # utf-8-sig is tried first and decodes plain UTF-8 too (it only strips a BOM
    # when one is present), so either UTF-8 label is correct — and neither warns.
    text, enc = decode_csv_bytes(ARABIC.encode('utf-8'))
    assert text == ARABIC
    assert enc in ('utf-8', 'utf-8-sig')


def test_utf8_bom_is_stripped():
    """Excel's 'CSV UTF-8' writes a BOM; it must not end up in the first header."""
    text, enc = decode_csv_bytes(('﻿' + ARABIC).encode('utf-8'))
    assert text == ARABIC and enc == 'utf-8-sig'


def test_cp1256_arabic_export_no_longer_crashes_the_import():
    """The real regression: a cp1256 (Arabic Windows) export used to raise
    UnicodeDecodeError and take the ENTIRE import down — no rows landed."""
    text, enc = decode_csv_bytes(ARABIC.encode('cp1256'))
    assert enc == 'cp1256'
    assert text == ARABIC          # fully recovered, not mangled


def test_never_raises_on_arbitrary_bytes():
    text, enc = decode_csv_bytes(bytes(range(256)))
    assert isinstance(text, str) and enc


def test_detects_excel_replaced_arabic():
    """What Excel does when saving Arabic as non-Unicode CSV — unrecoverable,
    so it must be REPORTED, never stored as a company's name."""
    mangled = ARABIC.encode('cp1252', errors='replace').decode('utf-8')
    assert looks_encoding_mangled(mangled) is True


def test_detects_unicode_replacement_char():
    assert looks_encoding_mangled('Acme �� Co') is True


def test_does_not_flag_legitimate_names():
    """Conservative on purpose — ordinary names and a single '?' must pass."""
    for ok in ('ACACUS COMPUTER SOFTWARE HOUSE L.L.C',
               'Airbus',
               ARABIC,
               'What? Media LLC',
               '',
               None):
        assert looks_encoding_mangled(ok) is False, ok
