
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Shield, Users, Leaf, Award, TrendingUp,
    CheckCircle, Clock, Building, ArrowRight, ArrowLeft,
    Globe, MapPin, ExternalLink, Star
} from 'lucide-react';
import {
    getServicePrograms, getSustainabilityOpportunities,
    getNsraPartners, getRecentMilestones,
    getSustainabilityImpact, getEnrolmentSteps
} from './data';

/* ──────────────────────── COMPONENT ──────────────────────── */

const stepColors = [
    { bg: 'var(--ep-blue)', text: 'var(--ep-blue-text)' },
    { bg: 'var(--ep-green)', text: 'var(--ep-green-text)' },
    { bg: 'var(--ep-purple)', text: 'var(--ep-purple-text)' },
    { bg: 'var(--ep-amber)', text: 'var(--ep-amber-text)' },
];

const NationalServicePage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    // Build translated data
    const servicePrograms = getServicePrograms(t);
    const sustainabilityOpportunities = getSustainabilityOpportunities(t);
    const nsraPartners = getNsraPartners(t);
    const recentMilestones = getRecentMilestones(t);
    const sustainabilityImpact = getSustainabilityImpact(t);
    const enrolmentSteps = getEnrolmentSteps(t);

    const stats = [
        { value: '45,000+', label: t('Citizens Served', 'مواطن خدموا'), icon: Users },
        { value: '150+', label: t('Partner Organisations', 'مؤسسة شريكة'), icon: Building },
        { value: '85%', label: t('Career Placement', 'توظيف مهني'), icon: TrendingUp },
        { value: '18', label: t('Cohorts Graduated', 'دفعة تخرّجت'), icon: Award },
    ];

    /* ── Tab 1: Service Programs ── */
    const programsTab = (
        <div>
            <h2 className="ep-section-title">{t('Service Programs', 'برامج الخدمة')}</h2>
            <p className="ep-section-desc">
                {t(
                    'In liaison with the National Service and Reserve Authority (NSRA), we offer career-oriented service programmes with a focus on sustainability and national development. Choose your path — from clean energy to data science to emergency management.',
                    'بالتنسيق مع هيئة الخدمة الوطنية والاحتياطية، نقدم برامج خدمة موجهة مهنياً مع التركيز على الاستدامة والتنمية الوطنية. اختر مسارك — من الطاقة النظيفة إلى علم البيانات إلى إدارة الطوارئ.'
                )}
            </p>

            <div className="ep-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                {servicePrograms.map((p, i) => (
                    <div key={i} className="ep-card" style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="ep-card__header">
                                <span className="ep-card__icon">{p.icon}</span>
                                <div>
                                    <h3 className="ep-card__title" style={{ fontSize: 14, marginBottom: 2 }}>{p.title}</h3>
                                    <div className="ep-text-sm">{p.org}</div>
                                </div>
                            </div>
                            <span className={`ep-badge ${p.statusKey === 'Enrolling' ? 'ep-badge--green' : 'ep-badge--blue'}`} style={{ borderRadius: 99 }}>
                                {p.statusLabel}
                            </span>
                        </div>

                        <p className="ep-card__desc">{p.desc}</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {p.tags.map((tag, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: 'var(--ep-text-secondary)', fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{tag}</span>
                            ))}
                        </div>

                        <div className="ep-card__meta">
                            <span className="ep-card__meta-item"><Clock size={12} /> {p.duration}</span>
                            <span className="ep-card__meta-item"><Users size={12} /> {p.spots} {t('spots', 'مقعد')}</span>
                        </div>

                        <div className="ep-card__divider">
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ep-text)', marginBottom: 6 }}>{t('Key Benefits', 'المزايا الرئيسية')}</div>
                            {p.highlights.map((h, j) => (
                                <div key={j} className="ep-checklist">
                                    <CheckCircle size={12} className="ep-checklist__icon" />
                                    <span className="ep-checklist__text">{h}</span>
                                </div>
                            ))}
                        </div>

                        <button className="ep-btn ep-btn--primary-full">{t('Apply Now', 'قدّم الآن')}</button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Sustainability Careers ── */
    const sustainabilityTab = (
        <div>
            <h2 className="ep-section-title">{t('Sustainability Work Opportunities', 'فرص العمل في الاستدامة')}</h2>
            <p className="ep-section-desc">
                {t(
                    'Post-service career opportunities in sustainability — from marine conservation to renewable energy to climate policy. Build a career that serves both the UAE and the planet.',
                    'فرص مهنية بعد الخدمة في الاستدامة — من الحفاظ على البيئة البحرية إلى الطاقة المتجددة إلى سياسة المناخ. ابنِ مسيرة مهنية تخدم الإمارات والكوكب.'
                )}
            </p>

            <div className="ep-stack">
                {sustainabilityOpportunities.map((o, i) => (
                    <div key={i} className="ep-card ep-card--row" style={{ cursor: 'pointer' }}>
                        <div className="ep-card__body">
                            <h3 className="ep-card__title" style={{ marginBottom: 4 }}>{o.title}</h3>
                            <div className="ep-card__meta">
                                <span className="ep-card__meta-item"><Building size={12} /> {o.org}</span>
                                <span className="ep-card__meta-item"><MapPin size={12} /> {o.location}</span>
                            </div>
                            <p className="ep-card__desc">{o.desc}</p>
                        </div>
                        <div className="ep-card__actions">
                            <span className="ep-badge ep-badge--green">{o.sector}</span>
                            <span className="ep-text-sm">{o.type}</span>
                            <button className="ep-btn ep-btn--primary">
                                {t('View Role', 'عرض الوظيفة')} <ArrowIcon size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Impact & Metrics ── */
    const impactTab = (
        <div>
            <h2 className="ep-section-title">{t('National Impact', 'الأثر الوطني')}</h2>
            <p className="ep-section-desc">
                {t(
                    "18 cohorts graduated. 45,000+ citizens served. The NSRA programmes are shaping the UAE's workforce and building national resilience.",
                    '18 دفعة تخرّجت. أكثر من 45,000 مواطن خدموا. برامج هيئة الخدمة الوطنية تشكّل القوى العاملة الإماراتية وتبني المرونة الوطنية.'
                )}
            </p>

            {/* Metric cards */}
            <div className="ep-grid ep-grid--4col ep-grid--gap-md" style={{ marginBottom: 28 }}>
                {[
                    { value: '18', label: t('Cohorts Graduated', 'دفعة تخرّجت'), note: t('National Service programme', 'برنامج الخدمة الوطنية'), cls: 'ep-badge--blue' },
                    { value: '45K+', label: t('Citizens Served', 'مواطن خدموا'), note: t('Since programme inception', 'منذ إطلاق البرنامج'), cls: 'ep-badge--green' },
                    { value: '150+', label: t('Partner Organisations', 'مؤسسة شريكة'), note: t('Government & private sector', 'القطاعان الحكومي والخاص'), cls: 'ep-badge--purple' },
                    { value: '85%', label: t('Career Placement Rate', 'معدل التوظيف المهني'), note: t('Within 6 months of completion', 'خلال 6 أشهر من الإكمال'), cls: 'ep-badge--amber' },
                ].map((m, i) => (
                    <div key={i} className="ep-card ep-card--center">
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ep-primary-dark)', marginBottom: 2 }}>{m.value}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ep-text)', marginBottom: 4 }}>{m.label}</div>
                        <div className="ep-text-sm">{m.note}</div>
                    </div>
                ))}
            </div>

            {/* Recent milestones */}
            <div className="ep-card" style={{ marginBottom: 20 }}>
                <h3 className="ep-card__title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <Star size={18} style={{ color: 'var(--ep-primary)' }} /> {t('Recent Milestones', 'الإنجازات الأخيرة')}
                </h3>
                <div className="ep-stack" style={{ gap: 12 }}>
                    {recentMilestones.map((m, i) => (
                        <div key={i} className="ep-info-block" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--ep-primary-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--ep-primary)' }}>
                                {m.date}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ep-text)', marginBottom: 2 }}>{m.event}</div>
                                <div className="ep-text-sm">{m.detail}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sustainability impact */}
            <div className="ep-banner ep-banner--teal" style={{ padding: 24 }}>
                <div style={{ width: '100%' }}>
                    <h3 className="ep-card__title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                        <Leaf size={18} style={{ color: 'var(--ep-primary)' }} /> {t('Sustainability Impact', 'أثر الاستدامة')}
                    </h3>
                    <div className="ep-grid ep-grid--4col ep-grid--gap-sm">
                        {sustainabilityImpact.map((m, i) => (
                            <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 14, textAlign: 'center' }}>
                                <span style={{ fontSize: 24 }}>{m.icon}</span>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ep-primary-dark)', margin: '4px 0 2px' }}>{m.value}</div>
                                <div className="ep-text-sm">{m.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    /* ── Tab 4: NSRA Partners ── */
    const partnersTab = (
        <div>
            <h2 className="ep-section-title">{t('NSRA Partnership Network', 'شبكة شراكات هيئة الخدمة الوطنية')}</h2>
            <p className="ep-section-desc">
                {t(
                    'The National Service and Reserve Authority collaborates with leading UAE institutions to provide career-oriented service tracks. These partnerships ensure recruits gain real-world skills and clear career pathways.',
                    'تتعاون هيئة الخدمة الوطنية والاحتياطية مع المؤسسات الإماراتية الرائدة لتقديم مسارات خدمة موجهة مهنياً. تضمن هذه الشراكات اكتساب المجندين مهارات واقعية ومسارات مهنية واضحة.'
                )}
            </p>

            <div className="ep-grid ep-grid--2col ep-grid--gap-md" style={{ marginBottom: 24 }}>
                {nsraPartners.map((p, i) => (
                    <div key={i} className="ep-card" style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 32, flexShrink: 0 }}>{p.logo}</span>
                        <div>
                            <h3 className="ep-card__title" style={{ marginBottom: 4 }}>{p.name}</h3>
                            <p className="ep-card__desc">{p.role}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* How to enrol */}
            <div className="ep-card" style={{ marginBottom: 20 }}>
                <h3 className="ep-card__title" style={{ fontSize: 16, marginBottom: 18 }}>{t('How to Enrol in National Service', 'كيفية التسجيل في الخدمة الوطنية')}</h3>
                <div className="ep-grid ep-grid--4col ep-grid--gap-md">
                    {enrolmentSteps.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: stepColors[i].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: 800, fontSize: 16, color: stepColors[i].text }}>
                                {s.step}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ep-text)', marginBottom: 4 }}>{s.title}</div>
                            <div className="ep-text-sm" style={{ lineHeight: 1.4 }}>{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* External links */}
            <div className="ep-banner ep-banner--teal" style={{ justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ep-text)', marginBottom: 4 }}>{t('Learn more about the National Service & Reserve Authority', 'تعرّف على المزيد حول هيئة الخدمة الوطنية والاحتياطية')}</div>
                    <div className="ep-text-sm" style={{ fontSize: 13 }}>{t('Visit the official NSRA resources for eligibility, registration, and programme details.', 'زُر الموارد الرسمية لهيئة الخدمة الوطنية للاطلاع على الأهلية والتسجيل وتفاصيل البرامج.')}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a href="https://nscf.ae/en/" target="_blank" rel="noopener noreferrer" className="ep-btn ep-btn--primary" style={{ textDecoration: 'none' }}>
                        {t('NSCF Portal', 'بوابة التجنيد الوطني')} <ExternalLink size={12} />
                    </a>
                    <a href="https://www.mediaoffice.abudhabi/en/topic/national-service-reserve-authority-nsra/" target="_blank" rel="noopener noreferrer" className="ep-btn" style={{ background: '#fff', color: 'var(--ep-text)', border: '1px solid var(--ep-border)', textDecoration: 'none', padding: '9px 16px', fontSize: 12 }}>
                        {t('NSRA News', 'أخبار هيئة الخدمة الوطنية')} <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'programs', label: t('Service Programs', 'برامج الخدمة'), icon: <Shield className="h-4 w-4" />, content: programsTab },
        { id: 'sustainability', label: t('Sustainability Careers', 'وظائف الاستدامة'), icon: <Leaf className="h-4 w-4" />, content: sustainabilityTab },
        { id: 'impact', label: t('National Impact', 'الأثر الوطني'), icon: <TrendingUp className="h-4 w-4" />, content: impactTab },
        { id: 'partners', label: t('NSRA Partners', 'شركاء هيئة الخدمة الوطنية'), icon: <Globe className="h-4 w-4" />, content: partnersTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('National Service & Sustainability', 'الخدمة الوطنية والاستدامة')}
            description={t(
                "In liaison with the National Service and Reserve Authority (NSRA), we offer career-oriented service tracks in sustainability, data science, emergency management, and education — building the UAE's workforce while serving the nation",
                'بالتنسيق مع هيئة الخدمة الوطنية والاحتياطية، نقدم مسارات خدمة موجهة مهنياً في الاستدامة وعلم البيانات وإدارة الطوارئ والتعليم — بناء القوى العاملة الإماراتية أثناء خدمة الوطن'
            )}
            icon={<Shield className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="programs"
        />
    );
};

export default NationalServicePage;
