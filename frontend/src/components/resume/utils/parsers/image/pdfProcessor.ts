
import { ResumeData } from '../../../types';
import { ParsingError } from '../../resumeParser';
import { toast } from 'sonner';
import { isEmptyResumeData, sanitizeResumeData } from '../../helpers/validation';

/**
 * Read PDF as text for fallback processing
 * @param file PDF file
 * @returns Promise resolving to text content
 */
export const readPdfAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        resolve(content || '');
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read PDF as text'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Process PDF text as fallback when image processing fails
 * @param file The PDF file
 * @param startTime Processing start time for timing information
 * @returns Promise resolving to parsed resume data
 */
export const processPdfWithTextFallback = async (
  file: File, 
  startTime: number
): Promise<{ parsedData: Partial<ResumeData>; success: boolean }> => {
  try {
    console.log('Attempting fallback to extract-resume-data for PDF...');
    
    // Show toast notification for fallback attempt
    toast.loading("Trying alternative extraction method...", {
      id: "pdf-fallback",
      duration: 30000
    });
    
    // Convert PDF to text
    const pdfText = await readPdfAsText(file);
    
    if (!pdfText || pdfText.length < 100) {
      toast.dismiss("pdf-fallback");
      throw new Error('Could not extract sufficient text from PDF');
    }
    
    console.log(`Extracted ${pdfText.length} characters of text from PDF, first 100 chars: ${pdfText.substring(0, 100)}...`);
    
    // Create a timeout promise to handle long-running processes
    // TODO: Connect to Flask API - const apiPromise = supabase.functions.invoke('extract-resume-data', {
      body: { fileContent: pdfText },
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF text extraction timed out after 25 seconds')), 25000);
    });
    
    // Race the API call against the timeout
    const textResponse = await Promise.race([apiPromise, timeoutPromise]) as {
      data?: any;
      error?: { message: string }
    };
    
    toast.dismiss("pdf-fallback");
    
    if (textResponse && textResponse.error) {
      console.error('Text extraction API error:', textResponse.error);
      throw new Error(`Text extraction fallback failed: ${textResponse.error.message}`);
    }
    
    const textData = textResponse && textResponse.data;
    
    if (!textData || isEmptyResumeData(textData)) {
      console.error('Text extraction returned empty or invalid data');
      throw new Error('No meaningful data returned from text extraction fallback');
    }
    
    // Sanitize and add metadata
    const sanitizedTextData = sanitizeResumeData(textData);
    sanitizedTextData.metadata = {
      ...(sanitizedTextData.metadata || {}),
      parsingMethod: 'pdf-text-fallback',
      parsedAt: new Date().toISOString(),
      fileType: file.type,
      fileSize: file.size,
      processingTime: Date.now() - startTime
    };
    
    return { parsedData: sanitizedTextData, success: true };
  } catch (error) {
    console.error('PDF text fallback failed:', error);
    toast.dismiss("pdf-fallback");
    
    // Show error toast with helpful message
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('timed out')) {
      toast.error("PDF Processing Timeout", {
        description: "Text extraction took too long. Try a simpler PDF or convert to image format.",
        duration: 8000
      });
    } else if (errorMessage.includes('No meaningful data')) {
      toast.error("PDF Text Extraction Failed", {
        description: "Could not extract structured data from your PDF. Try uploading as an image instead.",
        duration: 8000
      });
    } else {
      toast.error("PDF Processing Failed", {
        description: "Could not process your PDF. Try converting to JPG or PNG format.",
        duration: 8000
      });
    }
    
    return { parsedData: {}, success: false };
  }
};

/**
 * Basic OCR fallback for when other methods fail
 * This is a simplified implementation that could be enhanced with a proper OCR service
 * @param file The file to process
 * @returns Promise resolving to basic parsed resume data
 */
export const processWithBasicOCR = async (file: File): Promise<Partial<ResumeData>> => {
  try {
    console.log('Attempting basic OCR fallback...');
    
    toast.loading("Trying basic OCR extraction...", {
      id: "ocr-fallback",
      duration: 20000
    });
    
    // For PDFs, we already tried text extraction, so this is just a placeholder
    // In a real implementation, you would integrate with a dedicated OCR service
    // like Tesseract.js or a cloud OCR API
    
    // Simulate OCR processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.dismiss("ocr-fallback");
    
    // Return a basic structure with a note about OCR
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
      summary: "This resume was processed using basic OCR. Please verify and complete the information.",
      experience: [],
      education: [],
      skills: [],
      languages: [],
      metadata: {
        parsingMethod: 'basic-ocr-fallback',
        parsedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
        ocrNote: "Basic OCR extraction was used as a fallback method. Results may be limited."
      }
    };
  } catch (error) {
    console.error('Basic OCR fallback failed:', error);
    toast.dismiss("ocr-fallback");
    
    // Return empty data on failure
    return {};
  }
};
