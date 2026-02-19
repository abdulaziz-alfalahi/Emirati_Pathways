
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Shield, Users, Leaf, Award, TrendingUp,
    CheckCircle, Clock, Building, ArrowRight,
    Globe, MapPin, ExternalLink, Star
} from 'lucide-react';
import {
    servicePrograms, sustainabilityOpportunities,
    nsraPartners, recentMilestones,
    sustainabilityImpact, enrolmentSteps
} from './data';

/* ──────────────────────── COMPONENT ──────────────────────── */

const stepColors = [
    { bg: 'var(--ep-blue)', text: 'var(--ep-blue-text)' },
    { bg: 'var(--ep-green)', text: 'var(--ep-green-text)' },
    { bg: 'var(--ep-purple)', text: 'var(--ep-purple-text)' },
    { bg: 'var(--ep-amber)', text: 'var(--ep-amber-text)' },
];

const NationalServicePage: React.FC = () => {
    const { t } = useTranslation('national-service');

    const stats = [
        { value: t('stats.participants', '45,000+'), label: t('stats.participantsLabel', 'Citizens Served'), icon: Users },
        { value: t('stats.programs', '150+'), label: t('stats.programsLabel', 'Partner Organisations'), icon: Building },
        { value: t('stats.impact', '85%'), label: t('stats.impactLabel', 'Career Placement'), icon: TrendingUp },
        { value: t('stats.hours', '18'), label: t('stats_cohorts', 'Cohorts Graduated'), icon: Award },
    ];

    /* ── Tab 1: Service Programs ── */
    const programsTab = (
        <div>
            <h2 className="ep-section-title">{t('tabs.programs.label', 'Service Programs')}</h2>
            <p className="ep-section-desc">
                {t('tabs.programs.content.overview.description', 'In liaison with the National Service and Reserve Authority (NSRA), we offer career-oriented service programmes with a focus on sustainability and national development. Choose your path — from clean energy to data science to emergency management.')}
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
                            <span className={`ep-badge ${p.status === 'Enrolling' ? 'ep-badge--green' : 'ep-badge--blue'}`} style={{ borderRadius: 99 }}>
                                {p.status}
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
                            <span className="ep-card__meta-item"><Users size={12} /> {p.spots} {t('spots', 'spots')}</span>
                        </div>

                        <div className="ep-card__divider">
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ep-text)', marginBottom: 6 }}>{t('key_benefits', 'Key Benefits')}</div>
                            {p.highlights.map((h, j) => (
                                <div key={j} className="ep-checklist">
                                    <CheckCircle size={12} className="ep-checklist__icon" />
                                    <span className="ep-checklist__text">{h}</span>
                                </div>
                            ))}
                        </div>

                        <button className="ep-btn ep-btn--primary-full">{t('btn_apply_now', 'Apply Now')}</button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Sustainability Careers ── */
    const sustainabilityTab = (
        <div>
            <h2 className="ep-section-title">{t('sustainability_title', 'Sustainability Work Opportunities')}</h2>
            <p className="ep-section-desc">
                {t('sustainability_desc', 'Post-service career opportunities in sustainability — from marine conservation to renewable energy to climate policy. Build a career that serves both the UAE and the planet.')}
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
                                {t('btn_view_role', 'View Role')} <ArrowRight size={12} />
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
            <h2 className="ep-section-title">{t('impact_title', 'National Impact')}</h2>
            <p className="ep-section-desc">
                {t('impact_desc', '18 cohorts graduated. 45,000+ citizens served. The NSRA programmes are shaping the UAE\'s workforce and building national resilience.')}
            </p>

            {/* Metric cards */}
            <div className="ep-grid ep-grid--4col ep-grid--gap-md" style={{ marginBottom: 28 }}>
                {[
                    { value: '18', label: t('metric_cohorts', 'Cohorts Graduated'), note: t('metric_cohorts_note', 'National Service programme'), cls: 'ep-badge--blue' },
                    { value: '45K+', label: t('metric_citizens', 'Citizens Served'), note: t('metric_citizens_note', 'Since programme inception'), cls: 'ep-badge--green' },
                    { value: '150+', label: t('metric_partners', 'Partner Organisations'), note: t('metric_partners_note', 'Government & private sector'), cls: 'ep-badge--purple' },
                    { value: '85%', label: t('metric_placement', 'Career Placement Rate'), note: t('metric_placement_note', 'Within 6 months of completion'), cls: 'ep-badge--amber' },
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
                    <Star size={18} style={{ color: 'var(--ep-primary)' }} /> {t('milestones_title', 'Recent Milestones')}
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
                        <Leaf size={18} style={{ color: 'var(--ep-primary)' }} /> {t('sustainability_impact_title', 'Sustainability Impact')}
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
            <h2 className="ep-section-title">{t('partners_title', 'NSRA Partnership Network')}</h2>
            <p className="ep-section-desc">
                {t('partners_desc', 'The National Service and Reserve Authority collaborates with leading UAE institutions to provide career-oriented service tracks. These partnerships ensure recruits gain real-world skills and clear career pathways.')}
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
                <h3 className="ep-card__title" style={{ fontSize: 16, marginBottom: 18 }}>{t('enrol_title', 'How to Enrol in National Service')}</h3>
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
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ep-text)', marginBottom: 4 }}>{t('nsra_learn_more', 'Learn more about the National Service & Reserve Authority')}</div>
                    <div className="ep-text-sm" style={{ fontSize: 13 }}>{t('nsra_learn_more_desc', 'Visit the official NSRA resources for eligibility, registration, and programme details.')}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a href="https://nscf.ae/en/" target="_blank" rel="noopener noreferrer" className="ep-btn ep-btn--primary" style={{ textDecoration: 'none' }}>
                        {t('btn_nscf_portal', 'NSCF Portal')} <ExternalLink size={12} />
                    </a>
                    <a href="https://www.mediaoffice.abudhabi/en/topic/national-service-reserve-authority-nsra/" target="_blank" rel="noopener noreferrer" className="ep-btn" style={{ background: '#fff', color: 'var(--ep-text)', border: '1px solid var(--ep-border)', textDecoration: 'none', padding: '9px 16px', fontSize: 12 }}>
                        {t('btn_nsra_news', 'NSRA News')} <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'programs', label: t('tabs.programs.label', 'Service Programs'), icon: <Shield className="h-4 w-4" />, content: programsTab },
        { id: 'sustainability', label: t('sustainability_tab', 'Sustainability Careers'), icon: <Leaf className="h-4 w-4" />, content: sustainabilityTab },
        { id: 'impact', label: t('impact_tab', 'National Impact'), icon: <TrendingUp className="h-4 w-4" />, content: impactTab },
        { id: 'partners', label: t('partners_tab', 'NSRA Partners'), icon: <Globe className="h-4 w-4" />, content: partnersTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'National Service & Sustainability')}
            description={t('description', 'In liaison with the National Service and Reserve Authority (NSRA), we offer career-oriented service tracks in sustainability, data science, emergency management, and education — building the UAE\'s workforce while serving the nation')}
            icon={<Shield className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="programs"
        />
    );
};

export default NationalServicePage;
