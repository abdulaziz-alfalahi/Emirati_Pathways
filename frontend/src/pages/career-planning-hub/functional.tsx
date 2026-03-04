
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
  Compass, Target, TrendingUp, Users, Briefcase, Award,
  BarChart3, MapPin, DollarSign, Clock, ChevronRight, ChevronLeft,
  Play, BookOpen, Lightbulb, CheckCircle, Star, Building2
} from 'lucide-react';

// Brand tokens (unified with Education Pathway)
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

/* ──────────────────────── COMPONENT ──────────────────────── */

const FunctionalCareerPlanningHub: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  /* ──────────────────────── DATA ──────────────────────── */

  const careerPaths = [
    {
      id: 'technology',
      title: t('Technology & Innovation', 'التكنولوجيا والابتكار'),
      description: t(
        "Lead UAE's digital transformation with cutting-edge technology careers",
        'قُد التحول الرقمي في الإمارات من خلال مسارات وظيفية تكنولوجية متطورة'
      ),
      salary: t('AED 120K–250K', '120–250 ألف د.إ'),
      growth: '+18%',
      jobs: '2,500+',
      Icon: TrendingUp,
      skills: [
        t('AI / ML', 'الذكاء الاصطناعي'),
        t('Cloud Computing', 'الحوسبة السحابية'),
        t('Cybersecurity', 'الأمن السيبراني'),
        t('Blockchain', 'بلوكتشين'),
        t('IoT', 'إنترنت الأشياء'),
      ],
      companies: ['Emirates NBD', 'ADNOC', t('Dubai Future Foundation', 'مؤسسة دبي للمستقبل'), 'Careem', 'Noon'],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي'), t('Sharjah', 'الشارقة')],
      trending: true,
    },
    {
      id: 'healthcare',
      title: t('Healthcare & Life Sciences', 'الرعاية الصحية وعلوم الحياة'),
      description: t(
        "Contribute to UAE's world-class healthcare system and medical innovation",
        'ساهم في نظام الرعاية الصحية العالمي والابتكار الطبي في الإمارات'
      ),
      salary: t('AED 95K–180K', '95–180 ألف د.إ'),
      growth: '+15%',
      jobs: '1,800+',
      Icon: Users,
      skills: [
        t('Clinical Care', 'الرعاية السريرية'),
        t('Medical Research', 'البحث الطبي'),
        t('Health Tech', 'التقنية الصحية'),
        t('Telemedicine', 'الطب عن بُعد'),
        t('Public Health', 'الصحة العامة'),
      ],
      companies: ['Cleveland Clinic Abu Dhabi', 'DHA', 'Mediclinic', 'NMC Healthcare'],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي'), t('Ras Al Khaimah', 'رأس الخيمة')],
      trending: false,
    },
    {
      id: 'finance',
      title: t('Finance & Banking', 'التمويل والمصارف'),
      description: t(
        'Shape the future of Islamic finance and fintech in the regional hub',
        'شكّل مستقبل التمويل الإسلامي والتقنية المالية في المركز الإقليمي'
      ),
      salary: t('AED 100K–200K', '100–200 ألف د.إ'),
      growth: '+12%',
      jobs: '1,500+',
      Icon: BarChart3,
      skills: [
        t('Islamic Finance', 'التمويل الإسلامي'),
        t('Investment Banking', 'الخدمات المصرفية الاستثمارية'),
        t('Fintech', 'التقنية المالية'),
        t('Risk Mgmt', 'إدارة المخاطر'),
        t('Wealth Mgmt', 'إدارة الثروات'),
      ],
      companies: ['Emirates NBD', 'ADCB', 'FAB', t('Dubai Islamic Bank', 'بنك دبي الإسلامي')],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي'), 'DIFC'],
      trending: false,
    },
    {
      id: 'energy',
      title: t('Energy & Sustainability', 'الطاقة والاستدامة'),
      description: t(
        "Drive UAE's clean energy transition and sustainable development goals",
        'قُد انتقال الإمارات إلى الطاقة النظيفة وأهداف التنمية المستدامة'
      ),
      salary: t('AED 110K–220K', '110–220 ألف د.إ'),
      growth: '+20%',
      jobs: '1,200+',
      Icon: Target,
      skills: [
        t('Renewable Energy', 'الطاقة المتجددة'),
        t('Oil & Gas', 'النفط والغاز'),
        t('Nuclear Energy', 'الطاقة النووية'),
        t('Carbon Mgmt', 'إدارة الكربون'),
        t('Smart Grid', 'الشبكات الذكية'),
      ],
      companies: ['ADNOC', 'ENOC', 'Masdar', 'EWEC', 'DEWA'],
      locations: [t('Abu Dhabi', 'أبوظبي'), t('Dubai', 'دبي'), t('Fujairah', 'الفجيرة')],
      trending: true,
    },
    {
      id: 'aerospace',
      title: t('Aerospace & Aviation', 'الفضاء والطيران'),
      description: t(
        "Excel in UAE's world-leading aviation and space exploration sectors",
        'تميّز في قطاعي الطيران واستكشاف الفضاء الرائدَين عالمياً في الإمارات'
      ),
      salary: t('AED 105K–190K', '105–190 ألف د.إ'),
      growth: '+14%',
      jobs: '900+',
      Icon: Award,
      skills: [
        t('Aircraft Eng.', 'هندسة الطائرات'),
        t('Space Tech', 'تقنية الفضاء'),
        t('Aviation Mgmt', 'إدارة الطيران'),
        t('Drone Tech', 'تقنية الطائرات بدون طيار'),
        t('Satellite Systems', 'أنظمة الأقمار الصناعية'),
      ],
      companies: ['Emirates', 'Etihad Airways', t('UAE Space Agency', 'وكالة الإمارات للفضاء'), 'Strata Manufacturing'],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي'), t('Al Ain', 'العين')],
      trending: false,
    },
    {
      id: 'tourism',
      title: t('Tourism & Hospitality', 'السياحة والضيافة'),
      description: t(
        "Create exceptional experiences in UAE's thriving tourism industry",
        'اصنع تجارب استثنائية في قطاع السياحة المزدهر بالإمارات'
      ),
      salary: t('AED 75K–150K', '75–150 ألف د.إ'),
      growth: '+16%',
      jobs: '2,000+',
      Icon: Briefcase,
      skills: [
        t('Hotel Mgmt', 'إدارة الفنادق'),
        t('Event Planning', 'تنظيم الفعاليات'),
        t('Cultural Tourism', 'السياحة الثقافية'),
        t('Digital Marketing', 'التسويق الرقمي'),
        t('Guest Experience', 'تجربة الضيوف'),
      ],
      companies: ['Jumeirah Group', 'Rotana', 'Emaar Hospitality', t('Dubai Tourism', 'دبي للسياحة')],
      locations: [t('Dubai', 'دبي'), t('Abu Dhabi', 'أبوظبي'), t('Ras Al Khaimah', 'رأس الخيمة')],
      trending: false,
    },
  ];

  const assessments = [
    { title: t('Personality Assessment', 'تقييم الشخصية'), desc: t('Discover your work style and ideal environment', 'اكتشف أسلوب عملك وبيئتك المثالية'), Icon: Users, duration: t('15 min', '15 دقيقة'), questions: 45 },
    { title: t('Skills Evaluation', 'تقييم المهارات'), desc: t('Assess your technical and soft skills', 'قيّم مهاراتك التقنية والشخصية'), Icon: Target, duration: t('20 min', '20 دقيقة'), questions: 60 },
    { title: t('Career Interests', 'الاهتمامات المهنية'), desc: t('Identify what motivates and excites you', 'حدّد ما يحفّزك ويثير حماسك'), Icon: Compass, duration: t('12 min', '12 دقيقة'), questions: 35 },
    { title: t('Values Alignment', 'توافق القيم'), desc: t('Match careers with your personal values', 'طابق المسارات المهنية مع قيمك الشخصية'), Icon: Award, duration: t('10 min', '10 دقائق'), questions: 25 },
  ];

  const resources = [
    { title: t('CV Builder', 'منشئ السيرة الذاتية'), desc: t('Create professional resumes tailored for UAE employers', 'أنشئ سيراً ذاتية احترافية مصممة لأصحاب العمل في الإمارات'), Icon: Briefcase, action: t('Build CV', 'إنشاء سيرة ذاتية') },
    { title: t('Interview Prep', 'التحضير للمقابلات'), desc: t('Practice with AI-powered mock interviews', 'تدرّب مع مقابلات تجريبية مدعومة بالذكاء الاصطناعي'), Icon: Users, action: t('Start Practice', 'ابدأ التدريب') },
    { title: t('Salary Calculator', 'حاسبة الرواتب'), desc: t('Research competitive salaries for your role', 'ابحث عن الرواتب التنافسية لمنصبك'), Icon: DollarSign, action: t('Calculate', 'احسب') },
    { title: t('Skill Development', 'تطوير المهارات'), desc: t('Find courses to enhance your capabilities', 'اعثر على دورات لتعزيز قدراتك'), Icon: BookOpen, action: t('Browse Courses', 'تصفح الدورات') },
    { title: t('Industry Reports', 'تقارير القطاعات'), desc: t('Stay updated with UAE market trends', 'ابقَ على اطلاع بأحدث اتجاهات السوق الإماراتي'), Icon: BarChart3, action: t('Read Reports', 'اقرأ التقارير') },
    { title: t('Networking Events', 'فعاليات التواصل'), desc: t('Connect with professionals in your field', 'تواصل مع المتخصصين في مجالك'), Icon: Users, action: t('Find Events', 'ابحث عن فعاليات') },
  ];

  const trendingSectors = [
    { name: t('Artificial Intelligence', 'الذكاء الاصطناعي'), growth: '+25%', jobs: '1,200+' },
    { name: t('Renewable Energy', 'الطاقة المتجددة'), growth: '+22%', jobs: '800+' },
    { name: t('Fintech', 'التقنية المالية'), growth: '+20%', jobs: '950+' },
    { name: t('Healthcare Tech', 'التقنية الصحية'), growth: '+18%', jobs: '650+' },
    { name: t('Space Technology', 'تقنية الفضاء'), growth: '+30%', jobs: '300+' },
    { name: t('Smart Cities', 'المدن الذكية'), growth: '+16%', jobs: '750+' },
  ];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState('All');

  const stats = [
    { value: '12,500+', label: t('Active Openings', 'الوظائف النشطة'), icon: Briefcase },
    { value: '850+', label: t('Companies Hiring', 'شركات توظّف'), icon: Building2 },
    { value: '+8.5%', label: t('Salary Growth', 'نمو الرواتب'), icon: TrendingUp },
    { value: '3,200+', label: t('Remote Options', 'خيارات العمل عن بُعد'), icon: MapPin },
  ];

  /* ── Tab 1: Career Explorer ── */
  const explorerTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Explore Career Opportunities in the UAE', 'استكشف الفرص الوظيفية في الإمارات')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          "Discover high-growth career paths aligned with D33, Talent33, and the country's strategic priorities.",
          'اكتشف المسارات المهنية عالية النمو المتوافقة مع D33 وTalent33 والأولويات الاستراتيجية للدولة.'
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {careerPaths.map(career => {
          const isExpanded = expandedId === career.id;
          return (
            <div
              key={career.id}
              onClick={() => setExpandedId(isExpanded ? null : career.id)}
              style={{
                background: '#fff', borderRadius: 16,
                border: `1px solid ${isExpanded ? brand.primary : brand.border}`,
                boxShadow: isExpanded ? '0 4px 12px rgba(13,148,136,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                if (!isExpanded) { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }
              }}
              onMouseLeave={e => {
                if (!isExpanded) { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }
              }}
            >
              {/* Accent strip */}
              <div style={{ height: 4, background: career.trending ? brand.primary : brand.border }} />

              <div style={{ padding: 22 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: brand.primarySurface, color: brand.primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <career.Icon style={{ width: 22, height: 22 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{career.title}</h3>
                      {career.trending && (
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: brand.red, color: brand.redText, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <TrendingUp style={{ width: 10, height: 10 }} /> {t('Trending', 'رائج')}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: '4px 0 0', lineHeight: 1.4 }}>{career.description}</p>
                  </div>
                  <ChevronIcon style={{
                    width: 18, height: 18, color: brand.textSecondary, flexShrink: 0,
                    transition: 'transform 200ms', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }} />
                </div>

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.green, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: brand.greenText }}>{career.growth}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Growth', 'النمو')}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.blue, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: brand.blueText }}>{career.jobs}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Positions', 'وظائف')}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.purple, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: brand.purpleText }}>{career.salary.split('–')[0]}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Avg. Salary', 'متوسط الراتب')}</div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${brand.border}`, paddingTop: 16, marginTop: 16 }}>
                    {/* Skills */}
                    <div style={{ marginBottom: 14 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t('Key Skills', 'المهارات الرئيسية')}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {career.skills.map((s, i) => (
                          <span key={i} style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: brand.primarySurface, color: brand.primary }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    {/* Companies */}
                    <div style={{ marginBottom: 14 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t('Top Employers', 'أبرز جهات التوظيف')}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {career.companies.map((c, i) => (
                          <span key={i} style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, border: `1px solid ${brand.border}`, background: '#fff', color: brand.textPrimary }}>{c}</span>
                        ))}
                      </div>
                    </div>
                    {/* Locations */}
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t('Locations', 'المواقع')}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {career.locations.map((l, i) => (
                          <span key={i} style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: brand.green, color: brand.greenText }}>{l}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: '100%', padding: '11px 0', borderRadius: 12,
                        background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600,
                        border: 'none', cursor: 'pointer', transition: 'background 150ms',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
                      onMouseLeave={e => e.currentTarget.style.background = brand.primary}
                    >
                      {t('Explore Career', 'استكشف المسار')} <ChevronIcon style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── Tab 2: Skills Assessment ── */
  const assessmentTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Discover Your Strengths & Potential', 'اكتشف نقاط القوة وإمكاناتك')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Take comprehensive assessments to understand your skills, interests, and ideal career matches.',
          'أجرِ تقييمات شاملة لفهم مهاراتك واهتماماتك ومطابقاتك المهنية المثالية.'
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        {assessments.map((a, i) => (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: brand.primarySurface, color: brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a.Icon style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{a.title}</h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, margin: '2px 0 0' }}>{a.desc}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: brand.textSecondary, marginBottom: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 14, height: 14 }} /> {a.duration}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target style={{ width: 14, height: 14 }} /> {a.questions} {t('questions', 'سؤال')}</span>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: brand.textSecondary, marginBottom: 6 }}>
                <span>{t('Progress', 'التقدم')}</span><span>0%</span>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#F3F4F6' }}>
                <div style={{ width: '0%', height: 6, borderRadius: 3, background: brand.primary, transition: 'width 300ms' }} />
              </div>
            </div>

            <button
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12,
                background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'background 150ms',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
              onMouseLeave={e => e.currentTarget.style.background = brand.primary}
            >
              <Play style={{ width: 14, height: 14 }} /> {t('Start Assessment', 'ابدأ التقييم')}
            </button>
          </div>
        ))}
      </div>

      {/* AI-powered banner */}
      <div style={{
        padding: 24, borderRadius: 16,
        background: brand.primarySurface, border: `1px solid ${brand.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Lightbulb style={{ width: 22, height: 22, color: brand.primary }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('AI-Powered Career Matching', 'مطابقة مهنية بالذكاء الاصطناعي')}</h3>
        </div>
        <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>
          {t(
            'Our advanced AI analyzes your assessment results to provide personalized career recommendations tailored to the UAE job market and your unique profile.',
            'يحلّل ذكاؤنا الاصطناعي المتقدم نتائج تقييمك لتقديم توصيات مهنية مخصصة مصممة لسوق العمل الإماراتي وملفك الشخصي الفريد.'
          )}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: brand.primary, fontWeight: 600 }}>
          <CheckCircle style={{ width: 16, height: 16 }} /> {t('Powered by Gemini 2.5 Pro', 'مدعوم بـ Gemini 2.5 Pro')}
        </div>
      </div>
    </div>
  );

  /* ── Tab 3: Job Market ── */
  const marketTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('UAE Job Market Insights', 'رؤى سوق العمل الإماراتي')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Real-time data on job opportunities, salary trends, and market demand across the UAE.',
          'بيانات آنية عن الفرص الوظيفية واتجاهات الرواتب وطلب السوق في الإمارات.'
        )}
      </p>

      {/* Trending sectors grid */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Trending Sectors', 'القطاعات الرائجة')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {trendingSectors.map((sector, i) => (
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
            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, marginBottom: 10 }}>{sector.name}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: brand.green, color: brand.greenText }}>{sector.growth}</span>
              <span style={{ fontSize: 12, color: brand.textSecondary }}>{sector.jobs} {t('jobs', 'وظيفة')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Key takeaways */}
      <div style={{ padding: 24, borderRadius: 16, background: brand.primarySurface, border: `1px solid ${brand.border}` }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Key Takeaways', 'أبرز النقاط')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: t('Active job openings', 'الوظائف النشطة'), value: '12,500+' },
            { label: t('Average salary growth', 'متوسط نمو الرواتب'), value: '+8.5%' },
            { label: t('Companies actively hiring', 'شركات توظّف بنشاط'), value: '850+' },
            { label: t('Remote opportunities', 'فرص العمل عن بُعد'), value: '3,200+' },
          ].map((kpi, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: brand.primary, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary }}>{kpi.value}</div>
                <div style={{ fontSize: 12, color: brand.textSecondary }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Tab 4: Resources ── */
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
            <button
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12,
                background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
              onMouseLeave={e => e.currentTarget.style.background = brand.primary}
            >
              {r.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'explorer', label: t('Career Explorer', 'مستكشف المسارات'), icon: <Compass className="h-4 w-4" />, content: explorerTab },
    { id: 'assessment', label: t('Skills Assessment', 'تقييم المهارات'), icon: <Target className="h-4 w-4" />, content: assessmentTab },
    { id: 'market', label: t('Job Market', 'سوق العمل'), icon: <TrendingUp className="h-4 w-4" />, content: marketTab },
    { id: 'resources', label: t('Resources', 'الموارد'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Career Planning Hub', 'مركز التخطيط المهني')}
      description={t(
        'Discover your path to professional success in the UAE — explore career paths, assess your skills, and access market intelligence.',
        'اكتشف طريقك إلى النجاح المهني في الإمارات — استكشف المسارات الوظيفية وقيّم مهاراتك واستخدم بيانات السوق.'
      )}
      icon={<Compass className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="explorer"
      actionButtonText={t('Plan Your Career', 'خطّط لمسارك المهني')}
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
