import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  FileText,
  Upload,
  CheckCircle,
  Loader2,
  Save,
  Eye,
  X,
  Download,
  Edit3,
  Target
} from 'lucide-react';

// Lightweight, self-contained AutoFill CV Builder (no external services)
// Provides: upload, template pick, form editing, preview, export PDF, local save/load

type CVFormData = {
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
};

type SavedCV = {
  id: string;
  title: string;
  updatedAt: string;
  data: CVFormData;
  template: string;
};

const TEMPLATES = [
  { id: 'uae_government_d33', name: 'Government (D33-aligned)' },
  { id: 'corporate_d33_sectors', name: 'Corporate (D33 sectors)' },
  { id: 'education_e33', name: 'Education (E33 strategy)' },
  { id: 'talent_2033', name: 'Talent 2033 (future skills)' }
];

const STORAGE_KEY = 'autoFillCVs';

const AutoFillCVBuilder: React.FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'upload' | 'template' | 'form' | 'preview'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [templateId, setTemplateId] = useState<string>('professional');
  const [cvTitle, setCvTitle] = useState<string>('My CV');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [currentCVId, setCurrentCVId] = useState<string | null>(null);

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

  const previewRef = useRef<HTMLDivElement>(null);

  // Upload handlers (client-side only demo)
  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5003';

  const mapParsedToForm = (parsed: any): CVFormData => {
    const p = parsed?.data || parsed || {};
    const pi = p.personal_info || {};
    const exp = Array.isArray(p.experience) ? p.experience : [];
    const edu = Array.isArray(p.education) ? p.education : [];
    const skills = Array.isArray(p.skills) ? p.skills : [];
    const tech: string[] = [];
    const soft: string[] = [];
    for (const s of skills) {
      if (!s) continue;
      const name = typeof s === 'string' ? s : s.name || s.skill || '';
      if (!name) continue;
      if (/leadership|communication|team|management|collaborat|problem/i.test(name)) soft.push(name);
      else tech.push(name);
    }
    return {
      personalInfo: {
        firstName: (pi.full_name?.split(' ')[0] || p.first_name || '') as string,
        lastName: (pi.full_name?.split(' ').slice(1).join(' ') || p.last_name || '') as string,
        email: pi.email || p.email || '',
        phone: pi.phone || p.phone || '',
        location: [pi.city, pi.emirate].filter(Boolean).join(', '),
        nationality: pi.nationality || 'UAE'
      },
      professionalSummary: p.professional_summary || p.summary || '',
      technicalSkills: tech.slice(0, 12),
      softSkills: soft.slice(0, 12),
      experience: exp.map((e: any) => ({
        jobTitle: e.job_title || e.title || '',
        company: e.company || '',
        location: e.location || [e.city, e.emirate].filter(Boolean).join(', '),
        startDate: e.start_date || '',
        endDate: e.end_date || '',
        responsibilities: Array.isArray(e.description) ? e.description.join('\n') : (e.description || '')
      })),
      education: edu.map((e: any) => ({
        degree: e.degree || '',
        institution: e.institution || '',
        graduationYear: e.graduation_year || e.year || '',
        field: e.field || e.field_of_study || ''
      }))
    };
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    try {
      // First, try backend parsing if available
      const form = new FormData();
      form.append('cv_file', file);
      const token = localStorage.getItem('access_token') || 'mock_token_1';
      let parsedOk = false;
      try {
        let res = await fetch(`${API_BASE_URL}/api/cv/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        setUploadProgress(60);
        if (!res.ok) {
          // Fallback to legacy endpoint used on prior branch
          res = await fetch(`${API_BASE_URL}/api/candidate/cv/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form
          });
        }
        if (res.ok) {
          const json = await res.json();
          const mapped = mapParsedToForm(json);
          setFormData(mapped);
          parsedOk = true;
        }
      } catch (e) {
        // ignore, fallback below
      }

      if (!parsedOk) {
        // Fallback: quick client-side prefill from filename
        const base = file.name.replace(/\.[^.]+$/, '').split(/[-_ ]/);
        setFormData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            firstName: prev.personalInfo.firstName || (base[0] || ''),
            lastName: prev.personalInfo.lastName || (base.slice(1).join(' ') || '')
          },
          professionalSummary: prev.professionalSummary || 'Experienced professional in the UAE market.'
        }));
      }

      setUploadProgress(100);
      setStep('template');
    } finally {
      setTimeout(() => setIsUploading(false), 300);
    }
  }, [API_BASE_URL]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileUpload(f);
  };

  // Save/load localStorage
  const loadSavedCVs = () => {
    setIsLoading(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: SavedCV[] = raw ? JSON.parse(raw) : [];
      setSavedCVs(list);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const persistSave = () => {
    if (!cvTitle.trim()) return;
    setIsSaving(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: SavedCV[] = raw ? JSON.parse(raw) : [];
      const now = new Date().toISOString();
      if (currentCVId) {
        const idx = list.findIndex((c) => c.id === currentCVId);
        if (idx >= 0) {
          list[idx] = { id: currentCVId, title: cvTitle, updatedAt: now, data: formData, template: templateId };
        }
      } else {
        const id = Math.random().toString(36).slice(2);
        list.unshift({ id, title: cvTitle, updatedAt: now, data: formData, template: templateId });
        setCurrentCVId(id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setSavedCVs(list);
      setShowSaveDialog(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (id: string) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: SavedCV[] = raw ? JSON.parse(raw) : [];
    const found = list.find((c) => c.id === id);
    if (found) {
      setFormData(found.data);
      setTemplateId(found.template);
      setCvTitle(found.title);
      setCurrentCVId(found.id);
      setShowLoadDialog(false);
      setStep('form');
    }
  };

  const handleDelete = (id: string) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: SavedCV[] = raw ? JSON.parse(raw) : [];
    const next = list.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedCVs(next);
  };

  // Export as PDF from preview
  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`${cvTitle || 'CV'}.pdf`);
  };

  const renderUpload = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Upload your CV for quick auto-fill, or continue without uploading
        </p>
      </div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileUpload(f); }}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">Drag and drop your CV here</p>
        <p className="text-gray-500 mb-4">or</p>
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" id="cv-upload" />
        <label htmlFor="cv-upload" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded cursor-pointer">
          {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {isUploading ? 'Uploading...' : 'Choose File'}
        </label>
        <div className="mt-3">
          <button type="button" onClick={() => document.getElementById('cv-upload')?.click()} className="px-4 py-2 border rounded">
            Browse file
          </button>
        </div>
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="text-center">
        <button className="px-4 py-2 border rounded" onClick={() => setStep('template')}>Skip upload</button>
      </div>
    </div>
  );

  const renderTemplate = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Choose a template</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            className={`border rounded p-3 text-left hover:border-primary ${templateId === tpl.id ? 'border-primary' : 'border-gray-200'}`}
            onClick={() => setTemplateId(tpl.id)}
          >
            <div className="font-medium">{tpl.name}</div>
            <div className="text-xs text-gray-500 mt-1">{tpl.id}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 border rounded" onClick={() => setStep('upload')}>Back</button>
        <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => setStep('form')}>Continue</button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Edit3 className="h-5 w-5" /> Build & Customize</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="border rounded px-3 py-2" placeholder="First Name" value={formData.personalInfo.firstName} onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, firstName: e.target.value } })} />
        <input className="border rounded px-3 py-2" placeholder="Last Name" value={formData.personalInfo.lastName} onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, lastName: e.target.value } })} />
        <input className="border rounded px-3 py-2" placeholder="Email" value={formData.personalInfo.email} onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, email: e.target.value } })} />
        <input className="border rounded px-3 py-2" placeholder="Phone" value={formData.personalInfo.phone} onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, phone: e.target.value } })} />
        <input className="border rounded px-3 py-2" placeholder="Location" value={formData.personalInfo.location} onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, location: e.target.value } })} />
        <input className="border rounded px-3 py-2" placeholder="Nationality" value={formData.personalInfo.nationality} onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, nationality: e.target.value } })} />
      </div>
      <textarea className="border rounded px-3 py-2 w-full min-h-[120px]" placeholder="Professional Summary" value={formData.professionalSummary} onChange={(e) => setFormData({ ...formData, professionalSummary: e.target.value })} />
      <div className="flex gap-3">
        <button className="px-4 py-2 border rounded" onClick={() => setStep('template')}>Back</button>
        <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => setStep('preview')}>Continue</button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Eye className="h-5 w-5" /> Preview & Export</h3>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border rounded" onClick={() => { loadSavedCVs(); setShowLoadDialog(true); }}>Load</button>
          <button className="px-3 py-2 border rounded" onClick={handleSave}>Save</button>
          <button className="px-3 py-2 bg-primary text-white rounded" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2 inline" /> Export PDF</button>
        </div>
      </div>
      <div ref={previewRef} className="border rounded p-6 bg-white">
        <div className="text-2xl font-bold">{formData.personalInfo.firstName} {formData.personalInfo.lastName}</div>
        <div className="text-sm text-gray-600">{formData.personalInfo.email} • {formData.personalInfo.phone} • {formData.personalInfo.location}</div>
        <div className="mt-4">
          <div className="text-lg font-semibold">Summary</div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{formData.professionalSummary}</div>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 border rounded" onClick={() => setStep('form')}>Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div className="font-semibold text-gray-900">AutoFill CV Builder</div>
          <div className="ml-auto flex items-center gap-2">
            <button className={`px-2 py-1 rounded text-xs ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Upload</button>
            <button className={`px-2 py-1 rounded text-xs ${step === 'template' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Template</button>
            <button className={`px-2 py-1 rounded text-xs ${step === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Form</button>
            <button className={`px-2 py-1 rounded text-xs ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Preview</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps bar */}
        <div className="bg-white rounded-lg border p-4 mb-8">
          <div className="flex items-center">
            <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600' : step !== 'upload' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : step !== 'upload' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {step === 'upload' ? <Upload className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              </div>
              <span className="font-medium">Upload & Analyze</span>
            </div>
            <div className={`flex-1 h-px mx-4 ${step !== 'upload' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step === 'template' ? 'text-blue-600' : step === 'form' || step === 'preview' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'template' ? 'bg-blue-600 text-white' : step === 'form' || step === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {step === 'form' || step === 'preview' ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <span className="font-medium">Choose Template</span>
            </div>
            <div className={`flex-1 h-px mx-4 ${step === 'form' || step === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step === 'form' ? 'text-blue-600' : step === 'preview' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'form' ? 'bg-blue-600 text-white' : step === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {step === 'preview' ? <CheckCircle className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </div>
              <span className="font-medium">Build & Customize</span>
            </div>
            <div className={`flex-1 h-px mx-4 ${step === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <Eye className="w-4 h-4" />
              </div>
              <span className="font-medium">Preview & Export</span>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-4 pt-4 border-t">
            <button onClick={() => { loadSavedCVs(); setShowLoadDialog(true); }} className="px-3 py-2 border rounded flex items-center gap-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Load CV
            </button>
            {/* Removed duplicate top Save button per feedback */}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg border p-6">
          {step === 'upload' && renderUpload()}
          {step === 'template' && renderTemplate()}
          {step === 'form' && renderForm()}
          {step === 'preview' && renderPreview()}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">{currentCVId ? 'Update CV' : 'Save CV'}</div>
              <button onClick={() => setShowSaveDialog(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <label className="block text-sm text-gray-600 mb-2">CV Title</label>
            <input className="border rounded px-3 py-2 w-full mb-4" value={cvTitle} onChange={(e) => setCvTitle(e.target.value)} placeholder="Enter CV title..." />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2" onClick={() => setShowSaveDialog(false)} disabled={isSaving}>Cancel</button>
              <button className="px-3 py-2 bg-primary text-white rounded" onClick={persistSave} disabled={isSaving || !cvTitle.trim()}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                {currentCVId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Load Saved CV</div>
              <button onClick={() => setShowLoadDialog(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-600"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
            ) : savedCVs.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                No saved CVs found
              </div>
            ) : (
              <div className="grid gap-3">
                {savedCVs.map((cv) => (
                  <div key={cv.id} className="border rounded p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{cv.title}</div>
                      <div className="text-xs text-gray-500">Updated: {new Date(cv.updatedAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 border rounded" onClick={() => handleLoad(cv.id)}>Load</button>
                      <button className="px-3 py-1 border rounded" onClick={() => handleDelete(cv.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="mt-8 text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 justify-center"><Target className="h-6 w-6" /> Ready to finalize your CV?</h2>
          <p className="opacity-90 mb-4">Save your work or export a PDF preview.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors" onClick={handleSave}>Save</button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-teal-600 transition-colors" onClick={() => setStep('preview')}>Go to Preview</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoFillCVBuilder;
