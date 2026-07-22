#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Integrity guard (#26): randomness must not feed anything presented as
authoritative — "verified", "on-chain"/blockchain, or "compliance".

A government platform must never surface fabricated data as genuine. This
scans the backend (and the frontend blockchain service) for random-number
generators near authority-claiming vocabulary, and pins that the simulated
blockchain endpoints label themselves.
"""

import os
import re
import sys

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

_FRONTEND = os.path.join(_root_dir, 'frontend', 'src')

# Authority-CLAIM vocabulary that must never be backed by a random number.
# Deliberately the issue's terms (verified / on-chain / compliance) plus
# blockchain/attest — NOT broad domain nouns like "emiratization", which
# legitimately appear in real computations and clearly-scoped demo seeders.
_AUTHORITY = re.compile(r'verified|on[-_ ]?chain|blockchain|compliance|attest', re.I)
_PY_RANDOM = re.compile(r'\brandom\.(uniform|random|randint|choice)\b')
_JS_RANDOM = re.compile(r'\bMath\.random\b')


def _iter_files(root, exts):
    for dirpath, _dirs, files in os.walk(root):
        if any(skip in dirpath for skip in ('archived_development_files', 'archives',
                                            'node_modules', '__pycache__', '/tests')):
            continue
        for f in files:
            if f.endswith(exts):
                yield os.path.join(dirpath, f)


def _offenders(root, exts, random_re):
    """Flag a random-gen call within 3 lines of authority vocabulary."""
    hits = []
    for path in _iter_files(root, exts):
        try:
            lines = open(path, encoding='utf-8', errors='replace').read().splitlines()
        except Exception:
            continue
        rand_lines = [i for i, l in enumerate(lines) if random_re.search(l)]
        for i in rand_lines:
            window = '\n'.join(lines[max(0, i - 3): i + 4])
            if _AUTHORITY.search(window):
                rel = os.path.relpath(path, _root_dir)
                hits.append(f"{rel}:{i+1}: {lines[i].strip()[:90]}")
    return hits


def test_backend_no_randomness_behind_authority():
    hits = _offenders(_backend_dir, ('.py',), _PY_RANDOM)
    assert hits == [], (
        "randomness near authority vocabulary (verified/on-chain/compliance) — "
        "fabricated-as-real risk (#26):\n" + "\n".join(hits))


def test_frontend_blockchain_service_no_math_random():
    svc_dir = os.path.join(_FRONTEND, 'services', 'blockchain')
    if not os.path.isdir(svc_dir):
        pytest.skip("frontend blockchain service not present")
    hits = _offenders(svc_dir, ('.ts', '.tsx'), _JS_RANDOM)
    assert hits == [], (
        "Math.random in the blockchain service fabricates on-chain data (#26):\n"
        + "\n".join(hits))


def test_blockchain_endpoints_declare_simulated():
    src = open(os.path.join(_backend_dir, 'education_api_routes.py'), encoding='utf-8').read()
    # Both endpoints must return the simulated marker + disclaimer.
    assert src.count("'simulated': True") >= 2 or src.count('"simulated": True') >= 2
    assert '_BLOCKCHAIN_DISCLAIMER' in src
    assert 'not a real blockchain' in src.lower()
