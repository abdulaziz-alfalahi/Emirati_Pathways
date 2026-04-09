import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import NafisVacancyImport from '@/components/growth-operator/NafisVacancyImport';
import Messages from '@/components/recruiter/Messages';
import { restClient } from '@/utils/api';
import {
  Building2, Plus, Search, Filter, Mail, Phone, MapPin, Globe,
  Users, Briefcase, CheckCircle, Clock, AlertTriangle, Eye, Edit,
  RefreshCw, Download, Upload, TrendingUp, BarChart3, Target,
  Activity, ArrowUpRight, ArrowDownRight, ShieldCheck,
  Building, Flag, ChevronRight, ExternalLink,
  Handshake, PieChart, Award, MessageSquare
} from 'lucide-react';

// ─── Color Palette ───
const colors = {
  primary: '#0A5C36',       // UAE Government Green
  primaryLight: '#E8F5EE',
  secondary: '#1B4D3E',
  accent: '#C4A265',        // Gold accent
  accentLight: '#FEF9EE',
  bg: '#F8FAFB',
  card: '#FFFFFF',
  text: '#1A1F36',
  textSecondary: '#5A6B7B',
  border: '#E2E8F0',
  greenBg: '#ECFDF5', greenText: '#059669',
  yellowBg: '#FFFBEB', yellowText: '#D97706',
  redBg: '#FEF2F2', redText: '#DC2626',
  blueBg: '#EFF6FF', blueText: '#2563EB',
  purpleBg: '#F3E8FF', purpleText: '#7C3AED',
};

// ─── Types ───
interface Company {
  id: string;
  name: string;
  nameAr: string;
  industry: string;
  industryAr: string;
  size: string;
  emirate: string;
  status: 'lead' | 'contacted' | 'documentation' | 'verification' | 'active' | 'inactive';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  jobsPosted: number;
  emiratizationRate: number;
  emiratizationTarget: number;
  hiresCount: number;
  emiratiHires: number;
  registeredAt: string;
  lastActivity: string;
  healthScore: number; // 0-100
  tradeLicense: boolean;
  mohrRegistered: boolean;
  leadSource: string; // nafis_import | manual | magic_link
}

interface ActivityItem {
  type: string;
  text: string;
  time: string;
}

// Helper: convert API company to UI Company
const toCompany = (c: any): Company => ({
  id: c.id || '',
  name: c.name || c.company_name || '',
  nameAr: c.nameAr || c.name || '',
  industry: c.industry || '',
  industryAr: c.industryAr || c.industry || '',
  size: c.size || '—',
  emirate: c.emirate || '',
  status: c.status || 'lead',
  contactPerson: c.contactPerson || '',
  contactEmail: c.contactEmail || '',
  contactPhone: c.contactPhone || '',
  jobsPosted: c.jobsPosted || 0,
  emiratizationRate: c.emiratizationRate || 0,
  emiratizationTarget: c.emiratizationTarget || 10,
  hiresCount: c.totalHired || c.hiresCount || 0,
  emiratiHires: c.emiratiHires || 0,
  registeredAt: c.registeredAt || '',
  lastActivity: c.invitationAcceptedAt || c.invitationSentAt || c.registeredAt || '',
  healthScore: c.isVerified ? 80 : (c.status === 'active' ? 60 : c.status === 'verification' ? 40 : 20),
  tradeLicense: !!c.tradeLicense,
  mohrRegistered: c.isVerified || false,
  leadSource: c.leadSource || 'manual',
});

