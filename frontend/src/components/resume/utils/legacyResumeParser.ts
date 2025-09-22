
import { ResumeData } from '../types';
import { extractDataFromContent } from './resumeContentParser';
import { v4 as uuidv4 } from 'uuid';

// Legacy parser implementation using regex patterns
export const legacyResumeParser = (content: string): Partial<ResumeData> => {
  try {
    // Extract data using the content parser
    const extractedData = extractDataFromContent(content, 'text/plain');
    
    // Add some metadata to indicate this was processed with the legacy parser
    return {
      ...extractedData,
      metadata: {
        parsingMethod: 'legacy-regex',
        parsedAt: new Date().toISOString(),
        processingId: uuidv4()
      }
    };
  } catch (error) {
    console.error('Legacy parser error:', error);
    // Return minimal data structure on error
    return {
      personal: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        website: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      languages: []
    };
  }
};
