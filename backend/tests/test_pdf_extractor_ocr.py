"""Document extraction reaches OCR from every entry point.

Two gaps found 2026-08-15 while comparing OCR models, both of which returned
an empty string with no OCR attempted:

  1. Images were refused at the extension check. `extract_text()` handled
     .pdf/.docx/.txt and logged "Unsupported file extension" for everything
     else — so a photographed certificate, the commonest scan we receive,
     never reached any OCR engine.

  2. `_extract_pdf_stream` ran two of the three strategies its file-path twin
     ran. A scanned PDF through the stream entry point returned "" silently.
     `parse_resume_from_stream` is the function that reaches it. It was
     imported into enhanced_cv_routes.py but never called, so the gap was
     latent rather than live; that unused import has since been removed. The
     function itself remains a working part of resume_parser's public API,
     which is why these tests still cover the stream path.

Both are about a caller's choice of entry point deciding whether OCR happens
at all, which is exactly the kind of drift nothing else notices. These tests
pin the symmetry.

No network: the OCR client is stubbed. What is under test is the routing --
whether the OCR path is reached -- not the accuracy of the model behind it.
"""
import io
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import pdf_extractor  # noqa: E402


class _StubResponse:
    def __init__(self, text):
        self.choices = [type('C', (), {'message': type('M', (), {'content': text})()})()]


class _StubClient:
    """Records every OCR call instead of making one."""

    def __init__(self, text='ARABIC TEXT شهادة'):
        self.calls = []
        self._text = text
        self.chat = type('Chat', (), {'completions': self})()

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return _StubResponse(self._text)


@pytest.fixture
def stub_ocr(monkeypatch):
    client = _StubClient()
    monkeypatch.setattr(pdf_extractor, '_ocr_client', lambda: client)
    return client


def _blank_pdf_bytes(pages=1):
    """A PDF with no extractable text — the shape that must fall through to OCR."""
    pymupdf = pytest.importorskip('fitz')
    doc = pymupdf.open()
    for _ in range(pages):
        doc.new_page()
    data = doc.tobytes()
    doc.close()
    return data


def _png_bytes():
    pymupdf = pytest.importorskip('fitz')
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 40, 40))
    pix.clear_with(255)
    return pix.tobytes('png')


# ── Gap 1: images reach OCR ──────────────────────────────────────────────────

def test_image_extensions_are_accepted_not_refused(tmp_path, stub_ocr):
    """The regression: .jpg returned "" at the extension check."""
    path = tmp_path / 'certificate.png'
    path.write_bytes(_png_bytes())

    text = pdf_extractor.extract_text(str(path))

    assert stub_ocr.calls, 'no OCR was attempted for an image file'
    assert 'شهادة' in text


def test_every_declared_image_extension_routes_to_ocr(tmp_path, stub_ocr):
    """IMAGE_EXTENSIONS is the contract — each entry must actually be handled."""
    for ext in pdf_extractor.IMAGE_EXTENSIONS:
        stub_ocr.calls.clear()
        path = tmp_path / f'scan{ext}'
        path.write_bytes(_png_bytes())
        pdf_extractor.extract_text(str(path))
        assert stub_ocr.calls, f'{ext} is declared supported but reached no OCR'


def test_image_stream_reaches_ocr(stub_ocr):
    stream = io.BytesIO(_png_bytes())
    text = pdf_extractor.extract_text_from_stream(stream, 'photo.jpg')

    assert stub_ocr.calls, 'no OCR was attempted for an image stream'
    assert 'شهادة' in text


def test_mime_type_matches_the_extension(stub_ocr):
    """A wrong MIME in the data URL is rejected upstream, not by us.

    Only asserted for a format PyMuPDF may decline to normalise; when it does
    normalise, the payload genuinely is a PNG.
    """
    pdf_extractor._extract_image_bytes(b'not-a-real-image', 'scan.jpeg')
    url = stub_ocr.calls[0]['messages'][0]['content'][0]['image_url']['url']
    assert url.startswith('data:image/jpeg;base64,')


def test_mime_map_and_extension_list_cannot_drift():
    assert set(pdf_extractor.IMAGE_EXTENSIONS) == set(pdf_extractor.IMAGE_MIME_TYPES)


def test_genuinely_unsupported_extension_still_refused():
    # The fix widens what is accepted; it must not accept everything.
    assert pdf_extractor.extract_text('resume.xyz') == ''


# ── Gap 2: the stream path runs all three strategies ─────────────────────────

