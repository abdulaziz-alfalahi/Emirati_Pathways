import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  Building2, Settings, Globe, Users, Bell, Shield, Mail,
  Save, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
};

interface WorkspaceContext { workspace: any; companyId: string; }

const WorkspaceSettings: React.FC = () => {
  const { workspace, companyId } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [saved, setSaved] = useState(false);

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

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // In production, this would call PUT /api/workspace/{companyId}/settings
  };

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
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
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
            {t('Workspace Settings', 'إعدادات مساحة العمل')}
          </h1>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
            {t('Configure your company workspace preferences.', 'تكوين تفضيلات مساحة عمل شركتك.')}
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: saved ? brand.greenText : brand.primary, color: brand.white,
            fontSize: 13, fontWeight: 600, transition: 'background 0.2s',
          }}
        >
          {saved ? <><CheckCircle size={16} /> {t('Saved!', 'تم الحفظ!')}</> : <><Save size={16} /> {t('Save Changes', 'حفظ التغييرات')}</>}
        </button>
      </div>

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
  );
};

export default WorkspaceSettings;
