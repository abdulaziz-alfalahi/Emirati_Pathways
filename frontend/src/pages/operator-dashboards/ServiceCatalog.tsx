import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
  serviceGroups, allServices, serviceStats, ServiceItem, ServiceGroup,
  allRoles, roleServiceMap, roleLabels, aiModelCount,
} from '@/data/serviceCatalogData';

/* ─── SVG Icon Components (replace emojis that don't render in Docker) ─── */
const SvgIcon: React.FC<{ d: string; color: string; size?: number }> = ({ d, color, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IconClipboard: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <SvgIcon d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" color={color} size={size} />
);
const IconCheck: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const IconAlert: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);
const IconCircle: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill={color} stroke="none">
    <circle cx="12" cy="12" r="10" />
  </svg>
);
const IconFolder: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <SvgIcon d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" color={color} size={size} />
);
const IconSparkle: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <SvgIcon d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" color={color} size={size} />
);
const IconCpu: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" />
    <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
    <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
  </svg>
);
const IconUsers: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconChart: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
  </svg>
);
const IconShuffle: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
    <path d="m18 2 4 4-4 4" /><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
    <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" /><path d="m18 14 4 4-4 4" />
  </svg>
);

/* ─── Constants ──────────────────────────────────────────────────── */
/* groupNameEN map removed — now using g.nameEN from JSON */

const statusMeta: Record<string, { color: string; bg: string; labelEN: string; labelAR: string }> = {
  active:     { color: '#059669', bg: '#d1fae5', labelEN: 'Active',     labelAR: 'مفعّل' },
  partial:    { color: '#d97706', bg: '#fef3c7', labelEN: 'Partial',    labelAR: 'جزئي' },
  gap:        { color: '#dc2626', bg: '#fee2e2', labelEN: 'Gap',        labelAR: 'فجوة' },
  correction: { color: '#7c3aed', bg: '#ede9fe', labelEN: 'Correction', labelAR: 'تصحيح' },
};

/* Platform design tokens */
const TEAL = '#006E6D';
const TEAL_LIGHT = '#ecfdf5';
const TEAL_600 = '#059669';

const tabDefs = [
  { key: 'overview',  en: 'Overview',                           ar: 'نظرة عامة' },
  { key: 'services',  en: 'Service Cards',                      ar: 'بطاقات الخدمات' },
  { key: 'roles',     en: 'Roles & Responsibilities',           ar: 'الأدوار والمسؤوليات' },
  { key: 'gap',       en: 'Mapping Matrix & Gap Analysis',      ar: 'مصفوفة الربط وتحليل الفجوات' },
] as const;

type TabKey = typeof tabDefs[number]['key'];

const consolidations = [
  { title: 'Career Hub', titleAR: 'مركز المسار المهني', canonical: '/career-hub', routes: ['/career-advisory', '/career-simulator', '/industry-exploration', '/career-planning-hub'] },
  { title: 'Credentials Center', titleAR: 'مركز الاعتمادات', canonical: '/credentials', routes: ['/career-passport', '/blockchain-credentials', '/professional-certifications'] },
  { title: 'Communities', titleAR: 'المجتمعات', canonical: '/communities', routes: ['/thought-leadership', '/share-success-stories'] },
  { title: 'Profile Studio', titleAR: 'استوديو الملف الشخصي', canonical: '/candidate/profile/*', routes: ['/cv-builder', '/resume-builder'] },
  { title: 'Government Dashboard', titleAR: 'اللوحة الحكومية', canonical: '/government-dashboard', routes: ['/emiratization-tracker'] },
];

