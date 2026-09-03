#!/usr/bin/env python3
"""
LLM benchmark — stage 1: collect real prompts and the DashScope baseline.

Drives the platform's REAL prompt builders over REAL rows from the live
database and records, for every call that would have left the box:

  * the exact wire request qwen_client sends — messages after sanitising and
    the json nudge, model, temperature, response_format, max_tokens
  * DashScope's answer, latency and token counts — the baseline every other
    engine is scored against

Interception is at the OpenAI-client boundary (qwen_client._client), so every
caller is covered no matter how it imported chat_completion. ai_usage_log is
silenced — a benchmark is not platform traffic.

Nothing is written to the database. The bundle holds personal data (the CV
parser redacts identifiers, but match prompts carry names and transcripts are
verbatim): it stays inside the tenancy and out of git.

    .venv/bin/python backend/scripts/llm_bench/collect.py --out ~/llm_bench
    .venv/bin/python backend/scripts/llm_bench/collect.py --dry-run   # prompts only, no API calls
"""
import argparse
import json
import logging
import os
import re
import sys
import time
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, ROOT)
os.chdir(os.path.join(ROOT, "backend"))

from dotenv import load_dotenv  # noqa: E402
load_dotenv(os.path.join(ROOT, "backend", ".env"))

import psycopg2  # noqa: E402
import psycopg2.extras  # noqa: E402

from backend.services import qwen_client  # noqa: E402

log = logging.getLogger("llm_bench.collect")

ARABIC = re.compile(r"[؀-ۿ]")


def has_arabic(s):
    return bool(ARABIC.search(s or ""))


# ---------------------------------------------------------------------------
# Interception
# ---------------------------------------------------------------------------

class Recorder:
    """Stands in for qwen_client._client and records every wire request."""

    def __init__(self, real_client, dry_run, cases_fh, base_fh):
        self._real = real_client
        self._dry = dry_run
        self._cases = cases_fh
        self._base = base_fh
        self.current = {}          # set by the driver before each call
        self.n = 0
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kw):
        case_id = f"{self.current.get('task', 'unknown')}-{self.n:04d}"
        self.n += 1
        text_in = "\n".join(m.get("content") or "" for m in kw["messages"])
        case = {
            "case_id": case_id,
            "task": self.current.get("task"),
            "caller": self.current.get("caller"),
            "input_ref": self.current.get("input_ref"),
            "synthetic": bool(self.current.get("synthetic", False)),
            "has_arabic_input": has_arabic(text_in),
            "prompt_chars": len(text_in),
            "request": {
                "messages": kw["messages"],
                "temperature": kw.get("temperature"),
                "response_format": kw.get("response_format"),
                "max_tokens": kw.get("max_tokens"),
            },
            "baseline_model": kw.get("model"),
        }
        self._cases.write(json.dumps(case, ensure_ascii=False) + "\n")
        self._cases.flush()

        if self._dry:
            return _fake_response('{"dry_run": true}')

        t0 = time.time()
        try:
            resp = self._real.chat.completions.create(**kw)
        except Exception as e:  # record the failure as a baseline row too
            self._base.write(json.dumps({
                "case_id": case_id, "label": "dashscope", "model": kw.get("model"),
                "outcome": "error", "error": str(e)[:500],
                "latency_ms": int((time.time() - t0) * 1000),
            }) + "\n")
            self._base.flush()
            raise
        latency_ms = int((time.time() - t0) * 1000)
        raw = resp.choices[0].message.content or ""
        parsed = qwen_client._extract_json(raw)
        usage = getattr(resp, "usage", None)
        self._base.write(json.dumps({
            "case_id": case_id, "label": "dashscope", "model": kw.get("model"),
            "outcome": "ok" if parsed is not None else "invalid_json",
            "latency_ms": latency_ms,
            "prompt_tokens": getattr(usage, "prompt_tokens", None),
            "completion_tokens": getattr(usage, "completion_tokens", None),
            "output": parsed, "raw": None if parsed is not None else raw[:4000],
        }, ensure_ascii=False) + "\n")
        self._base.flush()
        return resp


def _fake_response(text):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=text))],
        usage=SimpleNamespace(prompt_tokens=0, completion_tokens=0),
    )


# ---------------------------------------------------------------------------
# Real inputs
# ---------------------------------------------------------------------------

def db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"), port=os.getenv("DB_PORT"), dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), connect_timeout=10,
    )


