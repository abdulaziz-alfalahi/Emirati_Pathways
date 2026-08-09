# Match-score parity — scope and recommendation

**Status:** investigated 2026-08-08. **Needs an owner decision before any code changes.**
**Trigger:** the `/api/v1` canonicalization found candidate and recruiter sides show different match percentages for the same pairing (`docs/api_v1_canonicalization.md` §5).

---

## The gap, precisely

| side | endpoint | scorer |
|---|---|---|
| **Candidate** ("my matches") | `/api/candidate/job-matches` | `enhanced_matching_engine` / `ai_matching_service` — semantic, works on the job's unstructured text |
| **Recruiter** (applicant view) | `inline_routes.py:307` | `match_scoring.calculate_match_score` — the GH #12 governed algorithm |

Two different algorithms, so a candidate and a recruiter can see different numbers for the same candidate↔job pair. The `inline_routes` code even comments "so BOTH sides show the SAME percentage" — they don't.

## Why the obvious fix is wrong

The tempting fix — "AI ranks, the governed scorer labels" (let the AI order jobs, but display `calculate_match_score` so the number is consistent and policy-compliant) — **would make the candidate experience worse**, because of a data gap:

- `calculate_match_score` is **60% weighted on `job.required_skills`** and keys its entire skills match on that field.
- **0 of the 8 published jobs have `required_skills` populated** (verified live). Real jobs come from NAFIS as unstructured text; the structured field is empty.
- So the governed scorer returns its **baseline (~50%) for every real job**. Spot-checked live: a candidate with 36 skills in `user_skills` scores the baseline against real postings because the jobs carry no structured skills to match on.

The AI engine avoids this by matching semantically against the job's `requirements`/description text. **For the platform's real data, the AI engine is the more useful scorer.** The governed scorer is only meaningful where a job carries structured `required_skills` — today, only recruiter-posted test jobs.

This also means the **recruiter** side is likely showing ~50% for these same real jobs — the governed number isn't discriminating there either; it just isn't noticed because recruiters mostly see their own (structured) postings.

## So the real problem is data, not code

The parity gap is a symptom. The lever is: **jobs need structured `required_skills`.** Once they do, the governed scorer becomes meaningful and can be unified across both sides for a consistent, disclosed, policy-compliant number.

## Options (for the owner)

**A. Populate `required_skills` on jobs, then unify on the governed scorer.** The correct end state. Skills get extracted from NAFIS job text at import — the platform already has the AI infra (Qwen) to do this. Then: AI ranks (semantic relevance for ordering), `calculate_match_score` labels (the governed, disclosed number), both sides identical. Biggest effort, right outcome. *Recommended direction.*

**B. Make the governed scorer read unstructured text.** Extend `calculate_match_score` to extract skills from a job's `requirements`/description when `required_skills` is empty. Keeps one governed algorithm without a data pipeline, but bakes fuzzy text-parsing into the governed number — harder to keep explainable/defensible, which was the point of GH #12.

**C. Unify on the AI engine both sides (including recruiter).** Simplest parity: both sides show the AI number. But it abandons the GH #12 governed algorithm — the AI score isn't the disclosed methodology and may implicitly weight things the policy forbids (e.g. geography via CV). Not recommended for a government platform where the number must be defensible.

**D. Interim, honest disclosure.** Until A lands, keep the AI score candidate-side (it's the useful one for real jobs) but stop implying it's the governed number, and align the recruiter view to show the same engine so the two agree. Explicitly a stopgap.

## Recommendation

**A, with D as the interim.** The governed number is only worth displaying once jobs carry structured skills; the real work is the NAFIS-import skills-extraction pipeline. Until then, make the two sides *agree* (D) rather than shipping a governed number that reads ~50% for every real job.

None of this should be changed unilaterally — it's the owner's disclosed number (GH #12), and option A is a data-pipeline commitment, not a refactor.

## What was verified (live, 2026-08-08)

- Candidate endpoint scores via `enhanced_matching_engine`/`ai_matching_service`; no import of `match_scoring`.
- Recruiter side builds its candidate dict from `user_skills` + `profile_data` and calls `calculate_match_score` (`inline_routes.py:250-307`).
- `candidate_profiles` has no skills columns (`education_level`, `experience_duration` only); candidate skills live in `user_skills` (sample candidate: 36).
- **0 / 8 published jobs have `required_skills`.**
- `calculate_match_score` is self-contained (`candidate` skills/experience/education + `job.required_skills` → 0–100) and encodes GH #12 (skills-only, no geography, no flat nationality bonus).

## If option A is chosen — implementation sketch

1. Extract the recruiter-side candidate-dict builder (`inline_routes.py:250-307`) into a shared `build_scoring_candidate(user_id)` so both sides assemble the candidate identically.
2. A NAFIS-import step that extracts `required_skills` from job text (Qwen), stored on `job_postings`.
3. A final canonical re-scoring pass in `/api/candidate/job-matches`: engines rank, then overwrite the displayed `matchScore` with `calculate_match_score` using the shared builder.
4. Parity test: the same (candidate, job) through both endpoints returns the same number.
