
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Users, MessageCircle, Calendar, MapPin, Star,
    Search, Heart, Eye, Clock, Award, Building,
    Briefcase, GraduationCap, ChevronRight, CheckCircle,
    Globe, UserCheck, Share2, BookOpen
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

const communities = [
    { name: 'UAE Tech Professionals', description: 'Connect with 5,000+ tech professionals across the UAE — share insights, job leads, and collaborate on projects.', category: 'Technology', members: 5240, posts: 12400, joined: true, verified: true, tags: ['Software', 'Cloud', 'AI'], avatar: '💻', catBg: brand.blue, catColor: brand.blueText },
    { name: 'Emirati Women in Leadership', description: 'Empowering UAE women in business, government, and STEM — mentoring, networking, and career resources.', category: 'Leadership', members: 3180, posts: 8200, joined: true, verified: true, tags: ['Women', 'Leadership', 'STEM'], avatar: '👩‍💼', catBg: brand.purple, catColor: brand.purpleText },
    { name: 'Abu Dhabi Finance Network', description: 'Financial professionals in Abu Dhabi — banking, investment, fintech, and regulatory updates from ADGM and beyond.', category: 'Finance', members: 2750, posts: 6800, joined: false, verified: true, tags: ['Finance', 'Banking', 'Fintech'], avatar: '📈', catBg: brand.green, catColor: brand.greenText },
    { name: 'Dubai Innovation Hub', description: 'Entrepreneurs, innovators, and startup founders building the future of Dubai — events, funding, and collaboration.', category: 'Startups', members: 4100, posts: 9500, joined: false, verified: true, tags: ['Startups', 'Innovation', 'Funding'], avatar: '🚀', catBg: brand.amber, catColor: brand.amberText },
    { name: 'UAE Energy & Sustainability', description: 'Professionals in oil & gas, renewables, and sustainability — ADNOC, Masdar, and the UAE energy transition.', category: 'Energy', members: 1920, posts: 4300, joined: false, verified: true, tags: ['Energy', 'Sustainability', 'Oil & Gas'], avatar: '⚡', catBg: brand.primarySurface, catColor: brand.primary },
    { name: 'UAE Government Careers', description: 'Public sector professionals — career development, government initiatives, Emiratization updates, and policy discussions.', category: 'Government', members: 6200, posts: 15800, joined: true, verified: true, tags: ['Government', 'Policy', 'Careers'], avatar: '🏛️', catBg: brand.red, catColor: brand.redText },
];

const feedPosts = [
    { author: 'Fatima Al Mazrouei', title: 'VP Engineering', company: 'ADNOC Digital', avatar: '👩‍💼', community: 'UAE Tech Professionals', content: 'Excited to announce our team is hiring 5 cloud architects! If you have AWS or Azure experience and want to work on Abu Dhabi\'s digital transformation, DM me. 🚀', time: '2h ago', likes: 48, comments: 12, verified: true },
    { author: 'Ahmed Al Dhaheri', title: 'Director', company: 'Mubadala', avatar: '👨‍💼', community: 'Abu Dhabi Finance Network', content: 'Great panel discussion today on UAE fintech regulation. Key takeaway: CBUAE\'s sandbox program is accelerating innovation faster than expected. Bullish on UAE digital banking.', time: '4h ago', likes: 72, comments: 28, verified: true },
    { author: 'Sara Al Shamsi', title: 'AI Lead', company: 'Dubai Future Foundation', avatar: '👩‍🔬', community: 'Dubai Innovation Hub', content: 'We just published our 2026 AI Readiness Report for the UAE. Download link in bio — covers adoption rates, talent gaps, and investment trends. Key stat: 67% of UAE companies plan to increase AI spending this year.', time: '6h ago', likes: 134, comments: 45, verified: true },
    { author: 'Khalid Al Falasi', title: 'CTO', company: 'Emirates Group', avatar: '👨‍✈️', community: 'UAE Tech Professionals', content: 'Mentoring sessions open for Q2 2026. I\'ll be focusing on DevOps and cloud migration strategies. First 10 spots go fast — sign up through the mentorship platform.', time: '8h ago', likes: 56, comments: 19, verified: true },
];

