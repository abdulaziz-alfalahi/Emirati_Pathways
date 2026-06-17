
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
  Compass, Target, TrendingUp, Users, Briefcase, Award,
  BarChart3, MapPin, DollarSign, Clock, ChevronRight, ChevronLeft,
  BookOpen, Lightbulb, CheckCircle, Star, Building2,
  Search, Sparkles, Cpu, Banknote, Heart, Plane, ShoppingBag
} from 'lucide-react';
import { restClient } from '@/utils/api';
import { skillGraphAPI, type UserSkill } from '@/services/intelligenceAPI';

// Brand tokens
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

const iconMap: Record<string, React.FC<any>> = { Cpu, Banknote, Lightbulb, Heart, Plane, ShoppingBag, Building2 };

// Format number for display (e.g. 1500 → "1,500")
const fmtNum = (n: number) => n.toLocaleString();

// Format AED salary (e.g. 15000 → "AED 15K")
const fmtSalary = (n: number) => {
  if (n === 0) return '—';
  if (n >= 1000) return `AED ${Math.round(n / 1000)}K`;
  return `AED ${fmtNum(n)}`;
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const FunctionalCareerPlanningHub: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  // ── API state ──
  const [marketData, setMarketData] = useState<any>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);

  // ── Industry data (from Industry Exploration API) ──
  const fallbackIndustries = [
    {
      id: 'technology',
      name: t('Technology & Innovation', 'التكنولوجيا والابتكار'),
      Icon: Cpu,
      growth: '+18%',
      jobs: '2,500+',
      avgSalary: t('AED 120K–250K', '120–250 ألف د.إ'),
      topCompanies: ['Microsoft', 'Google', 'Amazon (AWS)', 'SAP', 'Oracle', 'Cisco'],
      description: t(
        'Leading the digital transformation of the UAE with cutting-edge solutions in AI, cloud, and cybersecurity.',
        'قيادة التحول الرقمي في الإمارات بحلول متطورة في الذكاء الاصطناعي والسحابة والأمن السيبراني.'
      ),
      skills: [
        t('Python / JS', 'Python / JS'),
        t('AI & ML', 'الذكاء الاصطناعي'),
        t('Cloud Computing', 'الحوسبة السحابية'),
        t('DevOps', 'DevOps'),
        t('Cybersecurity', 'الأمن السيبراني'),
      ],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي'), t('Sharjah', 'الشارقة')],
      trending: true,
      sector: 'Tech',
    },
    {
      id: 'finance',
      name: t('Banking & Finance', 'المصارف والتمويل'),
      Icon: Banknote,
      growth: '+12%',
      jobs: '1,800+',
      avgSalary: t('AED 100K–200K', '100–200 ألف د.إ'),
      topCompanies: ['HSBC', 'JPMorgan', 'Citibank', 'Goldman Sachs', 'Standard Chartered', 'Visa'],
      description: t(
        'Driving financial innovation and world-class banking across the region.',
        'قيادة الابتكار المالي والخدمات المصرفية العالمية في المنطقة.'
      ),
      skills: [
        t('Financial Analysis', 'التحليل المالي'),
        t('Risk Management', 'إدارة المخاطر'),
        t('Fintech', 'التقنية المالية'),
        t('Compliance', 'الامتثال'),
        t('Wealth Mgmt', 'إدارة الثروات'),
      ],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي')],
      trending: false,
      sector: 'Finance',
    },
    {
      id: 'energy',
      name: t('Energy & Sustainability', 'الطاقة والاستدامة'),
      Icon: Lightbulb,
      growth: '+20%',
      jobs: '1,200+',
      avgSalary: t('AED 110K–220K', '110–220 ألف د.إ'),
      topCompanies: ['Shell', 'Baker Hughes', 'TotalEnergies', 'Siemens Energy', 'Schneider Electric', 'BP'],
      description: t(
        "Pioneering renewable energy and sustainable development in one of the world's leading energy hubs.",
        'الريادة في الطاقة المتجددة والتنمية المستدامة في أحد أبرز مراكز الطاقة في العالم.'
      ),
      skills: [
        t('Renewable Energy', 'الطاقة المتجددة'),
        t('Project Mgmt', 'إدارة المشاريع'),
        t('Engineering', 'الهندسة'),
        t('Sustainability', 'الاستدامة'),
        t('HSE', 'الصحة والسلامة'),
      ],
      locations: [t('Abu Dhabi', 'أبوظبي'), t('Dubai', 'دبي')],
      trending: true,
      sector: 'Energy',
    },
    {
      id: 'healthcare',
      name: t('Healthcare & Life Sciences', 'الرعاية الصحية وعلوم الحياة'),
      Icon: Heart,
      growth: '+15%',
      jobs: '1,500+',
      avgSalary: t('AED 95K–180K', '95–180 ألف د.إ'),
      topCompanies: ['Johnson & Johnson', 'Pfizer', 'Abbott', 'GE Healthcare', 'Medtronic', 'Roche'],
      description: t(
        'Advancing healthcare excellence and medical innovation across the Emirates.',
        'تعزيز التميز في الرعاية الصحية والابتكار الطبي في الإمارات.'
      ),
      skills: [
        t('MedTech', 'التقنية الطبية'),
        t('Healthcare Mgmt', 'إدارة الرعاية الصحية'),
        t('Clinical Research', 'البحث السريري'),
        t('Health Informatics', 'المعلوماتية الصحية'),
      ],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي'), t('Sharjah', 'الشارقة')],
      trending: false,
      sector: 'Health',
    },
    {
      id: 'aerospace',
      name: t('Aerospace & Aviation', 'الفضاء والطيران'),
      Icon: Plane,
      growth: '+14%',
      jobs: '900+',
      avgSalary: t('AED 105K–190K', '105–190 ألف د.إ'),
      topCompanies: ['Boeing', 'Airbus', 'Honeywell', 'Rolls-Royce', 'GE Aviation', 'Collins Aerospace'],
      description: t(
        'Connecting the world through aviation excellence and space-age aerospace programs.',
        'ربط العالم عبر التميز في الطيران وبرامج الفضاء المتقدمة.'
      ),
      skills: [
        t('Aviation Mgmt', 'إدارة الطيران'),
        t('Aerospace Eng.', 'هندسة الفضاء'),
        t('Operations', 'العمليات'),
        t('Safety', 'السلامة'),
        t('Logistics', 'اللوجستيات'),
      ],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي')],
      trending: false,
      sector: 'Aviation',
    },
    {
      id: 'tourism',
      name: t('Tourism & Hospitality', 'السياحة والضيافة'),
      Icon: ShoppingBag,
      growth: '+16%',
      jobs: '2,000+',
      avgSalary: t('AED 75K–150K', '75–150 ألف د.إ'),
      topCompanies: ['Marriott International', 'Hilton', 'Hyatt', 'Accor', 'IHG', 'Four Seasons'],
      description: t(
        'Creating world-class hospitality experiences and iconic tourism destinations.',
        'خلق تجارب ضيافة عالمية المستوى ووجهات سياحية أيقونية.'
      ),
      skills: [
        t('Hospitality Mgmt', 'إدارة الضيافة'),
        t('Customer Service', 'خدمة العملاء'),
        t('Event Planning', 'تنظيم الفعاليات'),
        t('F&B Mgmt', 'إدارة الأغذية والمشروبات'),
      ],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي'), t('Ras Al Khaimah', 'رأس الخيمة')],
      trending: false,
      sector: 'Hospitality',
    },
  ];

  const [industries, setIndustries] = useState(fallbackIndustries);

  useEffect(() => {
    let cancelled = false;

    // Fetch industries from API
    (async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';
        const res = await fetch(`${API_BASE}/api/education/content/industries`);
        if (res.ok) {
          const data = await res.json();
          const apiIndustries = (data.industries || []).map((s: any) => ({
            id: s.sector_id,
            name: isRTL ? (s.name_ar || s.name) : s.name,
            Icon: iconMap[s.icon] || Building2,
            growth: s.growth,
            jobs: s.jobs,
            avgSalary: isRTL ? (s.avg_salary_ar || s.avg_salary) : s.avg_salary,
            topCompanies: (() => { try { return JSON.parse(s.top_companies || '[]'); } catch { return []; } })(),
            description: isRTL ? (s.description_ar || s.description) : s.description,
            skills: (() => { try { return JSON.parse(s.skills || '[]'); } catch { return []; } })(),
            locations: (() => { try { return JSON.parse(s.locations || '[]'); } catch { return []; } })(),
            trending: s.trending || false,
            sector: s.sector_tag || s.sector_id,
          }));
          if (!cancelled && apiIndustries.length > 0) setIndustries(apiIndustries);
        }
      } catch (e) { console.error('Error fetching industries:', e); }
    })();

    // Fetch real market data
    (async () => {
      try {
        const res = await restClient.get('/api/career-services/market-overview');
        if (!cancelled && res.data) setMarketData(res.data);
      } catch { /* graceful fallback */ }
    })();

    // Fetch user skills
    (async () => {
      try {
        const data = await skillGraphAPI.getUserSkills();
        if (!cancelled) setUserSkills(data.skills || []);
      } catch { /* not logged in */ }
    })();

    return () => { cancelled = true; };
  }, [isRTL]);

  /* ──────────────────────── FILTER STATE ──────────────────────── */

  const sectorFilters = [
    { key: 'All', label: t('All', 'الكل') },
    { key: 'Tech', label: t('Tech', 'تقنية') },
    { key: 'Finance', label: t('Finance', 'مالية') },
    { key: 'Energy', label: t('Energy', 'طاقة') },
    { key: 'Health', label: t('Health', 'صحة') },
    { key: 'Aviation', label: t('Aviation', 'طيران') },
    { key: 'Hospitality', label: t('Hospitality', 'ضيافة') },
  ];

  const emirates = [
    { id: 'all', name: t('All Emirates', 'جميع الإمارات') },
    { id: 'dubai', name: t('Dubai', 'دبي') },
    { id: 'abu dhabi', name: t('Abu Dhabi', 'أبوظبي') },
    { id: 'sharjah', name: t('Sharjah', 'الشارقة') },
    { id: 'ras al khaimah', name: t('Ras Al Khaimah', 'رأس الخيمة') },
  ];

  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedEmirate, setSelectedEmirate] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = industries.filter(ind => {
    const matchSector = selectedSector === 'All' || ind.sector === selectedSector;
    const matchEmirate =
      selectedEmirate === 'all' ||
      ind.locations.some(l => l.toLowerCase().includes(selectedEmirate));
    const matchSearch =
      !searchQuery ||
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSector && matchEmirate && matchSearch;
  });

  /* ──────────────────────── REAL STATS ──────────────────────── */

  const s = marketData?.stats;
  const stats = [
    { value: String(industries.length), label: t('Key Sectors', 'القطاعات الرئيسية'), icon: Building2 },
    { value: s ? fmtNum(s.total_jobs) : '—', label: t('Job Postings', 'الإعلانات الوظيفية'), icon: Briefcase },
    { value: s ? fmtNum(s.total_companies) : '—', label: t('Companies', 'الشركات'), icon: Users },
    { value: s ? fmtSalary(s.avg_salary_max) : '—', label: t('Avg. Top Salary', 'أعلى متوسط راتب'), icon: DollarSign },
  ];

  /* ──────────────────────── MARKET INSIGHTS DATA ──────────────────────── */

  const marketInsights = [
    {
      title: t('D33 & Talent33 Impact', 'أثر D33 وTalent33'),
      desc: t(
        'Government initiatives driving growth in tech-sector jobs across the UAE.',
        'مبادرات حكومية تقود النمو في وظائف قطاع التكنولوجيا في الإمارات.'
      ),
      Icon: Target,
      trend: s ? `${fmtNum(s.total_jobs)} ${t('jobs', 'وظيفة')}` : t('Growing', 'نمو'),
      trendBg: brand.green,
      trendColor: brand.greenText,
    },
    {
      title: t('Emiratisation Focus', 'التركيز على التوطين'),
      desc: t(
        'Priority sectors offering enhanced opportunities for UAE Nationals.',
        'قطاعات ذات أولوية تقدم فرصاً معززة للمواطنين الإماراتيين.'
      ),
      Icon: Award,
      trend: t('Priority', 'أولوية'),
      trendBg: brand.blue,
      trendColor: brand.blueText,
    },
    {
      title: t('Registered Companies', 'الشركات المسجلة'),
      desc: t(
        'Active employers on the platform recruiting UAE talent.',
        'أصحاب عمل نشطون على المنصة يستقطبون الكفاءات الإماراتية.'
      ),
      Icon: Building2,
      trend: s ? fmtNum(s.total_companies) : '—',
      trendBg: brand.purple,
      trendColor: brand.purpleText,
    },
    {
      title: t('Training Programs', 'البرامج التدريبية'),
      desc: t(
        'Courses and certifications available on the platform.',
        'دورات وشهادات متاحة على المنصة.'
      ),
      Icon: BookOpen,
      trend: s ? fmtNum(s.training_programs) : '—',
      trendBg: brand.amber,
      trendColor: brand.amberText,
    },
  ];

  /* ──────────────────────── RECENT JOBS ──────────────────────── */

  const recentJobs = marketData?.recent_jobs || [];

  /* ──────────────────────── RESOURCES ──────────────────────── */

  const resources = [
    { title: t('CV Builder', 'منشئ السيرة الذاتية'), desc: t('Create professional resumes tailored for UAE employers', 'أنشئ سيراً ذاتية احترافية مصممة لأصحاب العمل في الإمارات'), Icon: Briefcase, action: t('Build CV', 'إنشاء سيرة ذاتية'), href: '/cv-builder' },
    { title: t('Interview Prep', 'التحضير للمقابلات'), desc: t('Practice with AI-powered mock interviews', 'تدرّب مع مقابلات تجريبية مدعومة بالذكاء الاصطناعي'), Icon: Users, action: t('Start Practice', 'ابدأ التدريب'), href: '/interview-preparation' },
    { title: t('Salary Calculator', 'حاسبة الرواتب'), desc: t('Research competitive salaries for your role', 'ابحث عن الرواتب التنافسية لمنصبك'), Icon: DollarSign, action: t('Calculate', 'احسب'), href: '/financial-planning' },
    { title: t('Skills Assessment', 'تقييم المهارات'), desc: t('Validate your skills with 500+ assessments across technical, leadership, and cognitive categories', 'تحقق من مهاراتك مع أكثر من 500 تقييم في فئات تقنية وقيادية ومعرفية'), Icon: Target, action: t('Take Assessments', 'ابدأ التقييمات'), href: '/assessments' },
    { title: t('Skill Development', 'تطوير المهارات'), desc: t('Find courses to enhance your capabilities', 'اعثر على دورات لتعزيز قدراتك'), Icon: BookOpen, action: t('Browse Courses', 'تصفح الدورات'), href: '/training' },
    { title: t('Networking Events', 'فعاليات التواصل'), desc: t('Connect with professionals in your field', 'تواصل مع المتخصصين في مجالك'), Icon: Users, action: t('Find Events', 'ابحث عن فعاليات'), href: '/communities' },
  ];

  /* ════════════════════════════════════════════════════════════
     TAB 1: EXPLORE INDUSTRIES
     ════════════════════════════════════════════════════════════ */
  const exploreTab = (
    <div>
      {/* Search and filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
          <input
            type="text"
            placeholder={t('Search industries or skills…', 'ابحث عن القطاعات أو المهارات...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12,
              border: `1px solid ${brand.border}`, fontSize: 14, outline: 'none',
              transition: 'border-color 150ms',
            }}
            onFocus={e => e.currentTarget.style.borderColor = brand.primary}
            onBlur={e => e.currentTarget.style.borderColor = brand.border}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary, pointerEvents: 'none', display: 'flex' }}>
            <Search style={{ width: 16, height: 16 }} />
          </span>
        </div>

        {/* Emirate selector */}
        <select
          value={selectedEmirate}
          onChange={e => setSelectedEmirate(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500,
            border: `1px solid ${brand.border}`, background: '#fff', color: brand.textPrimary,
            cursor: 'pointer', outline: 'none',
          }}
        >
          {emirates.map(em => (
            <option key={em.id} value={em.id}>{em.name}</option>
          ))}
        </select>

        {/* Sector filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sectorFilters.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedSector(cat.key)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                border: selectedSector === cat.key ? 'none' : `1px solid ${brand.border}`,
                background: selectedSector === cat.key ? brand.primary : '#fff',
                color: selectedSector === cat.key ? '#fff' : brand.textSecondary,
                cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20 }}>
        {t(
          `Showing ${filtered.length} industr${filtered.length !== 1 ? 'ies' : 'y'}`,
          `عرض ${filtered.length} ${filtered.length === 1 ? 'قطاع' : 'قطاعات'}`
        )}
      </p>

      {/* Industry cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Search style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('No industries found', 'لم يتم العثور على قطاعات')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Try adjusting your search or filter criteria.', 'حاول تعديل معايير البحث أو التصفية.')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filtered.map(ind => {
            const isExpanded = expandedId === ind.id;
            return (
              <div
                key={ind.id}
                onClick={() => setExpandedId(isExpanded ? null : ind.id)}
                style={{
                  background: '#fff', borderRadius: 16,
                  border: `1px solid ${isExpanded ? brand.primary : brand.border}`,
                  boxShadow: isExpanded ? '0 4px 12px rgba(13,148,136,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  if (!isExpanded) {
                    e.currentTarget.style.borderColor = brand.primary;
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isExpanded) {
                    e.currentTarget.style.borderColor = brand.border;
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  }
                }}
              >
                {/* Accent strip */}
                <div style={{ height: 4, background: ind.trending ? brand.primary : brand.border }} />

                <div style={{ padding: 22 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: brand.primarySurface, color: brand.primary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <ind.Icon style={{ width: 22, height: 22 }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{ind.name}</h3>
                          {ind.trending && (
                            <span style={{
                              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                              background: brand.red, color: brand.redText,
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                            }}>
                              <TrendingUp style={{ width: 10, height: 10 }} /> {t('Trending', 'رائج')}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: brand.textSecondary, margin: '4px 0 0', lineHeight: 1.4 }}>{ind.description}</p>
                      </div>
                    </div>
                    <ChevronIcon style={{
                      width: 18, height: 18, color: brand.textSecondary, flexShrink: 0, marginTop: 4,
                      transition: 'transform 200ms',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }} />
                  </div>

                  {/* Quick stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: isExpanded ? 16 : 0 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.primarySurface, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: brand.greenText }}>{ind.growth}</div>
                      <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Growth', 'النمو')}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.blue, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: brand.blueText }}>{ind.jobs}</div>
                      <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Positions', 'وظائف')}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.purple, textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: brand.purpleText }}>{ind.avgSalary.split('–')[0]}</div>
                      <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Avg. Salary', 'متوسط الراتب')}</div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${brand.border}`, paddingTop: 16 }}>
                      {/* Top Employers */}
                      <div style={{ marginBottom: 14 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 style={{ width: 13, height: 13 }} /> {t('Top Employers', 'أبرز جهات التوظيف')}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ind.topCompanies.map((c, i) => (
                            <span key={i} style={{
                              padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                              border: `1px solid ${brand.border}`, background: '#fff', color: brand.textPrimary,
                            }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* In-demand Skills */}
                      <div style={{ marginBottom: 14 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Award style={{ width: 13, height: 13 }} /> {t('In-Demand Skills', 'المهارات المطلوبة')}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ind.skills.map((sk, i) => (
                            <span key={i} style={{
                              padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                              background: brand.primarySurface, color: brand.primary,
                            }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Locations */}
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin style={{ width: 13, height: 13 }} /> {t('Key Locations', 'المواقع الرئيسية')}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ind.locations.map((l, i) => (
                            <span key={i} style={{
                              padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                              background: brand.green, color: brand.greenText,
                            }}>
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CTA button — links to job matching */}
                      <Link
                        to={`/job-matching?industry=${encodeURIComponent(ind.name)}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'flex', width: '100%', padding: '11px 0', borderRadius: 12,
                          background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600,
                          border: 'none', cursor: 'pointer', transition: 'background 150ms',
                          alignItems: 'center', justifyContent: 'center', gap: 6,
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
                        onMouseLeave={e => e.currentTarget.style.background = brand.primary}
                      >
                        {t('Explore Career Opportunities', 'استكشف الفرص الوظيفية')} <ChevronIcon style={{ width: 16, height: 16 }} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TAB 2: JOB MARKET (Real data from platform)
     ════════════════════════════════════════════════════════════ */
  const marketTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('UAE Job Market — Platform Data', 'سوق العمل الإماراتي — بيانات المنصة')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Real-time data from job postings and companies registered on the platform.',
          'بيانات آنية من الإعلانات الوظيفية والشركات المسجلة على المنصة.'
        )}
      </p>

      {/* Platform stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: t('Total Job Postings', 'إجمالي الإعلانات الوظيفية'), value: s ? fmtNum(s.total_jobs) : '—', bg: brand.blue, color: brand.blueText },
          { label: t('Active Vacancies', 'الشواغر النشطة'), value: s ? fmtNum(s.active_jobs) : '—', bg: brand.green, color: brand.greenText },
          { label: t('Registered Companies', 'الشركات المسجلة'), value: s ? fmtNum(s.total_companies) : '—', bg: brand.purple, color: brand.purpleText },
          { label: t('Registered Users', 'المستخدمون المسجلون'), value: s ? fmtNum(s.registered_users) : '—', bg: brand.amber, color: brand.amberText },
        ].map((kpi, i) => (
          <div key={i} style={{
            padding: 18, borderRadius: 14, background: '#fff',
            border: `1px solid ${brand.border}`, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: brand.textSecondary }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Jobs by department */}
      {(marketData?.jobs_by_department || []).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Jobs by Department', 'الوظائف حسب القسم')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {(marketData?.jobs_by_department || []).map((dept: any, i: number) => (
              <div
                key={i}
                style={{
                  background: '#fff', borderRadius: 14, border: `1px solid ${brand.border}`,
                  padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
              >
                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, marginBottom: 10 }}>{dept.department}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: brand.green, color: brand.greenText }}>
                    {fmtNum(dept.count)} {t('posts', 'إعلان')}
                  </span>
                  <span style={{ fontSize: 12, color: brand.textSecondary }}>
                    {fmtNum(dept.vacancies)} {t('vacancies', 'شاغر')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent job postings */}
      {recentJobs.length > 0 && (
        <div style={{ padding: 24, borderRadius: 16, background: brand.primarySurface, border: `1px solid ${brand.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Recent Job Postings', 'أحدث الإعلانات الوظيفية')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentJobs.map((job: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < recentJobs.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: brand.primary, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: brand.textSecondary }}>
                    {job.company_name || job.department || '—'} • {job.emirate || 'UAE'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data fallback */}
      {!s && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: brand.textSecondary }}>
          <BarChart3 style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>{t('Loading market data…', 'جارٍ تحميل بيانات السوق…')}</p>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TAB 3: MARKET INSIGHTS
     ════════════════════════════════════════════════════════════ */
  const insightsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Platform Intelligence', 'ذكاء المنصة')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Key metrics and opportunities from the Emirati Gateway platform.',
          'مؤشرات رئيسية وفرص من منصة البوابة الإماراتية.'
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {marketInsights.map((item, i) => (
          <div
            key={i}
            style={{
              background: '#fff', borderRadius: 16,
              border: `1px solid ${brand.border}`,
              padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = brand.primary;
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = brand.border;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: brand.primarySurface, color: brand.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <item.Icon style={{ width: 22, height: 22 }} />
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: item.trendBg, color: item.trendColor,
              }}>
                {item.trend}
              </span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{item.title}</h3>
            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* AI-powered banner */}
      <div style={{
        marginTop: 32, padding: 24, borderRadius: 16,
        background: brand.primarySurface, border: `1px solid ${brand.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Lightbulb style={{ width: 22, height: 22, color: brand.primary }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('AI-Powered Career Matching', 'مطابقة مهنية بالذكاء الاصطناعي')}</h3>
        </div>
        <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>
          {t(
            'Our advanced AI analyzes your profile to provide personalized career recommendations tailored to the UAE job market.',
            'يحلّل ذكاؤنا الاصطناعي المتقدم ملفك الشخصي لتقديم توصيات مهنية مخصصة مصممة لسوق العمل الإماراتي.'
          )}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: brand.primary, fontWeight: 600 }}>
          <CheckCircle style={{ width: 16, height: 16 }} /> {t('Powered by AI', 'مدعوم بالذكاء الاصطناعي')}
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TAB 4: EMIRATISATION
     ════════════════════════════════════════════════════════════ */
  const emiratisationTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Emiratisation Opportunities', 'فرص التوطين')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Key sectors actively recruiting UAE Nationals through dedicated Emiratisation programs.',
          'قطاعات رئيسية تستقطب الكوادر الإماراتية عبر برامج توطين مخصصة.'
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {[
          {
            title: t('Technology & Digital', 'التكنولوجيا والرقمنة'),
            quota: t('10% annual increase', 'زيادة سنوية 10%'),
            roles: s ? `${fmtNum(s.total_jobs)} ${t('platform postings', 'إعلان على المنصة')}` : t('Growing', 'متنامٍ'),
            programs: [
              t('Technology sector graduate programs', 'برامج الخريجين في قطاع التكنولوجيا'),
              t('Cloud & AI specialist tracks', 'مسارات تخصص السحابة والذكاء الاصطناعي'),
              t('Digital transformation initiatives', 'مبادرات التحول الرقمي'),
            ],
            catBg: brand.blue,
            catColor: brand.blueText,
          },
          {
            title: t('Banking & Finance', 'المصارف والتمويل'),
            quota: t('4% annual target', 'مستهدف سنوي 4%'),
            roles: t('High demand', 'طلب مرتفع'),
            programs: [
              t('Banking sector graduate schemes', 'برامج تدريب الخريجين في القطاع المصرفي'),
              t('Islamic finance specialist tracks', 'مسارات تخصص التمويل الإسلامي'),
              t('Fintech innovation programs', 'برامج ابتكار التقنية المالية'),
            ],
            catBg: brand.green,
            catColor: brand.greenText,
          },
          {
            title: t('Energy & Industrial', 'الطاقة والصناعة'),
            quota: t('15% Emiratisation', 'توطين 15%'),
            roles: t('Expanding', 'متوسع'),
            programs: [
              t('Energy sector engineering programs', 'برامج الهندسة في قطاع الطاقة'),
              t('Renewable energy specialist tracks', 'مسارات تخصص الطاقة المتجددة'),
              t('National development training schemes', 'برامج التدريب للتطوير الوطني'),
            ],
            catBg: brand.amber,
            catColor: brand.amberText,
          },
          {
            title: t('Consulting & Professional Services', 'الاستشارات والخدمات المهنية'),
            quota: t('Growing demand', 'طلب متزايد'),
            roles: t('Emerging', 'ناشئ'),
            programs: [
              t('Management consulting development programs', 'برامج تطوير الاستشارات الإدارية'),
              t('Professional services talent tracks', 'مسارات المواهب في الخدمات المهنية'),
              t('Emirati leadership accelerators', 'مسرّعات القيادة الإماراتية'),
            ],
            catBg: brand.purple,
            catColor: brand.purpleText,
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: '#fff', borderRadius: 16,
              border: `1px solid ${brand.border}`,
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = brand.primary;
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = brand.border;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{ height: 4, background: brand.primary }} />
            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{item.title}</h3>
                <span style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                  background: item.catBg, color: item.catColor,
                }}>
                  {item.quota}
                </span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: brand.primary, marginBottom: 14 }}>
                {item.roles}
              </p>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {t('Key Programs', 'البرامج الرئيسية')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {item.programs.map((p, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: brand.textPrimary }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: brand.primary, flexShrink: 0 }} />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TAB 5: RESOURCES
     ════════════════════════════════════════════════════════════ */
  const resourcesTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Career Development Resources', 'موارد التطوير المهني')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Access tools, guides, and resources to accelerate your career growth in the UAE.',
          'استخدم الأدوات والأدلة والموارد لتسريع نموك المهني في الإمارات.'
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {resources.map((r, i) => (
          <div
            key={i}
            style={{
              background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`,
              padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 14,
              background: brand.primarySurface, color: brand.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <r.Icon style={{ width: 24, height: 24 }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{r.title}</h3>
            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>{r.desc}</p>
            <Link
              to={r.href}
              style={{
                display: 'block', width: '100%', padding: '10px 0', borderRadius: 12,
                background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'background 150ms',
                textAlign: 'center', textDecoration: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
              onMouseLeave={e => e.currentTarget.style.background = brand.primary}
            >
              {r.action}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );

  /* ──────────────────────── TABS CONFIG ──────────────────────── */

  const tabs = [
    { id: 'explore', label: t('Explore Industries', 'استكشاف القطاعات'), icon: <Building2 className="h-4 w-4" />, content: exploreTab },
    { id: 'market', label: t('Job Market', 'سوق العمل'), icon: <TrendingUp className="h-4 w-4" />, content: marketTab },
    { id: 'insights', label: t('Market Insights', 'رؤى السوق'), icon: <BarChart3 className="h-4 w-4" />, content: insightsTab },
    { id: 'emiratisation', label: t('Emiratisation', 'التوطين'), icon: <Star className="h-4 w-4" />, content: emiratisationTab },
    { id: 'resources', label: t('Resources', 'الموارد'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Career Planning Hub', 'مركز التخطيط المهني')}
      description={t(
        "Explore UAE industries, discover career opportunities, assess market trends, and access career development resources — all in one place.",
        'استكشف القطاعات الإماراتية، واكتشف الفرص الوظيفية، وتابع اتجاهات السوق، واستخدم موارد التطوير المهني — كل ذلك في مكان واحد.'
      )}
      icon={<Compass className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="explore"
      actionButtonText={t('Start Exploring', 'ابدأ الاستكشاف')}
      onActionClick={() => {
        const tabContent = document.querySelector('[role="tablist"]');
        if (tabContent) {
          tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    />
  );
};

export default FunctionalCareerPlanningHub;
