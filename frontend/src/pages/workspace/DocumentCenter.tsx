import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  FileText, Plus, Download, Loader2, X, User, Calendar, Clock, Printer
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
};

interface WorkspaceContext { workspace: any; companyId: string; userRole: string; isManager: boolean; }

const DocumentCenter: React.FC = () => {
  const { companyId } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [templates, setTemplates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [extraData, setExtraData] = useState<Record<string, string>>({});
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates');

  useEffect(() => {
    async function load() {
      try {
        const [tplRes, histRes, empRes] = await Promise.all([
          restClient.get(`/api/workspace/${companyId}/documents/templates`),
          restClient.get(`/api/workspace/${companyId}/documents/history`),
          restClient.get(`/api/workspace/${companyId}/employees`),
        ]);
        setTemplates((tplRes as any).data.templates || []);
        setHistory((histRes as any).data.documents || []);
        setEmployees((empRes as any).data.employees || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [companyId]);

  const generateDoc = async () => {
    if (!selectedTemplate || !selectedEmployee) return;
    setGenerating(true);
    try {
      const res = await restClient.post(`/api/workspace/${companyId}/documents/generate`, {
        template_id: selectedTemplate.id,
        employee_id: parseInt(selectedEmployee),
        extra_data: extraData,
      });
      const data = (res as any).data;
      setGeneratedHtml(data.html);
      // Refresh history
      const histRes = await restClient.get(`/api/workspace/${companyId}/documents/history`);
      setHistory((histRes as any).data.documents || []);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const printDocument = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Document</title></head>
        <body>${generatedHtml}</body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
    </div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
            {t('Document Center', 'مركز المستندات')}
          </h1>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
            {t('Generate salary certificates, training letters, and more', 'إنشاء شهادات الراتب وخطابات التدريب والمزيد')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${brand.border}` }}>
        {[
          { key: 'templates' as const, label: t('Templates', 'القوالب') },
          { key: 'history' as const, label: t(`History (${history.length})`, `السجل (${history.length})`) },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'transparent',
            color: activeTab === tab.key ? brand.primary : brand.textSecondary,
            borderBottom: activeTab === tab.key ? `2px solid ${brand.primary}` : '2px solid transparent',
          }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'templates' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {templates.map(tpl => (
            <div key={tpl.id} style={{
              background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
              padding: 20, cursor: 'pointer', transition: 'all 0.2s',
            }}
              onClick={() => { setSelectedTemplate(tpl); setShowGenerate(true); setGeneratedHtml(''); }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: brand.primarySurface,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <FileText size={22} style={{ color: brand.primary }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                {tpl.template_name}
              </h3>
              <p style={{ fontSize: 12, color: brand.textSecondary, margin: 0 }}>
                {tpl.template_type.replace(/_/g, ' ')}
                {tpl.is_default && <span style={{
                  marginLeft: 8, padding: '2px 6px', borderRadius: 4,
                  background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600,
                }}>{t('Default', 'افتراضي')}</span>}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: brand.textSecondary }}>
              <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>{t('No documents generated yet', 'لم يتم إنشاء مستندات بعد')}</p>
            </div>
          ) : history.map(doc => (
            <div key={doc.id} style={{
              background: brand.white, borderRadius: 10, border: `1px solid ${brand.border}`,
              padding: 14, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <FileText size={20} style={{ color: brand.primary, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>
                  {doc.template_name || doc.document_type.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 11, color: brand.textSecondary }}>
                  {doc.employee_name && <span>{doc.employee_name} · </span>}
                  {new Date(doc.created_at).toLocaleDateString()}
                  {doc.generated_by_name && <span> · by {doc.generated_by_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Document Modal */}
      {showGenerate && selectedTemplate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowGenerate(false)}>
          <div style={{
            background: brand.white, borderRadius: 14, width: 600, maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: `1px solid ${brand.border}`,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                {t('Generate', 'إنشاء')}: {selectedTemplate.template_name}
              </h3>
              <button onClick={() => setShowGenerate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} style={{ color: brand.textSecondary }} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {!generatedHtml ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                      {t('Select Employee', 'اختر الموظف')} *
                    </label>
                    <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13 }}>
                      <option value="">{t('Choose...', 'اختر...')}</option>
                      {employees.map(emp => (
                        <option key={emp.user_id} value={emp.user_id}>{emp.full_name} — {emp.job_title || 'Employee'}</option>
                      ))}
                    </select>
                  </div>

                  {selectedTemplate.template_type === 'salary_certificate' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                          {t('Monthly Salary (AED)', 'الراتب الشهري')}
                        </label>
                        <input type="number" placeholder="e.g. 15000"
                          onChange={e => setExtraData({ ...extraData, monthly_salary: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                          {t('Salary in Words', 'الراتب كتابةً')}
                        </label>
                        <input placeholder="e.g. Fifteen Thousand"
                          onChange={e => setExtraData({ ...extraData, salary_in_words: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  )}

                  {selectedTemplate.template_type === 'training_letter' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                          {t('Training Name', 'اسم التدريب')}
                        </label>
                        <input placeholder="e.g. Leadership Essentials"
                          onChange={e => setExtraData({ ...extraData, training_name: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                          {t('Duration', 'المدة')}
                        </label>
                        <input placeholder="e.g. 3 weeks"
                          onChange={e => setExtraData({ ...extraData, training_duration: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                        {t('Signatory Name', 'اسم الموقع')}
                      </label>
                      <input placeholder="e.g. Ahmed Al Hashimi"
                        onChange={e => setExtraData({ ...extraData, signatory_name: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                        {t('Signatory Title', 'منصب الموقع')}
                      </label>
                      <input placeholder="e.g. HR Director"
                        onChange={e => setExtraData({ ...extraData, signatory_title: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  <button onClick={generateDoc} disabled={!selectedEmployee || generating}
                    style={{
                      width: '100%', padding: '12px', background: brand.primary, color: brand.white,
                      border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      opacity: (!selectedEmployee || generating) ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    {generating ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                    {generating ? t('Generating...', 'جارٍ الإنشاء...') : t('Generate Document', 'إنشاء المستند')}
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    border: `1px solid ${brand.border}`, borderRadius: 8, padding: 0, marginBottom: 16,
                    maxHeight: 400, overflowY: 'auto',
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={printDocument} style={{
                      flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: brand.primary, color: brand.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                      <Printer size={16} /> {t('Print / Save as PDF', 'طباعة / حفظ كـ PDF')}
                    </button>
                    <button onClick={() => setGeneratedHtml('')} style={{
                      padding: '10px 16px', border: `1px solid ${brand.border}`, borderRadius: 8,
                      background: brand.white, color: brand.textSecondary, fontSize: 13, cursor: 'pointer',
                    }}>
                      {t('New', 'جديد')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
