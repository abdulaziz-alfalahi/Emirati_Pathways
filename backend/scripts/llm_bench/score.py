#!/usr/bin/env python3
"""
LLM benchmark — stage 3: score candidate results against the DashScope baseline.

    python3 score.py --bundle ~/llm_bench --candidates q38-27b,q36-35b-a3b

Reads cases.jsonl, results.dashscope.jsonl and results.<label>.jsonl for each
candidate; writes report.md and summary.json into the bundle.

What is measured, per task and per engine:
  validity   ok / invalid_json / error rates — the platform retries invalid
             JSON up to 3 times, so this is the first gate
  latency    p50 / p95 / mean, and completion tokens per second
  shape      Jaccard overlap of top-level keys with the baseline's answer —
             does the model return the schema the caller reads?
  numbers    mean absolute difference on numeric fields both answers share
             (scores out of 100, 1-10 ratings), plus the worst cases by name
  arabic     for cases whose input contains Arabic: does the output? — the
             cheap test for "answered in the wrong language"
Real and synthetic cases are reported separately. Nothing here judges prose
quality; that needs a human reading the worst-case list.
"""
import argparse
import json
import os
import re
from collections import defaultdict

ARABIC = re.compile(r"[؀-ۿ]")


def load_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def percentile(values, p):
    if not values:
        return None
    s = sorted(values)
    k = (len(s) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(s) - 1)
    return round(s[lo] + (s[hi] - s[lo]) * (k - lo))


def jaccard(a, b):
    a, b = set(a or ()), set(b or ())
    if not a and not b:
        return 1.0
    return len(a & b) / len(a | b)


def flatten_numeric(d, prefix="", depth=2):
    """{path: number} for numeric leaves up to `depth` levels down (bools excluded)."""
    out = {}
    if not isinstance(d, dict) or depth < 0:
        return out
    for k, v in d.items():
        p = f"{prefix}{k}"
        if isinstance(v, bool):
            continue
        if isinstance(v, (int, float)):
            out[p] = float(v)
        elif isinstance(v, dict):
            out.update(flatten_numeric(v, p + ".", depth - 1))
    return out


def has_arabic(obj):
    return bool(ARABIC.search(json.dumps(obj, ensure_ascii=False))) if obj is not None else False


class Agg:
    def __init__(self):
        self.n = 0
        self.ok = 0
        self.invalid = 0
        self.error = 0
        self.lat = []
        self.ctok = []
        self.tps = []
        self.key_j = []
        self.num_diffs = []
        self.ar_in = 0
        self.ar_out = 0
        self.worst = []

    def add(self, case, row, base):
        self.n += 1
        oc = row.get("outcome")
        if oc == "ok":
            self.ok += 1
        elif oc == "invalid_json":
            self.invalid += 1
        else:
            self.error += 1
        if row.get("latency_ms") is not None and oc != "error":
            self.lat.append(row["latency_ms"])
        ct = row.get("completion_tokens")
        if ct and row.get("latency_ms"):
            self.ctok.append(ct)
            self.tps.append(ct * 1000.0 / row["latency_ms"])
        out = row.get("output")
        if case.get("has_arabic_input"):
            self.ar_in += 1
            self.ar_out += has_arabic(out)
        bout = (base or {}).get("output")
        if isinstance(out, dict) and isinstance(bout, dict):
            self.key_j.append(jaccard(out.keys(), bout.keys()))
            a, b = flatten_numeric(out), flatten_numeric(bout)
            shared = set(a) & set(b)
            if shared:
                diffs = {k: abs(a[k] - b[k]) for k in shared}
                mean = sum(diffs.values()) / len(diffs)
                self.num_diffs.append(mean)
                worst_k = max(diffs, key=diffs.get)
                self.worst.append((diffs[worst_k], case["case_id"], worst_k, b[worst_k], a[worst_k]))

    def row(self):
        n = max(self.n, 1)
        return {
            "n": self.n, "ok": self.ok / n, "invalid_json": self.invalid / n, "error": self.error / n,
            "p50_ms": percentile(self.lat, 0.5), "p95_ms": percentile(self.lat, 0.95),
            "mean_ms": round(sum(self.lat) / len(self.lat)) if self.lat else None,
            "mean_completion_tokens": round(sum(self.ctok) / len(self.ctok)) if self.ctok else None,
            "tokens_per_s": round(sum(self.tps) / len(self.tps), 1) if self.tps else None,
            "key_jaccard": round(sum(self.key_j) / len(self.key_j), 3) if self.key_j else None,
            "numeric_mad": round(sum(self.num_diffs) / len(self.num_diffs), 2) if self.num_diffs else None,
            "arabic_in": self.ar_in,
            "arabic_out_rate": round(self.ar_out / self.ar_in, 2) if self.ar_in else None,
        }


