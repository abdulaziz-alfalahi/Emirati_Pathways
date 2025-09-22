
import { useState } from 'react';
import { ResumeData } from '../../../types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useServerProcessing } from './useServerProcessing';
import { useClientProcessing } from './useClientProcessing';

interface UseProcessingProps {
  onImportComplete: (data: ResumeData) => void;
  onError?: (error: Error) => void;
  currentData: ResumeData;
}

/**
 * Hook to handle file processing logic
 */
export const useProcessing = ({
  onImportComplete,
  onError,
  currentData
}: UseProcessingProps) => {
  const [processingTimeoutId, setProcessingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { processWithServer } = useServerProcessing();
  const { processWithClient } = useClientProcessing();

  const processFile = async (file: File) => {
    const timeoutId = setTimeout(() => {
      console.warn("Document processing taking longer than expected");
      toast.info("Processing is taking longer than expected", {
        description: "Please be patient. Complex documents may take more time.",
        duration: 8000,
      });
    }, 10000); // 10 seconds timeout
    
    setProcessingTimeoutId(timeoutId);
    
    try {
      console.log(`Starting to process ${file.name} (${file.type}, ${file.size} bytes)`);
      
      // If the user is logged in, try to use the server-side parser
      if (user) {
        try {
          const serverSuccess = await processWithServer(
            file, 
            user.id, 
            currentData, 
            onImportComplete, 
            onError
          );
          
          if (serverSuccess) {
            return true;
          }
          // If server processing fails, continue to client-side processing as fallback
        } catch (serverError) {
          console.error('Server processing error:', serverError);
          // Continue with client-side processing as fallback
        }
      }
      
      // Fall back to client-side processing if not logged in or API failed
      return await processWithClient(file, currentData, onImportComplete, onError);
      
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.error('Error parsing resume:', error);
      
      let errorMessage = error instanceof Error ? error.message : "Failed to parse resume";
      
      // Make the error message more user-friendly for Word documents
      if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
        errorMessage = "Word document parsing failed. Please save your document as PDF and try again, or use the Image Upload option.";
      }
      
      toast.error("Error Processing Resume", {
        description: errorMessage,
      });
      
      // Forward the error to parent component if handler provided
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      return false;
    } finally {
      if (processingTimeoutId) {
        clearTimeout(processingTimeoutId);
        setProcessingTimeoutId(null);
      }
    }
  };

  return { processFile };
};
