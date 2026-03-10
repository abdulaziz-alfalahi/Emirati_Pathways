
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { GraduationCap, Users, Building, Target, MapPin, Star, Clock, CheckCircle, ArrowRight, ArrowLeft, Award, Globe, BookOpen, Briefcase, ExternalLink, Loader2 } from 'lucide-react';
import { getPrograms, getUniversities, type UniversityProgram, type University } from '@/services/educationAPI';

// Brand tokens
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySurface: '#F0FDFA',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
};

const UniversityProgramsPage: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  /** Pick the localized value from an API record. */
  const loc = (en: string | undefined, ar: string | undefined) => isRTL ? (ar || en || '') : (en || '');

  // ── API-driven state ──
  const [programs, setPrograms] = useState<UniversityProgram[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [progs, unis] = await Promise.all([getPrograms(), getUniversities()]);
        if (!cancelled) {
          setPrograms(progs);
          setUniversities(unis);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load education data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Build category filters from actual data
  const categorySet = new Set(programs.map(p => p.category));
  const categoryFilters = [
    { key: 'All', label: t('All', 'الكل') },
    ...Array.from(categorySet).map(c => ({ key: c, label: t(c, programs.find(p => p.category === c)?.category_ar || c) })),
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = programs.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !searchQuery ||
      loc(p.title, p.title_ar).toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc(p.university_name, p.university_name_ar).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subjects || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const stats = [
    { value: `${universities.length}+`, label: t('Universities & Colleges', 'الجامعات والكليات'), icon: Building },
    { value: `${programs.length}+`, label: t('Degree Programs', 'البرامج الأكاديمية'), icon: GraduationCap },
    { value: '92%', label: t('Employment Rate', 'نسبة التوظيف'), icon: Target },
    { value: `${programs.reduce((sum, p) => sum + (p.enrolled || 0), 0).toLocaleString()}+`, label: t('Students Enrolled', 'طالب مسجّل'), icon: Users },
  ];

  const getCategoryColor = (cat: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      'Technology': { bg: '#DBEAFE', color: '#1E40AF' },
      'Healthcare': { bg: '#FEE2E2', color: '#991B1B' },
      'Business': { bg: '#FEF3C7', color: '#92400E' },
      'Engineering': { bg: '#F3E8FF', color: '#6B21A8' },
      'Arts & Humanities': { bg: '#FFF1F2', color: '#BE123C' },
      'Aviation': { bg: brand.primarySurface, color: brand.primary },
    };
    return map[cat] || { bg: '#F3F4F6', color: brand.textSecondary };
  };

  // Loading state
  if (loading) {
    return (
      <EducationPathwayLayout
        title={t('University Programs', 'البرامج الجامعية')}
        description={t('Loading programs...', 'جارٍ تحميل البرامج...')}
        icon={<GraduationCap className="h-12 w-12" style={{ color: '#0D9488' }} />}
        stats={[]}
        tabs={[{
          id: 'loading', label: t('Loading', 'تحميل'), icon: <Loader2 className="h-4 w-4 animate-spin" />, content: (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <Loader2 style={{ width: 48, height: 48, color: brand.primary, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: brand.textSecondary, fontSize: 16 }}>{t('Loading university programs...', 'جارٍ تحميل البرامج الجامعية...')}</p>
            </div>
          )
        }]}
        defaultTab="loading"
      />
    );
  }

  const tabs = [
    {
      id: 'programs', label: t('University Programs', 'البرامج الجامعية'),
      icon: <GraduationCap className="h-4 w-4" />,
      content: (
        <div>
          {/* Search and filter bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <input
                type="text"
                placeholder={t('Search programs, universities, subjects…', 'ابحث عن البرامج والجامعات والتخصصات...')}
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
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categoryFilters.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: selectedCategory === cat.key ? 'none' : `1px solid ${brand.border}`,
                    background: selectedCategory === cat.key ? brand.primary : '#fff',
                    color: selectedCategory === cat.key ? '#fff' : brand.textSecondary,
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
              `Showing ${filtered.length} program${filtered.length !== 1 ? 's' : ''}`,
              `عرض ${filtered.length} ${filtered.length === 1 ? 'برنامج' : 'برامج'}`
            )}
          </p>

          {/* Program cards */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <GraduationCap style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('No programs found', 'لم يتم العثور على برامج')}</h3>
              <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Try adjusting your search or filter criteria.', 'حاول تعديل معايير البحث أو التصفية.')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
              {filtered.map(p => {
                const catColor = getCategoryColor(p.category);
                const degreeLabel = p.degree === 'bachelor' ? t("Bachelor's", 'بكالوريوس')
                  : p.degree === 'master' ? t("Master's", 'ماجستير')
                    : p.degree === 'doctorate' ? t('Doctorate', 'دكتوراه') : p.degree;
                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#fff', borderRadius: 16,
                      border: `1px solid ${brand.border}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms',
                      cursor: 'pointer',
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
                    {/* Accent bar */}
                    <div style={{ height: 4, background: p.is_popular ? brand.primary : brand.border }} />

                    <div style={{ padding: 22 }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: catColor.bg, color: catColor.color,
                        }}>
                          {loc(p.category, p.category_ar)}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#F3F4F6', color: brand.textSecondary,
                        }}>
                          {degreeLabel}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#F3F4F6', color: brand.textSecondary,
                        }}>
                          {p.language}
                        </span>
                        {p.is_popular && (
                          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#FEE2E2', color: '#991B1B' }}>
                            🔥 {t('Popular', 'رائج')}
                          </span>
                        )}
                        {p.is_new && (
                          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#DCFCE7', color: '#166534' }}>
                            ✨ {t('New', 'جديد')}
                          </span>
                        )}
                        {p.scholarship_available && (
                          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#FEF3C7', color: '#92400E' }}>
                            💰 {t('Scholarship', 'منحة')}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>
                        {loc(p.title, p.title_ar)}
                      </h3>

                      {/* University & location */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Building style={{ width: 14, height: 14, color: brand.textSecondary }} />
                        <span style={{ fontSize: 14, color: brand.textSecondary }}>{loc(p.university_name, p.university_name_ar)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <MapPin style={{ width: 14, height: 14, color: brand.textSecondary }} />
                        <span style={{ fontSize: 14, color: brand.textSecondary }}>{p.university_location || ''}، {t('UAE', 'الإمارات')}</span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>
                        {loc(p.description, p.description_ar)}
                      </p>

                      {/* Tuition, Duration, Employment row */}
                      <div style={{
                        display: 'flex', gap: 0, marginBottom: 16,
                        borderRadius: 12, background: brand.primarySurface, overflow: 'hidden',
                      }}>
                        <div style={{ flex: 1, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Tuition', 'الرسوم')}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{p.tuition}</div>
                        </div>
                        <div style={{ width: 1, background: brand.border }} />
                        <div style={{ flex: 1, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Duration', 'المدة')}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{p.duration}</div>
                        </div>
                        <div style={{ width: 1, background: brand.border }} />
                        <div style={{ flex: 1, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Jobs', 'وظائف')}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>{p.employment_rate}%</div>
                        </div>
                      </div>

                      {/* Subjects */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{t('Key Subjects', 'المواد الرئيسية')}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(p.subjects || []).map((s: string, i: number) => (
                            <span key={i} style={{
                              padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                              background: '#F3F4F6', color: brand.textPrimary,
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Career Outcomes */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(p.career_outcomes || []).map((c: string, i: number) => (
                            <span key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: brand.textSecondary,
                              padding: '3px 8px', borderRadius: 8, background: '#F9FAFB',
                            }}>
                              <Briefcase style={{ width: 12, height: 12, color: brand.primary }} />
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Accreditation */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(p.accreditation || []).map((a: string, i: number) => (
                            <span key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: '#166534',
                              padding: '3px 8px', borderRadius: 8, background: '#DCFCE7',
                            }}>
                              <CheckCircle style={{ width: 12, height: 12 }} />
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Enrollment bar */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                          <span>{(p.enrolled || 0).toLocaleString(isRTL ? 'ar-AE' : 'en-US')} {t('enrolled', 'مسجّل')}</span>
                          <span>{((p.capacity || 0) - (p.enrolled || 0)).toLocaleString(isRTL ? 'ar-AE' : 'en-US')} {t('spots left', 'مقعد متاح')}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6' }}>
                          <div style={{
                            height: '100%', borderRadius: 2, background: brand.primary,
                            width: `${p.capacity ? ((p.enrolled || 0) / p.capacity) * 100 : 0}%`,
                            transition: 'width 300ms',
                          }} />
                        </div>
                      </div>

                      {/* Rating & Apply */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star style={{ width: 14, height: 14, color: '#F59E0B', fill: '#F59E0B' }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{p.rating}</span>
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: brand.primary, color: '#fff',
                          cursor: 'pointer', transition: 'background 150ms',
                        }}>
                          {t('Apply Now', 'قدّم الآن')} <ArrowIcon style={{ width: 16, height: 16 }} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'universities', label: t('Universities', 'الجامعات'),
      icon: <Building className="h-4 w-4" />,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {universities.map(u => (
            <div
              key={u.id}
              style={{
                background: '#fff', borderRadius: 16,
                border: `1px solid ${brand.border}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms',
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
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>{loc(u.name, u.name_ar)}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin style={{ width: 14, height: 14, color: brand.textSecondary }} />
                      <span style={{ fontSize: 14, color: brand.textSecondary }}>{u.location} · {t('Est.', 'تأسست')} {u.established}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                    background: u.type === 'public' ? '#DCFCE7' : '#DBEAFE',
                    color: u.type === 'public' ? '#166534' : '#1E40AF',
                  }}>
                    {u.type === 'public' ? t('Public', 'حكومية') : t('Private', 'خاصة')}
                  </span>
                </div>

                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 18 }}>
                  {loc(u.description, u.description_ar)}
                </p>

                {/* Stats row */}
                <div style={{
                  display: 'flex', gap: 0, marginBottom: 16,
                  borderRadius: 12, background: brand.primarySurface, overflow: 'hidden',
                }}>
                  <div style={{ flex: 1, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>#{u.ranking}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('UAE Rank', 'الترتيب')}</div>
                  </div>
                  <div style={{ width: 1, background: brand.border }} />
                  <div style={{ flex: 1, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{(u.students_count || 0).toLocaleString(isRTL ? 'ar-AE' : 'en-US')}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Students', 'طلاب')}</div>
                  </div>
                  <div style={{ width: 1, background: brand.border }} />
                  <div style={{ flex: 1, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{u.programs_count}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Programs', 'برامج')}</div>
                  </div>
                </div>

                {/* Specialties */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{t('Specialties', 'التخصصات')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(u.specialties || []).map((s: string, i: number) => (
                      <span key={i} style={{
                        padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                        background: '#F3F4F6', color: brand.textPrimary,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: `1px solid ${brand.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                    <Globe style={{ width: 14, height: 14 }} />
                    {u.website}
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: brand.primary, color: '#fff',
                    cursor: 'pointer',
                  }}>
                    {t('View Programs', 'عرض البرامج')} <ArrowIcon style={{ width: 14, height: 14 }} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'scholarships', label: t('Scholarships & Aid', 'المنح والدعم المالي'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Award style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Financial Aid & Scholarships', 'الدعم المالي والمنح الدراسية')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14, maxWidth: 500, margin: '0 auto 20px' }}>
            {t(
              'Explore scholarships, tuition waivers, and financial aid available for UAE nationals pursuing university education.',
              'استكشف المنح الدراسية والإعفاءات من الرسوم والدعم المالي المتاح للمواطنين الإماراتيين الملتحقين بالتعليم الجامعي.'
            )}
          </p>
          <a href="/scholarships" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600,
            background: brand.primary, color: '#fff', textDecoration: 'none',
          }}>
            {t('View Scholarships', 'عرض المنح الدراسية')} <ArrowIcon style={{ width: 16, height: 16 }} />
          </a>
        </div>
      ),
    },
  ];

  return (
    <EducationPathwayLayout
      title={t('University Programs', 'البرامج الجامعية')}
      description={t(
        "Explore accredited degree programs at leading UAE universities — from bachelor's to doctoral studies — designed to launch your career.",
        'استكشف البرامج الأكاديمية المعتمدة في الجامعات الرائدة في الإمارات — من البكالوريوس إلى الدكتوراه — مصممة لإطلاق مسيرتك المهنية.'
      )}
      icon={<GraduationCap className="h-12 w-12" style={{ color: '#0D9488' }} />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
      actionButtonText={t('Explore Programs', 'استكشف البرامج')}
      actionButtonHref="#programs"
      academicYear="2025-2026"
    />
  );
};

export default UniversityProgramsPage;
