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

    test('renders upcoming assessments', async () => {
      render(<AssessorDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ahmed Al Mansouri')).toBeInTheDocument();
      }, LOAD_TIMEOUT);
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
  describe('CompetencyValidation', () => {
    test('renders competency validation interface', async () => {
      render(<CompetencyValidation />);
      await waitFor(() => {
        expect(screen.getByText('Ahmed Al Mansouri')).toBeInTheDocument();
      });
      expect(screen.getByText('Technical Problem Solving')).toBeInTheDocument();
    });

    test('allows updating validation scores', async () => {
      render(<CompetencyValidation />);

      // The score sliders live in the 'Validation' tab, not the default 'Assessment' tab.
      await selectTab('Validation');

      const scoreSlider = screen.getAllByRole('slider')[0];
      // Every score slider must expose an accessible name, otherwise screen-reader
      // users cannot tell which criterion they are scoring.
      expect(scoreSlider).toHaveAccessibleName();

      const before = Number(scoreSlider.getAttribute('aria-valuenow'));

      // Radix's slider thumb is a <span>, not <input type="range">, so fireEvent.change
      // is a no-op; it responds to keyboard/pointer input.
      scoreSlider.focus();
      await userEvent.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(Number(scoreSlider.getAttribute('aria-valuenow'))).toBe(before + 1);
      });
    });
  });

  // Test QualityAssuranceDashboard component
  describe('QualityAssuranceDashboard', () => {
    test('renders quality assurance dashboard with metrics', async () => {
      render(<QualityAssuranceDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Inter-rater Reliability')).toBeInTheDocument();
      });
      expect(screen.getByText('Bias Detection Score')).toBeInTheDocument();
    });

    test('displays quality alerts', async () => {
      render(<QualityAssuranceDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Active Quality Alerts')).toBeInTheDocument();
      });
      expect(screen.getByText(/Slight experience bias detected/)).toBeInTheDocument();
    });
  });

});

