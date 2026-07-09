import axios from 'axios';
import { restClient } from '@/utils/api';
import { getAuthToken } from '@/utils/tokenUtils';

const API_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/v2/profile` : '/api/v2/profile';

// Types aligning with V2 Backend
export interface CandidateProfile {
    id: number;
    user_id: number;
    full_name: string;
    user?: {
        fullname: string;
        email: string;
    };
    headline: string;
    bio: string;
    contact: {
        phone: string;
        location: string;
        email: string;
        latitude?: number;
        longitude?: number;
    };
    media: {
        avatar: string;
        video_intro: string;
    };
    career_compass: {
        target_roles: string[];
        relocation: boolean;
        salary: string;
        notice_period: string;
    };
    assessments: Assessment[];
    english_proficiency?: string;
}

export interface Assessment {
    id: number;
    assessment_type: string;
    title: string;
    score: number;
    max_score: number;
    status: string;
    completed_at: string;
    d33_sector?: string;
}

export interface ExperienceEntry {
    id?: number;
    job_title: string;
    company: string;
    location: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    description: string;
}

export interface EducationEntry {
    id?: number;
    institution: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    grade: string;
    verification: {
        is_verified: boolean;
        source: string;
    };
}

const getHeaders = () => {
    const token = getAuthToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const profileService = {
    getProfile: async () => {
        try {
            // restClient sends the httpOnly cookie (withCredentials) and never the
            // 'cookie_authenticated' placeholder Bearer, so cookie auth succeeds.
            const response = await restClient.get(`${API_URL}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },

    updateIdentity: async (data: Partial<CandidateProfile>) => {
        try {
            const response = await restClient.put(`${API_URL}/identity`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    addExperience: async (entry: ExperienceEntry) => {
        try {
            const response = await restClient.post(`${API_URL}/experience`, entry);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    addEducation: async (entry: EducationEntry) => {
        try {
            const response = await restClient.post(`${API_URL}/education`, entry);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    uploadCV: async (file: File) => {
        const formData = new FormData();
        formData.append('cv_file', file);

        const uploadUrl = '/api/cv/upload';

        try {
            // restClient adds cookie auth + CSRF and sets the multipart boundary.
            const response = await restClient.post(uploadUrl, formData);
            return response.data;
        } catch (error) {
            console.error('CV Upload failed:', error);
            throw error;
        }
    },

    listCVs: async () => {
        try {
            const response = await restClient.get('/api/cv/list');
            return response.data;
        } catch (error) {
            console.error('Error listing CVs:', error);
            throw error;
        }
    },

    deleteCV: async (cvId: string) => {
        try {
            const response = await restClient.delete(`/api/cv/${cvId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting CV:', error);
            throw error;
        }
    },

    toggleCVVisibility: async (cvId: string, isVisible: boolean) => {
        try {
            // Check if endpoint exists, otherwise we might need to rely on generic update
            const response = await restClient.put(`/api/cv/${cvId}/visible`, { visible: isVisible });
            return response.data;
        } catch (error) {
            console.error('Error toggling CV visibility:', error);
            throw error;
        }
    },

    getDebugAuth: async () => {
        try {
            const response = await restClient.get('/api/cv/debug-auth');
            return response.data;
        } catch (error) {
            console.error('Debug auth check failed', error);
            return { error: 'Failed to check auth' };
        }
    },

    deleteExperience: async (id: number) => {
        try {
            const response = await restClient.delete(`${API_URL}/experience/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting experience:', error);
            throw error;
        }
    },

    updateExperience: async (id: number, entry: ExperienceEntry) => {
        try {
            const response = await restClient.put(`${API_URL}/experience/${id}`, entry);
            return response.data;
        } catch (error) {
            console.error('Error updating experience:', error);
            throw error;
        }
    },

    deleteEducation: async (id: number) => {
        try {
            const response = await restClient.delete(`${API_URL}/education/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting education:', error);
            throw error;
        }
    },

    updateEducation: async (id: number, entry: EducationEntry) => {
        try {
            const response = await restClient.put(`${API_URL}/education/${id}`, entry);
            return response.data;
        } catch (error) {
            console.error('Error updating education:', error);
            throw error;
        }
    },

    uploadVideoIntro: async (videoBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('video', videoBlob, 'video_intro.webm');
            const response = await restClient.post(`${API_URL}/video/upload`, formData);
            return response.data;
        } catch (error) {
            console.error('Error uploading video intro:', error);
            throw error;
        }
    }
};
