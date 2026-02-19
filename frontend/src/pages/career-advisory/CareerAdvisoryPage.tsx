
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    UserCheck, Users, MessageCircle, BookOpen, Target,
    Star, Clock, TrendingUp, Video, Calendar,
    ChevronRight, CheckCircle, Award, Shield,
    Lightbulb, Globe, Briefcase, GraduationCap, Phone
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

const advisors = [
    { name: 'Dr. Fatima Al-Mansoori', specialization: 'Career Transition', sector: 'Banking & Finance', experience: 15, rating: 4.9, sessions: 210, available: true, photo: '👩‍💼', catBg: brand.blue, catColor: brand.blueText },
    { name: 'Khalid Al-Hashmi', specialization: 'Leadership Development', sector: 'Government', experience: 12, rating: 4.8, sessions: 180, available: true, photo: '👨‍💼', catBg: brand.green, catColor: brand.greenText },
    { name: 'Sara Al-Blooshi', specialization: 'Tech Careers', sector: 'Technology', experience: 10, rating: 4.9, sessions: 155, available: false, photo: '👩‍💻', catBg: brand.purple, catColor: brand.purpleText },
    { name: 'Ahmed Al-Suwaidi', specialization: 'Entrepreneurship', sector: 'Startups', experience: 8, rating: 4.7, sessions: 120, available: true, photo: '🧑‍💼', catBg: brand.amber, catColor: brand.amberText },
    { name: 'Maryam Al-Dhaheri', specialization: 'Work-Life Balance', sector: 'Healthcare', experience: 14, rating: 4.8, sessions: 190, available: true, photo: '👩‍⚕️', catBg: brand.red, catColor: brand.redText },
    { name: 'Omar Al-Kaabi', specialization: 'Networking & Branding', sector: 'Media', experience: 9, rating: 4.6, sessions: 95, available: true, photo: '🧑‍🎨', catBg: brand.primarySurface, catColor: brand.primary },
];

const upcomingSessions = [
    { advisor: 'Dr. Fatima Al-Mansoori', topic: 'Career Pivot Strategy', date: 'Feb 22, 2026', time: '10:00 AM', type: 'Video Call', status: 'Confirmed' },
    { advisor: 'Khalid Al-Hashmi', topic: 'Leadership Assessment Review', date: 'Feb 25, 2026', time: '2:00 PM', type: 'In-Person', status: 'Pending' },
];

const completedSessions = [
    { advisor: 'Sara Al-Blooshi', topic: 'Tech Career Roadmap', date: 'Feb 10, 2026', rating: 5, feedback: 'Excellent strategic guidance on transitioning into cloud architecture' },
    { advisor: 'Dr. Fatima Al-Mansoori', topic: 'Salary Negotiation Prep', date: 'Feb 3, 2026', rating: 4, feedback: 'Great frameworks for approaching compensation discussions' },
    { advisor: 'Ahmed Al-Suwaidi', topic: 'Startup Feasibility Review', date: 'Jan 28, 2026', rating: 5, feedback: 'Invaluable insights on UAE market entry and funding options' },
];

const resources = [
    { title: 'Career Planning Essentials', type: 'Article', category: 'Planning', readTime: '8 min', Icon: BookOpen, catBg: brand.blue, catColor: brand.blueText },
    { title: 'Leadership in the Digital Age', type: 'Video', category: 'Leadership', readTime: '45 min', Icon: Video, catBg: brand.purple, catColor: brand.purpleText },
    { title: 'Networking Strategies for UAE', type: 'Article', category: 'Networking', readTime: '6 min', Icon: Globe, catBg: brand.green, catColor: brand.greenText },
    { title: 'Personal Branding Workshop', type: 'Video', category: 'Branding', readTime: '30 min', Icon: Star, catBg: brand.amber, catColor: brand.amberText },
    { title: 'Interview Mastery Course', type: 'Course', category: 'Interview', readTime: '2 hrs', Icon: MessageCircle, catBg: brand.primarySurface, catColor: brand.primary },
    { title: 'Career Transition Guide', type: 'Guide', category: 'Transition', readTime: '15 min', Icon: TrendingUp, catBg: brand.red, catColor: brand.redText },
];

