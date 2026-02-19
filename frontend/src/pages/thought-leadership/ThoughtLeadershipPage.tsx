
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    BookOpen, Users, Award, Star, Crown, Quote,
    Lightbulb, Globe, Heart, TrendingUp, CheckCircle,
    ArrowRight, ExternalLink, Calendar
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
    gold: '#FEF9C3',
    goldText: '#854D0E',
};

/* ──────────────────────── DATA ──────────────────────── */

const leaders = [
    {
        id: 'zayed',
        name: 'Sheikh Zayed bin Sultan Al Nahyan',
        title: 'Founder of the UAE (1918–2004)',
        era: '1971–2004',
        role: 'Founding Father & First President',
        avatar: '🏛️',
        theme: { bg: '#FFF7ED', accent: '#EA580C', light: '#FFEDD5' },
        bio: 'The visionary who transformed seven desert emirates into a unified, modern nation. Sheikh Zayed\'s wisdom in governance, his commitment to education, and his belief in sharing wealth with all citizens created the foundation for the UAE\'s extraordinary rise.',
        books: [
            { title: 'Zayed: From Challenges to Union', author: 'Compiled by National Archives', year: '2005', desc: 'The definitive account of his journey from tribal leader to founding a modern nation-state.' },
            { title: 'The Sayings of Sheikh Zayed', author: 'National Archives', year: '2004', desc: 'A collection of his most impactful quotes on governance, education, environment, and humanity.' },
            { title: 'Zayed and the Environment', author: 'Zayed International Foundation', year: '2006', desc: 'His pioneering environmental vision — including desert greening, falcon conservation, and sustainable development.' },
        ],
        speeches: [
            { title: 'On Unity', quote: '"A nation without a past has neither a present nor a future."' },
            { title: 'On Wealth', quote: '"Wealth is not money. Wealth lies in men. This is where true power lies."' },
            { title: 'On Education', quote: '"The real asset of any advanced nation is its people, especially the educated ones."' },
        ],
    },
    {
        id: 'rashid',
        name: 'Sheikh Rashid bin Saeed Al Maktoum',
        title: 'Builder of Dubai (1912–1990)',
        era: '1958–1990',
        role: 'Ruler of Dubai & UAE Vice President',
        avatar: '🌆',
        theme: { bg: '#EFF6FF', accent: '#2563EB', light: '#DBEAFE' },
        bio: 'The visionary trader who transformed Dubai from a small fishing and pearling village into a global trade hub. Sheikh Rashid built Port Rashid, Dubai Dry Docks, Jebel Ali Port, and the World Trade Centre — laying the infrastructure for Dubai\'s meteoric rise.',
        books: [
            { title: 'Rashid: The Son of Dubai', author: 'Graeme Wilson', year: '1999', desc: 'The authoritative biography tracing his transformation of Dubai from creek-side trading post to international city.' },
            { title: 'Father of Dubai', author: 'National Archives', year: '2003', desc: 'A photographic and narrative account of his infrastructure vision — ports, bridges, and the open-skies policy.' },
            { title: 'Dubai: Life and Times — Through the Lens of Noor Ali Rashid', author: 'Noor Ali Rashid', year: '2010', desc: 'Visual chronicle of Dubai\'s transformation under Sheikh Rashid\'s leadership, by his official photographer.' },
        ],
        speeches: [
            { title: 'On Progress', quote: '"My grandfather rode a camel, my father rode a camel, I drive a Mercedes, my son drives a Land Rover, his son will drive a Land Rover, but his son will ride a camel."' },
            { title: 'On Trade', quote: '"What is good for the merchants is good for Dubai."' },
            { title: 'On Infrastructure', quote: '"Build the infrastructure and the people will come."' },
        ],
    },
    {
        id: 'mbz',
        name: 'Sheikh Mohamed bin Zayed Al Nahyan',
        title: 'President of the UAE',
        era: '2022–Present',
        role: 'President of the UAE & Ruler of Abu Dhabi',
        avatar: '🇦🇪',
        theme: { bg: '#F0FDF4', accent: '#16A34A', light: '#DCFCE7' },
        bio: 'Continuing his father\'s legacy, Sheikh Mohamed bin Zayed has steered the UAE toward energy diversification, advanced technology, food security, and global diplomacy. Under his leadership, the UAE hosted COP28, expanded its space programme, and deepened strategic international partnerships.',
        books: [
            { title: 'Mohamed bin Zayed: A New Day', author: 'National Archives', year: '2019', desc: 'The story of his strategic vision for a post-oil UAE — investment in AI, renewable energy, and education reform.' },
            { title: 'The UAE Strategy Framework', author: 'UAE Government Publications', year: '2023', desc: 'Comprehensive documentation of national strategies under his presidency — from "We the UAE 2031" to energy transition.' },
            { title: 'Leadership and Vision', author: 'Emirates Centre for Strategic Studies', year: '2021', desc: 'Analysis of his leadership philosophy: pragmatism, long-term thinking, and human capital investment.' },
        ],
        speeches: [
            { title: 'On the Future', quote: '"The UAE\'s greatest resource is its people, and our investment in them will outlast any other."' },
            { title: 'On Innovation', quote: '"We must prepare today for the world of tomorrow — innovation is not optional, it is essential."' },
            { title: 'On Climate', quote: '"Climate action is not a burden — it is an opportunity for economic growth and global leadership."' },
        ],
    },
    {
        id: 'mbr',
        name: 'Sheikh Mohammed bin Rashid Al Maktoum',
        title: 'Vice President & Prime Minister of the UAE',
        era: '2006–Present',
        role: 'Vice President, Prime Minister & Ruler of Dubai',
        avatar: '🏙️',
        theme: { bg: '#FAF5FF', accent: '#9333EA', light: '#F3E8FF' },
        bio: 'The driving force behind Dubai\'s global brand, Sheikh Mohammed bin Rashid is a prolific author, poet, and reformer. His visionary governance transformed Dubai into the world\'s most visited city and a global business capital. He authored multiple bestselling books on leadership and governance.',
        books: [
            { title: 'My Vision: Challenges in the Race for Excellence', author: 'Sheikh Mohammed bin Rashid Al Maktoum', year: '2012', desc: 'His personal account of Dubai\'s journey and leadership principles — a bestseller translated into 20+ languages.' },
            { title: 'Flashes of Thought', author: 'Sheikh Mohammed bin Rashid Al Maktoum', year: '2013', desc: 'Collected wisdom on governance, innovation, and building a world-class nation — insights from decades of leadership.' },
            { title: 'Reflections on Happiness & Positivity', author: 'Sheikh Mohammed bin Rashid Al Maktoum', year: '2017', desc: 'His philosophy on creating a happy society — the blueprint behind the UAE\'s Ministry of Happiness and national well-being strategy.' },
            { title: 'The Race: The Story of the Arab Quest for Peace', author: 'Sheikh Mohammed bin Rashid Al Maktoum', year: '2007', desc: 'A masterwork of modern Arabic poetry reflecting on heritage, peace, and the Arab world\'s aspirations.' },
            { title: 'Spirit of the Union', author: 'Sheikh Mohammed bin Rashid Al Maktoum', year: '2011', desc: 'Poems celebrating the UAE\'s 40th National Day — themes of unity, heritage, and national pride.' },
        ],
        speeches: [
            { title: 'On Leadership', quote: '"In a race, there is no room for stopping. You either win or you lose."' },
            { title: 'On Government', quote: '"Government is not a business. It is a service. And service means putting people first."' },
            { title: 'On Excellence', quote: '"The word \'impossible\' is not in the dictionary of leaders."' },
        ],
    },
];

