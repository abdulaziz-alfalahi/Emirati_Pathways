
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Users, MessageCircle, Calendar, MapPin, Star,
    Search, Heart, Eye, Clock, Award, Building,
    Briefcase, GraduationCap, ChevronRight, ChevronLeft, CheckCircle,
    Globe, UserCheck, Share2, BookOpen, Loader2
} from 'lucide-react';
import { restClient } from '@/utils/api';

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

/* ──────────────────────── COMPONENT ──────────────────────── */

const CommunitiesPage2: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    // ── Category color mapping ──
    const catColors: Record<string, { bg: string; color: string }> = {
        Technology: { bg: brand.blue, color: brand.blueText },
        Leadership: { bg: brand.purple, color: brand.purpleText },
        Finance: { bg: brand.green, color: brand.greenText },
        Startups: { bg: brand.amber, color: brand.amberText },
        Energy: { bg: brand.primarySurface, color: brand.primary },
        Government: { bg: brand.red, color: brand.redText },
        Healthcare: { bg: brand.blue, color: brand.blueText },
        'Real Estate': { bg: brand.amber, color: brand.amberText },
    };

    // ── Live data state ──
    const [communities, setCommunities] = useState<any[]>([]);
    const [feedPosts, setFeedPosts] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [liveStats, setLiveStats] = useState<any>(null);

    // Fetch all community data from backend
    useEffect(() => {
        let cancelled = false;

        async function fetchCommunities() {
            try {
                const res = await restClient.get('/api/community-mentorship/communities');
                if (cancelled) return;
                const d = res.data as any;
                if (d?.communities) {
                    setCommunities(d.communities.map((c: any, i: number) => ({
                        ...c,
                        name: t(c.name, c.name_ar || c.name),
                        description: t(c.description, c.description_ar || c.description),
                        category: t(c.category, c.category_ar || c.category),
                        joined: i < 3,  // first 3 joined for demo
                        catBg: catColors[c.category]?.bg || brand.blue,
                        catColor: catColors[c.category]?.color || brand.blueText,
                    })));
                }
            } catch (e) {
                console.warn('Communities API not available', e);
            }
        }

        async function fetchFeed() {
            try {
                const res = await restClient.get('/api/community-mentorship/community-feed');
                if (cancelled) return;
                const d = res.data as any;
                if (d?.posts) {
                    setFeedPosts(d.posts.map((p: any) => ({
                        author: t(p.author, p.author_ar || p.author),
                        title: t(p.title, p.title_ar || p.title),
                        company: t(p.company, p.company_ar || p.company),
                        avatar: p.avatar,
                        community: t(p.community, p.community_ar || p.community),
                        content: t(p.content, p.content_ar || p.content),
                        time: p.time,
                        likes: p.likes,
                        comments: p.comments,
                        verified: p.verified,
                    })));
                }
            } catch (e) {
                console.warn('Community feed API not available', e);
            }
        }

        async function fetchEvents() {
            try {
                const res = await restClient.get('/api/community-mentorship/community-events');
                if (cancelled) return;
                const d = res.data as any;
                if (d?.events) {
                    setEvents(d.events.map((ev: any) => ({
                        title: t(ev.title, ev.title_ar || ev.title),
                        date: ev.date,
                        dateParts: ev.dateParts,
                        time: ev.time,
                        location: t(ev.location, ev.location_ar || ev.location),
                        type: ev.type,
                        typeKey: ev.typeKey,
                        attendees: ev.attendees,
                        maxAttendees: ev.maxAttendees,
                        community: t(ev.community, ev.community_ar || ev.community),
                        organizer: t(ev.organizer, ev.organizer_ar || ev.organizer),
                    })));
                }
            } catch (e) {
                console.warn('Community events API not available', e);
            }
        }

        async function fetchStats() {
            try {
                const res = await restClient.get('/api/community-mentorship/mentorship-stats');
                if (cancelled) return;
                const d = res.data as any;
                if (d?.stats) setLiveStats(d.stats);
            } catch (e) {
                console.warn('Mentorship stats API not available', e);
            }
        }

        fetchCommunities();
        fetchFeed();
        fetchEvents();
        fetchStats();
        return () => { cancelled = true; };
    }, [isRTL]);

    /* ──────────────────────── STATS ──────────────────────── */

    const totalMembers = liveStats?.total_community_members || 23000;
    const totalComms = liveStats?.total_communities || communities.length || 25;
    const totalPosts = communities.reduce((s: number, c: any) => s + (c.posts || 0), 0);

    const stats = [
        { value: `${totalComms}+`, label: t('Communities', 'مجتمع'), icon: Users },
        { value: totalMembers >= 1000 ? `${Math.round(totalMembers / 1000)}K+` : `${totalMembers}+`, label: t('Members', 'عضو'), icon: UserCheck },
        { value: totalPosts >= 1000 ? `${Math.round(totalPosts / 1000)}K+` : `${totalPosts}+`, label: t('Posts', 'منشور'), icon: MessageCircle },
        { value: `${events.length * 20}+`, label: t('Events/Year', 'فعالية/سنة'), icon: Calendar },
    ];

    /* ── Tab 1: Discover ── */
    const discoverTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Discover Communities', 'اكتشف المجتمعات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Join vibrant professional communities across the UAE — connect with peers, share knowledge, and grow your career network.',
                    'انضم إلى مجتمعات مهنية نابضة بالحياة في الإمارات — تواصل مع أقرانك وشارك المعرفة ووسّع شبكتك المهنية.'
                )}
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
                            {c.tags.map((tag, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{tag}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {c.members.toLocaleString()} {t('members', 'عضو')}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MessageCircle size={12} /> {c.posts.toLocaleString()} {t('posts', 'منشور')}</span>
                        </div>

                        <button style={{
                            background: c.joined ? 'transparent' : brand.primary,
                            color: c.joined ? brand.primary : '#fff',
                            border: c.joined ? `1px solid ${brand.primary}` : 'none',
                            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            {c.joined ? t('Joined ✓', 'منضم ✓') : t('Join Community', 'انضم للمجتمع')}
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
                {t('Community Feed', 'آخر أخبار المجتمع')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Latest posts, discussions, and updates from your communities.',
                    'أحدث المنشورات والنقاشات والتحديثات من مجتمعاتك.'
                )}
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
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.title} {t('at', 'في')} {p.company}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
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
                                <Share2 size={14} /> {t('Share', 'مشاركة')}
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
                {t('Community Events', 'فعاليات المجتمع')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Upcoming meetups, webinars, summits, and networking events across UAE communities.',
                    'لقاءات وندوات وقمم وفعاليات تواصل قادمة عبر مجتمعات الإمارات.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {events.map((ev, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {/* Date badge */}
                        <div style={{ width: 56, minWidth: 56, textAlign: 'center', background: brand.primarySurface, borderRadius: 10, padding: '8px 4px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: brand.primary, textTransform: 'uppercase' }}>{ev.dateParts.month}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: brand.primaryDark }}>{ev.dateParts.day}</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{ev.title}</h3>
                                <span style={{
                                    background: ev.typeKey === 'Online' ? brand.blue : ev.typeKey === 'In-Person' ? brand.green : brand.amber,
                                    color: ev.typeKey === 'Online' ? brand.blueText : ev.typeKey === 'In-Person' ? brand.greenText : brand.amberText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                                }}>
                                    {ev.type}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: brand.textSecondary, marginBottom: 10 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {ev.time}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {ev.location}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {ev.attendees}/{ev.maxAttendees}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: brand.primary, fontWeight: 500 }}>{t('by', 'بواسطة')} {ev.organizer} · {ev.community}</span>
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    {t('Register', 'سجّل')}
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
                {t('My Communities', 'مجتمعاتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "Communities you've joined — quick access to posts, events, and fellow members.",
                    'المجتمعات التي انضممت إليها — وصول سريع للمنشورات والفعاليات والأعضاء.'
                )}
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
                                    <span>{c.members.toLocaleString()} {t('members', 'عضو')}</span>
                                    <span>{c.posts.toLocaleString()} {t('posts', 'منشور')}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                {t('View', 'عرض')}
                            </button>
                            <button style={{ background: '#fff', color: brand.redText, border: `1px solid ${brand.border}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                                {t('Leave', 'مغادرة')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state hint */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, marginTop: 24, textAlign: 'center' }}>
                <Globe size={28} style={{ color: brand.primary, margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{t('Discover More Communities', 'اكتشف المزيد من المجتمعات')}</h4>
                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>
                    {t(
                        'Explore 25+ professional communities and find your tribe — from tech and finance to government and sustainability.',
                        'استكشف أكثر من 25 مجتمعاً مهنياً وجد مجموعتك — من التكنولوجيا والمالية إلى الحكومة والاستدامة.'
                    )}
                </p>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'discover', label: t('Discover', 'اكتشف'), icon: <Search className="h-4 w-4" />, content: discoverTab },
        { id: 'feed', label: t('Feed', 'آخر الأخبار'), icon: <MessageCircle className="h-4 w-4" />, content: feedTab },
        { id: 'events', label: t('Events', 'الفعاليات'), icon: <Calendar className="h-4 w-4" />, content: eventsTab },
        { id: 'my', label: t('My Communities', 'مجتمعاتي'), icon: <Users className="h-4 w-4" />, content: myTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Professional Communities', 'المجتمعات المهنية')}
            description={t(
                'Join 25+ vibrant professional communities across the UAE — network, share knowledge, attend events, and grow your career alongside 23,000+ members',
                'انضم إلى أكثر من 25 مجتمعاً مهنياً نابضاً بالحياة في الإمارات — تواصل وشارك المعرفة واحضر الفعاليات ونمِّ مسيرتك المهنية مع أكثر من 23,000 عضو'
            )}
            icon={<Users className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="discover"
        />
    );
};

export default CommunitiesPage2;
