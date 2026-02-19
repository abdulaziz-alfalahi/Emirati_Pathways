
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Users, UserCheck, Calendar, Star, MessageCircle,
    BookOpen, Search, ChevronRight, Clock, Briefcase,
    MapPin, Globe, Award, Target, Video, Heart,
    CheckCircle, ArrowRight
} from 'lucide-react';

// Brand tokens
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

const mentors = [
    { name: 'Dr. Fatima Al Mazrouei', title: 'VP of Engineering, ADNOC Digital', expertise: ['Cloud Architecture', 'Team Leadership', 'Energy Tech'], rating: 4.9, sessions: 124, location: 'Abu Dhabi', available: true, avatar: '👩‍💼' },
    { name: 'Ahmed Al Dhaheri', title: 'Director of Innovation, Mubadala', expertise: ['Investment Strategy', 'Fintech', 'Startup Growth'], rating: 4.8, sessions: 98, location: 'Abu Dhabi', available: true, avatar: '👨‍💼' },
    { name: 'Sara Al Shamsi', title: 'Head of AI, Dubai Future Foundation', expertise: ['Artificial Intelligence', 'Data Science', 'Research'], rating: 4.9, sessions: 156, location: 'Dubai', available: false, avatar: '👩‍🔬' },
    { name: 'Khalid Al Falasi', title: 'CTO, Emirates Airlines Group', expertise: ['Aviation Tech', 'Digital Transformation', 'DevOps'], rating: 4.7, sessions: 78, location: 'Dubai', available: true, avatar: '👨‍✈️' },
    { name: 'Mariam Al Ketbi', title: 'CEO, Abu Dhabi Smart Solutions', expertise: ['Smart Cities', 'IoT', 'Project Management'], rating: 4.8, sessions: 112, location: 'Abu Dhabi', available: true, avatar: '👩‍💻' },
    { name: 'Omar Al Suwaidi', title: 'Partner, PwC Middle East', expertise: ['Management Consulting', 'Finance', 'Strategy'], rating: 4.6, sessions: 64, location: 'Dubai', available: true, avatar: '🧑‍💼' },
];

const myMentorships = [
    { mentor: 'Dr. Fatima Al Mazrouei', topic: 'Cloud Architecture Career Path', status: 'Active' as const, nextSession: 'Wed, Feb 19 · 3:00 PM', totalSessions: 8, completed: 5, progress: 62 },
    { mentor: 'Ahmed Al Dhaheri', topic: 'Fintech Startup Guidance', status: 'Active' as const, nextSession: 'Thu, Feb 20 · 10:00 AM', totalSessions: 6, completed: 2, progress: 33 },
];

const pastMentorships = [
    { mentor: 'Sara Al Shamsi', topic: 'AI/ML Career Transition', sessions: 12, period: 'Jun – Nov 2025', outcome: 'Landed AI Engineer role', rating: 5.0 },
    { mentor: 'Khalid Al Falasi', topic: 'DevOps Best Practices', sessions: 8, period: 'Mar – Jun 2025', outcome: 'Promoted to Senior Engineer', rating: 4.8 },
];

