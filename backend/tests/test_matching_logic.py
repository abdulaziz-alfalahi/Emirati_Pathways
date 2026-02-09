
import sys
import os
import unittest
from datetime import datetime
from dataclasses import dataclass, field

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.enhanced_matching_service import EnhancedMatchingEngine, JobRequirements, CandidateProfile as MatchingProfile, MatchingCriteria

class TestEnhancedMatching(unittest.TestCase):
    def setUp(self):
        self.engine = EnhancedMatchingEngine()

    def test_perfect_match_with_emiratization(self):
        """Test a perfect match scenario including Emiratization bonus"""
        candidate = MatchingProfile(
            id="1",
            skills=["Python", "Flask", "React", "SQL"],
            experience_years=4,
            education_level="Bachelor",
            location={"emirate": "Dubai"},
            salary_expectation={"min_salary": 15000, "max_salary": 20000},
            languages=["English", "Arabic"],
            industry_experience=["Technology"],
            career_level="Mid_Level",
            is_uae_national=True
        )
        
        job = JobRequirements(
            id="job1",
            required_skills=["Python", "SQL"],
            preferred_skills=["React"],
            min_experience=3,
            max_experience=6,
            education_requirements=["Bachelor"],
            location={"emirate": "Dubai"},
            salary_range={"min_salary": 15000, "max_salary": 25000},
            languages=["English", "Arabic"],
            industry="Technology",
            company_size="Large",
            career_level="Mid_Level",
            emiratization_priority=True
        )
        
        score = self.engine.calculate_match_score(candidate, job)
        
        print(f"\n[Test Perfect Match] Score: {score.overall_score}")
        print(f"Breakdown: {score.criteria_scores}")
        print(f"Emiratization Bonus: {score.emiratization_bonus}")
        
        # Should be very high score
        self.assertGreater(score.overall_score, 90)
        # Should have bonus
        self.assertGreater(score.emiratization_bonus, 0)
        # Industry and Career Level should be high
        self.assertEqual(score.criteria_scores.get(MatchingCriteria.INDUSTRY.value), 100.0)
        self.assertEqual(score.criteria_scores.get(MatchingCriteria.CAREER_LEVEL.value), 100.0)

    def test_mismatched_experience_and_industry(self):
        """Test a scenario with mismatches to verify scoring penalties"""
        candidate = MatchingProfile(
            id="2",
            skills=["HTML", "CSS"], # Missing required Python
            experience_years=1, # Too junior
            education_level="High School", # Below Bachelor
            location={"emirate": "Sharjah"}, # Different location
            salary_expectation={"min_salary": 5000, "max_salary": 8000},
            languages=["English"],
            industry_experience=["Retail"], # Mismatch
            career_level="Entry_Level", # Mismatch
            is_uae_national=False
        )
        
        job = JobRequirements(
            id="job2",
            required_skills=["Python", "Django"], 
            preferred_skills=[],
            min_experience=5,
            max_experience=8,
            education_requirements=["Bachelor"],
            location={"emirate": "Dubai"},
            salary_range={"min_salary": 20000, "max_salary": 30000},
            languages=["English"],
            industry="Technology",
            company_size="Small",
            career_level="Senior",
            emiratization_priority=False
        )
        
        score = self.engine.calculate_match_score(candidate, job)
        
        print(f"\n[Test Mismatch] Score: {score.overall_score}")
        print(f"Breakdown: {score.criteria_scores}")
        
        # Should be low score
        self.assertLess(score.overall_score, 50)
        # Industry and Career Level should be lower
        self.assertLess(score.criteria_scores.get(MatchingCriteria.INDUSTRY.value), 100.0)
        self.assertLess(score.criteria_scores.get(MatchingCriteria.CAREER_LEVEL.value), 100.0)

if __name__ == '__main__':
    unittest.main()
