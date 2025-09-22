
import { toast } from 'sonner';
import { validateResumeFileType, validateFileSize } from '../../utils/helpers/validation';

/**
 * Validates file size and type, displaying appropriate warnings
 * @param file File to validate
 * @param maxSize Optional maximum size in bytes (defaults to 5MB)
 * @returns Object with validation status and any error message
 */
export const validateResumeFile = (file: File, maxSize?: number): { 
  isValid: boolean; 
  errorMessage?: string;
  warnings?: string[];
} => {
  // Validate file size
  const sizeValidation = validateFileSize(file.size, maxSize);
  if (!sizeValidation.isValid) {
    return {
      isValid: false,
      errorMessage: `File too large. Please upload a file smaller than ${sizeValidation.maxSizeInMB}MB.`
    };
  }
  
  // Validate file type
  const typeValidation = validateResumeFileType(file.type);
  const warnings: string[] = [];
  
  if (typeValidation.isUnsupported) {
    warnings.push(`Unsupported file type. For best results, use ${typeValidation.supportedTypes.join(', ')} files.`);
    
    // Show toast warning for unsupported types
    toast.warning("Unsupported file type", {
      description: `For best results, use ${typeValidation.supportedTypes.join(', ')} files.`,
    });
  }
  
  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Determines whether a file is a DOCX document
 * @param file File to check
 * @returns Boolean indicating if file is DOCX
 */
export const isDocxFile = (file: File): boolean => {
  return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
         file.name.toLowerCase().endsWith('.docx');
};

/**
 * Determines whether a file is a PDF document
 * @param file File to check
 * @returns Boolean indicating if file is PDF
 */
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf' || 
         file.name.toLowerCase().endsWith('.pdf');
};