def score(cases, baseline, candidates):
    """cases: list; baseline: {case_id: row}; candidates: {label: {case_id: row}} -> summary dict."""
    labels = ["dashscope"] + list(candidates)
    results = {"dashscope": baseline, **candidates}
    summary = {}
    worst = {}
    for label in labels:
        rows = results[label]
        aggs = defaultdict(Agg)
        for c in cases:
            r = rows.get(c["case_id"])
            if r is None:
                continue
            b = baseline.get(c["case_id"]) if label != "dashscope" else None
            real = "synthetic" if c.get("synthetic") else "real"
            aggs[(c["task"], real)].add(c, r, b)
            aggs[("ALL", real)].add(c, r, b)
        summary[label] = {f"{t}/{k}": a.row() for (t, k), a in aggs.items()}
        allw = [w for (t, k), a in aggs.items() if t != "ALL" for w in a.worst]
        worst[label] = sorted(allw, reverse=True)[:8]
    return summary, worst


def fmt(v, pct=False):
    if v is None:
        return "–"
    if pct:
        return f"{v:.0%}"
    return str(v)


def render(summary, worst, meta):
    labels = list(summary)
    keys = sorted({k for s in summary.values() for k in s}, key=lambda k: (k.split("/")[1], k != "ALL/real", k))
    out = ["# LLM benchmark report", ""]
    if meta:
        out += [f"Bundle collected {meta.get('collected_at', '?')} · {meta.get('wire_requests', '?')} wire requests · "
                f"baseline {meta.get('baseline_base_url', '?')}", ""]
    cols = ["n", "ok", "invalid_json", "p50_ms", "p95_ms", "tokens_per_s", "mean_completion_tokens",
            "key_jaccard", "numeric_mad", "arabic_out_rate"]
    pct = {"ok", "invalid_json", "error"}
    for k in keys:
        out += [f"## {k}", "", "| engine | " + " | ".join(cols) + " |", "|---|" + "---:|" * len(cols)]
        for label in labels:
            r = summary[label].get(k)
            if not r:
                continue
            out.append(f"| {label} | " + " | ".join(fmt(r.get(c), c in pct) for c in cols) + " |")
        out.append("")
    out += ["## Largest numeric disagreements vs baseline (read these by hand)", ""]
    for label in labels[1:]:
        out += [f"### {label}", ""]
        if not worst.get(label):
            out.append("_none_")
        for diff, cid, key, bv, cv in worst[label]:
            out.append(f"- `{cid}` `{key}`: baseline {bv:g} → {cv:g} (Δ {diff:g})")
        out.append("")
    out += ["Columns: ok/invalid_json are rates; key_jaccard is top-level-key overlap with the baseline answer (1 = same "
            "schema); numeric_mad is the mean absolute difference on shared numeric fields; arabic_out_rate is the share "
            "of Arabic-input cases whose output contains Arabic. Synthetic rows are hand-written Arabic fixtures, not "
            "platform data."]
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--bundle", default=os.path.expanduser("~/llm_bench"))
    ap.add_argument("--candidates", default="", help="comma list of labels with results.<label>.jsonl present")
    args = ap.parse_args()

    cases = load_jsonl(os.path.join(args.bundle, "cases.jsonl"))
    baseline = {r["case_id"]: r for r in load_jsonl(os.path.join(args.bundle, "results.dashscope.jsonl"))}
    labels = [lab for lab in args.candidates.split(",") if lab]
    if not labels:  # anything present
        labels = sorted(f[len("results."):-len(".jsonl")] for f in os.listdir(args.bundle)
                        if f.startswith("results.") and f.endswith(".jsonl") and f != "results.dashscope.jsonl")
    candidates = {}
    for lab in labels:
        rows = load_jsonl(os.path.join(args.bundle, f"results.{lab}.jsonl"))
        # several reps of one case: keep the first for shape/number comparison, all for latency is a later refinement
        candidates[lab] = {r["case_id"]: r for r in rows if r.get("rep", 0) == 0}
    meta = {}
    mp = os.path.join(args.bundle, "meta.json")
    if os.path.exists(mp):
        meta = json.load(open(mp))

    summary, worst = score(cases, baseline, candidates)
    report = render(summary, worst, meta)
    with open(os.path.join(args.bundle, "report.md"), "w", encoding="utf-8") as f:
        f.write(report)
    with open(os.path.join(args.bundle, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(report)


if __name__ == "__main__":
    main()
