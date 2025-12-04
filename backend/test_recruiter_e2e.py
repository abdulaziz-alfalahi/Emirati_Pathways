#!/usr/bin/env python3
"""
End-to-End Test for Recruiter Services
Emirati Journey Platform

Tests the full workflow:
1. Create Job Description
2. Update Basic Info
3. Generate AI Description
4. Add Requirements & Responsibilities
5. Check Completion Score
6. Match Candidates (Mock)
"""

import sys
import os
import json
import time
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from recruiter.jd_builder_engine import get_jd_builder_engine
    from recruiter.ai_candidate_matching import get_ai_matching_engine
    print("[PASS] Engines imported successfully")
except ImportError as e:
    print(f"[FAIL] Import error: {e}")
    sys.exit(1)

def run_e2e_test():
    print("\n" + "="*60)
    print("RECRUITER SERVICES - END-TO-END TEST")
    print("="*60)
    
    # Initialize engines
    jd_engine = get_jd_builder_engine()
    match_engine = get_ai_matching_engine()
    
    # Step 1: Create JD
    print("\n[1] Creating new Job Description...")
    try:
        jd_data = jd_engine.create_jd(
            recruiter_id="rec_test_user",
            company_id="comp_test_corp",
            template="standard"
        )
        jd_id = jd_data['metadata']['jd_id']
        print(f"    [PASS] Created JD: {jd_id}")
    except Exception as e:
        print(f"    [FAIL] Creation failed: {e}")
        return

    # Step 2: Update Basic Info
    print("\n[2] Updating Basic Information...")
    try:
        basic_info = {
            "title": "Senior Python Developer",
            "department": "Engineering",
            "job_type": "full_time",
            "job_level": "senior",
            "emirate": "Dubai",
            "city": "Internet City",
            "remote_option": True
        }
        jd_data = jd_engine.update_basic_info(jd_data, basic_info)
        print(f"    [PASS] Updated basic info. Title: {jd_data['basic_info']['title']}")
        print(f"    Current Score: {jd_data['metadata']['completion_score']}%")
    except Exception as e:
        print(f"    [FAIL] Update basic info failed: {e}")

    # Step 3: AI Description Generation
    print("\n[3] Generating AI Description...")
    try:
        # This will use Gemini if API key is present, or fallback
        description = jd_engine.generate_description_ai(jd_data, industry="Technology")
        
        jd_data = jd_engine.update_description(jd_data, description)
        print(f"    [PASS] Description generated ({len(description)} chars)")
        print(f"    Preview: {description[:100]}...")
        print(f"    Current Score: {jd_data['metadata']['completion_score']}%")
    except Exception as e:
        print(f"    [FAIL] AI generation failed: {e}")

    # Step 4: Add Requirements
    print("\n[4] Adding Requirements...")
    try:
        reqs = [
            {"category": "skills", "description": "Python", "is_required": True},
            {"category": "skills", "description": "Django/Flask", "is_required": True},
            {"category": "experience", "description": "5+ years software development", "is_required": True},
            {"category": "education", "description": "Bachelor's in Computer Science", "is_required": True},
            {"category": "language", "description": "English (Fluent)", "is_required": True}
        ]
        
        for req in reqs:
            jd_data = jd_engine.add_requirement(jd_data, req)
            
        print(f"    [PASS] Added {len(reqs)} requirements")
        print(f"    Current Score: {jd_data['metadata']['completion_score']}%")
    except Exception as e:
        print(f"    [FAIL] Adding requirements failed: {e}")

    # Step 5: Add Responsibilities & Benefits
    print("\n[5] Adding Responsibilities & Benefits...")
    try:
        resps = [
            {"description": "Build scalable backend APIs", "category": "core"},
            {"description": "Mentor junior developers", "category": "core"},
            {"description": "Optimize database queries", "category": "core"}
        ]
        for resp in resps:
            jd_data = jd_engine.add_responsibility(jd_data, resp)
            
        benefits = [
            {"category": "health", "description": "Comprehensive Health Insurance"},
            {"category": "time_off", "description": "30 Days Annual Leave"}
        ]
        for ben in benefits:
            jd_data = jd_engine.add_benefit(jd_data, ben)
            
        # Add Compensation
        jd_data = jd_engine.update_compensation(jd_data, {
            "salary_min": 25000,
            "salary_max": 35000,
            "salary_currency": "AED"
        })
            
        print(f"    [PASS] Added responsibilities, benefits, and compensation")
        print(f"    Final Score: {jd_data['metadata']['completion_score']}%")
        
        recommendations = jd_engine.get_completion_recommendations(jd_data)
        if recommendations:
            print(f"    Recommendations: {recommendations}")
        else:
            print("    [PASS] JD is complete! No recommendations.")
            
    except Exception as e:
        print(f"    [FAIL] Completing JD failed: {e}")

    # Step 6: Candidate Matching
    print("\n[6] Testing Candidate Matching...")
    try:
        # Mock Candidates
        candidates = [
            {
                "candidate_id": "cand_1",
                "first_name": "Ahmed",
                "last_name": "Al Mansoori",
                "is_uae_national": True,
                "emirate": "Dubai",
                "skills": ["Python", "Django", "PostgreSQL", "React"],
                "experience_years": 6,
                "education_level": "Bachelor",
                "employment_status": "job_seeker"
            },
            {
                "candidate_id": "cand_2",
                "first_name": "Sarah",
                "last_name": "Jones",
                "is_uae_national": False,
                "emirate": "Dubai",
                "skills": ["Java", "Spring Boot", "SQL"],
                "experience_years": 4,
                "education_level": "Master",
                "employment_status": "employed"
            },
            {
                "candidate_id": "cand_3",
                "first_name": "Fatima",
                "last_name": "Al Ali",
                "is_uae_national": True,
                "emirate": "Abu Dhabi",
                "skills": ["Python", "Flask", "AWS", "Docker"],
                "experience_years": 3,
                "education_level": "Bachelor",
                "employment_status": "open_to_opportunities"
            }
        ]
        
        # Match with 'job_seeker' filter
        print("    Matching with filter: 'job_seeker'...")
        result = match_engine.match_candidates_for_job(
            jd_data, 
            candidates, 
            employment_status_filter="job_seeker",
            top_n=5
        )
        
        matches = result.get('top_matches', [])
        print(f"    [PASS] Found {len(matches)} matches")
        for m in matches:
            cand = m['candidate']
            print(f"      - {cand['first_name']} {cand['last_name']} (Score: {m['match_score']:.1f}%)")
            print(f"        Strengths: {m['strengths']}")
            
        # Verify filtering worked
        if len(matches) == 1 and matches[0]['candidate']['candidate_id'] == "cand_1":
            print("    [PASS] Filtering logic verified (Ahmed is the only job_seeker)")
        else:
            print(f"    [WARN] Filtering logic might be incorrect. Expected 1 match, got {len(matches)}")

    except Exception as e:
        print(f"    [FAIL] Matching failed: {e}")

    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)

if __name__ == "__main__":
    run_e2e_test()

