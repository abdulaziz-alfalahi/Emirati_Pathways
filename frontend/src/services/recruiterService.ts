import apiClient from './apiClient';

export interface RecruiterAnalytics {
    total_matches: number;
    average_score: number;
    qualification_rate: number;
    stored_data: any;
}

export interface Candidate {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    match: number;
    status: string; // 'approved', 'recommended', etc.
    hr_feedback?: string;
    salary_expectation?: string;
}

export interface JobDescription {
    id: string;
    title: string;
    company_name: string;
    status: string;
}

export interface InterviewScheduleData {
    jd_id: string;
    candidate_id: string;
    interview_type: string;
    scheduled_time: string; // ISO format
    location?: string;
    notes?: string;
}

export const recruiterService = {
    // Analytics
    getAnalytics: async (): Promise<RecruiterAnalytics> => {
        // Fallback to mock data if API fails (for demo stability)
        try {
            const response = await apiClient.get('/recruiter/analytics');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error('Analytics API failed');
        } catch (error) {
            console.warn('Fetching analytics failed, using fallback mock data.', error);
            return {
                total_matches: 0,
                average_score: 0,
                qualification_rate: 0,
                stored_data: {}
            };
        }
    },

    // Job Descriptions
    getJobDescriptions: async (): Promise<JobDescription[]> => {
        try {
            const response = await apiClient.get('/recruiter/jd/list');
            // Handle various response structures gracefully
            const jds = response.data.job_descriptions || response.data.data || [];
            return jds.filter((jd: any) => jd.status === 'active' || jd.status === 'published');
        } catch (error) {
            console.error('Error loading job descriptions:', error);
            return [];
        }
    },

    // Candidates for a JD
    getShortlistedCandidates: async (jdId: string): Promise<{ id: string, candidate: Candidate }[]> => {
        try {
            const response = await apiClient.get(`/recruiter/shortlist/${jdId}`);
            if (response.data.success && response.data.data) {
                return response.data.data.filter(
                    (item: any) => item.status === 'shortlisted' || item.status === 'interviewed'
                );
            }
            return [];
        } catch (error) {
            console.error('Error loading candidates:', error);
            return [];
        }
    },

    // Pipeline Data (Vacancy Decision)
    getPipelineCandidates: async (jdId: string): Promise<Candidate[]> => {
        // TODO: Replace with real API endpoint when available: `/recruiter/pipeline/${jdId}`
        // For now, return the mock data used in VacancyDecision.tsx
        return [
            {
                id: "1",
                first_name: "Khalid",
                last_name: "Al Mazrouei",
                email: "khalid@example.com",
                role: "Senior Developer",
                status: "approved",
                match: 95,
                hr_feedback: "Excellent technical skills. Approved for offer.",
                salary_expectation: "25,000 AED"
            },
            {
                id: "2",
                first_name: "Sara",
                last_name: "Ahmed",
                email: "sara@example.com",
                role: "Senior Developer",
                status: "recommended",
                match: 88,
                hr_feedback: "Pending Review",
                salary_expectation: "22,000 AED"
            }
        ];
    },

    // Schedule Interview
    scheduleInterview: async (data: InterviewScheduleData): Promise<any> => {
        const response = await apiClient.post('/recruiter/interviews/schedule', data);
        return response.data;
    },

    // Send Offer
    sendOffer: async (offerData: any): Promise<any> => {
        // TODO: Implement real endpoint
        // return apiClient.post('/recruiter/offers/send', offerData);
        return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, message: "Offer Sent (Mock)" }), 1000);
        });
    }
};
