'''
Comprehensive Backend Testing Suite for Assessor Persona

Tests the functionality of:
- Assessment Planning System
- Competency Validation Framework
- UAE NQF Integration System
- Quality Assurance System
'''

import unittest
import json
from unittest.mock import MagicMock, patch, ANY
from datetime import datetime

# Mock database connection
mock_db_connection_string = "postgresql://test:test@localhost:5432/test_db"

# Mock modules to be tested
from backend.assessment_planning_system import AssessmentPlanningSystem, AssessmentPlan
from backend.competency_validation_framework import CompetencyValidationFramework, CompetencyAssessment
from backend.uae_nqf_integration import UAENQFIntegration, NQFQualification
from backend.quality_assurance_system import QualityAssuranceSystem, QualityMetric, BiasAnalysis

class TestAssessorPersonaBackend(unittest.TestCase):

    def setUp(self):
        """Set up test environment for each test case"""
        self.mock_db_conn = MagicMock()
        self.mock_cursor = MagicMock()
        self.mock_db_conn.cursor.return_value = self.mock_cursor

        # Patch psycopg2.connect to return the mock connection
        self.psycopg2_connect_patch = patch('psycopg2.connect', return_value=self.mock_db_conn)
        self.psycopg2_connect_patch.start()

        # Instantiate system classes
        self.planning_system = AssessmentPlanningSystem(mock_db_connection_string)
        self.validation_framework = CompetencyValidationFramework(mock_db_connection_string)
        self.nqf_integration = UAENQFIntegration(mock_db_connection_string)
        self.qa_system = QualityAssuranceSystem(mock_db_connection_string)

    def tearDown(self):
        """Clean up after each test case"""
        self.psycopg2_connect_patch.stop()

    def test_assessment_planning_system(self):
        """Test Assessment Planning System"""
        # Test create_assessment_plan
        assessment_plan = AssessmentPlan(
            title="Test Assessment Plan",
            description="A test plan for backend testing",
            competencies=[1, 2],
            assessment_methods=['Case Study', 'Interview'],
            duration=120,
            instructions="Complete all tasks.",
            status='draft'
        )
        self.mock_cursor.fetchone.return_value = {'id': 1, 'created_at': datetime.now()}
        result = self.planning_system.create_assessment_plan(assessment_plan)
        self.assertTrue(result['success'])
        self.assertEqual(result['assessment_plan_id'], 1)

        # Test get_assessment_plan
        self.mock_cursor.fetchone.return_value = {
            'id': 1,
            'title': "Test Assessment Plan",
            'description': "A test plan for backend testing",
            'status': 'draft'
        }
        result = self.planning_system.get_assessment_plan(1)
        self.assertTrue(result['success'])
        self.assertEqual(result['assessment_plan']['title'], "Test Assessment Plan")

    def test_competency_validation_framework(self):
        """Test Competency Validation Framework"""
        # Test validate_competency_assessment
        assessment = CompetencyAssessment(
            id=1,
            candidate_id=1,
            competency_id=1,
            assessor_score=85,
            evidence_quality=0.9,
            validation_status='pending',
            validation_notes=''
        )
        self.mock_cursor.fetchone.return_value = {'id': 1, 'updated_at': datetime.now()}
        result = self.validation_framework.validate_competency_assessment(assessment)
        self.assertTrue(result['success'])
        self.assertEqual(result['validation_status'], 'validated')

    def test_uae_nqf_integration(self):
        """Test UAE NQF Integration System"""
        # Test create_nqf_qualification
        qualification = NQFQualification(
            title="Test NQF Qualification",
            nqf_level=6,
            qualification_type='academic',
            credit_points=180,
            issuing_authority='Test Authority'
        )
        self.mock_cursor.fetchone.return_value = {'id': 1, 'created_at': datetime.now()}
        result = self.nqf_integration.create_nqf_qualification(qualification)
        self.assertTrue(result['success'])
        self.assertEqual(result['qualification_id'], 1)

        # Test generate_digital_credential
        self.mock_cursor.fetchone.side_effect = [
            {'id': 1, 'qualification_code': 'TEST-CODE', 'title': 'Test Qualification', 'nqf_level': 6, 'validity_period_months': 60},
            {'id': 1, 'created_at': datetime.now()}
        ]
        result = self.nqf_integration.generate_digital_credential(1, 1, {})
        self.assertTrue(result['success'])
        self.assertIn('credential_id', result['credential'])

    def test_quality_assurance_system(self):
        """Test Quality Assurance System"""
        # Test calculate_inter_rater_reliability
        self.mock_cursor.fetchall.return_value = [
            {'competency_id': 1, 'assessor_score': 80, 'assessor_id': 1},
            {'competency_id': 1, 'assessor_score': 85, 'assessor_id': 2}
        ]
        result = self.qa_system.calculate_inter_rater_reliability(1)
        self.assertTrue(result['success'])
        self.assertAlmostEqual(result['overall_reliability'], 1.0, places=1)

        # Test detect_assessment_bias
        self.mock_cursor.fetchall.return_value = [
            {'gender': 'male', 'assessor_score': 80},
            {'gender': 'female', 'assessor_score': 90},
            {'gender': 'male', 'assessor_score': 75},
            {'gender': 'female', 'assessor_score': 95},
            {'gender': 'male', 'assessor_score': 85},
            {'gender': 'female', 'assessor_score': 88},
            {'gender': 'male', 'assessor_score': 78},
            {'gender': 'female', 'assessor_score': 92},
            {'gender': 'male', 'assessor_score': 82},
            {'gender': 'female', 'assessor_score': 89},
        ]
        result = self.qa_system.detect_assessment_bias(1)
        self.assertTrue(result['success'])
        self.assertFalse(result['bias_analyses'][0]['detected'])

if __name__ == '__main__':
    unittest.main(main)

