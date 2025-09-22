
import { ResumeData } from '../types';
import { EnhancedResumeParser } from './enhanced/enhancedParserClass';

/**
 * Enhanced resume parser implementation
 * @param content Resume content as text
 * @returns Parsed resume data
 */
export const enhancedResumeParser = (content: string): Partial<ResumeData> => {
  try {
    console.log('enhancedResumeParser: Starting parsing process');
    console.log(`enhancedResumeParser: Content length: ${content.length} chars`);
    console.log('enhancedResumeParser: First 100 chars of content:', content.substring(0, 100));
    
    // First, perform a basic validation to detect obviously corrupted PDF data
    const corruptionPatterns = [
      /%PDF-/i, 
      /\/Type\s*\/\w+/i,
      /\/Metadata\s+\d+\s+\d+\s+R/i
    ];
    
    // Check for at least 2 corruption patterns
    const corruptionMatches = corruptionPatterns.filter(pattern => pattern.test(content));
    console.log(`enhancedResumeParser: Corruption patterns detected: ${corruptionMatches.length}`);
    
    if (corruptionMatches.length >= 2) {
      console.error('Likely corrupted PDF data detected in enhancedResumeParser');
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
        summary: "Could not extract text from this PDF. It might be password-protected or corrupted.",
        experience: [],
        education: [],
        skills: [],
        languages: [],
        metadata: {
          processingError: "corrupted_pdf_data",
          parsingMethod: "enhanced-parser-error-detection"
        }
      };
    }
    
    // Create an instance of the parser class
    const parser = new EnhancedResumeParser();
    
    // Process the content
    console.log('enhancedResumeParser: Calling parser.parseResumeContent()');
    const result = parser.parseResumeContent(content, 'text/plain');
    console.log('enhancedResumeParser: Parsing complete, result:', JSON.stringify(result, null, 2));
    
    // Return the parsed data
    return result;
  } catch (error) {
    console.error('Enhanced parser error:', error);
    
    // Return a graceful error response
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
      summary: "An error occurred while parsing your resume. Please try a different file format.",
      experience: [],
      education: [],
      skills: [],
      languages: [],
      metadata: {
        processingError: error instanceof Error ? error.message : "unknown_error",
        parsingMethod: "enhanced-parser-error-handling"
      }
    };
  }
};