// Helper: relative time
const timeAgo = (iso: string | null): string => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ─── Component ───
const GrowthOperatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => language === 'ar' ? ar : en;

  const [searchParams, setSearchParams] = useSearchParams();
  // Derive activeTab directly from URL — no useState, so notification
  // deep-links that update ?tab= always take effect immediately.
  const activeTab = searchParams.get('tab') || 'overview';
  console.log(`📊 GrowthOperatorDashboard render: activeTab="${activeTab}", URL=${window.location.search}`);
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [funnelCounts, setFunnelCounts] = useState<Record<string, number>>({ lead: 0, contacted: 0, documentation: 0, verification: 0, active: 0 });
  const [kpis, setKpis] = useState<any>({});
  const [dashLoading, setDashLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showOnboardDialog, setShowOnboardDialog] = useState(false);

  // ─── Fetch live data ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await restClient.get('/api/growth/dashboard-stats');
        const d = (res as any).data || res;
        if (cancelled) return;
        if (d.companies) setCompanies(d.companies.map(toCompany));
        if (d.funnel) setFunnelCounts(d.funnel);
        if (d.kpis) setKpis(d.kpis);
        if (d.recentActivity) setRecentActivity(d.recentActivity.map((a: any) => ({
          type: a.type || 'contact',
          text: a.text || '',
          time: timeAgo(a.time),
        })));
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Computed Metrics ───
  const totalCompanies = kpis.totalCompanies ?? companies.length;
  const activeCompanies = kpis.activeCompanies ?? companies.filter(c => c.status === 'active').length;
  const inPipeline = kpis.inPipeline ?? companies.filter(c => ['lead', 'contacted', 'documentation', 'verification'].includes(c.status)).length;
  const totalJobs = kpis.totalJobs ?? companies.reduce((sum, c) => sum + c.jobsPosted, 0);
  const avgEmiratization = activeCompanies > 0
    ? (companies.filter(c => c.status === 'active').reduce((sum, c) => sum + c.emiratizationRate, 0) / activeCompanies).toFixed(1)
    : '0.0';
  const belowTarget = companies.filter(c => c.status === 'active' && c.emiratizationRate < c.emiratizationTarget).length;

  const pipelineStages = [
    { key: 'lead', label: t('Lead', 'عميل محتمل'), count: funnelCounts.lead || 0, color: colors.textSecondary, bgColor: '#F1F5F9' },
    { key: 'contacted', label: t('Contacted', 'تم التواصل'), count: funnelCounts.contacted || 0, color: colors.blueText, bgColor: colors.blueBg },
    { key: 'documentation', label: t('Documentation', 'التوثيق'), count: funnelCounts.documentation || 0, color: colors.yellowText, bgColor: colors.yellowBg },
    { key: 'verification', label: t('Verification', 'التحقق'), count: funnelCounts.verification || 0, color: colors.purpleText, bgColor: colors.purpleBg },
    { key: 'active', label: t('Active', 'نشط'), count: funnelCounts.active || 0, color: colors.greenText, bgColor: colors.greenBg },
  ];

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string; labelAr: string }> = {
      lead: { bg: '#F1F5F9', text: colors.textSecondary, label: 'Lead', labelAr: 'عميل محتمل' },
      contacted: { bg: colors.blueBg, text: colors.blueText, label: 'Contacted', labelAr: 'تم التواصل' },
      documentation: { bg: colors.yellowBg, text: colors.yellowText, label: 'Documentation', labelAr: 'التوثيق' },
      verification: { bg: colors.purpleBg, text: colors.purpleText, label: 'Verification', labelAr: 'التحقق' },
      active: { bg: colors.greenBg, text: colors.greenText, label: 'Active', labelAr: 'نشط' },
      inactive: { bg: colors.redBg, text: colors.redText, label: 'Inactive', labelAr: 'غير نشط' },
    };
    const c = config[status] || config.lead;
    return (
      <span style={{ background: c.bg, color: c.text, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
        {t(c.label, c.labelAr)}
      </span>
    );
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) return colors.greenText;
    if (score >= 50) return colors.yellowText;
    return colors.redText;
  };

  const tabs = [
    { key: 'overview', label: t('Overview', 'نظرة عامة'), icon: BarChart3 },
    { key: 'onboarding', label: t('Company Onboarding', 'إلحاق الشركات'), icon: Plus },
    { key: 'partnerships', label: t('Employer Partnerships', 'شراكات أصحاب العمل'), icon: Handshake },
    { key: 'workspaces', label: t('Workspaces', 'مساحات العمل'), icon: ShieldCheck },
    { key: 'emiratization', label: t('Jobs & Emiratization', 'الوظائف والتوطين'), icon: Flag },
    { key: 'nafis', label: t('NAFIS Import', 'استيراد نافس'), icon: Upload },
    { key: 'reports', label: t('Reports', 'التقارير'), icon: PieChart },
    { key: 'messages', label: t('Messages', 'الرسائل'), icon: MessageSquare },
  ];

  // ─── KPI Card ───
  const KPICard = ({ icon: Icon, label, value, subtext, color, trend }: any) => (
    <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ padding: 10, borderRadius: 12, background: color + '15' }}>
          <Icon size={22} color={color} />
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: trend >= 0 ? colors.greenText : colors.redText, fontWeight: 600 }}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{value}</div>
        <div style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>{label}</div>
        {subtext && <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{subtext}</div>}
      </div>
    </div>
  );

  // ═══════ OVERVIEW TAB ═══════
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <KPICard icon={Building2} label={t('Total Companies', 'إجمالي الشركات')} value={totalCompanies} color={colors.primary} trend={8} />
        <KPICard icon={Target} label={t('In Pipeline', 'في خط الإلحاق')} value={inPipeline} color={colors.blueText} subtext={t(`${pipelineStages[0].count} leads`, `${pipelineStages[0].count} عملاء محتملين`)} />
        <KPICard icon={Handshake} label={t('Active Partners', 'شركاء نشطون')} value={activeCompanies} color={colors.greenText} trend={12} />
        <KPICard icon={Flag} label={t('Avg. Emiratization', 'متوسط التوطين')} value={`${avgEmiratization}%`} color={colors.accent}
          subtext={belowTarget > 0 ? t(`${belowTarget} below target`, `${belowTarget} أقل من المستهدف`) : t('All on target', 'الكل في المستهدف')} />
      </div>

      {/* Onboarding Funnel */}
      <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}` }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 20 }}>
          {t('Onboarding Funnel', 'مسار إلحاق الشركات')}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pipelineStages.map((stage, i) => (
            <React.Fragment key={stage.key}>
              <div
                style={{
                  flex: 1, textAlign: 'center', padding: '16px 8px', borderRadius: 12,
                  background: stage.bgColor, border: `2px solid ${stage.color}22`, cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => { setActiveTab('onboarding'); setStatusFilter(stage.key); }}
              >
                <div style={{ fontSize: 28, fontWeight: 700, color: stage.color }}>{stage.count}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: stage.color, marginTop: 4 }}>{stage.label}</div>
              </div>
              {i < pipelineStages.length - 1 && (
                <ChevronRight size={20} color={colors.textSecondary} style={{ flexShrink: 0, opacity: 0.4 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}` }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 16 }}>
          {t('Recent Activity', 'النشاط الأخير')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentActivity.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: colors.textSecondary, fontSize: 14 }}>
              {t('No activity yet — import NAFIS data to get started', 'لا يوجد نشاط بعد — قم باستيراد بيانات نافس للبدء')}
            </div>
          )}
          {recentActivity.map((item, i) => {
            const iconMap: Record<string, any> = {
              invitation: { Icon: Mail, color: colors.blueText },
              job: { Icon: Briefcase, color: colors.primary },
              flag: { Icon: AlertTriangle, color: colors.yellowText },
              contact: { Icon: Phone, color: colors.purpleText },
              success: { Icon: CheckCircle, color: colors.greenText },
            };
            const { Icon, color } = iconMap[item.type] || iconMap.contact;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < recentActivity.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <div style={{ padding: 8, borderRadius: 8, background: color + '15', flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ flex: 1, fontSize: 14, color: colors.text }}>{item.text}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, flexShrink: 0 }}>{item.time}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ═══════ COMPANY ONBOARDING TAB ═══════
  const renderOnboarding = () => {
    const onboardingCompanies = companies.filter(c => ['lead', 'contacted', 'documentation', 'verification'].includes(c.status));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Pipeline Stages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {pipelineStages.filter(s => s.key !== 'active').map(stage => (
            <div
              key={stage.key}
              onClick={() => setStatusFilter(statusFilter === stage.key ? 'all' : stage.key)}
              style={{
                background: colors.card, borderRadius: 16, padding: 20,
                border: statusFilter === stage.key ? `2px solid ${stage.color}` : `1px solid ${colors.border}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: stage.color }}>{stage.count}</div>
              <div style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{stage.label}</div>
            </div>
          ))}
        </div>

        {/* Pipeline Entries */}
        <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
              {t('Onboarding Pipeline', 'خط إلحاق الشركات')}
            </h3>
            <button
              onClick={() => setShowOnboardDialog(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                background: colors.primary, color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              {t('Register Company', 'تسجيل شركة')}
            </button>
          </div>

          {/* Filter/Search */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
              <input
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('Search companies...', 'البحث عن شركات...')}
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, outline: 'none', background: '#F8FAFC' }}
              />
            </div>
          </div>

          {/* Companies in Pipeline */}
          {(statusFilter !== 'all' ? onboardingCompanies.filter(c => c.status === statusFilter) : onboardingCompanies).map(company => (
            <div key={company.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12,
              border: `1px solid ${colors.border}`, marginBottom: 12, background: '#FAFBFC',
            }}>
              <div style={{ padding: 12, borderRadius: 12, background: colors.primaryLight, flexShrink: 0 }}>
                <Building2 size={20} color={colors.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: colors.text }}>{company.name}</span>
                  {company.leadSource === 'nafis_import' && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#DBEAFE', color: '#1D4ED8', letterSpacing: '0.03em' }}>NAFIS</span>
                  )}
                  {company.leadSource === 'magic_link' && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#FEF3C7', color: '#92400E', letterSpacing: '0.03em' }}>MAGIC LINK</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {company.industry || '—'} • {company.emirate || '—'} • {company.contactEmail || '—'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                {getStatusBadge(company.status)}
                <div style={{ display: 'flex', gap: 6 }}>
                  {company.tradeLicense ? (
                    <span style={{ fontSize: 11, color: colors.greenText, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircle size={12} /> {t('Trade License', 'رخصة تجارية')}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: colors.redText, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Clock size={12} /> {t('Trade License', 'رخصة تجارية')}
                    </span>
                  )}
                  {company.mohrRegistered ? (
                    <span style={{ fontSize: 11, color: colors.greenText, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircle size={12} /> {t('MoHR', 'الموارد البشرية')}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: colors.redText, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Clock size={12} /> {t('MoHR', 'الموارد البشرية')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {onboardingCompanies.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: colors.textSecondary }}>
              {t('No companies in the pipeline', 'لا توجد شركات في خط الإلحاق')}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═══════ EMPLOYER PARTNERSHIPS TAB ═══════
  const renderPartnerships = () => {
    const activePartners = companies.filter(c => c.status === 'active');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Search & Filters */}
        <div style={{ background: colors.card, borderRadius: 16, padding: 20, border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
              <input
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('Search active partners...', 'البحث عن شركاء نشطين...')}
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, outline: 'none', background: '#F8FAFC' }}
              />
            </div>
            <button style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: colors.textSecondary }}>
              <Download size={16} /> {t('Export', 'تصدير')}
            </button>
          </div>
        </div>

        {/* Partner Cards */}
        {activePartners.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(company => (
          <div key={company.id} style={{
            background: colors.card, borderRadius: 16, padding: 24,
            border: `1px solid ${colors.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ padding: 14, borderRadius: 14, background: colors.primaryLight }}>
                  <Building2 size={24} color={colors.primary} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>{company.name}</span>
                    {company.leadSource === 'nafis_import' && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#DBEAFE', color: '#1D4ED8' }}>NAFIS</span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                    {company.industry || '—'} • {company.size} {t('employees', 'موظف')} • {company.emirate || '—'}
                  </div>
                </div>
              </div>
              {/* Health Score */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: getHealthColor(company.healthScore) }}>{company.healthScore}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>{t('Health', 'الصحة')}</div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
              <div style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: '#F8FAFC' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{company.jobsPosted}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>{t('Jobs Posted', 'وظائف منشورة')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: '#F8FAFC' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{company.hiresCount}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>{t('Total Hires', 'إجمالي التوظيف')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: colors.primaryLight }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.primary }}>{company.emiratiHires}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>{t('Emirati Hires', 'توظيف إماراتي')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: company.emiratizationRate >= company.emiratizationTarget ? colors.greenBg : colors.redBg }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: company.emiratizationRate >= company.emiratizationTarget ? colors.greenText : colors.redText }}>
                  {company.emiratizationRate}%
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>{t('Emiratization', 'التوطين')}</div>
              </div>
            </div>

            {/* Contact Row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}`, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.textSecondary }}>
                <Mail size={14} /> {company.contactEmail || '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.textSecondary }}>
                <Phone size={14} /> {company.contactPhone || '—'}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: colors.textSecondary }}>
                {t('Registered:', 'تسجيل:')} {company.registeredAt ? new Date(company.registeredAt).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        ))}

        {activePartners.length === 0 && (
          <div style={{ background: colors.card, borderRadius: 16, padding: 60, textAlign: 'center', border: `1px solid ${colors.border}` }}>
            <Building2 size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <p style={{ marginTop: 16, color: colors.textSecondary }}>{t('No active partners yet', 'لا يوجد شركاء نشطون بعد')}</p>
          </div>
        )}
      </div>
    );
  };

  // ═══════ JOBS & EMIRATIZATION TAB ═══════
  const renderEmiratization = () => {
    const activeWithJobs = companies.filter(c => c.status === 'active');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <KPICard icon={Briefcase} label={t('Total Job Postings', 'إجمالي الوظائف المنشورة')} value={totalJobs} color={colors.primary} />
          <KPICard icon={Users} label={t('Total Hires', 'إجمالي التوظيف')} value={companies.reduce((s, c) => s + c.hiresCount, 0)} color={colors.blueText} />
          <KPICard icon={Award} label={t('Emirati Hires', 'توظيف إماراتيين')} value={companies.reduce((s, c) => s + c.emiratiHires, 0)} color={colors.accent} />
          <KPICard icon={AlertTriangle} label={t('Below Target', 'أقل من المستهدف')} value={belowTarget} color={belowTarget > 0 ? colors.redText : colors.greenText} />
        </div>

        {/* Compliance Table */}
        <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 20 }}>
            {t('Emiratization Compliance by Company', 'التزام التوطين حسب الشركة')}
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ textAlign: isRTL ? 'right' : 'left', padding: '12px 16px', color: colors.textSecondary, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>
                    {t('Company', 'الشركة')}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: colors.textSecondary, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>
                    {t('Jobs', 'وظائف')}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: colors.textSecondary, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>
                    {t('Total Hires', 'إجمالي التوظيف')}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: colors.textSecondary, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>
                    {t('Emirati Hires', 'توظيف إماراتي')}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: colors.textSecondary, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>
                    {t('Rate', 'النسبة')}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: colors.textSecondary, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>
                    {t('Target', 'المستهدف')}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: colors.textSecondary, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>
                    {t('Status', 'الحالة')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeWithJobs.map(company => {
                  const compliant = company.emiratizationRate >= company.emiratizationTarget;
                  return (
                    <tr key={company.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: colors.text }}>{company.name}</div>
                        <div style={{ fontSize: 12, color: colors.textSecondary }}>{company.emirate}</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: colors.text }}>{company.jobsPosted}</td>
                      <td style={{ textAlign: 'center', padding: '14px 16px', color: colors.text }}>{company.hiresCount}</td>
                      <td style={{ textAlign: 'center', padding: '14px 16px', color: colors.primary, fontWeight: 600 }}>{company.emiratiHires}</td>
                      <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: compliant ? colors.greenText : colors.redText }}>{company.emiratizationRate}%</span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 16px', color: colors.textSecondary }}>{company.emiratizationTarget}%</td>
                      <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                        {compliant ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: colors.greenBg, color: colors.greenText, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                            <CheckCircle size={12} /> {t('Compliant', 'ملتزم')}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: colors.redBg, color: colors.redText, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                            <AlertTriangle size={12} /> {t('Below', 'أقل')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ═══════ REPORTS TAB ═══════
  const renderReports = () => {
    // Industry breakdown
    const industryMap: Record<string, number> = {};
    companies.forEach(c => { industryMap[c.industry] = (industryMap[c.industry] || 0) + 1; });

    // Emirate breakdown
    const emirateMap: Record<string, number> = {};
    companies.forEach(c => { emirateMap[c.emirate] = (emirateMap[c.emirate] || 0) + 1; });

    const barColors = [colors.primary, colors.blueText, colors.accent, colors.purpleText, colors.greenText, colors.yellowText];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Conversion Funnel */}
        <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 20 }}>
            {t('Conversion Funnel', 'مسار التحويل')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pipelineStages.map((stage, i) => {
              const maxCount = Math.max(...pipelineStages.map(s => s.count), 1);
              const widthPct = (stage.count / maxCount) * 100;
              return (
                <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 120, fontSize: 13, fontWeight: 500, color: colors.textSecondary, textAlign: isRTL ? 'left' : 'right' }}>
                    {stage.label}
                  </div>
                  <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 8, height: 32, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(widthPct, 8)}%`, height: '100%', background: stage.color,
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'width 0.5s ease', minWidth: 40,
                    }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{stage.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Industry Breakdown */}
          <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 20 }}>
              {t('Industry Breakdown', 'توزيع القطاعات')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(industryMap).sort((a, b) => b[1] - a[1]).map(([industry, count], i) => (
                <div key={industry} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: barColors[i % barColors.length] }} />
                    <span style={{ fontSize: 14, color: colors.text }}>{industry}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emirate Distribution */}
          <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 20 }}>
              {t('Distribution by Emirate', 'التوزيع حسب الإمارة')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(emirateMap).sort((a, b) => b[1] - a[1]).map(([emirate, count], i) => (
                <div key={emirate} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MapPin size={14} color={barColors[i % barColors.length]} />
                    <span style={{ fontSize: 14, color: colors.text }}>{emirate}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ background: colors.card, borderRadius: 16, padding: 24, border: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 20 }}>
            {t('Key Metrics Summary', 'ملخص المؤشرات الرئيسية')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 20, background: '#F8FAFC', borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.primary }}>{totalCompanies}</div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{t('Total Registered', 'إجمالي المسجلين')}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 20, background: '#F8FAFC', borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.greenText }}>
                {totalCompanies > 0 ? ((activeCompanies / totalCompanies) * 100).toFixed(0) : 0}%
              </div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{t('Activation Rate', 'معدل التفعيل')}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 20, background: '#F8FAFC', borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>{avgEmiratization}%</div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{t('Avg. Emiratization', 'متوسط التوطين')}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 20, background: '#F8FAFC', borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.blueText }}>{totalJobs}</div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{t('Jobs Created', 'وظائف أنشئت')}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════ WORKSPACES TAB ═══════
  const WorkspacesTab = () => {
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [allCompanies, setAllCompanies] = useState<any[]>([]);
    const [wsLoading, setWsLoading] = useState(true);
    const [showProvisionModal, setShowProvisionModal] = useState(false);
    const [provisionCompanyId, setProvisionCompanyId] = useState('');
    const [provisioning, setProvisioning] = useState(false);
    const [wsSearch, setWsSearch] = useState('');

    useEffect(() => {
      async function load() {
        try {
          const [wsRes, compRes] = await Promise.allSettled([
            restClient.get('/api/workspace/list'),
            restClient.get('/api/growth-operator/companies'),
          ]);
          if (wsRes.status === 'fulfilled') setWorkspaces((wsRes.value as any).data.workspaces || []);
          if (compRes.status === 'fulfilled') {
            const comps = (compRes.value as any).data.companies || (compRes.value as any).data || [];
            setAllCompanies(Array.isArray(comps) ? comps : []);
          }
        } catch (err) { console.error(err); }
        finally { setWsLoading(false); }
      }
      load();
    }, []);

    const handleProvision = async () => {
      if (!provisionCompanyId) return;
      setProvisioning(true);
      try {
        await restClient.post('/api/workspace/provision', { company_id: provisionCompanyId });
        // Reload workspaces
        const res = await restClient.get('/api/workspace/list');
        setWorkspaces((res as any).data.workspaces || []);
        setShowProvisionModal(false); setProvisionCompanyId('');
      } catch (err) { console.error('Provision error:', err); }
      finally { setProvisioning(false); }
    };

    const unprovisionedCompanies = allCompanies.filter(
      c => !workspaces.some(w => w.id === c.id || w.id === c.company_id)
    );

    const filteredWorkspaces = workspaces.filter(w =>
      !wsSearch || w.company_name?.toLowerCase().includes(wsSearch.toLowerCase())
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <KPICard icon={ShieldCheck} label={t('Provisioned Workspaces', 'مساحات عمل مفعلة')} value={workspaces.length} color={colors.primary} />
          <KPICard icon={Users} label={t('Total Workspace Employees', 'إجمالي موظفي مساحات العمل')} value={workspaces.reduce((s: number, w: any) => s + (w.employee_count || 0), 0)} color={colors.blueText} />
          <KPICard icon={Building} label={t('Companies Ready', 'شركات جاهزة')} value={unprovisionedCompanies.length} color={colors.yellowText} subtext={t('Not yet provisioned', 'لم يتم تفعيلها بعد')} />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
            <input
              value={wsSearch} onChange={e => setWsSearch(e.target.value)}
              placeholder={t('Search workspaces...', 'البحث في مساحات العمل...')}
              style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, outline: 'none', background: '#F8FAFC' }}
            />
          </div>
          <button
            onClick={() => setShowProvisionModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
              background: colors.primary, color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            {t('Provision Workspace', 'تفعيل مساحة عمل')}
          </button>
        </div>

        {/* Workspace Cards */}
        {wsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <RefreshCw size={24} color={colors.primary} className="animate-spin" />
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div style={{ background: colors.card, borderRadius: 16, padding: 60, textAlign: 'center', border: `1px solid ${colors.border}` }}>
            <ShieldCheck size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <p style={{ marginTop: 16, color: colors.textSecondary }}>{t('No workspaces provisioned yet', 'لم يتم تفعيل مساحات عمل بعد')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredWorkspaces.map((ws: any) => (
              <div key={ws.id} style={{
                background: colors.card, borderRadius: 14, padding: 20,
                border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onClick={() => navigate(`/workspace/${ws.id}/dashboard`)}
                onMouseEnter={e => (e.currentTarget.style.borderColor = colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = colors.border)}
              >
                <div style={{ padding: 12, borderRadius: 12, background: colors.primaryLight, flexShrink: 0 }}>
                  <Building2 size={22} color={colors.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: colors.text }}>{ws.company_name}</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                    {ws.industry || t('No industry', 'لا يوجد قطاع')}
                    {ws.workspace_slug && <span> · /{ws.workspace_slug}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colors.primary }}>{ws.employee_count || 0}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{t('Employees', 'موظفين')}</div>
                  </div>
                  {ws.admin_name && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{ws.admin_name}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary }}>{t('Admin', 'المسؤول')}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>
                    {ws.provisioned_at ? new Date(ws.provisioned_at).toLocaleDateString() : ''}
                  </div>
                  <ChevronRight size={18} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Provision Modal */}
        {showProvisionModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: colors.card, borderRadius: 20, padding: 32, maxWidth: 500, width: '90%' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                {t('Provision Workspace', 'تفعيل مساحة عمل')}
              </h2>
              <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                {t('Select a company to enable their workspace with employee management and resource assignment capabilities.', 'اختر شركة لتفعيل مساحة عملها مع إمكانيات إدارة الموظفين وتعيين الموارد.')}
              </p>

              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>
                {t('Company', 'الشركة')}
              </label>
              <select
                value={provisionCompanyId}
                onChange={e => setProvisionCompanyId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, background: '#F8FAFC', marginBottom: 20 }}
              >
                <option value="">{t('Select a company...', 'اختر شركة...')}</option>
                {unprovisionedCompanies.map((c: any) => (
                  <option key={c.id || c.company_id} value={c.id || c.company_id}>
                    {c.company_name || c.name} — {c.industry || t('No industry', 'لا يوجد قطاع')}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => { setShowProvisionModal(false); setProvisionCompanyId(''); }}
                  style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.card, cursor: 'pointer', fontSize: 14, color: colors.textSecondary }}
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  onClick={handleProvision}
                  disabled={!provisionCompanyId || provisioning}
                  style={{
                    padding: '10px 24px', borderRadius: 10, border: 'none', background: colors.primary,
                    color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    opacity: (!provisionCompanyId || provisioning) ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {provisioning ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {provisioning ? t('Provisioning...', 'جاري التفعيل...') : t('Provision', 'تفعيل')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════ MAIN RENDER ═══════
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, direction: isRTL ? 'rtl' : 'ltr' }}>
      <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 24px 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 14, background: colors.primaryLight }}>
              <Building2 size={28} color={colors.primary} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0, fontFamily: isRTL ? 'inherit' : "'Inter', sans-serif" }}>
                {t('Private Sector Growth', 'نمو القطاع الخاص')}
              </h1>
              <p style={{ fontSize: 15, color: colors.textSecondary, margin: '4px 0 0' }}>
                {t('Onboard companies, manage partnerships, and drive Emiratization', 'إلحاق الشركات وإدارة الشراكات وتعزيز التوطين')}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28, background: colors.card, padding: 4,
          borderRadius: 14, border: `1px solid ${colors.border}`, overflowX: 'auto',
        }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setStatusFilter('all'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                  borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: 14, fontWeight: isActive ? 600 : 500, transition: 'all 0.2s',
                  background: isActive ? colors.primary : 'transparent',
                  color: isActive ? '#fff' : colors.textSecondary,
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'onboarding' && renderOnboarding()}
        {activeTab === 'partnerships' && renderPartnerships()}
        {activeTab === 'workspaces' && <WorkspacesTab />}
        {activeTab === 'emiratization' && renderEmiratization()}
        {activeTab === 'nafis' && <NafisVacancyImport t={t} isRTL={isRTL} />}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'messages' && <Messages senderRole="growth_operator" />}
      </main>

      {/* Onboard Company Dialog */}
      {showOnboardDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: colors.card, borderRadius: 20, padding: 32, maxWidth: 600,
            width: '90%', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
              {t('Register New Company', 'تسجيل شركة جديدة')}
            </h2>
            <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
              {t('Add a private sector company to the onboarding pipeline', 'إضافة شركة من القطاع الخاص إلى خط الإلحاق')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: t('Company Name (EN)', 'اسم الشركة (إنجليزي)'), placeholder: 'Emirates Tech LLC' },
                { label: t('Company Name (AR)', 'اسم الشركة (عربي)'), placeholder: 'الإمارات للتكنولوجيا' },
                { label: t('Industry', 'القطاع'), placeholder: t('Select industry', 'اختر القطاع'), type: 'select' },
                { label: t('Company Size', 'حجم الشركة'), placeholder: t('Select size', 'اختر الحجم'), type: 'select' },
                { label: t('Emirate', 'الإمارة'), placeholder: t('Select emirate', 'اختر الإمارة'), type: 'select' },
                { label: t('Trade License No.', 'رقم الرخصة التجارية'), placeholder: 'TL-2026-XXXXX' },
                { label: t('Contact Person', 'شخص التواصل'), placeholder: t('Full name', 'الاسم الكامل') },
                { label: t('Contact Email', 'البريد الإلكتروني'), placeholder: 'email@company.ae' },
                { label: t('Contact Phone', 'رقم الهاتف'), placeholder: '+971 5X XXX XXXX' },
                { label: t('Website', 'الموقع الإلكتروني'), placeholder: 'https://www.company.ae' },
              ].map((field, i) => (
                <div key={i} style={{ gridColumn: i >= 8 ? '1 / -1' : undefined }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>{field.label}</label>
                  <input
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: `1px solid ${colors.border}`, fontSize: 14, outline: 'none',
                      background: '#F8FAFC',
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
              <button
                onClick={() => setShowOnboardDialog(false)}
                style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.card, cursor: 'pointer', fontSize: 14, color: colors.textSecondary }}
              >
                {t('Cancel', 'إلغاء')}
              </button>
              <button
                onClick={() => setShowOnboardDialog(false)}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: colors.primary, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} />
                  {t('Register Company', 'تسجيل الشركة')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthOperatorDashboard;
