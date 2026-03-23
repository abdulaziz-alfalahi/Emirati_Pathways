import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, X, ArrowRight, Clock
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  red: '#FEE2E2', redText: '#991B1B',
};

interface WorkspaceContext { workspace: any; companyId: string; userRole: string; isManager: boolean; }

const CSVManager: React.FC = () => {
  const { companyId } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const fileRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadType, setUploadType] = useState('vacancies');
  const [step, setStep] = useState<'upload' | 'map' | 'result'>('upload');
  const [uploadData, setUploadData] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadHistory();
  }, [companyId]);

  const loadHistory = async () => {
    try {
      const res = await restClient.get(`/api/workspace/${companyId}/csv/history`);
      setHistory((res as any).data.uploads || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_type', uploadType);
      const res = await restClient.post(`/api/workspace/${companyId}/csv/upload`, formData);
      const data = (res as any).data;
      setUploadData(data);
      setMapping(data.suggested_mapping || {});
      setStep('map');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const processImport = async () => {
    if (!uploadData?.upload?.id) return;
    setImporting(true);
    try {
      const res = await restClient.post(`/api/workspace/${companyId}/csv/map`, {
        upload_id: uploadData.upload.id,
        column_mapping: mapping,
      });
      setResult((res as any).data);
      setStep('result');
      loadHistory();
    } catch (err) { console.error(err); }
    finally { setImporting(false); }
  };

  const reset = () => {
    setStep('upload');
    setUploadData(null);
    setMapping({});
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const dbFields: Record<string, string[]> = {
    vacancies: ['title', 'department', 'location', 'description', 'requirements', 'employment_type', 'salary_min', 'salary_max'],
    employees: ['full_name', 'email', 'phone', 'job_title', 'department', 'start_date'],
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
          {t('CSV Import Manager', 'مدير استيراد CSV')}
        </h1>
        <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
          {t('Bulk upload vacancies or employee data from spreadsheets', 'رفع الوظائف أو بيانات الموظفين بالجملة')}
        </p>
      </div>

      {step === 'upload' && (
        <>
          {/* Upload Type Selector */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { value: 'vacancies', label: t('Vacancies / Jobs', 'الوظائف الشاغرة'), icon: '💼' },
              { value: 'employees', label: t('Employees', 'الموظفين'), icon: '👥' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setUploadType(opt.value)}
                style={{
                  flex: 1, padding: '16px 20px', borderRadius: 10,
                  border: `2px solid ${uploadType === opt.value ? brand.primary : brand.border}`,
                  background: uploadType === opt.value ? brand.primarySurface : brand.white,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{opt.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{opt.label}</div>
              </button>
            ))}
          </div>

          {/* Dropzone */}
          <div onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${brand.border}`, borderRadius: 12, padding: 40,
              textAlign: 'center', cursor: 'pointer', background: '#FAFAFA',
              transition: 'all 0.2s',
            }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = brand.primary; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = brand.border; }}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && fileRef.current) {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileRef.current.files = dt.files;
                fileRef.current.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }}
          >
            <Upload size={40} style={{ color: brand.textSecondary, margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>
              {t('Drop your CSV file here or click to browse', 'اسحب ملف CSV هنا أو انقر للتصفح')}
            </p>
            <p style={{ fontSize: 12, color: brand.textSecondary }}>.csv files only</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
        </>
      )}

      {step === 'map' && uploadData && (
        <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
              {t('Map Columns', 'ربط الأعمدة')} — {uploadData.total_rows} {t('rows', 'صف')}
            </h3>
            <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: brand.textSecondary, fontSize: 12 }}>
              {t('Cancel', 'إلغاء')}
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `2px solid ${brand.border}`, color: brand.textSecondary, fontWeight: 600 }}>
                    {t('CSV Column', 'عمود CSV')}
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: `2px solid ${brand.border}` }}>
                    <ArrowRight size={14} style={{ color: brand.textSecondary }} />
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `2px solid ${brand.border}`, color: brand.textSecondary, fontWeight: 600 }}>
                    {t('Maps To', 'يرتبط بـ')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(uploadData.headers || []).map((header: string) => (
                  <tr key={header}>
                    <td style={{ padding: '8px 12px', borderBottom: `1px solid ${brand.border}`, fontWeight: 500 }}>{header}</td>
                    <td style={{ padding: '8px 12px', borderBottom: `1px solid ${brand.border}`, textAlign: 'center' }}>→</td>
                    <td style={{ padding: '8px 12px', borderBottom: `1px solid ${brand.border}` }}>
                      <select value={mapping[header] || ''} onChange={e => setMapping({ ...mapping, [header]: e.target.value })}
                        style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, fontSize: 12, width: '100%' }}>
                        <option value="">— {t('Skip', 'تخطي')} —</option>
                        {(dbFields[uploadType] || []).map(f => (
                          <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview */}
          {(uploadData.preview_rows || []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: brand.textSecondary, marginBottom: 8 }}>
                {t('Preview (first 5 rows)', 'معاينة (أول 5 صفوف)')}
              </h4>
              <div style={{ overflowX: 'auto', maxHeight: 200, border: `1px solid ${brand.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>{(uploadData.headers || []).map((h: string) => (
                      <th key={h} style={{ padding: '6px 8px', background: '#F9FAFB', borderBottom: `1px solid ${brand.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {uploadData.preview_rows.map((row: any, i: number) => (
                      <tr key={i}>{(uploadData.headers || []).map((h: string) => (
                        <td key={h} style={{ padding: '6px 8px', borderBottom: `1px solid ${brand.border}`, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row[h] || ''}
                        </td>
                      ))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={processImport} disabled={importing || Object.values(mapping).filter(Boolean).length === 0}
            style={{
              width: '100%', padding: '12px', background: brand.primary, color: brand.white,
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              opacity: importing ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {importing ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
            {importing ? t('Importing...', 'جارٍ الاستيراد...') : t('Start Import', 'بدء الاستيراد')}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, textAlign: 'center' }}>
          <CheckCircle size={48} style={{ color: brand.greenText, margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary }}>
            {t('Import Complete', 'اكتمل الاستيراد')}
          </h3>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', margin: '20px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: brand.greenText }}>{result.success_count}</div>
              <div style={{ fontSize: 12, color: brand.textSecondary }}>{t('Successful', 'ناجح')}</div>
            </div>
            {result.error_count > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: brand.redText }}>{result.error_count}</div>
                <div style={{ fontSize: 12, color: brand.textSecondary }}>{t('Errors', 'أخطاء')}</div>
              </div>
            )}
          </div>
          {(result.errors || []).length > 0 && (
            <div style={{ textAlign: 'left', maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
              {result.errors.map((err: any, i: number) => (
                <div key={i} style={{ fontSize: 12, color: brand.redText, padding: '4px 0', borderBottom: `1px solid ${brand.border}` }}>
                  Row {err.row}: {err.error}
                </div>
              ))}
            </div>
          )}
          <button onClick={reset} style={{
            padding: '10px 24px', background: brand.primary, color: brand.white,
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t('Import Another', 'استيراد آخر')}</button>
        </div>
      )}

      {/* Upload History */}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>
            {t('Import History', 'سجل الاستيراد')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(u => (
              <div key={u.id} style={{
                background: brand.white, borderRadius: 10, border: `1px solid ${brand.border}`,
                padding: 14, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <FileSpreadsheet size={18} style={{ color: brand.primary, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>
                    {u.original_filename || 'CSV Upload'}
                  </div>
                  <div style={{ fontSize: 11, color: brand.textSecondary }}>
                    {u.upload_type} · {u.row_count} rows · {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: brand.greenText, fontWeight: 600 }}>✓ {u.success_count}</span>
                  {u.error_count > 0 && <span style={{ fontSize: 12, color: brand.redText }}>✗ {u.error_count}</span>}
                  <span style={{
                    padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                    background: u.status === 'completed' ? brand.green : brand.amber,
                    color: u.status === 'completed' ? brand.greenText : brand.amberText,
                  }}>{u.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVManager;
