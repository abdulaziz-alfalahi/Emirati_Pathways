
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Heart, Users, Shield, Award, Calendar,
    Activity, Phone, ArrowRight, ArrowLeft, CheckCircle, Building,
    MapPin, Star, Clock
} from 'lucide-react';
import { restClient } from '@/utils/api';

/* ──────────────────────── COMPONENT ──────────────────────── */

const RetireePage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ──────────────────────── API DATA ──────────────────────── */

    const [pensionBenefits, setPensionBenefits] = useState<any[]>([]);
    const [healthcareServices, setHealthcare] = useState<any[]>([]);
    const [engagementOpportunities, setEngagement] = useState<any[]>([]);
    const [lifestylePerks, setPerks] = useState<any[]>([]);
    const [serviceCentres, setServiceCentres] = useState<any[]>([]);

    useEffect(() => {
        restClient.get('/api/lifelong/retiree/pension-benefits').then(r => {
            setPensionBenefits((r.data as any[]).map((b: any) => ({
                title: t(b.title_en, b.title_ar), desc: t(b.desc_en, b.desc_ar),
                icon: b.icon, provider: t(b.provider_en, b.provider_ar),
                details: (b.details || []).map((d: any) => t(d.detail_en, d.detail_ar)),
            })));
        }).catch(() => { });

        restClient.get('/api/lifelong/retiree/healthcare').then(r => {
            setHealthcare((r.data as any[]).map((h: any) => ({
                title: t(h.title_en, h.title_ar), provider: t(h.provider_en, h.provider_ar),
                desc: t(h.desc_en, h.desc_ar), coverage: t(h.coverage_en, h.coverage_ar), icon: h.icon,
            })));
        }).catch(() => { });

        restClient.get('/api/lifelong/retiree/engagement').then(r => {
            setEngagement((r.data as any[]).map((e: any) => ({
                title: t(e.title_en, e.title_ar), org: t(e.org_en, e.org_ar),
                type: t(e.type_en, e.type_ar), desc: t(e.desc_en, e.desc_ar),
                commitment: t(e.commitment_en, e.commitment_ar), spots: e.spots,
            })));
        }).catch(() => { });

        restClient.get('/api/lifelong/retiree/perks').then(r => {
            const d = r.data as any;
            if (d.perks) setPerks(d.perks.map((p: any) => ({
                icon: p.icon, title: t(p.title_en, p.title_ar),
                desc: t(p.desc_en, p.desc_ar), category: t(p.category_en, p.category_ar),
            })));
            if (d.service_centres) setServiceCentres(d.service_centres.map((c: any) => ({
                city: t(c.city_en, c.city_ar), location: t(c.location_en, c.location_ar), phone: c.phone,
            })));
        }).catch(() => { });
    }, [isRTL]);

    const mentoring = t('Mentoring', 'إرشاد');
    const advisory = t('Advisory', 'استشاري');
    const volunteering = t('Volunteering', 'تطوع');
    const consulting = t('Consulting', 'استشارات');
    const teaching = t('Teaching', 'تدريس');

    /* Badge color helper */
    const badgeColor = (type: string) => {
        const map: Record<string, string> = { [mentoring]: 'ep-badge--blue', [advisory]: 'ep-badge--purple', [consulting]: 'ep-badge--amber', [volunteering]: 'ep-badge--green', [teaching]: 'ep-badge--green' };
        return map[type] || 'ep-badge--teal';
    };

    const stats = [
        { value: '15,000+', label: t('Active Retirees', 'متقاعد نشط'), icon: Users },
        { value: '96%', label: t('Satisfaction Rate', 'معدل الرضا'), icon: Star },
        { value: '120+', label: t('Monthly Activities', 'نشاط شهري'), icon: Calendar },
        { value: '45+', label: t('Support Programmes', 'برنامج دعم'), icon: Heart },
    ];

    /* ── Tab 1: Pension & Financial ── */
    const pensionTab = (
        <div>
            <h2 className="ep-section-title">{t('Pension & Financial Benefits', 'المعاشات والمزايا المالية')}</h2>
            <p className="ep-section-desc">
                {t(
                    'Comprehensive pension and end-of-service benefits for UAE nationals — from GPSSA, ADPF, DGRFA, and private sector providers. Your lifetime of service is recognised and rewarded.',
                    'معاشات شاملة ومزايا نهاية الخدمة للمواطنين الإماراتيين — من الهيئة العامة للمعاشات وصندوق أبوظبي للتقاعد والهيئة العامة لتقاعد دبي ومقدمي القطاع الخاص. عمرك من الخدمة مُقدَّر ومُكافأ.'
                )}
            </p>

            <div className="ep-grid ep-grid--2col">
                {pensionBenefits.map((b, i) => (
                    <div key={i} className="ep-card">
                        <div className="ep-card__header">
                            <span className="ep-card__icon">{b.icon}</span>
                            <div>
                                <h3 className="ep-card__title">{b.title}</h3>
                                <div className="ep-card__subtitle">{b.provider}</div>
                            </div>
                        </div>
                        <p className="ep-card__desc">{b.desc}</p>
                        <div className="ep-card__divider">
                            {b.details.map((d, j) => (
                                <div key={j} className="ep-checklist">
                                    <CheckCircle size={12} className="ep-checklist__icon" />
                                    <span className="ep-checklist__text">{d}</span>
                                </div>
                            ))}
                        </div>
                        <button className="ep-btn ep-btn--primary-full">{t('Learn More', 'اعرف المزيد')}</button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Healthcare ── */
    const healthcareTab = (
        <div>
            <h2 className="ep-section-title">{t('Healthcare & Wellness', 'الرعاية الصحية والعافية')}</h2>
            <p className="ep-section-desc">
                {t(
                    'Premium healthcare services for retired UAE nationals — from Thiqa insurance and home healthcare to mental wellness programmes. Your health is a national priority.',
                    'خدمات رعاية صحية متميزة للمتقاعدين الإماراتيين — من تأمين ثقة والرعاية المنزلية إلى برامج الصحة النفسية. صحتك أولوية وطنية.'
                )}
            </p>

            <div className="ep-grid ep-grid--3col ep-grid--gap-md" style={{ marginBottom: 24 }}>
                {healthcareServices.map((s, i) => (
                    <div key={i} className="ep-card" style={{ gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="ep-card__header">
                                <span className="ep-card__icon">{s.icon}</span>
                                <div>
                                    <h3 className="ep-card__title" style={{ fontSize: 14 }}>{s.title}</h3>
                                    <div className="ep-card__subtitle">{s.provider}</div>
                                </div>
                            </div>
                            <span className="ep-badge ep-badge--green">{s.coverage}</span>
                        </div>
                        <p className="ep-card__desc">{s.desc}</p>
                        <button className="ep-btn ep-btn--outline">{t('Access Service', 'الوصول للخدمة')}</button>
                    </div>
                ))}
            </div>

            {/* Emergency contacts */}
            <div className="ep-banner ep-banner--red">
                <Phone size={24} style={{ color: 'var(--ep-red-text)' }} />
                <div className="ep-banner__body">
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ep-red-text)', marginBottom: 2 }}>{t('24/7 Senior Health Helpline', 'خط مساعدة صحة كبار السن على مدار الساعة')}</div>
                    <div style={{ fontSize: 13, color: 'var(--ep-red-text)' }}>{t('For urgent health queries, home visit requests, or emergency medical guidance', 'للاستفسارات الصحية العاجلة وطلبات الزيارة المنزلية أو التوجيه الطبي الطارئ')}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="ep-contact-chip" style={{ color: 'var(--ep-red-text)' }}>800-SEHA (7342)</span>
                    <span className="ep-contact-chip" style={{ color: 'var(--ep-red-text)' }}>999</span>
                </div>
            </div>
        </div>
    );

    /* ── Tab 3: Engagement ── */
    const engagementTab = (
        <div>
            <h2 className="ep-section-title">{t('Stay Active & Engaged', 'ابقَ نشطاً ومنخرطاً')}</h2>
            <p className="ep-section-desc">
                {t(
                    "Retirement is a new chapter, not the end of the story. Share your expertise through mentoring, advisory councils, cultural preservation, and teaching — your experience is the nation's asset.",
                    'التقاعد فصل جديد، وليس نهاية القصة. شارك خبرتك من خلال الإرشاد والمجالس الاستشارية وحفظ التراث والتدريس — خبرتك ثروة وطنية.'
                )}
            </p>

            <div className="ep-stack">
                {engagementOpportunities.map((o, i) => (
                    <div key={i} className="ep-card ep-card--row">
                        <div className="ep-card__body">
                            <h3 className="ep-card__title" style={{ marginBottom: 4 }}>{o.title}</h3>
                            <div className="ep-card__meta">
                                <span className="ep-card__meta-item"><Building size={12} /> {o.org}</span>
                                <span className="ep-card__meta-item"><Clock size={12} /> {o.commitment}</span>
                            </div>
                            <p className="ep-card__desc">{o.desc}</p>
                        </div>
                        <div className="ep-card__actions">
                            <span className={`ep-badge ${badgeColor(o.type)}`}>{o.type}</span>
                            <span className="ep-text-sm">{o.spots} {t('spots open', 'مقعد متاح')}</span>
                            <button className="ep-btn ep-btn--primary">
                                {t('Apply', 'تقديم')} <ArrowIcon size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Lifestyle Perks ── */
    const perksTab = (
        <div>
            <h2 className="ep-section-title">{t('Lifestyle Benefits & Perks', 'مزايا وامتيازات نمط الحياة')}</h2>
            <p className="ep-section-desc">
                {t(
                    "Exclusive discounts, free access, and priority services for retired UAE nationals — from travel and fitness to education and culture. You've earned it.",
                    'خصومات حصرية ودخول مجاني وخدمات أولوية للمتقاعدين الإماراتيين — من السفر واللياقة إلى التعليم والثقافة. لقد استحققتها.'
                )}
            </p>

            <div className="ep-grid ep-grid--3col ep-grid--gap-md" style={{ marginBottom: 28 }}>
                {lifestylePerks.map((p, i) => (
                    <div key={i} className="ep-card ep-card--center">
                        <span style={{ fontSize: 32 }}>{p.icon}</span>
                        <h3 className="ep-card__title">{p.title}</h3>
                        <p className="ep-card__desc" style={{ marginBottom: 10 }}>{p.desc}</p>
                        <span className="ep-badge ep-badge--teal ep-badge--pill">{p.category}</span>
                    </div>
                ))}
            </div>

            {/* Saada Card CTA */}
            <div className="ep-banner ep-banner--teal">
                <div className="ep-banner__body" style={{ minWidth: 240 }}>
                    <h3 className="ep-banner__title">{t('Get Your Saada Card', 'احصل على بطاقة سعادة')}</h3>
                    <p className="ep-banner__desc">
                        {t(
                            'The Saada Card is your gateway to all retiree benefits — priority healthcare, retail discounts, cultural access, and transport benefits. Apply through the Ministry of Community Development.',
                            'بطاقة سعادة هي بوابتك لجميع مزايا المتقاعدين — أولوية الرعاية الصحية وخصومات التجزئة والوصول الثقافي ومزايا النقل. قدّم عبر وزارة تنمية المجتمع.'
                        )}
                    </p>
                </div>
                <button className="ep-btn ep-btn--primary ep-btn--lg">
                    {t('Apply for Saada Card', 'تقديم على بطاقة سعادة')} <ArrowIcon size={16} />
                </button>
            </div>

            {/* Service centres */}
            <div className="ep-card" style={{ marginTop: 20 }}>
                <h3 className="ep-card__title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <MapPin size={18} style={{ color: 'var(--ep-primary)' }} /> {t('Retiree Service Centres', 'مراكز خدمة المتقاعدين')}
                </h3>
                <div className="ep-grid ep-grid--4col ep-grid--gap-sm">
                    {serviceCentres.map((c, i) => (
                        <div key={i} className="ep-info-block">
                            <div className="ep-info-block__title">{c.city}</div>
                            <div className="ep-info-block__desc">{c.location}</div>
                            <div className="ep-info-block__link">{c.phone}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'pension', label: t('Pension & Financial', 'المعاشات والمالية'), icon: <Shield className="h-4 w-4" />, content: pensionTab },
        { id: 'healthcare', label: t('Healthcare', 'الرعاية الصحية'), icon: <Heart className="h-4 w-4" />, content: healthcareTab },
        { id: 'engagement', label: t('Stay Engaged', 'ابقَ منخرطاً'), icon: <Activity className="h-4 w-4" />, content: engagementTab },
        { id: 'perks', label: t('Lifestyle Perks', 'امتيازات نمط الحياة'), icon: <Award className="h-4 w-4" />, content: perksTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Retiree Services', 'خدمات المتقاعدين')}
            description={t(
                'Comprehensive support for retired UAE nationals — pension management, premium healthcare, engagement opportunities, and exclusive lifestyle benefits. Your lifetime of service is honoured',
                'دعم شامل للمتقاعدين الإماراتيين — إدارة المعاشات والرعاية الصحية المتميزة وفرص المشاركة ومزايا نمط الحياة الحصرية. عمرك من الخدمة مُكرَّم'
            )}
            icon={<Heart className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="pension"
        />
    );
};

export default RetireePage;
