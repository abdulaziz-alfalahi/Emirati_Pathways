
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Award, Building2, TrendingUp, Users, BookOpen,
    Target, ChevronRight, Clock, Star, CheckCircle,
    Shield, Globe, Briefcase, Calendar, ExternalLink,
    BadgeCheck, FileText
} from 'lucide-react';

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

/* ──────────────────────── DATA ──────────────────────── */

const certifications = [
    { title: 'Project Management Professional (PMP)', issuer: 'PMI', category: 'Management', level: 'Advanced', duration: '3–6 months', cost: 'AED 2,500', demand: 'Very High', salaryBoost: '+18%', catBg: brand.purple, catColor: brand.purpleText },
    { title: 'AWS Solutions Architect', issuer: 'Amazon Web Services', category: 'Cloud', level: 'Intermediate', duration: '2–4 months', cost: 'AED 1,200', demand: 'Very High', salaryBoost: '+22%', catBg: brand.blue, catColor: brand.blueText },
    { title: 'Certified Information Systems Security Professional (CISSP)', issuer: 'ISC²', category: 'Security', level: 'Advanced', duration: '4–6 months', cost: 'AED 3,000', demand: 'High', salaryBoost: '+25%', catBg: brand.red, catColor: brand.redText },
    { title: 'Google Data Analytics Professional', issuer: 'Google', category: 'Data', level: 'Beginner', duration: '3 months', cost: 'AED 800', demand: 'High', salaryBoost: '+15%', catBg: brand.green, catColor: brand.greenText },
    { title: 'Certified Financial Analyst (CFA)', issuer: 'CFA Institute', category: 'Finance', level: 'Advanced', duration: '12–18 months', cost: 'AED 5,000', demand: 'High', salaryBoost: '+30%', catBg: brand.amber, catColor: brand.amberText },
    { title: 'Microsoft Azure Administrator', issuer: 'Microsoft', category: 'Cloud', level: 'Intermediate', duration: '2–3 months', cost: 'AED 1,000', demand: 'High', salaryBoost: '+20%', catBg: brand.primarySurface, catColor: brand.primary },
];

