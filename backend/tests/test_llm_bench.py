"""The LLM benchmark harness (backend/scripts/llm_bench) — DB-free checks.

run.py and score.py are standard-library only so they can run on the GPU node;
they are loaded here by path. collect.py is deliberately NOT imported: it loads
backend/.env and opens the live database on purpose.
"""
import importlib.util
import os

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
BENCH = os.path.join(HERE, "..", "scripts", "llm_bench")


def _load(name):
    spec = importlib.util.spec_from_file_location(f"llm_bench_{name}", os.path.join(BENCH, f"{name}.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


run = _load("run")
score = _load("score")


@pytest.mark.parametrize("raw", [
    '{"a": 1}',
    '```json\n{"a": 1}\n```',
    'Sure, here it is:\n{"a": {"b": [1, 2]}} thanks',
    '[1, 2, 3]',
    'not json at all',
    '',
])
def test_extract_json_matches_qwen_client(raw):
    """run.py must reject and accept exactly what the platform does."""
    try:
        from backend.services.qwen_client import _extract_json
    except ImportError:
        from services.qwen_client import _extract_json
    assert run.extract_json(raw) == _extract_json(raw)


def test_build_body_sends_what_the_platform_sent():
    case = {"case_id": "parse-0001", "request": {
        "messages": [{"role": "user", "content": "x"}], "temperature": 0.1,
        "response_format": {"type": "json_object"}, "max_tokens": 4096}}
    body = run.build_body(case, "m", no_think=True, extra={"top_p": 0.8})
    assert body["model"] == "m"
    assert body["temperature"] == 0.1
    assert body["response_format"] == {"type": "json_object"}
    assert body["chat_template_kwargs"] == {"enable_thinking": False}
    assert body["top_p"] == 0.8
    plain = run.build_body(case, "m", no_think=False, extra=None)
    assert "chat_template_kwargs" not in plain


def test_score_helpers():
    assert score.jaccard(["a", "b"], ["b", "c"]) == pytest.approx(1 / 3)
    assert score.jaccard([], []) == 1.0
    assert score.flatten_numeric({"s": 80, "b": {"x": 1.5, "flag": True, "deep": {"y": 2}}, "t": "no"}) == \
        {"s": 80.0, "b.x": 1.5, "b.deep.y": 2.0}
    assert score.percentile([10, 20, 30, 40], 0.5) == 25
    assert score.percentile([], 0.5) is None
    assert score.has_arabic({"k": "مرحبا"}) and not score.has_arabic({"k": "hello"})


def test_score_aggregates_against_baseline():
    cases = [
        {"case_id": "match-0000", "task": "match", "synthetic": False, "has_arabic_input": False},
        {"case_id": "match-0001", "task": "match", "synthetic": True, "has_arabic_input": True},
    ]
    baseline = {
        "match-0000": {"outcome": "ok", "latency_ms": 1000, "completion_tokens": 100, "output": {"score": 80, "fit": "good"}},
        "match-0001": {"outcome": "ok", "latency_ms": 1200, "completion_tokens": 120, "output": {"score": 60, "fit": "ok"}},
    }
    cand = {
        "match-0000": {"outcome": "ok", "latency_ms": 500, "completion_tokens": 100, "output": {"score": 70, "fit": "good"}},
        "match-0001": {"outcome": "invalid_json", "latency_ms": 900, "completion_tokens": 50, "output": None},
    }
    summary, worst = score.score(cases, baseline, {"cand": cand})
    real = summary["cand"]["match/real"]
    assert real["n"] == 1 and real["ok"] == 1.0
    assert real["key_jaccard"] == 1.0
    assert real["numeric_mad"] == 10.0
    assert real["tokens_per_s"] == 200.0
    syn = summary["cand"]["match/synthetic"]
    assert syn["invalid_json"] == 1.0 and syn["arabic_in"] == 1 and syn["arabic_out_rate"] == 0.0
    assert worst["cand"][0][1] == "match-0000" and worst["cand"][0][2] == "score"
    assert "match/real" in summary["dashscope"]
    report = score.render(summary, worst, {})
    assert "| cand |" in report and "match-0000" in report
