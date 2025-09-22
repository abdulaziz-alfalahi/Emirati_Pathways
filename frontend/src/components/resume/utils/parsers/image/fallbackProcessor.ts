
import { ResumeData } from '../../../types';

/**
 * Create basic fallback resume data when all extraction methods fail
 * @param file Original file object
 * @param error Error that caused the fallback
 * @param startTime Processing start time
 * @returns Basic resume data structure
 */
export const createFallbackResumeData = (
  file: File,
  error: Error,
  startTime: number
): Partial<ResumeData> => {
  return {
    personal: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: ""
    },
    summary: file.type === 'application/pdf' 
      ? "Could not extract text from this PDF. It might be password-protected or corrupted."
      : "Limited information could be extracted from this image.",
    experience: [],
    education: [],
    skills: [],
    languages: [],
    metadata: {
      parsingMethod: 'image-fallback',
      parsedAt: new Date().toISOString(),
      fileType: file.type,
      fileSize: file.size,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallbackReason: 'All extraction methods failed'
    }
  };
};

/**
 * Process with fallback when primary extraction methods fail
 * @param imageData Base64 image data
 * @param file Original file object
 * @param startTime Processing start time 
 * @returns Object with success flag and parsed data
 */
export const processWithFallback = async (
  imageData: string,
  file: File,
  startTime: number
): Promise<{ parsedData: Partial<ResumeData>; success: boolean }> => {
  try {
    console.log(`Using fallback processor for ${file.type} with size ${file.size}...`);
    
    // Basic OCR simulation - in a real implementation, this would use a proper OCR library
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    
    // Create basic resume data
    const fallbackData = createFallbackResumeData(
      file, 
      new Error("Primary extraction methods failed"), 
      startTime
    );
    
    return {
      parsedData: fallbackData,
      success: true
    };
  } catch (error) {
    console.error('Fallback processing failed:', error);
    return {
      parsedData: {},
      success: false
    };
  }
};