const myCerts = [
    { title: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', earned: 'Jan 2026', expires: 'Jan 2029', credentialId: 'AWS-CP-2026-1247', status: 'Active' as const, badge: '☁️' },
    { title: 'Google Data Analytics', issuer: 'Google', earned: 'Dec 2025', expires: 'N/A', credentialId: 'GDA-2025-8932', status: 'Active' as const, badge: '📊' },
    { title: 'Certified Scrum Master', issuer: 'Scrum Alliance', earned: 'Oct 2025', expires: 'Oct 2027', credentialId: 'CSM-2025-4291', status: 'Active' as const, badge: '🎯' },
];

const recommended = [
    { title: 'AWS Solutions Architect', reason: 'Builds on your Cloud Practitioner credential — next step in the AWS path', match: 95, Icon: Shield },
    { title: 'PMP', reason: 'Your leadership assessment scored 88% — PMP would formalize that into a recognized credential', match: 88, Icon: Briefcase },
    { title: 'CISSP', reason: 'Cybersecurity skills are in very high demand in UAE — complements your cloud knowledge', match: 82, Icon: Shield },
    { title: 'CFA Level I', reason: 'UAE finance sector is growing rapidly — combines well with your analytics certification', match: 75, Icon: TrendingUp },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const ProfessionalCertificationsPage: React.FC = () => {


    const { t } = useTranslation('professional-certifications');
    const stats = [
        { value: t('stats.certifications_value', '150+'), label: t('stats.certifications', 'Certifications'), icon: Award },
        { value: t('stats.industry_sectors_value', '25+'), label: t('stats.industry_sectors', 'Industry Sectors'), icon: Building2 },
        { value: t('stats.avg_salary_boost_value', '+20%'), label: t('stats.avg_salary_boost', 'Avg Salary Boost'), icon: TrendingUp },
        { value: t('stats.certified_pros_value', '5,200+'), label: t('stats.certified_pros', 'Certified Pros'), icon: Users },
    ];

    /* ── Tab 1: Browse Certifications ── */
    const browseTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Browse Certifications
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Explore 150+ industry-recognized certifications across management, cloud, security, data, finance, and more — all valued by UAE employers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {certifications.map((c, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                            transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: c.catBg, color: c.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>{c.category}</span>
                                <span style={{
                                    background: c.level === 'Beginner' ? brand.green : c.level === 'Intermediate' ? brand.amber : brand.red,
                                    color: c.level === 'Beginner' ? brand.greenText : c.level === 'Intermediate' ? brand.amberText : brand.redText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                                }}>
                                    {c.level}
                                </span>
                            </div>
                            <span style={{
                                background: c.demand === 'Very High' ? brand.green : brand.blue,
                                color: c.demand === 'Very High' ? brand.greenText : brand.blueText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {c.demand} Demand
                            </span>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer}</div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {c.duration}</span>
                            <span>{c.cost}</span>
                            <span style={{ color: brand.greenText, fontWeight: 600 }}>{c.salaryBoost} salary</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                Learn More <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Certifications ── */
    const myTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                My Certifications
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                All your earned certifications, verification credentials, and renewal status in one place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myCerts.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 28 }}>{c.badge}</span>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer} · Earned {c.earned}</div>
                                </div>
                            </div>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <BadgeCheck size={12} /> {c.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: 8 }}>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FileText size={12} /> {c.credentialId}</span>
                                <span>Expires: {c.expires}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <ExternalLink size={12} /> Verify
                                </button>
                                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Recommended ── */
    const recommendedTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Recommended For You
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                AI-powered recommendations based on your current certifications, skills assessment results, and UAE market demand.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {recommended.map((r, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <r.Icon size={22} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{r.title}</h3>
                                <span style={{
                                    background: r.match >= 90 ? brand.green : r.match >= 80 ? brand.blue : brand.amber,
                                    color: r.match >= 90 ? brand.greenText : r.match >= 80 ? brand.blueText : brand.amberText,
                                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                                }}>
                                    {r.match}% match
                                </span>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '0 0 10px' }}>{r.reason}</p>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer' }}>
                                Start Preparation <ChevronRight size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tips */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Target size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Certification Strategy Tips</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        'Stack cloud certifications (Practitioner → Solutions Architect → DevOps) for maximum career impact',
                        'UAE employers rank PMP as the #1 most valued management certification',
                        'CISSP holders in the UAE earn 25% more than non-certified peers in cybersecurity',
                    ].map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{tip}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Tab 4: Preparation Resources ── */
    const prepTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Preparation Resources
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Study guides, practice exams, and learning materials to help you prepare for your next certification.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {[
                    { title: 'PMP Study Guide', type: 'Study Guide', pages: 320, format: 'PDF', icon: '📚' },
                    { title: 'AWS Practice Exam (150 Q)', type: 'Practice Exam', pages: 150, format: 'Interactive', icon: '🧪' },
                    { title: 'CISSP Flashcard Deck', type: 'Flashcards', pages: 500, format: 'App', icon: '🃏' },
                    { title: 'CFA Level I Formula Sheet', type: 'Reference', pages: 24, format: 'PDF', icon: '📋' },
                    { title: 'Cloud Architecture Diagrams', type: 'Visual Guide', pages: 48, format: 'PDF', icon: '🗺️' },
                    { title: 'Mock Certification Interview', type: 'Video Course', pages: 12, format: 'Video', icon: '🎥' },
                ].map((r, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 24 }}>{r.icon}</span>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>{r.format}</span>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{r.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{r.type} · {r.pages} {r.format === 'Interactive' ? 'questions' : r.format === 'Video' ? 'lessons' : 'pages'}</div>
                        </div>
                        <button style={{
                            background: brand.primary, color: '#fff', border: 'none',
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            Access Resource
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'browse', label: t('tabs.browse.label', 'Browse'), icon: <Award className="h-4 w-4" />, content: browseTab },
        { id: 'my-certs', label: t('tabs.my-certs.label', 'My Certifications'), icon: <BadgeCheck className="h-4 w-4" />, content: myTab },
        { id: 'recommended', label: t('tabs.recommended.label', 'Recommended'), icon: <Target className="h-4 w-4" />, content: recommendedTab },
        { id: 'preparation', label: t('tabs.preparation.label', 'Preparation'), icon: <BookOpen className="h-4 w-4" />, content: prepTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Professional Certifications')}
            description={t('description', 'Earn industry-recognized certifications to boost your career — 150+ programs across cloud, security, management, finance, and data')}
            icon={<Award className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="browse"
        />
    );
};

export default ProfessionalCertificationsPage;
