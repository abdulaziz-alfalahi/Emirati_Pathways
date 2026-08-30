
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { GraduationCap, Users, Building, Target, BookOpen, Award, Clock, MapPin, Star, ArrowRight, ArrowLeft, CheckCircle, Globe, Briefcase, ExternalLink, Bookmark, Loader2 } from 'lucide-react';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Graduate programmes — a curated directory, and the candidate's journey.
 *
 * WHAT THIS PAGE USED TO SHOW
 *
 * Six rows written in one instant on 2026-06-17 attributing invented tuition,
 * invented enrolment and a rating from a non-existent rating system to six
 * NAMED REAL UNIVERSITIES: AED 95,000 for the MBRSG MBA, AED 78,000 at Khalifa,
 * "Fully Funded" for a Masdar PhD. Its button ran a Google search for
 * "<university> <programme> graduate admissions". Removed by migration 096.
 *
 * WHAT REPLACES IT, AND THE ONE CONSTRAINT
 *
 * The platform CANNOT accept an application for a university — admissions run
 * through each institution's own system. So it points accurately (every listing
 * carries the institution's own link and the date its details were checked) and
 * remembers the journey (interested / applying / admitted), which is the part
 * no admissions system will ever report back to the Council.
 *
 * Tuition is shown as "as published by <institution>, checked <date>" —
 * attribution, never the platform asserting a fee it cannot know.
 *
 * See docs/graduate_programs_design.md.
 */

// Brand tokens
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySurface: '#F0FDFA',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
};

const API_BASE = import.meta.env.VITE_API_URL || '';

