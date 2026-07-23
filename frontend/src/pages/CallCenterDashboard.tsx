import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import {
  Headphones, AlertCircle, Clock, CheckCircle, Search, Plus, Users, Ticket, X, Loader2,
  Phone, Mail, MessageSquare, ArrowUpRight, ChevronRight, ChevronLeft,
  BookOpen, BarChart3, Send, StickyNote, Building2, Shield, Filter,
  PhoneCall, MessageCircle, Globe, Inbox, Star, TrendingUp, Home,
  CircleDot, Briefcase, GraduationCap, Zap, Hash, ExternalLink, Copy,
  ArrowLeft, User, Tag, Calendar, FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import toast from 'react-hot-toast';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import AiAssistPanel from '@/components/ai/AiAssistPanel';

/* ── Brand Tokens ── */
const brand = {
  primary: '#0D9488', primaryDark: '#0F766E', primarySurface: '#F0FDFA',
  bg: '#FAFBFC', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', textTertiary: '#9CA3AF',
};

const PRIORITY_MAP: Record<string, { bg: string; text: string; label: string; labelAr: string }> = {
  urgent: { bg: 'bg-red-50', text: 'text-red-700', label: 'Urgent', labelAr: 'عاجل' },
  high:   { bg: 'bg-amber-50', text: 'text-amber-700', label: 'High', labelAr: 'مرتفع' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Medium', labelAr: 'متوسط' },
  low:    { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Low', labelAr: 'منخفض' },
};
const STATUS_MAP: Record<string, { bg: string; text: string; label: string; labelAr: string; icon: React.ElementType }> = {
  open:        { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Open', labelAr: 'مفتوحة', icon: Inbox },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress', labelAr: 'قيد المعالجة', icon: Clock },
  resolved:    { bg: 'bg-green-50', text: 'text-green-700', label: 'Resolved', labelAr: 'محلولة', icon: CheckCircle },
  closed:      { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Closed', labelAr: 'مغلقة', icon: X },
};
const SOURCE_ICON: Record<string, React.ElementType> = {
  phone: PhoneCall, whatsapp: MessageCircle, email: Mail, in_app: Globe, live_chat: MessageCircle,
};
const CATEGORY_ICON: Record<string, React.ElementType> = {
  technical: Zap, account: Shield, jobs: Briefcase, training: GraduationCap,
  nafis: Star, employer: Building2, general: Inbox,
};

/* ── Component ── */
const CallCenterDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => isRTL ? ar : en;

  const [activeTab, setActiveTab] = useState('queue');
  const [tickets, setTickets] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Queue filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [queueSearch, setQueueSearch] = useState('');

  // Active ticket
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // User lookup
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Knowledge base
  const [kbQuery, setKbQuery] = useState('');
  const [kbArticles, setKbArticles] = useState<any[]>([]);
  const [kbCategory, setKbCategory] = useState('');
  const [kbLoading, setKbLoading] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);

  // Live chat
  const { socket } = useNotifications();
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [liveChatLoading, setLiveChatLoading] = useState(false);

  // Create ticket dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium', source: 'phone', user_id: '' });

  /* ── Data Loading ── */
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.allSettled([
        restClient.get('/api/platform-ops/tickets'),
        restClient.get('/api/platform-ops/tickets/analytics'),
      ]);
      if (tRes.status === 'fulfilled') setTickets((tRes.value as any).data.tickets || []);
      if (aRes.status === 'fulfilled') setAnalytics((aRes.value as any).data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  /* ── Live Chat Loading ── */
  const loadLiveChats = useCallback(async () => {
    setLiveChatLoading(true);
    try {
      const res = await restClient.get('/api/platform-ops/live-chat/agent/sessions');
      setLiveSessions(res.data.sessions || []);
    } catch (e) { console.error('Failed to load live chats', e); }
    setLiveChatLoading(false);
  }, []);

  useEffect(() => { loadLiveChats(); const iv = setInterval(loadLiveChats, 15000); return () => clearInterval(iv); }, [loadLiveChats]);

  /* ── Live Chat Socket listeners ── */
  useEffect(() => {
    if (!socket) return;
    const handleQueueUpdate = (data: any) => {
      loadLiveChats();
      toast(b(`New chat from ${data.user_name || 'a user'}`, `محادثة جديدة من ${data.user_name || 'مستخدم'}`), { icon: '💬' });
    };
    const handleChatEnded = (data: any) => {
      loadLiveChats();
      if (activeChat?.id === data.session_id) {
        setActiveChat((prev: any) => prev ? { ...prev, status: 'ended' } : prev);
      }
    };
    socket.on('live_chat_queue_update', handleQueueUpdate);
    socket.on('live_chat_ended', handleChatEnded);
    // Listen for new messages in active chat
    const handleNewChatMsg = (data: any) => {
      if (!activeChat) return;
      const { message: msgData, conversation_id: convId } = data;
      if (!msgData || String(convId) !== String(activeChat.conversation_id)) return;
      if (String(msgData.sender_id) === String(user?.id)) return;
      setChatMessages(prev => {
        if (prev.some((m: any) => m.id === msgData.id)) return prev;
        return [...prev, {
          id: msgData.id,
          sender_id: msgData.sender_id,
          sender_name: msgData.sender_name || 'User',
          content: msgData.content || '',
          created_at: msgData.created_at || new Date().toISOString(),
        }];
      });
    };
    socket.on('new_message', handleNewChatMsg);
    return () => {
      socket.off('live_chat_queue_update', handleQueueUpdate);
      socket.off('live_chat_ended', handleChatEnded);
      socket.off('new_message', handleNewChatMsg);
    };
  }, [socket, activeChat, loadLiveChats, user]);

  const acceptLiveChat = async (session: any) => {
    try {
      const res = await restClient.put(`/api/platform-ops/live-chat/session/${session.id}/accept`, { agent_id: user?.id });
      toast.success(b('Chat accepted', 'تم قبول المحادثة'));
      setActiveChat({ ...session, status: 'active', conversation_id: res.data.conversation_id || session.conversation_id, agent_name: res.data.agent_name });
      // Load existing messages for this conversation
      if (res.data.conversation_id) {
        try {
          const msgRes = await restClient.get(`/api/communication/conversations/${res.data.conversation_id}/messages`);
          if (msgRes.data.success) setChatMessages(msgRes.data.data?.messages || []);
        } catch { setChatMessages([]); }
      }
      setActiveTab('live');
      loadLiveChats();
    } catch { toast.error(b('Failed to accept', 'فشل القبول')); }
  };

  const sendChatReply = async () => {
    if (!chatInput.trim() || !activeChat?.conversation_id) return;
    const tempMsg = { id: `_tmp_${Date.now()}`, sender_id: String(user?.id), sender_name: 'Agent', content: chatInput, created_at: new Date().toISOString() };
    setChatMessages(prev => [...prev, tempMsg]);
    const saved = chatInput;
    setChatInput('');
    try {
      await restClient.post('/api/communication/messages', {
        conversation_id: activeChat.conversation_id,
        recipient_id: String(activeChat.user_id),
        content: saved,
        message_type: 'text',
        sender_role: 'call_center_agent',
      });
    } catch { toast.error(b('Failed to send', 'فشل الإرسال')); }
  };

  const endLiveChatSession = async (sessionId: number, createTicket = false) => {
    try {
      const res = await restClient.put(`/api/platform-ops/live-chat/session/${sessionId}/end`, {
        ended_by: 'agent', create_ticket: createTicket,
      });
      const ticketId = res.data?.ticket_id;
      if (createTicket && ticketId) {
        toast.success(b(`Chat ended — Ticket #${ticketId} created`, `تم إنهاء المحادثة — تذكرة #${ticketId}`), { duration: 5000 });
        loadTickets(); // Refresh queue so the new ticket appears
      } else {
        toast.success(b('Chat ended', 'تم إنهاء المحادثة'));
      }
      if (activeChat?.id === sessionId) setActiveChat(null);
      loadLiveChats();
    } catch { toast.error(b('Failed to end chat', 'فشل إنهاء المحادثة')); }
  };

  const waitingSessions = liveSessions.filter(s => s.status === 'waiting');
  const activeSessions = liveSessions.filter(s => s.status === 'active');

  const loadMessages = async (ticketId: number) => {
    setLoadingMessages(true);
    try {
      const res = await restClient.get(`/api/platform-ops/tickets/${ticketId}/messages`);
      setTicketMessages(res.data.messages || []);
    } catch { setTicketMessages([]); }
    setLoadingMessages(false);
  };

  const openTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setActiveTab('active');
    loadMessages(ticket.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      await restClient.post(`/api/platform-ops/tickets/${selectedTicket.id}/messages`, {
        message: newMessage, is_internal_note: isInternalNote,
      });
      setNewMessage('');
      loadMessages(selectedTicket.id);
      toast.success(isInternalNote ? b('Note added', 'تمت إضافة الملاحظة') : b('Reply sent', 'تم إرسال الرد'));
    } catch { toast.error(b('Failed to send', 'فشل الإرسال')); }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      await restClient.put(`/api/platform-ops/tickets/${ticketId}`, { status });
      toast.success(b('Status updated', 'تم تحديث الحالة'));
      loadTickets();
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status });
    } catch { toast.error(b('Update failed', 'فشل التحديث')); }
  };

  const updateTicketPriority = async (ticketId: number, priority: string) => {
    try {
      await restClient.put(`/api/platform-ops/tickets/${ticketId}`, { priority });
      toast.success(b('Priority updated', 'تم تحديث الأولوية'));
      loadTickets();
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, priority });
    } catch { toast.error(b('Update failed', 'فشل التحديث')); }
  };

  const searchUsers = async (q: string) => {
    setLookupQuery(q);
    if (q.length < 2) { setLookupResults([]); return; }
    setLookupLoading(true);
    try {
      const res = await restClient.get(`/api/platform-ops/user-lookup?q=${q}`);
      setLookupResults(res.data.users || []);
    } catch { setLookupResults([]); }
    setLookupLoading(false);
  };

  const searchKB = useCallback(async () => {
    setKbLoading(true);
    try {
      let url = '/api/platform-ops/knowledge-base?';
      if (kbQuery) url += `q=${kbQuery}&`;
      if (kbCategory) url += `category=${kbCategory}`;
      const res = await restClient.get(url);
      setKbArticles(res.data.articles || []);
    } catch { setKbArticles([]); }
    setKbLoading(false);
  }, [kbQuery, kbCategory]);

  useEffect(() => { searchKB(); }, [searchKB]);

  const createTicket = async () => {
    if (!createForm.subject.trim()) return;
    try {
      await restClient.post('/api/platform-ops/tickets', {
        ...createForm, user_id: createForm.user_id || undefined, agent_id: user?.id,
      });
      toast.success(b('Ticket created', 'تم إنشاء التذكرة'));
      setShowCreate(false);
      setCreateForm({ subject: '', description: '', category: 'general', priority: 'medium', source: 'phone', user_id: '' });
      loadTickets();
    } catch { toast.error(b('Failed to create ticket', 'فشل في إنشاء التذكرة')); }
  };

  /* ── Filtered Tickets ── */
  const filtered = tickets.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (queueSearch) {
      const q = queueSearch.toLowerCase();
      return (t.subject?.toLowerCase().includes(q) || t.user_name?.toLowerCase().includes(q) || String(t.id).includes(q));
    }
    return true;
  });

  /* ── Stats ── */
  const openCount = analytics?.by_status?.open || 0;
  const inProgressCount = analytics?.by_status?.in_progress || 0;
  const resolvedCount = analytics?.by_status?.resolved || 0;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;
  const categories = [...new Set(tickets.map(t => t.category).filter(Boolean))];

  const formatDate = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diffH = Math.floor((now.getTime() - date.getTime()) / 3600000);
    if (diffH < 1) return b('Just now', 'الآن');
    if (diffH < 24) return `${diffH}${b('h ago', 'س')}`;
    return date.toLocaleDateString(isRTL ? 'ar-AE' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <HybridGovernmentNavFixed
        onLanguageToggle={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
        currentLanguage={i18n.language as 'en' | 'ar'}
      />

      <main className="flex-1" style={{ background: brand.bg }}>
        {/* Breadcrumb */}
        <nav style={{ background: '#fff', borderBottom: `1px solid ${brand.border}` }}>
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm">
            <a href="/" className="flex items-center gap-1 text-teal-600 hover:opacity-70 transition-opacity">
              <Home className="h-3.5 w-3.5" />{b('Home', 'الرئيسية')}
            </a>
            {isRTL ? <ChevronLeft className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
            <span className="text-slate-500 font-medium">{b('Call Center Dashboard', 'لوحة مركز الاتصال')}</span>
          </div>
        </nav>

        {/* Hero */}
        <section className="bg-white border-b" style={{ borderColor: brand.border }}>
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-start gap-4">
              <div className="w-1 h-12 bg-teal-600 rounded-full flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{b('Call Center Dashboard', 'لوحة مركز الاتصال')}</h1>
                    <p className="text-slate-500 mt-2 max-w-xl">{b(
                      'Manage support tickets, assist users, and resolve inquiries efficiently',
                      'إدارة تذاكر الدعم ومساعدة المستخدمين وحل الاستفسارات بكفاءة'
                    )}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      {b('Online', 'متصل')}
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-full px-6">
                      <Plus className="h-4 w-4" />{b('New Ticket', 'تذكرة جديدة')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b" style={{ borderColor: brand.border }}>
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: b('Open Queue', 'الطابور المفتوح'), value: openCount, icon: Inbox, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: b('In Progress', 'قيد المعالجة'), value: inProgressCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: b('Urgent', 'عاجل'), value: urgentCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                { label: b('Resolved', 'محلولة'), value: resolvedCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/80 border" style={{ borderColor: brand.border }}>
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-slate-200 rounded-full p-1 mb-6 gap-1 flex-wrap">
              {[
              { id: 'queue', label: b('Queue', 'الطابور'), icon: Ticket },
                { id: 'live', label: b(`Live Chats${waitingSessions.length ? ` (${waitingSessions.length})` : ''}`, `المحادثات${waitingSessions.length ? ` (${waitingSessions.length})` : ''}`), icon: MessageCircle },
                { id: 'active', label: b('Active Ticket', 'التذكرة النشطة'), icon: MessageSquare },
                { id: 'lookup', label: b('User Lookup', 'بحث المستخدم'), icon: Search },
                { id: 'kb', label: b('Knowledge Base', 'قاعدة المعرفة'), icon: BookOpen },
                { id: 'performance', label: b('Performance', 'الأداء'), icon: BarChart3 },
              ].map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="rounded-full gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white px-5">
                  <tab.icon className="h-4 w-4" />{tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ═══ LIVE CHATS TAB ═══ */}
            <TabsContent value="live">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — Session list */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-teal-600" />
                        {b('Live Chat Queue', 'طابور المحادثات')}
                      </CardTitle>
                      <CardDescription>{b(`${waitingSessions.length} waiting · ${activeSessions.length} active`, `${waitingSessions.length} في الانتظار · ${activeSessions.length} نشط`)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                      {liveChatLoading && liveSessions.length === 0 && (
                        <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
                      )}
                      {!liveChatLoading && liveSessions.length === 0 && (
                        <div className="text-center py-10 text-sm text-slate-400">
                          <MessageCircle className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                          <p>{b('No active live chats', 'لا توجد محادثات حية')}</p>
                        </div>
                      )}
                      {liveSessions.map(session => {
                        const isWaiting = session.status === 'waiting';
                        const isActive = session.status === 'active';
                        const CatIcon = CATEGORY_ICON[session.category] || Inbox;
                        const selected = activeChat?.id === session.id;
                        return (
                          <div
                            key={session.id}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                              selected ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              if (isActive) {
                                setActiveChat(session);
                                // Load messages for this conversation
                                if (session.conversation_id) {
                                  restClient.get(`/api/communication/conversations/${session.conversation_id}/messages`)
                                    .then(r => { if (r.data.success) setChatMessages(r.data.data?.messages || []); })
                                    .catch(() => setChatMessages([]));
                                }
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                  isWaiting ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {(session.user_name || '?')[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-800 truncate">{session.user_name || b('User', 'مستخدم')}</p>
                                  <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <CatIcon className="h-3 w-3" />
                                    {session.category || 'general'}
                                  </p>
                                </div>
                              </div>
                              <Badge className={`text-[10px] flex-shrink-0 ${
                                isWaiting ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'
                              }`}>
                                {isWaiting ? b('Waiting', 'في الانتظار') : b('Active', 'نشط')}
                              </Badge>
                            </div>
                            {session.initial_message && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 bg-white/70 rounded px-2 py-1">
                                {session.initial_message}
                              </p>
                            )}
                            {isWaiting && (
                              <Button
                                size="sm"
                                className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg gap-1.5 h-8 text-xs"
                                onClick={(e) => { e.stopPropagation(); acceptLiveChat(session); }}
                              >
                                <Headphones className="h-3.5 w-3.5" />
                                {b('Accept Chat', 'قبول المحادثة')}
                              </Button>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">
                              {session.started_at ? new Date(session.started_at).toLocaleTimeString(isRTL ? 'ar-AE' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Right — Active chat view */}
                <div className="lg:col-span-2">
                  {!activeChat ? (
                    <Card className="border-slate-200 flex items-center justify-center h-[600px]">
                      <div className="text-center text-slate-400">
                        <MessageCircle className="h-14 w-14 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium">{b('Select a chat to start', 'اختر محادثة للبدء')}</p>
                        <p className="text-xs mt-1">{b('Accept a waiting chat from the queue', 'اقبل محادثة من الطابور')}</p>
                      </div>
                    </Card>
                  ) : (
                    <Card className="border-slate-200 flex flex-col h-[600px]">
                      {/* Chat header */}
                      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white rounded-t-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                            {(activeChat.user_name || '?')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-slate-800">{activeChat.user_name || b('User', 'مستخدم')}</h4>
                            <p className="text-xs text-slate-400">{activeChat.category || 'general'} · #{activeChat.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeChat.status === 'active' && (
                            <>
                              <Button
                                size="sm" variant="outline"
                                className="rounded-lg text-xs h-8 gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                                onClick={() => endLiveChatSession(activeChat.id, true)}
                              >
                                <Ticket className="h-3.5 w-3.5" />
                                {b('End + Ticket', 'إنهاء + تذكرة')}
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="rounded-lg text-xs h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => endLiveChatSession(activeChat.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                                {b('End Chat', 'إنهاء')}
                              </Button>
                            </>
                          )}
                          {activeChat.status === 'ended' && (
                            <Badge className="bg-slate-100 text-slate-500">{b('Ended', 'منتهية')}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5" style={{ background: '#f8fafb' }}>
                        {chatMessages.length === 0 && (
                          <div className="text-center py-6 text-xs text-slate-400">
                            {activeChat.initial_message
                              ? b('Initial message shown below', 'الرسالة الأولية أدناه')
                              : b('No messages yet', 'لا توجد رسائل بعد')}
                          </div>
                        )}
                        {chatMessages.map((msg: any) => {
                          const isAgent = String(msg.sender_id) === String(user?.id);
                          return (
                            <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                                isAgent
                                  ? 'bg-teal-600 text-white rounded-ee-md'
                                  : 'bg-white text-slate-700 border border-slate-200 rounded-es-md shadow-sm'
                              }`}>
                                {!isAgent && <div className="text-[10px] font-semibold text-teal-600 mb-0.5">{msg.sender_name || 'User'}</div>}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className={`text-[9px] mt-1 text-end ${isAgent ? 'text-teal-200' : 'text-slate-400'}`}>
                                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString(isRTL ? 'ar-AE' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Input */}
                      {activeChat.status === 'active' && (
                        <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 rounded-b-xl">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatReply(); } }}
                            placeholder={b('Type a reply...', 'اكتب ردًا...')}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 bg-slate-50"
                          />
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-9 w-9 p-0"
                            onClick={sendChatReply}
                            disabled={!chatInput.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ═══ QUEUE TAB ═══ */}
            <TabsContent value="queue">
              <Card className="border-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold">{b('Ticket Queue', 'طابور التذاكر')}</CardTitle>
                      <CardDescription>{b(`${filtered.length} tickets`, `${filtered.length} تذكرة`)}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 w-72">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input type="text" placeholder={b('Search tickets...', 'بحث في التذاكر...')} value={queueSearch}
                        onChange={e => setQueueSearch(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-sm text-slate-800 placeholder:text-slate-400" />
                      {queueSearch && <button onClick={() => setQueueSearch('')}><X className="h-3.5 w-3.5 text-slate-400" /></button>}
                    </div>
                  </div>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-xs text-slate-500 flex items-center gap-1 me-1"><Filter className="h-3 w-3" />{b('Filter:', 'تصفية:')}</span>
                    {/* Status */}
                    {['', 'open', 'in_progress', 'resolved'].map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === s ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-teal-300'}`}>
                        {s ? (STATUS_MAP[s]?.[isRTL ? 'labelAr' : 'label'] || s) : b('All Status', 'كل الحالات')}
                      </button>
                    ))}
                    <span className="text-slate-300 mx-1">|</span>
                    {/* Priority */}
                    {['', 'urgent', 'high', 'medium', 'low'].map(p => (
                      <button key={p} onClick={() => setPriorityFilter(p)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${priorityFilter === p ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-teal-300'}`}>
                        {p ? (PRIORITY_MAP[p]?.[isRTL ? 'labelAr' : 'label'] || p) : b('All Priority', 'كل الأولويات')}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{b('No tickets match your filters', 'لا توجد تذاكر مطابقة')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filtered.map(tk => {
                        const pr = PRIORITY_MAP[tk.priority] || PRIORITY_MAP.medium;
                        const st = STATUS_MAP[tk.status] || STATUS_MAP.open;
                        const SourceIcon = SOURCE_ICON[tk.source] || Globe;
                        const CatIcon = CATEGORY_ICON[tk.category] || Inbox;
                        return (
                          <div key={tk.id} onClick={() => openTicket(tk)}
                            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors flex-shrink-0">
                              <Hash className="h-3 w-3 inline" />{tk.id}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-slate-800 truncate">{tk.subject || b('No subject', 'بدون عنوان')}</h4>
                                {tk.priority === 'urgent' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><User className="h-3 w-3" />{tk.user_name || b('Unknown', 'غير معروف')}</span>
                                <span className="flex items-center gap-1"><CatIcon className="h-3 w-3" />{tk.category}</span>
                                <span className="flex items-center gap-1"><SourceIcon className="h-3 w-3" />{tk.source}</span>
                                <span>{formatDate(tk.created_at)}</span>
                              </div>
                            </div>
                            <Badge className={`${pr.bg} ${pr.text} border-0 text-[10px] font-semibold`}>{isRTL ? pr.labelAr : pr.label}</Badge>
                            <Badge className={`${st.bg} ${st.text} border-0 text-[10px] font-semibold`}>{isRTL ? st.labelAr : st.label}</Badge>
                            <ChevronRight className={`h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ ACTIVE TICKET TAB ═══ */}
            <TabsContent value="active">
              {!selectedTicket ? (
                <Card className="border-slate-200">
                  <CardContent className="py-20 text-center text-slate-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">{b('Select a ticket from the Queue tab to view details', 'اختر تذكرة من الطابور لعرض التفاصيل')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main conversation */}
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('queue')} className="text-slate-400 hover:text-slate-600">
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <span className="text-slate-400 text-sm">#{selectedTicket.id}</span>
                                {selectedTicket.subject}
                              </CardTitle>
                              <CardDescription className="mt-1">{selectedTicket.user_name} · {formatDate(selectedTicket.created_at)}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${(PRIORITY_MAP[selectedTicket.priority] || PRIORITY_MAP.medium).bg} ${(PRIORITY_MAP[selectedTicket.priority] || PRIORITY_MAP.medium).text} border-0`}>
                              {isRTL ? PRIORITY_MAP[selectedTicket.priority]?.labelAr : PRIORITY_MAP[selectedTicket.priority]?.label}
                            </Badge>
                            <Badge className={`${(STATUS_MAP[selectedTicket.status] || STATUS_MAP.open).bg} ${(STATUS_MAP[selectedTicket.status] || STATUS_MAP.open).text} border-0`}>
                              {isRTL ? STATUS_MAP[selectedTicket.status]?.labelAr : STATUS_MAP[selectedTicket.status]?.label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Description */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                        </div>
                        {/* AI reply draft — sends only non-identifying ticket fields */}
                        <AiAssistPanel
                          feature="support_reply"
                          title="AI reply draft"
                          titleAr="مسودة رد بالذكاء الاصطناعي"
                          getContext={() => ({
                            ticket_subject: String(selectedTicket?.subject || ''),
                            ticket_description: String(selectedTicket?.description || '').slice(0, 2000),
                            category: selectedTicket?.category || 'general',
                            status: selectedTicket?.status || 'open',
                          })}
                          className="mb-6"
                        />
                        {/* Messages */}
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-slate-400" />{b('Conversation', 'المحادثة')}
                        </h3>
                        {loadingMessages ? (
                          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
                        ) : ticketMessages.length === 0 ? (
                          <p className="text-center text-sm text-slate-400 py-6">{b('No messages yet', 'لا توجد رسائل بعد')}</p>
                        ) : (
                          <div className="space-y-3 mb-6">
                            {ticketMessages.map((msg, i) => (
                              <div key={i} className={`p-3 rounded-xl text-sm ${msg.is_internal_note ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-100'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                                    {msg.is_internal_note && <StickyNote className="h-3 w-3 text-amber-600" />}
                                    {msg.sender_name || b('Agent', 'الوكيل')}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{formatDate(msg.created_at)}</span>
                                </div>
                                <p className="text-slate-600 whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Reply box */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={3}
                            placeholder={isInternalNote ? b('Write an internal note...', 'اكتب ملاحظة داخلية...') : b('Type your reply...', 'اكتب ردك...')}
                            className="w-full px-4 py-3 text-sm border-none outline-none resize-none bg-white placeholder:text-slate-400" />
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
                            <button onClick={() => setIsInternalNote(!isInternalNote)}
                              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${isInternalNote ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-500 border border-slate-200'}`}>
                              <StickyNote className="h-3 w-3" />{isInternalNote ? b('Internal Note', 'ملاحظة داخلية') : b('Reply', 'رد')}
                            </button>
                            <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 rounded-full px-4">
                              <Send className="h-3.5 w-3.5" />{b('Send', 'إرسال')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Sidebar */}
                  <div className="space-y-4">
                    <Card className="border-slate-200">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">{b('Actions', 'الإجراءات')}</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1.5 block">{b('Status', 'الحالة')}</label>
                          <div className="flex flex-wrap gap-1.5">
                            {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                              <button key={s} onClick={() => updateTicketStatus(selectedTicket.id, s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTicket.status === s ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-teal-300'}`}>
                                {isRTL ? STATUS_MAP[s]?.labelAr : STATUS_MAP[s]?.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1.5 block">{b('Priority', 'الأولوية')}</label>
                          <div className="flex flex-wrap gap-1.5">
                            {['urgent', 'high', 'medium', 'low'].map(p => (
                              <button key={p} onClick={() => updateTicketPriority(selectedTicket.id, p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTicket.priority === p ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-teal-300'}`}>
                                {isRTL ? PRIORITY_MAP[p]?.labelAr : PRIORITY_MAP[p]?.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">{b('Ticket Info', 'معلومات التذكرة')}</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        {[
                          { icon: User, label: b('Caller', 'المتصل'), value: selectedTicket.user_name || '-' },
                          { icon: Tag, label: b('Category', 'الفئة'), value: selectedTicket.category },
                          { icon: SOURCE_ICON[selectedTicket.source] || Globe, label: b('Source', 'المصدر'), value: selectedTicket.source },
                          { icon: Calendar, label: b('Created', 'تاريخ الإنشاء'), value: selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US') : '-' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-600">
                            <item.icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-400">{item.label}:</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ═══ USER LOOKUP TAB ═══ */}
            <TabsContent value="lookup">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">{b('User Lookup', 'بحث المستخدم')}</CardTitle>
                  <CardDescription>{b('Search by name, email, or phone to assist users', 'ابحث بالاسم أو البريد أو الهاتف لمساعدة المستخدمين')}</CardDescription>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 mt-3 max-w-md">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input type="text" placeholder={b('Search users...', 'بحث المستخدمين...')} value={lookupQuery}
                      onChange={e => searchUsers(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-sm text-slate-800 placeholder:text-slate-400" />
                    {lookupQuery && <button onClick={() => { setLookupQuery(''); setLookupResults([]); }}><X className="h-3.5 w-3.5 text-slate-400" /></button>}
                  </div>
                </CardHeader>
                <CardContent>
                  {lookupLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
                  ) : lookupResults.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{lookupQuery.length >= 2 ? b('No users found', 'لم يتم العثور على مستخدمين') : b('Start typing to search', 'ابدأ الكتابة للبحث')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lookupResults.map((u, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-teal-200 transition-all">
                          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                            {(u.full_name || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800">{u.full_name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                              {u.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>}
                              {u.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone}</span>}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{u.user_type}</Badge>
                          <Button size="sm" onClick={() => { setCreateForm(prev => ({ ...prev, user_id: u.id })); setShowCreate(true); }}
                            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 rounded-full text-xs px-4">
                            <Plus className="h-3 w-3" />{b('Ticket', 'تذكرة')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ KNOWLEDGE BASE TAB ═══ */}
            <TabsContent value="kb">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-teal-600" />{b('Knowledge Base', 'قاعدة المعرفة')}</CardTitle>
                  <CardDescription>{b('Quick-reference articles to help resolve common inquiries', 'مقالات مرجعية سريعة للمساعدة في حل الاستفسارات الشائعة')}</CardDescription>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 flex-1 min-w-[200px] max-w-md">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input type="text" placeholder={b('Search articles...', 'بحث المقالات...')} value={kbQuery}
                        onChange={e => setKbQuery(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-sm text-slate-800 placeholder:text-slate-400" />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['', 'account', 'technical', 'jobs', 'nafis', 'employer_admin', 'general'].map(c => (
                        <button key={c} onClick={() => setKbCategory(c)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${kbCategory === c ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-teal-300'}`}>
                          {c || b('All', 'الكل')}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {kbLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
                  ) : kbArticles.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{b('No articles found', 'لم يتم العثور على مقالات')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {kbArticles.map(a => {
                        const CatI = CATEGORY_ICON[a.category] || Inbox;
                        const isExpanded = expandedArticle === a.id;
                        return (
                          <div key={a.id} className="rounded-xl border border-slate-100 overflow-hidden hover:border-teal-200 transition-all">
                            <button onClick={() => setExpandedArticle(isExpanded ? null : a.id)}
                              className="w-full flex items-center gap-3 p-4 text-start hover:bg-slate-50/50 transition-colors">
                              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                                <CatI className="h-4 w-4 text-teal-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-800">{isRTL ? a.title_ar : a.title_en}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>
                                  {Array.isArray(a.tags) && a.tags.slice(0, 3).map((tag: string, ti: number) => (
                                    <span key={ti} className="text-[10px] text-slate-400">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                              <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans mt-3 leading-relaxed">
                                  {isRTL ? a.body_ar : a.body_en}
                                </pre>
                                <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs"
                                  onClick={() => { navigator.clipboard.writeText(isRTL ? a.body_ar : a.body_en); toast.success(b('Copied!', 'تم النسخ!')); }}>
                                  <Copy className="h-3 w-3" />{b('Copy to clipboard', 'نسخ')}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ PERFORMANCE TAB ═══ */}
            <TabsContent value="performance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-teal-600" />{b('Overview', 'نظرة عامة')}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: b('Total Tickets', 'إجمالي التذاكر'), value: analytics?.total_tickets || tickets.length, max: Math.max(analytics?.total_tickets || tickets.length, 1) },
                      { label: b('Open', 'مفتوحة'), value: openCount, max: Math.max(analytics?.total_tickets || tickets.length, 1) },
                      { label: b('Resolved', 'محلولة'), value: resolvedCount, max: Math.max(analytics?.total_tickets || tickets.length, 1) },
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600">{m.label}</span>
                          <span className="font-bold text-slate-900">{m.value}</span>
                        </div>
                        <Progress value={m.max > 0 ? (m.value / m.max) * 100 : 0} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag className="h-5 w-5 text-teal-600" />{b('By Category', 'حسب الفئة')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics?.by_category || {}).map(([cat, count]: [string, any]) => {
                        const CatI = CATEGORY_ICON[cat] || Inbox;
                        return (
                          <div key={cat} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><CatI className="h-4 w-4 text-slate-500" /></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700 capitalize">{cat}</span>
                                <span className="font-bold text-slate-900">{count}</span>
                              </div>
                              <Progress value={analytics?.total_tickets > 0 ? ((count as number) / analytics.total_tickets) * 100 : 0} className="h-1.5 mt-1" />
                            </div>
                          </div>
                        );
                      })}
                      {!analytics?.by_category || Object.keys(analytics.by_category).length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-6">{b('No data yet', 'لا توجد بيانات بعد')}</p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 md:col-span-2">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-teal-600" />{b('Resolution Rate', 'معدل الحل')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="relative w-28 h-28">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0d9488" strokeWidth="3"
                            strokeDasharray={`${(analytics?.total_tickets > 0 ? (resolvedCount / analytics.total_tickets) * 100 : 0)}, 100`}
                            strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-slate-900">
                            {analytics?.total_tickets > 0 ? Math.round((resolvedCount / analytics.total_tickets) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">{b('Tickets resolved out of total created.', 'التذاكر المحلولة من إجمالي التذاكر.')}</p>
                        <p className="text-xs text-slate-400">{b(`${resolvedCount} resolved / ${analytics?.total_tickets || tickets.length} total`, `${resolvedCount} محلولة / ${analytics?.total_tickets || tickets.length} إجمالي`)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* ═══ CREATE TICKET DIALOG ═══ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-teal-600" />{b('Create Support Ticket', 'إنشاء تذكرة دعم')}</DialogTitle>
            <DialogDescription>{b('Log a new support inquiry from a caller.', 'سجل استفسار دعم جديد من متصل.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2" dir={isRTL ? 'rtl' : 'ltr'}>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{b('Subject *', 'العنوان *')}</label>
              <input type="text" value={createForm.subject} onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))}
                placeholder={b('Brief description of the issue...', 'وصف مختصر للمشكلة...')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{b('Description', 'التفاصيل')}</label>
              <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                rows={3} placeholder={b('Detailed notes...', 'ملاحظات تفصيلية...')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{b('Category', 'الفئة')}</label>
                <select value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  {['general', 'technical', 'account', 'jobs', 'training', 'nafis', 'employer_admin'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{b('Priority', 'الأولوية')}</label>
                <select value={createForm.priority} onChange={e => setCreateForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{b('Source', 'المصدر')}</label>
                <select value={createForm.source} onChange={e => setCreateForm(p => ({ ...p, source: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  {['phone', 'whatsapp', 'email', 'in_app'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{b('Cancel', 'إلغاء')}</Button>
            <Button onClick={createTicket} disabled={!createForm.subject.trim()} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              <Plus className="h-4 w-4" />{b('Create Ticket', 'إنشاء التذكرة')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallCenterDashboard;
