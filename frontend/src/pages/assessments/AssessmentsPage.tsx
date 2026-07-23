
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Target, BookOpen, Users, TrendingUp, Award,
    CheckCircle, ChevronRight, ChevronLeft, BarChart3,
    Layers, Brain, Star, Clock, Loader2
} from 'lucide-react';
import { restClient } from '@/utils/api';
import AiAssistPanel from '@/components/ai/AiAssistPanel';

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

const DOMAIN_STYLES: Record<string, { bg: string; color: string }> = {
    'Technology': { bg: brand.blue, color: brand.blueText },
    'Business': { bg: brand.amber, color: brand.amberText },
    'Leadership': { bg: brand.purple, color: brand.purpleText },
    'Healthcare': { bg: brand.red, color: brand.redText },
    'Finance': { bg: brand.green, color: brand.greenText },
    'Energy': { bg: brand.primarySurface, color: brand.primary },
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const AssessmentsPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    const [loading, setLoading] = useState(true);
    const [domains, setDomains] = useState<any[]>([]);
    const [taxonomy, setTaxonomy] = useState<any[]>([]);
    const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);
    const [userAssessments, setUserAssessments] = useState<any[]>([]);
    const [userSkills, setUserSkills] = useState<any[]>([]);
    const [totalSkills, setTotalSkills] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            try {
                const [assessRes, progressRes] = await Promise.allSettled([
                    restClient.get('/api/skills-development/assessments'),
                    restClient.get('/api/skills-development/user-progress'),
                ]);
                if (cancelled) return;
                if (assessRes.status === 'fulfilled') {
                    const d = assessRes.value.data as any;
                    if (d?.data) {
                        setDomains(d.data.domains || []);
                        setTaxonomy(d.data.skill_taxonomy || []);
                        setAssessmentTypes(d.data.assessment_types || []);
                        setTotalSkills(d.data.total_skills || 0);
                    }
                }
                if (progressRes.status === 'fulfilled') {
                    const d = progressRes.value.data as any;
                    if (d?.data) {
                        setUserAssessments(d.data.assessments || []);
                        setUserSkills(d.data.skills || []);
                    }
                }
            } catch (e) {
                console.warn('Assessments API not available', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, []);

    const stats = [
        { value: totalSkills > 0 ? `${totalSkills}` : '75+', label: t('Skills Mapped', 'مهارة مصنّفة'), icon: BookOpen },
        { value: domains.length > 0 ? `${domains.length}` : '8', label: t('Domains', 'مجال'), icon: Layers },
        { value: userAssessments.length > 0 ? `${userAssessments.length}` : '0', label: t('Completed', 'مكتمل'), icon: CheckCircle },
        { value: '95%', label: t('Accuracy', 'دقة'), icon: Target },
    ];

    /* ── Tab 1: Skill Domains ── */
    const domainsTab = (
        <div>
            <AiAssistPanel
                feature="skills_gap"
                title="AI skills-gap analysis"
                titleAr="تحليل فجوة المهارات بالذكاء الاصطناعي"
                getContext={() => ({
                    assessment_results: userAssessments.slice(0, 30).map((a: any) => ({
                        title: a.title,
                        score: a.score,
                        max_score: a.max_score,
                        status: a.status,
                    })),
                    skills: userSkills
                        .map((s: any) => (typeof s === 'string' ? s : s?.name))
                        .filter(Boolean)
                        .slice(0, 30),
                    target_role: 'career growth on the EHRDC platform',
                })}
                className="mb-6"
            />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Skill Domains & Taxonomy', 'مجالات المهارات والتصنيف')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    `Explore ${totalSkills} mapped skills across ${domains.length} domains — discover where your strengths align with UAE market demand.`,
                    `استكشف ${totalSkills} مهارة مصنّفة عبر ${domains.length} مجالات — اكتشف أين تتوافق نقاط قوتك مع طلب السوق الإماراتي.`
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {domains.map((d, i) => {
                        const style = DOMAIN_STYLES[d.name] || { bg: brand.primarySurface, color: brand.primary };
                        return (
                            <div
                                key={i}
                                style={{
                                    background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                                    padding: 20, transition: 'box-shadow .2s', cursor: 'pointer',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Brain size={22} style={{ color: style.color }} />
                                    </div>
                                    <span style={{ background: style.bg, color: style.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99 }}>
                                        {d.skill_count} {t('skills', 'مهارة')}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 8px' }}>{d.name}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                    {(d.skills || []).map((s: string, j: number) => (
                                        <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, padding: '3px 8px', borderRadius: 4 }}>{s}</span>
                                    ))}
                                </div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer' }}>
                                    {t('Take Assessment', 'ابدأ التقييم')} <ChevronIcon size={14} />
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ── Tab 2: My Assessment Results ── */
    const resultsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Assessment Results', 'نتائج تقييماتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('Your completed assessments and scores — understand your strengths and areas for improvement.', 'تقييماتك المكتملة ونتائجك — افهم نقاط قوتك ومجالات التطوير.')}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : userAssessments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50, color: brand.textSecondary }}>
                    <Target size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 15 }}>{t('No assessments completed yet.', 'لم تُكمل أي تقييم بعد.')}</p>
                    <p style={{ fontSize: 13 }}>{t('Start with a skill domain to take your first assessment!', 'ابدأ بمجال مهاري لإجراء أول تقييم لك!')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {userAssessments.map((a, i) => {
                        const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : a.score;
                        const bg = pct >= 80 ? brand.green : pct >= 60 ? brand.amber : brand.red;
                        const fg = pct >= 80 ? brand.greenText : pct >= 60 ? brand.amberText : brand.redText;
                        return (
                            <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{a.title}</h4>
                                        <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                            {a.type} · {a.sector}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: 54, height: 54, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: 18, fontWeight: 700, color: fg }}>{pct}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444' }} />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: brand.textSecondary }}>
                                        {t('Score:', 'النتيجة:')} {a.score} / {a.max_score}
                                    </span>
                                    <span style={{
                                        background: a.status === 'completed' ? brand.green : brand.amber,
                                        color: a.status === 'completed' ? brand.greenText : brand.amberText,
                                        fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                                    }}>
                                        {a.status === 'completed' ? t('Completed', 'مكتمل') : t('In Progress', 'قيد الإنجاز')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ── Tab 3: Skill Heat Map ── */
    const heatmapTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Market Demand Heat Map', 'خريطة الطلب في السوق')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Skill demand levels according to the UAE market taxonomy — higher demand indicates more job openings requiring this skill.',
                    'مستويات الطلب على المهارات حسب تصنيف سوق الإمارات — الطلب الأعلى يشير إلى فرص عمل أكثر تتطلب هذه المهارة.'
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {taxonomy.slice(0, 40).map((s, i) => {
                        const score = s.demand_score || 0;
                        const bg = score >= 80 ? '#22C55E' : score >= 60 ? brand.primary : score >= 40 ? '#F59E0B' : '#D1D5DB';
                        const fg = score >= 40 ? '#fff' : brand.textPrimary;
                        return (
                            <div
                                key={i}
                                title={`${s.name}: demand score ${score}`}
                                style={{
                                    background: bg, color: fg,
                                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                    cursor: 'pointer', transition: 'transform .15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                {isRTL && s.name_ar ? s.name_ar : s.name}
                                <span style={{ opacity: 0.7, marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0, fontSize: 10 }}>
                                    {score}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const tabs = [
        { id: 'domains', label: t('Skill Domains', 'مجالات المهارات'), icon: <Brain className="h-4 w-4" />, content: domainsTab },
        { id: 'results', label: t('My Results', 'نتائجي'), icon: <BarChart3 className="h-4 w-4" />, content: resultsTab },
        { id: 'heatmap', label: t('Market Demand', 'طلب السوق'), icon: <TrendingUp className="h-4 w-4" />, content: heatmapTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Assessments & Skills', 'التقييمات والمهارات')}
            description={t(
                'Measure your skills against UAE market standards — discover your strengths, identify gaps, and get personalized development recommendations',
                'قِس مهاراتك مقابل معايير سوق الإمارات — اكتشف نقاط قوتك وحدد الفجوات واحصل على توصيات تطوير شخصية'
            )}
            icon={<Target className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="domains"
        />
    );
};

export default AssessmentsPage;
