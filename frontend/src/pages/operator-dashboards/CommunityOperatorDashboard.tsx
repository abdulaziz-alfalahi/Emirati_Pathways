import React, { useState, useEffect, useCallback } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import toast from 'react-hot-toast';
import {
    MessageSquare, Users, Calendar, Flag, Settings, TrendingUp, Plus,
    ThumbsUp, AlertTriangle, FileText, ShieldCheck, Megaphone, X, UserPlus
} from 'lucide-react';
import Messages from '@/components/recruiter/Messages';

// Platform teal system (replaces the off-brand pink palette)
const brand = {
    primary: '#006E6F', secondary: '#0F766E',
    bg: '#F7FAFA', cardBg: '#FFFFFF',
    textPrimary: '#0A2540', textSecondary: '#5A6B7B', border: '#E2E8F0',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    accentBg: '#ECFDF5', accentText: '#0F766E',
};

interface Community {
    id: number; name: string; name_ar?: string; description?: string;
    category?: string; verified?: boolean; is_active?: boolean;
    posts_count?: number; member_count?: number; moderator_count?: number; created_at?: string;
}
interface Member { user_id: string; name: string; role: string; created_at?: string; }

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${brand.border}`,
    fontSize: 13, color: brand.textPrimary, background: 'white', boxSizing: 'border-box',
};

const CommunityOperatorDashboard: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const [stats, setStats] = useState<any>({ active_communities: 0, published_stories: 0, flagged_content: 0, upcoming_events: 0, total_members: 0 });
    const [communities, setCommunities] = useState<Community[]>([]);
    const [contentQueue, setContentQueue] = useState<any[]>([]);
    const [flaggedContent, setFlaggedContent] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    // Communities tab UI state
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', name_ar: '', description: '', description_ar: '', category: '', category_ar: '' });
    const [membersOpenId, setMembersOpenId] = useState<number | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [assignEid, setAssignEid] = useState('');
    const [announceOpenId, setAnnounceOpenId] = useState<number | null>(null);
    const [announceForm, setAnnounceForm] = useState({ title: '', message: '' });

    // Events tab UI state
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [eventForm, setEventForm] = useState({ name: '', name_ar: '', event_date: '', location: '' });

    const errMsg = (err: any, fallback: string) => err?.response?.data?.message || fallback;

    const fetchAll = useCallback(async () => {
        try {
            // restClient carries auth — endpoint is @require_roles(*OPERATOR_ROLES).
            const resp = await restClient.get(`/api/education/community/operator/stats`);
            const d = resp.data;
            if (d) {
                setStats(d.stats || {});
                setCommunities(d.communities || []);
                setContentQueue(d.content_queue || []);
                setFlaggedContent(d.flagged_content || []);
                setEvents(d.events || []);
            }
        } catch (err) {
            console.error('Community operator fetch error:', err);
            toast.error(t('Failed to load dashboard data', 'فشل تحميل بيانات اللوحة'));
        }
    }, [isRTL]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            await fetchAll();
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [fetchAll]);

    // ── Actions ──────────────────────────────────────────────

    const moderateContent = async (postId: number, action: 'approve' | 'reject' | 'unflag' | 'remove') => {
        if (busy) return;
        setBusy(true);
        try {
            await restClient.put(`/api/education/community/operator/content/${postId}`, { action });
            toast.success({
                approve: t('Content approved', 'تمت الموافقة على المحتوى'),
                reject: t('Content rejected', 'تم رفض المحتوى'),
                unflag: t('Flag dismissed', 'تم تجاهل البلاغ'),
                remove: t('Content removed', 'تمت إزالة المحتوى'),
            }[action]);
            await fetchAll();
        } catch (err) { toast.error(errMsg(err, t('Action failed', 'فشل الإجراء'))); }
        finally { setBusy(false); }
    };

    const createCommunity = async () => {
        if (!createForm.name.trim()) { toast.error(t('Name is required', 'الاسم مطلوب')); return; }
        if (busy) return;
        setBusy(true);
        try {
            await restClient.post(`/api/education/community/operator/communities`, createForm);
            toast.success(t('Community created', 'تم إنشاء المجتمع'));
            setShowCreate(false);
            setCreateForm({ name: '', name_ar: '', description: '', description_ar: '', category: '', category_ar: '' });
            await fetchAll();
        } catch (err) { toast.error(errMsg(err, t('Failed to create community', 'فشل إنشاء المجتمع'))); }
        finally { setBusy(false); }
    };

    const updateCommunity = async (id: number, patch: { verified?: boolean; is_active?: boolean }) => {
        if (busy) return;
        setBusy(true);
        try {
            await restClient.put(`/api/education/community/operator/communities/${id}`, patch);
            toast.success(t('Community updated', 'تم تحديث المجتمع'));
            await fetchAll();
        } catch (err) { toast.error(errMsg(err, t('Update failed', 'فشل التحديث'))); }
        finally { setBusy(false); }
    };

    const loadMembers = async (communityId: number) => {
        setMembersLoading(true);
        try {
            const resp = await restClient.get(`/api/education/community/operator/communities/${communityId}/members`);
            setMembers(resp.data?.data?.members || []);
        } catch (err) {
            toast.error(errMsg(err, t('Failed to load members', 'فشل تحميل الأعضاء')));
            setMembers([]);
        } finally { setMembersLoading(false); }
    };

    const openMembers = (communityId: number) => {
        if (membersOpenId === communityId) { setMembersOpenId(null); return; }
        setAnnounceOpenId(null);
        setMembersOpenId(communityId);
        setAssignEid('');
        setMembers([]);
        loadMembers(communityId);
    };

    const assignModerator = async (communityId: number, userId: string) => {
        const uid = userId.trim();
        if (!uid) { toast.error(t('Emirates ID is required', 'رقم الهوية الإماراتية مطلوب')); return; }
        if (busy) return;
        setBusy(true);
        try {
            await restClient.post(`/api/education/community/operator/communities/${communityId}/moderators`, { user_id: uid });
            toast.success(t('Moderator assigned', 'تم تعيين المشرف'));
            setAssignEid('');
            await loadMembers(communityId);
            await fetchAll();
        } catch (err) { toast.error(errMsg(err, t('Failed to assign moderator', 'فشل تعيين المشرف'))); }
        finally { setBusy(false); }
    };

    const removeModerator = async (communityId: number, userId: string) => {
        if (busy) return;
        setBusy(true);
        try {
            await restClient.delete(`/api/education/community/operator/communities/${communityId}/moderators/${userId}`);
            toast.success(t('Moderator removed', 'تمت إزالة المشرف'));
            await loadMembers(communityId);
            await fetchAll();
        } catch (err) { toast.error(errMsg(err, t('Failed to remove moderator', 'فشل إزالة المشرف'))); }
        finally { setBusy(false); }
    };

    const sendAnnouncement = async (communityId: number) => {
        if (!announceForm.title.trim() || !announceForm.message.trim()) {
            toast.error(t('Title and message are required', 'العنوان والرسالة مطلوبان')); return;
        }
        if (busy) return;
        setBusy(true);
        try {
            const resp = await restClient.post(`/api/education/community/operator/communities/${communityId}/announce`, announceForm);
            const recipients = resp.data?.data?.recipients ?? 0;
            toast.success(t(`Announcement sent to ${recipients} members`, `تم إرسال الإعلان إلى ${recipients} من الأعضاء`));
            setAnnounceOpenId(null);
            setAnnounceForm({ title: '', message: '' });
        } catch (err) { toast.error(errMsg(err, t('Failed to send announcement', 'فشل إرسال الإعلان'))); }
        finally { setBusy(false); }
    };

    const createEvent = async () => {
        if (!eventForm.name.trim() || !eventForm.event_date) {
            toast.error(t('Name and date are required', 'الاسم والتاريخ مطلوبان')); return;
        }
        if (busy) return;
        setBusy(true);
        try {
            await restClient.post(`/api/education/community/operator/events`, eventForm);
            toast.success(t('Event created', 'تم إنشاء الفعالية'));
            setShowCreateEvent(false);
            setEventForm({ name: '', name_ar: '', event_date: '', location: '' });
            await fetchAll();
        } catch (err) { toast.error(errMsg(err, t('Failed to create event', 'فشل إنشاء الفعالية'))); }
        finally { setBusy(false); }
    };

    const updateEventStatus = async (eventId: number, status: 'cancelled' | 'completed') => {
        if (busy) return;
        setBusy(true);
        try {
            await restClient.put(`/api/education/community/operator/events/${eventId}`, { status });
            toast.success(status === 'cancelled' ? t('Event cancelled', 'تم إلغاء الفعالية') : t('Event marked completed', 'تم وضع الفعالية كمكتملة'));
            await fetchAll();
        } catch (err) { toast.error(errMsg(err, t('Failed to update event', 'فشل تحديث الفعالية'))); }
        finally { setBusy(false); }
    };

    // ── Layout data ──────────────────────────────────────────

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'communities', label: t('Communities', 'المجتمعات'), icon: Users },
        { id: 'content', label: t('Content', 'المحتوى'), icon: FileText },
        { id: 'flagged', label: t('Flagged', 'مبلّغ عنه'), icon: Flag },
        { id: 'events', label: t('Events', 'الفعاليات'), icon: Calendar },
        { id: 'messages', label: t('Messages', 'الرسائل'), icon: MessageSquare },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const overviewStats = [
        { label: t('Active Communities', 'المجتمعات النشطة'), value: String(stats.active_communities || 0), icon: Users },
        { label: t('Total Members', 'إجمالي الأعضاء'), value: String(stats.total_members || 0), icon: UserPlus },
        { label: t('Flagged Content', 'محتوى مبلّغ عنه'), value: String(stats.flagged_content || 0), icon: Flag },
        { label: t('Upcoming Events', 'الفعاليات القادمة'), value: String(stats.upcoming_events || 0), icon: Calendar },
    ];

    const postTitle = (c: any) => {
        const text = (c.content || '').trim();
        return text.length > 110 ? `${text.slice(0, 110)}…` : (text || t('(no text)', '(بدون نص)'));
    };

    const badge = (text: string, bg: string, color: string) => (
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>
    );

    const smallBtn = (label: React.ReactNode, onClick: () => void, kind: 'primary' | 'ghost' | 'danger' | 'success' = 'ghost'): React.ReactNode => {
        const styles: Record<string, React.CSSProperties> = {
            primary: { background: brand.primary, color: 'white', border: 'none' },
            success: { background: brand.greenBg, color: brand.greenText, border: 'none' },
            danger: { background: brand.redBg, color: brand.redText, border: 'none' },
            ghost: { background: 'white', color: brand.textPrimary, border: `1px solid ${brand.border}` },
        };
        return (
            <button onClick={onClick} disabled={busy} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1, ...styles[kind] }}>
                {label}
            </button>
        );
    };

    // ── Tabs ─────────────────────────────────────────────────

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {overviewStats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.accentBg, borderRadius: 10, padding: 10 }}><s.icon size={20} color={brand.accentText} /></div>
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
                        <div key={c.id ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < Math.min(contentQueue.length, 3) - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{postTitle(c)}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.author_name} • {c.community_name}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                {smallBtn('✓', () => moderateContent(c.id, 'approve'), 'success')}
                                {smallBtn('✗', () => moderateContent(c.id, 'reject'), 'danger')}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <AlertTriangle size={16} color={brand.yellowText} />
                        {t('Flagged Items', 'العناصر المبلّغ عنها')}
                    </h3>
                    {flaggedContent.length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No flagged items', 'لا توجد عناصر مبلّغ عنها')}</div>}
                    {flaggedContent.slice(0, 3).map((f: any, i: number) => (
                        <div key={f.id ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < Math.min(flaggedContent.length, 3) - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{postTitle(f)}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{f.author_name} • {f.community_name}</div>
                            </div>
                            {badge(t('FLAGGED', 'مبلّغ'), brand.redBg, brand.redText)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCreateCommunityForm = () => (
        <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.primary}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>{t('Create Community', 'إنشاء مجتمع')}</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: brand.textSecondary }}><X size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Name (English) *', 'الاسم (إنجليزي) *')}</label>
                    <input style={inputStyle} value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Name (Arabic)', 'الاسم (عربي)')}</label>
                    <input dir="rtl" style={inputStyle} value={createForm.name_ar} onChange={e => setCreateForm({ ...createForm, name_ar: e.target.value })} />
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Description (English)', 'الوصف (إنجليزي)')}</label>
                    <input style={inputStyle} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Description (Arabic)', 'الوصف (عربي)')}</label>
                    <input dir="rtl" style={inputStyle} value={createForm.description_ar} onChange={e => setCreateForm({ ...createForm, description_ar: e.target.value })} />
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Category (English)', 'الفئة (إنجليزي)')}</label>
                    <input style={inputStyle} value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })} />
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Category (Arabic)', 'الفئة (عربي)')}</label>
                    <input dir="rtl" style={inputStyle} value={createForm.category_ar} onChange={e => setCreateForm({ ...createForm, category_ar: e.target.value })} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {smallBtn(t('Create', 'إنشاء'), createCommunity, 'primary')}
                {smallBtn(t('Cancel', 'إلغاء'), () => setShowCreate(false), 'ghost')}
            </div>
        </div>
    );

    const renderMembersPanel = (c: Community) => (
        <div style={{ marginTop: 12, borderTop: `1px solid ${brand.border}`, paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Members', 'الأعضاء')}</h4>
            {membersLoading && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('Loading members...', 'جاري تحميل الأعضاء...')}</div>}
            {!membersLoading && members.length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No members yet', 'لا يوجد أعضاء بعد')}</div>}
            {!membersLoading && members.map((m) => (
                <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${brand.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{m.name}</span>
                        {m.role === 'moderator'
                            ? badge(t('Moderator', 'مشرف'), brand.accentBg, brand.accentText)
                            : badge(t('Member', 'عضو'), '#F1F5F9', brand.textSecondary)}
                        {m.created_at && <span style={{ fontSize: 11, color: brand.textSecondary }}>{m.created_at.split(' ')[0]}</span>}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                        {m.role === 'moderator'
                            ? smallBtn(t('Remove moderator', 'إزالة المشرف'), () => removeModerator(c.id, m.user_id), 'danger')
                            : smallBtn(t('Make moderator', 'تعيين كمشرف'), () => assignModerator(c.id, m.user_id), 'ghost')}
                    </div>
                </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                <input
                    style={{ ...inputStyle, maxWidth: 260 }}
                    placeholder={t('Assign moderator by Emirates ID', 'تعيين مشرف برقم الهوية الإماراتية')}
                    value={assignEid}
                    onChange={e => setAssignEid(e.target.value)}
                />
                {smallBtn(t('Assign', 'تعيين'), () => assignModerator(c.id, assignEid), 'primary')}
            </div>
        </div>
    );

    const renderAnnouncePanel = (c: Community) => (
        <div style={{ marginTop: 12, borderTop: `1px solid ${brand.border}`, paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Send Announcement', 'إرسال إعلان')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
                <input style={inputStyle} placeholder={t('Title', 'العنوان')} value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} />
                <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} placeholder={t('Message', 'الرسالة')} value={announceForm.message} onChange={e => setAnnounceForm({ ...announceForm, message: e.target.value })} />
                <div style={{ display: 'flex', gap: 8 }}>
                    {smallBtn(t('Send', 'إرسال'), () => sendAnnouncement(c.id), 'primary')}
                    {smallBtn(t('Cancel', 'إلغاء'), () => { setAnnounceOpenId(null); setAnnounceForm({ title: '', message: '' }); }, 'ghost')}
                </div>
            </div>
        </div>
    );

    const renderCommunities = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreate(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Create Community', 'إنشاء مجتمع')}
                </button>
            </div>
            {showCreate && renderCreateCommunityForm()}
            {communities.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary, background: brand.cardBg, borderRadius: 12, border: `1px solid ${brand.border}` }}>
                    {t('No communities yet. Create the first one.', 'لا توجد مجتمعات بعد. أنشئ أول مجتمع.')}
                </div>
            )}
            {communities.map((c) => (
                <div key={c.id} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0 }}>
                            <div style={{ background: brand.accentBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Users size={20} color={brand.accentText} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (c.name_ar || c.name) : c.name}</span>
                                    {c.verified && badge(t('Verified', 'موثّق'), brand.accentBg, brand.accentText)}
                                    {c.is_active
                                        ? badge(t('Active', 'نشط'), brand.greenBg, brand.greenText)
                                        : badge(t('Inactive', 'غير نشط'), brand.redBg, brand.redText)}
                                </div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>
                                    {c.category ? `${c.category} • ` : ''}
                                    {c.member_count || 0} {t('members', 'عضو')} • {c.moderator_count || 0} {t('moderators', 'مشرف')} • {c.posts_count || 0} {t('posts', 'منشور')}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                            {smallBtn(
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={13} /> {c.verified ? t('Unverify', 'إلغاء التوثيق') : t('Verify', 'توثيق')}</span>,
                                () => updateCommunity(c.id, { verified: !c.verified }), 'ghost')}
                            {smallBtn(c.is_active ? t('Deactivate', 'تعطيل') : t('Activate', 'تفعيل'),
                                () => updateCommunity(c.id, { is_active: !c.is_active }), c.is_active ? 'danger' : 'success')}
                            {smallBtn(
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={13} /> {t('Members', 'الأعضاء')}</span>,
                                () => openMembers(c.id), membersOpenId === c.id ? 'primary' : 'ghost')}
                            {smallBtn(
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Megaphone size={13} /> {t('Announce', 'إعلان')}</span>,
                                () => { setMembersOpenId(null); setAnnounceOpenId(announceOpenId === c.id ? null : c.id); }, announceOpenId === c.id ? 'primary' : 'ghost')}
                        </div>
                    </div>
                    {membersOpenId === c.id && renderMembersPanel(c)}
                    {announceOpenId === c.id && renderAnnouncePanel(c)}
                </div>
            ))}
        </div>
    );

    const renderContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>
                {t('Pending review', 'قيد المراجعة')} ({contentQueue.length})
            </div>
            {contentQueue.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No content to review', 'لا يوجد محتوى للمراجعة')}</div>}
            {contentQueue.map((c: any, i: number) => (
                <div key={c.id ?? i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                        <div style={{ background: brand.accentBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={20} color={brand.accentText} /></div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{postTitle(c)}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.author_name} • {c.community_name}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, color: brand.textSecondary }}><ThumbsUp size={13} /> {c.likes || 0}</span>
                        {smallBtn(`✓ ${t('Approve', 'موافقة')}`, () => moderateContent(c.id, 'approve'), 'success')}
                        {smallBtn(`✗ ${t('Reject', 'رفض')}`, () => moderateContent(c.id, 'reject'), 'danger')}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFlagged = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {flaggedContent.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No flagged content', 'لا يوجد محتوى مبلّغ عنه')}</div>}
            {flaggedContent.map((f: any, i: number) => (
                <div key={f.id ?? i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: '1px solid #FCA5A5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{postTitle(f)}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>{f.author_name} • {f.community_name} • {f.status}</div>
                        </div>
                        {badge(t('FLAGGED', 'مبلّغ'), brand.redBg, brand.redText)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {smallBtn(t('Unflag', 'تجاهل البلاغ'), () => moderateContent(f.id, 'unflag'), 'ghost')}
                        {smallBtn(t('Remove', 'إزالة'), () => moderateContent(f.id, 'remove'), 'danger')}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderEvents = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreateEvent(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Create Event', 'إنشاء فعالية')}
                </button>
            </div>
            {showCreateEvent && (
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.primary}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>{t('Create Event', 'إنشاء فعالية')}</h3>
                        <button onClick={() => setShowCreateEvent(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: brand.textSecondary }}><X size={16} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Name (English) *', 'الاسم (إنجليزي) *')}</label>
                            <input style={inputStyle} value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Name (Arabic)', 'الاسم (عربي)')}</label>
                            <input dir="rtl" style={inputStyle} value={eventForm.name_ar} onChange={e => setEventForm({ ...eventForm, name_ar: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Date *', 'التاريخ *')}</label>
                            <input type="date" style={inputStyle} value={eventForm.event_date} onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Location', 'الموقع')}</label>
                            <input style={inputStyle} value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        {smallBtn(t('Create', 'إنشاء'), createEvent, 'primary')}
                        {smallBtn(t('Cancel', 'إلغاء'), () => setShowCreateEvent(false), 'ghost')}
                    </div>
                </div>
            )}
            {events.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No events found', 'لم يتم العثور على فعاليات')}</div>}
            {events.map((e: any, i: number) => (
                <div key={e.id ?? i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                        <div style={{ background: brand.accentBg, borderRadius: 10, padding: 12, textAlign: 'center', minWidth: 50, flexShrink: 0 }}>
                            <Calendar size={18} color={brand.accentText} />
                            <div style={{ fontSize: 11, fontWeight: 700, color: brand.accentText, marginTop: 2 }}>{e.event_date?.split('-').slice(1).reverse().join('/')}</div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (e.name_ar || e.name) : e.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{e.location} • {(e.registrations || 0).toLocaleString()} {t('registrations', 'تسجيل')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {e.status === 'upcoming' && badge(t('Upcoming', 'قادم'), brand.greenBg, brand.greenText)}
                        {e.status === 'completed' && badge(t('Completed', 'مكتمل'), '#F1F5F9', brand.textSecondary)}
                        {e.status === 'cancelled' && badge(t('Cancelled', 'ملغى'), brand.redBg, brand.redText)}
                        {e.status === 'upcoming' && smallBtn(t('Mark completed', 'وضع كمكتمل'), () => updateEventStatus(e.id, 'completed'), 'success')}
                        {e.status === 'upcoming' && smallBtn(t('Cancel', 'إلغاء'), () => updateEventStatus(e.id, 'cancelled'), 'danger')}
                    </div>
                </div>
            ))}
        </div>
    );

    // No fabricated values: there is no settings store behind this tab yet, so
    // it says so instead of asserting auto-flag keywords, SLAs and size limits
    // that do not exist (same honesty pattern as MentorshipOperatorDashboard).
    const renderSettings = () => (
        <div style={{ background: brand.cardBg, borderRadius: 12, padding: 40, border: `1px solid ${brand.border}`, textAlign: 'center', color: brand.textSecondary }}>
            {t('Community settings are not yet configurable — no settings store exists. Values shown here previously were illustrative, not live configuration.',
               'إعدادات المجتمع غير قابلة للتهيئة بعد — لا يوجد مخزن إعدادات. القيم التي كانت تظهر هنا سابقاً كانت توضيحية وليست إعدادات فعلية.')}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.accentBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <MessageSquare size={16} color={brand.accentText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.accentText }}>{t('Community & Engagement Operator', 'مشغل المجتمع والتفاعل')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Community Operations Dashboard', 'لوحة عمليات المجتمع')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Moderate content, manage communities and events, and foster engagement', 'إدارة المحتوى والمجتمعات والفعاليات وتعزيز التفاعل المجتمعي')}</p>
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
                {!loading && activeTab === 'communities' && renderCommunities()}
                {!loading && activeTab === 'content' && renderContent()}
                {!loading && activeTab === 'flagged' && renderFlagged()}
                {!loading && activeTab === 'events' && renderEvents()}
                {activeTab === 'messages' && <Messages senderRole="community_operator" showNewConversation />}
                {!loading && activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default CommunityOperatorDashboard;
