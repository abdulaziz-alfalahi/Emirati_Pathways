// src/context/CVContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

// API client (only what we use)
import { cvBuilderApi } from '@/utils/api';

// Validation helpers
import {
  validateUAEPhone,
  formatUAEPhone,
  validateEmiratesId,
  formatEmiratesId,
  // validateEmail, // (available if you want to expose later)
  sanitizeText, // (not used in this file yet, but fine to keep)
} from '@/utils/validation';

// Types
import {
  CV,
  CVLanguage,
  CVStep,
  CVAnalytics as CVAnalyticsType,
} from '@/types/cv';

// UAE data
import {
  UAE_EMIRATES,
  UAE_CITIES,
} from '@/utils/uae-data';

// CV utilities
import {
  calculateCompletionScore,
  generateCVSuggestions,
  validateCVSection,
} from '@/utils/cv-utils';

/** Template metadata coming from the API (widened to satisfy UI usage) */
interface TemplateMeta {
  id: string;
  name?: string;
  display_name?: string;
  description?: string;
  previewUrl?: string;    // Some APIs use camelCase
  preview_url?: string;   // UI uses snake_case
  category?: string;
  industry?: string;
  is_premium?: boolean;
  language?: string;
  metadata?: {
    best_for?: string[];
    features?: string[];
    target_audience?: string;
    color_scheme?: string;
    layout_type?: string;
  };
}

interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

type ExportFormat = 'pdf' | 'docx' | 'json' | 'word';
type ExportResult = { success: boolean; url?: string; message?: string };

interface CVContextType {
  // CV Data
  currentCV: CV | null;
  /** Alias for components expecting `cvData` */
  cvData: CV | null;
  cvList: CV[];

  // Templates
  templates: TemplateMeta[];

  // Loading and Error States
  loading: LoadingState;
  error: string | null;

  // Current Step
  currentStep: CVStep;

  // CV Operations
  createCV: (templateOrId: TemplateMeta | string, language: CVLanguage | string) => Promise<void>;
  updateCV: (cvId: string, updates: Partial<CV>) => Promise<void>;
  deleteCV: (cvId: string) => Promise<void>;
  duplicateCV: (cvId: string, newTitle?: string) => Promise<void>;
  loadCV: (cvId: string) => Promise<void>;
  saveCV: () => Promise<void>;

  // Template Operations
  getTemplates: () => Promise<TemplateMeta[]>;
  selectTemplate: (templateId: string) => Promise<void>;

  // Section Updates
  updatePersonalInfo: (info: Partial<CV['personalInfo']>) => Promise<void>;
  updateExperience: (experience: CV['experience']) => Promise<void>;
  updateEducation: (education: CV['education']) => Promise<void>;
  updateSkills: (skills: CV['skills']) => Promise<void>;
  updateLanguages: (languages: CV['languages']) => Promise<void>;

  // Step Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: CVStep) => void;

  // Export Operations
  /**
   * Flexible export signature:
   * - exportCV(cvId, format, options?)
   * - exportCV(formatOnly)  // uses current CV id
   */
  exportCV: (...args: any[]) => Promise<ExportResult>;

  // Analytics (now part of context so components can read directly)
  analytics: CVAnalyticsType | null;
  completionScore: number;
  refreshAnalytics: (cvId?: string) => Promise<void>;
  getAnalytics: (cvId?: string) => Promise<CVAnalyticsType>;

  // Validation
  validateSection: (section: string, data: unknown) => boolean;

  // UAE Data Access
  uaeEmirates: typeof UAE_EMIRATES;
  uaeCities: typeof UAE_CITIES;
  validateUAEPhone: (phone: string) => boolean;
  formatUAEPhone: (phone: string) => string;
  validateEmiratesId: (id: string) => boolean;
  formatEmiratesId: (id: string) => string;

  // Utility Functions
  getCompletionScore: () => number;
  getSuggestions: () => string[];
}

const CVContext = createContext<CVContextType | undefined>(undefined);

interface CVProviderProps {
  children: ReactNode;
}

