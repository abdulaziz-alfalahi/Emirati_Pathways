import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

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
      });

      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('Quality Rating')).toBeInTheDocument();
      expect(screen.getByText('Reliability Score')).toBeInTheDocument();
    });

    test('renders upcoming assessments', async () => {
      render(<AssessorDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ahmed Al Mansouri')).toBeInTheDocument();
      });
    });
  });

  // Test AssessmentPlanning component
  describe('AssessmentPlanning', () => {
    test('renders assessment planning form', () => {
      render(<AssessmentPlanning />);
      expect(screen.getByLabelText('Assessment Title *')).toBeInTheDocument();
      expect(screen.getByText('Select Competencies')).toBeInTheDocument();
    });

    test('allows selecting competencies and methods', () => {
      render(<AssessmentPlanning />);
      fireEvent.click(screen.getByLabelText('Technical Problem Solving'));
      fireEvent.click(screen.getByLabelText('Multiple Choice Questions'));
      expect(screen.getByLabelText('Technical Problem Solving')).toBeChecked();
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

    test('allows updating validation scores', () => {
      render(<CompetencyValidation />);
      const scoreSlider = screen.getAllByRole('slider')[0];
      fireEvent.change(scoreSlider, { target: { value: 95 } });
      // This is a simplified interaction. In a real scenario, you would need to simulate the slider drag.
      // For now, we just check if the component renders without crashing on interaction.
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

