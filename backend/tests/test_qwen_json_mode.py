#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Qwen JSON-mode guard + fail-fast (issue #127).

DashScope compatible-mode 400s on response_format=json_object unless the
messages contain the word "json". chat_completion must inject that nudge
so the AI match layer works, and must not retry a deterministic 4xx.
"""

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

import backend.services.qwen_client as qc


def _mock_client(capture):
    client = MagicMock()

    def create(**kwargs):
        capture.append(kwargs)
        resp = MagicMock()
        resp.choices = [MagicMock()]
        resp.choices[0].message.content = '{"ok": 1}'
        resp.usage = MagicMock(prompt_tokens=10, completion_tokens=5)
        return resp

    client.chat.completions.create.side_effect = create
    return client


def test_injects_json_nudge_when_absent():
    capture = []
    with patch.object(qc, '_get_client', return_value=_mock_client(capture)):
        qc.chat_completion('match',
                           [{'role': 'user', 'content': 'score this candidate'}],
                           response_format={'type': 'json_object'})
    sent = capture[0]['messages']
    assert any('json' in (m.get('content') or '').lower() for m in sent), \
        "no message contains 'json' — DashScope would 400"


def test_does_not_double_inject_when_present():
    capture = []
    with patch.object(qc, '_get_client', return_value=_mock_client(capture)):
        qc.chat_completion('match',
                           [{'role': 'user', 'content': 'reply as json please'}],
                           response_format={'type': 'json_object'})
    sent = capture[0]['messages']
    assert len(sent) == 1  # nudge not prepended


def test_non_json_format_not_touched():
    capture = []
    with patch.object(qc, '_get_client', return_value=_mock_client(capture)):
        qc.chat_completion('match',
                           [{'role': 'user', 'content': 'freeform'}],
                           response_format={'type': 'text'})
    sent = capture[0]['messages']
    assert len(sent) == 1


def test_4xx_fails_fast_without_retries():
    from openai import APIError
    client = MagicMock()
    err = APIError('bad request', request=MagicMock(), body=None)
    err.status_code = 400
    client.chat.completions.create.side_effect = err
    with patch.object(qc, '_get_client', return_value=client):
        with pytest.raises(qc.QwenClientError):
            qc.chat_completion('match', [{'role': 'user', 'content': 'x with json'}],
                               response_format={'type': 'json_object'}, max_retries=3)
    # One attempt only — deterministic 400 must not retry.
    assert client.chat.completions.create.call_count == 1
