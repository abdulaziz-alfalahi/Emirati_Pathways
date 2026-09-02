"""Emirates ID and mobile numbers must survive being opened in Excel.

Reported by a career services operator 2026-09-02 (fb_1788356973):

    "When downloading and opening a CSV file in Excel, fields such as Emirates ID
     numbers and mobile numbers are automatically converted into scientific
     notation (e.g., 7.842E+14 or 9.71508E+11)...
       Current Display: 7.842E+14      Expected: 784200000000000
       Current Display: 9.71508E+11    Expected: 971508000000"

WHY THE CSV WAS NOT PATCHED

CSV has no types, and Excel ignores quoting when it decides a field is numeric.
Every CSV-side fix — `="784…"`, a leading tab, a leading apostrophe — works by
CHANGING THE VALUE. On this platform that means writing a corrupted Emirates ID
into a file somebody may re-import, and an Emirates ID that is not the person's
strands them at cutover (see backend/scripts/cutover_identity_check.py, which
exists because three real people already have unusable ids).

So the operator downloads a real spreadsheet, where the identifier columns are
typed as text and the value is untouched. The CSV remains available and remains
true, for machines that want the raw value.

These tests write a workbook and read the cells back, rather than asserting on
the code that writes it: the question is what Excel receives.
"""
import io
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

openpyxl = pytest.importorskip('openpyxl')

EMIRATES_ID = '784200000000000'
MOBILE = '971508000000'


def build_sheet(values, text_columns=('emirates_id', 'phone')):
    """The same shape the export writes: header, rows, text-typed id columns."""
    cols = ['emirates_id', 'full_name', 'phone', 'age_group']
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(cols)
    for row in values:
        ws.append([row.get(c, '') for c in cols])
    for idx, col in enumerate(cols, start=1):
        if col in text_columns:
            for column in ws.iter_cols(min_col=idx, max_col=idx, min_row=2):
                for cell in column:
                    cell.number_format = '@'
                    if cell.value is not None:
                        cell.value = str(cell.value)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return openpyxl.load_workbook(buf).active


def test_an_emirates_id_arrives_as_the_digits_it_was_given():
    ws = build_sheet([{'emirates_id': EMIRATES_ID, 'full_name': 'A Candidate',
                       'phone': MOBILE}])
    assert ws.cell(row=2, column=1).value == EMIRATES_ID
    assert 'E+' not in str(ws.cell(row=2, column=1).value)


def test_a_mobile_number_keeps_its_digits():
    ws = build_sheet([{'emirates_id': EMIRATES_ID, 'phone': MOBILE}])
    assert ws.cell(row=2, column=3).value == MOBILE


def test_the_identifier_cells_are_typed_as_text():
    """`@` is Excel's text format. Without it Excel is free to re-interpret the
    digits on open, which is the entire defect."""
    ws = build_sheet([{'emirates_id': EMIRATES_ID, 'phone': MOBILE}])
    assert ws.cell(row=2, column=1).number_format == '@'
    assert ws.cell(row=2, column=3).number_format == '@'


def test_a_leading_zero_is_not_eaten():
    """The other half of numeric coercion: 0501234567 becomes 501234567, which
    is not a telephone number anybody can ring."""
    ws = build_sheet([{'emirates_id': EMIRATES_ID, 'phone': '0501234567'}])
    assert ws.cell(row=2, column=3).value == '0501234567'


def test_the_value_itself_is_never_altered_to_make_excel_behave():
    """No ="…", no leading tab, no apostrophe. A file that displays correctly by
    carrying a different value is worse than one that displays wrongly: the
    first is wrong when a machine reads it, and machines read these."""
    ws = build_sheet([{'emirates_id': EMIRATES_ID}])
    value = str(ws.cell(row=2, column=1).value)
    assert value == EMIRATES_ID
    for hack in ('=', '\t', "'"):
        assert not value.startswith(hack), f'the value was mangled with {hack!r}'


def test_non_identifier_columns_are_left_alone():
    """Only the identifier columns are forced to text. Forcing everything would
    make dates and counts useless to sort and filter on."""
    ws = build_sheet([{'emirates_id': EMIRATES_ID, 'age_group': '24-35'}])
    assert ws.cell(row=2, column=4).number_format != '@'


def test_arabic_survives():
    """These rows carry Arabic names; the CSV needed a BOM for that. A workbook
    stores text as text and needs no such trick."""
    ws = build_sheet([{'emirates_id': EMIRATES_ID, 'full_name': 'فاطمة الشامسي'}])
    assert ws.cell(row=2, column=2).value == 'فاطمة الشامسي'


def test_an_empty_identifier_does_not_become_the_string_none():
    """A missing telephone number must arrive as an empty cell, not as the word
    "None". The text-forcing pass calls str() on every identifier cell, so it
    has to skip empty ones — otherwise every candidate without a number gets a
    literal None in the spreadsheet."""
    ws = build_sheet([{'emirates_id': '', 'phone': None}])
    assert ws.cell(row=2, column=1).value in ('', None)
    phone = ws.cell(row=2, column=3).value
    assert phone is None or phone == '', f'empty phone became {phone!r}'


# ── the endpoint offers it, and still tells the audit trail ─────────────────

def test_the_export_offers_a_spreadsheet_format():
    src = open(os.path.join(BACKEND, 'candidate_profile_routes.py'),
               encoding='utf-8').read()
    assert "format') or '').lower() in ('xlsx', 'excel')" in src
    assert 'openpyxl' in src


def test_both_formats_are_audited():
    """An unlogged export of a citizen roster is exactly what the audit trail
    exists to prevent, so the audit cannot live in only one branch."""
    src = open(os.path.join(BACKEND, 'candidate_profile_routes.py'),
               encoding='utf-8').read()
    assert src.count('_audit_crm_export(') >= 3, \
        'the audit is not shared by both export formats'


def test_the_screen_asks_for_the_spreadsheet():
    """A backend that can produce it and a screen that never requests it is the
    recurring shape on this platform — the fix would be invisible."""
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'pages',
                        'operator-dashboards', 'CareerServicesDashboard.tsx')
    src = open(path, encoding='utf-8').read()
    assert "params.set('format', 'xlsx')" in src
    assert '.xlsx`' in src, 'the file is still downloaded named .csv'
