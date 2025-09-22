
// Advanced Resume Builder Types for UAE Job Market

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'corporate' | 'creative' | 'technical' | 'government' | 'academic' | 'executive';
  preview: string;
  sections: ResumeSection[];
  colors: TemplateColors;
  layout: TemplateLayout;
}

export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface TemplateLayout {
  columns: number;
  headerStyle: 'centered' | 'left' | 'split';
  sectionSpacing: 'compact' | 'normal' | 'spacious';
  typography: 'serif' | 'sans-serif' | 'modern';
}

export interface ResumeSection {
  id: string;
  name: string;
  type: SectionType;
  required: boolean;
  order: number;
  customizable: boolean;
}

export type SectionType = 
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'projects'
  | 'achievements'
  | 'references'
  | 'volunteer'
  | 'publications';

export interface ATSOptimization {
  score: number;
  recommendations: string[];
  keywords: KeywordAnalysis[];
  formatting: FormattingCheck[];
}

export interface KeywordAnalysis {
  keyword: string;
  frequency: number;
  relevance: number;
  suggestion: string;
}

export interface FormattingCheck {
  aspect: string;
  status: 'passed' | 'warning' | 'failed';
  message: string;
  fix?: string;
}

export interface SmartSuggestion {
  type: 'skill' | 'achievement' | 'keyword' | 'format';
  content: string;
  reason: string;
  confidence: number;
  source: 'market_data' | 'ai_analysis' | 'best_practice';
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html';
  quality: 'standard' | 'high' | 'print';
  watermark?: boolean;
  password?: string;
  metadata?: ExportMetadata;
}

export interface ExportMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
}

export interface ResumeAnalytics {
  completionScore: number;
  atsCompatibility: number;
  readabilityScore: number;
  keywordDensity: number;
  sectionBalance: SectionAnalysis[];
  recommendations: AnalyticsRecommendation[];
}

export interface SectionAnalysis {
  section: string;
  wordCount: number;
  completeness: number;
  quality: number;
}

export interface AnalyticsRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  action: string;
}
