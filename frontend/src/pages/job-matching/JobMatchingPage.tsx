
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Search, Target, Briefcase, MapPin, Banknote,
    Building2, Clock, ChevronRight, Heart, Send,
    TrendingUp, Star, Users, Award, Filter,
    CheckCircle, BookmarkPlus, BarChart3, Zap, Eye
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

const jobs = [
    { title: 'Senior Product Manager', company: 'Emirates Group', location: 'Dubai', salary: 'AED 18,000–25,000', type: 'Full-time', match: 95, posted: '2 days ago', desc: 'Lead product development for next-generation aviation customer experience platforms', skills: ['Product Strategy', 'Agile', 'Leadership'], sector: 'Aviation', featured: true, catBg: brand.blue, catColor: brand.blueText },
    { title: 'Digital Marketing Director', company: 'Dubai Tourism', location: 'Dubai', salary: 'AED 15,000–22,000', type: 'Full-time', match: 88, posted: '1 day ago', desc: 'Drive digital marketing strategy for Dubai\'s tourism and hospitality sector', skills: ['Digital Marketing', 'Strategy', 'Tourism'], sector: 'Government', featured: true, catBg: brand.green, catColor: brand.greenText },
    { title: 'Data Engineer', company: 'Etisalat (e&)', location: 'Abu Dhabi', salary: 'AED 20,000–28,000', type: 'Full-time', match: 92, posted: '3 days ago', desc: 'Design and maintain data pipelines for telecom analytics and AI-powered services', skills: ['Python', 'Spark', 'Cloud'], sector: 'Technology', featured: false, catBg: brand.purple, catColor: brand.purpleText },
    { title: 'Financial Analyst', company: 'Mubadala Investment', location: 'Abu Dhabi', salary: 'AED 16,000–23,000', type: 'Full-time', match: 84, posted: '5 days ago', desc: 'Conduct financial analysis and valuation for strategic investment decisions in diversified portfolio', skills: ['Financial Modelling', 'Valuation', 'Excel'], sector: 'Investment', featured: false, catBg: brand.amber, catColor: brand.amberText },
    { title: 'UX/UI Design Lead', company: 'Careem', location: 'Dubai', salary: 'AED 17,000–24,000', type: 'Hybrid', match: 90, posted: '1 day ago', desc: 'Lead design systems and user experience strategy for the super-app ecosystem', skills: ['Figma', 'Design Systems', 'User Research'], sector: 'Technology', featured: true, catBg: brand.primarySurface, catColor: brand.primary },
    { title: 'Sustainability Manager', company: 'ADNOC', location: 'Abu Dhabi', salary: 'AED 22,000–30,000', type: 'Full-time', match: 78, posted: '1 week ago', desc: 'Oversee environmental compliance and sustainability initiatives across operational units', skills: ['ESG', 'Compliance', 'Reporting'], sector: 'Energy', featured: false, catBg: brand.red, catColor: brand.redText },
];

const savedJobs = [
    { title: 'Cloud Solutions Architect', company: 'Microsoft UAE', location: 'Dubai', salary: 'AED 25,000–35,000', match: 91, savedDate: 'Feb 12, 2026' },
    { title: 'HR Business Partner', company: 'DP World', location: 'Dubai', salary: 'AED 14,000–19,000', match: 82, savedDate: 'Feb 8, 2026' },
];

const myApplications = [
    { title: 'Senior Product Manager', company: 'Emirates Group', appliedDate: 'Feb 15, 2026', status: 'Interview Scheduled', statusColor: brand.green, statusText: brand.greenText },
    { title: 'Data Engineer', company: 'Etisalat (e&)', appliedDate: 'Feb 12, 2026', status: 'Under Review', statusColor: brand.amber, statusText: brand.amberText },
    { title: 'Marketing Specialist', company: 'Noon.com', appliedDate: 'Feb 1, 2026', status: 'Not Selected', statusColor: brand.red, statusText: brand.redText },
];

const sectors = ['All Sectors', 'Technology', 'Banking', 'Government', 'Aviation', 'Energy', 'Real Estate', 'Healthcare'];

