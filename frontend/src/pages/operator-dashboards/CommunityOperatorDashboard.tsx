import React, { useState, useEffect } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    MessageSquare, Users, Calendar, Flag, Settings, Heart,
    Clock, TrendingUp, Plus, Eye, ThumbsUp, AlertTriangle, FileText
} from 'lucide-react';

const brand = {
    primary: '#DB2777', secondary: '#EC4899', accent: '#F9A8D4',
    bg: '#FDF2F8', cardBg: '#FFFFFF',
    textPrimary: '#831843', textSecondary: '#6B7280', border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    pinkBg: '#FCE7F3', pinkText: '#DB2777',
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const CommunityOperatorDashboard: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const [stats, setStats] = useState<any>({ active_communities: 0, published_stories: 0, flagged_content: 0, upcoming_events: 0, total_members: 0 });
    const [groups, setGroups] = useState<any[]>([]);
    const [contentQueue, setContentQueue] = useState<any[]>([]);
    const [flaggedContent, setFlaggedContent] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const resp = await fetch(`${API_BASE}/api/education/community/operator/stats`);
                if (resp.ok && !cancelled) {
                    const d = await resp.json();
                    setStats(d.stats || {});
                    setGroups(d.groups || []);
                    setContentQueue(d.content_queue || []);
                    setFlaggedContent(d.flagged_content || []);
                    setEvents(d.events || []);
                }
            } catch (err) { console.error('Community operator fetch error:', err); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, []);

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'content', label: t('Content', 'المحتوى'), icon: FileText },
        { id: 'flagged', label: t('Flagged', 'مبلّغ عنه'), icon: Flag },
        { id: 'events', label: t('Events', 'الفعاليات'), icon: Calendar },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const overviewStats = [
        { label: t('Active Communities', 'المجتمعات النشطة'), value: String(stats.active_communities || 0), icon: Users },
        { label: t('Published Stories', 'القصص المنشورة'), value: String(stats.published_stories || 0), icon: Heart },
        { label: t('Flagged Content', 'محتوى مبلّغ عنه'), value: String(stats.flagged_content || 0), icon: Flag },
        { label: t('Upcoming Events', 'الفعاليات القادمة'), value: String(stats.upcoming_events || 0), icon: Calendar },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {overviewStats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.pinkBg, borderRadius: 10, padding: 10 }}><s.icon size={20} color={brand.pinkText} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Content Awaiting Review', 'محتوى بانتظار المراجعة')}</h3>
                    {contentQueue.length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No pending content', 'لا يوجد محتوى معلق')}</div>}
                    {contentQueue.slice(0, 3).map((c: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < Math.min(contentQueue.length, 3) - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (c.title_ar || c.title) : c.title}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.author_name} • {c.content_type}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: brand.greenBg, color: brand.greenText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓</button>
                                <button style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.textSecondary, fontSize: 12, cursor: 'pointer' }}><Eye size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <AlertTriangle size={16} color={brand.yellowText} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Flagged Items', 'العناصر المبلّغ عنها')}
                    </h3>
                    {flaggedContent.length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No flagged items', 'لا توجد عناصر مبلّغ عنها')}</div>}
                    {flaggedContent.slice(0, 3).map((f: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < Math.min(flaggedContent.length, 3) - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (f.title_ar || f.title) : f.title}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{f.flag_reason || 'Flagged'} • {f.author_name}</div>
                            </div>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: f.flag_severity === 'high' ? brand.redBg : f.flag_severity === 'medium' ? brand.yellowBg : '#F1F5F9', color: f.flag_severity === 'high' ? brand.redText : f.flag_severity === 'medium' ? brand.yellowText : brand.textSecondary }}>
                                {(f.flag_severity || 'low').toUpperCase()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[t('Pending', 'قيد الانتظار'), t('Published', 'منشور'), t('Rejected', 'مرفوض')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
            </div>
            {contentQueue.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No content to review', 'لا يوجد محتوى للمراجعة')}</div>}
            {contentQueue.map((c: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.pinkBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} color={brand.pinkText} /></div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (c.title_ar || c.title) : c.title}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.author_name} • {c.content_type} • {c.created_at?.split(' ')[0]}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, color: brand.textSecondary }}><ThumbsUp size={13} /> {c.likes || 0}</span>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: brand.greenBg, color: brand.greenText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ {t('Approve', 'موافقة')}</button>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: brand.redBg, color: brand.redText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✗ {t('Reject', 'رفض')}</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFlagged = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {flaggedContent.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No flagged content', 'لا يوجد محتوى مبلّغ عنه')}</div>}
            {flaggedContent.map((f: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${f.flag_severity === 'high' ? '#FCA5A5' : f.flag_severity === 'medium' ? '#FCD34D' : brand.border}`, borderLeftWidth: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (f.title_ar || f.title) : f.title}</div>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 4 }}>{t('Reason', 'السبب')}: {f.flag_reason || 'Unspecified'}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>{f.author_name} • {f.created_at?.split(' ')[0]}</div>
                        </div>
                        <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 600, background: f.flag_severity === 'high' ? brand.redBg : f.flag_severity === 'medium' ? brand.yellowBg : '#F1F5F9', color: f.flag_severity === 'high' ? brand.redText : f.flag_severity === 'medium' ? brand.yellowText : brand.textSecondary }}>
                            {(f.flag_severity || 'low').toUpperCase()}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: brand.redBg, color: brand.redText, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('Remove Content', 'إزالة المحتوى')}</button>
                        <button style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{t('Dismiss Flag', 'تجاهل البلاغ')}</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderEvents = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Create Event', 'إنشاء فعالية')}
                </button>
            </div>
            {events.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No events found', 'لم يتم العثور على فعاليات')}</div>}
            {events.map((e: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.pinkBg, borderRadius: 10, padding: 12, textAlign: 'center', minWidth: 50 }}>
                            <Calendar size={18} color={brand.pinkText} />
                            <div style={{ fontSize: 11, fontWeight: 700, color: brand.pinkText, marginTop: 2 }}>{e.event_date?.split('-').slice(1).reverse().join('/')}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (e.name_ar || e.name) : e.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{e.location} • {(e.registrations || 0).toLocaleString()} {t('registrations', 'تسجيل')}</div>
                        </div>
                    </div>
                    <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, background: e.status === 'upcoming' ? brand.greenBg : '#F1F5F9', color: e.status === 'upcoming' ? brand.greenText : brand.textSecondary }}>
                        {e.status === 'upcoming' ? t('Upcoming', 'قادم') : t('Completed', 'مكتمل')}
                    </span>
                </div>
            ))}
        </div>
    );

    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
                { title: t('Auto-Flag Keywords', 'كلمات البلاغ التلقائي'), desc: t('Automatically flag content containing specific keywords', 'الإبلاغ التلقائي عن المحتوى المتضمن كلمات محددة'), value: t('42 keywords', '42 كلمة') },
                { title: t('Content Approval SLA', 'مدة اعتماد المحتوى'), desc: t('Maximum hours to review submitted content', 'الحد الأقصى لساعات مراجعة المحتوى المقدم'), value: t('24 Hours', '24 ساعة') },
                { title: t('Community Size Limit', 'حد حجم المجتمع'), desc: t('Maximum members per community before requiring admin approval', 'الحد الأقصى للأعضاء قبل طلب موافقة المسؤول'), value: '5,000' },
                { title: t('Event Auto-publish', 'النشر التلقائي للفعاليات'), desc: t('Allow verified organizers to publish events without review', 'السماح للمنظمين المعتمدين بنشر الفعاليات بدون مراجعة'), value: t('Enabled', 'مفعّل') },
            ].map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.pinkBg, padding: '6px 14px', borderRadius: 6 }}>{s.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.pinkBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <MessageSquare size={16} color={brand.pinkText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.pinkText }}>{t('Community & Engagement Operator', 'مشغل المجتمع والتفاعل')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Community Operations Dashboard', 'لوحة عمليات المجتمع')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Moderate content, manage events, and foster community engagement', 'إدارة المحتوى والفعاليات وتعزيز التفاعل المجتمعي')}</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: brand.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${brand.border}`, marginBottom: 24 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '10px 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: activeTab === tab.id ? brand.primary : 'transparent',
                            color: activeTab === tab.id ? 'white' : brand.textSecondary, transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>
                {loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('Loading...', 'جاري التحميل...')}</div>}
                {!loading && activeTab === 'overview' && renderOverview()}
                {!loading && activeTab === 'content' && renderContent()}
                {!loading && activeTab === 'flagged' && renderFlagged()}
                {!loading && activeTab === 'events' && renderEvents()}
                {!loading && activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default CommunityOperatorDashboard;
