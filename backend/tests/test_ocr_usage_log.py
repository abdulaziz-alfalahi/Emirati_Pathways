"""OCR calls are rows in ai_usage_log, like every other model call.

Until 2026-09-06 the vision path used its own client and never recorded
anything, so OCR spend and failures were invisible on the admin AI Usage tab.
"""
import os
import sys
from types import SimpleNamespace
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.services import pdf_extractor  # noqa: E402


def _client(content='some text', usage=SimpleNamespace(prompt_tokens=1200, completion_tokens=40), raise_=None):
    client = MagicMock()
    if raise_:
        client.chat.completions.create.side_effect = raise_
    else:
        client.chat.completions.create.return_value = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=content))], usage=usage)
    return client


def test_a_successful_ocr_is_recorded_with_its_tokens(monkeypatch):
    rec = MagicMock()
    monkeypatch.setattr(pdf_extractor.ai_usage_log, 'record', rec)
    text = pdf_extractor._ocr_image_bytes(b'\x89PNG', _client(), label='page 1')
    assert text == 'some text'
    rec.assert_called_once()
    kw = rec.call_args.kwargs
    assert kw['task_type'] == 'ocr' and kw['outcome'] == 'ok'
    assert kw['prompt_tokens'] == 1200 and kw['completion_tokens'] == 40
    assert kw['model'] == pdf_extractor.QWEN_VISION_MODEL if hasattr(pdf_extractor, 'QWEN_VISION_MODEL') else kw['model']
    assert isinstance(kw['latency_ms'], int) and kw['latency_ms'] >= 0


def test_a_failed_ocr_is_recorded_as_an_error_and_degrades_to_empty(monkeypatch):
    rec = MagicMock()
    monkeypatch.setattr(pdf_extractor.ai_usage_log, 'record', rec)
    text = pdf_extractor._ocr_image_bytes(b'\x89PNG', _client(raise_=RuntimeError('boom')), label='page 2')
    assert text == ''
    kw = rec.call_args.kwargs
    assert kw['task_type'] == 'ocr' and kw['outcome'] == 'error'
    assert kw['prompt_tokens'] == 0 and kw['completion_tokens'] == 0


def test_a_response_without_usage_still_records(monkeypatch):
    rec = MagicMock()
    monkeypatch.setattr(pdf_extractor.ai_usage_log, 'record', rec)
    pdf_extractor._ocr_image_bytes(b'\x89PNG', _client(usage=None), label='page 3')
    kw = rec.call_args.kwargs
    assert kw['outcome'] == 'ok' and kw['prompt_tokens'] == 0 and kw['completion_tokens'] == 0


def test_logging_failure_never_fails_the_ocr(monkeypatch):
    monkeypatch.setattr(pdf_extractor.ai_usage_log, 'record', MagicMock(side_effect=RuntimeError('db down')))
    assert pdf_extractor._ocr_image_bytes(b'\x89PNG', _client(content='still fine'), label='page 4') == 'still fine'
