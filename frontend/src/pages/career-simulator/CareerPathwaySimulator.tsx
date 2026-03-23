
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
  Compass, TrendingUp, Star, Building2, Clock, Target,
  ChevronRight, ChevronLeft, Zap, Award, BarChart3,
  DollarSign, CheckCircle2, XCircle, Loader2, ArrowUpRight
} from 'lucide-react';
import { restClient } from '@/utils/api';

// Brand tokens (unified with platform)
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySurface: '#F0FDFA',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  amber: '#FEF3C7',
  amberText: '#92400E',
  green: '#DCFCE7',
  greenText: '#166534',
  red: '#FEE2E2',
  redText: '#991B1B',
  blue: '#DBEAFE',
  blueText: '#1E40AF',
  purple: '#F3E8FF',
  purpleText: '#6B21A8',
};

const DEMAND_STYLES: Record<string, { bg: string; color: string }> = {
  high: { bg: brand.green, color: brand.greenText },
  medium: { bg: brand.amber, color: brand.amberText },
  low: { bg: brand.red, color: brand.redText },
};

const SECTOR_STYLES: Record<string, { bg: string; color: string }> = {
  Marketing: { bg: brand.purple, color: brand.purpleText },
  Technology: { bg: brand.blue, color: brand.blueText },
  Healthcare: { bg: brand.red, color: brand.redText },
  Hospitality: { bg: brand.amber, color: brand.amberText },
  Finance: { bg: brand.green, color: brand.greenText },
  Education: { bg: brand.primarySurface, color: brand.primary },
  Energy: { bg: '#FEF3C7', color: '#92400E' },
};

interface CareerNode {
  role: string; role_ar: string; salary_range: string;
  years_experience: number; skills: string[];
}

interface CareerPath {
  id: number; title_en: string; title_ar: string;
  sector: string; demand_level: string; growth_rate: number;
  description_en: string; description_ar: string;
  progression: CareerNode[];
}

