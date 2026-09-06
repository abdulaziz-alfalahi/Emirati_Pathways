"""LLM benchmark harness — see docs/llm_bench_runbook.md.

collect.py  (APPDEV, needs DB + DashScope)  real rows -> real prompts -> bundle + DashScope baseline
run.py      (anywhere, stdlib only)          bundle -> any OpenAI-compatible endpoint -> results
score.py    (anywhere, stdlib only)          results vs baseline -> report
"""