export const CVProvider: React.FC<CVProviderProps> = ({ children }) => {
  // State
  const [currentCV, setCurrentCV] = useState<CV | null>(null);
  const [cvList, setCvList] = useState<CV[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false });
  const [error, setError] = useState<string | null>(null);

  // Analytics state exposed to consumers
  const [analytics, setAnalytics] = useState<CVAnalyticsType | null>(null);

  // ✅ Use enum values (not raw strings) to satisfy CVStep typing
  const [currentStep, setCurrentStep] = useState<CVStep>(CVStep.TEMPLATE_SELECTION);

  // Derived completion score (exposed directly on the context)
  const completionScore = useMemo(
    () => (currentCV ? calculateCompletionScore(currentCV) : 0),
    [currentCV]
  );

  // Initialize from localStorage if available
  useEffect(() => {
    const lastCvId = localStorage.getItem('lastCvId');
    if (lastCvId && !currentCV) {
      loadCV(lastCvId);
    }
  }, []);

  // Error helper
  const handleError = (err: unknown, operation: string) => {
    // eslint-disable-next-line no-console
    console.error(`Error in ${operation}:`, err);
    const message = (err as any)?.message || `Failed to ${operation}`;
    setError(message);
    setLoading({ isLoading: false });
  };

  // CV Operations
  const createCV = async (
    templateOrId: TemplateMeta | string,
    language: CVLanguage | string
  ): Promise<void> => {
    try {
      setLoading({ isLoading: true, operation: 'Creating CV...' });
      setError(null);

      const templateId =
        typeof templateOrId === 'string'
          ? templateOrId
          : templateOrId.id ?? templateOrId.name ?? '';

      const response: any = await (cvBuilderApi as any).create({
        template: templateId,
        language,
        title: `My CV`,
      });

      const newCV = response?.data?.data ?? response?.data ?? null;
      if (response?.success && newCV) {
        setCurrentCV(newCV as CV);
        setCurrentStep(CVStep.PERSONAL_INFO);
      } else {
        throw new Error(response?.error || 'Failed to create CV');
      }
    } catch (err) {
      handleError(err, 'create CV');
    } finally {
      setLoading({ isLoading: false });
    }
  };

  const updateCV = async (cvId: string, updates: Partial<CV>): Promise<void> => {
    try {
      setLoading({ isLoading: true, operation: 'Updating CV...' });
      setError(null);

      const response: any = await (cvBuilderApi as any).update(cvId, updates);
      const updated = response?.data ?? null;

      if (response?.success && updated) {
        setCurrentCV(updated as CV);
      } else {
        throw new Error(response?.error || 'Failed to update CV');
      }
    } catch (err) {
      handleError(err, 'update CV');
    } finally {
      setLoading({ isLoading: false });
    }
  };

  const deleteCV = async (cvId: string): Promise<void> => {
    try {
      setLoading({ isLoading: true, operation: 'Deleting CV...' });
      setError(null);

      const response: any = await (cvBuilderApi as any).delete(cvId);

      if (response?.success) {
        setCvList((prev) => prev.filter((cv) => cv.id !== cvId));
        if (currentCV?.id === cvId) setCurrentCV(null);
      } else {
        throw new Error(response?.error || 'Failed to delete CV');
      }
    } catch (err) {
      handleError(err, 'delete CV');
    } finally {
      setLoading({ isLoading: false });
    }
  };

  const duplicateCV = async (cvId: string, newTitle?: string): Promise<void> => {
    try {
      setLoading({ isLoading: true, operation: 'Duplicating CV...' });
      setError(null);

      const response: any = await (cvBuilderApi as any).duplicate({ id: cvId, title: newTitle });
      const duplicated = response?.data ?? null;

      if (response?.success && duplicated) {
        setCvList((prev) => [...prev, duplicated as CV]);
      } else {
        throw new Error(response?.error || 'Failed to duplicate CV');
      }
    } catch (err) {
      handleError(err, 'duplicate CV');
    } finally {
      setLoading({ isLoading: false });
    }
  };

  const loadCV = async (cvId: string): Promise<void> => {
    try {
      setLoading({ isLoading: true, operation: 'Loading CV...' });
      setError(null);

      const response: any = await (cvBuilderApi as any).get(cvId);
      const loaded = response?.data ?? null;

      if (response?.success && loaded) {
        setCurrentCV(loaded as CV);
      } else {
        throw new Error(response?.error || 'Failed to load CV');
      }
    } catch (err) {
      handleError(err, 'load CV');
    } finally {
      setLoading({ isLoading: false });
    }
  };

  const saveCV = async (): Promise<void> => {
    if (!currentCV) return;

    try {
      setLoading({ isLoading: true, operation: 'Saving CV...' });
      setError(null);

      const response: any = await (cvBuilderApi as any).update(currentCV.id, currentCV);
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to save CV');
      }
    } catch (err) {
      handleError(err, 'save CV');
    } finally {
      setLoading({ isLoading: false });
    }
  };

  // Template Operations
  const getTemplates = async (): Promise<TemplateMeta[]> => {
    try {
      setLoading({ isLoading: true, operation: 'Loading templates...' });
      setError(null);

      const response: any = await (cvBuilderApi as any).getTemplates();
      const list: TemplateMeta[] = response?.data ?? [];

      if (response?.success && Array.isArray(list)) {
        setTemplates(list);
        return list;
      } else {
        throw new Error(response?.error || 'Failed to load templates');
      }
    } catch (err) {
      handleError(err, 'load templates');
      return [];
    } finally {
      setLoading({ isLoading: false });
    }
  };

  const selectTemplate = async (templateId: string): Promise<void> => {
    try {
      const template = templates.find((t) => t.id === templateId);
      const lang: CVLanguage = CVLanguage.ENGLISH;
      await createCV(template ?? templateId, lang);
    } catch (err) {
      handleError(err, 'select template');
    }
  };

  // Section Updates
  const updatePersonalInfo = async (info: Partial<CV['personalInfo']>): Promise<void> => {
    if (!currentCV) return;
    const updatedCV: CV = { ...currentCV, personalInfo: { ...currentCV.personalInfo, ...info } };
    await updateCV(currentCV.id, updatedCV);
  };

  const updateExperience = async (experience: CV['experience']): Promise<void> => {
    if (!currentCV) return;
    const updatedCV: CV = { ...currentCV, experience };
    await updateCV(currentCV.id, updatedCV);
  };

  const updateEducation = async (education: CV['education']): Promise<void> => {
    if (!currentCV) return;
    const updatedCV: CV = { ...currentCV, education };
    await updateCV(currentCV.id, updatedCV);
  };

  const updateSkills = async (skills: CV['skills']): Promise<void> => {
    if (!currentCV) return;
    const updatedCV: CV = { ...currentCV, skills };
    await updateCV(currentCV.id, updatedCV);
  };

  const updateLanguages = async (languages: CV['languages']): Promise<void> => {
    if (!currentCV) return;
    const updatedCV: CV = { ...currentCV, languages };
    await updateCV(currentCV.id, updatedCV);
  };

  // Step Navigation (use enum members)
  const orderedSteps: CVStep[] = [
    CVStep.TEMPLATE_SELECTION,
    CVStep.PERSONAL_INFO,
    CVStep.EXPERIENCE,
    CVStep.EDUCATION,
    CVStep.SKILLS,
    CVStep.LANGUAGES,
    CVStep.REVIEW,
  ];

  const nextStep = (): void => {
    const i = orderedSteps.indexOf(currentStep);
    if (i >= 0 && i < orderedSteps.length - 1) setCurrentStep(orderedSteps[i + 1]);
  };

  const previousStep = (): void => {
    const i = orderedSteps.indexOf(currentStep);
    if (i > 0) setCurrentStep(orderedSteps[i - 1]);
  };

  const goToStep = (step: CVStep): void => setCurrentStep(step);

  // Export Operations
  const exportCV = async (...args: any[]): Promise<ExportResult> => {
    try {
      setError(null);

      let cvId: string | undefined;
      let format: ExportFormat | undefined;
      let options: Record<string, any> | undefined;

      // Supported call patterns:
      // 1) exportCV(cvId, format, options?)
      // 2) exportCV(formatOnly) // uses current CV id
      if (args.length >= 2) {
        cvId = args[0];
        format = args[1];
        options = args[2];
      } else if (args.length === 1) {
        format = args[0];
        cvId = currentCV?.id;
      }

      if (!cvId) throw new Error('No CV selected for export');
      if (!format) throw new Error('No export format provided');

      const normalizedFormat: 'pdf' | 'docx' | 'json' =
        format === 'word' ? 'docx' : (format as 'pdf' | 'docx' | 'json');

      setLoading({ isLoading: true, operation: `Exporting CV as ${normalizedFormat.toUpperCase()}...` });

      // Prefer single-argument call to avoid TS signature mismatches
      const response: any = await (cvBuilderApi as any).export({
        id: cvId,
        format: normalizedFormat,
        options: options ?? {},
      });

      const url: string =
        response?.data?.download_url ??
        response?.data?.url ??
        response?.url ??
        '';

      if (response?.success && url) {
        return { success: true, url, message: 'Export successful' };
      }

      return { success: false, message: response?.error || 'Failed to export CV' };
    } catch (err: any) {
      handleError(err, 'export CV');
      return { success: false, message: err?.message || 'Export failed' };
    } finally {
      setLoading({ isLoading: false });
    }
  };

  // Analytics
  const getAnalytics = async (cvId?: string): Promise<CVAnalyticsType> => {
    try {
      const targetCvId = cvId || currentCV?.id;
      if (!targetCvId) throw new Error('No CV selected for analytics');

      const response: any = await (cvBuilderApi as any).getAnalytics(targetCvId);
      if (response?.success && response?.data) {
        return response.data as CVAnalyticsType;
      }
      throw new Error(response?.error || 'Failed to get analytics');
    } catch (err) {
      handleError(err, 'get analytics');
      return {} as CVAnalyticsType;
    }
  };

  const refreshAnalytics = async (cvId?: string): Promise<void> => {
    const data = await getAnalytics(cvId);
    setAnalytics(data || null);
  };

  // Validation
  const validateSection = (section: string, data: unknown): boolean => {
    const result = validateCVSection(section, data);
    return result.isValid;
  };

  // Utility Functions
  const getCompletionScore = (): number => completionScore;
  const getSuggestions = (): string[] => (currentCV ? generateCVSuggestions(currentCV) : []);

  // Context Value
  const contextValue: CVContextType = {
    // CV Data
    currentCV,
    cvData: currentCV, // alias
    cvList,
    templates,

    // Loading and Error States
    loading,
    error,

    // Current Step
    currentStep,

    // CV Operations
    createCV,
    updateCV,
    deleteCV,
    duplicateCV,
    loadCV,
    saveCV,

    // Template Operations
    getTemplates,
    selectTemplate,

    // Section Updates
    updatePersonalInfo,
    updateExperience,
    updateEducation,
    updateSkills,
    updateLanguages,

    // Step Navigation
    nextStep,
    previousStep,
    goToStep,

    // Export Operations
    exportCV,

    // Analytics (exposed)
    analytics,
    completionScore,
    refreshAnalytics,
    getAnalytics,

    // Validation
    validateSection,

    // UAE Data Access
    uaeEmirates: UAE_EMIRATES,
    uaeCities: UAE_CITIES,
    validateUAEPhone,
    formatUAEPhone,
    validateEmiratesId,
    formatEmiratesId,

    // Utility Functions
    getCompletionScore,
    getSuggestions,
  };

  return <CVContext.Provider value={contextValue}>{children}</CVContext.Provider>;
};

export const useCV = (): CVContextType => {
  const context = useContext(CVContext);
  if (context === undefined) {
    throw new Error('useCV must be used within a CVProvider');
  }
  return context;
};

export default CVContext;
