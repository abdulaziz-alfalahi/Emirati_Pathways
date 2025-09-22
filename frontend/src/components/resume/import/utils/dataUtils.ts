import { ResumeData } from '../../types';
import { sanitizeResumeData } from '../../utils/helpers/validation';
import { mergeResumeData as mergeResumeDataFromUtils } from '../../utils/resumeDataUtils';

/**
 * Merge resume data with better validation
 * @param currentData Current resume data
 * @param parsedData New parsed data to merge
 * @returns Merged resume data
 */
export const mergeResumeData = (currentData: ResumeData, parsedData: Partial<ResumeData>): ResumeData => {
  // Sanitize data before merging
  const sanitizedData = sanitizeResumeData(parsedData);
  
  // Use the imported utility function for the actual merging
  return mergeResumeDataFromUtils(currentData, sanitizedData);
};
