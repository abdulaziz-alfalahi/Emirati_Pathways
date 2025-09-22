
/**
 * LinkedIn profile import utility
 */
import { ResumeData } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { extractFromLinkedIn } from './linkedInParser';

// Import data from LinkedIn profile
export const importFromLinkedIn = async (linkedInUrl: string, accessToken?: string): Promise<Partial<ResumeData>> => {
  console.log('Starting LinkedIn profile import with URL:', linkedInUrl);
  
  try {
    // Use the local extractor directly instead of edge function - properly await the Promise
    const extractedData = await extractFromLinkedIn(linkedInUrl);
    console.log('LinkedIn data extracted:', extractedData);
    
    // Add metadata
    if (!extractedData.metadata) {
      extractedData.metadata = {};
    }
    
    extractedData.metadata = {
      ...extractedData.metadata,
      parsingMethod: 'linkedin-import',
      parsedAt: new Date().toISOString(),
      linkedInUrl
    };
    
    return extractedData;
  } catch (error) {
    console.error('LinkedIn import error:', error);
    // Return a basic structure with error info if extraction fails
    return {
      personal: {
        fullName: "",
        jobTitle: "",
        email: "",
        phone: "",
        location: "",
        linkedin: linkedInUrl,
        website: ""
      },
      experience: [],
      education: [],
      skills: [],
      languages: [],
      metadata: {
        parsingMethod: 'linkedin-import-failed',
        parsedAt: new Date().toISOString(),
        linkedInUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};