const resources = [
    { title: 'Effective Mentoring in the UAE Workplace', type: 'Guide', readTime: '12 min', icon: '📖' },
    { title: 'Setting Goals with Your Mentor', type: 'Template', readTime: '5 min', icon: '🎯' },
    { title: 'How to Be a Great Mentee', type: 'Video Course', readTime: '45 min', icon: '🎥' },
    { title: 'Mentorship Meeting Agenda Template', type: 'Template', readTime: '3 min', icon: '📋' },
    { title: 'Building Cross-Generational Connections', type: 'Article', readTime: '8 min', icon: '🤝' },
    { title: 'UAE Career Development Framework', type: 'Guide', readTime: '15 min', icon: '🇦🇪' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const MentorshipPage: React.FC = () => {


    const { t } = useTranslation('mentorship');
    const stats = [
        { value: t('stats.active_mentors_value', '300+'), label: t('stats.active_mentors', 'Active Mentors'), icon: UserCheck },
        { value: t('stats.mentees_value', '800+'), label: t('stats.mentees', 'Mentees'), icon: Users },
        { value: t('stats.sessions_value', '1,500+'), label: t('stats.sessions', 'Sessions'), icon: Calendar },
        { value: t('stats.avg_rating_value', '4.8/5'), label: t('stats.avg_rating', 'Avg Rating'), icon: Star },
    ];

    /* ── Tab 1: Find Mentors ── */
    const findTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Find a Mentor
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Connect with 300+ experienced UAE professionals across technology, finance, energy, aviation, and government — all ready to help you grow.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {mentors.map((m, i) => (
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 32 }}>{m.avatar}</span>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{m.name}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.title}</div>
                                </div>
                            </div>
                            <span style={{
                                background: m.available ? brand.green : brand.amber,
                                color: m.available ? brand.greenText : brand.amberText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {m.available ? 'Available' : 'Waitlist'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {m.expertise.map((e, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>{e}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {m.rating}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> {m.sessions} sessions</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {m.location}</span>
                        </div>

                        <button style={{
                            background: m.available ? brand.primary : 'transparent',
                            color: m.available ? '#fff' : brand.primary,
                            border: m.available ? 'none' : `1px solid ${brand.primary}`,
                            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            {m.available ? 'Request Mentorship' : 'Join Waitlist'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Mentorships ── */
    const myTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                My Mentorships
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Track your active mentorships, upcoming sessions, and progress toward your goals.
            </p>

            {/* Active */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>Active</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {myMentorships.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{m.topic}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                    with <strong>{m.mentor}</strong> · {m.completed}/{m.totalSessions} sessions
                                </div>
                            </div>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                {m.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: brand.textSecondary, marginBottom: 12 }}>
                            <Video size={14} style={{ color: brand.primary }} />
                            <span>Next: <strong>{m.nextSession}</strong></span>
                        </div>

                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${m.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: brand.textSecondary }}>{m.completed} of {m.totalSessions} sessions</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: brand.primary }}>{m.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Past Mentorships */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>Completed</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pastMentorships.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={20} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{m.topic}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                with <strong>{m.mentor}</strong> · {m.sessions} sessions · {m.period}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: brand.greenText, marginBottom: 2 }}>{m.outcome}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                                <Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary }}>{m.rating}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Become a Mentor ── */
    const becomeTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Become a Mentor
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Share your expertise with the next generation of UAE professionals. Give back to the community while growing your own leadership skills.
            </p>

            {/* Benefits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { title: 'Build Leadership Skills', desc: 'Develop coaching and communication abilities', Icon: Target },
                    { title: 'Expand Your Network', desc: 'Connect with emerging talent across the UAE', Icon: Globe },
                    { title: 'Earn Recognition', desc: 'Get certified badges and community awards', Icon: Award },
                    { title: 'Give Back', desc: 'Shape the future of UAE workforce development', Icon: Heart },
                ].map((b, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                            <b.Icon size={22} style={{ color: brand.primary }} />
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{b.title}</h4>
                        <span style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.4 }}>{b.desc}</span>
                    </div>
                ))}
            </div>

            {/* Requirements */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 14px' }}>Requirements</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        '5+ years of professional experience in your field',
                        'Currently employed or recently retired from a UAE-based organization',
                        'Commitment to at least 2 sessions per month for 3 months',
                        'Pass a brief screening interview with our mentorship team',
                    ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{r}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button style={{
                background: brand.primary, color: '#fff', border: 'none',
                padding: '12px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
            }}>
                Apply to Be a Mentor <ArrowRight size={18} />
            </button>
        </div>
    );

    /* ── Tab 4: Resources ── */
    const resourcesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Mentorship Resources
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Guides, templates, and courses to help you get the most out of your mentoring experience.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {resources.map((r, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 24 }}>{r.icon}</span>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>{r.type}</span>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{r.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={12} /> {r.readTime}
                            </div>
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
        { id: 'find', label: t('tabs.find.label', 'Find Mentors'), icon: <Search className="h-4 w-4" />, content: findTab },
        { id: 'my', label: t('tabs.my.label', 'My Mentorships'), icon: <MessageCircle className="h-4 w-4" />, content: myTab },
        { id: 'become', label: t('tabs.become.label', 'Become a Mentor'), icon: <UserCheck className="h-4 w-4" />, content: becomeTab },
        { id: 'resources', label: t('tabs.resources.label', 'Resources'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Mentorship Programs')}
            description={t('description', 'Connect with 300+ experienced UAE professionals for one-on-one guidance — in tech, finance, energy, aviation, government, and more')}
            icon={<Users className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="find"
        />
    );
};

export default MentorshipPage;
