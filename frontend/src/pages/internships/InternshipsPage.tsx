
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Briefcase, Building2, MapPin, Clock, Calendar,
    ChevronRight, Bookmark, CheckCircle, Search,
    TrendingUp, Star, Users, Award, Shield,
    GraduationCap, Banknote, Globe, Zap, Filter
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

const internships = [
    { title: 'Software Engineering Intern', company: 'Emirates NBD', location: 'Dubai', duration: '3 months', type: 'Paid', stipend: 'AED 5,000/mo', sector: 'Banking & Finance', deadline: 'Apr 15, 2026', desc: 'Work with the digital banking team on mobile app features and API development', skills: ['React', 'Node.js', 'SQL'], catBg: brand.blue, catColor: brand.blueText },
    { title: 'Marketing & Communications Intern', company: 'Dubai Tourism', location: 'Dubai', duration: '6 months', type: 'Paid', stipend: 'AED 4,500/mo', sector: 'Government', deadline: 'Mar 30, 2026', desc: 'Support digital marketing campaigns and social media strategy for tourism initiatives', skills: ['Marketing', 'Content', 'Analytics'], catBg: brand.green, catColor: brand.greenText },
    { title: 'Data Science Intern', company: 'Etisalat (e&)', location: 'Abu Dhabi', duration: '4 months', type: 'Paid', stipend: 'AED 6,000/mo', sector: 'Technology', deadline: 'Apr 1, 2026', desc: 'Develop ML models for customer analytics and network optimization projects', skills: ['Python', 'TensorFlow', 'SQL'], catBg: brand.purple, catColor: brand.purpleText },
    { title: 'Architecture & Design Intern', company: 'Emaar Properties', location: 'Dubai', duration: '3 months', type: 'Paid', stipend: 'AED 4,000/mo', sector: 'Real Estate', deadline: 'May 1, 2026', desc: 'Contribute to design concepts for upcoming mixed-use developments and community spaces', skills: ['AutoCAD', 'SketchUp', 'Revit'], catBg: brand.amber, catColor: brand.amberText },
    { title: 'Sustainability & ESG Intern', company: 'ADNOC', location: 'Abu Dhabi', duration: '6 months', type: 'Paid', stipend: 'AED 7,000/mo', sector: 'Energy & Oil', deadline: 'Apr 20, 2026', desc: 'Support environmental impact assessments and sustainability reporting across operational units', skills: ['Sustainability', 'Data Analysis', 'Reporting'], catBg: brand.primarySurface, catColor: brand.primary },
    { title: 'Healthcare Innovation Intern', company: 'Cleveland Clinic Abu Dhabi', location: 'Abu Dhabi', duration: '3 months', type: 'Paid', stipend: 'AED 4,500/mo', sector: 'Healthcare', deadline: 'Mar 25, 2026', desc: 'Research and implement digital health tools for patient engagement and care coordination', skills: ['Research', 'Health IT', 'UX'], catBg: brand.red, catColor: brand.redText },
];

const partnerCompanies = [
    { name: 'Emirates NBD', sector: 'Banking', openings: 4, logo: '🏦' },
    { name: 'Etisalat (e&)', sector: 'Technology', openings: 6, logo: '📡' },
    { name: 'ADNOC', sector: 'Energy', openings: 5, logo: '⛽' },
    { name: 'Emaar Properties', sector: 'Real Estate', openings: 3, logo: '🏗️' },
    { name: 'Dubai Tourism', sector: 'Government', openings: 4, logo: '🏛️' },
    { name: 'Mubadala', sector: 'Investment', openings: 3, logo: '💼' },
];

const applications = [
    { title: 'Software Engineering Intern', company: 'Emirates NBD', appliedDate: 'Feb 10, 2026', status: 'Under Review', statusColor: brand.amber, statusText: brand.amberText },
    { title: 'Data Science Intern', company: 'Etisalat (e&)', appliedDate: 'Feb 5, 2026', status: 'Interview Scheduled', statusColor: brand.green, statusText: brand.greenText },
    { title: 'Marketing Intern', company: 'Dubai Tourism', appliedDate: 'Jan 28, 2026', status: 'Under Review', statusColor: brand.amber, statusText: brand.amberText },
];

const tips = [
    { title: 'Start Your Search Early', desc: 'Begin looking for internships 3–6 months before your desired start date to maximize your options', Icon: Calendar },
    { title: 'Tailor Every Application', desc: 'Customize your cover letter and highlight relevant skills for each specific opportunity', Icon: Star },
    { title: 'Leverage University Services', desc: 'Use career services, job fairs, and alumni networks at your university for referrals', Icon: GraduationCap },
    { title: 'Build a Strong Online Profile', desc: 'Keep your LinkedIn and portfolio up to date — UAE recruiters actively source interns online', Icon: Globe },
    { title: 'Network at Industry Events', desc: 'Attend meetups, conferences, and career expos across Dubai and Abu Dhabi', Icon: Users },
    { title: 'Follow Up Professionally', desc: 'Send a polite follow-up email 1–2 weeks after applying if you haven\'t heard back', Icon: CheckCircle },
];

