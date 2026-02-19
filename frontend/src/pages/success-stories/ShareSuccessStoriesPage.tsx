
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Star, Users, Briefcase, TrendingUp, Award, Building,
    ArrowRight, CheckCircle, Globe, Rocket, Heart,
    Quote, MapPin, ExternalLink, Calendar
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
    blue: '#DBEAFE',
    blueText: '#1E40AF',
    purple: '#F3E8FF',
    purpleText: '#6B21A8',
};

/* ──────────────────────── DATA ──────────────────────── */

const successStories = [
    {
        name: 'H.E. Sarah Al Amiri',
        role: 'Minister of State for Public Education & Advanced Technology',
        prevRole: 'Deputy Project Manager, Emirates Mars Mission (Hope Probe)',
        company: 'Mohammed bin Rashid Space Centre → UAE Government',
        sector: 'Space & Technology',
        location: 'Abu Dhabi',
        avatar: '🚀',
        theme: { bg: '#EFF6FF', accent: '#2563EB', light: '#DBEAFE' },
        story: 'Sarah Al Amiri started as an engineer at the Mohammed bin Rashid Space Centre, rising to lead the science team for the Hope Probe — the UAE\'s Mars mission. At just 34, she became one of the youngest ministers in the world, championing STEM education and advanced technology for the next generation of Emiratis.',
        highlights: ['Led science team for Mars Hope Probe', 'Youngest minister appointed at 34', 'Forbes 100 Most Powerful Women'],
        quote: '"We wanted to send a message that an Arab country can reach Mars, and young Emiratis can lead the way."',
    },
    {
        name: 'Mohamed Alabbar',
        role: 'Founder & Managing Director',
        prevRole: 'Former Director General, Dubai Department of Economic Development',
        company: 'Emaar Properties',
        sector: 'Real Estate & Retail',
        location: 'Dubai',
        avatar: '🏗️',
        theme: { bg: '#FFF7ED', accent: '#EA580C', light: '#FFEDD5' },
        story: 'Mohamed Alabbar built Emaar Properties into one of the world\'s largest real estate developers, creating iconic landmarks including the Burj Khalifa and The Dubai Mall. He went on to launch Noon.com — the Middle East\'s homegrown e-commerce platform to compete with Amazon. His vision transformed Dubai\'s skyline and retail landscape.',
        highlights: ['Built Burj Khalifa — world\'s tallest building', 'Created The Dubai Mall — world\'s most visited', 'Launched Noon.com — regional e-commerce leader'],
        quote: '"Think big. Start small. But most of all, start."',
    },
    {
        name: 'Raja Al Mazrouei',
        role: 'Executive Vice President',
        prevRole: 'FinTech Hive Director',
        company: 'DIFC (Dubai International Financial Centre)',
        sector: 'FinTech & Financial Services',
        location: 'Dubai',
        avatar: '💳',
        theme: { bg: '#F0FDF4', accent: '#16A34A', light: '#DCFCE7' },
        story: 'Raja Al Mazrouei pioneered the FinTech Hive at DIFC — the first and largest financial technology accelerator in the Middle East. Under her leadership, it became a launchpad for 200+ startups and attracted global partnerships. She was named one of Forbes\' Most Powerful Arab Women in Business.',
        highlights: ['Built MENA\'s first FinTech accelerator', 'Supported 200+ startup launches', 'Forbes Most Powerful Arab Women in Business'],
        quote: '"FinTech is not about replacing banks — it\'s about making finance accessible to everyone."',
    },
    {
        name: 'Khalaf Al Habtoor',
        role: 'Founding Chairman',
        prevRole: 'Started as a contractor in the 1970s',
        company: 'Al Habtoor Group',
        sector: 'Hospitality, Automotive & Construction',
        location: 'Dubai',
        avatar: '🏨',
        theme: { bg: '#FAF5FF', accent: '#9333EA', light: '#F3E8FF' },
        story: 'Starting with a small contracting business in the 1970s, Khalaf Al Habtoor built one of the UAE\'s largest conglomerates spanning luxury hotels, automotive dealerships, and real estate. The Al Habtoor Group now operates 12 luxury hotels, is a major Mitsubishi distributor, and employs over 25,000 people. A true rags-to-riches Emirati story.',
        highlights: ['Built conglomerate from a single contracting firm', '12 luxury hotels worldwide', 'Over 25,000 employees across sectors'],
        quote: '"I started with nothing but a dream and a determination to build something lasting for the UAE."',
    },
    {
        name: 'Hussain Sajwani',
        role: 'Founder & Chairman',
        prevRole: 'Started in catering & food services in the 1980s',
        company: 'DAMAC Properties',
        sector: 'Real Estate & Luxury Development',
        location: 'Dubai',
        avatar: '🏢',
        theme: { bg: '#FEF2F2', accent: '#DC2626', light: '#FEE2E2' },
        story: 'Hussain Sajwani started with a small catering business before founding DAMAC Properties in 2002 — now one of the largest private luxury real estate developers in the Middle East with projects in 10+ countries. Forbes estimates his net worth at over $4 billion, making him one of the wealthiest self-made Emiratis. DAMAC has delivered 43,000+ homes and built iconic branded residences with Versace, Fendi, and Trump.',
        highlights: ['Built DAMAC into a $4B+ real estate empire', '43,000+ luxury homes delivered across 10+ countries', 'Partnered with Versace, Fendi, and Trump for branded residences'],
        quote: '"I started from zero. Every dirham I made, I reinvested. That\'s how you build something that lasts."',
    },
    {
        name: 'Abdulla bin Sulayem',
        role: 'Executive Chairman',
        prevRole: 'Former Director General, DMCC',
        company: 'DMCC (Dubai Multi Commodities Centre)',
        sector: 'Commodities & Free Zones',
        location: 'Dubai',
        avatar: '💎',
        theme: { bg: '#FFFBEB', accent: '#D97706', light: '#FEF3C7' },
        story: 'Abdulla bin Sulayem transformed DMCC from a small government initiative into the world\'s #1 Free Zone — six years running. Under his leadership, DMCC attracted 22,000+ companies from 170 nations and became the commercial backbone of Dubai\'s trade economy. He proved that Emiratis can build world-class business infrastructure.',
        highlights: ['Built world\'s #1 Free Zone (6 consecutive years)', '22,000+ registered companies', 'Attracts businesses from 170 nations'],
        quote: '"Free zones are not just about tax benefits — they\'re about creating ecosystems where businesses flourish."',
    },
    {
        name: 'Noura Al Kaabi',
        role: 'Former Minister of Culture & Youth',
        prevRole: 'CEO, twofour54 (Abu Dhabi Media Zone)',
        company: 'twofour54 → UAE Government',
        sector: 'Media & Creative Industries',
        location: 'Abu Dhabi',
        avatar: '🎬',
        theme: { bg: '#FDF4FF', accent: '#A855F7', light: '#F3E8FF' },
        story: 'Noura Al Kaabi built twofour54 into the Middle East\'s leading media free zone — attracting CNN, Sky News Arabia, and major film productions to Abu Dhabi. She later served as Minister of Culture and Youth, shaping the UAE\'s creative economy and positioning the country as a global content hub.',
        highlights: ['Built MENA\'s leading media free zone', 'Attracted CNN, Sky News to Abu Dhabi', 'Shaped UAE creative economy as Minister'],
        quote: '"Culture is not a luxury — it is the soul of a nation\'s identity and its bridge to the world."',
    },
    {
        name: 'Ahmed Bin Byat',
        role: 'Former Vice Chairman',
        prevRole: 'CEO, Dubai Holding',
        company: 'Dubai Holding',
        sector: 'Investment & Technology',
        location: 'Dubai',
        avatar: '🌐',
        theme: { bg: '#ECFDF5', accent: '#059669', light: '#D1FAE5' },
        story: 'Ahmed Bin Byat led Dubai Holding — the diversified conglomerate with over $30 billion in assets — through its expansion into technology, real estate, and hospitality. He was instrumental in launching du (Emirates Integrated Telecommunications), bringing telecom competition to the UAE and driving innovation in connectivity.',
        highlights: ['Led $30B+ Dubai Holding portfolio', 'Launched du telecommunications', 'Pioneered UAE telecom competition'],
        quote: '"Competition drives innovation. When we launched du, we weren\'t just building a network — we were changing an industry."',
    },
];

