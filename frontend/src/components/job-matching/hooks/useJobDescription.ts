// src/components/job-matching/hooks/useJobDescription.ts
import { useState, useCallback } from 'react';
import { JobDescription, ApiResponse, FormValidation, LoadingState, ErrorState } from '@/types/platform';
import { jobApi, handleApiError } from '@/utils/api';

interface UseJobDescriptionReturn {
  jobDescription: string;
  setJobDescription: (text: string) => void;
  parsedData: Partial<JobDescription> | null;
  isLoading: boolean;
  isUploading: boolean;
  isSaving: boolean;
  apiStatus: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string;
  manualFields: {
    title: string;
    company: string;
    location: string;
  };
  setManualFields: (fields: any) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleFileUpload: (files: File[]) => Promise<void>;
  handleSaveToDatabase: () => Promise<void>;
  testDatabaseInsert: () => Promise<void>;
  viewSavedJobDescriptions: () => void;
  validation: FormValidation;
}

export function useJobDescription(): UseJobDescriptionReturn {
  const [jobDescription, setJobDescription] = useState('');
  const [parsedData, setParsedData] = useState<Partial<JobDescription> | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false });
  const [error, setError] = useState<ErrorState>({ hasError: false });
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [manualFields, setManualFields] = useState({
    title: '',
    company: '',
    location: ''
  });
  const [validation, setValidation] = useState<FormValidation>({
    isValid: false,
    errors: {},
    warnings: {}
  });

  const validateData = useCallback((data: Partial<JobDescription>) => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    if (!data.title?.trim() && !manualFields.title?.trim()) {
      errors.title = 'Job title is required';
    }
    if (!data.company?.trim() && !manualFields.company?.trim()) {
      errors.company = 'Company name is required';
    }
    if (!data.description?.trim()) {
      warnings.description = 'Job description is recommended for better matching';
    }

    const newValidation: FormValidation = {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };

    setValidation(newValidation);
    return newValidation;
  }, [manualFields]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobDescription.trim()) {
      setError({ hasError: true, errorMessage: 'Please enter a job description' });
      return;
    }

    setLoading({ isLoading: true, loadingMessage: 'Parsing job description...' });
    setApiStatus('loading');
    setError({ hasError: false });

    try {
      const response = await jobApi.parseText(jobDescription);
      
      if (response.success && response.data) {
        setParsedData(response.data);
        setApiStatus('success');
        validateData(response.data);
      } else {
        throw new Error(response.error || 'Failed to parse job description');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError({ hasError: true, errorMessage });
      setApiStatus('error');
    } finally {
      setLoading({ isLoading: false });
    }
  }, [jobDescription, validateData]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setLoading({ isLoading: true, loadingMessage: 'Processing uploaded files...' });
    setApiStatus('loading');
    setError({ hasError: false });

    try {
      const results = await Promise.all(
        files.map(file => jobApi.parse(file))
      );

      const successfulResults = results.filter(result => result.success);
      
      if (successfulResults.length > 0) {
        // For multiple files, you might want to handle this differently
        const firstResult = successfulResults[0];
        setParsedData(firstResult.data);
        setApiStatus('success');
        validateData(firstResult.data);
      } else {
        throw new Error('Failed to parse any of the uploaded files');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError({ hasError: true, errorMessage });
      setApiStatus('error');
    } finally {
      setLoading({ isLoading: false });
    }
  }, [validateData]);

  const handleSaveToDatabase = useCallback(async () => {
    if (!parsedData) {
      setError({ hasError: true, errorMessage: 'No data to save' });
      return;
    }

    const validation = validateData(parsedData);
    if (!validation.isValid) {
      setError({ hasError: true, errorMessage: 'Please fix validation errors before saving' });
      return;
    }

    setLoading({ isLoading: true, loadingMessage: 'Saving to database...' });

    try {
      const dataToSave: Partial<JobDescription> = {
        ...parsedData,
        title: manualFields.title || parsedData.title,
        company: manualFields.company || parsedData.company,
        location: manualFields.location || parsedData.location,
        is_active: true
      };

      const response = await jobApi.save(dataToSave);
      
      if (response.success) {
        setApiStatus('success');
        // Optionally reset form or redirect
      } else {
        throw new Error(response.error || 'Failed to save job description');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError({ hasError: true, errorMessage });
      setApiStatus('error');
    } finally {
      setLoading({ isLoading: false });
    }
  }, [parsedData, manualFields, validateData]);

  const testDatabaseInsert = useCallback(async () => {
    // Implementation for testing database connectivity
    console.log('Testing database connection...');
  }, []);

  const viewSavedJobDescriptions = useCallback(() => {
    // Implementation for viewing saved job descriptions
    console.log('Viewing saved job descriptions...');
  }, []);

  return {
    jobDescription,
    setJobDescription,
    parsedData,
    isLoading: loading.isLoading,
    isUploading: loading.isLoading && loading.loadingMessage?.includes('upload'),
    isSaving: loading.isLoading && loading.loadingMessage?.includes('Saving'),
    apiStatus,
    errorMessage: error.errorMessage || '',
    manualFields,
    setManualFields,
    handleSubmit,
    handleFileUpload,
    handleSaveToDatabase,
    testDatabaseInsert,
    viewSavedJobDescriptions,
    validation
  };
}
