/**
 * CV Storage Service
 * Handles CV save/load operations with the backend database
 */
import { restClient } from '@/utils/api';

export interface SavedCV {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  cv_score: number;
  ats_score: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  template_name: string;
  template_category: string;
  full_name: string;
}

export interface CVData {
  id?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    nationality: string;
  };
  professionalSummary: string;
  technicalSkills: string[];
  softSkills: string[];
  experience: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
    field: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }> | string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    year: string;
  }> | string[];
  skills?: any[];
}

export interface SaveCVRequest {
  cvData: CVData;
  title: string;
  templateId: string;
  cvScore?: number;
  atsScore?: number;
}

export interface UpdateCVRequest extends SaveCVRequest {
  changeSummary?: string;
}

class CVStorageService {

  async setVisible(cvId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await restClient.put(`/api/cv/${cvId}/visible`);
      return { success: true, message: response.data.message || 'CV set as visible' };
    } catch (error: any) {
      console.error('Set visible error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to set CV visible'
      };
    }
  }

  /**
   * Save a new CV to the database
   */
  async saveCV(data: SaveCVRequest): Promise<{ success: boolean; cv_id?: string; message: string }> {
    try {
      const response = await restClient.post('/api/cv/save', data);
      return {
        success: true,
        cv_id: response.data.data?.cv_id,
        message: response.data.message || 'CV saved successfully'
      };
    } catch (error: any) {
      console.error('Save CV error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to save CV'
      };
    }
  }

  /**
   * Get list of user's saved CVs
   */
  async listCVs(): Promise<{ success: boolean; data?: SavedCV[]; message: string }> {
    try {
      const response = await restClient.get('/api/cv/list');
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message || 'CVs loaded successfully'
      };
    } catch (error: any) {
      console.error('List CVs error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to load CVs'
      };
    }
  }

  /**
   * Get a specific CV by ID
   */
  async getCV(cvId: string): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const response = await restClient.get(`/api/cv/${cvId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'CV loaded successfully'
      };
    } catch (error: any) {
      console.error('Get CV error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to load CV'
      };
    }
  }

  /**
   * Update an existing CV
   */
  async updateCV(cvId: string, data: UpdateCVRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await restClient.put(`/api/cv/${cvId}`, data);
      return {
        success: true,
        message: response.data.message || 'CV updated successfully'
      };
    } catch (error: any) {
      console.error('Update CV error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update CV'
      };
    }
  }

  /**
   * Rename a CV (title only)
   */
  async renameCV(cvId: string, title: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await restClient.put(`/api/cv/${cvId}`, { title });
      return { success: true, message: response.data.message || 'CV renamed successfully' };
    } catch (error: any) {
      console.error('Rename CV error:', error);
      return { success: false, message: error.response?.data?.message || error.message || 'Failed to rename CV' };
    }
  }

  /**
   * Duplicate an existing CV into a new draft
   */
  async duplicateCV(cvId: string): Promise<{ success: boolean; cv_id?: string; message: string }> {
    try {
      const response = await restClient.post(`/api/cv/${cvId}/duplicate`);
      return { success: true, cv_id: response.data.data?.cv_id, message: response.data.message || 'CV duplicated successfully' };
    } catch (error: any) {
      console.error('Duplicate CV error:', error);
      return { success: false, message: error.response?.data?.message || error.message || 'Failed to duplicate CV' };
    }
  }

  /**
   * Delete a CV
   */
  async deleteCV(cvId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await restClient.delete(`/api/cv/${cvId}`);
      return {
        success: true,
        message: response.data.message || 'CV deleted successfully'
      };
    } catch (error: any) {
      console.error('Delete CV error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete CV'
      };
    }
  }

  /**
   * Get top vacancy matches for the visible CV
   */
  async getTopVacancyMatches(limit = 10): Promise<{ success: boolean; data?: any[]; message: string }> {
    try {
      const response = await restClient.get(`/api/matching/visible/top-vacancies?limit=${limit}`);
      return { success: true, data: response.data.matches || [], message: response.data.message || 'OK' };
    } catch (error: any) {
      console.error('Get matches error:', error);
      return { success: false, message: error.response?.data?.message || error.message || 'Failed to get matches' };
    }
  }
}

export const cvStorageService = new CVStorageService();
