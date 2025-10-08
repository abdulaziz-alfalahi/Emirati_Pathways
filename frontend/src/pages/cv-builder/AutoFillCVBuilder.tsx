import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cvStorageService, type SavedCV, type CVData as StorageCVData } from '@/services/cvStorageService';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Loader2,
  Users,
  Zap,
  TrendingUp,
  Shield,
  ArrowRight,
  Edit3,
  Save,
  Eye,
  MapPin,
  Phone,
  Mail,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  X
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import TemplatePreview from '@/components/cv-templates/TemplatePreview';

interface CVData {
  personal_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    nationality?: string;
  };
  professional_summary?: string;
  skills?: {
    technical?: string[];
    soft?: string[];
  };
  experience?: Array<{
    job_title?: string;
    company?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    responsibilities?: string;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    graduation_year?: string;
    field?: string;
  }>;
  job_matches?: Array<{
    title?: string;
    match_score?: number;
    alignment?: string;
    salary_range?: string;
  }>;
  uae_context?: {
    government_sector_fit?: number;
    private_sector_fit?: number;
  };
}

interface CVFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    nationality: string;
  };
  professionalSummary: string;
  technicalSkills: string[];
  softSkills: string[];
  experience: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
    field: string;
  }>;
}

const AutoFillCVBuilder: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');
  const [currentStep, setCurrentStep] = useState<'upload' | 'template' | 'form' | 'preview'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [formData, setFormData] = useState<CVFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      nationality: 'UAE'
    },
    professionalSummary: '',
    technicalSkills: [],
    softSkills: [],
    experience: [],
    education: []
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('professional');
  const [cvScore, setCvScore] = useState<number>(0);
  const [atsScore, setAtsScore] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // CV Storage states
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [currentCVId, setCurrentCVId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [cvTitle, setCvTitle] = useState('My CV');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Autosave state/refs
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const lastSavedHashRef = useRef<string>('');
  const autosaveTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const skipAutosaveRef = useRef<boolean>(false);

  const buildSavePayload = () => ({
    cvData: formData,
    title: cvTitle,
    templateId: selectedTemplate,
    cvScore,
    atsScore
  });

  const computePayloadHash = () => JSON.stringify(buildSavePayload());

  const isFormMeaningful = () => {
    const pi = formData.personalInfo;
    if ((pi.firstName && pi.firstName.trim()) || (pi.lastName && pi.lastName.trim())) return true;
    if (formData.professionalSummary && formData.professionalSummary.trim().length > 0) return true;
    if (formData.technicalSkills.length > 0 || formData.softSkills.length > 0) return true;
    if (formData.experience.length > 0 || formData.education.length > 0) return true;
    return false;
  };

  const handleLanguageToggle = () => {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    setCurrentLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const calculateCVScore = (cvData: CVFormData): number => {
    let score = 0;
    const maxScore = 100;
    
    // Personal Information (20 points)
    const personalInfo = cvData.personalInfo;
    if (personalInfo.firstName && personalInfo.lastName) score += 5;
    if (personalInfo.email && personalInfo.email.includes('@')) score += 5;
    if (personalInfo.phone) score += 5;
    if (personalInfo.location) score += 5;
    
    // Professional Summary (20 points)
    if (cvData.professionalSummary) {
      if (cvData.professionalSummary.length > 50) score += 10;
      if (cvData.professionalSummary.length > 150) score += 10;
    }
    
    // Skills (20 points)
    if (cvData.technicalSkills.length >= 3) score += 10;
    if (cvData.technicalSkills.length >= 6) score += 5;
    if (cvData.softSkills.length >= 3) score += 5;
    
    // Experience (25 points)
    if (cvData.experience.length >= 1) score += 10;
    if (cvData.experience.length >= 3) score += 10;
    if (cvData.experience.some(exp => exp.responsibilities && exp.responsibilities.length > 50)) score += 5;
    
    // Education (15 points)
    if (cvData.education.length >= 1) score += 10;
    if (cvData.education.some(edu => edu.field)) score += 5;
    
    return Math.min(score, maxScore);
  };

  const calculateATSScore = (cvData: CVFormData): number => {
    let score = 0;
    
    // UAE Keywords
    const uaeKeywords = [
      'UAE', 'Dubai', 'Abu Dhabi', 'Emirates', 'Arabic', 'Emirati', 'GCC',
      'D33', 'Talent33', 'Vision 2071', 'Digital Transformation', 'Innovation',
      'Leadership', 'Strategy', 'Management', 'Government', 'Private Sector'
    ];
    
    // Check for UAE keywords in summary and experience
    const allText = [
      cvData.professionalSummary,
      ...cvData.experience.map(exp => `${exp.jobTitle} ${exp.company} ${exp.responsibilities}`),
      ...cvData.technicalSkills,
      ...cvData.softSkills
    ].join(' ').toLowerCase();
    
    const foundKeywords = uaeKeywords.filter(keyword => 
      allText.includes(keyword.toLowerCase())
    );
    
    // Score based on keyword presence (40 points max)
    score += Math.min(foundKeywords.length * 3, 40);
    
    // Technical skills relevance (30 points)
    const techKeywords = ['digital', 'technology', 'data', 'analytics', 'ai', 'cloud', 'mobile', 'web'];
    const techMatches = cvData.technicalSkills.filter(skill => 
      techKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    );
    score += Math.min(techMatches.length * 5, 30);
    
    // Experience quality (30 points)
    const hasQuantifiableResults = cvData.experience.some(exp => 
      exp.responsibilities && /\d+/.test(exp.responsibilities) // Contains numbers
    );
    if (hasQuantifiableResults) score += 15;
    
    const hasLeadershipTerms = allText.includes('led') || allText.includes('managed') || allText.includes('directed');
    if (hasLeadershipTerms) score += 15;
    
    return Math.min(score, 100);
  };

  const generateSuggestions = (cvData: CVFormData, cvScore: number, atsScore: number): string[] => {
    const suggestions: string[] = [];
    
    // CV Completeness suggestions
    if (cvScore < 80) {
      if (!cvData.professionalSummary || cvData.professionalSummary.length < 150) {
        suggestions.push('Expand your professional summary to 150+ words highlighting your UAE experience');
      }
      if (cvData.technicalSkills.length < 6) {
        suggestions.push('Add more technical skills relevant to UAE job market (AI, Digital Transformation, Data Analytics)');
      }
      if (cvData.experience.length < 3) {
        suggestions.push('Include more work experience entries to demonstrate career progression');
      }
    }
    
    // ATS Optimization suggestions
    if (atsScore < 70) {
      suggestions.push('Include more UAE-specific keywords: D33, Talent33, Digital Transformation, Innovation');
      suggestions.push('Add quantifiable achievements with numbers (budget managed, team size, % improvements)');
      suggestions.push('Highlight Arabic language proficiency and cultural understanding');
      suggestions.push('Emphasize government sector experience or private sector leadership roles');
    }
    
    // UAE Market specific suggestions
    const allText = [cvData.professionalSummary, ...cvData.experience.map(exp => exp.responsibilities)].join(' ').toLowerCase();
    if (!allText.includes('arabic')) {
      suggestions.push('Mention Arabic language skills to align with UAE National requirements');
    }
    if (!allText.includes('emirati')) {
      suggestions.push('Highlight experience working with Emirati teams or on Emiratization initiatives');
    }
    
    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  };

  const updateScores = (cvData: CVFormData) => {
    const newCvScore = calculateCVScore(cvData);
    const newAtsScore = calculateATSScore(cvData);
    const newSuggestions = generateSuggestions(cvData, newCvScore, newAtsScore);
    
    setCvScore(newCvScore);
    setAtsScore(newAtsScore);
    setSuggestions(newSuggestions);
    
    console.log(`📊 CV Score: ${newCvScore}%, ATS Score: ${newAtsScore}%`);
  };

  // CV Storage Functions
  const loadSavedCVs = async () => {
    setIsLoading(true);
    try {
      const result = await cvStorageService.listCVs();
      if (result.success && result.data) {
        setSavedCVs(result.data);
      } else {
        console.error('Failed to load CVs:', result.message);
      }
    } catch (error) {
      console.error('Error loading CVs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCV = async () => {
    if (!cvTitle.trim()) {
      alert('Please enter a title for your CV');
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        cvData: formData,
        title: cvTitle,
        templateId: selectedTemplate,
        cvScore,
        atsScore
      };

      let result;
      if (currentCVId) {
        // Update existing CV
        result = await cvStorageService.updateCV(currentCVId, {
          ...saveData,
          changeSummary: 'CV updated from builder'
        });
      } else {
        // Save new CV
        result = await cvStorageService.saveCV(saveData);
        if (result.success && result.cv_id) {
          setCurrentCVId(result.cv_id);
        }
      }

      if (result.success) {
        alert(result.message);
        setShowSaveDialog(false);
        loadSavedCVs(); // Refresh the list
        lastSavedHashRef.current = computePayloadHash();
        setLastSavedAt(new Date().toISOString());
        setAutosaveStatus('saved');
      } else {
        alert(`Failed to save CV: ${result.message}`);
      }
    } catch (error) {
      console.error('Save CV error:', error);
      alert('Failed to save CV due to system error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadCV = async (cvId: string) => {
    skipAutosaveRef.current = true;
    setIsLoading(true);
    try {
      const result = await cvStorageService.getCV(cvId);
      if (result.success && result.data) {
        const cvData = result.data;
        
        // Map database format to form format
        const loadedFormData = {
          personalInfo: {
            firstName: cvData.personal_info?.firstName || '',
            lastName: cvData.personal_info?.lastName || '',
            email: cvData.personal_info?.email || '',
            phone: cvData.personal_info?.phone || '',
            location: cvData.personal_info?.location || '',
            nationality: cvData.personal_info?.nationality || 'UAE'
          },
          professionalSummary: cvData.professional_summary || '',
          technicalSkills: cvData.technical_skills || [],
          softSkills: cvData.soft_skills || [],
          experience: cvData.work_experience || [],
          education: cvData.education || []
        };

        setFormData(loadedFormData);
        setSelectedTemplate(cvData.template_name || 'professional');
        setCvTitle(cvData.title);
        setCurrentCVId(cvId);
        setCvScore(cvData.cv_score || 0);
        setAtsScore(cvData.ats_score || 0);
        
        // Move to form step
        setCurrentStep('form');
        setShowLoadDialog(false);
        setTimeout(() => {
          lastSavedHashRef.current = computePayloadHash();
          setLastSavedAt(new Date().toISOString());
          setAutosaveStatus('saved');
          skipAutosaveRef.current = false;
        }, 0);
        
        console.log('✅ CV loaded successfully');
      } else {
        alert(`Failed to load CV: ${result.message}`);
      }
    } catch (error) {
      console.error('Load CV error:', error);
      alert('Failed to load CV due to system error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCV = async (cvId: string) => {
    if (!confirm('Are you sure you want to delete this CV? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await cvStorageService.deleteCV(cvId);
      if (result.success) {
        alert(result.message);
        loadSavedCVs(); // Refresh the list
        if (currentCVId === cvId) {
          setCurrentCVId(null);
        }
      } else {
        alert(`Failed to delete CV: ${result.message}`);
      }
    } catch (error) {
      console.error('Delete CV error:', error);
      alert('Failed to delete CV due to system error');
    }
  };

  const autoFillForm = (analysisData: CVData) => {
    skipAutosaveRef.current = true;
    console.log('🔄 Auto-filling form with analysis data:', analysisData);
    
    const nameParts = analysisData.personal_info?.name?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const newFormData = {
      personalInfo: {
        firstName,
        lastName,
        email: analysisData.personal_info?.email || '',
        phone: analysisData.personal_info?.phone || '',
        location: analysisData.personal_info?.location || '',
        nationality: analysisData.personal_info?.nationality || 'UAE'
      },
      professionalSummary: analysisData.professional_summary || '',
      technicalSkills: analysisData.skills?.technical || [],
      softSkills: analysisData.skills?.soft || [],
      experience: analysisData.experience?.map(exp => ({
        jobTitle: exp.job_title || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.start_date || '',
        endDate: exp.end_date || '',
        responsibilities: exp.responsibilities || ''
      })) || [],
      education: analysisData.education?.map(edu => ({
        degree: edu.degree || '',
        institution: edu.institution || '',
        graduationYear: edu.graduation_year || '',
        field: edu.field || ''
      })) || []
    };

    console.log('📝 Setting form data:', newFormData);
    setFormData(newFormData);
    
    // Calculate scores after auto-fill
    setTimeout(() => {
      updateScores(newFormData);
      skipAutosaveRef.current = false;
    }, 100);
    
    console.log('✅ Form auto-filled with extracted CV data');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // Create PDF using jsPDF with text-based approach for better multi-page support
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      
      // Get template colors
      const templateColors = getTemplateColors(selectedTemplate);
      
      // Helper function to add text with automatic page breaks
      const addText = (text: string, fontSize: number, style: 'normal' | 'bold' = 'normal', color: string = '#000000', extraSpacing: number = 2) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', style);
        pdf.setTextColor(color);
        
        // Split text into lines that fit the page width
        const lines = pdf.splitTextToSize(text, contentWidth);
        
        for (const line of lines) {
          // Check if we need a new page
          if (yPosition > pageHeight - margin - 15) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.35; // Tighter line height
        }
        
        yPosition += extraSpacing; // Configurable spacing after text block
      };
      
      // Helper function to add section header
      const addSectionHeader = (title: string) => {
        yPosition += 6; // Reduced space before section
        pdf.setDrawColor(templateColors.primary);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
        
        addText(title, 14, 'bold', templateColors.primary, 3); // Smaller font, less spacing
      };
      
      // Header - Name
      const name = `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`;
      addText(name, 22, 'bold', templateColors.primary, 3); // Smaller title, less spacing
      
      // Contact Information
      const contactInfo = [
        formData.personalInfo.email && `Email: ${formData.personalInfo.email}`,
        formData.personalInfo.phone && `Phone: ${formData.personalInfo.phone}`,
        formData.personalInfo.location && `Location: ${formData.personalInfo.location}`
      ].filter(Boolean).join(' | ');
      
      if (contactInfo) {
        addText(contactInfo, 11, 'normal', templateColors.secondary, 1); // Smaller font, minimal spacing
      }
      
      // Professional Summary
      if (formData.professionalSummary) {
        addSectionHeader('PROFESSIONAL SUMMARY');
        addText(formData.professionalSummary, 10, 'normal', '#000000', 1); // Smaller font, minimal spacing
      }
      
      // Technical Skills
      if (formData.technicalSkills.length > 0) {
        addSectionHeader('TECHNICAL SKILLS');
        const skillsText = formData.technicalSkills.join(' • ');
        addText(skillsText, 10, 'normal', '#000000', 1);
      }
      
      // Soft Skills
      if (formData.softSkills.length > 0) {
        addSectionHeader('SOFT SKILLS');
        const skillsText = formData.softSkills.join(' • ');
        addText(skillsText, 10, 'normal', '#000000', 1);
      }
      
      // Work Experience
      if (formData.experience.length > 0) {
        addSectionHeader('WORK EXPERIENCE');
        
        formData.experience.forEach((exp, index) => {
          // Job title
          addText(exp.jobTitle, 12, 'bold', templateColors.primary, 1);
          
          // Company and date/location on same line to save space
          const companyDate = `${exp.company} | ${exp.startDate} - ${exp.endDate} • ${exp.location}`;
          addText(companyDate, 10, 'normal', templateColors.secondary, 1);
          
          // Responsibilities - more compact
          if (exp.responsibilities) {
            addText(exp.responsibilities, 9, 'normal', '#000000', 1); // Smaller font
          }
          
          yPosition += 3; // Minimal space between positions
        });
      }
      
      // Education
      if (formData.education.length > 0) {
        addSectionHeader('EDUCATION');
        
        formData.education.forEach((edu, index) => {
          // Degree and institution on same line
          const degreeInstitution = `${edu.degree} - ${edu.institution}`;
          addText(degreeInstitution, 11, 'bold', templateColors.primary, 1);
          
          // Field and year - more compact
          const fieldYear = `${edu.field} • ${edu.graduationYear}`;
          addText(fieldYear, 9, 'normal', templateColors.accent, 1);
          
          yPosition += 2; // Minimal space between education entries
        });
      }
      
      // Generate filename
      const templateName = selectedTemplate.replace('-', '_');
      const filename = `CV_${formData.personalInfo.firstName}_${formData.personalInfo.lastName}_${templateName}.pdf`;
      
      // Download PDF
      pdf.save(filename);
      
      console.log(`✅ Multi-page CV PDF downloaded: ${filename}`);

    } catch (error) {
      console.error('CV export error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Restore last edited CV on mount
  useEffect(() => {
    const lastId = localStorage.getItem('lastCvId');
    if (lastId) {
      handleLoadCV(lastId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave effect
  useEffect(() => {
    if (skipAutosaveRef.current) return;
    if (!isFormMeaningful()) return;

    const currentHash = computePayloadHash();
    if (currentHash === lastSavedHashRef.current) return;

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        const payload = buildSavePayload();
        if (currentCVId) {
          const res = await cvStorageService.updateCV(currentCVId, { ...payload, changeSummary: 'Autosave' });
          if (!res.success) throw new Error(res.message);
        } else {
          const res = await cvStorageService.saveCV(payload);
          if (!res.success || !res.cv_id) throw new Error(res.message || 'Autosave failed');
          setCurrentCVId(res.cv_id);
          localStorage.setItem('lastCvId', res.cv_id);
        }
        lastSavedHashRef.current = currentHash;
        setLastSavedAt(new Date().toISOString());
        setAutosaveStatus('saved');
        retryCountRef.current = 0;
      } catch (e) {
        console.error('Autosave error:', e);
        setAutosaveStatus('error');
        if (retryCountRef.current < 3) {
          retryCountRef.current += 1;
          if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
          retryTimerRef.current = window.setTimeout(() => {
            lastSavedHashRef.current = '';
            setAutosaveStatus('idle');
          }, 5000);
        }
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, selectedTemplate, cvTitle, cvScore, atsScore, currentCVId]);

  // Warn on unload if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const currentHash = computePayloadHash();
      if (currentHash !== lastSavedHashRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, selectedTemplate, cvTitle, cvScore, atsScore]);

  const getTemplateColors = (template: string) => {
    const colors = {
      'government-executive': {
        primary: '#1e40af',    // Blue
        secondary: '#374151',  // Gray
        accent: '#059669'      // Green
      },
      'tech-innovator': {
        primary: '#7c3aed',    // Purple
        secondary: '#0891b2',  // Cyan
        accent: '#6b7280'      // Gray
      },
      'business-leader': {
        primary: '#059669',    // Green
        secondary: '#dc2626',  // Red
        accent: '#6b7280'      // Gray
      }
    };
    
    return colors[template as keyof typeof colors] || colors['government-executive'];
  };

  const generatePrintableHTML = (cvData: any, template: string) => {
    const name = `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`;
    const contact = [
      cvData.personalInfo.email && `Email: ${cvData.personalInfo.email}`,
      cvData.personalInfo.phone && `Phone: ${cvData.personalInfo.phone}`,
      cvData.personalInfo.location && `Location: ${cvData.personalInfo.location}`
    ].filter(Boolean).join(' | ');

    if (template === 'government-executive') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>CV - ${name}</title>
          <style>
            @media print { @page { margin: 0.5in; } }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #374151; line-height: 1.4; }
            .header { text-align: center; border-bottom: 4px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
            .name { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
            .contact { color: #6b7280; font-size: 14px; }
            .section-title { font-size: 18px; font-weight: bold; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin: 25px 0 15px 0; }
            .job-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .company { font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 3px; }
            .date-location { font-size: 12px; color: #059669; margin-bottom: 8px; }
            .responsibilities { font-size: 11px; line-height: 1.4; margin-bottom: 15px; }
            .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
            .skill-tag { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 11px; }
            .soft-skill-tag { background: #dcfce7; color: #059669; padding: 4px 12px; border-radius: 20px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${name}</div>
            <div class="contact">${contact}</div>
          </div>
          
          ${cvData.professionalSummary ? `
          <div class="section-title">PROFESSIONAL SUMMARY</div>
          <p>${cvData.professionalSummary}</p>
          ` : ''}
          
          ${cvData.technicalSkills.length ? `
          <div class="section-title">TECHNICAL SKILLS</div>
          <div class="skills">
            ${cvData.technicalSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
          ` : ''}
          
          ${cvData.softSkills.length ? `
          <div class="section-title">SOFT SKILLS</div>
          <div class="skills">
            ${cvData.softSkills.map(skill => `<span class="soft-skill-tag">${skill}</span>`).join('')}
          </div>
          ` : ''}
          
          ${cvData.experience.length ? `
          <div class="section-title">WORK EXPERIENCE</div>
          ${cvData.experience.map(exp => `
            <div style="margin-bottom: 20px;">
              <div class="job-title">${exp.jobTitle}</div>
              <div class="company">${exp.company}</div>
              <div class="date-location">${exp.startDate} - ${exp.endDate} • ${exp.location}</div>
              <div class="responsibilities">${exp.responsibilities}</div>
            </div>
          `).join('')}
          ` : ''}
          
          ${cvData.education.length ? `
          <div class="section-title">EDUCATION</div>
          ${cvData.education.map(edu => `
            <div style="margin-bottom: 15px;">
              <div style="font-size: 14px; font-weight: bold; color: #1e40af;">${edu.degree}</div>
              <div style="font-size: 12px; font-weight: bold; color: #374151;">${edu.institution}</div>
              <div style="font-size: 11px; color: #059669;">${edu.field} • Graduated: ${edu.graduationYear}</div>
            </div>
          `).join('')}
          ` : ''}
        </body>
        </html>
      `;
    }
    
    if (template === 'tech-innovator') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>CV - ${name}</title>
          <style>
            @media print { @page { margin: 0.5in; } }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #1f2937; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; }
            .name { font-size: 26px; font-weight: bold; margin-bottom: 10px; }
            .contact { font-size: 14px; opacity: 0.9; }
            .content { padding: 30px; }
            .section-title { font-size: 16px; font-weight: bold; color: #7c3aed; margin: 25px 0 15px 0; }
            .job-title { font-size: 15px; font-weight: bold; color: #7c3aed; margin-bottom: 5px; }
            .company { font-size: 13px; font-weight: bold; color: #0891b2; margin-bottom: 3px; }
            .date-location { font-size: 11px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 12px; display: inline-block; margin-bottom: 8px; }
            .responsibilities { font-size: 11px; line-height: 1.5; margin-bottom: 15px; }
            .skills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; }
            .skill-tag { background: #ede9fe; color: #7c3aed; padding: 6px 12px; border-radius: 8px; font-size: 10px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${name}</div>
            <div class="contact">${contact}</div>
          </div>
          
          <div class="content">
            ${cvData.professionalSummary ? `
            <div class="section-title">▶ PROFESSIONAL SUMMARY</div>
            <p>${cvData.professionalSummary}</p>
            ` : ''}
            
            ${cvData.technicalSkills.length ? `
            <div class="section-title">▶ TECHNICAL EXPERTISE</div>
            <div class="skills">
              ${cvData.technicalSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            ` : ''}
            
            ${cvData.experience.length ? `
            <div class="section-title">▶ EXPERIENCE</div>
            ${cvData.experience.map(exp => `
              <div style="margin-bottom: 20px; border-left: 4px solid #7c3aed; padding-left: 15px;">
                <div class="job-title">${exp.jobTitle}</div>
                <div class="company">${exp.company}</div>
                <div class="date-location">${exp.startDate} - ${exp.endDate} • ${exp.location}</div>
                <div class="responsibilities">${exp.responsibilities}</div>
              </div>
            `).join('')}
            ` : ''}
            
            ${cvData.education.length ? `
            <div class="section-title">▶ EDUCATION</div>
            ${cvData.education.map(edu => `
              <div style="margin-bottom: 15px; border-left: 4px solid #0891b2; padding-left: 15px;">
                <div style="font-size: 14px; font-weight: bold; color: #7c3aed;">${edu.degree}</div>
                <div style="font-size: 12px; color: #0891b2;">${edu.institution}</div>
                <div style="font-size: 11px; color: #6b7280;">${edu.field} • ${edu.graduationYear}</div>
              </div>
            `).join('')}
            ` : ''}
          </div>
        </body>
        </html>
      `;
    }
    
    if (template === 'business-leader') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>CV - ${name}</title>
          <style>
            @media print { @page { margin: 0.5in; } }
            body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #374151; }
            .header { border-bottom: 6px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            .name { font-size: 26px; font-weight: bold; color: #059669; margin-bottom: 10px; }
            .contact { color: #6b7280; font-size: 14px; }
            .section-title { font-size: 16px; font-weight: bold; color: white; background: #059669; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 4px; }
            .job-title { font-size: 15px; font-weight: bold; color: #059669; margin-bottom: 5px; }
            .company { font-size: 13px; font-weight: bold; color: #dc2626; margin-bottom: 3px; }
            .date-location { font-size: 11px; color: #6b7280; margin-bottom: 8px; }
            .responsibilities { font-size: 11px; line-height: 1.4; margin-bottom: 15px; }
            .competency-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-bottom: 20px; }
            .competency-item { font-size: 11px; margin-bottom: 4px; }
            .competency-item::before { content: '● '; color: #059669; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${name}</div>
            <div class="contact">${contact}</div>
          </div>
          
          ${cvData.professionalSummary ? `
          <div class="section-title">EXECUTIVE SUMMARY</div>
          <p>${cvData.professionalSummary}</p>
          ` : ''}
          
          ${(cvData.technicalSkills.length || cvData.softSkills.length) ? `
          <div class="section-title">CORE COMPETENCIES</div>
          <div class="competency-grid">
            ${[...cvData.technicalSkills, ...cvData.softSkills].slice(0, 12).map(skill => `
              <div class="competency-item">${skill}</div>
            `).join('')}
          </div>
          ` : ''}
          
          ${cvData.experience.length ? `
          <div class="section-title">PROFESSIONAL EXPERIENCE</div>
          ${cvData.experience.map(exp => `
            <div style="margin-bottom: 20px; border-left: 3px solid #059669; padding-left: 15px;">
              <div class="job-title">${exp.jobTitle}</div>
              <div class="company">${exp.company}</div>
              <div class="date-location">${exp.startDate} - ${exp.endDate} • ${exp.location}</div>
              <div class="responsibilities">${exp.responsibilities}</div>
            </div>
          `).join('')}
          ` : ''}
          
          ${cvData.education.length ? `
          <div class="section-title">EDUCATION & QUALIFICATIONS</div>
          ${cvData.education.map(edu => `
            <div style="margin-bottom: 15px; border-left: 3px solid #dc2626; padding-left: 15px;">
              <div style="font-size: 14px; font-weight: bold; color: #059669;">${edu.degree}</div>
              <div style="font-size: 12px; font-weight: bold; color: #dc2626;">${edu.institution}</div>
              <div style="font-size: 11px; color: #6b7280;">${edu.field} • ${edu.graduationYear}</div>
            </div>
          `).join('')}
          ` : ''}
        </body>
        </html>
      `;
    }
    
    // Default professional template
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CV - ${name}</title>
        <style>
          @media print { @page { margin: 0.5in; } }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #374151; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
          .section-title { font-size: 16px; font-weight: bold; color: #1e40af; margin: 20px 0 10px 0; }
          .job-title { font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 3px; }
          .company { font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${name}</div>
          <div>${contact}</div>
        </div>
        <div class="section-title">Professional CV</div>
        <p>Template: ${template}</p>
      </body>
      </html>
    `;
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
    const LEGACY_PATH = (import.meta as any).env?.VITE_CV_UPLOAD_PATH || import.meta.env.VITE_CV_UPLOAD_PATH || '/api/candidate/cv/upload';

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const formData = new FormData();
      formData.append('cv_file', file);

      const authHeader = { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` };
      let response: Response | undefined;

      // Try modern endpoint first
      try {
        response = await fetch(`${API_BASE}/api/cv/upload`, {
          method: 'POST',
          headers: authHeader,
          body: formData
        });
      } catch (e) {
        // Swallow network/preflight errors and fall through to legacy
        response = undefined;
      }

      // If modern failed or not OK, try legacy endpoint
      if (!response || !response.ok) {
        setUploadProgress((p) => (p < 60 ? 60 : p));
        try {
          response = await fetch(`${API_BASE}${LEGACY_PATH}`, {
            method: 'POST',
            headers: authHeader,
            body: formData
          });
        } catch (e) {
          response = undefined;
        }
      }

      clearInterval(progressInterval);

      if (!response || !response.ok) {
        throw new Error('Upload failed');
      }

      setUploadProgress(100);

      const result = await response.json();
      console.log('📥 Received CV analysis result:', result);

      const analysisData = result.data?.analysis ?? result.data; // tolerate both shapes
      console.log('📊 Analysis data to auto-fill:', analysisData);

      setCvData(analysisData);

      // Auto-fill the form with extracted data
      setTimeout(() => {
        autoFillForm(analysisData);
        // Move to template selection step after auto-fill
        setCurrentStep('template');
      }, 500); // Small delay to ensure state updates

    } catch (error) {
      console.error('CV upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string, section?: string) => {
    let newFormData;
    
    if (section) {
      newFormData = {
        ...formData,
        [section]: {
          ...formData[section as keyof CVFormData],
          [field]: value
        }
      };
    } else {
      newFormData = {
        ...formData,
        [field]: value
      };
    }
    
    setFormData(newFormData);
    
    // Update scores in real-time
    setTimeout(() => updateScores(newFormData), 100);
  };

  const addSkill = (type: 'technical' | 'soft', skill: string) => {
    if (!skill.trim()) return;
    
    const skillField = type === 'technical' ? 'technicalSkills' : 'softSkills';
    const newFormData = {
      ...formData,
      [skillField]: [...formData[skillField], skill.trim()]
    };
    setFormData(newFormData);
    updateScores(newFormData);
  };

  const removeSkill = (type: 'technical' | 'soft', index: number) => {
    const skillField = type === 'technical' ? 'technicalSkills' : 'softSkills';
    const newFormData = {
      ...formData,
      [skillField]: formData[skillField].filter((_, i) => i !== index)
    };
    setFormData(newFormData);
    updateScores(newFormData);
  };

  const renderUploadStep = () => (
    <div className="space-y-8">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            {isUploading ? (
              <div className="relative">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Upload Your CV
            </h3>
            <p className="text-gray-600 text-lg">
              AI-powered analysis with UAE job market insights
            </p>
          </div>

          {!isUploading && (
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
                  📄 PDF
                </span>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  📝 DOCX
                </span>
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  📋 DOC
                </span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Choose File
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
              />

              <p className="text-sm text-gray-500">
                Maximum file size: 10MB • Powered by Gemini AI
              </p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-blue-600 font-medium">
                Analyzing with AI...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTemplateStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Template
        </h2>
        <p className="text-xl text-gray-600">
          Select a D33/Talent33 aligned template for your CV
        </p>
      </div>

      {/* Template Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            id: 'government-executive',
            name: 'Government Executive',
            description: 'Perfect for UAE government positions and leadership roles',
            color: 'bg-blue-600',
            features: ['D33 Aligned', 'Leadership Focus', 'Government Style']
          },
          {
            id: 'tech-innovator', 
            name: 'Tech Innovator',
            description: 'Designed for technology professionals in UAE digital transformation',
            color: 'bg-purple-600',
            features: ['Talent33 Focus', 'Innovation Highlight', 'Tech Skills Matrix']
          },
          {
            id: 'business-leader',
            name: 'Business Leader', 
            description: 'For business professionals and entrepreneurs in UAE market',
            color: 'bg-green-600',
            features: ['Executive Style', 'Results Driven', 'UAE Market Focus']
          }
        ].map((template) => (
          <div key={template.id} className={`rounded-xl shadow-lg border hover:shadow-xl transition-all duration-300 overflow-hidden ${selectedTemplate === template.id ? 'ring-4 ring-blue-500' : ''}`}>
            <div className="h-64 overflow-hidden">
              <TemplatePreview 
                templateId={template.id} 
                cvData={formData}
                className="w-full h-full"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.features.map((feature, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {feature}
                  </span>
                ))}
              </div>
              <button 
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setCurrentStep('form');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Select Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-center">
        <button
          onClick={() => setCurrentStep('upload')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Upload
        </button>
      </div>
    </div>
  );

  const renderFormStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          CV Builder - Auto-filled with Your Data
        </h2>
        <p className="text-xl text-gray-600">
          Review and customize the auto-filled information from your CV
        </p>
        <div className="mt-4">
          <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            📄 Selected Template: {selectedTemplate.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          <button
            onClick={() => setCurrentStep('template')}
            className="ml-4 text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Change Template
          </button>
        </div>
      </div>

      {/* CV Scoring Widget */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg border p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          CV Performance Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CV Completeness Score */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">CV Completeness</span>
              <span className={`text-lg font-bold ${cvScore >= 80 ? 'text-green-600' : cvScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {cvScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${cvScore >= 80 ? 'bg-green-500' : cvScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${cvScore}%` }}
              ></div>
            </div>
          </div>

          {/* ATS Optimization Score */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">ATS Optimization</span>
              <span className={`text-lg font-bold ${atsScore >= 80 ? 'text-green-600' : atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {atsScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${atsScore >= 80 ? 'bg-green-500' : atsScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${atsScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Improvement Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2 text-purple-600" />
              Improvement Suggestions
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start bg-white rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Personal Information Form */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          Personal Information
          {/* Debug info */}
          <span className="ml-4 text-sm text-gray-500">
            (Auto-filled: {formData.personalInfo.firstName ? 'Yes' : 'No'})
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={formData.personalInfo.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.personalInfo.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.personalInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.personalInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.personalInfo.location}
              onChange={(e) => handleInputChange('location', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your location"
            />
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-green-600" />
          Professional Summary
        </h3>
        <textarea
          value={formData.professionalSummary}
          onChange={(e) => handleInputChange('professionalSummary', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your professional summary"
        />
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-600" />
          Skills
          <span className="ml-4 text-sm text-gray-500">
            (Technical: {formData.technicalSkills.length}, Soft: {formData.softSkills.length})
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Technical Skills */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Technical Skills</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.technicalSkills.map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill('technical', index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add technical skill and press Enter"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSkill('technical', e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Soft Skills */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Soft Skills</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.softSkills.map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill('soft', index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add soft skill and press Enter"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSkill('soft', e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Experience */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-green-600" />
          Work Experience
          <span className="ml-4 text-sm text-gray-500">
            ({formData.experience.length} positions)
          </span>
        </h3>
        <div className="space-y-6">
          {formData.experience.map((exp, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={exp.jobTitle}
                    onChange={(e) => {
                      const newExperience = [...formData.experience];
                      newExperience[index].jobTitle = e.target.value;
                      setFormData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => {
                      const newExperience = [...formData.experience];
                      newExperience[index].company = e.target.value;
                      setFormData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="text"
                    value={exp.startDate}
                    onChange={(e) => {
                      const newExperience = [...formData.experience];
                      newExperience[index].startDate = e.target.value;
                      setFormData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="text"
                    value={exp.endDate}
                    onChange={(e) => {
                      const newExperience = [...formData.experience];
                      newExperience[index].endDate = e.target.value;
                      setFormData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities</label>
                <textarea
                  value={exp.responsibilities}
                  onChange={(e) => {
                    const newExperience = [...formData.experience];
                    newExperience[index].responsibilities = e.target.value;
                    setFormData(prev => ({ ...prev, experience: newExperience }));
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
          Education
          <span className="ml-4 text-sm text-gray-500">
            ({formData.education.length} degrees)
          </span>
        </h3>
        <div className="space-y-6">
          {formData.education.map((edu, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index].degree = e.target.value;
                      setFormData(prev => ({ ...prev, education: newEducation }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index].institution = e.target.value;
                      setFormData(prev => ({ ...prev, education: newEducation }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index].field = e.target.value;
                      setFormData(prev => ({ ...prev, education: newEducation }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <input
                    type="text"
                    value={edu.graduationYear}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index].graduationYear = e.target.value;
                      setFormData(prev => ({ ...prev, education: newEducation }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('upload')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Upload
        </button>
        <button
          onClick={() => setCurrentStep('preview')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
        >
          Preview CV
          <Eye className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          CV Preview - {selectedTemplate.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Template
        </h2>
        <p className="text-xl text-gray-600">
          Preview your professional CV with the selected template styling
        </p>
      </div>

      {/* Full-size CV Preview with Selected Template */}
      <div className="max-w-4xl mx-auto">
        <TemplatePreview 
          templateId={selectedTemplate} 
          cvData={formData}
          className="transform scale-100 w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setCurrentStep('form')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Edit CV
        </button>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Download PDF File
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HybridGovernmentNavFixed 
        onLanguageToggle={handleLanguageToggle}
        currentLanguage={currentLanguage}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI-Powered CV Builder
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Upload your CV, get AI analysis, and create a professional resume tailored for the UAE job market
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🇦🇪 UAE Focused</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🤖 Gemini AI</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🌟 Auto-fill</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Indicator */}
      <section className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Step 1: Upload */}
            <div className={`flex items-center space-x-3 ${currentStep === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {currentStep === 'upload' ? <Upload className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              </div>
              <span className="font-medium">Upload & Analyze</span>
            </div>
            
            <div className={`flex-1 h-px mx-4 ${currentStep !== 'upload' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 2: Template */}
            <div className={`flex items-center space-x-3 ${currentStep === 'template' ? 'text-blue-600' : currentStep === 'form' || currentStep === 'preview' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'template' ? 'bg-blue-600 text-white' : 
                currentStep === 'form' || currentStep === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep === 'form' || currentStep === 'preview' ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <span className="font-medium">Choose Template</span>
            </div>
            
            <div className={`flex-1 h-px mx-4 ${currentStep === 'form' || currentStep === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 3: Form */}
            <div className={`flex items-center space-x-3 ${currentStep === 'form' ? 'text-blue-600' : currentStep === 'preview' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'form' ? 'bg-blue-600 text-white' : 
                currentStep === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep === 'preview' ? <CheckCircle className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </div>
              <span className="font-medium">Build & Customize</span>
            </div>
            
            <div className={`flex-1 h-px mx-4 ${currentStep === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 4: Preview */}
            <div className={`flex items-center space-x-3 ${currentStep === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                <Eye className="w-4 h-4" />
              </div>
              <span className="font-medium">Preview & Export</span>
            </div>
          </div>
          
          {/* Save/Load Controls */}
          <div className="flex justify-center space-x-4 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                loadSavedCVs();
                setShowLoadDialog(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Load CV
            </button>
            
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={currentStep === 'upload' || isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {currentCVId ? 'Update CV' : 'Save CV'}
            </button>
            
            {currentCVId && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Editing: {cvTitle}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'template' && renderTemplateStep()}
          {currentStep === 'form' && renderFormStep()}
          {currentStep === 'preview' && renderPreviewStep()}
        </div>
      </section>

      {/* Save CV Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {currentCVId ? 'Update CV' : 'Save CV'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV Title
              </label>
              <input
                type="text"
                value={cvTitle}
                onChange={(e) => setCvTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter CV title..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCV}
                disabled={isSaving || !cvTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {currentCVId ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load CV Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Load Saved CV</h3>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading CVs...</span>
              </div>
            ) : savedCVs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No saved CVs found</p>
                <p className="text-sm text-gray-500 mt-2">Create and save your first CV to see it here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedCVs.map((cv) => (
                  <div
                    key={cv.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{cv.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{cv.full_name}</p>
                        {cv as any && (cv as any).is_visible ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded mt-2">Visible</span>
                        ) : null}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Template: {cv.template_name}</span>
                          <span>Score: {cv.cv_score}%</span>
                          <span>Updated: {new Date(cv.updated_at).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            cv.status === 'published' ? 'bg-green-100 text-green-800' : 
                            cv.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cv.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleLoadCV(cv.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          disabled={isLoading}
                        >
                          Load
                        </button>
                        <button
                          onClick={async () => {
                            const res = await cvStorageService.setVisible(cv.id);
                            if (!res.success) {
                              alert(res.message);
                              return;
                            }
                            // Refresh list to reflect visibility
                            await loadSavedCVs();
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          disabled={isLoading || (cv as any && (cv as any).is_visible)}
                          title={(cv as any && (cv as any).is_visible) ? 'Already visible' : 'Make visible to recruiters'}
                        >
                          {(cv as any && (cv as any).is_visible) ? 'Visible' : 'Make Visible'}
                        </button>
                        <button
                          onClick={() => handleDeleteCV(cv.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoFillCVBuilder;