"""users.emirates_id_enc must stay SINGLE-FORMAT (plaintext).

P2 of docs/finding_eid_at_rest.md. The UAE Pass callback used to write AES-GCM
ciphertext into this column while both CRM importers look candidates up by
PLAINTEXT EID against it. The first national to complete UAE Pass onboarding
would therefore have stopped matching — no duplicate row (ON CONFLICT (id) DO
NOTHING), but the update branch skipped, so they would silently stop receiving
CRM master-file updates while the import report counted them as newly created.

Writing NULL would break it identically: the importer's lookup skips NULLs too.
Plaintext is the only value that keeps the column single-format.
"""
import os
import re
import sys

_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_here)
_ROUTES = os.path.join(_backend, 'routes', 'uaepass_routes.py')
for p in (os.path.dirname(_backend), _backend):
    if p not in sys.path:
        sys.path.insert(0, p)


def _source():
    with open(_ROUTES, encoding='utf-8') as fh:
        return fh.read()


def test_callback_never_writes_ciphertext_to_the_column():
    """The regression itself: no _encrypt_eid result may reach a write."""
    src = _source()
    # the encrypt helper may still be DEFINED, but must not be CALLED
    calls = re.findall(r'^(?!def ).*_encrypt_eid\s*\(', src, re.M)
    assert not calls, f'_encrypt_eid is called again — the column would go mixed-format: {calls}'


def test_the_value_written_is_plaintext_and_validated():
    """What goes in is the stripped, validated EID — the same form the importers
    write and match on."""
    src = _source()
    assert "eid_for_enc_column = strip_eid_hyphens(raw_eid) if raw_eid and is_valid_eid(raw_eid) else ''" in src, \
        'the column must be written with the stripped, validated plaintext EID'


def test_importer_lookup_shape_still_matches_what_we_write():
    """Pin the coupling: the importer keys its dedup dict on this column's raw
    value and compares it to a plaintext EID. If either side changes format,
    onboarded candidates silently stop being updated."""
    importer = os.path.join(_backend, 'scripts', 'import_crm_master.py')
    with open(importer, encoding='utf-8') as fh:
        src = fh.read()
    assert 'SELECT emirates_id_enc, id FROM users WHERE emirates_id_enc IS NOT NULL' in src
    assert 'if eid not in existing:' in src, \
        'importer no longer matches by plaintext EID — re-check P2 in the finding'


def test_invalid_or_missing_eid_writes_nothing():
    """An absent or malformed EID must not write a junk value; the SQL uses
    COALESCE(NULLIF(%s,''), ...) so an empty string leaves the column alone."""
    try:
        from backend.routes.uaepass_routes import is_valid_eid, strip_eid_hyphens
    except ImportError:  # pragma: no cover
        from routes.uaepass_routes import is_valid_eid, strip_eid_hyphens
    for bad in ('', 'not-an-eid', '123'):
        value = strip_eid_hyphens(bad) if bad and is_valid_eid(bad) else ''
        assert value == '', f'{bad!r} should write nothing, got {value!r}'


def test_valid_eid_is_stripped_to_the_importer_format():
    try:
        from backend.routes.uaepass_routes import is_valid_eid, strip_eid_hyphens
    except ImportError:  # pragma: no cover
        from routes.uaepass_routes import is_valid_eid, strip_eid_hyphens
    hyphenated = '784-1234-1234567-1'
    if is_valid_eid(hyphenated):
        out = strip_eid_hyphens(hyphenated)
        assert out.isdigit() and len(out) == 15, f'expected 15 plain digits, got {out!r}'
