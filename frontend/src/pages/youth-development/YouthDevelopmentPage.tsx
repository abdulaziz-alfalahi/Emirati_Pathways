
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Users, Target, BookOpen, Award, Calendar, Heart,
    Star, TrendingUp, ChevronRight, CheckCircle, Clock,
    Briefcase, GraduationCap, Lightbulb, Globe, Rocket,
    Shield, Zap, ArrowRight
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

const programs = [
    { title: 'Future Leaders Initiative', org: 'Federal Youth Authority', duration: '12 months', ageGroup: '18–25', enrolled: 450, capacity: 500, status: 'Open' as const, tags: ['Leadership', 'Mentorship', 'Policy'], icon: '🏅', desc: 'Comprehensive program developing next-generation Emirati leaders with mentorship, project assignments, and international exposure.' },
    { title: 'Youth Innovation Bootcamp', org: 'Dubai Future Foundation', duration: '6 weeks', ageGroup: '16–22', enrolled: 180, capacity: 200, status: 'Open' as const, tags: ['AI', 'Startups', 'Innovation'], icon: '🚀', desc: 'Intensive bootcamp teaching design thinking, prototyping, and entrepreneurship — with seed funding for top projects.' },
    { title: 'National Service Career Track', org: 'Ministry of Defence', duration: '18 months', ageGroup: '18–30', enrolled: 1200, capacity: 1200, status: 'Full' as const, tags: ['Military', 'Discipline', 'Fitness'], icon: '🎖️', desc: 'Career-oriented national service combining military training with professional development and certification paths.' },
    { title: 'STEM Excellence Academy', org: 'Ministry of Education', duration: '9 months', ageGroup: '15–18', enrolled: 320, capacity: 400, status: 'Open' as const, tags: ['Science', 'Technology', 'Research'], icon: '🔬', desc: 'Advanced STEM program for high-achieving students — lab research, university prep, and international science olympiad participation.' },
    { title: 'Emirati Heritage & Culture Program', org: 'Abu Dhabi Culture Dept', duration: '4 months', ageGroup: '14–25', enrolled: 280, capacity: 350, status: 'Open' as const, tags: ['Heritage', 'Culture', 'Arabic'], icon: '🏛️', desc: 'Deepening cultural identity through Emirati heritage studies, Arabic calligraphy, traditional crafts, and community projects.' },
    { title: 'Youth Entrepreneurship Lab', org: 'Khalifa Fund', duration: '6 months', ageGroup: '18–30', enrolled: 150, capacity: 200, status: 'Open' as const, tags: ['Business', 'Funding', 'Pitch'], icon: '💡', desc: 'End-to-end startup program: ideation, business planning, mentorship, and up to AED 100K seed funding for qualifying ventures.' },
];

const leadershipPath = [
    { level: 1, title: 'Foundation', desc: 'Self-awareness, personal values, and basic leadership principles', color: brand.blue, colorText: brand.blueText },
    { level: 2, title: 'Team Leadership', desc: 'Collaboration, delegation, and managing small project teams', color: brand.green, colorText: brand.greenText },
    { level: 3, title: 'Strategic Thinking', desc: 'Organizational awareness, strategic planning, and decision-making', color: brand.purple, colorText: brand.purpleText },
    { level: 4, title: 'Visionary Leadership', desc: 'Mentoring others, driving change, and shaping national strategy', color: brand.amber, colorText: brand.amberText },
];

const skillsData = [
    { category: 'Technical', skills: ['Programming & App Dev', 'Data Analysis', 'Digital Marketing', 'Cybersecurity'], Icon: Zap, bg: brand.blue, color: brand.blueText },
    { category: 'Soft Skills', skills: ['Public Speaking', 'Teamwork & Collaboration', 'Problem Solving', 'Time Management'], Icon: Heart, bg: brand.green, color: brand.greenText },
    { category: 'Professional', skills: ['Project Management', 'Negotiation', 'Financial Literacy', 'Networking'], Icon: Briefcase, bg: brand.purple, color: brand.purpleText },
];

