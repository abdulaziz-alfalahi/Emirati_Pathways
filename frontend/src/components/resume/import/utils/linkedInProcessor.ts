
import { ResumeData } from '../../types';
import { importFromLinkedIn } from '../../utils/parsers/linkedInImporter';
import { sanitizeResumeData } from '../../utils/helpers/validation';
import { ProcessedResult } from './processorTypes';

/**
 * Process LinkedIn profile data
 * @param linkedInData Raw LinkedIn data
 * @returns Processed resume data
 */
export const processLinkedInData = async (linkedInUrl: string): Promise<ProcessedResult> => {
  const startTime = Date.now();
  
  try {
    console.log('Processing LinkedIn data...');
    
    // Call the LinkedIn parser
    const parsedData = await importFromLinkedIn(linkedInUrl);
    const processingTime = Date.now() - startTime;
    
    // Sanitize the data
    const sanitizedData = sanitizeResumeData(parsedData);
    
    // Add metadata
    sanitizedData.metadata = {
      ...(sanitizedData.metadata || {}),
      parsingMethod: 'linkedin',
      parsedAt: new Date().toISOString(),
      processingTime
    };
    
    return {
      parsedData: sanitizedData,
      parsingMethod: 'linkedin',
      processingTime
    };
  } catch (error) {
    console.error('LinkedIn processing error:', error);
    throw error;
  }
};

/**
 * Process LinkedIn profile - alias for processLinkedInData for backward compatibility
 */
export const processLinkedInProfile = processLinkedInData;
