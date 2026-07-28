
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Search, Target, Briefcase, MapPin, Banknote,
    Building2, Clock, ChevronRight, ChevronLeft, Heart, Send,
    TrendingUp, Star, Award, Filter,
    CheckCircle, BookmarkPlus, BarChart3, Eye, Loader2,
    Navigation, Car, CalendarDays, Trash2
} from 'lucide-react';
import { restClient } from '@/utils/api';
import JobApplicationDialog from '@/components/applications/JobApplicationDialog';
import AiAssistPanel from '@/components/ai/AiAssistPanel';

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

    // Real per-user data (replaces the former fabricated arrays)
    const [savedJobs, setSavedJobs] = useState<any[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [loadingSaved, setLoadingSaved] = useState(true);
    const [applications, setApplications] = useState<any[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);
    const [completion, setCompletion] = useState<{ pct: number; missing: string[] } | null>(null);

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
        loadApplications();
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
                // Only surface a salary that carries a real figure — the match
                // API formats an empty range as "- AED", which must not render.
                salary: (() => { const s = v.salary || v.salary_range || ''; return /\d/.test(s) ? s : ''; })(),
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

    /* ── Real data loaders ── */
    const loadSaved = useCallback(async () => {
        setLoadingSaved(true);
        try {
            const resp = await restClient.get('/api/candidate/saved-jobs');
            const data = resp.data?.data || [];
            setSavedJobs(data);
            setSavedIds(new Set(data.map((j: any) => String(j.job_id))));
        } catch (err) {
            console.warn('Saved jobs unavailable:', err);
        } finally {
            setLoadingSaved(false);
        }
    }, []);

    const loadApplications = useCallback(async () => {
        setLoadingApps(true);
        try {
            const resp = await restClient.get('/api/applications/my-applications');
            setApplications(resp.data?.data || []);
        } catch (err) {
            console.warn('Applications unavailable:', err);
        } finally {
            setLoadingApps(false);
        }
    }, []);

    const loadCompletion = useCallback(async () => {
        try {
            const resp = await restClient.get('/api/profile/candidate/completion');
            const d = resp.data?.data;
            if (d) setCompletion({ pct: Math.round(d.completion_percentage || 0), missing: d.missing_sections || [] });
        } catch { /* graceful */ }
    }, []);

    useEffect(() => { loadSaved(); loadApplications(); loadCompletion(); }, [loadSaved, loadApplications, loadCompletion]);

    /* ── Save / unsave toggle (real) ── */
    const toggleSave = async (jobId: any) => {
        const id = String(jobId);
        const isSaved = savedIds.has(id);
        // optimistic
        setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(id) : n.add(id); return n; });
        try {
            if (isSaved) {
                await restClient.delete(`/api/candidate/saved-jobs/${id}`);
                setSavedJobs(prev => prev.filter(j => String(j.job_id) !== id));
            } else {
                await restClient.post(`/api/candidate/saved-jobs/${id}`);
                await loadSaved();
            }
        } catch (err) {
            // revert on failure
            setSavedIds(prev => { const n = new Set(prev); isSaved ? n.add(id) : n.delete(id); return n; });
            console.warn('Save toggle failed:', err);
        }
    };

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

    /* ── Application status → label + colors (real statuses) ── */
    const statusMeta = (status: string): { label: string; bg: string; text: string } => {
        const s = (status || '').toLowerCase();
        if (/(interview|shortlist)/.test(s)) return { label: t('Interview / Shortlisted', 'مقابلة / قائمة مختصرة'), bg: brand.green, text: brand.greenText };
        if (/(offer|hired|accepted)/.test(s)) return { label: t('Offer', 'عرض'), bg: brand.green, text: brand.greenText };
        if (/(reject|not_selected|declined)/.test(s)) return { label: t('Not Selected', 'لم يُختر'), bg: brand.red, text: brand.redText };
        if (/withdraw/.test(s)) return { label: t('Withdrawn', 'مسحوب'), bg: '#F3F4F6', text: brand.textSecondary };
        return { label: t('Under Review', 'قيد المراجعة'), bg: brand.amber, text: brand.amberText };
    };
    const appCounts = {
        total: applications.length,
        interviews: applications.filter(a => a.interview_date || /(interview|shortlist)/.test((a.status || '').toLowerCase())).length,
        review: applications.filter(a => !/(interview|shortlist|offer|hired|accepted|reject|not_selected|declined|withdraw)/.test((a.status || '').toLowerCase())).length,
        notSelected: applications.filter(a => /(reject|not_selected|declined)/.test((a.status || '').toLowerCase())).length,
    };

    /* ── Header stats: real, per-user (were fabricated 5,000+/500+/85%/3,200+) ── */
    const stats = [
        { value: loadingJobs ? '—' : String(jobs.length), label: t('Job Matches', 'وظائف مطابقة'), icon: Target },
        { value: loadingSaved ? '—' : String(savedJobs.length), label: t('Saved Jobs', 'محفوظة'), icon: Heart },
        { value: loadingApps ? '—' : String(applications.length), label: t('Applications', 'الطلبات'), icon: Send },
        { value: completion ? `${completion.pct}%` : '—', label: t('Profile Strength', 'قوة الملف'), icon: TrendingUp },
    ];

    /* ── Tab 1: AI Matches ── */
    const matchesTab = (
        <div>
            <AiAssistPanel
                feature="job_match_explain"
                title="AI match insights"
                titleAr="رؤى التوافق بالذكاء الاصطناعي"
                getContext={() => {
                    const top = jobs[0];
                    if (!top) return {};
                    return {
                        job_title: top.title,
                        required_skills: (top.skills || []).filter(Boolean).slice(0, 30),
                    };
                }}
                className="mb-6"
            />
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
                    {jobs.map((job, i) => {
                        const isSaved = savedIds.has(String(job.id));
                        return (
                        <div
                            key={i}
                            style={{
                                background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                                padding: 20, transition: 'box-shadow .2s',
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
                                        {job.salary && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Banknote size={14} /> {job.salary}</span>}
                                        {job.posted && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {job.posted}</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleSave(job.id)}
                                    title={isSaved ? t('Remove from saved', 'إزالة من المحفوظة') : t('Save job', 'حفظ الوظيفة')}
                                    aria-label={isSaved ? t('Remove from saved', 'إزالة من المحفوظة') : t('Save job', 'حفظ الوظيفة')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, ...(isRTL ? { marginRight: 12 } : { marginLeft: 12 }) }}
                                >
                                    <Heart size={20} style={{ color: isSaved ? '#DC2626' : brand.textSecondary, fill: isSaved ? '#DC2626' : 'none' }} />
                                </button>
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
                                {job.posted && (
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
                                )}
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
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ── Tab 2: Saved Jobs (real) ── */
    const savedTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Saved Jobs', 'الوظائف المحفوظة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "Jobs you've bookmarked to review or apply to later — tap the heart on any match to save it here.",
                    'الوظائف التي حفظتها لمراجعتها أو التقديم عليها لاحقاً — اضغط القلب على أي تطابق لحفظه هنا.'
                )}
            </p>

            {loadingSaved ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <Loader2 size={28} style={{ color: brand.primary, animation: 'spin 1s linear infinite' }} />
                </div>
            ) : savedJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {savedJobs.map((job, i) => {
                        const loc = [job.city, job.emirate].filter(Boolean).join(', ') || job.location || '';
                        const applied = applications.some(a => String(a.job_id) === String(job.job_id));
                        return (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <BookmarkPlus size={22} style={{ color: brand.primary }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{job.title || t('Job', 'وظيفة')}</h4>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                        {[job.company, loc, job.salary_range && job.salary_range.trim()].filter(Boolean).join(' · ')}
                                    </div>
                                    {job.saved_at && <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 2 }}>{t('Saved', 'حُفظ في')} {new Date(job.saved_at).toLocaleDateString()}</div>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {job.status && job.status !== 'published' && (
                                    <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                        {t('Closed', 'مغلقة')}
                                    </span>
                                )}
                                {applied ? (
                                    <button disabled style={{
                                        background: '#DCFCE7', color: '#166534', border: 'none',
                                        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'not-allowed',
                                    }}>
                                        {t('Applied', 'تم التقديم')}
                                    </button>
                                ) : (job.status === 'published' || !job.status) ? (
                                    <button
                                        onClick={() => handleApplyToJob({ id: job.job_id, title: job.title, company: job.company, location: loc, description: '' })}
                                        style={{
                                            background: brand.primary, color: '#fff', border: 'none',
                                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        {t('Apply', 'قدّم')}
                                    </button>
                                ) : null}
                                <button
                                    onClick={() => toggleSave(job.job_id)}
                                    title={t('Remove from saved', 'إزالة من المحفوظة')}
                                    aria-label={t('Remove from saved', 'إزالة من المحفوظة')}
                                    style={{ background: '#fff', border: `1px solid ${brand.border}`, borderRadius: 8, padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <Trash2 size={15} style={{ color: brand.redText }} />
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: brand.textSecondary }}>
                    <BookmarkPlus size={48} style={{ margin: '0 auto 12px', opacity: .4 }} />
                    <p>{t('No saved jobs yet — tap the heart on any match to save it for later.', 'لا توجد وظائف محفوظة بعد — اضغط القلب على أي تطابق لحفظه لاحقاً.')}</p>
                </div>
            )}
        </div>
    );

    /* ── Tab 3: My Applications (real) ── */
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

            {loadingApps ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <Loader2 size={28} style={{ color: brand.primary, animation: 'spin 1s linear infinite' }} />
                </div>
            ) : applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: brand.textSecondary }}>
                    <Send size={48} style={{ margin: '0 auto 12px', opacity: .4 }} />
                    <p>{t("You haven't applied to any jobs yet. Apply from your AI matches to track them here.", 'لم تتقدّم لأي وظائف بعد. قدّم من تطابقاتك لتتبّعها هنا.')}</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                        {applications.map((app, i) => {
                            const meta = statusMeta(app.status);
                            const loc = [app.city, app.emirate].filter(Boolean).join(', ');
                            return (
                                <div key={app.id || i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Send size={22} style={{ color: brand.primary }} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{app.job_title || t('Job', 'وظيفة')}</h4>
                                            <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                                {[app.company_name, loc].filter(Boolean).join(' · ')}
                                                {app.created_at && <> · {t('Applied', 'تقدّم في')} {new Date(app.created_at).toLocaleDateString()}</>}
                                            </div>
                                            {app.interview_date && (
                                                <div style={{ fontSize: 11, color: brand.greenText, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <CalendarDays size={12} /> {t('Interview', 'مقابلة')}: {new Date(app.interview_date).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span style={{ background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                                        {meta.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats Summary (real counts) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                        {[
                            { label: t('Total Applied', 'إجمالي الطلبات'), value: appCounts.total, color: brand.primary },
                            { label: t('Interviews', 'المقابلات'), value: appCounts.interviews, color: brand.greenText },
                            { label: t('Under Review', 'قيد المراجعة'), value: appCounts.review, color: brand.amberText },
                            { label: t('Not Selected', 'لم يُختر'), value: appCounts.notSelected, color: brand.redText },
                        ].map((stat, i) => (
                            <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                                <span style={{ fontSize: 13, color: brand.textSecondary }}>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    /* ── Tab 4: Recommendations (real profile strength) ── */
    const pct = completion?.pct ?? 0;
    const missing = completion?.missing ?? [];
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

            {/* Match Score Overview — real completion % */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Your Profile Strength', 'قوة ملفك الشخصي')}</h3>
                    <span style={{ fontSize: 22, fontWeight: 700, color: brand.primary }}>{completion ? `${pct}%` : '—'}</span>
                </div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: brand.primary, borderRadius: 99, transition: 'width .3s' }} />
                </div>
                <span style={{ fontSize: 12, color: brand.textSecondary }}>
                    {pct >= 100
                        ? t('Your profile is complete — you’re getting the best matches.', 'ملفك مكتمل — تحصل على أفضل التطابقات.')
                        : t('Complete the sections below to reach 100% and unlock the best matches.', 'أكمل الأقسام أدناه للوصول إلى 100% وفتح أفضل التطابقات.')}
                </span>
            </div>

            {/* Recommendation cards — real missing sections */}
            {missing.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {missing.map((section, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 14 }}>
                            <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Award size={20} style={{ color: brand.primary }} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{t('Add', 'أضف')} {section}</h4>
                                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '0 0 10px' }}>
                                    {t('Completing this section improves your match accuracy.', 'إكمال هذا القسم يحسّن دقة التوافق.')}
                                </p>
                                <a href="/candidate/profile/identity" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, textDecoration: 'none' }}>
                                    {t('Take Action', 'اتّخذ إجراءً')} <ChevronIcon size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Match Statistics — real per-user numbers */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Your Job-Search Snapshot', 'ملخّص بحثك عن عمل')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                    {[
                        { label: t('Current Matches', 'التطابقات الحالية'), value: String(jobs.length) },
                        { label: t('Saved Jobs', 'الوظائف المحفوظة'), value: String(savedJobs.length) },
                        { label: t('Applications', 'الطلبات'), value: String(applications.length) },
                        { label: t('Profile Strength', 'قوة الملف'), value: completion ? `${pct}%` : '—' },
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

    // stopPropagation on each tab's content keeps EducationPathwayLayout's
    // content-click delegation from firing a false "Coming soon" toast over
    // these fully-functional controls.
    const tabs = [
        { id: 'matches', label: t('AI Matches', 'تطابقات الذكاء الاصطناعي'), icon: <Target className="h-4 w-4" />, content: matchesTab },
        { id: 'saved', label: t('Saved Jobs', 'الوظائف المحفوظة'), icon: <Heart className="h-4 w-4" />, content: savedTab },
        { id: 'applications', label: t('Applications', 'الطلبات'), icon: <Send className="h-4 w-4" />, content: applicationsTab },
        { id: 'recommendations', label: t('Recommendations', 'التوصيات'), icon: <Star className="h-4 w-4" />, content: recsTab },
    ].map(tb => ({ ...tb, content: <div onClick={e => e.stopPropagation()}>{tb.content}</div> }));

    return (
        <>
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
            {/* C2-CAN-2: the Apply button set state but the dialog was never rendered —
                so applying was a silent no-op. Render it here. */}
            <JobApplicationDialog
                isOpen={isApplicationDialogOpen}
                onOpenChange={setIsApplicationDialogOpen}
                job={selectedJobForApplication}
                onApplicationSubmitted={handleApplicationSubmitted}
            />
        </>
    );
};

export default JobMatchingPage;
