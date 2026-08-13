# Scope: make the match score mean something

**Status:** scope for review — not built. Needs the decisions in §7.
**Issue:** #352. Related: #26 (fabricated data presented as real), #12 (scoring principles), PR #214 (canonical scorer).
**Trigger:** a real user, `fb_1786394263_5a28ac0d`.

---

## 1. What was reported

Dhabya (`784000000000550`), onboarded through NAFIS, wrote:

> CV matches and interview show numbers but I didn't upload my CV yet.

She has **0 skills, no CV, no applications**. Her dashboard showed job cards reading **45% Match** directly beneath a banner reading *"Upload your CV to get AI-powered job matches"*.

She is right, and the cause is not a display bug.

## 2. The measurement that defines the problem

Same candidate, same job (`Financial Analyst`), scored live on APPQA through both scorers this platform contains:

| scorer | result |
|---|---|
| `backend/match_scoring.py` (canonical, PR #214) | **0.0%** |
| `EnhancedMatchingEngine` (what her dashboard uses) | **45.2%** |

The 45.2 decomposes exactly:

| criterion | score | weight | contributes | where the score came from |
|---|---|---|---|---|
| skills | 0.0 | 0.25 | **0.0** | *the only criterion actually derived from her profile* |
| experience | 100.0 | 0.20 | 20.0 | job's parsed requirement is 0 years, she has 0 → "perfect" |
| education | 50.0 | 0.15 | 7.5 | caller passes `education_requirements=[]`, so this is unknown-vs-unknown |
| location | 30.0 | 0.10 | 3.0 | different-emirate fallback |
| salary | 50.0 | 0.10 | 5.0 | neither side states a salary |
| language | 100.0 | 0.05 | 5.0 | both sides default to `['English']` |
| industry | 100.0 | 0.04 | 4.0 | caller passes `industry=''`, so anything matches |
| career_level | 70 | 0.01 | 0.7 | default banding |
| | | | **45.2** | |

**Not one of those 45.2 points comes from anything Dhabya provided.** The single criterion that reflects her — skills — scored 0 and contributed 0.

## 3. Three distinct ways points are manufactured

### 3.1 "Unknown" is scored as agreement
Each criterion returns a generous default when data is absent on either side:

```python
if not candidate.education_level or not job.education_requirements:  return 50.0
if not candidate.salary_expectation or not job.salary_range:         return 50.0
if not job.industry:                                                 return 100.0
if not job.languages:                                                return 100.0
if not candidate.location or not job.location:                       return 50.0
```

A missing field is not evidence of a match. Treating it as half a match — or a perfect one — is the whole defect.

### 3.2 Some criteria can *never* score anything else
`intelligence_routes.py` builds every `JobRequirements` with hardcoded empties:

```python
preferred_skills=[], education_requirements=[], industry='', company_size='', languages=['English']
```

So for **every candidate against every job** through that endpoint:
- `education` → 50.0 always
- `industry` → 100.0 always
- `language` → 100.0 whenever the candidate has English

That is `7.5 + 4.0 + 5.0 = **16.5 points guaranteed to every pairing**, before anything is evaluated. It is not a scoring signal; it is a constant.

### 3.3 Absent criteria silently shrink the scale
The weighted sum runs only over criteria present in `criteria_scores`:

```python
overall_score = sum([criteria_scores[c.value] * self.criteria_weights[c]
                     for c in self.criteria_weights.keys() if c.value in criteria_scores])
```

`EMIRATIZATION` (0.08) and `COMPANY_SIZE` (0.02) are never populated, so **0.10 of the weight is missing and never renormalised** — the achievable maximum is 90%, not 100%. A perfect candidate is capped at 90 while an empty one floors at ~16.5. The scale is compressed at both ends and labelled as a percentage.

## 4. The structural finding — this is not one engine's bug

PR #214 established `match_scoring.py` as the one canonical scorer, precisely because the candidate and recruiter sides were showing different percentages for the same pair. **That canonicalisation reached two consumers out of seven.**

| scorer | philosophy | empty profile scores | consumers |
|---|---|---|---|
| `match_scoring.py` | earned points only — skills 60 / experience 20 / education 20, absent data contributes nothing | **0%** | `routes/jobs_api.py`, `routes/inline_routes.py` |
| `EnhancedMatchingEngine` | unknown data scores 50 or 100 | **~45%** | `candidate_job_routes.py` (`/job-matches`, `/dashboard/stats`, `/match-analysis`), `intelligence_routes.py` (`/recommended-jobs`), `matching/job_matching_engine_optimized.py`, `matching/matching_routes_optimized.py`, `services/profile_v2_service.py` |

So the same candidate can still be shown two very different numbers depending on which screen they are on — the exact defect #214 set out to end. Fixing #352 by tuning one engine leaves the platform with two contradictory definitions of "match".

## 5. Options

**A — Finish the canonicalisation.** Route every consumer through `match_scoring.py` and retire the engine's scoring path.
*For:* one definition, already aligned with GH #12, already honest about absent data. *Against:* loses the engine's richer criteria (location, salary, language, career level) that some surfaces may want; touches seven consumers.

**B — Port the honesty rule into the engine, keep both.** Exclude unscoreable criteria and renormalise; keep the engine's breadth.
*For:* smallest change per surface, keeps richer output. *Against:* preserves two scorers, so the same pair can still yield two numbers. Only acceptable if both are made to agree on identical inputs, which is work in itself.

**C — Recommended: B as the immediate fix, A as the destination.**
Make the engine honest now, because a real user is being shown a manufactured number today. Then converge the consumers onto the canonical scorer as a separate, testable step, with the engine's extra criteria added to the canonical scorer if they are wanted rather than kept in a parallel implementation.

## 6. The rule to implement

1. **A criterion with no data on either side is `None`, not a number.** It is excluded from both numerator and denominator.
2. **Renormalise over the criteria that actually scored**, so the result remains a true percentage of what was assessed.
3. **Below a coverage threshold, publish no percentage at all.** Show what is missing instead. The dashboard already does this well one card away — *"ATS Compatibility: Not scored yet"*.
4. **Disclose coverage wherever a score is shown** — "based on 3 of 8 factors" — so a thin score is never mistaken for a confident one.
5. **Never let a hardcoded caller default become a scoring input.** `industry=''` must mean unscored, not universal match.

Under this rule Dhabya's 45.2% becomes: skills 0 of 0.25 assessed, everything else unscoreable → **coverage far below threshold → no percentage shown**, with "add your skills and CV to get matched" in its place. Which is what her dashboard was already telling her in the banner immediately above.

## 7. Decisions needed

1. **The coverage threshold.** Below what fraction of weight assessed do we refuse to show a number? Suggest **0.50** — at least half the weighting must rest on real data. This is a judgement about how much confidence a percentage implies.
2. **Do we show a score with no skills data at all?** Skills is 25% of the engine's weight and 60% of the canonical scorer's. Suggest **no** — a job match without skills evidence is not a match. This is the single most consequential choice here.
3. **Option A, B, or C** (§5). Recommend C.
4. **Recruiter-side disclosure.** Recruiters currently see percentages from the canonical scorer for candidates whose profiles are thin. Do they also see coverage, or only candidates? Suggest coverage everywhere — a recruiter dismissing a 20% match should know whether that means "assessed and weak" or "we know almost nothing".

## 8. What will change for users, stated plainly

- **Scores will fall across the board**, including for candidates with genuine profiles, because several criteria have been contributing free points to everyone. This is the intended effect, and it will be visible.
- **Some candidates will lose their match percentage entirely** until they add skills or a CV. That is the honest state, and it restores the reason to complete a profile — today an empty profile already reads as 45% "matched", which quietly removes that reason.
- **Recruiters will see different numbers than they saw yesterday.** Worth a note in-product rather than letting it be discovered.
- Nothing about **national priority** changes: it remains a separate, disclosed axis and is not folded into the match score (GH #12).

## 9. Verification plan

1. Dhabya's exact case: empty profile → **no percentage**, with a stated reason. The current 45% must be gone.
2. A candidate with real skills against a well-specified job → a score that moves when skills change, and does not move when unrelated empty fields change.
3. **The same candidate+job pair returns the identical number** on the candidate dashboard, `/job-matches`, and the recruiter applicant view. This is the #214 regression test and it currently fails.
4. A job with no parsed requirements must not yield `experience: 100`.
5. Confirm the achievable maximum is a true 100 after renormalisation, not 90.
6. Spot-check a sample of live candidates before/after and record the distribution shift, so the drop is a known quantity rather than a surprise.

## 10. Effort

Moderate for the rule itself (§6 is a contained change to ten scoring functions plus the aggregation), larger for convergence (§5 option A) because seven consumers and their response shapes are involved. The UI work is small but must not be skipped: a score with no disclosure of coverage recreates the same problem in a quieter form.
