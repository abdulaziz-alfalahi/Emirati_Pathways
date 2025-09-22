
import { ResumeData } from '@/components/resume/types';

// Affinda API response types
export interface AffindaResponseData {
  name?: { text?: string; raw?: string };
  profession?: { text?: string; raw?: string };
  emails?: string[];
  phoneNumbers?: { text?: string; raw?: string }[];
  location?: { text?: string; raw?: string };
  linkedin?: string;
  websites?: string[];
  summary?: { text?: string };
  workExperience?: any[];
  education?: any[];
  skills?: any[];
  languages?: any[];
  [key: string]: any;
}

export interface ParsingResult {
  success: boolean;
  data?: Partial<ResumeData>;
  error?: string;
  metadata?: {
    parsingMethod: string;
    processingTime?: number;
    fileType?: string;
  };
}

export interface ApiKeyResponse {
  affinda_api_key?: string;
  [key: string]: any;
}
