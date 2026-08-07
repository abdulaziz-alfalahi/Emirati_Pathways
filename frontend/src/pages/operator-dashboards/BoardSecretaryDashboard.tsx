import React, { useEffect, useState } from 'react';
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
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { restClient } from '@/utils/api';
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

  const [tab, setTab] = useState('meetings');

  // ── Meetings ────────────────────────────────────────────────────
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
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
          <Button onClick={() => navigate('/executive')} variant="outline" size="sm">
            {b('Open board dashboard', 'فتح لوحة المجلس')}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="meetings">{b('Meetings', 'الاجتماعات')}</TabsTrigger>
            <TabsTrigger value="attendance">{b('Attendance', 'الحضور')}</TabsTrigger>
            <TabsTrigger value="recommendations">{b('Recommendations', 'التوصيات')}</TabsTrigger>
            <TabsTrigger value="minutes">{b('Minutes', 'المحاضر')}</TabsTrigger>
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
                          {m.agenda && <p className="text-sm text-gray-500 mt-2">{m.agenda}</p>}
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
                    <div className="space-y-2">
                      {(recSummary.items || []).map((it: any) => (
                        <div key={it.id} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">{it.title}</p>
                              <p className="text-xs text-gray-500">
                                {it.owner_name || b('No owner assigned', 'لم يتم تعيين مالك')}
                              </p>
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
                {/* Deliberately honest: document upload is NOT built yet because
                    the object store that would hold official governance records
                    has no confirmed backup (raised with Moro). Saying so beats
                    shipping an upload button that could lose board minutes. */}
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    {b('Uploading minutes documents is not available yet',
                       'رفع مستندات المحاضر غير متاح بعد')}
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    {b('Board minutes are official governance records, so they will only be accepted once the storage holding them has a confirmed backup. That confirmation is pending with the infrastructure provider. The meeting record below is complete and can be relied on in the meantime.',
                       'محاضر المجلس سجلات حوكمة رسمية، لذلك لن يتم قبولها إلا بعد تأكيد وجود نسخة احتياطية للتخزين الذي يحتفظ بها. هذا التأكيد قيد الانتظار من مزود البنية التحتية. سجل الاجتماعات أدناه مكتمل ويمكن الاعتماد عليه في هذه الأثناء.')}
                  </p>
                </div>

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
                                  {m.agenda && <p className="text-xs text-gray-500 mt-1">{m.agenda}</p>}
                                </div>
                                {m.is_historical && (
                                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] text-gray-600 bg-gray-50"
                                        title={b('Held before the platform and entered for the archive, so no attendance was captured.',
                                                 'عُقد قبل المنصة وأُدخل للأرشيف، لذا لم يُسجَّل الحضور.')}>
                                    {b('Archived record', 'سجل مؤرشف')}
                                  </span>
                                )}
                              </div>
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
        </Tabs>
      </div>
    </div>
  );
};

export default BoardSecretaryDashboard;
