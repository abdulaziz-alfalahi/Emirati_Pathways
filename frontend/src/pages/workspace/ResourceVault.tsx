import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  FolderOpen, Upload, Loader2, Trash2, Download, FileText, Image, File, X, Grid, List
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', red: '#FEE2E2', redText: '#991B1B',
};

interface WorkspaceContext { workspace: any; companyId: string; userRole: string; isManager: boolean; }

const CATEGORIES = [
  { value: 'all', label: 'All', labelAr: 'الكل', icon: '📁' },
  { value: 'policy', label: 'Policies', labelAr: 'السياسات', icon: '📋' },
  { value: 'handbook', label: 'Handbooks', labelAr: 'الكتب', icon: '📘' },
  { value: 'training_material', label: 'Training', labelAr: 'تدريب', icon: '📚' },
  { value: 'onboarding', label: 'Onboarding', labelAr: 'الاندماج', icon: '🎯' },
  { value: 'general', label: 'General', labelAr: 'عام', icon: '📄' },
];

const getFileIcon = (type: string) => {
  if (type?.includes('pdf')) return <FileText size={24} style={{ color: '#EF4444' }} />;
  if (type?.includes('image')) return <Image size={24} style={{ color: '#3B82F6' }} />;
  if (type?.includes('spreadsheet') || type?.includes('excel') || type?.includes('csv')) return <FileText size={24} style={{ color: '#10B981' }} />;
  return <File size={24} style={{ color: brand.textSecondary }} />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ResourceVault: React.FC = () => {
  const { companyId, isManager } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const fileRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ category: 'general', description: '', is_public: false });

  useEffect(() => {
    loadFiles();
  }, [companyId, category]);

  const loadFiles = async () => {
    try {
      const url = category === 'all'
        ? `/api/workspace/${companyId}/vault`
        : `/api/workspace/${companyId}/vault?category=${category}`;
      const res = await restClient.get(url);
      setFiles((res as any).data.files || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadForm.category);
      formData.append('description', uploadForm.description);
      formData.append('is_public', String(uploadForm.is_public));
      await restClient.post(`/api/workspace/${companyId}/vault`, formData);
      setShowUpload(false);
      setUploadForm({ category: 'general', description: '', is_public: false });
      loadFiles();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const deleteFile = async (fileId: string) => {
    if (!window.confirm(t('Delete this file?', 'حذف هذا الملف؟'))) return;
    try {
      await restClient.delete(`/api/workspace/${companyId}/vault/${fileId}`);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
            {t('Resource Vault', 'خزنة الموارد')}
          </h1>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
            {t('Company policies, handbooks, and training materials', 'سياسات الشركة والكتب ومواد التدريب')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', borderRadius: 8, border: `1px solid ${brand.border}`, overflow: 'hidden' }}>
            <button onClick={() => setViewMode('grid')} style={{
              padding: '7px 10px', border: 'none', cursor: 'pointer',
              background: viewMode === 'grid' ? brand.primarySurface : brand.white,
              color: viewMode === 'grid' ? brand.primary : brand.textSecondary,
            }}><Grid size={14} /></button>
            <button onClick={() => setViewMode('list')} style={{
              padding: '7px 10px', border: 'none', cursor: 'pointer',
              background: viewMode === 'list' ? brand.primarySurface : brand.white,
              color: viewMode === 'list' ? brand.primary : brand.textSecondary,
            }}><List size={14} /></button>
          </div>
          {isManager && (
            <button onClick={() => setShowUpload(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
              background: brand.primary, color: brand.white, border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Upload size={16} /> {t('Upload', 'رفع')}
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)} style={{
            padding: '8px 16px', borderRadius: 99, border: `1px solid ${category === cat.value ? brand.primary : brand.border}`,
            background: category === cat.value ? brand.primarySurface : brand.white,
            color: category === cat.value ? brand.primary : brand.textSecondary,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {cat.icon} {isRTL ? cat.labelAr : cat.label}
          </button>
        ))}
      </div>

      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: brand.textSecondary }}>
          <FolderOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No files in this category', 'لا توجد ملفات في هذا التصنيف')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {files.map(file => (
            <div key={file.id} style={{
              background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
              padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: 12, background: '#F9FAFB', borderRadius: 8 }}>
                {getFileIcon(file.file_type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.file_name}
                </div>
                <div style={{ fontSize: 11, color: brand.textSecondary }}>
                  {formatSize(file.file_size_bytes || 0)} · {new Date(file.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                  background: brand.primarySurface, color: brand.primary,
                }}>{file.category}</span>
                {isManager && (
                  <button onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }} style={{
                    marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                    color: brand.textSecondary, padding: 2,
                  }}><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map(file => (
            <div key={file.id} style={{
              background: brand.white, borderRadius: 10, border: `1px solid ${brand.border}`,
              padding: 12, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {getFileIcon(file.file_type)}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{file.file_name}</div>
                <div style={{ fontSize: 11, color: brand.textSecondary }}>
                  {formatSize(file.file_size_bytes || 0)} · {file.category} · {new Date(file.created_at).toLocaleDateString()}
                  {file.uploaded_by_name && ` · ${file.uploaded_by_name}`}
                </div>
                {file.description && <div style={{ fontSize: 11, color: brand.textSecondary, fontStyle: 'italic' }}>{file.description}</div>}
              </div>
              {isManager && (
                <button onClick={() => deleteFile(file.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: brand.textSecondary, padding: 4,
                }}><Trash2 size={16} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowUpload(false)}>
          <div style={{
            background: brand.white, borderRadius: 14, width: 440, padding: 24,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('Upload File', 'رفع ملف')}</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} style={{ color: brand.textSecondary }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Category', 'التصنيف')}
                </label>
                <select value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13 }}>
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <option key={c.value} value={c.value}>{isRTL ? c.labelAr : c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Description', 'الوصف')}
                </label>
                <input value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder={t('Brief description...', 'وصف مختصر...')}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: brand.textSecondary, cursor: 'pointer' }}>
                <input type="checkbox" checked={uploadForm.is_public} onChange={e => setUploadForm({ ...uploadForm, is_public: e.target.checked })} />
                {t('Visible to employees', 'مرئي للموظفين')}
              </label>
              <div onClick={() => fileRef.current?.click()} style={{
                border: `2px dashed ${brand.border}`, borderRadius: 10, padding: 30,
                textAlign: 'center', cursor: 'pointer',
              }}>
                <Upload size={28} style={{ color: brand.textSecondary, margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                  {uploading ? t('Uploading...', 'جارٍ الرفع...') : t('Click to select file', 'انقر لاختيار الملف')}
                </p>
              </div>
              <input ref={fileRef} type="file" onChange={handleUpload} style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceVault;
