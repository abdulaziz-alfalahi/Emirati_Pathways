import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  Building2, Settings, Globe, Users, Bell, Shield, Mail,
  Save, Loader2, CheckCircle, AlertCircle, Plus, Trash2,
  Briefcase, Award, TrendingUp
} from 'lucide-react';

const brand = {
  primary: '#0D9488',
  primarySurface: '#F0FDFA',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  white: '#fff',
  green: '#DCFCE7',
  greenText: '#166534',
  amber: '#FEF3C7',
  amberText: '#92400E',
  redSurface: '#FEF2F2',
  redText: '#991B1B',
};

interface WorkspaceContext { workspace: any; companyId: string; }

const WorkspaceSettings: React.FC = () => {
  const { workspace, companyId } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  
  const [activeTab, setActiveTab] = useState<'general' | 'progression'>('general');
  const [saved, setSaved] = useState(false);
  const [generalSaving, setGeneralSaving] = useState(false);

  // General Settings Form
  const [form, setForm] = useState({
    companyName: workspace?.company_name || '',
    industry: workspace?.industry || '',
    website: workspace?.website || '',
    description: workspace?.description || '',
    location: workspace?.location || '',
    emiratizationTarget: 80,
    notifyOnNewApp: true,
    notifyOnDeadline: true,
    autoApproveTraining: false,
  });

  // Progression Settings Form
  const [progression, setProgression] = useState<{
    overview: string;
    overview_ar: string;
    career_path: any[];
    promotion_criteria: any[];
    emiratisation_support: any[];
  }>({
    overview: '',
    overview_ar: '',
    career_path: [],
    promotion_criteria: [],
    emiratisation_support: []
  });
  const [progressionLoading, setProgressionLoading] = useState(true);
  const [progressionSaving, setProgressionSaving] = useState(false);

  useEffect(() => {
    if (workspace) {
      setForm({
        companyName: workspace.company_name || '',
        industry: workspace.industry || '',
        website: workspace.website || '',
        description: workspace.description || '',
        location: workspace.location || '',
        emiratizationTarget: 80,
        notifyOnNewApp: true,
        notifyOnDeadline: true,
        autoApproveTraining: false,
      });
    }
  }, [workspace]);

  // Load Career Progression Details on Mount
  useEffect(() => {
    async function loadProgression() {
      if (!companyId) return;
      try {
        setProgressionLoading(true);
        const res = await restClient.get(`/api/workspace/${companyId}/progression`);
        if ((res as any).data?.progression) {
          setProgression((res as any).data.progression);
        }
      } catch (err) {
        console.error("Failed to load progression:", err);
      } finally {
        setProgressionLoading(false);
      }
    }
    loadProgression();
  }, [companyId]);

  const handleSaveGeneral = async () => {
    setGeneralSaving(true);
    // Mimic API delay and update state
    setTimeout(() => {
      setGeneralSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 800);
  };

  const handleSaveProgression = async () => {
    setProgressionSaving(true);
    try {
      await restClient.put(`/api/workspace/${companyId}/progression`, {
        overview: progression.overview,
        overview_ar: progression.overview_ar,
        career_path: progression.career_path,
        promotion_criteria: progression.promotion_criteria,
        emiratisation_support: progression.emiratisation_support,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save progression:", err);
      alert(t("Failed to save career progression details.", "فشل في حفظ تفاصيل المسار المهني."));
    } finally {
      setProgressionSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Career Path Level Handlers
  const handleUpdateLevel = (index: number, field: string, subfield: 'en' | 'ar', val: string) => {
    const updated = [...progression.career_path];
    if (!updated[index][field]) {
      updated[index][field] = { en: '', ar: '' };
    }
    updated[index][field][subfield] = val;
    setProgression(prev => ({ ...prev, career_path: updated }));
  };

  const handleAddLevel = () => {
    setProgression(prev => ({
      ...prev,
      career_path: [
        ...prev.career_path,
        {
          title: { en: '', ar: '' },
          duration: { en: '', ar: '' },
          focus: { en: '', ar: '' }
        }
      ]
    }));
  };

  const handleRemoveLevel = (index: number) => {
    setProgression(prev => ({
      ...prev,
      career_path: prev.career_path.filter((_, i) => i !== index)
    }));
  };

  // Promotion Criteria & Emiratisation Support List Handlers
  const handleUpdateListItem = (listName: 'promotion_criteria' | 'emiratisation_support', index: number, lang: 'en' | 'ar', val: string) => {
    const updated = [...progression[listName]];
    updated[index][lang] = val;
    setProgression(prev => ({ ...prev, [listName]: updated }));
  };

  const handleAddListItem = (listName: 'promotion_criteria' | 'emiratisation_support') => {
    setProgression(prev => ({
      ...prev,
      [listName]: [
        ...prev[listName],
        { en: '', ar: '' }
      ]
    }));
  };

  const handleRemoveListItem = (listName: 'promotion_criteria' | 'emiratisation_support', index: number) => {
    setProgression(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const SectionHeader: React.FC<{ icon: React.FC<any>; titleEn: string; titleAr: string; descEn: string; descAr: string }> = ({ icon: Icon, titleEn, titleAr, descEn, descAr }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${brand.border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color: brand.primary }} />
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t(titleEn, titleAr)}</h3>
        <p style={{ fontSize: 12, color: brand.textSecondary, margin: 0 }}>{t(descEn, descAr)}</p>
      </div>
    </div>
  );

  const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }> = 
    ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          border: `1px solid ${brand.border}`, fontSize: 13, color: brand.textPrimary,
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );

  const Toggle: React.FC<{ label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, desc, checked, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${brand.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: brand.textPrimary }}>{label}</div>
        <div style={{ fontSize: 12, color: brand.textSecondary }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? brand.primary : '#D1D5DB', position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: brand.white,
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
            {t('Workspace Settings', 'إعدادات مساحة العمل')}
          </h1>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
            {t('Configure your company workspace preferences and career tracks.', 'تكوين تفضيلات مساحة عمل شركتك والمسارات المهنية.')}
          </p>
        </div>
        
        {activeTab === 'general' ? (
          <button
            onClick={handleSaveGeneral}
            disabled={generalSaving}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: saved ? brand.greenText : brand.primary, color: brand.white,
              fontSize: 13, fontWeight: 600, transition: 'background 0.2s',
              opacity: generalSaving ? 0.7 : 1,
            }}
          >
            {generalSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : saved ? (
              <><CheckCircle size={16} /> {t('Saved!', 'تم الحفظ!')}</>
            ) : (
              <><Save size={16} /> {t('Save Changes', 'حفظ التغييرات')}</>
            )}
          </button>
        ) : (
          <button
            onClick={handleSaveProgression}
            disabled={progressionSaving || progressionLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: saved ? brand.greenText : brand.primary, color: brand.white,
              fontSize: 13, fontWeight: 600, transition: 'background 0.2s',
              opacity: (progressionSaving || progressionLoading) ? 0.7 : 1,
            }}
          >
            {progressionSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : saved ? (
              <><CheckCircle size={16} /> {t('Saved!', 'تم الحفظ!')}</>
            ) : (
              <><Save size={16} /> {t('Save Progression', 'حفظ المسار المهني')}</>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, borderBottom: `1px solid ${brand.border}`, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: activeTab === 'general' ? brand.primary : brand.textSecondary,
            borderBottom: activeTab === 'general' ? `2px solid ${brand.primary}` : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}
        >
          {t('General Settings', 'الإعدادات العامة')}
        </button>
        <button
          onClick={() => setActiveTab('progression')}
          style={{
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: activeTab === 'progression' ? brand.primary : brand.textSecondary,
            borderBottom: activeTab === 'progression' ? `2px solid ${brand.primary}` : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}
        >
          {t('Career Progression & Opportunities', 'المسار المهني وفرص الترقية')}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'general' && (
        <div>
          {/* Company Information */}
          <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 16 }}>
            <SectionHeader icon={Building2} titleEn="Company Information" titleAr="معلومات الشركة" descEn="Basic company details" descAr="تفاصيل الشركة الأساسية" />
            <InputField label={t('Company Name', 'اسم الشركة')} value={form.companyName} onChange={v => updateField('companyName', v)} />
            <InputField label={t('Industry', 'القطاع')} value={form.industry} onChange={v => updateField('industry', v)} />
            <InputField label={t('Website', 'الموقع الإلكتروني')} value={form.website} onChange={v => updateField('website', v)} placeholder="https://" />
            <InputField label={t('Location', 'الموقع')} value={form.location} onChange={v => updateField('location', v)} placeholder={t('e.g. Dubai, UAE', 'مثال: دبي، الإمارات')} />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('Description', 'الوصف')}
              </label>
              <textarea
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: `1px solid ${brand.border}`, fontSize: 13, color: brand.textPrimary,
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Emiratization Targets */}
          <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 16 }}>
            <SectionHeader icon={Shield} titleEn="Emiratization Targets" titleAr="أهداف التوطين" descEn="Set compliance goals" descAr="تحديد أهداف الامتثال" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('Target Percentage', 'النسبة المستهدفة')}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min={0} max={100}
                  value={form.emiratizationTarget}
                  onChange={e => updateField('emiratizationTarget', parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: brand.primary }}
                />
                <span style={{ fontSize: 18, fontWeight: 700, color: brand.primary, minWidth: 50, textAlign: 'center' }}>
                  {form.emiratizationTarget}%
                </span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 16 }}>
            <SectionHeader icon={Bell} titleEn="Notifications" titleAr="الإشعارات" descEn="Control notification preferences" descAr="التحكم في تفضيلات الإشعارات" />
            <Toggle
              label={t('New Applications', 'طلبات جديدة')}
              desc={t('Get notified when candidates apply to your jobs', 'تلقي إشعار عند تقديم المرشحين لوظائفك')}
              checked={form.notifyOnNewApp}
              onChange={v => updateField('notifyOnNewApp', v)}
            />
            <Toggle
              label={t('Compliance Deadlines', 'مواعيد الامتثال')}
              desc={t('Reminders for MOHRE reporting and quota deadlines', 'تذكيرات بمواعيد تقارير وزارة الموارد البشرية')}
              checked={form.notifyOnDeadline}
              onChange={v => updateField('notifyOnDeadline', v)}
            />
            <Toggle
              label={t('Auto-Approve Training', 'الموافقة التلقائية على التدريب')}
              desc={t('Automatically approve employee training requests', 'الموافقة تلقائيا على طلبات تدريب الموظفين')}
              checked={form.autoApproveTraining}
              onChange={v => updateField('autoApproveTraining', v)}
            />
          </div>

          {/* Workspace Info */}
          <div style={{
            background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.border}`,
            padding: 16, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <AlertCircle size={18} style={{ color: brand.primary, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: brand.textSecondary, lineHeight: '1.5' }}>
              {t(
                `Workspace ID: ${companyId} · Slug: ${workspace?.workspace_slug || 'N/A'}`,
                `معرّف مساحة العمل: ${companyId} · الرابط: ${workspace?.workspace_slug || 'غير متوفر'}`
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'progression' && (
        <div>
          {progressionLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
            </div>
          ) : (
            <div>
              {/* Career Overview */}
              <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 16 }}>
                <SectionHeader icon={Briefcase} titleEn="Career Overview" titleAr="نبذة عن المسار المهني" descEn="Explain the long-term career growth opportunities at your company" descAr="اشرح فرص النمو المهني طويلة الأجل في شركتك" />
                
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('Overview (English)', 'نبذة عامة (بالانجليزية)')}
                  </label>
                  <textarea
                    value={progression.overview || ''}
                    onChange={e => setProgression(prev => ({ ...prev, overview: e.target.value }))}
                    rows={3}
                    placeholder={t("A brief summary of career pathways...", "ملخص بسيط للمسارات المهنية...")}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: `1px solid ${brand.border}`, fontSize: 13, color: brand.textPrimary,
                      resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('Overview (Arabic)', 'نبذة عامة (بالعربية)')}
                  </label>
                  <textarea
                    value={progression.overview_ar || ''}
                    onChange={e => setProgression(prev => ({ ...prev, overview_ar: e.target.value }))}
                    rows={3}
                    placeholder={t("ملخص باللغة العربية حول نمو الموظفين...", "ملخص باللغة العربية حول نمو الموظفين...")}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: `1px solid ${brand.border}`, fontSize: 13, color: brand.textPrimary,
                      resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                      direction: 'rtl'
                    }}
                  />
                </div>
              </div>

              {/* Career Path Levels */}
              <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${brand.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={18} style={{ color: brand.primary }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                        {t('Career Path Stages', 'مراحل المسار المهني')}
                      </h3>
                      <p style={{ fontSize: 12, color: brand.textSecondary, margin: 0 }}>
                        {t('Define the levels and progression track in order', 'حدد المستويات ومسار الترقية بالترتيب')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAddLevel}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 6, border: `1px solid ${brand.primary}`,
                      background: 'transparent', color: brand.primary, cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = brand.primarySurface; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Plus size={14} /> {t('Add Stage', 'إضافة مرحلة')}
                  </button>
                </div>

                {progression.career_path.length === 0 ? (
                  <div style={{ padding: '24px 0', textCenter: 'center', textAlign: 'center', color: brand.textSecondary, fontSize: 13 }}>
                    {t('No stages defined yet. Click "Add Stage" to begin.', 'لا توجد مراحل محددة بعد. انقر على "إضافة مرحلة" للبدء.')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {progression.career_path.map((level, index) => (
                      <div
                        key={index}
                        style={{
                          background: '#FAFAFA', borderRadius: 10, border: `1px solid ${brand.border}`,
                          padding: 16, position: 'relative',
                        }}
                      >
                        {/* Number Badge & Delete */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: brand.primary, background: brand.primarySurface, padding: '3px 8px', borderRadius: 6 }}>
                            {t(`Stage ${index + 1}`, `المرحلة ${index + 1}`)}
                          </span>
                          <button
                            onClick={() => handleRemoveLevel(index)}
                            style={{
                              border: 'none', background: 'none', cursor: 'pointer',
                              color: brand.textSecondary, padding: 4, borderRadius: 6,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = brand.redSurface; e.currentTarget.style.color = brand.redText; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = brand.textSecondary; }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Title Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4 }}>
                              {t('Job Title (English)', 'المسمى الوظيفي (بالإنجليزية)')}
                            </label>
                            <input
                              type="text"
                              value={level.title?.en || ''}
                              onChange={e => handleUpdateLevel(index, 'title', 'en', e.target.value)}
                              placeholder="e.g. Associate Engineer"
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, fontSize: 12, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                              {t('Job Title (Arabic)', 'المسمى الوظيفي (بالعربية)')}
                            </label>
                            <input
                              type="text"
                              value={level.title?.ar || ''}
                              onChange={e => handleUpdateLevel(index, 'title', 'ar', e.target.value)}
                              placeholder="مثال: مهندس مساعد"
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, fontSize: 12, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box', direction: 'rtl' }}
                            />
                          </div>
                        </div>

                        {/* Duration Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4 }}>
                              {t('Duration (English)', 'المدة المتوقعة (بالإنجليزية)')}
                            </label>
                            <input
                              type="text"
                              value={level.duration?.en || ''}
                              onChange={e => handleUpdateLevel(index, 'duration', 'en', e.target.value)}
                              placeholder="e.g. 1-2 Years"
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, fontSize: 12, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                              {t('Duration (Arabic)', 'المدة المتوقعة (بالعربية)')}
                            </label>
                            <input
                              type="text"
                              value={level.duration?.ar || ''}
                              onChange={e => handleUpdateLevel(index, 'duration', 'ar', e.target.value)}
                              placeholder="مثال: 1-2 سنة"
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, fontSize: 12, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box', direction: 'rtl' }}
                            />
                          </div>
                        </div>

                        {/* Focus/Responsibilities */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4 }}>
                              {t('Key Focus / Responsibilities (English)', 'التركيز الأساسي / المسؤوليات (بالإنجليزية)')}
                            </label>
                            <textarea
                              value={level.focus?.en || ''}
                              onChange={e => handleUpdateLevel(index, 'focus', 'en', e.target.value)}
                              rows={2}
                              placeholder="e.g. Focus on learning codebase and delivering bugs fixes..."
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, fontSize: 12, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                              {t('Key Focus / Responsibilities (Arabic)', 'التركيز الأساسي / المسؤوليات (بالعربية)')}
                            </label>
                            <textarea
                              value={level.focus?.ar || ''}
                              onChange={e => handleUpdateLevel(index, 'focus', 'ar', e.target.value)}
                              rows={2}
                              placeholder="مثال: التركيز على فهم النظام وإصلاح الأخطاء البرمجية..."
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, fontSize: 12, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'rtl' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Promotion Criteria */}
              <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${brand.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={18} style={{ color: brand.primary }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                        {t('Promotion Criteria', 'معايير الترقية')}
                      </h3>
                      <p style={{ fontSize: 12, color: brand.textSecondary, margin: 0 }}>
                        {t('Add key checklist items required for employee advancement', 'أضف المعايير الأساسية المطلوبة لترقية الموظفين')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddListItem('promotion_criteria')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 6, border: `1px solid ${brand.primary}`,
                      background: 'transparent', color: brand.primary, cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = brand.primarySurface; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Plus size={14} /> {t('Add Criterion', 'إضافة معيار')}
                  </button>
                </div>

                {progression.promotion_criteria.length === 0 ? (
                  <div style={{ padding: '20px 0', textCenter: 'center', textAlign: 'center', color: brand.textSecondary, fontSize: 13 }}>
                    {t('No criteria items added yet.', 'لم يتم إضافة معايير بعد.')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {progression.promotion_criteria.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <input
                            type="text"
                            value={item.en || ''}
                            onChange={e => handleUpdateListItem('promotion_criteria', idx, 'en', e.target.value)}
                            placeholder="e.g. Professional certifications (Azure Solutions Architect)"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box' }}
                          />
                          <input
                            type="text"
                            value={item.ar || ''}
                            onChange={e => handleUpdateListItem('promotion_criteria', idx, 'ar', e.target.value)}
                            placeholder="مثال: الحصول على شهادات مهنية متخصصة"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box', direction: 'rtl' }}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveListItem('promotion_criteria', idx)}
                          style={{
                            border: 'none', background: 'none', cursor: 'pointer',
                            color: brand.textSecondary, padding: 6, borderRadius: 6,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = brand.redSurface; e.currentTarget.style.color = brand.redText; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = brand.textSecondary; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emiratisation Support */}
              <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${brand.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={18} style={{ color: brand.primary }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                        {t('Emiratisation Schemes & Support', 'مبادرات وبرامج دعم التوطين')}
                      </h3>
                      <p style={{ fontSize: 12, color: brand.textSecondary, margin: 0 }}>
                        {t('Detail specific support programs (e.g. Nafis salary/training programs)', 'اذكر برامج الدعم المخصصة (مثل مبادرات نافس للرواتب والتدريب)')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddListItem('emiratisation_support')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 6, border: `1px solid ${brand.primary}`,
                      background: 'transparent', color: brand.primary, cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = brand.primarySurface; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Plus size={14} /> {t('Add Program', 'إضافة برنامج')}
                  </button>
                </div>

                {progression.emiratisation_support.length === 0 ? (
                  <div style={{ padding: '20px 0', textCenter: 'center', textAlign: 'center', color: brand.textSecondary, fontSize: 13 }}>
                    {t('No support programs added yet.', 'لم يتم إضافة برامج دعم بعد.')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {progression.emiratisation_support.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <input
                            type="text"
                            value={item.en || ''}
                            onChange={e => handleUpdateListItem('emiratisation_support', idx, 'en', e.target.value)}
                            placeholder="e.g. Nafis pension scheme matching"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box' }}
                          />
                          <input
                            type="text"
                            value={item.ar || ''}
                            onChange={e => handleUpdateListItem('emiratisation_support', idx, 'ar', e.target.value)}
                            placeholder="مثال: التوافق مع برنامج التقاعد والمكافآت من نافس"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, color: brand.textPrimary, outline: 'none', boxSizing: 'border-box', direction: 'rtl' }}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveListItem('emiratisation_support', idx)}
                          style={{
                            border: 'none', background: 'none', cursor: 'pointer',
                            color: brand.textSecondary, padding: 6, borderRadius: 6,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = brand.redSurface; e.currentTarget.style.color = brand.redText; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = brand.textSecondary; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSettings;
