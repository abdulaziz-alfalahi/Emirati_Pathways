import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import AdvancedAnalyticsDashboard from './analytics/AdvancedAnalyticsDashboard';
import ResponsiveLayout from './layout/ResponsiveLayout';
import MobileJobSearch from './mobile/MobileJobSearch';

const mock = new MockAdapter(axios);

describe('Advanced Features Frontend Components', () => {

    describe('AdvancedAnalyticsDashboard', () => {
        beforeEach(() => {
            mock.onGet('/api/advanced-analytics/dashboard').reply(200, {
                success: true,
                data: {
                    employment_trends: { summary: { total_applications: 5000, average_success_rate: 65 } },
                    emiratization_progress: { summary: { overall_emiratization_ratio: 25 } },
                    user_engagement: { summary: { total_active_users: 1200 } },
                    key_insights: [{ id: '1', type: 'trend', title: 'Test Insight', description: 'A test insight', confidence_score: 0.9, priority: 'high', created_at: '2025-09-20' }],
                    predictive_insights: { predictions: [], recommendations: [] }
                }
            });
        });

        it('renders the advanced analytics dashboard and loads data', async () => {
            render(<AdvancedAnalyticsDashboard userType="admin" authToken="test-token" />);
            
            await waitFor(() => {
                expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
                expect(screen.getByText('Total Applications')).toBeInTheDocument();
                expect(screen.getByText('5.0K')).toBeInTheDocument(); // Formatted number
            });
        });

        it('switches between tabs', async () => {
            render(<AdvancedAnalyticsDashboard userType="admin" authToken="test-token" />);
            
            await waitFor(() => {
                fireEvent.click(screen.getByText('Employment'));
                expect(screen.getByText('Sector Performance')).toBeInTheDocument();
            });
        });
    });

    describe('ResponsiveLayout', () => {
        it('renders the responsive layout with sidebar on desktop', () => {
            render(<ResponsiveLayout userType="job_seeker"><div>Test Content</div></ResponsiveLayout>);
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        it('renders the responsive layout with a mobile menu button on smaller screens', () => {
            // Mock window width
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
            render(<ResponsiveLayout userType="job_seeker"><div>Test Content</div></ResponsiveLayout>);
            expect(screen.getByText('EJ Platform')).toBeInTheDocument(); // Mobile title
            expect(screen.queryByText('Dashboard')).not.toBeInTheDocument(); // Sidebar not visible
        });
    });

    describe('MobileJobSearch', () => {
        beforeEach(() => {
            mock.onGet('/api/jobs').reply(200, {
                success: true,
                jobs: [
                    { id: '1', title: 'Test Job', company: 'Test Corp', location: 'Dubai', salary_range: '10k-15k', employment_type: 'Full-time', posted_date: '2025-09-19', description: 'A test job' }
                ]
            });
            mock.onGet('/api/jobs/saved').reply(200, { success: true, saved_jobs: [] });
            mock.onGet('/api/applications').reply(200, { success: true, applications: [] });
        });

        it('renders the mobile job search and lists jobs', async () => {
            render(<MobileJobSearch authToken="test-token" />);
            
            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search jobs...')).toBeInTheDocument();
                expect(screen.getByText('Test Job')).toBeInTheDocument();
            });
        });

        it('opens the filter sheet when the filter button is clicked', async () => {
            render(<MobileJobSearch authToken="test-token" />);
            
            fireEvent.click(screen.getByRole('button', { name: /slidershorizontal/i }));

            await waitFor(() => {
                expect(screen.getByText('Filter Jobs')).toBeInTheDocument();
            });
        });

        it('opens the job detail sheet when a job is selected', async () => {
            render(<MobileJobSearch authToken="test-token" />);
            
            await waitFor(() => {
                fireEvent.click(screen.getByText('View'));
            });

            await waitFor(() => {
                expect(screen.getByText('Job Description')).toBeInTheDocument();
            });
        });
    });

});