const sectorBreakdown = [
    { sector: 'Technology & Space', count: 2, icon: '🚀', color: brand.blue, colorText: brand.blueText },
    { sector: 'Real Estate & Construction', count: 2, icon: '🏗️', color: brand.amber, colorText: brand.amberText },
    { sector: 'Finance & FinTech', count: 2, icon: '💳', color: brand.green, colorText: brand.greenText },
    { sector: 'Media & Creative', count: 1, icon: '🎬', color: brand.purple, colorText: brand.purpleText },
    { sector: 'Trade & Free Zones', count: 1, icon: '💎', color: '#FEF3C7', colorText: '#92400E' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const ShareSuccessStoriesPage: React.FC = () => {


    const { t } = useTranslation('share-success-stories');
    const stats = [
        { value: t('stats.success_stories_value', '8'), label: t('stats.success_stories', 'Success Stories'), icon: Star },
        { value: t('stats.industry_sectors_value', '6'), label: t('stats.industry_sectors', 'Industry Sectors'), icon: Briefcase },
        { value: t('stats.value_created_value', '$100B+'), label: t('stats.value_created', 'Value Created'), icon: TrendingUp },
        { value: t('stats.jobs_generated_value', '50K+'), label: t('stats.jobs_generated', 'Jobs Generated'), icon: Users },
    ];

    /* ── Tab 1: Featured Stories ── */
    const storiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Emirati Success in the Private Sector
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Real stories of Emiratis who built world-class businesses, led breakthrough innovations, and transformed industries — proving that UAE nationals compete at the highest global level.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {successStories.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            overflow: 'hidden', transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        {/* Header */}
                        <div style={{ background: s.theme.bg, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 36 }}>{s.avatar}</span>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: '0 0 2px' }}>{s.name}</h3>
                                <div style={{ fontSize: 13, color: s.theme.accent, fontWeight: 600 }}>{s.role}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Building size={11} /> {s.company}</span>
                                    <span style={{ margin: '0 8px' }}>·</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {s.location}</span>
                                </div>
                            </div>
                            <span style={{ background: s.theme.light, color: s.theme.accent, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99 }}>
                                {s.sector}
                            </span>
                        </div>
                        {/* Body */}
                        <div style={{ padding: 20 }}>
                            <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.7, margin: '0 0 14px' }}>{s.story}</p>
                            {/* Highlights */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                {s.highlights.map((h, j) => (
                                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle size={14} style={{ color: s.theme.accent, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: brand.textPrimary, fontWeight: 500 }}>{h}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Quote */}
                            <blockquote style={{
                                borderLeft: `3px solid ${s.theme.accent}`, paddingLeft: 14, margin: 0,
                                fontSize: 13, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.6,
                            }}>
                                {s.quote}
                            </blockquote>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: By Sector ── */
    const sectorTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Emiratis by Sector
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Emirati professionals and entrepreneurs are making their mark across every major industry — from space exploration and fintech to hospitality and creative media.
            </p>

            {/* Sector cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {sectorBreakdown.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{s.icon}</span>
                        <div style={{ fontSize: 22, fontWeight: 700, color: s.colorText }}>{s.count}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginTop: 2 }}>{s.sector}</div>
                    </div>
                ))}
            </div>

            {/* Stories grouped by theme */}
            {[
                { title: 'Builders & Developers', desc: 'Emiratis who built physical and digital infrastructure', stories: [successStories[1], successStories[3], successStories[5]] },
                { title: 'Innovators & Disruptors', desc: 'Emiratis who pioneered new industries and technologies', stories: [successStories[0], successStories[2], successStories[7]] },
                { title: 'Culture & Capital', desc: 'Emiratis who shaped the nation\'s creative and investment landscape', stories: [successStories[6], successStories[4]] },
            ].map((group, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{group.title}</h3>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: '0 0 12px' }}>{group.desc}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {group.stories.map((s, j) => (
                            <div key={j} style={{ background: s.theme.bg, borderRadius: 10, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 28, flexShrink: 0 }}>{s.avatar}</span>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.name}</h4>
                                    <div style={{ fontSize: 11, color: s.theme.accent, fontWeight: 600 }}>{s.company}</div>
                                    <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4, lineHeight: 1.4 }}>
                                        {s.highlights[0]}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    /* ── Tab 3: Quotes & Wisdom ── */
    const quotesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                In Their Own Words
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Wisdom and insights from Emirati leaders in the private sector — advice on entrepreneurship, leadership, and building world-class businesses from the UAE.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {successStories.map((s, i) => (
                    <div key={i} style={{
                        background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                        padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                        <blockquote style={{
                            fontSize: 15, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.7, margin: 0,
                            borderLeft: `4px solid ${s.theme.accent}`, paddingLeft: 16, flex: 1,
                        }}>
                            {s.quote}
                        </blockquote>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 24 }}>{s.avatar}</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: s.theme.accent }}>{s.company}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 28, marginTop: 24, textAlign: 'center' }}>
                <Quote size={28} style={{ color: brand.primary, margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 8px' }}>
                    Share Your Own Success Story
                </h3>
                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, margin: '0 auto 16px', maxWidth: 500 }}>
                    Are you an Emirati making an impact in the private sector? Your story could inspire the next generation.
                </p>
                <button style={{
                    background: brand.primary, color: '#fff', border: 'none', padding: '12px 28px',
                    borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                    Submit Your Story <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );

    /* ── Tab 4: Impact ── */
    const impactTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Emiratisation Impact
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                The cumulative impact of Emirati leadership in the private sector — jobs created, value generated, and sectors transformed.
            </p>

            {/* Impact metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { value: '$100B+', label: 'Combined Business Value', icon: '💰', color: brand.amber, colorText: brand.amberText },
                    { value: '50,000+', label: 'Jobs Created', icon: '👥', color: brand.green, colorText: brand.greenText },
                    { value: '8', label: 'Industries Transformed', icon: '🏢', color: brand.blue, colorText: brand.blueText },
                    { value: '170+', label: 'Countries Reached', icon: '🌍', color: brand.purple, colorText: brand.purpleText },
                ].map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>{m.icon}</span>
                        <div style={{ fontSize: 24, fontWeight: 700, color: m.colorText }}>{m.value}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Key takeaways */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={18} style={{ color: brand.primary }} /> Key Takeaways for Emirati Professionals
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {[
                        { title: 'Start Where You Are', desc: 'Khalaf Al Habtoor started as a contractor — Mohamed Alabbar started in government. Every world-class career begins with a first step.' },
                        { title: 'Think Globally, Act Locally', desc: 'From DMCC\'s 170-nation reach to Emaar\'s global brand, Emirati companies prove that UAE-born businesses can compete worldwide.' },
                        { title: 'Innovation is the Differentiator', desc: 'Raja Al Mazrouei pioneered FinTech in MENA, Sarah Al Amiri reached Mars. Innovation opens doors that experience alone cannot.' },
                        { title: 'The Private Sector Needs You', desc: 'With Emiratisation targets rising across all sectors, private companies are actively seeking Emirati talent with ambition and drive.' },
                    ].map((t, i) => (
                        <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{t.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{t.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Emiratisation progress */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={18} style={{ color: brand.primary }} /> Private Sector Emiratisation Progress
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {[
                        { label: 'Banking & Finance', target: '45%', current: '38%', status: 'On Track' },
                        { label: 'Insurance', target: '40%', current: '35%', status: 'Progressing' },
                        { label: 'Technology', target: '10%', current: '7%', status: 'Growing Fast' },
                        { label: 'Retail & Hospitality', target: '5%', current: '3%', status: 'Early Stage' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                                Target: <strong>{s.target}</strong> · Current: <strong>{s.current}</strong>
                            </div>
                            <div style={{ background: '#E5E7EB', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                                <div style={{ background: brand.primary, height: '100%', borderRadius: 99, width: `${(parseFloat(s.current) / parseFloat(s.target)) * 100}%` }} />
                            </div>
                            <div style={{ fontSize: 10, color: brand.primary, fontWeight: 600, marginTop: 4 }}>{s.status}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'stories', label: t('tabs.stories.label', 'Success Stories'), icon: <Star className="h-4 w-4" />, content: storiesTab },
        { id: 'sectors', label: t('tabs.sectors.label', 'By Sector'), icon: <Briefcase className="h-4 w-4" />, content: sectorTab },
        { id: 'quotes', label: t('tabs.quotes.label', 'In Their Words'), icon: <Quote className="h-4 w-4" />, content: quotesTab },
        { id: 'impact', label: t('tabs.impact.label', 'Emiratisation Impact'), icon: <TrendingUp className="h-4 w-4" />, content: impactTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Emirati Success Stories')}
            description={t('description', 'Real stories of Emiratis who built world-class businesses, led global innovations, and transformed industries from the private sector — inspiring the next generation of UAE talent')}
            icon={<Star className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="stories"
        />
    );
};

export default ShareSuccessStoriesPage;
