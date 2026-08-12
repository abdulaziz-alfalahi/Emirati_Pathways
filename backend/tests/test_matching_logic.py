
import sys
import os
import unittest
from datetime import datetime
from dataclasses import dataclass, field

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.enhanced_matching_service import EnhancedMatchingEngine, JobRequirements, CandidateProfile as MatchingProfile, MatchingCriteria, MIN_COVERAGE

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


class TestScoreHonesty(unittest.TestCase):
    """The match score must never be assembled from data nobody supplied (#352).

    A real candidate with an empty profile was shown 45.2%, of which zero points
    came from her skills — the only criterion derived from her. Every point came
    from criteria where neither side had stated anything: industry 100 because
    the caller passes industry='', education 50 because it passes
    education_requirements=[], experience 100 because the job's requirement
    could not be parsed and so read as "0 years required".
    """

    def setUp(self):
        self.engine = EnhancedMatchingEngine()

    def _job(self, **kw):
        base = dict(id="j", required_skills=["Python"], preferred_skills=[],
                    min_experience=3, max_experience=8, education_requirements=["Bachelor"],
                    location={"emirate": "Dubai"}, salary_range={"min_salary": 10000, "max_salary": 20000},
                    languages=["English"], industry="Technology", company_size="Large",
                    career_level="Mid_Level", emiratization_priority=False)
        base.update(kw)
        return JobRequirements(**base)

    def _candidate(self, **kw):
        base = dict(id="c", skills=["Python"], experience_years=4, education_level="Bachelor",
                    location={"emirate": "Dubai"}, salary_expectation={"min_salary": 12000, "max_salary": 18000},
                    languages=["English"], industry_experience=["Technology"],
                    career_level="Mid_Level", is_uae_national=True)
        base.update(kw)
        return MatchingProfile(**base)

    def test_empty_profile_gets_no_score_at_all(self):
        """Dhabya's exact case. The 45.2% must be gone — and not replaced by 0,
        which would read as 'assessed and hopeless' rather than 'not assessed'."""
        empty = self._candidate(skills=[], experience_years=None, education_level="",
                                location={}, salary_expectation=None, languages=[],
                                industry_experience=[], career_level="")
        score = self.engine.calculate_match_score(empty, self._job(min_experience=0,
                                                                  education_requirements=[],
                                                                  industry="", languages=[],
                                                                  salary_range=None))
        self.assertIsNone(score.overall_score)
        self.assertEqual(score.withheld_reason, 'no_skills')

    def test_no_skills_withholds_even_when_everything_else_aligns(self):
        """Owner decision 2026-08-12: no score without skills evidence, however
        many other criteria happen to line up."""
        no_skills = self._candidate(skills=[])
        score = self.engine.calculate_match_score(no_skills, self._job())
        self.assertIsNone(score.overall_score)
        self.assertEqual(score.withheld_reason, 'no_skills')

    def test_thin_data_withholds_below_the_coverage_threshold(self):
        """Skills known but little else: below MIN_COVERAGE, publish nothing."""
        thin = self._candidate(experience_years=None, education_level="", location={},
                               salary_expectation=None, languages=[], industry_experience=[],
                               career_level="")
        score = self.engine.calculate_match_score(thin, self._job(
            min_experience=0, education_requirements=[], location={}, salary_range=None,
            languages=[], industry="", career_level=""))
        self.assertLess(score.coverage, MIN_COVERAGE)
        self.assertIsNone(score.overall_score)
        self.assertEqual(score.withheld_reason, 'insufficient_data')

    def test_unstated_fields_do_not_add_points(self):
        """The heart of #352: removing information from BOTH sides must not raise
        the score. Previously industry='' scored 100 and salary-unknown scored 50."""
        cand, job = self._candidate(), self._job()
        full = self.engine.calculate_match_score(cand, job)
        stripped = self.engine.calculate_match_score(
            self._candidate(industry_experience=[], salary_expectation=None),
            self._job(industry="", salary_range=None))
        self.assertIsNotNone(full.overall_score)
        self.assertIsNotNone(stripped.overall_score)
        self.assertLessEqual(stripped.overall_score, full.overall_score + 0.01,
                             "unstated fields inflated the score")
        self.assertIn('industry', stripped.unscored)
        self.assertIn('salary', stripped.unscored)

    def test_unparsed_experience_requirement_is_not_a_perfect_match(self):
        """A job whose requirement could not be parsed reads as min_experience=0.
        A candidate with no experience must not score 100 against it — that alone
        was 20 of the 45.2 points."""
        score = self.engine.calculate_match_score(
            self._candidate(experience_years=0), self._job(min_experience=0))
        self.assertIn('experience', score.unscored)
        self.assertNotIn('experience', score.criteria_scores)

    def test_full_data_can_reach_a_true_100(self):
        """Two weighted criteria are never computed, so without renormalisation the
        achievable maximum was 90 while still being called a percentage."""
        score = self.engine.calculate_match_score(
            self._candidate(skills=["Python"]), self._job(required_skills=["Python"]))
        self.assertEqual(score.coverage, 1.0)
        self.assertIsNotNone(score.overall_score)
        self.assertGreater(score.overall_score, 90)
