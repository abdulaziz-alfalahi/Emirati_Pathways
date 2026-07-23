
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Award, BookOpen, Users, TrendingUp, CheckCircle,
    ChevronRight, ChevronLeft, Building, Clock, Star,
    ExternalLink, Shield, Briefcase, Calendar, Loader2
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

const ProfessionalCertificationsPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    const [loading, setLoading] = useState(true);
    const [certPrograms, setCertPrograms] = useState<any[]>([]);
    const [earnedCerts, setEarnedCerts] = useState<any[]>([]);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            try {
                const [certsRes, progressRes] = await Promise.allSettled([
                    restClient.get('/api/skills-development/certifications'),
                    restClient.get('/api/skills-development/user-progress'),
                ]);
                if (cancelled) return;
                if (certsRes.status === 'fulfilled') {
                    const d = certsRes.value.data as any;
                    if (d?.data) {
                        setCertPrograms(d.data.certification_programs || []);
                    }
                }
                if (progressRes.status === 'fulfilled') {
                    const d = progressRes.value.data as any;
                    if (d?.data) {
                        setEarnedCerts(d.data.certifications || []);
                    }
                }
            } catch (e) {
                console.warn('Certifications API not available', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, []);

    // Derive partners from certPrograms
    const partners = certPrograms.reduce((acc: any[], p) => {
        if (p.provider && !acc.find(a => a.name === p.provider)) {
            acc.push({
                name: p.provider,
                category: p.category,
                certCount: certPrograms.filter(cp => cp.provider === p.provider).length,
            });
        }
        return acc;
    }, []);

    const stats = [
        { value: certPrograms.length > 0 ? `${certPrograms.length}` : '150+', label: t('Certifications', 'شهادة'), icon: Award },
        { value: earnedCerts.length > 0 ? `${earnedCerts.length}` : '0', label: t('Earned', 'مكتسبة'), icon: CheckCircle },
        { value: partners.length > 0 ? `${partners.length}` : '30+', label: t('Partners', 'شريك'), icon: Building },
        { value: '96%', label: t('Pass Rate', 'نسبة النجاح'), icon: TrendingUp },
    ];

    /* ── Tab 1: Available Certifications ── */
    const availableTab = (
        <div>
            <AiAssistPanel
                feature="credentials_next_steps"
                title="AI credential guidance"
                titleAr="إرشاد الاعتمادات بالذكاء الاصطناعي"
                getContext={() => ({
                    certifications: earnedCerts.map((c: any) => c.name).filter(Boolean).slice(0, 30),
                    skills: [...new Set(certPrograms.map((p: any) => p.category).filter(Boolean))].slice(0, 30),
                    target_role: 'career growth on the EHRDC platform',
                })}
                className="mb-6"
            />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Certification Programs', 'برامج الشهادات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    `Explore ${certPrograms.length || '150+'} industry-recognized certification programs from top UAE and global institutions — boost your career with verified credentials.`,
                    `استكشف ${certPrograms.length || '150+'} برنامج شهادات معتمد من مؤسسات إماراتية وعالمية رائدة — عزّز مسيرتك المهنية بأوراق اعتماد موثّقة.`
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {certPrograms.map((p, i) => {
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
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: catStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Award size={22} style={{ color: catStyle.color }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span style={{ background: catStyle.bg, color: catStyle.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                            {p.category}
                                        </span>
                                        <span style={{ background: levelStyle.bg, color: levelStyle.color, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>
                                            {p.level}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                                        {isRTL && p.title_ar ? p.title_ar : p.title}
                                    </h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Building size={12} /> {p.provider}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {p.duration}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                                    <button style={{
                                        background: brand.primary, color: '#fff', border: 'none',
                                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}>
                                        {t('Get Certified', 'احصل على الشهادة')} <ChevronIcon size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ── Tab 2: My Earned Certifications ── */
    const myTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Certifications', 'شهاداتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Your professional certifications and credentials — verify, share, and manage your achievements.',
                    'شهاداتك المهنية وأوراق اعتمادك — تحقق وشارك وأدر إنجازاتك.'
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : earnedCerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50, color: brand.textSecondary }}>
                    <Award size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 15 }}>{t('No certifications earned yet.', 'لم تحصل على شهادات بعد.')}</p>
                    <p style={{ fontSize: 13 }}>{t('Complete a certification program to build your professional credentials!', 'أكمل برنامج شهادة لبناء أوراق اعتمادك المهنية!')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {earnedCerts.map((c, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Award size={24} style={{ color: brand.primary }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.name}</h3>
                                        <div style={{ fontSize: 13, color: brand.textSecondary }}>{c.issuer}</div>
                                    </div>
                                </div>
                                <span style={{
                                    background: c.status === 'Active' ? brand.green : brand.red,
                                    color: c.status === 'Active' ? brand.greenText : brand.redText,
                                    fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
                                }}>
                                    {c.status === 'Active' ? t('Active', 'فعّالة') : t('Expired', 'منتهية')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: 20, padding: '12px 16px', background: '#F9FAFB', borderRadius: 10, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: brand.textSecondary }}>
                                    <Calendar size={14} />
                                    <span>{t('Issued:', 'تاريخ الإصدار:')} {c.issue_date ? new Date(c.issue_date).toLocaleDateString() : '-'}</span>
                                </div>
                                {c.expiry_date && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: brand.textSecondary }}>
                                        <Clock size={14} />
                                        <span>{t('Expires:', 'تنتهي:')} {new Date(c.expiry_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {c.credential_id && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: brand.textSecondary }}>
                                        <Shield size={14} />
                                        <span>{t('ID:', 'المعرّف:')} {c.credential_id}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                                <button style={{
                                    background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`,
                                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <ExternalLink size={14} /> {t('Verify', 'تحقق')}
                                </button>
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    {t('Share', 'مشاركة')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    /* ── Tab 3: Certification Partners ── */
    const partnersTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Certification Partners', 'شركاء الشهادات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    `We partner with ${partners.length || '30+'} leading certification bodies and training institutions.`,
                    `نتعاون مع ${partners.length || '30+'} جهة اعتماد ومؤسسة تدريب رائدة.`
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {partners.map((p, i) => {
                    const catStyle = CATEGORY_STYLES[p.category] || { bg: brand.primarySurface, color: brand.primary };
                    return (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: catStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building size={22} style={{ color: catStyle.color }} />
                                </div>
                                <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>
                                    {p.category}
                                </span>
                            </div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{p.name}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 10 }}>
                                {p.certCount} {t('certifications', 'شهادة')}
                            </div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer' }}>
                                {t('View Programs', 'عرض البرامج')} <ChevronIcon size={14} />
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const tabs = [
        { id: 'available', label: t('Certifications', 'الشهادات'), icon: <Award className="h-4 w-4" />, content: availableTab },
        { id: 'my-certs', label: t('My Certifications', 'شهاداتي'), icon: <CheckCircle className="h-4 w-4" />, content: myTab },
        { id: 'partners', label: t('Partners', 'الشركاء'), icon: <Building className="h-4 w-4" />, content: partnersTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Professional Certifications', 'الشهادات المهنية')}
            description={t(
                'Earn industry-recognized professional certifications from top global and UAE institutions — boost your career with verified credentials',
                'احصل على شهادات مهنية معترف بها من مؤسسات عالمية وإماراتية رائدة — عزّز مسيرتك المهنية بأوراق اعتماد موثّقة'
            )}
            icon={<Award className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="available"
            embedded={embedded}
        />
    );
};

export default ProfessionalCertificationsPage;
