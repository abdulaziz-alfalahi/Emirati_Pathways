
import { ResumeData } from '../../types';
import { enhancedResumeParser } from '../enhancedResumeParser';
import { legacyResumeParser } from '../legacyResumeParser';
import { toast } from 'sonner';

/**
 * Parse with enhanced parser
 */
export const parseWithEnhancedParser = (
  content: string, 
  file: File,
  startTime: number
): Partial<ResumeData> => {
  try {
    // Check for suspicious patterns that indicate corrupted PDF data
    const corruptionPatterns = [
      /%PDF-/i, 
      /\/Type\s*\/\w+/i,
      /\/Metadata\s+\d+\s+\d+\s+R/i,
      /endobj|endstream/i,
      /xref|startxref/i
    ];
    
    // Check for corruption patterns
    const corruptionMatches = corruptionPatterns.filter(pattern => pattern.test(content));
    if (corruptionMatches.length >= 2) {
      console.warn('Detected likely corrupted PDF data, showing warning to user');
      toast.warning("PDF Processing Issue", {
        description: "This PDF contains formatting that's difficult to extract. Try saving it as a different PDF or uploading an image of your resume instead.",
        duration: 8000,
      });
    }
    
    // Use enhanced parser
    return enhancedResumeParser(content);
  } catch (error) {
    console.error('Enhanced parser error:', error);
    throw error;
  }
};

/**
 * Parse with legacy parser
 */
export const parseWithLegacyParser = (
  content: string,
  file: File,
  startTime: number,
  previousError?: Error
): Partial<ResumeData> => {
  try {
    // Use legacy parser
    return legacyResumeParser(content);
  } catch (error) {
    console.error('Legacy parser error:', error);
    throw error;
  }
};

/**
 * Parse with edge function
 */
export const parseWithEnhancedEdgeFunction = async (
  content: string,
  file: File,
  startTime: number,
  previousError?: Error
): Promise<Partial<ResumeData>> => {
  // Check for corrupted PDF data before sending to API
  const corruptionPatterns = [
    /%PDF-/i, 
    /\/Type\s*\/\w+/i,
    /\/Metadata\s+\d+\s+\d+\s+R/i
  ];
  
  // Check if we should skip the API call due to corrupted data
  const corruptionMatches = corruptionPatterns.filter(pattern => pattern.test(content));
  if (corruptionMatches.length >= 2) {
    console.warn('Detected corrupted PDF data, skipping API call');
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
      summary: "This PDF contains formatting that prevents text extraction. Please try uploading a different format or use our image upload option instead.",
      experience: [],
      education: [],
      skills: [],
      languages: [],
      metadata: {
        processingError: "corrupted_pdf_data",
        parsingMethod: "edge-function-error-detection",
        processingTimestamp: new Date().toISOString()
      }
    };
  }
  
  // For real implementation, this would call an edge function
  try {
    const { data, error } = await fetch('/api/extract-resume', {
      method: 'POST',
      body: JSON.stringify({ content }),
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => res.json());
    
    if (error) {
      throw new Error(error);
    }
    
    return data || {
      personal: {
        fullName: "Edge Function Processed",
        jobTitle: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: ""
      },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      languages: []
    };
  } catch (error) {
    console.error("Edge function error:", error);
    throw error;
  }
};

/**
 * Parse with AI extraction
 */
export const parseWithAIExtraction = async (
  content: string,
  file: File,
  startTime: number,
  previousError?: Error
): Promise<Partial<ResumeData>> => {
  // Check for corrupted PDF data before attempting AI extraction
  const corruptionPatterns = [
    /%PDF-/i, 
    /\/Type\s*\/\w+/i,
    /\/Metadata\s+\d+\s+\d+\s+R/i
  ];
  
  // Check if we have corrupted data
  const corruptionMatches = corruptionPatterns.filter(pattern => pattern.test(content));
  if (corruptionMatches.length >= 2) {
    console.warn('Detected corrupted PDF data, returning friendly error message');
    toast.error("Processing Error", {
      description: "We couldn't extract text from this PDF. Please convert it to a different PDF format or try our image upload option.",
      duration: 8000,
    });
    
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
      summary: "This PDF contains formatting that prevents text extraction. Please try a different file format or use our image upload option.",
      experience: [],
      education: [],
      skills: [],
      languages: [],
      metadata: {
        processingError: "corrupted_pdf_data",
        parsingMethod: "ai-extraction-error-detection",
        processingTimestamp: new Date().toISOString()
      }
    };
  }

  // In real implementation, this would call an AI extraction service
  return {
    personal: {
      fullName: "AI Extraction Service",
      jobTitle: "Could extract data from this file",
      email: "ai@example.com",
      phone: "",
      location: "",
      linkedin: "",
      website: ""
    },
    summary: "This resume was processed using AI extraction.",
    experience: [],
    education: [],
    skills: [],
    languages: []
  };
};