def test_scanned_pdf_stream_falls_through_to_ocr(stub_ocr):
    """The regression: this returned "" after two strategies."""
    stream = io.BytesIO(_blank_pdf_bytes())

    text = pdf_extractor.extract_text_from_stream(stream, 'scanned.pdf')

    assert stub_ocr.calls, 'stream path stopped before Vision OCR'
    assert 'شهادة' in text


def test_both_pdf_entry_points_reach_ocr_alike(tmp_path, stub_ocr):
    """The two functions must stay in step — that is what drifted."""
    data = _blank_pdf_bytes()
    path = tmp_path / 'scanned.pdf'
    path.write_bytes(data)

    from_path = pdf_extractor.extract_text(str(path))
    calls_via_path = len(stub_ocr.calls)

    stub_ocr.calls.clear()
    from_stream = pdf_extractor.extract_text_from_stream(io.BytesIO(data), 'scanned.pdf')
    calls_via_stream = len(stub_ocr.calls)

    assert from_path == from_stream
    assert calls_via_path == calls_via_stream == 1


def test_page_cap_is_honoured_on_both_paths(tmp_path, stub_ocr):
    """OCR_MAX_PAGES is a spend cap against a paid endpoint."""
    data = _blank_pdf_bytes(pages=pdf_extractor.OCR_MAX_PAGES + 3)

    pdf_extractor.extract_text_from_stream(io.BytesIO(data), 'long.pdf')
    assert len(stub_ocr.calls) == pdf_extractor.OCR_MAX_PAGES


# ── Degradation ──────────────────────────────────────────────────────────────

def test_missing_api_key_degrades_to_empty_not_an_exception(tmp_path, monkeypatch):
    """OCR is a fallback. An absent key must not break an upload."""
    monkeypatch.setattr(pdf_extractor, '_ocr_client', lambda: None)
    path = tmp_path / 'certificate.png'
    path.write_bytes(_png_bytes())

    assert pdf_extractor.extract_text(str(path)) == ''


def test_unreadable_image_file_returns_empty(tmp_path, stub_ocr):
    assert pdf_extractor.extract_text(str(tmp_path / 'absent.png')) == ''
    assert not stub_ocr.calls


# ── The layers must agree ────────────────────────────────────────────────────

def test_upload_route_accepts_every_format_the_extractor_can_read():
    """The gap was three layers deep, and fixing one of them changes nothing.

    The picker offers a type, the route admits it, the extractor reads it. A
    format accepted by the route but unreadable by the extractor produces a
    confusing empty parse; one the extractor reads but the route refuses is
    dead capability — which is exactly what images were.
    """
    from routes.enhanced_cv_routes import ALLOWED_EXTENSIONS

    extractor_images = {e.lstrip('.') for e in pdf_extractor.IMAGE_EXTENSIONS}
    assert extractor_images <= ALLOWED_EXTENSIONS, (
        f'the extractor can OCR {sorted(extractor_images - ALLOWED_EXTENSIONS)} '
        f'but the upload route refuses them'
    )


def test_every_accepted_image_type_has_a_magic_signature():
    """A type admitted with no signature entry is waved through unvalidated."""
    from routes.enhanced_cv_routes import _FILE_SIGNATURES

    for ext in pdf_extractor.IMAGE_EXTENSIONS:
        key = ext.lstrip('.')
        assert _FILE_SIGNATURES.get(key), f'.{key} is accepted but has no signature check'


def test_signatures_validate_real_and_reject_mismatched_content():
    from routes.enhanced_cv_routes import validate_file_content

    ok, _ = validate_file_content(io.BytesIO(_png_bytes()), 'scan.png')
    assert ok

    # A PDF renamed to .png must not pass as an image.
    bad, reason = validate_file_content(io.BytesIO(b'%PDF-1.4 ...'), 'scan.png')
    assert not bad and 'png' in reason


def test_tiff_accepts_both_byte_orders():
    """bytes.startswith takes a tuple — the reason a tuple value works here."""
    from routes.enhanced_cv_routes import validate_file_content

    for header in (b'II*\x00', b'MM\x00*'):
        ok, _ = validate_file_content(io.BytesIO(header + b'rest'), 'scan.tiff')
        assert ok, f'{header!r} rejected'


def test_ocr_api_failure_returns_empty_not_an_exception(monkeypatch, tmp_path):
    class _Failing(_StubClient):
        def create(self, **kwargs):
            raise RuntimeError('DashScope 429')

    monkeypatch.setattr(pdf_extractor, '_ocr_client', lambda: _Failing())
    path = tmp_path / 'certificate.png'
    path.write_bytes(_png_bytes())

    assert pdf_extractor.extract_text(str(path)) == ''
