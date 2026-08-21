import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { canOpenPath } from '@/config/routeAccess';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { restClient } from '@/utils/api';
import BoardMinutesPanel from '@/components/board/BoardMinutesPanel';
import AgendaList from '@/components/board/AgendaList';
import {
  CalendarDays, Video, Users, Gavel, Loader2, Archive, Plus, Clock, MapPin,
} from 'lucide-react';

/**
 * Board Secretary (board_operator) workspace.
 *
 * Distinct from the board MEMBER dashboard at /executive: a member attends and
 * reads, whereas the secretary runs the meeting cycle — schedules meetings,
 * sets the board-wide quorum rule, records who attended, and tracks whether the
 * board's recommendations are actually being implemented.
 *
 * Scheduling in particular had no interface at all before this page: the
 * POST /api/board/meetings endpoint existed but nothing in the product called
 * it, so a secretary could not put a meeting in the calendar.
 */
const BoardSecretaryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);

  /* Every role the user holds, primary AND secondary. Reading only `role`
     misjudges multi-role users — the recurring guard bug in this codebase, and
     this reporter is exactly that shape: candidate primary, board_operator
     secondary. */
  const myRoles = [(user as any)?.role, ...(((user as any)?.secondary_roles) || [])]
    .filter(Boolean)
    .map((r: string) => String(r).toLowerCase());

  const [tab, setTab] = useState('meetings');

  // ── Meetings ────────────────────────────────────────────────────
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  // Add-attendee dialog. The endpoint has existed since the meeting-attendees
  // work; nothing on this page ever called it, so "I can't invite additional
  // attendees" (fb_1787129152) was a missing control, not a missing feature.
  const [addingTo, setAddingTo] = useState<any>(null);
  const [guestQuery, setGuestQuery] = useState('');
  const [guestResults, setGuestResults] = useState<any[]>([]);
  const [guestPicked, setGuestPicked] = useState<any[]>([]);
  const [guestCounts, setGuestCounts] = useState(false);
  const [guestWaits, setGuestWaits] = useState(true);
  const [guestSearching, setGuestSearching] = useState(false);
  const [guestSaving, setGuestSaving] = useState(false);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', title_ar: '', agenda: '', scheduled_at: '',
    duration_minutes: 60, is_virtual: true, location: '',
  });

  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    try {
      const [u, p] = await Promise.all([
        restClient.get('/api/board/meetings?scope=upcoming'),
        restClient.get('/api/board/meetings?scope=past'),
      ]);
      setUpcoming(u.data?.data || []);
      setPast(p.data?.data || []);
    } catch {
      setUpcoming([]);
      setPast([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  // datetime-local needs 'YYYY-MM-DDTHH:mm' in LOCAL time; an ISO string from
  // the API is UTC, so slicing it directly would shift the displayed time.
  const toLocalInput = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      title: m.title || '',
      title_ar: m.title_ar || '',
      agenda: m.agenda || '',
      scheduled_at: toLocalInput(m.scheduled_at),
      duration_minutes: m.duration_minutes || 60,
      is_virtual: m.is_virtual !== false,
      location: m.location || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', title_ar: '', agenda: '', scheduled_at: '', duration_minutes: 60, is_virtual: true, location: '' });
  };

  const searchGuests = async (q: string) => {
    setGuestQuery(q);
    if (q.trim().length < 2) { setGuestResults([]); return; }
    setGuestSearching(true);
    try {
      const res = await restClient.get(`/api/board/meetings/invitable?q=${encodeURIComponent(q.trim())}`);
      setGuestResults(res.data?.data || []);
    } catch {
      setGuestResults([]);
    } finally {
      setGuestSearching(false);
    }
  };

  const addAttendees = async () => {
    if (!addingTo || guestPicked.length === 0) return;
    setGuestSaving(true);
    try {
      const res = await restClient.post(`/api/board/meetings/${addingTo.id}/attendees`, {
        user_ids: guestPicked.map((g) => g.id),
        counts_toward_quorum: guestCounts,
        requires_admission: guestWaits,
      });
      const added = res.data?.data?.added?.length ?? 0;
      const already = res.data?.data?.already_invited?.length ?? 0;
      // Report what actually happened — saying "3 added" when two were already
      // on the list would overstate the change.
      toast({
        title: added
          ? b(`${added} added${already ? `, ${already} already invited` : ''}`,
              `تمت إضافة ${added}${already ? `، و${already} مدعو مسبقاً` : ''}`)
          : b('Everyone selected was already invited', 'جميع المحددين مدعوون مسبقاً'),
      });
      setAddingTo(null);
      setGuestPicked([]); setGuestQuery(''); setGuestResults([]); setGuestCounts(false); setGuestWaits(true);
      fetchMeetings();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not add attendees', 'تعذّرت الإضافة'), variant: 'destructive' });
    } finally {
      setGuestSaving(false);
    }
  };

  const cancelMeeting = async (m: any) => {
    const reason = window.prompt(
      b('Cancelling notifies everyone invited. Reason (optional):',
        'سيتم إشعار جميع المدعوين بالإلغاء. السبب (اختياري):') || '') ;
    if (reason === null) return; // dismissed the prompt
    try {
      const res = await restClient.post(`/api/board/meetings/${m.id}/cancel`, { reason });
      if (!res.data?.success) {
        toast({ title: res.data?.message || b('Could not cancel', 'تعذّر الإلغاء'), variant: 'destructive' });
        return;
      }
      toast({ title: b('Meeting cancelled — everyone invited has been notified', 'تم إلغاء الاجتماع وإشعار جميع المدعوين') });
      fetchMeetings();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not cancel', 'تعذّر الإلغاء'), variant: 'destructive' });
    }
  };

  const createMeeting = async () => {
    if (!form.title.trim()) {
      toast({ title: b('A title is required', 'العنوان مطلوب'), variant: 'destructive' });
      return;
    }
    if (!form.scheduled_at) {
      toast({ title: b('Pick a date and time', 'اختر التاريخ والوقت'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // datetime-local yields local wall time with no zone; send it as-is and
      // let the server parse it as an ISO datetime.
      const payload = {
        ...form,
        duration_minutes: Number(form.duration_minutes) || 60,
        scheduled_at: form.scheduled_at,
      };
      const res = editingId
        ? await restClient.put(`/api/board/meetings/${editingId}`, payload)
        : await restClient.post('/api/board/meetings', payload);
      if (!res.data?.success) {
        toast({ title: res.data?.message || b('Could not save the meeting', 'تعذّر حفظ الاجتماع'), variant: 'destructive' });
        return;
      }
      toast({
        title: editingId
          ? b('Meeting updated — members are notified only if the date changed', 'تم تحديث الاجتماع — يتم إشعار الأعضاء فقط عند تغيير الموعد')
          : b('Meeting scheduled — board members have been notified', 'تمت جدولة الاجتماع وتم إشعار أعضاء المجلس'),
      });
      setShowForm(false);
      resetForm();
      fetchMeetings();
    } catch (e: any) {
      toast({
        title: e?.response?.data?.message || b('Could not schedule the meeting', 'تعذّر جدولة الاجتماع'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const joinMeeting = async (m: any) => {
    setJoiningId(m.id);
    try {
      const res = await restClient.post(`/api/board/meetings/${m.id}/join`, {});
      if (!res.data?.success) {
        toast({ title: res.data?.message || b('Could not join', 'تعذّر الانضمام'), variant: 'destructive' });
        return;
      }
      navigate(`/board-meeting/${m.id}`);
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not join', 'تعذّر الانضمام'), variant: 'destructive' });
    } finally {
      setJoiningId(null);
    }
  };

  const endMeeting = async (m: any) => {
    try {
      const res = await restClient.post(`/api/board/meetings/${m.id}/end`, {});
      if (!res.data?.success) {
        toast({ title: res.data?.message || b('Could not close the meeting', 'تعذّر إنهاء الاجتماع'), variant: 'destructive' });
        return;
      }
      const d = res.data?.data || {};
      const quorate = d.quorum_required != null && d.attended >= d.quorum_required;
      toast({
        title: b('Meeting closed', 'تم إنهاء الاجتماع'),
        description: d.quorum_required == null
          ? b(`${d.attended} attended. No quorum rule is set for the board.`,
              `حضر ${d.attended}. لم يتم تحديد نصاب للمجلس.`)
          : b(`${d.attended} of ${d.quorum_required} required attended — ${quorate ? 'quorate' : 'not quorate'}.`,
              `حضر ${d.attended} من ${d.quorum_required} المطلوبين — ${quorate ? 'مكتمل النصاب' : 'غير مكتمل النصاب'}.`),
      });
      fetchMeetings();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not close the meeting', 'تعذّر إنهاء الاجتماع'), variant: 'destructive' });
    }
  };

  // ── Per-meeting attendance detail (migration 054) ───────────────
  // Durations are the SUM of presence intervals, so a member who dropped out
  // and rejoined is not credited with the time they were away.
  const [attendanceFor, setAttendanceFor] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<any>(null);

  const openAttendance = async (m: any) => {
    if (attendanceFor === m.id) { setAttendanceFor(null); setAttendance(null); return; }
    setAttendanceFor(m.id);
    setAttendance(null);
    try {
      const res = await restClient.get(`/api/board/meetings/${m.id}/attendance`);
      setAttendance(res.data?.data || null);
    } catch {
      setAttendance(null);
    }
  };

  const fmtDuration = (secs: number) => {
    if (!secs) return b('none recorded', 'لم يُسجَّل');
    const h = Math.floor(secs / 3600);
    const mnt = Math.round((secs % 3600) / 60);
    return h ? `${h}${b('h', 'س')} ${mnt}${b('m', 'د')}` : `${mnt}${b('m', 'د')}`;
  };

  // ── Board members' offices ──────────────────────────────────────
  // External email addresses, not platform users. Outbound email is blocked at
  // the firewall, so what we queue is NOT delivered yet — the UI has to say so
  // plainly, or a secretary will assume an office has been told when it has not.
  const [offices, setOffices] = useState<any[]>([]);
  const [officeQueue, setOfficeQueue] = useState<any[]>([]);
  const [officeForm, setOfficeForm] = useState({ user_id: '', office_name: '', email: '', phone: '' });
  // Non-null while editing an existing office row, which switches the form from
  // "record an office" (POST upsert) to "change this one" (PUT by id).
  const [editingOfficeId, setEditingOfficeId] = useState<string | null>(null);
  const officeFormRef = useRef<HTMLDivElement>(null);
  const [savingOffice, setSavingOffice] = useState(false);

  const fetchOffices = async () => {
    try {
      const [o, q] = await Promise.all([
        restClient.get('/api/board/meetings/offices'),
        restClient.get('/api/board/meetings/office-notifications'),
      ]);
      setOffices(o.data?.data || []);
      setOfficeQueue(q.data?.data || []);
    } catch {
      setOffices([]);
      setOfficeQueue([]);
    }
  };

  /* Editing an EXISTING office goes through PUT, not the upsert (#393).
     POST keys on (member, email), so changing an office's email would insert a
     second row and leave the old address active and still due to be notified —
     with nothing in the list to say which one is current. */
  const startEditOffice = (memberId: string, o: any) => {
    setEditingOfficeId(o.id);
    setOfficeForm({
      user_id: memberId,
      office_name: o.office_name || '',
      email: o.email || '',
      phone: o.phone || '',
    });
    officeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelEditOffice = () => {
    setEditingOfficeId(null);
    setOfficeForm({ user_id: '', office_name: '', email: '', phone: '' });
  };

  const addOffice = async () => {
    if (!officeForm.user_id || !officeForm.email.trim()) {
      toast({ title: b('Choose a board member and enter an email address', 'اختر عضو المجلس وأدخل بريداً إلكترونياً'), variant: 'destructive' });
      return;
    }
    setSavingOffice(true);
    try {
      const res = editingOfficeId
        ? await restClient.put(`/api/board/meetings/offices/${editingOfficeId}`, officeForm)
        : await restClient.post('/api/board/meetings/offices', officeForm);
      if (!res.data?.success) {
        toast({ title: res.data?.message || b('Could not save', 'تعذّر الحفظ'), variant: 'destructive' });
        return;
      }
      toast({ title: editingOfficeId
        ? b('Office contact updated', 'تم تحديث جهة اتصال المكتب')
        : b('Office contact saved', 'تم حفظ جهة اتصال المكتب') });
      setEditingOfficeId(null);
      setOfficeForm({ user_id: '', office_name: '', email: '', phone: '' });
      fetchOffices();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not save', 'تعذّر الحفظ'), variant: 'destructive' });
    } finally {
      setSavingOffice(false);
    }
  };

  const removeOffice = async (id: string) => {
    try {
      await restClient.delete(`/api/board/meetings/offices/${id}`);
      fetchOffices();
    } catch {
      toast({ title: b('Could not remove', 'تعذّرت الإزالة'), variant: 'destructive' });
    }
  };

  // ── Board-wide quorum rule ──────────────────────────────────────
  const [boardSettings, setBoardSettings] = useState<any>(null);
  const [quorumDraft, setQuorumDraft] = useState('');

  const fetchBoardSettings = async () => {
    try {
      const res = await restClient.get('/api/board/meetings/settings');
      const s = res.data?.data || null;
      setBoardSettings(s);
      setQuorumDraft(s?.quorum_required != null ? String(s.quorum_required) : '');
    } catch {
      setBoardSettings(null);
    }
  };

  const saveQuorum = async () => {
    try {
      const res = await restClient.put('/api/board/meetings/settings', {
        quorum_required: quorumDraft === '' ? null : Number(quorumDraft),
      });
      if (!res.data?.success) {
        toast({ title: res.data?.message || b('Could not save', 'تعذّر الحفظ'), variant: 'destructive' });
        return;
      }
      toast({ title: b('Quorum saved', 'تم حفظ النصاب') });
      fetchBoardSettings();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not save', 'تعذّر الحفظ'), variant: 'destructive' });
    }
  };

  // ── Recommendation implementation tracking ──────────────────────
  const [recSummary, setRecSummary] = useState<any>(null);

  const fetchRecommendations = async () => {
    try {
      const res = await restClient.get('/api/board/recommendations/summary');
      setRecSummary(res.data?.data || null);
    } catch {
      setRecSummary(null);
    }
  };

  const updateTracking = async (id: string, patch: any) => {
    try {
      const res = await restClient.put(`/api/board/directives/${id}/tracking`, patch);
      if (!res.data?.success) {
        toast({ title: res.data?.message || b('Could not save', 'تعذّر الحفظ'), variant: 'destructive' });
        return;
      }
      fetchRecommendations();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not save', 'تعذّر الحفظ'), variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchBoardSettings();
    fetchRecommendations();
    fetchOffices();
  }, []);

  const fmt = (iso: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString(isRTL ? 'ar-AE' : 'en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const joinWindowOpen = (m: any) => {
    if (!m.scheduled_at) return false;
    const start = new Date(m.scheduled_at).getTime();
    const end = start + (Number(m.duration_minutes) || 60) * 60000;
    const now = Date.now();
    return now >= start - 15 * 60000 && now <= end + 60 * 60000;
  };

  // Past meetings archived by year, which is how minutes are asked for.
  const pastByYear = past.reduce((acc: Record<string, any[]>, m: any) => {
    const y = m.scheduled_at ? new Date(m.scheduled_at).getFullYear().toString() : '—';
    (acc[y] = acc[y] || []).push(m);
    return acc;
  }, {});

  // Board meetings began in 2022, so every year from then is shown even when
  // empty — an empty 2023 folder is the prompt to fill it, whereas a missing
  // one just looks like the archive stops there.
  const BOARD_FIRST_YEAR = 2022;
  const archiveYears = (() => {
    const years = new Set<string>(Object.keys(pastByYear));
    for (let y = BOARD_FIRST_YEAR; y <= new Date().getFullYear(); y++) years.add(String(y));
    return Array.from(years).filter((y) => y !== '—').sort((a, b2) => b2.localeCompare(a));
  })();

  // ── Recording a meeting held before the platform existed ─────────
  const [showHistoricalForm, setShowHistoricalForm] = useState(false);
  const [savingHistorical, setSavingHistorical] = useState(false);
  const [historicalForm, setHistoricalForm] = useState({
    title: '', title_ar: '', agenda: '', scheduled_at: '', location: '',
  });

  const createHistorical = async () => {
    if (!historicalForm.title.trim() || !historicalForm.scheduled_at) {
      toast({
        title: b('A title and the date it was held are required', 'العنوان وتاريخ الانعقاد مطلوبان'),
        variant: 'destructive',
      });
      return;
    }
    setSavingHistorical(true);
    try {
      const res = await restClient.post('/api/board/meetings/historical', historicalForm);
      if (!res.data?.success) {
        toast({ title: res.data?.message || b('Could not record the meeting', 'تعذّر تسجيل الاجتماع'), variant: 'destructive' });
        return;
      }
      toast({ title: b('Meeting added to the archive', 'تمت إضافة الاجتماع إلى الأرشيف') });
      setShowHistoricalForm(false);
      setHistoricalForm({ title: '', title_ar: '', agenda: '', scheduled_at: '', location: '' });
      fetchMeetings();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not record the meeting', 'تعذّر تسجيل الاجتماع'), variant: 'destructive' });
    } finally {
      setSavingHistorical(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />

      {/* pt-20 clears the fixed header, matching the other dashboards. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {b('Board Secretariat', 'أمانة المجلس')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {b('Schedule board meetings, keep the attendance record, and track implementation of board recommendations.',
                 'جدولة اجتماعات المجلس وحفظ سجل الحضور ومتابعة تنفيذ توصيات المجلس.')}
            </p>
          </div>
          {/* Only offer this to someone who can actually open it (#393).
              /executive is the board MEMBER dashboard and does not admit
              board_operator — by design, since a member attends and reads while
              the secretary runs the cycle from this page. Showing the button
              regardless sent the Board Secretary to "This page is not available
              to your role" and was reported as missing access. Gated through
              canOpenPath so it tracks the router rather than a second copy of
              the role list (the #353 lesson). */}
          {canOpenPath('/executive', myRoles) && (
            <Button onClick={() => navigate('/executive')} variant="outline" size="sm">
              {b('Open board dashboard', 'فتح لوحة المجلس')}
            </Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="meetings">{b('Meetings', 'الاجتماعات')}</TabsTrigger>
            <TabsTrigger value="attendance">{b('Attendance', 'الحضور')}</TabsTrigger>
            <TabsTrigger value="recommendations">{b('Recommendations', 'التوصيات')}</TabsTrigger>
            <TabsTrigger value="minutes">{b('Minutes', 'المحاضر')}</TabsTrigger>
            <TabsTrigger value="offices">{b('Offices', 'المكاتب')}</TabsTrigger>
          </TabsList>

          {/* ── Meetings ─────────────────────────────────────────── */}
          <TabsContent value="meetings" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5 text-ehrdc-teal" />
                    {b('Upcoming meetings', 'الاجتماعات القادمة')}
                  </CardTitle>
                  <CardDescription>
                    {b('Scheduling a meeting notifies every board member.',
                       'جدولة اجتماع تُشعر جميع أعضاء المجلس.')}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => { if (showForm) { setShowForm(false); resetForm(); } else { resetForm(); setShowForm(true); } }}
                  className="gap-2 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  {b('Schedule meeting', 'جدولة اجتماع')}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showForm && (
                  <div className="rounded-lg border bg-white p-4 space-y-4">
                    <p className="text-sm font-medium text-gray-900">
                      {editingId
                        ? b('Edit meeting — members are notified only if you change the date or time',
                            'تعديل الاجتماع — يتم إشعار الأعضاء فقط عند تغيير التاريخ أو الوقت')
                        : b('New meeting', 'اجتماع جديد')}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="bm-title">{b('Title', 'العنوان')}</Label>
                        <Input
                          id="bm-title"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          placeholder={b('e.g. Q3 Board Meeting', 'مثال: اجتماع المجلس للربع الثالث')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bm-title-ar">{b('Title (Arabic)', 'العنوان بالعربية')}</Label>
                        <Input
                          id="bm-title-ar"
                          value={form.title_ar}
                          onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bm-when">{b('Date and time', 'التاريخ والوقت')}</Label>
                        <Input
                          id="bm-when"
                          type="datetime-local"
                          value={form.scheduled_at}
                          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bm-duration">{b('Duration (minutes)', 'المدة (دقائق)')}</Label>
                        <Input
                          id="bm-duration"
                          type="number"
                          min={15}
                          max={480}
                          value={form.duration_minutes}
                          onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bm-agenda">{b('Agenda', 'جدول الأعمال')}</Label>
                      <Textarea
                        id="bm-agenda"
                        rows={3}
                        value={form.agenda}
                        onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.is_virtual}
                          onChange={(e) => setForm({ ...form, is_virtual: e.target.checked })}
                        />
                        {b('Held online', 'يُعقد عبر الإنترنت')}
                      </label>
                      {!form.is_virtual && (
                        <Input
                          className="max-w-xs"
                          value={form.location}
                          onChange={(e) => setForm({ ...form, location: e.target.value })}
                          placeholder={b('Location', 'المكان')}
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={createMeeting} disabled={saving} className="gap-2">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {editingId ? b('Save changes', 'حفظ التغييرات') : b('Schedule', 'جدولة')}
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                        {b('Cancel', 'إلغاء')}
                      </Button>
                    </div>
                  </div>
                )}

                {meetingsLoading ? (
                  <p className="text-sm text-gray-500">{b('Loading…', 'جارٍ التحميل…')}</p>
                ) : upcoming.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {b('No upcoming meetings scheduled.', 'لا توجد اجتماعات قادمة مجدولة.')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((m) => (
                      <div key={m.id} className="rounded-lg border p-4 flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{isRTL && m.title_ar ? m.title_ar : m.title}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            {fmt(m.scheduled_at)} · {m.duration_minutes} {b('min', 'دقيقة')}
                          </p>
                          {!m.is_virtual && m.location && (
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <MapPin className="h-3.5 w-3.5" />{m.location}
                            </p>
                          )}
                          {m.agenda && <AgendaList agenda={m.agenda} className="mt-2" />}
                          <p className="text-xs text-gray-500 mt-2">
                            {b(`${m.attendee_count ?? 0} invited`, `${m.attendee_count ?? 0} مدعو`)}
                            {m.quorum_required != null && (
                              <> · {b(`quorum ${m.quorum_required}`, `النصاب ${m.quorum_required}`)}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.status === 'in_progress' && (
                            <Badge className="bg-emerald-100 text-emerald-800">{b('In progress', 'جارٍ')}</Badge>
                          )}
                          {m.is_virtual && joinWindowOpen(m) && (
                            <Button size="sm" onClick={() => joinMeeting(m)} disabled={joiningId === m.id} className="gap-2">
                              {joiningId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                              {b('Join', 'انضمام')}
                            </Button>
                          )}
                          {m.status === 'in_progress' && (
                            <Button size="sm" variant="outline" onClick={() => endMeeting(m)}>
                              {b('Close meeting', 'إنهاء الاجتماع')}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setAddingTo(m)}>
                            {b('Add attendees', 'إضافة حضور')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(m)}>
                            {b('Edit', 'تعديل')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => cancelMeeting(m)}
                          >
                            {b('Cancel meeting', 'إلغاء الاجتماع')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meetings that have been held.
                Closing a meeting moves it out of "Upcoming", and this tab used
                to show nothing else — so to the secretary who had just ended
                one, it had DISAPPEARED (fb_1787141548). It was never lost: it
                was still reachable under Attendance and Minutes, and the board
                members' own portal listed it. But those are different tabs, and
                the meetings list is where you look for a meeting.
                `past` is already fetched for those tabs; this only shows it. */}
            {past.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-ehrdc-teal" />
                    {b('Recently held', 'اجتماعات سابقة')}
                  </CardTitle>
                  <CardDescription>
                    {b('Meetings that have been closed. Attendance and minutes for each are on their own tabs.',
                       'الاجتماعات المنتهية. الحضور والمحاضر لكل اجتماع في علامات التبويب الخاصة بها.')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {past.slice(0, 5).map((m) => (
                      <div key={m.id} className="rounded-lg border p-4 flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{isRTL && m.title_ar ? m.title_ar : m.title}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            {fmt(m.scheduled_at)}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {b(`${m.attended_count ?? 0} of ${m.attendee_count ?? 0} attended`,
                               `حضر ${m.attended_count ?? 0} من ${m.attendee_count ?? 0}`)}
                          </p>
                        </div>
                        <Badge className={m.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-slate-100 text-slate-700'}>
                          {m.status === 'cancelled' ? b('Cancelled', 'ملغى') : b('Held', 'منعقد')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gavel className="h-5 w-5 text-ehrdc-teal" />
                  {b('Board quorum rule', 'قاعدة نصاب المجلس')}
                </CardTitle>
                <CardDescription>
                  {b('A fixed board-wide rule. Each meeting keeps the rule that applied when it was created, so changing it never rewrites whether a past meeting was quorate.',
                     'قاعدة ثابتة على مستوى المجلس. يحتفظ كل اجتماع بالقاعدة السارية عند إنشائه، لذا لا يؤثر تغييرها على اكتمال نصاب الاجتماعات السابقة.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                <div>
                  <Label htmlFor="quorum">{b('Members required', 'عدد الأعضاء المطلوب')}</Label>
                  <Input
                    id="quorum"
                    type="number"
                    min={1}
                    className="w-32"
                    value={quorumDraft}
                    onChange={(e) => setQuorumDraft(e.target.value)}
                  />
                </div>
                <Button onClick={saveQuorum} size="sm">{b('Save', 'حفظ')}</Button>
                <p className="text-xs text-gray-500">
                  {boardSettings?.quorum_required != null
                    ? b(`Currently ${boardSettings.quorum_required} members.`, `حالياً ${boardSettings.quorum_required} أعضاء.`)
                    : b('No quorum rule set yet.', 'لم يتم تحديد نصاب بعد.')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Attendance ───────────────────────────────────────── */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-ehrdc-teal" />
                  {b('Attendance record', 'سجل الحضور')}
                </CardTitle>
                <CardDescription>
                  {b('Who attended each closed meeting, against the quorum that applied to it.',
                     'من حضر كل اجتماع منتهٍ، مقارنةً بالنصاب الساري عليه.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {past.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {b('No meetings have been closed yet.', 'لم يتم إنهاء أي اجتماع بعد.')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {past.map((m) => {
                      const quorate = m.quorum_required != null && (m.attended_count ?? 0) >= m.quorum_required;
                      return (
                        <div key={m.id} className="rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{isRTL && m.title_ar ? m.title_ar : m.title}</p>
                            <p className="text-sm text-gray-600">{fmt(m.scheduled_at)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button size="sm" variant="ghost" onClick={() => openAttendance(m)}>
                              {attendanceFor === m.id
                                ? b('Hide detail', 'إخفاء التفاصيل')
                                : b('Attendance detail', 'تفاصيل الحضور')}
                            </Button>
                            <span className="text-sm text-gray-700">
                              {b(`${m.attended_count ?? 0} of ${m.attendee_count ?? 0} attended`,
                                 `حضر ${m.attended_count ?? 0} من ${m.attendee_count ?? 0}`)}
                            </span>
                            {m.quorum_required == null ? (
                              <Badge variant="outline">{b('No quorum rule', 'بدون نصاب')}</Badge>
                            ) : (
                              <Badge className={quorate ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                {quorate ? b('Quorate', 'مكتمل النصاب') : b('Not quorate', 'غير مكتمل النصاب')}
                              </Badge>
                            )}
                          </div>
                          {attendanceFor === m.id && (
                            <div className="w-full mt-3 border-t pt-3">
                              {!attendance ? (
                                <p className="text-sm text-gray-500">{b('Loading…', 'جارٍ التحميل…')}</p>
                              ) : attendance.attendees?.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  {b('No attendance was recorded for this meeting.', 'لم يُسجَّل حضور لهذا الاجتماع.')}
                                </p>
                              ) : (
                                <>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-xs text-gray-500 text-start">
                                          <th className="text-start font-medium py-1">{b('Member', 'العضو')}</th>
                                          <th className="text-start font-medium py-1">{b('Joined', 'الانضمام')}</th>
                                          <th className="text-start font-medium py-1">{b('Left', 'المغادرة')}</th>
                                          <th className="text-start font-medium py-1">{b('Present for', 'مدة الحضور')}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {attendance.attendees.map((a: any) => (
                                          <tr key={a.user_id} className="border-t">
                                            <td className="py-1.5">
                                              {a.name}
                                              {a.session_count > 1 && (
                                                <span className="ms-2 text-xs text-amber-700">
                                                  {b(`rejoined ${a.session_count - 1}×`, `عاد ${a.session_count - 1}×`)}
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-1.5 text-gray-600">
                                              {a.first_joined_at
                                                ? new Date(a.first_joined_at).toLocaleTimeString(isRTL ? 'ar-AE' : 'en-GB',
                                                    { hour: '2-digit', minute: '2-digit' })
                                                : b('did not join', 'لم ينضم')}
                                            </td>
                                            <td className="py-1.5 text-gray-600">
                                              {a.last_left_at
                                                ? new Date(a.last_left_at).toLocaleTimeString(isRTL ? 'ar-AE' : 'en-GB',
                                                    { hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                            </td>
                                            <td className="py-1.5">
                                              {fmtDuration(a.present_seconds)}
                                              {a.present_percent != null && (
                                                <span className="text-xs text-gray-500 ms-1">({a.present_percent}%)</span>
                                              )}
                                              {a.duration_is_upper_bound && (
                                                <span className="text-xs text-amber-700 ms-1" title={b(
                                                  'This member never signalled leaving, so the interval was closed when the meeting was. Treat the duration as an upper bound.',
                                                  'لم يُسجَّل خروج هذا العضو، لذا أُغلقت الفترة عند انتهاء الاجتماع. اعتبر المدة حداً أعلى.')}>
                                                  {b('(up to)', '(حتى)')}
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {b('Duration is the total time actually in the room, so a member who dropped out and rejoined is not credited with the time they were away. Percentages are against how long the meeting ran.',
                                       'المدة هي إجمالي الوقت داخل الغرفة فعلياً، فلا تُحتسب فترة الانقطاع ضمن الحضور. النسب محسوبة على مدة انعقاد الاجتماع.')}
                                  </p>
                                </>
                              )}
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

          {/* ── Recommendations ──────────────────────────────────── */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {b('Implementation of board recommendations', 'تنفيذ توصيات المجلس')}
                </CardTitle>
                <CardDescription>
                  {b('Percentages are recorded by the owner of each recommendation. The platform never infers them.',
                     'يتم تسجيل النسب من قبل مالك كل توصية. لا تقوم المنصة باستنتاجها.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!recSummary ? (
                  <p className="text-sm text-gray-500">{b('Loading…', 'جارٍ التحميل…')}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-2xl font-semibold text-emerald-700">{recSummary.counts?.completed ?? 0}</p>
                        <p className="text-xs text-gray-600 mt-1">{b('Completed', 'مكتملة')}</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-2xl font-semibold text-blue-700">{recSummary.counts?.in_progress ?? 0}</p>
                        <p className="text-xs text-gray-600 mt-1">{b('In progress', 'قيد التنفيذ')}</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-2xl font-semibold text-amber-700">{recSummary.counts?.outstanding ?? 0}</p>
                        <p className="text-xs text-gray-600 mt-1">{b('Outstanding', 'معلقة')}</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-2xl font-semibold text-gray-900">
                          {recSummary.overall_completion_percent == null ? b('Not set', 'غير محددة') : `${recSummary.overall_completion_percent}%`}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{b('Overall completion', 'نسبة الإنجاز الكلية')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {recSummary.overall_completion_percent == null
                        ? b('No recommendation has a recorded percentage yet.', 'لم تُسجَّل نسبة لأي توصية بعد.')
                        : `${b('Completed counts as 100%, outstanding as 0%; in-progress uses the percentage its owner recorded.', 'المكتملة تُحتسب 100%، والمعلقة 0%، وقيد التنفيذ حسب النسبة التي سجّلها مالكها.')} ${recSummary.assessed}/${recSummary.total_tracked} ${b('have a percentage recorded.', 'منها سُجِّلت لها نسبة.')}`}
                    </p>
                    {/* By action owner.
                        Chairman's decision 2026-08-21: no board member engagement
                        percentage; accountability is related to the OWNER OF THE
                        ACTION. So this shows who is accountable and what is late,
                        and deliberately shows no score for the person — the
                        percentages belong to the actions listed below. */}
                    {(recSummary.by_owner || []).length > 0 && (
                      <div className="rounded-lg border">
                        <div className="border-b px-4 py-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {b('By action owner', 'حسب مالك الإجراء')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {b('Who is accountable, and what is overdue. No score is calculated for a person.',
                               'من المسؤول، وما هو المتأخر. لا تُحتسب أي درجة للأشخاص.')}
                          </p>
                        </div>
                        <div className="divide-y">
                          {(recSummary.by_owner || []).map((g: any, i: number) => (
                            <div key={g.owner_id || `entity-${i}`}
                                 className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                              <div className="min-w-0">
                                <p dir="auto" className="text-sm font-medium text-gray-900">
                                  {[g.owner_name, g.owner_entity].filter(Boolean).join(' · ')
                                    || b('No owner assigned', 'لم يتم تعيين مالك')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {g.counts.completed} {b('completed', 'مكتملة')}
                                  {' · '}{g.counts.in_progress} {b('in progress', 'قيد التنفيذ')}
                                  {' · '}{g.counts.outstanding} {b('outstanding', 'معلقة')}
                                </p>
                              </div>
                              {g.overdue > 0 && (
                                <Badge className="bg-red-100 text-red-800">
                                  {g.overdue} {b('overdue', 'متأخرة')}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {(recSummary.items || []).map((it: any) => (
                        /* Overdue is decided by the server (six months open, or a
                           due date gone by) so the rule lives in one place. */
                        <div key={it.id}
                             className={`rounded-lg border p-3 ${
                               it.overdue ? 'border-red-300 bg-red-50/60' : ''}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p dir="auto" className="text-sm font-medium text-gray-900">{it.title}</p>
                              <p className="text-xs text-gray-500">
                                {/* A person, an entity, both, or an honest neither. */}
                                {[it.owner_name, it.owner_entity].filter(Boolean).join(' · ')
                                  || b('No owner assigned', 'لم يتم تعيين مالك')}
                              </p>
                              {/* Who recorded the figure.
                                  The secretary may record progress on a member's
                                  behalf (owner ruling 2026-08-21). Since that
                                  figure is what the board is now held to, a
                                  percentage entered by someone other than the
                                  owner has to read as such rather than as the
                                  owner's own statement. */}
                              {it.recorded_on_behalf && it.completion_updated_by_name && (
                                <p dir="auto" className="mt-1 text-xs text-gray-500">
                                  {b(`Progress recorded by ${it.completion_updated_by_name}`,
                                     `سجّل التقدّم ${it.completion_updated_by_name}`)}
                                </p>
                              )}
                              {it.overdue && (
                                <p className="mt-1 text-xs font-medium text-red-700">
                                  {it.overdue_reason === 'past_due'
                                    ? b('Past its due date', 'تجاوزت تاريخ الاستحقاق')
                                    : it.overdue_reason === 'past_due_and_stale'
                                      ? b(`Past its due date, and open ${Math.floor((it.days_open || 0) / 30)} months`,
                                          `تجاوزت تاريخ الاستحقاق ومفتوحة منذ ${Math.floor((it.days_open || 0) / 30)} شهراً`)
                                      : b(`Open ${Math.floor((it.days_open || 0) / 30)} months without completion`,
                                          `مفتوحة منذ ${Math.floor((it.days_open || 0) / 30)} شهراً دون إنجاز`)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                value={(it.status || 'outstanding').toLowerCase()}
                                onChange={(e) => updateTracking(it.id, { status: e.target.value })}
                              >
                                <option value="outstanding">{b('Outstanding', 'معلقة')}</option>
                                <option value="in_progress">{b('In progress', 'قيد التنفيذ')}</option>
                                <option value="completed">{b('Completed', 'مكتملة')}</option>
                                <option value="deferred">{b('Deferred', 'مؤجلة')}</option>
                                <option value="cancelled">{b('Cancelled', 'ملغاة')}</option>
                              </select>
                              <input
                                type="number" min={0} max={100}
                                defaultValue={it.completion_percent ?? ''}
                                placeholder="%"
                                onBlur={(e) => {
                                  const v = e.target.value;
                                  if (v === '' || Number(v) === it.completion_percent) return;
                                  updateTracking(it.id, { completion_percent: Number(v) });
                                }}
                                className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs"
                                aria-label={b('Completion percent', 'نسبة الإنجاز')}
                              />
                            </div>
                          </div>
                          {/* Assigning responsibility was impossible from here:
                              the tracking endpoint already accepted owner_id,
                              but nothing in the product ever sent it, so every
                              row read "No owner assigned" for good (#397).
                              A person AND an entity, because accountability for
                              a board recommendation often sits with a
                              department rather than an individual. */}
                          {/* Which meeting this recommendation came out of.
                              The column existed and nothing ever wrote it, so
                              every recommendation was unlinked and could not be
                              grouped under its meeting (GH #459). Past meetings
                              first — a recommendation is made AT a sitting, so
                              the one being recorded is almost always recent. */}
                          <div className="mt-2">
                            <label className="text-[11px] text-gray-500"
                                   htmlFor={`mtg-${it.id}`}>
                              {b('From meeting', 'من اجتماع')}
                            </label>
                            <select
                              id={`mtg-${it.id}`}
                              className="mt-0.5 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                              value={it.meeting_id || ''}
                              onChange={(e) => updateTracking(it.id, { meeting_id: e.target.value })}
                            >
                              <option value="">{b('Not linked to a meeting', 'غير مرتبطة باجتماع')}</option>
                              {[...past, ...upcoming].map((m: any) => (
                                <option key={m.id} value={m.id}>
                                  {(isRTL && m.title_ar ? m.title_ar : m.title)}
                                  {m.scheduled_at ? ` — ${fmt(m.scheduled_at)}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <div>
                              <label className="text-[11px] text-gray-500"
                                     htmlFor={`own-${it.id}`}>
                                {b('Responsible member', 'العضو المسؤول')}
                              </label>
                              <select
                                id={`own-${it.id}`}
                                className="mt-0.5 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                value={it.owner_id || ''}
                                onChange={(e) => updateTracking(it.id, { owner_id: e.target.value })}
                              >
                                <option value="">{b('Not assigned', 'غير محدد')}</option>
                                {offices.map((m: any) => (
                                  <option key={m.user_id} value={m.user_id}>{m.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500"
                                     htmlFor={`ent-${it.id}`}>
                                {b('Responsible entity', 'الجهة المسؤولة')}
                              </label>
                              <Input
                                id={`ent-${it.id}`}
                                defaultValue={it.owner_entity || ''}
                                placeholder={b('e.g. DGHR Policy', 'مثال: سياسات الموارد البشرية')}
                                className="mt-0.5 h-8 text-xs"
                                onBlur={(e) => {
                                  const v = e.target.value.trim();
                                  if (v === (it.owner_entity || '')) return;
                                  updateTracking(it.id, { owner_entity: v });
                                }}
                              />
                            </div>
                          </div>

                          {/* The secretary's lever over the red flag. Setting a
                              future date says "this has been looked at and is
                              expected by then", which holds the six-month rule
                              off until the date arrives. Deferring on its own
                              does not clear it — a deferral with no new date is
                              the case the board asked to keep seeing. */}
                          <div className="mt-2">
                            <label className="text-[11px] text-gray-500" htmlFor={`due-${it.id}`}>
                              {b('Expected by', 'متوقّع بحلول')}
                            </label>
                            <Input
                              id={`due-${it.id}`}
                              type="date"
                              defaultValue={it.due_date || ''}
                              className="mt-0.5 h-8 w-44 text-xs"
                              onChange={(e) => {
                                if ((e.target.value || '') === (it.due_date || '')) return;
                                updateTracking(it.id, { due_date: e.target.value || null });
                              }}
                            />
                            <p className="mt-1 text-[11px] text-gray-500">
                              {b('A future date pauses the six-month overdue flag until it passes.',
                                 'التاريخ المستقبلي يوقف مؤشر التأخر لستة أشهر حتى يحين موعده.')}
                            </p>
                          </div>

                          <p className="text-xs text-gray-500 mt-2">
                            {it.completion_percent == null
                              ? b('Progress not yet recorded', 'لم يتم تسجيل التقدم بعد')
                              : b(`${it.completion_percent}% recorded`, `تم تسجيل ${it.completion_percent}%`)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Minutes ──────────────────────────────────────────── */}
          <TabsContent value="minutes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Archive className="h-5 w-5 text-ehrdc-teal" />
                  {b('Minutes archive', 'أرشيف المحاضر')}
                </CardTitle>
                <CardDescription>
                  {b('Meetings held, grouped by year.', 'الاجتماعات المنعقدة، مجمّعة حسب السنة.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* The hold message that stood here — "uploading minutes is not
                    available yet" — was correct until 2026-08-11, when the
                    object store's backup was confirmed, including individual-
                    file restore. Minutes now attach to each meeting below. */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {b(`Board meetings from ${BOARD_FIRST_YEAR} onwards.`, `اجتماعات المجلس من ${BOARD_FIRST_YEAR} فصاعداً.`)}
                  </p>
                  <Button size="sm" variant="outline" className="gap-2"
                          onClick={() => setShowHistoricalForm((v) => !v)}>
                    <Plus className="h-4 w-4" />
                    {b('Add a past meeting', 'إضافة اجتماع سابق')}
                  </Button>
                </div>

                {showHistoricalForm && (
                  <div className="rounded-lg border bg-white p-4 space-y-4">
                    <p className="text-sm font-medium text-gray-900">
                      {b('Record a meeting held before the platform',
                         'تسجيل اجتماع عُقد قبل المنصة')}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="h-title">{b('Title', 'العنوان')}</Label>
                        <Input id="h-title" value={historicalForm.title}
                               onChange={(e) => setHistoricalForm({ ...historicalForm, title: e.target.value })}
                               placeholder={b('e.g. Board Meeting 1/2022', 'مثال: اجتماع المجلس ١/٢٠٢٢')} />
                      </div>
                      <div>
                        <Label htmlFor="h-title-ar">{b('Title (Arabic)', 'العنوان بالعربية')}</Label>
                        <Input id="h-title-ar" dir="rtl" value={historicalForm.title_ar}
                               onChange={(e) => setHistoricalForm({ ...historicalForm, title_ar: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="h-when">{b('Date held', 'تاريخ الانعقاد')}</Label>
                        <Input id="h-when" type="datetime-local" value={historicalForm.scheduled_at}
                               onChange={(e) => setHistoricalForm({ ...historicalForm, scheduled_at: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="h-loc">{b('Location', 'المكان')}</Label>
                        <Input id="h-loc" value={historicalForm.location}
                               onChange={(e) => setHistoricalForm({ ...historicalForm, location: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="h-agenda">{b('Agenda or notes', 'جدول الأعمال أو ملاحظات')}</Label>
                      <Textarea id="h-agenda" rows={3} value={historicalForm.agenda}
                                onChange={(e) => setHistoricalForm({ ...historicalForm, agenda: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={createHistorical} disabled={savingHistorical} className="gap-2">
                        {savingHistorical && <Loader2 className="h-4 w-4 animate-spin" />}
                        {b('Add to archive', 'إضافة إلى الأرشيف')}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowHistoricalForm(false)}>
                        {b('Cancel', 'إلغاء')}
                      </Button>
                    </div>
                  </div>
                )}

                {archiveYears.map((year) => {
                  const items = pastByYear[year] || [];
                  return (
                    <div key={year}>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        {year}
                        <span className="ms-2 text-xs font-normal text-gray-500">
                          {items.length
                            ? b(`${items.length} meeting${items.length > 1 ? 's' : ''}`, `${items.length} اجتماع`)
                            : b('no meetings recorded', 'لا اجتماعات مسجّلة')}
                        </span>
                      </h4>
                      {items.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-3 text-xs text-gray-500">
                          {b('Nothing recorded for this year yet. Use "Add a past meeting" to enter one.',
                             'لم يُسجَّل شيء لهذه السنة بعد. استخدم "إضافة اجتماع سابق" لإدخال اجتماع.')}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {items.map((m: any) => (
                            <div key={m.id} className="rounded-lg border p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {isRTL && m.title_ar ? m.title_ar : m.title}
                                  </p>
                                  <p className="text-xs text-gray-600">{fmt(m.scheduled_at)}</p>
                                  {/* Title and date only.
                                      "Additional details, such as the meeting agenda ... could be
                                      excluded from the main archive view to keep the list concise
                                      and easy to navigate" (fb_1787250696). The agenda belongs to
                                      the meeting, not to its archive entry — it is still on the
                                      meeting itself and in the minutes document. An archive is
                                      scanned to FIND a record, and every extra line makes that
                                      slower as the years accumulate. */}
                                </div>
                                {m.is_historical && (
                                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] text-gray-600 bg-gray-50"
                                        title={b('Held before the platform and entered for the archive, so no attendance was captured.',
                                                 'عُقد قبل المنصة وأُدخل للأرشيف، لذا لم يُسجَّل الحضور.')}>
                                    {b('Archived record', 'سجل مؤرشف')}
                                  </span>
                                )}
                              </div>
                              <BoardMinutesPanel meetingId={m.id} compact />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Offices ──────────────────────────────────────────── */}
          <TabsContent value="offices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {b("Board members' offices", 'مكاتب أعضاء المجلس')}
                </CardTitle>
                <CardDescription>
                  {b('Offices are notified with the meeting details whenever a meeting is scheduled, rescheduled or cancelled.',
                     'تُبلَّغ المكاتب بتفاصيل الاجتماع عند جدولته أو تغييره أو إلغائه.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Say plainly that nothing is going out yet. A secretary who
                    assumes an office was told will not follow up by phone. */}
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    {b('Email delivery is not switched on yet', 'إرسال البريد الإلكتروني غير مُفعَّل بعد')}
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    {b('Outbound email is blocked on the network, so notices to these offices are queued rather than sent. They are listed below with the exact wording, so they can be forwarded by hand in the meantime. Nothing will need re-entering once email is enabled — the queue will go out on its own.',
                       'البريد الصادر محجوب على الشبكة، لذا تُدرَج الإشعارات لهذه المكاتب في قائمة انتظار بدلاً من إرسالها. وهي مدرجة أدناه بنصّها الكامل ليتم تحويلها يدوياً في هذه الأثناء. ولن يحتاج أي شيء إلى إعادة إدخال عند تفعيل البريد.')}
                  </p>
                </div>

                <div ref={officeFormRef}
                     className={`rounded-lg border bg-white p-4 space-y-4 ${
                       editingOfficeId ? 'border-ehrdc-teal ring-1 ring-ehrdc-teal/30' : ''}`}>
                  {editingOfficeId && (
                    <p className="text-sm font-medium text-ehrdc-teal">
                      {b('Editing an existing office — saving changes this contact rather than adding another.',
                         'تعديل مكتب قائم — الحفظ يغيّر جهة الاتصال هذه ولا يضيف أخرى.')}
                    </p>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="o-member">{b('Board member', 'عضو المجلس')}</Label>
                      <select
                        id="o-member"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        value={officeForm.user_id}
                        /* Moving a contact to a different member is not an edit;
                           it is a removal and a new entry. */
                        disabled={!!editingOfficeId}
                        onChange={(e) => setOfficeForm({ ...officeForm, user_id: e.target.value })}
                      >
                        <option value="">{b('Select…', 'اختر…')}</option>
                        {offices.map((m) => (
                          <option key={m.user_id} value={m.user_id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="o-email">{b('Office email', 'بريد المكتب')}</Label>
                      <Input id="o-email" type="email" value={officeForm.email}
                             onChange={(e) => setOfficeForm({ ...officeForm, email: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="o-name">{b('Office name (optional)', 'اسم المكتب (اختياري)')}</Label>
                      <Input id="o-name" value={officeForm.office_name}
                             onChange={(e) => setOfficeForm({ ...officeForm, office_name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="o-phone">{b('Phone (optional)', 'الهاتف (اختياري)')}</Label>
                      <Input id="o-phone" value={officeForm.phone}
                             onChange={(e) => setOfficeForm({ ...officeForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addOffice} disabled={savingOffice} className="gap-2">
                      {savingOffice && <Loader2 className="h-4 w-4 animate-spin" />}
                      {editingOfficeId
                        ? b('Save changes', 'حفظ التغييرات')
                        : b('Save office contact', 'حفظ جهة اتصال المكتب')}
                    </Button>
                    {editingOfficeId && (
                      <Button variant="ghost" onClick={cancelEditOffice} disabled={savingOffice}>
                        {b('Cancel', 'إلغاء')}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {offices.map((m) => (
                    <div key={m.user_id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      {m.offices.length === 0 ? (
                        <p className="text-xs text-gray-500 mt-1">
                          {b('No office recorded — this member’s office will not be notified.',
                             'لم يُسجَّل مكتب — لن يتم إشعار مكتب هذا العضو.')}
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1">
                          {m.offices.map((o: any) => (
                            <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-gray-700">
                                {o.office_name ? `${o.office_name} — ` : ''}{o.email}
                                {o.phone ? ` · ${o.phone}` : ''}
                              </span>
                              <span className="flex shrink-0 items-center gap-1">
                                {/* Remove was the ONLY action here, so correcting
                                    a typo in an address meant deleting the office
                                    and re-entering it (#393). */}
                                <Button size="sm" variant="ghost"
                                        className="h-7 px-2 text-xs text-ehrdc-teal hover:bg-teal-50"
                                        onClick={() => startEditOffice(m.user_id, o)}>
                                  {b('Edit', 'تعديل')}
                                </Button>
                                <Button size="sm" variant="ghost"
                                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeOffice(o.id)}>
                                  {b('Remove', 'إزالة')}
                                </Button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{b('Queued notices', 'الإشعارات المدرَجة')}</CardTitle>
                <CardDescription>
                  {b('What is waiting to reach the offices. "Queued" means it has not been delivered.',
                     'ما ينتظر الوصول إلى المكاتب. "مدرَج" تعني أنه لم يُسلَّم بعد.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {officeQueue.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {b('Nothing queued yet. Notices appear here when a meeting is scheduled, rescheduled or cancelled.',
                       'لا شيء مدرَج بعد. تظهر الإشعارات هنا عند جدولة اجتماع أو تغييره أو إلغائه.')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {officeQueue.map((n) => (
                      <div key={n.id} className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{n.subject}</p>
                          <p className="text-xs text-gray-600">
                            {n.office_name ? `${n.office_name} — ` : ''}{n.office_email}
                            {n.member_name ? ` · ${b('office of', 'مكتب')} ${n.member_name}` : ''}
                          </p>
                        </div>
                        <Badge className={n.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : n.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'}>
                          {n.status === 'sent' ? b('Sent', 'أُرسل')
                            : n.status === 'failed' ? b('Failed', 'فشل')
                            : b('Queued — not delivered', 'مدرَج — لم يُسلَّم')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add attendees to an existing meeting.
            Guests default to NOT counting toward quorum: someone brought in to
            speak to one agenda item is not a member, and counting them would
            change the number that decides whether the board could lawfully sit.
            The backend defaults the same way; this only makes it visible. */}
        {addingTo && (
          <div
            onClick={() => setAddingTo(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {b('Add attendees', 'إضافة حضور')}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {isRTL && addingTo.title_ar ? addingTo.title_ar : addingTo.title}
              </p>

              <Input
                autoFocus
                className="mt-4"
                value={guestQuery}
                onChange={(e) => searchGuests(e.target.value)}
                placeholder={b('Search staff and board members by name or email',
                               'ابحث عن الموظفين وأعضاء المجلس بالاسم أو البريد')}
              />

              {guestPicked.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {guestPicked.map((g) => (
                    <Badge
                      key={g.id}
                      className="cursor-pointer bg-ehrdc-teal/10 text-ehrdc-teal"
                      onClick={() => setGuestPicked(guestPicked.filter((x) => x.id !== g.id))}
                    >
                      {g.name} ×
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-3 max-h-56 overflow-y-auto">
                {guestSearching ? (
                  <p className="p-2 text-sm text-gray-500">{b('Searching…', 'جارٍ البحث…')}</p>
                ) : guestQuery.trim().length < 2 ? (
                  <p className="p-2 text-sm text-gray-500">
                    {b('Type at least two characters.', 'اكتب حرفين على الأقل.')}
                  </p>
                ) : guestResults.length === 0 ? (
                  <p className="p-2 text-sm text-gray-500">{b('No matches.', 'لا توجد نتائج.')}</p>
                ) : (
                  guestResults
                    .filter((r) => !guestPicked.some((g) => g.id === r.id))
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setGuestPicked([...guestPicked, r])}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-start hover:bg-gray-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900">{r.name}</span>
                          <span className="block truncate text-xs text-gray-500">{r.email}</span>
                        </span>
                        <span className="shrink-0 text-xs text-gray-500">{r.role}</span>
                      </button>
                    ))
                )}
              </div>

              <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={guestCounts}
                  onChange={(e) => setGuestCounts(e.target.checked)}
                />
                <span>
                  {b('Counts toward quorum', 'يُحتسب ضمن النصاب')}
                  <span className="block text-xs text-gray-500">
                    {b('Leave unticked for a guest attending one item. Ticking this changes whether the meeting is quorate.',
                       'اتركه غير محدد للضيف الحاضر لبند واحد. تحديده يؤثر على اكتمال النصاب.')}
                  </span>
                </span>
              </label>

              <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={guestWaits}
                  onChange={(e) => setGuestWaits(e.target.checked)}
                />
                <span>
                  {b('Hold in the waiting room', 'الانتظار حتى الإذن بالدخول')}
                  <span className="block text-xs text-gray-500">
                    {b('They wait until you admit them, so a guest invited for one item is not in the room for the items before it. Untick for someone attending the whole meeting.',
                       'ينتظرون حتى تأذن لهم بالدخول، فلا يحضر الضيف المدعو لبند واحد بقية البنود. ألغِ التحديد لمن يحضر الاجتماع كاملاً.')}
                  </span>
                </span>
              </label>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddingTo(null)}>
                  {b('Cancel', 'إلغاء')}
                </Button>
                <Button onClick={addAttendees} disabled={guestPicked.length === 0 || guestSaving}>
                  {guestSaving
                    ? b('Adding…', 'جارٍ الإضافة…')
                    : b(`Add ${guestPicked.length || ''}`.trim(), `إضافة ${guestPicked.length || ''}`.trim())}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardSecretaryDashboard;
