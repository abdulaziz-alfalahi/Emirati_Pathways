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
    import fitz as pymupdf  # PyMuPDF — fallback for image-heavy PDFs
except ImportError:
    pymupdf = None
    logger.warning("PyMuPDF not installed — fallback PDF extraction unavailable")

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
    """Extract text from a PDF file on disk.

    Strategy:
    1. Try pdfplumber (best for selectable-text PDFs)
    2. If empty, try PyMuPDF/fitz (handles more embedded fonts)
    3. If still empty, use Qwen Vision OCR (scanned/image-based PDFs)
    """
    text = ""

    # Strategy 1: pdfplumber
    if pdfplumber:
        try:
            with pdfplumber.open(file_path) as pdf:
                text = _process_pdf_pages(pdf)
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed ({file_path}): {e}")

    # Strategy 2: PyMuPDF fallback (handles embedded fonts)
    if len(text.strip()) < 50 and pymupdf:
        logger.info(f"pdfplumber returned {len(text)} chars — trying PyMuPDF fallback")
        try:
            text = _extract_pdf_pymupdf(file_path)
        except Exception as e:
            logger.warning(f"PyMuPDF extraction also failed ({file_path}): {e}")

    # Strategy 3: Vision OCR via Qwen (scanned/image-based PDFs)
    if len(text.strip()) < 50 and pymupdf:
        logger.info(f"Text extraction returned {len(text)} chars — trying Vision OCR")
        try:
            text = _extract_pdf_vision_ocr(file_path)
        except Exception as e:
            logger.warning(f"Vision OCR extraction failed ({file_path}): {e}")

    if not text.strip():
        logger.error(f"All PDF extraction strategies returned empty for {file_path}")

    return text


def _extract_pdf_stream(file_stream) -> str:
    """Extract text from a PDF file stream."""
    text = ""

    # Strategy 1: pdfplumber
    if pdfplumber:
        try:
            file_stream.seek(0)
            with pdfplumber.open(file_stream) as pdf:
                text = _process_pdf_pages(pdf)
        except Exception as e:
            logger.warning(f"pdfplumber stream extraction failed: {e}")

    # Strategy 2: PyMuPDF fallback
    if len(text.strip()) < 50 and pymupdf:
        logger.info(f"pdfplumber stream returned {len(text)} chars — trying PyMuPDF")
        try:
            file_stream.seek(0)
            data = file_stream.read()
            doc = pymupdf.open(stream=data, filetype="pdf")
            parts = []
            for page in doc:
                page_text = page.get_text("text")
                if page_text:
                    parts.append(page_text)
            doc.close()
            text = _clean_text("\n".join(parts))
        except Exception as e:
            logger.warning(f"PyMuPDF stream extraction also failed: {e}")

    return text


def _extract_pdf_pymupdf(file_path: str) -> str:
    """Fallback PDF extraction using PyMuPDF (fitz).

    PyMuPDF handles embedded fonts, Type3 fonts, and some image-based
    content better than pdfplumber. It's also faster for large PDFs.
    """
    doc = pymupdf.open(file_path)
    parts: list[str] = []

    for page in doc:
        # get_text("text") extracts in reading order
        page_text = page.get_text("text")
        if page_text and page_text.strip():
            parts.append(page_text)

    page_count = len(doc)
    doc.close()
    text = "\n".join(parts).strip()
    text = _clean_text(text)
    logger.info(f"PyMuPDF extraction: {len(text)} chars from {page_count} pages")
    return text


def _extract_pdf_vision_ocr(file_path: str, max_pages: int = 5) -> str:
    """Extract text from a scanned/image-based PDF using Qwen Vision OCR.

    Converts PDF pages to images via PyMuPDF, then sends them to
    DashScope's qwen-vl-ocr model for AI-powered OCR.

    Args:
        file_path: Path to the PDF file.
        max_pages: Maximum number of pages to OCR (cost control).

    Returns:
        Extracted text from all processed pages.
    """
    import base64
    import os

    api_key = os.getenv("DASHSCOPE_API_KEY")
    base_url = os.getenv("QWEN_BASE_URL", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")

    if not api_key:
        logger.warning("DASHSCOPE_API_KEY not set — Vision OCR unavailable")
        return ""

    try:
        from openai import OpenAI
    except ImportError:
        logger.warning("openai package not installed — Vision OCR unavailable")
        return ""

    # Convert PDF pages to PNG images
    doc = pymupdf.open(file_path)
    page_count = min(len(doc), max_pages)
    all_text_parts: list[str] = []

    client = OpenAI(api_key=api_key, base_url=base_url)

    for i in range(page_count):
        page = doc[i]
        # Render page at 200 DPI for good OCR quality
        mat = pymupdf.Matrix(200 / 72, 200 / 72)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        b64_img = base64.b64encode(img_bytes).decode("utf-8")

        logger.info(f"Vision OCR: processing page {i + 1}/{page_count} ({len(img_bytes)} bytes)")

        try:
            response = client.chat.completions.create(
                model="qwen-vl-ocr",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{b64_img}"},
                                "min_pixels": 28 * 28 * 4,
                                "max_pixels": 1280 * 784,
                            },
                            {
                                "type": "text",
                                "text": "Read all the text in this image. Output the raw text only, preserving layout. Include Arabic text as-is.",
                            },
                        ],
                    }
                ],
            )
            page_text = response.choices[0].message.content
            if page_text and page_text.strip():
                all_text_parts.append(page_text.strip())
                logger.info(f"Vision OCR page {i + 1}: {len(page_text)} chars extracted")
        except Exception as ocr_err:
            logger.warning(f"Vision OCR page {i + 1} failed: {ocr_err}")

    doc.close()

    text = "\n\n".join(all_text_parts)
    text = _clean_text(text)
    logger.info(f"Vision OCR total: {len(text)} chars from {page_count} pages")
    return text

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
