
import { ResumeData } from '../../types';
import { parseResumeFromImage } from '../../utils/parsers/imageParser';
import { 
  isEmptyResumeData, 
  validateResumeImageType, 
  validateFileSize, 
  sanitizeResumeData 
} from '../../utils/helpers/validation';
import { toast } from 'sonner';
// Import PDF.js dynamically to avoid SSR issues
let pdfjsLib: any = null;

/**
 * Dynamically load PDF.js library
 */
const loadPdfJs = async (): Promise<any> => {
  if (pdfjsLib) return pdfjsLib;
  
  try {
    // Import PDF.js dynamically
    const pdfjs = await import('pdfjs-dist');
    
    // Set the worker source
    // Dynamic import for worker to avoid build issues
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    
    pdfjsLib = pdfjs;
    console.log('PDF.js loaded successfully');
    return pdfjsLib;
  } catch (error) {
    console.error('Error loading PDF.js:', error);
    throw new Error('Failed to load PDF processing library');
  }
};

/**
 * Convert PDF to image using PDF.js
 * @param file PDF file to convert
 * @returns Promise resolving to a File object containing the first page as an image
 */
const convertPdfToImage = async (file: File): Promise<File> => {
  try {
    console.log('Converting PDF to image using PDF.js...');
    
    // Load PDF.js
    const pdfjs = await loadPdfJs();
    
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`);
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Set the scale for rendering (higher = better quality but larger file)
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    
    // Create a canvas to render the page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    // Set canvas dimensions to match the page
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render the page to the canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    console.log('PDF page rendered to canvas successfully');
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          throw new Error('Failed to convert canvas to blob');
        }
      }, 'image/png', 0.95); // High quality PNG
    });
    
    // Create a new File object from the blob
    const imageFile = new File([blob], `${file.name.replace('.pdf', '')}_page1.png`, {
      type: 'image/png',
      lastModified: Date.now()
    });
    
    console.log('PDF converted to image successfully:', {
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size
    });
    
    return imageFile;
  } catch (error) {
    console.error('Error converting PDF to image:', error);
    throw new Error(`Failed to convert PDF to image: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Process resume image with multiple fallback methods
 * @param file Image or PDF file to process
 * @returns Promise resolving to processed resume data
 */
export const processResumeImage = async (file: File): Promise<{
  parsedData: Partial<ResumeData>;
  parsingMethod: string;
  usedFallback: boolean;
  processingTime: number;
}> => {
  // Create a unique ID for this processing attempt for tracking
  const processingId = `proc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Log file details for debugging
  console.log(`[${processingId}] Processing resume:`, {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString()
  });

  try {
    // Validate file size
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit for images
    const sizeValidation = validateFileSize(file.size, maxFileSize);
    if (!sizeValidation.isValid) {
      const errorMessage = `File too large. Please upload a file smaller than ${sizeValidation.maxSizeInMB}MB.`;
      toast.error("File Size Error", {
        description: errorMessage,
        duration: 8000
      });
      throw new Error(errorMessage);
    }
    
    const startTime = Date.now();
    
    // Special handling for PDFs
    if (file.type === 'application/pdf') {
      console.log(`[${processingId}] PDF detected, using special handling`);
      return await processPdfWithFallbacks(file, startTime, processingId);
    } else {
      // Validate image type for non-PDFs
      const typeValidation = validateResumeImageType(file.type);
      if (typeValidation.isUnsupported) {
        const errorMessage = `Unsupported image format. Please upload ${typeValidation.supportedTypes.join(', ')} images or a PDF.`;
        toast.error("File Format Error", {
          description: errorMessage,
          duration: 8000
        });
        throw new Error(errorMessage);
      }
      
      // Process image files normally
      return await processImageFile(file, startTime, processingId);
    }
  } catch (error) {
    // Global error handler for unexpected errors
    console.error(`[${processingId}] Unexpected error in processResumeImage:`, error);
    
    // Ensure all toast notifications are dismissed
    toast.dismiss("resume-processing");
    toast.dismiss("pdf-conversion");
    toast.dismiss("pdf-text-extraction");
    toast.dismiss("pdf-direct-processing");
    
    // Show a user-friendly error message
    toast.error("Processing Error", {
      description: "An unexpected error occurred. Please try again or use a different file.",
      duration: 8000
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
};

/**
 * Process PDF with multiple fallback methods
 * @param file PDF file to process
 * @param startTime Processing start time
 * @param processingId Unique ID for this processing attempt
 * @returns Promise resolving to processed resume data
 */
const processPdfWithFallbacks = async (file: File, startTime: number, processingId: string): Promise<{
  parsedData: Partial<ResumeData>;
  parsingMethod: string;
  usedFallback: boolean;
  processingTime: number;
}> => {
  console.log(`[${processingId}] Starting PDF processing with fallbacks`);
  
  toast.info("PDF Processing", {
    description: "Processing PDF. This may take a moment...",
    duration: 5000
  });
  
  // Track which methods have been attempted
  const attempts = {
    conversion: false,
    textExtraction: false,
    directProcessing: false
  };
  
  // Store errors for debugging
  const errors: Record<string, any> = {};
  
  try {
    // Approach 1: Try PDF to Image conversion first (client-side)
    attempts.conversion = true;
    toast.loading("Converting PDF to image...", {
      id: "pdf-conversion",
      duration: 30000 // Increased timeout for conversion
    });
    
    try {
      console.log(`[${processingId}] Attempting PDF to image conversion`);
      
      // Use PDF.js to convert PDF to image
      const pdfAsImage = await convertPdfToImage(file);
      
      toast.dismiss("pdf-conversion");
      console.log(`[${processingId}] PDF converted to image successfully`);
      
      // Process the resulting image
      toast.info("PDF Converted", {
        description: "PDF converted to image. Now processing with AI...",
        duration: 5000
      });
      
      const result = await processImageFile(pdfAsImage, startTime, `${processingId}_converted`);
      
      // Add metadata about conversion
      result.parsedData.metadata = {
        ...(result.parsedData.metadata || {}),
        conversionMethod: 'pdf-to-image',
        originalFileType: file.type,
        originalFileName: file.name
      };
      
      result.parsingMethod = 'pdf-to-image-' + result.parsingMethod;
      
      return result;
    } catch (conversionError) {
      toast.dismiss("pdf-conversion");
      console.error(`[${processingId}] Error converting PDF to image:`, conversionError);
      errors.conversion = conversionError;
      
      // Show warning but continue to next approach
      toast.warning("Conversion Failed", {
        description: "Could not convert PDF to image. Trying alternative methods...",
        duration: 5000
      });
      
      console.log(`[${processingId}] Moving to text extraction approach`);
    }
    
    // Approach 2: Try text extraction
    attempts.textExtraction = true;
    toast.loading("Extracting text from PDF...", {
      id: "pdf-text-extraction",
      duration: 30000
    });
    
    try {
      console.log(`[${processingId}] Attempting text extraction from PDF`);
      
      // Read PDF as text
      const pdfText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = (e) => {
          console.error(`[${processingId}] Error reading PDF as text:`, e);
          reject(new Error('Failed to read PDF as text'));
        };
        reader.readAsText(file);
      });
      
      console.log(`[${processingId}] Extracted ${pdfText.length} characters of text from PDF`);
      console.log(`[${processingId}] First 200 characters: ${pdfText.substring(0, 200)}`);
      
      if (pdfText.length < 100) {
        console.warn(`[${processingId}] Extracted text is too short, might be a scanned PDF`);
        toast.dismiss("pdf-text-extraction");
        throw new Error('Insufficient text extracted from PDF');
      }
      
      // Create a timeout promise for the API call
      // TODO: Connect to Flask API - const apiPromise = supabase.functions.invoke('extract-resume-data', {
        body: { fileContent: pdfText },
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Text extraction API call timed out after 25 seconds')), 25000);
      });
      
      // Race the API call against the timeout
      const textResponse = await Promise.race([apiPromise, timeoutPromise]) as { 
        data?: Partial<ResumeData>; 
        error?: { message: string } 
      };
      
      toast.dismiss("pdf-text-extraction");
      
      if (textResponse.error) {
        console.error(`[${processingId}] Text extraction API error:`, textResponse.error);
        throw new Error(`Text extraction failed: ${textResponse.error.message}`);
      }
      
      const textData = textResponse.data;
      
      console.log(`[${processingId}] Text extraction API response:`, {
        success: true,
        dataReceived: !!textData,
        dataKeys: textData ? Object.keys(textData) : []
      });
      
      if (!textData || isEmptyResumeData(textData)) {
        console.error(`[${processingId}] Text extraction returned empty or invalid data`);
        throw new Error('No meaningful data returned from text extraction');
      }
      
      // Sanitize and add metadata
      const sanitizedTextData = sanitizeResumeData(textData);
      sanitizedTextData.metadata = {
        ...(sanitizedTextData.metadata || {}),
        parsingMethod: 'pdf-text-extraction',
        parsedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
        processingTime: Date.now() - startTime,
        processingId
      };
      
      toast.success("PDF Processed", {
        description: "Successfully extracted data from your PDF using text extraction.",
        duration: 5000
      });
      
      return {
        parsedData: sanitizedTextData,
        parsingMethod: 'pdf-text-extraction',
        usedFallback: false,
        processingTime: Date.now() - startTime
      };
    } catch (textExtractionError) {
      toast.dismiss("pdf-text-extraction");
      console.error(`[${processingId}] Text extraction failed:`, textExtractionError);
      errors.textExtraction = textExtractionError;
      
      // Show warning but continue to next approach
      toast.warning("Text Extraction Failed", {
        description: "Could not extract text from PDF. Trying direct processing...",
        duration: 5000
      });
      
      console.log(`[${processingId}] Moving to direct image processing approach`);
    }
    
    // Approach 3: Try direct image processing (will likely fail for PDFs but worth trying)
    attempts.directProcessing = true;
    toast.loading("Attempting direct processing...", {
      id: "pdf-direct-processing",
      duration: 30000
    });
    
    try {
      console.log(`[${processingId}] Attempting direct PDF processing with OpenAI Vision API`);
      
      // This will likely fail due to OpenAI API limitations, but we'll try anyway
      const result = await processImageFile(file, startTime, `${processingId}_direct`);
      toast.dismiss("pdf-direct-processing");
      return result;
    } catch (directProcessingError) {
      toast.dismiss("pdf-direct-processing");
      console.error(`[${processingId}] Direct PDF processing failed:`, directProcessingError);
      errors.directProcessing = directProcessingError;
    }
    
    // If all approaches fail, create a basic template and inform the user
    console.error(`[${processingId}] All PDF processing approaches failed:`, {
      attempts,
      errors
    });
    
    toast.error("PDF Processing Failed", {
      description: "Could not extract data from this PDF. Please try converting to JPG or PNG first, or fill in details manually.",
      duration: 8000
    });
    
    // Create basic template
    const fallbackData: Partial<ResumeData> = {
      personal: {
        fullName: "",
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
      metadata: {
        parsingMethod: 'manual-fallback',
        parsedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
        processingTime: Date.now() - startTime,
        processingId,
        note: "Automatic parsing failed. Please fill in your resume details manually.",
        failedAttempts: Object.keys(attempts).filter(key => attempts[key as keyof typeof attempts])
      }
    };
    
    return {
      parsedData: fallbackData,
      parsingMethod: 'manual-fallback',
      usedFallback: true,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    // Ensure all toast notifications are dismissed
    toast.dismiss("pdf-conversion");
    toast.dismiss("pdf-text-extraction");
    toast.dismiss("pdf-direct-processing");
    
    console.error(`[${processingId}] Unexpected error in PDF processing:`, error);
    console.error(`[${processingId}] Attempted methods:`, attempts);
    console.error(`[${processingId}] Method-specific errors:`, errors);
    
    toast.error("PDF Processing Failed", {
      description: "An unexpected error occurred. Please try converting your PDF to JPG or PNG first.",
      duration: 8000
    });
    
    throw new Error("PDF processing failed: " + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Process image file with OpenAI Vision API
 * @param file Image file to process
 * @param startTime Processing start time
 * @param processingId Unique ID for this processing attempt
 * @returns Promise resolving to processed resume data
 */
const processImageFile = async (file: File, startTime: number, processingId: string): Promise<{
  parsedData: Partial<ResumeData>;
  parsingMethod: string;
  usedFallback: boolean;
  processingTime: number;
}> => {
  console.log(`[${processingId}] Processing image file:`, {
    name: file.name,
    type: file.type,
    size: file.size
  });
  
  try {
    // Increase timeout duration for processing
    toast.loading("Processing your resume...", {
      id: "resume-processing",
      duration: 60000 // Increase to 60 seconds from 30 seconds
    });
    
    // Create a timeout promise to handle long-running processes
    const processingPromise = parseResumeFromImage(file);
    const timeoutPromise = new Promise<Partial<ResumeData>>((_, reject) => {
      setTimeout(() => reject(new Error('Processing timed out after 55 seconds')), 55000);
    });
    
    // Race the processing against the timeout
    const parsedData = await Promise.race([processingPromise, timeoutPromise]);
    const processingTime = Date.now() - startTime;
    
    toast.dismiss("resume-processing");
    
    console.log(`[${processingId}] Image processing completed in ${processingTime}ms`);
    console.log(`[${processingId}] Parsed data keys:`, Object.keys(parsedData));
    
    // Sanitize the data to remove any PDF artifacts
    const sanitizedData = sanitizeResumeData(parsedData);
    
    // Validate parsed data with improved error handling
    if (!sanitizedData || isEmptyResumeData(sanitizedData)) {
      console.warn(`[${processingId}] Extracted data appears empty after sanitization`);
      console.log(`[${processingId}] Original data keys:`, Object.keys(parsedData));
      console.log(`[${processingId}] Sanitized data keys:`, Object.keys(sanitizedData));
      
      // Ensure at least empty structures exist for required fields
      if (!sanitizedData.personal) sanitizedData.personal = {} as any;
      if (!sanitizedData.experience) sanitizedData.experience = [];
      if (!sanitizedData.education) sanitizedData.education = [];
      if (!sanitizedData.skills) sanitizedData.skills = [];
      
      // Show warning toast but continue with empty data
      toast.warning("Limited Data Extracted", {
        description: "Limited data extracted from this file. You may need to fill in details manually.",
        duration: 8000
      });
    }
    
    // Add metadata about sanitization if needed
    if (sanitizedData !== parsedData) {
      sanitizedData.metadata = {
        ...(sanitizedData.metadata || {}),
        sanitized: true,
        sanitizedAt: new Date().toISOString()
      };
    }
    
    // Add processing metadata
    sanitizedData.metadata = {
      ...(sanitizedData.metadata || {}),
      processingId,
      processingTime,
      fileType: file.type,
      fileSize: file.size,
      fileName: file.name
    };
    
    toast.success("Resume Processed", {
      description: "Successfully extracted data from your resume."
    });
    
    // Check which parsing method was used
    const parsingMethod = sanitizedData.metadata?.parsingMethod || 'image-processing';
    const usedFallback = parsingMethod.includes('fallback');
    
    return {
      parsedData: sanitizedData,
      parsingMethod,
      usedFallback,
      processingTime
    };
  } catch (error) {
    toast.dismiss("resume-processing");
    console.error(`[${processingId}] Error in image parsing:`, error);
    
    // Enhanced error handling with more specific messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    let userFriendlyMessage = "Failed to process your resume.";
    let actionSuggestion = "Please try again with a different file.";
    
    // Provide more specific guidance based on error type
    if (errorMessage.includes('timed out')) {
      userFriendlyMessage = "Processing took too long to complete.";
      actionSuggestion = "Try a simpler document or a different format.";
      
      toast.error("Processing Timeout", {
        description: `${userFriendlyMessage} ${actionSuggestion}`,
        duration: 8000
      });
      
      throw new Error(`Resume processing timed out. ${actionSuggestion}`);
    } else if (file.type === 'application/pdf' && errorMessage.includes('Invalid MIME type')) {
      console.error(`[${processingId}] PDF format error with OpenAI:`, errorMessage);
      
      userFriendlyMessage = "PDF format not directly supported by our AI service.";
      actionSuggestion = "Please convert to JPG or PNG first.";
      
      toast.error("PDF Format Issue", {
        description: `${userFriendlyMessage} ${actionSuggestion}`,
        duration: 8000
      });
      
      // Create a descriptive but simplified error for the user
      throw new Error(
        "PDF format not directly supported by our AI image service. We're working on converting PDFs to images automatically. " +
        "For now, please convert your PDF to JPG or PNG before uploading."
      );
    } else if (errorMessage.includes('No meaningful data')) {
      userFriendlyMessage = "The AI couldn't extract information from your document.";
      actionSuggestion = "Try uploading a clearer image with better lighting and contrast.";
      
      toast.error("Data Extraction Failed", {
        description: `${userFriendlyMessage} ${actionSuggestion}`,
        duration: 8000
      });
      
      throw new Error(`${userFriendlyMessage} ${actionSuggestion}`);
    } else if (errorMessage.includes('too large')) {
      toast.error("File Size Error", {
        description: errorMessage,
        duration: 8000
      });
      throw error;
    }
    
    // Re-throw original error with enhanced message
    toast.error("Resume Processing Error", {
      description: `${userFriendlyMessage} ${actionSuggestion}`,
      duration: 8000
    });
    
    throw error;
  }
};