const sectors = ['All Sectors', 'Banking & Finance', 'Technology', 'Government', 'Energy & Oil', 'Real Estate', 'Healthcare'];

/* ──────────────────────── COMPONENT ──────────────────────── */

const InternshipsPage: React.FC = () => {


    const { t } = useTranslation('internships');
    const stats = [
        { value: t('stats.open_internships_value', '25+'), label: t('stats.open_internships', 'Open Internships'), icon: Briefcase },
        { value: t('stats.partner_companies_value', '50+'), label: t('stats.partner_companies', 'Partner Companies'), icon: Building2 },
        { value: t('stats.placements_value', '1,200+'), label: t('stats.placements', 'Placements'), icon: Award },
        { value: t('stats.full_time_conversion_value', '72%'), label: t('stats.full_time_conversion', 'Full-time Conversion'), icon: TrendingUp },
    ];

    /* ── Tab 1: Opportunities ── */
    const opportunitiesTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>
                    Internship Opportunities
                </h2>
            </div>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
                Explore internships across UAE's top companies — filter by sector, location, and duration to find your ideal placement.
            </p>

            {/* Filter bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {sectors.map((s, i) => (
                    <button
                        key={i}
                        style={{
                            background: i === 0 ? brand.primarySurface : '#F3F4F6',
                            color: i === 0 ? brand.primary : brand.textSecondary,
                            border: `1px solid ${i === 0 ? brand.primary : brand.border}`,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Listings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {internships.map((item, i) => (
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
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{item.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: brand.textSecondary }}>
                                    <Building2 size={14} /> {item.company}
                                </div>
                            </div>
                            <Bookmark size={18} style={{ color: brand.textSecondary, cursor: 'pointer' }} />
                        </div>

                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>

                        {/* Meta */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {item.location}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {item.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Banknote size={13} /> {item.stipend}</span>
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ background: item.catBg, color: item.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {item.sector}
                            </span>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {item.type}
                            </span>
                        </div>

                        {/* Skills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {item.skills.map((sk, j) => (
                                <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 4 }}>
                                    {sk}
                                </span>
                            ))}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: 11, color: brand.textSecondary }}><Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />Deadline: {item.deadline}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary }}>
                                Apply <ChevronRight size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Applications ── */
    const applicationsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                My Applications
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Track and manage your submitted internship applications — see status updates and upcoming interview schedules.
            </p>

            {/* Application Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {applications.map((app, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Briefcase size={22} style={{ color: brand.primary }} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{app.title}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{app.company} · Applied {app.appliedDate}</div>
                            </div>
                        </div>
                        <span style={{ background: app.statusColor, color: app.statusText, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                            {app.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[
                    { label: 'Total Applications', value: '3', color: brand.primary },
                    { label: 'Under Review', value: '2', color: brand.amberText },
                    { label: 'Interviews Scheduled', value: '1', color: brand.greenText },
                    { label: 'Offers Received', value: '0', color: brand.blueText },
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <span style={{ fontSize: 13, color: brand.textSecondary }}>{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Partner Companies ── */
    const companiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Partner Companies
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Explore 50+ partner organizations across the UAE that actively recruit interns — from government entities to private sector leaders.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {partnerCompanies.map((co, i) => (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                {co.logo}
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{co.name}</h3>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{co.sector}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${brand.border}` }}>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>
                                <Briefcase size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                                {co.openings} open positions
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary }}>
                                View <ChevronRight size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Tips & Resources ── */
    const tipsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Internship Tips & Resources
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Expert advice to help you secure, excel in, and convert your internship into a full-time role.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {tips.map((tip, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 14 }}>
                        <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <tip.Icon size={20} style={{ color: brand.primary }} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{tip.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{tip.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Conversion Advice */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <TrendingUp size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Converting Your Internship to a Full-time Role</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
                    {[
                        { title: 'Exceed Expectations', desc: 'Go beyond assigned tasks — propose improvements and take initiative on projects' },
                        { title: 'Build Relationships', desc: 'Network with team members, managers, and other departments during your internship' },
                        { title: 'Ask for Feedback', desc: 'Request regular feedback and demonstrate how you\'ve actioned it' },
                    ].map((item, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <CheckCircle size={16} style={{ color: brand.primary }} />
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{item.title}</h4>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'opportunities', label: t('tabs.opportunities.label', 'Opportunities'), icon: <Briefcase className="h-4 w-4" />, content: opportunitiesTab },
        { id: 'applications', label: t('tabs.applications.label', 'My Applications'), icon: <CheckCircle className="h-4 w-4" />, content: applicationsTab },
        { id: 'companies', label: t('tabs.companies.label', 'Partner Companies'), icon: <Building2 className="h-4 w-4" />, content: companiesTab },
        { id: 'tips', label: t('tabs.tips.label', 'Tips & Resources'), icon: <Star className="h-4 w-4" />, content: tipsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Internships')}
            description={t('description', 'Gain valuable work experience through paid internships with leading companies across the UAE — your bridge from learning to earning')}
            icon={<Briefcase className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="opportunities"
        />
    );
};

export default InternshipsPage;