const recommendations = [
    { title: 'Complete Your Skills Profile', desc: 'Adding 3 more verified skills will improve your match score by up to 15%', Icon: Target },
    { title: 'Update Work Experience', desc: 'Your latest role isn\'t listed — adding it will unlock better senior-level matches', Icon: Briefcase },
    { title: 'Set Salary Preferences', desc: 'Specifying your expected salary range helps our AI filter irrelevant listings', Icon: Banknote },
    { title: 'Enable Location Preferences', desc: 'Tell us if you\'re open to Abu Dhabi, Sharjah, or remote roles for more options', Icon: MapPin },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const JobMatchingPage: React.FC = () => {


    const { t } = useTranslation('jobs');
    const stats = [
        { value: t('stats.job_listings_value', '5,000+'), label: t('stats.job_listings', 'Job Listings'), icon: Briefcase },
        { value: t('stats.employers_value', '500+'), label: t('stats.employers', 'Employers'), icon: Building2 },
        { value: t('stats.match_accuracy_value', '85%'), label: t('stats.match_accuracy', 'Match Accuracy'), icon: Target },
        { value: t('stats.placements_value', '3,200+'), label: t('stats.placements', 'Placements'), icon: TrendingUp },
    ];

    /* ── Tab 1: AI Matches ── */
    const matchesTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>
                    AI-Powered Job Matches
                </h2>
                <span style={{ fontSize: 13, color: brand.textSecondary }}>{jobs.length} matches found</span>
            </div>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
                Jobs ranked by AI match score based on your skills, experience, and career goals — updated in real time.
            </p>

            {/* Filter chips */}
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

            {/* Job Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {jobs.map((job, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{job.title}</h3>
                                    <span style={{
                                        background: job.match >= 90 ? brand.green : job.match >= 80 ? brand.blue : brand.amber,
                                        color: job.match >= 90 ? brand.greenText : job.match >= 80 ? brand.blueText : brand.amberText,
                                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                                    }}>
                                        {job.match}% Match
                                    </span>
                                    {job.featured && (
                                        <span style={{ background: brand.amber, color: brand.amberText, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                                            ★ Featured
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: brand.textSecondary }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={14} /> {job.company}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {job.location}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Banknote size={14} /> {job.salary}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {job.posted}</span>
                                </div>
                            </div>
                            <Heart size={20} style={{ color: brand.textSecondary, cursor: 'pointer', flexShrink: 0, marginLeft: 12 }} />
                        </div>

                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '8px 0 12px' }}>{job.desc}</p>

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
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <Send size={14} /> Apply
                                </button>
                                <button style={{
                                    background: '#fff', color: brand.textSecondary, border: `1px solid ${brand.border}`,
                                    padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <Eye size={14} /> View
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Saved Jobs ── */
    const savedTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Saved Jobs
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Jobs you've bookmarked to review or apply to later — stay organized and never miss a deadline.
            </p>

            {savedJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {savedJobs.map((job, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BookmarkPlus size={22} style={{ color: brand.primary }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{job.title}</h4>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{job.company} · {job.location} · {job.salary}</div>
                                    <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 2 }}>Saved {job.savedDate}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ background: brand.green, color: brand.greenText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                    {job.match}% Match
                                </span>
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    Apply
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: brand.textSecondary }}>
                    <BookmarkPlus size={48} style={{ margin: '0 auto 12px', opacity: .4 }} />
                    <p>No saved jobs yet — bookmark jobs you like to review them later.</p>
                </div>
            )}
        </div>
    );

    /* ── Tab 3: My Applications ── */
    const applicationsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                My Applications
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Track your submitted applications — see status updates, interview invitations, and results in one place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {myApplications.map((app, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Send size={22} style={{ color: brand.primary }} />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {[
                    { label: 'Total Applied', value: '3', color: brand.primary },
                    { label: 'Interviews', value: '1', color: brand.greenText },
                    { label: 'Under Review', value: '1', color: brand.amberText },
                    { label: 'Not Selected', value: '1', color: brand.redText },
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <span style={{ fontSize: 13, color: brand.textSecondary }}>{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Recommendations ── */
    const recsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Profile Recommendations
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Improve your match score and get better job recommendations by strengthening your profile.
            </p>

            {/* Match Score Overview */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Your Match Profile Strength</h3>
                    <span style={{ fontSize: 22, fontWeight: 700, color: brand.primary }}>85%</span>
                </div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: '85%', height: '100%', background: brand.primary, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, color: brand.textSecondary }}>Complete the actions below to reach 100% and unlock the best matches</span>
            </div>

            {/* Recommendation Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {recommendations.map((rec, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 14 }}>
                        <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <rec.Icon size={20} style={{ color: brand.primary }} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{rec.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '0 0 10px' }}>{rec.desc}</p>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer' }}>
                                Take Action <ChevronRight size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Matching Stats */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Your Match Statistics</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                    {[
                        { label: 'Total Matches', value: '47' },
                        { label: 'New This Week', value: '12' },
                        { label: 'Profile Completeness', value: '85%' },
                        { label: 'AI Accuracy', value: '92%' },
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

    const tabs = [
        { id: 'matches', label: t('tabs.matches.label', 'AI Matches'), icon: <Target className="h-4 w-4" />, content: matchesTab },
        { id: 'saved', label: t('tabs.saved.label', 'Saved Jobs'), icon: <Heart className="h-4 w-4" />, content: savedTab },
        { id: 'applications', label: t('tabs.applications.label', 'Applications'), icon: <Send className="h-4 w-4" />, content: applicationsTab },
        { id: 'recommendations', label: t('tabs.recommendations.label', 'Recommendations'), icon: <Star className="h-4 w-4" />, content: recsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Job Matching')}
            description={t('description', 'AI-powered job matching — discover roles that align with your skills, experience, and career goals across the UAE')}
            icon={<Search className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="matches"
        />
    );
};

export default JobMatchingPage;
