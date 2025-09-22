
import { EmploymentVerificationData } from "@/types/credentialVerification";

export class EmploymentValidation {
  static validateEmploymentData(data: EmploymentVerificationData): void {
    if (!data.emirates_id) {
      throw new Error('Emirates ID is required for employment verification');
    }
    
    if (!data.employer_name) {
      throw new Error('Employer name is required for employment verification');
    }
    
    if (!data.job_title) {
      throw new Error('Job title is required for employment verification');
    }
    
    if (!data.start_date) {
      throw new Error('Start date is required for employment verification');
    }
    
    // Validate date format
    const startDate = new Date(data.start_date);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date format');
    }
    
    // Validate end date if provided
    if (data.end_date) {
      const endDate = new Date(data.end_date);
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end date format');
      }
      
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }
  }
}
