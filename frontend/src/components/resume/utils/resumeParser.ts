
/**
 * Main resume parser entry point
 */
import { ResumeData } from '../types';

// Import individual parser modules
import { parseResumeFromFile } from './parsers/fileParser';
import { parseResumeFromImage } from './parsers/imageParser';
import { importFromLinkedIn } from './parsers/linkedInImporter';
import { isEmptyResumeData } from './helpers/validation';
import { extractFromLinkedIn } from './parsers/linkedInParser';

// Define parsing result types for better type safety
export interface ParsingResult {
  parsedData: Partial<ResumeData>;
  parsingMethod: string;
  metadata?: {
    processingTime?: number;
    fileType?: string;
    fileSize?: number;
    success: boolean;
    errors?: string[];
  };
}

export interface ParsingError extends Error {
  code?: string;
  details?: any;
  parserType?: string;
}

// Re-export for backward compatibility
export { mergeResumeData } from './resumeDataUtils';
export { enhancedResumeParser } from './enhancedResumeParser';

// Export the individual parsers
export {
  parseResumeFromFile,
  parseResumeFromImage,
  importFromLinkedIn,
  isEmptyResumeData,
  extractFromLinkedIn
};
