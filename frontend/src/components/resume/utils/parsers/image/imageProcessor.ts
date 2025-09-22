
import { ResumeData } from '../../../types';
import { parseResumeFromImage as parseResumeImageOriginal } from '../../resumeParser';
import { 
  isEmptyResumeData, 
  validateResumeImageType, 
  validateFileSize, 
  sanitizeResumeData 
} from '../../helpers/validation';

/**
 * Process resume image
 * @param file Image file to process
 * @returns Promise resolving to processed resume data
 */
export const processResumeImage = async (file: File): Promise<{
  parsedData: Partial<ResumeData>;
  parsingMethod: string;
  usedFallback: boolean;
  processingTime: number;
}> => {
  // Create a unique ID for this processing attempt for tracking
  const processingId = `proc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Log file details for debugging
  console.log(`[${processingId}] Processing resume:`, {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString()
  });

  try {
    // Validate file size
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit for images
    const sizeValidation = validateFileSize(file.size, maxFileSize);
    if (!sizeValidation.isValid) {
      throw new Error(`File too large. Please upload a file smaller than ${sizeValidation.maxSizeInMB}MB.`);
    }
    
    const startTime = Date.now();
    
    // Process the file
    const parsedData = await parseResumeImageOriginal(file);
    const processingTime = Date.now() - startTime;
    
    // Sanitize the data to ensure it's clean
    const sanitizedData = sanitizeResumeData(parsedData);
    
    // Add metadata about the processing
    sanitizedData.metadata = {
      ...(sanitizedData.metadata || {}),
      processingId,
      processingTime,
      fileType: file.type,
      fileSize: file.size,
      fileName: file.name
    };
    
    // Determine parsing method from metadata
    const parsingMethod = sanitizedData.metadata?.parsingMethod || 'image-processing';
    const usedFallback = parsingMethod.includes('fallback');
    
    return {
      parsedData: sanitizedData,
      parsingMethod,
      usedFallback,
      processingTime
    };
  } catch (error) {
    console.error(`[${processingId}] Error in image parsing:`, error);
    
    // Re-throw the error to be handled by the caller
    throw error;
  }
};
