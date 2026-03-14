#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
Matching Accuracy Test Script
=============================
Creates controlled JD + candidate data with KNOWN expected rankings,
runs the matching engine, and validates that scores/rankings are correct.

Usage:
    cd backend
    python tests/test_matching_accuracy.py

Scoring weight reference (rule-based):
    Skills:       40 pts  (% of required skills matched)
    Experience:   30 pts  (30 if >= required, 20 if >= 70%, else 10)
    Education:    15 pts  (15 if meets/exceeds, else 7)
    Location:     10 pts  (10 if same emirate, else 5)
    UAE National:  5 pts  (5 if UAE national)
    Total:       100 pts
"""

import os
import sys
import json
from datetime import datetime

# ── Setup path ──────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from recruiter.ai_candidate_matching_final import AICandidateMatchingEngineFinal


# ═══════════════════════════════════════════════════════════════
# 1.  TEST JOB DESCRIPTION
# ═══════════════════════════════════════════════════════════════
TEST_JD = {
    "metadata": {
        "jd_id": "TEST_JD_001",
        "recruiter_id": "test_recruiter",
        "company_id": "test_company",
        "status": "published"
    },
    "basic_info": {
        "title": "Senior Python Backend Developer",
        "department": "Engineering",
        "job_type": "full_time",
        "job_level": "senior",
        "emirate": "Dubai",
        "city": "Dubai Internet City",
        "remote_option": False
    },
    "description": "We are looking for a Senior Python Backend Developer with expertise in cloud services and databases.",
    "requirements": {
        "skills": [
            "Python",
            "Django",
            "PostgreSQL",
            "AWS",
            "Docker",
            "REST APIs"
        ],
        "experience": [
            "5 years of backend development experience"
        ],
        "education": [
            "Bachelor's degree in Computer Science or related field"
        ]
    },
    "responsibilities": [
        "Design and build scalable backend services",
        "Manage cloud infrastructure on AWS",
        "Write clean, tested Python code"
    ]
}


# ═══════════════════════════════════════════════════════════════
# 2.  TEST CANDIDATES  (ordered by expected rank: best → worst)
# ═══════════════════════════════════════════════════════════════
TEST_CANDIDATES = [
    {
        # ── CANDIDATE A ── Perfect match (expect ~95-100)
        "candidate_id": 9001,
        "first_name": "Fatima",
        "last_name": "Al Maktoum",
        "email": "fatima.test@example.ae",
        "phone": "+971501111111",
        "emirate": "Dubai",                          # ✓ same as JD
        "nationality": "UAE",
        "is_uae_national": True,                     # ✓ +5 pts
        "education_level": "Master",                 # ✓ exceeds bachelor
        "experience_years": 8,                       # ✓ exceeds 5 req
        "job_title": "Lead Backend Developer",
        "company": "Emirates Tech",
        "skills": ["Python", "Django", "PostgreSQL", "AWS", "Docker", "REST APIs"],  # 6/6
        "employment_status": "open_to_opportunities",
    },
    {
        # ── CANDIDATE B ── Strong match, 1 missing skill (expect ~80-90)
        "candidate_id": 9002,
        "first_name": "Ahmed",
        "last_name": "Al Nahyan",
        "email": "ahmed.test@example.ae",
        "phone": "+971502222222",
        "emirate": "Dubai",                          # ✓ same as JD
        "nationality": "UAE",
        "is_uae_national": True,                     # ✓ +5 pts
        "education_level": "Bachelor",               # ✓ meets req
        "experience_years": 6,                       # ✓ exceeds 5 req
        "job_title": "Senior Developer",
        "company": "Dubai Digital",
        "skills": ["Python", "Django", "PostgreSQL", "AWS", "REST APIs"],  # 5/6 (no Docker)
        "employment_status": "open_to_opportunities",
    },
    {
        # ── CANDIDATE C ── Moderate match (expect ~55-70)
        "candidate_id": 9003,
        "first_name": "Sara",
        "last_name": "Al Ketbi",
        "email": "sara.test@example.ae",
        "phone": "+971503333333",
        "emirate": "Abu Dhabi",                      # ✗ different emirate
        "nationality": "UAE",
        "is_uae_national": True,                     # ✓ +5 pts
        "education_level": "Bachelor",               # ✓ meets req
        "experience_years": 4,                       # ✗ below 5 (70% range)
        "job_title": "Python Developer",
        "company": "Abu Dhabi IT",
        "skills": ["Python", "Django", "PostgreSQL"],  # 3/6
        "employment_status": "open_to_opportunities",
    },
    {
        # ── CANDIDATE D ── Weak match (expect ~30-45)
        "candidate_id": 9004,
        "first_name": "Omar",
        "last_name": "Hassan",
        "email": "omar.test@example.ae",
        "phone": "+971504444444",
        "emirate": "Sharjah",                        # ✗ different emirate
        "nationality": "Egypt",
        "is_uae_national": False,                    # ✗ no bonus
        "education_level": "Diploma",                # ✗ below bachelor
        "experience_years": 2,                       # ✗ well below 5
        "job_title": "Junior Developer",
        "company": "Sharjah Startups",
        "skills": ["Python", "Flask"],               # 1/6 (only Python matches)
        "employment_status": "job_seeker",
    },
    {
        # ── CANDIDATE E ── No match (expect ~15-25)
        "candidate_id": 9005,
        "first_name": "Maria",
        "last_name": "Garcia",
        "email": "maria.test@example.ae",
        "phone": "+971505555555",
        "emirate": "Ras Al Khaimah",                 # ✗ different emirate
        "nationality": "Spain",
        "is_uae_national": False,                    # ✗ no bonus
        "education_level": "Bachelor",               # ✓ meets req
        "experience_years": 1,                       # ✗ far below 5
        "job_title": "Marketing Manager",
        "company": "RAK Tours",
        "skills": ["Java", "Angular", "MySQL", "Marketing"],  # 0/6
        "employment_status": "employed",
    },
]

# Expected ranking order (best to worst): A > B > C > E > D
# Note: E ranks above D because education (bachelor=15pts) > diploma(7pts)
# outweighs D's single skill match (~7pts vs 0pts
EXPECTED_RANKING = [9001, 9002, 9003, 9005, 9004]

# Minimum expected score ranges  (candidate_id -> (min, max))
EXPECTED_SCORE_RANGES = {
    9001: (85, 100),   # Perfect: 6/6 skills(40) + exp(30) + edu(15) + loc(10) + uae(5) = 100
    9002: (75, 95),    # Strong:  5/6 skills(~33) + exp(30) + edu(15) + loc(10) + uae(5) = ~93
    9003: (45, 70),    # Moderate: 3/6 skills(20) + exp(20) + edu(15) + loc(5) + uae(5) = ~65
    9004: (20, 45),    # Weak:    1/6 skills(~7) + exp(10) + edu(7) + loc(5) + uae(0) = ~29
    9005: (10, 35),    # None:    0/6 skills(0) + exp(10) + edu(15) + loc(5) + uae(0) = ~30
}


# ═══════════════════════════════════════════════════════════════
# 3.  CALCULATE EXPECTED RULE-BASED SCORES  (for reference)
# ═══════════════════════════════════════════════════════════════
def calculate_expected_rule_score(candidate):
    """Calculate what the rule-based score SHOULD be for this candidate."""
    score = 0
    notes = []

    # Skills (40 pts) — 6 required skills
    required = ["python", "django", "postgresql", "aws", "docker", "rest apis"]
    cand_skills = [s.lower() for s in candidate.get("skills", [])]
    matched = sum(1 for r in required if any(r in c or c in r for c in cand_skills))
    skills_score = (matched / len(required)) * 40
    score += skills_score
    notes.append(f"Skills: {matched}/{len(required)} → {skills_score:.0f}/40")

    # Experience (30 pts) — requires 5 years
    exp = candidate.get("experience_years", 0)
    if exp >= 5:
        exp_score = 30
    elif exp >= 3.5:  # 70% of 5
        exp_score = 20
    else:
        exp_score = 10
    score += exp_score
    notes.append(f"Exp: {exp}yr → {exp_score}/30")

    # Education (15 pts) — requires bachelor
    edu_levels = ["high_school", "diploma", "bachelor", "master", "phd"]
    cand_edu = candidate.get("education_level", "").lower()
    try:
        if edu_levels.index(cand_edu) >= edu_levels.index("bachelor"):
            edu_score = 15
        else:
            edu_score = 7
    except ValueError:
        edu_score = 0
    score += edu_score
    notes.append(f"Edu: {cand_edu} → {edu_score}/15")

    # Location (10 pts) — JD is Dubai
    if candidate.get("emirate", "").lower() == "dubai":
        loc_score = 10
    else:
        loc_score = 5
    score += loc_score
    notes.append(f"Loc: {candidate.get('emirate')} → {loc_score}/10")

    # UAE National (5 pts)
    uae_score = 5 if candidate.get("is_uae_national") else 0
    score += uae_score
    notes.append(f"UAE: {uae_score}/5")

    return min(score, 100), notes


# ═══════════════════════════════════════════════════════════════
# 4.  RUN TEST
# ═══════════════════════════════════════════════════════════════
def run_test():
    """Run the matching accuracy test."""
    print("=" * 72)
    print("  MATCHING ENGINE ACCURACY TEST")
    print("=" * 72)
    print(f"  JD: {TEST_JD['basic_info']['title']}")
    print(f"  Required Skills: {', '.join(TEST_JD['requirements']['skills'])}")
    print(f"  Experience: 5 years | Education: Bachelor | Location: Dubai")
    print(f"  Candidates: {len(TEST_CANDIDATES)}")
    print("=" * 72)

    # ── Print expected scores ──
    print("\n📋 EXPECTED SCORES (rule-based calculation):")
    print("-" * 72)
    for c in TEST_CANDIDATES:
        exp_score, notes = calculate_expected_rule_score(c)
        name = f"{c['first_name']} {c['last_name']}"
        print(f"  {c['candidate_id']} | {name:<25s} | Expected: {exp_score:5.1f}/100")
        for n in notes:
            print(f"       {n}")
        print()

    # ── Run matching engine ──
    print("\n🚀 RUNNING MATCHING ENGINE...")
    print("-" * 72)

    engine = AICandidateMatchingEngineFinal()

    # Force rule-based scoring by temporarily disabling AI engine
    original_engine = engine.matching_engine
    engine.matching_engine = None  # Force rule-based scoring for deterministic test

    result = engine.match_candidates_for_job(
        TEST_JD,
        TEST_CANDIDATES,
        employment_status_filter=None,
        top_n=len(TEST_CANDIDATES)
    )

    # Restore
    engine.matching_engine = original_engine

    if not result.get("success"):
        print(f"\n❌ MATCHING FAILED: {result.get('error', 'Unknown error')}")
        return False

    matches = result.get("top_matches", [])
    print(f"\n  Engine returned {len(matches)} matches\n")

    # ── Collect results ──
    results = []
    for match in matches:
        cid = match["candidate"]["candidate_id"]
        score = match["match_score"]
        breakdown = match.get("score_breakdown", {})
        matching = match.get("matching_skills", [])
        missing = match.get("missing_skills", [])
        strengths = match.get("strengths", [])
        concerns = match.get("concerns", [])
        results.append({
            "candidate_id": cid,
            "name": f"{match['candidate'].get('first_name', '?')} {match['candidate'].get('last_name', '?')}",
            "score": score,
            "breakdown": breakdown,
            "matching_skills": matching,
            "missing_skills": missing,
            "strengths": strengths,
            "concerns": concerns,
        })

    # Sort by score descending (engine should already do this)
    results.sort(key=lambda x: x["score"], reverse=True)

    # ── Print actual results ──
    print("📊 ACTUAL ENGINE RESULTS:")
    print("-" * 72)
    for i, r in enumerate(results, 1):
        print(f"  #{i}  ID:{r['candidate_id']}  {r['name']:<25s}  Score: {r['score']:5.1f}/100")
        if r["breakdown"]:
            bd = r["breakdown"]
            parts = [f"{k}={v:.0f}" if isinstance(v, float) else f"{k}={v}" for k, v in bd.items()]
            print(f"       Breakdown: {', '.join(parts)}")
        if r["matching_skills"]:
            print(f"       Matching: {', '.join(r['matching_skills'])}")
        if r["missing_skills"]:
            print(f"       Missing:  {', '.join(r['missing_skills'])}")
        print()

    # ── Validate ──
    print("\n✅ VALIDATION:")
    print("-" * 72)

    all_passed = True
    actual_ranking = [r["candidate_id"] for r in results]

    # Check 1: Ranking order
    print("\n  📌 Test 1: Ranking Order")
    if actual_ranking == EXPECTED_RANKING:
        print(f"     ✅ PASS — Ranking matches expected: {actual_ranking}")
    else:
        print(f"     ❌ FAIL — Expected: {EXPECTED_RANKING}")
        print(f"              Actual:   {actual_ranking}")
        all_passed = False

    # Check 2: Score ranges
    print("\n  📌 Test 2: Score Ranges")
    for r in results:
        cid = r["candidate_id"]
        score = r["score"]
        expected_range = EXPECTED_SCORE_RANGES.get(cid)
        if expected_range:
            lo, hi = expected_range
            in_range = lo <= score <= hi
            status = "✅ PASS" if in_range else "❌ FAIL"
            print(f"     {status} — {r['name']:<25s} Score: {score:5.1f}  (expected: {lo}-{hi})")
            if not in_range:
                all_passed = False

    # Check 3: Perfect candidate should have all skills matched
    print("\n  📌 Test 3: Skill Matching Accuracy")
    perfect_match = next((r for r in results if r["candidate_id"] == 9001), None)
    if perfect_match:
        missing = perfect_match.get("missing_skills", [])
        if not missing:
            print(f"     ✅ PASS — Perfect candidate has 0 missing skills")
        else:
            print(f"     ❌ FAIL — Perfect candidate has {len(missing)} missing skills: {missing}")
            all_passed = False

    # Check 4: No-match candidate should have 0 matching skills
    no_match = next((r for r in results if r["candidate_id"] == 9005), None)
    if no_match:
        matched = no_match.get("matching_skills", [])
        if len(matched) == 0:
            print(f"     ✅ PASS — No-match candidate has 0 matching skills")
        else:
            print(f"     ⚠️  WARN — No-match candidate matched {len(matched)} skills: {matched}")
            # Not a hard failure, could be fuzzy matching

    # Check 5: Candidate A > Candidate B > Candidate C (strict ordering for top 3)
    print("\n  📌 Test 4: Top-3 Strict Score Ordering")
    score_a = next((r["score"] for r in results if r["candidate_id"] == 9001), 0)
    score_b = next((r["score"] for r in results if r["candidate_id"] == 9002), 0)
    score_c = next((r["score"] for r in results if r["candidate_id"] == 9003), 0)
    if score_a > score_b > score_c:
        print(f"     ✅ PASS — A({score_a:.0f}) > B({score_b:.0f}) > C({score_c:.0f})")
    else:
        print(f"     ❌ FAIL — A({score_a:.0f}), B({score_b:.0f}), C({score_c:.0f})")
        all_passed = False

    # ── Summary ──
    print("\n" + "=" * 72)
    if all_passed:
        print("  🎉 ALL TESTS PASSED!")
    else:
        print("  ⚠️  SOME TESTS FAILED — Review results above")
    print("=" * 72)

    return all_passed


if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