const GraduateProgramsPage: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/academic-programs?level=masters,doctorate`);
      const data = await resp.json();
      setPrograms((data.programs || []).map((p: any) => ({
        id: Number(p.id),
        title: isRTL ? (p.title_ar || p.title) : p.title,
        university: isRTL ? (p.university_ar || p.university) : p.university,
        location: isRTL ? (p.location_ar || p.location) : p.location,
        duration: isRTL ? (p.duration_ar || p.duration) : p.duration,
        type: p.program_type || 'Full-Time',
        typeLabel: isRTL ? (p.type_label_ar || p.type_label) : p.type_label,
        tuition: isRTL ? (p.tuition_ar || p.tuition) : p.tuition,
        // No rating and no enrolment: there is no rating system, and capacity
        // is the university's number, which this platform cannot know. The
        // removed rows invented both.
        featured: p.featured || false,
        applicationLink: p.application_link || '',
        checkedOn: p.details_checked_on || '',
        deadline: p.application_deadline || '',
        linkStatus: p.link_status || '',
        specializations: (isRTL ? p.specializations_ar : p.specializations) || [],
        highlights: (isRTL ? p.highlights_ar : p.highlights) || [],
      })));
    } catch (err) {
      console.error('Failed to load graduate programs:', err);
    } finally {
      setLoading(false);
    }
    if (isAuthenticated) {
      try {
        const r = await restClient.get('/api/academic-programs/my-interest');
        const map: Record<string, string> = {};
        for (const row of (r.data?.interest || [])) map[String(row.id)] = row.interest_status;
        setInterest(map);
      } catch { /* signed in but not a role that records interest */ }
    }
  }, [isRTL, isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const setStage = async (id: number, status: string) => {
    setBusyId(id);
    try {
      if (status === 'none') await restClient.delete(`/api/academic-programs/${id}/interest`);
      else await restClient.post(`/api/academic-programs/${id}/interest`, { status });
      await load();
    } catch (e) { console.error(e); } finally { setBusyId(null); }
  };


  const generalRequirements = [
    t('UAE National or eligible resident', 'مواطن إماراتي أو مقيم مؤهل'),
    t("Bachelor's degree from an accredited institution (GPA 3.0+ preferred)", 'درجة بكالوريوس من مؤسسة معتمدة (يُفضّل معدل 3.0+)'),
    t('English proficiency (IELTS 6.5+ or TOEFL 90+)', 'إتقان اللغة الإنجليزية (IELTS 6.5+ أو TOEFL 90+)'),
    t('Two academic or professional letters of recommendation', 'رسالتا توصية أكاديمية أو مهنية'),
    t('Statement of purpose (500-1,000 words)', 'بيان الغرض (500-1,000 كلمة)'),
    t('Updated CV/Resume', 'سيرة ذاتية محدّثة'),
  ];

  const programSpecificRequirements = [
    t('MBA programs may require GMAT/GRE scores (550+/310+)', 'قد تتطلب برامج MBA درجات GMAT/GRE (550+/310+)'),
    t('STEM programs require relevant undergraduate degree in science or engineering', 'تتطلب برامج STEM درجة بكالوريوس ذات صلة في العلوم أو الهندسة'),
    t("PhD applicants need a completed Master's degree and research proposal", 'يحتاج المتقدمون للدكتوراه إلى درجة ماجستير مكتملة ومقترح بحثي'),
    t('Professional programs may accept equivalent work experience (5+ years)', 'قد تقبل البرامج المهنية خبرة عمل مكافئة (5+ سنوات)'),
    t('LLM programs require a law degree or equivalent legal qualification', 'تتطلب برامج LLM درجة في القانون أو مؤهل قانوني مكافئ'),
  ];

  const typeFilters = [
    { key: 'All', label: t('All', 'الكل') },
    { key: 'Full-Time', label: t('Full-Time', 'دوام كامل') },
    { key: 'Part-Time', label: t('Part-Time', 'دوام جزئي') },
    { key: 'Full-Time Research', label: t('Full-Time Research', 'بحث بدوام كامل') },
  ];

  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = programs.filter(p => {
    const matchType = selectedType === 'All' || p.type === selectedType;
    const matchSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specializations.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  // Real counts derived from the loaded programs — no fabricated figures.
  const uniCount = new Set(programs.map(p => (p.university || '').trim()).filter(Boolean)).size;
  // Was a sum of the seeded `enrolled` column — numbers this platform cannot
  // know, added up and shown as "Graduate Students". Replaced by something it
  // does know: how many of these listings have a checked source.
  const sourced = programs.filter((p: any) => p.checkedOn).length;
  const stats = [
    { value: `${programs.length}`, label: t('Graduate Programs', 'برامج الدراسات العليا'), icon: GraduationCap },
    { value: `${uniCount}`, label: t('Partner Universities', 'الجامعات الشريكة'), icon: Building },
    { value: `${sourced}`, label: t('With a checked source', 'بمصدر تم التحقق منه'), icon: CheckCircle },
  ];

  const tabs = [
    {
      id: 'programs', label: t('Programs', 'البرامج'),
      icon: <GraduationCap className="h-4 w-4" />,
      content: (
        <div>
          {/* Search and filter bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <input
                type="text"
                placeholder={t('Search programs, universities…', 'ابحث عن البرامج والجامعات...')}
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
              {typeFilters.map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedType(filter.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: selectedType === filter.key ? 'none' : `1px solid ${brand.border}`,
                    background: selectedType === filter.key ? brand.primary : '#fff',
                    color: selectedType === filter.key ? '#fff' : brand.textSecondary,
                    cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
                  }}
                >
                  {filter.label}
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
              {filtered.map(p => (
                <div
                  key={p.id}
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
                  {/* Accent bar */}
                  <div style={{ height: 4, background: p.featured ? brand.primary : brand.border }} />

                  <div style={{ padding: 22 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: p.type === 'Full-Time' ? '#DBEAFE' : p.type === 'Part-Time' ? '#FEF3C7' : brand.primarySurface,
                        color: p.type === 'Full-Time' ? '#1E40AF' : p.type === 'Part-Time' ? '#92400E' : brand.primary,
                      }}>
                        {p.typeLabel}
                      </span>
                      {p.featured && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#FEF3C7', color: '#92400E',
                        }}>
                          ★ {t('Featured', 'مميّز')}
                        </span>
                      )}
                      {p.tuition === t('Fully Funded', 'ممولة بالكامل') && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#DCFCE7', color: '#166534',
                        }}>
                          {t('Fully Funded', 'ممولة بالكامل')}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>
                      {p.title}
                    </h3>

                    {/* University & location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Building style={{ width: 14, height: 14, color: brand.textSecondary }} />
                      <span style={{ fontSize: 14, color: brand.textSecondary }}>{p.university}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                      <MapPin style={{ width: 14, height: 14, color: brand.textSecondary }} />
                      <span style={{ fontSize: 14, color: brand.textSecondary }}>{p.location}</span>
                    </div>

                    {/* Tuition & Duration row */}
                    <div style={{
                      display: 'flex', gap: 12, marginBottom: 16,
                      padding: '12px 16px', borderRadius: 12, background: brand.primarySurface,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Tuition', 'الرسوم')}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: brand.primary }}>{p.tuition}</div>
                      </div>
                      <div style={{ width: 1, background: brand.border }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Duration', 'المدة')}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: brand.primary }}>{p.duration}</div>
                      </div>
                    </div>

                    {/* Specializations */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{t('Specializations', 'التخصصات')}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.specializations.map((spec, i) => (
                          <span key={i} style={{
                            padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                            background: '#F3F4F6', color: brand.textPrimary,
                          }}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.highlights.map((h, i) => (
                          <span key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 12, color: brand.textSecondary,
                            padding: '3px 8px', borderRadius: 8, background: '#F9FAFB',
                          }}>
                            <CheckCircle style={{ width: 12, height: 12, color: brand.primary }} />
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Was an enrolment bar over invented figures (45/50, 60/70).
                        What the platform can honestly say is where the details
                        came from and when they were last checked. */}
                    <div style={{ marginBottom: 16, fontSize: 12, color: brand.textSecondary }}>
                      {p.checkedOn && (
                        <div>
                          {t('Details as published by', 'التفاصيل كما نشرتها')} {p.university}
                          {t(', checked ', '، تم التحقق منها في ')}{p.checkedOn}
                        </div>
                      )}
                      {p.deadline && (
                        <div style={{ marginTop: 3 }}>
                          {t('Applications close', 'يغلق التقديم')} {p.deadline}
                        </div>
                      )}
                    </div>

                    {/* Was a star rating from a rating system that does not exist,
                        beside a button that Googled "<university> <programme>
                        graduate admissions". Now: the institution's own link,
                        and where this person is with it. */}
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {p.applicationLink ? (
                        <a href={p.applicationLink} target="_blank" rel="noopener noreferrer"
                           style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '10px 18px', borderRadius: 20, fontSize: 14,
                                    fontWeight: 600, background: brand.primary, color: '#fff',
                                    textDecoration: 'none' }}>
                          {t('Apply on the university site', 'التقديم عبر موقع الجامعة')}
                          <ExternalLink style={{ width: 15, height: 15 }} />
                        </a>
                      ) : <span />}

                      {isAuthenticated && (
                        <select
                          value={interest[String(p.id)] || 'none'}
                          disabled={busyId === p.id}
                          onChange={e => setStage(p.id, e.target.value)}
                          style={{ borderRadius: 10, padding: '9px 12px', fontSize: 13.5,
                                   border: `1px solid ${brand.border}`, background: '#fff',
                                   color: brand.textPrimary, cursor: 'pointer' }}>
                          <option value="none">{t('Not tracking', 'غير متابَع')}</option>
                          <option value="interested">{t('Interested', 'مهتم')}</option>
                          <option value="applying">{t('Applying', 'أتقدّم')}</option>
                          <option value="admitted">{t('Admitted', 'تم القبول')}</option>
                          <option value="declined">{t('Not admitted', 'لم يتم القبول')}</option>
                          <option value="withdrawn">{t('Withdrew', 'انسحبت')}</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'requirements', label: t('Requirements', 'المتطلبات'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* General Requirements */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: `1px solid ${brand.border}`, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Target style={{ width: 18, height: 18, color: '#166534' }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary }}>{t('General Requirements', 'المتطلبات العامة')}</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {generalRequirements.map((req, i) => (
                <li key={i} style={{
                  display: 'flex', gap: 10, padding: '10px 0',
                  borderBottom: i < generalRequirements.length - 1 ? `1px solid ${brand.border}` : 'none',
                  fontSize: 14, color: brand.textPrimary, lineHeight: 1.5,
                }}>
                  <CheckCircle style={{ width: 16, height: 16, color: brand.primary, flexShrink: 0, marginTop: 2 }} />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Program-Specific Requirements */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: `1px solid ${brand.border}`, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building style={{ width: 18, height: 18, color: '#1E40AF' }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary }}>{t('Program-Specific', 'حسب البرنامج')}</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {programSpecificRequirements.map((req, i) => (
                <li key={i} style={{
                  display: 'flex', gap: 10, padding: '10px 0',
                  borderBottom: i < programSpecificRequirements.length - 1 ? `1px solid ${brand.border}` : 'none',
                  fontSize: 14, color: brand.textPrimary, lineHeight: 1.5,
                }}>
                  <CheckCircle style={{ width: 16, height: 16, color: '#1E40AF', flexShrink: 0, marginTop: 2 }} />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'funding', label: t('Funding & Support', 'التمويل والدعم'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Award style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Funding Opportunities', 'فرص التمويل')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14, maxWidth: 500, margin: '0 auto 20px' }}>
            {t(
              'Explore scholarships, grants, and financial aid options available for UAE nationals pursuing graduate education.',
              'استكشف المنح الدراسية والمنح البحثية وخيارات الدعم المالي المتاحة للمواطنين الإماراتيين الملتحقين بالدراسات العليا.'
            )}
          </p>
          <a href="/scholarships" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600,
            background: brand.primary, color: '#fff', textDecoration: 'none',
            cursor: 'pointer',
          }}>
            {t('View Scholarships', 'عرض المنح الدراسية')} <ArrowIcon style={{ width: 16, height: 16 }} />
          </a>
        </div>
      ),
    },
  ].map(tb => ({ ...tb, content: <div onClick={e => e.stopPropagation()}>{tb.content}</div> }));

  return (
    <EducationPathwayLayout
      title={t('Graduate Programs', 'برامج الدراسات العليا')}
      description={t(
        'Advance your career with world-class graduate programs at leading UAE universities, designed for ambitious Emirati professionals.',
        'طوّر مسيرتك المهنية مع برامج دراسات عليا عالمية المستوى في الجامعات الرائدة بالإمارات، مصممة للمهنيين الإماراتيين الطموحين.'
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

export default GraduateProgramsPage;
