#!/usr/bin/env python3
"""
LLM benchmark — stage 2: replay the bundle against any OpenAI-compatible endpoint.

Standard library only, so it runs on the GPU node against localhost with no
platform code, no venv and no database:

    python3 run.py --cases cases.jsonl --base-url http://127.0.0.1:8010/v1 \
        --model Qwen/Qwen3.8-27B-FP8 --label q38-27b --out results.q38-27b.jsonl

Sends exactly what qwen_client sent (messages, temperature, response_format,
max_tokens) and applies the same JSON extraction, so an outcome of
invalid_json here means the platform would have retried.

--concurrency N replays N cases at once: use 1 for latency, 8 for throughput.
--no-think adds vLLM's chat_template_kwargs {"enable_thinking": false} — a
Qwen3 model left in thinking mode spends its whole max_tokens budget thinking
and returns no JSON, which is a real finding, not a harness fault; run both.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor


def extract_json(text):
    """Same rules as backend/services/qwen_client._extract_json (kept in step by a test)."""
    text = (text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()
    try:
        result = json.loads(text)
        if isinstance(result, dict):
            return result
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass
    return None


def post(url, body, api_key, timeout):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    })
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8")), int((time.time() - t0) * 1000)
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode("utf-8")[:800]
        except Exception:
            detail = ""
        return e.code, {"error": detail}, int((time.time() - t0) * 1000)


def build_body(case, model, no_think, extra):
    rq = case["request"]
    body = {
        "model": model,
        "messages": rq["messages"],
        "temperature": rq.get("temperature"),
        "max_tokens": rq.get("max_tokens") or 4096,
    }
    if rq.get("response_format"):
        body["response_format"] = rq["response_format"]
    if no_think:
        body["chat_template_kwargs"] = {"enable_thinking": False}
    if extra:
        body.update(extra)
    return body


def replay(case, args, rep):
    body = build_body(case, args.model, args.no_think, args.extra)
    status, resp, latency_ms = post(args.base_url.rstrip("/") + "/chat/completions", body, args.api_key, args.timeout)
    row = {"case_id": case["case_id"], "label": args.label, "model": args.model, "rep": rep,
           "http_status": status, "latency_ms": latency_ms}
    if status != 200:
        row.update(outcome="error", error=str(resp.get("error"))[:800])
        return row
    try:
        choice = resp["choices"][0]
        raw = choice["message"].get("content") or ""
        reasoning = choice["message"].get("reasoning_content")
    except (KeyError, IndexError, TypeError):
        row.update(outcome="error", error=f"unexpected response shape: {json.dumps(resp)[:300]}")
        return row
    usage = resp.get("usage") or {}
    parsed = extract_json(raw)
    row.update(
        outcome="ok" if parsed is not None else "invalid_json",
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=usage.get("completion_tokens"),
        finish_reason=choice.get("finish_reason"),
        output=parsed,
        raw=None if parsed is not None else raw[:4000],
        reasoning_chars=len(reasoning) if reasoning else 0,
    )
    return row


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cases", required=True)
    ap.add_argument("--base-url", required=True, help="e.g. http://127.0.0.1:8010/v1")
    ap.add_argument("--model", required=True)
    ap.add_argument("--label", required=True, help="short tag; results land in results.<label>.jsonl")
    ap.add_argument("--out", help="default: results.<label>.jsonl next to --cases")
    ap.add_argument("--api-key", default=os.environ.get("OPENAI_API_KEY") or os.environ.get("DASHSCOPE_API_KEY") or "none")
    ap.add_argument("--concurrency", type=int, default=1)
    ap.add_argument("--repeat", type=int, default=1, help="replay each case N times (variance)")
    ap.add_argument("--timeout", type=int, default=240)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--tasks", help="comma list, e.g. parse,match")
    ap.add_argument("--no-think", action="store_true")
    ap.add_argument("--extra-body", default="", help='JSON merged into every request, e.g. \'{"top_p":0.8}\'')
    ap.add_argument("--keep-proxy", action="store_true", help="by default proxy env vars are cleared: the target is internal")
    args = ap.parse_args()
    args.extra = json.loads(args.extra_body) if args.extra_body else None
    if not args.keep_proxy:
        for k in list(os.environ):
            if k.lower() in ("http_proxy", "https_proxy", "all_proxy"):
                os.environ.pop(k)
    out = args.out or os.path.join(os.path.dirname(os.path.abspath(args.cases)), f"results.{args.label}.jsonl")

    with open(args.cases, encoding="utf-8") as f:
        cases = [json.loads(line) for line in f if line.strip()]
    if args.tasks:
        keep = set(args.tasks.split(","))
        cases = [c for c in cases if c["task"] in keep]
    if args.limit:
        cases = cases[: args.limit]

    # warm-up: first request pays for graph capture / cache — do not time it
    status, resp, ms = post(args.base_url.rstrip("/") + "/chat/completions",
                            {"model": args.model, "messages": [{"role": "user", "content": "Reply with the JSON {\"ok\":true}"}],
                             "max_tokens": 32, **({"chat_template_kwargs": {"enable_thinking": False}} if args.no_think else {})},
                            args.api_key, args.timeout)
    if status != 200:
        print(f"endpoint check failed: HTTP {status} {str(resp)[:300]}", file=sys.stderr)
        sys.exit(2)
    print(f"endpoint ok ({ms} ms warm-up) — {len(cases)} cases x{args.repeat}, concurrency {args.concurrency}, label {args.label}")

    jobs = [(c, r) for r in range(args.repeat) for c in cases]
    t0 = time.time()
    done = 0
    per_task = {}
    with open(out, "w", encoding="utf-8") as fh, ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        for row in ex.map(lambda cr: replay(cr[0], args, cr[1]), jobs):
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
            fh.flush()
            done += 1
            t = row["case_id"].rsplit("-", 1)[0]
            s = per_task.setdefault(t, {"n": 0, "ok": 0, "lat": []})
            s["n"] += 1
            s["ok"] += row["outcome"] == "ok"
            s["lat"].append(row["latency_ms"])
            if done % 10 == 0 or done == len(jobs):
                print(f"  {done}/{len(jobs)}  {row['case_id']:<16} {row['outcome']:<12} {row['latency_ms']:>6} ms")
    wall = time.time() - t0
    print(f"\nwall {wall:.0f}s -> {out}")
    for t, s in sorted(per_task.items()):
        lat = sorted(s["lat"])
        print(f"  {t:<10} n={s['n']:<4} ok={s['ok']/s['n']:.0%}  p50={lat[len(lat)//2]} ms  max={lat[-1]} ms")


if __name__ == "__main__":
    main()
