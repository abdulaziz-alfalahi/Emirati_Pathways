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
import { CalendarDays, QrCode, Users, Plus, Loader2, RefreshCw, Download } from 'lucide-react';

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
  const [form, setForm] = useState({ title: '', title_ar: '', venue: '', starts_at: '', ends_at: '', description: '' });

  const [selected, setSelected] = useState<any | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [addingCompany, setAddingCompany] = useState('');
  const [staffEid, setStaffEid] = useState('');

  const load = () => {
    setLoading(true);
    restClient.get('/api/events')
      .then(r => setEvents(r.data?.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    /* /api/growth/companies, NOT /api/companies — the latter does not exist and
       404s, which would leave this dropdown silently empty and make it look as
       though no companies are registered. (Same mistake as the map page's
       /api/jobs/map-data, fixed in #363.) */
    restClient.get('/api/growth/companies?limit=500')
      .then(r => setCompanies(r.data?.companies || r.data?.data || []))
      .catch(() => setCompanies([]));
  }, []);

  const openEvent = async (ev: any) => {
    const res = await restClient.get(`/api/events/${ev.id}`).catch(() => null);
    setSelected(res?.data?.data || ev);
    loadQueue(ev.id);
  };

  const loadQueue = (id: string) => {
    setQueueLoading(true);
    restClient.get(`/api/events/${id}/queue`)
      .then(r => setQueue(r.data?.data || []))
      .catch(() => setQueue([]))
      .finally(() => setQueueLoading(false));
  };

  const create = async () => {
    if (!form.title.trim() || !form.starts_at) {
      toast({ title: b('A title and start time are required', 'العنوان ووقت البدء مطلوبان'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await restClient.post('/api/events', form);
      toast({ title: b('Event created as a draft', 'تم إنشاء الفعالية كمسودة') });
      setShowForm(false);
      setForm({ title: '', title_ar: '', venue: '', starts_at: '', ends_at: '', description: '' });
      load();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || b('Could not create the event', 'تعذّر إنشاء الفعالية'),
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

  const addCompany = async () => {
    if (!addingCompany || !selected) return;
    try {
      await restClient.post(`/api/events/${selected.id}/employers`, { company_id: addingCompany });
      setAddingCompany('');
      openEvent(selected);
      toast({ title: b('Employer added', 'تمت إضافة جهة التوظيف') });
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
          <Button className="gap-2" onClick={() => setShowForm(v => !v)}>
            <Plus className="h-4 w-4" /> {b('New event', 'فعالية جديدة')}
          </Button>
        </div>

        {showForm && (
          <Card className="mt-5 border-slate-200">
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
              <div className="md:col-span-2 flex gap-2">
                <Button onClick={create} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {b('Create as draft', 'إنشاء كمسودة')}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>{b('Cancel', 'إلغاء')}</Button>
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
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadQr(selected)}>
                      <QrCode className="h-4 w-4" /> {b('Venue QR', 'رمز المكان')}
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs">{b('Add an employer', 'إضافة جهة توظيف')}</Label>
                    <div className="mt-1 flex gap-2">
                      <Select value={addingCompany} onValueChange={setAddingCompany}>
                        <SelectTrigger className="h-9 flex-1 text-sm">
                          <SelectValue placeholder={b('Select a company', 'اختر شركة')} />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.length === 0 && (
                            <div className="px-2 py-3 text-xs text-slate-500">
                              {b('No companies could be loaded.', 'تعذّر تحميل الشركات.')}
                            </div>
                          )}
                          {companies.map((c: any) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.company_name || c.name || c.id}
                              {c.is_verified === false && ' · unverified'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={addCompany} disabled={!addingCompany}>
                        {b('Add', 'إضافة')}
                      </Button>
                    </div>
                    {(selected.employers || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selected.employers.map((c: any) => (
                          <Badge key={c.company_id} variant="secondary" className="text-xs">
                            {c.company_name}
                            {c.vacancies?.length ? ` · ${c.vacancies.length}` : ''}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
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
