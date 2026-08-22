import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { getDisplayName } from '@/utils/nameUtils';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { restClient } from '@/utils/api';
import PopulationStrip from '@/components/PopulationStrip';
import BoardMinutesPanel from '@/components/board/BoardMinutesPanel';
import AgendaList from '@/components/board/AgendaList';
import { useAuth } from '@/context/AuthContext';
import {
  Target, Brain, FileText, CheckCircle, Clock,
  Users, Building2, Briefcase, BarChart3, Award,
  Shield, Download, Activity, Loader2, Send, ArrowRight,
  Globe, Landmark, AlertTriangle, UserCheck, PieChart as PieChartIcon
} from 'lucide-react';

// API base is handled by restClient relative path proxying
const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#14B8A6', '#EF4444'];

const ExecutiveDashboard: React.FC = () => {
  /* The CURRENT year, not a literal. These cards read "2025 Target" into 2026
     (feedback fb_1787130094). The figures themselves are honestly marked "not
     yet connected to live data" — but a stale year in the label undermines that
     honesty, because it looks like a real number from last year.

     When the target IS connected, the year must come from the data rather than
     the clock: a target is set for a specific year by policy, and reading it
     off today's date would be a different wrong answer. */
  const targetYear = new Date().getFullYear();

  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => isRTL ? ar : en;
  const currentTab = searchParams.get('tab') || 'overview';

  // ── State ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [executiveData, setExecutiveData] = useState<any>(null);
  const [scorecards, setScorecards] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [directives, setDirectives] = useState<any[]>([]);
  const [demographicsData, setDemographicsData] = useState<any>(null);
  const [demoSubTab, setDemoSubTab] = useState<'main' | 'priority'>('main');
  const [newDirective, setNewDirective] = useState({
    title: '', body: '', category: 'strategic_priority', priority: 'normal'
  });

  // ── Demographics ──────────────────────────────────────────────────────────
  //
  // The API serves buckets keyed by the value stored in the database ('Male',
  // 'High School', 'Not Working'). Those are DATA, not copy, so they are
  // translated here on every render — doing it once at fetch time is what left
  // the English board page showing ذكور / إناث.
  const DEMO_LABELS_AR: Record<string, string> = {
    Male: 'ذكور', Female: 'إناث',
    Single: 'أعزب', Married: 'متزوج', Divorced: 'مطلّق', Widowed: 'أرمل', Dead: 'متوفّى',
    Working: 'يعمل', 'Not Working': 'لا يعمل', Retired: 'متقاعد', Unknown: 'غير معروف',
    Completed: 'أنهى الخدمة', Exempted: 'معفى', 'In Service': 'في الخدمة',
    'Not Yet Joined': 'لم يلتحق بعد', 'Not Required "Female"': 'غير مطلوبة (إناث)',
    Dubai: 'دبي', 'Abu Dhabi': 'أبوظبي', Sharjah: 'الشارقة', Ajman: 'عجمان',
    'Ras Al Khaimah': 'رأس الخيمة', Fujairah: 'الفجيرة', 'Umm Al Quwain': 'أم القيوين',
    'Al Ain': 'العين', Hatta: 'حتا',
  };

  // The board tab shows all recorded people. The cohort cuts the API also
  // serves (active roster, priorities, Hatta, CDA…) belong to the operators'
  // /demographics page, which offers a cut selector; a board member picking
  // cohorts is not a thing anyone asked for.
  const demoCut = demographicsData?.registered;

  const demoLabel = (name: string) => {
    if (!isRTL) return name;
    return demographicsData?.education_labels_ar?.[name] || DEMO_LABELS_AR[name] || name;
  };
  const demoSeries = (field: string) =>
    (demoCut?.[field] || []).map((x: any) => ({ ...x, name: demoLabel(x.name) }));

  const demoGender = demoSeries('gender');
  const demoAge = demoSeries('age');
  const demoEducation = demoSeries('education');
  const demoEmployment = demoSeries('employment');
  const demoMilitary = demoSeries('military');
  const demoMarital = demoSeries('marital');
  const demoEmirate = demoSeries('emirate');

  // Coverage is part of the answer, not a footnote. emirate_of_residence is
  // populated on 9% of records and military_status on 6%; a bar chart drawn
  // without saying so reports "3,202 of our people live in Dubai" when the
  // honest statement is "of the 9% who state an emirate, most say Dubai".
  const DemoCoverage = ({ field }: { field: string }) => {
    const c = demoCut?.coverage?.[field];
    if (!c) return null;
    const low = c.pct < 50;
    return (
      <div
        className={`mt-2 text-[11px] leading-relaxed ${low ? 'text-amber-700' : 'text-slate-500'}`}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {low && <AlertTriangle className="inline h-3 w-3 me-1 -mt-0.5" />}
        {isRTL ? c.note.ar : c.note.en}
      </div>
    );
  };

  const { toast } = useToast();
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);

  const handleBoardPackDownload = async () => {
    toast({
      title: b("Generating Briefing Pack", "جاري إنشاء ملف المجلس"),
      description: b("Please wait while the AI compiles the latest board pack...", "يرجى الانتظار بينما يقوم الذكاء الاصطناعي بتجميع ملف المجلس..."),
    });
    try {
      const res = await restClient.get('/api/board/briefing-pack', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Board_Briefing_Pack_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: b("Success", "تم بنجاح"),
        description: b("Briefing pack generated and downloaded successfully.", "تم إنشاء وتحميل ملف المجلس بنجاح."),
      });
    } catch (err) {
      console.error(err);
      toast({
        title: b("Download Error", "خطأ في التحميل"),
        description: b("Failed to generate briefing pack.", "فشل إنشاء ملف المجلس."),
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    toast({
      title: b("Export Started", "بدأ التصدير"),
      description: b("Exporting executive dashboard metrics as CSV...", "جاري تصدير مؤشرات لوحة الإدارة بصيغة CSV..."),
    });
    try {
      const res = await restClient.get('/api/board/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Executive_Dashboard_Export_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: b("Export Complete", "اكتمل التصدير"),
        description: b("Dashboard report has been downloaded.", "تم تحميل تقرير لوحة الإدارة بنجاح."),
      });
    } catch (err) {
      console.error(err);
      toast({
        title: b("Export Error", "خطأ في التصدير"),
        description: b("Failed to export dashboard metrics.", "فشل تصدير مؤشرات لوحة الإدارة."),
        variant: "destructive",
      });
    }
  };

  // ── User Data ──────────────────────────────────────────────────
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    } catch { return {}; }
  };
  const userData = getUserData();
  const userName = getDisplayName(userData, b('Board Member', 'عضو مجلس'));
  const firstName = userName.split(' ')[0];

  // ── Tab Navigation ─────────────────────────────────────────────
  const handleTabChange = (value: string) => {
    navigate(`/executive?tab=${value}`, { replace: true });
  };

  // ── Dynamic Greeting ───────────────────────────────────────────
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (isRTL) return hour < 12 ? 'صباح الخير' : 'مساء الخير';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // ── Data Fetching ──────────────────────────────────────────────
  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async (isRetry = false) => {
    setLoading(true);
    setError(false);
    if (isRetry) setRetrying(true);
    try {
      // Fetch all APIs in parallel
      const [execRes, scoreRes, insightsRes, dirRes, demoRes] = await Promise.allSettled([
        restClient.get('/api/metrics/executive-impact'),
        restClient.get('/api/board/scorecards'),
        restClient.get('/api/board/insights'),
        restClient.get('/api/board/directives'),
        restClient.get('/api/metrics/demographics')
      ]);

      let hasError = false;

      // Executive impact data
      if (execRes.status === 'fulfilled' && execRes.value?.data?.success) {
        setExecutiveData(execRes.value.data.data);
      } else {
        hasError = true;
      }

      // Scorecards
      if (scoreRes.status === 'fulfilled' && scoreRes.value?.data) {
        setScorecards(scoreRes.value.data);
      } else {
        hasError = true;
      }

      // Insights
      if (insightsRes.status === 'fulfilled' && insightsRes.value?.data) {
        setInsights(insightsRes.value.data);
      } else {
        hasError = true;
      }

      // Directives
      if (dirRes.status === 'fulfilled' && dirRes.value?.data) {
        setDirectives(dirRes.value.data);
      } else {
        hasError = true;
      }

      // Demographics — store the payload as served and localise at RENDER time.
      //
      // This used to build the chart arrays here, calling b(...) to pick the
      // label language and freezing the result into state. State outlives a
      // language switch, so the board page rendered in English kept the labels
      // chosen when the data arrived — the English Demographics tab showed
      // ذكور / إناث on the gender chart (screenshot 2026-08-22). Nothing is
      // translated in this block any more.
      if (demoRes.status === 'fulfilled' && demoRes.value?.data?.success) {
        setDemographicsData(demoRes.value.data.data);
      } else {
        hasError = true;
      }

      if (hasError) {
        throw new Error("One or more dashboard resources failed to load");
      }

      setError(false);
    } catch (error) {
      console.error('Error fetching executive data:', error);
      setError(true);
      setExecutiveData(null);
      setScorecards(null);
      setInsights([]);
      setDemographicsData(null);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const submitDirective = async () => {
    if (!newDirective.title) return;
    try {
      const res = await restClient.post('/api/board/directives', newDirective);
      if (res.status === 200 || res.status === 201) {
        setNewDirective({ title: '', body: '', category: 'strategic_priority', priority: 'normal' });
        fetchAllData();
      }
    } catch (error) {
      console.error('Error submitting directive:', error);
    }
  };

  // ── Board meetings (migration 050) ─────────────────────────────
  const [meetings, setMeetings] = useState<any[]>([]);
  // null = not loaded yet / could not load, which the archive card distinguishes
  // from an empty list. "No past meetings" and "we could not ask" are different
  // statements to make to a board member.
  const [pastMeetings, setPastMeetings] = useState<any[] | null>(null);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // ── Recommendation implementation tracking (migration 052) ──────
  const [recSummary, setRecSummary] = useState<any>(null);
  // Emirati private-sector employment over time (owner request 2026-08-21).
  const [empTimeline, setEmpTimeline] = useState<any>(null);
  /* How many years of monthly detail to plot. 0 = everything. Three years is
     the default because 2022 is where the volume starts; the eleven years
     before it are single- and double-digit months that would flatten the rest. */
  const [monthSpan, setMonthSpan] = useState<number>(3);

  /* Sliced from the full series rather than refetched — the whole payload is a
     couple of hundred rows, and a round trip per click would make the control
     feel broken. */
  const monthlySeries = React.useMemo(() => {
    const rows: any[] = empTimeline?.by_month || [];
    if (!rows.length || !monthSpan) return rows;
    const latest = rows[rows.length - 1]?.year;
    if (!latest) return rows;
    return rows.filter((r) => r.year > latest - monthSpan);
  }, [empTimeline, monthSpan]);

  const fetchRecommendations = async () => {
    try {
      restClient.get('/api/metrics/employment-timeline')
        .then(r => setEmpTimeline(r.data?.data || null))
        .catch(() => setEmpTimeline(null));
      const res = await restClient.get('/api/board/recommendations/summary');
      setRecSummary(res.data?.data || null);
    } catch { setRecSummary(null); }
  };


  const [boardSettings, setBoardSettings] = useState<any>(null);
  const canManageBoard = (() => {
    const roles = [(user as any)?.role, ...(((user as any)?.secondary_roles) || [])]
      .filter(Boolean).map((r: string) => String(r).toLowerCase());
    return roles.some(r => ['admin', 'administrator', 'platform_operator', 'board_operator'].includes(r));
  })();

  /* Editing a scheduled meeting — agenda especially.
     
     Requested as "There is currently no option to edit the meeting agenda after
     clicking Submit ... new topics may need to be added" (fb_1787145612). The
     API already supported it: PUT /api/board/meetings/<id> changes only the
     fields present in the body, and refuses a completed or cancelled meeting
     because governance history is not rewritten. Only the UI was missing. */
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; agenda: string; location: string }>(
    { title: '', agenda: '', location: '' });
  const [savingMeeting, setSavingMeeting] = useState(false);

  const openEditMeeting = (m: any) => {
    setEditForm({
      title: m.title || '',
      agenda: m.agenda || '',
      location: m.location || '',
    });
    setEditingMeeting(m);
  };

  const saveMeeting = async () => {
    if (!editingMeeting) return;
    if (!editForm.title.trim()) {
      toast({ title: b('Title required', 'العنوان مطلوب'),
              description: b('A meeting needs a title.', 'يجب أن يكون للاجتماع عنوان.'),
              variant: 'destructive' });
      return;
    }
    setSavingMeeting(true);
    try {
      /* Only what the form owns. Sending the whole meeting back would restate
         scheduled_at, and a reschedule notifies every member — an agenda tweak
         must not tell the board the time changed. */
      await restClient.put(`/api/board/meetings/${editingMeeting.id}`, {
        title: editForm.title.trim(),
        agenda: editForm.agenda,
        location: editForm.location,
      });
      toast({ title: b('Meeting updated', 'تم تحديث الاجتماع'),
              description: b('The agenda and details have been saved.',
                             'تم حفظ جدول الأعمال والتفاصيل.') });
      setEditingMeeting(null);
      fetchMeetings();
    } catch (e: any) {
      toast({ title: b('Could not update the meeting', 'تعذّر تحديث الاجتماع'),
              // The API's own message when it refuses — e.g. a closed meeting —
              // is more useful than a generic failure.
              description: e?.response?.data?.message
                || b('Please try again.', 'يرجى المحاولة مرة أخرى.'),
              variant: 'destructive' });
    } finally { setSavingMeeting(false); }
  };

  /* Who was present at a meeting — the factual record the minutes need.
     
     Requested as the attendance half of fb_1787140915. The PARTICIPATION half —
     per-member rates across meetings, as a performance view — is deliberately
     NOT built: the owner is taking that to the chairman first (2026-08-20),
     because measuring named individuals over time is a governance decision.
     
     This shows one meeting at a time and states what happened in it. It ranks
     nobody and compares nothing across meetings. */
  const [attendanceFor, setAttendanceFor] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const openAttendance = async (m: any) => {
    setAttendanceFor(m); setAttendance(null); setAttendanceLoading(true);
    try {
      const res: any = await restClient.get(`/api/board/meetings/${m.id}/attendance`);
      setAttendance(res?.data?.data ?? res?.data ?? null);
    } catch {
      /* null means "could not load", which the panel says — as distinct from a
         meeting nobody attended. */
      setAttendance(null);
    } finally { setAttendanceLoading(false); }
  };

  const presenceLabel = (a: any) => {
    if (a.present_seconds > 0) {
      const mins = Math.round(a.present_seconds / 60);
      const pct = a.present_percent;
      return `${mins} ${b('min', 'دقيقة')}${pct != null ? ` · ${pct}%` : ''}`;
    }
    /* Never "0 min" for someone who was invited and did not come — that reads
       as a measurement of their presence rather than an absence of one. */
    return b('Did not join', 'لم ينضم');
  };

  const fetchBoardSettings = async () => {
    try {
      const res = await restClient.get('/api/board/meetings/settings');
      setBoardSettings(res.data?.data || null);
    } catch { setBoardSettings(null); }
  };


  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    try {
      const res = await restClient.get('/api/board/meetings?scope=upcoming');
      setMeetings(res.data?.data || []);
    } catch {
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const fetchPastMeetings = async () => {
    try {
      const res = await restClient.get('/api/board/meetings?scope=past');
      setPastMeetings(res.data?.data || []);
    } catch { setPastMeetings(null); }
  };

  useEffect(() => { fetchMeetings(); fetchPastMeetings(); fetchBoardSettings(); fetchRecommendations(); }, []);

  const joinMeeting = async (m: any) => {
    setJoiningId(m.id);
    try {
      const res = await restClient.post(`/api/board/meetings/${m.id}/join`);
      const d = res.data?.data;
      if (!res.data?.success || !d?.token) {
        toast({ title: res.data?.message || b('Could not join the meeting', 'تعذّر الانضمام إلى الاجتماع'), variant: 'destructive' });
        return;
      }
      // Hand off to the shared video room, same as interviews.
      navigate(`/board-meeting/${m.id}`, { state: { token: d.token, url: d.livekit_url, title: d.meeting_title } });
    } catch (e: any) {
      // The API says WHY (too early, ended, not invited) — show that, not a generic error.
      toast({ title: e?.response?.data?.message || b('Could not join the meeting', 'تعذّر الانضمام إلى الاجتماع'), variant: 'destructive' });
    } finally {
      setJoiningId(null);
    }
  };

  const rsvp = async (m: any, response: 'accepted' | 'declined') => {
    try {
      await restClient.post(`/api/board/meetings/${m.id}/rsvp`, { response });
      toast({ title: response === 'accepted' ? b('Attendance confirmed', 'تم تأكيد الحضور')
                                             : b('Response recorded', 'تم تسجيل ردك') });
      fetchMeetings();
    } catch {
      toast({ title: b('Could not record your response', 'تعذّر تسجيل ردك'), variant: 'destructive' });
    }
  };


  // ── Top-Level KPI Cards ────────────────────────────────────────
  const kpis = executiveData?.kpis || {};
  const statCards = [
    {
      // Confirmed hires + accepted offers only. This card used to show
      // (registered − still active) + offers, i.e. roster attrition presented
      // as placements — 1,542 on a platform with no hires at all
      // ("the number incorrect 1542 what does it mean?").
      label: b('Confirmed Placements', 'التعيينات المؤكدة'),
      value: kpis.total_placed != null ? Number(kpis.total_placed).toLocaleString() : '—',
      icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
      sub: kpis.roster_exits != null
        ? `${Number(kpis.roster_exits).toLocaleString()} ${b('left the active roster (not placements)', 'غادروا سجل الباحثين النشطين (ليست تعيينات)')}`
        : b('Hires and accepted offers', 'التعيينات والعروض المقبولة')
    },
    {
      label: b('Emiratisation Target', 'هدف التوطين'),
      value: kpis.emiratization_target_progress != null ? `${kpis.emiratization_target_progress}%` : '—',
      icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
      sub: b('Vision 2071 Progress', 'تقدم رؤية 2071')
    },
    {
      label: b('Active Partners', 'شركاء نشطون'),
      value: (kpis.active_partners || 0).toLocaleString(),
      icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100',
      sub: b('Private Sector Verified', 'القطاع الخاص — معتمدون')
    },
    // Requested by the board (fb_1787129939): "the total number of active JS,
    // the total number of employees from Dubai, and the total number of active
    // vacancies". Two are real counts. The third is not available and is not
    // invented — see the third card.
    {
      // The label now names the MEASURE, not the concept. "Active Jobseekers"
      // sat beside the strip's "Actively seeking work" reading as its synonym,
      // while showing 6,004 against 2,489 — the 2.7x spread that populations.py
      // documents. They count different things: NAFIS's classification of a
      // person versus what the person said about looking for work. Both belong
      // on a board page; neither may be labelled as if it were the other.
      label: b('NAFIS Jobseeker Classification', 'تصنيف نافس للباحثين عن عمل'),
      value: kpis.active_jobseekers != null ? Number(kpis.active_jobseekers).toLocaleString() : '—',
      icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100',
      sub: b('Typed ActiveJobseeker by NAFIS — not the same as stated intent above',
             'مصنّفون كباحثين نشطين لدى نافس — يختلف عن نيّة البحث المعلنة أعلاه')
    },
    {
      label: b('Active Vacancies', 'الشواغر النشطة'),
      value: kpis.active_vacancies != null ? Number(kpis.active_vacancies).toLocaleString() : '—',
      icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100',
      // PUBLISHED only. Counting drafts and pending-verification postings would
      // report roughly forty times the number anyone can actually apply to.
      sub: b('Published and open to applications', 'منشورة ومتاحة للتقديم')
    },
    // REMOVED: the "Employed on Roster" card. It answered the board's request
    // for "employees from Dubai" by counting candidate_profiles.work_status =
    // 'Working' — 33,511 — while the population strip added directly above it
    // reports the same concept as 33,510, because the strip additionally
    // requires an active users row with a candidate role. Both queries are
    // defensible; the two of them adjacent on one board screen, differing by
    // one and labelled almost identically, is not. A board member who spots the
    // discrepancy has no way to know which is right, and stops trusting both.
    //
    // The strip's Employed tile is now the single answer. Its MOHRE caveat was
    // the genuinely valuable part of this card and has moved to the strip's
    // disclosure line, so nothing is lost except the second number.
    // NOTE: the "Growth Projection +18% · AI Forecast" card was removed
    // (data-honesty audit) — it was a hardcoded fabrication with no model behind it.
  ];

  // ── Scorecard items for the Scorecards section ─────────────────
  const getScorecardItems = () => {
    if (!scorecards) return [];
    return Object.entries(scorecards).map(([key, data]: [string, any]) => {
      const iconMap: Record<string, any> = {
        placement_rate: Target, time_to_hire: Clock, pipeline_health: Users,
        emiratisation_progress: Shield, active_companies: Building2,
        total_offers: Briefcase, active_candidates: Users,
        employer_engagement: Building2, program_completion: CheckCircle,
      };
      const colorMap: Record<string, { color: string; bg: string; border: string }> = {
        excellent: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        good: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        warning: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
      };
      const Icon = iconMap[key] || BarChart3;
      const colors = colorMap[data.status] || colorMap.good;
      return { key, Icon, ...colors, ...data,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      };
    });
  };

  // ── Recharts custom tooltip ────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-dubai-bold text-slate-800 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs font-dubai-medium" style={{ color: entry.color }}>
            {entry.name}: <span className="font-dubai-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  // ── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm text-slate-500 font-dubai-medium">
              {retrying ? b('Retrying live API request...', 'جاري إعادة محاولة الاتصال بالخادم...') : b('Loading Executive Intelligence...', 'جاري تحميل لوحة الإدارة...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="max-w-md w-full bg-white border border-red-100 rounded-xl p-6 shadow-sm text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-dubai-bold text-slate-800 mb-2">
              {b('Database Connection Offline', 'فشل الاتصال بقاعدة البيانات')}
            </h2>
            <p className="text-sm text-slate-500 font-dubai-medium mb-6">
              {b('We are currently unable to retrieve secure executive metrics. The system will not load historical fallbacks to prevent decision inaccuracies.', 'لا يمكن حالياً استرداد المؤشرات التنفيذية الآمنة. لن يقوم النظام بتحميل بيانات احتياطية غير دقيقة لمنع اتخاذ قرارات خاطئة.')}
            </p>
            <Button onClick={() => fetchAllData(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium w-full">
              {b('Retry Connection', 'إعادة محاولة الاتصال')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ═══ Navigation ═══ */}
      <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />

      {/* ═══ Main Content ═══ */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ─── Header ─── */}
          <div className="mb-6">
            <div className="flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <div className="flex items-center gap-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {firstName.charAt(0)}
                </div>
                <div className="text-start">
                  <div className="flex items-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <h1 className="text-2xl font-dubai-bold text-slate-900">
                      {getGreeting()}، {firstName}
                    </h1>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-dubai-medium">
                      {b('Board Member', 'عضو مجلس الإدارة')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-dubai-medium mt-0.5">
                    {isRTL
                      ? <>تتبع <span className="text-emerald-600 font-bold">{kpis.active_partners || 0} شريك</span> مع <span className="text-emerald-600 font-bold">{Number(kpis.total_placed || 0).toLocaleString()} تعيين مؤكد</span> حتى الآن.</>
                      : <>Tracking <span className="text-emerald-600 font-bold">{kpis.active_partners || 0} partners</span> with <span className="text-emerald-600 font-bold">{Number(kpis.total_placed || 0).toLocaleString()} confirmed placements</span> to date.</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <Button variant="outline" size="sm" onClick={handleBoardPackDownload} className="font-dubai-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {b('Board Pack', 'ملف المجلس')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} className="font-dubai-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {b('Export', 'تصدير')}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Quick Actions ─── */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Button onClick={() => setBriefModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium shadow-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                {b('AI Strategic Brief', 'موجز استراتيجي')}
              </Button>
              <Button onClick={() => { handleTabChange('directives'); setTimeout(() => document.getElementById('directive-title')?.focus(), 200); }} variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <Send className="h-4 w-4" />
                {b('Issue Directive', 'إصدار توجيه')}
              </Button>
              <Button onClick={() => handleTabChange('strategic')} variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {b('Deep Analytics', 'تحليلات عميقة')}
              </Button>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-7 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200/80" dir={isRTL ? 'rtl' : 'ltr'} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {[
                { value: 'overview', label: b('Overview', 'نظرة عامة') },
                { value: 'strategic', label: b('Strategic Impact', 'التأثير الاستراتيجي') },
                { value: 'insights', label: b('AI Insights', 'رؤى ذكية') },
                { value: 'meetings', label: b('Meetings', 'الاجتماعات') },
                { value: 'directives', label: b('Directives', 'التوجيهات') },
                { value: 'demographics', label: b('Demographics', 'التركيبة السكانية') },
                { value: 'emiratisation', label: b('Emiratisation', 'التوطين') },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm"
                  onClick={() => handleTabChange(tab.value)}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ═══════════════════════════════════════════════════════
                              OVERVIEW TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ─── Population figures ───
                  Employed / seeking / not working / onboarded, from the same
                  endpoint the CRM reads. This is the board's answer to "how many
                  Emiratis are employed and how many are we reaching", and it is
                  deliberately the FIRST thing on the page: the 37-of-38,297
                  onboarding gap is the most important fact about the programme's
                  current state, and burying it under activity charts would be a
                  presentation choice that flatters us. */}
              <PopulationStrip
                extraNoteEn="Employed counts people this platform holds a record for; it is not the Dubai-wide total, which requires MOHRE data the platform is not connected to."
                extraNoteAr="يُحتسب ضمن الموظفين الأشخاص الذين تحتفظ المنصة بسجل لهم، وهو ليس الإجمالي على مستوى دبي، إذ يتطلب ذلك بيانات وزارة الموارد البشرية والتوطين غير المرتبطة بالمنصة."
              />

              {/* ─── KPI Stat Cards ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                  <Card key={i} className={`bg-white border ${stat.border} hover:shadow-md transition-all duration-200 group`}>
                    <CardContent className="pt-5 pb-4 px-5">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="text-start">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 font-dubai-medium">{stat.label}</p>
                          <p className="text-3xl font-dubai-bold text-slate-900">{stat.value}</p>
                          <p className="text-xs text-slate-400 mt-0.5 font-dubai-medium">{stat.sub}</p>
                        </div>
                        <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ─── Charts + Operational Scorecards ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Placement Growth Chart */}
                <Card className="lg:col-span-2 bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                        {b('Strategic Placement Growth', 'نمو التعيينات الاستراتيجي')}
                      </CardTitle>
                      <Button variant="link" size="sm" className="text-xs text-emerald-600 font-dubai-medium" onClick={() => handleTabChange('strategic')}>
                        {b('Full View', 'عرض كامل')} →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={executiveData?.strategic_impact || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="placements" name={b('Placements', 'التعيينات')} stroke="#10B981" fill="url(#colorPlacements)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="target" name={b('Target', 'الهدف')} stroke="#8B5CF6" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Operational Scorecards Summary */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <Activity className="h-4 w-4 text-emerald-600" />
                      {b('Operational Metrics', 'المؤشرات التشغيلية')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {getScorecardItems().slice(0, 5).map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 ${item.bg} rounded-lg`}>
                              <item.Icon className={`h-3.5 w-3.5 ${item.color}`} />
                            </div>
                            <span className="text-sm text-slate-600 font-dubai-medium">{item.label}</span>
                          </div>
                          <div className="text-end">
                            <span className="text-sm font-dubai-bold text-slate-900">{item.value}</span>
                            {item.trend && (
                              <span className={`text-[10px] block font-dubai-medium ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {item.trend}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ─── National Target Banner ─── */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 rounded-lg">
                      <Landmark className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-sm font-dubai-bold text-emerald-800">{b(`National Emiratisation Target ${targetYear}`, `الهدف الوطني للتوطين ${targetYear}`)}</p>
                      <p className="text-xs text-emerald-600 font-dubai-medium mt-0.5">
                        {b('Overall private sector goal', 'الهدف الشامل للقطاع الخاص')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-dubai-bold text-emerald-700">{kpis.emiratization_target_progress != null ? `${kpis.emiratization_target_progress}%` : '—'}</p>
                      <p className="text-[10px] text-emerald-600 font-dubai-medium">{b('Current', 'الحالي')}</p>
                    </div>
                    <div className="w-32">
                      <Progress value={kpis.emiratization_target_progress || 0} className="h-2.5" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-dubai-bold text-slate-500">100%</p>
                      <p className="text-[10px] text-slate-400 font-dubai-medium">{b('Target', 'الهدف')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              STRATEGIC IMPACT TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="strategic" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Bar Chart — Placement Growth */}
                <Card className="lg:col-span-2 bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <BarChart3 className="h-4 w-4 text-emerald-600" />
                      {b('Placement Growth — Actual vs Target', 'نمو التعيينات — الفعلي مقابل المستهدف')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={executiveData?.strategic_impact || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="placements" name={b('Actual Placements', 'التعيينات الفعلية')} fill="#10B981" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="target" name={b('Target', 'المستهدف')} fill="#8B5CF6" radius={[6, 6, 0, 0]} opacity={0.6} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Pie Chart — Sector Distribution */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <Globe className="h-4 w-4 text-emerald-600" />
                      {b('Sector Distribution', 'توزيع القطاعات')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={executiveData?.sector_distribution || []} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3}>
                            {(executiveData?.sector_distribution || []).map((_: any, i: number) => (
                              <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full Scorecards Grid */}
              {scorecards && (
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="font-dubai-bold text-slate-900 text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b('Operational KPI Scorecards', 'بطاقات أداء المؤشرات التشغيلية')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getScorecardItems().map((item) => (
                        <div key={item.key} className={`p-4 rounded-xl border ${item.border} hover:shadow-sm transition-all`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 ${item.bg} rounded-lg`}>
                                <item.Icon className={`h-4 w-4 ${item.color}`} />
                              </div>
                              <span className="text-sm font-dubai-medium text-slate-600">{item.label}</span>
                            </div>
                          </div>
                          <p className="text-2xl font-dubai-bold text-slate-900 mt-1">{item.value}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs font-dubai-medium ${item.trend?.startsWith('+') ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {item.trend}
                            </span>
                            <span className="text-[10px] text-slate-400 font-dubai">{b('Target', 'الهدف')}: {item.target}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              AI INSIGHTS TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="insights" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-dubai-bold text-slate-800 flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <Brain className="h-5 w-5 text-emerald-600" />
                    {b('Weekly Intelligence Brief', 'موجز الذكاء الأسبوعي')}
                  </h3>
                  {insights.length > 0 ? insights.map((insight) => (
                    <Card key={insight.id} className="bg-white border border-slate-200/80 hover:shadow-md transition-all duration-200" style={{ borderLeftWidth: '4px', borderLeftColor: insight.severity === 'warning' ? '#f59e0b' : '#10b981' }}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          <CardTitle className="text-base font-dubai-bold text-slate-800">{insight.title}</CardTitle>
                          <Badge className={insight.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                            {insight.theme?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 font-dubai-medium">{insight.description}</p>
                        <div className="mt-4 flex justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedInsight(insight)} className="text-emerald-600 h-8 gap-1 font-dubai-medium">
                            {b('View Details', 'عرض التفاصيل')} <ArrowRight className={`h-3 w-3 ${isRTL ? 'rotate-180' : ''}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <Card className="bg-white border border-slate-200/80">
                      <CardContent className="p-8 text-center text-slate-500 font-dubai-medium">
                        {b('No insights available yet. AI models will generate insights as data accumulates.', 'لا توجد رؤى متاحة بعد. ستقوم نماذج الذكاء الاصطناعي بإنشاء رؤى مع تراكم البيانات.')}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* AI Engine Status */}
                <Card className="bg-white border border-slate-200/80 sticky top-24">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <Brain className="h-4 w-4 text-emerald-600" />
                      {b('AI Analysis Engine', 'محرك التحليل الذكي')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <p className="text-sm text-slate-500 mb-6 font-dubai-medium">
                      {b('Insights are generated by analyzing pipeline anomalies, conversion rates, and engagement metrics.', 'يتم إنشاء الرؤى تلقائيًا من خلال تحليل البيانات.')}
                    </p>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <p className="text-xs text-slate-400 font-dubai-medium">
                        {b('Engine telemetry not yet connected to live data.', 'إحصائيات المحرك غير متصلة بالبيانات المباشرة بعد.')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              DIRECTIVES TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="meetings" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>{b('Upcoming board meetings', 'اجتماعات المجلس القادمة')}</CardTitle>
                  <CardDescription>
                    {b('Join the meeting from here when it opens — 15 minutes before the scheduled start.',
                       'انضم إلى الاجتماع من هنا عند فتحه — قبل 15 دقيقة من الموعد المحدد.')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Board-wide quorum — a fixed rule, not a per-meeting choice
                      (owner ruling). Each meeting snapshots it at creation, so
                      changing it never rewrites whether a past meeting was quorate. */}
                  <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 border p-3">
                    <span className="text-sm text-slate-700">
                      {b('Board quorum:', 'نصاب المجلس:')}{' '}
                      <strong>{boardSettings?.quorum_required ?? b('not set', 'غير محدد')}</strong>
                      {boardSettings?.quorum_required ? b(' members', ' أعضاء') : ''}
                    </span>
                    {/* Setting the quorum is the secretary's job, not a member's.
                        Point them at the workspace that owns it rather than
                        offering a second place to write the same rule. */}
                    {canManageBoard && (
                      <Button size="sm" variant="outline" onClick={() => navigate('/board-secretary')}>
                        {b('Manage in Board Secretariat', 'الإدارة في أمانة المجلس')}
                      </Button>
                    )}
                  </div>
                  {meetingsLoading ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">{b('Loading…', 'جارٍ التحميل…')}</p>
                  ) : meetings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      {b('No upcoming meetings scheduled.', 'لا توجد اجتماعات مجدولة.')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {meetings.map((m: any) => {
                        const when = m.scheduled_at ? new Date(m.scheduled_at) : null;
                        const opensAt = when ? new Date(when.getTime() - 15 * 60000) : null;
                        const canJoin = m.is_virtual && opensAt ? new Date() >= opensAt : false;
                        return (
                          <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border p-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{isRTL && m.title_ar ? m.title_ar : m.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {when ? when.toLocaleString(isRTL ? 'ar-AE' : 'en-GB',
                                  { dateStyle: 'full', timeStyle: 'short' }) : ''}
                                {m.duration_minutes ? ` · ${m.duration_minutes} ${b('min', 'دقيقة')}` : ''}
                              </p>
                              {!m.is_virtual && m.location && (
                                <p className="text-xs text-slate-500 mt-1">{b('In person:', 'حضورياً:')} {m.location}</p>
                              )}
                              {(isRTL ? m.agenda_ar : m.agenda) && (
                                <AgendaList agenda={isRTL ? m.agenda_ar : m.agenda} className="mt-1" compact />
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Organisers only, and only while the meeting is
                                  still open to change — the API refuses a
                                  completed or cancelled one, so offering the
                                  button there would be a control that fails. */}
                              {canManageBoard && m.status !== 'completed' && m.status !== 'cancelled' && (
                                <Button size="sm" variant="ghost" onClick={() => openEditMeeting(m)}>
                                  {b('Edit', 'تعديل')}
                                </Button>
                              )}
                              {m.my_invite_status === 'invited' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => rsvp(m, 'accepted')}>
                                    {b('Accept', 'قبول')}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => rsvp(m, 'declined')}>
                                    {b('Decline', 'اعتذار')}
                                  </Button>
                                </>
                              )}
                              {m.is_virtual ? (
                                <Button
                                  size="sm"
                                  onClick={() => joinMeeting(m)}
                                  disabled={joiningId === m.id || !canJoin}
                                  title={canJoin ? '' : b('Opens 15 minutes before the start', 'يفتح قبل 15 دقيقة من البدء')}
                                  className="bg-emerald-700 hover:bg-emerald-800"
                                >
                                  {joiningId === m.id ? b('Joining…', 'جارٍ الانضمام…') : b('Join meeting', 'انضم للاجتماع')}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">{b('In person', 'حضورياً')}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Minutes are readable by members, the secretary and
                  Administrators (owner ruling 2026-08-11), so a member needs a
                  place to read them — not only the secretary's workspace.
                  Drafts appear here too, deliberately: members see a document
                  before it is marked approved. */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>{b('Minutes', 'المحاضر')}</CardTitle>
                  <CardDescription>
                    {b('Minutes of past meetings. A corrected version never replaces the earlier one — every version stays in the archive.',
                       'محاضر الاجتماعات السابقة. النسخة المصححة لا تحل محل السابقة — تبقى كل النسخ في الأرشيف.')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pastMeetings === null ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {b('Loading…', 'جارٍ التحميل…')}
                    </p>
                  ) : pastMeetings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {b('No past meetings recorded yet.', 'لا توجد اجتماعات سابقة مسجّلة بعد.')}
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {/* Archived by YEAR.
                          "organizing them under yearly categories as a primary
                          classification ... would make it easier for users to
                          locate and access the required records"
                          (fb_1787249724). A flat list is fine at five meetings
                          and unusable at fifty — and this archive only grows,
                          since minutes are kept indefinitely.
                          Grouped here rather than in the API: the board portal
                          already has the meetings, and the year is a property
                          of the date it already renders. */}
                      {Object.entries(
                        (pastMeetings as any[]).reduce((acc: Record<string, any[]>, m: any) => {
                          const y = m.scheduled_at
                            ? new Date(m.scheduled_at).getFullYear().toString()
                            : b('Undated', 'بدون تاريخ');
                          (acc[y] = acc[y] || []).push(m);
                          return acc;
                        }, {})
                      )
                        .sort(([a], [b2]) => b2.localeCompare(a))
                        .map(([year, meetings]: [string, any]) => (
                      <div key={year}>
                        <h4 className="mb-2 text-sm font-semibold text-slate-900">
                          {year}
                          <span className="ms-2 text-xs font-normal text-muted-foreground">
                            {meetings.length} {meetings.length === 1
                              ? b('meeting', 'اجتماع') : b('meetings', 'اجتماعات')}
                          </span>
                        </h4>
                        <div className="space-y-3">
                      {meetings.map((m: any) => (
                        <div key={m.id} className="rounded-xl border p-4">
                          <p className="font-semibold text-slate-900">
                            {isRTL && m.title_ar ? m.title_ar : m.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {m.scheduled_at
                              ? new Date(m.scheduled_at).toLocaleString(isRTL ? 'ar-AE' : 'en-GB',
                                  { dateStyle: 'long', timeStyle: 'short' })
                              : ''}
                          </p>
                          {/* The attendance record for THIS meeting — what the
                              minutes have to state. Offered next to the minutes
                              because that is when it is needed. */}
                          <div className="mt-2 flex items-center gap-3">
                            <button type="button" onClick={() => openAttendance(m)}
                                    className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900">
                              {b('Attendance', 'سجل الحضور')}
                            </button>
                            {typeof m.attended_count === 'number' && (
                              <span className="text-xs text-slate-500">
                                {b(`${m.attended_count} attended`, `${m.attended_count} حضروا`)}
                              </span>
                            )}
                          </div>
                          <BoardMinutesPanel meetingId={m.id} compact />
                        </div>
                      ))}
                        </div>
                      </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="directives" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Implementation status of board recommendations. Percentages are
                  set by each recommendation's owner — the platform never infers
                  them — and the overall figure states how much of the portfolio
                  it actually covers. */}
              {recSummary && (
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base text-slate-800 font-dubai-bold">
                      {b('Implementation of board recommendations', 'تنفيذ توصيات المجلس')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: b('Completed', 'مكتملة'), value: recSummary.counts?.completed ?? 0, cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                        { label: b('In progress', 'قيد التنفيذ'), value: recSummary.counts?.in_progress ?? 0, cls: 'text-blue-700 bg-blue-50 border-blue-100' },
                        { label: b('Outstanding', 'لم تبدأ'), value: recSummary.counts?.outstanding ?? 0, cls: 'text-amber-700 bg-amber-50 border-amber-100' },
                        { label: b('Overall completion', 'نسبة الإنجاز الإجمالية'),
                          value: recSummary.overall_completion_percent == null ? b('Not set', 'غير محددة') : `${recSummary.overall_completion_percent}%`,
                          cls: 'text-slate-800 bg-slate-50 border-slate-200' },
                      ].map((k: any) => (
                        <div key={k.label} className={`rounded-xl border p-4 text-center ${k.cls}`}>
                          <p className="text-2xl font-dubai-bold">{k.value}</p>
                          <p className="text-xs mt-1">{k.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {recSummary.overall_completion_percent == null
                        ? b('No recommendations are being tracked yet.', 'لا توجد توصيات قيد المتابعة بعد.')
                        : `${b('Completed counts as 100%, outstanding as 0%; in-progress uses the percentage its owner recorded.', 'المكتملة تُحتسب 100%، وغير المبدوءة 0%، وقيد التنفيذ حسب النسبة التي سجّلها مالكها.')} ${recSummary.assessed}/${recSummary.total_tracked} ${b('have a percentage recorded.', 'منها سُجِّلت لها نسبة.')}`}
                    </p>

                    {/* By action owner.
                        Chairman's decision 2026-08-21: no board member engagement
                        percentage; accountability is related to the OWNER OF THE
                        ACTION. Shows who is accountable and what is late, and
                        deliberately no score for the person — the percentages
                        belong to the actions listed below. */}
                    {(recSummary.by_owner || []).length > 0 && (
                      <div className="rounded-lg border mb-3">
                        <div className="border-b px-4 py-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {b('By action owner', 'حسب مالك الإجراء')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {b('Who is accountable, and what is overdue. No score is calculated for a person.',
                               'من المسؤول، وما هو المتأخر. لا تُحتسب أي درجة للأشخاص.')}
                          </p>
                        </div>
                        <div className="divide-y">
                          {(recSummary.by_owner || []).map((g: any, i: number) => (
                            <div key={g.owner_id || `entity-${i}`}
                                 className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                              <div className="min-w-0">
                                <p dir="auto" className="text-sm font-medium text-slate-900">
                                  {[g.owner_name, g.owner_entity].filter(Boolean).join(' · ')
                                    || b('No owner assigned', 'لم يُحدَّد مسؤول')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {g.counts.completed} {b('completed', 'مكتملة')}
                                  {' · '}{g.counts.in_progress} {b('in progress', 'قيد التنفيذ')}
                                  {' · '}{g.counts.outstanding} {b('outstanding', 'لم تبدأ')}
                                </p>
                              </div>
                              {g.overdue > 0 && (
                                <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                                  {g.overdue} {b('overdue', 'متأخرة')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grouped under the meeting they came from (GH #459).
                        "a main heading that reflects the meeting name,
                         presented in a larger and bold font" (fb_1787251574).
                        Unlinked recommendations are shown last under their own
                        heading rather than hidden — today that is all of them,
                        because the link was never written until now, and the
                        secretariat attaches them from the Recommendations tab. */}
                    <div className="space-y-5">
                      {(recSummary.by_meeting || []).map((g: any, gi: number) => (
                        <div key={g.meeting_id || `unlinked-${gi}`}>
                          <h3 className="text-base font-dubai-bold text-slate-900">
                            {g.meeting_id
                              ? (isRTL && g.meeting_title_ar ? g.meeting_title_ar : g.meeting_title)
                              : b('Not linked to a meeting', 'غير مرتبطة باجتماع')}
                          </h3>
                          {g.meeting_date && (
                            <p className="mb-2 text-xs text-muted-foreground">
                              {new Date(g.meeting_date).toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB',
                                { dateStyle: 'long' } as any)}
                            </p>
                          )}
                          {!g.meeting_id && (
                            <p className="mb-2 text-xs text-muted-foreground">
                              {b('The Board Secretariat can attach these to the meeting they came from.',
                                 'يمكن لأمانة المجلس ربط هذه التوصيات بالاجتماع الذي صدرت عنه.')}
                            </p>
                          )}
                    <div className="space-y-2">
                      {(g.items || []).map((it: any) => (
                        <div key={it.id} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">{it.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {it.owner_name ? `${b('Owner:', 'المسؤول:')} ${it.owner_name}` : b('No owner assigned', 'لم يُحدَّد مسؤول')}
                                {it.due_date ? ` · ${b('Due', 'الاستحقاق')} ${new Date(it.due_date).toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB')}` : ''}
                                {it.overdue ? ` · ${b('OVERDUE', 'متأخرة')}` : ''}
                              </p>
                              {/* The secretary may record progress on a member's
                                  behalf (owner ruling 2026-08-21). On the board's
                                  own view especially, a figure entered by someone
                                  other than the owner must not read as the owner's
                                  own statement. */}
                              {it.recorded_on_behalf && it.completion_updated_by_name && (
                                <p dir="auto" className="text-xs text-muted-foreground">
                                  {b(`Progress recorded by ${it.completion_updated_by_name}`,
                                     `سجّل التقدّم ${it.completion_updated_by_name}`)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="rounded-full border px-2.5 py-0.5 text-xs text-slate-700 bg-slate-50">
                                {({
                                  open: b('Outstanding', 'لم تبدأ'),
                                  outstanding: b('Outstanding', 'لم تبدأ'),
                                  in_progress: b('In progress', 'قيد التنفيذ'),
                                  completed: b('Completed', 'مكتملة'),
                                  resolved: b('Completed', 'مكتملة'),
                                  deferred: b('Deferred', 'مؤجلة'),
                                  cancelled: b('Cancelled', 'ملغاة'),
                                } as Record<string, string>)[String(it.status || 'open').toLowerCase()]
                                  || it.status}
                              </span>
                              <span className="text-xs text-muted-foreground w-16 text-end">
                                {it.completion_percent == null
                                  ? b('not set', 'غير محددة')
                                  : `${it.completion_percent}%`}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-emerald-600"
                              style={{ width: `${it.completion_percent ?? 0}%` }}
                            />
                          </div>
                          {it.completion_percent == null && (
                            <p className="text-[11px] text-slate-400 mt-1">{b('Progress not yet recorded', 'لم تُسجَّل نسبة الإنجاز')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}


              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-dubai-bold text-slate-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {b('Active Directives', 'التوجيهات النشطة')}
                  </h3>
                  {directives.length === 0 ? (
                    <Card className="bg-white border border-slate-200/80">
                      <CardContent className="p-8 text-center text-slate-500 font-dubai-medium">
                        {b('No active directives.', 'لا توجد توجيهات نشطة.')}
                      </CardContent>
                    </Card>
                  ) : (
                    directives.map((dir) => (
                      <Card key={dir.id} className="bg-white border border-slate-200/80 hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            <CardTitle className="text-base font-dubai-bold text-slate-800">{dir.title}</CardTitle>
                            <Badge className={dir.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                              {dir.status === 'open' ? <Clock className="h-3 w-3 me-1 inline" /> : <CheckCircle className="h-3 w-3 me-1 inline" />}
                              {dir.status}
                            </Badge>
                          </div>
                          <CardDescription className="flex gap-2 mt-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            <Badge variant="outline" className="text-[10px] font-dubai-medium">{dir.category?.replace('_', ' ')}</Badge>
                            <span className="text-[10px] text-slate-400 font-dubai">{new Date(dir.created_at).toLocaleDateString()}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 font-dubai-medium">{dir.body}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Issue Directive Form */}
                <Card className="bg-white border border-emerald-100 sticky top-24">
                  <CardHeader className="pb-2 border-b border-emerald-100 bg-emerald-50/30">
                    <CardTitle className="text-base text-emerald-900 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b('Issue Directive', 'إصدار توجيه')}
                    </CardTitle>
                    <CardDescription className="font-dubai-medium text-xs" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b('Send a strategic directive to the Operations Team', 'أرسل توجيه استراتيجي لفريق العمليات')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-dubai-medium text-slate-600">{b('Title', 'العنوان')}</label>
                      <Input
                        id="directive-title"
                        placeholder={b('e.g., Investigate placement drop', 'مثال: التحقيق في انخفاض التوظيف')}
                        value={newDirective.title}
                        onChange={e => setNewDirective({...newDirective, title: e.target.value})}
                        className="font-dubai"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-dubai-medium text-slate-600">{b('Category', 'الفئة')}</label>
                      <Select value={newDirective.category} onValueChange={v => setNewDirective({...newDirective, category: v})}>
                        <SelectTrigger className="font-dubai"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strategic_priority">{b('Strategic Priority', 'أولوية استراتيجية')}</SelectItem>
                          <SelectItem value="data_request">{b('Data Request', 'طلب بيانات')}</SelectItem>
                          <SelectItem value="improvement_suggestion">{b('Improvement Suggestion', 'اقتراح تحسين')}</SelectItem>
                          <SelectItem value="policy_direction">{b('Policy Direction', 'توجيه سياسات')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-dubai-medium text-slate-600">{b('Details', 'التفاصيل')}</label>
                      <Textarea
                        placeholder={b('Context and required actions...', 'السياق والإجراءات المطلوبة...')}
                        className="min-h-[100px] font-dubai"
                        value={newDirective.body}
                        onChange={e => setNewDirective({...newDirective, body: e.target.value})}
                      />
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-dubai-medium" onClick={submitDirective}>
                      <Send className="h-4 w-4 me-2" />
                      {b('Submit Directive', 'إرسال التوجيه')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              EMIRATISATION TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="emiratisation" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Emiratis entering private-sector work, by year.
                  The basis line is rendered WITH the chart, not tucked into a
                  tooltip: this counts people employed today, so earlier years
                  are undercounted by survivorship and the rise is part real
                  hiring and part attrition. A board slide that lost that
                  sentence would read as a fivefold hiring increase, which the
                  data cannot support on its own. */}
              {/* WHERE EMIRATIS WORK. Horizontal bars, not a pie: 21 sectors
                  is far past the number of slices anyone can compare by angle,
                  and the question here ("which sectors absorb Emiratis") is a
                  ranking question, which length answers and angle does not.

                  "Not stated" is plotted with the rest rather than filtered out.
                  It is the fourth largest bar at 4,091 — hiding it would make
                  the visible bars look like the whole population. */}
              {empTimeline?.sector_distribution?.length > 0 && (
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="font-dubai-bold text-slate-900 text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b('Where Emiratis work — by business sector', 'أين يعمل الإماراتيون — حسب القطاع')}
                    </CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-500 text-xs" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b(`${(empTimeline.total_records || 0).toLocaleString()} people currently in private-sector employment`,
                         `${(empTimeline.total_records || 0).toLocaleString()} شخصاً على رأس العمل في القطاع الخاص`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ width: '100%', height: 560 }}>
                      <ResponsiveContainer>
                        <BarChart data={empTimeline.sector_distribution} layout="vertical"
                                  margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          {/* NOT reversed in RTL. `reversed` on a category axis
                              inverts the ORDER, which put the smallest sector at
                              the top and made the Arabic chart rank backwards
                              against the English one. Mirroring the layout is
                              the axis orientation's job; the ranking is the same
                              fact in both languages. */}
                          <YAxis type="category" dataKey={isRTL ? 'sector_ar' : 'sector'} width={190}
                                 tick={{ fontSize: 11 }} interval={0}
                                 orientation={isRTL ? 'right' : 'left'} />
                          <Tooltip formatter={(v: any, _n: any, p: any) =>
                            `${(v as number).toLocaleString()} (${p?.payload?.pct}%)`} />
                          <Bar dataKey="headcount" fill="#047857" radius={[0, 3, 3, 0]}
                               name={b('Employees', 'موظفون')} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b(empTimeline.sector_basis || '',
                         'أين يعمل حالياً الـ٣٣٬٣٥٢ إماراتياً الواردون في هذا الملف، عبر جميع السنوات — وليس من يوظّف الآن. تظهر فئة "غير مذكور" ولم تُستبعد: يوفّر المصدر رمز المنشأة ويحمل القطاع لـ٨٧٫٧٪ من السجلات، واستبعاد الباقي كان سيضخّم حصة كل قطاع بنحو الثُمن.')}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* MONTHLY view. The yearly chart above cannot show seasonality,
                  and the seasonality is the largest feature in this data: June
                  and December each hold ~18% of all starts against ~5% for a
                  typical month — graduation and year-end hiring, verified not to
                  be a defaulted date.

                  Defaults to the last three years rather than all 200 months.
                  Before 2022 the monthly counts are in single and double digits
                  and would compress the recent years into an unreadable strip —
                  the full range stays one click away rather than being the
                  thing that makes the chart useless. */}
              {empTimeline?.by_month?.length > 0 && (
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="font-dubai-bold text-slate-900 text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {b('Job starts by month', 'بدء الوظائف شهرياً')}
                        </CardTitle>
                        <CardDescription className="font-dubai-medium text-slate-500 text-xs" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {b('Month their current job began', 'الشهر الذي بدأت فيه وظيفتهم الحالية')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                        {([3, 5, 0] as const).map((yrs) => (
                          <button
                            key={yrs}
                            onClick={() => setMonthSpan(yrs)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              monthSpan === yrs ? 'bg-white text-[#006E6D] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {yrs === 0 ? b('All', 'الكل') : b(`Last ${yrs} years`, `آخر ${yrs} سنوات`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <ComposedChart data={monthlySeries}>
                          <XAxis dataKey="ym" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
                          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 100]}
                                 unit="%" tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any, n: any) =>
                            (n === 'nafis_support_pct' || String(n).includes('%') || String(n).includes('نافس'))
                              ? `${v}%` : (v as number).toLocaleString()} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar yAxisId="left" dataKey="starts" fill="#047857" radius={[3, 3, 0, 0]}
                               name={b('Job starts', 'بدء وظائف')} />
                          {/* connectNulls stays FALSE. Months below the
                              reporting threshold return null, and bridging the
                              gap would draw a confident line through exactly
                              the months the backend declined to rate. */}
                          <Line yAxisId="right" type="monotone" dataKey="nafis_support_pct"
                                stroke="#b45309" strokeWidth={1.5} dot={false}
                                connectNulls={false}
                                name={b('% on NAFIS support', '٪ على دعم نافس')} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b(empTimeline.month_basis || '',
                         'بدء الوظائف شهرياً لمن هم على رأس العمل حالياً. يونيو وديسمبر ذروتا توظيف حقيقيتان وليستا خطأً في البيانات — إذ تتوزع تواريخ الالتحاق على أيام الشهر ولا تتركز في تاريخ افتراضي واحد. الشهر الحالي غير مكتمل، و١١ سجلاً تحمل تاريخ التحاق مستقبلياً (تم التوقيع ولم يبدأ العمل بعد). ولا تُرسم نسبة الدعم للأشهر التي تقل فيها حالات الالتحاق عن ٣٠ حالة، إذ تصبح النسبة عندها بلا دلالة؛ كما تبدو الأشهر الأحدث منخفضة لأن دعم الملتحقين حديثاً غالباً لم يبدأ صرفه بعد، لا لأن عدداً أقل منهم مؤهل.')}
                    </p>
                  </CardContent>
                </Card>
              )}

              {empTimeline?.by_year?.length > 0 && (
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="font-dubai-bold text-slate-900 text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b('Emiratis entering private-sector employment', 'الإماراتيون الملتحقون بالقطاع الخاص')}
                    </CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-500 text-xs" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b(`Year their current job began · ${(empTimeline.total_records || 0).toLocaleString()} records`,
                         `سنة بدء وظيفتهم الحالية · ${(empTimeline.total_records || 0).toLocaleString()} سجل`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        {/* Two axes on purpose. The bars are counts and carry
                            survivorship bias; the line is a RATE, whose
                            numerator and denominator are biased together, so it
                            is the more trustworthy of the two series. Plotting
                            the rate as another bar would invite reading them as
                            the same kind of number. */}
                        <ComposedChart data={empTimeline.by_year}>
                          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 100]}
                                 unit="%" tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any, n: any) =>
                            (n === 'nafis_support_pct' || String(n).includes('%') || String(n).includes('نافس'))
                              ? `${v}%` : (v as number).toLocaleString()} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar yAxisId="left" dataKey="starts" fill="#047857" radius={[4, 4, 0, 0]}
                               name={b('Job starts', 'بدء وظائف')} />
                          <Line yAxisId="right" type="monotone" dataKey="nafis_support_pct"
                                stroke="#b45309" strokeWidth={2} dot={{ r: 2 }}
                                name={b('% on NAFIS support', '٪ على دعم نافس')} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {empTimeline.nafis_basis && (
                        <span className="block mb-2">
                          {b(empTimeline.nafis_basis,
                             'نسبة كل دفعة توظيف تتلقى حالياً دعم الرواتب من نافس. النسبة أكثر موثوقية من الأعداد أعلاه لأن التحيّز يؤثر على البسط والمقام معاً. السنة الأخيرة تبدو منخفضة لأن دعم الملتحقين حديثاً قد لا يكون قد بدأ صرفه بعد، لا لأن عدداً أقل منهم مؤهل.')}
                        </span>
                      )}
                      {b(empTimeline.basis,
                         'يُحتسب تاريخ بدء الوظيفة الحالية لمن هم على رأس العمل الآن. السنوات الأقدم منقوصة: من ترك عمله لا يظهر في المصدر، لذا فإن الاتجاه الصاعد يعكس نمو التوظيف وبقاء الوظائف الحديثة معاً، وليس إجمالي التوظيف في أي سنة.')}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {b('Executive Emiratisation Overview', 'نظرة عامة تنفيذية على التوطين')}
                  </CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-500 text-xs" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {b('High-level view of national targets and NAFIS integration', 'نظرة عامة على الأهداف الوطنية وتكامل نافس')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                      <Target className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-3xl font-dubai-bold text-emerald-700">—</p>
                      <p className="text-sm text-emerald-600 font-dubai-medium mt-1">{b(`${targetYear} Target`, `هدف ${targetYear}`)}</p>
                      <Progress value={kpis.emiratization_target_progress || 0} className="h-2 mt-3" />
                      <p className="text-xs text-emerald-500 mt-1 font-dubai">{kpis.emiratization_target_progress != null ? `${kpis.emiratization_target_progress}% ${b('toward target', 'نحو الهدف')}` : b('Target not yet connected', 'الهدف غير متصل بعد')}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-blue-50 border border-blue-100 text-center">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-3xl font-dubai-bold text-blue-700">—</p>
                      <p className="text-sm text-blue-600 font-dubai-medium mt-1">{b('Emirati Employees', 'الموظفون الإماراتيون')}</p>
                      <p className="text-xs text-blue-500 mt-2 font-dubai">{b('Not yet connected to live data', 'غير متصل بالبيانات المباشرة بعد')}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-amber-50 border border-amber-100 text-center">
                      <Building2 className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-3xl font-dubai-bold text-amber-700">—</p>
                      <p className="text-sm text-amber-600 font-dubai-medium mt-1">{b('Priority Sectors', 'القطاعات ذات الأولوية')}</p>
                      <p className="text-xs text-amber-500 mt-2 font-dubai">{b('Not yet connected to live data', 'غير متصل بالبيانات المباشرة بعد')}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 font-dubai-medium text-center" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {b('Illustrative — figures above are not yet connected to live aggregate data.', 'قيم توضيحية — الأرقام أعلاه غير متصلة بالبيانات الإجمالية المباشرة بعد.')}
                  </p>

                  {/* Sector Chart */}
                  <div className="mt-6">
                    <Card className="border border-slate-200/80">
                      <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          <Globe className="h-4 w-4 text-emerald-600" />
                          {b('Placement Distribution by Sector', 'توزيع التعيينات حسب القطاع')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={executiveData?.sector_distribution || []} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                              <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                              <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" fill="#10B981" radius={[0, 6, 6, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              DEMOGRAPHICS TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="demographics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Sub-tab selector */}
              <div className="flex gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {[
                  { id: 'main' as const, label: b('Main Overview', 'نظرة عامة'), icon: Users },
                  { id: 'priority' as const, label: b('Priority Segments', 'الشرائح ذات الأولوية'), icon: Shield },
                ].map(tab => (
                  <Button key={tab.id} variant={demoSubTab === tab.id ? 'default' : 'outline'}
                    size="sm" onClick={() => setDemoSubTab(tab.id)}
                    className={`font-dubai-medium flex items-center gap-2 ${demoSubTab === tab.id ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white hover:bg-slate-50'}`}>
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </Button>
                ))}
              </div>

              {/* Scope. These charts cover RECORDED people — imported from NAFIS
                  and the CRM master file — not people who have signed in. The
                  same disclosure the population strip carries, for the same
                  reason: the headcount alone is a claim the data does not make. */}
              {demoCut && (
                <div
                  className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  <span className="font-dubai-bold text-slate-800">
                    {demoCut.total.toLocaleString(isRTL ? 'ar-AE' : 'en-US')}{' '}
                    {b('recorded people', 'شخصاً مسجّلاً في البيانات')}
                  </span>
                  {' — '}
                  {isRTL ? demographicsData?.scope_note_ar : demographicsData?.scope_note}
                </div>
              )}

              {/* MAIN OVERVIEW */}
              {demoSubTab === 'main' && demoCut && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gender Distribution */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <PieChartIcon className="h-4 w-4 text-emerald-600" />
                        {b('Gender Distribution', 'توزيع الجنس')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={demoGender} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={105} paddingAngle={4}>
                              {demoGender.map((_: any, i: number) => (
                                <Cell key={`g-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <DemoCoverage field="gender" />
                    </CardContent>
                  </Card>

                  {/* Age Group */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Users className="h-4 w-4 text-blue-600" />
                        {b('Age Group Distribution', 'توزيع الفئات العمرية')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demoAge} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name={b('Candidates', 'المرشحون')} fill="#3B82F6" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <DemoCoverage field="age" />
                    </CardContent>
                  </Card>

                  {/* Education */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Award className="h-4 w-4 text-purple-600" />
                        {b('Education Levels', 'المستويات التعليمية')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demoEducation} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name={b('Candidates', 'المرشحون')} fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <DemoCoverage field="education" />
                    </CardContent>
                  </Card>

                  {/* Employment Status */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Briefcase className="h-4 w-4 text-amber-600" />
                        {b('Employment Status', 'الحالة الوظيفية')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demoEmployment} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                            <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name={b('Count', 'العدد')} fill="#F59E0B" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <DemoCoverage field="employment" />
                      {/* work_status and looking_status are INDEPENDENT axes
                          (populations.py): "Not working" is not the same set as
                          "actively seeking" — 363 people are neither, and 108
                          are employed and looking to move. Saying so stops the
                          bar being read as the job-seeker count. */}
                      <div className="mt-1 text-[11px] text-slate-500 leading-relaxed"
                           style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        {b('Work status only. Whether someone is actively seeking work is a separate question — some employed people are looking to move, and some who are not working are not seeking.',
                           'حالة العمل فقط. أما البحث الفعلي عن عمل فهو سؤال منفصل — فبعض الموظفين يبحثون عن فرصة أخرى، وبعض غير العاملين لا يبحثون عن عمل.')}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* PRIORITY SEGMENTS */}
              {demoSubTab === 'priority' && demoCut && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Military Service */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Shield className="h-4 w-4 text-amber-600" />
                        {b('National Service Status', 'حالة الخدمة الوطنية')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demoMilitary} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name={b('Count', 'العدد')} fill="#F59E0B" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <DemoCoverage field="military" />
                    </CardContent>
                  </Card>

                  {/* Marital Status */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Users className="h-4 w-4 text-purple-600" />
                        {b('Marital Status', 'الحالة الاجتماعية')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={demoMarital} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}>
                              {demoMarital.map((_: any, i: number) => (
                                <Cell key={`m-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <DemoCoverage field="marital" />
                    </CardContent>
                  </Card>

                  {/* Emirate of Residence */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Globe className="h-4 w-4 text-teal-600" />
                        {b('Emirate of Residence', 'إمارة الإقامة')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demoEmirate} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
                            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name={b('Candidates', 'المرشحون')} fill="#14B8A6" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <DemoCoverage field="emirate" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Empty state */}
              {!demoCut && (
                <Card className="bg-white border border-slate-200/80">
                  <CardContent className="p-8 text-center text-slate-500 font-dubai-medium">
                    <UserCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    {b('Demographics data is loading or unavailable.', 'بيانات التركيبة السكانية قيد التحميل أو غير متوفرة.')}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          </Tabs>

          {/* ─── AI Strategic Brief Modal ─── */}
          <Dialog open={briefModalOpen} onOpenChange={setBriefModalOpen}>
            <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200">
              <DialogHeader>
                <DialogTitle className="font-dubai-bold text-lg text-slate-900 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-emerald-600 animate-pulse" />
                  {b('AI Strategic Briefing', 'موجز استراتيجي ذكي')}
                </DialogTitle>
                <DialogDescription className="font-dubai-medium text-xs text-slate-400">
                  {b('AI-powered assessment of the national talent pipeline.', 'تقييم مدعوم بالذكاء الاصطناعي لمسار الكفاءات الوطنية.')}
                </DialogDescription>
              </DialogHeader>
              {/* NOTE: the three hardcoded "insight" blocks (invented +14/+18% growth,
                  50% compliance, "12,000 completed profiles") were removed — they were
                  fabricated narrative, not a real model output (data-honesty audit). */}
              <div className="space-y-4 my-4 font-dubai">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <Brain className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-dubai-medium">
                    {b(
                      'Strategic briefing is not yet connected to a live analytics model. Insights will appear here once real pipeline data is available.',
                      'الموجز الاستراتيجي غير متصل بعد بنموذج تحليلي مباشر. ستظهر الرؤى هنا بمجرد توفر بيانات حقيقية لمسار الكفاءات.'
                    )}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setBriefModalOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium w-full">
                  {b('Close Briefing', 'إغلاق الموجز')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Insight Detail Modal ─── */}
          <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
            <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200">
              {selectedInsight && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={selectedInsight.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                        {selectedInsight.theme?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <DialogTitle className="font-dubai-bold text-lg text-slate-900">
                      {selectedInsight.title}
                    </DialogTitle>
                    <DialogDescription className="font-dubai-medium text-xs text-slate-400">
                      {b('Strategic Recommendation & Analysis', 'التوصيات الاستراتيجية والتحليل')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 my-4 font-dubai">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                      <h4 className="text-xs font-dubai-bold text-slate-500 uppercase tracking-wider mb-1">{b('Observation', 'الملاحظة')}</h4>
                      <p className="text-sm text-slate-700 font-dubai-medium">{selectedInsight.description}</p>
                    </div>
                    {/* Actions come from the insight itself — no canned bullets
                        pretending every insight has the same three remedies. */}
                    {Array.isArray(selectedInsight.actions) && selectedInsight.actions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-dubai-bold text-slate-700 uppercase tracking-wider">{b('Recommended Actions', 'الإجراءات الموصى بها')}</h4>
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 font-dubai-medium">
                          {selectedInsight.actions.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedInsight(null)} className="font-dubai-medium flex-1">
                      {b('Dismiss', 'إغلاق')}
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium flex-1" onClick={() => {
                      setNewDirective({
                        title: b(`Action on: ${selectedInsight.title}`, `إجراء بشأن: ${selectedInsight.title}`),
                        body: b(`Based on AI Insight: "${selectedInsight.description}", we direct the operations team to implement the recommended action plans.`, `بناءً على الرؤية الذكية: "${selectedInsight.description}"، نوجه فريق العمليات بتنفيذ خطط العمل الموصى بها.`),
                        category: 'strategic_priority',
                        priority: selectedInsight.severity === 'warning' ? 'high' : 'normal'
                      });
                      setSelectedInsight(null);
                      handleTabChange('directives');
                      setTimeout(() => document.getElementById('directive-title')?.focus(), 200);
                    }}>
                      {b('Convert to Directive', 'تحويل إلى توجيه')}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

      {/* Edit a scheduled meeting (fb_1787145612). Agenda is the field that
          prompted this — topics arrive after the invitation goes out. */}
      <Dialog open={!!editingMeeting} onOpenChange={(o) => !o && setEditingMeeting(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{b('Edit meeting', 'تعديل الاجتماع')}</DialogTitle>
            <DialogDescription>
              {b('Members are not notified of these changes. Rescheduling is separate.',
                 'لن يتم إشعار الأعضاء بهذه التغييرات. إعادة الجدولة منفصلة.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">{b('Title', 'العنوان')}</label>
              <Input value={editForm.title}
                     onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                     className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{b('Agenda', 'جدول الأعمال')}</label>
              <Textarea value={editForm.agenda} rows={6}
                        onChange={(e) => setEditForm(f => ({ ...f, agenda: e.target.value }))}
                        placeholder={b('One topic per line', 'موضوع واحد في كل سطر')}
                        className="mt-1" />
            </div>
            {editingMeeting && !editingMeeting.is_virtual && (
              <div>
                <label className="text-sm font-medium text-slate-700">{b('Location', 'المكان')}</label>
                <Input value={editForm.location}
                       onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
                       className="mt-1" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMeeting(null)} disabled={savingMeeting}>
              {b('Cancel', 'إلغاء')}
            </Button>
            <Button onClick={saveMeeting} disabled={savingMeeting || !editForm.title.trim()}>
              {savingMeeting ? b('Saving…', 'جارٍ الحفظ…') : b('Save changes', 'حفظ التغييرات')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance for one meeting. Deliberately NOT a cross-meeting
          performance view — see openAttendance. */}
      <Dialog open={!!attendanceFor} onOpenChange={(o) => !o && setAttendanceFor(null)}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{b('Attendance', 'سجل الحضور')}</DialogTitle>
            <DialogDescription>
              {attendanceFor ? (isRTL && attendanceFor.title_ar ? attendanceFor.title_ar : attendanceFor.title) : ''}
            </DialogDescription>
          </DialogHeader>

          {attendanceLoading ? (
            <p className="text-sm text-muted-foreground">{b('Loading…', 'جارٍ التحميل…')}</p>
          ) : !attendance ? (
            /* "Could not load" is not "nobody came". */
            <p className="text-sm text-amber-700">
              {b('The attendance record could not be loaded.', 'تعذّر تحميل سجل الحضور.')}
            </p>
          ) : !attendance.attendees?.length ? (
            <p className="text-sm text-muted-foreground">
              {b('No attendance was recorded for this meeting.', 'لم يُسجَّل حضور لهذا الاجتماع.')}
            </p>
          ) : (
            <div className="space-y-2">
              {!attendance.meeting_ran && (
                /* Percentages are measured against the scheduled length when the
                   meeting has no recorded start and end — say so rather than
                   present them as observed. */
                <p className="text-xs text-slate-500">
                  {b('This meeting has no recorded start and end, so times are measured against its scheduled length.',
                     'لا يوجد وقت بدء وانتهاء مسجل لهذا الاجتماع، لذا تُقاس الأوقات مقابل المدة المجدولة.')}
                </p>
              )}
              <div className="max-h-[340px] overflow-y-auto rounded-lg border">
                {attendance.attendees.map((a: any) => (
                  <div key={a.user_id}
                       className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{a.name || a.user_id}</p>
                      <p className="text-xs text-slate-500">
                        {a.invite_status === 'observer'
                          ? b('Observer — not counted toward quorum', 'مراقب — لا يُحتسب في النصاب')
                          : a.invite_status}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-sm text-slate-800">{presenceLabel(a)}</p>
                      {a.duration_is_upper_bound && (
                        /* The interval was closed by the meeting ending rather
                           than the member leaving, so the figure is a ceiling. */
                        <p className="text-[11px] text-slate-400">
                          {b('at most', 'كحد أقصى')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceFor(null)}>
              {b('Close', 'إغلاق')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