/* ─── Helper Components ──────────────────────────────────────────── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10, padding: '6px 0', borderBottom: '2px solid #e2e8f0' }}>{title}</div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, marginTop: 3, whiteSpace: 'pre-line' }}>{value}</div>
    </div>
  );
};

const StatCard: React.FC<{ value: number | string; label: string; color: string; iconEl?: React.ReactNode; small?: boolean; border?: string }> = ({ value, label, color, iconEl, small, border }) => (
  <div style={{
    background: '#fff', border: `1px solid ${border || '#e2e8f0'}`, borderRadius: 12,
    padding: small ? '14px 18px' : '18px 22px', flex: 1, minWidth: small ? 140 : 180,
    display: 'flex', flexDirection: 'column', gap: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: small ? 11 : 12, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
        <span style={{ fontSize: small ? 24 : 32, fontWeight: 800, color: '#0f172a' }}>{value}</span>
      </div>
      {iconEl && <div style={{ padding: small ? 8 : 10, background: `${color}12`, borderRadius: 12 }}>{iconEl}</div>}
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────── */
const ServiceCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  /** Translate a data field: given AR value and its EN counterpart */
  const tf = (ar: string, en: string) => isRTL ? ar : (en || ar);
  const gn = (g: ServiceGroup) => isRTL ? g.name : (g.nameEN || g.name);
  const sn = (s: ServiceItem) => tf(s.name, s.nameEN);
  const sd = (s: ServiceItem) => tf(s.description, s.descriptionEN);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  /* ─── Filtered services for Tab 2 ───── */
  const filteredServices = useMemo(() => {
    let list = selectedGroup ? allServices.filter(s => s.groupCode === selectedGroup) : allServices;
    if (statusFilter === 'new') list = list.filter(s => s.isNew);
    else if (statusFilter === 'correction') list = list.filter(s => s.isCorrection);
    else if (statusFilter !== 'all') list = list.filter(s => s.platformStatus === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.includes(q) || s.nameEN?.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.description.includes(q) || s.descriptionEN?.toLowerCase().includes(q));
    }
    return list;
  }, [selectedGroup, statusFilter, searchQuery]);

  const sortedGroups = useMemo(() =>
    [...serviceGroups].sort((a, b) => b.services.length - a.services.length), []
  );

  const groupByCode = (code: string) => serviceGroups.find(g => g.code === code);
  const gc = (s: ServiceItem) => groupByCode(s.groupCode)?.color || '#64748b';
  const sm = (s: ServiceItem) => statusMeta[s.platformStatus] || statusMeta.active;
  const coverageRate = ((serviceStats.activeServices / serviceStats.totalServices) * 100).toFixed(1);

  /* ─── RENDER ────────────────────────────────────────────────────── */
  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr', fontFamily: 'Dubai, Inter, system-ui, sans-serif', background: '#FAFBFC', minHeight: '100vh', textAlign: isRTL ? 'right' : 'left' }}>
      {/* ─── Header ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1400, margin: '0 auto' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            {isRTL ? '→' : '←'} {t('Back to Platform', 'العودة للمنصة')}
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{t('EHRDC Service Catalog', 'دليل خدمات منصة تنمية الموارد البشرية')}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{t('Emirati Human Resources Development Council', 'مجلس تنمية الموارد البشرية الإماراتية')}</div>
          </div>
          <button onClick={toggleLanguage} style={{ background: TEAL_LIGHT, color: TEAL, border: `1px solid ${TEAL}30`, borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = TEAL_LIGHT; e.currentTarget.style.color = TEAL; }}
          >
            {isRTL ? 'EN' : 'عربي'}
          </button>
        </div>
      </div>

      {/* ─── Tab Bar (matches platform white tab style) ─── */}
      <div style={{ background: '#fff', padding: '8px 28px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 4, maxWidth: 1400, margin: '0 auto', overflowX: 'auto' }}>
          {tabDefs.map(td => (
            <button key={td.key} onClick={() => setActiveTab(td.key)}
              style={{
                background: activeTab === td.key ? TEAL_LIGHT : 'transparent',
                color: activeTab === td.key ? TEAL : '#64748b',
                border: 'none', borderBottom: activeTab === td.key ? `2px solid ${TEAL}` : '2px solid transparent',
                padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === td.key ? 700 : 500,
                whiteSpace: 'nowrap', transition: 'all 0.15s', borderRadius: '8px 8px 0 0',
              }}
              onMouseEnter={e => { if (activeTab !== td.key) { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = '#f8fafc'; } }}
              onMouseLeave={e => { if (activeTab !== td.key) { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; } }}
            >
              {t(td.en, td.ar)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px' }}>

        {/* ═══════════════ TAB 1: OVERVIEW ═══════════════ */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Hero Stats */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <StatCard value={serviceStats.totalServices} label={t('Total Services', 'إجمالي الخدمات')} color=TEAL iconEl={<IconClipboard color=TEAL size={28} />} />
              <StatCard value={serviceStats.activeServices} label={t('Active on Platform', 'مفعّلة على المنصة')} color="#059669" iconEl={<IconCheck color="#059669" size={28} />} />
              <StatCard value={serviceStats.partialServices} label={t('Partial Coverage', 'تغطية جزئية')} color="#d97706" iconEl={<IconAlert color="#d97706" size={28} />} />
              <StatCard value={serviceStats.gapServices} label={t('Gap (Needs Dev)', 'فجوة (تحتاج تطوير)')} color="#dc2626" iconEl={<IconCircle color="#dc2626" size={28} />} />
            </div>

            {/* Secondary Stats */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
              <StatCard small value={serviceStats.totalGroups} label={t('Service Groups', 'مجموعات الخدمات')} color="#6366f1" iconEl={<IconFolder color="#6366f1" size={22} />} />
              <StatCard small value={serviceStats.newServices} label={t('New Services', 'خدمات جديدة')} color="#0d9488" iconEl={<IconSparkle color="#0d9488" size={22} />} />
              <StatCard small value={aiModelCount} label={t('AI Models', 'نماذج ذكاء اصطناعي')} color="#9333ea" iconEl={<IconCpu color="#9333ea" size={22} />} />
              <StatCard small value={allRoles.length} label={t('Platform Roles', 'أدوار المنصة')} color=TEAL iconEl={<IconUsers color=TEAL size={22} />} />
            </div>

            {/* Coverage Donut + Group Bar Chart side by side */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
              {/* Donut Chart */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, flex: '1 1 300px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{t('Service Coverage', 'تغطية الخدمات')}</div>
                <div style={{
                  width: 200, height: 200, borderRadius: '50%', margin: '0 auto',
                  background: `conic-gradient(#059669 0deg ${(serviceStats.activeServices / serviceStats.totalServices) * 360}deg, #d97706 ${(serviceStats.activeServices / serviceStats.totalServices) * 360}deg ${((serviceStats.activeServices + serviceStats.partialServices) / serviceStats.totalServices) * 360}deg, #dc2626 ${((serviceStats.activeServices + serviceStats.partialServices) / serviceStats.totalServices) * 360}deg 360deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}>
                  <div style={{ width: 130, height: 130, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>{coverageRate}%</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{t('Coverage', 'التغطية')}</span>
                  </div>
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                  {[{ l: t('Active', 'مفعّل'), c: '#059669', v: serviceStats.activeServices }, { l: t('Partial', 'جزئي'), c: '#d97706', v: serviceStats.partialServices }, { l: t('Gap', 'فجوة'), c: '#dc2626', v: serviceStats.gapServices }].map(x => (
                    <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: x.c }} />
                      <span style={{ color: '#64748b' }}>{x.l} ({x.v})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizontal Bar Chart */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, flex: '2 1 500px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{t('Services per Group', 'الخدمات حسب المجموعة')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sortedGroups.map(g => {
                    const maxCount = Math.max(...serviceGroups.map(x => x.services.length));
                    return (
                      <div key={g.code} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 160, fontSize: 12, color: '#334155', fontWeight: 500, textAlign: isRTL ? 'right' : 'left', flexShrink: 0 }}>
                          {gn(g)}
                        </div>
                        <div style={{ flex: 1, height: 22, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{
                            width: `${(g.services.length / maxCount) * 100}%`, height: '100%',
                            background: g.color, borderRadius: 6, transition: 'width 0.5s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingInlineEnd: 8,
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{g.services.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Key Findings */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 250, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, borderTop: '4px solid #059669' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><IconChart color="#059669" size={18} /> {t('Coverage Rate', 'معدل التغطية')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginBottom: 8 }}>{coverageRate}%</div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                  <div style={{ width: `${coverageRate}%`, height: '100%', background: '#059669', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{t(`${serviceStats.activeServices} of ${serviceStats.totalServices} services fully active`, `${serviceStats.activeServices} من ${serviceStats.totalServices} خدمة مفعّلة بالكامل`)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 250, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, borderTop: '4px solid #6366f1' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><IconShuffle color="#6366f1" size={18} /> {t('IA Consolidation', 'الدمج والتوحيد')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#6366f1', marginBottom: 8 }}>5</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{t('Major route consolidations unifying 12+ paths into 5 canonical pages', 'عمليات دمج رئيسية توحّد 12+ مساراً في 5 صفحات أساسية')}</div>
              </div>
              <div style={{ flex: 1, minWidth: 250, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, borderTop: '4px solid #9333ea' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><IconCpu color="#9333ea" size={18} /> {t('AI Integration', 'تكامل الذكاء الاصطناعي')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#9333ea', marginBottom: 8 }}>{aiModelCount}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{t('AI models powering platform intelligence across services', 'نموذج ذكاء اصطناعي يعمل عبر خدمات المنصة')}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB 2: SERVICE CARDS ═══════════════ */}
        {activeTab === 'services' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Mini stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <StatCard small value={serviceStats.totalServices} label={t('Total', 'الإجمالي')} color=TEAL />
              <StatCard small value={serviceStats.activeServices} label={t('Active', 'مفعّل')} color="#059669" />
              <StatCard small value={serviceStats.partialServices} label={t('Partial', 'جزئي')} color="#d97706" />
              <StatCard small value={serviceStats.gapServices} label={t('Gap', 'فجوة')} color="#dc2626" />
            </div>

            {/* Filter bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { key: 'all', en: 'All', ar: 'الكل' },
                { key: 'active', en: 'Active', ar: 'مفعّل' },
                { key: 'partial', en: 'Partial', ar: 'جزئي' },
                { key: 'gap', en: 'Gap', ar: 'فجوة' },
                { key: 'new', en: 'New', ar: 'جديد' },
                { key: 'correction', en: 'Correction', ar: 'تصحيح' },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: statusFilter === f.key ? TEAL : '#fff',
                    color: statusFilter === f.key ? '#fff' : '#64748b',
                  }}>{t(f.en, f.ar)}</button>
              ))}
              <input placeholder={t('Search services...', 'بحث في الخدمات...')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, flex: '1 1 200px', minWidth: 200 }} />
            </div>

            {/* Sidebar + Grid */}
            <div style={{ display: 'flex', gap: 20 }}>
              {/* Sidebar */}
              <div style={{ width: 250, flexShrink: 0 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
                    {t('SERVICE GROUPS', 'مجموعات الخدمات')}
                  </div>
                  <div onClick={() => setSelectedGroup(null)}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: selectedGroup === null ? 700 : 500, background: selectedGroup === null ? TEAL_LIGHT : 'transparent', color: selectedGroup === null ? TEAL : '#334155', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('All Services', 'جميع الخدمات')}</span>
                    <span style={{ fontSize: 11, background: '#e2e8f0', borderRadius: 10, padding: '2px 8px' }}>{allServices.length}</span>
                  </div>
                  {serviceGroups.map(g => (
                    <div key={g.code} onClick={() => setSelectedGroup(g.code)}
                      style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: selectedGroup === g.code ? 700 : 400, background: selectedGroup === g.code ? `${g.color}10` : 'transparent', color: selectedGroup === g.code ? g.color : '#334155', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gn(g)}</span>
                      </div>
                      <span style={{ fontSize: 10, background: `${g.color}18`, color: g.color, borderRadius: 10, padding: '2px 7px', fontWeight: 700, flexShrink: 0 }}>{g.services.length}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{t(`Showing ${filteredServices.length} services`, `عرض ${filteredServices.length} خدمة`)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320, 1fr))', gap: 14 }}>
                  {filteredServices.map(s => {
                    const grp = groupByCode(s.groupCode);
                    const color = grp?.color || '#64748b';
                    const st = sm(s);
                    return (
                      <div key={s.code} onClick={() => setSelectedService(s)}
                        style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.15s', borderTop: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}12`, borderRadius: 6, padding: '3px 8px' }}>{s.code}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 10, padding: '2px 8px' }}>{isRTL ? st.labelAR : st.labelEN}</span>
                          {s.isNew && <span style={{ fontSize: 10, fontWeight: 700, color: '#0d9488', background: '#ccfbf1', borderRadius: 10, padding: '2px 8px' }}>{t('New', 'جديد')}</span>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6, lineHeight: 1.5 }}>{sn(s)}</div>
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sd(s)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 11, color: '#94a3b8' }}>
                          <span><IconUsers color="#94a3b8" size={14} /> {s.platformRoles?.length || 0} {t('roles', 'أدوار')}</span>
                          {s.aiModel && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconCpu color="#94a3b8" size={14} /> {t('AI', 'ذكاء اصطناعي')}</span>}
                          <span style={{ marginInlineStart: 'auto', fontSize: 11, color: '#94a3b8' }}>{t('View details →', 'عرض التفاصيل ←')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detail Drawer */}
            {selectedService && (() => {
              const s = selectedService;
              const grp = groupByCode(s.groupCode);
              const color = grp?.color || '#64748b';
              const st = sm(s);
              return (
                <>
                  <div onClick={() => setSelectedService(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, animation: 'fadeIn 0.2s' }} />
                  <div style={{
                    position: 'fixed', top: 0, [isRTL ? 'left' : 'right']: 0, width: 560, maxWidth: '90vw', height: '100vh', background: '#fff', zIndex: 1001, overflowY: 'auto',
                    boxShadow: '-8px 0 30px rgba(0,0,0,0.12)', animation: isRTL ? 'slideInLeft 0.3s' : 'slideInRight 0.3s',
                  }}>
                    {/* Drawer header */}
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: `${color}08`, position: 'sticky', top: 0, zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color, background: `${color}15`, borderRadius: 8, padding: '4px 10px' }}>{s.code}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 10, padding: '3px 10px' }}>{isRTL ? st.labelAR : st.labelEN}</span>
                          {s.isNew && <span style={{ fontSize: 10, fontWeight: 700, color: '#0d9488', background: '#ccfbf1', borderRadius: 10, padding: '2px 8px' }}>{t('New', 'جديد')}</span>}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.5 }}>{sn(s)}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{tf(s.group, serviceGroups.find(g => g.code === s.groupCode)?.nameEN || s.group)}</div>
                      </div>
                      <button onClick={() => setSelectedService(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                    <div style={{ padding: '20px 24px 40px' }}>
                      <Section title={t('Overview', 'نظرة عامة')}>
                        <Field label={t('Description', 'الوصف')} value={tf(s.description, s.descriptionEN)} />
                        <Field label={t('Goal', 'الهدف')} value={tf(s.goal, s.goalEN)} />
                      </Section>
                      <Section title={t('Target & Requirements', 'الفئة المستهدفة والمتطلبات')}>
                        <Field label={t('Target Audience', 'الفئة المستهدفة')} value={tf(s.target, s.targetEN)} />
                        <Field label={t('Conditions', 'الشروط')} value={tf(s.conditions, s.conditionsEN)} />
                        <Field label={t('Required Documents', 'المستندات المطلوبة')} value={tf(s.documents, s.documentsEN)} />
                      </Section>
                      {s.steps?.length > 0 && (
                        <Section title={t('Steps', 'الخطوات')}>
                          {(isRTL ? s.steps : (s.stepsEN || s.steps)).map((step, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < s.steps.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}15`, color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
                            </div>
                          ))}
                        </Section>
                      )}
                      <Section title={t('Delivery', 'آلية التقديم')}>
                        <Field label={t('Channels', 'القنوات')} value={tf(s.channels, s.channelsEN)} />
                        <Field label={t('Duration', 'المدة')} value={tf(s.duration, s.durationEN)} />
                        <Field label={t('Fees', 'الرسوم')} value={tf(s.fees, s.feesEN)} />
                      </Section>
                      <Section title={t('Outcomes', 'المخرجات')}>
                        <Field label={t('Outputs', 'المخرجات')} value={tf(s.outputs, s.outputsEN)} />
                        <Field label={t('Limitations', 'القيود')} value={tf(s.limitations, s.limitationsEN)} />
                      </Section>
                      <Section title={t('Stakeholders', 'أصحاب المصلحة')}>
                        <Field label={t('Partners', 'الشركاء')} value={tf(s.partners, s.partnersEN)} />
                        <Field label={t('KPIs', 'مؤشرات الأداء')} value={tf(s.kpis, s.kpisEN)} />
                      </Section>
                      {/* AI & Intelligence */}
                      {s.aiModel && (
                        <Section title={t('AI & Intelligence', 'الذكاء الاصطناعي والتحليل')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10 }}>
                            <IconCpu color="#9333ea" size={28} />
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#9333ea' }}>{t('AI Model', 'النموذج الذكي')}</div>
                              <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{tf(s.aiModel, s.aiModelEN)}</div>
                            </div>
                          </div>
                        </Section>
                      )}
                      {/* Authorized Roles */}
                      {s.platformRoles?.length > 0 && (
                        <Section title={t('Authorized Roles', 'الأدوار المخوّلة')}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {s.platformRoles.map(r => {
                              const rl = roleLabels[r];
                              return (
                                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: TEAL_LIGHT, border: '1px solid #a7f3d0', borderRadius: 10, fontSize: 12, color: '' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: TEAL, color: '#fff', fontSize: 10, fontWeight: 700 }}>{(rl?.en || r).charAt(0)}</span>
                                  <span style={{ fontWeight: 600 }}>{rl ? t(rl.en, rl.ar) : r}</span>
                                </div>
                              );
                            })}
                          </div>
                        </Section>
                      )}
                      {/* Platform Integration */}
                      <Section title={t('Platform Integration', 'التكامل مع المنصة')}>
                        <div style={{ background: st.bg, border: `1px solid ${st.color}30`, borderRadius: 10, padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: st.color, boxShadow: `0 0 6px ${st.color}60` }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{isRTL ? st.labelAR : st.labelEN}</span>
                          </div>
                          {s.platformPath && <Field label={t('Path', 'مسار')} value={s.platformPath} />}
                          {s.relatedForms && <Field label={t('Related Forms', 'النماذج المرتبطة')} value={s.relatedForms} />}
                          {s.gapNotes && (
                            <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 6 }}>
                              <span style={{ fontWeight: 600 }}>{t('Notes:', 'ملاحظات:')}</span> {tf(s.gapNotes, s.gapNotesEN)}
                            </div>
                          )}
                        </div>
                      </Section>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ═══════════════ TAB 3: ROLES & RESPONSIBILITIES ═══════════════ */}
        {activeTab === 'roles' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{t('Platform Roles', 'أدوار المنصة')} ({allRoles.length})</div>

            {/* Role Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
              {allRoles.map(role => {
                const rl = roleLabels[role];
                const count = roleServiceMap[role]?.length || 0;
                const selected = selectedRole === role;
                return (
                  <div key={role} onClick={() => setSelectedRole(selected ? null : role)}
                    style={{
                      background: selected ? TEAL_LIGHT : '#fff', border: selected ? `2px solid ${TEAL}` : '1px solid #e2e8f0',
                      borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: TEAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 20, fontWeight: 800, color: TEAL }}>{(rl?.en || role).charAt(0)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{rl ? t(rl.en, rl.ar) : role}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 10, minHeight: 36 }}>{rl ? t(rl.descEN, rl.descAR) : ''}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, background: TEAL_LIGHT, borderRadius: 10, padding: '3px 10px' }}>{count} {t('services', 'خدمة')}</span>
                  </div>
                );
              })}
            </div>

            {/* Selected Role → Services */}
            {selectedRole && (() => {
              const rl = roleLabels[selectedRole];
              const services = roleServiceMap[selectedRole] || [];
              return (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '12px 18px', background: TEAL_LIGHT, borderRadius: 12, border: '1px solid #a7f3d0' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: TEAL_LIGHT, color: TEAL, fontSize: 16, fontWeight: 800 }}>{(rl?.en || selectedRole).charAt(0)}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: TEAL }}>{rl ? t(rl.en, rl.ar) : selectedRole}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{t(`${services.length} services accessible`, `${services.length} خدمة متاحة`)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {services.map(s => {
                      const grp = groupByCode(s.groupCode);
                      const st = sm(s);
                      return (
                        <div key={s.code} onClick={() => { setActiveTab('services'); setSelectedService(s); }}
                          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, cursor: 'pointer', borderInlineStart: `3px solid ${grp?.color || '#64748b'}` }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: grp?.color, background: `${grp?.color}12`, borderRadius: 6, padding: '2px 6px' }}>{s.code}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 8, padding: '2px 6px' }}>{isRTL ? st.labelAR : st.labelEN}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{sn(s)}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{tf(s.group, serviceGroups.find(g => g.code === s.groupCode)?.nameEN || s.group)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Role-Service Heatmap Matrix */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, overflowX: 'auto' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{t('Role-Service Access Matrix', 'مصفوفة وصول الأدوار للخدمات')}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, position: 'sticky', insetInlineStart: 0, background: '#fff', minWidth: 140 }}>{t('Role', 'الدور')}</th>
                    {serviceGroups.map(g => (
                      <th key={g.code} style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: g.color, fontWeight: 700, fontSize: 10, writingMode: 'vertical-rl', height: 80 }}>{g.code}</th>
                    ))}
                    <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>{t('Total', 'المجموع')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allRoles.map(role => {
                    const rl = roleLabels[role];
                    const roleSvcs = roleServiceMap[role] || [];
                    return (
                      <tr key={role} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#334155', position: 'sticky', insetInlineStart: 0, background: 'inherit', whiteSpace: 'nowrap' }}>
                          {(rl?.en || role).charAt(0)} {rl ? t(rl.en, rl.ar) : role}
                        </td>
                        {serviceGroups.map(g => {
                          const count = roleSvcs.filter(s => s.groupCode === g.code).length;
                          const opacity = count === 0 ? 0 : Math.min(0.15 + count * 0.25, 0.8);
                          return (
                            <td key={g.code} style={{ padding: 4, textAlign: 'center' }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 6, margin: '0 auto',
                                background: count > 0 ? g.color : '#f1f5f9', opacity: count > 0 ? opacity : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: count > 0 ? '#fff' : '#cbd5e1', fontWeight: 700, fontSize: 11,
                              }}>{count || '·'}</div>
                            </td>
                          );
                        })}
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: TEAL }}>{roleSvcs.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB 4: GAP ANALYSIS MATRIX ═══════════════ */}
        {activeTab === 'gap' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { label: t('Active', 'مفعّل'), value: serviceStats.activeServices, total: serviceStats.totalServices, color: '#059669' },
                { label: t('Partial', 'جزئي'), value: serviceStats.partialServices, total: serviceStats.totalServices, color: '#d97706' },
                { label: t('Gap', 'فجوة'), value: serviceStats.gapServices, total: serviceStats.totalServices, color: '#dc2626' },
              ].map(x => (
                <div key={x.label} style={{ flex: 1, minWidth: 200, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, borderInlineStart: `4px solid ${x.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{x.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: x.color, margin: '4px 0' }}>{x.value}</div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                    <div style={{ width: `${(x.value / x.total) * 100}%`, height: '100%', background: x.color, borderRadius: 3, minWidth: x.value > 0 ? 4 : 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{((x.value / x.total) * 100).toFixed(1)}% {t('of total', 'من الإجمالي')}</div>
                </div>
              ))}
            </div>

            {/* Service-Platform Mapping Table */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, overflowX: 'auto', marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>{t('Service-Platform Mapping', 'مصفوفة ربط الخدمات بالمنصة')}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Code', 'الرمز')}</th>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Service Name', 'اسم الخدمة')}</th>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Group', 'المجموعة')}</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Status', 'الحالة')}</th>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Platform Path', 'مسار المنصة')}</th>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Notes', 'ملاحظات')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allServices.map(s => {
                    const st = sm(s);
                    return (
                      <tr key={s.code} style={{ borderBottom: '1px solid #f1f5f9', background: `${st.bg}40` }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${st.bg}80`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${st.bg}40`; }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: groupByCode(s.groupCode)?.color }}>{s.code}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 500, color: '#0f172a', maxWidth: 200 }}>{sn(s)}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 11 }}>{tf(s.group, serviceGroups.find(g => g.code === s.groupCode)?.nameEN || s.group)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 10, padding: '3px 10px' }}>{isRTL ? st.labelAR : st.labelEN}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <code style={{ fontSize: 11, color: '#334155', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{s.platformPath}</code>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tf(s.gapNotes, s.gapNotesEN)}>{tf(s.gapNotes, s.gapNotesEN) || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* IA Consolidation Report */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><IconShuffle color="#6366f1" size={20} /> {t('IA Consolidation Report', 'تقرير الدمج والتوحيد')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {consolidations.map((c, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, borderTop: '3px solid #6366f1' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{t(c.title, c.titleAR)}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{t('Canonical route:', 'المسار الأساسي:')}</div>
                    <code style={{ fontSize: 12, color: '#059669', background: '#d1fae5', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{c.canonical}</code>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 12, marginBottom: 6 }}>{t('Merged routes:', 'المسارات المدمجة:')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.routes.map(r => (
                        <code key={r} style={{ fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, textDecoration: 'line-through' }}>{r}</code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Model Coverage */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><IconCpu color="#9333ea" size={20} /> {t('AI Model Coverage', 'تغطية نماذج الذكاء الاصطناعي')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 10 }}>
                {allServices.map(s => (
                  <div key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: s.aiModel ? '#faf5ff' : '#f8fafc', border: `1px solid ${s.aiModel ? '#e9d5ff' : '#e2e8f0'}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: groupByCode(s.groupCode)?.color, minWidth: 45 }}>{s.code}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sn(s)}</div>
                      <div style={{ fontSize: 11, color: s.aiModel ? '#9333ea' : '#cbd5e1', fontWeight: s.aiModel ? 500 : 400 }}>
                        {s.aiModel ? tf(s.aiModel, s.aiModelEN) : t('No AI model', 'لا يوجد نموذج ذكي')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Animations ─── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default ServiceCatalog;
