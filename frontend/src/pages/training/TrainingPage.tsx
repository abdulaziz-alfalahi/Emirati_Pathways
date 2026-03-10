
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    GraduationCap, BookOpen, Users, TrendingUp,
    Clock, Star, CheckCircle, Play, Calendar,
    Award, Building, MapPin, Briefcase, ChevronRight, ChevronLeft,
    Target, Zap, FileText, Loader2
} from 'lucide-react';
import { restClient } from '@/utils/api';

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

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
    Leadership: { bg: brand.purple, color: brand.purpleText },
    Finance: { bg: brand.green, color: brand.greenText },
    Technology: { bg: brand.blue, color: brand.blueText },
    Energy: { bg: brand.amber, color: brand.amberText },
    Healthcare: { bg: brand.red, color: brand.redText },
    Aviation: { bg: brand.primarySurface, color: brand.primary },
    Management: { bg: brand.purple, color: brand.purpleText },
    Marketing: { bg: brand.green, color: brand.greenText },
    Business: { bg: brand.amber, color: brand.amberText },
};

const LEVEL_STYLES: Record<string, { bg: string; color: string }> = {
    Beginner: { bg: brand.green, color: brand.greenText },
    Intermediate: { bg: brand.amber, color: brand.amberText },
    Advanced: { bg: brand.red, color: brand.redText },
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const TrainingPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    const [loading, setLoading] = useState(true);
    const [programs, setPrograms] = useState<any[]>([]);
    const [userCerts, setUserCerts] = useState<any[]>([]);
    const [userAssessments, setUserAssessments] = useState<any[]>([]);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            try {
                const [programsRes, progressRes] = await Promise.allSettled([
                    restClient.get('/api/skills-development/training-programs'),
                    restClient.get('/api/skills-development/user-progress'),
                ]);
                if (cancelled) return;

                if (programsRes.status === 'fulfilled') {
                    const d = programsRes.value.data as any;
                    if (d?.data?.training_programs) {
                        const allPrograms = [
                            ...d.data.training_programs,
                            ...(d.data.lms_courses || []),
                        ];
                        setPrograms(allPrograms);
                    }
                }
                if (progressRes.status === 'fulfilled') {
                    const d = progressRes.value.data as any;
                    if (d?.data) {
                        setUserCerts(d.data.certifications || []);
                        setUserAssessments(d.data.assessments || []);
                    }
                }
            } catch (e) {
                console.warn('Training API not available', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, []);

    /* ──────────────────────── DATA ──────────────────────── */

    const stats = [
        { value: programs.length > 0 ? `${programs.length}` : '200+', label: t('Programs', 'برنامج'), icon: BookOpen },
        { value: '8,500+', label: t('Graduates', 'خريج'), icon: Users },
        { value: '94%', label: t('Placement', 'نسبة التوظيف'), icon: TrendingUp },
        { value: '50+', label: t('Partners', 'شريك'), icon: Building },
    ];

    /* ── Tab 1: Available Programs ── */
    const programsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Available Training Programs', 'البرامج التدريبية المتاحة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    `Discover ${programs.length || '200+'} professional training programs from leading UAE institutions — from government leadership to industry certifications.`,
                    `اكتشف ${programs.length || '200+'} برنامج تدريبي مهني من مؤسسات إماراتية رائدة — من القيادة الحكومية إلى الشهادات القطاعية.`
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {programs.map((p, i) => {
                        const catStyle = CATEGORY_STYLES[p.category] || { bg: brand.primarySurface, color: brand.primary };
                        const levelStyle = LEVEL_STYLES[p.level] || { bg: '#F3F4F6', color: brand.textSecondary };
                        return (
                            <div
                                key={p.id || i}
                                style={{
                                    background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                                    padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                                    transition: 'box-shadow .2s', cursor: 'pointer',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ background: catStyle.bg, color: catStyle.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                        {p.category}
                                    </span>
                                    <span style={{ background: levelStyle.bg, color: levelStyle.color, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>
                                        {p.level}
                                    </span>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{isRTL && p.title_ar ? p.title_ar : p.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Building size={12} /> {p.provider}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: brand.textSecondary }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {p.duration}</span>
                                    {p.rating && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {p.rating}</span>}
                                    {p.certification_offered && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Award size={12} /> {t('Certificate', 'شهادة')}</span>}
                                </div>

                                {p.skills && p.skills.length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {p.skills.slice(0, 3).map((s: string, j: number) => (
                                            <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 4 }}>{s}</span>
                                        ))}
                                        {p.skills.length > 3 && <span style={{ fontSize: 10, color: brand.textSecondary }}>+{p.skills.length - 3}</span>}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    {p.enrollments !== undefined ? (
                                        <span style={{ fontSize: 12, color: brand.textSecondary }}>{p.enrollments.toLocaleString()} {t('enrolled', 'مسجّل')}</span>
                                    ) : (
                                        <span style={{ fontSize: 12, color: brand.textSecondary }}>{p.relevance_score ? `${p.relevance_score}% ${t('relevance', 'ملاءمة')}` : ''}</span>
                                    )}
                                    <button style={{
                                        background: brand.primary, color: '#fff', border: 'none',
                                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    }}>
                                        {t('Apply Now', 'قدّم الآن')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ── Tab 2: My Certificates ── */
    const certsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Certificates', 'شهاداتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'All your earned certificates and professional credentials in one place — share them on your profile or with employers.',
                    'جميع شهاداتك وأوراق اعتمادك المهنية في مكان واحد — شاركها على ملفك الشخصي أو مع أصحاب العمل.'
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : userCerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
                    <Award size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p>{t('No certificates earned yet. Complete a training program to earn your first certificate!', 'لم تحصل على شهادات بعد. أكمل برنامجاً تدريبياً للحصول على أول شهادة!')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {userCerts.map((c, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Award size={22} style={{ color: brand.primary }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.name}</h3>
                                        <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer} · {t('Earned', 'حصل عليها')} {c.issue_date ? new Date(c.issue_date).toLocaleDateString() : ''}</div>
                                    </div>
                                </div>
                                <span style={{
                                    background: c.status === 'Active' ? brand.green : brand.red,
                                    color: c.status === 'Active' ? brand.greenText : brand.redText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                                }}>
                                    {c.status === 'Active' ? t('Active', 'فعّالة') : t('Expired', 'منتهية')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: 8 }}>
                                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                                    {c.credential_id && <span>{t('ID:', 'المعرّف:')} {c.credential_id}</span>}
                                    {c.expiry_date && <span>{t('Expires:', 'تنتهي:')} {new Date(c.expiry_date).toLocaleDateString()}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button style={{
                                        background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`,
                                        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                    }}>
                                        {t('Download', 'تحميل')}
                                    </button>
                                    <button style={{
                                        background: brand.primary, color: '#fff', border: 'none',
                                        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                    }}>
                                        {t('Share', 'مشاركة')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    /* ── Tab 3: Assessments ── */
    const assessmentsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Assessments', 'اختباراتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('Track your completed assessments and scores.', 'تتبع اختباراتك المكتملة ونتائجك.')}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : userAssessments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
                    <Target size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p>{t('No assessments completed yet.', 'لم تُكمل أي اختبار بعد.')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {userAssessments.map((a, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: a.score >= 80 ? brand.green : a.score >= 60 ? brand.amber : brand.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 16, fontWeight: 700, color: a.score >= 80 ? brand.greenText : a.score >= 60 ? brand.amberText : brand.redText }}>{a.score}%</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{a.title}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{a.type} · {a.sector}</div>
                            </div>
                            <span style={{
                                background: a.status === 'completed' ? brand.green : brand.amber,
                                color: a.status === 'completed' ? brand.greenText : brand.amberText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {a.status === 'completed' ? t('Completed', 'مكتمل') : t('In Progress', 'قيد الإنجاز')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    /* ── Tab 4: Training Partners ── */
    const partnersData = programs
        .filter(p => p.provider)
        .reduce((acc: any[], p) => {
            if (!acc.find(a => a.name === p.provider)) {
                acc.push({
                    name: p.provider,
                    category: p.category,
                    programCount: programs.filter(pr => pr.provider === p.provider).length,
                });
            }
            return acc;
        }, []);

    const partnersTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Training Partners', 'شركاء التدريب')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    `We collaborate with ${partnersData.length || '50+'}  leading UAE institutions and global training providers.`,
                    `نتعاون مع ${partnersData.length || '50+'} مؤسسة إماراتية رائدة ومزودي تدريب عالميين.`
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {partnersData.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building size={20} style={{ color: brand.primary }} />
                            </div>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>
                                {p.category}
                            </span>
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{p.name}</h4>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span>{p.programCount} {t('programs', 'برنامج')}</span>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer', marginTop: 12 }}>
                            {t('View Programs', 'عرض البرامج')} <ChevronIcon size={14} />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'programs', label: t('Available Programs', 'البرامج المتاحة'), icon: <BookOpen className="h-4 w-4" />, content: programsTab },
        { id: 'certificates', label: t('Certificates', 'الشهادات'), icon: <Award className="h-4 w-4" />, content: certsTab },
        { id: 'assessments', label: t('Assessments', 'الاختبارات'), icon: <Target className="h-4 w-4" />, content: assessmentsTab },
        { id: 'partners', label: t('Training Partners', 'شركاء التدريب'), icon: <Building className="h-4 w-4" />, content: partnersTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Training Programs', 'البرامج التدريبية')}
            description={t(
                'Advance your career with professional training programs from leading UAE institutions — government leadership, industry certifications, and specialized workshops',
                'طوّر مسيرتك المهنية مع برامج تدريبية مهنية من مؤسسات إماراتية رائدة — القيادة الحكومية والشهادات القطاعية والورش المتخصصة'
            )}
            icon={<GraduationCap className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="programs"
        />
    );
};

export default TrainingPage;
