
import { ResumeData } from '../../types';

// Define the result interface for all processors
export interface ProcessedResult {
  parsedData: Partial<ResumeData>;
  parsingMethod: string;
  usedFallback?: boolean;
  processingTime?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}