const coreValues = [
    { icon: '🤝', title: 'Unity & Federation', desc: 'Building a nation from seven diverse emirates — strength through solidarity' },
    { icon: '📚', title: 'Education as Foundation', desc: 'Investing in human capital as the true wealth of the nation' },
    { icon: '🌍', title: 'Global Engagement', desc: 'Tolerance, diplomacy, and cultural bridges connecting East and West' },
    { icon: '🌱', title: 'Sustainability', desc: 'Environmental stewardship from desert greening to clean energy leadership' },
    { icon: '🚀', title: 'Innovation & Ambition', desc: 'Nothing is impossible — from Burj Khalifa to the Mars Hope Probe' },
    { icon: '❤️', title: 'Happiness & Well-being', desc: 'Government as a service — putting citizen happiness at the centre of policy' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const ThoughtLeadershipPage2: React.FC = () => {


    const { t } = useTranslation('thought-leadership');
    const stats = [
        { value: t('stats.visionary_leaders_value', '4'), label: t('stats.visionary_leaders', 'Visionary Leaders'), icon: Crown },
        { value: t('stats.publications_value', '20+'), label: t('stats.publications', 'Publications'), icon: BookOpen },
        { value: t('stats.years_of_wisdom_value', '50+'), label: t('stats.years_of_wisdom', 'Years of Wisdom'), icon: Star },
        { value: t('stats.united_vision_value', '1 Nation'), label: t('stats.united_vision', 'United Vision'), icon: Globe },
    ];

    /* ── Tab 1: Leaders' Library ── */
    const libraryTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                The Leaders' Library
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                All biography books, publications, and written works of the UAE's founding fathers and current leaders — in one place. Study the vision that built a nation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {leaders.map((leader) => (
                    <div key={leader.id}>
                        {/* Leader header */}
                        <div style={{ background: leader.theme.bg, borderRadius: 12, padding: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 36 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: '0 0 2px' }}>{leader.name}</h3>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{leader.role} · {leader.era}</div>
                            </div>
                        </div>
                        {/* Books */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {leader.books.map((book, j) => (
                                <div
                                    key={j}
                                    style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, transition: 'box-shadow .2s', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <BookOpen size={16} style={{ color: leader.theme.accent, flexShrink: 0 }} />
                                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{book.title}</h4>
                                    </div>
                                    <div style={{ fontSize: 11, color: leader.theme.accent, fontWeight: 600 }}>{book.author} · {book.year}</div>
                                    <p style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{book.desc}</p>
                                    <button style={{ background: leader.theme.light, color: leader.theme.accent, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 'auto', alignSelf: 'flex-start' }}>
                                        Learn More
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Speeches & Quotes ── */
    const speechesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Speeches & Quotes
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                The most powerful words from the UAE's leaders — on unity, governance, education,
                innovation, and the human spirit. Guiding the nation and serving as role models for generations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {leaders.map((leader) => (
                    <div key={leader.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <span style={{ fontSize: 28 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{leader.name}</h3>
                                <div style={{ fontSize: 11, color: brand.textSecondary }}>{leader.title}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {leader.speeches.map((s, j) => (
                                <div key={j} style={{ background: leader.theme.bg, borderRadius: 10, padding: 18, borderLeft: `4px solid ${leader.theme.accent}` }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: leader.theme.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {s.title}
                                    </div>
                                    <blockquote style={{ fontSize: 14, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
                                        {s.quote}
                                    </blockquote>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Biographies ── */
    const biographiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Leader Biographies
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                The stories behind the visionaries who built the UAE from desert sands into a global powerhouse — from federation to the world stage.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {leaders.map((leader) => (
                    <div key={leader.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, overflow: 'hidden' }}>
                        <div style={{ background: leader.theme.bg, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <span style={{ fontSize: 42, lineHeight: 1 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 4px' }}>{leader.name}</h3>
                                <div style={{ fontSize: 13, color: leader.theme.accent, fontWeight: 600 }}>{leader.role}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>{leader.era}</div>
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
                            <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.7, margin: '0 0 16px' }}>
                                {leader.bio}
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ background: leader.theme.light, color: leader.theme.accent, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                                    📚 {leader.books.length} Publications
                                </span>
                                <span style={{ background: leader.theme.light, color: leader.theme.accent, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                                    🎙️ {leader.speeches.length} Key Speeches
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Values & Legacy ── */
    const valuesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Core Values & National Legacy
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                The enduring principles drawn from the UAE's leaders — values that guide the nation's present and shape its future.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
                {coreValues.map((v, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 32, display: 'block', marginBottom: 10 }}>{v.icon}</span>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{v.title}</h3>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
                    </div>
                ))}
            </div>

            {/* Guiding Vision CTA */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 28, textAlign: 'center' }}>
                <Crown size={28} style={{ color: brand.primary, margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 8px' }}>
                    "A nation without a past has neither a present nor a future"
                </h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.6, margin: '0 0 6px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
                    — Sheikh Zayed bin Sultan Al Nahyan
                </p>
                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, margin: '16px auto 20px', maxWidth: 600 }}>
                    These words remind every Emirati that understanding the vision and values of our leaders is essential to carrying their legacy forward. Study their works. Live their values. Build the future they imagined.
                </p>
                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Explore the Library <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'library', label: t('tabs.library.label', "Leaders' Library"), icon: <BookOpen className="h-4 w-4" />, content: libraryTab },
        { id: 'speeches', label: t('tabs.speeches.label', 'Speeches & Quotes'), icon: <Quote className="h-4 w-4" />, content: speechesTab },
        { id: 'biographies', label: t('tabs.biographies.label', 'Biographies'), icon: <Crown className="h-4 w-4" />, content: biographiesTab },
        { id: 'values', label: t('tabs.values.label', 'Values & Legacy'), icon: <Heart className="h-4 w-4" />, content: valuesTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Thought Leadership')}
            description={t('description', 'The biography books, publications, speeches, and wisdom of the UAE\'s founding fathers and current leaders — all in one place, guiding the nation and serving as role models for every Emirati')}
            icon={<Crown className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="library"
        />
    );
};

export default ThoughtLeadershipPage2;
