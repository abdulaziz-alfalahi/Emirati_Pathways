
/**
 * PDF parsing utilities
 */

/**
 * Checks if a PDF appears to be scanned (image-based with no extractable text)
 */
export const checkIfScannedPdf = async (file: File): Promise<boolean> => {
  try {
    // Read the first few bytes to check for PDF signature
    const buffer = await file.slice(0, 1024).arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    
    // Check for PDF signature
    if (!text.startsWith('%PDF-')) {
      console.warn('File does not start with PDF signature, might not be a valid PDF');
      return false;
    }
    
    // Real implementation would need to analyze the PDF structure
    // For now, we will use a simple heuristic based on file size and number of pages
    // Assuming scanned PDFs are typically larger per page
    const isLarge = file.size > 1000000; // Over 1MB
    
    // Additional check would be for embedded fonts/text vs. images
    // but that requires parsing the PDF structure more deeply
    
    console.log("Check if PDF is scanned:", {
      fileName: file.name,
      fileSize: file.size,
      isLargeFile: isLarge,
      assumption: isLarge ? "Might be scanned (large file)" : "Likely contains text (small file)"
    });
    
    // This is a simple mock implementation
    // In a real app, we'd use PDF.js to check for text content
    return isLarge;
  } catch (error) {
    console.error("Error checking if PDF is scanned:", error);
    // Default to conservative approach if we can't determine
    return true;
  }
};

/**
 * Processes a PDF file to determine the best parsing strategy
 */
export const processPdfForResumeParsing = async (file: File): Promise<{
  strategy: 'text-extraction' | 'image-ocr' | 'hybrid';
  shouldUseImageParser: boolean;
}> => {
  try {
    // Check if file is actually a PDF
    if (file.type !== 'application/pdf') {
      console.warn(`File is not a PDF: ${file.type}`);
      return {
        strategy: 'text-extraction',
        shouldUseImageParser: false
      };
    }
    
    // Try to determine if PDF is scanned
    const isScanned = await checkIfScannedPdf(file);
    
    if (isScanned) {
      console.log("PDF appears to be scanned, using image-based OCR strategy");
      return {
        strategy: 'image-ocr',
        shouldUseImageParser: true
      };
    }
    
    // For regular text-based PDFs
    console.log("PDF appears to contain extractable text, using text-extraction strategy");
    return {
      strategy: 'text-extraction',
      shouldUseImageParser: false
    };
  } catch (error) {
    console.error("Error processing PDF for parsing strategy:", error);
    // Default to text extraction if we encounter an error
    return {
      strategy: 'text-extraction',
      shouldUseImageParser: false
    };
  }
};

/**
 * Reads text content from a PDF file
 * @param file PDF file to extract text from
 * @returns Promise resolving to the extracted text
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  // In a real implementation, this would use PDF.js to extract text
  // For now, we'll use a simple FileReader to attempt text extraction
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string || '';
        resolve(text);
      } catch (error) {
        reject(new Error('Failed to extract text from PDF'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading PDF file'));
    reader.readAsText(file);
  });
};
