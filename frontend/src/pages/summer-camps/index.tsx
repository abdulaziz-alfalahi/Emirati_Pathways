
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { BookOpen, Users, Calendar, Trophy, MapPin, Clock, Star, ArrowRight, Search, Check, Loader2 } from 'lucide-react';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Knowledge Camps — the public listing and registration.
 *
 * WHAT THIS PAGE USED TO BE
 *
 * Six seed rows written on 2026-05-04 with invented ratings (4.5-4.9), invented
 * enrolment counts (45/60) and invented prices, whose totals this page summed
 * into a public "Students Enrolled" figure. Its register button ran:
 *
 *     window.open(`https://www.google.com/search?q=${camp.title.en} Dubai registration`)
 *
 * It Googled the camp's name. "My Registrations" beneath it could never
 * populate, because nothing was ever recorded.
 *
 * Now: providers submit, the Education Operator publishes, and registration
 * happens here. See docs/knowledge_camps_design.md.
 */

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
};

const API_BASE = import.meta.env.VITE_API_URL || '';

const categories = [
  { id: 'All', en: 'All', ar: 'الكل' },
  { id: 'Technology', en: 'Technology', ar: 'التكنولوجيا' },
  { id: 'Science', en: 'Science', ar: 'العلوم' },
  { id: 'Arts', en: 'Arts', ar: 'الفنون' },
  { id: 'Leadership', en: 'Leadership', ar: 'القيادة' },
  { id: 'Sports', en: 'Sports', ar: 'الرياضة' },
];

const SummerCampsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/youth-programs?stream=camp`);
      const data = await resp.json();
      setCamps((data.programs || []).map((c: any) => ({
        id: String(c.id),
        title: { en: c.title || '', ar: c.title_ar || c.title || '' },
        category: c.category || '',
        ageGroup: c.age_group || '',
        location: c.location || '',
        duration: c.duration || '',
        price: c.price || '',
        // A COUNT of registrations, not a number somebody typed.
        registered: c.registered || 0,
        capacity: c.capacity || 0,
        startDate: c.start_date || '',
        description: { en: c.description || '', ar: c.description_ar || c.description || '' },
        featured: c.featured || false,
      })));
    } catch (err) {
      console.error('Failed to load camps:', err);
    } finally {
      setLoading(false);
    }
    if (isAuthenticated) {
      try {
        const r = await restClient.get('/api/youth-programs/my-registrations');
        setRegistrations(r.data?.registrations || []);
      } catch { /* signed in but not a role that registers — leave it empty */ }
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const registeredIds = new Set(registrations.map((r: any) => String(r.id)));

  const registerFor = async (campId: string) => {
    setBusyId(campId); setNotice(null);
    try {
      const r = await restClient.post(`/api/youth-programs/${campId}/register`, {});
      setNotice(r.data?.message || t('You are registered.', 'تم تسجيلك.'));
      await load();
    } catch (e: any) {
      setNotice(e?.response?.data?.error
        || t('Could not register you for this camp.', 'تعذّر تسجيلك في هذا المعسكر.'));
    } finally { setBusyId(null); }
  };

  const cancelFor = async (campId: string) => {
    setBusyId(campId); setNotice(null);
    try {
      const r = await restClient.delete(`/api/youth-programs/${campId}/register`);
      setNotice(r.data?.message || t('Your place has been given up.', 'تم التخلي عن مقعدك.'));
      await load();
    } catch (e: any) {
      setNotice(e?.response?.data?.error || t('Could not cancel.', 'تعذّر الإلغاء.'));
    } finally { setBusyId(null); }
  };

  // Inline bilingual helper — same pattern as SchoolProgramsPage
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  const filtered = camps.filter(camp => {
    const matchCat = selectedCategory === 'All' || camp.category === selectedCategory;
    const matchSearch = !searchQuery || camp.title[lang].toLowerCase().includes(searchQuery.toLowerCase())
      || camp.category.toLowerCase().includes(searchQuery.toLowerCase())
      || camp.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });


  // Real counts derived from the loaded camps — no fabricated figures.
  // Was a sum of the seeded `enrolled` column — numbers nobody counted, added
  // up and shown to the public. Now a sum of actual registrations.
  const enrolledTotal = camps.reduce((s: number, c: any) => s + (c.registered || 0), 0);
  const categoryCount = new Set(camps.map((c: any) => c.category).filter(Boolean)).size;
  const locationCount = new Set(camps.map((c: any) => c.location).filter(Boolean)).size;
  const stats = [
    { value: `${camps.length}`, label: t('Knowledge Programs', 'برامج معرفية'), icon: BookOpen },
    { value: `${enrolledTotal}`, label: t('Students Enrolled', 'الطلاب المسجلين'), icon: Users },
    { value: `${categoryCount}`, label: t('Categories', 'الفئات'), icon: Calendar },
    { value: `${locationCount}`, label: t('Locations', 'المواقع'), icon: Trophy },
  ];

  const tabs = [
    {
      id: 'available', label: t('Available Programs', 'البرامج المتاحة'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div>
          {notice && (
            <div style={{ background: brand.primarySurface, color: brand.primaryDark,
                          border: `1px solid ${brand.border}`, borderRadius: 10,
                          padding: '10px 14px', marginBottom: 14, fontSize: 13.5 }}>
              {notice}
            </div>
          )}
          {/* Search and filter bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <input
                type="text"
                placeholder={t('Search programs…', 'البحث في البرامج...')}
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

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: selectedCategory === cat.id ? 'none' : `1px solid ${brand.border}`,
                    background: selectedCategory === cat.id ? brand.primary : '#fff',
                    color: selectedCategory === cat.id ? '#fff' : brand.textSecondary,
                    cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
                  }}
                >
                  {cat[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Camp cards grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <BookOpen style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('No programs found', 'لم يتم العثور على برامج')}
              </h3>
              <p style={{ color: brand.textSecondary, fontSize: 14 }}>
                {t('Try adjusting your search or filter criteria.', 'حاول تعديل معايير البحث أو التصفية.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filtered.map(camp => (
                <div
                  key={camp.id}
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: `1px solid ${brand.border}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    overflow: 'hidden', transition: 'border-color 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = brand.primary)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = brand.border)}
                >
                  <div style={{ height: 4, background: camp.featured ? brand.primary : brand.border }} />
                  <div style={{ padding: 20 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: brand.primarySurface, color: brand.primary,
                      }}>
                        {camp.category}
                      </span>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: '#F3F4F6', color: brand.textSecondary,
                      }}>
                        {t(`Ages ${camp.ageGroup}`, `الأعمار ${camp.ageGroup}`)}
                      </span>
                      {camp.featured && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: brand.amber, color: brand.amberText,
                        }}>
                          {t('★ Featured', '★ مميز')}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                      {camp.title[lang]}
                    </h3>
                    <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>
                      {camp.description[lang]}
                    </p>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                        <MapPin style={{ width: 14, height: 14 }} /> {camp.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                        <Clock style={{ width: 14, height: 14 }} /> {camp.duration}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                        <Star style={{ width: 14, height: 14 }} /> {camp.rating}
                      </span>
                    </div>

                    {/* Enrollment progress */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                        <span>{camp.registered} / {camp.capacity || '—'} {t('registered', 'مسجل')}</span>
                        <span>{camp.capacity ? Math.round((camp.registered / camp.capacity) * 100) : 0}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          background: brand.primary,
                          width: `${camp.capacity ? Math.min(100, (camp.registered / camp.capacity) * 100) : 0}%`,
                          transition: 'width 300ms',
                        }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 18, fontWeight: 600, color: brand.primary }}>{camp.price}</span>
                      {/* Was a window.open() onto a Google search for the camp's
                          name. Registration happens here now. */}
                      {(() => {
                        const mine = registeredIds.has(camp.id);
                        const full = camp.capacity > 0 && camp.registered >= camp.capacity;
                        const busy = busyId === camp.id;
                        if (!isAuthenticated) {
                          return (
                            <a href="/auth" style={{ display: 'flex', alignItems: 'center', gap: 4,
                                                     fontSize: 14, fontWeight: 500, color: brand.primary }}>
                              {t('Sign in to register', 'سجّل الدخول للتسجيل')}
                              <ArrowRight style={{ width: 16, height: 16 }} />
                            </a>
                          );
                        }
                        return (
                          <button
                            data-has-handler="true"
                            disabled={busy}
                            onClick={() => (mine ? cancelFor(camp.id) : registerFor(camp.id))}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              background: mine ? '#fff' : brand.primary,
                              border: `1px solid ${mine ? brand.border : brand.primary}`,
                              borderRadius: 10, padding: '7px 14px',
                              fontSize: 14, fontWeight: 600,
                              color: mine ? brand.textSecondary : '#fff',
                              cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1,
                            }}>
                            {busy ? <Loader2 size={14} className="animate-spin" />
                                  : mine ? <Check size={14} /> : null}
                            {mine ? t('Registered — give up place', 'مسجَّل — التخلي عن المقعد')
                                  : full ? t('Full — join waiting list', 'مكتمل — الانضمام لقائمة الانتظار')
                                         : t('Register', 'سجّل')}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'registrations', label: t('My Registrations', 'تسجيلاتي'),
      icon: <Users className="h-4 w-4" />,
      /* This tab was a permanent empty state: it said "register to see them
         here" while nothing anywhere recorded a registration. */
      content: registrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Users style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {isAuthenticated ? t('No registrations yet', 'لا توجد تسجيلات حتى الآن')
                             : t('Sign in to see your registrations', 'سجّل الدخول لعرض تسجيلاتك')}
          </h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>
            {t('Browse available programs and register to see them here.', 'تصفح البرامج المتاحة وسجل لعرضها هنا.')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {registrations.map((r: any) => (
            <div key={r.id} style={{ border: `1px solid ${brand.border}`, borderRadius: 12,
                                     padding: 16, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: brand.textPrimary }}>
                    {lang === 'ar' ? (r.title_ar || r.title) : r.title}
                  </div>
                  <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 3 }}>
                    {[r.category, r.location, r.start_date].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span style={{
                  borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 600,
                  background: r.registration_status === 'registered' ? brand.primarySurface : brand.amber,
                  color: r.registration_status === 'registered' ? brand.primaryDark : brand.amberText }}>
                  {r.registration_status === 'registered'
                    ? t('Registered', 'مسجَّل') : t('Waiting list', 'قائمة الانتظار')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'resources', label: t('Resources', 'الموارد'),
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Calendar style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {t('Program Resources', 'موارد البرامج')}
          </h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>
            {t('Resources and materials for registered programs will appear here.', 'ستظهر هنا الموارد والمواد للبرامج المسجل بها.')}
          </p>
        </div>
      )
    }
  ].map(tb => ({ ...tb, content: <div onClick={e => e.stopPropagation()}>{tb.content}</div> }));

  return (
    <EducationPathwayLayout
      title={t('Knowledge Camps', 'معسكرات المعرفة')}
      description={t(
        'Discover enriching knowledge programs designed to develop skills, creativity, and leadership in young Emiratis.',
        'اكتشف برامج معرفية إثرائية مصممة لتنمية المهارات والإبداع والقيادة لدى الشباب الإماراتي.'
      )}
      icon={<BookOpen className="h-12 w-12" style={{ color: '#0D9488' }} />}
      stats={stats}
      tabs={tabs}
      defaultTab="available"
      actionButtonText={t('Browse Programs', 'تصفح البرامج')}
      actionButtonHref="#available"
      academicYear="2025-2026"
    />
  );
};

export default SummerCampsPage;
