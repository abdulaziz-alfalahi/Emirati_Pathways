
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
  Headphones, AlertCircle, Clock, CheckCircle, Search, Plus,
  Users, Ticket, X, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
  blue: '#DBEAFE', blueText: '#1E40AF', red: '#FEE2E2', redText: '#991B1B',
};

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  urgent: { bg: brand.red, color: brand.redText }, high: { bg: brand.amber, color: brand.amberText },
  medium: { bg: brand.blue, color: brand.blueText }, low: { bg: '#F3F4F6', color: brand.textSecondary },
};
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  open: { bg: brand.blue, color: brand.blueText }, in_progress: { bg: brand.amber, color: brand.amberText },
  resolved: { bg: brand.green, color: brand.greenText }, closed: { bg: '#F3F4F6', color: brand.textSecondary },
};

const CallCenterDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [tickets, setTickets] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [tRes, anRes] = await Promise.allSettled([
          restClient.get('/api/platform-ops/tickets'),
          restClient.get('/api/platform-ops/tickets/analytics'),
        ]);
        if (cancelled) return;
        if (tRes.status === 'fulfilled') setTickets((tRes.value as any).data.tickets || []);
        if (anRes.status === 'fulfilled') setAnalytics((anRes.value as any).data);
      } catch (err) { console.error(err); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const searchUsers = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await restClient.get(`/api/platform-ops/user-lookup?q=${q}`);
      setSearchResults(res.data.users || []);
    } catch { setSearchResults([]); }
  };

  const filteredTickets = statusFilter ? tickets.filter(t => t.status === statusFilter) : tickets;

  const ticketsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Support Tickets', 'تذاكر الدعم')}</h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>{t('Manage and resolve user support tickets.', 'إدارة وحل تذاكر دعم المستخدمين.')}</p>
      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setStatusFilter('')} style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          background: !statusFilter ? brand.primary : '#fff', color: !statusFilter ? '#fff' : brand.textSecondary,
          border: !statusFilter ? 'none' : `1px solid ${brand.border}`, cursor: 'pointer',
        }}>{t('All', 'الكل')}</button>
        {['open', 'in_progress', 'resolved'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: statusFilter === s ? brand.primary : '#fff', color: statusFilter === s ? '#fff' : brand.textSecondary,
            border: statusFilter === s ? 'none' : `1px solid ${brand.border}`, cursor: 'pointer',
          }}>{s.replace('_', ' ')}</button>
        ))}
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : filteredTickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <CheckCircle size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: brand.primary }} />
          <p>{t('No tickets found.', 'لا توجد تذاكر.')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTickets.map((tk, i) => {
            const ps = PRIORITY_STYLES[tk.priority] || PRIORITY_STYLES.low;
            const ss = STATUS_STYLES[tk.status] || STATUS_STYLES.open;
            return (
              <div key={i} className="ep-card" style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: brand.textSecondary, flexShrink: 0 }}>#{tk.id}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.subject || 'No subject'}</h4>
                  <div style={{ fontSize: 11, color: brand.textSecondary }}>{tk.user_name || 'Anonymous'} · {tk.category}</div>
                </div>
                <span style={{ background: ps.bg, color: ps.color, fontSize: 10, fontWeight: 600, padding: '3px 6px', borderRadius: 99, flexShrink: 0 }}>{tk.priority}</span>
                <span style={{ background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 600, padding: '3px 6px', borderRadius: 99, flexShrink: 0 }}>{tk.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const lookupTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('User Lookup', 'بحث المستخدم')}</h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>{t('Search for users by name, email, or phone to assist them.', 'ابحث عن المستخدمين بالاسم أو البريد أو الهاتف لمساعدتهم.')}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: '8px 14px', maxWidth: 400 }}>
        <Search size={16} style={{ color: brand.textSecondary, flexShrink: 0 }} />
        <input type="text" placeholder={t('Search...', 'بحث...')} value={searchQ} onChange={e => searchUsers(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, color: brand.textPrimary, background: 'transparent' }} />
        {searchQ && <button data-has-handler="true" onClick={() => { setSearchQ(''); setSearchResults([]); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: brand.textSecondary }}><X size={14} /></button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {searchResults.map((u, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.primary, fontWeight: 700, fontSize: 12 }}>{(u.full_name || '?')[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{u.full_name}</div>
              <div style={{ fontSize: 11, color: brand.textSecondary }}>{u.email} · {u.phone || 'N/A'}</div>
            </div>
            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>{u.user_type}</span>
            <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Plus size={10} /> {t('Ticket', 'تذكرة')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const stats = [
    { value: `${analytics?.total_tickets || tickets.length}`, label: t('Total', 'إجمالي'), icon: Ticket },
    { value: `${analytics?.by_status?.open || 0}`, label: t('Open', 'مفتوحة'), icon: AlertCircle },
    { value: `${analytics?.by_status?.in_progress || 0}`, label: t('In Progress', 'قيد المعالجة'), icon: Clock },
    { value: `${analytics?.by_status?.resolved || 0}`, label: t('Resolved', 'محلولة'), icon: CheckCircle },
  ];

  const tabs = [
    { id: 'tickets', label: t('Tickets', 'التذاكر'), icon: <Ticket className="h-4 w-4" />, content: ticketsTab },
    { id: 'lookup', label: t('User Lookup', 'بحث'), icon: <Search className="h-4 w-4" />, content: lookupTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Call Center Dashboard', 'لوحة مركز الاتصال')}
      description={t('Manage support tickets, search for users, and resolve inquiries efficiently', 'إدارة تذاكر الدعم والبحث عن المستخدمين وحل الاستفسارات')}
      icon={<Headphones className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="tickets"
    />
  );
};
export default CallCenterDashboard;