const events = [
    { title: 'UAE Tech Summit 2026', date: 'Mar 15, 2026', time: '9:00 AM – 5:00 PM', location: 'ADNEC, Abu Dhabi', type: 'In-Person' as const, attendees: 420, maxAttendees: 500, community: 'UAE Tech Professionals', organizer: 'TechConnect UAE' },
    { title: 'Women in Leadership Lunch', date: 'Feb 28, 2026', time: '12:00 PM – 2:00 PM', location: 'Jumeirah Emirates Towers, Dubai', type: 'In-Person' as const, attendees: 85, maxAttendees: 100, community: 'Emirati Women in Leadership', organizer: 'EWL Committee' },
    { title: 'Fintech Regulations Webinar', date: 'Mar 5, 2026', time: '2:00 PM – 3:30 PM', location: 'Online (Zoom)', type: 'Online' as const, attendees: 210, maxAttendees: 500, community: 'Abu Dhabi Finance Network', organizer: 'ADGM Academy' },
    { title: 'Startup Pitch Night', date: 'Mar 10, 2026', time: '6:00 PM – 9:00 PM', location: 'Hub71, Abu Dhabi', type: 'Hybrid' as const, attendees: 150, maxAttendees: 200, community: 'Dubai Innovation Hub', organizer: 'Hub71' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const CommunitiesPage2: React.FC = () => {


    const { t } = useTranslation('communities');
    const stats = [
        { value: t('stats.communities_value', '25+'), label: t('stats.communities', 'Communities'), icon: Users },
        { value: t('stats.members_value', '23K+'), label: t('stats.members', 'Members'), icon: UserCheck },
        { value: t('stats.posts_value', '57K+'), label: t('stats.posts', 'Posts'), icon: MessageCircle },
        { value: t('stats.events_year_value', '120+'), label: t('stats.events_year', 'Events/Year'), icon: Calendar },
    ];

    /* ── Tab 1: Discover ── */
    const discoverTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Discover Communities
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Join vibrant professional communities across the UAE — connect with peers, share knowledge, and grow your career network.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {communities.map((c, i) => (
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
                                <span style={{ fontSize: 28 }}>{c.avatar}</span>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{c.name}</h3>
                                        {c.verified && <CheckCircle size={14} style={{ color: brand.primary }} />}
                                    </div>
                                    <span style={{ background: c.catBg, color: c.catColor, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{c.category}</span>
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{c.description}</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {c.tags.map((t, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{t}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {c.members.toLocaleString()} members</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MessageCircle size={12} /> {c.posts.toLocaleString()} posts</span>
                        </div>

                        <button style={{
                            background: c.joined ? 'transparent' : brand.primary,
                            color: c.joined ? brand.primary : '#fff',
                            border: c.joined ? `1px solid ${brand.primary}` : 'none',
                            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            {c.joined ? 'Joined ✓' : 'Join Community'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Feed ── */
    const feedTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Community Feed
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Latest posts, discussions, and updates from your communities.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {feedPosts.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 28 }}>{p.avatar}</span>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{p.author}</span>
                                        {p.verified && <CheckCircle size={12} style={{ color: brand.primary }} />}
                                    </div>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.title} at {p.company}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 11, color: brand.textSecondary }}>{p.time}</span>
                                <div style={{ fontSize: 10, color: brand.primary, fontWeight: 500 }}>{p.community}</div>
                            </div>
                        </div>

                        <p style={{ fontSize: 14, color: brand.textPrimary, lineHeight: 1.6, margin: '0 0 14px' }}>{p.content}</p>

                        <div style={{ display: 'flex', gap: 16, borderTop: `1px solid ${brand.border}`, paddingTop: 12 }}>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}>
                                <Heart size={14} /> {p.likes}
                            </button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}>
                                <MessageCircle size={14} /> {p.comments}
                            </button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}>
                                <Share2 size={14} /> Share
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Events ── */
    const eventsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Community Events
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Upcoming meetups, webinars, summits, and networking events across UAE communities.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {events.map((e, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {/* Date badge */}
                        <div style={{ width: 56, minWidth: 56, textAlign: 'center', background: brand.primarySurface, borderRadius: 10, padding: '8px 4px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: brand.primary, textTransform: 'uppercase' }}>{e.date.split(',')[0].split(' ')[0]}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: brand.primaryDark }}>{e.date.split(' ')[1].replace(',', '')}</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{e.title}</h3>
                                <span style={{
                                    background: e.type === 'Online' ? brand.blue : e.type === 'In-Person' ? brand.green : brand.amber,
                                    color: e.type === 'Online' ? brand.blueText : e.type === 'In-Person' ? brand.greenText : brand.amberText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                                }}>
                                    {e.type}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: brand.textSecondary, marginBottom: 10 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {e.time}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {e.location}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {e.attendees}/{e.maxAttendees}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: brand.primary, fontWeight: 500 }}>by {e.organizer} · {e.community}</span>
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    Register
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: My Communities ── */
    const myTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                My Communities
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Communities you've joined — quick access to posts, events, and fellow members.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {communities.filter(c => c.joined).map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>{c.avatar}</span>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{c.name}</h4>
                                    {c.verified && <CheckCircle size={14} style={{ color: brand.primary }} />}
                                </div>
                                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                    <span>{c.members.toLocaleString()} members</span>
                                    <span>{c.posts.toLocaleString()} posts</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                View
                            </button>
                            <button style={{ background: '#fff', color: brand.redText, border: `1px solid ${brand.border}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                                Leave
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state hint */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, marginTop: 24, textAlign: 'center' }}>
                <Globe size={28} style={{ color: brand.primary, margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>Discover More Communities</h4>
                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>
                    Explore 25+ professional communities and find your tribe — from tech and finance to government and sustainability.
                </p>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'discover', label: t('tabs.discover.label', 'Discover'), icon: <Search className="h-4 w-4" />, content: discoverTab },
        { id: 'feed', label: t('tabs.feed.label', 'Feed'), icon: <MessageCircle className="h-4 w-4" />, content: feedTab },
        { id: 'events', label: t('tabs.events.label', 'Events'), icon: <Calendar className="h-4 w-4" />, content: eventsTab },
        { id: 'my', label: t('tabs.my.label', 'My Communities'), icon: <Users className="h-4 w-4" />, content: myTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Professional Communities')}
            description={t('description', 'Join 25+ vibrant professional communities across the UAE — network, share knowledge, attend events, and grow your career alongside 23,000+ members')}
            icon={<Users className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="discover"
        />
    );
};

export default CommunitiesPage2;