const successStories = [
    { name: 'Omar Al Zaabi', age: 22, program: 'Future Leaders Initiative', outcome: 'Appointed to Youth Federal Council', quote: 'The program gave me the confidence and skills to represent my generation at the national level.', avatar: '👨‍🎓' },
    { name: 'Layla Al Suwaidi', age: 20, program: 'Youth Entrepreneurship Lab', outcome: 'Founded social enterprise impacting 500+ families', quote: 'From idea to AED 100K funding in 6 months — the mentors were incredible.', avatar: '👩‍💼' },
    { name: 'Khalid Al Rashid', age: 24, program: 'STEM Excellence Academy', outcome: 'Full scholarship to MIT', quote: 'The research experience and international competitions opened doors I never imagined.', avatar: '👨‍🔬' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const YouthDevelopmentPage2: React.FC = () => {


    const { t } = useTranslation('youth-development');
    const stats = [
        { value: t('stats.participants_value', '12,500+'), label: t('stats.participants', 'Participants'), icon: Users },
        { value: t('stats.programs_value', '85+'), label: t('stats.programs', 'Programs'), icon: Target },
        { value: t('stats.mentors_value', '200+'), label: t('stats.mentors', 'Mentors'), icon: Award },
        { value: t('stats.success_rate_value', '94%'), label: t('stats.success_rate', 'Success Rate'), icon: TrendingUp },
    ];

    /* ── Tab 1: Programs ── */
    const programsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Development Programs
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Explore 85+ youth development programs across leadership, technology, entrepreneurship, culture, and national service — all designed for young Emiratis.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {programs.map((p, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, display: 'flex', flexDirection: 'column', gap: 10,
                            transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 28 }}>{p.icon}</span>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{p.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.org}</div>
                                </div>
                            </div>
                            <span style={{
                                background: p.status === 'Open' ? brand.green : brand.amber,
                                color: p.status === 'Open' ? brand.greenText : brand.amberText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {p.status}
                            </span>
                        </div>

                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{p.desc}</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {p.tags.map((t, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{t}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {p.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> Ages {p.ageGroup}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Target size={12} /> {p.enrolled}/{p.capacity}</span>
                        </div>

                        <button style={{
                            background: p.status === 'Open' ? brand.primary : 'transparent',
                            color: p.status === 'Open' ? '#fff' : brand.textSecondary,
                            border: p.status === 'Open' ? 'none' : `1px solid ${brand.border}`,
                            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            {p.status === 'Open' ? 'Apply Now' : 'Join Waitlist'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Leadership ── */
    const leadershipTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Leadership Development Pathway
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Structured progression from foundational self-awareness to visionary national leadership — each level builds on the last.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {leadershipPath.map((l, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 18, color: l.colorText }}>
                            {l.level}
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{l.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{l.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Opportunities & Recognition */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Globe size={18} style={{ color: brand.primary }} /> Leadership Opportunities
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {['Student Government & Youth Councils', 'Community Service Projects', 'Government Youth Advisory Bodies', 'Entrepreneurship Programs'].map((o, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CheckCircle size={14} style={{ color: brand.primary, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: brand.textSecondary }}>{o}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Award size={18} style={{ color: brand.primary }} /> Recognition & Awards
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { title: 'Youth Leadership Excellence Award', desc: 'Annual recognition for exceptional impact' },
                            { title: 'Innovation Leadership Prize', desc: 'Creative solutions and innovative thinking' },
                            { title: 'Community Impact Recognition', desc: 'Significant community service contributions' },
                        ].map((a, i) => (
                            <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: 10 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 2 }}>{a.title}</div>
                                <div style={{ fontSize: 11, color: brand.textSecondary }}>{a.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    /* ── Tab 3: Skills ── */
    const skillsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Skills Development
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Build technical, soft, and professional skills through structured courses, workshops, and hands-on projects.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
                {skillsData.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.Icon size={18} style={{ color: s.color }} />
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{s.category}</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {s.skills.map((sk, j) => (
                                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: brand.textSecondary }}>{sk}</span>
                                    <span style={{ background: '#F3F4F6', fontSize: 10, padding: '2px 8px', borderRadius: 4, color: brand.textSecondary }}>
                                        {['Beginner', 'Intermediate', 'Advanced', 'Beginner'][j]}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 14, width: '100%' }}>
                            Explore Courses
                        </button>
                    </div>
                ))}
            </div>

            {/* Assessment CTA */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>Skills Assessment & Development Plan</h3>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: 0 }}>Take a personalized assessment and get a tailored learning roadmap.</p>
                </div>
                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Start Assessment <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );

    /* ── Tab 4: Success Stories ── */
    const storiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Success Stories
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Real stories from young Emiratis who transformed their futures through our development programs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {successStories.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                            <span style={{ fontSize: 36 }}>{s.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.name}</h3>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>Age {s.age} · {s.program}</div>
                            </div>
                        </div>
                        <blockquote style={{ fontSize: 14, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 14px', paddingLeft: 16, borderLeft: `3px solid ${brand.primary}` }}>
                            "{s.quote}"
                        </blockquote>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={16} style={{ color: brand.primary }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: brand.greenText }}>{s.outcome}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Apply CTA */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, textAlign: 'center' }}>
                <Rocket size={28} style={{ color: brand.primary, margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>Start Your Journey</h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '0 0 16px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
                    Join 12,500+ young Emiratis building their futures. Apply to a program, find a mentor, and start developing the skills that matter.
                </p>
                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Browse Programs <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'programs', label: t('tabs.programs.label', 'Programs'), icon: <Target className="h-4 w-4" />, content: programsTab },
        { id: 'leadership', label: t('tabs.leadership.label', 'Leadership'), icon: <Award className="h-4 w-4" />, content: leadershipTab },
        { id: 'skills', label: t('tabs.skills.label', 'Skills'), icon: <BookOpen className="h-4 w-4" />, content: skillsTab },
        { id: 'stories', label: t('tabs.stories.label', 'Success Stories'), icon: <Star className="h-4 w-4" />, content: storiesTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Youth Development')}
            description={t('description', 'Empowering young Emiratis through 85+ development programs in leadership, technology, entrepreneurship, culture, and national service — building the UAE\'s future workforce')}
            icon={<Users className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="programs"
        />
    );
};

export default YouthDevelopmentPage2;
