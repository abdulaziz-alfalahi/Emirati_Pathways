
import os

header = r'''import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cvStorageService, type SavedCV, type CVData as StorageCVData } from '@/services/cvStorageService';
import {
  FileText, Upload, CheckCircle, Loader2, Users, Zap, TrendingUp, Shield, ArrowRight,
  Edit3, Save, Eye, MapPin, Phone, Mail, User, Briefcase, GraduationCap, Award, Target, X
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import TemplatePreview from '@/components/cv-templates/TemplatePreview';
import EnhancedCVExportDialog from '@/components/cv-builder/EnhancedCVExportDialog';

interface CVData {
  personal_info?: { name?: string; email?: string; phone?: string; location?: string; nationality?: string; };
  professional_summary?: string;
  skills?: { technical?: string[]; soft?: string[]; };
  experience?: Array<{ job_title?: string; company?: string; location?: string; start_date?: string; end_date?: string; responsibilities?: string; }>;
  education?: Array<{ degree?: string; institution?: string; graduation_year?: string; field?: string; }>;
  job_matches?: Array<{ title?: string; match_score?: number; alignment?: string; salary_range?: string; }>;
  uae_context?: { government_sector_fit?: number; private_sector_fit?: number; };
}

interface CVFormData {
  personalInfo: { firstName: string; lastName: string; email: string; phone: string; location: string; nationality: string; };
  professionalSummary: string;
  technicalSkills: string[];
  softSkills: string[];
  experience: Array<{ jobTitle: string; company: string; location: string; startDate: string; endDate: string; responsibilities: string; }>;
  education: Array<{ degree: string; institution: string; graduationYear: string; field: string; }>;
}

const AutoFillCVBuilder: React.FC = () => {
  const { t, i18n } = useTranslation('cv-builder');
  const { language, isRTL } = useLanguage();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>((i18n.language as 'en' | 'ar') || 'en');
  const [currentStep, setCurrentStep] = useState<'upload' | 'template' | 'form' | 'preview'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [formData, setFormData] = useState<CVFormData>({
    personalInfo: { firstName: '', lastName: '', email: '', phone: '', location: '', nationality: 'UAE' },
    professionalSummary: '',
    technicalSkills: [],
    softSkills: [],
    experience: [],
    education: []
  });

  // Function to ensure we have i18n language synced
  useEffect(() => {
     if (i18n.language && i18n.language !== currentLanguage) {
         setCurrentLanguage(i18n.language as 'en' | 'ar');
     }
  }, [i18n.language]);

'''

file_path = 'src/pages/cv-builder/AutoFillCVBuilder.tsx'
try:
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # Find anchor
    anchor = "// --- UAE-specific validation helpers ---"
    if anchor in content:
        idx = content.find(anchor)
        # Get the rest of the file from anchor
        rest = content[idx:]
        
        # Combine
        full_content = header + rest
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(full_content)
        print("Successfully restored AutoFillCVBuilder.tsx")
    else:
        print(f"Anchor '{anchor}' not found. Current file prefix: {content[:200]}")
except Exception as e:
    print(f"Error: {e}")
