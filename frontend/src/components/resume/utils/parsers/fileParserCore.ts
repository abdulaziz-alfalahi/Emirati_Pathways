
/**
 * Core file parser module
 * Handles the file reading and parsing process
 */
import { ResumeData } from '../../types';
import { ParsingError } from '../resumeParser';
import { handlePdfParsing } from './image/pdfParser';
import { 
  parseWithEnhancedParser,
  parseWithLegacyParser, 
  parseWithEnhancedEdgeFunction,
  parseWithAIExtraction
} from './parsingMethods';
import { toast } from 'sonner';

/**
 * Check if content appears to be binary PDF data or corrupted
 */
const isLikelyCorruptedPdfData = (content: string): boolean => {
  // Common patterns found in corrupted PDF data
  const corruptionPatterns = [
    /%PDF-/i, // PDF header
    /\/Type\s*\/\w+/i, // PDF type declarations
    /\/Metadata\s+\d+\s+\d+\s+R/i, // PDF metadata references
    /endobj|endstream/i, // PDF object markers
    /xref|startxref/i, // PDF cross references
    /\/Contents\s+\d+\s+\d+/i, // PDF content references
  ];
  
  // Check how many patterns match
  const matchingPatterns = corruptionPatterns.filter(pattern => pattern.test(content));
  
  // If we find 3+ patterns, it's likely corrupted PDF data
  return matchingPatterns.length >= 3;
};

/**
 * Core parsing function that executes the parsing pipeline
 * @param file File to parse
 * @param fileContent File content as string
 * @returns Promise resolving to parsed resume data
 */
export const parseFileContent = async (file: File, fileContent: string): Promise<Partial<ResumeData>> => {
  const startTime = Date.now();
  
  try {
    // Check if we have content to parse
    if (!fileContent) {
      const error = new Error('Could not read file content') as ParsingError;
      error.code = 'EMPTY_CONTENT';
      throw error;
    }
    
    // Early check for corrupted PDF data
    if (file.type === 'application/pdf' && isLikelyCorruptedPdfData(fileContent)) {
      console.warn('Detected likely binary or corrupted PDF data');
      toast.warning("PDF Processing Issue", {
        description: "This PDF may contain formatting that's difficult to parse. Consider using our image upload option for better results.",
        duration: 8000,
      });
      
      // Try to recover by using PDF specific handling
      try {
        console.log('Attempting to repair PDF extraction');
        // Fixed type issue: handlePdfParsing now returns the processed text content
        const processedPdfContent = await handlePdfParsing(file, fileContent);
        
        // If the processed content still looks corrupted
        if (isLikelyCorruptedPdfData(processedPdfContent)) {
          console.error('PDF still appears corrupted after text extraction');
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
            summary: "We couldn't extract text from this PDF properly. It might be formatted in a way that prevents text extraction. Please try using our image upload option instead.",
            experience: [],
            education: [],
            skills: [],
            languages: [],
            metadata: {
              processingError: "corrupted_pdf_data_after_processing",
              parsingMethod: "pdf-corruption-detection",
              fileType: file.type,
              fileSize: file.size
            }
          };
        }
        
        // If we got here, we have processed content that doesn't look corrupted
        fileContent = processedPdfContent;
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        // Continue with the original content, the parsing pipeline will handle it
      }
    }
    
    // Early check for PDF raw headers
    let contentToProcess = fileContent;
    if (file.type === 'application/pdf' && fileContent.startsWith('%PDF')) {
      try {
        // Fixed type issue: handlePdfParsing now returns the processed text content
        const processedPdfContent = await handlePdfParsing(file, fileContent);
        contentToProcess = processedPdfContent;
      } catch (pdfError) {
        throw pdfError;
      }
    }
    
    // Try each parsing method in sequence with fallback mechanism
    try {
      // First try the enhanced parser
      return parseWithEnhancedParser(contentToProcess, file, startTime);
    } catch (enhancedError) {
      console.error('Enhanced parsing error:', enhancedError);
      
      try {
        // Fallback to legacy parser
        return parseWithLegacyParser(contentToProcess, file, startTime, enhancedError);
      } catch (legacyError) {
        console.error('Legacy extraction error:', legacyError);
        
        // If legacy fails, check if it might be a scanned PDF
        if (file.type === 'application/pdf' && fileContent.startsWith('%PDF') && fileContent.length < 1000) {
          const error = new Error('This appears to be a scanned PDF without extractable text. Please try the Image Upload option instead.') as ParsingError;
          error.code = 'SCANNED_PDF';
          error.details = { fileType: file.type, fileSize: file.size };
          error.parserType = 'file';
          throw error;
        }
        
        try {
          // Fallback to enhanced edge function
          return await parseWithEnhancedEdgeFunction(contentToProcess, file, startTime, legacyError);
        } catch (enhancedEdgeError) {
          console.error('Enhanced edge function failed:', enhancedEdgeError);
          
          try {
            // Final fallback to AI extraction
            return await parseWithAIExtraction(contentToProcess, file, startTime, enhancedEdgeError);
          } catch (aiError) {
            console.error('AI extraction failed:', aiError);
            
            // If all methods fail, return a comprehensive error
            const parseError = new Error('All parsing methods failed. Please try a different file format or check if the resume contains extractable text.') as ParsingError;
            parseError.code = 'ALL_METHODS_FAILED';
            parseError.details = {
              fileType: file.type,
              fileSize: file.size,
              attemptedMethods: ['enhanced-local', 'legacy-regex', 'enhanced-edge', 'ai-edge']
            };
            parseError.parserType = 'file';
            
            throw parseError;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in parseFileContent:', error);
    throw error;
  }
};
