
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Search, Target, Briefcase, MapPin, Banknote,
    Building2, Clock, ChevronRight, ChevronLeft, Heart, Send,
    TrendingUp, Star, Users, Award, Filter,
    CheckCircle, BookmarkPlus, BarChart3, Zap, Eye, Loader2,
    Navigation, Car, CalendarDays
} from 'lucide-react';
import { restClient } from '@/utils/api';
import JobApplicationDialog from '@/components/applications/JobApplicationDialog';

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

const JobMatchingPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── STATE ──────────────────────── */

    const [jobs, setJobs] = useState<any[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSector, setActiveSector] = useState(0); // 0 = All
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
    const [selectedJobForApplication, setSelectedJobForApplication] = useState<any>(null);

    const handleApplyToJob = (job: any) => {
        const formattedJob = {
            id: String(job.id),
            title: job.title,
            company_name: job.company || job.company_name || 'Employer',
            location: {
                city: job.location || 'UAE',
                emirate: 'UAE'
            },
            employment_type: job.type || 'Full-time',
            experience_level: job.experienceLevel || 'Mid Level',
            created_at: job.posted || new Date().toISOString(),
            emiratization_priority: true,
            description: job.description || job.desc || '',
            required_skills: job.skills || []
        };
        setSelectedJobForApplication(formattedJob);
        setIsApplicationDialogOpen(true);
    };

    const handleApplicationSubmitted = () => {
        if (selectedJobForApplication) {
            setJobs(prevJobs =>
                prevJobs.map(j =>
                    String(j.id) === String(selectedJobForApplication.id) ? { ...j, hasApplied: true } : j
                )
            );
        }
    };

    const colorPalette = [
        { bg: brand.blue, color: brand.blueText },
        { bg: brand.green, color: brand.greenText },
        { bg: brand.purple, color: brand.purpleText },
        { bg: brand.amber, color: brand.amberText },
        { bg: brand.primarySurface, color: brand.primary },
        { bg: brand.red, color: brand.redText },
    ];

    const mapMatches = useCallback((jobs: any[]) => {
        return jobs.map((v: any, i: number) => {
            const palette = colorPalette[i % colorPalette.length];
            // Extract skills from requirements array
            const skills: string[] = [];
            if (v.requirements && Array.isArray(v.requirements)) {
                for (const r of v.requirements.slice(0, 3)) {
                    if (typeof r === 'string') skills.push(r);
                    else if (r?.description || r?.category) skills.push(r.description || r.category);
                }
            }
            if (!skills.length && v.required_skills) {
                try {
                    const parsed = typeof v.required_skills === 'string' ? JSON.parse(v.required_skills) : v.required_skills;
                    if (Array.isArray(parsed)) skills.push(...parsed.filter(Boolean).slice(0, 3));
                } catch { /* ignore */ }
            }
            // Compute days since posting
            const rawDate = v.postedDate || v.created_at;
            let daysAgo = 0;
            if (rawDate) {
                daysAgo = Math.max(0, Math.floor((Date.now() - new Date(rawDate).getTime()) / 86400000));
            }

            return {
                id: v.id,
                hasApplied: !!v.hasApplied,
                applicationStatus: v.applicationStatus || null,
                title: v.title || t('Job Opportunity', 'فرصة عمل'),
                company: v.company || v.company_name || t('Employer', 'جهة توظيف'),
                location: v.location || t('UAE', 'الإمارات'),
                salary: v.salary || v.salary_range || '',
                type: v.type || v.employment_type || t('Full-time', 'دوام كامل'),
                match: Math.round(v.matchScore || v.match_score || 0),
                posted: rawDate ? new Date(rawDate).toLocaleDateString() : '',
                daysAgo,
                desc: v.description?.substring(0, 200) || '',
                description: v.description || '',
                skills: skills.length ? skills : [t('General', 'عام')],
                sector: v.department || v.industry || t('Various', 'متنوع'),
                featured: (v.matchScore || v.match_score || 0) >= 85,
                catBg: palette.bg,
                catColor: palette.color,
                // Commute data from API
                distanceKm: v.commute?.distance_km || v.distance_km || null,
                commuteMin: v.commute?.time_mins || v.time_mins || null,
                peakMin: v.commute?.peak_time_mins || v.peak_time_mins || null,
            };
        });
    }, [isRTL]);

    const fetchMatches = useCallback(async (search = '', sectorIdx = 0) => {
        setLoadingJobs(true);
        try {
            const params: Record<string, string> = { use_ai: 'true' };
            // Map sector chip index to a search keyword
            const sectorKeys = ['', 'Technology', 'Banking', 'Government', 'Aviation', 'Energy', 'Real Estate', 'Healthcare'];
            const sectorTerm = sectorIdx > 0 ? sectorKeys[sectorIdx] || '' : '';
            const combinedSearch = [search, sectorTerm].filter(Boolean).join(' ').trim();
            if (combinedSearch) params.search = combinedSearch;

            const resp = await restClient.get('/api/candidate/job-matches', { params });
            if (resp.data?.success && resp.data?.jobs?.length) {
                setJobs(mapMatches(resp.data.jobs));
            } else if (resp.data?.success && resp.data?.matches?.length) {
                // Fallback if API returns matches instead of jobs
                setJobs(mapMatches(resp.data.matches));
            } else {
                setJobs([]);
            }
        } catch (err) {
            console.warn('Job matching API unavailable:', err);
        } finally {
            setLoadingJobs(false);
        }
    }, [mapMatches]);

    // Single useEffect: initial fetch is immediate, subsequent changes are debounced
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchMatches(searchQuery, activeSector);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchMatches(searchQuery, activeSector), 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, activeSector]);

    const savedJobs = [
        { title: t('Cloud Solutions Architect', 'مهندس حلول سحابية'), company: t('Microsoft UAE', 'مايكروسوفت الإمارات'), location: t('Dubai', 'دبي'), salary: t('AED 25,000–35,000', '25,000–35,000 د.إ'), match: 91, savedDate: t('Feb 12, 2026', '12 فبراير 2026') },
        { title: t('HR Business Partner', 'شريك أعمال الموارد البشرية'), company: t('DP World', 'موانئ دبي العالمية'), location: t('Dubai', 'دبي'), salary: t('AED 14,000–19,000', '14,000–19,000 د.إ'), match: 82, savedDate: t('Feb 8, 2026', '8 فبراير 2026') },
    ];

    const myApplications = [
        { title: t('Senior Product Manager', 'مدير منتجات أول'), company: t('Emirates Group', 'مجموعة الإمارات'), appliedDate: t('Feb 15, 2026', '15 فبراير 2026'), status: t('Interview Scheduled', 'مقابلة مجدولة'), statusColor: brand.green, statusText: brand.greenText },
        { title: t('Data Engineer', 'مهندس بيانات'), company: t('Etisalat (e&)', 'اتصالات (e&)'), appliedDate: t('Feb 12, 2026', '12 فبراير 2026'), status: t('Under Review', 'قيد المراجعة'), statusColor: brand.amber, statusText: brand.amberText },
        { title: t('Marketing Specialist', 'أخصائي تسويق'), company: 'Noon.com', appliedDate: t('Feb 1, 2026', '1 فبراير 2026'), status: t('Not Selected', 'لم يُختر'), statusColor: brand.red, statusText: brand.redText },
    ];

    const sectors = [
        t('All Sectors', 'جميع القطاعات'),
        t('Technology', 'التكنولوجيا'),
        t('Banking', 'المصارف'),
        t('Government', 'الحكومة'),
        t('Aviation', 'الطيران'),
        t('Energy', 'الطاقة'),
        t('Real Estate', 'العقارات'),
        t('Healthcare', 'الرعاية الصحية'),
    ];

    const recommendations = [
        { title: t('Complete Your Skills Profile', 'أكمل ملف مهاراتك'), desc: t('Adding 3 more verified skills will improve your match score by up to 15%', 'إضافة 3 مهارات موثّقة أخرى ستحسّن درجة التوافق بنسبة تصل إلى 15%'), Icon: Target },
        { title: t('Update Work Experience', 'حدّث خبراتك العملية'), desc: t("Your latest role isn't listed — adding it will unlock better senior-level matches", 'دورك الأخير غير مُدرج — إضافته ستُتيح توافقات أفضل للمستويات العليا'), Icon: Briefcase },
        { title: t('Set Salary Preferences', 'حدّد تفضيلات الراتب'), desc: t('Specifying your expected salary range helps our AI filter irrelevant listings', 'تحديد نطاق راتبك المتوقع يساعد ذكاءنا الاصطناعي على تصفية الإعلانات غير المناسبة'), Icon: Banknote },
        { title: t('Enable Location Preferences', 'فعّل تفضيلات الموقع'), desc: t("Tell us if you're open to Abu Dhabi, Sharjah, or remote roles for more options", 'أخبرنا إن كنت منفتحاً على فرص في أبوظبي أو الشارقة أو العمل عن بُعد لمزيد من الخيارات'), Icon: MapPin },
    ];

    const stats = [
        { value: '5,000+', label: t('Job Listings', 'إعلان وظيفي'), icon: Briefcase },
        { value: '500+', label: t('Employers', 'جهة توظيف'), icon: Building2 },
        { value: '85%', label: t('Match Accuracy', 'دقة التوافق'), icon: Target },
        { value: '3,200+', label: t('Placements', 'توظيف'), icon: TrendingUp },
    ];

    /* ── Tab 1: AI Matches ── */
    const matchesTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>
                    {t('AI-Powered Job Matches', 'وظائف مطابقة بالذكاء الاصطناعي')}
                </h2>
                <span style={{ fontSize: 13, color: brand.textSecondary }}>{jobs.length} {t('matches found', 'تطابقات')}</span>
            </div>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
                {t(
                    'Jobs ranked by AI match score based on your skills, experience, and career goals — updated in real time.',
                    'وظائف مرتّبة حسب درجة التوافق بالذكاء الاصطناعي بناءً على مهاراتك وخبراتك وأهدافك المهنية — محدّثة لحظياً.'
                )}
            </p>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={16} style={{ position: 'absolute', top: 11, ...(isRTL ? { right: 12 } : { left: 12 }), color: brand.textSecondary }} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('Search jobs by title, company, or keyword...', 'ابحث عن وظائف بالعنوان أو الشركة أو الكلمة المفتاحية...')}
                    style={{
                        width: '100%', padding: '10px 14px', ...(isRTL ? { paddingRight: 38 } : { paddingLeft: 38 }),
                        borderRadius: 10, border: `1px solid ${brand.border}`, fontSize: 13,
                        outline: 'none', background: '#fff', direction: isRTL ? 'rtl' : 'ltr',
                    }}
                />
            </div>

            {/* Filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {sectors.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveSector(i)}
                        style={{
                            background: i === activeSector ? brand.primarySurface : '#F3F4F6',
                            color: i === activeSector ? brand.primary : brand.textSecondary,
                            border: `1px solid ${i === activeSector ? brand.primary : brand.border}`,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                            transition: 'all .15s',
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Loading / Empty / Job Cards */}
            {loadingJobs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <Loader2 size={28} style={{ color: brand.primary, animation: 'spin 1s linear infinite' }} />
                </div>
            ) : jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: brand.textSecondary }}>
                    <Briefcase size={48} style={{ margin: '0 auto 12px', opacity: .4 }} />
                    <p>{t('No matching jobs found. Try adjusting your search or filters.', 'لم يتم العثور على وظائف مطابقة. حاول تعديل البحث أو الفلاتر.')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {jobs.map((job, i) => (
                        <div
                            key={i}
                            style={{
                                background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                                padding: 20, transition: 'box-shadow .2s', cursor: 'pointer',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                        >
                            {/* Top row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{job.title}</h3>
                                        <span style={{ position: 'relative', display: 'inline-block' }} className="match-tooltip-wrap">
                                            <span style={{
                                                background: job.match >= 90 ? brand.green : job.match >= 80 ? brand.blue : brand.amber,
                                                color: job.match >= 90 ? brand.greenText : job.match >= 80 ? brand.blueText : brand.amberText,
                                                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                                                cursor: 'help',
                                            }}>
                                                {job.match}% {t('Match', 'تطابق')}
                                            </span>
                                            <span className="match-tooltip" style={{
                                                display: 'none', position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
                                                background: '#1E293B', color: '#fff', padding: '8px 12px', borderRadius: 8,
                                                fontSize: 11, lineHeight: 1.5, whiteSpace: 'nowrap', zIndex: 100,
                                                boxShadow: '0 4px 12px rgba(0,0,0,.15)',
                                                pointerEvents: 'none',
                                            }}>
                                                <strong>{t('Why this match?', 'لماذا هذا التطابق؟')}</strong><br />
                                                {job.skills.length > 0 && <>{t('Skills:', 'المهارات:')} {job.skills.slice(0, 2).join(', ')}<br /></>}
                                                {t('Relevance:', 'الصلة:')} {job.match}% · {job.sector}
                                            </span>
                                            <style>{`.match-tooltip-wrap:hover .match-tooltip { display: block !important; }`}</style>
                                        </span>
                                        {job.featured && (
                                            <span style={{ background: brand.amber, color: brand.amberText, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                                                ★ {t('Featured', 'مميّز')}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: brand.textSecondary }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={14} /> {job.company}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {job.location}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Banknote size={14} /> {job.salary}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {job.posted}</span>
                                    </div>
                                </div>
                                <Heart size={20} style={{ color: brand.textSecondary, cursor: 'pointer', flexShrink: 0, ...(isRTL ? { marginRight: 12 } : { marginLeft: 12 }) }} />
                            </div>

                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '8px 0 10px' }}>{job.desc}</p>

                            {/* ── Match Criteria Insights ── */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: '8px 0', borderTop: `1px solid ${brand.border}`, borderBottom: `1px solid ${brand.border}` }}>
                                {/* Relevance / Match */}
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                                    background: job.match >= 80 ? '#ECFDF5' : job.match >= 60 ? '#EFF6FF' : '#FFF7ED',
                                    color: job.match >= 80 ? '#065F46' : job.match >= 60 ? '#1E40AF' : '#9A3412'
                                }}>
                                    <Target size={12} /> {t('Relevance', 'الصلة')}: {job.match}%
                                </span>

                                {/* Distance */}
                                {job.distanceKm != null && (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                                        background: job.distanceKm <= 15 ? '#ECFDF5' : job.distanceKm <= 30 ? '#FFF7ED' : '#FEF2F2',
                                        color: job.distanceKm <= 15 ? '#065F46' : job.distanceKm <= 30 ? '#9A3412' : '#991B1B'
                                    }}>
                                        <Navigation size={12} /> {job.distanceKm} {t('km', 'كم')}
                                    </span>
                                )}

                                {/* Peak commute */}
                                {job.peakMin != null && (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                                        background: job.peakMin <= 30 ? '#ECFDF5' : job.peakMin <= 60 ? '#FFF7ED' : '#FEF2F2',
                                        color: job.peakMin <= 30 ? '#065F46' : job.peakMin <= 60 ? '#9A3412' : '#991B1B'
                                    }}>
                                        <Car size={12} /> {t('Peak', 'الذروة')}: {job.peakMin} {t('min', 'د')}
                                    </span>
                                )}

                                {/* Posting recency */}
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                                    background: job.daysAgo <= 3 ? '#ECFDF5' : job.daysAgo <= 14 ? '#FFF7ED' : '#F3F4F6',
                                    color: job.daysAgo <= 3 ? '#065F46' : job.daysAgo <= 14 ? '#9A3412' : '#6B7280'
                                }}>
                                    <CalendarDays size={12} />
                                    {job.daysAgo === 0
                                        ? t('Today', 'اليوم')
                                        : job.daysAgo === 1
                                            ? t('Yesterday', 'أمس')
                                            : `${job.daysAgo} ${t('days ago', 'يوم مضى')}`}
                                </span>
                            </div>

                            {/* Tags + Actions row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ background: job.catBg, color: job.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                        {job.sector}
                                    </span>
                                    <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                        {job.type}
                                    </span>
                                    {job.skills.map((sk, j) => (
                                        <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 4 }}>
                                            {sk}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {job.hasApplied ? (
                                        <button disabled style={{
                                            background: '#DCFCE7', color: '#166534', border: 'none',
                                            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                            display: 'flex', alignItems: 'center', gap: 4, cursor: 'not-allowed',
                                        }}>
                                            <CheckCircle size={14} /> {t('Applied', 'تم التقديم')}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleApplyToJob(job)}
                                            style={{
                                                background: brand.primary, color: '#fff', border: 'none',
                                                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}
                                        >
                                            <Send size={14} /> {t('Apply', 'قدّم')}
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleApplyToJob(job)}
                                        style={{
                                            background: '#fff', color: brand.textSecondary, border: `1px solid ${brand.border}`,
                                            padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 4,
                                        }}
                                    >
                                        <Eye size={14} /> {t('View', 'عرض')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    /* ── Tab 2: Saved Jobs ── */
    const savedTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Saved Jobs', 'الوظائف المحفوظة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "Jobs you've bookmarked to review or apply to later — stay organized and never miss a deadline.",
                    'الوظائف التي حفظتها لمراجعتها أو التقديم عليها لاحقاً — ابقَ منظّماً ولا تفوّت أي موعد نهائي.'
                )}
            </p>

            {savedJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {savedJobs.map((job, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BookmarkPlus size={22} style={{ color: brand.primary }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{job.title}</h4>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{job.company} · {job.location} · {job.salary}</div>
                                    <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 2 }}>{t('Saved', 'حُفظ في')} {job.savedDate}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ background: brand.green, color: brand.greenText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                    {job.match}% {t('Match', 'تطابق')}
                                </span>
                                {job.hasApplied ? (
                                    <button disabled style={{
                                        background: '#DCFCE7', color: '#166534', border: 'none',
                                        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'not-allowed',
                                    }}>
                                        {t('Applied', 'تم التقديم')}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleApplyToJob(job)}
                                        style={{
                                            background: brand.primary, color: '#fff', border: 'none',
                                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        {t('Apply', 'قدّم')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: brand.textSecondary }}>
                    <BookmarkPlus size={48} style={{ margin: '0 auto 12px', opacity: .4 }} />
                    <p>{t('No saved jobs yet — bookmark jobs you like to review them later.', 'لا توجد وظائف محفوظة بعد — احفظ الوظائف التي تعجبك لمراجعتها لاحقاً.')}</p>
                </div>
            )}
        </div>
    );

    /* ── Tab 3: My Applications ── */
    const applicationsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Applications', 'طلباتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Track your submitted applications — see status updates, interview invitations, and results in one place.',
                    'تتبّع طلباتك المقدّمة — اطّلع على تحديثات الحالة ودعوات المقابلات والنتائج في مكان واحد.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {myApplications.map((app, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Send size={22} style={{ color: brand.primary }} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{app.title}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{app.company} · {t('Applied', 'تقدّم في')} {app.appliedDate}</div>
                            </div>
                        </div>
                        <span style={{ background: app.statusColor, color: app.statusText, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                            {app.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {[
                    { label: t('Total Applied', 'إجمالي الطلبات'), value: '3', color: brand.primary },
                    { label: t('Interviews', 'المقابلات'), value: '1', color: brand.greenText },
                    { label: t('Under Review', 'قيد المراجعة'), value: '1', color: brand.amberText },
                    { label: t('Not Selected', 'لم يُختر'), value: '1', color: brand.redText },
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <span style={{ fontSize: 13, color: brand.textSecondary }}>{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Recommendations ── */
    const recsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Profile Recommendations', 'توصيات الملف الشخصي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Improve your match score and get better job recommendations by strengthening your profile.',
                    'حسّن درجة التوافق واحصل على توصيات وظيفية أفضل بتعزيز ملفك الشخصي.'
                )}
            </p>

            {/* Match Score Overview */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Your Match Profile Strength', 'قوة ملف التوافق الخاص بك')}</h3>
                    <span style={{ fontSize: 22, fontWeight: 700, color: brand.primary }}>85%</span>
                </div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: '85%', height: '100%', background: brand.primary, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, color: brand.textSecondary }}>{t('Complete the actions below to reach 100% and unlock the best matches', 'أكمل الإجراءات أدناه للوصول إلى 100% وفتح أفضل التطابقات')}</span>
            </div>

            {/* Recommendation Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {recommendations.map((rec, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 14 }}>
                        <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <rec.Icon size={20} style={{ color: brand.primary }} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{rec.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '0 0 10px' }}>{rec.desc}</p>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer' }}>
                                {t('Take Action', 'اتّخذ إجراءً')} <ChevronIcon size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Matching Stats */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Your Match Statistics', 'إحصائيات التوافق')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                    {[
                        { label: t('Total Matches', 'إجمالي التطابقات'), value: '47' },
                        { label: t('New This Week', 'جديد هذا الأسبوع'), value: '12' },
                        { label: t('Profile Completeness', 'اكتمال الملف'), value: '85%' },
                        { label: t('AI Accuracy', 'دقة الذكاء الاصطناعي'), value: '92%' },
                    ].map((stat, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: brand.primary }}>{stat.value}</div>
                            <span style={{ fontSize: 12, color: brand.textSecondary }}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'matches', label: t('AI Matches', 'تطابقات الذكاء الاصطناعي'), icon: <Target className="h-4 w-4" />, content: matchesTab },
        { id: 'saved', label: t('Saved Jobs', 'الوظائف المحفوظة'), icon: <Heart className="h-4 w-4" />, content: savedTab },
        { id: 'applications', label: t('Applications', 'الطلبات'), icon: <Send className="h-4 w-4" />, content: applicationsTab },
        { id: 'recommendations', label: t('Recommendations', 'التوصيات'), icon: <Star className="h-4 w-4" />, content: recsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Job Matching', 'مطابقة الوظائف')}
            description={t(
                'AI-powered job matching — discover roles that align with your skills, experience, and career goals across the UAE',
                'مطابقة وظائف مدعومة بالذكاء الاصطناعي — اكتشف أدواراً تتوافق مع مهاراتك وخبراتك وأهدافك المهنية في الإمارات'
            )}
            icon={<Search className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="matches"
        />
    );
};

export default JobMatchingPage;
