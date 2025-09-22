
import { ResumeData } from '../../../types';
import { toast } from 'sonner';
import { processResumeFile } from '../../utils/fileProcessor';
import { mergeResumeData } from '../../utils/dataUtils';
import { validateParsedData } from './useFileValidation';
import { isPdfContentCorrupted, cleanPdfCorruptedData } from './usePdfValidation';

/**
 * Hook for handling client-side resume processing
 */
export const useClientProcessing = () => {
  /**
   * Process a resume file using client-side parsing
   * @param file Resume file to process
   * @param currentData Current resume data
   * @param onSuccess Success callback
   * @param onError Error callback
   * @returns Promise resolving to boolean indicating success
   */
  const processWithClient = async (
    file: File,
    currentData: ResumeData,
    onSuccess: (data: ResumeData) => void,
    onError?: (error: Error) => void
  ): Promise<boolean> => {
    try {
      console.log(`Client-side processing: ${file.name} (${file.type}, ${file.size} bytes)`);
      
      // Process the file using client-side methods
      const { parsedData, usedFallback } = await processResumeFile(file);
      
      // Check for obvious PDF corruption markers in the personal data
      const hasPdfCorruption = isPdfContentCorrupted(parsedData);
      
      if (hasPdfCorruption) {
        console.error('Detected corrupted PDF data in parsed result:', parsedData.personal);
        toast.error("Document Processing Error", {
          description: "This document contains formatting that prevents proper text extraction. Please try a different file format or use our image upload option.",
        });
        
        // Create a clean version without corrupted data
        const cleanData = cleanPdfCorruptedData(parsedData);
        
        // Still return the cleaned data so the user can edit manually
        if (typeof onSuccess === 'function') {
          const mergedData = mergeResumeData(currentData, cleanData);
          onSuccess(mergedData);
        }
        
        return true;
      }
      
      // Validate parsed data to ensure it's not corrupted
      const isDataValid = validateParsedData(parsedData);
      
      if (!isDataValid) {
        throw new Error(
          "Your document contains formatting that couldn't be properly parsed. " +
          "Please save as PDF first or use the image upload option instead."
        );
      }
      
      if (usedFallback) {
        toast.warning("Basic Extraction Used", {
          description: "Limited data was extracted from your resume due to formatting issues.",
        });
      } else {
        toast.success("Resume Processed", {
          description: "Your resume has been processed successfully.",
        });
      }
      
      if (typeof onSuccess === 'function') {
        const mergedData = mergeResumeData(currentData, parsedData);
        onSuccess(mergedData);
      } else {
        console.error('Error: onImportComplete is not a function');
        toast.error("Application Error", {
          description: "There was a problem updating the resume data. Please refresh the page and try again.",
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error in client-side processing:', error);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      return false;
    }
  };

  return { processWithClient };
};
