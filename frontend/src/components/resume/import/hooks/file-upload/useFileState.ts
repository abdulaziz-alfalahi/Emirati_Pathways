
import { useState, useRef } from 'react';

/**
 * Hook to manage file selection state
 */
export const useFileState = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [abortController] = useState(new AbortController());

  return {
    isUploading,
    setIsUploading,
    uploadError,
    setUploadError,
    selectedFile,
    setSelectedFile,
    fileInputRef,
    abortController
  };
};
