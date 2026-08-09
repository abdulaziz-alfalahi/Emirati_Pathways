"""Robust decoding for operator-uploaded CSVs, and detection of text that a
spreadsheet already destroyed before upload.

WHY (found 2026-08-09 during the onboarding E2E): the company/vacancy importer
did `raw.decode('utf-8')` — bare and strict. Two failure modes, both live:

  A. A CSV exported from Excel on Windows with Arabic in it is normally **cp1256**
     (Arabic Windows). `.decode('utf-8')` raises UnicodeDecodeError, so the WHOLE
     import fails and not a single row lands. For the Employer Relations operator
     uploading NAFIS vacancy lists, that is a hard stop.

  B. If the operator instead saved as plain "CSV (Comma delimited)", Excel itself
     replaces every character it cannot represent with a literal '?' (0x3F)
     BEFORE the file ever reaches us. That file decodes as clean UTF-8, so the
     importer stored '???? ???????' as though it were a company's real name.
     One of the 187 companies on staging is exactly this, and the original
     Arabic is unrecoverable from the database.

(A) is fixed by trying the encodings that actually occur, in order.
(B) cannot be fixed by decoding — the characters are already gone. It can only be
DETECTED and reported, so the operator re-exports as "CSV UTF-8" instead of
having silent garbage committed under a real company's identity.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Order matters. The strict codecs are tried first; cp1256/cp1252/latin-1 will
# decode ANY byte sequence without raising, so they can only ever be fallbacks.
# cp1256 (Arabic Windows) outranks cp1252 deliberately: this platform's non-UTF-8
# uploads are far more likely to be Arabic than Western European.
_CANDIDATE_ENCODINGS = ('utf-8-sig', 'utf-8', 'cp1256', 'cp1252', 'latin-1')

# Three or more consecutive '?' is not natural language in any script.
_QUESTION_RUN = re.compile(r'\?{3,}')


def decode_csv_bytes(raw):
    """Decode uploaded CSV bytes. Returns (text, encoding_used).

    Never raises on a decodable-as-anything file: latin-1 is the last resort and
    accepts every byte. The encoding actually used is returned (and logged) so a
    non-UTF-8 upload is visible rather than silent.
    """
    if not isinstance(raw, (bytes, bytearray)):
        return raw, 'str'
    for enc in _CANDIDATE_ENCODINGS:
        try:
            text = bytes(raw).decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
        if enc not in ('utf-8-sig', 'utf-8'):
            logger.warning(
                "CSV upload was not UTF-8; decoded as %s. Ask the operator to "
                "export as 'CSV UTF-8' so Arabic survives reliably.", enc)
        return text, enc
    # Unreachable in practice (latin-1 accepts anything), but never crash here.
    return bytes(raw).decode('utf-8', errors='replace'), 'utf-8/replace'


def looks_encoding_mangled(value):
    """True when text has already lost characters to a codec that couldn't hold them.

    Detects what a spreadsheet does BEFORE upload, which no amount of careful
    decoding on our side can undo:
      • U+FFFD, the Unicode replacement character
      • a run of 3+ literal '?'
      • a short string that is mostly '?'

    Deliberately conservative: a single '?' (a company could legitimately have
    one) is not enough, so ordinary punctuation is never flagged.
    """
    if value is None:
        return False
    s = str(value)
    if '�' in s:
        return True
    if _QUESTION_RUN.search(s):
        return True
    visible = [c for c in s if not c.isspace()]
    if len(visible) >= 4:
        if sum(1 for c in visible if c == '?') / len(visible) > 0.3:
            return True
    return False
