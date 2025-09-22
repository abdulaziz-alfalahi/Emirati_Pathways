
/**
 * PDF processing using PDF.js library
 */
import * as pdfjs from 'pdfjs-dist';
import { ResumeData } from '../../../types';
import { toast } from 'sonner';

// Set up the worker source
const pdfWorkerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

/**
 * Extract text from PDF using PDF.js
 * @param file PDF file to process
 * @returns Promise resolving to extracted text content
 */
export const extractTextFromPdfWithPdfJs = async (file: File): Promise<string> => {
  try {
    // Create a buffer from the file
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    
    // Show loading toast for large documents
    const toastId = file.size > 1000000 ? 
      toast.loading("Processing PDF document...", { duration: 30000 }) : 
      undefined;
    
    try {
      const pdfDocument = await loadingTask.promise;
      console.log(`PDF document loaded with ${pdfDocument.numPages} pages`);
      
      // Extract text from all pages
      let fullText = '';
      
      // Process all pages
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        // Get the page
        const page = await pdfDocument.getPage(pageNum);
        
        // Get text content
        const textContent = await page.getTextContent();
        
        // Extract text from text items
        const pageText = textContent.items
          .map(item => 'str' in item ? item.str : '')
          .join(' ');
          
        fullText += pageText + '\n\n';
      }
      
      if (toastId) toast.dismiss(toastId);
      
      // Return the extracted text
      return fullText.trim();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      throw error;
    }
  } catch (error) {
    console.error('Error extracting text with PDF.js:', error);
    throw new Error('Failed to extract text from PDF using PDF.js: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Process a PDF file and extract resume data using PDF.js
 * @param file PDF file to process
 * @returns Promise resolving to extracted text content
 */
export const processPdfWithPdfJs = async (file: File): Promise<string> => {
  try {
    console.log('Processing PDF with PDF.js...');
    
    // Extract text from PDF
    const extractedText = await extractTextFromPdfWithPdfJs(file);
    
    if (!extractedText || extractedText.trim().length < 100) {
      console.warn('PDF.js extracted very little text, may be a scanned PDF');
      throw new Error('This appears to be a scanned PDF with minimal text content. Please try the Image Upload option instead.');
    }
    
    return extractedText;
  } catch (error) {
    console.error('PDF.js processing failed:', error);
    throw error;
  }
};

/**
 * Get PDF metadata using PDF.js
 * @param file PDF file to analyze
 * @returns Promise resolving to PDF metadata
 */
export const getPdfMetadata = async (file: File): Promise<Record<string, string>> => {
  try {
    // Create a buffer from the file
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    // Get the metadata
    const metadata = await pdfDocument.getMetadata();
    
    // Create a clean metadata object with only string values
    const result: Record<string, string> = {};
    
    // Add document info
    if (metadata.info) {
      Object.entries(metadata.info).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          result[key] = String(value);
        }
      });
    }
    
    // Add page count
    result.pageCount = pdfDocument.numPages.toString();
    
    // Add PDF/A compliance info if available
    // Fix the type error: Use type checking instead of the 'has' method
    const metadataObj = metadata.metadata as any;
    result.isTagged = String(!!(metadataObj && metadataObj['pdfaid:part']));
    
    // Check if document is encrypted - using hasOwnProperty to check for property
    result.isEncrypted = String('encrypt' in pdfDocument);
    
    return result;
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    return { error: 'Failed to extract metadata' };
  }
};
