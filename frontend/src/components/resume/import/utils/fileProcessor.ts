
import { ResumeData } from '../../types';
import { parseResumeFromFile } from '../../utils/parsers/fileParser';
import { sanitizeResumeData } from '../../utils/helpers/validation';
import { checkIfScannedPdf, processPdfForResumeParsing } from '../../utils/parsers/pdfUtils';
import { toast } from 'sonner';
import { ProcessedResult } from './processorTypes';
import { processDocxFile } from './docxProcessor';
import { validateResumeFile, isDocxFile, isPdfFile } from './fileValidators';
import { processResumeWithAffinda } from './affindaProcessor';

/**
 * Handle file upload and parsing
 * @param file File to parse
 * @returns Promise resolving to processed resume data
 */
export const processResumeFile = async (file: File): Promise<ProcessedResult> => {
  console.log(`processResumeFile: Starting to process file - ${file.name} (${file.type}, ${file.size} bytes)`);
  
  // Validate the file first
  const validation = validateResumeFile(file);
  if (!validation.isValid) {
    console.error(`processResumeFile: File validation failed - ${validation.errorMessage}`);
    throw new Error(validation.errorMessage);
  }
  
  const startTime = Date.now();
  const toastId = toast.loading("Processing Resume", {
    description: "Analyzing your resume file...",
  });
  
  // Try to use Affinda parser first if API key is available
  const affindaApiKey = import.meta.env.VITE_AFFINDA_API_KEY;
  
  try {
    if (affindaApiKey) {
      console.log('processResumeFile: Affinda API key found, attempting to use Affinda');
      toast.loading("Using Affinda AI Parser", {
        id: toastId,
        description: "Processing your resume with professional-grade AI..."
      });
      
      try {
        const result = await processResumeWithAffinda(file, affindaApiKey);
        toast.success("Resume Processed", {
          id: toastId,
          description: "Your resume has been processed successfully with Affinda.",
        });
        return result;
      } catch (affindaError) {
        console.error("Affinda processing failed:", affindaError);
        toast.error("Affinda Processing Failed", {
          id: toastId,
          description: "Falling back to standard processing methods..."
        });
        // Fall through to standard processing
      }
    }
    
    // Special handling for DOCX files using mammoth.js
    if (isDocxFile(file)) {
      console.log('processResumeFile: Detected DOCX file, using specialized processor');
      try {
        const result = await processDocxFile(file);
        toast.success("Resume Processed", {
          id: toastId,
          description: "Your resume has been processed successfully.",
        });
        return result;
      } catch (docxError) {
        console.error("DOCX processing failed:", docxError);
        toast.error("Word Document Error", {
          id: toastId,
          description: docxError instanceof Error ? docxError.message : "Failed to process Word document",
        });
        throw docxError;
      }
    }
    
    // PDF-specific pre-checks
    if (isPdfFile(file)) {
      try {
        console.log("Processing PDF file to determine parsing strategy");
        const { strategy, shouldUseImageParser } = await processPdfForResumeParsing(file);
        console.log(`Determined PDF parsing strategy: ${strategy}, use image parser: ${shouldUseImageParser}`);
        
        if (shouldUseImageParser) {
          console.log('processResumeFile: PDF appears to be scanned, redirecting to image processing');
          toast.success("Processing scanned document...", {
            id: toastId,
          });
          // For scanned PDFs, redirect to image parsing route
          const { processResumeImage } = await import('./imageProcessor');
          const result = await processResumeImage(file);
          toast.success("Resume Processed", {
            id: toastId,
            description: "Your scanned document has been processed.",
          });
          return result;
        }
      } catch (error) {
        console.error("Error during PDF preprocessing:", error);
        // Continue with standard parsing if preprocessing fails
      }
    }
    
    try {
      console.log('processResumeFile: Calling parseResumeFromFile()');
      const parsedData = await parseResumeFromFile(file);
      const processingTime = Date.now() - startTime;
      console.log(`processResumeFile: Parsing completed in ${processingTime}ms`);
      console.log('processResumeFile: Raw parsed data:', JSON.stringify(parsedData, null, 2));
      
      // Sanitize the data to remove any PDF artifacts
      const sanitizedData = sanitizeResumeData(parsedData);
      console.log('processResumeFile: After sanitization:', JSON.stringify(sanitizedData, null, 2));
      
      // Validate parsed data
      if (!sanitizedData || Object.keys(sanitizedData).length === 0) {
        if (isPdfFile(file)) {
          // If standard parsing fails for PDF, try image parsing as fallback
          console.log('processResumeFile: Empty or invalid data from text extraction, trying image processing');
          toast.info("Attempting image-based extraction", {
            id: toastId,
            description: "Text extraction failed. Trying image-based extraction as fallback.",
          });
          
          // Add some delay to allow toast to display
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { processResumeImage } = await import('./imageProcessor');
          return processResumeImage(file);
        } else {
          throw new Error("Could not extract meaningful data from your resume. Please try a different file format.");
        }
      }

      // Add metadata about sanitization if needed
      if (sanitizedData !== parsedData) {
        sanitizedData.metadata = {
          ...(sanitizedData.metadata || {}),
          sanitized: true,
          sanitizedAt: new Date().toISOString()
        };
      }

      // Check which parsing method was used
      const parsingMethod = sanitizedData.metadata?.parsingMethod || 'unknown';
      const usedFallback = parsingMethod.includes('fallback') || 
                         parsingMethod === 'legacy-regex' || 
                         parsingMethod === 'enhanced-edge' || 
                         parsingMethod === 'ai-edge';
      
      console.log(`processResumeFile: Completed. Method: ${parsingMethod}, usedFallback: ${usedFallback}`);
      
      toast.success("Resume Processed", {
        id: toastId,
        description: "Your resume has been processed successfully.",
      });
      
      return {
        parsedData: sanitizedData,
        parsingMethod,
        usedFallback,
        processingTime
      };
    } catch (error) {
      console.error("Error in standard file parsing:", error);
      
      // For PDF files that fail with text extraction, try image parsing
      if (isPdfFile(file)) {
        console.log('processResumeFile: Error in text extraction, trying image-based method');
        toast.info("Trying image-based extraction", {
          id: toastId,
          description: "Text extraction failed. Trying image-based extraction...",
        });
        
        try {
          // Add some delay to allow toast to display
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { processResumeImage } = await import('./imageProcessor');
          return processResumeImage(file);
        } catch (imageError) {
          console.error("Image parsing also failed:", imageError);
          toast.error("Processing Failed", {
            id: toastId, 
            description: "Both text and image extraction methods failed for this PDF."
          });
          throw new Error("Both text and image extraction methods failed for this PDF. The file may be corrupted or password-protected.");
        }
      }
      
      // Show error for non-PDF files
      toast.error("Processing Failed", {
        id: toastId,
        description: error instanceof Error ? error.message : "Failed to process document",
      });
      
      // Re-throw original error for other file types
      throw error;
    }
  } catch (error) {
    console.error("Error in processResumeFile:", error);
    toast.error("Processing Failed", {
      id: toastId,
      description: error instanceof Error ? error.message : "Failed to process document",
    });
    throw error;
  }
};
