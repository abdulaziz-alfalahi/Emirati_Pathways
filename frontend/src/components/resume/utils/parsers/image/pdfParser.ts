
/**
 * PDF-specific parsing utilities
 */
import { ResumeData } from '../../../types';
import { ParsingError } from '../../resumeParser';
import { checkIfScannedPdf, processPdfForResumeParsing } from '../pdfUtils';

/**
 * Parse PDF content with specialized handling for different PDF types
 * @param file PDF file to parse
 * @param fileContent String content of the PDF
 * @returns Promise resolving to processed PDF text content
 */
export const handlePdfParsing = async (
  file: File,
  fileContent: string
): Promise<string> => {
  console.log('Detected PDF file, cleaning artifacts before parsing...');
  
  // Check if the first 500 characters have mostly PDF artifacts
  const firstChunk = fileContent.substring(0, 500);
  const textContentRatio = firstChunk.replace(/[^a-zA-Z0-9]/g, '').length / firstChunk.length;
  
  if (textContentRatio < 0.3) {
    console.warn('This appears to be a scanned PDF without proper text content');
    const error = new Error("This appears to be a scanned PDF without proper text content. Please use the Image Upload option instead for better results.") as ParsingError;
    error.code = 'SCANNED_PDF';
    error.details = {
      fileType: file.type,
      fileSize: file.size,
      textContentRatio
    };
    error.parserType = 'file';
    
    throw error;
  }
  
  // Clean PDF artifacts from the content before parsing
  const cleanedContent = cleanPdfArtifacts(fileContent);
  console.log(`Cleaned PDF content. Original length: ${fileContent.length}, Cleaned length: ${cleanedContent.length}`);
  
  // If cleaning removed too much content, probably a scanned PDF
  if (cleanedContent.length < fileContent.length * 0.2) {
    console.warn('Cleaning removed most content, likely a scanned PDF');
    const error = new Error("This PDF appears to contain mostly images rather than text. Please use the Image Upload option instead.") as ParsingError;
    error.code = 'SCANNED_PDF';
    error.parserType = 'file';
    
    throw error;
  }
  
  // Return the cleaned content for parsing
  return cleanedContent;
};

/**
 * Clean PDF content by removing unwanted artifacts
 * @param content PDF content as string
 * @returns Cleaned content
 */
export const cleanPdfArtifacts = (content: string): string => {
  return content
    .replace(/%PDF-[\d.]+/g, '')
    .replace(/\b\d+\s+\d+\s+obj\b/g, '')
    .replace(/endobj|endstream|xref|trailer|startxref/g, '')
    .replace(/<<.*?>>/gs, '')
    .replace(/stream[\s\S]*?endstream/g, '')
    .trim();
};
