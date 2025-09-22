
import { useFileState } from './useFileState';
import { useFileTypeHandler } from './useFileValidation';
import { useProcessing } from './useProcessing';
import { ResumeData } from '../../../types';

interface UseFileUploadProps {
  onImportComplete: (data: ResumeData) => void;
  onError?: (error: Error) => void;
  currentData: ResumeData;
}

export const useFileUpload = ({ 
  onImportComplete, 
  onError, 
  currentData 
}: UseFileUploadProps) => {
  const {
    isUploading,
    setIsUploading,
    uploadError,
    setUploadError,
    selectedFile,
    setSelectedFile,
    fileInputRef,
    abortController
  } = useFileState();

  const { handleFileType } = useFileTypeHandler();
  const { processFile } = useProcessing({ onImportComplete, onError, currentData });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Store the selected file without uploading yet
    setSelectedFile(file);
    setUploadError(null);
    
    // Handle file type warnings
    handleFileType(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return false;

    setIsUploading(true);
    setUploadError(null);
    
    try {
      const success = await processFile(selectedFile);
      
      // Reset the state on success
      if (success) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      
      return success;
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      setUploadError(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadError,
    selectedFile,
    fileInputRef,
    handleFileChange,
    handleFileUpload,
    setUploadError
  };
};
