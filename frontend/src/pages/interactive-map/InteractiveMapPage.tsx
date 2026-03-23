
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
  MapPin, Briefcase, GraduationCap, Building2,
  ExternalLink, Loader2, Eye, List, Clock, DollarSign,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import { restClient } from '@/utils/api';

const brand = {
  primary: '#0D9488', primaryDark: '#0F766E', primarySurface: '#F0FDFA',
  border: '#E5E7EB', textPrimary: '#111827', textSecondary: '#6B7280',
  amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
  red: '#FEE2E2', redText: '#991B1B', blue: '#DBEAFE', blueText: '#1E40AF',
  purple: '#F3E8FF', purpleText: '#6B21A8',
};

const EMIRATE_DATA: { name: string; nameAr: string; cx: number; cy: number; radius: number }[] = [
  { name: 'Abu Dhabi', nameAr: 'أبوظبي', cx: 280, cy: 280, radius: 60 },
  { name: 'Dubai', nameAr: 'دبي', cx: 470, cy: 200, radius: 50 },
  { name: 'Sharjah', nameAr: 'الشارقة', cx: 500, cy: 160, radius: 40 },
  { name: 'Ajman', nameAr: 'عجمان', cx: 490, cy: 130, radius: 25 },
  { name: 'Umm Al Quwain', nameAr: 'أم القيوين', cx: 520, cy: 120, radius: 25 },
  { name: 'Ras Al Khaimah', nameAr: 'رأس الخيمة', cx: 540, cy: 80, radius: 30 },
  { name: 'Fujairah', nameAr: 'الفجيرة', cx: 580, cy: 140, radius: 30 },
];

const TYPE_STYLES: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  job: { bg: brand.green, color: brand.greenText, icon: <Briefcase size={12} /> },
  training: { bg: brand.purple, color: brand.purpleText, icon: <GraduationCap size={12} /> },
  internship: { bg: brand.blue, color: brand.blueText, icon: <Building2 size={12} /> },
};

interface MapLocation {
  id: number | string; title: string; titleAr?: string;
  type: 'job' | 'training' | 'internship'; emirate: string;
  company?: string; salary_range?: string; duration?: string;
}

const InteractiveMapPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [emirateFilter, setEmirateFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const [jobsRes, trainingRes] = await Promise.allSettled([
          restClient.get('/api/jobs/map-data'),
          restClient.get('/api/skills-development/training-programs'),
        ]);
        if (cancelled) return;
        const combinedLocations: MapLocation[] = [];
        if (jobsRes.status === 'fulfilled') {
          const jobs = (jobsRes.value as any).data?.jobs || (jobsRes.value as any).data?.data?.jobs || [];
          jobs.forEach((j: any) => combinedLocations.push({
            id: j.id, title: j.title || j.job_title, type: 'job',
            emirate: j.emirate || j.location || 'Dubai',
            company: j.company_name, salary_range: j.salary_range,
          }));
        }
        if (trainingRes.status === 'fulfilled') {
          const programs = (trainingRes.value as any).data?.data?.training_programs || [];
          programs.slice(0, 20).forEach((p: any, i: number) => combinedLocations.push({
            id: `tr-${i}`, title: p.title, type: 'training',
            emirate: p.location || 'Abu Dhabi', company: p.provider, duration: p.duration,
          }));
        }
        setLocations(combinedLocations);
      } catch (e) { console.warn('Map data API not available', e); }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filtered = locations
    .filter(l => !typeFilter || l.type === typeFilter)
    .filter(l => !emirateFilter || l.emirate === emirateFilter);

  const emirateCounts = EMIRATE_DATA.map(em => ({
    ...em,
    count: locations.filter(l => l.emirate === em.name).length,
  }));

  /* ─── Tab 1: Map View ─── */
  const mapTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('UAE Opportunity Map', 'خريطة الفرص في الإمارات')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Visualize career opportunities across all seven emirates. Larger circles indicate more available opportunities.',
          'تصوّر الفرص المهنية عبر الإمارات السبع. الدوائر الأكبر تشير إلى فرص أكثر.'
        )}
      </p>

      {/* SVG Map */}
      <div style={{ background: '#F9FAFB', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 16 }}>
        <svg viewBox="0 0 700 400" style={{ width: '100%', maxHeight: 360 }}>
          {/* Base map outline */}
          <path d="M100,350 L150,300 L200,320 L250,300 L300,350 L350,300 L400,280 L450,250 L500,200 L550,150 L600,100 L620,80 L640,120 L620,180 L600,220 L580,260 L550,280 L500,300 L450,320 L400,340 L350,360 L300,370 L250,360 L200,350 Z"
            fill={brand.primarySurface} stroke={brand.primary} strokeWidth={1.5} opacity={0.5} />

          {/* Emirate bubbles */}
          {emirateCounts.map((em, i) => {
            const bubbleRadius = Math.max(em.radius * 0.4, 15 + em.count * 2);
            const isActive = !emirateFilter || emirateFilter === em.name;
            return (
              <g key={i} style={{ cursor: 'pointer' }} onClick={() => setEmirateFilter(em.name === emirateFilter ? '' : em.name)}>
                <circle cx={em.cx} cy={em.cy} r={bubbleRadius}
                  fill={isActive ? brand.primary : '#D1D5DB'} opacity={isActive ? 0.2 : 0.1} />
                <circle cx={em.cx} cy={em.cy} r={bubbleRadius * 0.6}
                  fill={isActive ? brand.primary : '#9CA3AF'} opacity={isActive ? 0.4 : 0.2} />
                <circle cx={em.cx} cy={em.cy} r={8}
                  fill={isActive ? brand.primary : '#9CA3AF'} />
                <text x={em.cx} y={em.cy + bubbleRadius + 14} textAnchor="middle"
                  fontSize={11} fontWeight={600} fill={brand.textPrimary}>
                  {isRTL ? em.nameAr : em.name}
                </text>
                <text x={em.cx} y={em.cy + bubbleRadius + 26} textAnchor="middle"
                  fontSize={10} fill={brand.textSecondary}>
                  {em.count} {t('opportunities', 'فرص')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ textAlign: 'center', padding: '8px 16px', background: brand.primarySurface, borderRadius: 8, fontSize: 12, color: brand.primary }}>
        🔒 {t('User locations are not displayed to protect privacy.', 'لا يتم عرض مواقع المستخدمين لحماية الخصوصية.')}
      </div>
    </div>
  );

  /* ─── Tab 2: List View ─── */
  const listTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('All Opportunities', 'جميع الفرص')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>
        {t(`Showing ${filtered.length} opportunities. Filter by type or emirate.`, `عرض ${filtered.length} فرصة. فلتر حسب النوع أو الإمارة.`)}
      </p>

      {/* Type filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setTypeFilter('')} style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          background: !typeFilter ? brand.primary : '#fff', color: !typeFilter ? '#fff' : brand.textSecondary,
          border: !typeFilter ? 'none' : `1px solid ${brand.border}`, cursor: 'pointer',
        }}>{t('All Types', 'الكل')}</button>
        {Object.entries(TYPE_STYLES).map(([key, s]) => (
          <button key={key} onClick={() => setTypeFilter(key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: typeFilter === key ? brand.primary : '#fff', color: typeFilter === key ? '#fff' : brand.textSecondary,
            border: typeFilter === key ? 'none' : `1px solid ${brand.border}`, cursor: 'pointer',
          }}>{key}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.slice(0, 30).map((loc, i) => {
            const typeStyle = TYPE_STYLES[loc.type] || TYPE_STYLES.job;
            return (
              <div key={i} className="ep-card" style={{
                background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`,
                padding: 14, display: 'flex', alignItems: 'center', gap: 12,
                transition: 'box-shadow .2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: typeStyle.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeStyle.color, flexShrink: 0,
                }}>
                  {typeStyle.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loc.title}
                  </h4>
                  <div style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {loc.company && <span>{loc.company}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={10} /> {loc.emirate}</span>
                    {loc.salary_range && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><DollarSign size={10} /> {loc.salary_range}</span>}
                  </div>
                </div>
                <span style={{ background: typeStyle.bg, color: typeStyle.color, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>
                  {loc.type}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
              <MapPin size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>{t('No opportunities found for the selected filters.', 'لا توجد فرص للفلاتر المحددة.')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ─── Layout ─── */
  const stats = [
    { value: `${locations.filter(l => l.type === 'job').length}`, label: t('Jobs', 'وظائف'), icon: Briefcase },
    { value: `${locations.filter(l => l.type === 'training').length}`, label: t('Training', 'تدريب'), icon: GraduationCap },
    { value: `${locations.filter(l => l.type === 'internship').length}`, label: t('Internships', 'تدريب عملي'), icon: Building2 },
    { value: '7', label: t('Emirates', 'إمارات'), icon: MapPin },
  ];

  const tabs = [
    { id: 'map', label: t('Map View', 'عرض الخريطة'), icon: <Eye className="h-4 w-4" />, content: mapTab },
    { id: 'list', label: t('List View', 'عرض القائمة'), icon: <List className="h-4 w-4" />, content: listTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Interactive Map', 'الخريطة التفاعلية')}
      description={t(
        'Explore career opportunities — jobs, training, and internships — across all seven UAE emirates',
        'استكشف الفرص المهنية — الوظائف والتدريب والتدريب العملي — عبر إمارات الدولة السبع'
      )}
      icon={<MapPin className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="map"
    />
  );
};

export default InteractiveMapPage;