def load_inputs(limit_jobs):
    conn = db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT id::text, parsed_data, personal_info, professional_summary, technical_skills,
               soft_skills, work_experience, education, certifications, languages_spoken
        FROM user_cvs WHERE parsed_data IS NOT NULL ORDER BY created_at
    """)
    cvs = cur.fetchall()
    cur.execute("""
        SELECT id, title, department, location, emirate, city, job_level, experience_level,
               employment_type, description, required_skills, preferred_skills,
               education_requirements, requirements, responsibilities, benefits, jd_id
        FROM job_postings
        WHERE description IS NOT NULL AND length(description) > 200
          AND title NOT ILIKE 'ZZ-%%'
        ORDER BY length(description) DESC LIMIT %s
    """, (limit_jobs,))
    jobs = cur.fetchall()
    cur.execute("""
        SELECT room_name,
               string_agg(coalesce(participant_name, participant_identity) || ': ' || text,
                          E'\n' ORDER BY created_at) AS transcript,
               sum(length(text)) AS chars
        FROM interview_transcripts GROUP BY room_name HAVING sum(length(text)) > 800
        ORDER BY 3 DESC LIMIT 6
    """)
    transcripts = cur.fetchall()
    conn.close()
    return cvs, jobs, transcripts


def _label(x, *keys):
    if isinstance(x, str):
        return x
    if isinstance(x, dict):
        for k in keys:
            if x.get(k):
                return str(x[k])
    return str(x)


def cv_text(row):
    """Render a stored CV back to the plain text the parser would receive."""
    pd = row["parsed_data"] or {}
    pi = row["personal_info"] or pd.get("personal_info") or {}
    lines = []
    name = pi.get("full_name") or pi.get("name") or f"{pi.get('firstName', '')} {pi.get('lastName', '')}".strip()
    if name:
        lines.append(name)
    for k in ("email", "phone", "location", "city", "nationality"):
        if pi.get(k):
            lines.append(f"{k.title()}: {pi[k]}")
    summary = row["professional_summary"] or pd.get("professional_summary")
    if summary:
        lines += ["", "PROFESSIONAL SUMMARY", summary]
    exp = row["work_experience"] or pd.get("experience") or []
    if exp:
        lines += ["", "EXPERIENCE"]
        for e in exp:
            if isinstance(e, dict):
                lines.append(" | ".join(str(e.get(k)) for k in
                                        ("title", "job_title", "position", "company", "start_date", "end_date", "duration")
                                        if e.get(k)))
                desc = e.get("description") or e.get("responsibilities")
                if desc:
                    lines.append(desc if isinstance(desc, str) else "; ".join(map(str, desc)))
    edu = row["education"] or pd.get("education") or []
    if edu:
        lines += ["", "EDUCATION"]
        for e in edu:
            if isinstance(e, dict):
                lines.append(" | ".join(str(e.get(k)) for k in
                                        ("degree", "field", "field_of_study", "institution", "graduation_year", "year")
                                        if e.get(k)))
    skills = (row["technical_skills"] or pd.get("skills") or []) + (row["soft_skills"] or [])
    if skills:
        lines += ["", "SKILLS", ", ".join(_label(s, "name", "skill") for s in skills)]
    certs = row["certifications"] or pd.get("certifications") or []
    if certs:
        lines += ["", "CERTIFICATIONS", ", ".join(_label(c, "name", "title") for c in certs)]
    langs = row["languages_spoken"] or pd.get("languages") or []
    if langs:
        lines += ["", "LANGUAGES", ", ".join(_label(lang, "language", "name") for lang in langs)]
    return "\n".join(lines)


def jd_text(job):
    parts = [job["title"] or ""]
    if job["department"]:
        parts.append(f"Department: {job['department']}")
    loc = ", ".join(x for x in (job["city"], job["emirate"], job["location"]) if x)
    if loc:
        parts.append(f"Location: {loc}")
    for k in ("job_level", "experience_level", "employment_type", "education_requirements"):
        if job[k]:
            parts.append(f"{k.replace('_', ' ').title()}: {job[k]}")
    parts += ["", job["description"] or ""]
    for k in ("requirements", "responsibilities", "benefits", "required_skills", "preferred_skills"):
        v = job[k]
        if v:
            parts += ["", k.replace("_", " ").upper()]
            parts += [f"- {x if isinstance(x, str) else json.dumps(x, ensure_ascii=False)}" for x in v]
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Synthetic Arabic fixtures. The live data has almost no Arabic AI input
# (0 Arabic job descriptions, English CVs). These are labelled synthetic=True
# in the bundle and scored separately: they exist so the Arabic JSON path is
# exercised at all, and prove nothing about real-world Arabic quality alone.
# ---------------------------------------------------------------------------

AR_CVS = [
    """فاطمة عبدالله المنصوري
