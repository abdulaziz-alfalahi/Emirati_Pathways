
import { ResumeData } from '../../../types';
import { toast } from 'sonner';

/**
 * Helper function to validate parsed data
 * @param data - The parsed resume data to validate
 * @returns boolean indicating if data is valid
 */
export const validateParsedData = (data: Partial<ResumeData>): boolean => {
  // Check for corrupt personal data patterns
  const suspiciousPatterns = [
    /PK!/,
    /\[Content_Types\]/,
    /docProps/,
    /<%/,
    /%>/,
    /\uFFFD/,  // Unicode replacement character
    /[^\x20-\x7E\s]/g, // Non-printable ASCII characters
    /[!@#$%^&*()]{3,}/,  // Multiple special characters in a row
    /^\s*l"%\d+/,  // Specific pattern seen in corrupted Word docs
    /%PDF-/i,      // PDF header
    /\/Metadata\s+\d+\s+\d+\s+R/i, // PDF metadata references
    /endobj|endstream/i, // PDF object markers
    /xref|startxref/i, // PDF cross references
  ];
  
  // Check personal info fields
  if (data.personal) {
    for (const key in data.personal) {
      const value = data.personal[key as keyof typeof data.personal];
      if (typeof value !== 'string') continue;
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          console.error(`Corrupted data detected in ${key}:`, value);
          return false;
        }
      }
      
      // Check for PDF internal data in field values
      if ((value.includes('/R') || value.includes('Metadata') || 
           value.includes('endobj') || value.includes('%%EOF')) && 
          key !== 'summary') {
        console.error(`Likely PDF internal data found in ${key}:`, value);
        return false;
      }
    }
  }
  
  // Check if summary contains error message about PDF
  if (data.summary && typeof data.summary === 'string' && 
      (data.summary.includes('PDF') || data.summary.includes('corrupted'))) {
    // This is likely an error message, not actual resume data
    console.warn('Summary contains error message about PDF:', data.summary);
    // But we'll still accept it, as it's a valid error state
  }
  
  // Ensure we have at least some meaningful data
  const hasValidName = data.personal?.fullName && 
                      data.personal.fullName !== "Not found" && 
                      data.personal.fullName.length > 1;
                      
  // If we have almost no data and it's all "Not found", it's likely an error
  const allNotFound = data.personal?.fullName === "Not found" &&
                     data.personal?.email === "Not found" &&
                     data.personal?.phone === "Not found";
                     
  if (allNotFound) {
    return false;
  }
  
  return true;
};

/**
 * Handle file type detection and warnings
 */
export const useFileTypeHandler = () => {
  const handleFileType = (file: File | null) => {
    if (!file) return;
    
    // Check file extension for Word documents and provide pre-warning for .docx files
    if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
      console.log('Word document detected, informing user about special handling');
      toast.info("Word Document Detected", {
        description: "Word documents may take longer to process. Please be patient.",
        duration: 5000,
      });
    }
  };

  return { handleFileType };
};
