
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Heart, Users, Shield, Award, Calendar,
    Activity, Phone, ArrowRight, CheckCircle, Building,
    MapPin, Star, Clock
} from 'lucide-react';

/* ──────────────────────── COMPONENT ──────────────────────── */

const RetireePage: React.FC = () => {
    const { t } = useTranslation('retiree');

    /* ──────────────────────── DATA ──────────────────────── */

    const pensionBenefits = [
        { title: t('tabs.services.content.financial.services.pension.title', 'GPSSA Pension'), desc: t('tabs.services.content.financial.services.pension.description', 'General Pension and Social Security Authority — monthly pension based on years of service and final salary. Covers all UAE nationals in federal and private sectors.'), icon: '🏛️', provider: 'GPSSA', details: [t('tabs.services.content.financial.services.pension.features.calculation', 'Based on final salary × service years'), t('tabs.services.content.financial.services.pension.features.payments', 'Minimum 20 years of service'), t('tabs.services.content.financial.services.pension.features.adjustments', 'Annual cost-of-living adjustments'), t('tabs.services.content.financial.services.pension.features.support', '24/7 digital portal access')] },
        { title: t('tabs.services.content.financial.services.planning.title', 'Abu Dhabi Pension Fund (ADPF)'), desc: t('tabs.services.content.financial.services.planning.description', 'Retirement benefits for Abu Dhabi government employees — comprehensive pension, gratuity, and end-of-service benefits.'), icon: '🏦', provider: 'ADPF', details: [t('tabs.services.content.financial.services.planning.features.consultation', 'Abu Dhabi government employees'), t('tabs.services.content.financial.services.planning.features.budgeting', 'Pension + gratuity combined'), t('tabs.services.content.financial.services.planning.features.investment', 'Family pension for dependents'), t('tabs.services.content.financial.services.planning.features.estate', 'Medical insurance continuation')] },
        { title: t('tabs.services.content.financial.services.benefits.title', 'Dubai Government Pension'), desc: t('tabs.services.content.financial.services.benefits.description', 'DGRFA manages Dubai government employee pensions — generous benefits including housing and family support.'), icon: '🌆', provider: 'DGRFA', details: [t('tabs.services.content.financial.services.benefits.features.healthcare', 'Dubai government employees'), t('tabs.services.content.financial.services.benefits.features.housing', 'Housing benefit continuation'), t('tabs.services.content.financial.services.benefits.features.transportation', 'Children\'s education support'), t('tabs.services.content.financial.services.benefits.features.utilities', 'Special merit awards')] },
        { title: t('pension_private_title', 'Private Sector End-of-Service'), desc: t('pension_private_desc', 'End-of-service gratuity for private sector employees under UAE Labour Law — 21 days salary per year for first 5 years, 30 days per year thereafter.'), icon: '💼', provider: t('pension_private_provider', 'Ministry of Human Resources'), details: [t('pension_private_d1', '21 days/year (first 5 years)'), t('pension_private_d2', '30 days/year (after 5 years)'), t('pension_private_d3', 'Based on last basic salary'), t('pension_private_d4', 'Payable upon contract end')] },
    ];

    const healthcareServices = [
        { title: t('healthcare_thiqa_title', 'Thiqa Health Insurance'), provider: t('healthcare_thiqa_provider', 'DAMAN / Abu Dhabi'), desc: t('tabs.services.content.healthcare.services.coverage.description', 'Premium health insurance for retired UAE nationals in Abu Dhabi — covers outpatient, inpatient, dental, maternity, and chronic disease management.'), coverage: t('healthcare_comprehensive', 'Comprehensive'), icon: '🏥' },
        { title: t('healthcare_saada_title', 'Saada Card Benefits'), provider: t('healthcare_saada_provider', 'Ministry of Community Development'), desc: t('healthcare_saada_desc', 'Saada Card provides retirees with priority access to government healthcare, discounts at partner pharmacies, and wellness programme enrolment.'), coverage: t('healthcare_gov_services', 'Government Services'), icon: '💳' },
        { title: t('healthcare_home_title', 'Home Healthcare Programme'), provider: t('healthcare_home_provider', 'DoH / SEHA'), desc: t('healthcare_home_desc', 'In-home nursing, physiotherapy, and specialist visits for senior citizens who prefer care at home — covered under national insurance.'), coverage: t('healthcare_home_coverage', 'Home-Based Care'), icon: '🏠' },
        { title: t('tabs.wellness.content.mental.title', 'Mental Wellness Support'), provider: t('healthcare_mental_provider', 'SEHA / Dubai Health'), desc: t('tabs.wellness.content.mental.description', 'Counselling, cognitive health programmes, and social wellbeing services designed specifically for retirees — combating isolation and maintaining mental sharpness.'), coverage: t('healthcare_mental_coverage', 'Mental Health'), icon: '🧠' },
    ];

    const engagementOpportunities = [
        { title: t('engagement_weyak_title', 'Weyak Mentorship Programme'), org: t('engagement_weyak_org', 'Ministry of Community Development'), type: t('engagement_type_mentoring', 'Mentoring'), desc: t('tabs.opportunities.content.mentoring.programs.professional.description', 'Share your decades of professional experience with young Emiratis entering the workforce — structured mentoring sessions and workshops.'), commitment: t('engagement_weyak_time', '4–6 hrs/week'), spots: 50 },
        { title: t('engagement_majlis_title', 'Majlis Advisory Council'), org: t('engagement_majlis_org', 'Federal National Council'), type: t('engagement_type_advisory', 'Advisory'), desc: t('engagement_majlis_desc', 'Retired senior officials invited to serve on advisory councils for government policy review — leveraging your governance experience.'), commitment: t('engagement_majlis_time', '8 hrs/month'), spots: 20 },
        { title: t('engagement_heritage_title', 'Heritage & Cultural Preservation'), org: t('engagement_heritage_org', 'Department of Culture & Tourism'), type: t('engagement_type_volunteering', 'Volunteering'), desc: t('engagement_heritage_desc', 'Help preserve UAE oral history, traditional crafts, and cultural heritage through storytelling, documentation, and community workshops.'), commitment: t('engagement_heritage_time', '3–5 hrs/week'), spots: 40 },
        { title: t('engagement_board_title', 'Board Observer Programme'), org: t('engagement_board_org', 'Abu Dhabi Securities Exchange'), type: t('engagement_type_consulting', 'Consulting'), desc: t('tabs.opportunities.content.consulting.areas.business.description', 'Retired executives and directors can serve as board observers or non-executive directors for listed companies — governance expertise in demand.'), commitment: t('engagement_board_time', 'Monthly meetings'), spots: 15 },
        { title: t('engagement_entrepreneur_title', 'Entrepreneurship Support'), org: t('engagement_entrepreneur_org', 'Khalifa Fund'), type: t('engagement_type_mentoring', 'Mentoring'), desc: t('tabs.opportunities.content.mentoring.programs.entrepreneurship.description', 'Guide young Emirati entrepreneurs through business planning, financial management, and industry connections — your experience is their advantage.'), commitment: t('engagement_entrepreneur_time', '4 hrs/week'), spots: 30 },
        { title: t('engagement_lecture_title', 'University Guest Lecturing'), org: t('engagement_lecture_org', 'UAE University / Zayed University'), type: t('engagement_type_teaching', 'Teaching'), desc: t('engagement_lecture_desc', 'Share industry insights with the next generation — guest lecture series for final-year students in business, engineering, and public administration.'), commitment: t('engagement_lecture_time', 'Monthly lectures'), spots: 25 },
    ];

    const lifestylePerks = [
        { icon: '✈️', title: t('perks_travel_title', 'Travel Discounts'), desc: t('tabs.benefits.content.discounts.categories.entertainment.offers.travel', 'Up to 30% off Emirates & Etihad flights, plus partner hotel rates across the GCC'), category: t('perks_travel_cat', 'Travel') },
        { icon: '🏊', title: t('tabs.benefits.content.recreation.facilities.fitness.title', 'Fitness & Recreation'), desc: t('tabs.benefits.content.recreation.facilities.fitness.description', 'Free access to 50+ government fitness centres, swimming pools, and community sports facilities'), category: t('perks_wellness_cat', 'Wellness') },
        { icon: '📚', title: t('tabs.benefits.content.education.programs.lifelong.title', 'Lifelong Learning'), desc: t('tabs.benefits.content.education.programs.lifelong.description', 'Free university course auditing at UAE University, Zayed University, and Khalifa University'), category: t('perks_education_cat', 'Education') },
        { icon: '🛒', title: t('tabs.benefits.content.discounts.categories.retail.title', 'Retail Discounts'), desc: t('tabs.benefits.content.discounts.categories.retail.description', 'Saada Card and senior citizen discounts at 200+ retail partners and pharmacies'), category: t('perks_shopping_cat', 'Shopping') },
        { icon: '🎭', title: t('tabs.benefits.content.recreation.facilities.cultural.title', 'Cultural Access'), desc: t('tabs.benefits.content.recreation.facilities.cultural.description', 'Free or discounted entry to Louvre Abu Dhabi, cultural events, and national heritage sites'), category: t('perks_culture_cat', 'Culture') },
        { icon: '🚗', title: t('perks_transport_title', 'Transport Benefits'), desc: t('perks_transport_desc', 'Free RTA public transport in Dubai, subsidised taxi services, and priority parking'), category: t('perks_transport_cat', 'Transport') },
    ];

    const serviceCentres = [
        { city: t('centre_abudhabi', 'Abu Dhabi'), location: t('centre_abudhabi_loc', 'Al Bateen, GPSSA HQ'), phone: '800-2070' },
        { city: t('centre_dubai', 'Dubai'), location: t('centre_dubai_loc', 'Al Twar, DGRFA'), phone: '800-DGRFA' },
        { city: t('centre_sharjah', 'Sharjah'), location: t('centre_sharjah_loc', 'Al Khan, SSD'), phone: '06-5068888' },
        { city: t('centre_alain', 'Al Ain'), location: t('centre_alain_loc', 'Zakher, GPSSA Branch'), phone: '800-2070' },
    ];

    /* Badge color helper */
    const badgeColor = (type: string) => {
        const map: Record<string, string> = { [t('engagement_type_mentoring', 'Mentoring')]: 'ep-badge--blue', [t('engagement_type_advisory', 'Advisory')]: 'ep-badge--purple', [t('engagement_type_consulting', 'Consulting')]: 'ep-badge--amber', [t('engagement_type_volunteering', 'Volunteering')]: 'ep-badge--green', [t('engagement_type_teaching', 'Teaching')]: 'ep-badge--green' };
        return map[type] || 'ep-badge--teal';
    };

    const stats = [
        { value: t('stats.retirees', '15,000+'), label: t('stats.retireesLabel', 'Active Retirees'), icon: Users },
        { value: t('stats.satisfaction', '96%'), label: t('stats.satisfactionLabel', 'Satisfaction Rate'), icon: Star },
        { value: t('stats_activities', '120+'), label: t('stats_activitiesLabel', 'Monthly Activities'), icon: Calendar },
        { value: t('stats_programmes', '45+'), label: t('stats.programsLabel', 'Support Programmes'), icon: Heart },
    ];

    /* ── Tab 1: Pension & Financial ── */
    const pensionTab = (
        <div>
            <h2 className="ep-section-title">{t('tabs.services.content.financial.title', 'Pension & Financial Benefits')}</h2>
            <p className="ep-section-desc">
                {t('tabs.services.content.financial.description', 'Comprehensive pension and end-of-service benefits for UAE nationals — from GPSSA, ADPF, DGRFA, and private sector providers. Your lifetime of service is recognised and rewarded.')}
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
                        <button className="ep-btn ep-btn--primary-full">{t('tabs.services.content.financial.action', 'Learn More')}</button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Healthcare ── */
    const healthcareTab = (
        <div>
            <h2 className="ep-section-title">{t('tabs.services.content.healthcare.title', 'Healthcare & Wellness')}</h2>
            <p className="ep-section-desc">
                {t('tabs.services.content.healthcare.description', 'Premium healthcare services for retired UAE nationals — from Thiqa insurance and home healthcare to mental wellness programmes. Your health is a national priority.')}
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
                        <button className="ep-btn ep-btn--outline">{t('tabs.services.content.healthcare.action', 'Access Service')}</button>
                    </div>
                ))}
            </div>

            {/* Emergency contacts */}
            <div className="ep-banner ep-banner--red">
                <Phone size={24} style={{ color: 'var(--ep-red-text)' }} />
                <div className="ep-banner__body">
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ep-red-text)', marginBottom: 2 }}>{t('healthcare_helpline_title', '24/7 Senior Health Helpline')}</div>
                    <div style={{ fontSize: 13, color: 'var(--ep-red-text)' }}>{t('healthcare_helpline_desc', 'For urgent health queries, home visit requests, or emergency medical guidance')}</div>
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
            <h2 className="ep-section-title">{t('tabs.opportunities.content.overview.title', 'Stay Active & Engaged')}</h2>
            <p className="ep-section-desc">
                {t('tabs.opportunities.content.overview.description', 'Retirement is a new chapter, not the end of the story. Share your expertise through mentoring, advisory councils, cultural preservation, and teaching — your experience is the nation\'s asset.')}
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
                            <span className="ep-text-sm">{o.spots} {t('spots_open', 'spots open')}</span>
                            <button className="ep-btn ep-btn--primary">
                                {t('btn_apply', 'Apply')} <ArrowRight size={12} />
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
            <h2 className="ep-section-title">{t('tabs.benefits.content.overview.title', 'Lifestyle Benefits & Perks')}</h2>
            <p className="ep-section-desc">
                {t('tabs.benefits.content.overview.description', 'Exclusive discounts, free access, and priority services for retired UAE nationals — from travel and fitness to education and culture. You\'ve earned it.')}
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
                    <h3 className="ep-banner__title">{t('saada_card_title', 'Get Your Saada Card')}</h3>
                    <p className="ep-banner__desc">
                        {t('saada_card_desc', 'The Saada Card is your gateway to all retiree benefits — priority healthcare, retail discounts, cultural access, and transport benefits. Apply through the Ministry of Community Development.')}
                    </p>
                </div>
                <button className="ep-btn ep-btn--primary ep-btn--lg">
                    {t('saada_card_btn', 'Apply for Saada Card')} <ArrowRight size={16} />
                </button>
            </div>

            {/* Service centres */}
            <div className="ep-card" style={{ marginTop: 20 }}>
                <h3 className="ep-card__title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <MapPin size={18} style={{ color: 'var(--ep-primary)' }} /> {t('service_centres_title', 'Retiree Service Centres')}
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
        { id: 'pension', label: t('tabs.services.label', 'Pension & Financial'), icon: <Shield className="h-4 w-4" />, content: pensionTab },
        { id: 'healthcare', label: t('tabs.wellness.label', 'Healthcare'), icon: <Heart className="h-4 w-4" />, content: healthcareTab },
        { id: 'engagement', label: t('tabs.opportunities.label', 'Stay Engaged'), icon: <Activity className="h-4 w-4" />, content: engagementTab },
        { id: 'perks', label: t('tabs.benefits.label', 'Lifestyle Perks'), icon: <Award className="h-4 w-4" />, content: perksTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Retiree Services')}
            description={t('description', 'Comprehensive support for retired UAE nationals — pension management, premium healthcare, engagement opportunities, and exclusive lifestyle benefits. Your lifetime of service is honoured')}
            icon={<Heart className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="pension"
        />
    );
};

export default RetireePage;