const goals = [
    { title: 'Complete Leadership Certificate', category: 'Short-term', progress: 65, deadline: 'Mar 30, 2026' },
    { title: 'Transition to Senior Manager Role', category: 'Medium-term', progress: 30, deadline: 'Sep 2026' },
    { title: 'Launch Consulting Practice', category: 'Long-term', progress: 10, deadline: 'Dec 2027' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const CareerAdvisoryPage: React.FC = () => {


    const { t } = useTranslation('career-advisory');
    const stats = [
        { value: t('stats.advisors_value', '50+'), label: t('stats.advisors', 'Advisors'), icon: Users },
        { value: t('stats.sessions_value', '2,000+'), label: t('stats.sessions', 'Sessions'), icon: MessageCircle },
        { value: t('stats.satisfaction_value', '95%'), label: t('stats.satisfaction', 'Satisfaction'), icon: Star },
        { value: t('stats.goal_achievement_value', '80%'), label: t('stats.goal_achievement', 'Goal Achievement'), icon: Target },
    ];

    /* ── Tab 1: Find an Advisor ── */
    const advisorsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Find a Career Advisor
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Connect with expert career advisors who specialize in your industry — get personalized guidance on career transitions, leadership, and growth.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {advisors.map((adv, i) => (
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
                            <div style={{ width: 48, height: 48, borderRadius: 99, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                {adv.photo}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{adv.name}</h3>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{adv.specialization}</span>
                            </div>
                            <span style={{
                                width: 10, height: 10, borderRadius: 99,
                                background: adv.available ? '#22C55E' : '#D1D5DB',
                            }} title={adv.available ? 'Available' : 'Unavailable'} />
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ background: adv.catBg, color: adv.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {adv.sector}
                            </span>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                {adv.experience}+ yrs
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Star size={14} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {adv.rating}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MessageCircle size={14} /> {adv.sessions} sessions
                            </span>
                        </div>

                        <button style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: adv.available ? brand.primary : '#F3F4F6',
                            color: adv.available ? '#fff' : brand.textSecondary,
                            border: 'none', padding: '10px 16px', borderRadius: 8,
                            fontSize: 13, fontWeight: 600, cursor: adv.available ? 'pointer' : 'default',
                            marginTop: 'auto',
                        }}>
                            <Calendar size={16} /> {adv.available ? 'Book Session' : 'Join Waitlist'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Sessions ── */
    const sessionsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                My Sessions
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Manage upcoming sessions and review past advisory meetings with notes and feedback.
            </p>

            {/* Upcoming */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>Upcoming Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {upcomingSessions.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {s.type === 'Video Call' ? <Video size={22} style={{ color: brand.primary }} /> : <Users size={22} style={{ color: brand.primary }} />}
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.topic}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.advisor} · {s.date} at {s.time}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                {s.type}
                            </span>
                            <span style={{
                                background: s.status === 'Confirmed' ? brand.green : brand.amber,
                                color: s.status === 'Confirmed' ? brand.greenText : brand.amberText,
                                fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
                            }}>
                                {s.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>Completed Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {completedSessions.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.topic}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.advisor} · {s.date}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} size={14} style={{ color: j < s.rating ? '#FBBF24' : '#D1D5DB', fill: j < s.rating ? '#FBBF24' : 'none' }} />
                                ))}
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{s.feedback}</p>
                    </div>
                ))}
            </div>

            {/* Session Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {[
                    { label: 'Upcoming', value: '2', color: brand.primary },
                    { label: 'Completed', value: '3', color: brand.greenText },
                    { label: 'Cancelled', value: '0', color: brand.textSecondary },
                    { label: 'Total Hours', value: '4.5', color: brand.blueText },
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <span style={{ fontSize: 13, color: brand.textSecondary }}>{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Resources ── */
    const resourcesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Career Resources
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Articles, videos, courses, and guides curated by our advisors to accelerate your career development.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {resources.map((res, i) => (
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
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: res.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <res.Icon size={22} style={{ color: res.catColor }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {res.type}
                                </span>
                                <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                    {res.readTime}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{res.title}</h3>
                            <span style={{ fontSize: 12, color: brand.textSecondary }}>{res.category}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, marginTop: 'auto' }}>
                            {res.type === 'Video' || res.type === 'Course' ? 'Watch Now' : 'Read Now'} <ChevronRight size={14} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Goals ── */
    const goalsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Career Goals
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Set, track, and achieve your career goals with advisor-guided milestones and progress tracking.
            </p>

            {/* Active Goals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {goals.map((g, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{g.title}</h4>
                                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: brand.textSecondary }}>
                                    <span style={{
                                        background: g.category === 'Short-term' ? brand.green : g.category === 'Medium-term' ? brand.amber : brand.blue,
                                        color: g.category === 'Short-term' ? brand.greenText : g.category === 'Medium-term' ? brand.amberText : brand.blueText,
                                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                    }}>
                                        {g.category}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {g.deadline}</span>
                                </div>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: g.progress >= 50 ? brand.primary : brand.amberText }}>{g.progress}%</span>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${g.progress}%`, height: '100%', background: g.progress >= 50 ? brand.primary : '#F59E0B', borderRadius: 99, transition: 'width .3s' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Goal + Goal Types */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Target size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Set a New Goal</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                    {[
                        { title: 'Skill Development', desc: 'Learn new skills or earn certifications', Icon: GraduationCap },
                        { title: 'Career Advancement', desc: 'Target a promotion or role change', Icon: TrendingUp },
                        { title: 'Networking', desc: 'Expand your professional network', Icon: Globe },
                        { title: 'Leadership', desc: 'Develop management capabilities', Icon: Award },
                    ].map((type, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, cursor: 'pointer', transition: 'box-shadow .2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <type.Icon size={16} style={{ color: brand.primary }} />
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{type.title}</h4>
                            </div>
                            <p style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.4, margin: 0 }}>{type.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'advisors', label: t('tabs.advisors.label', 'Find an Advisor'), icon: <Users className="h-4 w-4" />, content: advisorsTab },
        { id: 'sessions', label: t('tabs.sessions.label', 'My Sessions'), icon: <MessageCircle className="h-4 w-4" />, content: sessionsTab },
        { id: 'resources', label: t('tabs.resources.label', 'Resources'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
        { id: 'goals', label: t('tabs.goals.label', 'Career Goals'), icon: <Target className="h-4 w-4" />, content: goalsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Career Advisory')}
            description={t('description', 'Connect with expert career advisors for personalized guidance on transitions, leadership, and professional growth in the UAE')}
            icon={<UserCheck className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="advisors"
        />
    );
};

export default CareerAdvisoryPage;
