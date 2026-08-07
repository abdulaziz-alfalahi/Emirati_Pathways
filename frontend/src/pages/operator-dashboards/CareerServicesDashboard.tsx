import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, Briefcase, FileText, UserPlus, Save, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, Users, CheckCircle2, AlertCircle, BarChart3, TrendingUp, MessageCircle, MessageSquare, Mail, StickyNote } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip,
  Legend, CartesianGrid, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { restClient } from '@/utils/api';
import { toast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import Messages from '@/components/recruiter/Messages';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CareerServicesDashboard() {
  const { language, toggleLanguage } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [view, setView] = useState<'candidates' | 'analytics' | 'messages'>('candidates');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('All');
  const [workStatusFilter, setWorkStatusFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Editing Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  // When the roster genuinely last came from NAFIS. The refresh button below
  // re-reads this database and contacts NAFIS not at all, so its own timestamp
  // would say nothing about the freshness of the data.
  const [lastImport, setLastImport] = useState<any>(null);
  // Anonymised and consent-test rows have no contact details, so an agent
  // working the call list only discovers that after opening them.
  const [hideUncontactable, setHideUncontactable] = useState(false);
  const [quickRemarkFor, setQuickRemarkFor] = useState<any>(null);
  const [quickRemark, setQuickRemark] = useState('');
  const [savingQuickRemark, setSavingQuickRemark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchOperators();
    fetchLastImport();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await restClient.get('/api/profile/crm-stats');
      if (res.data?.success) setStats(res.data.data);
    } catch (e) {
      console.error('Failed to fetch CRM stats', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLastImport = async () => {
    try {
      const res = await restClient.get('/api/profile/crm-last-import');
      setLastImport(res.data?.data || null);
    } catch {
      setLastImport(null);
    }
  };

  // A record with no phone and no email cannot be worked by an agent.
  const isUncontactable = (c: any) => {
    const phone = String(c.phone || '').replace(/[^0-9]/g, '');
    const email = String(c.email || '').trim();
    const anonymised = /anonymized|anonymised/i.test(String(c.email || '') + String(c.name || ''));
    return anonymised || (!phone && !email);
  };

  const saveQuickRemark = async () => {
    if (!quickRemarkFor || !quickRemark.trim()) return;
    setSavingQuickRemark(true);
    try {
      const res = await restClient.put(`/api/profile/crm-candidates/${quickRemarkFor.id}`, {
        remarks: quickRemark.trim(),
      });
      if (!res.data?.success) {
        toast({ title: res.data?.message || t('Could not save the remark', 'تعذّر حفظ الملاحظة'), variant: 'destructive' });
        return;
      }
      toast({ title: t('Remark saved', 'تم حفظ الملاحظة') });
      setQuickRemarkFor(null);
      setQuickRemark('');
      fetchCandidates();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('Could not save the remark', 'تعذّر حفظ الملاحظة'), variant: 'destructive' });
    } finally {
      setSavingQuickRemark(false);
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await restClient.get(`/api/profile/crm-candidates?_cb=${Date.now()}`);
      if (res.data?.success && res.data?.data) {
        const mapped = res.data.data.map((user: any) => {
          const profile = user.profile || {};
          const first = user.first_name || '';
          const last = user.last_name || '';
          const fallbackName = [first, last].filter(Boolean).join(' ');
          
          return {
            id: user.id,
            eid: user.national_id || user.id_number || '-',
            name: user.full_name || fallbackName || t('Unnamed Candidate', 'مرشح بدون اسم'),
            callStatus: profile.call_status || 'Pending',
            workStatus: profile.work_status || 'Unknown',
            jobSeekerType: profile.job_seeker_type || 'Unknown',
            segments: Array.isArray(profile.crm_segments) ? profile.crm_segments : [],
            crmReference: profile.crm_reference || null,
            cvStatus: profile.cv_status || '',
            lookingStatus: profile.looking_status || '',
            phone: user.phone || '-',
            remarks: profile.counseling_remarks || '',
            assignedTo: profile.assigned_to || 'Unassigned',
            // assigned_to stores a user id (EID) for new writes; legacy rows hold
            // free-text names. The backend resolves id→name; fall back to the raw
            // value so legacy name-rows still display their name, never an EID.
            assignedToName: profile.assigned_to_name || profile.assigned_to || 'Unassigned',
            dateOfCall: profile.date_of_call || null,
            educationLevel: profile.education_level || '',
            isStudent: profile.is_student,
            specialization: profile.specialization || '',
            englishLevel: profile.english_proficiency || '',
            salaryExpectations: profile.salary_expectations || '',
            candidatesSource: profile.candidates_source || '',
            previousWorkLocation: profile.previous_work_location || '',
            gpa: profile.gpa || '',
            graduationDate: profile.graduation_date || '',
            subSpecialization: profile.sub_specialization || '',
            experienceDuration: profile.experience_duration || '',
            militaryStatus: profile.military_status || '',
            fieldPreference: profile.field_preference || '',
            jobSearchDuration: profile.job_search_duration || '',
            preferredLocations: Array.isArray(profile.preferred_locations)
              ? profile.preferred_locations
              : (typeof profile.preferred_locations === 'string'
                  ? [profile.preferred_locations]
                  : []),
            preferredSector: profile.preferred_sector || '',
            preferredWorkSetup: profile.preferred_work_setup || '',
            preferredSchedule: profile.preferred_schedule || '',
            alternativePhone: profile.alternative_phone || '',
            unavailabilityReason: profile.unavailability_reason || '',
            rolePreferences: profile.role_preferences || '',
          };
        });
        setCandidates(mapped);
      } else {
        setCandidates([]);
      }
    } catch (e) {
      console.error(e);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    // C3: real operator source so candidates can be assigned to a caseload.
    // The CRM is staffed by career-services operators and call-centre agents.
    try {
      const roles = ['career_services_operator', 'call_center_agent'];
      const results = await Promise.all(
        roles.map(r => restClient.get(`/api/caseload/operators?role=${r}`)
          .then(res => (res as any).data?.operators || (res as any).operators || [])
          .catch(() => []))
      );
      const byId: Record<string, any> = {};
      results.flat().forEach((op: any) => { if (op?.id) byId[op.id] = op; });
      setOperators(Object.values(byId));
    } catch (e) {
      console.error("Failed to fetch operators", e);
      setOperators([]);
    }
  };

  const handleEditClick = (candidate: any) => {
    setEditingCandidate(candidate);
    setEditForm({
      callStatus: candidate.callStatus,
      workStatus: candidate.workStatus,
      remarks: candidate.remarks,
      cvStatus: candidate.cvStatus || '',
      lookingStatus: candidate.lookingStatus || 'none',
      assignedTo: candidate.assignedTo,
      preferredLocations: Array.isArray(candidate.preferredLocations)
        ? candidate.preferredLocations
        : (typeof candidate.preferredLocations === 'string'
            ? candidate.preferredLocations.split(',').map((s: string) => s.trim()).filter(Boolean)
            : []),
      preferredSector: candidate.preferredSector || 'none',
      preferredWorkSetup: candidate.preferredWorkSetup || 'none',
      preferredSchedule: candidate.preferredSchedule || 'none',
      alternativePhone: candidate.alternativePhone || '',
      unavailabilityReason: candidate.unavailabilityReason || 'none',
      rolePreferences: candidate.rolePreferences || '',
      educationLevel: candidate.educationLevel || '',
      isStudent: candidate.isStudent === true ? 'yes' : candidate.isStudent === false ? 'no' : '',
      specialization: candidate.specialization || '',
      englishLevel: candidate.englishLevel || '',
      salaryExpectations: candidate.salaryExpectations || '',
      candidatesSource: candidate.candidatesSource || '',
      previousWorkLocation: candidate.previousWorkLocation || '',
      gpa: candidate.gpa || '',
      graduationDate: candidate.graduationDate || '',
      subSpecialization: candidate.subSpecialization || '',
      experienceDuration: candidate.experienceDuration || '',
      militaryStatus: candidate.militaryStatus || '',
      fieldPreference: candidate.fieldPreference || '',
      jobSearchDuration: candidate.jobSearchDuration || '',
      dateOfCall: candidate.dateOfCall || null,
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editingCandidate) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editForm,
        // Study Status is a Yes/No question in the form and a boolean in the
        // database; '' means the agent has not asked yet, which is not false.
        isStudent: editForm.isStudent === 'yes' ? true
                 : editForm.isStudent === 'no' ? false
                 : null,
        lookingStatus: editForm.lookingStatus === 'none' ? null : editForm.lookingStatus,
        cvStatus: editForm.cvStatus || null,
        preferredSector: editForm.preferredSector === 'none' ? null : editForm.preferredSector,
        preferredWorkSetup: editForm.preferredWorkSetup === 'none' ? null : editForm.preferredWorkSetup,
        preferredSchedule: editForm.preferredSchedule === 'none' ? null : editForm.preferredSchedule,
        unavailabilityReason: editForm.unavailabilityReason === 'none' ? null : editForm.unavailabilityReason,
      };
      await restClient.put(`/api/profile/crm-candidates/${editingCandidate.id}`, payload);
      
      setCandidates(prev => prev.map(c => 
        c.id === editingCandidate.id ? { ...c, ...payload } : c
      ));
      
      toast({ title: t('Saved successfully', 'تم الحفظ بنجاح') });
      setIsSheetOpen(false);
    } catch (error) {
      toast({ title: t('Error saving', 'خطأ في الحفظ'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering Logic
  const uncontactableCount = useMemo(
    () => candidates.filter(isUncontactable).length, [candidates]);

  const filteredCandidates = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return candidates.filter(c => {
      // Anonymised / consent-test rows carry no way to reach anyone, so an
      // agent working the list only finds that out after opening them.
      if (hideUncontactable && isUncontactable(c)) return false;
      const candidateName = c.name ? String(c.name) : '';
      const candidateEid = c.eid ? String(c.eid) : '';
      
      const cleanName = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanEid = candidateEid.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Phone search, requested by the CRM team — they often have only the
      // number to hand. Compare digits so 0501234567, +971501234567 and
      // 971501234567 all find the same person.
      const digitsOnly = (v: any) => String(v || '').replace(/\D/g, '');
      const searchDigits = digitsOnly(searchTerm).replace(/^0+|^971/, '');
      const candidateDigits = digitsOnly(c.phone) + digitsOnly(c.alternativePhone);
      const phoneMatch = searchDigits.length >= 4 && candidateDigits.includes(searchDigits);

      const matchesSearch = !cleanSearch ||
                            cleanName.includes(cleanSearch) ||
                            cleanEid.includes(cleanSearch) ||
                            phoneMatch;
      const matchesCallStatus = callStatusFilter === 'All' || c.callStatus === callStatusFilter;
      const matchesWorkStatus = workStatusFilter === 'All' || c.workStatus === workStatusFilter;
      const matchesSegment = segmentFilter === 'All' || (c.segments || []).includes(segmentFilter);
      return matchesSearch && matchesCallStatus && matchesWorkStatus && matchesSegment;
    });
  }, [candidates, hideUncontactable, searchTerm, callStatusFilter, workStatusFilter, segmentFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedCandidates = filteredCandidates.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // KPIs
  const totalCount = candidates.length;
  const contactedCount = candidates.filter(c => c.callStatus === 'Answered').length;
  const noAnswerCount = candidates.filter(c => c.callStatus === 'No Answer' || c.callStatus === 'Invalid Number').length;
  const unassignedCount = candidates.filter(c => c.assignedTo === 'Unassigned' || !c.assignedTo).length;

  // CRM roster segments (imported from the team's Main Master File; the
  // segment slug is stored in candidate_profiles.crm_segments).
  const SEGMENT_LABELS: Record<string, { en: string; ar: string }> = {
    active: { en: 'Active JS', ar: 'باحث نشط' },
    priority_1: { en: '1st Priority', ar: 'أولوية أولى' },
    priority_2: { en: '2nd Priority', ar: 'أولوية ثانية' },
    priority_3: { en: '3rd Priority', ar: 'أولوية ثالثة' },
    hatta: { en: 'Hatta', ar: 'حتا' },
    cda: { en: 'CDA', ar: 'هيئة تنمية المجتمع' },
    special_request: { en: 'Special Request', ar: 'طلب خاص' },
    gdo: { en: 'GDO', ar: 'GDO' },
    no_answer: { en: 'No Answer', ar: 'لا يوجد رد' },
    prev_employed_21_24: { en: 'Prev Employed 21-24', ar: 'عمل سابقاً 21-24' },
    never_employed_21_24: { en: 'Never Employed 21-24', ar: 'لم يعمل 21-24' },
  };
  const segmentLabel = (seg: string) =>
    SEGMENT_LABELS[seg] ? (isRTL ? SEGMENT_LABELS[seg].ar : SEGMENT_LABELS[seg].en) : seg;

  const CHART_COLORS = ['#0D3B3F', '#3A8E8D', '#76B6B5', '#09897A', '#52ACA1', '#C5EAE1', '#94A3B8', '#F59E0B', '#FB7185', '#64748B'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Answered': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-2 py-0.5 rounded-md font-medium">{status}</Badge>;
      case 'No Answer': return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-none px-2 py-0.5 rounded-md font-medium">{status}</Badge>;
      case 'Invalid Number': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none px-2 py-0.5 rounded-md font-medium">{status}</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none px-2 py-0.5 rounded-md font-medium">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const cleanedParts = parts.filter(p => p.toLowerCase() !== 'undefined' && p.toLowerCase() !== 'null');
    if (cleanedParts.length === 0) return 'U';
    return cleanedParts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir={isRTL ? 'rtl' : 'ltr'}>
      <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
      
      <main className="container mx-auto px-4 py-8" style={{ paddingTop: 100 }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('Career Services CRM', 'نظام إدارة المرشحين')}</h1>
            <p className="text-slate-500 mt-1">{t('Manage candidate engagement and counseling efficiently.', 'إدارة وتوجيه المرشحين المهنيين بفعالية.')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white shadow-sm border border-slate-200 rounded-xl p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView('candidates')}
                className={`rounded-lg px-4 ${view === 'candidates' ? 'bg-[#006E6D] text-white hover:bg-[#005A59] hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {t('Candidates', 'المرشحون')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView('analytics')}
                className={`rounded-lg px-4 ${view === 'analytics' ? 'bg-[#006E6D] text-white hover:bg-[#005A59] hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <BarChart3 className="h-4 w-4 me-1.5" />
                {t('Analytics', 'التحليلات')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView('messages')}
                className={`rounded-lg px-4 ${view === 'messages' ? 'bg-[#006E6D] text-white hover:bg-[#005A59] hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {t('Messages', 'الرسائل')}
              </Button>
            </div>
            {view === 'candidates' && (
              /* Labelled "Sync Nafis Data", this only re-read this database —
                 it has never contacted NAFIS. Operators asked for a "last
                 synced" time beside it, which would have put a reassuring
                 timestamp on a button that syncs nothing. It now says what it
                 does, and the real provenance of the roster is shown under it. */
              <div className="flex flex-col items-end gap-1">
                <Button onClick={() => { fetchCandidates(); fetchLastImport(); }} variant="outline"
                        className="gap-2 bg-white shadow-sm hover:bg-slate-50 border-slate-200 rounded-xl transition-all">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#006E6D]' : 'text-slate-500'}`} />
                  {t('Refresh list', 'تحديث القائمة')}
                </Button>
                <span className="text-[11px] text-slate-500">
                  {lastImport?.imported_at
                    ? t(`NAFIS data last imported ${new Date(lastImport.imported_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
                        `آخر استيراد لبيانات نافس ${new Date(lastImport.imported_at).toLocaleDateString('ar-AE')}`)
                    : t('No NAFIS import recorded', 'لا يوجد استيراد مسجّل من نافس')}
                </span>
              </div>
            )}
          </div>
        </div>

        {view === 'messages' && (
          <Messages senderRole="career_services_operator" showNewConversation />
        )}

        {view === 'analytics' && (
          statsLoading ? (
            <div className="flex flex-col justify-center items-center py-24 bg-white rounded-2xl shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-[#006E6D] mb-4" />
              <p className="text-slate-500 font-medium">{t('Loading analytics...', 'جاري تحميل التحليلات...')}</p>
            </div>
          ) : !stats ? (
            <div className="flex flex-col justify-center items-center py-24 bg-white rounded-2xl shadow-sm text-center">
              <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
              <p className="text-slate-600 font-medium">{t('Analytics are unavailable right now.', 'التحليلات غير متاحة حالياً.')}</p>
              <Button onClick={fetchStats} variant="outline" className="mt-4 rounded-xl">{t('Retry', 'إعادة المحاولة')}</Button>
            </div>
          ) : (
          <div className="space-y-6">
            {/* KPI row from live roster data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: stats.roster_as_of
                    ? t(`CRM Roster — as of ${new Date(stats.roster_as_of).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
                        `سجل المتابعة — بتاريخ ${new Date(stats.roster_as_of).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric' })}`)
                    : t('CRM Roster', 'سجل المتابعة'),
                  value: stats.total_roster, color: 'text-slate-900',
                },
                { label: t('Active Job Seekers', 'الباحثون النشطون'), value: stats.segments?.find((s: any) => s.label === 'active')?.count ?? 0, color: 'text-[#09897A]' },
                { label: t('1st Priority', 'الأولوية الأولى'), value: stats.segments?.find((s: any) => s.label === 'priority_1')?.count ?? 0, color: 'text-teal-700' },
                { label: t('No Answer', 'لا يوجد رد'), value: stats.segments?.find((s: any) => s.label === 'no_answer')?.count ?? 0, color: 'text-rose-500' },
              ].map((kpi) => (
                <Card key={kpi.label} className="border-none shadow-sm bg-white rounded-2xl">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
                    <h3 className={`text-3xl font-bold ${kpi.color}`}>{Number(kpi.value).toLocaleString()}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Weekly added / removed */}
            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#09897A]" />{t('Roster Movement — Weekly', 'حركة السجل — أسبوعياً')}</CardTitle>
                <CardDescription>{t('Job seekers added and removed per weekly refresh (last 26 weeks)', 'الباحثون المضافون والمحذوفون في كل تحديث أسبوعي (آخر 26 أسبوعاً)')}</CardDescription>
              </CardHeader>
              <CardContent className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.roster_history?.weeks || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip />
                    <Legend />
                    <Bar dataKey="added" name={t('Added', 'مضاف')} fill="#09897A" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="removed" name={t('Removed', 'محذوف')} fill="#FB7185" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly trend */}
            <Card className="border-none shadow-sm bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">{t('Roster Movement — Monthly', 'حركة السجل — شهرياً')}</CardTitle>
                <CardDescription>{t('Full history since May 2024', 'السجل الكامل منذ مايو 2024')}</CardDescription>
              </CardHeader>
              <CardContent className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.roster_history?.months || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="added" name={t('Added', 'مضاف')} stroke="#09897A" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="removed" name={t('Removed', 'محذوف')} stroke="#FB7185" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Segments + Work status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">{t('Segments', 'الشرائح')}</CardTitle>
                  <CardDescription>{t('Candidates per CRM segment (a candidate can be in several)', 'المرشحون حسب الشريحة (قد يكون المرشح في أكثر من شريحة)')}</CardDescription>
                </CardHeader>
                <CardContent className="h-80" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(stats.segments || []).map((s: any) => ({ ...s, name: segmentLabel(s.label) }))} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                      <ChartTooltip />
                      <Bar dataKey="count" name={t('Candidates', 'المرشحون')} fill="#3A8E8D" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">{t('Work & Call Status', 'حالة العمل والاتصال')}</CardTitle>
                  <CardDescription>{t('Current roster breakdown', 'توزيع السجل الحالي')}</CardDescription>
                </CardHeader>
                <CardContent className="h-80" dir="ltr">
                  <div className="grid grid-cols-2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.work_status || []} dataKey="count" nameKey="label" innerRadius="45%" outerRadius="70%" paddingAngle={2}>
                          {(stats.work_status || []).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip />
                        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.call_status || []} dataKey="count" nameKey="label" innerRadius="45%" outerRadius="70%" paddingAngle={2}>
                          {(stats.call_status || []).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip />
                        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Demographics row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-white rounded-2xl">
                <CardHeader><CardTitle className="text-lg">{t('Education', 'التعليم')}</CardTitle></CardHeader>
                <CardContent className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.education_level || []} dataKey="count" nameKey="label" outerRadius="70%">
                        {(stats.education_level || []).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white rounded-2xl">
                <CardHeader><CardTitle className="text-lg">{t('Age Groups', 'الفئات العمرية')}</CardTitle></CardHeader>
                <CardContent className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.age_group || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip />
                      <Bar dataKey="count" name={t('Candidates', 'المرشحون')} fill="#0D3B3F" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white rounded-2xl">
                <CardHeader><CardTitle className="text-lg">{t('Gender', 'النوع')}</CardTitle></CardHeader>
                <CardContent className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.gender || []} dataKey="count" nameKey="label" outerRadius="70%">
                        {(stats.gender || []).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
          )
        )}

        {view === 'candidates' && (
        <>


        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-white overflow-hidden relative rounded-2xl group">
            <div className="absolute top-0 end-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <Users className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">{t('Total Candidates', 'إجمالي المرشحين')}</p>
              <h3 className="text-3xl font-bold text-slate-900">{totalCount}</h3>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white overflow-hidden relative rounded-2xl group">
            <div className="absolute top-0 end-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <CheckCircle2 className="w-24 h-24 text-emerald-600" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">{t('Contacted', 'تم التواصل')}</p>
              <h3 className="text-3xl font-bold text-emerald-600">{contactedCount}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative rounded-2xl group">
            <div className="absolute top-0 end-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <AlertCircle className="w-24 h-24 text-amber-500" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">{t('Unassigned', 'غير معين')}</p>
              <h3 className="text-3xl font-bold text-amber-500">{unassignedCount}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative rounded-2xl group">
            <div className="absolute top-0 end-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <Phone className="w-24 h-24 text-rose-500" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">{t('Follow Up Required', 'مطلوب متابعة')}</p>
              <h3 className="text-3xl font-bold text-rose-500">{noAnswerCount}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
          {/* Header & Filters */}
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className={`absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400`} />
                <Input 
                  placeholder={t('Search by name, EID or phone...', 'ابحث بالاسم أو الهوية أو رقم الهاتف...')}
                  className={`ps-10 ${isRTL ? 'pe-3' : ''} bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#006E6D]`}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="flex w-full md:w-auto gap-3">
                <Select value={segmentFilter} onValueChange={(val) => { setSegmentFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px] bg-slate-50 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t('All Segments', 'كل الشرائح')}</SelectItem>
                    {Object.keys(SEGMENT_LABELS).map(seg => (
                      <SelectItem key={seg} value={seg}>{segmentLabel(seg)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={callStatusFilter} onValueChange={(val) => { setCallStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full md:w-[160px] bg-slate-50 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Call Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t('All Call Status', 'كل حالات الاتصال')}</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Answered">Answered</SelectItem>
                    <SelectItem value="No Answer">No Answer</SelectItem>
                    <SelectItem value="Invalid Number">Invalid Number</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={workStatusFilter} onValueChange={(val) => { setWorkStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full md:w-[160px] bg-slate-50 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Work Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t('All Work Status', 'كل حالات العمل')}</SelectItem>
                    <SelectItem value="Working">Working</SelectItem>
                    <SelectItem value="Not Working">Not Working</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideUncontactable}
                    onChange={(e) => { setHideUncontactable(e.target.checked); setCurrentPage(1); }}
                  />
                  {t(`Hide records with no contact details (${uncontactableCount})`,
                     `إخفاء السجلات بدون بيانات اتصال (${uncontactableCount})`)}
                </label>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-20 bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-[#006E6D] mb-4" />
                <p className="text-slate-500 font-medium">{t('Loading candidates...', 'جاري تحميل المرشحين...')}</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-20 bg-white text-center">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('No candidates found', 'لم يتم العثور على مرشحين')}</h3>
                <p className="text-slate-500">{t('Try adjusting your search or filters.', 'حاول تعديل خيارات البحث أو التصفية.')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start whitespace-nowrap">
                  <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('Candidate', 'المرشح')}</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('Phone', 'الهاتف')}</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('Type', 'النوع')}</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('Status', 'الحالة')}</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('Assigned To', 'معين إلى')}</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{t('Latest Remark', 'أحدث ملاحظة')}</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-end">{t('Action', 'الإجراء')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCandidates.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarFallback className="bg-teal-50 text-teal-700 font-semibold">
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-slate-900">{candidate.name}</div>
                              <div className="text-slate-500 text-xs mt-0.5">{candidate.eid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-600 font-medium">{candidate.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">{candidate.jobSeekerType}</Badge>
                            {(candidate.segments || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {candidate.segments.slice(0, 3).map((seg: string) => (
                                  <Badge key={seg} className="bg-teal-50 text-teal-800 border border-teal-100 hover:bg-teal-100 text-[10px] px-1.5 py-0">{segmentLabel(seg)}</Badge>
                                ))}
                                {candidate.segments.length > 3 && (
                                  <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] px-1.5 py-0">+{candidate.segments.length - 3}</Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            {getStatusBadge(candidate.callStatus)}
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Briefcase className="h-3 w-3" /> {candidate.workStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {candidate.assignedToName !== 'Unassigned' && (
                              <div className="w-6 h-6 rounded-full bg-[#006E6D] text-white flex items-center justify-center text-[10px] font-bold">
                                {getInitials(candidate.assignedToName)}
                              </div>
                            )}
                            <span className={`font-medium ${candidate.assignedToName === 'Unassigned' ? 'text-amber-500' : 'text-slate-700'}`}>
                              {candidate.assignedToName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[170px]">
                          <p className="text-slate-600 truncate" title={candidate.remarks}>
                            {candidate.remarks || <span className="text-slate-400 italic">No remarks yet</span>}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-end">
                          {/* Quick actions requested by the CRM team: the daily
                              loop is call, message, note. Each is disabled when
                              the underlying detail is missing, so a dead link is
                              never offered as though it would work. */}
                          <div className="flex items-center justify-end gap-1 mb-1">
                            {(() => {
                              const digits = String(candidate.phone || '').replace(/\D/g, '');
                              const intl = digits ? (digits.startsWith('971') ? digits : `971${digits.replace(/^0+/, '')}`) : '';
                              return (
                                <>
                                  <a href={digits ? `tel:+${intl}` : undefined}
                                     title={digits ? t('Call', 'اتصال') : t('No phone number on record', 'لا يوجد رقم هاتف')}
                                     aria-label={t('Call', 'اتصال')}
                                     className={`p-1.5 rounded-md ${digits ? 'text-[#006E6D] hover:bg-[#F0F7F7]' : 'text-slate-300 pointer-events-none'}`}>
                                    <Phone className="h-4 w-4" />
                                  </a>
                                  <a href={digits ? `https://wa.me/${intl}` : undefined}
                                     target="_blank" rel="noopener noreferrer"
                                     title={digits ? t('WhatsApp', 'واتساب') : t('No phone number on record', 'لا يوجد رقم هاتف')}
                                     aria-label="WhatsApp"
                                     className={`p-1.5 rounded-md ${digits ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 pointer-events-none'}`}>
                                    <MessageCircle className="h-4 w-4" />
                                  </a>
                                  <a href={digits ? `sms:+${intl}` : undefined}
                                     title={digits ? t('SMS', 'رسالة نصية') : t('No phone number on record', 'لا يوجد رقم هاتف')}
                                     aria-label="SMS"
                                     className={`p-1.5 rounded-md ${digits ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 pointer-events-none'}`}>
                                    <MessageSquare className="h-4 w-4" />
                                  </a>
                                  <a href={candidate.email ? `mailto:${candidate.email}` : undefined}
                                     title={candidate.email || t('No email on record', 'لا يوجد بريد إلكتروني')}
                                     aria-label={t('Email', 'بريد إلكتروني')}
                                     className={`p-1.5 rounded-md ${candidate.email ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 pointer-events-none'}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                  <button
                                    onClick={() => { setQuickRemarkFor(candidate); setQuickRemark(candidate.remarks || ''); }}
                                    title={t('Add a remark', 'إضافة ملاحظة')}
                                    aria-label={t('Add a remark', 'إضافة ملاحظة')}
                                    className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100">
                                    <StickyNote className="h-4 w-4" />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleEditClick(candidate)} 
                            className="bg-white text-[#006E6D] border border-[#006E6D]/20 hover:bg-[#F0F7F7] shadow-sm rounded-lg transition-opacity"
                          >
                            {t('Edit Details', 'تعديل التفاصيل')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && filteredCandidates.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {t('Showing', 'عرض')} <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> {t('to', 'إلى')} <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredCandidates.length)}</span> {t('of', 'من')} <span className="font-medium text-slate-900">{filteredCandidates.length}</span> {t('candidates', 'مرشحين')}
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                      // Simple pagination display logic
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-8 w-8 rounded-lg ${currentPage === pageNum ? 'bg-[#006E6D] hover:bg-[#005A59] text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </>
        )}
      </main>

      {/* Quick remark — the CRM team wanted to note a call outcome without
          opening the full record and losing their place in the list. */}
      <Dialog open={!!quickRemarkFor} onOpenChange={(o) => { if (!o) { setQuickRemarkFor(null); setQuickRemark(''); } }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{t('Add a remark', 'إضافة ملاحظة')}</DialogTitle>
            <DialogDescription>
              {quickRemarkFor?.name}
              {quickRemarkFor?.phone ? ` · ${quickRemarkFor.phone}` : ''}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={quickRemark}
            onChange={(e) => setQuickRemark(e.target.value)}
            placeholder={t('What came out of the call?', 'ما نتيجة المكالمة؟')}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setQuickRemarkFor(null); setQuickRemark(''); }}>
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button onClick={saveQuickRemark} disabled={savingQuickRemark || !quickRemark.trim()} className="gap-2">
              {savingQuickRemark && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('Save remark', 'حفظ الملاحظة')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide-out Edit Drawer */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        {/* Was sm:max-w-md — a narrow strip that could not show a counselling
            record, which is what prompted the full-page request
            (fb_1785994462). Now takes most of the screen on a desktop and
            lays the fields out in columns, while still closing back to the
            list with the agent's place and filters intact. */}
        <SheetContent side={isRTL ? 'left' : 'right'} className="w-full sm:max-w-4xl lg:max-w-5xl p-0 flex flex-col bg-white border-none shadow-2xl">
          <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/80">
            <SheetHeader className="text-start space-y-1">
              <SheetTitle className="text-xl font-bold text-slate-900">{t('Edit Candidate', 'تعديل بيانات المرشح')}</SheetTitle>
              <SheetDescription className="text-slate-500">
                {t('Update the counseling status and internal remarks for this candidate.', 'قم بتحديث حالة التوجيه والملاحظات الداخلية لهذا المرشح.')}
              </SheetDescription>
            </SheetHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {editingCandidate && (
              <div className="space-y-6">
                {/* Profile Summary Card */}
                <div className="bg-[#F0F7F7] rounded-xl p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-teal-600 text-white font-bold text-lg">
                      {getInitials(editingCandidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-slate-900">{editingCandidate.name}</h4>
                    <p className="text-sm font-mono text-teal-800">{editingCandidate.eid}</p>
                  </div>
                </div>

                {/* Counselling record — the fields the team fills in on a
                    call (fb_1786009859). Two columns because the panel is now
                    wide enough; every one is optional, since a record is built
                    up over several calls. */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">{t('Counselling record', 'سجل التوجيه')}</h4>
                    {editingCandidate.dateOfCall && (
                      <span className="text-xs text-slate-500">
                        {t('Last saved', 'آخر حفظ')}{' '}
                        {new Date(editingCandidate.dateOfCall).toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB',
                          { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {([
                      ['educationLevel', t('Education', 'التعليم'),
                        ['Below High School','High School','Diploma','High Diploma',"Bachelor's Degree",'Master Degree','Doctorate']],
                      ['isStudent', t('Currently studying', 'يدرس حالياً'), ['yes','no']],
                      ['specialization', t('Specialization', 'التخصص'),
                        ['Below High School','High School','Business and Management','Technology','Healthcare','Education','Engineering','Arts and Humanities','Sciences','Legal and Compliance']],
                      ['militaryStatus', t('Military status', 'الخدمة الوطنية'),
                        ['completed','not_yet_joined','exempted','in_service','not_required']],
                      ['englishLevel', t('English level', 'مستوى الإنجليزية'), ['Weak','Average','Excellent']],
                      ['fieldPreference', t('Field preference', 'تفضيل المجال'),
                        ['same_field','different_field','any_field']],
                    ] as [string, string, string[]][]).map(([key, label, opts]) => (
                      <div className="space-y-2" key={key}>
                        <label className="text-sm font-semibold text-slate-700">{label}</label>
                        <Select
                          value={editForm[key] || ''}
                          onValueChange={(val) => setEditForm({ ...editForm, [key]: val })}
                        >
                          <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11">
                            <SelectValue placeholder={t('Not recorded', 'غير مسجّل')} />
                          </SelectTrigger>
                          <SelectContent>
                            {opts.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    {([
                      ['subSpecialization', t('Sub specialization', 'التخصص الفرعي')],
                      ['gpa', t('GPA', 'المعدل')],
                      ['graduationDate', t('Graduation date', 'تاريخ التخرج')],
                      ['previousWorkLocation', t('Previous work location', 'مكان العمل السابق')],
                      ['experienceDuration', t('Experience duration', 'مدة الخبرة')],
                      ['jobSearchDuration', t('How long looking for work', 'مدة البحث عن عمل')],
                      ['salaryExpectations', t('Salary expectations', 'الراتب المتوقع')],
                      ['candidatesSource', t('Candidate source', 'مصدر المرشح')],
                    ] as [string, string][]).map(([key, label]) => (
                      <div className="space-y-2" key={key}>
                        <label className="text-sm font-semibold text-slate-700">{label}</label>
                        <Input
                          value={editForm[key] || ''}
                          onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                          placeholder={t('Not recorded', 'غير مسجّل')}
                          className="bg-slate-50 border-slate-200 rounded-xl h-11"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Call Status', 'حالة الاتصال')}</label>
                    <Select 
                      value={editForm.callStatus} 
                      onValueChange={(val) => setEditForm({...editForm, callStatus: val})}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Answered">Answered</SelectItem>
                        <SelectItem value="No Answer">No Answer</SelectItem>
                        <SelectItem value="No Number">No Number</SelectItem>
                        <SelectItem value="Not Reachable">Not Reachable</SelectItem>
                        <SelectItem value="Call Back">Call Back</SelectItem>
                        <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                        <SelectItem value="Switched Off">Switched Off</SelectItem>
                        <SelectItem value="Invalid Number">Invalid Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Work Status', 'حالة العمل')}</label>
                    <Select 
                      value={editForm.workStatus} 
                      onValueChange={(val) => setEditForm({...editForm, workStatus: val})}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11">
                        <SelectValue placeholder="Select Work Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Working">Working</SelectItem>
                        <SelectItem value="Not Working">Not Working</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Assigned To', 'معين إلى')}</label>
                    <Select 
                      value={editForm.assignedTo} 
                      onValueChange={(val) => setEditForm({...editForm, assignedTo: val})}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11">
                        <SelectValue placeholder="Select Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unassigned">Unassigned</SelectItem>
                        {/* Value is the operator's user id — names as values broke
                            the agent caseload scoping, which matches assigned_to
                            against the JWT identity (an id). */}
                        {operators.map((op) => (
                          <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Looking for Work', 'يبحث عن عمل')}</label>
                    <Select
                      value={editForm.lookingStatus || 'none'}
                      onValueChange={(val) => setEditForm({...editForm, lookingStatus: val})}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11">
                        <SelectValue placeholder={t('Select', 'اختر')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('Not set', 'غير محدد')}</SelectItem>
                        <SelectItem value="Looking For Work">Looking For Work</SelectItem>
                        <SelectItem value="Not Looking For Work">Not Looking For Work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('CV Status', 'حالة السيرة الذاتية')}</label>
                    <Input
                      value={editForm.cvStatus || ''}
                      onChange={(e) => setEditForm({...editForm, cvStatus: e.target.value})}
                      placeholder={t('e.g. Received updated CV', 'مثال: تم استلام سيرة محدثة')}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>

                  {/* New Counseling Fields */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Preferred Locations', 'مواقع العمل المفضلة')}</label>
                    <Input 
                      value={(editForm.preferredLocations || []).join(', ')} 
                      onChange={(e) => setEditForm({...editForm, preferredLocations: e.target.value.split(',').map(s => s.trim())})} 
                      placeholder="Dubai, Abu Dhabi"
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Preferred Sector', 'القطاع المفضل')}</label>
                    <Select value={editForm.preferredSector} onValueChange={(val) => setEditForm({...editForm, preferredSector: val})}>
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11"><SelectValue placeholder="Select Sector" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Gov">Government</SelectItem>
                        <SelectItem value="Semi-Gov">Semi-Government</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Schools">Schools</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t('Work Setup', 'نظام العمل')}</label>
                      <Select value={editForm.preferredWorkSetup} onValueChange={(val) => setEditForm({...editForm, preferredWorkSetup: val})}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11"><SelectValue placeholder="Select Setup" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="On-Site">On-Site</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                          <SelectItem value="Remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t('Schedule', 'الجدول')}</label>
                      <Select value={editForm.preferredSchedule} onValueChange={(val) => setEditForm({...editForm, preferredSchedule: val})}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11"><SelectValue placeholder="Select Schedule" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Full-Time">Full-Time</SelectItem>
                          <SelectItem value="Part-Time">Part-Time</SelectItem>
                          <SelectItem value="Shift-Based">Shift-Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Role Preferences', 'الأدوار المفضلة')}</label>
                    <Input value={editForm.rolePreferences || ''} onChange={(e) => setEditForm({...editForm, rolePreferences: e.target.value})} placeholder="e.g. Admin, IT, HR" className="bg-slate-50 border-slate-200 rounded-xl h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t('Alternative Phone', 'هاتف بديل')}</label>
                      <Input value={editForm.alternativePhone || ''} onChange={(e) => setEditForm({...editForm, alternativePhone: e.target.value})} placeholder="e.g. 971500000000" className="bg-slate-50 border-slate-200 rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t('Unavailability Reason', 'سبب عدم التوفر')}</label>
                      <Select value={editForm.unavailabilityReason} onValueChange={(val) => setEditForm({...editForm, unavailabilityReason: val})}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11"><SelectValue placeholder="Select Reason" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Studying">Studying</SelectItem>
                          <SelectItem value="Medical Leave">Medical Leave</SelectItem>
                          <SelectItem value="Invalid Number">Invalid Number</SelectItem>
                          <SelectItem value="Opt-Out">Opt-Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Internal Remarks', 'ملاحظات داخلية')}</label>
                    <Textarea 
                      value={editForm.remarks}
                      onChange={(e) => setEditForm({...editForm, remarks: e.target.value})}
                      placeholder="Add detailed notes about the counseling session..."
                      className="min-h-[120px] bg-slate-50 border-slate-200 rounded-xl resize-none focus-visible:ring-[#006E6D]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-white">
            <SheetFooter className="flex-row sm:justify-between w-full gap-3 sm:space-x-0">
              <Button 
                variant="outline" 
                onClick={() => setIsSheetOpen(false)}
                className="w-full sm:w-1/2 rounded-xl border-slate-200 hover:bg-slate-50 h-11"
              >
                {t('Cancel', 'إلغاء')}
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full sm:w-1/2 rounded-xl bg-[#006E6D] hover:bg-[#005A59] text-white shadow-md h-11"
              >
                {isSaving ? <Loader2 className="h-5 w-5 me-2 animate-spin" /> : <Save className="h-5 w-5 me-2" />}
                {t('Save Changes', 'حفظ التغييرات')}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