البريد الإلكتروني: fatima@example.ae
الهاتف: 0501234567
الموقع: أبوظبي

الملخص المهني
محاسبة معتمدة بخبرة أربع سنوات في إعداد التقارير المالية والميزانيات في القطاع الحكومي. حاصلة على شهادة CMA.

الخبرة العملية
محاسبة أولى | دائرة المالية - أبوظبي | 2022 - حتى الآن
- إعداد القوائم المالية الشهرية والسنوية وفق معايير IPSAS
- إدارة عمليات الإقفال الشهري والتنسيق مع المدققين الخارجيين
محاسبة | شركة الاتحاد للطيران | 2020 - 2022
- تسوية الحسابات البنكية ومتابعة الذمم المدينة

التعليم
بكالوريوس محاسبة | جامعة الإمارات العربية المتحدة | 2020

المهارات
Oracle Fusion, Excel المتقدم, التحليل المالي, إعداد الميزانيات, IPSAS

اللغات
العربية (اللغة الأم), الإنجليزية (ممتاز)""",
    """سعيد راشد الكعبي
الهاتف: 0559876543
الموقع: دبي

الملخص المهني
مهندس برمجيات بخبرة سنتين في تطوير تطبيقات الويب باستخدام React و Python. مهتم بمجال الذكاء الاصطناعي.

الخبرة العملية
مطور برمجيات | هيئة الطرق والمواصلات | 2023 - حتى الآن
- تطوير واجهات المستخدم لتطبيق الخدمات الذكية
- بناء واجهات برمجية REST باستخدام Flask و PostgreSQL

التعليم
بكالوريوس علوم الحاسوب | جامعة خليفة | 2023 | المعدل 3.6

المهارات
Python, React, TypeScript, PostgreSQL, Docker, Git

الشهادات
AWS Cloud Practitioner""",
    """مريم خالد الشامسي
الموقع: الشارقة

الملخص المهني
خريجة حديثة في إدارة الموارد البشرية، أبحث عن فرصة أولى في مجال التوظيف أو تطوير المواهب.

التعليم
بكالوريوس إدارة أعمال - تخصص موارد بشرية | جامعة الشارقة | 2025

التدريب
متدربة موارد بشرية | مصرف الشارقة الإسلامي | صيف 2024
- المساعدة في فرز السير الذاتية وتنسيق المقابلات

المهارات
التواصل, Microsoft Office, إدارة الوقت, العمل الجماعي

اللغات
العربية, الإنجليزية (جيد جداً)""",
]

AR_JDS = [
    """أخصائي موارد بشرية
القسم: الموارد البشرية
الموقع: أبوظبي
المستوى: متوسط

نبحث عن أخصائي موارد بشرية للانضمام إلى فريقنا في أبوظبي. يتولى شاغل الوظيفة إدارة عمليات التوظيف من الإعلان حتى التعيين، وتنسيق برامج التهيئة للموظفين الجدد، ومتابعة تطبيق سياسات التوطين.

المتطلبات
- بكالوريوس في إدارة الأعمال أو الموارد البشرية
- خبرة لا تقل عن ثلاث سنوات في التوظيف
- إجادة اللغتين العربية والإنجليزية
- معرفة بقانون العمل الإماراتي

المسؤوليات
- إدارة دورة التوظيف الكاملة
- إعداد تقارير التوطين الشهرية
- تنسيق برامج التدريب والتطوير""",
    """محلل مالي
القسم: المالية
الموقع: دبي
المستوى: مبتدئ

يقوم المحلل المالي بإعداد التحليلات والتقارير المالية الدورية ودعم عملية إعداد الميزانية السنوية.