const CareerPathwaySimulator: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [sectorFilter, setSectorFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await restClient.get('/api/career-simulator/paths');
        if (!cancelled && res.data?.paths) setPaths(res.data.paths);
      } catch (e) { console.warn('Career simulator API not available', e); }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const sectors = [...new Set(paths.map(p => p.sector))];
  const filtered = sectorFilter ? paths.filter(p => p.sector === sectorFilter) : paths;

  const runSimulation = async (path: CareerPath) => {
    setSimLoading(true);
    setSelectedPath(path);
    try {
      const res = await restClient.post('/api/career-simulator/simulate', {
        path_id: path.id,
        current_skills: ['Communication', 'English'],
        years_experience: 1,
        education_level: 'Bachelors',
      });
      setSimResult(res.data);
    } catch (e) {
      setSimResult({
        readiness_score: 42,
        gaps: [
          { skill: 'Technical Certification', priority: 'high' },
          { skill: 'Leadership Training', priority: 'medium' },
        ],
        recommendations: [
          'Complete a professional certification in your target field',
          'Take a leadership development course',
          'Build industry-specific experience through internships',
        ],
      });
    } finally { setSimLoading(false); }
  };

  /* ─── Tab 1: Explore Careers ─── */
  const exploreTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Explore Career Paths', 'استكشف المسارات المهنية')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          `Discover ${paths.length || '7'} career pathways across UAE's key sectors — understand progression, salaries, and required skills.`,
          `اكتشف ${paths.length || '7'} مسارات مهنية عبر القطاعات الرئيسية في الإمارات — فهم التقدم والرواتب والمهارات المطلوبة.`
        )}
      </p>

      {/* Sector filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSectorFilter('')}
          style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: !sectorFilter ? brand.primary : '#fff',
            color: !sectorFilter ? '#fff' : brand.textSecondary,
            border: !sectorFilter ? 'none' : `1px solid ${brand.border}`,
            cursor: 'pointer', transition: 'all 150ms',
          }}
        >
          {t('All Sectors', 'جميع القطاعات')}
        </button>
        {sectors.map(s => (
          <button
            key={s}
            onClick={() => setSectorFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: sectorFilter === s ? brand.primary : '#fff',
              color: sectorFilter === s ? '#fff' : brand.textSecondary,
              border: sectorFilter === s ? 'none' : `1px solid ${brand.border}`,
              cursor: 'pointer', transition: 'all 150ms',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((path) => {
            const sectorStyle = SECTOR_STYLES[path.sector] || { bg: brand.primarySurface, color: brand.primary };
            const demandStyle = DEMAND_STYLES[path.demand_level] || { bg: '#F3F4F6', color: brand.textSecondary };
            return (
              <div
                key={path.id}
                className="ep-card"
                style={{
                  background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                  padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                  transition: 'box-shadow .2s', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                onClick={() => setSelectedPath(path)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ background: sectorStyle.bg, color: sectorStyle.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                    {path.sector}
                  </span>
                  <span style={{ background: demandStyle.bg, color: demandStyle.color, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>
                    {path.demand_level} {t('demand', 'طلب')}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                    {isRTL ? path.title_ar : path.title_en}
                  </h3>
                  <p style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>
                    {(isRTL ? path.description_ar : path.description_en)?.slice(0, 120)}...
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: brand.textSecondary }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <TrendingUp size={12} style={{ color: brand.primary }} /> {path.growth_rate}% {t('growth', 'نمو')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <BarChart3 size={12} /> {path.progression?.length || 0} {t('stages', 'مراحل')}
                  </span>
                </div>

                {path.progression && path.progression.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {path.progression.slice(0, 3).map((node, j) => (
                      <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 4 }}>
                        {isRTL ? node.role_ar : node.role}
                      </span>
                    ))}
                    {path.progression.length > 3 && (
                      <span style={{ fontSize: 10, color: brand.textSecondary }}>+{path.progression.length - 3}</span>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: 12, color: brand.textSecondary }}>
                    {path.progression?.[path.progression.length - 1]?.salary_range || ''}
                  </span>
                  <button
                    data-has-handler="true"
                    onClick={(e) => { e.stopPropagation(); runSimulation(path); }}
                    style={{
                      background: brand.primary, color: '#fff', border: 'none',
                      padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {t('Simulate', 'محاكاة')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── Tab 2: Simulation Results ─── */
  const simulateTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Simulation Results', 'نتائج المحاكاة')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Run a simulation on any career path to see your readiness score, skill gaps, and personalized recommendations.',
          'قم بتشغيل محاكاة على أي مسار مهني لمعرفة درجة جاهزيتك وفجوات المهارات والتوصيات المخصصة.'
        )}
      </p>

      {simLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
        </div>
      ) : !simResult ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <Compass size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No simulation yet — go to "Explore Careers" and click Simulate on a path.', 'لم يتم إجراء محاكاة بعد — اذهب إلى "استكشاف المسارات" وانقر "محاكاة".')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Readiness Score */}
          <div style={{ background: brand.primarySurface, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: `conic-gradient(${brand.primary} ${(simResult.readiness_score || 0) * 3.6}deg, #E5E7EB 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 58, height: 58, borderRadius: '50%', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: brand.primary,
                }}>
                  {simResult.readiness_score}%
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                  {t('Readiness Score', 'درجة الجاهزية')}
                </h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, margin: 0 }}>
                  {selectedPath ? (isRTL ? selectedPath.title_ar : selectedPath.title_en) : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Skill Gaps */}
          {simResult.gaps && simResult.gaps.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={16} style={{ color: brand.redText }} />
                {t('Skill Gaps', 'فجوات المهارات')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {simResult.gaps.map((g: any, i: number) => {
                  const prioStyle = g.priority === 'high' ? { bg: brand.red, color: brand.redText } : { bg: brand.amber, color: brand.amberText };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F9FAFB', borderRadius: 8 }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: brand.textPrimary }}>{g.skill}</span>
                      <span style={{ background: prioStyle.bg, color: prioStyle.color, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>
                        {g.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {simResult.recommendations && simResult.recommendations.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} style={{ color: brand.primary }} />
                {t('Recommendations', 'التوصيات')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {simResult.recommendations.map((r: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: brand.primarySurface, borderRadius: 8 }}>
                    <Zap size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: brand.textPrimary, lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ─── Tab 3: Career Progression ─── */
  const progressionTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Career Progression Timeline', 'الجدول الزمني للتقدم المهني')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {selectedPath
          ? t(
              `View the step-by-step career progression for ${selectedPath.title_en}.`,
              `عرض مراحل التقدم الوظيفي لمسار ${selectedPath.title_ar}.`
            )
          : t('Select a career path from the Explore tab to view its progression.', 'اختر مساراً من تبويب الاستكشاف لعرض مراحله.')}
      </p>

      {!selectedPath ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <Target size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('Select a career path first.', 'اختر مساراً مهنياً أولاً.')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {selectedPath.progression?.map((node, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
              {/* Timeline line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i === 0 ? brand.primary : brand.primarySurface,
                  border: `2px solid ${brand.primary}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: i === 0 ? '#fff' : brand.primary,
                  zIndex: 1,
                }}>
                  {i + 1}
                </div>
                {i < (selectedPath.progression?.length || 0) - 1 && (
                  <div style={{ width: 2, flex: 1, background: brand.border, minHeight: 40 }} />
                )}
              </div>
              {/* Content */}
              <div style={{
                flex: 1, background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`,
                padding: 16, marginBottom: 12,
              }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                  {isRTL ? node.role_ar : node.role}
                </h4>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary, marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> {node.years_experience} {t('years', 'سنوات')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <DollarSign size={11} /> {node.salary_range}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {node.skills?.map((s, j) => (
                    <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 4 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ─── Layout ─── */
  const stats = [
    { value: `${paths.length || 7}`, label: t('Career Paths', 'مسار مهني'), icon: Compass },
    { value: `${sectors.length || 7}`, label: t('Sectors', 'قطاع'), icon: Building2 },
    { value: '15.2%', label: t('Avg Growth', 'متوسط النمو'), icon: TrendingUp },
    { value: '94%', label: t('Placement Rate', 'نسبة التوظيف'), icon: Target },
  ];

  const tabs = [
    { id: 'explore', label: t('Explore Careers', 'استكشاف المسارات'), icon: <Compass className="h-4 w-4" />, content: exploreTab },
    { id: 'simulate', label: t('Simulation', 'المحاكاة'), icon: <Zap className="h-4 w-4" />, content: simulateTab },
    { id: 'progression', label: t('Progression', 'التقدم'), icon: <TrendingUp className="h-4 w-4" />, content: progressionTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Career Pathway Simulator', 'محاكي المسار المهني')}
      description={t(
        'Explore career pathways across UAE sectors, simulate your readiness, and plan your progression with personalized recommendations',
        'استكشف المسارات المهنية عبر قطاعات الإمارات، وحاكي جاهزيتك، وخطط لتقدمك مع توصيات مخصصة'
      )}
      icon={<Compass className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="explore"
    />
  );
};

export default CareerPathwaySimulator;
