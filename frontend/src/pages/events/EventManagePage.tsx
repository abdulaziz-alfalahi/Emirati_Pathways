import React, { useEffect, useState } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import LocationPicker from '@/components/common/LocationPicker';
import { CalendarDays, QrCode, Users, Plus, Loader2, RefreshCw, Download, Pencil, Ban } from 'lucide-react';

/**
 * The CRM team's side of a recruitment open day: create it, add the employers,
 * print the poster QR, and run the desk on the day.
 *
 * The queue view is the screen that matters operationally — it is what staff
 * look at with a room in front of them — so it refreshes on demand and shows
 * arrival order, not a prettier grouping.
 */
const EventManagePage: React.FC = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  /* null = the form is creating; an id = it is editing that event. One form for
     both, so an edit cannot drift from what creation accepts. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ title: '', title_ar: '', venue: '', starts_at: '', ends_at: '', description: '', venue_lat: null, venue_lng: null });
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [selected, setSelected] = useState<any | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyResults, setCompanyResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [staffEid, setStaffEid] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any | null>(null);
  const [inviteEid, setInviteEid] = useState('');

  const load = () => {
    setLoading(true);
    restClient.get('/api/events')
      .then(r => setEvents(r.data?.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  /* Search rather than a 188-entry dropdown, which is unusable now and gets
     worse with every company onboarded. Debounced so typing a name does not
     fire a query per keystroke. */
  useEffect(() => {
    const id = setTimeout(() => {
      setSearching(true);
      restClient.get(`/api/events/employer-search?q=${encodeURIComponent(companyQuery)}`)
        .then(r => setCompanyResults(r.data?.data || []))
        .catch(() => setCompanyResults([]))
        .finally(() => setSearching(false));
    }, companyQuery ? 300 : 0);
    return () => clearTimeout(id);
  }, [companyQuery]);

  const openEvent = async (ev: any) => {
    const res = await restClient.get(`/api/events/${ev.id}`).catch(() => null);
    setSelected(res?.data?.data || ev);
    loadQueue(ev.id);
    loadInvites(ev.id);
    loadFunnel(ev.id);
  };

  const loadInvites = (id: string) =>
    restClient.get(`/api/events/${id}/invitations`)
      .then(r => setInvites(r.data?.data || [])).catch(() => setInvites([]));

  const loadFunnel = (id: string) =>
    restClient.get(`/api/events/${id}/funnel`)
      .then(r => setFunnel(r.data?.data || null)).catch(() => setFunnel(null));

  const addInvite = async () => {
    if (!inviteEid.trim() || !selected) return;
    try {
      const res = await restClient.post(`/api/events/${selected.id}/invitations`,
        { candidate_ids: [inviteEid.trim()] });
      const d = res.data?.data || {};
      toast({
        title: d.invited
          ? b('Added to the call list', 'تمت الإضافة إلى قائمة الاتصال')
          : d.already_invited
            ? b('Already on the call list', 'موجود بالفعل في قائمة الاتصال')
            : b('Not found', 'غير موجود'),
      });
      setInviteEid('');
      loadInvites(selected.id); loadFunnel(selected.id);
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not add them', 'تعذّرت الإضافة'),
              variant: 'destructive' });
    }
  };

  /* What the candidate said on the call. Recorded here because the invitation
     IS the call — there is no message to wait for a reply to. */
  const setResponse = async (candidateId: string, response: string) => {
    if (!selected) return;
    try {
      await restClient.patch(`/api/events/${selected.id}/invitations/${candidateId}`, { response });
      loadInvites(selected.id); loadFunnel(selected.id);
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not record that', 'تعذّر التسجيل'),
              variant: 'destructive' });
    }
  };

  const loadQueue = (id: string) => {
    setQueueLoading(true);
    restClient.get(`/api/events/${id}/queue`)
      .then(r => setQueue(r.data?.data || []))
      .catch(() => setQueue([]))
      .finally(() => setQueueLoading(false));
  };

  const blankForm = { title: '', title_ar: '', venue: '', starts_at: '', ends_at: '',
                      description: '', venue_lat: null, venue_lng: null };

  /* <input type="datetime-local"> wants YYYY-MM-DDTHH:mm in LOCAL time, and the
     API returns an ISO string with an offset. Slicing the ISO would silently
     shift a 12:30 event to 08:30 whenever the two disagree, so go through Date
     and read the local parts back out. */
  const toLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const startEdit = (ev: any) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title || '', title_ar: ev.title_ar || '', venue: ev.venue || '',
      starts_at: toLocalInput(ev.starts_at), ends_at: toLocalInput(ev.ends_at),
      description: ev.description || '',
      venue_lat: ev.venue_lat ?? null, venue_lng: ev.venue_lng ?? null,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(blankForm);
    setShowForm(v => !v);
  };

  const save = async () => {
    if (!form.title.trim() || !form.starts_at) {
      toast({ title: b('A title and start time are required', 'العنوان ووقت البدء مطلوبان'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await restClient.put(`/api/events/${editingId}`, form);
        toast({ title: b('Event updated', 'تم تحديث الفعالية') });
        // Keep the open detail panel in step, including anything the server
        // normalised — otherwise the panel shows the pre-edit event.
        if (selected?.id === editingId) {
          setSelected({ ...selected, ...(res.data?.data || {}) });
        }
      } else {
        await restClient.post('/api/events', form);
        toast({ title: b('Event created as a draft', 'تم إنشاء الفعالية كمسودة') });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(blankForm);
      load();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message
                || (editingId ? b('Could not update the event', 'تعذّر تحديث الفعالية')
                              : b('Could not create the event', 'تعذّر إنشاء الفعالية')),
              variant: 'destructive' });
    } finally { setSaving(false); }
  };

  /* Cancelling is not just a status flip: candidates were phoned and asked to
     attend, so the reason is required and is shown to them on the calendar. */
  const confirmCancel = async () => {
    if (!cancelTarget) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast({ title: b('Give a reason — invited candidates will see it',
                       'اذكر السبب — سيظهر للمرشحين المدعوين'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await restClient.put(`/api/events/${cancelTarget.id}`,
                                       { status: 'cancelled', cancellation_reason: reason });
      const n = res.data?.data?.notified ?? 0;
      toast({
        title: b('Event cancelled', 'تم إلغاء الفعالية'),
        description: n > 0
          ? b(`${n} ${n === 1 ? 'person was' : 'people were'} notified — invited candidates and participating employers.`,
              `تم إشعار ${n} من المدعوين وجهات التوظيف المشاركة.`)
          // Say so plainly rather than implying an announcement went out.
          : b('Nobody had been invited yet, so no notifications were sent.',
              'لم تتم دعوة أحد بعد، لذلك لم تُرسل إشعارات.'),
      });
      setCancelTarget(null); setCancelReason('');
      if (selected?.id === cancelTarget.id) setSelected({ ...selected, ...(res.data?.data || {}) });
      load();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not cancel', 'تعذّر الإلغاء'),
              variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const setStatus = async (ev: any, status: string) => {
    try {
      await restClient.put(`/api/events/${ev.id}`, { status });
      toast({
        title: status === 'published'
          ? b('Published — it is now visible to platform users', 'تم النشر — أصبحت مرئية لمستخدمي المنصة')
          : b('Updated', 'تم التحديث'),
      });
      load();
      if (selected?.id === ev.id) setSelected({ ...selected, status });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not update', 'تعذّر التحديث'), variant: 'destructive' });
    }
  };

  const addCompany = async (companyId: string) => {
    if (!companyId || !selected) return;
    try {
      const res = await restClient.post(`/api/events/${selected.id}/employers`, { company_id: companyId });
      const d = res.data?.data || {};
      setCompanyQuery('');
      openEvent(selected);
      toast({
        title: d.already_added
          ? b('Already on this event', 'مضافة بالفعل إلى هذه الفعالية')
          : b('Employer added', 'تمت إضافة جهة التوظيف'),
        // Say plainly whether anyone was actually told. Most companies have no
        // accepted team members yet, so silence here would be misleading.
        description: d.already_added ? undefined
          : d.notified
            ? b(`${d.notified} contact${d.notified === 1 ? '' : 's'} at the company notified.`,
                `تم إشعار ${d.notified} من جهات الاتصال في الشركة.`)
            : b('Nobody at that company has a platform account yet, so no notification was sent.',
                'لا يوجد لدى الشركة حساب على المنصة، لذلك لم يتم إرسال إشعار.'),
      });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not add the employer', 'تعذّرت الإضافة'),
              variant: 'destructive' });
    }
  };

  /* The QR is fetched as a blob rather than linked directly: the endpoint is
     role-guarded, so a plain <img src> would arrive without the auth header and
     404. It is also what lets us hand over a file the organiser can print. */
  const downloadQr = async (ev: any) => {
    try {
      const res = await restClient.get(`/api/events/${ev.id}/qr`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'image/svg+xml' }));
      const a = document.createElement('a');
      a.href = url; a.download = `open-day-${ev.id}-qr.svg`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: b('QR downloaded', 'تم تنزيل رمز الاستجابة'),
        description: b('Print it for the venue. Scanning it opens the check-in page for this event.',
                       'اطبعه للمكان. مسحه يفتح صفحة تسجيل الحضور لهذه الفعالية.'),
      });
    } catch (e: any) {
      toast({
        title: b('The QR could not be produced', 'تعذّر إنشاء رمز الاستجابة'),
        description: e?.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  const checkInByStaff = async () => {
    if (!staffEid.trim() || !selected) return;
    try {
      const res = await restClient.post(`/api/events/${selected.id}/check-in/staff`, { user_id: staffEid.trim() });
      const d = res.data?.data || {};
      toast({
        title: d.already_registered
          ? b(`Already registered — number ${d.queue_token}`, `مسجّل بالفعل — الرقم ${d.queue_token}`)
          : b(`Registered — number ${d.queue_token}`, `تم التسجيل — الرقم ${d.queue_token}`),
      });
      setStaffEid('');
      loadQueue(selected.id);
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not check them in', 'تعذّر تسجيل الحضور'),
              variant: 'destructive' });
    }
  };

  return (
    <>
      <HybridGovernmentNavFixed />
      <div className="mx-auto max-w-6xl px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {b('Recruitment open days', 'أيام التوظيف المفتوحة')}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {b('Create an event, add the employers attending, print the venue QR, and run the desk on the day.',
                 'أنشئ فعالية، أضف جهات التوظيف المشاركة، اطبع رمز المكان، وأدر مكتب التسجيل في يوم الفعالية.')}
            </p>
          </div>
          <Button className="gap-2" onClick={startCreate}>
            <Plus className="h-4 w-4" /> {b('New event', 'فعالية جديدة')}
          </Button>
        </div>

        {showForm && (
          <Card className="mt-5 border-slate-200">
            {editingId && (
              <CardHeader className="pb-0">
                <CardTitle className="text-base">
                  {b('Editing this event', 'تعديل هذه الفعالية')}
                </CardTitle>
                <p className="text-xs text-slate-500">
                  {b('Changes are visible to candidates as soon as you save.',
                     'تظهر التغييرات للمرشحين فور الحفظ.')}
                </p>
              </CardHeader>
            )}
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                <Label>{b('Title', 'العنوان')}</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                       placeholder={b('e.g. Al Barsha Open Day', 'مثال: يوم البرشاء المفتوح')} />
              </div>
              <div>
                <Label>{b('Title (Arabic)', 'العنوان بالعربية')}</Label>
                <Input dir="rtl" value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} />
              </div>
              <div>
                <Label>{b('Venue', 'المكان')}</Label>
                <Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{b('Starts', 'يبدأ')}</Label>
                  <Input type="datetime-local" value={form.starts_at}
                         onChange={e => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div>
                  <Label>{b('Ends', 'ينتهي')}</Label>
                  <Input type="datetime-local" value={form.ends_at}
                         onChange={e => setForm({ ...form, ends_at: e.target.value })} />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>{b('Description', 'الوصف')}</Label>
                <Textarea rows={2} value={form.description}
                          onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              {/* The venue keeps its NAME (above) and gains a PIN. A mall name
                  alone does not get an attendee to the right entrance, and the
                  whole point of the event is that people turn up. Reuses the
                  picker the JD wizard already writes job locations with. */}
              <div className="md:col-span-2">
                <Label>{b('Pin the venue on the map', 'حدد موقع المكان على الخريطة')}</Label>
                <LocationPicker
                  lat={form.venue_lat ?? undefined}
                  lng={form.venue_lng ?? undefined}
                  onLocationSelect={(lat, lng) => setForm({ ...form, venue_lat: lat, venue_lng: lng })}
                  label={b('Click the map to place the entrance', 'انقر على الخريطة لتحديد المدخل')}
                  height="240px"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {b('Optional, but attendees are far more likely to find a pinned entrance than a mall name.',
                     'اختياري، لكن العثور على مدخل محدد على الخريطة أسهل بكثير من اسم المركز فقط.')}
                </p>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button onClick={save} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? b('Save changes', 'حفظ التغييرات') : b('Create as draft', 'إنشاء كمسودة')}
                </Button>
                <Button variant="ghost"
                        onClick={() => { setShowForm(false); setEditingId(null); setForm(blankForm); }}>
                  {b('Discard', 'تجاهل')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-ehrdc-teal" /></div>
            ) : events.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                {b('No events yet.', 'لا توجد فعاليات بعد.')}
              </p>
            ) : events.map(ev => (
              <Card key={ev.id}
                    className={`cursor-pointer border transition-shadow hover:shadow-sm ${selected?.id === ev.id ? 'border-ehrdc-teal' : 'border-slate-200'}`}
                    onClick={() => openEvent(ev)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{ev.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                        <CalendarDays className="h-3 w-3" />
                        {ev.starts_at ? new Date(ev.starts_at).toLocaleString(isRTL ? 'ar-AE' : 'en-GB',
                          { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <Badge className={
                      ev.status === 'published' ? 'bg-green-50 text-green-800 border-green-200'
                      : ev.status === 'draft' ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'}>
                      {ev.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{b(`${ev.employer_count ?? 0} employers`, `${ev.employer_count ?? 0} جهة`)}</span>
                    <span>{b(`${ev.invited_count ?? 0} invited`, `${ev.invited_count ?? 0} مدعو`)}</span>
                    <span className="font-medium text-slate-700">
                      {b(`${ev.attended_count ?? 0} attended`, `${ev.attended_count ?? 0} حضر`)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selected && (
            <div className="space-y-4">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{selected.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* A cancelled event stays on the candidates' calendar rather
                      than vanishing, so the organiser needs to see exactly what
                      those candidates are being told. */}
                  {selected.status === 'cancelled' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm font-semibold text-red-900">
                        {b('This event is cancelled', 'هذه الفعالية ملغاة')}
                      </p>
                      <p className="mt-1 text-xs text-red-800">
                        {selected.cancellation_reason
                          ? b(`Candidates see: "${selected.cancellation_reason}"`,
                              `يرى المرشحون: "${selected.cancellation_reason}"`)
                          : b('No reason was recorded.', 'لم يتم تسجيل سبب.')}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'draft' && (
                      <Button size="sm" onClick={() => setStatus(selected, 'published')}>
                        {b('Publish', 'نشر')}
                      </Button>
                    )}
                    {selected.status === 'published' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(selected, 'completed')}>
                        {b('Mark completed', 'وضع علامة مكتملة')}
                      </Button>
                    )}
                    {/* Editing stays available after publishing: venues move and
                        times shift, and without it the only way to correct an
                        announced event is to cancel and re-create it — stranding
                        its invitations, employers and attendance. */}
                    {selected.status !== 'cancelled' && (
                      <Button size="sm" variant="outline" className="gap-2"
                              onClick={() => startEdit(selected)}>
                        <Pencil className="h-3.5 w-3.5" /> {b('Edit details', 'تعديل التفاصيل')}
                      </Button>
                    )}
                    {selected.status === 'cancelled' && (
                      <Button size="sm" variant="outline"
                              onClick={() => setStatus(selected, 'published')}>
                        {b('Reinstate and publish', 'إعادة النشر')}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadQr(selected)}>
                      <QrCode className="h-4 w-4" /> {b('Venue QR', 'رمز المكان')}
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {(selected.status === 'draft' || selected.status === 'published') && (
                      <Button size="sm" variant="outline"
                              className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => { setCancelTarget(selected); setCancelReason(''); }}>
                        <Ban className="h-3.5 w-3.5" /> {b('Cancel event', 'إلغاء الفعالية')}
                      </Button>
                    )}
                  </div>

                  {cancelTarget?.id === selected.id && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-900">
                        {b('Cancel this event?', 'إلغاء هذه الفعالية؟')}
                      </p>
                      <p className="mt-1 text-xs text-red-800">
                        {b('It stays on the calendar marked as cancelled, so candidates who were invited find out rather than travelling to the venue. Everyone invited, anyone already checked in, and the participating employers are notified.',
                           'ستبقى في التقويم مع بيان الإلغاء، ليعلم المرشحون المدعوون بدلاً من التوجه إلى المكان. سيتم إشعار جميع المدعوين ومن سجّل حضوره وجهات التوظيف المشاركة.')}
                      </p>
                      <Label className="mt-3 block text-xs text-red-900">
                        {b('Reason (shown to candidates)', 'السبب (يظهر للمرشحين)')}
                      </Label>
                      <Input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                             placeholder={b('e.g. The venue is unavailable — a new date will be announced',
                                            'مثال: المكان غير متاح — سيُعلن عن موعد جديد')}
                             className="mt-1 h-9 bg-white text-sm" />
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="destructive" disabled={saving} onClick={confirmCancel}>
                          {saving && <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />}
                          {b('Cancel the event', 'تأكيد الإلغاء')}
                        </Button>
                        <Button size="sm" variant="ghost"
                                onClick={() => { setCancelTarget(null); setCancelReason(''); }}>
                          {b('Keep it', 'الإبقاء عليها')}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">{b('Add an employer', 'إضافة جهة توظيف')}</Label>
                    <Input value={companyQuery} onChange={e => setCompanyQuery(e.target.value)}
                           placeholder={b('Search by company name or trade licence', 'ابحث باسم الشركة أو الرخصة التجارية')}
                           className="mt-1 h-9 text-sm" />
                    <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-100">
                      {searching ? (
                        <p className="px-3 py-3 text-xs text-slate-500">{b('Searching…', 'جارٍ البحث…')}</p>
                      ) : companyResults.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-slate-500">
                          {companyQuery
                            ? b('No companies match that.', 'لا توجد شركات مطابقة.')
                            : b('Type to search the register.', 'اكتب للبحث في السجل.')}
                        </p>
                      ) : companyResults.map((c: any) => {
                        const already = (selected.employers || []).some((e: any) => e.company_id === c.id);
                        return (
                          <div key={c.id}
                               className="flex items-center gap-2 border-b border-slate-50 px-3 py-2 last:border-0">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-slate-900">{c.company_name}</p>
                              <p className="text-[11px] text-slate-500">
                                {/* The vacancy count decides whether inviting them is
                                    worth it, so it is shown BEFORE adding, not after. */}
                                {c.vacancy_count
                                  ? b(`${c.vacancy_count} published vacanc${c.vacancy_count === 1 ? 'y' : 'ies'}`,
                                      `${c.vacancy_count} شاغر منشور`)
                                  : b('no published vacancies', 'لا شواغر منشورة')}
                                {!c.is_verified && b(' · unverified', ' · غير موثقة')}
                              </p>
                            </div>
                            <Button size="sm" variant={already ? 'ghost' : 'outline'} className="h-7 text-xs"
                                    disabled={already} onClick={() => addCompany(c.id)}>
                              {already ? b('Added', 'مضافة') : b('Add', 'إضافة')}
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Employers already on the event, WITH the vacancies candidates
                        will see — the organiser should not have to open the public
                        page to find out what was actually advertised. */}
                    {(selected.employers || []).length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selected.employers.map((c: any) => (
                          <div key={c.company_id} className="rounded-lg border border-slate-100 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900">{c.company_name}</p>
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-red-600"
                                      onClick={async () => {
                                        await restClient.delete(`/api/events/${selected.id}/employers/${c.company_id}`)
                                          .catch(() => {});
                                        openEvent(selected);
                                      }}>
                                {b('Remove', 'إزالة')}
                              </Button>
                            </div>
                            {c.vacancies?.length ? (
                              <ul className="mt-1 space-y-0.5">
                                {c.vacancies.map((v: any) => (
                                  <li key={v.id} className="text-xs text-slate-600">• {v.title}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-1 text-xs text-amber-700">
                                {b('No published vacancies — candidates will see this employer with nothing to apply for.',
                                   'لا توجد شواغر منشورة — سيرى المرشحون هذه الجهة دون وظائف للتقديم عليها.')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {funnel && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{b('Funnel', 'المسار')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        [b('Invited', 'مدعو'), funnel.invited?.total ?? 0],
                        [b('Confirmed', 'مؤكد'), funnel.invited?.confirmed ?? 0],
                        [b('Attended', 'حضر'), funnel.attended?.total ?? 0],
                        [b('Placed', 'تم توظيفه'), funnel.outcomes?.placed ?? 0],
                      ].map(([label, n]: any) => (
                        <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                          <p className="text-2xl font-bold tabular-nums text-ehrdc-teal">{n}</p>
                          <p className="text-[11px] text-slate-600">{label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Walk-ins are shown apart from invited attendance: they did
                        not come from a call, and folding them in would overstate
                        how well the calling worked. */}
                    <p className="mt-3 text-xs text-slate-500">
                      {b(`Of ${funnel.attended?.total ?? 0} who attended, ${funnel.attended?.from_invitations ?? 0} were invited and ${funnel.attended?.walk_ins ?? 0} walked in.`,
                         `من ${funnel.attended?.total ?? 0} حضروا، ${funnel.attended?.from_invitations ?? 0} مدعوون و${funnel.attended?.walk_ins ?? 0} حضروا دون دعوة.`)}
                    </p>
                    {funnel.rates?.confirmed_of_invited && (
                      <p className="mt-1 text-xs text-slate-500">
                        {b(`Confirmed ${funnel.rates.confirmed_of_invited} · attended ${funnel.rates.attended_of_confirmed ?? '—'} of those`,
                           `أكد ${funnel.rates.confirmed_of_invited} · حضر ${funnel.rates.attended_of_confirmed ?? '—'} منهم`)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {b(`Call list — ${invites.length}`, `قائمة الاتصال — ${invites.length}`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex gap-2">
                    <Input value={inviteEid} onChange={e => setInviteEid(e.target.value)}
                           placeholder={b('Emirates ID — add to the call list', 'الهوية الإماراتية — إضافة إلى قائمة الاتصال')}
                           className="h-9 text-sm" />
                    <Button size="sm" onClick={addInvite} disabled={!inviteEid.trim()}>
                      {b('Add', 'إضافة')}
                    </Button>
                  </div>
                  {invites.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">
                      {b('Nobody has been invited yet.', 'لم تتم دعوة أحد بعد.')}
                    </p>
                  ) : (
                    <div className="max-h-[320px] space-y-1 overflow-y-auto">
                      {invites.map(iv => (
                        <div key={iv.candidate_id}
                             className="flex items-center gap-2 rounded-md border border-slate-100 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{iv.full_name}</p>
                            <p className="text-xs text-slate-500">{iv.phone}</p>
                          </div>
                          {iv.attended && (
                            <Badge className="border-green-200 bg-green-50 text-[10px] text-green-800">
                              {b(`attended · ${iv.queue_token}`, `حضر · ${iv.queue_token}`)}
                            </Badge>
                          )}
                          <Select value={iv.response} onValueChange={v => setResponse(iv.candidate_id, v)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="invited">{b('Awaiting reply', 'بانتظار الرد')}</SelectItem>
                              <SelectItem value="confirmed">{b('Confirmed', 'مؤكد')}</SelectItem>
                              <SelectItem value="declined">{b('Declined', 'اعتذر')}</SelectItem>
                              <SelectItem value="no_answer">{b('No answer', 'لا رد')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-ehrdc-teal" />
                    {b(`Queue — ${queue.length} checked in`, `الطابور — ${queue.length} مسجّل`)}
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => loadQueue(selected.id)}>
                    <RefreshCw className={`h-4 w-4 ${queueLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Staff check-in is the only route when a phone or the mall's
                      signal fails, so it sits directly above the queue rather
                      than behind a menu. */}
                  <div className="mb-3 flex gap-2">
                    <Input value={staffEid} onChange={e => setStaffEid(e.target.value)}
                           placeholder={b('Emirates ID — check in at the desk', 'الهوية الإماراتية — تسجيل من المكتب')}
                           className="h-9 text-sm" />
                    <Button size="sm" onClick={checkInByStaff} disabled={!staffEid.trim()}>
                      {b('Check in', 'تسجيل')}
                    </Button>
                  </div>

                  {queue.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      {b('Nobody has checked in yet.', 'لم يسجّل أحد الحضور بعد.')}
                    </p>
                  ) : (
                    <div className="max-h-[420px] space-y-1 overflow-y-auto">
                      {queue.map(p => (
                        <div key={p.queue_token}
                             className="flex items-center gap-3 rounded-md border border-slate-100 px-3 py-2">
                          <span className="w-10 shrink-0 text-lg font-bold tabular-nums text-ehrdc-teal">
                            {p.queue_token}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{p.full_name}</p>
                            <p className="text-xs text-slate-500">{p.phone}</p>
                          </div>
                          {p.was_invited && (
                            <Badge variant="secondary" className="text-[10px]">{b('invited', 'مدعو')}</Badge>
                          )}
                          {p.method === 'staff' && (
                            <Badge variant="outline" className="text-[10px]">{b('desk', 'المكتب')}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EventManagePage;
