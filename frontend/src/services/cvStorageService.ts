/**
 * CV Storage Service
 * Handles CV save/load operations with the backend database
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

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
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : 'Bearer mock_token_1'
    };
  }

  /**
   * Set a CV as visible to recruiters (unsets others automatically)
   */
  async setVisible(cvId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cv/${cvId}/visible`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to set CV visible');
      }

      return { success: true, message: result.message || 'CV set as visible' };
    } catch (error) {
      console.error('Set visible error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set CV visible'
      };
    }
  }

  /**
   * Save a new CV to the database
   */
  async saveCV(data: SaveCVRequest): Promise<{ success: boolean; cv_id?: string; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cv/save`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save CV');
      }

      return {
        success: true,
        cv_id: result.data?.cv_id,
        message: result.message || 'CV saved successfully'
      };
    } catch (error) {
      console.error('Save CV error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save CV'
      };
    }
  }

  /**
   * Get list of user's saved CVs
   */
  async listCVs(): Promise<{ success: boolean; data?: SavedCV[]; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cv/list`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to load CVs');
      }

      return {
        success: true,
        data: result.data || [],
        message: result.message || 'CVs loaded successfully'
      };
    } catch (error) {
      console.error('List CVs error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load CVs'
      };
    }
  }

  /**
   * Get a specific CV by ID
   */
  async getCV(cvId: string): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cv/${cvId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to load CV');
      }

      return {
        success: true,
        data: result.data,
        message: result.message || 'CV loaded successfully'
      };
    } catch (error) {
      console.error('Get CV error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load CV'
      };
    }
  }

  /**
   * Update an existing CV
   */
  async updateCV(cvId: string, data: UpdateCVRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cv/${cvId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update CV');
      }

      return {
        success: true,
        message: result.message || 'CV updated successfully'
      };
    } catch (error) {
      console.error('Update CV error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update CV'
      };
    }
  }

  /**
   * Delete a CV
   */
  async deleteCV(cvId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cv/${cvId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete CV');
      }

      return {
        success: true,
        message: result.message || 'CV deleted successfully'
      };
    } catch (error) {
      console.error('Delete CV error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete CV'
      };
    }
  }
}

export const cvStorageService = new CVStorageService();