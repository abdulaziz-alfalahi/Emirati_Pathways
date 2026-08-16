# Skill-gap comparison — scope

**Status: scope only, nothing built.** For review before implementation.

## The question it must answer

A coach opens a client and asks: *for the role this person is aiming at, what are
they missing?* Today the platform can only answer the easier half — what they
have. PR #421 renamed the feature to "Skills" precisely because it could not
answer the harder half honestly.

## What exists, measured against the live database 2026-08-16

**The held side is real.**

| | |
|---|---|
| `user_skills` | 83 rows — `skill_name`, `proficiency`, `source`, `verified`, `evidence` |
| `candidate_skills` | 98 rows — `name`, `category`, `level`, `is_verified`, `assessment_score` |

**The target side is real too, and this was the open question.** `career_paths`
holds 7 paths whose `nodes` array carries role-level profiles:

```json
{"role": "Junior Developer", "role_ar": "مطور مبتدئ", "avg_salary": 8000,
 "years_experience": 0, "certifications": ["AWS Cloud Practitioner"],
 "required_skills": ["Python", "JavaScript", "Git", "SQL"]}
```

**36 role nodes carry `required_skills`**, bilingual role names included. That is
a usable target, and it means this feature does not depend on data that does not
exist.

**What is NOT usable, so nobody spends a day discovering it:**

- `job_postings.required_skills` — **0 of 333 populated**. The obvious target is
  empty. This is the same data gap recorded against scorer parity (PR #331).
- `skills` — **0 rows**. `competency_models` — **0 rows**. Empty tables from an
  earlier design; do not build on them.

## The finding that shapes the whole feature

The three vocabularies barely intersect. All are free text.

| Overlap | |
|---|---|
| Required skills found in `skill_taxonomy` | **8 / 135 (6%)** |
| Held skills found in `skill_taxonomy` | **10 / 76 (13%)** |
| Required skills the client already holds, by string match | **15 / 135 (11%)** |

`skill_taxonomy` has 50 entries and is tech-focused — Python, JavaScript, React,
Node, AWS. The real data is broad business vocabulary: *"Accounting Principles"*,
*"Board Reporting"*, *"Emiratisation Initiatives"*, *"Arabic/English
Communication"*. **The taxonomy cannot serve as the join.**

### Why the naive version must not ship

Compare the two lists as strings and the feature reports **roughly 120 of 135
required skills as gaps** — including skills the client demonstrably has under a
different name. "Microsoft Excel" would not match "Excel". "Communication &
Negotiation" would not match "Communication".

A coach sitting with a client, showing a screen that says *you are missing 120
skills*, is worse than showing nothing. It is wrong, it is discouraging, and the
client can see it is wrong — which costs the platform its credibility in the one
moment it most needs it.

**This is the whole engineering problem.** The comparison is trivial; resolving
free text to a canonical concept is not. Any plan that treats this as "diff two
arrays" has misunderstood it.

## The design

### 1. The coach picks a target role

From `career_paths` → node. Explicit, never inferred. A gap is only meaningful
against a stated goal, and guessing the goal would compound the error above.

### 2. Three states per required skill, not two

| State | Meaning |
|---|---|
| **Held** | Resolved to a skill the client has |
| **Missing** | Confidently not held |
| **Unclear** | Could not be resolved either way |

**Unclear is the point.** A resolver that cannot tell must say so rather than
default to "missing", which is what turns 120 unresolved names into 120 false
gaps. The count shown to the coach should be *"missing 4, unclear 11"*, never a
single confident number resting on unresolved text.

### 3. The coach can correct it

One click to mark an unclear or missing skill as held. This is not a fallback for
a weak resolver — it is the product working as intended. The coach knows the
client; the platform does not. **Corrections are recorded**, which makes them
training data for the resolver and the only honest route to improving it.

### 4. Nothing is written to the client's skill record without the coach saying so

A resolved match is an inference. Writing it into `user_skills` would let a
guess become a fact the platform later cites.

## The resolver

Four options, in the order I would consider them:

1. **Coach-confirmed only (no automatic resolution).** Show required vs held side
   by side, let the coach tick. Ships safely, immediately useful, generates the
   correction data everything else needs. Weak on its own at scale.
2. **LLM normalisation.** Map each free-text skill to a canonical concept with
   Qwen. This is exactly the "high-volume mechanical work" the GPU discussion is
   about, and it is bounded, formulaic and checkable — the strongest candidate
   task for self-hosted inference.
3. **Embedding similarity.** No taxonomy needed; gives a confidence score, which
   maps naturally onto the three states. Needs a threshold chosen on real data.
4. **Curate the taxonomy.** Real work by someone who knows the domain, and the
   only option that produces an asset the whole platform can reuse. Slowest.

**Recommendation: 1 now, then 2 or 3 measured against the corrections 1
produces.** Do not pick the resolver before there is data to judge it by.

## Build it once

The scorer-parity work (PR #331, `docs/scorer_parity_scope.md`) is blocked on the
*same* missing foundation: `calculate_match_score` weights `required_skills` at
60% and 0 of 333 postings populate it. Its recommended fix is to extract skills
from NAFIS text with Qwen.

**That is the same resolver.** A canonical skill vocabulary plus a free-text
resolver serves job matching, skill gaps, training recommendations and the
AI's suggestions. Building it twice would be the expensive mistake here.

## Two data problems to settle first

1. **There are two candidate skill stores**, both live: `user_skills` (83 rows)
   and `candidate_skills` (98 rows). Each is read by **nine** backend files, and
   `career_services_routes.py` reads both. The coach surface reads `user_skills`;
   `hr_candidate_routes`, `intelligence_routes` and `priority_fairness` read
   `candidate_skills`. **A gap computed from one will disagree with matching
   computed from the other**, and no amount of resolver quality fixes that.
   Decide which is authoritative before building on either.
2. **`skill_taxonomy` covers 6–13% of the vocabulary in use.** Either commit to
   expanding it or stop treating it as a taxonomy. Half-covering is the worst of
   both: it looks authoritative and silently isn't.

## Phasing

**Phase 1 — target selection and honest presentation.** Coach picks a role;
required vs held shown side by side; three states; coach can correct; corrections
recorded. No automatic resolution beyond exact match. This is shippable and safe.

**Phase 2 — the resolver**, chosen on the corrections Phase 1 produces, and built
once for both this and scorer parity.

**Phase 3 — actionability.** Link a missing skill to a `training_programs` entry
(`skills_covered` already exists) so the answer is "here is how to close it", not
just "here is what is open".

## Out of scope

Writing inferred skills into the client's record; changing the assessment or
verification model; and choosing between the two skill stores — that is a
data-model decision that should be made deliberately, not as a side effect of
building this.
