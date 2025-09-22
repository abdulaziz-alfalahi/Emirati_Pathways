
import { ResumeData } from '../../types';
import mammoth from 'mammoth';
import { extractDataFromContent } from '../../utils/resumeContentParser';
import { sanitizeResumeData } from '../../utils/helpers/validation';
import { ProcessedResult } from './processorTypes';

/**
 * Process DOCX file using mammoth.js
 * @param file DOCX file to process
 * @returns Promise resolving to processed resume data
 */
export const processDocxFile = async (file: File): Promise<ProcessedResult> => {
  console.log("Processing DOCX file with mammoth.js");
  const startTime = Date.now();
  
  try {
    // Use mammoth.js to extract text from DOCX
    const arrayBuffer = await file.arrayBuffer();
    console.log("DOCX file converted to array buffer, size:", arrayBuffer.byteLength);
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    console.log("Mammoth extraction complete, status:", result.messages);
    const text = result.value;
    
    console.log(`Extracted ${text.length} characters from DOCX`);
    
    if (text.length < 10) {
      console.warn("Extracted text is suspiciously short:", text);
      throw new Error("Failed to extract meaningful text from the Word document");
    }
    
    // Extract structured data from text content
    console.log("Parsing extracted text with content parser");
    const parsedData = extractDataFromContent(text, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    const processingTime = Date.now() - startTime;
    console.log("Content parsing complete, processing time:", processingTime);
    
    // Sanitize the data
    const sanitizedData = sanitizeResumeData(parsedData);
    
    // Add metadata
    sanitizedData.metadata = {
      ...(sanitizedData.metadata || {}),
      parsingMethod: 'docx-mammoth',
      parsedAt: new Date().toISOString(),
      fileType: file.type,
      fileSize: file.size,
      processingTime,
      extractedTextLength: text.length
    };
    
    return {
      parsedData: sanitizedData,
      parsingMethod: 'docx-mammoth',
      processingTime,
      usedFallback: false
    };
  } catch (error) {
    console.error("Error processing DOCX file:", error);
    
    // Return a graceful error response instead of throwing
    const errorData: Partial<ResumeData> = {
      personal: {
        fullName: "",
        jobTitle: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: ""
      },
      summary: "Could not process the Word document. It may be corrupted or password-protected.",
      experience: [],
      education: [],
      skills: [],
      languages: [],
      metadata: {
        processingError: error instanceof Error ? error.message : String(error),
        parsingMethod: "docx-mammoth-error",
        errorAt: new Date().toISOString()
      }
    };
    
    return {
      parsedData: errorData,
      parsingMethod: 'docx-mammoth-error',
      processingTime: Date.now() - startTime,
      usedFallback: true
    };
  }
};