المتطلبات
- بكالوريوس محاسبة أو مالية
- خبرة من سنة إلى ثلاث سنوات
- إتقان Excel وأنظمة ERP
- يفضل حملة شهادة CMA أو CFA""",
]


# ---------------------------------------------------------------------------
# Drivers — each calls the platform's real code path
# ---------------------------------------------------------------------------

def guard(rec, task, caller, input_ref, synthetic=False):
    rec.current = {"task": task, "caller": caller, "input_ref": input_ref, "synthetic": synthetic}


def run_all(rec, cvs, jobs, transcripts, args):
    from backend.cv_parser import CVParser
    from backend.services import matching_engine
    from backend.ai_job_matching_service import AIJobMatchingService
    from backend.jd_enhanced_parser import JobDescriptionParser
    from backend.recruiter.jd_builder_engine import JDBuilderEngine
    from backend.services.interview_service import InterviewService

    counts = {}

    def attempt(task, fn):
        counts[task] = counts.get(task, 0) + 1
        try:
            return fn()
        except Exception as e:
            log.warning("%s: %s: %s", task, type(e).__name__, str(e)[:200])
            return None

    cap = args.limit or None

    # -- parse (CV) ----------------------------------------------------------
    parser = CVParser()
    cv_texts = [(f"user_cvs:{r['id']}", cv_text(r), False) for r in cvs]
    cv_texts += [(f"synthetic_ar_cv:{i}", t, True) for i, t in enumerate(AR_CVS)]
    parsed_cvs = {}
    for ref, text, syn in cv_texts[:cap]:
        guard(rec, "parse", "cv_parser.CVParser.parse_cv_text", ref, syn)
        out = attempt("parse", lambda: parser.parse_cv_text(text, filename="bench.txt"))
        # parse_cv_text wraps the parsed CV as {'success', 'cv_id', 'data': {...}}
        if isinstance(out, dict) and out.get("success") and isinstance(out.get("data"), dict):
            parsed_cvs[ref] = out["data"]

    # -- parse (JD, matching_engine) ------------------------------------------
    jd_inputs = [(f"job_postings:{j['id']}", jd_text(j), False) for j in jobs]
    jd_inputs += [(f"synthetic_ar_jd:{i}", t, True) for i, t in enumerate(AR_JDS)]
    parsed_jds = {}
    for ref, text, syn in jd_inputs[:cap]:
        guard(rec, "parse", "services.matching_engine.parse_jd", ref, syn)
        out = attempt("parse", lambda: matching_engine.parse_jd(text))
        if isinstance(out, dict):
            parsed_jds[ref] = out

    # -- jd_parse (section parser, 4 calls per JD) ----------------------------
    jdp = JobDescriptionParser()
    for ref, text, syn in jd_inputs[: (args.limit or 4)]:
        guard(rec, "jd_parse", "jd_enhanced_parser.JobDescriptionParser.parse_job_description", ref, syn)
        attempt("jd_parse", lambda: jdp.parse_job_description(text))

    # -- match (candidate side) ----------------------------------------------
    svc = AIJobMatchingService()
    pairs = 0
    for r in cvs:
        cv_profile = svc.extract_cv_profile(r["parsed_data"] or {})
        for j in jobs[:4]:
            if args.limit and pairs >= args.limit:
                break
            job_req = svc.extract_job_requirements({
                "title": j["title"], "company": "", "location": j["location"] or j["emirate"] or "",
                "description": j["description"], "requirements": j["requirements"] or [],
                "required_skills": j["required_skills"] or [], "experience_level": j["experience_level"],
            })
            guard(rec, "match", "ai_job_matching_service.calculate_ai_match_score",
                  f"user_cvs:{r['id']}|job_postings:{j['id']}")
            attempt("match", lambda: svc.calculate_ai_match_score(cv_profile, job_req))
            pairs += 1

    # -- match (recruiter side, on the parsed JDs from the baseline) ----------
    pairs = 0
    for cref, resume in parsed_cvs.items():
        for jref, jd in list(parsed_jds.items())[:3]:
            if args.limit and pairs >= args.limit:
                break
            syn = cref.startswith("synthetic") or jref.startswith("synthetic")
            guard(rec, "match", "services.matching_engine.score_match", f"{cref}|{jref}", syn)
            attempt("match", lambda: matching_engine.score_match(resume, jd))
            pairs += 1

    # -- interview (transcript analysis) --------------------------------------
    isvc = InterviewService()
    isvc._save_analysis = lambda *a, **k: None          # never write
    for t in transcripts[:cap]:
        isvc._get_transcript_for_session = lambda _sid, _t=t["transcript"]: _t
        guard(rec, "interview", "services.interview_service.analyze_interview",
              f"interview_transcripts:{t['room_name']}")
        attempt("interview", lambda: isvc.analyze_interview(t["room_name"]))

    # -- generate (JD builder) -----------------------------------------------
    builder = JDBuilderEngine()
    for j in jobs[: (args.limit or 4)]:
        jd_data = {
            "metadata": {"jd_id": j["jd_id"] or f"job-{j['id']}"},
            "basic_info": {"title": j["title"], "department": j["department"] or "",
                           "job_level": j["job_level"] or "mid", "city": j["city"] or "",
                           "emirate": j["emirate"] or "UAE"},
            "requirements": j["requirements"] or [],
            "responsibilities": j["responsibilities"] or [],
        }
        guard(rec, "generate", "recruiter.jd_builder_engine.generate_description_ai", f"job_postings:{j['id']}")
        attempt("generate", lambda: builder.generate_description_ai(jd_data, industry=j["department"]))

    # -- explain (career guidance) -------------------------------------------
    try:
        import dataclasses
        from backend import ai_career_guidance_engine as cg
        engine = cg.AICareerGuidanceEngine()
        fields = {}
        for f in dataclasses.fields(cg.CareerPathway):
            t, ts = f.type, str(f.type)
            if t is str:
                fields[f.name] = {"title": "Data Analyst", "description": "Analyses public-sector datasets",
                                  "work_environment": "office"}.get(f.name, "n/a")
            elif t is float:
                fields[f.name] = 70.0
            elif t is bool:
                fields[f.name] = True
            elif "Tuple" in ts:
                fields[f.name] = (12000, 20000)
            elif "List" in ts:
                fields[f.name] = ["Python", "SQL"] if "skill" in f.name else ["Analyst"]
            elif t is datetime:
                fields[f.name] = datetime.now()
            elif hasattr(t, "__members__"):
                fields[f.name] = list(t)[0]
            else:
                fields[f.name] = None
        pathway = cg.CareerPathway(**fields)
        profiles = [
            {"academic_level": "Bachelor", "major_field": "Computer Science", "gpa": 3.4,
             "skills": ["Python", "SQL", "Excel"], "is_emirati": True},
            {"academic_level": "بكالوريوس", "major_field": "إدارة أعمال", "gpa": 3.1,
             "skills": ["التواصل", "Excel", "تحليل البيانات"], "is_emirati": True},
        ]
        for i, p in enumerate(profiles[:cap]):
            guard(rec, "explain", "ai_career_guidance_engine.predict_career_outcomes", f"synthetic_profile:{i}", True)
            attempt("explain", lambda: engine.predict_career_outcomes(p, pathway))
    except Exception as e:
        log.warning("explain driver skipped: %s", e)

    return counts


# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.expanduser("~/llm_bench"), help="bundle directory (keep out of git)")
    ap.add_argument("--jobs", type=int, default=16, help="job postings to draw (real ones with a description)")
    ap.add_argument("--limit", type=int, default=0, help="cap cases per driver (smoke test)")
    ap.add_argument("--dry-run", action="store_true", help="capture prompts only; no DashScope calls")
    ap.add_argument("-v", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(level=logging.DEBUG if args.v else logging.WARNING,
                        format="%(levelname)s %(name)s: %(message)s")
    logging.getLogger("llm_bench").setLevel(logging.INFO)

    os.makedirs(args.out, exist_ok=True)
    cases_path = os.path.join(args.out, "cases.jsonl")
    base_path = os.path.join(args.out, "results.dashscope.jsonl")

    cvs, jobs, transcripts = load_inputs(args.jobs)
    log.info("inputs: %d CVs, %d jobs, %d transcripts (+%d/%d synthetic Arabic CVs/JDs)",
             len(cvs), len(jobs), len(transcripts), len(AR_CVS), len(AR_JDS))

    real = None if args.dry_run else qwen_client._get_client()
    qwen_client._record_usage = lambda *a, **k: None      # not platform traffic
    with open(cases_path, "w", encoding="utf-8") as cf, open(base_path, "w", encoding="utf-8") as bf:
        rec = Recorder(real, args.dry_run, cf, bf)
        qwen_client._client = rec                          # every caller goes through here
        t0 = time.time()
        counts = run_all(rec, cvs, jobs, transcripts, args)
    meta = {
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "run_id": uuid.uuid4().hex[:8],
        "driver_calls": counts, "wire_requests": rec.n, "seconds": round(time.time() - t0, 1),
        "dry_run": args.dry_run, "baseline_base_url": qwen_client.QWEN_BASE_URL,
    }
    with open(os.path.join(args.out, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    log.info("done: %s", json.dumps(meta))
    print(f"\n{rec.n} wire requests captured -> {cases_path}")
    if not args.dry_run:
        print(f"DashScope baseline -> {base_path}")


if __name__ == "__main__":
    main()
