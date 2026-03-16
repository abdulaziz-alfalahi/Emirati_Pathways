
import axios from 'axios';
import { getAuthToken } from '@/utils/tokenUtils';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';

export interface ScholarshipData {
    title: string;
    provider: string;
    description: string;
    amount: string;
    coverage_type: string;
    deadline: string;
    min_gpa: number;
    academic_level: string;
    eligible_majors: string[];
    application_link: string;
}

export const educatorService = {
    createScholarship: async (data: ScholarshipData) => {
        try {
            // Get token from localStorage (assuming authService stores it there)
            const token = getAuthToken();
            const response = await axios.post(`${API_URL}/api/educator/scholarships`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating scholarship:', error);
            throw error;
        }
    }
};
