// src/services/jobDescriptionService.ts
import { JobDescription, ApiResponse } from '@/types/platform';
import { jobApi, handleApiError } from '@/utils/api';

export interface JobDescriptionProcessingOptions {
  enableOCR?: boolean;
  languageHint?: string;
  extractSalary?: boolean;
  extractBenefits?: boolean;
  enhanceRequirements?: boolean;
}

export interface ProcessingResult {
  jobDescription: JobDescription;
  confidence: number;
  processingTime: number;
  extractionMethod: string;
  warnings: string[];
  suggestions: string[];
}

export class JobDescriptionService {
  private static instance: JobDescriptionService;
  
  public static getInstance(): JobDescriptionService {
    if (!JobDescriptionService.instance) {
      JobDescriptionService.instance = new JobDescriptionService();
    }
    return JobDescriptionService.instance;
  }

  async processTextInput(
    text: string, 
    options: JobDescriptionProcessingOptions = {}
  ): Promise<ApiResponse<ProcessingResult>> {
    try {
      const startTime = Date.now();
      
      // Validate input
      if (!text.trim()) {
        return {
          success: false,
          error: 'Job description text is required',
          metadata: { timestamp: new Date().toISOString(), request_id: `jd_text_${Date.now()}` }
        };
      }

      if (text.length < 50) {
        return {
          success: false,
          error: 'Job description text is too short. Please provide a more detailed description.',
          metadata: { timestamp: new Date().toISOString(), request_id: `jd_text_${Date.now()}` }
        };
      }

      // Call production parsing API
      const response = await jobApi.parseText(text);
      
      if (!response.success) {
        return response;
      }

      const processingTime = Date.now() - startTime;
      
      // Enhance the parsed data with additional processing
      const enhancedResult = await this.enhanceJobDescription(response.data, options);
      
      const result: ProcessingResult = {
        jobDescription: enhancedResult.jobDescription,
        confidence: enhancedResult.confidence,
        processingTime: processingTime / 1000,
        extractionMethod: 'text_input_enhanced',
        warnings: enhancedResult.warnings,
        suggestions: enhancedResult.suggestions
      };

      return {
        success: true,
        data: result,
        message: 'Job description processed successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `jd_text_${Date.now()}`,
          processing_time: processingTime / 1000
        }
      };

    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        metadata: { timestamp: new Date().toISOString(), request_id: `jd_text_${Date.now()}` }
      };
    }
  }

  async processFileUpload(
    file: File, 
    options: JobDescriptionProcessingOptions = {}
  ): Promise<ApiResponse<ProcessingResult>> {
    try {
      const startTime = Date.now();
      
      // Validate file
      const validationResult = this.validateFile(file);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
          metadata: { timestamp: new Date().toISOString(), request_id: `jd_file_${Date.now()}` }
        };
      }

      // Call production parsing API
      const response = await jobApi.parse(file);
      
      if (!response.success) {
        return response;
      }

      const processingTime = Date.now() - startTime;
      
      // Enhance the parsed data
      const enhancedResult = await this.enhanceJobDescription(response.data, options);
      
      const result: ProcessingResult = {
        jobDescription: enhancedResult.jobDescription,
        confidence: enhancedResult.confidence,
        processingTime: processingTime / 1000,
        extractionMethod: `file_upload_${file.type.split('/')[1]}_enhanced`,
        warnings: enhancedResult.warnings,
        suggestions: enhancedResult.suggestions
      };

      return {
        success: true,
        data: result,
        message: 'Job description file processed successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `jd_file_${Date.now()}`,
          processing_time: processingTime / 1000
        }
      };

    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        metadata: { timestamp: new Date().toISOString(), request_id: `jd_file_${Date.now()}` }
      };
    }
  }

  private validateFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload PDF, Word document, or text file.'
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit. Please upload a smaller file.'
      };
    }

    return { isValid: true };
  }

  private async enhanceJobDescription(
    rawJobDescription: any, 
    options: JobDescriptionProcessingOptions
  ): Promise<{
    jobDescription: JobDescription;
    confidence: number;
    warnings: string[];
    suggestions: string[];
  }> {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let confidence = 85; // Base confidence

    // Validate required fields
    if (!rawJobDescription.title?.trim()) {
      warnings.push('Job title not detected. Please verify the title is correct.');
      confidence -= 10;
    }

    if (!rawJobDescription.company?.trim()) {
      warnings.push('Company name not detected. Please add the company name.');
      confidence -= 10;
    }

    if (!rawJobDescription.description?.trim()) {
      warnings.push('Job description content is minimal. Consider adding more details.');
      confidence -= 15;
    }

    // Validate requirements structure
    const requirements = rawJobDescription.requirements || {};
    
    if (!requirements.skills || requirements.skills.length === 0) {
      suggestions.push('Consider adding specific skill requirements to improve job matching accuracy.');
      confidence -= 5;
    }

    if (!requirements.experience || requirements.experience.length === 0) {
      suggestions.push('Adding experience requirements will help attract qualified candidates.');
      confidence -= 5;
    }

    if (!requirements.education || requirements.education.length === 0) {
      suggestions.push('Specify education requirements if relevant to the position.');
    }

    // Enhance salary information if requested
    if (options.extractSalary && !rawJobDescription.salary) {
      suggestions.push('Consider adding salary information to attract more candidates.');
    }

    // Enhance benefits if requested
    if (options.extractBenefits && (!rawJobDescription.benefits || rawJobDescription.benefits.length === 0)) {
      suggestions.push('Adding benefits information can make the position more attractive.');
    }

    // Enhance requirements if requested
    if (options.enhanceRequirements) {
      // This could call additional APIs to enhance requirements
      // For now, we'll add suggestions based on common patterns
      if (requirements.skills && requirements.skills.length > 0) {
        const skillNames = requirements.skills.map((skill: any) => skill.name || skill).join(', ');
        suggestions.push(`Consider specifying proficiency levels for skills: ${skillNames}`);
      }
    }

    // Ensure all required fields have defaults
    const enhancedJobDescription: JobDescription = {
      id: rawJobDescription.id || `jd_${Date.now()}`,
      created_at: rawJobDescription.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: rawJobDescription.title || '',
      company: rawJobDescription.company || '',
      location: rawJobDescription.location || '',
      employment_type: rawJobDescription.employment_type || 'full-time',
      work_mode: rawJobDescription.work_mode || 'on-site',
      description: rawJobDescription.description || '',
      responsibilities: rawJobDescription.responsibilities || [],
      requirements: {
        education: requirements.education || [],
        experience: requirements.experience || [],
        skills: requirements.skills || [],
        languages: requirements.languages || [],
        certifications: requirements.certifications || []
      },
      benefits: rawJobDescription.benefits || [],
      salary: rawJobDescription.salary,
      application_deadline: rawJobDescription.application_deadline,
      posted_date: rawJobDescription.posted_date || new Date().toISOString(),
      keywords: rawJobDescription.keywords || [],
      is_active: rawJobDescription.is_active !== false,
      parsing_metadata: {
        extraction_method: rawJobDescription.parsing_metadata?.extraction_method || 'enhanced_processing',
        confidence_score: confidence,
        language_detected: rawJobDescription.parsing_metadata?.language_detected || 'auto',
        source_format: rawJobDescription.parsing_metadata?.source_format || 'text'
      }
    };

    return {
      jobDescription: enhancedJobDescription,
      confidence,
      warnings,
      suggestions
    };
  }

  async saveJobDescription(jobDescription: JobDescription): Promise<ApiResponse<JobDescription>> {
    try {
      // Validate before saving
      const validation = this.validateJobDescription(jobDescription);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          metadata: { timestamp: new Date().toISOString(), request_id: `jd_save_${Date.now()}` }
        };
      }

      // Call save API
      const response = await jobApi.save(jobDescription);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Job description saved successfully',
          metadata: {
            timestamp: new Date().toISOString(),
            request_id: `jd_save_${Date.now()}`
          }
        };
      } else {
        return response;
      }

    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        metadata: { timestamp: new Date().toISOString(), request_id: `jd_save_${Date.now()}` }
      };
    }
  }

  private validateJobDescription(jobDescription: JobDescription): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!jobDescription.title?.trim()) {
      errors.push('Job title is required');
    }

    if (!jobDescription.company?.trim()) {
      errors.push('Company name is required');
    }

    if (!jobDescription.location?.trim()) {
      errors.push('Job location is required');
    }

    if (!jobDescription.description?.trim()) {
      errors.push('Job description is required');
    }

    if (jobDescription.description && jobDescription.description.length < 100) {
      errors.push('Job description should be at least 100 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async getJobDescriptionById(id: string): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await jobApi.get(id);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        metadata: { timestamp: new Date().toISOString(), request_id: `jd_get_${Date.now()}` }
      };
    }
  }

  async searchJobDescriptions(params: any): Promise<ApiResponse<JobDescription[]>> {
    try {
      const response = await jobApi.search(params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        metadata: { timestamp: new Date().toISOString(), request_id: `jd_search_${Date.now()}` }
      };
    }
  }
}

// Export singleton instance
export const jobDescriptionService = JobDescriptionService.getInstance();
