
import { ResumeData } from '../../../types';
import { toast } from 'sonner';
import { parseAndSaveResume } from '@/services/resumeParserService';
import { mergeResumeData } from '../../utils/dataUtils';

/**
 * Hook for handling server-side resume processing
 */
export const useServerProcessing = () => {
  /**
   * Process a resume file using server-side parsing
   * @param file Resume file to process
   * @param userId User ID for storage
   * @param currentData Current resume data
   * @param onSuccess Success callback
   * @param onError Error callback
   * @returns Promise resolving to boolean indicating success
   */
  const processWithServer = async (
    file: File,
    userId: string,
    currentData: ResumeData,
    onSuccess: (data: ResumeData) => void,
    onError?: (error: Error) => void
  ): Promise<boolean> => {
    try {
      console.log("Using server-side parsing via Affinda");
      
      // Validate file size before sending
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit. Please upload a smaller file.');
      }
      
      // Use the integrated Supabase + Affinda service
      await parseAndSaveResume(
        file, 
        userId,
        (parsedData) => {
          console.log("Server-side parsing successful, updating resume data");
          const mergedData = mergeResumeData(currentData, parsedData);
          onSuccess(mergedData);
        },
        onError
      );
      
      return true;
    } catch (error) {
      console.error('Error with server-side parsing:', error);
      toast.warning("Server parsing unavailable", {
        description: "Using local parsing as fallback.",
        duration: 5000
      });
      
      // Signal failure to allow fallback to client-side processing
      return false;
    }
  };

  return { processWithServer };
};
