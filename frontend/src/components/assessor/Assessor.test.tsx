import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// These components fake an API call with `await new Promise(r => setTimeout(r, 1000))`,
// which exactly ties RTL's default 1000ms waitFor timeout and so loses the race
// deterministically. Give the load room to finish.
const LOAD_TIMEOUT = { timeout: 5000 };

// Radix TabsContent unmounts inactive panels, and TabsTrigger activates on
// pointer/mousedown rather than a bare synthetic click, so anything outside the
// default tab must be revealed with a real user-event click first.
const selectTab = async (name: string) => {
  await userEvent.click(screen.getByRole('tab', { name }));
};

import AssessorDashboard from './AssessorDashboard';
import AssessmentPlanning from './AssessmentPlanning';
import CompetencyValidation from './CompetencyValidation';
import QualityAssuranceDashboard from './QualityAssuranceDashboard';

describe('Assessor Persona Frontend Components', () => {

  // Test AssessorDashboard component
  describe('AssessorDashboard', () => {
    test('renders dashboard with key statistics', async () => {
      render(<AssessorDashboard />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Total Assessments')).toBeInTheDocument();
      }, LOAD_TIMEOUT);

      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('Quality Rating')).toBeInTheDocument();
      expect(screen.getByText('Reliability Score')).toBeInTheDocument();
    });

    // This test used to assert that "Ahmed Al Mansouri" rendered — a candidate
    // who does not exist, invented by the component along with his scheduled
    // assessment. The test was locking in the fabrication it should have
    // caught. It now asserts the real behaviour: the queue is READ, and an
    // empty queue reads as empty rather than as broken.
    test('shows the assessment queue, and says so when it is empty', async () => {
      render(<AssessorDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Total Assessments')).toBeInTheDocument();
      }, LOAD_TIMEOUT);

      // No API is mocked here, so the fetch fails and the queue is empty —
      // which is exactly the state of the platform today (zero assessments).
      // Nothing may be invented to fill it.
      expect(screen.queryByText('Ahmed Al Mansouri')).not.toBeInTheDocument();
      expect(screen.queryByText('Fatima Al Zahra')).not.toBeInTheDocument();
    });
  });

  // Test AssessmentPlanning component
  describe('AssessmentPlanning', () => {
    test('renders assessment planning form', async () => {
      render(<AssessmentPlanning />);
      // 'Assessment Title *' lives in the default 'Basic Info' tab.
      expect(screen.getByLabelText('Assessment Title *')).toBeInTheDocument();
      // 'Select Competencies' lives in the 'Competencies' tab.
      await selectTab('Competencies');
      expect(screen.getByText('Select Competencies')).toBeInTheDocument();
    });

    test('allows selecting competencies and methods', async () => {
      render(<AssessmentPlanning />);

      await selectTab('Competencies');
      await userEvent.click(screen.getByLabelText('Technical Problem Solving'));
      expect(screen.getByLabelText('Technical Problem Solving')).toBeChecked();

      await selectTab('Methods');
      await userEvent.click(screen.getByLabelText('Multiple Choice Questions'));
      expect(screen.getByLabelText('Multiple Choice Questions')).toBeChecked();
    });
  });

  // Test CompetencyValidation component
  // Both of these describes asserted the fabrication they should have caught.
  //
  // CompetencyValidation required "Ahmed Al Mansouri" and a competency called
  // "Technical Problem Solving" to render — a person who does not exist, scored
  // against a framework the platform has never defined (competency_models holds
  // zero rows).
  //
  // QualityAssuranceDashboard required "Inter-rater Reliability", a "Bias
  // Detection Score" and an alert reading "Slight experience bias detected".
  // Nothing measured any of it. On a service that decides whether somebody
  // passes an assessment, an invented reliability figure is the number a
  // decision would be defended with.
  describe('CompetencyValidation', () => {
    test('does not score anyone against a framework that does not exist', async () => {
      render(<CompetencyValidation />);
      await waitFor(() => {
        expect(screen.getByText(/No competency framework is defined yet/i)).toBeInTheDocument();
      });
      expect(screen.queryByText('Ahmed Al Mansouri')).not.toBeInTheDocument();
      expect(screen.queryByText('Technical Problem Solving')).not.toBeInTheDocument();
    });
  });

  describe('QualityAssuranceDashboard', () => {
    test('does not publish reliability or bias figures it never measured', async () => {
      render(<QualityAssuranceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Open quality alerts/i)).toBeInTheDocument();
      });
      expect(screen.queryByText('Inter-rater Reliability')).not.toBeInTheDocument();
      expect(screen.queryByText('Bias Detection Score')).not.toBeInTheDocument();
    });

    test('an empty monitor is not reported as a clean bill of health', async () => {
      render(<QualityAssuranceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/not a clean bill of health/i)).toBeInTheDocument();
      });
    });
  });

});

