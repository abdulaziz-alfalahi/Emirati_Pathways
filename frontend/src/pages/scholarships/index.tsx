
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { restClient } from '@/utils/api';
import { Award, Users, GraduationCap, Clock, ExternalLink, ArrowRight, ArrowLeft, Globe, BookOpen, Loader2, RefreshCw } from 'lucide-react';

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
  blue: '#DBEAFE',
  blueText: '#1E40AF',
};

// Real row shape from GET /api/education/scholarships (live `scholarships` table)
interface Scholarship {
  id: number;
  title: string;
  provider_name: string | null;
  description: string | null;
  amount: string | null;          // free-text varchar, shown verbatim
  coverage_type: string | null;
  deadline: string | null;        // "YYYY-MM-DD"
  min_gpa: number | string | null;
  academic_level: string | null;
  eligible_majors: string[] | null;
  application_link: string | null;
  is_active: boolean;
}

const ScholarshipsPage: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());

  const fetchScholarships = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await restClient.get('/api/education/scholarships');
      const rows: Scholarship[] = Array.isArray(res.data?.scholarships) ? res.data.scholarships : [];
      setScholarships(rows.filter(r => r.is_active !== false));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScholarships(); }, [fetchScholarships]);

  const handleApply = async (s: Scholarship) => {
    if (s.application_link) {
      window.open(s.application_link, '_blank', 'noopener,noreferrer');
      return;
    }
    setApplyingId(s.id);
    try {
      await restClient.post(`/api/education/scholarships/${s.id}/apply`, {});
      setAppliedIds(prev => new Set(prev).add(s.id));
      toast.success(t('Application submitted successfully.', 'تم إرسال طلبك بنجاح.'));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        setAppliedIds(prev => new Set(prev).add(s.id));
        toast.info(t('You have already applied to this scholarship.', 'لقد تقدمت بالفعل لهذه المنحة.'));
      } else if (status === 401 || status === 422) {
        toast.error(t('Please sign in to apply for scholarships.', 'يرجى تسجيل الدخول للتقديم على المنح.'));
      } else {
        toast.error(t('Could not submit your application. Please try again.', 'تعذر إرسال طلبك. يرجى المحاولة مرة أخرى.'));
      }
    } finally {
      setApplyingId(null);
    }
  };

  // Level filter options derived from real data
  const levelOptions = useMemo(() => {
    const levels = Array.from(new Set(
      scholarships.map(s => (s.academic_level || '').trim()).filter(Boolean)
    ));
    return [{ key: 'All', label: t('All', 'الكل') }, ...levels.map(l => ({ key: l, label: l }))];
  }, [scholarships, isRTL]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scholarships.filter(s => {
      const matchLevel = selectedLevel === 'All' || (s.academic_level || '').trim() === selectedLevel;
      const matchSearch = !q ||
        (s.title || '').toLowerCase().includes(q) ||
        (s.provider_name || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [scholarships, selectedLevel, searchQuery]);

  const providerCount = useMemo(
    () => new Set(scholarships.map(s => (s.provider_name || '').trim()).filter(Boolean)).size,
    [scholarships]
  );

  // Honest stats: counts derived from the live data only
  const stats = [
    { value: loading || loadError ? '—' : String(scholarships.length), label: t('Available Scholarships', 'المنح المتاحة'), icon: Award },
    { value: loading || loadError ? '—' : String(providerCount), label: t('Providers', 'الجهات المانحة'), icon: Users },
  ];

  const formatDeadline = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatGpa = (g: Scholarship['min_gpa']) => {
    const n = Number(g);
    return isNaN(n) ? String(g) : n.toFixed(1).replace(/\.0$/, '') || String(g);
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const availableContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Loader2 className="animate-spin" style={{ width: 36, height: 36, color: brand.primary, margin: '0 auto 16px' }} />
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Loading scholarships…', 'جارٍ تحميل المنح الدراسية...')}</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Award style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {t("Couldn't load scholarships", 'تعذر تحميل المنح الدراسية')}
          </h3>
          <p style={{ color: brand.textSecondary, fontSize: 14, marginBottom: 20 }}>
            {t('Something went wrong while fetching scholarships. Please try again.', 'حدث خطأ أثناء جلب المنح الدراسية. يرجى المحاولة مرة أخرى.')}
          </p>
          <button
            onClick={fetchScholarships}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600,
              background: brand.primary, color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} /> {t('Retry', 'إعادة المحاولة')}
          </button>
        </div>
      );
    }

    if (scholarships.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: brand.primarySurface,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Award style={{ width: 34, height: 34, color: brand.primary }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {t('No scholarships are published yet', 'لا توجد منح منشورة بعد')}
          </h3>
          <p style={{ color: brand.textSecondary, fontSize: 14, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            {t(
              'New scholarship opportunities will appear here as soon as providers publish them. Check back soon.',
              'ستظهر فرص المنح الجديدة هنا فور نشرها من قبل الجهات المانحة. عاود الزيارة قريباً.'
            )}
          </p>
        </div>
      );
    }

    return (
      <div>
        {/* Search and filter bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
            <input
              type="text"
              placeholder={t('Search scholarships…', 'ابحث عن المنح الدراسية...')}
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
          {levelOptions.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {levelOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedLevel(opt.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: selectedLevel === opt.key ? 'none' : `1px solid ${brand.border}`,
                    background: selectedLevel === opt.key ? brand.primary : '#fff',
                    color: selectedLevel === opt.key ? '#fff' : brand.textSecondary,
                    cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20 }}>
          {t(
            `Showing ${filtered.length} scholarship${filtered.length !== 1 ? 's' : ''}`,
            `عرض ${filtered.length} ${filtered.length === 1 ? 'منحة' : 'منح دراسية'}`
          )}
        </p>

        {/* Scholarship cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Award style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('No scholarships found', 'لم يتم العثور على منح')}</h3>
            <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Try adjusting your search or filter criteria.', 'حاول تعديل معايير البحث أو التصفية.')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filtered.map(s => {
              const majors = Array.isArray(s.eligible_majors) ? s.eligible_majors : [];
              const applied = appliedIds.has(s.id);
              const applying = applyingId === s.id;
              return (
                <div
                  key={s.id}
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: `1px solid ${brand.border}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms',
                    display: 'flex', flexDirection: 'column',
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
                  {/* Card header accent */}
                  <div style={{ height: 4, background: brand.primary }} />

                  <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Badges row */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                      {s.academic_level && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: brand.blue, color: brand.blueText,
                        }}>
                          {s.academic_level}
                        </span>
                      )}
                      {s.coverage_type && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#F3F4F6', color: brand.textSecondary,
                        }}>
                          {s.coverage_type}
                        </span>
                      )}
                      {s.min_gpa != null && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: brand.amber, color: brand.amberText,
                        }}>
                          {t(`GPA ${formatGpa(s.min_gpa)}+`, `معدل ${formatGpa(s.min_gpa)}+`)}
                        </span>
                      )}
                    </div>

                    {/* Title, provider & description */}
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>
                      {s.title}
                    </h3>
                    {s.provider_name && (
                      <p style={{ fontSize: 13, fontWeight: 500, color: brand.primaryDark, marginBottom: 8 }}>
                        {s.provider_name}
                      </p>
                    )}
                    {s.description && (
                      <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 18 }}>
                        {s.description}
                      </p>
                    )}

                    {/* Award amount highlight (verbatim from provider) */}
                    {s.amount && (
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16,
                        padding: '12px 16px', borderRadius: 12, background: brand.primarySurface,
                      }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{s.amount}</span>
                      </div>
                    )}

                    {/* Eligible majors */}
                    {majors.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {majors.map((m, i) => (
                            <span key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: brand.textSecondary,
                              padding: '3px 8px', borderRadius: 8, background: '#F9FAFB',
                            }}>
                              <GraduationCap style={{ width: 12, height: 12, color: brand.primary }} />
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta row */}
                    {s.deadline && (
                      <div style={{
                        display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap',
                        padding: '10px 0', borderTop: `1px solid ${brand.border}`,
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                          <Clock style={{ width: 14, height: 14 }} /> {t('Deadline:', 'الموعد النهائي:')} <strong style={{ color: '#DC2626' }}>{formatDeadline(s.deadline)}</strong>
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: isRTL ? 'flex-start' : 'flex-end', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleApply(s)}
                        disabled={applied || applying}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: applied ? '#F3F4F6' : brand.primary,
                          color: applied ? brand.textSecondary : '#fff',
                          cursor: applied || applying ? 'default' : 'pointer',
                          transition: 'background 150ms', border: 'none',
                        }}
                      >
                        {applying ? (
                          <>
                            <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> {t('Submitting…', 'جارٍ الإرسال...')}
                          </>
                        ) : applied ? (
                          t('Applied', 'تم التقديم')
                        ) : s.application_link ? (
                          <>
                            {t('Apply on provider site', 'قدّم عبر موقع الجهة المانحة')} <ExternalLink style={{ width: 16, height: 16 }} />
                          </>
                        ) : (
                          <>
                            {t('Apply Now', 'قدّم الآن')} <ArrowIcon style={{ width: 16, height: 16 }} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    {
      id: 'available', label: t('Available Scholarships', 'المنح المتاحة'),
      icon: <Award className="h-4 w-4" />,
      content: availableContent(),
    },
    {
      id: 'my-applications', label: t('My Applications', 'طلباتي'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <BookOpen style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Application tracking coming soon', 'تتبع الطلبات قادم قريباً')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Apply for scholarships to track your applications here.', 'قدّم على المنح الدراسية لتتبع طلباتك هنا.')}</p>
        </div>
      )
    },
    {
      id: 'resources', label: t('Resources & Tips', 'الموارد والنصائح'),
      icon: <Globe className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Globe style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Application Resources', 'موارد التقديم')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Guides, tips, and resources for preparing strong scholarship applications.', 'أدلة ونصائح وموارد لإعداد طلبات منح دراسية قوية.')}</p>
        </div>
      )
    }
  ];

  return (
    <EducationPathwayLayout
      title={t('Scholarships', 'المنح الدراسية')}
      description={t(
        'Explore scholarship opportunities designed to support UAE nationals in pursuing academic excellence and professional development.',
        'استكشف فرص المنح الدراسية المصممة لدعم المواطنين الإماراتيين في تحقيق التميز الأكاديمي والتطوير المهني.'
      )}
      icon={<Award className="h-12 w-12" style={{ color: '#0D9488' }} />}
      stats={stats}
      tabs={tabs}
      defaultTab="available"
      actionButtonText={t('Browse Scholarships', 'تصفح المنح الدراسية')}
      actionButtonHref="#available"
    />
  );
};

export default ScholarshipsPage;
