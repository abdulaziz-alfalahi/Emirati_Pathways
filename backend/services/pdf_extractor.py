"""
PDF Text Extractor — Reusable Utility
Emirati Journey Platform — Qwen Migration

Standalone PDF/DOCX/TXT extraction using pdfplumber.
Designed to be imported by cv_parser.py and resume_parser.py alike.
Handles bilingual Arabic/English, multi-column layouts, and tables.
"""

import logging
import os
import re
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy imports to avoid hard failures if libraries are missing
try:
    import pdfplumber
except ImportError:
    pdfplumber = None
    logger.warning("pdfplumber not installed — PDF extraction will be unavailable")

try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None
    logger.warning("python-docx not installed — DOCX extraction will be unavailable")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_text(file_path: str) -> str:
    """Extract clean text from a PDF, DOCX, or TXT file.

    Args:
        file_path: Absolute or relative path to the document.

    Returns:
        Extracted text preserving reading order, or empty string on failure.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return _extract_docx(file_path)
    elif ext == ".txt":
        return _extract_txt(file_path)
    else:
        logger.warning(f"Unsupported file extension: {ext}")
        return ""


def extract_text_from_stream(file_stream, filename: str = "") -> str:
    """Extract text from an in-memory file stream.

    Args:
        file_stream: A file-like object (e.g. from Flask request.files).
        filename: Original filename used to detect type.

    Returns:
        Extracted text or empty string.
    """
    ext = os.path.splitext(filename)[1].lower() if filename else ".pdf"

    if ext == ".pdf":
        return _extract_pdf_stream(file_stream)
    elif ext in (".docx", ".doc"):
        return _extract_docx_stream(file_stream)
    elif ext == ".txt":
        return file_stream.read().decode("utf-8", errors="ignore")
    else:
        logger.warning(f"Unsupported stream file extension: {ext}")
        return ""


# ---------------------------------------------------------------------------
# PDF Extraction (pdfplumber)
# ---------------------------------------------------------------------------

def _extract_pdf(file_path: str) -> str:
    """Extract text from a PDF file on disk."""
    if not pdfplumber:
        logger.error("pdfplumber not available for PDF extraction")
        return ""

    try:
        with pdfplumber.open(file_path) as pdf:
            return _process_pdf_pages(pdf)
    except Exception as e:
        logger.error(f"PDF extraction error ({file_path}): {e}")
        return ""


def _extract_pdf_stream(file_stream) -> str:
    """Extract text from a PDF file stream."""
    if not pdfplumber:
        logger.error("pdfplumber not available for PDF extraction")
        return ""

    try:
        file_stream.seek(0)
        with pdfplumber.open(file_stream) as pdf:
            return _process_pdf_pages(pdf)
    except Exception as e:
        logger.error(f"PDF stream extraction error: {e}")
        return ""


def _process_pdf_pages(pdf) -> str:
    """Process all pages of an opened pdfplumber PDF object.

    Extracts body text AND tabular data for comprehensive coverage.
    """
    parts: list[str] = []

    for i, page in enumerate(pdf.pages):
        try:
            # 1. Body text (preserves multi-column reading order)
            body = page.extract_text(x_tolerance=3, y_tolerance=3)
            if body:
                parts.append(body)

            # 2. Tables — convert rows to pipe-delimited strings
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if row:
                        row_text = " | ".join(cell or "" for cell in row).strip()
                        if row_text and row_text != "|":
                            parts.append(row_text)

        except Exception as page_err:
            logger.warning(f"Error extracting page {i + 1}: {page_err}")

    text = "\n".join(parts).strip()
    text = _clean_text(text)
    logger.info(f"PDF extraction complete: {len(text)} chars from {len(pdf.pages)} pages")
    return text


# ---------------------------------------------------------------------------
# DOCX Extraction
# ---------------------------------------------------------------------------

def _extract_docx(file_path: str) -> str:
    if not DocxDocument:
        logger.error("python-docx not available for DOCX extraction")
        return ""
    try:
        doc = DocxDocument(file_path)
        return _process_docx(doc)
    except Exception as e:
        logger.error(f"DOCX extraction error ({file_path}): {e}")
        return ""


def _extract_docx_stream(file_stream) -> str:
    if not DocxDocument:
        logger.error("python-docx not available for DOCX extraction")
        return ""
    try:
        file_stream.seek(0)
        doc = DocxDocument(file_stream)
        return _process_docx(doc)
    except Exception as e:
        logger.error(f"DOCX stream extraction error: {e}")
        return ""


def _process_docx(doc) -> str:
    """Extract paragraphs and table cells from a python-docx Document."""
    parts: list[str] = []

    # Paragraphs
    for para in doc.paragraphs:
        if para.text.strip():
            parts.append(para.text)

    # Tables
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                parts.append(row_text)

    text = "\n".join(parts).strip()
    return _clean_text(text)


# ---------------------------------------------------------------------------
# TXT Extraction
# ---------------------------------------------------------------------------

def _extract_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return _clean_text(f.read())
    except Exception as e:
        logger.error(f"TXT extraction error ({file_path}): {e}")
        return ""


# ---------------------------------------------------------------------------
# Text Cleaning
# ---------------------------------------------------------------------------

# Control characters that should never appear in clean text
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def _clean_text(text: str) -> str:
    """Remove control characters and normalise whitespace."""
    text = _CONTROL_CHARS.sub("", text)
    # Collapse 3+ newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
